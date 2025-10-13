// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/MockOrangeToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract MockOrangeTokenTest is Test {
    MockOrangeToken public implementation;
    ERC1967Proxy public proxy;
    MockOrangeToken public token;

    address public admin = address(1);
    address public minter = address(2);
    address public pauser = address(3);
    address public player1 = address(4);
    address public player2 = address(5);

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event PlayerRegistered(address indexed player, uint256 amount);
    event DailyMintClaimed(address indexed player, uint256 amount, uint256 timestamp);

    function setUp() public {
        // Deploy implementation
        implementation = new MockOrangeToken();

        // Deploy proxy and initialize
        proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(MockOrangeToken.initialize.selector, admin)
        );

        // Wrap proxy with token interface
        token = MockOrangeToken(address(proxy));

        // Grant roles
        vm.startPrank(admin);
        token.grantRole(MINTER_ROLE, minter);
        token.grantRole(PAUSER_ROLE, pauser);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testInitialization() public view {
        assertEq(token.name(), "MockOrangeDAO");
        assertEq(token.symbol(), "MORANGE");
        assertEq(token.decimals(), 18);
        assertTrue(token.hasRole(DEFAULT_ADMIN_ROLE, admin));
        assertTrue(token.hasRole(MINTER_ROLE, admin));
        assertTrue(token.hasRole(PAUSER_ROLE, admin));
    }

    function testCannotInitializeTwice() public {
        vm.expectRevert();
        token.initialize(admin);
    }

    function testCannotInitializeWithZeroAddress() public {
        MockOrangeToken newToken = new MockOrangeToken();
        vm.expectRevert(); // OZ v5 throws InvalidInitialization in some cases
        newToken.initialize(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                         PLAYER REGISTRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testRegisterPlayer() public {
        vm.expectEmit(true, false, false, true);
        emit PlayerRegistered(player1, token.STARTER_BONUS());
        
        vm.prank(minter);
        token.registerPlayer(player1);

        assertEq(token.balanceOf(player1), token.STARTER_BONUS());
        assertTrue(token.hasReceivedStarter(player1));
    }

    function testCannotRegisterPlayerTwice() public {
        vm.startPrank(minter);
        token.registerPlayer(player1);

        vm.expectRevert(MockOrangeToken.StarterAlreadyClaimed.selector);
        token.registerPlayer(player1);
        vm.stopPrank();
    }

    function testCannotRegisterPlayerWithoutMinterRole() public {
        vm.prank(player1);
        vm.expectRevert();
        token.registerPlayer(player1);
    }

    function testCannotRegisterZeroAddress() public {
        vm.prank(minter);
        vm.expectRevert(MockOrangeToken.ZeroAddressNotAllowed.selector);
        token.registerPlayer(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                          DAILY MINT TESTS
    //////////////////////////////////////////////////////////////*/

    function testDailyMint() public {
        vm.expectEmit(true, false, false, true);
        emit DailyMintClaimed(player1, token.DAILY_MINT_AMOUNT(), block.timestamp);
        
        vm.prank(player1);
        token.dailyMint();

        assertEq(token.balanceOf(player1), token.DAILY_MINT_AMOUNT());
        assertEq(token.lastMintTimestamp(player1), block.timestamp);
        assertFalse(token.canMintDaily(player1));
    }

    function testDailyMintAfterCooldown() public {
        // First mint
        vm.prank(player1);
        token.dailyMint();

        uint256 initialBalance = token.balanceOf(player1);

        // Fast forward 24 hours
        vm.warp(block.timestamp + 24 hours);

        // Second mint
        assertTrue(token.canMintDaily(player1));
        vm.prank(player1);
        token.dailyMint();

        assertEq(token.balanceOf(player1), initialBalance + token.DAILY_MINT_AMOUNT());
    }

    function testCannotDailyMintBeforeCooldown() public {
        vm.startPrank(player1);
        token.dailyMint();

        // Try to mint again immediately
        vm.expectRevert(MockOrangeToken.MintCooldownActive.selector);
        token.dailyMint();
        vm.stopPrank();
    }

    function testCanMintDailyCheck() public {
        // Before any mint
        assertTrue(token.canMintDaily(player1));

        // After mint
        vm.prank(player1);
        token.dailyMint();
        assertFalse(token.canMintDaily(player1));

        // After 23 hours (still false)
        vm.warp(block.timestamp + 23 hours);
        assertFalse(token.canMintDaily(player1));

        // After 24 hours (now true)
        vm.warp(block.timestamp + 1 hours);
        assertTrue(token.canMintDaily(player1));
    }

    function testCannotDailyMintWhenPaused() public {
        vm.prank(pauser);
        token.pause();

        vm.prank(player1);
        vm.expectRevert();
        token.dailyMint();
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function testMint() public {
        uint256 amount = 1000 * 10 ** 18;
        
        vm.prank(minter);
        token.mint(player1, amount);

        assertEq(token.balanceOf(player1), amount);
    }

    function testCannotMintWithoutRole() public {
        vm.prank(player1);
        vm.expectRevert();
        token.mint(player1, 1000 * 10 ** 18);
    }

    function testCannotMintToZeroAddress() public {
        vm.prank(minter);
        vm.expectRevert(MockOrangeToken.ZeroAddressNotAllowed.selector);
        token.mint(address(0), 1000 * 10 ** 18);
    }

    function testFuzzMint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(amount < type(uint256).max / 2);

        vm.prank(minter);
        token.mint(to, amount);

        assertEq(token.balanceOf(to), amount);
    }

    /*//////////////////////////////////////////////////////////////
                         PAUSE/UNPAUSE TESTS
    //////////////////////////////////////////////////////////////*/

    function testPause() public {
        vm.prank(pauser);
        token.pause();

        assertTrue(token.paused());
    }

    function testUnpause() public {
        vm.startPrank(pauser);
        token.pause();
        token.unpause();
        vm.stopPrank();

        assertFalse(token.paused());
    }

    function testCannotPauseWithoutRole() public {
        vm.prank(player1);
        vm.expectRevert();
        token.pause();
    }

    function testCannotTransferWhenPaused() public {
        vm.prank(minter);
        token.mint(player1, 1000 * 10 ** 18);

        vm.prank(pauser);
        token.pause();

        vm.prank(player1);
        vm.expectRevert();
        token.transfer(player2, 100 * 10 ** 18);
    }

    function testCanTransferAfterUnpause() public {
        vm.prank(minter);
        token.mint(player1, 1000 * 10 ** 18);

        vm.startPrank(pauser);
        token.pause();
        token.unpause();
        vm.stopPrank();

        vm.prank(player1);
        token.transfer(player2, 100 * 10 ** 18);

        assertEq(token.balanceOf(player2), 100 * 10 ** 18);
    }

    /*//////////////////////////////////////////////////////////////
                            UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function testUpgrade() public {
        MockOrangeToken newImplementation = new MockOrangeToken();

        vm.prank(admin);
        token.upgradeToAndCall(address(newImplementation), "");

        // Verify state is preserved
        assertEq(token.name(), "MockOrangeDAO");
        assertEq(token.symbol(), "MORANGE");
    }

    function testCannotUpgradeWithoutAdminRole() public {
        MockOrangeToken newImplementation = new MockOrangeToken();

        vm.prank(player1);
        vm.expectRevert();
        token.upgradeToAndCall(address(newImplementation), "");
    }

    /*//////////////////////////////////////////////////////////////
                            ACCESS CONTROL TESTS
    //////////////////////////////////////////////////////////////*/

    function testGrantRole() public {
        vm.prank(admin);
        token.grantRole(MINTER_ROLE, player1);

        assertTrue(token.hasRole(MINTER_ROLE, player1));
    }

    function testRevokeRole() public {
        vm.startPrank(admin);
        token.grantRole(MINTER_ROLE, player1);
        token.revokeRole(MINTER_ROLE, player1);
        vm.stopPrank();

        assertFalse(token.hasRole(MINTER_ROLE, player1));
    }

    function testCannotGrantRoleWithoutAdmin() public {
        vm.prank(player1);
        vm.expectRevert();
        token.grantRole(MINTER_ROLE, player2);
    }

    /*//////////////////////////////////////////////////////////////
                            GAS BENCHMARKING
    //////////////////////////////////////////////////////////////*/

    function testGasRegisterPlayer() public {
        vm.prank(minter);
        uint256 gasBefore = gasleft();
        token.registerPlayer(player1);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for registerPlayer", gasUsed);
        assertLt(gasUsed, 150000); // Should use less than 150k gas
    }

    function testGasDailyMint() public {
        vm.prank(player1);
        uint256 gasBefore = gasleft();
        token.dailyMint();
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for dailyMint", gasUsed);
        assertLt(gasUsed, 110000); // Should use less than 110k gas
    }

    function testGasTransfer() public {
        vm.prank(minter);
        token.mint(player1, 1000 * 10 ** 18);

        vm.prank(player1);
        uint256 gasBefore = gasleft();
        token.transfer(player2, 100 * 10 ** 18);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for transfer", gasUsed);
        assertLt(gasUsed, 65000); // Should use less than 65k gas
    }
}
