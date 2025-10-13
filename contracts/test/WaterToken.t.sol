// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Test.sol";
import "../src/WaterToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract WaterTokenTest is Test {
    WaterToken public implementation;
    ERC1967Proxy public proxy;
    WaterToken public token;

    address public admin = address(1);
    address public minter = address(2);
    address public consumer = address(3);
    address public pauser = address(4);
    address public player1 = address(5);
    address public player2 = address(6);

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    event WaterPurchased(address indexed player, uint256 amount);
    event WaterConsumed(address indexed player, uint256 amount);

    function setUp() public {
        // Deploy implementation
        implementation = new WaterToken();

        // Deploy proxy and initialize
        proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(WaterToken.initialize.selector, admin)
        );

        // Wrap proxy with token interface
        token = WaterToken(address(proxy));

        // Grant roles
        vm.startPrank(admin);
        token.grantRole(MINTER_ROLE, minter);
        token.grantRole(CONSUMER_ROLE, consumer);
        token.grantRole(PAUSER_ROLE, pauser);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testInitialization() public view {
        assertEq(token.name(), "WaterToken");
        assertEq(token.symbol(), "WATER");
        assertEq(token.decimals(), 0);
        assertTrue(token.hasRole(DEFAULT_ADMIN_ROLE, admin));
        assertTrue(token.hasRole(MINTER_ROLE, admin));
        assertTrue(token.hasRole(CONSUMER_ROLE, admin));
        assertTrue(token.hasRole(PAUSER_ROLE, admin));
    }

    function testCannotInitializeTwice() public {
        vm.expectRevert();
        token.initialize(admin);
    }

    function testCannotInitializeWithZeroAddress() public {
        WaterToken newToken = new WaterToken();
        vm.expectRevert(); // OZ v5 throws InvalidInitialization in some cases
        newToken.initialize(address(0));
    }

    function testZeroDecimals() public view {
        assertEq(token.decimals(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function testMint() public {
        uint256 amount = 100;
        
        vm.expectEmit(true, false, false, true);
        emit WaterPurchased(player1, amount);
        
        vm.prank(minter);
        token.mint(player1, amount);

        assertEq(token.balanceOf(player1), amount);
    }

    function testCannotMintWithoutRole() public {
        vm.prank(player1);
        vm.expectRevert();
        token.mint(player1, 100);
    }

    function testCannotMintToZeroAddress() public {
        vm.prank(minter);
        vm.expectRevert(WaterToken.ZeroAddressNotAllowed.selector);
        token.mint(address(0), 100);
    }

    function testCannotMintZeroAmount() public {
        vm.prank(minter);
        vm.expectRevert(WaterToken.ZeroAmountNotAllowed.selector);
        token.mint(player1, 0);
    }

    function testCannotMintWhenPaused() public {
        vm.prank(pauser);
        token.pause();

        vm.prank(minter);
        vm.expectRevert();
        token.mint(player1, 100);
    }

    function testFuzzMint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(amount > 0 && amount < type(uint256).max / 2);

        vm.prank(minter);
        token.mint(to, amount);

        assertEq(token.balanceOf(to), amount);
    }

    /*//////////////////////////////////////////////////////////////
                          BATCH MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function testBatchMint() public {
        address[] memory recipients = new address[](3);
        uint256[] memory amounts = new uint256[](3);

        recipients[0] = address(10);
        recipients[1] = address(11);
        recipients[2] = address(12);

        amounts[0] = 50;
        amounts[1] = 75;
        amounts[2] = 100;

        vm.prank(minter);
        token.batchMint(recipients, amounts);

        assertEq(token.balanceOf(recipients[0]), 50);
        assertEq(token.balanceOf(recipients[1]), 75);
        assertEq(token.balanceOf(recipients[2]), 100);
    }

    function testCannotBatchMintWithLengthMismatch() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](3);

        vm.prank(minter);
        vm.expectRevert(WaterToken.ArrayLengthMismatch.selector);
        token.batchMint(recipients, amounts);
    }

    function testCannotBatchMintEmptyArrays() public {
        address[] memory recipients = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.prank(minter);
        vm.expectRevert(WaterToken.EmptyArray.selector);
        token.batchMint(recipients, amounts);
    }

    function testCannotBatchMintWithZeroAddress() public {
        address[] memory recipients = new address[](2);
        uint256[] memory amounts = new uint256[](2);

        recipients[0] = address(10);
        recipients[1] = address(0); // Zero address
        amounts[0] = 50;
        amounts[1] = 50;

        vm.prank(minter);
        vm.expectRevert(WaterToken.ZeroAddressNotAllowed.selector);
        token.batchMint(recipients, amounts);
    }

    /*//////////////////////////////////////////////////////////////
                          CONSUMPTION TESTS
    //////////////////////////////////////////////////////////////*/

    function testConsume() public {
        // Mint some tokens first
        vm.prank(minter);
        token.mint(player1, 100);

        // Consume tokens
        vm.expectEmit(true, false, false, true);
        emit WaterConsumed(player1, 30);
        
        vm.prank(consumer);
        token.consume(player1, 30);

        assertEq(token.balanceOf(player1), 70);
    }

    function testCannotConsumeWithoutRole() public {
        vm.prank(minter);
        token.mint(player1, 100);

        vm.prank(player1);
        vm.expectRevert();
        token.consume(player1, 30);
    }

    function testCannotConsumeFromZeroAddress() public {
        vm.prank(consumer);
        vm.expectRevert(WaterToken.ZeroAddressNotAllowed.selector);
        token.consume(address(0), 30);
    }

    function testCannotConsumeZeroAmount() public {
        vm.prank(minter);
        token.mint(player1, 100);

        vm.prank(consumer);
        vm.expectRevert(WaterToken.ZeroAmountNotAllowed.selector);
        token.consume(player1, 0);
    }

    function testCannotConsumeMoreThanBalance() public {
        vm.prank(minter);
        token.mint(player1, 50);

        vm.prank(consumer);
        vm.expectRevert();
        token.consume(player1, 100);
    }

    function testCannotConsumeWhenPaused() public {
        vm.prank(minter);
        token.mint(player1, 100);

        vm.prank(pauser);
        token.pause();

        vm.prank(consumer);
        vm.expectRevert();
        token.consume(player1, 30);
    }

    /*//////////////////////////////////////////////////////////////
                            BURN TESTS
    //////////////////////////////////////////////////////////////*/

    function testBurn() public {
        vm.prank(minter);
        token.mint(player1, 100);

        vm.prank(player1);
        token.burn(30);

        assertEq(token.balanceOf(player1), 70);
    }

    function testBurnFrom() public {
        vm.prank(minter);
        token.mint(player1, 100);

        vm.prank(player1);
        token.approve(player2, 50);

        vm.prank(player2);
        token.burnFrom(player1, 30);

        assertEq(token.balanceOf(player1), 70);
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
        token.mint(player1, 100);

        vm.prank(pauser);
        token.pause();

        vm.prank(player1);
        vm.expectRevert();
        token.transfer(player2, 30);
    }

    /*//////////////////////////////////////////////////////////////
                      INTERFACE COMPLIANCE TESTS
    //////////////////////////////////////////////////////////////*/

    function testCanMintDailyAlwaysReturnsFalse() public view {
        assertFalse(token.canMintDaily(player1));
        assertFalse(token.canMintDaily(address(0)));
    }

    function testLastMintTimestampAlwaysReturnsZero() public view {
        assertEq(token.lastMintTimestamp(player1), 0);
        assertEq(token.lastMintTimestamp(address(0)), 0);
    }

    /*//////////////////////////////////////////////////////////////
                            UPGRADE TESTS
    //////////////////////////////////////////////////////////////*/

    function testUpgrade() public {
        WaterToken newImplementation = new WaterToken();

        vm.prank(admin);
        token.upgradeToAndCall(address(newImplementation), "");

        // Verify state is preserved
        assertEq(token.name(), "WaterToken");
        assertEq(token.symbol(), "WATER");
        assertEq(token.decimals(), 0);
    }

    function testCannotUpgradeWithoutAdminRole() public {
        WaterToken newImplementation = new WaterToken();

        vm.prank(player1);
        vm.expectRevert();
        token.upgradeToAndCall(address(newImplementation), "");
    }

    /*//////////////////////////////////////////////////////////////
                            ACCESS CONTROL TESTS
    //////////////////////////////////////////////////////////////*/

    function testGrantRole() public {
        vm.prank(admin);
        token.grantRole(CONSUMER_ROLE, player1);

        assertTrue(token.hasRole(CONSUMER_ROLE, player1));
    }

    function testRevokeRole() public {
        vm.startPrank(admin);
        token.grantRole(CONSUMER_ROLE, player1);
        token.revokeRole(CONSUMER_ROLE, player1);
        vm.stopPrank();

        assertFalse(token.hasRole(CONSUMER_ROLE, player1));
    }

    /*//////////////////////////////////////////////////////////////
                            GAS BENCHMARKING
    //////////////////////////////////////////////////////////////*/

    function testGasMint() public {
        vm.prank(minter);
        uint256 gasBefore = gasleft();
        token.mint(player1, 100);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for mint", gasUsed);
        assertLt(gasUsed, 95000);
    }

    function testGasBatchMint() public {
        address[] memory recipients = new address[](5);
        uint256[] memory amounts = new uint256[](5);

        for (uint256 i = 0; i < 5; i++) {
            recipients[i] = address(uint160(100 + i));
            amounts[i] = 50 + i * 10;
        }

        vm.prank(minter);
        uint256 gasBefore = gasleft();
        token.batchMint(recipients, amounts);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for batchMint (5 recipients)", gasUsed);
        emit log_named_uint("Gas per recipient", gasUsed / 5);
    }

    function testGasConsume() public {
        vm.prank(minter);
        token.mint(player1, 100);

        vm.prank(consumer);
        uint256 gasBefore = gasleft();
        token.consume(player1, 30);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for consume", gasUsed);
        assertLt(gasUsed, 70000);
    }

    function testGasTransfer() public {
        vm.prank(minter);
        token.mint(player1, 100);

        vm.prank(player1);
        uint256 gasBefore = gasleft();
        token.transfer(player2, 30);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for transfer", gasUsed);
        assertLt(gasUsed, 65000);
    }
}
