// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IGameToken
 * @notice Interface for game token events and common functions
 */
interface IGameToken {
    /// @notice Emitted when a player is registered
    event PlayerRegistered(address indexed player, uint256 amount);

    /// @notice Emitted when daily mint is claimed
    event DailyMintClaimed(address indexed player, uint256 amount, uint256 timestamp);

    /// @notice Emitted when water tokens are purchased
    event WaterPurchased(address indexed player, uint256 amount);

    /// @notice Emitted when water tokens are consumed
    event WaterConsumed(address indexed player, uint256 amount);
}
