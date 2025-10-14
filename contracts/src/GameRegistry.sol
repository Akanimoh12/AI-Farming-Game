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

    struct PlayerProfile {
        string username;
        string referralCode;
        address referredBy;
        uint64 registrationTimestamp;
        bool hasClaimedStarter;
    }

    struct PlayerStats {
        uint256 totalOrangesCommitted;
        uint32 level;
        uint64 lastHarvestCommit;
        uint64 totalHarvests;
    }

    mapping(address => PlayerProfile) public playerProfiles;
    mapping(address => PlayerStats) public playerStats;
    mapping(string => address) public usernameToWallet;
    mapping(string => address) public referralCodeToWallet;
    
    uint256 public totalPlayers;
    address[] private playerAddresses;
    mapping(address => address[]) private _referredPlayers;
    mapping(address => uint256) private _referralRewards;

    address public mockOrangeToken;
    address public landNFT;
    address public botNFT;
    address public waterToken;

    uint256 public starterTokenAmount;
    uint256 public starterWaterAmount;
    uint256 public referralReward;
    event PlayerRegistered(address indexed player, string username, string referralCode, address indexed referredBy);
    event StarterPackClaimed(address indexed player, uint256 landId, uint256 botId, uint256 tokenAmount, uint256 waterAmount);
    event ReferralRewarded(address indexed referrer, address indexed referee, uint256 rewardAmount);
    event HarvestCommitted(address indexed player, uint256 orangeAmount, uint64 timestamp);
    event LevelUp(address indexed player, uint32 newLevel);

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

        starterTokenAmount = 50e18;
        starterWaterAmount = 50;
        referralReward = 25e18;
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

        playerProfiles[msg.sender] = PlayerProfile({
            username: username,
            referralCode: referralCode,
            referredBy: referrer,
            registrationTimestamp: uint64(block.timestamp),
            hasClaimedStarter: false
        });

        playerStats[msg.sender] = PlayerStats({
            totalOrangesCommitted: 0,
            level: 1,
            lastHarvestCommit: 0,
            totalHarvests: 0
        });

        usernameToWallet[username] = msg.sender;
        referralCodeToWallet[referralCode] = msg.sender;

        playerAddresses.push(msg.sender);
        totalPlayers++;

        if (referrer != address(0)) {
            _referredPlayers[referrer].push(msg.sender);
        }

        emit PlayerRegistered(msg.sender, username, referralCode, referrer);
        _claimStarterPack(msg.sender, referrer);
    }
    
    /**
     * @notice Internal function to distribute starter pack
     * @param player Player address
     * @param referrer Referrer address (can be zero)
     */
    function _claimStarterPack(address player, address referrer) private {
        require(!playerProfiles[player].hasClaimedStarter, "GameRegistry: starter already claimed");

        uint256 landId = ILandNFTMint(landNFT).mint(player, ILandNFTMint.LandType.Small);
        uint256 botId = IBotNFTMint(botNFT).mint(player, IBotNFTMint.BotType.Basic);
        
        IMockOrangeTokenMint(mockOrangeToken).mint(player, starterTokenAmount);
        IWaterTokenMint(waterToken).mint(player, starterWaterAmount);

        playerProfiles[player].hasClaimedStarter = true;

        emit StarterPackClaimed(player, landId, botId, starterTokenAmount, starterWaterAmount);

        if (referrer != address(0)) {
            IMockOrangeTokenMint(mockOrangeToken).mint(referrer, referralReward);
            IMockOrangeTokenMint(mockOrangeToken).mint(player, referralReward);
            _referralRewards[referrer] += referralReward;
            emit ReferralRewarded(referrer, player, referralReward);
        }
    }

    /**
     * @notice Commit harvested oranges to on-chain stats
     * @param player Player address
     * @param orangeAmount Amount of oranges harvested
     */
    function commitHarvest(address player, uint256 orangeAmount) external onlyRole(GAME_MASTER_ROLE) {
        require(playerProfiles[player].registrationTimestamp > 0, "GameRegistry: player not registered");

        PlayerStats storage stats = playerStats[player];
        stats.totalOrangesCommitted += orangeAmount;
        stats.lastHarvestCommit = uint64(block.timestamp);
        stats.totalHarvests++;

        emit HarvestCommitted(player, orangeAmount, uint64(block.timestamp));

        uint32 newLevel = uint32(stats.totalOrangesCommitted / 1000) + 1;
        if (newLevel > stats.level) {
            stats.level = newLevel;
            emit LevelUp(player, newLevel);
        }
    }

    function getPlayerProfile(address player) external view returns (PlayerProfile memory) {
        return playerProfiles[player];
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function isUsernameAvailable(string memory username) external view returns (bool) {
        return usernameToWallet[username] == address(0);
    }

    function isReferralCodeAvailable(string memory referralCode) external view returns (bool) {
        return referralCodeToWallet[referralCode] == address(0);
    }

    function isRegistered(address player) external view returns (bool) {
        return playerProfiles[player].registrationTimestamp > 0;
    }

    function getReferralCount(address referrer) external view returns (uint256) {
        return _referredPlayers[referrer].length;
    }

    /**
     * @notice Get leaderboard top players sorted by total oranges
     */
    function getLeaderboard(uint256 limit) external view returns (address[] memory players, uint256[] memory oranges, uint32[] memory levels) {
        require(limit > 0 && limit <= 100, "GameRegistry: invalid limit");
        
        uint256 count = limit > totalPlayers ? totalPlayers : limit;
        
        address[] memory allPlayers = new address[](totalPlayers);
        uint256[] memory allOranges = new uint256[](totalPlayers);
        uint32[] memory allLevels = new uint32[](totalPlayers);
        
        for (uint256 i = 0; i < totalPlayers; i++) {
            address player = playerAddresses[i];
            allPlayers[i] = player;
            allOranges[i] = playerStats[player].totalOrangesCommitted;
            allLevels[i] = playerStats[player].level;
        }
        
        for (uint256 i = 0; i < totalPlayers; i++) {
            for (uint256 j = i + 1; j < totalPlayers; j++) {
                if (allOranges[i] < allOranges[j]) {
                    (allOranges[i], allOranges[j]) = (allOranges[j], allOranges[i]);
                    (allPlayers[i], allPlayers[j]) = (allPlayers[j], allPlayers[i]);
                    (allLevels[i], allLevels[j]) = (allLevels[j], allLevels[i]);
                }
            }
        }
        
        players = new address[](count);
        oranges = new uint256[](count);
        levels = new uint32[](count);
        
        for (uint256 i = 0; i < count; i++) {
            players[i] = allPlayers[i];
            oranges[i] = allOranges[i];
            levels[i] = allLevels[i];
        }
        
        return (players, oranges, levels);
    }

    /**
     * @notice Get player's rank on the leaderboard
     */
    function getPlayerRank(address player) external view returns (uint256 rank) {
        if (playerProfiles[player].registrationTimestamp == 0) {
            return 0;
        }
        
        uint256 playerOranges = playerStats[player].totalOrangesCommitted;
        uint256 betterPlayers = 0;
        
        for (uint256 i = 0; i < totalPlayers; i++) {
            address otherPlayer = playerAddresses[i];
            if (playerStats[otherPlayer].totalOrangesCommitted > playerOranges) {
                betterPlayers++;
            }
        }
        
        return betterPlayers + 1;
    }

    /**
     * @notice Get referral information for a player
     */
    function getReferralData(address player) external view returns (address referrer, address[] memory referredPlayers, uint256 totalRewards) {
        PlayerProfile memory profile = playerProfiles[player];
        referrer = profile.referredBy;
        referredPlayers = _referredPlayers[player];
        totalRewards = _referralRewards[player];
        
        return (referrer, referredPlayers, totalRewards);
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
