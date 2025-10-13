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

/**
 * @title LandNFT
 * @notice ERC-721 NFT contract for Orange Farm land plots
 * @dev Implements three land types with dynamic capacity expansion
 */
contract LandNFT is
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Land types with different base capacities
    enum LandType {
        Small,   // 2 bots
        Medium,  // 5 bots
        Large    // 10 bots
    }

    /// @notice Land plot data structure
    struct LandData {
        LandType landType;
        uint8 capacity;
        uint8 expansions;
        uint64 creationTimestamp;
    }

    /// @notice Base URI for IPFS metadata
    string private _baseTokenURI;

    /// @notice Token ID counter
    uint256 private _nextTokenId;

    /// @notice Mapping from token ID to land data
    mapping(uint256 => LandData) public landData;

    /// @notice Cost to expand land capacity by 1 bot slot (in MockOrangeDAO tokens)
    uint256 public expansionCost;

    /// @notice Reference to MockOrangeToken contract
    address public mockOrangeToken;

    /// @notice Events
    event LandMinted(
        address indexed owner,
        uint256 indexed tokenId,
        LandType landType,
        uint8 capacity
    );

    event LandExpanded(
        uint256 indexed tokenId,
        uint8 newCapacity,
        uint8 expansionCount
    );

    event BaseURIUpdated(string newBaseURI);

    event ExpansionCostUpdated(uint256 newCost);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param admin Address of the admin
     * @param baseURI IPFS base URI for metadata
     * @param _mockOrangeToken Address of MockOrangeToken contract
     * @param _expansionCost Cost to expand land capacity
     */
    function initialize(
        address admin,
        string memory baseURI,
        address _mockOrangeToken,
        uint256 _expansionCost
    ) public initializer {
        require(admin != address(0), "LandNFT: admin is zero address");
        require(_mockOrangeToken != address(0), "LandNFT: token is zero address");

        __ERC721_init("Orange Farm Land", "LAND");
        __ERC721URIStorage_init();
        __AccessControl_init();
        __Pausable_init();

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
     * @notice Expand land capacity by 1 bot slot
     * @param tokenId Token ID to expand
     */
    function expandCapacity(uint256 tokenId) external whenNotPaused {
        require(ownerOf(tokenId) == msg.sender, "LandNFT: not land owner");
        
        LandData storage land = landData[tokenId];
        
        // Transfer expansion cost from user
        require(
            IERC20(mockOrangeToken).transferFrom(msg.sender, address(this), expansionCost),
            "LandNFT: payment failed"
        );

        // Increase capacity
        land.capacity += 1;
        land.expansions += 1;

        emit LandExpanded(tokenId, land.capacity, land.expansions);
    }

    /**
     * @notice Get land capacity
     * @param tokenId Token ID to query
     * @return Current capacity
     */
    function getCapacity(uint256 tokenId) external view returns (uint8) {
        require(ownerOf(tokenId) != address(0), "LandNFT: token does not exist");
        return landData[tokenId].capacity;
    }

    /**
     * @notice Get complete land data
     * @param tokenId Token ID to query
     * @return Land data structure
     */
    function getLandData(uint256 tokenId) external view returns (LandData memory) {
        require(ownerOf(tokenId) != address(0), "LandNFT: token does not exist");
        return landData[tokenId];
    }

    /**
     * @notice Get base capacity for land type
     * @param landType Type of land
     * @return Base capacity
     */
    function _getBaseCapacity(LandType landType) private pure returns (uint8) {
        if (landType == LandType.Small) return 2;
        if (landType == LandType.Medium) return 5;
        if (landType == LandType.Large) return 10;
        revert("LandNFT: invalid land type");
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
     * @notice Update expansion cost
     * @param newCost New expansion cost in MockOrangeDAO tokens
     */
    function setExpansionCost(uint256 newCost) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newCost > 0, "LandNFT: invalid cost");
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
