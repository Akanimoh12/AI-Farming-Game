// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LandNFT.sol";
import "../src/MockOrangeToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract LandNFTTest is Test {
    LandNFT public landNFT;
    LandNFT public implementation;
    MockOrangeToken public mockOrangeToken;
    MockOrangeToken public tokenImplementation;

    address public admin = address(1);
    address public minter = address(2);
    address public user = address(3);
    address public user2 = address(4);

    string constant BASE_URI = "ipfs://QmTest/";
    uint256 constant EXPANSION_COST = 10e18;

    event LandMinted(
        address indexed owner,
        uint256 indexed tokenId,
        LandNFT.LandType landType,
        uint8 capacity
    );

    event LandExpanded(
        uint256 indexed tokenId,
        uint8 newCapacity,
        uint8 expansionCount
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
        implementation = new LandNFT();
        bytes memory initData = abi.encodeWithSelector(
            LandNFT.initialize.selector,
            admin,
            BASE_URI,
            address(mockOrangeToken),
            EXPANSION_COST
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        landNFT = LandNFT(address(proxy));

        // Setup roles
        vm.startPrank(admin);
        landNFT.grantRole(landNFT.MINTER_ROLE(), minter);
        mockOrangeToken.grantRole(mockOrangeToken.MINTER_ROLE(), admin);
        vm.stopPrank();
    }

    // ============ Initialization Tests ============

    function testInitialization() public {
        assertEq(landNFT.name(), "Orange Farm Land");
        assertEq(landNFT.symbol(), "LAND");
        assertEq(landNFT.mockOrangeToken(), address(mockOrangeToken));
        assertEq(landNFT.expansionCost(), EXPANSION_COST);
        assertTrue(landNFT.hasRole(landNFT.DEFAULT_ADMIN_ROLE(), admin));
    }

    function testCannotInitializeWithZeroAdmin() public {
        LandNFT newImpl = new LandNFT();
        bytes memory initData = abi.encodeWithSelector(
            LandNFT.initialize.selector,
            address(0),
            BASE_URI,
            address(mockOrangeToken),
            EXPANSION_COST
        );
        
        vm.expectRevert();
        new ERC1967Proxy(address(newImpl), initData);
    }

    function testCannotInitializeWithZeroToken() public {
        LandNFT newImpl = new LandNFT();
        bytes memory initData = abi.encodeWithSelector(
            LandNFT.initialize.selector,
            admin,
            BASE_URI,
            address(0),
            EXPANSION_COST
        );
        
        vm.expectRevert();
        new ERC1967Proxy(address(newImpl), initData);
    }

    // ============ Minting Tests ============

    function testMintSmallLand() public {
        vm.startPrank(minter);
        
        vm.expectEmit(true, true, false, true);
        emit LandMinted(user, 1, LandNFT.LandType.Small, 2);
        
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        assertEq(tokenId, 1);
        assertEq(landNFT.ownerOf(tokenId), user);
        assertEq(landNFT.getCapacity(tokenId), 2);
        
        LandNFT.LandData memory data = landNFT.getLandData(tokenId);
        assertEq(uint8(data.landType), uint8(LandNFT.LandType.Small));
        assertEq(data.capacity, 2);
        assertEq(data.expansions, 0);
        assertGt(data.creationTimestamp, 0);
        
        vm.stopPrank();
    }

    function testMintMediumLand() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Medium);
        
        assertEq(landNFT.getCapacity(tokenId), 5);
        
        LandNFT.LandData memory data = landNFT.getLandData(tokenId);
        assertEq(uint8(data.landType), uint8(LandNFT.LandType.Medium));
        assertEq(data.capacity, 5);
    }

    function testMintLargeLand() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Large);
        
        assertEq(landNFT.getCapacity(tokenId), 10);
        
        LandNFT.LandData memory data = landNFT.getLandData(tokenId);
        assertEq(uint8(data.landType), uint8(LandNFT.LandType.Large));
        assertEq(data.capacity, 10);
    }

    function testMintMultipleLands() public {
        vm.startPrank(minter);
        
        uint256 tokenId1 = landNFT.mint(user, LandNFT.LandType.Small);
        uint256 tokenId2 = landNFT.mint(user, LandNFT.LandType.Medium);
        uint256 tokenId3 = landNFT.mint(user2, LandNFT.LandType.Large);
        
        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(tokenId3, 3);
        assertEq(landNFT.totalSupply(), 3);
        
        vm.stopPrank();
    }

    function testCannotMintToZeroAddress() public {
        vm.prank(minter);
        vm.expectRevert("LandNFT: mint to zero address");
        landNFT.mint(address(0), LandNFT.LandType.Small);
    }

    function testCannotMintWithoutMinterRole() public {
        vm.prank(user);
        vm.expectRevert();
        landNFT.mint(user, LandNFT.LandType.Small);
    }

    function testCannotMintWhenPaused() public {
        vm.prank(admin);
        landNFT.pause();
        
        vm.prank(minter);
        vm.expectRevert();
        landNFT.mint(user, LandNFT.LandType.Small);
    }

    // ============ Expansion Tests ============

    function testExpandCapacity() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        // Give user tokens for expansion
        vm.prank(admin);
        mockOrangeToken.mint(user, EXPANSION_COST);
        
        // Approve and expand
        vm.startPrank(user);
        mockOrangeToken.approve(address(landNFT), EXPANSION_COST);
        
        vm.expectEmit(true, false, false, true);
        emit LandExpanded(tokenId, 3, 1);
        
        landNFT.expandCapacity(tokenId);
        vm.stopPrank();
        
        assertEq(landNFT.getCapacity(tokenId), 3);
        
        LandNFT.LandData memory data = landNFT.getLandData(tokenId);
        assertEq(data.capacity, 3);
        assertEq(data.expansions, 1);
    }

    function testMultipleExpansions() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        // Give user tokens for 3 expansions
        vm.prank(admin);
        mockOrangeToken.mint(user, EXPANSION_COST * 3);
        
        vm.startPrank(user);
        mockOrangeToken.approve(address(landNFT), EXPANSION_COST * 3);
        
        landNFT.expandCapacity(tokenId);
        landNFT.expandCapacity(tokenId);
        landNFT.expandCapacity(tokenId);
        vm.stopPrank();
        
        assertEq(landNFT.getCapacity(tokenId), 5); // 2 + 3 expansions
        
        LandNFT.LandData memory data = landNFT.getLandData(tokenId);
        assertEq(data.capacity, 5);
        assertEq(data.expansions, 3);
    }

    function testCannotExpandWithoutOwnership() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        vm.prank(admin);
        mockOrangeToken.mint(user2, EXPANSION_COST);
        
        vm.startPrank(user2);
        mockOrangeToken.approve(address(landNFT), EXPANSION_COST);
        
        vm.expectRevert("LandNFT: not land owner");
        landNFT.expandCapacity(tokenId);
        vm.stopPrank();
    }

    function testCannotExpandWithoutPayment() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        vm.prank(user);
        vm.expectRevert();
        landNFT.expandCapacity(tokenId);
    }

    function testCannotExpandWhenPaused() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        vm.prank(admin);
        mockOrangeToken.mint(user, EXPANSION_COST);
        
        vm.prank(admin);
        landNFT.pause();
        
        vm.startPrank(user);
        mockOrangeToken.approve(address(landNFT), EXPANSION_COST);
        vm.expectRevert();
        landNFT.expandCapacity(tokenId);
        vm.stopPrank();
    }

    // ============ Metadata Tests ============

    function testTokenURI() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        string memory uri = landNFT.tokenURI(tokenId);
        assertEq(uri, string(abi.encodePacked(BASE_URI, "1")));
    }

    function testSetBaseURI() public {
        string memory newBaseURI = "ipfs://QmNewHash/";
        
        vm.prank(admin);
        landNFT.setBaseURI(newBaseURI);
        
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        string memory uri = landNFT.tokenURI(tokenId);
        assertEq(uri, string(abi.encodePacked(newBaseURI, "1")));
    }

    function testCannotSetBaseURIWithoutAdmin() public {
        vm.prank(user);
        vm.expectRevert();
        landNFT.setBaseURI("ipfs://QmNewHash/");
    }

    // ============ Admin Functions Tests ============

    function testSetExpansionCost() public {
        uint256 newCost = 20e18;
        
        vm.prank(admin);
        landNFT.setExpansionCost(newCost);
        
        assertEq(landNFT.expansionCost(), newCost);
    }

    function testCannotSetZeroExpansionCost() public {
        vm.prank(admin);
        vm.expectRevert("LandNFT: invalid cost");
        landNFT.setExpansionCost(0);
    }

    function testCannotSetExpansionCostWithoutAdmin() public {
        vm.prank(user);
        vm.expectRevert();
        landNFT.setExpansionCost(20e18);
    }

    // ============ Pause/Unpause Tests ============

    function testPauseUnpause() public {
        vm.startPrank(admin);
        
        landNFT.pause();
        assertTrue(landNFT.paused());
        
        landNFT.unpause();
        assertFalse(landNFT.paused());
        
        vm.stopPrank();
    }

    function testCannotPauseWithoutRole() public {
        vm.prank(user);
        vm.expectRevert();
        landNFT.pause();
    }

    // ============ Upgrade Tests ============

    function testUpgrade() public {
        LandNFT newImplementation = new LandNFT();
        
        vm.prank(admin);
        landNFT.upgradeToAndCall(address(newImplementation), "");
        
        // Verify state is preserved
        assertEq(landNFT.name(), "Orange Farm Land");
        assertEq(landNFT.mockOrangeToken(), address(mockOrangeToken));
    }

    function testCannotUpgradeWithoutAdmin() public {
        LandNFT newImplementation = new LandNFT();
        
        vm.prank(user);
        vm.expectRevert();
        landNFT.upgradeToAndCall(address(newImplementation), "");
    }

    // ============ View Function Tests ============

    function testGetCapacityOfNonExistentToken() public {
        vm.expectRevert();
        landNFT.getCapacity(999);
    }

    function testGetLandDataOfNonExistentToken() public {
        vm.expectRevert();
        landNFT.getLandData(999);
    }

    function testTotalSupply() public {
        assertEq(landNFT.totalSupply(), 0);
        
        vm.startPrank(minter);
        landNFT.mint(user, LandNFT.LandType.Small);
        assertEq(landNFT.totalSupply(), 1);
        
        landNFT.mint(user, LandNFT.LandType.Medium);
        assertEq(landNFT.totalSupply(), 2);
        vm.stopPrank();
    }

    // ============ Gas Benchmarking ============

    function testGasMintSmall() public {
        vm.prank(minter);
        uint256 gasBefore = gasleft();
        landNFT.mint(user, LandNFT.LandType.Small);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for minting Small land", gasUsed);
        assertLt(gasUsed, 200000);
    }

    function testGasExpansion() public {
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(user, LandNFT.LandType.Small);
        
        vm.prank(admin);
        mockOrangeToken.mint(user, EXPANSION_COST);
        
        vm.startPrank(user);
        mockOrangeToken.approve(address(landNFT), EXPANSION_COST);
        
        uint256 gasBefore = gasleft();
        landNFT.expandCapacity(tokenId);
        uint256 gasUsed = gasBefore - gasleft();
        
        emit log_named_uint("Gas used for land expansion", gasUsed);
        assertLt(gasUsed, 150000);
        vm.stopPrank();
    }

    // ============ Fuzz Tests ============

    function testFuzzMintToRandomAddresses(address to) public {
        vm.assume(to != address(0));
        vm.assume(to.code.length == 0); // Not a contract
        
        vm.prank(minter);
        uint256 tokenId = landNFT.mint(to, LandNFT.LandType.Small);
        
        assertEq(landNFT.ownerOf(tokenId), to);
    }

    function testFuzzExpansionCosts(uint256 cost) public {
        vm.assume(cost > 0 && cost < type(uint128).max);
        
        vm.prank(admin);
        landNFT.setExpansionCost(cost);
        
        assertEq(landNFT.expansionCost(), cost);
    }
}
