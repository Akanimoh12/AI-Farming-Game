#!/bin/bash

# ========================================
# 🍊 Orange Farm - Complete Somnia Deployment with Proxies
# ========================================
# Deploys implementations + proxies + initializes contracts
# Based on Somnia documentation + UUPS proxy pattern

set -e

# Foundry executables
FORGE="$HOME/.foundry/bin/forge"
CAST="$HOME/.foundry/bin/cast"
GREP="/usr/bin/grep"
AWK="/usr/bin/awk"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🍊 Orange Farm - Complete Somnia Deployment 🍊${NC}"
echo -e "${BLUE}════════════════════════════════════════════════${NC}"
echo ""

# Load environment
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

source .env

SOMNIA_RPC="https://dream-rpc.somnia.network"

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

DEPLOYER=$($CAST wallet address --private-key $PRIVATE_KEY)
BALANCE=$($CAST balance $DEPLOYER --rpc-url $SOMNIA_RPC)
BALANCE_ETH=$($CAST --to-unit $BALANCE ether)

echo -e "${GREEN}Deployer: ${DEPLOYER}${NC}"
echo -e "${GREEN}Balance: ${BALANCE_ETH} STT${NC}"
echo -e "${BLUE}Network: Somnia Dream Testnet (Chain ID: 50312)${NC}"
echo ""

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}No balance! Get STT from https://devnet.somnia.network/${NC}"
    exit 1
fi

# Configuration
BASE_URI="ipfs://QmOrangeFarmMetadata/"
LAND_EXPANSION_COST="10000000000000000000"  # 10 tokens
HARVEST_CYCLE_DURATION="600"  # 10 minutes

# Storage
LOG_FILE="deployment_full_$(date +%Y%m%d_%H%M%S).log"
declare -A IMPL_ADDRESSES
declare -A PROXY_ADDRESSES

echo "Deployment started at $(date)" > $LOG_FILE
echo "Deployer: $DEPLOYER" >> $LOG_FILE
echo "" >> $LOG_FILE

# Function to deploy implementation
deploy_impl() {
    local NAME=$1
    local PATH=$2
    
    echo -e "${CYAN}📦 Deploying ${NAME} Implementation...${NC}"
    
    OUTPUT=$($FORGE create \
        --rpc-url "$SOMNIA_RPC" \
        --private-key "$PRIVATE_KEY" \
        --broadcast \
        "$PATH" 2>&1)
    
    if [ $? -eq 0 ]; then
        ADDRESS=$(echo "$OUTPUT" | $GREP "Deployed to:" | $AWK '{print $3}')
        TX=$(echo "$OUTPUT" | $GREP "Transaction hash:" | $AWK '{print $3}')
        
        if [ -n "$ADDRESS" ]; then
            echo -e "${GREEN}✅ ${NAME} Implementation: ${ADDRESS}${NC}"
            echo -e "${BLUE}   TX: ${TX}${NC}"
            IMPL_ADDRESSES[$NAME]=$ADDRESS
            echo "${NAME}_IMPL=${ADDRESS}" >> $LOG_FILE
            echo "TX: ${TX}" >> $LOG_FILE
            sleep 2
            return 0
        fi
    fi
    
    echo -e "${RED}❌ Failed to deploy ${NAME}${NC}"
    echo "$OUTPUT" >> $LOG_FILE
    return 1
}

# Function to deploy and initialize proxy
deploy_proxy() {
    local NAME=$1
    local IMPL_ADDR=$2
    local INIT_DATA=$3
    
    echo -e "${CYAN}🔧 Deploying ${NAME} Proxy...${NC}"
    
    # Deploy ERC1967Proxy
    OUTPUT=$($FORGE create \
        --rpc-url "$SOMNIA_RPC" \
        --private-key "$PRIVATE_KEY" \
        --broadcast \
        --constructor-args "$IMPL_ADDR" "$INIT_DATA" \
        "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy" 2>&1)
    
    if [ $? -eq 0 ]; then
        ADDRESS=$(echo "$OUTPUT" | $GREP "Deployed to:" | $AWK '{print $3}')
        TX=$(echo "$OUTPUT" | $GREP "Transaction hash:" | $AWK '{print $3}')
        
        if [ -n "$ADDRESS" ]; then
            echo -e "${GREEN}✅ ${NAME} Proxy: ${ADDRESS}${NC}"
            echo -e "${BLUE}   TX: ${TX}${NC}"
            PROXY_ADDRESSES[$NAME]=$ADDRESS
            echo "${NAME}_PROXY=${ADDRESS}" >> $LOG_FILE
            echo "TX: ${TX}" >> $LOG_FILE
            sleep 2
            return 0
        fi
    fi
    
    echo -e "${RED}❌ Failed to deploy ${NAME} proxy${NC}"
    echo "$OUTPUT" >> $LOG_FILE
    return 1
}

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 1: Deploy Implementation Contracts${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Deploy all implementations
deploy_impl "MockOrangeToken" "src/MockOrangeToken.sol:MockOrangeToken" || exit 1
deploy_impl "WaterToken" "src/WaterToken.sol:WaterToken" || exit 1
deploy_impl "LandNFT" "src/LandNFT.sol:LandNFT" || exit 1
deploy_impl "BotNFT" "src/BotNFT.sol:BotNFT" || exit 1
deploy_impl "GameRegistry" "src/GameRegistry.sol:GameRegistry" || exit 1
deploy_impl "RealTimeHarvest" "src/RealTimeHarvest.sol:RealTimeHarvest" || exit 1
deploy_impl "Marketplace" "src/Marketplace.sol:Marketplace" || exit 1
deploy_impl "HarvestSettlement" "src/HarvestSettlement.sol:HarvestSettlement" || exit 1

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: Deploy Proxies & Initialize${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# 1. MockOrangeToken Proxy
echo -e "${YELLOW}1/8 MockOrangeToken${NC}"
INIT_DATA=$($CAST abi-encode "initialize(address)" "$DEPLOYER")
deploy_proxy "MockOrangeToken" "${IMPL_ADDRESSES[MockOrangeToken]}" "$INIT_DATA" || exit 1

# 2. WaterToken Proxy
echo -e "${YELLOW}2/8 WaterToken${NC}"
INIT_DATA=$($CAST abi-encode "initialize(address)" "$DEPLOYER")
deploy_proxy "WaterToken" "${IMPL_ADDRESSES[WaterToken]}" "$INIT_DATA" || exit 1

# 3. LandNFT Proxy
echo -e "${YELLOW}3/8 LandNFT${NC}"
INIT_DATA=$($CAST abi-encode "initialize(address,string,address,uint256)" \
    "$DEPLOYER" "$BASE_URI" "${PROXY_ADDRESSES[MockOrangeToken]}" "$LAND_EXPANSION_COST")
deploy_proxy "LandNFT" "${IMPL_ADDRESSES[LandNFT]}" "$INIT_DATA" || exit 1

# 4. BotNFT Proxy
echo -e "${YELLOW}4/8 BotNFT${NC}"
INIT_DATA=$($CAST abi-encode "initialize(address,string,address,address)" \
    "$DEPLOYER" "$BASE_URI" "${PROXY_ADDRESSES[MockOrangeToken]}" "${PROXY_ADDRESSES[LandNFT]}")
deploy_proxy "BotNFT" "${IMPL_ADDRESSES[BotNFT]}" "$INIT_DATA" || exit 1

# 5. GameRegistry Proxy
echo -e "${YELLOW}5/8 GameRegistry${NC}"
INIT_DATA=$($CAST abi-encode "initialize(address,address,address,address,address)" \
    "$DEPLOYER" "${PROXY_ADDRESSES[MockOrangeToken]}" "${PROXY_ADDRESSES[LandNFT]}" \
    "${PROXY_ADDRESSES[BotNFT]}" "${PROXY_ADDRESSES[WaterToken]}")
deploy_proxy "GameRegistry" "${IMPL_ADDRESSES[GameRegistry]}" "$INIT_DATA" || exit 1

# 6. RealTimeHarvest Proxy
echo -e "${YELLOW}6/8 RealTimeHarvest${NC}"
INIT_DATA=$($CAST abi-encode "initialize(address,address,address,uint256)" \
    "$DEPLOYER" "${PROXY_ADDRESSES[LandNFT]}" "${PROXY_ADDRESSES[BotNFT]}" "$HARVEST_CYCLE_DURATION")
deploy_proxy "RealTimeHarvest" "${IMPL_ADDRESSES[RealTimeHarvest]}" "$INIT_DATA" || exit 1

# 7. Marketplace Proxy
echo -e "${YELLOW}7/8 Marketplace${NC}"
INIT_DATA=$($CAST abi-encode "initialize(address,address,address,address,address)" \
    "${PROXY_ADDRESSES[MockOrangeToken]}" "${PROXY_ADDRESSES[LandNFT]}" \
    "${PROXY_ADDRESSES[BotNFT]}" "${PROXY_ADDRESSES[WaterToken]}" "$DEPLOYER")
deploy_proxy "Marketplace" "${IMPL_ADDRESSES[Marketplace]}" "$INIT_DATA" || exit 1

# 8. HarvestSettlement Proxy
echo -e "${YELLOW}8/8 HarvestSettlement${NC}"
INIT_DATA=$($CAST abi-encode "initialize(address,address,address)" \
    "$DEPLOYER" "${PROXY_ADDRESSES[MockOrangeToken]}" "${PROXY_ADDRESSES[GameRegistry]}")
deploy_proxy "HarvestSettlement" "${IMPL_ADDRESSES[HarvestSettlement]}" "$INIT_DATA" || exit 1

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}           🎉 DEPLOYMENT COMPLETE! 🎉           ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""

# Create frontend env file
ENV_FILE="frontend_env_update.txt"
cat > $ENV_FILE << EOF
# 🍊 Orange Farm - Deployed Contract Addresses
# Deployed: $(date)
# Deployer: ${DEPLOYER}
# Network: Somnia Dream Testnet (Chain ID: 50312)

# Copy these to /home/akan_nigeria/AI-Farming/frontend/.env

VITE_MOCK_ORANGE_TOKEN_ADDRESS=${PROXY_ADDRESSES[MockOrangeToken]}
VITE_WATER_TOKEN_ADDRESS=${PROXY_ADDRESSES[WaterToken]}
VITE_LAND_NFT_ADDRESS=${PROXY_ADDRESSES[LandNFT]}
VITE_BOT_NFT_ADDRESS=${PROXY_ADDRESSES[BotNFT]}
VITE_GAME_REGISTRY_ADDRESS=${PROXY_ADDRESSES[GameRegistry]}
VITE_MARKETPLACE_ADDRESS=${PROXY_ADDRESSES[Marketplace]}
VITE_HARVEST_SETTLEMENT_ADDRESS=${PROXY_ADDRESSES[HarvestSettlement]}
VITE_REAL_TIME_HARVEST_ADDRESS=${PROXY_ADDRESSES[RealTimeHarvest]}
EOF

echo -e "${CYAN}📋 Deployed Proxy Addresses (USE THESE):${NC}"
echo ""
for CONTRACT in "${!PROXY_ADDRESSES[@]}"; do
    echo -e "${GREEN}${CONTRACT}:${NC}"
    echo -e "  ${PROXY_ADDRESSES[$CONTRACT]}"
done

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Log saved: ${LOG_FILE}${NC}"
echo -e "${GREEN}✅ ENV file: ${ENV_FILE}${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}🔗 View on Explorer:${NC}"
echo -e "${PURPLE}https://somnia-devnet.socialscan.io/${NC}"
echo ""
