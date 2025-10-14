#!/bin/bash

# ========================================
# 🍊 Grant MINTER_ROLE to New GameRegistry
# ========================================

set -e

CAST="$HOME/.foundry/bin/cast"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}🔑 Granting MINTER_ROLE to GameRegistry${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

# Load environment
source .env

SOMNIA_RPC="https://dream-rpc.somnia.network"
MINTER_ROLE="0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"

# New GameRegistry address
NEW_GAME_REGISTRY="0xBF7373F30b461f7e18ef4c56C44ef556Ceb55658"

# Contract addresses
MOCK_ORANGE="0xD128e5A2D5a2c442037246D465e1fAa3eC7559e4"
WATER_TOKEN="0x62aDa07320E2F593af5483e1260b5B102Cf82692"
LAND_NFT="0x5ccCcd17B5b860ba35dcca9779Fe5fE914026503"
BOT_NFT="0x50e70D689aF3AA347241285F8EdBABb6988A3d6A"

echo -e "${CYAN}New GameRegistry: ${NEW_GAME_REGISTRY}${NC}"
echo ""

echo -e "${CYAN}1/4 Granting MINTER_ROLE on MockOrangeToken...${NC}"
$CAST send $MOCK_ORANGE \
  "grantRole(bytes32,address)" \
  $MINTER_ROLE \
  $NEW_GAME_REGISTRY \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy

echo -e "${CYAN}2/4 Granting MINTER_ROLE on WaterToken...${NC}"
$CAST send $WATER_TOKEN \
  "grantRole(bytes32,address)" \
  $MINTER_ROLE \
  $NEW_GAME_REGISTRY \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy

echo -e "${CYAN}3/4 Granting MINTER_ROLE on LandNFT...${NC}"
$CAST send $LAND_NFT \
  "grantRole(bytes32,address)" \
  $MINTER_ROLE \
  $NEW_GAME_REGISTRY \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy

echo -e "${CYAN}4/4 Granting MINTER_ROLE on BotNFT...${NC}"
$CAST send $BOT_NFT \
  "grantRole(bytes32,address)" \
  $MINTER_ROLE \
  $NEW_GAME_REGISTRY \
  --rpc-url $SOMNIA_RPC \
  --private-key $PRIVATE_KEY \
  --legacy

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All MINTER_ROLE grants complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}GameRegistry can now mint NFTs and tokens!${NC}"
echo -e "${CYAN}Try registering at: http://localhost:5173${NC}"
echo ""
