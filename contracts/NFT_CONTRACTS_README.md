# Orange Farm - NFT Contracts & Game Registry

Complete implementation of the NFT and game registry contracts for the Orange Farm on-chain gaming platform.

## 📋 Table of Contents
- [Contract Overview](#contract-overview)
- [Contract Specifications](#contract-specifications)
- [Deployment Guide](#deployment-guide)
- [Integration Guide](#integration-guide)
- [Testing](#testing)
- [Security Considerations](#security-considerations)

## Contract Overview

### Implemented Contracts

1. **LandNFT.sol** - ERC-721 NFT for land plots with expansion capabilities
2. **BotNFT.sol** - ERC-721 NFT for AI farming bots with assignment and upgrade mechanics
3. **GameRegistry.sol** - Player registration system with referral rewards and starter packs

### Key Features

#### LandNFT
- Three land types with different capacities
- Dynamic capacity expansion
- UUPS upgradeable pattern
- IPFS metadata support

#### BotNFT
- Three bot types with varying performance
- Land assignment system with capacity validation
- Bot upgrade mechanism
- Harvest tracking

#### GameRegistry
- Player registration with username uniqueness
- Referral system with rewards
- Automated starter pack distribution
- On-chain stats tracking

## Contract Specifications

### LandNFT

**Land Types:**
- Small: Base capacity 2 bots
- Medium: Base capacity 5 bots
- Large: Base capacity 10 bots

**Key Functions:**
```solidity
function mint(address to, LandType landType) external returns (uint256)
function expandCapacity(uint256 tokenId) external
function getCapacity(uint256 tokenId) external view returns (uint8)
function getLandData(uint256 tokenId) external view returns (LandData memory)
```

**Events:**
```solidity
event LandMinted(address indexed owner, uint256 indexed tokenId, LandType landType, uint8 capacity)
event LandExpanded(uint256 indexed tokenId, uint8 newCapacity, uint8 expansionCount)
```

**Configuration:**
- Expansion Cost: 10 MockOrangeDAO tokens per slot
- Only MINTER_ROLE can mint
- Owner can expand their own land

### BotNFT

**Bot Types & Stats:**
| Type | Harvest Rate | Water Consumption |
|------|--------------|-------------------|
| Basic | 10 oranges/cycle | 1 water/cycle |
| Advanced | 25 oranges/cycle | 2 water/cycle |
| Elite | 50 oranges/cycle | 4 water/cycle |

**Key Functions:**
```solidity
function mint(address to, BotType botType) external returns (uint256)
function assignToLand(uint256 botId, uint256 landId) external
function unassignBot(uint256 botId) external
function upgradeBot(uint256 botId) external
function getBotsOnLand(uint256 landId) external view returns (uint256[] memory)
function getBotData(uint256 tokenId) external view returns (BotData memory)
```

**Events:**
```solidity
event BotMinted(address indexed owner, uint256 indexed tokenId, BotType botType, uint16 harvestRate, uint8 waterConsumption)
event BotAssigned(uint256 indexed botId, uint256 indexed landId, address indexed owner)
event BotUnassigned(uint256 indexed botId, uint256 indexed landId)
event BotUpgraded(uint256 indexed botId, BotType oldType, BotType newType, uint16 newHarvestRate, uint8 newWaterConsumption)
```

**Upgrade Costs:**
- Basic → Advanced: 15 MockOrangeDAO tokens
- Advanced → Elite: 25 MockOrangeDAO tokens

### GameRegistry

**Starter Pack Contents:**
- 1 Small Land NFT
- 1 Basic Bot NFT
- 50 MockOrangeDAO tokens
- 50 Water tokens

**Key Functions:**
```solidity
function register(string memory username, string memory referralCode, string memory referredByCode) external
function commitHarvest(address player, uint256 orangeAmount) external
function getPlayerProfile(address player) external view returns (PlayerProfile memory)
function getPlayerStats(address player) external view returns (PlayerStats memory)
function isUsernameAvailable(string memory username) external view returns (bool)
function isReferralCodeAvailable(string memory referralCode) external view returns (bool)
```

**Events:**
```solidity
event PlayerRegistered(address indexed player, string username, string referralCode, address indexed referredBy)
event StarterPackClaimed(address indexed player, uint256 landId, uint256 botId, uint256 tokenAmount, uint256 waterAmount)
event ReferralRewarded(address indexed referrer, address indexed referee, uint256 rewardAmount)
event HarvestCommitted(address indexed player, uint256 orangeAmount, uint64 timestamp)
event LevelUp(address indexed player, uint32 newLevel)
```

**Referral System:**
- Both referrer and referee receive 25 MockOrangeDAO tokens
- Referral codes must be unique
- Cannot refer yourself

**Leveling System:**
- Every 1000 oranges = 1 level
- Level calculated from total committed oranges

## Deployment Guide

### Prerequisites

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Set environment variables:
```bash
export PRIVATE_KEY="your_private_key"
export RPC_URL="https://your-rpc-url"
export ETHERSCAN_API_KEY="your_api_key" # for verification
```

### Local Deployment (Anvil)

```bash
# Terminal 1: Start local node
anvil

# Terminal 2: Deploy contracts
forge script script/DeployGameContracts.s.sol \
    --rpc-url http://localhost:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --broadcast
```

### Testnet Deployment

```bash
forge script script/DeployGameContracts.s.sol \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify
```

### Deployment Output

The script will:
1. Deploy all 5 contracts with UUPS proxies
2. Initialize contracts with proper configuration
3. Setup role-based access control
4. Grant MINTER_ROLE to GameRegistry
5. Generate `deployment.json` with addresses
6. Output verification commands

### Post-Deployment Steps

1. **Update Frontend Configuration:**
```typescript
export const CONTRACT_ADDRESSES = {
  mockOrangeToken: "0x...",
  waterToken: "0x...",
  landNFT: "0x...",
  botNFT: "0x...",
  gameRegistry: "0x..."
};
```

2. **Upload NFT Metadata to IPFS:**
- Upload land and bot metadata JSON files
- Update baseURI in contracts:
```solidity
landNFT.setBaseURI("ipfs://QmYourActualCID/");
botNFT.setBaseURI("ipfs://QmYourActualCID/");
```

3. **Configure Game Parameters:**
```solidity
// Adjust starter pack if needed
gameRegistry.updateStarterPackConfig(
    50e18,  // starterTokenAmount
    50,     // starterWaterAmount
    25e18   // referralReward
);

// Adjust expansion cost if needed
landNFT.setExpansionCost(10e18);

// Adjust bot upgrade costs if needed
botNFT.setUpgradeCost(BotNFT.BotType.Advanced, 15e18);
botNFT.setUpgradeCost(BotNFT.BotType.Elite, 25e18);
```

## Integration Guide

### User Registration Flow

```typescript
import { useContractWrite } from 'wagmi';

function RegisterPlayer({ username, referralCode, referrerCode }) {
  const { write } = useContractWrite({
    address: CONTRACT_ADDRESSES.gameRegistry,
    abi: GameRegistryABI,
    functionName: 'register',
    args: [username, referralCode, referrerCode || ""]
  });

  return (
    <button onClick={() => write()}>
      Register & Claim Starter Pack
    </button>
  );
}
```

### Bot Assignment Flow

```typescript
async function assignBotToLand(botId: number, landId: number) {
  // 1. Check land capacity
  const capacity = await landNFT.read.getCapacity([landId]);
  const assignedBots = await botNFT.read.getBotsOnLand([landId]);
  
  if (assignedBots.length >= capacity) {
    throw new Error("Land at capacity");
  }

  // 2. Assign bot
  await botNFT.write.assignToLand([botId, landId]);
}
```

### Land Expansion Flow

```typescript
async function expandLand(tokenId: number) {
  const expansionCost = await landNFT.read.expansionCost();
  
  // 1. Approve tokens
  await mockOrangeToken.write.approve([
    landNFT.address,
    expansionCost
  ]);

  // 2. Expand capacity
  await landNFT.write.expandCapacity([tokenId]);
}
```

### Bot Upgrade Flow

```typescript
async function upgradeBot(botId: number) {
  const botData = await botNFT.read.getBotData([botId]);
  
  if (botData.botType === 2) { // Elite
    throw new Error("Already max tier");
  }

  const nextType = botData.botType + 1;
  const upgradeCost = await botNFT.read.upgradeCosts([nextType]);

  // 1. Approve tokens
  await mockOrangeToken.write.approve([
    botNFT.address,
    upgradeCost
  ]);

  // 2. Upgrade bot
  await botNFT.write.upgradeBot([botId]);
}
```

### Harvest Commit (Backend)

```typescript
// Cloud Function / Backend service
async function commitPlayerHarvest(playerAddress: string, orangeAmount: number) {
  // Only callable by GAME_MASTER_ROLE
  await gameRegistry.write.commitHarvest([
    playerAddress,
    orangeAmount
  ]);
}
```

## Testing

### Run All Tests

```bash
# Run all tests with gas reports
forge test --gas-report

# Run with detailed output
forge test -vvv

# Run specific test file
forge test --match-contract LandNFTTest

# Run specific test
forge test --match-test testMintSmallLand
```

### Test Coverage

```bash
# Generate coverage report
forge coverage

# Generate detailed HTML report
forge coverage --report lcov
genhtml lcov.info --output-directory coverage
open coverage/index.html
```

### Test Results Summary

- **Total Tests**: 152
- **Passing**: 152 (100%)
- **Coverage**: 85%+

**Test Breakdown:**
- MockOrangeToken: 29 tests
- WaterToken: 36 tests
- LandNFT: 32 tests
- BotNFT: 30 tests
- GameRegistry: 25 tests

### Gas Benchmarks

| Operation | Gas Cost |
|-----------|----------|
| Mint Small Land | ~102,000 |
| Mint Basic Bot | ~127,000 |
| Expand Land | ~189,000 |
| Assign Bot | ~296,000 |
| Upgrade Bot | ~218,000 |
| Register Player (no referral) | ~528,000 |
| Register Player (with referral) | ~923,000 |

## Security Considerations

### Access Control

All contracts implement role-based access control:
- **DEFAULT_ADMIN_ROLE**: Can upgrade contracts and manage roles
- **MINTER_ROLE**: Can mint new tokens/NFTs
- **PAUSER_ROLE**: Can pause contracts in emergencies
- **GAME_MASTER_ROLE**: Can commit harvests and update game state

### Upgrade Safety

- UUPS upgradeable pattern with storage gaps
- Only DEFAULT_ADMIN_ROLE can upgrade
- Consider using multisig wallet for admin operations

### Input Validation

- All user inputs validated (username length, referral codes, etc.)
- Zero address checks on all mints and transfers
- Capacity checks before bot assignment
- Balance checks before upgrades/expansions

### Emergency Controls

All contracts can be paused by PAUSER_ROLE:
```solidity
// Pause all operations
landNFT.pause();
botNFT.pause();
gameRegistry.pause();

// Resume operations
landNFT.unpause();
botNFT.unpause();
gameRegistry.unpause();
```

### Recommended Security Practices

1. **Use Multisig Wallet**: Deploy with Gnosis Safe for admin operations
2. **Timelock**: Consider adding timelock for upgrades
3. **Audit**: Get professional audit before mainnet deployment
4. **Monitoring**: Set up alerts for unusual activity
5. **Rate Limiting**: Implement in frontend to prevent spam

## Frontend Integration Examples

### React Hook for Player Profile

```typescript
function usePlayerProfile(address: string) {
  const { data: profile } = useContractRead({
    address: CONTRACT_ADDRESSES.gameRegistry,
    abi: GameRegistryABI,
    functionName: 'getPlayerProfile',
    args: [address]
  });

  const { data: stats } = useContractRead({
    address: CONTRACT_ADDRESSES.gameRegistry,
    abi: GameRegistryABI,
    functionName: 'getPlayerStats',
    args: [address]
  });

  return { profile, stats };
}
```

### Event Listeners

```typescript
// Listen for new registrations
gameRegistry.on('PlayerRegistered', (player, username, referralCode, referredBy) => {
  console.log(`New player registered: ${username}`);
  // Update UI, send analytics, etc.
});

// Listen for bot assignments
botNFT.on('BotAssigned', (botId, landId, owner) => {
  console.log(`Bot ${botId} assigned to land ${landId}`);
  // Update farm visualization
});

// Listen for harvests
gameRegistry.on('HarvestCommitted', (player, orangeAmount, timestamp) => {
  console.log(`${player} harvested ${orangeAmount} oranges`);
  // Show notification
});
```

## Troubleshooting

### Common Issues

1. **"insufficient allowance" error**
   - Solution: Approve tokens before expansion/upgrade

2. **"land at capacity" error**
   - Solution: Expand land or unassign other bots first

3. **"username taken" error**
   - Solution: Check availability with `isUsernameAvailable` first

4. **Transaction reverts during registration**
   - Check: Contracts have MINTER_ROLE granted to GameRegistry

### Debug Commands

```bash
# Check contract configuration
cast call $LAND_NFT "expansionCost()" --rpc-url $RPC_URL

# Check user's balance
cast call $MOCK_ORANGE_TOKEN "balanceOf(address)(uint256)" $USER_ADDRESS --rpc-url $RPC_URL

# Check land capacity
cast call $LAND_NFT "getCapacity(uint256)(uint8)" $TOKEN_ID --rpc-url $RPC_URL

# Check bot assignment
cast call $BOT_NFT "getBotsOnLand(uint256)(uint256[])" $LAND_ID --rpc-url $RPC_URL
```

## Additional Resources

- [OpenZeppelin Upgradeable Contracts](https://docs.openzeppelin.com/contracts/4.x/upgradeable)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Foundry Book](https://book.getfoundry.sh/)
- [Somnia Network Documentation](https://docs.somnia.network/)

## Support

For issues or questions:
- GitHub Issues: [Repository](https://github.com/Akanimoh12/AI-Farming-Game)
- Discord: [Community Server](#)
- Documentation: [Full Docs](#)
