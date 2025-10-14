// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface ILandNFTHarvest {
    enum LandType { Small, Medium, Large }
    function landData(uint256 tokenId) external view returns (LandType, uint8, uint8, uint64);
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IBotNFTHarvest {
    enum BotType { Basic, Advanced, Elite }
    function botData(uint256 tokenId) external view returns (
        BotType botType,
        uint16 harvestRate,
        uint8 waterConsumption,
        uint256 assignedLandId,
        bool isActive,
        uint64 totalHarvests,
        uint64 creationTimestamp
    );
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title RealTimeHarvest
 * @notice Manages real-time harvest operations for Orange Farm MVP
 */
contract RealTimeHarvest is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
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
    address public gameRegistry;

    event HarvestStarted(uint256 indexed landId, uint256 indexed botId, uint256 estimatedAmount, uint64 readyAt);
    event HarvestCompleted(uint256 indexed landId, address indexed player, uint256 amount);
    event HarvestCancelled(uint256 indexed landId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param admin Address of the admin
     * @param _landNFT LandNFT contract address
     * @param _botNFT BotNFT contract address
     * @param _gameRegistry GameRegistry contract address
     */
    function initialize(
        address admin,
        address _landNFT,
        address _botNFT,
        address _gameRegistry
    ) public initializer {
        require(admin != address(0), "RealTimeHarvest: admin is zero address");
        require(_landNFT != address(0), "RealTimeHarvest: landNFT is zero address");
        require(_botNFT != address(0), "RealTimeHarvest: botNFT is zero address");
        require(_gameRegistry != address(0), "RealTimeHarvest: gameRegistry is zero address");

        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GAME_MASTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        landNFT = _landNFT;
        botNFT = _botNFT;
        gameRegistry = _gameRegistry;
        harvestCycleDuration = 600;
    }

    /**
     * @notice Start a harvest operation
     * @param landId Land token ID
     * @param botId Bot token ID assigned to the land
     */
    function startHarvest(uint256 landId, uint256 botId) external onlyRole(GAME_MASTER_ROLE) whenNotPaused {
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
    function completeHarvest(uint256 landId) external onlyRole(GAME_MASTER_ROLE) whenNotPaused {
        PendingHarvest storage harvest = pendingHarvests[landId];
        require(harvest.active, "RealTimeHarvest: no active harvest");
        require(block.timestamp >= harvest.startTime + harvest.duration, "RealTimeHarvest: harvest not ready");

        address landOwner = ILandNFTHarvest(landNFT).ownerOf(landId);
        harvest.active = false;

        emit HarvestCompleted(landId, landOwner, harvest.estimatedAmount);
    }

    /**
     * @notice Cancel an active harvest
     */
    function cancelHarvest(uint256 landId) external onlyRole(GAME_MASTER_ROLE) whenNotPaused {
        require(pendingHarvests[landId].active, "RealTimeHarvest: no active harvest");

        pendingHarvests[landId].active = false;

        emit HarvestCancelled(landId);
    }

    /**
     * @notice Get pending harvest information
     */
    function getPendingHarvest(uint256 landId) external view returns (uint256 amount, uint64 readyAt, bool isReady) {
        PendingHarvest memory harvest = pendingHarvests[landId];
        if (!harvest.active) return (0, 0, false);

        amount = harvest.estimatedAmount;
        readyAt = harvest.startTime + harvest.duration;
        isReady = block.timestamp >= readyAt;
    }

    /**
     * @notice Calculate harvest amount for a land and bot combination
     */
    function calculateHarvestAmount(uint256 landId, uint256 botId) public view returns (uint256 estimatedAmount) {
        (, uint16 harvestRate, , uint256 assignedLandId, bool isActive, ,) = IBotNFTHarvest(botNFT).botData(botId);
        require(isActive, "RealTimeHarvest: bot not active");
        require(assignedLandId == landId, "RealTimeHarvest: bot not assigned to this land");

        (ILandNFTHarvest.LandType landType, , ,) = ILandNFTHarvest(landNFT).landData(landId);

        uint256 landMultiplier = 100;
        if (landType == ILandNFTHarvest.LandType.Medium) landMultiplier = 125;
        else if (landType == ILandNFTHarvest.LandType.Large) landMultiplier = 150;

        estimatedAmount = (harvestRate * landMultiplier * 1e18) / 100;
    }

    /**
     * @notice Batch get pending harvests for multiple lands
     */
    function getBatchPendingHarvests(uint256[] calldata landIds) external view returns (
        uint256[] memory amounts,
        uint64[] memory readyTimes,
        bool[] memory statuses
    ) {
        amounts = new uint256[](landIds.length);
        readyTimes = new uint64[](landIds.length);
        statuses = new bool[](landIds.length);

        for (uint256 i = 0; i < landIds.length; i++) {
            (amounts[i], readyTimes[i], statuses[i]) = this.getPendingHarvest(landIds[i]);
        }
    }

    function setHarvestCycleDuration(uint64 newDuration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newDuration > 0 && newDuration <= 86400, "RealTimeHarvest: invalid duration");
        harvestCycleDuration = newDuration;
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    uint256[50] private __gap;
}
