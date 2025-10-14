// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MockOrangeToken
 * @notice Main economy token for Orange Farm game with daily minting and starter bonus
 * @dev Direct deployment (non-upgradeable) version
 */
contract MockOrangeToken is ERC20, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant STARTER_BONUS = 50 * 10 ** 18; // 50 tokens
    uint256 public constant DAILY_MINT_AMOUNT = 100 * 10 ** 18; // 100 tokens
    uint256 public constant MINT_COOLDOWN = 24 hours;

    /// @dev Mapping to track if player has received starter bonus
    mapping(address => bool) private _hasReceivedStarter;

    /// @dev Mapping to track last daily mint timestamp for each player
    mapping(address => uint256) private _lastMintTimestamp;

    // Events
    event PlayerRegistered(address indexed player, uint256 starterAmount);
    event DailyMintClaimed(address indexed player, uint256 amount);

    // Custom errors
    error ZeroAddressNotAllowed();
    error StarterAlreadyClaimed();
    error MintCooldownActive();

    /**
     * @notice Constructor - initializes the contract immediately
     * @param admin Address that will have admin role
     */
    constructor(address admin) ERC20("MockOrangeDAO", "MORANGE") {
        require(admin != address(0), "MockOrangeToken: admin is zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @notice Register a new player and give them starter bonus
     * @param player Address of the player to register
     */
    function registerPlayer(address player) external onlyRole(MINTER_ROLE) {
        if (player == address(0)) revert ZeroAddressNotAllowed();
        if (_hasReceivedStarter[player]) revert StarterAlreadyClaimed();

        _hasReceivedStarter[player] = true;
        _mint(player, STARTER_BONUS);

        emit PlayerRegistered(player, STARTER_BONUS);
    }

    /**
     * @notice Allows any player to mint their daily allocation
     */
    function dailyMint() external whenNotPaused {
        if (!canMintDaily(msg.sender)) revert MintCooldownActive();

        _lastMintTimestamp[msg.sender] = block.timestamp;
        _mint(msg.sender, DAILY_MINT_AMOUNT);

        emit DailyMintClaimed(msg.sender, DAILY_MINT_AMOUNT);
    }

    /**
     * @notice Mint tokens (only callable by MINTER_ROLE)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Pause all token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause all token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ VIEW FUNCTIONS ============

    function hasReceivedStarter(address player) external view returns (bool) {
        return _hasReceivedStarter[player];
    }

    function canMintDaily(address player) public view returns (bool) {
        return block.timestamp >= _lastMintTimestamp[player] + MINT_COOLDOWN;
    }

    function getLastMintTimestamp(address player) external view returns (uint256) {
        return _lastMintTimestamp[player];
    }

    function getTimeUntilNextMint(address player) external view returns (uint256) {
        if (canMintDaily(player)) return 0;
        return (_lastMintTimestamp[player] + MINT_COOLDOWN) - block.timestamp;
    }

    // ============ INTERNAL FUNCTIONS ============

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
