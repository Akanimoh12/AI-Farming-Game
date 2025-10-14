// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface ILandNFTHarvest {
    enum LandType { Small, Medium, Large }
    function landData(uint256 tokenId) external view returns (LandType, uint8, uint8, uint64);
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IBotNFTHarvest {
    enum BotType { Basic, Advanced, Elite }
    function botData(uint256 tokenId) external view returns (
        BotType botType,
        uint16 efficiency,
        uint32 totalHarvests,
        uint64 creationTimestamp,
        uint256 assignedLandId
    );
    function ownerOf(uint256 tokenId) external view returns (address);
    function incrementHarvests(uint256 botId) external;
}

/**
 * @title RealTimeHarvest
 * @notice Manages real-time harvest operations for Orange Farm
 * @dev Direct deployment (non-upgradeable) version
 */
contract RealTimeHarvest is AccessControl, Pausable {
    bytes32 public constant GAME_MASTER_ROLE = keccak256("GAME_MASTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct PendingHarvest {
        uint256 landId;
        uint256 botId;
        uint256 estimatedAmount;
        uint64 startTime;
        uint64 duration;
        bool active;
    }

    uint64 public harvestCycleDuration;
    mapping(uint256 => PendingHarvest) public pendingHarvests;

    address public landNFT;
    address public botNFT;

    event HarvestStarted(uint256 indexed landId, uint256 indexed botId, uint256 estimatedAmount, uint64 readyAt);
    event HarvestCompleted(uint256 indexed landId, address indexed player, uint256 amount);
    event HarvestCancelled(uint256 indexed landId);
    event HarvestCycleDurationUpdated(uint64 oldDuration, uint64 newDuration);

    /**
     * @notice Constructor - initializes the contract immediately
     * @param admin Address of the admin
     * @param _landNFT LandNFT contract address
     * @param _botNFT BotNFT contract address
     * @param _harvestCycleDuration Duration of harvest cycle in seconds
     */
    constructor(
        address admin,
        address _landNFT,
        address _botNFT,
        uint64 _harvestCycleDuration
    ) {
        require(admin != address(0), "RealTimeHarvest: admin is zero address");
        require(_landNFT != address(0), "RealTimeHarvest: landNFT is zero address");
        require(_botNFT != address(0), "RealTimeHarvest: botNFT is zero address");
        require(_harvestCycleDuration > 0, "RealTimeHarvest: invalid duration");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GAME_MASTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        landNFT = _landNFT;
        botNFT = _botNFT;
        harvestCycleDuration = _harvestCycleDuration;
    }

    /**
     * @notice Start a harvest operation
     * @param landId Land token ID
     * @param botId Bot token ID assigned to the land
     */
    function startHarvest(uint256 landId, uint256 botId) external whenNotPaused {
        address landOwner = ILandNFTHarvest(landNFT).ownerOf(landId);
        address botOwner = IBotNFTHarvest(botNFT).ownerOf(botId);
        
        require(landOwner == msg.sender || hasRole(GAME_MASTER_ROLE, msg.sender), "RealTimeHarvest: not authorized");
        require(landOwner == botOwner, "RealTimeHarvest: bot and land different owners");
        require(!pendingHarvests[landId].active, "RealTimeHarvest: harvest already active");
        
        uint256 estimatedAmount = calculateHarvestAmount(landId, botId);

        pendingHarvests[landId] = PendingHarvest({
            landId: landId,
            botId: botId,
            estimatedAmount: estimatedAmount,
            startTime: uint64(block.timestamp),
            duration: harvestCycleDuration,
            active: true
        });

        emit HarvestStarted(landId, botId, estimatedAmount, uint64(block.timestamp) + harvestCycleDuration);
    }

    /**
     * @notice Complete a harvest and mark as inactive
     */
    function completeHarvest(uint256 landId) external whenNotPaused returns (uint256 harvestAmount) {
        PendingHarvest storage harvest = pendingHarvests[landId];
        require(harvest.active, "RealTimeHarvest: no active harvest");
        require(block.timestamp >= harvest.startTime + harvest.duration, "RealTimeHarvest: harvest not ready");

        address landOwner = ILandNFTHarvest(landNFT).ownerOf(landId);
        require(landOwner == msg.sender || hasRole(GAME_MASTER_ROLE, msg.sender), "RealTimeHarvest: not authorized");

        harvestAmount = harvest.estimatedAmount;
        harvest.active = false;

        // Increment bot harvest count
        IBotNFTHarvest(botNFT).incrementHarvests(harvest.botId);

        emit HarvestCompleted(landId, landOwner, harvestAmount);
        
        return harvestAmount;
    }

    /**
     * @notice Cancel an active harvest
     */
    function cancelHarvest(uint256 landId) external whenNotPaused {
        address landOwner = ILandNFTHarvest(landNFT).ownerOf(landId);
        require(landOwner == msg.sender || hasRole(GAME_MASTER_ROLE, msg.sender), "RealTimeHarvest: not authorized");
        require(pendingHarvests[landId].active, "RealTimeHarvest: no active harvest");

        pendingHarvests[landId].active = false;

        emit HarvestCancelled(landId);
    }

    /**
     * @notice Get pending harvest information
     */
    function getPendingHarvest(uint256 landId) external view returns (
        uint256 amount, 
        uint64 readyAt, 
        bool isReady,
        bool isActive
    ) {
        PendingHarvest memory harvest = pendingHarvests[landId];
        if (!harvest.active) return (0, 0, false, false);

        amount = harvest.estimatedAmount;
        readyAt = harvest.startTime + harvest.duration;
        isReady = block.timestamp >= readyAt;
        isActive = harvest.active;
    }

    /**
     * @notice Calculate harvest amount for a land and bot combination
     */
    function calculateHarvestAmount(uint256 landId, uint256 botId) public view returns (uint256 estimatedAmount) {
        (
            ,
            uint16 efficiency,
            ,
            ,
            uint256 assignedLandId
        ) = IBotNFTHarvest(botNFT).botData(botId);
        
        require(assignedLandId == landId || assignedLandId == 0, "RealTimeHarvest: bot assigned to different land");

        (ILandNFTHarvest.LandType landType, , ,) = ILandNFTHarvest(landNFT).landData(landId);

        // Base harvest amount per cycle
        uint256 baseHarvest = 10 ether; // 10 oranges base
        
        // Land multipliers
        uint256 landMultiplier = 100;
        if (landType == ILandNFTHarvest.LandType.Medium) landMultiplier = 150;
        else if (landType == ILandNFTHarvest.LandType.Large) landMultiplier = 200;

        // Apply both land and bot efficiency
        // efficiency is stored as percentage (100 = 100%, 150 = 150%)
        estimatedAmount = (baseHarvest * landMultiplier * efficiency) / 10000;
    }

    /**
     * @notice Batch get pending harvests for multiple lands
     */
    function getBatchPendingHarvests(uint256[] calldata landIds) external view returns (
        uint256[] memory amounts,
        uint64[] memory readyTimes,
        bool[] memory statuses,
        bool[] memory actives
    ) {
        amounts = new uint256[](landIds.length);
        readyTimes = new uint64[](landIds.length);
        statuses = new bool[](landIds.length);
        actives = new bool[](landIds.length);

        for (uint256 i = 0; i < landIds.length; i++) {
            (amounts[i], readyTimes[i], statuses[i], actives[i]) = this.getPendingHarvest(landIds[i]);
        }
    }

    /**
     * @notice Check if harvest is ready for a land
     */
    function isHarvestReady(uint256 landId) external view returns (bool) {
        PendingHarvest memory harvest = pendingHarvests[landId];
        if (!harvest.active) return false;
        return block.timestamp >= harvest.startTime + harvest.duration;
    }

    /**
     * @notice Get time remaining until harvest is ready
     */
    function getTimeRemaining(uint256 landId) external view returns (uint256) {
        PendingHarvest memory harvest = pendingHarvests[landId];
        if (!harvest.active) return 0;
        
        uint64 readyAt = harvest.startTime + harvest.duration;
        if (block.timestamp >= readyAt) return 0;
        
        return readyAt - block.timestamp;
    }

    /**
     * @notice Update harvest cycle duration
     */
    function setHarvestCycleDuration(uint64 newDuration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDuration > 0 && newDuration <= 86400, "RealTimeHarvest: invalid duration");
        uint64 oldDuration = harvestCycleDuration;
        harvestCycleDuration = newDuration;
        emit HarvestCycleDurationUpdated(oldDuration, newDuration);
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
}
