// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LandNFT
 * @notice ERC-721 NFT contract for Orange Farm land plots
 * @dev Direct deployment (non-upgradeable) version with three land types
 */
contract LandNFT is ERC721, ERC721URIStorage, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    enum LandType {
        Small,
        Medium,
        Large
    }

    struct LandData {
        LandType landType;
        uint8 capacity;
        uint8 expansions;
        uint64 creationTimestamp;
    }

    string private _baseTokenURI;
    uint256 private _nextTokenId;
    mapping(uint256 => LandData) public landData;
    mapping(address => uint256[]) private _ownerLands;
    mapping(uint256 => uint256[]) private _landAssignedBots;
    uint256 public expansionCost;
    address public mockOrangeToken;

    event LandMinted(address indexed owner, uint256 indexed tokenId, LandType landType, uint8 capacity);
    event LandExpanded(uint256 indexed tokenId, uint8 newCapacity, uint8 expansionCount);
    event BaseURIUpdated(string newBaseURI);
    event ExpansionCostUpdated(uint256 newCost);

    /**
     * @notice Constructor - initializes the contract immediately
     * @param admin Address of the admin
     * @param baseURI IPFS base URI for metadata
     * @param _mockOrangeToken Address of MockOrangeToken contract
     * @param _expansionCost Cost to expand land capacity
     */
    constructor(
        address admin,
        string memory baseURI,
        address _mockOrangeToken,
        uint256 _expansionCost
    ) ERC721("Orange Farm Land", "LAND") {
        require(admin != address(0), "LandNFT: admin is zero address");
        require(_mockOrangeToken != address(0), "LandNFT: token is zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        _baseTokenURI = baseURI;
        mockOrangeToken = _mockOrangeToken;
        expansionCost = _expansionCost;
        _nextTokenId = 1; // Start from token ID 1
    }

    /**
     * @notice Mint a new land plot
     * @param to Address to mint to
     * @param landType Type of land to mint
     * @return tokenId The minted token ID
     */
    function mint(
        address to,
        LandType landType
    ) external onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "LandNFT: mint to zero address");
        require(uint8(landType) <= uint8(LandType.Large), "LandNFT: invalid land type");

        uint256 tokenId = _nextTokenId++;
        uint8 capacity = _getBaseCapacity(landType);

        _safeMint(to, tokenId);

        landData[tokenId] = LandData({
            landType: landType,
            capacity: capacity,
            expansions: 0,
            creationTimestamp: uint64(block.timestamp)
        });

        emit LandMinted(to, tokenId, landType, capacity);

        return tokenId;
    }

    /**
     * @notice Expand land capacity by paying tokens
     * @param tokenId Token ID to expand
     */
    function expandLand(uint256 tokenId) external whenNotPaused {
        require(ownerOf(tokenId) == msg.sender, "LandNFT: not owner");
        require(expansionCost > 0, "LandNFT: expansion not enabled");

        LandData storage land = landData[tokenId];
        require(land.expansions < 5, "LandNFT: max expansions reached");

        // Burn tokens for expansion
        IERC20(mockOrangeToken).transferFrom(msg.sender, address(this), expansionCost);
        
        land.capacity += 2; // Each expansion adds 2 capacity
        land.expansions++;

        emit LandExpanded(tokenId, land.capacity, land.expansions);
    }

    /**
     * @notice Add bot to land (called by owner or game contracts)
     * @param tokenId Land token ID
     * @param botId Bot token ID to assign
     */
    function addBotToLand(uint256 tokenId, uint256 botId) external {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "LandNFT: land doesn't exist");
        require(
            msg.sender == owner || hasRole(MINTER_ROLE, msg.sender),
            "LandNFT: not authorized"
        );
        require(
            _landAssignedBots[tokenId].length < landData[tokenId].capacity,
            "LandNFT: land at capacity"
        );
        
        _landAssignedBots[tokenId].push(botId);
    }

    /**
     * @notice Remove bot from land (called by owner or game contracts)
     * @param tokenId Land token ID
     * @param botId Bot token ID to remove
     */
    function removeBotFromLand(uint256 tokenId, uint256 botId) external {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "LandNFT: land doesn't exist");
        require(
            msg.sender == owner || hasRole(MINTER_ROLE, msg.sender),
            "LandNFT: not authorized"
        );
        
        uint256[] storage bots = _landAssignedBots[tokenId];
        
        for (uint256 i = 0; i < bots.length; i++) {
            if (bots[i] == botId) {
                bots[i] = bots[bots.length - 1];
                bots.pop();
                return;
            }
        }
        
        revert("LandNFT: bot not found on land");
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
     * @notice Update expansion cost
     * @param newCost New expansion cost
     */
    function setExpansionCost(uint256 newCost) external onlyRole(DEFAULT_ADMIN_ROLE) {
        expansionCost = newCost;
        emit ExpansionCostUpdated(newCost);
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

    function getLandData(uint256 tokenId) external view returns (LandData memory) {
        require(_ownerOf(tokenId) != address(0), "LandNFT: land doesn't exist");
        return landData[tokenId];
    }

    function getAssignedBots(uint256 tokenId) external view returns (uint256[] memory) {
        return _landAssignedBots[tokenId];
    }

    function getOwnerLands(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokens;
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

    function _getBaseCapacity(LandType landType) internal pure returns (uint8) {
        if (landType == LandType.Small) return 3;
        if (landType == LandType.Medium) return 5;
        return 8; // Large
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "LandNFT: owner index out of bounds");
        
        uint256 count = 0;
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_ownerOf(i) == owner) {
                if (count == index) {
                    return i;
                }
                count++;
            }
        }
        
        revert("LandNFT: owner index out of bounds");
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
