// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GameRegistry.sol";
import "../src/LandNFT.sol";
import "../src/BotNFT.sol";
import "../src/MockOrangeToken.sol";
import "../src/WaterToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract GameRegistryTest is Test {
    GameRegistry public registry;
    LandNFT public landNFT;
    BotNFT public botNFT;
    MockOrangeToken public mockOrangeToken;
    WaterToken public waterToken;

    address public admin = address(1);
    address public user = address(2);
    address public user2 = address(3);
    address public user3 = address(4);

    string constant BASE_URI = "ipfs://QmTest/";

    event PlayerRegistered(
        address indexed player,
        string username,
        string referralCode,
        address indexed referredBy
    );

    event StarterPackClaimed(
        address indexed player,
        uint256 landId,
        uint256 botId,
        uint256 tokenAmount,
        uint256 waterAmount
    );

    event ReferralRewarded(
        address indexed referrer,
        address indexed referee,
        uint256 rewardAmount
    );

    function setUp() public {
        // Deploy MockOrangeToken
        MockOrangeToken tokenImpl = new MockOrangeToken();
        bytes memory tokenInitData = abi.encodeWithSelector(
            MockOrangeToken.initialize.selector,
            admin
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenInitData);
        mockOrangeToken = MockOrangeToken(address(tokenProxy));

        // Deploy WaterToken
        WaterToken waterImpl = new WaterToken();
        bytes memory waterInitData = abi.encodeWithSelector(
            WaterToken.initialize.selector,
            admin
        );
        ERC1967Proxy waterProxy = new ERC1967Proxy(address(waterImpl), waterInitData);
        waterToken = WaterToken(address(waterProxy));

        // Deploy LandNFT
        LandNFT landImpl = new LandNFT();
        bytes memory landInitData = abi.encodeWithSelector(
            LandNFT.initialize.selector,
            admin,
            BASE_URI,
            address(mockOrangeToken),
            10e18
        );
        ERC1967Proxy landProxy = new ERC1967Proxy(address(landImpl), landInitData);
        landNFT = LandNFT(address(landProxy));

        // Deploy BotNFT
        BotNFT botImpl = new BotNFT();
        bytes memory botInitData = abi.encodeWithSelector(
            BotNFT.initialize.selector,
            admin,
            BASE_URI,
            address(mockOrangeToken),
            address(landNFT)
        );
        ERC1967Proxy botProxy = new ERC1967Proxy(address(botImpl), botInitData);
        botNFT = BotNFT(address(botProxy));

        // Deploy GameRegistry
        GameRegistry registryImpl = new GameRegistry();
        bytes memory registryInitData = abi.encodeWithSelector(
            GameRegistry.initialize.selector,
            admin,
            address(mockOrangeToken),
            address(landNFT),
            address(botNFT),
            address(waterToken)
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImpl), registryInitData);
        registry = GameRegistry(address(registryProxy));

        // Setup roles
        vm.startPrank(admin);
        landNFT.grantRole(landNFT.MINTER_ROLE(), address(registry));
        botNFT.grantRole(botNFT.MINTER_ROLE(), address(registry));
        waterToken.grantRole(waterToken.MINTER_ROLE(), address(registry));
        mockOrangeToken.grantRole(mockOrangeToken.MINTER_ROLE(), address(registry));
        vm.stopPrank();
    }

    // ============ Registration Tests ============

    function testRegisterPlayer() public {
        vm.startPrank(user);
        
        vm.expectEmit(true, false, false, true);
        emit PlayerRegistered(user, "alice", "ALICE123", address(0));
        
        registry.register("alice", "ALICE123", "");
        vm.stopPrank();

        GameRegistry.PlayerProfile memory profile = registry.getPlayerProfile(user);
        assertEq(profile.username, "alice");
        assertEq(profile.referralCode, "ALICE123");
        assertEq(profile.referredBy, address(0));
        assertTrue(profile.hasClaimedStarter);
        assertGt(profile.registrationTimestamp, 0);

        // Verify starter pack
        assertEq(landNFT.ownerOf(1), user);
        assertEq(botNFT.ownerOf(1), user);
        assertEq(mockOrangeToken.balanceOf(user), 50e18);
        assertEq(waterToken.balanceOf(user), 50);
    }

    function testRegisterWithReferral() public {
        // Register first user
        vm.prank(user);
        registry.register("alice", "ALICE123", "");

        // Register second user with referral
        vm.startPrank(user2);
        
        vm.expectEmit(true, false, false, true);
        emit PlayerRegistered(user2, "bob", "BOB456", user);
        
        registry.register("bob", "BOB456", "ALICE123");
        vm.stopPrank();

        GameRegistry.PlayerProfile memory profile = registry.getPlayerProfile(user2);
        assertEq(profile.referredBy, user);

        // Check referral rewards (50 starter + 25 referral = 75)
        assertEq(mockOrangeToken.balanceOf(user), 75e18); // Referrer reward
        assertEq(mockOrangeToken.balanceOf(user2), 75e18); // Referee reward + starter
    }

    function testCannotRegisterTwice() public {
        vm.startPrank(user);
        registry.register("alice", "ALICE123", "");
        
        vm.expectRevert("GameRegistry: already registered");
        registry.register("alice2", "ALICE456", "");
        vm.stopPrank();
    }

    function testCannotUseTakenUsername() public {
        vm.prank(user);
        registry.register("alice", "ALICE123", "");

        vm.prank(user2);
        vm.expectRevert("GameRegistry: username taken");
        registry.register("alice", "BOB456", "");
    }

    function testCannotUseTakenReferralCode() public {
        vm.prank(user);
        registry.register("alice", "ALICE123", "");

        vm.prank(user2);
        vm.expectRevert("GameRegistry: referral code taken");
        registry.register("bob", "ALICE123", "");
    }

    function testCannotReferSelf() public {
        // First register user1 to create a referral code
        vm.prank(user);
        registry.register("alice", "ALICE123", "");
        
        // Try to register user2 using their own code (which doesn't exist yet)
        // This should fail with "invalid referrer code" since ALICE456 isn't registered
        vm.prank(user2);
        vm.expectRevert("GameRegistry: invalid referrer code");
        registry.register("bob", "ALICE456", "ALICE456");
    }

    function testCannotUseInvalidReferralCode() public {
        vm.prank(user);
        vm.expectRevert("GameRegistry: invalid referrer code");
        registry.register("alice", "ALICE123", "INVALID");
    }

    function testRegisterWithEmptyUsername() public {
        vm.prank(user);
        vm.expectRevert("GameRegistry: username empty");
        registry.register("", "CODE", "");
    }

    function testRegisterWithLongUsername() public {
        vm.prank(user);
        vm.expectRevert("GameRegistry: username too long");
        registry.register("thisusernameiswaytoolongtobevalid123", "CODE", "");
    }

    // ============ Stats Tests ============

    function testCommitHarvest() public {
        vm.prank(user);
        registry.register("alice", "ALICE123", "");

        vm.prank(admin);
        registry.commitHarvest(user, 100);

        GameRegistry.PlayerStats memory stats = registry.getPlayerStats(user);
        assertEq(stats.totalOrangesCommitted, 100);
        assertEq(stats.totalHarvests, 1);
        assertEq(stats.level, 1);
    }

    function testLevelUpOnHarvest() public {
        vm.prank(user);
        registry.register("alice", "ALICE123", "");

        vm.startPrank(admin);
        registry.commitHarvest(user, 1000);
        vm.stopPrank();

        GameRegistry.PlayerStats memory stats = registry.getPlayerStats(user);
        assertEq(stats.level, 2); // 1000 oranges = level 2
    }

    function testMultipleHarvests() public {
        vm.prank(user);
        registry.register("alice", "ALICE123", "");

        vm.startPrank(admin);
        registry.commitHarvest(user, 500);
        registry.commitHarvest(user, 500);
        registry.commitHarvest(user, 500);
        vm.stopPrank();

        GameRegistry.PlayerStats memory stats = registry.getPlayerStats(user);
        assertEq(stats.totalOrangesCommitted, 1500);
        assertEq(stats.totalHarvests, 3);
        assertEq(stats.level, 2); // 1500 oranges = level 2
    }

    function testCannotCommitHarvestForUnregisteredPlayer() public {
        vm.prank(admin);
        vm.expectRevert("GameRegistry: player not registered");
        registry.commitHarvest(user, 100);
    }

    function testCannotCommitHarvestWithoutRole() public {
        vm.prank(user);
        registry.register("alice", "ALICE123", "");

        vm.prank(user2);
        vm.expectRevert();
        registry.commitHarvest(user, 100);
    }

    // ============ View Function Tests ============

    function testIsUsernameAvailable() public {
        assertTrue(registry.isUsernameAvailable("alice"));

        vm.prank(user);
        registry.register("alice", "CODE", "");

        assertFalse(registry.isUsernameAvailable("alice"));
        assertTrue(registry.isUsernameAvailable("bob"));
    }

    function testIsReferralCodeAvailable() public {
        assertTrue(registry.isReferralCodeAvailable("ALICE123"));

        vm.prank(user);
        registry.register("alice", "ALICE123", "");

        assertFalse(registry.isReferralCodeAvailable("ALICE123"));
        assertTrue(registry.isReferralCodeAvailable("BOB456"));
    }

    function testIsRegistered() public {
        assertFalse(registry.isRegistered(user));

        vm.prank(user);
        registry.register("alice", "CODE", "");

        assertTrue(registry.isRegistered(user));
    }

    function testTotalPlayers() public {
        assertEq(registry.totalPlayers(), 0);

        vm.prank(user);
        registry.register("alice", "CODE1", "");
        assertEq(registry.totalPlayers(), 1);

        vm.prank(user2);
        registry.register("bob", "CODE2", "");
        assertEq(registry.totalPlayers(), 2);
    }

    // ============ Admin Functions Tests ============

    function testUpdateStarterPackConfig() public {
        vm.prank(admin);
        registry.updateStarterPackConfig(100e18, 100, 50e18);

        assertEq(registry.starterTokenAmount(), 100e18);
        assertEq(registry.starterWaterAmount(), 100);
        assertEq(registry.referralReward(), 50e18);

        // Register new user with new config
        vm.prank(user);
        registry.register("alice", "CODE", "");

        assertEq(mockOrangeToken.balanceOf(user), 100e18);
        assertEq(waterToken.balanceOf(user), 100);
    }

    function testCannotUpdateConfigWithoutRole() public {
        vm.prank(user);
        vm.expectRevert();
        registry.updateStarterPackConfig(100e18, 100, 50e18);
    }

    // ============ Pause Tests ============

    function testPauseUnpause() public {
        vm.startPrank(admin);
        
        registry.pause();
        assertTrue(registry.paused());
        
        registry.unpause();
        assertFalse(registry.paused());
        
        vm.stopPrank();
    }

    function testCannotRegisterWhenPaused() public {
        vm.prank(admin);
        registry.pause();

        vm.prank(user);
        vm.expectRevert();
        registry.register("alice", "CODE", "");
    }

    // ============ Integration Tests ============

    function testCompleteReferralChain() public {
        // User 1 registers
        vm.prank(user);
        registry.register("alice", "ALICE", "");

        // User 2 registers with user1's referral
        vm.prank(user2);
        registry.register("bob", "BOB", "ALICE");

        // User 3 registers with user2's referral
        vm.prank(user3);
        registry.register("charlie", "CHARLIE", "BOB");

        // Check balances (starter + referral rewards)
        assertEq(mockOrangeToken.balanceOf(user), 75e18);  // 50 starter + 25 referral
        assertEq(mockOrangeToken.balanceOf(user2), 100e18); // 50 starter + 25 from user1 + 25 from user3
        assertEq(mockOrangeToken.balanceOf(user3), 75e18);  // 50 starter + 25 from user2

        // Check profiles
        assertEq(registry.getPlayerProfile(user2).referredBy, user);
        assertEq(registry.getPlayerProfile(user3).referredBy, user2);
    }

    // ============ Gas Benchmarking ============

    function testGasRegisterWithoutReferral() public {
        vm.prank(user);
        uint256 gasBefore = gasleft();
        registry.register("alice", "CODE", "");
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for registration (no referral)", gasUsed);
    }

    function testGasRegisterWithReferral() public {
        vm.prank(user);
        registry.register("alice", "ALICE", "");

        vm.prank(user2);
        uint256 gasBefore = gasleft();
        registry.register("bob", "BOB", "ALICE");
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for registration (with referral)", gasUsed);
    }
}
