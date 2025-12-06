# LP Vault System - Attention Liquidity Model

## 🎯 Overview

The LP Vault system implements an **Attention Liquidity Model** where LP funds are used to make predictions look active and attractive, but are **NOT paid out to winners**. LP funds simply return to the vault after resolution, and LP earns yield from platform fees.

---

## 📊 How It Works

### User Flow

1. **User Stakes BNB** → Receives LP tokens
2. **Admin Deploys LP** → LP added to predictions as "attention liquidity"
3. **Prediction Displays** → Shows total pool (real users + LP)
4. **Real Users Join** → See active pool and participate
5. **Prediction Resolves** → Winners split ONLY real user pool
6. **LP Returns** → LP funds return to vault (0% gain/loss from prediction)
7. **Yield Distributed** → LP earns from platform fees (15-30% APY)

### Key Principle

> **LP is the house, not the gambler. LP provides liquidity and earns from fees, not from betting.**

---

## 💰 Fee Structure (Updated)

### Total Entry Fee: 5%

**Distribution:**
- **Loss-Edge Pool:** 2% (40% of fees) - Compensates losers
- **Creator:** 1% (20% of fees) - Paid on resolution
- **Affiliate:** 1% (20% of fees) - Paid on resolution (TODO: referral system)
- **Treasury:** 0.7% (14% of fees) - Platform treasury
- **LP Vault Yield:** 0.3% (6% of fees) - **NEW** - Rewards LP stakers (30% of treasury's 1%)

**Old vs New:**
```
OLD:
- Loss-Edge: 2%
- Creator: 1%
- Affiliate: 1% (goes to treasury)
- Treasury: 1%

NEW:
- Loss-Edge: 2%
- Creator: 1%
- Affiliate: 1%
- Treasury: 0.7%
- LP Yield: 0.3% (NEW - 30% of treasury's share)
```

---

## 🏗️ Smart Contracts

### 1. LPVault.sol

**Purpose:** Manages BNB staking and LP token distribution

**Key Functions:**
- `stake()` - Stake BNB, receive LP tokens
- `unstake(lpTokenAmount)` - Burn LP tokens, receive BNB
- `deployLiquidity(predictionId, amount)` - Admin deploys LP to prediction
- `returnLiquidity(predictionId)` - Called by PredictionFactory after resolution
- `receiveYield()` - Receives yield from YieldVault
- `getUserStake(user)` - Get user's BNB value
- `getTVL()` - Get total value locked

**Configuration:**
- Max deployment per prediction: 20% of vault
- Min stake amount: 0.01 BNB

### 2. YieldVault.sol

**Purpose:** Collects yield from multiple sources and distributes to LP stakers

**Yield Sources:**
1. **Platform Fee Share:** 0.3% of all prediction fees (30% of treasury's 1%)
2. **AI Agent Treasury:** 30% of AI Agent fees (future)
3. **Boost Fees:** 2% when creators request LP boost (future)
4. **KAIDO Emissions:** Token rewards (future)

**Key Functions:**
- `receivePlatformFees()` - Receives fees from FeeDistributor
- `receiveAIAgentFees()` - Receives AI Agent fees
- `receiveBoostFees()` - Receives boost fees
- `distributeYield()` - Sends yield to LPVault
- `getYieldStats()` - Get yield statistics

**Auto-Distribution:** Triggers when pending yield >= 0.1 BNB

### 3. PredictionFactory.sol (Updated)

**New Features:**
- `isLPPosition` flag in Participation struct
- `lpLiquidityAmount` mapping - Tracks LP per prediction
- `lpChoiceVolumes` mapping - Tracks LP per choice
- `addLPLiquidity()` - Add LP to prediction (admin only)
- `getLPLiquidity()` - Get LP vs real user pool
- `getRealChoiceVolume()` - Get real vs display volume

**Payout Calculation (Updated):**
```solidity
// OLD: Winners split total pool
uint256 reward = (userStake * totalPool) / winningVolume;

// NEW: Winners split ONLY real user pool (excludes LP)
uint256 realTotalPool = totalPool - lpLiquidityAmount;
uint256 reward = (userStake * realTotalPool) / realWinningVolume;
```

### 4. FeeDistributor.sol (Updated)

**New Features:**
- `yieldVault` address
- `LP_YIELD_PERCENTAGE` = 30% of fees
- Updated `processFees()` to send 1.5% to YieldVault
- `setYieldVault()` - Set yield vault address

---

## 📈 Example Scenario

### Prediction: "Will BTC hit $100k?"

**Day 1: LP Deployment**
```
Admin deploys: 10 BNB
- 5 BNB on YES
- 5 BNB on NO

Display:
- Total Pool: 10 BNB
- YES: 5 BNB (50%)
- NO: 5 BNB (50%)
```

**Day 5: Real Users Join**
```
Alice: 3 BNB on YES
Bob: 2 BNB on NO

Display:
- Total Pool: 15 BNB (10 LP + 5 users)
- YES: 8 BNB (5 LP + 3 Alice) = 53%
- NO: 7 BNB (5 LP + 2 Bob) = 47%

Real Odds (for payout):
- YES: 60% (3/5)
- NO: 40% (2/5)
```

**Day 30: Resolution - YES Wins**
```
Payout Calculation:
- Real pool: 5 BNB (only user funds)
- Real YES stakes: 3 BNB
- Alice's payout: (3/3) × 5 = 5 BNB
- Alice's profit: 5 - 3 = 2 BNB (66% ROI)

LP Returns:
- LP gets back: 10 BNB (original deposit)
- LP profit from prediction: 0 BNB
- LP profit from fees: 5 × 0.3% = 0.015 BNB
```

---

## 🎨 Frontend Display

### Show Real Odds Only

```typescript
// Calculate odds from REAL user positions only (exclude LP)
const realYesVolume = prediction.choices[0].volume; // User volume
const realNoVolume = prediction.choices[1].volume;
const realTotal = realYesVolume + realNoVolume;

const yesOdds = realTotal > 0 ? (realYesVolume / realTotal) * 100 : 50;
const noOdds = 100 - yesOdds;
```

### Display Components

```
┌─────────────────────────────────┐
│ Total Pool: 15 BNB             │
│ (10 BNB LP + 5 BNB users)      │
│                                 │
│ YES: 60% (3 BNB)               │
│ NO: 40% (2 BNB)                │
│                                 │
│ 💡 LP Boost: 10 BNB            │
│ (Not included in payouts)      │
└─────────────────────────────────┘
```

---

## 🚀 Deployment Steps

1. **Deploy Contracts**
   ```bash
   npx hardhat run scripts/deployLPVault.ts --network bscTestnet
   ```

2. **Verify on BSCScan**
   ```bash
   npx hardhat verify --network bscTestnet <LP_VAULT_ADDRESS> <ADMIN_ADDRESS>
   npx hardhat verify --network bscTestnet <YIELD_VAULT_ADDRESS> <LP_VAULT_ADDRESS>
   ```

3. **Test Staking**
   - Stake 0.1 BNB
   - Check LP token balance
   - Check TVL

4. **Deploy LP to Prediction**
   - Create test prediction
   - Deploy 1 BNB LP
   - Verify display shows LP + user pool

5. **Test Resolution**
   - Resolve prediction
   - Verify LP returns to vault
   - Verify winners get correct payout

---

## ✅ Advantages

1. **Zero Risk for LP** - Always get 100% back
2. **Better UX** - Predictions look active from day 1
3. **Predictable Returns** - Earn from fees, not outcomes
4. **Simple Logic** - Just exclude LP from payouts
5. **Scalable** - Can fund multiple predictions

---

## 📋 Next Steps

See implementation phases in the main task list.

