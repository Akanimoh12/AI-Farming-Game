#!/bin/bash

# ========================================
# 🍊 Orange Farm - Individual Contract Deployment Script
# ========================================
# This script deploys contracts one at a time to help identify deployment issues
# Run with: ./deploy-individual.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

SOMNIA_RPC="https://dream-rpc.somnia.network"
CHAIN_ID=50312

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🍊 Orange Farm - Individual Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get deployer address
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)
echo -e "${GREEN}Deployer Address: ${DEPLOYER}${NC}"

# Check balance
BALANCE=$(cast balance $DEPLOYER --rpc-url $SOMNIA_RPC)
echo -e "${GREEN}Deployer Balance: ${BALANCE} wei${NC}"

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}Error: Deployer has no balance! Get STT tokens from Somnia faucet.${NC}"
    exit 1
fi

# Check network
CURRENT_CHAIN_ID=$(cast chain-id --rpc-url $SOMNIA_RPC)
echo -e "${GREEN}Network Chain ID: ${CURRENT_CHAIN_ID}${NC}"

if [ "$CURRENT_CHAIN_ID" != "$CHAIN_ID" ]; then
    echo -e "${RED}Error: Wrong network! Expected ${CHAIN_ID}, got ${CURRENT_CHAIN_ID}${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Individual Contract Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to deploy a contract
deploy_contract() {
    local CONTRACT_NAME=$1
    local CONTRACT_PATH=$2
    
    echo -e "${YELLOW}Deploying ${CONTRACT_NAME}...${NC}"
    
    # Estimate gas first
    echo -e "${BLUE}  Estimating gas...${NC}"
    
    # Try deployment
    if forge create "$CONTRACT_PATH" \
        --rpc-url "$SOMNIA_RPC" \
        --private-key "$PRIVATE_KEY" \
        --legacy 2>&1 | tee /tmp/deploy_${CONTRACT_NAME}.log; then
        
        # Extract deployed address
        DEPLOYED_ADDRESS=$(grep "Deployed to:" /tmp/deploy_${CONTRACT_NAME}.log | awk '{print $3}')
        
        if [ -n "$DEPLOYED_ADDRESS" ]; then
            echo -e "${GREEN}✅ ${CONTRACT_NAME} deployed successfully!${NC}"
            echo -e "${GREEN}   Address: ${DEPLOYED_ADDRESS}${NC}"
            echo ""
            
            # Save address to file
            echo "${CONTRACT_NAME}=${DEPLOYED_ADDRESS}" >> deployed_addresses.txt
            return 0
        else
            echo -e "${RED}❌ ${CONTRACT_NAME} deployment failed - no address found${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ ${CONTRACT_NAME} deployment failed!${NC}"
        echo -e "${RED}   Check /tmp/deploy_${CONTRACT_NAME}.log for details${NC}"
        return 1
    fi
}

# Clear previous deployment log
rm -f deployed_addresses.txt

echo -e "${BLUE}=== PHASE 1: Token Contracts ===${NC}"
echo ""

# 1. MockOrangeToken
if ! deploy_contract "MockOrangeToken" "src/MockOrangeToken.sol:MockOrangeToken"; then
    echo -e "${RED}Failed to deploy MockOrangeToken. Stopping deployment.${NC}"
    exit 1
fi

sleep 2

# 2. WaterToken
if ! deploy_contract "WaterToken" "src/WaterToken.sol:WaterToken"; then
    echo -e "${RED}Failed to deploy WaterToken. Stopping deployment.${NC}"
    exit 1
fi

sleep 2

echo ""
echo -e "${BLUE}=== PHASE 2: NFT Contracts ===${NC}"
echo ""

# 3. LandNFT
if ! deploy_contract "LandNFT" "src/LandNFT.sol:LandNFT"; then
    echo -e "${RED}Failed to deploy LandNFT. Stopping deployment.${NC}"
    exit 1
fi

sleep 2

# 4. BotNFT
if ! deploy_contract "BotNFT" "src/BotNFT.sol:BotNFT"; then
    echo -e "${RED}Failed to deploy BotNFT. Stopping deployment.${NC}"
    exit 1
fi

sleep 2

echo ""
echo -e "${BLUE}=== PHASE 3: Core Game Contracts ===${NC}"
echo ""

# 5. GameRegistry
if ! deploy_contract "GameRegistry" "src/GameRegistry.sol:GameRegistry"; then
    echo -e "${RED}Failed to deploy GameRegistry. Stopping deployment.${NC}"
    exit 1
fi

sleep 2

# 6. RealTimeHarvest
if ! deploy_contract "RealTimeHarvest" "src/RealTimeHarvest.sol:RealTimeHarvest"; then
    echo -e "${RED}Failed to deploy RealTimeHarvest. Stopping deployment.${NC}"
    exit 1
fi

sleep 2

echo ""
echo -e "${BLUE}=== PHASE 4: Marketplace & Settlement ===${NC}"
echo ""

# 7. Marketplace
if ! deploy_contract "Marketplace" "src/Marketplace.sol:Marketplace"; then
    echo -e "${RED}Failed to deploy Marketplace. Stopping deployment.${NC}"
    exit 1
fi

sleep 2

# 8. HarvestSettlement
if ! deploy_contract "HarvestSettlement" "src/HarvestSettlement.sol:HarvestSettlement"; then
    echo -e "${RED}Failed to deploy HarvestSettlement. Stopping deployment.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All Contracts Deployed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Deployed addresses saved to: deployed_addresses.txt${NC}"
echo ""
cat deployed_addresses.txt
echo ""
echo -e "${YELLOW}Note: These are implementation contracts only (not proxies)${NC}"
echo -e "${YELLOW}You still need to:${NC}"
echo -e "${YELLOW}  1. Deploy ERC1967 proxies for each contract${NC}"
echo -e "${YELLOW}  2. Initialize each proxy with correct parameters${NC}"
echo -e "${YELLOW}  3. Setup roles and permissions${NC}"
echo -e "${YELLOW}  4. Update .env file with proxy addresses${NC}"
echo ""
