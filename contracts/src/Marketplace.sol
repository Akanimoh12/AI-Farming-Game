// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Contract interfaces
interface ILandNFTMarket {
    function mint(address to, uint8 landType) external returns (uint256);
}

interface IBotNFTMarket {
    function mint(address to, uint8 botType) external returns (uint256);
}

interface IWaterTokenMarket {
    function mint(address to, uint256 amount) external;
}

/**
 * @title Marketplace
 * @notice Central hub for all game asset purchases in Orange Farm
 * @dev UUPS upgradeable with circuit breaker and multi-sig security
 */
contract Marketplace is 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuard,
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    // Roles
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant PRICE_MANAGER_ROLE = keccak256("PRICE_MANAGER_ROLE");

    // Asset types
    enum LandType { Small, Medium, Large }
    enum BotType { Basic, Advanced, Elite }
    enum WaterPackage { Pack10, Barrel50 }

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

    // Circuit breaker
    uint256 public circuitBreakerThreshold;
    uint256 public circuitBreakerWindow;
    uint256 public transactionCount;
    uint256 public windowStartTime;

    // Rate limiting
    mapping(address => uint256) public lastPurchaseTime;
    uint256 public purchaseCooldown;

    // Statistics
    uint256 public totalPurchases;
    uint256 public totalRevenue;
    mapping(address => uint256) public userPurchases;

    // Events
    event AssetPurchased(
        address indexed buyer,
        string assetType,
        uint256 assetId,
        uint256 price,
        uint256 timestamp
    );

    event BatchPurchase(
        address indexed buyer,
        uint256 landCount,
        uint256 botCount,
        uint256 waterAmount,
        uint256 totalPrice,
        uint256 timestamp
    );

    event PriceUpdated(
        string assetType,
        uint256 indexed assetIndex,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 timestamp
    );

    event CircuitBreakerTriggered(
        uint256 transactionCount,
        uint256 threshold,
        uint256 timestamp
    );

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury,
        uint256 timestamp
    );

    event ContractAddressUpdated(
        string contractName,
        address indexed oldAddress,
        address indexed newAddress
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the marketplace
     * @param _mockOrangeToken Address of MockOrangeDAO token
     * @param _landNFT Address of LandNFT contract
     * @param _botNFT Address of BotNFT contract
     * @param _waterToken Address of WaterToken contract
     * @param _treasury Address to receive purchase payments
     */
    function initialize(
        address _mockOrangeToken,
        address _landNFT,
        address _botNFT,
        address _waterToken,
        address _treasury
    ) public initializer {
        require(_mockOrangeToken != address(0), "Marketplace: zero address for token");
        require(_landNFT != address(0), "Marketplace: zero address for land");
        require(_botNFT != address(0), "Marketplace: zero address for bot");
        require(_waterToken != address(0), "Marketplace: zero address for water");
        require(_treasury != address(0), "Marketplace: zero address for treasury");

        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(PRICE_MANAGER_ROLE, msg.sender);

        mockOrangeToken = _mockOrangeToken;
        landNFT = _landNFT;
        botNFT = _botNFT;
        waterToken = _waterToken;
        treasury = _treasury;

        // Initialize pricing (prices in tokens with 18 decimals)
        landPrices[LandType.Small] = 5 * 10**18;
        landPrices[LandType.Medium] = 15 * 10**18;
        landPrices[LandType.Large] = 30 * 10**18;

        botPrices[BotType.Basic] = 10 * 10**18;
        botPrices[BotType.Advanced] = 25 * 10**18;
        botPrices[BotType.Elite] = 50 * 10**18;

        waterPrices[WaterPackage.Pack10] = 2 * 10**18;
        waterPrices[WaterPackage.Barrel50] = 8 * 10**18;

        waterAmounts[WaterPackage.Pack10] = 10;
        waterAmounts[WaterPackage.Barrel50] = 50;

        // Circuit breaker: 10,000 transactions in 1 hour
        circuitBreakerThreshold = 10000;
        circuitBreakerWindow = 1 hours;
        windowStartTime = block.timestamp;

        // Rate limiting: 1 second between purchases
        purchaseCooldown = 1 seconds;
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
        _checkRateLimit();
        _checkCircuitBreaker();

        uint256 price = landPrices[landType];
        require(price > 0, "Marketplace: invalid land type");

        // Transfer payment
        IERC20(mockOrangeToken).safeTransferFrom(msg.sender, treasury, price);

        // Mint land NFT
        tokenId = ILandNFTMarket(landNFT).mint(msg.sender, uint8(landType));

        // Update statistics
        _updateStats(msg.sender, price);

        emit AssetPurchased(
            msg.sender,
            _getLandTypeName(landType),
            tokenId,
            price,
            block.timestamp
        );

        lastPurchaseTime[msg.sender] = block.timestamp;
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
        _checkRateLimit();
        _checkCircuitBreaker();

        uint256 price = botPrices[botType];
        require(price > 0, "Marketplace: invalid bot type");

        // Transfer payment
        IERC20(mockOrangeToken).safeTransferFrom(msg.sender, treasury, price);

        // Mint bot NFT
        tokenId = IBotNFTMarket(botNFT).mint(msg.sender, uint8(botType));

        // Update statistics
        _updateStats(msg.sender, price);

        emit AssetPurchased(
            msg.sender,
            _getBotTypeName(botType),
            tokenId,
            price,
            block.timestamp
        );

        lastPurchaseTime[msg.sender] = block.timestamp;
    }

    /**
     * @notice Purchase water tokens
     * @param package Water package to purchase (0=Pack10, 1=Barrel50)
     */
    function buyWater(WaterPackage package) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        _checkRateLimit();
        _checkCircuitBreaker();

        uint256 price = waterPrices[package];
        uint256 amount = waterAmounts[package];
        require(price > 0, "Marketplace: invalid water package");

        // Transfer payment
        IERC20(mockOrangeToken).safeTransferFrom(msg.sender, treasury, price);

        // Mint water tokens
        IWaterTokenMarket(waterToken).mint(msg.sender, amount);

        // Update statistics
        _updateStats(msg.sender, price);

        emit AssetPurchased(
            msg.sender,
            _getWaterPackageName(package),
            amount,
            price,
            block.timestamp
        );

        lastPurchaseTime[msg.sender] = block.timestamp;
    }

    /**
     * @notice Batch purchase multiple assets for gas optimization
     * @param landTypes Array of land types to purchase
     * @param botTypes Array of bot types to purchase
     * @param waterPackages Array of water packages to purchase
     */
    function batchPurchase(
        LandType[] calldata landTypes,
        BotType[] calldata botTypes,
        WaterPackage[] calldata waterPackages
    ) external whenNotPaused nonReentrant {
        _checkRateLimit();
        _checkCircuitBreaker();

        uint256 totalPrice = 0;
        uint256 totalWater = 0;

        // Purchase lands
        for (uint256 i = 0; i < landTypes.length; i++) {
            uint256 price = landPrices[landTypes[i]];
            require(price > 0, "Marketplace: invalid land type in batch");
            totalPrice += price;
            ILandNFTMarket(landNFT).mint(msg.sender, uint8(landTypes[i]));
        }

        // Purchase bots
        for (uint256 i = 0; i < botTypes.length; i++) {
            uint256 price = botPrices[botTypes[i]];
            require(price > 0, "Marketplace: invalid bot type in batch");
            totalPrice += price;
            IBotNFTMarket(botNFT).mint(msg.sender, uint8(botTypes[i]));
        }

        // Purchase water
        for (uint256 i = 0; i < waterPackages.length; i++) {
            uint256 price = waterPrices[waterPackages[i]];
            uint256 amount = waterAmounts[waterPackages[i]];
            require(price > 0, "Marketplace: invalid water package in batch");
            totalPrice += price;
            totalWater += amount;
        }

        if (totalWater > 0) {
            IWaterTokenMarket(waterToken).mint(msg.sender, totalWater);
        }

        require(totalPrice > 0, "Marketplace: empty batch purchase");

        // Transfer total payment
        IERC20(mockOrangeToken).safeTransferFrom(msg.sender, treasury, totalPrice);

        // Update statistics
        _updateStats(msg.sender, totalPrice);

        emit BatchPurchase(
            msg.sender,
            landTypes.length,
            botTypes.length,
            totalWater,
            totalPrice,
            block.timestamp
        );

        lastPurchaseTime[msg.sender] = block.timestamp;
    }

    // Admin functions

    /**
     * @notice Update land price
     * @param landType Type of land
     * @param newPrice New price in tokens
     */
    function updateLandPrice(LandType landType, uint256 newPrice) 
        external 
        onlyRole(PRICE_MANAGER_ROLE) 
    {
        require(newPrice > 0, "Marketplace: price must be greater than zero");
        uint256 oldPrice = landPrices[landType];
        landPrices[landType] = newPrice;

        emit PriceUpdated(
            _getLandTypeName(landType),
            uint256(landType),
            oldPrice,
            newPrice,
            block.timestamp
        );
    }

    /**
     * @notice Update bot price
     * @param botType Type of bot
     * @param newPrice New price in tokens
     */
    function updateBotPrice(BotType botType, uint256 newPrice) 
        external 
        onlyRole(PRICE_MANAGER_ROLE) 
    {
        require(newPrice > 0, "Marketplace: price must be greater than zero");
        uint256 oldPrice = botPrices[botType];
        botPrices[botType] = newPrice;

        emit PriceUpdated(
            _getBotTypeName(botType),
            uint256(botType),
            oldPrice,
            newPrice,
            block.timestamp
        );
    }

    /**
     * @notice Update water package price
     * @param package Water package
     * @param newPrice New price in tokens
     */
    function updateWaterPrice(WaterPackage package, uint256 newPrice) 
        external 
        onlyRole(PRICE_MANAGER_ROLE) 
    {
        require(newPrice > 0, "Marketplace: price must be greater than zero");
        uint256 oldPrice = waterPrices[package];
        waterPrices[package] = newPrice;

        emit PriceUpdated(
            _getWaterPackageName(package),
            uint256(package),
            oldPrice,
            newPrice,
            block.timestamp
        );
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newTreasury != address(0), "Marketplace: zero address for treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury, block.timestamp);
    }

    /**
     * @notice Update contract addresses
     * @param _landNFT New LandNFT address
     * @param _botNFT New BotNFT address
     * @param _waterToken New WaterToken address
     */
    function updateContractAddresses(
        address _landNFT,
        address _botNFT,
        address _waterToken
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_landNFT != address(0) && _landNFT != landNFT) {
            emit ContractAddressUpdated("LandNFT", landNFT, _landNFT);
            landNFT = _landNFT;
        }
        if (_botNFT != address(0) && _botNFT != botNFT) {
            emit ContractAddressUpdated("BotNFT", botNFT, _botNFT);
            botNFT = _botNFT;
        }
        if (_waterToken != address(0) && _waterToken != waterToken) {
            emit ContractAddressUpdated("WaterToken", waterToken, _waterToken);
            waterToken = _waterToken;
        }
    }

    /**
     * @notice Update circuit breaker parameters
     * @param threshold New transaction threshold
     * @param window New time window in seconds
     */
    function updateCircuitBreaker(uint256 threshold, uint256 window) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(threshold > 0, "Marketplace: threshold must be greater than zero");
        require(window > 0, "Marketplace: window must be greater than zero");
        circuitBreakerThreshold = threshold;
        circuitBreakerWindow = window;
    }

    /**
     * @notice Update purchase cooldown
     * @param cooldown New cooldown in seconds
     */
    function updatePurchaseCooldown(uint256 cooldown) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        purchaseCooldown = cooldown;
    }

    /**
     * @notice Pause all marketplace operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause marketplace operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal (4-of-5 multi-sig required)
     * @param token Token address to withdraw
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
        require(to != address(0), "Marketplace: zero address for recipient");
        IERC20(token).safeTransfer(to, amount);
    }

    // View functions

    /**
     * @notice Get all land prices
     */
    function getLandPrices() external view returns (uint256[3] memory) {
        return [
            landPrices[LandType.Small],
            landPrices[LandType.Medium],
            landPrices[LandType.Large]
        ];
    }

    /**
     * @notice Get all bot prices
     */
    function getBotPrices() external view returns (uint256[3] memory) {
        return [
            botPrices[BotType.Basic],
            botPrices[BotType.Advanced],
            botPrices[BotType.Elite]
        ];
    }

    /**
     * @notice Get all water prices
     */
    function getWaterPrices() external view returns (uint256[2] memory) {
        return [
            waterPrices[WaterPackage.Pack10],
            waterPrices[WaterPackage.Barrel50]
        ];
    }

    /**
     * @notice Get user statistics
     * @param user User address
     */
    function getUserStats(address user) external view returns (uint256 purchases, uint256 lastPurchase) {
        return (userPurchases[user], lastPurchaseTime[user]);
    }

    /**
     * @notice Get marketplace statistics
     */
    function getMarketplaceStats() external view returns (
        uint256 purchases,
        uint256 revenue,
        uint256 currentTransactionCount,
        uint256 windowStart
    ) {
        return (totalPurchases, totalRevenue, transactionCount, windowStartTime);
    }

    // Internal functions

    function _checkRateLimit() internal view {
        require(
            block.timestamp >= lastPurchaseTime[msg.sender] + purchaseCooldown,
            "Marketplace: purchase cooldown not elapsed"
        );
    }

    function _checkCircuitBreaker() internal {
        // Reset window if expired
        if (block.timestamp >= windowStartTime + circuitBreakerWindow) {
            windowStartTime = block.timestamp;
            transactionCount = 0;
        }

        transactionCount++;

        if (transactionCount > circuitBreakerThreshold) {
            _pause();
            emit CircuitBreakerTriggered(
                transactionCount,
                circuitBreakerThreshold,
                block.timestamp
            );
            revert("Marketplace: circuit breaker triggered");
        }
    }

    function _updateStats(address user, uint256 price) internal {
        totalPurchases++;
        totalRevenue += price;
        userPurchases[user]++;
    }

    function _getLandTypeName(LandType landType) internal pure returns (string memory) {
        if (landType == LandType.Small) return "Land_Small";
        if (landType == LandType.Medium) return "Land_Medium";
        if (landType == LandType.Large) return "Land_Large";
        return "Land_Unknown";
    }

    function _getBotTypeName(BotType botType) internal pure returns (string memory) {
        if (botType == BotType.Basic) return "Bot_Basic";
        if (botType == BotType.Advanced) return "Bot_Advanced";
        if (botType == BotType.Elite) return "Bot_Elite";
        return "Bot_Unknown";
    }

    function _getWaterPackageName(WaterPackage package) internal pure returns (string memory) {
        if (package == WaterPackage.Pack10) return "Water_Pack10";
        if (package == WaterPackage.Barrel50) return "Water_Barrel50";
        return "Water_Unknown";
    }

    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {}

    uint256[50] private __gap;
}
