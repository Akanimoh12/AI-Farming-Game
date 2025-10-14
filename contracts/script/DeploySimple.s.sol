// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MockOrangeToken.sol";

contract DeploySimple is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Just deploy the implementation without proxy
        console.log("Deploying MockOrangeToken implementation...");
        MockOrangeToken token = new MockOrangeToken();
        
        console.log("MockOrangeToken deployed at:", address(token));

        vm.stopBroadcast();
    }
}
