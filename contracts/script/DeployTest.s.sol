// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MockOrangeToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployOneContract
 * @notice Test deployment of single contract to diagnose issues
 */
contract DeployOneContract is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockOrangeToken implementation
        console.log("Deploying implementation...");
        MockOrangeToken implementation = new MockOrangeToken();
        console.log("Implementation deployed at:", address(implementation));

        // Deploy proxy
        console.log("Deploying proxy...");
        bytes memory initData = abi.encodeWithSelector(
            MockOrangeToken.initialize.selector,
            deployer
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        
        console.log("Proxy deployed at:", address(proxy));

        vm.stopBroadcast();

        console.log("\nSUCCESS!");
        console.log("MockOrangeToken proxy:", address(proxy));
    }
}
