// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Marketplace.sol";
import "../src/MockOrangeToken.sol";
import "../src/LandNFT.sol";
import "../src/BotNFT.sol";
import "../src/WaterToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MarketplaceTest is Test {
    Marketplace public marketplace;
    Marketplace public marketplaceImpl;
    MockOrangeToken public mockOrangeToken;
    MockOrangeToken public tokenImpl;
    LandNFT public landNFT;
    LandNFT public landImpl;
    BotNFT public botNFT;
    BotNFT public botImpl;
    WaterToken public waterToken;
    WaterToken public waterImpl;

    address public admin = address(1);
    address public treasury = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public priceManager = address(5);

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

    function setUp() public {
        vm.startPrank(admin);

        // Deploy token implementation and proxy
        tokenImpl = new MockOrangeToken();
        bytes memory tokenInitData = abi.encodeWithSelector(
            MockOrangeToken.initialize.selector,
            admin
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        mockOrangeToken = MockOrangeToken(address(tokenProxy));

        // Deploy land implementation and proxy
        landImpl = new LandNFT();
        bytes memory landInitData = abi.encodeWithSelector(
            LandNFT.initialize.selector,
            admin,
            "https://api.orangefarm.io/land/",
            address(mockOrangeToken),
            10 * 10**18 // expansion cost
        );
        ERC1967Proxy landProxy = new ERC1967Proxy(address(landImpl), landInitData);
        landNFT = LandNFT(address(landProxy));

        // Deploy bot implementation and proxy
        botImpl = new BotNFT();
        bytes memory botInitData = abi.encodeWithSelector(
            BotNFT.initialize.selector,
            admin,
            "https://api.orangefarm.io/bot/",
            address(mockOrangeToken),
            address(landNFT)
        );
        ERC1967Proxy botProxy = new ERC1967Proxy(address(botImpl), botInitData);
        botNFT = BotNFT(address(botProxy));

        // Deploy water implementation and proxy
        waterImpl = new WaterToken();
        bytes memory waterInitData = abi.encodeWithSelector(
            WaterToken.initialize.selector,
            admin
        );
        ERC1967Proxy waterProxy = new ERC1967Proxy(address(waterImpl), waterInitData);
        waterToken = WaterToken(address(waterProxy));

        // Deploy marketplace implementation and proxy
        marketplaceImpl = new Marketplace();
        bytes memory marketplaceInitData = abi.encodeWithSelector(
            Marketplace.initialize.selector,
            address(mockOrangeToken),
            address(landNFT),
            address(botNFT),
            address(waterToken),
            treasury
        );
        ERC1967Proxy marketplaceProxy = new ERC1967Proxy(address(marketplaceImpl), marketplaceInitData);
        marketplace = Marketplace(address(marketplaceProxy));

        // Grant MINTER_ROLE to marketplace
        landNFT.grantRole(landNFT.MINTER_ROLE(), address(marketplace));
        botNFT.grantRole(botNFT.MINTER_ROLE(), address(marketplace));
        waterToken.grantRole(waterToken.MINTER_ROLE(), address(marketplace));

        // Grant PRICE_MANAGER_ROLE
        marketplace.grantRole(marketplace.PRICE_MANAGER_ROLE(), priceManager);

        vm.stopPrank();

        // Setup users with tokens
        vm.startPrank(admin);
        mockOrangeToken.mint(user1, 1000 * 10**18);
        mockOrangeToken.mint(user2, 1000 * 10**18);
        vm.stopPrank();
    }

    // Initialization tests

    function testInitialization() public {
        assertEq(marketplace.mockOrangeToken(), address(mockOrangeToken));
        assertEq(marketplace.landNFT(), address(landNFT));
        assertEq(marketplace.botNFT(), address(botNFT));
        assertEq(marketplace.waterToken(), address(waterToken));
        assertEq(marketplace.treasury(), treasury);
    }

    function testCannotInitializeWithZeroAddresses() public {
        Marketplace newMarketplace = new Marketplace();
        ERC1967Proxy newProxy = new ERC1967Proxy(address(newMarketplace), "");
        Marketplace proxied = Marketplace(address(newProxy));
        
        vm.expectRevert("Marketplace: zero address for token");
        proxied.initialize(
            address(0),
            address(landNFT),
            address(botNFT),
            address(waterToken),
            treasury
        );
    }

    function testInitialPrices() public {
        uint256[3] memory landPrices = marketplace.getLandPrices();
        assertEq(landPrices[0], 5 * 10**18); // Small
        assertEq(landPrices[1], 15 * 10**18); // Medium
        assertEq(landPrices[2], 30 * 10**18); // Large

        uint256[3] memory botPrices = marketplace.getBotPrices();
        assertEq(botPrices[0], 10 * 10**18); // Basic
        assertEq(botPrices[1], 25 * 10**18); // Advanced
        assertEq(botPrices[2], 50 * 10**18); // Elite

        uint256[2] memory waterPrices = marketplace.getWaterPrices();
        assertEq(waterPrices[0], 2 * 10**18); // Pack10
        assertEq(waterPrices[1], 8 * 10**18); // Barrel50
    }

    // Land purchase tests

    function testBuySmallLand() public {
        uint256 price = 5 * 10**18;
        
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        
        vm.expectEmit(true, true, true, true);
        emit AssetPurchased(user1, "Land_Small", 1, price, block.timestamp);
        
        uint256 tokenId = marketplace.buyLand(Marketplace.LandType.Small);
        vm.stopPrank();

        assertEq(landNFT.ownerOf(tokenId), user1);
        assertEq(mockOrangeToken.balanceOf(treasury), price);
    }

    function testBuyMediumLand() public {
        uint256 price = 15 * 10**18;
        
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        uint256 tokenId = marketplace.buyLand(Marketplace.LandType.Medium);
        vm.stopPrank();

        assertEq(landNFT.ownerOf(tokenId), user1);
        assertEq(mockOrangeToken.balanceOf(treasury), price);
    }

    function testBuyLargeLand() public {
        uint256 price = 30 * 10**18;
        
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        uint256 tokenId = marketplace.buyLand(Marketplace.LandType.Large);
        vm.stopPrank();

        assertEq(landNFT.ownerOf(tokenId), user1);
        assertEq(mockOrangeToken.balanceOf(treasury), price);
    }

    function testCannotBuyLandWithoutApproval() public {
        vm.startPrank(user1);
        vm.expectRevert();
        marketplace.buyLand(Marketplace.LandType.Small);
        vm.stopPrank();
    }

    function testCannotBuyLandWithInsufficientBalance() public {
        address poorUser = address(100);
        
        vm.startPrank(poorUser);
        vm.expectRevert();
        marketplace.buyLand(Marketplace.LandType.Small);
        vm.stopPrank();
    }

    // Bot purchase tests

    function testBuyBasicBot() public {
        uint256 price = 10 * 10**18;
        
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        
        vm.expectEmit(true, true, true, true);
        emit AssetPurchased(user1, "Bot_Basic", 1, price, block.timestamp);
        
        uint256 tokenId = marketplace.buyBot(Marketplace.BotType.Basic);
        vm.stopPrank();

        assertEq(botNFT.ownerOf(tokenId), user1);
        assertEq(mockOrangeToken.balanceOf(treasury), price);
    }

    function testBuyAdvancedBot() public {
        uint256 price = 25 * 10**18;
        
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        uint256 tokenId = marketplace.buyBot(Marketplace.BotType.Advanced);
        vm.stopPrank();

        assertEq(botNFT.ownerOf(tokenId), user1);
    }

    function testBuyEliteBot() public {
        uint256 price = 50 * 10**18;
        
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        uint256 tokenId = marketplace.buyBot(Marketplace.BotType.Elite);
        vm.stopPrank();

        assertEq(botNFT.ownerOf(tokenId), user1);
    }

    // Water purchase tests

    function testBuyWaterPack10() public {
        uint256 price = 2 * 10**18;
        
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        
        vm.expectEmit(true, true, true, true);
        emit AssetPurchased(user1, "Water_Pack10", 10, price, block.timestamp);
        
        marketplace.buyWater(Marketplace.WaterPackage.Pack10);
        vm.stopPrank();

        assertEq(waterToken.balanceOf(user1), 10);
        assertEq(mockOrangeToken.balanceOf(treasury), price);
    }

    function testBuyWaterBarrel50() public {
        uint256 price = 8 * 10**18;
        
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        marketplace.buyWater(Marketplace.WaterPackage.Barrel50);
        vm.stopPrank();

        assertEq(waterToken.balanceOf(user1), 50);
    }

    function testWaterBarrelDiscount() public {
        // Pack10: 2 tokens for 10 water = 0.2 per water
        // Barrel50: 8 tokens for 50 water = 0.16 per water (20% discount)
        uint256 pack10Price = 2 * 10**18;
        uint256 barrel50Price = 8 * 10**18;
        
        // 5 packs would cost 10 tokens for 50 water
        // 1 barrel costs 8 tokens for 50 water (20% savings)
        assertEq(barrel50Price, (pack10Price * 5 * 80) / 100);
    }

    // Batch purchase tests

    function testBatchPurchase() public {
        Marketplace.LandType[] memory lands = new Marketplace.LandType[](2);
        lands[0] = Marketplace.LandType.Small;
        lands[1] = Marketplace.LandType.Medium;

        Marketplace.BotType[] memory bots = new Marketplace.BotType[](2);
        bots[0] = Marketplace.BotType.Basic;
        bots[1] = Marketplace.BotType.Advanced;

        Marketplace.WaterPackage[] memory water = new Marketplace.WaterPackage[](1);
        water[0] = Marketplace.WaterPackage.Pack10;

        uint256 totalPrice = 5 * 10**18 + 15 * 10**18 + 10 * 10**18 + 25 * 10**18 + 2 * 10**18;

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), totalPrice);
        
        vm.expectEmit(true, true, true, true);
        emit BatchPurchase(user1, 2, 2, 10, totalPrice, block.timestamp);
        
        marketplace.batchPurchase(lands, bots, water);
        vm.stopPrank();

        assertEq(landNFT.balanceOf(user1), 2);
        assertEq(botNFT.balanceOf(user1), 2);
        assertEq(waterToken.balanceOf(user1), 10);
        assertEq(mockOrangeToken.balanceOf(treasury), totalPrice);
    }

    function testBatchPurchaseLandsOnly() public {
        Marketplace.LandType[] memory lands = new Marketplace.LandType[](3);
        lands[0] = Marketplace.LandType.Small;
        lands[1] = Marketplace.LandType.Small;
        lands[2] = Marketplace.LandType.Large;

        Marketplace.BotType[] memory bots = new Marketplace.BotType[](0);
        Marketplace.WaterPackage[] memory water = new Marketplace.WaterPackage[](0);

        uint256 totalPrice = 5 * 10**18 + 5 * 10**18 + 30 * 10**18;

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), totalPrice);
        marketplace.batchPurchase(lands, bots, water);
        vm.stopPrank();

        assertEq(landNFT.balanceOf(user1), 3);
    }

    function testCannotBatchPurchaseEmpty() public {
        Marketplace.LandType[] memory lands = new Marketplace.LandType[](0);
        Marketplace.BotType[] memory bots = new Marketplace.BotType[](0);
        Marketplace.WaterPackage[] memory water = new Marketplace.WaterPackage[](0);

        vm.startPrank(user1);
        vm.expectRevert("Marketplace: empty batch purchase");
        marketplace.batchPurchase(lands, bots, water);
        vm.stopPrank();
    }

    // Rate limiting tests

    function testPurchaseCooldown() public {
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 1000 * 10**18);
        
        marketplace.buyLand(Marketplace.LandType.Small);
        
        vm.expectRevert("Marketplace: purchase cooldown not elapsed");
        marketplace.buyBot(Marketplace.BotType.Basic);
        
        vm.warp(block.timestamp + 2);
        marketplace.buyBot(Marketplace.BotType.Basic);
        
        vm.stopPrank();
    }

    // Circuit breaker tests

    function testCircuitBreaker() public {
        vm.startPrank(admin);
        marketplace.updateCircuitBreaker(3, 1 hours);
        marketplace.updatePurchaseCooldown(0); // Disable cooldown for this test
        vm.stopPrank();

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 1000 * 10**18);
        
        marketplace.buyLand(Marketplace.LandType.Small);
        marketplace.buyBot(Marketplace.BotType.Basic);
        marketplace.buyWater(Marketplace.WaterPackage.Pack10);
        
        vm.expectRevert("Marketplace: circuit breaker triggered");
        marketplace.buyLand(Marketplace.LandType.Small);
        
        vm.stopPrank();
    }

    function testCircuitBreakerReset() public {
        vm.startPrank(admin);
        marketplace.updateCircuitBreaker(2, 10 seconds);
        vm.stopPrank();

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 1000 * 10**18);
        
        marketplace.buyLand(Marketplace.LandType.Small);
        vm.warp(block.timestamp + 2);
        marketplace.buyBot(Marketplace.BotType.Basic);
        
        // Wait for window to reset
        vm.warp(block.timestamp + 11);
        
        // Should work now
        marketplace.buyWater(Marketplace.WaterPackage.Pack10);
        
        vm.stopPrank();
    }

    // Price management tests

    function testUpdateLandPrice() public {
        uint256 newPrice = 10 * 10**18;
        
        vm.startPrank(priceManager);
        
        vm.expectEmit(true, true, true, true);
        emit PriceUpdated("Land_Small", 0, 5 * 10**18, newPrice, block.timestamp);
        
        marketplace.updateLandPrice(Marketplace.LandType.Small, newPrice);
        vm.stopPrank();

        uint256[3] memory prices = marketplace.getLandPrices();
        assertEq(prices[0], newPrice);
    }

    function testUpdateBotPrice() public {
        uint256 newPrice = 30 * 10**18;
        
        vm.startPrank(priceManager);
        marketplace.updateBotPrice(Marketplace.BotType.Advanced, newPrice);
        vm.stopPrank();

        uint256[3] memory prices = marketplace.getBotPrices();
        assertEq(prices[1], newPrice);
    }

    function testUpdateWaterPrice() public {
        uint256 newPrice = 5 * 10**18;
        
        vm.startPrank(priceManager);
        marketplace.updateWaterPrice(Marketplace.WaterPackage.Barrel50, newPrice);
        vm.stopPrank();

        uint256[2] memory prices = marketplace.getWaterPrices();
        assertEq(prices[1], newPrice);
    }

    function testCannotUpdatePriceWithoutRole() public {
        vm.startPrank(user1);
        vm.expectRevert();
        marketplace.updateLandPrice(Marketplace.LandType.Small, 10 * 10**18);
        vm.stopPrank();
    }

    function testCannotUpdatePriceToZero() public {
        vm.startPrank(priceManager);
        vm.expectRevert("Marketplace: price must be greater than zero");
        marketplace.updateLandPrice(Marketplace.LandType.Small, 0);
        vm.stopPrank();
    }

    // Treasury management tests

    function testUpdateTreasury() public {
        address newTreasury = address(999);
        
        vm.startPrank(admin);
        marketplace.updateTreasury(newTreasury);
        vm.stopPrank();

        assertEq(marketplace.treasury(), newTreasury);
    }

    function testCannotUpdateTreasuryToZeroAddress() public {
        vm.startPrank(admin);
        vm.expectRevert("Marketplace: zero address for treasury");
        marketplace.updateTreasury(address(0));
        vm.stopPrank();
    }

    // Statistics tests

    function testUserStatistics() public {
        // Disable cooldown for this test
        vm.prank(admin);
        marketplace.updatePurchaseCooldown(0);

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 1000 * 10**18);
        
        marketplace.buyLand(Marketplace.LandType.Small);
        marketplace.buyBot(Marketplace.BotType.Basic);
        marketplace.buyWater(Marketplace.WaterPackage.Pack10);
        
        vm.stopPrank();

        (uint256 purchases, ) = marketplace.getUserStats(user1);
        assertEq(purchases, 3);
    }

    function testMarketplaceStatistics() public {
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 100 * 10**18);
        
        marketplace.buyLand(Marketplace.LandType.Small); // 5
        vm.warp(block.timestamp + 2);
        marketplace.buyBot(Marketplace.BotType.Basic); // 10
        
        vm.stopPrank();

        (uint256 purchases, uint256 revenue, , ) = marketplace.getMarketplaceStats();
        assertEq(purchases, 2);
        assertEq(revenue, 15 * 10**18);
    }

    // Pause/unpause tests

    function testPauseMarketplace() public {
        vm.startPrank(admin);
        marketplace.pause();
        vm.stopPrank();

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 100 * 10**18);
        
        vm.expectRevert();
        marketplace.buyLand(Marketplace.LandType.Small);
        
        vm.stopPrank();
    }

    function testUnpauseMarketplace() public {
        vm.startPrank(admin);
        marketplace.pause();
        marketplace.unpause();
        vm.stopPrank();

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 100 * 10**18);
        marketplace.buyLand(Marketplace.LandType.Small);
        vm.stopPrank();
    }

    // Emergency withdrawal tests

    function testEmergencyWithdraw() public {
        // Send some tokens to marketplace
        vm.prank(admin);
        mockOrangeToken.mint(address(marketplace), 100 * 10**18);

        vm.startPrank(admin);
        marketplace.pause();
        marketplace.emergencyWithdraw(
            address(mockOrangeToken),
            admin,
            100 * 10**18
        );
        vm.stopPrank();

        assertEq(mockOrangeToken.balanceOf(admin), 100 * 10**18);
    }

    function testCannotEmergencyWithdrawWhenNotPaused() public {
        vm.startPrank(admin);
        vm.expectRevert();
        marketplace.emergencyWithdraw(
            address(mockOrangeToken),
            admin,
            100 * 10**18
        );
        vm.stopPrank();
    }

    // Upgrade tests

    function testUpgrade() public {
        Marketplace newImpl = new Marketplace();
        
        vm.prank(admin);
        marketplace.upgradeToAndCall(address(newImpl), "");
        
        // Verify state persisted
        assertEq(marketplace.treasury(), treasury);
    }

    function testCannotUpgradeWithoutRole() public {
        Marketplace newImpl = new Marketplace();
        
        vm.prank(user1);
        vm.expectRevert();
        marketplace.upgradeToAndCall(address(newImpl), "");
    }

    // Gas benchmarking tests

    function testGasBenchmarkSinglePurchase() public {
        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 100 * 10**18);
        
        uint256 gasBefore = gasleft();
        marketplace.buyLand(Marketplace.LandType.Small);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for single land purchase", gasUsed);
        vm.stopPrank();
    }

    function testGasBenchmarkBatchPurchase() public {
        Marketplace.LandType[] memory lands = new Marketplace.LandType[](3);
        lands[0] = Marketplace.LandType.Small;
        lands[1] = Marketplace.LandType.Medium;
        lands[2] = Marketplace.LandType.Large;

        Marketplace.BotType[] memory bots = new Marketplace.BotType[](3);
        bots[0] = Marketplace.BotType.Basic;
        bots[1] = Marketplace.BotType.Advanced;
        bots[2] = Marketplace.BotType.Elite;

        Marketplace.WaterPackage[] memory water = new Marketplace.WaterPackage[](2);
        water[0] = Marketplace.WaterPackage.Pack10;
        water[1] = Marketplace.WaterPackage.Barrel50;

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), 1000 * 10**18);
        
        uint256 gasBefore = gasleft();
        marketplace.batchPurchase(lands, bots, water);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for batch purchase (8 items)", gasUsed);
        vm.stopPrank();
    }

    // Fuzz tests

    function testFuzzBuyLand(uint8 landTypeRaw) public {
        vm.assume(landTypeRaw <= 2);
        Marketplace.LandType landType = Marketplace.LandType(landTypeRaw);
        
        uint256 price = landType == Marketplace.LandType.Small ? 5 * 10**18 :
                       landType == Marketplace.LandType.Medium ? 15 * 10**18 :
                       30 * 10**18;

        vm.startPrank(user1);
        mockOrangeToken.approve(address(marketplace), price);
        uint256 tokenId = marketplace.buyLand(landType);
        vm.stopPrank();

        assertEq(landNFT.ownerOf(tokenId), user1);
    }

    function testFuzzUpdatePrice(uint256 newPrice) public {
        vm.assume(newPrice > 0);
        vm.assume(newPrice < type(uint128).max);

        vm.prank(priceManager);
        marketplace.updateLandPrice(Marketplace.LandType.Small, newPrice);

        uint256[3] memory prices = marketplace.getLandPrices();
        assertEq(prices[0], newPrice);
    }
}
