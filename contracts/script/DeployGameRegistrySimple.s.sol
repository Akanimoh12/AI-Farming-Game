// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GameRegistrySimple.sol";

contract DeployGameRegistrySimple is Script {
    function run() external {
        address admin = 0x58C25c26666B31241C67Cf7B9a82e325eB07c342;
        address mockOrangeToken = 0xD128e5A2D5a2c442037246D465e1fAa3eC7559e4;
        address landNFT = 0x5ccCcd17B5b860ba35dcca9779Fe5fE914026503;
        address botNFT = 0x50e70D689aF3AA347241285F8EdBABb6988A3d6A;
        address waterToken = 0x62aDa07320E2F593af5483e1260b5B102Cf82692;

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        GameRegistry gameRegistry = new GameRegistry(
            admin,
            mockOrangeToken,
            landNFT,
            botNFT,
            waterToken
        );

        vm.stopBroadcast();

        console.log("GameRegistry deployed at:", address(gameRegistry));
    }
}
