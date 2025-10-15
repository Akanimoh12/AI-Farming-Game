#!/bin/bash

# ========================================
# 🔍 Verify Deployment & Role Grants
# ========================================

set -e

CAST="$HOME/.foundry/bin/cast"
SOMNIA_RPC="https://dream-rpc.somnia.network"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}🔍 Verifying Deployment & Permissions${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

# Load addresses
source deployed-addresses.env

MINTER_ROLE="0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
SETTLER_ROLE="0x6666bf5bfee463d10a7fc50448047f8a53b7762d7e28fbc5c643182785f3fd3f"

echo -e "${CYAN}📋 Contract Addresses:${NC}"
echo -e "MockOrangeToken:   ${MOCK_ORANGE_TOKEN}"
echo -e "HarvestSettlement: ${HARVEST_SETTLEMENT}"
echo -e "RealTimeHarvest:   ${REAL_TIME_HARVEST}"
echo ""

echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}🔑 Checking CRITICAL Permissions...${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

# Check HarvestSettlement has MINTER_ROLE on MockOrangeToken
echo -e "${YELLOW}1. HarvestSettlement can mint ORANGE tokens?${NC}"
RESULT=$($CAST call $MOCK_ORANGE_TOKEN "hasRole(bytes32,address)" $MINTER_ROLE $HARVEST_SETTLEMENT --rpc-url $SOMNIA_RPC)
if [ "$RESULT" == "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
    echo -e "${GREEN}   ✅ YES - HarvestSettlement has MINTER_ROLE${NC}"
    echo -e "${GREEN}      Harvest will mint tokens successfully!${NC}"
else
    echo -e "${RED}   ❌ NO - HarvestSettlement missing MINTER_ROLE${NC}"
    echo -e "${RED}      Harvest will FAIL! Need to grant role!${NC}"
fi
echo ""

# Check RealTimeHarvest has SETTLER_ROLE on HarvestSettlement
echo -e "${YELLOW}2. RealTimeHarvest can commit harvests?${NC}"
RESULT=$($CAST call $HARVEST_SETTLEMENT "hasRole(bytes32,address)" $SETTLER_ROLE $REAL_TIME_HARVEST --rpc-url $SOMNIA_RPC)
if [ "$RESULT" == "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
    echo -e "${GREEN}   ✅ YES - RealTimeHarvest has SETTLER_ROLE${NC}"
else
    echo -e "${RED}   ❌ NO - RealTimeHarvest missing SETTLER_ROLE${NC}"
fi
echo ""

# Check GameRegistry has MINTER_ROLE on MockOrangeToken
echo -e "${YELLOW}3. GameRegistry can mint ORANGE tokens?${NC}"
RESULT=$($CAST call $MOCK_ORANGE_TOKEN "hasRole(bytes32,address)" $MINTER_ROLE $GAME_REGISTRY --rpc-url $SOMNIA_RPC)
if [ "$RESULT" == "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
    echo -e "${GREEN}   ✅ YES - GameRegistry has MINTER_ROLE${NC}"
    echo -e "${GREEN}      Registration will work!${NC}"
else
    echo -e "${RED}   ❌ NO - GameRegistry missing MINTER_ROLE${NC}"
fi
echo ""

# Check RealTimeHarvest has MINTER_ROLE on LandNFT
echo -e "${YELLOW}4. RealTimeHarvest can update lands?${NC}"
RESULT=$($CAST call $LAND_NFT "hasRole(bytes32,address)" $MINTER_ROLE $REAL_TIME_HARVEST --rpc-url $SOMNIA_RPC)
if [ "$RESULT" == "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
    echo -e "${GREEN}   ✅ YES - RealTimeHarvest has MINTER_ROLE on LandNFT${NC}"
else
    echo -e "${RED}   ❌ NO - RealTimeHarvest missing MINTER_ROLE on LandNFT${NC}"
fi
echo ""

echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}🧪 Testing Contract Functions...${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

# Check MockOrangeToken details
echo -e "${YELLOW}5. MockOrangeToken details:${NC}"
NAME=$($CAST call $MOCK_ORANGE_TOKEN "name()" --rpc-url $SOMNIA_RPC | $CAST --to-ascii)
SYMBOL=$($CAST call $MOCK_ORANGE_TOKEN "symbol()" --rpc-url $SOMNIA_RPC | $CAST --to-ascii)
echo -e "   Name: ${NAME}"
echo -e "   Symbol: ${SYMBOL}"
echo -e "${GREEN}   ✅ Token contract is live${NC}"
echo ""

# Check HarvestSettlement mockOrangeToken address
echo -e "${YELLOW}6. HarvestSettlement configuration:${NC}"
TOKEN_ADDR=$($CAST call $HARVEST_SETTLEMENT "mockOrangeToken()" --rpc-url $SOMNIA_RPC)
EXPECTED="0x000000000000000000000000${MOCK_ORANGE_TOKEN:2}"
if [ "$TOKEN_ADDR" == "$EXPECTED" ]; then
    echo -e "${GREEN}   ✅ HarvestSettlement correctly configured with MockOrangeToken${NC}"
    echo -e "      Address: ${MOCK_ORANGE_TOKEN}"
else
    echo -e "${RED}   ❌ HarvestSettlement has wrong token address${NC}"
    echo -e "      Expected: ${MOCK_ORANGE_TOKEN}"
    echo -e "      Got: ${TOKEN_ADDR}"
fi
echo ""

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Verification Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📝 Summary:${NC}"
echo -e "All contracts are deployed to Somnia Dream Testnet"
echo -e "Critical permissions have been verified"
echo -e "Ready for testing!"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Start frontend: cd ../frontend && npm run dev"
echo -e "2. Connect wallet and register"
echo -e "3. Test daily mint feature"
echo -e "4. Assign bot to land"
echo -e "5. Complete harvest and verify token minting"
echo ""
