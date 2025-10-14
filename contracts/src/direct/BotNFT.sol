// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BotNFT
 * @notice ERC-721 NFT contract for Orange Farm harvesting bots
 * @dev Direct deployment (non-upgradeable) version with three bot types
 */
contract BotNFT is ERC721, ERC721URIStorage, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    enum BotType {
        Basic,
        Advanced,
        Elite
    }

    struct BotData {
        BotType botType;
        uint16 efficiency;
        uint32 totalHarvests;
        uint64 creationTimestamp;
        uint256 assignedLandId;
    }

    string private _baseTokenURI;
    uint256 private _nextTokenId;
    mapping(uint256 => BotData) public botData;
    mapping(address => uint256[]) private _ownerBots;
    address public mockOrangeToken;
    address public landNFT;

    event BotMinted(address indexed owner, uint256 indexed tokenId, BotType botType, uint16 efficiency);
    event BotUpgraded(uint256 indexed tokenId, BotType newType, uint16 newEfficiency);
    event BotAssigned(uint256 indexed botId, uint256 indexed landId);
    event BotUnassigned(uint256 indexed botId);
    event BaseURIUpdated(string newBaseURI);

    /**
     * @notice Constructor - initializes the contract immediately
     * @param admin Address of the admin
     * @param baseURI IPFS base URI for metadata
     * @param _mockOrangeToken Address of MockOrangeToken contract
     * @param _landNFT Address of LandNFT contract
     */
    constructor(
        address admin,
        string memory baseURI,
        address _mockOrangeToken,
        address _landNFT
    ) ERC721("Orange Farm Bot", "BOT") {
        require(admin != address(0), "BotNFT: admin is zero address");
        require(_mockOrangeToken != address(0), "BotNFT: token is zero address");
        require(_landNFT != address(0), "BotNFT: landNFT is zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        _baseTokenURI = baseURI;
        mockOrangeToken = _mockOrangeToken;
        landNFT = _landNFT;
        _nextTokenId = 1; // Start from token ID 1
    }

    /**
     * @notice Mint a new bot
     * @param to Address to mint to
     * @param botType Type of bot to mint
     * @return tokenId The minted token ID
     */
    function mint(
        address to,
        BotType botType
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "BotNFT: mint to zero address");
        require(uint8(botType) <= uint8(BotType.Elite), "BotNFT: invalid bot type");

        uint256 tokenId = _nextTokenId++;
        uint16 efficiency = _getBaseEfficiency(botType);

        _safeMint(to, tokenId);

        botData[tokenId] = BotData({
            botType: botType,
            efficiency: efficiency,
            totalHarvests: 0,
            creationTimestamp: uint64(block.timestamp),
            assignedLandId: 0
        });

        emit BotMinted(to, tokenId, botType, efficiency);

        return tokenId;
    }

    /**
     * @notice Assign bot to land
     * @param botId Bot token ID
     * @param landId Land token ID
     */
    function assignBotToLand(uint256 botId, uint256 landId) external {
        require(ownerOf(botId) == msg.sender, "BotNFT: not bot owner");
        require(botData[botId].assignedLandId == 0, "BotNFT: bot already assigned");
        
        botData[botId].assignedLandId = landId;
        emit BotAssigned(botId, landId);
    }

    /**
     * @notice Unassign bot from land
     * @param botId Bot token ID
     */
    function unassignBotFromLand(uint256 botId) external {
        require(ownerOf(botId) == msg.sender, "BotNFT: not bot owner");
        require(botData[botId].assignedLandId != 0, "BotNFT: bot not assigned");
        
        botData[botId].assignedLandId = 0;
        emit BotUnassigned(botId);
    }

    /**
     * @notice Increment harvest count (called by game contracts)
     * @param botId Bot token ID
     */
    function incrementHarvests(uint256 botId) external onlyRole(MINTER_ROLE) {
        require(_ownerOf(botId) != address(0), "BotNFT: bot doesn't exist");
        botData[botId].totalHarvests++;
    }

    /**
     * @notice Upgrade bot to next type
     * @param botId Bot token ID
     */
    function upgradeBot(uint256 botId) external whenNotPaused {
        require(ownerOf(botId) == msg.sender, "BotNFT: not bot owner");
        
        BotData storage bot = botData[botId];
        require(bot.botType != BotType.Elite, "BotNFT: already max level");

        uint256 upgradeCost = _getUpgradeCost(bot.botType);
        IERC20(mockOrangeToken).transferFrom(msg.sender, address(this), upgradeCost);

        // Upgrade bot
        if (bot.botType == BotType.Basic) {
            bot.botType = BotType.Advanced;
        } else {
            bot.botType = BotType.Elite;
        }
        
        bot.efficiency = _getBaseEfficiency(bot.botType);
        
        emit BotUpgraded(botId, bot.botType, bot.efficiency);
    }

    /**
     * @notice Update base URI for metadata
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ VIEW FUNCTIONS ============

    function getBotData(uint256 tokenId) external view returns (BotData memory) {
        require(_ownerOf(tokenId) != address(0), "BotNFT: bot doesn't exist");
        return botData[tokenId];
    }

    function getOwnerBots(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokens;
    }

    function getUpgradeCost(uint256 botId) external view returns (uint256) {
        require(_ownerOf(botId) != address(0), "BotNFT: bot doesn't exist");
        return _getUpgradeCost(botData[botId].botType);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ============ INTERNAL FUNCTIONS ============

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _getBaseEfficiency(BotType botType) internal pure returns (uint16) {
        if (botType == BotType.Basic) return 100; // 100% efficiency
        if (botType == BotType.Advanced) return 150; // 150% efficiency
        return 200; // 200% efficiency (Elite)
    }

    function _getUpgradeCost(BotType currentType) internal pure returns (uint256) {
        if (currentType == BotType.Basic) return 100 ether; // 100 tokens
        if (currentType == BotType.Advanced) return 250 ether; // 250 tokens
        revert("BotNFT: cannot upgrade Elite");
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "BotNFT: owner index out of bounds");
        
        uint256 count = 0;
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_ownerOf(i) == owner) {
                if (count == index) {
                    return i;
                }
                count++;
            }
        }
        
        revert("BotNFT: owner index out of bounds");
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
}
