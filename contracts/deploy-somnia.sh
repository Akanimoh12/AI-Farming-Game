#!/bin/bash

# ========================================
# 🍊 Orange Farm - Somnia Deployment Script
# ========================================
# Based on Somnia official documentation:
# https://docs.somnia.network/developer/how-to-guides/basics/deploy-a-smart-contract-on-somnia-testnet-using-foundry

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🍊 Orange Farm - Somnia Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check .env file
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

source .env

# Somnia RPC URL
SOMNIA_RPC="https://dream-rpc.somnia.network"

# Check private key
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

# Get deployer address
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)
echo -e "${GREEN}Deployer Address: ${DEPLOYER}${NC}"

# Check balance
BALANCE=$(cast balance $DEPLOYER --rpc-url $SOMNIA_RPC)
BALANCE_ETH=$(cast --to-unit $BALANCE ether 2>/dev/null || echo "0")
echo -e "${GREEN}Balance: ${BALANCE_ETH} STT${NC}"

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}Error: No balance! Get STT from https://devnet.somnia.network/${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Deployment to Somnia Testnet${NC}"
echo -e "${BLUE}Chain ID: 50312${NC}"
echo -e "${BLUE}RPC: ${SOMNIA_RPC}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create deployment log file
LOG_FILE="deployment_$(date +%Y%m%d_%H%M%S).log"
echo "Deployment started at $(date)" > $LOG_FILE
echo "Deployer: $DEPLOYER" >> $LOG_FILE
echo "Balance: $BALANCE_ETH STT" >> $LOG_FILE
echo "" >> $LOG_FILE

# Arrays to store deployed addresses
declare -A DEPLOYED_ADDRESSES

# Function to deploy a contract
deploy_contract() {
    local CONTRACT_NAME=$1
    local CONTRACT_PATH=$2
    local CONSTRUCTOR_ARGS=$3
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📦 Deploying ${CONTRACT_NAME}...${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Deploy using forge create (Somnia recommended method)
    if [ -z "$CONSTRUCTOR_ARGS" ]; then
        DEPLOY_OUTPUT=$(forge create \
            --rpc-url "$SOMNIA_RPC" \
            --private-key "$PRIVATE_KEY" \
            "$CONTRACT_PATH" 2>&1)
    else
        DEPLOY_OUTPUT=$(forge create \
            --rpc-url "$SOMNIA_RPC" \
            --private-key "$PRIVATE_KEY" \
            --constructor-args $CONSTRUCTOR_ARGS \
            "$CONTRACT_PATH" 2>&1)
    fi
    
    DEPLOY_STATUS=$?
    
    if [ $DEPLOY_STATUS -eq 0 ]; then
        # Extract deployed address
        DEPLOYED_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
        TX_HASH=$(echo "$DEPLOY_OUTPUT" | grep "Transaction hash:" | awk '{print $3}')
        
        if [ -n "$DEPLOYED_ADDRESS" ]; then
            echo -e "${GREEN}✅ ${CONTRACT_NAME} deployed successfully!${NC}"
            echo -e "${GREEN}   Address: ${DEPLOYED_ADDRESS}${NC}"
            echo -e "${BLUE}   TX Hash: ${TX_HASH}${NC}"
            echo -e "${PURPLE}   Explorer: https://somnia-devnet.socialscan.io/tx/${TX_HASH}${NC}"
            echo ""
            
            # Save to array
            DEPLOYED_ADDRESSES[$CONTRACT_NAME]=$DEPLOYED_ADDRESS
            
            # Log to file
            echo "${CONTRACT_NAME}=${DEPLOYED_ADDRESS}" >> $LOG_FILE
            echo "TX_HASH: ${TX_HASH}" >> $LOG_FILE
            echo "" >> $LOG_FILE
            
            # Wait a bit for next deployment
            sleep 3
            
            return 0
        else
            echo -e "${RED}❌ ${CONTRACT_NAME} deployment failed - no address found${NC}"
            echo "$DEPLOY_OUTPUT" >> $LOG_FILE
            return 1
        fi
    else
        echo -e "${RED}❌ ${CONTRACT_NAME} deployment failed!${NC}"
        echo -e "${RED}Error output:${NC}"
        echo "$DEPLOY_OUTPUT"
        echo "" >> $LOG_FILE
        echo "DEPLOYMENT FAILED: ${CONTRACT_NAME}" >> $LOG_FILE
        echo "$DEPLOY_OUTPUT" >> $LOG_FILE
        return 1
    fi
}

# ========================================
# PHASE 1: Deploy Token Contracts (Implementation)
# ========================================
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 1: Token Contracts           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# 1. MockOrangeToken Implementation
if ! deploy_contract "MockOrangeToken" "src/MockOrangeToken.sol:MockOrangeToken"; then
    echo -e "${RED}Critical failure. Stopping deployment.${NC}"
    exit 1
fi

# 2. WaterToken Implementation
if ! deploy_contract "WaterToken" "src/WaterToken.sol:WaterToken"; then
    echo -e "${RED}Critical failure. Stopping deployment.${NC}"
    exit 1
fi

# ========================================
# PHASE 2: Deploy NFT Contracts (Implementation)
# ========================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 2: NFT Contracts             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# 3. LandNFT Implementation
if ! deploy_contract "LandNFT" "src/LandNFT.sol:LandNFT"; then
    echo -e "${RED}Critical failure. Stopping deployment.${NC}"
    exit 1
fi

# 4. BotNFT Implementation
if ! deploy_contract "BotNFT" "src/BotNFT.sol:BotNFT"; then
    echo -e "${RED}Critical failure. Stopping deployment.${NC}"
    exit 1
fi

# ========================================
# PHASE 3: Deploy Core Game Contracts (Implementation)
# ========================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 3: Core Game Contracts       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# 5. GameRegistry Implementation
if ! deploy_contract "GameRegistry" "src/GameRegistry.sol:GameRegistry"; then
    echo -e "${RED}Critical failure. Stopping deployment.${NC}"
    exit 1
fi

# 6. RealTimeHarvest Implementation
if ! deploy_contract "RealTimeHarvest" "src/RealTimeHarvest.sol:RealTimeHarvest"; then
    echo -e "${RED}Critical failure. Stopping deployment.${NC}"
    exit 1
fi

# ========================================
# PHASE 4: Deploy Marketplace & Settlement (Implementation)
# ========================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 4: Marketplace & Settlement  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# 7. Marketplace Implementation
if ! deploy_contract "Marketplace" "src/Marketplace.sol:Marketplace"; then
    echo -e "${RED}Critical failure. Stopping deployment.${NC}"
    exit 1
fi

# 8. HarvestSettlement Implementation
if ! deploy_contract "HarvestSettlement" "src/HarvestSettlement.sol:HarvestSettlement"; then
    echo -e "${RED}Critical failure. Stopping deployment.${NC}"
    exit 1
fi

# ========================================
# PHASE 5: Deploy Proxies and Initialize
# ========================================
echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PHASE 5: Deploy Proxies            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Note: You'll need to deploy ERC1967 proxies and initialize them${NC}"
echo -e "${YELLOW}This requires additional steps with proper initialization data${NC}"
echo ""

# ========================================
# Summary
# ========================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 DEPLOYMENT COMPLETE! 🎉                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📋 Deployment Summary:${NC}"
echo ""

for CONTRACT_NAME in "${!DEPLOYED_ADDRESSES[@]}"; do
    echo -e "${GREEN}✅ ${CONTRACT_NAME}${NC}"
    echo -e "   ${DEPLOYED_ADDRESSES[$CONTRACT_NAME]}"
    echo ""
done

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📝 Deployment log saved to: ${LOG_FILE}${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create .env update file
ENV_UPDATE_FILE="frontend_env_update.txt"
echo "# Copy these addresses to your frontend .env file" > $ENV_UPDATE_FILE
echo "# /home/akan_nigeria/AI-Farming/frontend/.env" >> $ENV_UPDATE_FILE
echo "" >> $ENV_UPDATE_FILE

if [ -n "${DEPLOYED_ADDRESSES[MockOrangeToken]}" ]; then
    echo "VITE_MOCK_ORANGE_TOKEN_ADDRESS=${DEPLOYED_ADDRESSES[MockOrangeToken]}" >> $ENV_UPDATE_FILE
fi
if [ -n "${DEPLOYED_ADDRESSES[WaterToken]}" ]; then
    echo "VITE_WATER_TOKEN_ADDRESS=${DEPLOYED_ADDRESSES[WaterToken]}" >> $ENV_UPDATE_FILE
fi
if [ -n "${DEPLOYED_ADDRESSES[LandNFT]}" ]; then
    echo "VITE_LAND_NFT_ADDRESS=${DEPLOYED_ADDRESSES[LandNFT]}" >> $ENV_UPDATE_FILE
fi
if [ -n "${DEPLOYED_ADDRESSES[BotNFT]}" ]; then
    echo "VITE_BOT_NFT_ADDRESS=${DEPLOYED_ADDRESSES[BotNFT]}" >> $ENV_UPDATE_FILE
fi
if [ -n "${DEPLOYED_ADDRESSES[GameRegistry]}" ]; then
    echo "VITE_GAME_REGISTRY_ADDRESS=${DEPLOYED_ADDRESSES[GameRegistry]}" >> $ENV_UPDATE_FILE
fi
if [ -n "${DEPLOYED_ADDRESSES[Marketplace]}" ]; then
    echo "VITE_MARKETPLACE_ADDRESS=${DEPLOYED_ADDRESSES[Marketplace]}" >> $ENV_UPDATE_FILE
fi
if [ -n "${DEPLOYED_ADDRESSES[HarvestSettlement]}" ]; then
    echo "VITE_HARVEST_SETTLEMENT_ADDRESS=${DEPLOYED_ADDRESSES[HarvestSettlement]}" >> $ENV_UPDATE_FILE
fi
if [ -n "${DEPLOYED_ADDRESSES[RealTimeHarvest]}" ]; then
    echo "VITE_REAL_TIME_HARVEST_ADDRESS=${DEPLOYED_ADDRESSES[RealTimeHarvest]}" >> $ENV_UPDATE_FILE
fi

echo -e "${GREEN}📄 Frontend .env updates saved to: ${ENV_UPDATE_FILE}${NC}"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo -e "${YELLOW}1. These are implementation contracts (not proxies)${NC}"
echo -e "${YELLOW}2. You need to initialize each contract before use${NC}"
echo -e "${YELLOW}3. Update frontend .env with the new addresses${NC}"
echo -e "${YELLOW}4. Set up roles and permissions${NC}"
echo ""

echo -e "${CYAN}🔗 View on Explorer:${NC}"
echo -e "${PURPLE}https://somnia-devnet.socialscan.io/${NC}"
echo ""
echo -e "${GREEN}Deployment completed at $(date)${NC}"
