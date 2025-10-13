// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IGameToken.sol";

/**
 * @title WaterToken
 * @notice Consumable resource token for Orange Farm game with 0 decimals
 * @dev Implements ERC20 with UUPS upgradeable pattern
 */
contract WaterToken is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IGameToken
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

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

        __ERC20_init("WaterToken", "WATER");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(CONSUMER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @notice Override decimals to return 0 (whole units only)
     * @return uint8 Number of decimals (0)
     */
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    /**
     * @notice Mint water tokens to an address
     * @param to Address to mint to
     * @param amount Amount to mint (in whole units)
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        if (to == address(0)) revert ZeroAddressNotAllowed();
        if (amount == 0) revert ZeroAmountNotAllowed();

        _mint(to, amount);
        emit WaterPurchased(to, amount);
    }

    /**
     * @notice Batch mint water tokens to multiple addresses
     * @param recipients Array of addresses to mint to
     * @param amounts Array of amounts to mint
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts)
        external
        onlyRole(MINTER_ROLE)
        whenNotPaused
    {
        if (recipients.length != amounts.length) revert ArrayLengthMismatch();
        if (recipients.length == 0) revert EmptyArray();

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddressNotAllowed();
            _mint(recipients[i], amounts[i]);
            emit WaterPurchased(recipients[i], amounts[i]);
        }
    }

    /**
     * @notice Consume (burn) water tokens from a player's balance
     * @dev Called by game contracts when water is used
     * @param from Address to consume from
     * @param amount Amount to consume
     */
    function consume(address from, uint256 amount) external onlyRole(CONSUMER_ROLE) whenNotPaused {
        if (from == address(0)) revert ZeroAddressNotAllowed();
        if (amount == 0) revert ZeroAmountNotAllowed();

        _burn(from, amount);
        emit WaterConsumed(from, amount);
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
     * @notice Check if daily minting is available (always returns false for WaterToken)
     * @dev Implemented for interface compatibility
     * @return bool Always returns false
     */
    function canMintDaily(address) external pure returns (bool) {
        return false;
    }

    /**
     * @notice Get last mint timestamp (always returns 0 for WaterToken)
     * @dev Implemented for interface compatibility
     * @return uint256 Always returns 0
     */
    function lastMintTimestamp(address) external pure returns (uint256) {
        return 0;
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
    error ZeroAmountNotAllowed();
    error ArrayLengthMismatch();
    error EmptyArray();
}
