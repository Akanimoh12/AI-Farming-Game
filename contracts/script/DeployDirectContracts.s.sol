// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/direct/MockOrangeToken.sol";
import "../src/direct/WaterToken.sol";
import "../src/direct/LandNFT.sol";
import "../src/direct/BotNFT.sol";
import "../src/direct/GameRegistry.sol";
import "../src/direct/Marketplace.sol";
import "../src/direct/HarvestSettlement.sol";
import "../src/direct/RealTimeHarvest.sol";

/**
 * @title DeployDirectContracts
 * @notice Deployment script for all direct (non-upgradeable) Orange Farm contracts
 * @dev Updated with HarvestSettlement mockOrangeToken parameter and LandNFT permissions
 * 
 * Run with:
 * forge script script/DeployDirectContracts.s.sol:DeployDirectContracts \
 *   --rpc-url $SOMNIA_RPC_URL \
 *   --broadcast \
 *   --legacy \
 *   -vvvv
 */
contract DeployDirectContracts is Script {
    // Deployed contracts
    MockOrangeToken public mockOrangeToken;
    WaterToken public waterToken;
    LandNFT public landNFT;
    BotNFT public botNFT;
    GameRegistry public gameRegistry;
    Marketplace public marketplace;
    HarvestSettlement public harvestSettlement;
    RealTimeHarvest public realTimeHarvest;

    // Configuration constants
    string constant BASE_URI = "ipfs://QmYourOrangeFarmMetadata/";
    string constant DEFAULT_REFERRER = "FarmDAO";
    uint256 constant LAND_EXPANSION_COST = 10e18; // 10 ORANGE tokens
    uint64 constant HARVEST_CYCLE_DURATION = 21600; // 6 hours in seconds
    address constant TREASURY = address(0x1234567890123456789012345678901234567890); // Update this!

    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("\n============================================");
        console.log("ORANGE FARM - DIRECT CONTRACT DEPLOYMENT");
        console.log("============================================");
        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance / 1e18, "ETH");
        console.log("Chain ID:", block.chainid);
        console.log("============================================\n");

        require(deployer.balance > 0, "Deployer has no balance!");

        vm.startBroadcast(deployerPrivateKey);

        // ==========================================
        // PHASE 1: Deploy Core Token Contracts
        // ==========================================
        console.log("PHASE 1: Deploying Core Tokens\n");

        console.log("1/8 MockOrangeToken...");
        mockOrangeToken = new MockOrangeToken(deployer);
        console.log("    Address:", address(mockOrangeToken));
        console.log("    Symbol: MORANGE");
        console.log("    Daily Mint: 100 tokens");

        console.log("\n2/8 WaterToken...");
        waterToken = new WaterToken(deployer);
        console.log("    Address:", address(waterToken));
        console.log("    Symbol: WATER");

        // ==========================================
        // PHASE 2: Deploy NFT Contracts
        // ==========================================
        console.log("\n\nPHASE 2: Deploying NFT Contracts\n");

        console.log("3/8 LandNFT...");
        landNFT = new LandNFT(
            deployer,
            BASE_URI,
            address(mockOrangeToken),
            LAND_EXPANSION_COST
        );
        console.log("    Address:", address(landNFT));
        console.log("    Base URI:", BASE_URI);
        console.log("    Expansion Cost:", LAND_EXPANSION_COST / 1e18, "ORANGE");

        console.log("\n4/8 BotNFT...");
        botNFT = new BotNFT(
            deployer,
            BASE_URI,
            address(mockOrangeToken),
            address(landNFT)
        );
        console.log("    Address:", address(botNFT));
        console.log("    Base URI:", BASE_URI);

        // ==========================================
        // PHASE 3: Deploy Game Logic Contracts
        // ==========================================
        console.log("\n\nPHASE 3: Deploying Game Logic\n");

        console.log("5/8 GameRegistry...");
        gameRegistry = new GameRegistry(
            deployer,
            address(mockOrangeToken),
            address(landNFT),
            address(botNFT),
            address(waterToken),
            DEFAULT_REFERRER
        );
        console.log("    Address:", address(gameRegistry));
        console.log("    Default Referrer:", DEFAULT_REFERRER);

        console.log("\n6/8 RealTimeHarvest...");
        realTimeHarvest = new RealTimeHarvest(
            deployer,
            address(landNFT),
            address(botNFT),
            HARVEST_CYCLE_DURATION
        );
        console.log("    Address:", address(realTimeHarvest));
        console.log("    Cycle Duration:", HARVEST_CYCLE_DURATION / 3600, "hours");

        console.log("\n7/8 HarvestSettlement...");
        harvestSettlement = new HarvestSettlement(
            deployer,
            address(gameRegistry),
            address(mockOrangeToken) // CRITICAL: NEW PARAMETER!
        );
        console.log("    Address:", address(harvestSettlement));
        console.log("    NOTE: NOW MINTS ORANGE TOKENS ON HARVEST!");

        console.log("\n8/8 Marketplace...");
        marketplace = new Marketplace(
            deployer,
            address(mockOrangeToken),
            address(landNFT),
            address(botNFT),
            address(waterToken),
            TREASURY
        );
        console.log("    Address:", address(marketplace));
        console.log("    Treasury:", TREASURY);

        // ==========================================
        // PHASE 4: Grant Roles
        // ==========================================
        console.log("\n\nPHASE 4: Setting Up Roles\n");

        bytes32 MINTER_ROLE = keccak256("MINTER_ROLE");
        bytes32 SETTLER_ROLE = keccak256("SETTLER_ROLE");

        console.log("Granting MINTER_ROLE to contracts...");
        
        // MockOrangeToken minters
        console.log("  MockOrangeToken:");
        mockOrangeToken.grantRole(MINTER_ROLE, address(gameRegistry));
        console.log("    + GameRegistry");
        mockOrangeToken.grantRole(MINTER_ROLE, address(harvestSettlement));
        console.log("    + HarvestSettlement (CRITICAL for harvest rewards!)");
        mockOrangeToken.grantRole(MINTER_ROLE, address(marketplace));
        console.log("    + Marketplace");

        // LandNFT minters
        console.log("  LandNFT:");
        landNFT.grantRole(MINTER_ROLE, address(gameRegistry));
        console.log("    + GameRegistry");
        landNFT.grantRole(MINTER_ROLE, address(marketplace));
        console.log("    + Marketplace");
        landNFT.grantRole(MINTER_ROLE, address(realTimeHarvest));
        console.log("    + RealTimeHarvest (for bot assignment)");

        // BotNFT minters
        console.log("  BotNFT:");
        botNFT.grantRole(MINTER_ROLE, address(gameRegistry));
        console.log("    + GameRegistry");
        botNFT.grantRole(MINTER_ROLE, address(marketplace));
        console.log("    + Marketplace");
        botNFT.grantRole(MINTER_ROLE, address(realTimeHarvest));
        console.log("    + RealTimeHarvest (for harvest tracking)");

        // WaterToken minters
        console.log("  WaterToken:");
        waterToken.grantRole(MINTER_ROLE, address(gameRegistry));
        console.log("    + GameRegistry");
        waterToken.grantRole(MINTER_ROLE, address(marketplace));
        console.log("    + Marketplace");

        // HarvestSettlement settlers
        console.log("  HarvestSettlement:");
        harvestSettlement.grantRole(SETTLER_ROLE, address(realTimeHarvest));
        console.log("    + RealTimeHarvest");
        harvestSettlement.grantRole(SETTLER_ROLE, deployer);
        console.log("    + Deployer (for testing)");

        vm.stopBroadcast();

        // ==========================================
        // PHASE 5: Summary & .env Output
        // ==========================================
        console.log("\n\n============================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("============================================\n");

        console.log("CONTRACT ADDRESSES:\n");
        console.log("VITE_MOCK_ORANGE_TOKEN_ADDRESS=%s", address(mockOrangeToken));
        console.log("VITE_WATER_TOKEN_ADDRESS=%s", address(waterToken));
        console.log("VITE_LAND_NFT_ADDRESS=%s", address(landNFT));
        console.log("VITE_BOT_NFT_ADDRESS=%s", address(botNFT));
        console.log("VITE_GAME_REGISTRY_ADDRESS=%s", address(gameRegistry));
        console.log("VITE_REAL_TIME_HARVEST_ADDRESS=%s", address(realTimeHarvest));
        console.log("VITE_HARVEST_SETTLEMENT_ADDRESS=%s", address(harvestSettlement));
        console.log("VITE_MARKETPLACE_ADDRESS=%s", address(marketplace));

        console.log("\n\nCOPY THESE TO YOUR frontend/.env FILE!\n");
        console.log("============================================\n");

        // Save addresses to file
        string memory addresses = string(abi.encodePacked(
            "VITE_MOCK_ORANGE_TOKEN_ADDRESS=", vm.toString(address(mockOrangeToken)), "\n",
            "VITE_WATER_TOKEN_ADDRESS=", vm.toString(address(waterToken)), "\n",
            "VITE_LAND_NFT_ADDRESS=", vm.toString(address(landNFT)), "\n",
            "VITE_BOT_NFT_ADDRESS=", vm.toString(address(botNFT)), "\n",
            "VITE_GAME_REGISTRY_ADDRESS=", vm.toString(address(gameRegistry)), "\n",
            "VITE_REAL_TIME_HARVEST_ADDRESS=", vm.toString(address(realTimeHarvest)), "\n",
            "VITE_HARVEST_SETTLEMENT_ADDRESS=", vm.toString(address(harvestSettlement)), "\n",
            "VITE_MARKETPLACE_ADDRESS=", vm.toString(address(marketplace)), "\n",
            "VITE_CHAIN_ID=", vm.toString(block.chainid), "\n"
        ));

        vm.writeFile("deployment-addresses.env", addresses);
        console.log("Addresses saved to: deployment-addresses.env\n");

        console.log("IMPORTANT CHANGES:");
        console.log("  1. HarvestSettlement NOW MINTS TOKENS on harvest!");
        console.log("  2. LandNFT bot assignment works for owners!");
        console.log("  3. Daily mint feature ready in frontend!");
        console.log("\nReady to use! Test all features!\n");
    }
}
