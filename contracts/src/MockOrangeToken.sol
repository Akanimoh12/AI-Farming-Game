// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IGameToken.sol";

/**
 * @title MockOrangeToken
 * @notice Main economy token for Orange Farm game with daily minting and starter bonus
 * @dev Implements ERC20 with UUPS upgradeable pattern
 */
contract MockOrangeToken is
    Initializable,
    ERC20Upgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IGameToken
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant STARTER_BONUS = 50 * 10 ** 18; // 50 tokens
    uint256 public constant DAILY_MINT_AMOUNT = 100 * 10 ** 18; // 100 tokens
    uint256 public constant MINT_COOLDOWN = 24 hours;

    /// @dev Mapping to track if player has received starter bonus
    mapping(address => bool) private _hasReceivedStarter;

    /// @dev Mapping to track last daily mint timestamp for each player
    mapping(address => uint256) private _lastMintTimestamp;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param admin Address that will have admin role
     */
    function initialize(address admin) public initializer {
        if (admin == address(0)) revert ZeroAddressNotAllowed();

        __ERC20_init("MockOrangeDAO", "MORANGE");
        __ERC20Pausable_init();
        __AccessControl_init();

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

        emit DailyMintClaimed(msg.sender, DAILY_MINT_AMOUNT, block.timestamp);
    }

    /**
     * @notice Check if a player can mint daily allocation
     * @param player Address to check
     * @return bool True if player can mint, false otherwise
     */
    function canMintDaily(address player) public view returns (bool) {
        uint256 lastMint = _lastMintTimestamp[player];
        return lastMint == 0 || block.timestamp >= lastMint + MINT_COOLDOWN;
    }

    /**
     * @notice Get the last mint timestamp for a player
     * @param player Address to check
     * @return uint256 Timestamp of last mint
     */
    function lastMintTimestamp(address player) external view returns (uint256) {
        return _lastMintTimestamp[player];
    }

    /**
     * @notice Check if player has received starter bonus
     * @param player Address to check
     * @return bool True if player has received starter bonus
     */
    function hasReceivedStarter(address player) external view returns (bool) {
        return _hasReceivedStarter[player];
    }

    /**
     * @notice Mint tokens to an address (admin only)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert ZeroAddressNotAllowed();
        _mint(to, amount);
    }

    /**
     * @notice Pause token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Required override for UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev Required override for ERC20Pausable
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
    {
        super._update(from, to, value);
    }

    /// @dev Storage gap for future upgrades
    uint256[50] private __gap;

    // Custom errors
    error ZeroAddressNotAllowed();
    error StarterAlreadyClaimed();
    error MintCooldownActive();
}
