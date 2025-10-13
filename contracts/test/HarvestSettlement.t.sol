// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/HarvestSettlement.sol";
import "../src/GameRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract HarvestSettlementTest is Test {
    HarvestSettlement public settlement;
    HarvestSettlement public settlementImpl;
    GameRegistry public gameRegistry;
    GameRegistry public registryImpl;

    address public admin = address(1);
    address public settler = address(2);
    address public player1 = address(3);
    address public player2 = address(4);
    address public player3 = address(5);

    bytes32 public merkleRoot;

    event SeasonStarted(uint256 indexed seasonId, uint256 startTime, uint256 endTime);
    event SeasonFinalized(uint256 indexed seasonId, bytes32 merkleRoot, uint256 totalOranges, uint256 totalPlayers);
    event HarvestCommitted(address indexed player, uint256 indexed seasonId, uint256 oranges, uint256 harvests, uint256 timestamp);
    event ValidationFailed(address indexed player, uint256 indexed seasonId, string reason, uint256 timestamp);

    function setUp() public {
        vm.startPrank(admin);

        // Deploy dummy registry (simplified for testing)
        registryImpl = new GameRegistry();
        bytes memory registryInitData = abi.encodeWithSelector(
            GameRegistry.initialize.selector,
            admin,      // admin
            address(1), // mockOrangeToken
            address(2), // landNFT
            address(3), // botNFT
            address(4)  // waterToken
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImpl), registryInitData);
        gameRegistry = GameRegistry(address(registryProxy));

        // Deploy settlement implementation and proxy
        settlementImpl = new HarvestSettlement();
        bytes memory settlementInitData = abi.encodeWithSelector(
            HarvestSettlement.initialize.selector,
            address(gameRegistry)
        );
        ERC1967Proxy settlementProxy = new ERC1967Proxy(address(settlementImpl), settlementInitData);
        settlement = HarvestSettlement(address(settlementProxy));

        // Grant SETTLER_ROLE
        settlement.grantRole(settlement.SETTLER_ROLE(), settler);

        vm.stopPrank();

        // Generate merkle tree for testing
        _generateMerkleTree();
    }

    function _generateMerkleTree() internal {
        // Create leaves for 3 players
        bytes32 leaf1 = keccak256(bytes.concat(keccak256(abi.encode(player1, 1000, 10, 1))));
        bytes32 leaf2 = keccak256(bytes.concat(keccak256(abi.encode(player2, 2000, 20, 2))));
        bytes32 leaf3 = keccak256(bytes.concat(keccak256(abi.encode(player3, 3000, 30, 3))));

        // Simple merkle root calculation (for testing)
        bytes32 node1 = _hashPair(leaf1, leaf2);
        merkleRoot = _hashPair(node1, leaf3);
    }

    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function _getMerkleProof(address player, uint256 oranges, uint256 harvests, uint256 level) 
        internal 
        view 
        returns (bytes32[] memory) 
    {
        bytes32[] memory proof = new bytes32[](2);
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(player, oranges, harvests, level))));

        if (player == player1) {
            bytes32 leaf2 = keccak256(bytes.concat(keccak256(abi.encode(player2, 2000, 20, 2))));
            proof[0] = leaf2;
            bytes32 leaf3 = keccak256(bytes.concat(keccak256(abi.encode(player3, 3000, 30, 3))));
            proof[1] = leaf3;
        } else if (player == player2) {
            bytes32 leaf1 = keccak256(bytes.concat(keccak256(abi.encode(player1, 1000, 10, 1))));
            proof[0] = leaf1;
            bytes32 leaf3 = keccak256(bytes.concat(keccak256(abi.encode(player3, 3000, 30, 3))));
            proof[1] = leaf3;
        } else if (player == player3) {
            bytes32 leaf1 = keccak256(bytes.concat(keccak256(abi.encode(player1, 1000, 10, 1))));
            bytes32 leaf2 = keccak256(bytes.concat(keccak256(abi.encode(player2, 2000, 20, 2))));
            proof[0] = _hashPair(leaf1, leaf2);
            proof[1] = bytes32(0);
        }

        return proof;
    }

    // Initialization tests

    function testInitialization() public {
        assertEq(settlement.gameRegistry(), address(gameRegistry));
        assertEq(settlement.currentSeason(), 1);
        assertEq(settlement.maxBatchSize(), 100);
        assertEq(settlement.maxValidationFailures(), 3);
    }

    function testCannotInitializeWithZeroAddress() public {
        HarvestSettlement newSettlement = new HarvestSettlement();
        
        vm.expectRevert("HarvestSettlement: zero address");
        newSettlement.initialize(address(0));
    }

    function testFirstSeasonStarted() public {
        HarvestSettlement.Season memory season = settlement.getSeason(1);
        assertEq(season.seasonId, 1);
        assertEq(season.startTime, block.timestamp);
        assertEq(season.endTime, 0);
        assertFalse(season.finalized);
    }

    // Season management tests

    function testFinalizeSeason() public {
        vm.startPrank(settler);
        
        vm.expectEmit(true, true, true, true);
        emit SeasonFinalized(1, merkleRoot, 6000, 3);
        
        settlement.finalizeSeason(merkleRoot, 6000, 3);
        vm.stopPrank();

        HarvestSettlement.Season memory season = settlement.getSeason(1);
        assertTrue(season.finalized);
        assertEq(season.merkleRoot, merkleRoot);
        assertEq(season.totalOranges, 6000);
        assertEq(season.totalPlayers, 3);
    }

    function testCannotFinalizeSeasonTwice() public {
        vm.startPrank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);
        
        vm.expectRevert("HarvestSettlement: season already finalized");
        settlement.finalizeSeason(merkleRoot, 6000, 3);
        vm.stopPrank();
    }

    function testCannotFinalizeSeasonWithoutRole() public {
        vm.prank(player1);
        vm.expectRevert();
        settlement.finalizeSeason(merkleRoot, 6000, 3);
    }

    function testStartNewSeason() public {
        vm.startPrank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);
        
        vm.expectEmit(true, true, true, false);
        emit SeasonStarted(2, block.timestamp, 0);
        
        settlement.startNewSeason();
        vm.stopPrank();

        assertEq(settlement.currentSeason(), 2);
        
        HarvestSettlement.Season memory newSeason = settlement.getSeason(2);
        assertEq(newSeason.seasonId, 2);
        assertFalse(newSeason.finalized);
    }

    function testCannotStartNewSeasonIfPreviousNotFinalized() public {
        vm.prank(settler);
        vm.expectRevert("HarvestSettlement: previous season not finalized");
        settlement.startNewSeason();
    }

    // Harvest commitment tests

    function testCommitHarvest() public {
        // Finalize season first
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory proof = _getMerkleProof(player1, 1000, 10, 1);

        vm.startPrank(player1);
        
        vm.expectEmit(true, true, true, true);
        emit HarvestCommitted(player1, 1, 1000, 10, block.timestamp);
        
        settlement.commitHarvest(1, 1000, 10, 1, proof);
        vm.stopPrank();

        assertTrue(settlement.hasClaimed(1, player1));
        assertEq(settlement.getPlayerOranges(1, player1), 1000);
    }

    function testCannotCommitHarvestWithInvalidProof() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory invalidProof = new bytes32[](2);
        invalidProof[0] = bytes32(uint256(1));
        invalidProof[1] = bytes32(uint256(2));

        vm.prank(player1);
        vm.expectRevert("HarvestSettlement: invalid proof");
        settlement.commitHarvest(1, 1000, 10, 1, invalidProof);
    }

    function testCannotCommitHarvestTwice() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory proof = _getMerkleProof(player1, 1000, 10, 1);

        vm.startPrank(player1);
        settlement.commitHarvest(1, 1000, 10, 1, proof);
        
        vm.expectRevert("HarvestSettlement: already claimed");
        settlement.commitHarvest(1, 1000, 10, 1, proof);
        vm.stopPrank();
    }

    function testCannotCommitHarvestForUnfinalizedSeason() public {
        bytes32[] memory proof = _getMerkleProof(player1, 1000, 10, 1);

        vm.prank(player1);
        vm.expectRevert("HarvestSettlement: season not finalized");
        settlement.commitHarvest(1, 1000, 10, 1, proof);
    }

    // Batch commitment tests

    function testBatchCommitHarvests() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        address[] memory players = new address[](2);
        players[0] = player1;
        players[1] = player2;

        uint256[] memory oranges = new uint256[](2);
        oranges[0] = 1000;
        oranges[1] = 2000;

        uint256[] memory harvests = new uint256[](2);
        harvests[0] = 10;
        harvests[1] = 20;

        vm.prank(settler);
        settlement.batchCommitHarvests(1, players, oranges, harvests);

        assertTrue(settlement.hasClaimed(1, player1));
        assertTrue(settlement.hasClaimed(1, player2));
        assertEq(settlement.getPlayerOranges(1, player1), 1000);
        assertEq(settlement.getPlayerOranges(1, player2), 2000);
    }

    function testCannotBatchCommitWithLengthMismatch() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        address[] memory players = new address[](2);
        uint256[] memory oranges = new uint256[](1);
        uint256[] memory harvests = new uint256[](2);

        vm.prank(settler);
        vm.expectRevert("HarvestSettlement: length mismatch");
        settlement.batchCommitHarvests(1, players, oranges, harvests);
    }

    function testCannotBatchCommitTooLarge() public {
        vm.startPrank(admin);
        settlement.updateMaxBatchSize(2);
        vm.stopPrank();

        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        address[] memory players = new address[](3);
        uint256[] memory oranges = new uint256[](3);
        uint256[] memory harvests = new uint256[](3);

        vm.prank(settler);
        vm.expectRevert("HarvestSettlement: batch too large");
        settlement.batchCommitHarvests(1, players, oranges, harvests);
    }

    function testCannotBatchCommitDuplicates() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        address[] memory players = new address[](2);
        players[0] = player1;
        players[1] = player1; // Duplicate

        uint256[] memory oranges = new uint256[](2);
        oranges[0] = 1000;
        oranges[1] = 1000;

        uint256[] memory harvests = new uint256[](2);
        harvests[0] = 10;
        harvests[1] = 10;

        vm.prank(settler);
        vm.expectRevert("HarvestSettlement: duplicate claim");
        settlement.batchCommitHarvests(1, players, oranges, harvests);
    }

    // Anti-cheat tests

    function testValidationFailureForZeroValues() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        // Create proof for zero values (would need to be in merkle tree)
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(player1);
        vm.expectRevert("HarvestSettlement: invalid harvest data");
        settlement.commitHarvest(1, 0, 0, 1, proof);
    }

    function testValidationFailureForExcessiveOranges() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        // Try to claim unrealistic amount
        bytes32[] memory proof = new bytes32[](0);

        vm.prank(player1);
        vm.expectRevert("HarvestSettlement: harvest validation failed");
        settlement.commitHarvest(1, 1000000000, 1, 1, proof);
    }

    function testValidationCooldown() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory proof = new bytes32[](0);

        vm.startPrank(player1);
        
        // First attempt
        vm.expectRevert();
        settlement.commitHarvest(1, 0, 0, 1, proof);

        // Second attempt immediately should fail cooldown
        vm.expectRevert("HarvestSettlement: validation cooldown");
        settlement.commitHarvest(1, 0, 0, 1, proof);
        
        vm.stopPrank();
    }

    function testResetValidationFailures() public {
        // Simulate validation failure
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory proof = new bytes32[](0);
        
        vm.prank(player1);
        vm.expectRevert();
        settlement.commitHarvest(1, 0, 0, 1, proof);

        (uint256 failures, , ) = settlement.getValidationStatus(player1);
        assertEq(failures, 1);

        // Reset
        vm.prank(admin);
        settlement.resetValidationFailures(player1);

        (failures, , ) = settlement.getValidationStatus(player1);
        assertEq(failures, 0);
    }

    // Rewards distribution tests

    function testMarkRewardsDistributed() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        vm.prank(settler);
        settlement.markRewardsDistributed(1);

        HarvestSettlement.Season memory season = settlement.getSeason(1);
        assertTrue(season.rewardsDistributed);
    }

    function testCannotMarkRewardsDistributedTwice() public {
        vm.startPrank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);
        settlement.markRewardsDistributed(1);

        vm.expectRevert("HarvestSettlement: rewards already distributed");
        settlement.markRewardsDistributed(1);
        vm.stopPrank();
    }

    // Admin function tests

    function testUpdateMaxBatchSize() public {
        vm.prank(admin);
        settlement.updateMaxBatchSize(200);

        assertEq(settlement.maxBatchSize(), 200);
    }

    function testCannotUpdateMaxBatchSizeToZero() public {
        vm.prank(admin);
        vm.expectRevert("HarvestSettlement: invalid batch size");
        settlement.updateMaxBatchSize(0);
    }

    function testUpdateAntiCheatParams() public {
        vm.prank(admin);
        settlement.updateAntiCheatParams(5, 2 hours);

        assertEq(settlement.maxValidationFailures(), 5);
        assertEq(settlement.validationCooldown(), 2 hours);
    }

    function testUpdateGameRegistry() public {
        address newRegistry = address(999);

        vm.prank(admin);
        settlement.updateGameRegistry(newRegistry);

        assertEq(settlement.gameRegistry(), newRegistry);
    }

    function testCannotUpdateGameRegistryToZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("HarvestSettlement: zero address");
        settlement.updateGameRegistry(address(0));
    }

    // Pause/unpause tests

    function testPauseSettlement() public {
        vm.prank(admin);
        settlement.pause();

        vm.prank(settler);
        vm.expectRevert();
        settlement.finalizeSeason(merkleRoot, 6000, 3);
    }

    function testUnpauseSettlement() public {
        vm.startPrank(admin);
        settlement.pause();
        settlement.unpause();
        vm.stopPrank();

        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);
    }

    // View function tests

    function testVerifyHarvestProof() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory proof = _getMerkleProof(player1, 1000, 10, 1);

        bool valid = settlement.verifyHarvestProof(1, player1, 1000, 10, 1, proof);
        assertTrue(valid);
    }

    function testVerifyInvalidHarvestProof() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory proof = new bytes32[](0);

        bool valid = settlement.verifyHarvestProof(1, player1, 9999, 10, 1, proof);
        assertFalse(valid);
    }

    function testGetValidationStatus() public {
        (uint256 failures, uint256 lastValidation, bool suspended) = 
            settlement.getValidationStatus(player1);

        assertEq(failures, 0);
        assertEq(lastValidation, 0);
        assertFalse(suspended);
    }

    // Upgrade tests

    function testUpgrade() public {
        HarvestSettlement newImpl = new HarvestSettlement();

        vm.prank(admin);
        settlement.upgradeToAndCall(address(newImpl), "");

        // Verify state persisted
        assertEq(settlement.currentSeason(), 1);
    }

    function testCannotUpgradeWithoutRole() public {
        HarvestSettlement newImpl = new HarvestSettlement();

        vm.prank(player1);
        vm.expectRevert();
        settlement.upgradeToAndCall(address(newImpl), "");
    }

    // Integration tests

    function testCompleteSeasonCycle() public {
        // Season 1: Finalize and commit
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory proof1 = _getMerkleProof(player1, 1000, 10, 1);
        vm.prank(player1);
        settlement.commitHarvest(1, 1000, 10, 1, proof1);

        vm.prank(settler);
        settlement.markRewardsDistributed(1);

        // Start Season 2
        vm.prank(settler);
        settlement.startNewSeason();

        assertEq(settlement.currentSeason(), 2);
        
        HarvestSettlement.Season memory season1 = settlement.getSeason(1);
        assertTrue(season1.finalized);
        assertTrue(season1.rewardsDistributed);

        HarvestSettlement.Season memory season2 = settlement.getSeason(2);
        assertFalse(season2.finalized);
    }

    function testMultiplePlayersCommit() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        // Player 1 commits
        bytes32[] memory proof1 = _getMerkleProof(player1, 1000, 10, 1);
        vm.prank(player1);
        settlement.commitHarvest(1, 1000, 10, 1, proof1);

        // Player 2 commits
        bytes32[] memory proof2 = _getMerkleProof(player2, 2000, 20, 2);
        vm.prank(player2);
        settlement.commitHarvest(1, 2000, 20, 2, proof2);

        assertTrue(settlement.hasClaimed(1, player1));
        assertTrue(settlement.hasClaimed(1, player2));
        assertEq(settlement.getPlayerOranges(1, player1), 1000);
        assertEq(settlement.getPlayerOranges(1, player2), 2000);
    }

    // Gas benchmarking

    function testGasBenchmarkCommitHarvest() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        bytes32[] memory proof = _getMerkleProof(player1, 1000, 10, 1);

        vm.startPrank(player1);
        uint256 gasBefore = gasleft();
        settlement.commitHarvest(1, 1000, 10, 1, proof);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for commit harvest", gasUsed);
        vm.stopPrank();
    }

    function testGasBenchmarkBatchCommit() public {
        vm.prank(settler);
        settlement.finalizeSeason(merkleRoot, 6000, 3);

        address[] memory players = new address[](10);
        uint256[] memory oranges = new uint256[](10);
        uint256[] memory harvests = new uint256[](10);

        for (uint256 i = 0; i < 10; i++) {
            players[i] = address(uint160(100 + i));
            oranges[i] = (i + 1) * 1000;
            harvests[i] = (i + 1) * 10;
        }

        vm.startPrank(settler);
        uint256 gasBefore = gasleft();
        settlement.batchCommitHarvests(1, players, oranges, harvests);
        uint256 gasUsed = gasBefore - gasleft();

        emit log_named_uint("Gas used for batch commit (10 players)", gasUsed);
        vm.stopPrank();
    }
}
