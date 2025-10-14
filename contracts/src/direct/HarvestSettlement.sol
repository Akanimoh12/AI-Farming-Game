// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGameRegistrySettlement {
    function commitHarvest(address player, uint256 orangeAmount) external;
    function isRegistered(address player) external view returns (bool);
}

/**
 * @title HarvestSettlement
 * @notice Simplified harvest settlement for MVP - direct commitment without complex validation
 * @dev Direct deployment (non-upgradeable) version - future seasons can be added later
 */
contract HarvestSettlement is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SETTLER_ROLE = keccak256("SETTLER_ROLE");

    // Structs
    struct HarvestRecord {
        uint256 totalOranges;
        uint256 totalHarvests;
        uint256 lastCommitTime;
    }

    // State variables
    address public gameRegistry;
    
    // Player harvest tracking
    mapping(address => HarvestRecord) public playerHarvests;
    mapping(address => uint256) public lastCommitTime;
    
    // Anti-spam protection
    uint256 public commitCooldown;
    uint256 public maxHarvestPerCommit;
    
    // Statistics
    uint256 public totalCommits;
    uint256 public totalOrangesSettled;
    
    // Events
    event HarvestCommitted(
        address indexed player,
        uint256 orangeAmount,
        uint256 totalOranges,
        uint256 timestamp
    );

    event BatchHarvestCommitted(
        uint256 playerCount,
        uint256 totalOranges,
        uint256 timestamp
    );

    event CommitCooldownUpdated(uint256 oldCooldown, uint256 newCooldown);
    event MaxHarvestUpdated(uint256 oldMax, uint256 newMax);

    /**
     * @notice Constructor - initializes the settlement contract
     * @param admin Address of the admin
     * @param _gameRegistry Address of GameRegistry contract
     */
    constructor(
        address admin,
        address _gameRegistry
    ) {
        require(admin != address(0), "HarvestSettlement: admin is zero address");
        require(_gameRegistry != address(0), "HarvestSettlement: gameRegistry is zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(SETTLER_ROLE, admin);

        gameRegistry = _gameRegistry;
        commitCooldown = 60; // 1 minute cooldown
        maxHarvestPerCommit = 1000 ether; // 1000 oranges max per commit
    }

    /**
     * @notice Commit harvest for a player (called by authorized settlers)
     * @param player Player address
     * @param orangeAmount Amount of oranges to commit
     */
    function commitHarvest(
        address player,
        uint256 orangeAmount
    ) external onlyRole(SETTLER_ROLE) whenNotPaused nonReentrant {
        require(player != address(0), "HarvestSettlement: zero address");
        require(orangeAmount > 0, "HarvestSettlement: zero amount");
        require(orangeAmount <= maxHarvestPerCommit, "HarvestSettlement: amount too large");
        require(
            IGameRegistrySettlement(gameRegistry).isRegistered(player),
            "HarvestSettlement: player not registered"
        );

        // Check cooldown
        require(
            block.timestamp >= lastCommitTime[player] + commitCooldown,
            "HarvestSettlement: cooldown active"
        );

        // Update player record
        HarvestRecord storage record = playerHarvests[player];
        record.totalOranges += orangeAmount;
        record.totalHarvests++;
        record.lastCommitTime = block.timestamp;
        
        lastCommitTime[player] = block.timestamp;

        // Update global stats
        totalCommits++;
        totalOrangesSettled += orangeAmount;

        // Commit to GameRegistry
        IGameRegistrySettlement(gameRegistry).commitHarvest(player, orangeAmount);

        emit HarvestCommitted(
            player,
            orangeAmount,
            record.totalOranges,
            block.timestamp
        );
    }

    /**
     * @notice Batch commit harvests for multiple players (gas optimization)
     * @param players Array of player addresses
     * @param orangeAmounts Array of orange amounts
     */
    function batchCommitHarvests(
        address[] calldata players,
        uint256[] calldata orangeAmounts
    ) external onlyRole(SETTLER_ROLE) whenNotPaused nonReentrant {
        require(players.length == orangeAmounts.length, "HarvestSettlement: length mismatch");
        require(players.length > 0, "HarvestSettlement: empty batch");
        require(players.length <= 100, "HarvestSettlement: batch too large");

        uint256 batchTotal = 0;

        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            uint256 amount = orangeAmounts[i];

            require(player != address(0), "HarvestSettlement: zero address");
            require(amount > 0 && amount <= maxHarvestPerCommit, "HarvestSettlement: invalid amount");
            require(
                IGameRegistrySettlement(gameRegistry).isRegistered(player),
                "HarvestSettlement: player not registered"
            );

            // Skip if on cooldown
            if (block.timestamp < lastCommitTime[player] + commitCooldown) {
                continue;
            }

            // Update player record
            HarvestRecord storage record = playerHarvests[player];
            record.totalOranges += amount;
            record.totalHarvests++;
            record.lastCommitTime = block.timestamp;
            
            lastCommitTime[player] = block.timestamp;
            batchTotal += amount;

            // Commit to GameRegistry
            IGameRegistrySettlement(gameRegistry).commitHarvest(player, amount);
        }

        // Update global stats
        totalCommits += players.length;
        totalOrangesSettled += batchTotal;

        emit BatchHarvestCommitted(
            players.length,
            batchTotal,
            block.timestamp
        );
    }

    /**
     * @notice Allow player to self-commit their harvest (with stricter limits)
     * @param orangeAmount Amount of oranges to commit
     */
    function selfCommitHarvest(
        uint256 orangeAmount
    ) external whenNotPaused nonReentrant {
        require(orangeAmount > 0, "HarvestSettlement: zero amount");
        require(orangeAmount <= maxHarvestPerCommit / 10, "HarvestSettlement: amount too large for self-commit");
        require(
            IGameRegistrySettlement(gameRegistry).isRegistered(msg.sender),
            "HarvestSettlement: not registered"
        );

        // Stricter cooldown for self-commits
        require(
            block.timestamp >= lastCommitTime[msg.sender] + (commitCooldown * 10),
            "HarvestSettlement: cooldown active"
        );

        // Update player record
        HarvestRecord storage record = playerHarvests[msg.sender];
        record.totalOranges += orangeAmount;
        record.totalHarvests++;
        record.lastCommitTime = block.timestamp;
        
        lastCommitTime[msg.sender] = block.timestamp;

        // Update global stats
        totalCommits++;
        totalOrangesSettled += orangeAmount;

        // Commit to GameRegistry
        IGameRegistrySettlement(gameRegistry).commitHarvest(msg.sender, orangeAmount);

        emit HarvestCommitted(
            msg.sender,
            orangeAmount,
            record.totalOranges,
            block.timestamp
        );
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Update commit cooldown
     */
    function setCommitCooldown(uint256 newCooldown) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newCooldown > 0, "HarvestSettlement: invalid cooldown");
        uint256 oldCooldown = commitCooldown;
        commitCooldown = newCooldown;
        emit CommitCooldownUpdated(oldCooldown, newCooldown);
    }

    /**
     * @notice Update max harvest per commit
     */
    function setMaxHarvestPerCommit(uint256 newMax) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newMax > 0, "HarvestSettlement: invalid max");
        uint256 oldMax = maxHarvestPerCommit;
        maxHarvestPerCommit = newMax;
        emit MaxHarvestUpdated(oldMax, newMax);
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Get player harvest record
     */
    function getPlayerRecord(address player) 
        external 
        view 
        returns (
            uint256 totalOranges,
            uint256 totalHarvests,
            uint256 lastCommit,
            bool canCommit
        ) 
    {
        HarvestRecord memory record = playerHarvests[player];
        totalOranges = record.totalOranges;
        totalHarvests = record.totalHarvests;
        lastCommit = record.lastCommitTime;
        canCommit = block.timestamp >= lastCommitTime[player] + commitCooldown;
    }

    /**
     * @notice Check if player can commit
     */
    function canCommit(address player) external view returns (bool) {
        return block.timestamp >= lastCommitTime[player] + commitCooldown;
    }

    /**
     * @notice Get time until next commit allowed
     */
    function getTimeUntilNextCommit(address player) external view returns (uint256) {
        uint256 nextCommitTime = lastCommitTime[player] + commitCooldown;
        if (block.timestamp >= nextCommitTime) {
            return 0;
        }
        return nextCommitTime - block.timestamp;
    }

    /**
     * @notice Get global statistics
     */
    function getGlobalStats() 
        external 
        view 
        returns (
            uint256 commits,
            uint256 orangesSettled
        ) 
    {
        commits = totalCommits;
        orangesSettled = totalOrangesSettled;
    }
}
