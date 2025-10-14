// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/HelloWorld.sol";

contract DeployHelloWorld is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying HelloWorld...");
        HelloWorld hello = new HelloWorld();
        
        console.log("HelloWorld deployed at:", address(hello));
        console.log("Message:", hello.message());

        vm.stopBroadcast();
    }
}
