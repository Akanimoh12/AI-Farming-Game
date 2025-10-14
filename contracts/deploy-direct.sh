#!/bin/bash

# ========================================
# 🍊 Deploy All Direct Contracts (Bytecode Method)
# ========================================
# Fast deployment using bytecode for all contracts

set -e

CAST="$HOME/.foundry/bin/cast"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}🍊 Deploying Orange Farm Contracts${NC}"
echo -e "${CYAN}    (Direct/Non-Upgradeable Version)${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

# Load environment
source .env

SOMNIA_RPC="https://dream-rpc.somnia.network"
ADMIN="0x58C25c26666B31241C67Cf7B9a82e325eB07c342"
DEFAULT_REFERRER="FarmDAO"
BASE_URI="ipfs://QmOrangeFarmMetadata/"
LAND_EXPANSION_COST="10000000000000000000"  # 10 tokens
HARVEST_CYCLE="600"  # 10 minutes

echo -e "${GREEN}Admin Address: ${ADMIN}${NC}"
echo -e "${GREEN}Network: Somnia Dream Testnet${NC}"
echo -e "${GREEN}Default Referrer: ${DEFAULT_REFERRER}${NC}"
echo ""

# Helper function to deploy contract
deploy_contract() {
    local contract_name=$1
    local bytecode_file=$2
    local constructor_args=$3
    
    echo -e "${CYAN}Deploying ${contract_name}...${NC}"
    
    local bytecode=$(cat $bytecode_file | jq -r '.bytecode.object')
    local full_bytecode="${bytecode}${constructor_args}"
    
    local result=$($CAST send \
        --rpc-url $SOMNIA_RPC \
        --private-key $PRIVATE_KEY \
        --legacy \
        --create $full_bytecode 2>&1)
    
    local contract_address=$(echo "$result" | grep -oP 'contractAddress\s+\K0x[a-fA-F0-9]{40}' | head -1)
    
    if [ -z "$contract_address" ]; then
        echo -e "${YELLOW}   Warning: Could not extract address, trying alternative method...${NC}"
        contract_address=$(echo "$result" | grep -oP '0x[a-fA-F0-9]{40}' | head -1)
    fi
    
    if [ -z "$contract_address" ]; then
        echo -e "${RED}   ❌ Failed to deploy ${contract_name}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}   ✅ Deployed at: ${contract_address}${NC}"
    echo "$contract_address"
}

# 1. Deploy MockOrangeToken
echo -e "${CYAN}═══ 1/8 MockOrangeToken ═══${NC}"
MOCK_ORANGE_ARGS="000000000000000000000000${ADMIN:2}"
MOCK_ORANGE=$(deploy_contract \
    "MockOrangeToken" \
    "out/direct/MockOrangeToken.sol/MockOrangeToken.json" \
    "$MOCK_ORANGE_ARGS")
echo ""

# 2. Deploy WaterToken
echo -e "${CYAN}═══ 2/8 WaterToken ═══${NC}"
WATER_ARGS="000000000000000000000000${ADMIN:2}"
WATER=$(deploy_contract \
    "WaterToken" \
    "out/direct/WaterToken.sol/WaterToken.json" \
    "$WATER_ARGS")
echo ""

# 3. Deploy LandNFT
echo -e "${CYAN}═══ 3/8 LandNFT ═══${NC}"
LAND_ARGS=$(cast abi-encode \
    "constructor(address,string,address,uint256)" \
    $ADMIN \
    "$BASE_URI" \
    $MOCK_ORANGE \
    $LAND_EXPANSION_COST | sed 's/0x//')
LAND=$(deploy_contract \
    "LandNFT" \
    "out/direct/LandNFT.sol/LandNFT.json" \
    "$LAND_ARGS")
echo ""

# 4. Deploy BotNFT
echo -e "${CYAN}═══ 4/8 BotNFT ═══${NC}"
BOT_ARGS=$(cast abi-encode \
    "constructor(address,string,address,address)" \
    $ADMIN \
    "$BASE_URI" \
    $MOCK_ORANGE \
    $LAND | sed 's/0x//')
BOT=$(deploy_contract \
    "BotNFT" \
    "out/direct/BotNFT.sol/BotNFT.json" \
    "$BOT_ARGS")
echo ""

# 5. Deploy GameRegistry
echo -e "${CYAN}═══ 5/8 GameRegistry ═══${NC}"
REGISTRY_ARGS=$(cast abi-encode \
    "constructor(address,address,address,address,address,string)" \
    $ADMIN \
    $MOCK_ORANGE \
    $LAND \
    $BOT \
    $WATER \
    "$DEFAULT_REFERRER" | sed 's/0x//')
REGISTRY=$(deploy_contract \
    "GameRegistry" \
    "out/direct/GameRegistry.sol/GameRegistry.json" \
    "$REGISTRY_ARGS")
echo ""

# 6. Deploy RealTimeHarvest
echo -e "${CYAN}═══ 6/8 RealTimeHarvest ═══${NC}"
HARVEST_ARGS=$(cast abi-encode \
    "constructor(address,address,address,uint64)" \
    $ADMIN \
    $LAND \
    $BOT \
    $HARVEST_CYCLE | sed 's/0x//')
REAL_TIME_HARVEST=$(deploy_contract \
    "RealTimeHarvest" \
    "out/direct/RealTimeHarvest.sol/RealTimeHarvest.json" \
    "$HARVEST_ARGS")
echo ""

# 7. Deploy Marketplace
echo -e "${CYAN}═══ 7/8 Marketplace ═══${NC}"
MARKETPLACE_ARGS=$(cast abi-encode \
    "constructor(address,address,address,address,address,address)" \
    $ADMIN \
    $MOCK_ORANGE \
    $LAND \
    $BOT \
    $WATER \
    $ADMIN | sed 's/0x//')
MARKETPLACE=$(deploy_contract \
    "Marketplace" \
    "out/direct/Marketplace.sol/Marketplace.json" \
    "$MARKETPLACE_ARGS")
echo ""

# 8. Deploy HarvestSettlement
echo -e "${CYAN}═══ 8/8 HarvestSettlement ═══${NC}"
SETTLEMENT_ARGS=$(cast abi-encode \
    "constructor(address,address)" \
    $ADMIN \
    $REGISTRY | sed 's/0x//')
HARVEST_SETTLEMENT=$(deploy_contract \
    "HarvestSettlement" \
    "out/direct/HarvestSettlement.sol/HarvestSettlement.json" \
    "$SETTLEMENT_ARGS")
echo ""

# Grant MINTER_ROLE to GameRegistry
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}🔑 Granting Roles...${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

MINTER_ROLE="0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"

echo -e "${CYAN}Granting MINTER_ROLE to GameRegistry on MockOrangeToken...${NC}"
$CAST send $MOCK_ORANGE \
    "grantRole(bytes32,address)" \
    $MINTER_ROLE \
    $REGISTRY \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy > /dev/null 2>&1 && echo -e "${GREEN}   ✅ Done${NC}"

echo -e "${CYAN}Granting MINTER_ROLE to GameRegistry on WaterToken...${NC}"
$CAST send $WATER \
    "grantRole(bytes32,address)" \
    $MINTER_ROLE \
    $REGISTRY \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy > /dev/null 2>&1 && echo -e "${GREEN}   ✅ Done${NC}"

echo -e "${CYAN}Granting MINTER_ROLE to GameRegistry on LandNFT...${NC}"
$CAST send $LAND \
    "grantRole(bytes32,address)" \
    $MINTER_ROLE \
    $REGISTRY \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy > /dev/null 2>&1 && echo -e "${GREEN}   ✅ Done${NC}"

echo -e "${CYAN}Granting MINTER_ROLE to GameRegistry on BotNFT...${NC}"
$CAST send $BOT \
    "grantRole(bytes32,address)" \
    $MINTER_ROLE \
    $REGISTRY \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy > /dev/null 2>&1 && echo -e "${GREEN}   ✅ Done${NC}"

echo -e "${CYAN}Granting MINTER_ROLE to Marketplace on all contracts...${NC}"
$CAST send $MOCK_ORANGE "grantRole(bytes32,address)" $MINTER_ROLE $MARKETPLACE --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $WATER "grantRole(bytes32,address)" $MINTER_ROLE $MARKETPLACE --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $LAND "grantRole(bytes32,address)" $MINTER_ROLE $MARKETPLACE --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $BOT "grantRole(bytes32,address)" $MINTER_ROLE $MARKETPLACE --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
echo -e "${GREEN}   ✅ Done${NC}"

echo -e "${CYAN}Granting MINTER_ROLE to RealTimeHarvest on BotNFT...${NC}"
$CAST send $BOT \
    "grantRole(bytes32,address)" \
    $MINTER_ROLE \
    $REAL_TIME_HARVEST \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy > /dev/null 2>&1 && echo -e "${GREEN}   ✅ Done${NC}"

echo ""

# Summary
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All Contracts Deployed Successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📋 Contract Addresses:${NC}"
echo -e "${YELLOW}MockOrangeToken:${NC}     $MOCK_ORANGE"
echo -e "${YELLOW}WaterToken:${NC}          $WATER"
echo -e "${YELLOW}LandNFT:${NC}             $LAND"
echo -e "${YELLOW}BotNFT:${NC}              $BOT"
echo -e "${YELLOW}GameRegistry:${NC}        $REGISTRY"
echo -e "${YELLOW}RealTimeHarvest:${NC}     $REAL_TIME_HARVEST"
echo -e "${YELLOW}Marketplace:${NC}         $MARKETPLACE"
echo -e "${YELLOW}HarvestSettlement:${NC}   $HARVEST_SETTLEMENT"
echo ""

# Save addresses to file
cat > deployed-addresses.env << EOF
# 🍊 Orange Farm - Deployed Contract Addresses
# Direct (Non-Upgradeable) Deployment
# Network: Somnia Dream Testnet (Chain ID: 50312)
# Deployed: $(date)

MOCK_ORANGE_TOKEN=$MOCK_ORANGE
WATER_TOKEN=$WATER
LAND_NFT=$LAND
BOT_NFT=$BOT
GAME_REGISTRY=$REGISTRY
REAL_TIME_HARVEST=$REAL_TIME_HARVEST
MARKETPLACE=$MARKETPLACE
HARVEST_SETTLEMENT=$HARVEST_SETTLEMENT

# Admin
ADMIN_ADDRESS=$ADMIN

# Config
DEFAULT_REFERRER=$DEFAULT_REFERRER
BASE_URI=$BASE_URI

# Network
RPC_URL=$SOMNIA_RPC
CHAIN_ID=50312
EOF

echo -e "${GREEN}✅ Addresses saved to deployed-addresses.env${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "1. ${GREEN}✅${NC} All roles granted automatically"
echo -e "2. Update frontend .env with new addresses"
echo -e "3. Copy ABIs to frontend"
echo -e "4. Test registration!"
echo ""
