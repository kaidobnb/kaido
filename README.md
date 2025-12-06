# 🎯 KAIDO - Loss-Edge AI Agent Enhanced Prediction Market

> **The first Loss-Edge AI Agent enhanced consumer-layer prediction market built for the next generation of on-chain participation on BNB Chain**

[![BNB Chain](https://img.shields.io/badge/BNB%20Chain-Testnet-yellow)](https://testnet.bscscan.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-orange)](https://soliditylang.org/)

KAIDO revolutionizes prediction markets by combining AI-powered market creation with a unique Loss-Edge Pool mechanism that provides **daily BNB airdrops** to losing participants, creating a more sustainable and engaging prediction ecosystem on BNB Chain.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Competitive Advantage](#-competitive-advantage)
- [Key Features](#-key-features)
- [User Journey](#-user-journey)
- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Roadmap](#-roadmap)
- [Open Source Dependencies](#-open-source-dependencies)
- [Deployment Instructions](#-deployment-instructions)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

KAIDO is a next-generation prediction market platform that addresses the fundamental problem of traditional prediction markets: **losers walk away with nothing**. Our Loss-Edge Pool mechanism ensures that even losing participants receive **daily BNB airdrops** (2% of all entry fees), creating a more sustainable and engaging ecosystem.

### What Makes KAIDO Unique?

1. **Loss-Edge Pool**: First prediction market to provide **daily BNB airdrops** to losing participants
2. **AI-Powered Markets**: KAIDO AI agent autonomously creates and manages prediction markets
3. **LP Staking Vault**: Stake BNB to earn yield from platform fees without market exposure
4. **Hybrid Architecture**: Combines on-chain security with off-chain efficiency
5. **Built on BNB Chain**: Leveraging BSC's speed and low transaction costs

---

## 🏆 Competitive Advantage

KAIDO stands out in the prediction market landscape with unique features that address the core problems of existing platforms.

### KAIDO vs. Traditional Prediction Markets

| Feature | **KAIDO** | Polymarket | Kalshi | Other Platforms |
|---------|-----------|------------|--------|-----------------|
| **Loss Compensation** | ✅ Daily BNB airdrops (2% Loss-Edge Pool) | ❌ Losers get nothing | ❌ Losers get nothing | ❌ Losers get nothing |
| **AI-Powered Market Creation** | ✅ Autonomous KAIDO AI Agent | ❌ Manual creation only | ❌ Manual creation only | ❌ Manual creation only |
| **Auto-Resolution** | ✅ Oracle-based (Crypto, Sports, Real-World*) | ⚠️ Manual resolution | ⚠️ Manual resolution | ⚠️ Mostly manual |
| **LP Staking Vault** | ✅ Earn yield without market exposure | ❌ No LP program | ❌ No LP program | ⚠️ Limited options |
| **Creator Incentives** | ✅ 1% creator fee + affiliate program | ❌ No creator rewards | ❌ No creator rewards | ⚠️ Minimal rewards |
| **Blockchain** | ✅ BNB Chain (low fees, fast) | ⚠️ Polygon (higher fees) | ❌ Centralized | ⚠️ Various chains |
| **Decentralization** | ✅ Fully on-chain settlements | ⚠️ Hybrid (centralized orderbook) | ❌ Fully centralized | ⚠️ Varies |
| **User Onboarding** | ✅ Consumer-first UX | ⚠️ DeFi-native only | ✅ Mainstream friendly | ⚠️ Complex interfaces |
| **Referral Program** | ✅ 1% lifetime commission in BNB | ❌ No referral program | ❌ No referral program | ⚠️ Limited programs |
| **Engagement Rewards** | ✅ Streaks, badges, leaderboards | ❌ No gamification | ❌ No gamification | ⚠️ Minimal gamification |
| **Real-World Events** | ✅ Built, Testing (Launch Early 2026)* | ✅ Available | ✅ Available | ⚠️ Limited |
| **Regulatory Compliance** | ✅ Decentralized (no KYC) | ⚠️ KYC required (US blocked) | ⚠️ KYC required (US only) | ⚠️ Varies by platform |
| **Mobile Experience** | ✅ Fully responsive PWA | ⚠️ Mobile app (limited) | ✅ Native apps | ⚠️ Varies |
| **Transaction Costs** | ✅ ~$0.10 per transaction | ⚠️ ~$0.50-$2 per transaction | ❌ Centralized (hidden fees) | ⚠️ Varies |
| **Liquidity Bootstrapping** | ✅ LP Vault + Loss-Edge Pool | ⚠️ Market makers only | ❌ Centralized liquidity | ⚠️ Limited mechanisms |

**\*Real-World Event Predictions**: KAIDO has built and is currently testing our AI oracle system to verify real-world events using web scraping and LLM-powered verification. The system is fully implemented with 8 event categories and will launch in early 2026, enabling users to create verifiable predictions about elections, awards, product launches, regulatory decisions, and more - all automatically resolved by our AI oracle with multi-source consensus verification.

### Why KAIDO Wins

#### 🎯 **For Predictors**
- **Never Walk Away Empty**: Receive **daily BNB airdrops** from Loss-Edge Pool even when you lose
- **Lower Barrier to Entry**: BNB Chain's low fees make micro-predictions viable
- **Earn While You Play**: Referral rewards, creator fees, and engagement bonuses
- **True Ownership**: Fully decentralized, no KYC, no geographic restrictions

#### 💼 **For Creators & Influencers**
- **Monetize Your Audience**: Earn 1% of every prediction you create
- **Affiliate Revenue**: 1% lifetime commission on all referral activity
- **LP Backing**: Platform backs top creators with liquidity support
- **No Platform Risk**: Decentralized means no deplatforming

#### 🏦 **For Liquidity Providers**
- **Real Yield**: Earn from actual platform fees, not token inflation
- **No Market Exposure**: LP funds never used for payouts
- **Triple Yield Engines**: Boost + Creator + Engagement revenue streams
- **Consumer-Friendly**: Simple stake-and-earn model, no complex strategies

#### 🚀 **For the Ecosystem**
- **Sustainable Growth**: Loss-Edge Pool reduces churn and increases retention
- **AI Automation**: Scales market creation without human bottlenecks
- **BNB Chain Native**: Leverages BSC's speed, cost, and ecosystem
- **Open & Composable**: Built on open standards, integrates with DeFi

---

## ✨ Key Features

### 🤖 AI-Powered Prediction Creation
- **KAIDO AI Agent**: Autonomously creates prediction markets for crypto prices and sports events
- **Auto-Resolution**: Predictions are automatically resolved using CryptoCompare and Sports APIs
- **Smart Market Selection**: AI analyzes trending topics and creates relevant markets

### 💰 Loss-Edge Pool System
- **Daily BNB Airdrops**: Losing participants receive **daily BNB airdrops** from 2% of all entry fees
- **Sustainable Ecosystem**: Reduces the sting of losing, encouraging continued participation
- **Fair Distribution**: Proportional distribution based on participation amount
- **Automatic Distribution**: Airdrops sent directly to your wallet every 24 hours

### 🏦 LP Staking Vault
- **Dual Vault System**: 70% Boost Vault + 30% Creator/Engagement Vault
- **Three Yield Engines**:
  - KAIDO Boost Yield (30% of treasury fees)
  - Creator Backing Yield (30% of creator + affiliate fees)
  - Engagement Boost Yield (30% of campaign fees)
- **No Market Exposure**: LP funds never used for payouts, only for boosting visibility

### 🔐 Smart Contract Security
- **Trustless Resolution**: Oracle-based automated resolution
- **Reentrancy Protection**: SafeMath and ReentrancyGuard
- **Admin Controls**: Multi-signature wallet support
- **Emergency Pause**: Circuit breaker for emergency situations

### 🎨 User Experience
- **Seamless Wallet Integration**: Reown AppKit for BNB Chain
- **Real-time Updates**: Live prediction tracking and notifications
- **Social Features**: Comments, leaderboards, and referral system
- **Mobile Responsive**: Full mobile support

---

## 🚀 User Journey

### User Journey Diagram

```mermaid
graph TD
    A[User Visits KAIDO] --> B{Wallet Connected?}
    B -->|No| C[Connect Wallet via Reown AppKit]
    C --> D[Create Profile Username & Email]
    D --> E[Browse Predictions]
    B -->|Yes| E

    E --> F{Choose Action}

    F -->|Create Prediction| G[Fill Prediction Details]
    G --> H[Set Entry Fee & Deadline]
    H --> I[Deploy Prediction Contract]
    I --> J[Prediction Live]

    F -->|Join Prediction| K[Select Outcome]
    K --> L[Pay Entry Fee 5%]
    L --> M[Fee Distribution]
    M --> M1[2% → Loss-Edge Pool]
    M --> M2[1% → Treasury]
    M --> M3[1% → Creator]
    M --> M4[1% → Affiliate]
    M --> N[Participation Recorded]

    F -->|Stake BNB| O[Enter Stake Amount]
    O --> P[Auto-Split 70/30]
    P --> P1[70% → Boost Vault]
    P --> P2[30% → Creator Vault]
    P1 --> Q[Earn Yield from Fees]
    P2 --> Q

    J --> R{Deadline Reached?}
    R -->|Yes| S[Oracle Resolves]
    S --> T{Outcome}
    T -->|Winner| U[Claim Winnings]
    T -->|Loser| V[Receive Daily BNB Airdrops]

    Q --> W[Claim LP Rewards]

    U --> X[Funds to Wallet]
    V --> X
    W --> X

    X --> E
```

### Detailed User Flow

#### 1. **Onboarding** (First-time Users)
```
Connect Wallet → Create Profile → Explore Markets → Get Started
```

#### 2. **Creating a Prediction**
```
Browse → Create → Set Parameters → Deploy Contract → Share
```

#### 3. **Participating in Predictions**
```
Browse → Select Market → Choose Outcome → Pay Entry Fee → Wait for Resolution
```

#### 4. **Staking in LP Vault**
```
Navigate to Staking → Enter Amount → Confirm Transaction → Earn Yield
```

#### 5. **Claiming Rewards**
```
Check Claimable → Select Reward Type → Claim → Receive BNB
```

---

## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React + TypeScript UI]
        WC[Reown AppKit Wallet]
        WEB3[Wagmi + Viem]
    end

    subgraph "Backend Layer"
        API[Express API Server]
        AUTH[JWT Authentication]
        JOBS[Cron Jobs]
        ORACLE[Oracle Service]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB)]
        CACHE[Redis Cache]
    end

    subgraph "BNB Chain Smart Contracts"
        PF[PredictionFactory]
        FD[FeeDistributor]
        LEV[LossEdgeVault]
        LPV[LPVault]
        PC[Prediction Contracts]
    end

    subgraph "External APIs"
        CC[CryptoCompare API]
        SA[Sports API]
        AI[OpenAI GPT-4]
    end

    UI --> WC
    WC --> WEB3
    WEB3 --> PF
    WEB3 --> PC
    WEB3 --> LPV

    UI --> API
    API --> AUTH
    API --> MONGO
    API --> CACHE

    JOBS --> ORACLE
    ORACLE --> CC
    ORACLE --> SA
    ORACLE --> AI
    ORACLE --> PF

    PF --> PC
    PC --> FD
    FD --> LEV
    FD --> LPV

    style PF fill:#f9d71c
    style FD fill:#f9d71c
    style LEV fill:#f9d71c
    style LPV fill:#f9d71c
    style PC fill:#f9d71c
```

### Architecture Components

#### **Frontend (React + TypeScript)**
- **UI Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context + Hooks
- **Web3 Integration**: Wagmi v2 + Viem for BNB Chain interactions
- **Wallet**: Reown AppKit (formerly WalletConnect)

#### **Backend (Node.js + Express)**
- **API Server**: Express.js with TypeScript
- **Authentication**: JWT-based auth with wallet signatures
- **Database**: MongoDB for user data and prediction metadata
- **Caching**: Redis for performance optimization
- **Jobs**: Node-cron for scheduled tasks

#### **Smart Contracts (Solidity 0.8.19)**
- **PredictionFactory**: Creates and manages prediction contracts
- **FeeDistributor**: Routes fees to appropriate destinations
- **LossEdgeVault**: Manages loss compensation pool
- **LPVault**: Handles LP staking and yield distribution
- **Prediction Contracts**: Individual prediction market instances

#### **Oracle Service**
- **Resolution Engine**: Automated prediction resolution
- **Data Sources**: CryptoCompare (crypto prices), Sports API (match results)
- **AI Integration**: OpenAI GPT-4 for market creation and analysis

### Data Flow

#### **Creating a Prediction**
```
User Input → Frontend Validation → Backend API → MongoDB Storage →
Smart Contract Deployment → Event Emission → Frontend Update
```

#### **Joining a Prediction**
```
User Selection → Entry Fee Payment → Smart Contract → Fee Distribution →
Loss-Edge Pool (2%) + Treasury (1%) + Creator (1%) + Affiliate (1%) →
Participation Recorded → Event Emission
```

#### **Prediction Resolution**
```
Deadline Reached → Oracle Cron Job → Fetch External Data →
Determine Outcome → Call Smart Contract → Distribute Winnings →
Update Loss-Edge Pool → Emit Events → Frontend Notification
```

#### **LP Staking**
```
Stake BNB → Auto-Split (70% Boost / 30% Creator) → Record Balance →
Predictions Generate Fees → Yield Accumulation → User Claims Rewards
```


---

## 📜 Smart Contracts

### Deployed Contracts (BSC Testnet)

| Contract | Address | BSCScan |
|----------|---------|---------|
| **PredictionFactory** | `0x7b58731EF525F799b70D9Bfa47481D7245F34D28` | [View](https://testnet.bscscan.com/address/0x7b58731EF525F799b70D9Bfa47481D7245F34D28) |
| **FeeDistributor** | `0xD39f58c3b1c8866086Ae28cDDd664B56ebc65859` | [View](https://testnet.bscscan.com/address/0xD39f58c3b1c8866086Ae28cDDd664B56ebc65859) |
| **LossEdgeVault** | `0x4F41aC2019F5ee26BCFc93FbB4C4f56278611c4e` | [View](https://testnet.bscscan.com/address/0x4F41aC2019F5ee26BCFc93FbB4C4f56278611c4e) |
| **LPVault** | `0xB239AE245a26A6dfe2eD933e99bf0A64f1694C11` | [View](https://testnet.bscscan.com/address/0xB239AE245a26A6dfe2eD933e99bf0A64f1694C11) |

### Contract Details

#### **PredictionFactory.sol**
Main factory contract for creating and managing prediction markets.

**Key Functions:**
- `createPrediction()`: Deploy new prediction contract
- `resolvePrediction()`: Oracle-only resolution function
- `getPredictionDetails()`: Fetch prediction metadata

**Events:**
- `PredictionCreated(address indexed prediction, address indexed creator)`
- `PredictionResolved(address indexed prediction, uint8 outcome)`

#### **FeeDistributor.sol**
Handles fee distribution across the ecosystem.

**Fee Structure (5% total):**
- 2% → Loss-Edge Pool (daily BNB airdrops for losers)
- 1% → Treasury (platform development)
- 1% → Creator (market creator)
- 1% → Affiliate (referrer, if applicable)

**Key Functions:**
- `distributeFees()`: Route fees to appropriate destinations
- `recordCreatorYield()`: Record LP yield from creator fees

#### **LossEdgeVault.sol**
Manages the loss compensation pool and distributes daily BNB airdrops to losing participants.

**Key Functions:**
- `deposit()`: Add funds to loss-edge pool
- `claimCompensation()`: Losers claim their daily BNB airdrops
- `getCompensationAmount()`: Calculate claimable airdrop amount
- `distributeDailyAirdrops()`: Automated daily distribution to losers

#### **LPVault.sol**
Dual-vault LP staking system with three yield engines.

**Vault Structure:**
- 70% → Boost Vault (for KAIDO-created markets)
- 30% → Creator/Engagement Vault (for partnerships)

**Key Functions:**
- `stake()`: Stake BNB into LP vault
- `unstake()`: Withdraw staked BNB
- `claimRewards()`: Claim accumulated yield
- `recordBoostYield()`: Record yield from KAIDO boosts
- `recordCreatorYield()`: Record yield from creator partnerships
- `recordEngagementYield()`: Record yield from campaigns

**Yield Engines:**
1. **KAIDO Boost Yield**: 30% of treasury's 1% fee
2. **Creator Backing Yield**: 30% of (creator's 1% + affiliate's 1%)
3. **Engagement Boost Yield**: 30% of campaign fees

---

## 🗺️ Roadmap

KAIDO's development roadmap focuses on expanding AI capabilities, launching real-world event predictions, and scaling the platform ecosystem.

### Phase 1: Foundation (Q4 2025) ✅ **COMPLETE**

**Core Platform Launch**
- ✅ Deploy smart contracts on BNB Chain Testnet
- ✅ Launch KAIDO AI Agent for crypto and sports predictions
- ✅ Implement Loss-Edge Pool mechanism with daily BNB airdrops
- ✅ Build consumer-friendly web interface
- ✅ Integrate CryptoCompare and Sports APIs for auto-resolution
- ✅ Launch referral and affiliate program
- ✅ Deploy LP Vault with triple yield engines

**Real-World Event Oracle (Built, Testing)**
- ✅ Built AI Oracle for Real-World Events using web scraping + LLM verification
- ✅ Implemented 8 event categories (Elections, Awards, Product Launches, M&A, IPOs, Regulatory, Weather, Space)
- ✅ Created CheerioScraper for static HTML parsing
- ✅ Created PuppeteerScraper for dynamic JavaScript content
- ✅ Integrated OpenAI API for AI-powered verification
- ✅ Built 4-step guided prediction creation wizard
- ✅ Implemented AI claim validation and schema generation
- ✅ Multi-source verification with consensus algorithms
- 🔄 **Testing phase** - Training on historical events and refining accuracy
- 📅 **Launch: Early 2026**

**Achievements:**
- 21+ active predictions created
- Fully functional AI agent creating markets autonomously
- Auto-resolution working for crypto and sports events
- Loss-Edge Pool distributing daily BNB airdrops to losing participants
- Real-world event oracle system built and in testing

---

### Phase 2: Real-World Events Launch & Optimization (Q1 2026) 📋 **PLANNED**

**Real-World Event Predictions Public Launch**
- 📋 **Launch real-world event predictions** to public (Early Q1 2026)
- 📋 **8 Event Categories Available**:
  - 🗳️ Election Results (presidential, congressional, local elections)
  - 🏆 Awards & Ceremonies (Oscars, Grammys, Nobel Prize, etc.)
  - 📱 Product Launches (Apple, Tesla, tech releases)
  - 💼 Business M&A (acquisitions, IPOs, corporate events)
  - 📈 IPO & Stock Listings (company debuts, market events)
  - ⚖️ Regulatory Decisions (SEC rulings, policy changes)
  - 🌤️ Weather Events (hurricanes, temperature records)
  - 🚀 Space Missions (launches, landings, discoveries)

**Oracle Optimization:**
- 📋 Expand trusted source database for each event category
- 📋 Improve AI confidence scoring based on real-world usage
- 📋 Optimize consensus algorithms for faster resolution
- 📋 Add more event categories based on user demand
- 📋 Implement community-sourced verification for edge cases

**Platform Enhancements:**
- 📋 Enhanced analytics dashboard for prediction performance
- 📋 Improved mobile experience and PWA features
- 📋 Social sharing features for predictions
- 📋 Leaderboard improvements and new badge types

---

### Phase 3: KAIDO Token & Pro Tier (Q1 2026 - Q2 2026) 📋 **PLANNED**

**Token Launch**
- 📋 Launch KAIDO governance token on BNB Chain
- 📋 Implement token staking for platform governance
- 📋 Introduce KAIDO Pro subscription tier

**KAIDO Pro Features:**
- 📋 **AI-Powered Prediction Insights**: Get AI analysis and recommendations
- 📋 **Automatic Treasury Access**: Auto-stake winnings into LP Vault
- 📋 **Advanced Analytics**: Detailed performance metrics and trends
- 📋 **Priority Market Creation**: Skip queue for AI-created markets
- 📋 **Exclusive Badges & Perks**: Special recognition and rewards
- 📋 **Early Access**: First access to new features and event categories

**Tokenomics:**
- 📋 Governance rights for platform decisions
- 📋 Staking rewards from platform revenue
- 📋 Discounted fees for KAIDO holders
- 📋 Pro tier subscription payment in KAIDO

---

### Phase 4: Market Expansion (Q2 2026 - Q3 2026) 📋 **PLANNED**

**New Prediction Categories**
- 📋 **Esports**: League of Legends, Dota 2, CS:GO, Valorant
- 📋 **Entertainment**: Box office results, streaming rankings, TV ratings
- 📋 **Finance**: Stock prices, commodity prices, economic indicators
- 📋 **Technology**: GitHub stars, app downloads, user growth metrics
- 📋 **Social Media**: Follower counts, viral trends, platform metrics

**Geographic Expansion**
- 📋 Multi-language support (Spanish, Chinese, Japanese, Korean)
- 📋 Regional sports leagues (cricket, rugby, baseball)
- 📋 Local event predictions (regional elections, local news)

**Platform Enhancements**
- 📋 Mobile native apps (iOS & Android)
- 📋 Advanced trading features (limit orders, stop-loss)
- 📋 Social features (prediction groups, private leagues)
- 📋 Enhanced analytics and insights dashboard

---

### Phase 5: Ecosystem Growth (Q3 2026 - Q4 2026) 📋 **PLANNED**

**Strategic Partnerships**
- 📋 Partner with sports leagues for official predictions
- 📋 Collaborate with news outlets for verified event data
- 📋 Integrate with DeFi protocols for cross-platform yield
- 📋 Onboard influencers and content creators

**Platform Scaling**
- 📋 Mainnet launch on BNB Chain
- 📋 Cross-chain expansion (Ethereum, Polygon, Arbitrum)
- 📋 Institutional liquidity partnerships
- 📋 API for third-party integrations

**Community & Governance**
- 📋 Launch DAO for decentralized governance
- 📋 Community-driven market creation
- 📋 Grant program for developers and creators
- 📋 Bug bounty and security audit program

---

### Long-Term Vision (2027+) 🌟

**Become the Consumer Layer for Prediction Markets**
- 🌟 **1M+ Active Users**: Scale to mainstream adoption
- 🌟 **AI-First Platform**: Most markets created and resolved by AI
- 🌟 **Real-World Integration**: Predictions on any verifiable event
- 🌟 **Cross-Chain Hub**: Unified prediction market across all chains
- 🌟 **Creator Economy**: Thousands of influencers earning from predictions
- 🌟 **Institutional Adoption**: Hedge funds and institutions using KAIDO for market sentiment

**Innovation Focus:**
- 🌟 Advanced AI models for prediction accuracy
- 🌟 Decentralized oracle network for verification
- 🌟 Zero-knowledge proofs for privacy
- 🌟 Layer 2 scaling for instant settlements

---

## 📦 Open Source Dependencies

### Frontend Dependencies

#### **Core Framework**
- **React** (v18.3.1) - UI library
  - License: MIT
  - [GitHub](https://github.com/facebook/react)
- **TypeScript** (v5.6.2) - Type safety
  - License: Apache-2.0
  - [GitHub](https://github.com/microsoft/TypeScript)
- **Vite** (v5.4.10) - Build tool
  - License: MIT
  - [GitHub](https://github.com/vitejs/vite)

#### **Web3 & Blockchain**
- **Wagmi** (v2.x) - React hooks for Ethereum
  - License: MIT
  - [GitHub](https://github.com/wevm/wagmi)
- **Viem** (v2.x) - TypeScript interface for Ethereum
  - License: MIT
  - [GitHub](https://github.com/wevm/viem)
- **@reown/appkit** (v1.x) - Wallet connection (formerly WalletConnect)
  - License: Apache-2.0
  - [GitHub](https://github.com/reown-com/appkit)

#### **UI & Styling**
- **Tailwind CSS** (v3.4.14) - Utility-first CSS
  - License: MIT
  - [GitHub](https://github.com/tailwindlabs/tailwindcss)
- **Lucide React** (v0.454.0) - Icon library
  - License: ISC
  - [GitHub](https://github.com/lucide-icons/lucide)

#### **Routing & State**
- **React Router DOM** (v6.x) - Client-side routing
  - License: MIT
  - [GitHub](https://github.com/remix-run/react-router)

### Backend Dependencies

#### **Core Framework**
- **Node.js** (v18+) - JavaScript runtime
  - License: MIT
  - [Website](https://nodejs.org/)
- **Express** (v4.x) - Web framework
  - License: MIT
  - [GitHub](https://github.com/expressjs/express)
- **TypeScript** (v5.x) - Type safety
  - License: Apache-2.0
  - [GitHub](https://github.com/microsoft/TypeScript)

#### **Database & Caching**
- **MongoDB** (v6.x) - NoSQL database
  - License: SSPL
  - [Website](https://www.mongodb.com/)
- **Mongoose** (v8.x) - MongoDB ODM
  - License: MIT
  - [GitHub](https://github.com/Automattic/mongoose)

#### **Web3 & Blockchain**
- **Ethers.js** (v5.7.2) - Ethereum library
  - License: MIT
  - [GitHub](https://github.com/ethers-io/ethers.js)
- **Viem** (v2.x) - TypeScript Ethereum library
  - License: MIT
  - [GitHub](https://github.com/wevm/viem)

#### **Authentication & Security**
- **jsonwebtoken** (v9.x) - JWT implementation
  - License: MIT
  - [GitHub](https://github.com/auth0/node-jsonwebtoken)
- **bcryptjs** (v2.x) - Password hashing
  - License: MIT
  - [GitHub](https://github.com/dcodeIO/bcrypt.js)
- **cors** (v2.x) - CORS middleware
  - License: MIT
  - [GitHub](https://github.com/expressjs/cors)

#### **Utilities**
- **dotenv** (v16.x) - Environment variables
  - License: BSD-2-Clause
  - [GitHub](https://github.com/motdotla/dotenv)
- **node-cron** (v3.x) - Task scheduling
  - License: ISC
  - [GitHub](https://github.com/node-cron/node-cron)
- **axios** (v1.x) - HTTP client
  - License: MIT
  - [GitHub](https://github.com/axios/axios)

### Smart Contract Dependencies

#### **Solidity & Development**
- **Hardhat** (v2.27.0) - Ethereum development environment
  - License: MIT
  - [GitHub](https://github.com/NomicFoundation/hardhat)
- **Solidity** (v0.8.19) - Smart contract language
  - License: GPL-3.0
  - [Website](https://soliditylang.org/)

#### **Testing & Verification**
- **Hardhat Ethers** (v2.2.3) - Ethers.js plugin
  - License: MIT
- **Hardhat Etherscan** (v3.1.7) - Contract verification
  - License: MIT
- **Chai** (v4.3.7) - Assertion library
  - License: MIT
  - [GitHub](https://github.com/chaijs/chai)

---

## 🚀 Deployment Instructions

### Prerequisites

Before deploying KAIDO, ensure you have:

- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- **MongoDB** (local or MongoDB Atlas)
- **BNB Chain Testnet** wallet with test BNB
- **Git** for version control

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/kaido.git
cd kaido
```

### Step 2: Install Dependencies

```bash
# Install root dependencies (smart contracts)
npm install

# Install frontend dependencies
cd project
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```


### Step 3: Configure Environment Variables

#### **Root `.env` (Smart Contracts)**

Create a `.env` file in the root directory:

```bash
# BSC Network Configuration
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/

# Deployer Wallet (Get test BNB from https://testnet.bnbchain.org/faucet-smart)
PRIVATE_KEY=your_private_key_here

# Oracle Wallet (same as deployer for testnet)
ORACLE_PRIVATE_KEY=your_private_key_here

# BSCScan API Key (for contract verification)
# Get from: https://bscscan.com/myapikey
BSCSCAN_API_KEY=your_bscscan_api_key

# Contract Addresses (will be populated after deployment)
PREDICTION_FACTORY_ADDRESS=
FEE_DISTRIBUTOR_ADDRESS=
LOSS_EDGE_VAULT_ADDRESS=
LP_VAULT_ADDRESS=

# Oracle Address
ORACLE_ADDRESS=your_wallet_address

# Treasury Address
TREASURY_ADDRESS=your_treasury_address
```

#### **Backend `.env`**

Create a `.env` file in the `backend` directory:

```bash
# Server Configuration
PORT=5001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/kaido
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kaido

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# BNB Chain Configuration
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
ORACLE_PRIVATE_KEY=your_oracle_private_key

# Contract Addresses (copy from root .env after deployment)
PREDICTION_FACTORY_ADDRESS=0x7b58731EF525F799b70D9Bfa47481D7245F34D28
FEE_DISTRIBUTOR_ADDRESS=0xD39f58c3b1c8866086Ae28cDDd664B56ebc65859
LOSS_EDGE_VAULT_ADDRESS=0x4F41aC2019F5ee26BCFc93FbB4C4f56278611c4e
LP_VAULT_ADDRESS=0xB239AE245a26A6dfe2eD933e99bf0A64f1694C11

# External API Keys
OPENAI_API_KEY=your_openai_api_key
CRYPTOCOMPARE_API_KEY=your_cryptocompare_api_key
FOOTBALL_DATA_API_KEY=your_football_data_api_key

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

#### **Frontend `.env`**

Create a `.env` file in the `project` directory:

```bash
# API Configuration
VITE_API_URL=http://localhost:5001

# Reown AppKit (WalletConnect)
VITE_REOWN_PROJECT_ID=your_reown_project_id

# BNB Chain Configuration
VITE_CHAIN_ID=97
VITE_CHAIN_NAME=BSC Testnet

# Contract Addresses (copy from root .env after deployment)
VITE_PREDICTION_FACTORY_ADDRESS=0x7b58731EF525F799b70D9Bfa47481D7245F34D28
VITE_FEE_DISTRIBUTOR_ADDRESS=0xD39f58c3b1c8866086Ae28cDDd664B56ebc65859
VITE_LOSS_EDGE_VAULT_ADDRESS=0x4F41aC2019F5ee26BCFc93FbB4C4f56278611c4e
VITE_LP_VAULT_ADDRESS=0xB239AE245a26A6dfe2eD933e99bf0A64f1694C11
```

### Step 4: Setup MongoDB

#### **Option A: Local MongoDB**

```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify MongoDB is running
mongosh
```

#### **Option B: MongoDB Atlas (Cloud)**

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Get connection string and update `MONGODB_URI` in backend `.env`

### Step 5: Get Test BNB

Get test BNB from the BNB Chain faucet:

1. Visit [BNB Chain Testnet Faucet](https://testnet.bnbchain.org/faucet-smart)
2. Enter your wallet address
3. Request test BNB (you'll need ~0.5 BNB for deployment)

### Step 6: Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to BSC Testnet
npx hardhat run scripts/deploy-complete-system.js --network bscTestnet

# The deployment will output contract addresses
# Copy these addresses to your .env files
```

**Expected Output:**
```
🎉 Complete System Deployment Successful!
======================================================================

📋 Deployed Contracts:
   PredictionFactory:   0x7b58731EF525F799b70D9Bfa47481D7245F34D28
   FeeDistributor:      0xD39f58c3b1c8866086Ae28cDDd664B56ebc65859
   LossEdgeVault:       0x4F41aC2019F5ee26BCFc93FbB4C4f56278611c4e
   LPVault:             0xB239AE245a26A6dfe2eD933e99bf0A64f1694C11

⚙️  Configuration:
   Treasury:            0x59548ab18064F229522aDab6A540e8b4b35543c8
   Oracle:              0xd1AFD60f7B8F4b68C377381E65d8d43Fae0dF7CD
```

### Step 7: Verify Contracts (Optional)

```bash
# Verify PredictionFactory
npx hardhat verify --network bscTestnet 0x7b58731EF525F799b70D9Bfa47481D7245F34D28

# Verify FeeDistributor
npx hardhat verify --network bscTestnet 0xD39f58c3b1c8866086Ae28cDDd664B56ebc65859

# Verify LossEdgeVault
npx hardhat verify --network bscTestnet 0x4F41aC2019F5ee26BCFc93FbB4C4f56278611c4e

# Verify LPVault
npx hardhat verify --network bscTestnet 0xB239AE245a26A6dfe2eD933e99bf0A64f1694C11
```

### Step 8: Start Backend Server

```bash
cd backend

# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

**Backend should be running on:** `http://localhost:5001`

### Step 9: Start Frontend Application

```bash
cd project

# Development mode
npm run dev

# Build for production
npm run build
npm run preview
```

**Frontend should be running on:** `http://localhost:5173`

### Step 10: Verify Deployment

1. **Check Backend Health:**
   ```bash
   curl http://localhost:5001/health
   ```

2. **Check Smart Contracts:**
   - Visit BSCScan Testnet
   - Search for your contract addresses
   - Verify transactions are visible

3. **Test Frontend:**
   - Open `http://localhost:5173`
   - Connect wallet
   - Create a test prediction
   - Verify transaction on BSCScan

---

## 📁 Project Structure

```
kaido/
├── contracts/                 # Smart contracts
│   ├── PredictionFactory.sol
│   ├── FeeDistributor.sol
│   ├── LossEdgeVault.sol
│   └── LPVault.sol
├── scripts/                   # Deployment scripts
│   ├── deploy-complete-system.js
│   └── configureLPVault.js
├── backend/                   # Backend API
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── jobs/             # Cron jobs
│   │   └── index.ts          # Entry point
│   ├── package.json
│   └── tsconfig.json
├── project/                   # Frontend React app
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API services
│   │   ├── config/           # Configuration
│   │   └── App.tsx           # Main app component
│   ├── package.json
│   └── vite.config.ts
├── deployments/               # Deployment records
├── docs/                      # Documentation
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Root package.json
└── README.md                 # This file
```


---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5001/api
Production: https://api.kaido.io/api
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

### Core Endpoints

#### **User Management**

**POST** `/users/connect`
- Connect wallet and create/update user
- Body: `{ walletAddress: string }`
- Returns: `{ success: boolean, user: User, token: string }`

**GET** `/users/profile`
- Get current user profile (requires auth)
- Returns: `{ success: boolean, user: User }`

**PUT** `/users/profile`
- Update user profile (requires auth)
- Body: `{ username?: string, email?: string }`
- Returns: `{ success: boolean, user: User }`

#### **Predictions**

**GET** `/predictions`
- Get all predictions
- Query params: `?status=active&category=crypto&limit=20`
- Returns: `{ success: boolean, predictions: Prediction[] }`

**GET** `/predictions/:id`
- Get prediction details
- Returns: `{ success: boolean, prediction: Prediction }`

**POST** `/predictions`
- Create new prediction (requires auth)
- Body: `{ title, description, category, deadline, entryFee, ... }`
- Returns: `{ success: boolean, prediction: Prediction }`

**GET** `/predictions/claimable`
- Get user's claimable winnings (requires auth)
- Returns: `{ success: boolean, winnings: Winning[] }`

#### **LP Vault**

**GET** `/lp-vault/stats`
- Get vault statistics
- Returns: `{ success: boolean, data: { balances, yieldBreakdown, totalStakers } }`

**GET** `/lp-vault/user/:address`
- Get user's LP vault balance
- Returns: `{ success: boolean, data: { staked, rewards, share } }`

**GET** `/lp-vault/activity/:address`
- Get user's staking activity
- Returns: `{ success: boolean, data: ActivityEvent[] }`

#### **Sports & Crypto Data**

**GET** `/sports/featured`
- Get featured sports matches
- Returns: `{ success: boolean, matches: Match[] }`

**GET** `/crypto/prices`
- Get crypto prices
- Query params: `?symbols=BTC,ETH,BNB`
- Returns: `{ success: boolean, prices: Price[] }`

### Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Rate Limiting

- **Authenticated requests**: 100 requests per minute
- **Public requests**: 20 requests per minute

---

## 🤝 Contributing

We welcome contributions to KAIDO! Here's how you can help:

### Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/kaido.git
   cd kaido
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features

4. **Test your changes**
   ```bash
   # Run smart contract tests
   npx hardhat test

   # Run backend tests
   cd backend && npm test

   # Run frontend tests
   cd project && npm test
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Describe your changes

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Code Style

- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **TypeScript/JavaScript**: Use ESLint and Prettier
- **React**: Follow React best practices and hooks guidelines

### Testing Requirements

- Smart contracts: Minimum 80% code coverage
- Backend: Unit tests for all services and controllers
- Frontend: Component tests for critical UI elements

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 KAIDO

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔗 Links

- **Website**: [kaidobnb.xyz](https://kaidobnb.xyz)
- **X (Twitter)**: [@Kaidobnb](https://x.com/Kaidobnb)

---

## 🙏 Acknowledgments

- **BNB Chain** for providing the infrastructure and hackathon opportunity
- **OpenAI** for GPT-4 API powering KAIDO AI agent
- **CryptoCompare** for crypto price data
- **Football-Data.org** for sports match data
- **Reown (WalletConnect)** for wallet integration
- **Wagmi & Viem** for excellent Web3 libraries
- All our contributors and community members

---

## 📞 Support

Need help? Reach out to us:

- **Website**: [kaidobnb.xyz](https://kaidobnb.xyz)
- **X (Twitter)**: [@Kaidobnb](https://x.com/Kaidobnb)

---

<div align="center">

**Built with ❤️ on BNB Chain**

[⬆ Back to Top](#-kaido---loss-edge-ai-agent-enhanced-prediction-market)

</div>
