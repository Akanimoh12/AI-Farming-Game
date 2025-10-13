// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./interfaces/IGameToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILandNFT {
    function getCapacity(uint256 tokenId) external view returns (uint8);
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title BotNFT
 * @notice ERC-721 NFT contract for Orange Farm AI farming bots
 * @dev Implements three bot types with assignment and upgrade mechanisms
 */
contract BotNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Bot types with different performance characteristics
    enum BotType {
        Basic,      // 10 oranges/cycle, 1 water/cycle
        Advanced,   // 25 oranges/cycle, 2 water/cycle
        Elite       // 50 oranges/cycle, 4 water/cycle
    }

    /// @notice Bot data structure
    struct BotData {
        BotType botType;
        uint16 harvestRate;
        uint8 waterConsumption;
        uint256 assignedLandId;
        bool isActive;
        uint64 totalHarvests;
        uint64 creationTimestamp;
    }

    /// @notice Base URI for IPFS metadata
    string private _baseTokenURI;

    /// @notice Token ID counter
    uint256 private _nextTokenId;

    /// @notice Mapping from token ID to bot data
    mapping(uint256 => BotData) public botData;

    /// @notice Mapping from land ID to array of assigned bot IDs
    mapping(uint256 => uint256[]) private _landBots;

    /// @notice Reference to MockOrangeToken contract
    address public mockOrangeToken;

    /// @notice Reference to LandNFT contract
    address public landNFT;

    /// @notice Upgrade costs for bot types (in MockOrangeDAO tokens)
    mapping(BotType => uint256) public upgradeCosts;

    /// @notice Events
    event BotMinted(
        address indexed owner,
        uint256 indexed tokenId,
        BotType botType,
        uint16 harvestRate,
        uint8 waterConsumption
    );

    event BotAssigned(
        uint256 indexed botId,
        uint256 indexed landId,
        address indexed owner
    );

    event BotUnassigned(
        uint256 indexed botId,
        uint256 indexed landId
    );

    event BotUpgraded(
        uint256 indexed botId,
        BotType oldType,
        BotType newType,
        uint16 newHarvestRate,
        uint8 newWaterConsumption
    );

    event BotActivated(uint256 indexed botId);
    event BotDeactivated(uint256 indexed botId);
    event BaseURIUpdated(string newBaseURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param admin Address of the admin
     * @param baseURI IPFS base URI for metadata
     * @param _mockOrangeToken Address of MockOrangeToken contract
     * @param _landNFT Address of LandNFT contract
     */
    function initialize(
        address admin,
        string memory baseURI,
        address _mockOrangeToken,
        address _landNFT
    ) public initializer {
        require(admin != address(0), "BotNFT: admin is zero address");
        require(_mockOrangeToken != address(0), "BotNFT: token is zero address");
        require(_landNFT != address(0), "BotNFT: land is zero address");

        __ERC721_init("Orange Farm Bot", "BOT");
        __ERC721URIStorage_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        _baseTokenURI = baseURI;
        mockOrangeToken = _mockOrangeToken;
        landNFT = _landNFT;
        _nextTokenId = 1; // Start from token ID 1

        // Set upgrade costs (price difference between types)
        upgradeCosts[BotType.Advanced] = 15e18; // Basic to Advanced
        upgradeCosts[BotType.Elite] = 25e18;    // Advanced to Elite
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
        (uint16 harvestRate, uint8 waterConsumption) = _getBotStats(botType);

        _safeMint(to, tokenId);

        botData[tokenId] = BotData({
            botType: botType,
            harvestRate: harvestRate,
            waterConsumption: waterConsumption,
            assignedLandId: 0,
            isActive: false,
            totalHarvests: 0,
            creationTimestamp: uint64(block.timestamp)
        });

        emit BotMinted(to, tokenId, botType, harvestRate, waterConsumption);

        return tokenId;
    }

    /**
     * @notice Assign bot to a land plot
     * @param botId Bot token ID
     * @param landId Land token ID
     */
    function assignToLand(uint256 botId, uint256 landId) external whenNotPaused {
        require(ownerOf(botId) == msg.sender, "BotNFT: not bot owner");
        require(
            ILandNFT(landNFT).ownerOf(landId) == msg.sender,
            "BotNFT: not land owner"
        );

        BotData storage bot = botData[botId];
        require(bot.assignedLandId == 0, "BotNFT: bot already assigned");

        // Check land capacity
        uint8 landCapacity = ILandNFT(landNFT).getCapacity(landId);
        uint256 currentBots = _landBots[landId].length;
        require(currentBots < landCapacity, "BotNFT: land at capacity");

        // Assign bot
        bot.assignedLandId = landId;
        bot.isActive = true;
        _landBots[landId].push(botId);

        emit BotAssigned(botId, landId, msg.sender);
        emit BotActivated(botId);
    }

    /**
     * @notice Unassign bot from land
     * @param botId Bot token ID
     */
    function unassignBot(uint256 botId) external whenNotPaused {
        require(ownerOf(botId) == msg.sender, "BotNFT: not bot owner");

        BotData storage bot = botData[botId];
        require(bot.assignedLandId != 0, "BotNFT: bot not assigned");

        uint256 landId = bot.assignedLandId;

        // Remove bot from land's bot array
        _removeBotFromLand(botId, landId);

        // Update bot state
        bot.assignedLandId = 0;
        bot.isActive = false;

        emit BotUnassigned(botId, landId);
        emit BotDeactivated(botId);
    }

    /**
     * @notice Upgrade bot to next tier
     * @param botId Bot token ID
     */
    function upgradeBot(uint256 botId) external whenNotPaused {
        require(ownerOf(botId) == msg.sender, "BotNFT: not bot owner");

        BotData storage bot = botData[botId];
        require(bot.botType != BotType.Elite, "BotNFT: already max tier");

        BotType oldType = bot.botType;
        BotType newType = BotType(uint8(oldType) + 1);

        // Transfer upgrade cost
        uint256 cost = upgradeCosts[newType];
        require(
            IERC20(mockOrangeToken).transferFrom(msg.sender, address(this), cost),
            "BotNFT: payment failed"
        );

        // Update bot stats
        bot.botType = newType;
        (bot.harvestRate, bot.waterConsumption) = _getBotStats(newType);

        emit BotUpgraded(botId, oldType, newType, bot.harvestRate, bot.waterConsumption);
    }

    /**
     * @notice Increment harvest count for a bot
     * @param botId Bot token ID
     */
    function incrementHarvests(uint256 botId) external onlyRole(MINTER_ROLE) {
        require(ownerOf(botId) != address(0), "BotNFT: bot does not exist");
        botData[botId].totalHarvests += 1;
    }

    /**
     * @notice Get bots assigned to a land
     * @param landId Land token ID
     * @return Array of bot token IDs
     */
    function getBotsOnLand(uint256 landId) external view returns (uint256[] memory) {
        return _landBots[landId];
    }

    /**
     * @notice Get complete bot data
     * @param tokenId Token ID to query
     * @return Bot data structure
     */
    function getBotData(uint256 tokenId) external view returns (BotData memory) {
        require(ownerOf(tokenId) != address(0), "BotNFT: token does not exist");
        return botData[tokenId];
    }

    /**
     * @notice Get bot stats for a type
     * @param botType Type of bot
     * @return harvestRate Oranges per harvest cycle
     * @return waterConsumption Water consumed per cycle
     */
    function _getBotStats(BotType botType) private pure returns (uint16, uint8) {
        if (botType == BotType.Basic) return (10, 1);
        if (botType == BotType.Advanced) return (25, 2);
        if (botType == BotType.Elite) return (50, 4);
        revert("BotNFT: invalid bot type");
    }

    /**
     * @notice Remove bot from land's bot array
     * @param botId Bot to remove
     * @param landId Land to remove from
     */
    function _removeBotFromLand(uint256 botId, uint256 landId) private {
        uint256[] storage bots = _landBots[landId];
        for (uint256 i = 0; i < bots.length; i++) {
            if (bots[i] == botId) {
                bots[i] = bots[bots.length - 1];
                bots.pop();
                break;
            }
        }
    }

    /**
     * @notice Update base URI
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Update upgrade cost for a bot type
     * @param botType Bot type to update
     * @param cost New cost
     */
    function setUpgradeCost(
        BotType botType,
        uint256 cost
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(botType != BotType.Basic, "BotNFT: cannot set cost for basic");
        require(cost > 0, "BotNFT: invalid cost");
        upgradeCosts[botType] = cost;
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

    /**
     * @notice Get base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Override for UUPS upgrades
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @notice Override tokenURI to return proper metadata URI
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Override supportsInterface
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Storage gap for future upgrades
     */
    uint256[50] private __gap;
}
