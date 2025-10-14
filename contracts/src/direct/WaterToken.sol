// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title WaterToken
 * @notice Water resource token for Orange Farm - required for watering plants
 * @dev Direct deployment (non-upgradeable) version
 */
contract WaterToken is ERC20, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public constant INITIAL_SUPPLY = 100 * 10 ** 18; // 100 water tokens per player

    // Events
    event WaterMinted(address indexed to, uint256 amount);
    event WaterBurned(address indexed from, uint256 amount);

    /**
     * @notice Constructor - initializes the contract immediately
     * @param admin Address that will have admin role
     */
    constructor(address admin) ERC20("Water Token", "WATER") {
        require(admin != address(0), "WaterToken: admin is zero address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
    }

    /**
     * @notice Mint water tokens
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "WaterToken: mint to zero address");
        _mint(to, amount);
        emit WaterMinted(to, amount);
    }

    /**
     * @notice Burn water tokens from an address (for watering plants)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(
        address from,
        uint256 amount
    ) external onlyRole(BURNER_ROLE) whenNotPaused {
        require(from != address(0), "WaterToken: burn from zero address");
        _burn(from, amount);
        emit WaterBurned(from, amount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit WaterBurned(msg.sender, amount);
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

    // ============ INTERNAL FUNCTIONS ============

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
