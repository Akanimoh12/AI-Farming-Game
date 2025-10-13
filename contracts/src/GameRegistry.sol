// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./interfaces/IGameToken.sol";

interface ILandNFTMint {
    enum LandType { Small, Medium, Large }
    function mint(address to, LandType landType) external returns (uint256);
}

interface IBotNFTMint {
    enum BotType { Basic, Advanced, Elite }
    function mint(address to, BotType botType) external returns (uint256);
}

interface IWaterTokenMint {
    function mint(address to, uint256 amount) external;
}

interface IMockOrangeTokenMint {
    function mint(address to, uint256 amount) external;
}

/**
 * @title GameRegistry
 * @notice Central registry for Orange Farm player management and onboarding
 * @dev Handles registration, referrals, starter packs, and player stats
 */
contract GameRegistry is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GAME_MASTER_ROLE = keccak256("GAME_MASTER_ROLE");

    /// @notice Player profile data
    struct PlayerProfile {
        string username;
        string referralCode;
        address referredBy;
        uint64 registrationTimestamp;
        bool hasClaimedStarter;
    }

    /// @notice Player on-chain stats
    struct PlayerStats {
        uint256 totalOrangesCommitted;
        uint32 level;
        uint64 lastHarvestCommit;
        uint64 totalHarvests;
    }

    /// @notice Mapping from wallet to player profile
    mapping(address => PlayerProfile) public playerProfiles;

    /// @notice Mapping from wallet to player stats
    mapping(address => PlayerStats) public playerStats;

    /// @notice Mapping from username to wallet (for uniqueness check)
    mapping(string => address) public usernameToWallet;

    /// @notice Mapping from referral code to wallet
    mapping(string => address) public referralCodeToWallet;

    /// @notice Total registered players
    uint256 public totalPlayers;

    /// @notice Contract references
    address public mockOrangeToken;
    address public landNFT;
    address public botNFT;
    address public waterToken;

    /// @notice Starter pack configuration
    uint256 public starterTokenAmount;
    uint256 public starterWaterAmount;
    uint256 public referralReward;

    /// @notice Events
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

    event HarvestCommitted(
        address indexed player,
        uint256 orangeAmount,
        uint64 timestamp
    );

    event LevelUp(
        address indexed player,
        uint32 newLevel
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param admin Address of the admin
     * @param _mockOrangeToken MockOrangeToken contract address
     * @param _landNFT LandNFT contract address
     * @param _botNFT BotNFT contract address
     * @param _waterToken WaterToken contract address
     */
    function initialize(
        address admin,
        address _mockOrangeToken,
        address _landNFT,
        address _botNFT,
        address _waterToken
    ) public initializer {
        require(admin != address(0), "GameRegistry: admin is zero address");
        require(_mockOrangeToken != address(0), "GameRegistry: token is zero address");
        require(_landNFT != address(0), "GameRegistry: land is zero address");
        require(_botNFT != address(0), "GameRegistry: bot is zero address");
        require(_waterToken != address(0), "GameRegistry: water is zero address");

        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(GAME_MASTER_ROLE, admin);

        mockOrangeToken = _mockOrangeToken;
        landNFT = _landNFT;
        botNFT = _botNFT;
        waterToken = _waterToken;

        // Default starter pack configuration
        starterTokenAmount = 50e18;  // 50 MockOrangeDAO tokens
        starterWaterAmount = 50;      // 50 water units (0 decimals)
        referralReward = 25e18;       // 25 MockOrangeDAO tokens
    }

    /**
     * @notice Register a new player
     * @param username Unique username
     * @param referralCode Unique referral code for this player
     * @param referredByCode Optional referral code of the referrer
     */
    function register(
        string memory username,
        string memory referralCode,
        string memory referredByCode
    ) external whenNotPaused {
        require(bytes(username).length > 0, "GameRegistry: username empty");
        require(bytes(username).length <= 32, "GameRegistry: username too long");
        require(bytes(referralCode).length > 0, "GameRegistry: referral code empty");
        require(bytes(referralCode).length <= 16, "GameRegistry: referral code too long");
        require(
            playerProfiles[msg.sender].registrationTimestamp == 0,
            "GameRegistry: already registered"
        );
        require(
            usernameToWallet[username] == address(0),
            "GameRegistry: username taken"
        );
        require(
            referralCodeToWallet[referralCode] == address(0),
            "GameRegistry: referral code taken"
        );

        address referrer = address(0);
        if (bytes(referredByCode).length > 0) {
            referrer = referralCodeToWallet[referredByCode];
            require(referrer != address(0), "GameRegistry: invalid referrer code");
            require(referrer != msg.sender, "GameRegistry: cannot refer yourself");
        }

        // Create player profile
        playerProfiles[msg.sender] = PlayerProfile({
            username: username,
            referralCode: referralCode,
            referredBy: referrer,
            registrationTimestamp: uint64(block.timestamp),
            hasClaimedStarter: false
        });

        // Initialize player stats
        playerStats[msg.sender] = PlayerStats({
            totalOrangesCommitted: 0,
            level: 1,
            lastHarvestCommit: 0,
            totalHarvests: 0
        });

        // Register username and referral code
        usernameToWallet[username] = msg.sender;
        referralCodeToWallet[referralCode] = msg.sender;

        totalPlayers++;

        emit PlayerRegistered(msg.sender, username, referralCode, referrer);

        // Automatically claim starter pack
        _claimStarterPack(msg.sender, referrer);
    }

    /**
     * @notice Internal function to distribute starter pack
     * @param player Player address
     * @param referrer Referrer address (can be zero)
     */
    function _claimStarterPack(address player, address referrer) private {
        require(
            !playerProfiles[player].hasClaimedStarter,
            "GameRegistry: starter already claimed"
        );

        // Mint starter assets
        uint256 landId = ILandNFTMint(landNFT).mint(player, ILandNFTMint.LandType.Small);
        uint256 botId = IBotNFTMint(botNFT).mint(player, IBotNFTMint.BotType.Basic);
        
        // Mint tokens and water
        IMockOrangeTokenMint(mockOrangeToken).mint(player, starterTokenAmount);
        IWaterTokenMint(waterToken).mint(player, starterWaterAmount);

        // Mark as claimed
        playerProfiles[player].hasClaimedStarter = true;

        emit StarterPackClaimed(player, landId, botId, starterTokenAmount, starterWaterAmount);

        // Process referral rewards
        if (referrer != address(0)) {
            // Reward both referrer and referee
            IMockOrangeTokenMint(mockOrangeToken).mint(referrer, referralReward);
            IMockOrangeTokenMint(mockOrangeToken).mint(player, referralReward);

            emit ReferralRewarded(referrer, player, referralReward);
        }
    }

    /**
     * @notice Commit harvested oranges to on-chain stats
     * @param player Player address
     * @param orangeAmount Amount of oranges harvested
     */
    function commitHarvest(
        address player,
        uint256 orangeAmount
    ) external onlyRole(GAME_MASTER_ROLE) {
        require(
            playerProfiles[player].registrationTimestamp > 0,
            "GameRegistry: player not registered"
        );

        PlayerStats storage stats = playerStats[player];
        stats.totalOrangesCommitted += orangeAmount;
        stats.lastHarvestCommit = uint64(block.timestamp);
        stats.totalHarvests++;

        emit HarvestCommitted(player, orangeAmount, uint64(block.timestamp));

        // Check for level up (every 1000 oranges = 1 level)
        uint32 newLevel = uint32(stats.totalOrangesCommitted / 1000) + 1;
        if (newLevel > stats.level) {
            stats.level = newLevel;
            emit LevelUp(player, newLevel);
        }
    }

    /**
     * @notice Get player profile
     * @param player Player address
     * @return Player profile data
     */
    function getPlayerProfile(address player) external view returns (PlayerProfile memory) {
        return playerProfiles[player];
    }

    /**
     * @notice Get player stats
     * @param player Player address
     * @return Player stats data
     */
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    /**
     * @notice Check if username is available
     * @param username Username to check
     * @return True if available
     */
    function isUsernameAvailable(string memory username) external view returns (bool) {
        return usernameToWallet[username] == address(0);
    }

    /**
     * @notice Check if referral code is available
     * @param referralCode Referral code to check
     * @return True if available
     */
    function isReferralCodeAvailable(string memory referralCode) external view returns (bool) {
        return referralCodeToWallet[referralCode] == address(0);
    }

    /**
     * @notice Check if player is registered
     * @param player Player address
     * @return True if registered
     */
    function isRegistered(address player) external view returns (bool) {
        return playerProfiles[player].registrationTimestamp > 0;
    }

    /**
     * @notice Get referral count for a player
     * @param referrer Referrer address
     * @return Count of players referred
     */
    function getReferralCount(address referrer) external view returns (uint256) {
        uint256 count = 0;
        // Note: This is a simple implementation. For production, consider maintaining
        // a separate mapping for efficiency
        return count;
    }

    /**
     * @notice Update starter pack configuration
     * @param _starterTokenAmount Token amount in starter pack
     * @param _starterWaterAmount Water amount in starter pack
     * @param _referralReward Reward for referrals
     */
    function updateStarterPackConfig(
        uint256 _starterTokenAmount,
        uint256 _starterWaterAmount,
        uint256 _referralReward
    ) external onlyRole(ADMIN_ROLE) {
        starterTokenAmount = _starterTokenAmount;
        starterWaterAmount = _starterWaterAmount;
        referralReward = _referralReward;
    }

    /**
     * @notice Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Override for UUPS upgrades
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev Storage gap for future upgrades
     */
    uint256[50] private __gap;
}
