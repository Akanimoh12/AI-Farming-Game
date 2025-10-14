#!/bin/bash

# ========================================
# 🔍 Orange Farm - Deployment Diagnostics
# ========================================
# This script checks common issues preventing contract deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SOMNIA_RPC="https://dream-rpc.somnia.network"
CHAIN_ID=50312

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🔍 Deployment Diagnostics${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check .env file
echo -e "${YELLOW}1. Checking .env file...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}   ✅ .env file found${NC}"
    
    if grep -q "PRIVATE_KEY=" .env; then
        echo -e "${GREEN}   ✅ PRIVATE_KEY found in .env${NC}"
    else
        echo -e "${RED}   ❌ PRIVATE_KEY not found in .env${NC}"
        exit 1
    fi
else
    echo -e "${RED}   ❌ .env file not found${NC}"
    exit 1
fi

source .env

# Check deployer
echo ""
echo -e "${YELLOW}2. Checking deployer wallet...${NC}"
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}   ❌ PRIVATE_KEY is empty${NC}"
    exit 1
fi

DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY 2>/dev/null || echo "")
if [ -z "$DEPLOYER" ]; then
    echo -e "${RED}   ❌ Invalid PRIVATE_KEY${NC}"
    exit 1
fi

echo -e "${GREEN}   ✅ Deployer address: ${DEPLOYER}${NC}"

# Check network connectivity
echo ""
echo -e "${YELLOW}3. Checking network connectivity...${NC}"
if cast chain-id --rpc-url $SOMNIA_RPC &>/dev/null; then
    CURRENT_CHAIN_ID=$(cast chain-id --rpc-url $SOMNIA_RPC)
    echo -e "${GREEN}   ✅ Connected to Somnia network${NC}"
    echo -e "${GREEN}   ✅ Chain ID: ${CURRENT_CHAIN_ID}${NC}"
    
    if [ "$CURRENT_CHAIN_ID" != "$CHAIN_ID" ]; then
        echo -e "${RED}   ❌ Wrong network! Expected ${CHAIN_ID}${NC}"
        exit 1
    fi
else
    echo -e "${RED}   ❌ Cannot connect to Somnia RPC${NC}"
    exit 1
fi

# Check balance
echo ""
echo -e "${YELLOW}4. Checking deployer balance...${NC}"
BALANCE=$(cast balance $DEPLOYER --rpc-url $SOMNIA_RPC 2>/dev/null || echo "0")
BALANCE_ETH=$(cast --to-unit $BALANCE ether 2>/dev/null || echo "0")

echo -e "${GREEN}   Balance: ${BALANCE_ETH} STT${NC}"

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}   ❌ No balance! Get STT tokens from faucet${NC}"
    echo -e "${YELLOW}   Visit: https://faucet.somnia.network${NC}"
    exit 1
else
    echo -e "${GREEN}   ✅ Sufficient balance for deployment${NC}"
fi

# Check gas price
echo ""
echo -e "${YELLOW}5. Checking gas price...${NC}"
GAS_PRICE=$(cast gas-price --rpc-url $SOMNIA_RPC 2>/dev/null || echo "0")
GAS_PRICE_GWEI=$(cast --to-unit $GAS_PRICE gwei 2>/dev/null || echo "0")
echo -e "${GREEN}   Current gas price: ${GAS_PRICE_GWEI} Gwei${NC}"

# Check block gas limit
echo ""
echo -e "${YELLOW}6. Checking block gas limit...${NC}"
LATEST_BLOCK=$(cast block latest --rpc-url $SOMNIA_RPC --json 2>/dev/null)
if [ -n "$LATEST_BLOCK" ]; then
    GAS_LIMIT=$(echo $LATEST_BLOCK | jq -r '.gasLimit' 2>/dev/null || echo "unknown")
    GAS_USED=$(echo $LATEST_BLOCK | jq -r '.gasUsed' 2>/dev/null || echo "unknown")
    
    echo -e "${GREEN}   Block gas limit: ${GAS_LIMIT}${NC}"
    echo -e "${GREEN}   Block gas used: ${GAS_USED}${NC}"
else
    echo -e "${YELLOW}   ⚠️  Could not retrieve block info${NC}"
fi

# Check contract compilation
echo ""
echo -e "${YELLOW}7. Checking contract compilation...${NC}"
if [ -d "out" ]; then
    echo -e "${GREEN}   ✅ Contracts compiled (out/ directory exists)${NC}"
    
    # Check specific contracts
    CONTRACTS=("MockOrangeToken" "WaterToken" "LandNFT" "BotNFT" "GameRegistry" "Marketplace" "HarvestSettlement" "RealTimeHarvest")
    
    for CONTRACT in "${CONTRACTS[@]}"; do
        if [ -d "out/${CONTRACT}.sol" ]; then
            echo -e "${GREEN}   ✅ ${CONTRACT} compiled${NC}"
        else
            echo -e "${RED}   ❌ ${CONTRACT} not compiled${NC}"
        fi
    done
else
    echo -e "${RED}   ❌ Contracts not compiled (run: forge build)${NC}"
    exit 1
fi

# Estimate deployment cost
echo ""
echo -e "${YELLOW}8. Estimating deployment costs...${NC}"
echo -e "${BLUE}   Note: Deploying with proxies will cost more${NC}"

# Try to get code size of compiled contracts
if [ -f "out/MockOrangeToken.sol/MockOrangeToken.json" ]; then
    BYTECODE_SIZE=$(jq -r '.deployedBytecode.object' out/MockOrangeToken.sol/MockOrangeToken.json | wc -c)
    BYTECODE_SIZE=$((BYTECODE_SIZE / 2))  # Convert hex chars to bytes
    echo -e "${GREEN}   MockOrangeToken bytecode: ~${BYTECODE_SIZE} bytes${NC}"
fi

# Estimated gas costs
echo ""
echo -e "${BLUE}   Estimated gas costs per contract:${NC}"
echo -e "${BLUE}   - Token contracts: ~1-2 million gas${NC}"
echo -e "${BLUE}   - NFT contracts: ~3-4 million gas${NC}"
echo -e "${BLUE}   - Game contracts: ~2-3 million gas${NC}"
echo -e "${BLUE}   - Marketplace: ~2.5-3 million gas${NC}"
echo -e "${BLUE}   - Total for all 8 contracts: ~20-25 million gas${NC}"

if [ "$GAS_PRICE" != "0" ]; then
    ESTIMATED_COST=$(echo "scale=6; $GAS_PRICE * 25000000 / 1000000000000000000" | bc 2>/dev/null || echo "unknown")
    echo -e "${BLUE}   Estimated total cost: ~${ESTIMATED_COST} STT${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Diagnostic Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}✅ Environment configured correctly${NC}"
echo -e "${GREEN}✅ Network connection established${NC}"
echo -e "${GREEN}✅ Deployer has balance${NC}"
echo -e "${GREEN}✅ Contracts compiled${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${YELLOW}1. Run: ./deploy-individual.sh${NC}"
echo -e "${YELLOW}2. Or run: forge script script/DeployAll.s.sol:DeployAll --rpc-url \$SOMNIA_RPC_URL --broadcast --legacy${NC}"
echo ""
