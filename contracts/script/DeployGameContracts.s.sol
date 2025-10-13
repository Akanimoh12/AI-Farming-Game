// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MockOrangeToken.sol";
import "../src/WaterToken.sol";
import "../src/LandNFT.sol";
import "../src/BotNFT.sol";
import "../src/GameRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployGameContracts
 * @notice Comprehensive deployment script for all Orange Farm contracts
 * @dev Deploys contracts in correct order with proper initialization and role setup
 */
contract DeployGameContracts is Script {
    // Contract addresses will be stored here
    address public mockOrangeTokenProxy;
    address public waterTokenProxy;
    address public landNFTProxy;
    address public botNFTProxy;
    address public gameRegistryProxy;

    // Configuration
    string constant BASE_URI = "ipfs://QmYourActualCID/";
    uint256 constant LAND_EXPANSION_COST = 10e18; // 10 MockOrangeDAO tokens

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // ============================================
        // 1. Deploy MockOrangeToken
        // ============================================
        console.log("\n1. Deploying MockOrangeToken...");
        MockOrangeToken tokenImplementation = new MockOrangeToken();
        console.log("MockOrangeToken implementation:", address(tokenImplementation));

        bytes memory tokenInitData = abi.encodeWithSelector(
            MockOrangeToken.initialize.selector,
            deployer
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(
            address(tokenImplementation),
            tokenInitData
        );
        mockOrangeTokenProxy = address(tokenProxy);
        console.log("MockOrangeToken proxy:", mockOrangeTokenProxy);

        // ============================================
        // 2. Deploy WaterToken
        // ============================================
        console.log("\n2. Deploying WaterToken...");
        WaterToken waterImplementation = new WaterToken();
        console.log("WaterToken implementation:", address(waterImplementation));

        bytes memory waterInitData = abi.encodeWithSelector(
            WaterToken.initialize.selector,
            deployer
        );
        ERC1967Proxy waterProxy = new ERC1967Proxy(
            address(waterImplementation),
            waterInitData
        );
        waterTokenProxy = address(waterProxy);
        console.log("WaterToken proxy:", waterTokenProxy);

        // ============================================
        // 3. Deploy LandNFT
        // ============================================
        console.log("\n3. Deploying LandNFT...");
        LandNFT landImplementation = new LandNFT();
        console.log("LandNFT implementation:", address(landImplementation));

        bytes memory landInitData = abi.encodeWithSelector(
            LandNFT.initialize.selector,
            deployer,
            BASE_URI,
            mockOrangeTokenProxy,
            LAND_EXPANSION_COST
        );
        ERC1967Proxy landProxy = new ERC1967Proxy(
            address(landImplementation),
            landInitData
        );
        landNFTProxy = address(landProxy);
        console.log("LandNFT proxy:", landNFTProxy);

        // ============================================
        // 4. Deploy BotNFT
        // ============================================
        console.log("\n4. Deploying BotNFT...");
        BotNFT botImplementation = new BotNFT();
        console.log("BotNFT implementation:", address(botImplementation));

        bytes memory botInitData = abi.encodeWithSelector(
            BotNFT.initialize.selector,
            deployer,
            BASE_URI,
            mockOrangeTokenProxy,
            landNFTProxy
        );
        ERC1967Proxy botProxy = new ERC1967Proxy(
            address(botImplementation),
            botInitData
        );
        botNFTProxy = address(botProxy);
        console.log("BotNFT proxy:", botNFTProxy);

        // ============================================
        // 5. Deploy GameRegistry
        // ============================================
        console.log("\n5. Deploying GameRegistry...");
        GameRegistry registryImplementation = new GameRegistry();
        console.log("GameRegistry implementation:", address(registryImplementation));

        bytes memory registryInitData = abi.encodeWithSelector(
            GameRegistry.initialize.selector,
            deployer,
            mockOrangeTokenProxy,
            landNFTProxy,
            botNFTProxy,
            waterTokenProxy
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(
            address(registryImplementation),
            registryInitData
        );
        gameRegistryProxy = address(registryProxy);
        console.log("GameRegistry proxy:", gameRegistryProxy);

        // ============================================
        // 6. Setup Roles
        // ============================================
        console.log("\n6. Setting up roles...");
        
        MockOrangeToken token = MockOrangeToken(mockOrangeTokenProxy);
        WaterToken water = WaterToken(waterTokenProxy);
        LandNFT land = LandNFT(landNFTProxy);
        BotNFT bot = BotNFT(botNFTProxy);

        // Grant MINTER_ROLE to GameRegistry for all mintable contracts
        token.grantRole(token.MINTER_ROLE(), gameRegistryProxy);
        water.grantRole(water.MINTER_ROLE(), gameRegistryProxy);
        land.grantRole(land.MINTER_ROLE(), gameRegistryProxy);
        bot.grantRole(bot.MINTER_ROLE(), gameRegistryProxy);

        console.log("GameRegistry granted MINTER_ROLE on all contracts");

        vm.stopBroadcast();

        // ============================================
        // 7. Deployment Summary
        // ============================================
        console.log("\n============================================");
        console.log("Deployment Complete!");
        console.log("============================================");
        console.log("\nContract Addresses:");
        console.log("-------------------------------------------");
        console.log("MockOrangeToken:", mockOrangeTokenProxy);
        console.log("WaterToken:", waterTokenProxy);
        console.log("LandNFT:", landNFTProxy);
        console.log("BotNFT:", botNFTProxy);
        console.log("GameRegistry:", gameRegistryProxy);
        console.log("============================================\n");

        // ============================================
        // 8. Save Deployment Info
        // ============================================
        string memory deploymentInfo = string(
            abi.encodePacked(
                '{\n',
                '  "network": "', getNetworkName(), '",\n',
                '  "deployer": "', vm.toString(deployer), '",\n',
                '  "timestamp": "', vm.toString(block.timestamp), '",\n',
                '  "contracts": {\n',
                '    "MockOrangeToken": "', vm.toString(mockOrangeTokenProxy), '",\n',
                '    "WaterToken": "', vm.toString(waterTokenProxy), '",\n',
                '    "LandNFT": "', vm.toString(landNFTProxy), '",\n',
                '    "BotNFT": "', vm.toString(botNFTProxy), '",\n',
                '    "GameRegistry": "', vm.toString(gameRegistryProxy), '"\n',
                '  },\n',
                '  "configuration": {\n',
                '    "baseURI": "', BASE_URI, '",\n',
                '    "landExpansionCost": "', vm.toString(LAND_EXPANSION_COST), '"\n',
                '  }\n',
                '}'
            )
        );

        vm.writeFile("deployment.json", deploymentInfo);
        console.log("Deployment info saved to deployment.json");

        // ============================================
        // 9. Verification Commands
        // ============================================
        console.log("\nTo verify contracts on block explorer, run:");
        console.log("-------------------------------------------");
        console.log(
            "forge verify-contract",
            mockOrangeTokenProxy,
            "src/MockOrangeToken.sol:MockOrangeToken --watch"
        );
        console.log(
            "forge verify-contract",
            waterTokenProxy,
            "src/WaterToken.sol:WaterToken --watch"
        );
        console.log(
            "forge verify-contract",
            landNFTProxy,
            "src/LandNFT.sol:LandNFT --watch"
        );
        console.log(
            "forge verify-contract",
            botNFTProxy,
            "src/BotNFT.sol:BotNFT --watch"
        );
        console.log(
            "forge verify-contract",
            gameRegistryProxy,
            "src/GameRegistry.sol:GameRegistry --watch"
        );
    }

    function getNetworkName() internal view returns (string memory) {
        uint256 chainId = block.chainid;
        if (chainId == 1) return "mainnet";
        if (chainId == 5) return "goerli";
        if (chainId == 11155111) return "sepolia";
        if (chainId == 31337) return "localhost";
        if (chainId == 50311) return "somnia-testnet";
        return "unknown";
    }
}
