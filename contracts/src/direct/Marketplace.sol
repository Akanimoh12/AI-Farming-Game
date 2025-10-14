// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Contract interfaces
interface ILandNFTMarket {
    enum LandType { Small, Medium, Large }
    function mint(address to, LandType landType) external returns (uint256);
}

interface IBotNFTMarket {
    enum BotType { Basic, Advanced, Elite }
    function mint(address to, BotType botType) external returns (uint256);
}

interface IWaterTokenMarket {
    function mint(address to, uint256 amount) external;
}

/**
 * @title Marketplace
 * @notice Central hub for all game asset purchases in Orange Farm
 * @dev Direct deployment (non-upgradeable) simplified version for MVP
 */
contract Marketplace is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant PRICE_MANAGER_ROLE = keccak256("PRICE_MANAGER_ROLE");

    // Asset types
    enum LandType { Small, Medium, Large }
    enum BotType { Basic, Advanced, Elite }
    enum WaterPackage { Pack10, Pack50, Pack100 }

    // Contract addresses
    address public mockOrangeToken;
    address public landNFT;
    address public botNFT;
    address public waterToken;
    address public treasury;

    // Pricing structure (in MockOrangeDAO tokens with 18 decimals)
    mapping(LandType => uint256) public landPrices;
    mapping(BotType => uint256) public botPrices;
    mapping(WaterPackage => uint256) public waterPrices;
    mapping(WaterPackage => uint256) public waterAmounts;

    // Statistics
    uint256 public totalPurchases;
    uint256 public totalRevenue;
    mapping(address => uint256) public userPurchases;
    mapping(address => uint256) public lastPurchaseTime;

    // Events
    event LandPurchased(address indexed buyer, LandType landType, uint256 tokenId, uint256 price);
    event BotPurchased(address indexed buyer, BotType botType, uint256 tokenId, uint256 price);
    event WaterPurchased(address indexed buyer, WaterPackage package, uint256 amount, uint256 price);
    event PriceUpdated(string assetType, uint256 indexed assetIndex, uint256 oldPrice, uint256 newPrice);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    /**
     * @notice Constructor - initializes the marketplace
     * @param admin Address of the admin
     * @param _mockOrangeToken Address of MockOrangeDAO token
     * @param _landNFT Address of LandNFT contract
     * @param _botNFT Address of BotNFT contract
     * @param _waterToken Address of WaterToken contract
     * @param _treasury Address to receive purchase payments
     */
    constructor(
        address admin,
        address _mockOrangeToken,
        address _landNFT,
        address _botNFT,
        address _waterToken,
        address _treasury
    ) {
        require(admin != address(0), "Marketplace: zero address for admin");
        require(_mockOrangeToken != address(0), "Marketplace: zero address for token");
        require(_landNFT != address(0), "Marketplace: zero address for land");
        require(_botNFT != address(0), "Marketplace: zero address for bot");
        require(_waterToken != address(0), "Marketplace: zero address for water");
        require(_treasury != address(0), "Marketplace: zero address for treasury");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(PRICE_MANAGER_ROLE, admin);

        mockOrangeToken = _mockOrangeToken;
        landNFT = _landNFT;
        botNFT = _botNFT;
        waterToken = _waterToken;
        treasury = _treasury;

        // Initialize pricing (prices in tokens with 18 decimals)
        landPrices[LandType.Small] = 100 ether;    // 100 tokens
        landPrices[LandType.Medium] = 250 ether;    // 250 tokens
        landPrices[LandType.Large] = 500 ether;     // 500 tokens

        botPrices[BotType.Basic] = 150 ether;       // 150 tokens
        botPrices[BotType.Advanced] = 400 ether;    // 400 tokens
        botPrices[BotType.Elite] = 800 ether;       // 800 tokens

        waterPrices[WaterPackage.Pack10] = 5 ether;    // 5 tokens for 10 water
        waterPrices[WaterPackage.Pack50] = 20 ether;   // 20 tokens for 50 water (20% discount)
        waterPrices[WaterPackage.Pack100] = 35 ether;  // 35 tokens for 100 water (30% discount)

        waterAmounts[WaterPackage.Pack10] = 10 ether;
        waterAmounts[WaterPackage.Pack50] = 50 ether;
        waterAmounts[WaterPackage.Pack100] = 100 ether;
    }

    /**
     * @notice Purchase land NFT
     * @param landType Type of land to purchase (0=Small, 1=Medium, 2=Large)
     * @return tokenId The minted land token ID
     */
    function buyLand(LandType landType) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (uint256 tokenId) 
    {
        uint256 price = landPrices[landType];
        require(price > 0, "Marketplace: invalid land type");

        // Transfer payment
        IERC20(mockOrangeToken).safeTransferFrom(msg.sender, treasury, price);

        // Mint land NFT
        tokenId = ILandNFTMarket(landNFT).mint(msg.sender, ILandNFTMarket.LandType(uint8(landType)));

        // Update statistics
        _updateStats(msg.sender, price);

        emit LandPurchased(msg.sender, landType, tokenId, price);
    }

    /**
     * @notice Purchase bot NFT
     * @param botType Type of bot to purchase (0=Basic, 1=Advanced, 2=Elite)
     * @return tokenId The minted bot token ID
     */
    function buyBot(BotType botType) 
        external 
        whenNotPaused 
        nonReentrant 
        returns (uint256 tokenId) 
    {
        uint256 price = botPrices[botType];
        require(price > 0, "Marketplace: invalid bot type");

        // Transfer payment
        IERC20(mockOrangeToken).safeTransferFrom(msg.sender, treasury, price);

        // Mint bot NFT
        tokenId = IBotNFTMarket(botNFT).mint(msg.sender, IBotNFTMarket.BotType(uint8(botType)));

        // Update statistics
        _updateStats(msg.sender, price);

        emit BotPurchased(msg.sender, botType, tokenId, price);
    }

    /**
     * @notice Purchase water tokens
     * @param package Water package to purchase (0=Pack10, 1=Pack50, 2=Pack100)
     */
    function buyWater(WaterPackage package) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        uint256 price = waterPrices[package];
        uint256 amount = waterAmounts[package];
        require(price > 0, "Marketplace: invalid water package");

        // Transfer payment
        IERC20(mockOrangeToken).safeTransferFrom(msg.sender, treasury, price);

        // Mint water tokens
        IWaterTokenMarket(waterToken).mint(msg.sender, amount);

        // Update statistics
        _updateStats(msg.sender, price);

        emit WaterPurchased(msg.sender, package, amount, price);
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Update land price
     */
    function setLandPrice(LandType landType, uint256 newPrice) 
        external 
        onlyRole(PRICE_MANAGER_ROLE) 
    {
        require(newPrice > 0, "Marketplace: price must be positive");
        uint256 oldPrice = landPrices[landType];
        landPrices[landType] = newPrice;
        emit PriceUpdated("Land", uint256(landType), oldPrice, newPrice);
    }

    /**
     * @notice Update bot price
     */
    function setBotPrice(BotType botType, uint256 newPrice) 
        external 
        onlyRole(PRICE_MANAGER_ROLE) 
    {
        require(newPrice > 0, "Marketplace: price must be positive");
        uint256 oldPrice = botPrices[botType];
        botPrices[botType] = newPrice;
        emit PriceUpdated("Bot", uint256(botType), oldPrice, newPrice);
    }

    /**
     * @notice Update water package price and amount
     */
    function setWaterPackage(WaterPackage package, uint256 newPrice, uint256 newAmount) 
        external 
        onlyRole(PRICE_MANAGER_ROLE) 
    {
        require(newPrice > 0, "Marketplace: price must be positive");
        require(newAmount > 0, "Marketplace: amount must be positive");
        
        uint256 oldPrice = waterPrices[package];
        waterPrices[package] = newPrice;
        waterAmounts[package] = newAmount;
        
        emit PriceUpdated("Water", uint256(package), oldPrice, newPrice);
    }

    /**
     * @notice Update treasury address
     */
    function setTreasury(address newTreasury) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newTreasury != address(0), "Marketplace: zero address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Pause marketplace
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause marketplace
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get all land prices
     */
    function getLandPrices() external view returns (uint256[3] memory prices) {
        prices[0] = landPrices[LandType.Small];
        prices[1] = landPrices[LandType.Medium];
        prices[2] = landPrices[LandType.Large];
    }

    /**
     * @notice Get all bot prices
     */
    function getBotPrices() external view returns (uint256[3] memory prices) {
        prices[0] = botPrices[BotType.Basic];
        prices[1] = botPrices[BotType.Advanced];
        prices[2] = botPrices[BotType.Elite];
    }

    /**
     * @notice Get all water package info
     */
    function getWaterPackages() external view returns (
        uint256[3] memory prices,
        uint256[3] memory amounts
    ) {
        prices[0] = waterPrices[WaterPackage.Pack10];
        prices[1] = waterPrices[WaterPackage.Pack50];
        prices[2] = waterPrices[WaterPackage.Pack100];
        
        amounts[0] = waterAmounts[WaterPackage.Pack10];
        amounts[1] = waterAmounts[WaterPackage.Pack50];
        amounts[2] = waterAmounts[WaterPackage.Pack100];
    }

    /**
     * @notice Get user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 purchases,
        uint256 lastPurchase
    ) {
        purchases = userPurchases[user];
        lastPurchase = lastPurchaseTime[user];
    }

    // ============ INTERNAL FUNCTIONS ============

    function _updateStats(address buyer, uint256 amount) internal {
        totalPurchases++;
        totalRevenue += amount;
        userPurchases[buyer]++;
        lastPurchaseTime[buyer] = block.timestamp;
    }
}
