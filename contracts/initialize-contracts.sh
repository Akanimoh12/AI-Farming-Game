#!/bin/bash

# ========================================
# 🍊 Orange Farm - Initialize Contracts
# ========================================
# Initialize all deployed contracts on Somnia testnet

set -e

# Foundry executables
FORGE="$HOME/.foundry/bin/forge"
CAST="$HOME/.foundry/bin/cast"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}🍊 Initializing Orange Farm Contracts${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Load environment
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

source .env

SOMNIA_RPC="https://dream-rpc.somnia.network"
DEPLOYER=$(cast wallet address --private-key $PRIVATE_KEY)

echo -e "${GREEN}Deployer: ${DEPLOYER}${NC}"
echo ""

# Contract addresses
MOCK_ORANGE="0xD128e5A2D5a2c442037246D465e1fAa3eC7559e4"
WATER_TOKEN="0x62aDa07320E2F593af5483e1260b5B102Cf82692"
LAND_NFT="0x5ccCcd17B5b860ba35dcca9779Fe5fE914026503"
BOT_NFT="0x50e70D689aF3AA347241285F8EdBABb6988A3d6A"
GAME_REGISTRY="0x62B8d78D467674ddb2B3f44EA88eb7dC128f3601"
REAL_TIME_HARVEST="0x1bF651677BB5564fECB2Fa8e315E3128BC87EA20"
MARKETPLACE="0x513F81f809F292Cbd2129923d82157299FaAC581"
HARVEST_SETTLEMENT="0x241A1FcA8e59169bA2F11a41313a31e962D7594d"

# Configuration
BASE_URI="ipfs://QmOrangeFarmMetadata/"
LAND_EXPANSION_COST="10000000000000000000"  # 10 tokens
HARVEST_CYCLE_DURATION="600"  # 10 minutes

echo -e "${CYAN}1/8 Initializing MockOrangeToken...${NC}"
$CAST send $MOCK_ORANGE \
  "initialize(address)" \
  $DEPLOYER \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy || echo -e "${YELLOW}   Already initialized or failed${NC}"

echo -e "${CYAN}2/8 Initializing WaterToken...${NC}"
$CAST send $WATER_TOKEN \
  "initialize(address)" \
  $DEPLOYER \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy || echo -e "${YELLOW}   Already initialized or failed${NC}"

echo -e "${CYAN}3/8 Initializing LandNFT...${NC}"
$CAST send $LAND_NFT \
  "initialize(address,string,address,uint256)" \
  $DEPLOYER \
  "$BASE_URI" \
  $MOCK_ORANGE \
  $LAND_EXPANSION_COST \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy || echo -e "${YELLOW}   Already initialized or failed${NC}"

echo -e "${CYAN}4/8 Initializing BotNFT...${NC}"
$CAST send $BOT_NFT \
  "initialize(address,string,address,address)" \
  $DEPLOYER \
  "$BASE_URI" \
  $MOCK_ORANGE \
  $LAND_NFT \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy || echo -e "${YELLOW}   Already initialized or failed${NC}"

echo -e "${CYAN}5/8 Initializing GameRegistry...${NC}"
$CAST send $GAME_REGISTRY \
  "initialize(address,address,address,address,address)" \
  $DEPLOYER \
  $MOCK_ORANGE \
  $LAND_NFT \
  $BOT_NFT \
  $WATER_TOKEN \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy || echo -e "${YELLOW}   Already initialized or failed${NC}"

echo -e "${CYAN}6/8 Initializing RealTimeHarvest...${NC}"
$CAST send $REAL_TIME_HARVEST \
  "initialize(address,address,address,uint256)" \
  $DEPLOYER \
  $LAND_NFT \
  $BOT_NFT \
  $HARVEST_CYCLE_DURATION \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy || echo -e "${YELLOW}   Already initialized or failed${NC}"

echo -e "${CYAN}7/8 Initializing Marketplace...${NC}"
$CAST send $MARKETPLACE \
  "initialize(address,address,address,address,address)" \
  $MOCK_ORANGE \
  $LAND_NFT \
  $BOT_NFT \
  $WATER_TOKEN \
  $DEPLOYER \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy || echo -e "${YELLOW}   Already initialized or failed${NC}"

echo -e "${CYAN}8/8 Initializing HarvestSettlement...${NC}"
$CAST send $HARVEST_SETTLEMENT \
  "initialize(address,address,address)" \
  $DEPLOYER \
  $MOCK_ORANGE \
  $GAME_REGISTRY \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy || echo -e "${YELLOW}   Already initialized or failed${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Initialization Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Your contracts are now ready to use!${NC}"
echo -e "${CYAN}Try registering again at: http://localhost:5174${NC}"
echo ""
