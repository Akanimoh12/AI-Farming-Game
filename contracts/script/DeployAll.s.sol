// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MockOrangeToken.sol";
import "../src/WaterToken.sol";
import "../src/LandNFT.sol";
import "../src/BotNFT.sol";
import "../src/GameRegistry.sol";
import "../src/Marketplace.sol";
import "../src/HarvestSettlement.sol";
import "../src/RealTimeHarvest.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployAll
 * @notice Comprehensive deployment script for all 8 Orange Farm contracts to Somnia testnet
 * @dev Deploys in correct order with proper initialization and role setup
 * Run with: forge script script/DeployAll.s.sol:DeployAll --rpc-url $SOMNIA_RPC_URL --broadcast --legacy
 */
contract DeployAll is Script {
    // Deployed contract proxies
    address public mockOrangeTokenProxy;
    address public waterTokenProxy;
    address public landNFTProxy;
    address public botNFTProxy;
    address public gameRegistryProxy;
    address public marketplaceProxy;
    address public harvestSettlementProxy;
    address public realTimeHarvestProxy;

    // Configuration constants
    string constant BASE_URI = "ipfs://QmYourOrangeFarmMetadata/";
    uint256 constant LAND_EXPANSION_COST = 10e18; // 10 MockOrangeDAO tokens
    uint256 constant HARVEST_CYCLE_DURATION = 600; // 10 minutes in seconds

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("\n========================================");
        console.log("ORANGE FARM - SOMNIA TESTNET DEPLOYMENT");
        console.log("========================================");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance, "wei");
        console.log("Chain ID:", block.chainid);
        console.log("========================================\n");

        require(deployer.balance > 0, "Deployer has no balance!");

        vm.startBroadcast(deployerPrivateKey);

        // ============================================
        // PHASE 1: Deploy Token Contracts
        // ============================================
        console.log("PHASE 1: Deploying Token Contracts...\n");

        // 1. MockOrangeToken
        console.log("1. Deploying MockOrangeToken...");
        MockOrangeToken orangeImpl = new MockOrangeToken();
        bytes memory orangeInitData = abi.encodeWithSelector(
            MockOrangeToken.initialize.selector,
            deployer
        );
        ERC1967Proxy orangeProxy = new ERC1967Proxy(address(orangeImpl), orangeInitData);
        mockOrangeTokenProxy = address(orangeProxy);
        console.log("   Implementation:", address(orangeImpl));
        console.log("   Proxy:", mockOrangeTokenProxy);

        // 2. WaterToken
        console.log("\n2. Deploying WaterToken...");
        WaterToken waterImpl = new WaterToken();
        bytes memory waterInitData = abi.encodeWithSelector(
            WaterToken.initialize.selector,
            deployer
        );
        ERC1967Proxy waterProxy = new ERC1967Proxy(address(waterImpl), waterInitData);
        waterTokenProxy = address(waterProxy);
        console.log("   Implementation:", address(waterImpl));
        console.log("   Proxy:", waterTokenProxy);

        // ============================================
        // PHASE 2: Deploy NFT Contracts
        // ============================================
        console.log("\n\nPHASE 2: Deploying NFT Contracts...\n");

        // 3. LandNFT
        console.log("3. Deploying LandNFT...");
        LandNFT landImpl = new LandNFT();
        bytes memory landInitData = abi.encodeWithSelector(
            LandNFT.initialize.selector,
            deployer,
            BASE_URI,
            mockOrangeTokenProxy,
            LAND_EXPANSION_COST
        );
        ERC1967Proxy landProxy = new ERC1967Proxy(address(landImpl), landInitData);
        landNFTProxy = address(landProxy);
        console.log("   Implementation:", address(landImpl));
        console.log("   Proxy:", landNFTProxy);

        // 4. BotNFT
        console.log("\n4. Deploying BotNFT...");
        BotNFT botImpl = new BotNFT();
        bytes memory botInitData = abi.encodeWithSelector(
            BotNFT.initialize.selector,
            deployer,
            BASE_URI,
            mockOrangeTokenProxy,
            landNFTProxy
        );
        ERC1967Proxy botProxy = new ERC1967Proxy(address(botImpl), botInitData);
        botNFTProxy = address(botProxy);
        console.log("   Implementation:", address(botImpl));
        console.log("   Proxy:", botNFTProxy);

        // ============================================
        // PHASE 3: Deploy Core Game Contracts
        // ============================================
        console.log("\n\nPHASE 3: Deploying Core Game Contracts...\n");

        // 5. GameRegistry
        console.log("5. Deploying GameRegistry...");
        GameRegistry registryImpl = new GameRegistry();
        bytes memory registryInitData = abi.encodeWithSelector(
            GameRegistry.initialize.selector,
            deployer,
            mockOrangeTokenProxy,
            landNFTProxy,
            botNFTProxy,
            waterTokenProxy
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImpl), registryInitData);
        gameRegistryProxy = address(registryProxy);
        console.log("   Implementation:", address(registryImpl));
        console.log("   Proxy:", gameRegistryProxy);

        // 6. RealTimeHarvest (NEW)
        console.log("\n6. Deploying RealTimeHarvest...");
        RealTimeHarvest harvestImpl = new RealTimeHarvest();
        bytes memory harvestInitData = abi.encodeWithSelector(
            RealTimeHarvest.initialize.selector,
            deployer,
            landNFTProxy,
            botNFTProxy,
            HARVEST_CYCLE_DURATION
        );
        ERC1967Proxy harvestProxy = new ERC1967Proxy(address(harvestImpl), harvestInitData);
        realTimeHarvestProxy = address(harvestProxy);
        console.log("   Implementation:", address(harvestImpl));
        console.log("   Proxy:", realTimeHarvestProxy);

        // ============================================
        // PHASE 4: Deploy Marketplace & Settlement
        // ============================================
        console.log("\n\nPHASE 4: Deploying Marketplace & Settlement...\n");

        // 7. Marketplace
        console.log("7. Deploying Marketplace...");
        Marketplace marketplaceImpl = new Marketplace();
        bytes memory marketplaceInitData = abi.encodeWithSelector(
            Marketplace.initialize.selector,
            mockOrangeTokenProxy,
            landNFTProxy,
            botNFTProxy,
            waterTokenProxy,
            deployer  // Treasury address
        );
        ERC1967Proxy marketProxy = new ERC1967Proxy(address(marketplaceImpl), marketplaceInitData);
        marketplaceProxy = address(marketProxy);
        console.log("   Implementation:", address(marketplaceImpl));
        console.log("   Proxy:", marketplaceProxy);

        // 8. HarvestSettlement
        console.log("\n8. Deploying HarvestSettlement...");
        HarvestSettlement settlementImpl = new HarvestSettlement();
        bytes memory settlementInitData = abi.encodeWithSelector(
            HarvestSettlement.initialize.selector,
            deployer,
            mockOrangeTokenProxy,
            gameRegistryProxy
        );
        ERC1967Proxy settlementProxy = new ERC1967Proxy(address(settlementImpl), settlementInitData);
        harvestSettlementProxy = address(settlementProxy);
        console.log("   Implementation:", address(settlementImpl));
        console.log("   Proxy:", harvestSettlementProxy);

        // ============================================
        // PHASE 5: Setup Roles & Permissions
        // ============================================
        console.log("\n\nPHASE 5: Setting up Roles & Permissions...\n");

        MockOrangeToken orangeToken = MockOrangeToken(mockOrangeTokenProxy);
        WaterToken waterToken = WaterToken(waterTokenProxy);
        LandNFT landNFT = LandNFT(landNFTProxy);
        BotNFT botNFT = BotNFT(botNFTProxy);

        bytes32 MINTER_ROLE = orangeToken.MINTER_ROLE();

        // Grant MINTER_ROLE to GameRegistry for all mintable contracts
        console.log("Granting MINTER_ROLE to GameRegistry...");
        orangeToken.grantRole(MINTER_ROLE, gameRegistryProxy);
        waterToken.grantRole(MINTER_ROLE, gameRegistryProxy);
        landNFT.grantRole(MINTER_ROLE, gameRegistryProxy);
        botNFT.grantRole(MINTER_ROLE, gameRegistryProxy);
        console.log("   - MockOrangeToken: MINTER_ROLE granted");
        console.log("   - WaterToken: MINTER_ROLE granted");
        console.log("   - LandNFT: MINTER_ROLE granted");
        console.log("   - BotNFT: MINTER_ROLE granted");

        // Grant MINTER_ROLE to Marketplace for NFT minting
        console.log("\nGranting MINTER_ROLE to Marketplace...");
        landNFT.grantRole(MINTER_ROLE, marketplaceProxy);
        botNFT.grantRole(MINTER_ROLE, marketplaceProxy);
        console.log("   - LandNFT: MINTER_ROLE granted");
        console.log("   - BotNFT: MINTER_ROLE granted");

        // Grant MINTER_ROLE to HarvestSettlement for token minting
        console.log("\nGranting MINTER_ROLE to HarvestSettlement...");
        orangeToken.grantRole(MINTER_ROLE, harvestSettlementProxy);
        console.log("   - MockOrangeToken: MINTER_ROLE granted");

        // Grant GAME_MASTER_ROLE to RealTimeHarvest
        console.log("\nGranting GAME_MASTER_ROLE to RealTimeHarvest...");
        RealTimeHarvest rtHarvest = RealTimeHarvest(realTimeHarvestProxy);
        bytes32 GAME_MASTER_ROLE = rtHarvest.GAME_MASTER_ROLE();
        rtHarvest.grantRole(GAME_MASTER_ROLE, deployer);
        console.log("   - Deployer granted GAME_MASTER_ROLE");

        // Grant MINTER_ROLE to LandNFT on BotNFT for bot-land tracking
        console.log("\nGranting cross-contract permissions...");
        botNFT.grantRole(MINTER_ROLE, landNFTProxy);
        console.log("   - BotNFT: MINTER_ROLE granted to LandNFT");

        vm.stopBroadcast();

        // ============================================
        // DEPLOYMENT SUMMARY
        // ============================================
        console.log("\n\n========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("Network: Somnia Dream Testnet");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("\nCONTRACT ADDRESSES:");
        console.log("-------------------");
        console.log("1. MockOrangeToken:", mockOrangeTokenProxy);
        console.log("2. WaterToken:", waterTokenProxy);
        console.log("3. LandNFT:", landNFTProxy);
        console.log("4. BotNFT:", botNFTProxy);
        console.log("5. GameRegistry:", gameRegistryProxy);
        console.log("6. RealTimeHarvest:", realTimeHarvestProxy);
        console.log("7. Marketplace:", marketplaceProxy);
        console.log("8. HarvestSettlement:", harvestSettlementProxy);
        console.log("========================================\n");

        // Save deployment addresses to JSON
        string memory deploymentJson = string.concat(
            "{\n",
            '  "network": "somnia-testnet",\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "timestamp": ', vm.toString(block.timestamp), ',\n',
            '  "contracts": {\n',
            '    "MockOrangeToken": "', vm.toString(mockOrangeTokenProxy), '",\n',
            '    "WaterToken": "', vm.toString(waterTokenProxy), '",\n',
            '    "LandNFT": "', vm.toString(landNFTProxy), '",\n',
            '    "BotNFT": "', vm.toString(botNFTProxy), '",\n',
            '    "GameRegistry": "', vm.toString(gameRegistryProxy), '",\n',
            '    "RealTimeHarvest": "', vm.toString(realTimeHarvestProxy), '",\n',
            '    "Marketplace": "', vm.toString(marketplaceProxy), '",\n',
            '    "HarvestSettlement": "', vm.toString(harvestSettlementProxy), '"\n',
            '  }\n',
            "}\n"
        );

        vm.writeFile("deployments/somnia-testnet-deployment.json", deploymentJson);
        console.log("Deployment info saved to: deployments/somnia-testnet-deployment.json\n");

        // Generate .env format
        string memory envFormat = string.concat(
            "# Somnia Testnet Deployment - ", vm.toString(block.timestamp), "\n",
            "VITE_MOCK_ORANGE_TOKEN_ADDRESS=", vm.toString(mockOrangeTokenProxy), "\n",
            "VITE_WATER_TOKEN_ADDRESS=", vm.toString(waterTokenProxy), "\n",
            "VITE_LAND_NFT_ADDRESS=", vm.toString(landNFTProxy), "\n",
            "VITE_BOT_NFT_ADDRESS=", vm.toString(botNFTProxy), "\n",
            "VITE_GAME_REGISTRY_ADDRESS=", vm.toString(gameRegistryProxy), "\n",
            "VITE_REAL_TIME_HARVEST_ADDRESS=", vm.toString(realTimeHarvestProxy), "\n",
            "VITE_MARKETPLACE_ADDRESS=", vm.toString(marketplaceProxy), "\n",
            "VITE_HARVEST_SETTLEMENT_ADDRESS=", vm.toString(harvestSettlementProxy), "\n"
        );

        vm.writeFile("deployments/somnia-testnet.env", envFormat);
        console.log("Environment variables saved to: deployments/somnia-testnet.env\n");

        console.log("========================================");
        console.log("NEXT STEPS:");
        console.log("========================================");
        console.log("1. Update frontend/.env with the contract addresses above");
        console.log("2. Export ABIs to frontend/src/lib/contracts/abis/");
        console.log("3. Test contract interactions on Somnia testnet");
        console.log("4. Get testnet STT tokens from Somnia faucet");
        console.log("========================================\n");
    }
}
