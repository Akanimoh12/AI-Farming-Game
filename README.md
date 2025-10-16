# 🍊 Orange Farm - Web3 Farming Game

> A blockchain-based farming simulation game where players cultivate virtual lands, deploy AI bots, and harvest $ORANGE tokens in real-time. Built on Somnia Dream Testnet for lightning-fast, sub-second transactions.

[![Somnia Network](https://img.shields.io/badge/Network-Somnia%20Dream%20Testnet-blueviolet)](https://explorer.somnia.network)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://reactjs.org/)

---

## 🎮 What is Orange Farm?

Orange Farm is a **play-to-earn** blockchain game where players:
- 🌾 **Own NFT Lands** with different rarities and multipliers
- 🤖 **Deploy AI Bot NFTs** to automate farming
- ⏱️ **Harvest in Real-Time** with live countdowns and progress tracking
- 💰 **Earn $ORANGE Tokens** based on land type and bot efficiency
- 👥 **Invite Friends** and earn referral rewards
- 🛒 **Trade Assets** in the decentralized marketplace

---

## 🚨 The Problem

Traditional Web3 gaming is broken. Players face:

**⏰ Constant Grinding**
- Games require 24/7 active management
- No automation means burnout and poor retention
- Time commitment prevents mass adoption

**💸 High Entry Barriers**
- $100-$500+ initial investment required
- Complex wallet setups confuse newcomers
- Gas fees on slow chains eat into profits

**🎮 Poor User Experience**
- 15-30 second transaction times kill immersion
- Clunky interfaces designed for crypto natives only
- No real-time feedback or progress tracking

**📉 Unsustainable Economics**
- Most games collapse within 3-6 months
- Pump-and-dump tokenomics with no real utility
- Players lose money when the game dies

Web3 gaming needs to be **faster, cheaper, and more accessible** to reach mainstream adoption.

---

## 💡 The Solution

Orange Farm solves these problems with a revolutionary approach to blockchain gaming:

**🌾 True Asset Ownership**
- Own real ERC-721 NFT land plots permanently
- Trade freely on integrated marketplace
- Assets retain value independent of game status

**🤖 AI-Powered Automation**
- Deploy AI bots that farm 24/7 for you
- Set it and forget it - no grinding required
- Earn passive income while you sleep

**⚡ Instant Gameplay**
- Built on Somnia Network with 0.5s finality
- Sub-penny gas fees make every action affordable
- Real-time progress bars and live updates

**🎁 Zero Entry Barrier**
- Free starter pack on registration
- No wallet complexity - one-click connect
- Start earning in under 2 minutes

**💰 Sustainable Tokenomics**
- Multiple revenue streams (marketplace, premium NFTs, utilities)
- 5% referral rewards drive organic growth
- Real utility with harvest cycles and yield multipliers

Orange Farm isn't just another crypto game—it's the **future of accessible Web3 gaming**.

---

## ✨ Key Features

### 🎯 Core Gameplay
- **3 Land Types**: Basic (1x), Advanced (1.5x), Premium (2x) yield multipliers
- **3 Bot Types**: Basic (100%), Advanced (150%), Premium (200%) efficiency
- **Real-Time Harvesting**: 10-minute harvest cycles with live progress bars
- **Dynamic Yields**: Harvest amounts calculated based on land × bot combination

### 🔗 Blockchain Integration
- **Somnia Network**: Ultra-fast finality (~0.5s block time)
- **NFT Standards**: ERC-721 for Land and Bot assets
- **Token Standard**: ERC-20 for $ORANGE and Water tokens
- **Gasless Starter**: Free starter pack (1 Land + 1 Bot + 100 Water)

### 🎁 Referral System
- **5% Rewards**: Earn 5% of your referrals' harvest yields
- **Unlimited Referrals**: No cap on how many users you can invite
- **Passive Income**: Automatic rewards distribution

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │   Farm   │  │Marketplace│  │ Profile  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │              │             │              │
│       └─────────────┴──────────────┴─────────────┘              │
│                          │                                       │
│                    RainbowKit + Wagmi                           │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Somnia    │
                    │   Network   │
                    └──────┬──────┘
                           │
        ┏━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━┓
        ┃                                     ┃
┌───────▼─────────┐               ┌───────────▼──────────┐
│  Core Contracts │               │  Gameplay Contracts  │
├─────────────────┤               ├──────────────────────┤
│ • LandNFT       │               │ • RealTimeHarvest    │
│ • BotNFT        │               │ • HarvestSettlement  │
│ • OrangeToken   │               │ • Marketplace        │
│ • WaterToken    │               │ • GameRegistry       │
└─────────────────┘               └──────────────────────┘
```

### 🔄 Harvest Flow

```
User                 Frontend              Contracts
  │                     │                     │
  ├─ Assign Bot ───────►│                     │
  │                     ├─ addBotToLand() ───►│ LandNFT
  │                     │◄────────────────────┤
  │                     │                     │
  ├─ Start Harvest ────►│                     │
  │                     ├─ startHarvest() ───►│ RealTimeHarvest
  │                     │◄────────────────────┤ (creates PendingHarvest)
  │                     │                     │
  │  [10 minutes pass with real-time updates]│
  │                     │                     │
  │                     ├─ getPendingHarvest()│ RealTimeHarvest
  │                     │◄────────────────────┤ (polls every 5s)
  │                     │                     │
  ├─ Complete Harvest ─►│                     │
  │                     ├─ completeHarvest() ►│ RealTimeHarvest
  │                     │                     ├─ settleHarvest() ──►│ HarvestSettlement
  │                     │                     │                     ├─ mint() ───►│ OrangeToken
  │                     │◄────────────────────┴─────────────────────┴────────────┤
  ◄─ 🍊 $ORANGE Received!                                                         │
```

---

## 📜 Smart Contracts

### Deployed on Somnia Dream Testnet (Chain ID: 50312)

| Contract | Address | Purpose |
|----------|---------|---------|
| **MockOrangeToken** | `0xb3474344dded8a5a272d8f7a664c0c521b0b97f9` | ERC-20 game currency |
| **LandNFT** | `0x4c56e478dc65a4ef64aa6808d1a704f48fa3eba2` | ERC-721 land plots |
| **BotNFT** | `0xade9f9c342af0570ed7a2eff4db6647f56fbc95f` | ERC-721 farming bots |
| **WaterToken** | `0xa8f3cab7ac4bcf903992b52a439083bd160a2f7c` | ERC-20 utility token |
| **Marketplace** | `0x8ce440485714900ac0f0ff8474328d1914960a7b` | Asset trading platform |
| **HarvestSettlement** | `0xc460528fdd9b900624ad3984763d42330ef74d41` | Harvest rewards distributor |
| **GameRegistry** | `0xb16b618c534cbe35c63e3cf75e704a43ac591213` | Player registration & starter packs |
| **RealTimeHarvest** | `0x098b7e17b3a6ba56d49b92b33f9b58e4872fae22` | Real-time farming mechanics |

🔍 **Explorer**: [https://explorer.somnia.network](https://explorer.somnia.network)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MetaMask or compatible Web3 wallet
- Somnia Dream Testnet added to wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/Akanimoh12/AI-Farming-Game.git
cd AI-Farming-Game

# Install frontend dependencies
cd frontend
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

### Environment Setup

Update `frontend/.env` with:

```env
# Somnia Network
VITE_SOMNIA_RPC_URL=https://dream-rpc.somnia.network
VITE_SOMNIA_CHAIN_ID=50312

# Contract Addresses (already configured)
VITE_MOCK_ORANGE_TOKEN_ADDRESS=0xb3474344dded8a5a272d8f7a664c0c521b0b97f9
VITE_LAND_NFT_ADDRESS=0x4c56e478dc65a4ef64aa6808d1a704f48fa3eba2
# ... (other addresses)

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Add Somnia Network to MetaMask

```javascript
Network Name: Somnia Dream Testnet
RPC URL: https://dream-rpc.somnia.network
Chain ID: 50312
Currency Symbol: STT
Block Explorer: https://explorer.somnia.network
```

---

## 🎮 How to Play

### 1️⃣ **Register & Get Started**
- Connect your wallet
- Click "Register" to get free starter pack
- Receive: 1 Basic Land + 1 Basic Bot + 100 Water tokens

### 2️⃣ **Prepare Your Farm**
- Navigate to "Farm" page
- Select your land
- Click "Manage Bots" and assign your bot

### 3️⃣ **Start Harvesting**
- Click "Start Harvesting" 
- Watch the countdown timer (10 minutes)
- See progress bar fill in real-time

### 4️⃣ **Claim Rewards**
- When harvest completes, click "Complete Harvest ✨"
- $ORANGE tokens are minted to your wallet instantly

### 5️⃣ **Grow Your Empire**
- Buy more lands and bots from Marketplace
- Upgrade to Advanced/Premium for higher yields
- Invite friends for 5% referral rewards

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **RainbowKit** - Wallet connection
- **Wagmi** - Ethereum hooks
- **Viem** - Ethereum utilities

### Smart Contracts
- **Solidity 0.8.20** - Contract language
- **Foundry** - Development framework
- **OpenZeppelin** - Security standards
- **ERC-721** - NFT implementation
- **ERC-20** - Token implementation

### Network
- **Somnia Dream Testnet** - High-performance blockchain
- **Sub-second finality** - Lightning-fast transactions
- **Low gas fees** - Affordable gameplay

---

## 📊 Game Economics

### Yield Calculation

```
Harvest Amount = Base Harvest × Land Multiplier × Bot Efficiency
```

**Examples:**

| Land Type | Bot Type | Base | Calculation | Yield |
|-----------|----------|------|-------------|-------|
| Basic | Basic | 10 | 10 × 1.0 × 1.0 | **10** 🍊 |
| Advanced | Basic | 10 | 10 × 1.5 × 1.0 | **15** 🍊 |
| Premium | Advanced | 10 | 10 × 2.0 × 1.5 | **30** 🍊 |
| Premium | Premium | 10 | 10 × 2.0 × 2.0 | **40** 🍊 |

### Referral Rewards

```
Referral Reward = Friend's Harvest × 5%
```

**Example:** Your friend harvests 100 $ORANGE → You receive 5 $ORANGE

---

## 🔒 Security

- ✅ **Audited Patterns**: Uses OpenZeppelin battle-tested contracts
- ✅ **Access Control**: Role-based permissions (Admin, GameMaster, Pauser)
- ✅ **Reentrancy Protection**: SafeERC20 and ReentrancyGuard
- ✅ **Input Validation**: Comprehensive checks and balances
- ✅ **Emergency Pause**: Admin can pause contracts if needed

---

## 📱 Live Demo

🌐 **Play Now**: [Coming Soon]

📹 **Demo Video**: [Coming Soon]

---

## 🗺️ Roadmap

### ✅ Phase 1 - Core Mechanics (Completed)
- [x] Smart contract deployment
- [x] NFT minting (Land & Bot)
- [x] Real-time harvest system
- [x] Marketplace functionality
- [x] Referral system

### 🚧 Phase 2 - Enhancement (In Progress)
- [ ] Mobile-responsive UI improvements
- [ ] Harvest history dashboard
- [ ] Leaderboard system
- [ ] Achievement badges

### 📅 Phase 3 - Expansion (Planned)
- [ ] PvP farming competitions
- [ ] Seasonal events
- [ ] Land upgrades & expansions
- [ ] Bot fusion mechanics
- [ ] DAO governance

### 🔮 Phase 4 - Mainnet (Future)
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Token generation event
- [ ] Partnership integrations

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

- **GitHub**: [@Akanimoh12](https://github.com/Akanimoh12)
- **Issues**: [Report a Bug](https://github.com/Akanimoh12/AI-Farming-Game/issues)
- **Discussions**: [Community Forum](https://github.com/Akanimoh12/AI-Farming-Game/discussions)

---

## 🙏 Acknowledgments

- **Somnia Network** - For providing ultra-fast blockchain infrastructure
- **OpenZeppelin** - For secure smart contract libraries
- **RainbowKit** - For seamless wallet connection UX
- **The Community** - For testing and feedback

---

<div align="center">

### ⭐ Star this repo if you like it!

**Built with ❤️ by the Orange Farm Team**

[🎮 Play Game](#) • [📖 Docs](#) • [💬 Discord](#) • [🐦 Twitter](#)

</div>
