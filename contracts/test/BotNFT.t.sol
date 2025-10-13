// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BotNFT.sol";
import "../src/LandNFT.sol";
import "../src/MockOrangeToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract BotNFTTest is Test {
    BotNFT public botNFT;
    BotNFT public botImplementation;
    LandNFT public landNFT;
    LandNFT public landImplementation;
    MockOrangeToken public mockOrangeToken;
    MockOrangeToken public tokenImplementation;

    address public admin = address(1);
    address public minter = address(2);
    address public user = address(3);
    address public user2 = address(4);

    string constant BASE_URI = "ipfs://QmTest/";
    uint256 constant EXPANSION_COST = 10e18;

    event BotMinted(
        address indexed owner,
        uint256 indexed tokenId,
        BotNFT.BotType botType,
        uint16 harvestRate,
        uint8 waterConsumption
    );

    event BotAssigned(
        uint256 indexed botId,
        uint256 indexed landId,
        address indexed owner
    );

    event BotUnassigned(uint256 indexed botId, uint256 indexed landId);

    event BotUpgraded(
        uint256 indexed botId,
        BotNFT.BotType oldType,
        BotNFT.BotType newType,
        uint16 newHarvestRate,
        uint8 newWaterConsumption
    );

    function setUp() public {
        // Deploy MockOrangeToken
        tokenImplementation = new MockOrangeToken();
        bytes memory tokenInitData = abi.encodeWithSelector(
            MockOrangeToken.initialize.selector,
            admin
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(
            address(tokenImplementation),
            tokenInitData
        );
        mockOrangeToken = MockOrangeToken(address(tokenProxy));

        // Deploy LandNFT
        landImplementation = new LandNFT();
        bytes memory landInitData = abi.encodeWithSelector(
            LandNFT.initialize.selector,
            admin,
            BASE_URI,
            address(mockOrangeToken),
            EXPANSION_COST
        );
        ERC1967Proxy landProxy = new ERC1967Proxy(
            address(landImplementation),
            landInitData
        );
        landNFT = LandNFT(address(landProxy));

        // Deploy BotNFT
        botImplementation = new BotNFT();
        bytes memory botInitData = abi.encodeWithSelector(
            BotNFT.initialize.selector,
            admin,
            BASE_URI,
            address(mockOrangeToken),
            address(landNFT)
        );
        ERC1967Proxy botProxy = new ERC1967Proxy(
            address(botImplementation),
            botInitData
        );
        botNFT = BotNFT(address(botProxy));

        // Setup roles
        vm.startPrank(admin);
        botNFT.grantRole(botNFT.MINTER_ROLE(), minter);
        landNFT.grantRole(landNFT.MINTER_ROLE(), minter);
        mockOrangeToken.grantRole(mockOrangeToken.MINTER_ROLE(), admin);
        vm.stopPrank();
    }

    // ============ Initialization Tests ============

    function testInitialization() public {
        assertEq(botNFT.name(), "Orange Farm Bot");
        assertEq(botNFT.symbol(), "BOT");
        assertEq(botNFT.mockOrangeToken(), address(mockOrangeToken));
        assertEq(botNFT.landNFT(), address(landNFT));
        assertTrue(botNFT.hasRole(botNFT.DEFAULT_ADMIN_ROLE(), admin));
    }

    function testCannotInitializeWithZeroAddresses() public {
        BotNFT newImpl = new BotNFT();
        
        // Zero admin
        bytes memory initData = abi.encodeWithSelector(
            BotNFT.initialize.selector,
            address(0),
            BASE_URI,
            address(mockOrangeToken),
            address(landNFT)
        );
        vm.expectRevert();
        new ERC1967Proxy(address(newImpl), initData);
        
        // Zero token
        newImpl = new BotNFT();
        initData = abi.encodeWithSelector(
            BotNFT.initialize.selector,
            admin,
            BASE_URI,
            address(0),
            address(landNFT)
        );
        vm.expectRevert();
        new ERC1967Proxy(address(newImpl), initData);
        
        // Zero land
        newImpl = new BotNFT();
        initData = abi.encodeWithSelector(
            BotNFT.initialize.selector,
            admin,
            BASE_URI,
            address(mockOrangeToken),
            address(0)
        );
        vm.expectRevert();
        new ERC1967Proxy(address(newImpl), initData);
    }

    // ============ Minting Tests ============

    function testMintBasicBot() public {
        vm.startPrank(minter);
        
        vm.expectEmit(true, true, false, true);
        emit BotMinted(user, 1, BotNFT.BotType.Basic, 10, 1);
        
        uint256 tokenId = botNFT.mint(user, BotNFT.BotType.Basic);
        
        assertEq(tokenId, 1);
        assertEq(botNFT.ownerOf(tokenId), user);
        
        BotNFT.BotData memory data = botNFT.getBotData(tokenId);
        assertEq(uint8(data.botType), uint8(BotNFT.BotType.Basic));
        assertEq(data.harvestRate, 10);
        assertEq(data.waterConsumption, 1);
        assertEq(data.assignedLandId, 0);
        assertFalse(data.isActive);
        assertEq(data.totalHarvests, 0);
        assertGt(data.creationTimestamp, 0);
        
        vm.stopPrank();
    }

    function testMintAdvancedBot() public {
        vm.prank(minter);
        uint256 tokenId = botNFT.mint(user, BotNFT.BotType.Advanced);
        
        BotNFT.BotData memory data = botNFT.getBotData(tokenId);
        assertEq(uint8(data.botType), uint8(BotNFT.BotType.Advanced));
        assertEq(data.harvestRate, 25);
        assertEq(data.waterConsumption, 2);
    }

    function testMintEliteBot() public {
        vm.prank(minter);
        uint256 tokenId = botNFT.mint(user, BotNFT.BotType.Elite);
        
        BotNFT.BotData memory data = botNFT.getBotData(tokenId);
        assertEq(uint8(data.botType), uint8(BotNFT.BotType.Elite));
        assertEq(data.harvestRate, 50);
        assertEq(data.waterConsumption, 4);
    }

    function testCannotMintToZeroAddress() public {
        vm.prank(minter);
        vm.expectRevert("BotNFT: mint to zero address");
        botNFT.mint(address(0), BotNFT.BotType.Basic);
    }

    function testCannotMintWithoutMinterRole() public {
        vm.prank(user);
        vm.expectRevert();
        botNFT.mint(user, BotNFT.BotType.Basic);
    }

    // ============ Assignment Tests ============

    function testAssignBotToLand() public {
        // Mint land and bot
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Small);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        // Assign bot
        vm.startPrank(user);
        vm.expectEmit(true, true, true, true);
        emit BotAssigned(botId, landId, user);
        
        botNFT.assignToLand(botId, landId);
        vm.stopPrank();
        
        BotNFT.BotData memory data = botNFT.getBotData(botId);
        assertEq(data.assignedLandId, landId);
        assertTrue(data.isActive);
        
        uint256[] memory botsOnLand = botNFT.getBotsOnLand(landId);
        assertEq(botsOnLand.length, 1);
        assertEq(botsOnLand[0], botId);
    }

    function testAssignMultipleBotsToLand() public {
        // Mint medium land (capacity 5)
        vm.prank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Medium);
        
        // Mint 3 bots
        vm.startPrank(minter);
        uint256 botId1 = botNFT.mint(user, BotNFT.BotType.Basic);
        uint256 botId2 = botNFT.mint(user, BotNFT.BotType.Advanced);
        uint256 botId3 = botNFT.mint(user, BotNFT.BotType.Elite);
        vm.stopPrank();
        
        // Assign all bots
        vm.startPrank(user);
        botNFT.assignToLand(botId1, landId);
        botNFT.assignToLand(botId2, landId);
        botNFT.assignToLand(botId3, landId);
        vm.stopPrank();
        
        uint256[] memory botsOnLand = botNFT.getBotsOnLand(landId);
        assertEq(botsOnLand.length, 3);
    }

    function testCannotAssignBotToLandAtCapacity() public {
        // Mint small land (capacity 2)
        vm.prank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Small);
        
        // Mint 3 bots
        vm.startPrank(minter);
        uint256 botId1 = botNFT.mint(user, BotNFT.BotType.Basic);
        uint256 botId2 = botNFT.mint(user, BotNFT.BotType.Basic);
        uint256 botId3 = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        // Assign 2 bots successfully
        vm.startPrank(user);
        botNFT.assignToLand(botId1, landId);
        botNFT.assignToLand(botId2, landId);
        
        // Third should fail
        vm.expectRevert("BotNFT: land at capacity");
        botNFT.assignToLand(botId3, landId);
        vm.stopPrank();
    }

    function testCannotAssignWithoutBotOwnership() public {
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Small);
        uint256 botId = botNFT.mint(user2, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        vm.prank(user);
        vm.expectRevert("BotNFT: not bot owner");
        botNFT.assignToLand(botId, landId);
    }

    function testCannotAssignWithoutLandOwnership() public {
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user2, LandNFT.LandType.Small);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        vm.prank(user);
        vm.expectRevert("BotNFT: not land owner");
        botNFT.assignToLand(botId, landId);
    }

    function testCannotAssignAlreadyAssignedBot() public {
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Medium);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        vm.startPrank(user);
        botNFT.assignToLand(botId, landId);
        
        vm.expectRevert("BotNFT: bot already assigned");
        botNFT.assignToLand(botId, landId);
        vm.stopPrank();
    }

    // ============ Unassignment Tests ============

    function testUnassignBot() public {
        // Setup: mint and assign
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Small);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        vm.startPrank(user);
        botNFT.assignToLand(botId, landId);
        
        // Unassign
        vm.expectEmit(true, true, false, true);
        emit BotUnassigned(botId, landId);
        
        botNFT.unassignBot(botId);
        vm.stopPrank();
        
        BotNFT.BotData memory data = botNFT.getBotData(botId);
        assertEq(data.assignedLandId, 0);
        assertFalse(data.isActive);
        
        uint256[] memory botsOnLand = botNFT.getBotsOnLand(landId);
        assertEq(botsOnLand.length, 0);
    }

    function testUnassignBotFromMultiple() public {
        // Mint land and 2 bots
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Small);
        uint256 botId1 = botNFT.mint(user, BotNFT.BotType.Basic);
        uint256 botId2 = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        // Assign both
        vm.startPrank(user);
        botNFT.assignToLand(botId1, landId);
        botNFT.assignToLand(botId2, landId);
        
        // Unassign first
        botNFT.unassignBot(botId1);
        vm.stopPrank();
        
        uint256[] memory botsOnLand = botNFT.getBotsOnLand(landId);
        assertEq(botsOnLand.length, 1);
        assertEq(botsOnLand[0], botId2);
    }

    function testCannotUnassignWithoutOwnership() public {
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Small);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        vm.prank(user);
        botNFT.assignToLand(botId, landId);
        
        vm.prank(user2);
        vm.expectRevert("BotNFT: not bot owner");
        botNFT.unassignBot(botId);
    }

    function testCannotUnassignUnassignedBot() public {
        vm.prank(minter);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        
        vm.prank(user);
        vm.expectRevert("BotNFT: bot not assigned");
        botNFT.unassignBot(botId);
    }

    // ============ Upgrade Tests ============

    function testUpgradeBasicToAdvanced() public {
        vm.prank(minter);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        
        // Give user tokens for upgrade
        uint256 upgradeCost = botNFT.upgradeCosts(BotNFT.BotType.Advanced);
        vm.prank(admin);
        mockOrangeToken.mint(user, upgradeCost);
        
        vm.startPrank(user);
        mockOrangeToken.approve(address(botNFT), upgradeCost);
        
        vm.expectEmit(true, false, false, true);
        emit BotUpgraded(botId, BotNFT.BotType.Basic, BotNFT.BotType.Advanced, 25, 2);
        
        botNFT.upgradeBot(botId);
        vm.stopPrank();
        
        BotNFT.BotData memory data = botNFT.getBotData(botId);
        assertEq(uint8(data.botType), uint8(BotNFT.BotType.Advanced));
        assertEq(data.harvestRate, 25);
        assertEq(data.waterConsumption, 2);
    }

    function testUpgradeAdvancedToElite() public {
        vm.prank(minter);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Advanced);
        
        uint256 upgradeCost = botNFT.upgradeCosts(BotNFT.BotType.Elite);
        vm.prank(admin);
        mockOrangeToken.mint(user, upgradeCost);
        
        vm.startPrank(user);
        mockOrangeToken.approve(address(botNFT), upgradeCost);
        botNFT.upgradeBot(botId);
        vm.stopPrank();
        
        BotNFT.BotData memory data = botNFT.getBotData(botId);
        assertEq(uint8(data.botType), uint8(BotNFT.BotType.Elite));
        assertEq(data.harvestRate, 50);
        assertEq(data.waterConsumption, 4);
    }

    function testCannotUpgradeEliteBot() public {
        vm.prank(minter);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Elite);
        
        vm.prank(user);
        vm.expectRevert("BotNFT: already max tier");
        botNFT.upgradeBot(botId);
    }

    function testCannotUpgradeWithoutOwnership() public {
        vm.prank(minter);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        
        vm.prank(user2);
        vm.expectRevert("BotNFT: not bot owner");
        botNFT.upgradeBot(botId);
    }

    function testCannotUpgradeWithoutPayment() public {
        vm.prank(minter);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        
        vm.prank(user);
        vm.expectRevert();
        botNFT.upgradeBot(botId);
    }

    // ============ Harvest Increment Tests ============

    function testIncrementHarvests() public {
        vm.prank(minter);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        
        vm.startPrank(minter);
        botNFT.incrementHarvests(botId);
        botNFT.incrementHarvests(botId);
        botNFT.incrementHarvests(botId);
        vm.stopPrank();
        
        BotNFT.BotData memory data = botNFT.getBotData(botId);
        assertEq(data.totalHarvests, 3);
    }

    function testCannotIncrementHarvestsWithoutRole() public {
        vm.prank(minter);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        
        vm.prank(user);
        vm.expectRevert();
        botNFT.incrementHarvests(botId);
    }

    // ============ Admin Tests ============

    function testSetUpgradeCost() public {
        uint256 newCost = 30e18;
        
        vm.prank(admin);
        botNFT.setUpgradeCost(BotNFT.BotType.Advanced, newCost);
        
        assertEq(botNFT.upgradeCosts(BotNFT.BotType.Advanced), newCost);
    }

    function testCannotSetUpgradeCostForBasic() public {
        vm.prank(admin);
        vm.expectRevert("BotNFT: cannot set cost for basic");
        botNFT.setUpgradeCost(BotNFT.BotType.Basic, 10e18);
    }

    function testCannotSetZeroUpgradeCost() public {
        vm.prank(admin);
        vm.expectRevert("BotNFT: invalid cost");
        botNFT.setUpgradeCost(BotNFT.BotType.Advanced, 0);
    }

    // ============ Gas Benchmarking ============

    function testGasMintBot() public {
        vm.prank(minter);
        uint256 gasBefore = gasleft();
        botNFT.mint(user, BotNFT.BotType.Basic);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for minting bot", gasUsed);
        assertLt(gasUsed, 200000);
    }

    function testGasAssignment() public {
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Small);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        vm.prank(user);
        uint256 gasBefore = gasleft();
        botNFT.assignToLand(botId, landId);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for bot assignment", gasUsed);
        assertLt(gasUsed, 150000);
    }

    // ============ Integration Tests ============

    function testFullBotLifecycle() public {
        // Mint land and bot
        vm.startPrank(minter);
        uint256 landId = landNFT.mint(user, LandNFT.LandType.Small);
        uint256 botId = botNFT.mint(user, BotNFT.BotType.Basic);
        vm.stopPrank();
        
        // Assign bot
        vm.prank(user);
        botNFT.assignToLand(botId, landId);
        
        // Simulate harvests
        vm.startPrank(minter);
        botNFT.incrementHarvests(botId);
        botNFT.incrementHarvests(botId);
        vm.stopPrank();
        
        // Unassign bot
        vm.prank(user);
        botNFT.unassignBot(botId);
        
        // Upgrade bot
        uint256 upgradeCost = botNFT.upgradeCosts(BotNFT.BotType.Advanced);
        vm.prank(admin);
        mockOrangeToken.mint(user, upgradeCost);
        
        vm.startPrank(user);
        mockOrangeToken.approve(address(botNFT), upgradeCost);
        botNFT.upgradeBot(botId);
        vm.stopPrank();
        
        // Verify final state
        BotNFT.BotData memory data = botNFT.getBotData(botId);
        assertEq(uint8(data.botType), uint8(BotNFT.BotType.Advanced));
        assertEq(data.totalHarvests, 2);
        assertEq(data.assignedLandId, 0);
        assertFalse(data.isActive);
    }
}
