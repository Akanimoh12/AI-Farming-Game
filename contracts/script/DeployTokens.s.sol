// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MockOrangeToken.sol";
import "../src/WaterToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployTokens
 * @notice Deployment script for MockOrangeToken and WaterToken with UUPS proxies
 * @dev Run with: forge script script/DeployTokens.s.sol:DeployTokens --rpc-url <RPC_URL> --broadcast
 */
contract DeployTokens is Script {
    // Deployed contract addresses
    MockOrangeToken public orangeToken;
    WaterToken public waterToken;

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockOrangeToken
        console.log("\n=== Deploying MockOrangeToken ===");
        (address orangeTokenProxy, address orangeTokenImpl) = deployMockOrangeToken(deployer);
        orangeToken = MockOrangeToken(orangeTokenProxy);

        // Deploy WaterToken
        console.log("\n=== Deploying WaterToken ===");
        (address waterTokenProxy, address waterTokenImpl) = deployWaterToken(deployer);
        waterToken = WaterToken(waterTokenProxy);

        vm.stopBroadcast();

        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("MockOrangeToken Implementation:", orangeTokenImpl);
        console.log("MockOrangeToken Proxy:", orangeTokenProxy);
        console.log("WaterToken Implementation:", waterTokenImpl);
        console.log("WaterToken Proxy:", waterTokenProxy);
        console.log("\nAdmin address:", deployer);

        // Save deployment addresses to file
        string memory deploymentInfo = string.concat(
            "{\n",
            '  "network": "', getNetwork(), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "mockOrangeToken": {\n',
            '    "implementation": "', vm.toString(orangeTokenImpl), '",\n',
            '    "proxy": "', vm.toString(orangeTokenProxy), '"\n',
            '  },\n',
            '  "waterToken": {\n',
            '    "implementation": "', vm.toString(waterTokenImpl), '",\n',
            '    "proxy": "', vm.toString(waterTokenProxy), '"\n',
            '  },\n',
            '  "timestamp": ', vm.toString(block.timestamp), '\n',
            "}\n"
        );

        string memory filename = string.concat("deployments/", getNetwork(), "-deployment.json");
        vm.writeFile(filename, deploymentInfo);
        console.log("\nDeployment info saved to:", filename);

        // Verify contracts on-chain
        console.log("\n=== VERIFICATION COMMANDS ===");
        console.log("Verify MockOrangeToken implementation:");
        console.log(
            string.concat("forge verify-contract ", vm.toString(orangeTokenImpl), " src/MockOrangeToken.sol:MockOrangeToken --chain-id ", vm.toString(block.chainid))
        );
        console.log("\nVerify WaterToken implementation:");
        console.log(
            string.concat("forge verify-contract ", vm.toString(waterTokenImpl), " src/WaterToken.sol:WaterToken --chain-id ", vm.toString(block.chainid))
        );
    }

    function deployMockOrangeToken(address admin) internal returns (address proxy, address implementation) {
        // Deploy implementation
        implementation = address(new MockOrangeToken());
        console.log("MockOrangeToken implementation deployed at:", implementation);

        // Deploy proxy
        proxy = address(
            new ERC1967Proxy(
                implementation,
                abi.encodeWithSelector(MockOrangeToken.initialize.selector, admin)
            )
        );
        console.log("MockOrangeToken proxy deployed at:", proxy);

        // Verify initialization
        MockOrangeToken token = MockOrangeToken(proxy);
        require(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin), "Admin role not granted");
        console.log("MockOrangeToken initialized successfully");
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Decimals:", token.decimals());

        return (proxy, implementation);
    }

    function deployWaterToken(address admin) internal returns (address proxy, address implementation) {
        // Deploy implementation
        implementation = address(new WaterToken());
        console.log("WaterToken implementation deployed at:", implementation);

        // Deploy proxy
        proxy = address(
            new ERC1967Proxy(
                implementation,
                abi.encodeWithSelector(WaterToken.initialize.selector, admin)
            )
        );
        console.log("WaterToken proxy deployed at:", proxy);

        // Verify initialization
        WaterToken token = WaterToken(proxy);
        require(token.hasRole(token.DEFAULT_ADMIN_ROLE(), admin), "Admin role not granted");
        console.log("WaterToken initialized successfully");
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Decimals:", token.decimals());

        return (proxy, implementation);
    }

    function getNetwork() internal view returns (string memory) {
        uint256 chainId = block.chainid;

        if (chainId == 1) return "mainnet";
        if (chainId == 5) return "goerli";
        if (chainId == 11155111) return "sepolia";
        if (chainId == 50311) return "somnia-testnet";
        if (chainId == 31337) return "localhost";

        return string.concat("chain-", vm.toString(chainId));
    }
}
