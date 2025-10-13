// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HarvestSettlement
 * @notice Batch processing and verification of Firebase-calculated harvests
 * @dev Optional future implementation for seasonal competitions and leaderboard rewards
 */
contract HarvestSettlement is 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuard,
    UUPSUpgradeable 
{
    // Roles
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");

    // Structs
    struct Season {
        uint256 seasonId;
        uint256 startTime;
        uint256 endTime;
        bytes32 merkleRoot;
        uint256 totalOranges;
        uint256 totalPlayers;
        bool finalized;
        bool rewardsDistributed;
    }

    struct PlayerHarvest {
        address player;
        uint256 oranges;
        uint256 harvests;
        uint256 level;
    }

    // State variables
    uint256 public currentSeason;
    mapping(uint256 => Season) public seasons;
    mapping(uint256 => mapping(address => bool)) public seasonClaims;
    mapping(uint256 => mapping(address => uint256)) public seasonOranges;
    
    // Anti-cheat validation
    mapping(address => uint256) public lastValidationTime;
    mapping(address => uint256) public validationFailures;
    uint256 public maxValidationFailures;
    uint256 public validationCooldown;

    // Batch processing
    uint256 public maxBatchSize;
    
    // Contract addresses
    address public gameRegistry;

    // Events
    event SeasonStarted(
        uint256 indexed seasonId,
        uint256 startTime,
        uint256 endTime
    );

    event SeasonFinalized(
        uint256 indexed seasonId,
        bytes32 merkleRoot,
        uint256 totalOranges,
        uint256 totalPlayers
    );

    event HarvestCommitted(
        address indexed player,
        uint256 indexed seasonId,
        uint256 oranges,
        uint256 harvests,
        uint256 timestamp
    );

    event BatchHarvestCommitted(
        uint256 indexed seasonId,
        uint256 playerCount,
        uint256 totalOranges,
        uint256 timestamp
    );

    event RewardsDistributed(
        uint256 indexed seasonId,
        uint256 playerCount,
        uint256 timestamp
    );

    event ValidationFailed(
        address indexed player,
        uint256 indexed seasonId,
        string reason,
        uint256 timestamp
    );

    event PlayerSuspended(
        address indexed player,
        uint256 failureCount,
        uint256 timestamp
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the settlement contract
     * @param _gameRegistry Address of GameRegistry contract
     */
    function initialize(address _gameRegistry) public initializer {
        require(_gameRegistry != address(0), "HarvestSettlement: zero address");

        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(SETTLER_ROLE, msg.sender);

        gameRegistry = _gameRegistry;
        currentSeason = 1;
        maxBatchSize = 100;
        maxValidationFailures = 3;
        validationCooldown = 1 hours;

        // Initialize first season
        seasons[currentSeason] = Season({
            seasonId: currentSeason,
            startTime: block.timestamp,
            endTime: 0,
            merkleRoot: bytes32(0),
            totalOranges: 0,
            totalPlayers: 0,
            finalized: false,
            rewardsDistributed: false
        });

        emit SeasonStarted(currentSeason, block.timestamp, 0);
    }

    /**
     * @notice Commit single harvest with Merkle proof verification
     * @param seasonId Season identifier
     * @param oranges Total oranges earned
     * @param harvests Number of harvest cycles
     * @param level Player level
     * @param merkleProof Merkle proof for verification
     */
    function commitHarvest(
        uint256 seasonId,
        uint256 oranges,
        uint256 harvests,
        uint256 level,
        bytes32[] calldata merkleProof
    ) external whenNotPaused nonReentrant {
        Season storage season = seasons[seasonId];
        require(season.finalized, "HarvestSettlement: season not finalized");
        require(!seasonClaims[seasonId][msg.sender], "HarvestSettlement: already claimed");

        // Verify Merkle proof
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, oranges, harvests, level))));
        require(
            MerkleProof.verify(merkleProof, season.merkleRoot, leaf),
            "HarvestSettlement: invalid proof"
        );

        // Anti-cheat validation
        _validateHarvest(msg.sender, seasonId, oranges, harvests);

        // Mark as claimed
        seasonClaims[seasonId][msg.sender] = true;
        seasonOranges[seasonId][msg.sender] = oranges;

        emit HarvestCommitted(
            msg.sender,
            seasonId,
            oranges,
            harvests,
            block.timestamp
        );
    }

    /**
     * @notice Batch commit harvests (admin only)
     * @param seasonId Season identifier
     * @param players Array of player addresses
     * @param oranges Array of orange amounts
     * @param harvests Array of harvest counts
     */
    function batchCommitHarvests(
        uint256 seasonId,
        address[] calldata players,
        uint256[] calldata oranges,
        uint256[] calldata harvests
    ) external onlyRole(SETTLER_ROLE) whenNotPaused nonReentrant {
        require(players.length == oranges.length, "HarvestSettlement: length mismatch");
        require(players.length == harvests.length, "HarvestSettlement: length mismatch");
        require(players.length <= maxBatchSize, "HarvestSettlement: batch too large");

        Season storage season = seasons[seasonId];
        require(season.finalized, "HarvestSettlement: season not finalized");

        uint256 totalOrangesInBatch = 0;

        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            require(player != address(0), "HarvestSettlement: zero address");
            require(!seasonClaims[seasonId][player], "HarvestSettlement: duplicate claim");

            seasonClaims[seasonId][player] = true;
            seasonOranges[seasonId][player] = oranges[i];
            totalOrangesInBatch += oranges[i];
        }

        emit BatchHarvestCommitted(
            seasonId,
            players.length,
            totalOrangesInBatch,
            block.timestamp
        );
    }

    /**
     * @notice Finalize current season and set Merkle root
     * @param merkleRoot Merkle root of all player harvests
     * @param totalOranges Total oranges in season
     * @param totalPlayers Total players in season
     */
    function finalizeSeason(
        bytes32 merkleRoot,
        uint256 totalOranges,
        uint256 totalPlayers
    ) external onlyRole(SETTLER_ROLE) whenNotPaused {
        Season storage season = seasons[currentSeason];
        require(!season.finalized, "HarvestSettlement: season already finalized");

        season.endTime = block.timestamp;
        season.merkleRoot = merkleRoot;
        season.totalOranges = totalOranges;
        season.totalPlayers = totalPlayers;
        season.finalized = true;

        emit SeasonFinalized(
            currentSeason,
            merkleRoot,
            totalOranges,
            totalPlayers
        );
    }

    /**
     * @notice Start new season
     */
    function startNewSeason() external onlyRole(SETTLER_ROLE) whenNotPaused {
        Season storage prevSeason = seasons[currentSeason];
        require(prevSeason.finalized, "HarvestSettlement: previous season not finalized");

        currentSeason++;

        seasons[currentSeason] = Season({
            seasonId: currentSeason,
            startTime: block.timestamp,
            endTime: 0,
            merkleRoot: bytes32(0),
            totalOranges: 0,
            totalPlayers: 0,
            finalized: false,
            rewardsDistributed: false
        });

        emit SeasonStarted(currentSeason, block.timestamp, 0);
    }

    /**
     * @notice Mark season rewards as distributed
     * @param seasonId Season identifier
     */
    function markRewardsDistributed(uint256 seasonId) 
        external 
        onlyRole(SETTLER_ROLE) 
    {
        Season storage season = seasons[seasonId];
        require(season.finalized, "HarvestSettlement: season not finalized");
        require(!season.rewardsDistributed, "HarvestSettlement: rewards already distributed");

        season.rewardsDistributed = true;

        emit RewardsDistributed(
            seasonId,
            season.totalPlayers,
            block.timestamp
        );
    }

    // Anti-cheat functions

    /**
     * @notice Validate harvest against on-chain state
     * @dev Internal function to prevent cheating
     */
    function _validateHarvest(
        address player,
        uint256 seasonId,
        uint256 oranges,
        uint256 harvests
    ) internal {
        // Check validation cooldown
        require(
            block.timestamp >= lastValidationTime[player] + validationCooldown,
            "HarvestSettlement: validation cooldown"
        );

        // Basic sanity checks
        if (oranges == 0 || harvests == 0) {
            _recordValidationFailure(player, seasonId, "zero values");
            revert("HarvestSettlement: invalid harvest data");
        }

        // Check if harvest rate is reasonable (max 50 oranges per cycle for Elite bot)
        uint256 maxPossibleOranges = harvests * 50 * 10; // Assume max 10 elite bots
        if (oranges > maxPossibleOranges) {
            _recordValidationFailure(player, seasonId, "excessive oranges");
            revert("HarvestSettlement: harvest validation failed");
        }

        lastValidationTime[player] = block.timestamp;
    }

    /**
     * @notice Record validation failure and suspend if necessary
     */
    function _recordValidationFailure(
        address player,
        uint256 seasonId,
        string memory reason
    ) internal {
        validationFailures[player]++;

        emit ValidationFailed(player, seasonId, reason, block.timestamp);

        if (validationFailures[player] >= maxValidationFailures) {
            emit PlayerSuspended(
                player,
                validationFailures[player],
                block.timestamp
            );
        }
    }

    /**
     * @notice Reset validation failures for a player (admin only)
     * @param player Player address
     */
    function resetValidationFailures(address player) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        validationFailures[player] = 0;
    }

    // Admin functions

    /**
     * @notice Update max batch size
     * @param size New batch size
     */
    function updateMaxBatchSize(uint256 size) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(size > 0, "HarvestSettlement: invalid batch size");
        maxBatchSize = size;
    }

    /**
     * @notice Update anti-cheat parameters
     * @param failures Max failures before suspension
     * @param cooldown Cooldown between validations
     */
    function updateAntiCheatParams(uint256 failures, uint256 cooldown) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(failures > 0, "HarvestSettlement: invalid failures");
        require(cooldown > 0, "HarvestSettlement: invalid cooldown");
        maxValidationFailures = failures;
        validationCooldown = cooldown;
    }

    /**
     * @notice Update game registry address
     * @param _gameRegistry New registry address
     */
    function updateGameRegistry(address _gameRegistry) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_gameRegistry != address(0), "HarvestSettlement: zero address");
        gameRegistry = _gameRegistry;
    }

    /**
     * @notice Pause settlement operations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause settlement operations
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // View functions

    /**
     * @notice Get season details
     * @param seasonId Season identifier
     */
    function getSeason(uint256 seasonId) external view returns (Season memory) {
        return seasons[seasonId];
    }

    /**
     * @notice Check if player claimed for season
     * @param seasonId Season identifier
     * @param player Player address
     */
    function hasClaimed(uint256 seasonId, address player) external view returns (bool) {
        return seasonClaims[seasonId][player];
    }

    /**
     * @notice Get player oranges for season
     * @param seasonId Season identifier
     * @param player Player address
     */
    function getPlayerOranges(uint256 seasonId, address player) 
        external 
        view 
        returns (uint256) 
    {
        return seasonOranges[seasonId][player];
    }

    /**
     * @notice Get player validation status
     * @param player Player address
     */
    function getValidationStatus(address player) 
        external 
        view 
        returns (uint256 failures, uint256 lastValidation, bool suspended) 
    {
        failures = validationFailures[player];
        lastValidation = lastValidationTime[player];
        suspended = failures >= maxValidationFailures;
    }

    /**
     * @notice Verify Merkle proof for a harvest claim
     * @param seasonId Season identifier
     * @param player Player address
     * @param oranges Orange amount
     * @param harvests Harvest count
     * @param level Player level
     * @param merkleProof Merkle proof
     */
    function verifyHarvestProof(
        uint256 seasonId,
        address player,
        uint256 oranges,
        uint256 harvests,
        uint256 level,
        bytes32[] calldata merkleProof
    ) external view returns (bool) {
        Season storage season = seasons[seasonId];
        if (!season.finalized) return false;

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(player, oranges, harvests, level))));
        return MerkleProof.verify(merkleProof, season.merkleRoot, leaf);
    }

    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {}

    uint256[50] private __gap;
}
