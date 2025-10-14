// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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
 * @dev Non-upgradeable direct deployment version with default referrer support
 */
contract GameRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant GAME_MASTER_ROLE = keccak256("GAME_MASTER_ROLE");

    // Core contracts
    address public mockOrangeToken;
    address public waterToken;
    address public landNFT;
    address public botNFT;

    // Default referrer (e.g., "FarmDAO")
    string public defaultReferrer;

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
    event DefaultReferrerUpdated(string oldReferrer, string newReferrer);

    /**
     * @notice Constructor - initializes the contract immediately
     */
    constructor(
        address admin,
        address _mockOrangeToken,
        address _landNFT,
        address _botNFT,
        address _waterToken,
        string memory _defaultReferrer
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
        defaultReferrer = _defaultReferrer;
    }

    /**
     * @notice Set the default referrer code (e.g., "FarmDAO")
     * @param _defaultReferrer New default referrer code
     */
    function setDefaultReferrer(string memory _defaultReferrer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldReferrer = defaultReferrer;
        defaultReferrer = _defaultReferrer;
        emit DefaultReferrerUpdated(oldReferrer, _defaultReferrer);
    }

    /**
     * @notice Register a new player
     * @param username Unique username
     * @param referralCode Unique referral code for this player
     * @param referredByCode Optional referral code of the referrer (uses default if empty)
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
        
        // If no referredByCode provided, use default referrer
        bool usingDefaultReferrer = false;
        if (bytes(referredByCode).length == 0 && bytes(defaultReferrer).length > 0) {
            referredByCode = defaultReferrer;
            usingDefaultReferrer = true;
        }
        
        if (bytes(referredByCode).length > 0) {
            referrer = referralCodeToWallet[referredByCode];
            // Skip validation if using default referrer (allows bootstrapping)
            if (!usingDefaultReferrer) {
                require(referrer != address(0), "GameRegistry: invalid referrer code");
                require(referrer != msg.sender, "GameRegistry: cannot refer yourself");
            }
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

        // Reward referrer
        if (referrer != address(0)) {
            referredPlayers[referrer].push(msg.sender);
            referralEarnings[referrer] += referralReward;
            IMockOrangeTokenMint(mockOrangeToken).mint(referrer, referralReward);
            emit ReferralRewarded(referrer, msg.sender, referralReward);
        }
    }

    /**
     * @notice Commit harvest for a player
     * @param player Player address
     * @param orangeAmount Amount of oranges committed
     */
    function commitHarvest(address player, uint256 orangeAmount) external onlyRole(GAME_MASTER_ROLE) {
        require(isRegistered(player), "GameRegistry: player not registered");
        
        playerStats[player].totalOrangesCommitted += orangeAmount;
        playerStats[player].lastHarvestCommit = uint64(block.timestamp);
        playerStats[player].totalHarvests++;

        emit HarvestCommitted(player, orangeAmount, uint64(block.timestamp));

        // Check for level up (every 1000 oranges = 1 level)
        uint32 newLevel = uint32((playerStats[player].totalOrangesCommitted / 1000 ether) + 1);
        if (newLevel > playerStats[player].level) {
            playerStats[player].level = newLevel;
            emit LevelUp(player, newLevel);
        }
    }

    /**
     * @notice Update starter pack configuration
     * @param _starterTokenAmount New starter token amount
     * @param _starterWaterAmount New starter water amount
     * @param _referralReward New referral reward amount
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
     * @notice Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============ VIEW FUNCTIONS ============

    function isRegistered(address player) public view returns (bool) {
        return bytes(playerProfiles[player].username).length > 0;
    }

    function isUsernameAvailable(string memory username) external view returns (bool) {
        return usernameToWallet[username] == address(0);
    }

    function isReferralCodeAvailable(string memory referralCode) external view returns (bool) {
        return referralCodeToWallet[referralCode] == address(0);
    }

    function getPlayerProfile(address player) external view returns (PlayerProfile memory) {
        return playerProfiles[player];
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }

    function getReferralData(address player) external view returns (
        address referrer,
        address[] memory referredPlayers_,
        uint256 totalRewards
    ) {
        referrer = playerProfiles[player].referredBy;
        referredPlayers_ = referredPlayers[player];
        totalRewards = referralEarnings[player];
    }

    function getReferralCount(address referrer) external view returns (uint256) {
        return referredPlayers[referrer].length;
    }

    function getLeaderboard(uint256 limit) external view returns (
        address[] memory players,
        uint256[] memory oranges,
        uint32[] memory levels
    ) {
        uint256 count = limit > totalPlayers ? totalPlayers : limit;
        players = new address[](count);
        oranges = new uint256[](count);
        levels = new uint32[](count);

        // Simple implementation - in production, use sorted data structure
        for (uint256 i = 0; i < count; i++) {
            address player = playerList[i];
            players[i] = player;
            oranges[i] = playerStats[player].totalOrangesCommitted;
            levels[i] = playerStats[player].level;
        }

        // Bubble sort (for small datasets)
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (oranges[j] > oranges[i]) {
                    // Swap
                    (players[i], players[j]) = (players[j], players[i]);
                    (oranges[i], oranges[j]) = (oranges[j], oranges[i]);
                    (levels[i], levels[j]) = (levels[j], levels[i]);
                }
            }
        }
    }

    function getPlayerRank(address player) external view returns (uint256 rank) {
        require(isRegistered(player), "GameRegistry: player not registered");
        
        uint256 playerScore = playerStats[player].totalOrangesCommitted;
        rank = 1;
        
        for (uint256 i = 0; i < totalPlayers; i++) {
            address otherPlayer = playerList[i];
            if (otherPlayer != player && playerStats[otherPlayer].totalOrangesCommitted > playerScore) {
                rank++;
            }
        }
    }
}
