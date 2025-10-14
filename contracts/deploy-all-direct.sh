#!/bin/bash

# ========================================
# 🍊 Deploy All Direct Contracts
# ========================================

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
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

# Load environment
source .env

SOMNIA_RPC="https://dream-rpc.somnia.network"
ADMIN="0x58C25c26666B31241C67Cf7B9a82e325eB07c342"

echo -e "${GREEN}Admin Address: ${ADMIN}${NC}"
echo ""

# Helper function
wait_for_tx() {
    sleep 3
}

# 1. Deploy MockOrangeToken
echo -e "${CYAN}═══ 1/8 MockOrangeToken ═══${NC}"
MOCK_ORANGE=$($CAST send \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy \
    --json \
    --create $(cat out/direct/MockOrangeToken.sol/MockOrangeToken.json | jq -r '.bytecode.object')000000000000000000000000${ADMIN:2} \
    | jq -r '.contractAddress')
echo -e "${GREEN}   ✅ MockOrangeToken: ${MOCK_ORANGE}${NC}"
wait_for_tx

# 2. Deploy WaterToken
echo -e "${CYAN}═══ 2/8 WaterToken ═══${NC}"
WATER=$($CAST send \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy \
    --json \
    --create $(cat out/direct/WaterToken.sol/WaterToken.json | jq -r '.bytecode.object')000000000000000000000000${ADMIN:2} \
    | jq -r '.contractAddress')
echo -e "${GREEN}   ✅ WaterToken: ${WATER}${NC}"
wait_for_tx

# 3. Deploy LandNFT
echo -e "${CYAN}═══ 3/8 LandNFT ═══${NC}"
LAND_BYTECODE=$(cat out/direct/LandNFT.sol/LandNFT.json | jq -r '.bytecode.object')
LAND_ARGS=$($CAST abi-encode "constructor(address,string,address,uint256)" $ADMIN "ipfs://QmOrangeFarmMetadata/" $MOCK_ORANGE "10000000000000000000")
LAND=$($CAST send \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy \
    --json \
    --create ${LAND_BYTECODE}${LAND_ARGS:2} \
    | jq -r '.contractAddress')
echo -e "${GREEN}   ✅ LandNFT: ${LAND}${NC}"
wait_for_tx

# 4. Deploy BotNFT
echo -e "${CYAN}═══ 4/8 BotNFT ═══${NC}"
BOT_BYTECODE=$(cat out/direct/BotNFT.sol/BotNFT.json | jq -r '.bytecode.object')
BOT_ARGS=$($CAST abi-encode "constructor(address,string,address,address)" $ADMIN "ipfs://QmOrangeFarmMetadata/" $MOCK_ORANGE $LAND)
BOT=$($CAST send \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy \
    --json \
    --create ${BOT_BYTECODE}${BOT_ARGS:2} \
    | jq -r '.contractAddress')
echo -e "${GREEN}   ✅ BotNFT: ${BOT}${NC}"
wait_for_tx

# 5. Deploy GameRegistry
echo -e "${CYAN}═══ 5/8 GameRegistry ═══${NC}"
REGISTRY_BYTECODE=$(cat out/direct/GameRegistry.sol/GameRegistry.json | jq -r '.bytecode.object')
REGISTRY_ARGS=$($CAST abi-encode "constructor(address,address,address,address,address,string)" $ADMIN $MOCK_ORANGE $LAND $BOT $WATER "FarmDAO")
REGISTRY=$($CAST send \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy \
    --json \
    --create ${REGISTRY_BYTECODE}${REGISTRY_ARGS:2} \
    | jq -r '.contractAddress')
echo -e "${GREEN}   ✅ GameRegistry: ${REGISTRY}${NC}"
wait_for_tx

# 6. Deploy RealTimeHarvest
echo -e "${CYAN}═══ 6/8 RealTimeHarvest ═══${NC}"
HARVEST_BYTECODE=$(cat out/direct/RealTimeHarvest.sol/RealTimeHarvest.json | jq -r '.bytecode.object')
HARVEST_ARGS=$($CAST abi-encode "constructor(address,address,address,uint64)" $ADMIN $LAND $BOT "600")
REAL_TIME_HARVEST=$($CAST send \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy \
    --json \
    --create ${HARVEST_BYTECODE}${HARVEST_ARGS:2} \
    | jq -r '.contractAddress')
echo -e "${GREEN}   ✅ RealTimeHarvest: ${REAL_TIME_HARVEST}${NC}"
wait_for_tx

# 7. Deploy Marketplace
echo -e "${CYAN}═══ 7/8 Marketplace ═══${NC}"
MARKETPLACE_BYTECODE=$(cat out/direct/Marketplace.sol/Marketplace.json | jq -r '.bytecode.object')
MARKETPLACE_ARGS=$($CAST abi-encode "constructor(address,address,address,address,address,address)" $ADMIN $MOCK_ORANGE $LAND $BOT $WATER $ADMIN)
MARKETPLACE=$($CAST send \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy \
    --json \
    --create ${MARKETPLACE_BYTECODE}${MARKETPLACE_ARGS:2} \
    | jq -r '.contractAddress')
echo -e "${GREEN}   ✅ Marketplace: ${MARKETPLACE}${NC}"
wait_for_tx

# 8. Deploy HarvestSettlement
echo -e "${CYAN}═══ 8/8 HarvestSettlement ═══${NC}"
SETTLEMENT_BYTECODE=$(cat out/direct/HarvestSettlement.sol/HarvestSettlement.json | jq -r '.bytecode.object')
SETTLEMENT_ARGS=$($CAST abi-encode "constructor(address,address)" $ADMIN $REGISTRY)
HARVEST_SETTLEMENT=$($CAST send \
    --rpc-url $SOMNIA_RPC \
    --private-key $PRIVATE_KEY \
    --legacy \
    --json \
    --create ${SETTLEMENT_BYTECODE}${SETTLEMENT_ARGS:2} \
    | jq -r '.contractAddress')
echo -e "${GREEN}   ✅ HarvestSettlement: ${HARVEST_SETTLEMENT}${NC}"
echo ""

# Grant roles
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}🔑 Granting Roles...${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

MINTER_ROLE="0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"

echo -e "${CYAN}Granting MINTER_ROLE to GameRegistry...${NC}"
$CAST send $MOCK_ORANGE "grantRole(bytes32,address)" $MINTER_ROLE $REGISTRY --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $WATER "grantRole(bytes32,address)" $MINTER_ROLE $REGISTRY --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $LAND "grantRole(bytes32,address)" $MINTER_ROLE $REGISTRY --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $BOT "grantRole(bytes32,address)" $MINTER_ROLE $REGISTRY --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
echo -e "${GREEN}   ✅ GameRegistry can mint all assets${NC}"

echo -e "${CYAN}Granting MINTER_ROLE to Marketplace...${NC}"
$CAST send $MOCK_ORANGE "grantRole(bytes32,address)" $MINTER_ROLE $MARKETPLACE --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $WATER "grantRole(bytes32,address)" $MINTER_ROLE $MARKETPLACE --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $LAND "grantRole(bytes32,address)" $MINTER_ROLE $MARKETPLACE --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
$CAST send $BOT "grantRole(bytes32,address)" $MINTER_ROLE $MARKETPLACE --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
echo -e "${GREEN}   ✅ Marketplace can mint all assets${NC}"

echo -e "${CYAN}Granting MINTER_ROLE to RealTimeHarvest...${NC}"
$CAST send $BOT "grantRole(bytes32,address)" $MINTER_ROLE $REAL_TIME_HARVEST --rpc-url $SOMNIA_RPC --private-key $PRIVATE_KEY --legacy > /dev/null 2>&1
echo -e "${GREEN}   ✅ RealTimeHarvest can update bots${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
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

# Save addresses
cat > deployed-addresses.env << EOF
# 🍊 Orange Farm - Direct Contract Deployment
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

ADMIN_ADDRESS=$ADMIN
RPC_URL=$SOMNIA_RPC
CHAIN_ID=50312
EOF

echo -e "${GREEN}✅ Addresses saved to deployed-addresses.env${NC}"
echo ""
echo -e "${CYAN}Next: Update frontend/.env and copy ABIs${NC}"
