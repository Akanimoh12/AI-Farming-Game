// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
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
 * @dev Non-upgradeable version - simple deployment without proxies
 */
contract GameRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GAME_MASTER_ROLE = keccak256("GAME_MASTER_ROLE");

    // Core contracts
    address public mockOrangeToken;
    address public waterToken;
    address public landNFT;
    address public botNFT;

    // Configuration
    uint256 public starterTokenAmount = 50 ether; // 50 tokens
    uint256 public starterWaterAmount = 100 ether; // 100 water
    uint256 public referralReward = 25 ether; // 25 tokens

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

    // Mappings
    mapping(address => PlayerProfile) public playerProfiles;
    mapping(address => PlayerStats) public playerStats;
    mapping(string => address) public usernameToWallet;
    mapping(string => address) public referralCodeToWallet;
    mapping(address => address[]) public referredPlayers;
    mapping(address => uint256) public referralEarnings;
    
    address[] public playerList;
    uint256 public totalPlayers;

    // Events
    event PlayerRegistered(address indexed player, string username, string referralCode, address indexed referredBy);
    event StarterPackClaimed(address indexed player, uint256 landId, uint256 botId, uint256 tokenAmount, uint256 waterAmount);
    event HarvestCommitted(address indexed player, uint256 orangeAmount, uint64 timestamp);
    event LevelUp(address indexed player, uint32 newLevel);
    event ReferralRewarded(address indexed referrer, address indexed referee, uint256 rewardAmount);

    /**
     * @notice Constructor - initializes the contract immediately
     */
    constructor(
        address admin,
        address _mockOrangeToken,
        address _landNFT,
        address _botNFT,
        address _waterToken
    ) {
        require(admin != address(0), "GameRegistry: admin is zero address");
        require(_mockOrangeToken != address(0), "GameRegistry: token is zero address");
        require(_landNFT != address(0), "GameRegistry: land is zero address");
        require(_botNFT != address(0), "GameRegistry: bot is zero address");
        require(_waterToken != address(0), "GameRegistry: water is zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(GAME_MASTER_ROLE, admin);

        mockOrangeToken = _mockOrangeToken;
        waterToken = _waterToken;
        landNFT = _landNFT;
        botNFT = _botNFT;
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
        require(bytes(username).length <= 20, "GameRegistry: username too long");
        require(bytes(playerProfiles[msg.sender].username).length == 0, "GameRegistry: already registered");
        require(bytes(referralCode).length > 0, "GameRegistry: referral code empty");
        require(bytes(referralCode).length <= 16, "GameRegistry: referral code too long");
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
        
        playerList.push(msg.sender);
        totalPlayers++;

        emit PlayerRegistered(msg.sender, username, referralCode, referrer);

        // Auto-claim starter pack
        if (!playerProfiles[msg.sender].hasClaimedStarter) {
            _claimStarterPack(referrer);
        }
    }

    /**
     * @notice Internal function to claim starter pack
     */
    function _claimStarterPack(address referrer) internal {
        playerProfiles[msg.sender].hasClaimedStarter = true;

        // Mint Land NFT
        uint256 landId = ILandNFTMint(landNFT).mint(msg.sender, ILandNFTMint.LandType.Small);

        // Mint Bot NFT
        uint256 botId = IBotNFTMint(botNFT).mint(msg.sender, IBotNFTMint.BotType.Basic);

        // Mint Water tokens
        IWaterTokenMint(waterToken).mint(msg.sender, starterWaterAmount);

        // Mint Orange tokens
        IMockOrangeTokenMint(mockOrangeToken).mint(msg.sender, starterTokenAmount);

        emit StarterPackClaimed(msg.sender, landId, botId, starterTokenAmount, starterWaterAmount);

        // Handle referral rewards
        if (referrer != address(0)) {
            referredPlayers[referrer].push(msg.sender);
            IMockOrangeTokenMint(mockOrangeToken).mint(referrer, referralReward);
            referralEarnings[referrer] += referralReward;
            emit ReferralRewarded(referrer, msg.sender, referralReward);
        }
    }

    /**
     * @notice Commit harvested oranges to on-chain stats
     * @param player Player address
     * @param orangeAmount Amount of oranges harvested
     */
    function commitHarvest(address player, uint256 orangeAmount) external onlyRole(GAME_MASTER_ROLE) {
        require(bytes(playerProfiles[player].username).length > 0, "GameRegistry: player not registered");

        PlayerStats storage stats = playerStats[player];
        stats.totalOrangesCommitted += orangeAmount;
        stats.lastHarvestCommit = uint64(block.timestamp);
        stats.totalHarvests++;

        // Level up logic (every 1000 oranges = 1 level)
        uint32 newLevel = uint32(stats.totalOrangesCommitted / 1000) + 1;
        if (newLevel > stats.level) {
            stats.level = newLevel;
            emit LevelUp(player, newLevel);
        }

        emit HarvestCommitted(player, orangeAmount, uint64(block.timestamp));
    }

    /**
     * @notice Get leaderboard top players sorted by total oranges
     */
    function getLeaderboard(uint256 limit) external view returns (
        address[] memory players,
        uint256[] memory oranges,
        uint32[] memory levels
    ) {
        require(limit > 0 && limit <= 100, "GameRegistry: invalid limit");
        
        uint256 count = totalPlayers < limit ? totalPlayers : limit;
        players = new address[](count);
        oranges = new uint256[](count);
        levels = new uint32[](count);

        // Simple insertion sort for top players
        for (uint256 i = 0; i < totalPlayers && i < limit; i++) {
            address player = playerList[i];
            uint256 playerOranges = playerStats[player].totalOrangesCommitted;
            uint32 playerLevel = playerStats[player].level;

            uint256 insertPos = i;
            for (uint256 j = 0; j < i; j++) {
                if (playerOranges > oranges[j]) {
                    insertPos = j;
                    break;
                }
            }

            for (uint256 k = i; k > insertPos; k--) {
                players[k] = players[k - 1];
                oranges[k] = oranges[k - 1];
                levels[k] = levels[k - 1];
            }

            players[insertPos] = player;
            oranges[insertPos] = playerOranges;
            levels[insertPos] = playerLevel;
        }

        return (players, oranges, levels);
    }

    /**
     * @notice Get player's rank on the leaderboard
     */
    function getPlayerRank(address player) external view returns (uint256 rank) {
        require(bytes(playerProfiles[player].username).length > 0, "GameRegistry: player not registered");

        uint256 playerOranges = playerStats[player].totalOrangesCommitted;
        rank = 1;

        for (uint256 i = 0; i < totalPlayers; i++) {
            address currentPlayer = playerList[i];
            if (currentPlayer != player && playerStats[currentPlayer].totalOrangesCommitted > playerOranges) {
                rank++;
            }
        }

        return rank;
    }

    /**
     * @notice Get referral information for a player
     */
    function getReferralData(address player) external view returns (
        address referrer,
        address[] memory referredPlayers_,
        uint256 totalRewards
    ) {
        referrer = playerProfiles[player].referredBy;
        referredPlayers_ = referredPlayers[player];
        totalRewards = referralEarnings[player];
    }

    function getPlayerProfile(address player) external view returns (PlayerProfile memory) {
        return playerProfiles[player];
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function isRegistered(address player) external view returns (bool) {
        return bytes(playerProfiles[player].username).length > 0;
    }

    function isUsernameAvailable(string memory username) external view returns (bool) {
        return usernameToWallet[username] == address(0);
    }

    function isReferralCodeAvailable(string memory referralCode) external view returns (bool) {
        return referralCodeToWallet[referralCode] == address(0);
    }

    function getReferralCount(address referrer) external view returns (uint256) {
        return referredPlayers[referrer].length;
    }

    /**
     * @notice Update starter pack configuration
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
}
