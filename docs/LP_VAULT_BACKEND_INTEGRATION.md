# LP Vault Backend Integration Guide

## 📋 Overview

This guide covers the backend changes needed to integrate the LP Vault system with the existing KAIDO platform.

---

## 🗄️ Database Schema Changes

### 1. Update Prediction Model

Add LP tracking fields to the Prediction schema:

```typescript
// backend/src/models/Prediction.ts

interface IPrediction extends Document {
  // ... existing fields
  
  // NEW: LP Liquidity tracking
  lpLiquidity: {
    totalAmount: number;        // Total LP deployed
    boostVaultAmount: number;   // From boost vault (future)
    creatorVaultAmount: number; // From creator vault (future)
    positions: [{
      choiceIndex: number;
      amount: number;
      vaultType: 'boost' | 'creator';
    }];
    returned: boolean;          // Whether LP has been returned
    returnedAt?: Date;
  };
  
  // Pool tracking
  realUserPool: number;   // Excludes LP
  displayPool: number;    // Includes LP (for UI)
}
```

### 2. Create LPVault Model

```typescript
// backend/src/models/LPVault.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface ILPVault extends Document {
  totalStaked: number;
  totalDeployed: number;
  totalYieldDistributed: number;
  
  // Stakers
  stakers: [{
    user: mongoose.Types.ObjectId;
    amount: number;
    lpTokens: number;
    stakedAt: Date;
    unstakedAt?: Date;
  }];
  
  // Deployments
  deployments: [{
    predictionId: string;
    amount: number;
    deployedAt: Date;
    returned: boolean;
    returnedAt?: Date;
  }];
  
  createdAt: Date;
  updatedAt: Date;
}

const LPVaultSchema = new Schema<ILPVault>({
  totalStaked: { type: Number, default: 0 },
  totalDeployed: { type: Number, default: 0 },
  totalYieldDistributed: { type: Number, default: 0 },
  stakers: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    lpTokens: { type: Number, required: true },
    stakedAt: { type: Date, default: Date.now },
    unstakedAt: { type: Date }
  }],
  deployments: [{
    predictionId: { type: String, required: true },
    amount: { type: Number, required: true },
    deployedAt: { type: Date, default: Date.now },
    returned: { type: Boolean, default: false },
    returnedAt: { type: Date }
  }]
}, { timestamps: true });

export default mongoose.model<ILPVault>('LPVault', LPVaultSchema);
```

### 3. Create VaultActivity Model

```typescript
// backend/src/models/VaultActivity.ts

export interface IVaultActivity extends Document {
  user: mongoose.Types.ObjectId;
  type: 'stake' | 'unstake' | 'claim' | 'reward';
  amount: number;
  lpTokens?: number;
  txHash?: string;
  createdAt: Date;
}
```

---

## 🔌 API Endpoints

### 1. Staking Endpoints

```typescript
// backend/src/routes/vault.ts

import express from 'express';
import { auth } from '../middleware/auth';
import * as vaultController from '../controllers/vaultController';

const router = express.Router();

// Staking
router.post('/stake', auth, vaultController.stake);
router.post('/unstake', auth, vaultController.unstake);

// Info
router.get('/tvl', vaultController.getTVL);
router.get('/user-stake', auth, vaultController.getUserStake);
router.get('/pending-rewards', auth, vaultController.getPendingRewards);
router.post('/claim-rewards', auth, vaultController.claimRewards);

// Activity
router.get('/activity', auth, vaultController.getActivity);

// Admin
router.post('/admin/deploy', auth, vaultController.deployLiquidity);
router.get('/admin/deployments', auth, vaultController.getDeployments);

export default router;
```

### 2. Controller Implementation

```typescript
// backend/src/controllers/vaultController.ts

import { Request, Response } from 'express';
import { ethers } from 'ethers';
import LPVault from '../models/LPVault';
import VaultActivity from '../models/VaultActivity';

// Get TVL
export const getTVL = async (req: Request, res: Response) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
    const lpVault = new ethers.Contract(
      process.env.LP_VAULT_ADDRESS!,
      LP_VAULT_ABI,
      provider
    );
    
    const tvl = await lpVault.getTVL();
    const tvlBNB = ethers.formatEther(tvl);
    
    res.json({
      success: true,
      tvl: parseFloat(tvlBNB)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user stake
export const getUserStake = async (req: Request, res: Response) => {
  try {
    const { address } = req.user;
    
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
    const lpVault = new ethers.Contract(
      process.env.LP_VAULT_ADDRESS!,
      LP_VAULT_ABI,
      provider
    );
    
    const stake = await lpVault.getUserStake(address);
    const stakeBNB = ethers.formatEther(stake);
    
    const lpTokens = await lpVault.lpTokenBalances(address);
    const lpTokensBNB = ethers.formatEther(lpTokens);
    
    res.json({
      success: true,
      stake: parseFloat(stakeBNB),
      lpTokens: parseFloat(lpTokensBNB)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deploy liquidity (admin only)
export const deployLiquidity = async (req: Request, res: Response) => {
  try {
    const { predictionId, amount, choices } = req.body;
    
    // Verify admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin only' });
    }
    
    // Call smart contract
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);
    
    const lpVault = new ethers.Contract(
      process.env.LP_VAULT_ADDRESS!,
      LP_VAULT_ABI,
      wallet
    );
    
    // Deploy to LP Vault
    const tx1 = await lpVault.deployLiquidity(
      predictionId,
      ethers.parseEther(amount.toString())
    );
    await tx1.wait();
    
    // Add LP to prediction
    const predictionFactory = new ethers.Contract(
      process.env.PREDICTION_FACTORY_ADDRESS!,
      PREDICTION_FACTORY_ABI,
      wallet
    );
    
    const choiceNames = choices.map(c => c.name);
    const choiceAmounts = choices.map(c => ethers.parseEther(c.amount.toString()));
    
    const tx2 = await predictionFactory.addLPLiquidity(
      predictionId,
      choiceNames,
      choiceAmounts
    );
    await tx2.wait();
    
    // Update database
    await Prediction.findByIdAndUpdate(predictionId, {
      'lpLiquidity.totalAmount': amount,
      'lpLiquidity.positions': choices,
      'lpLiquidity.returned': false,
      displayPool: { $inc: amount }
    });
    
    res.json({
      success: true,
      txHash: tx2.hash
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 🔄 Prediction Resolution Updates

Update the resolution logic to handle LP returns:

```typescript
// backend/src/services/predictionResolutionService.ts

export const resolvePrediction = async (predictionId: string, winningChoice: string) => {
  // ... existing resolution logic
  
  // After resolution, LP is automatically returned by smart contract
  // Update database to reflect this
  await Prediction.findByIdAndUpdate(predictionId, {
    'lpLiquidity.returned': true,
    'lpLiquidity.returnedAt': new Date()
  });
  
  // ... rest of resolution logic
};
```

---

## 📊 Odds Calculation Updates

Update odds calculation to use ONLY real user positions:

```typescript
// backend/src/utils/oddsCalculator.ts

export const calculateRealOdds = (prediction: IPrediction) => {
  const realUserPool = prediction.realUserPool;
  
  if (realUserPool === 0) {
    // No real users yet, show 50/50
    return prediction.choices.map(() => 50);
  }
  
  return prediction.choices.map(choice => {
    const realVolume = choice.volume; // Excludes LP
    return (realVolume / realUserPool) * 100;
  });
};
```

---

## 🎯 Next Steps

1. Implement database models
2. Create API endpoints
3. Update prediction resolution logic
4. Update odds calculation
5. Test with smart contracts

