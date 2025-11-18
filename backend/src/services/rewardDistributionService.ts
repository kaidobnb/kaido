import mongoose from 'mongoose';
import Prediction, { IPrediction } from '../models/Prediction';
import Participation, { IParticipation } from '../models/Participation';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Referral from '../models/Referral';
import AdminSettings from '../models/AdminSettings';
import * as fs from 'fs';
import * as path from 'path';

// Load KAIDO wallet credentials from wasp.json
let waspWallets: {
  lossEdgePool: { address: string; privateKey: string };
  kaidoTreasury: { address: string; privateKey: string };
} | null = null;

try {
  const waspPath = path.join(__dirname, '..', '..', 'wasp.json');
  if (fs.existsSync(waspPath)) {
    const waspContent = fs.readFileSync(waspPath, 'utf-8');
    waspWallets = JSON.parse(waspContent);
    console.log('✅ [RewardService] Loaded KAIDO wallet credentials from wasp.json');
  } else {
    console.warn('⚠️  [RewardService] wasp.json not found. Fee distribution to Loss Edge Pool and Treasury will be skipped.');
  }
} catch (error) {
  console.error('❌ [RewardService] Error loading wasp.json:', error);
}

/**
 * Distribute rewards for a resolved prediction
 * This function handles all reward distribution logic including:
 * - Winner rewards
 * - Creator fees
 * - Affiliate fees
 * - Loss Edge Pool fees
 * - Treasury fees
 * 
 * @param predictionId - The ID of the prediction to distribute rewards for
 * @param resolvedChoice - The winning choice
 */
export async function distributeRewards(
  predictionId: string | mongoose.Types.ObjectId,
  resolvedChoice: string
): Promise<void> {
  console.log(`[RewardService] Starting reward distribution for prediction ${predictionId}, choice: ${resolvedChoice}`);

  const prediction = await Prediction.findById(predictionId) as (mongoose.Document & IPrediction) | null;
  
  if (!prediction) {
    throw new Error(`Prediction ${predictionId} not found`);
  }

  // Find all winning participations
  const winningParticipations = await Participation.find({
    prediction: prediction._id,
    position: resolvedChoice,
    status: 'active'
  }).populate('user');

  console.log(`[RewardService] Found ${winningParticipations.length} winning participations`);

  // Check if this is an agent prediction
  const isAgentPrediction = (prediction.type as 'binary' | 'multiple' | 'agent') === 'agent';

  // Variables to store fee distribution info (calculated once, used for all winners)
  let platformFee = 0;
  let remainingPool = prediction.volume;
  let winningVolume = 0;
  let lossEdgePoolFee = 0;
  let creatorFee = 0;
  let affiliateFee = 0;
  let treasuryFee = 0;

  // FOR REGULAR PREDICTIONS: Calculate fees and distribute ONCE before processing winners
  if (!isAgentPrediction && winningParticipations.length > 0) {
    // Calculate total winning volume
    winningVolume = winningParticipations.reduce((total, p) => total + p.amount, 0);

    if (winningVolume > 0) {
      // Get admin settings for fee configuration
      let adminSettings = await AdminSettings.findOne({});
      if (!adminSettings) {
        adminSettings = await AdminSettings.create({
          autoApproveClaims: false,
          creationFeePercentage: 10,
          resolutionFeePercentage: 5,
          creatorSharePercentage: 20,
          partnerWallets: []
        });
      }

      // Calculate platform fee based on token type
      let platformFeePercentage: number;
      let creatorSharePercentage: number;

      switch (prediction.tokenType) {
        case 'SOL':
          platformFeePercentage = adminSettings.resolutionFeePercentage / 100;
          creatorSharePercentage = adminSettings.creatorSharePercentage / 100;
          break;
        case 'SOLY':
          platformFeePercentage = 0.02;
          creatorSharePercentage = 0.25;
          break;
        case 'BNB':
          platformFeePercentage = 0.05;
          creatorSharePercentage = 0.20;
          break;
        case 'KAIDO':
          platformFeePercentage = 0;
          creatorSharePercentage = 0;
          break;
        default:
          platformFeePercentage = 0.05;
          creatorSharePercentage = 0.20;
      }

      platformFee = prediction.volume * platformFeePercentage;
      remainingPool = prediction.volume - platformFee;

      if (prediction.tokenType === 'BNB' && waspWallets) {
        // NEW 5-TIER FEE DISTRIBUTION SYSTEM FOR BNB
        lossEdgePoolFee = platformFee * 0.40;  // 2% of total pool
        creatorFee = platformFee * 0.20;       // 1% of total pool
        affiliateFee = platformFee * 0.20;     // 1% of total pool
        treasuryFee = platformFee * 0.20;      // 1% of total pool

        console.log(`[RewardService] 🎯 BNB Fee Distribution (5% of ${prediction.volume} ${prediction.tokenType}):`);
        console.log(`[RewardService]    Platform Fee: ${platformFee}`);
        console.log(`[RewardService]    Loss Edge Pool (2%): ${lossEdgePoolFee}`);
        console.log(`[RewardService]    Creator (1%): ${creatorFee}`);
        console.log(`[RewardService]    Affiliate (1%): ${affiliateFee}`);
        console.log(`[RewardService]    Treasury (1%): ${treasuryFee}`);
        console.log(`[RewardService]    Winners Pool (95%): ${remainingPool}`);
      } else {
        // For non-BNB tokens, use old system
        creatorFee = platformFee * creatorSharePercentage;
        const adminFee = platformFee - creatorFee;

        // Distribute admin fee to admin wallet (old system)
        try {
          const adminUser = await User.findOne({ walletAddress: prediction.adminWallet });
          if (adminUser) {
            await User.findByIdAndUpdate(adminUser._id, {
              $inc: { [`balances.${prediction.tokenType}`]: adminFee }
            });

            await Transaction.create({
              user: adminUser._id,
              type: 'fee',
              amount: adminFee,
              tokenType: prediction.tokenType,
              prediction: prediction._id,
              description: `Admin share of resolution fee`,
              status: 'completed'
            });

            console.log(`[RewardService] Credited ${adminFee} ${prediction.tokenType} to admin wallet as resolution fee`);
          }
        } catch (error) {
          console.error(`[RewardService] Error distributing admin fee:`, error);
        }
      }

      // Update prediction with fee information
      await Prediction.findByIdAndUpdate(prediction._id, {
        'fees.resolution': platformFee
      });

      // Process fee distribution (ONCE for the entire prediction)
      try {
        // 1. CREATOR FEE (1% for BNB, variable for others) - Make it claimable
        const creator = await User.findById(prediction.creator);
        if (creator && creatorFee > 0) {
          // Create a claimable transaction for the creator (they need to claim it like winners)
          await Transaction.create({
            user: creator._id,
            type: 'fee',
            amount: creatorFee,
            tokenType: prediction.tokenType,
            prediction: prediction._id,
            description: `Creator reward (1% of pool) - claimable`,
            status: 'pending' // Pending until claimed
          });

          console.log(`[RewardService] ✅ Created claimable creator fee of ${creatorFee} ${prediction.tokenType} for creator ${creator.username}`);
        }

        // 2. AFFILIATE FEE (1% for BNB) - Distribute to all participants' referrers
        if (prediction.tokenType === 'BNB' && affiliateFee > 0 && waspWallets) {
          // Get all participations for this prediction
          const allParticipations = await Participation.find({
            prediction: prediction._id,
            status: 'active'
          }).populate('user');

          // Track unique referrers and their total referred participation amounts
          const referrerMap = new Map<string, { referrer: any; totalAmount: number }>();
          let totalReferredAmount = 0;

          for (const part of allParticipations) {
            const partUser = part.user as any;
            if (partUser && partUser.referredBy) {
              const referrerId = partUser.referredBy.toString();
              const existing = referrerMap.get(referrerId);

              if (existing) {
                existing.totalAmount += part.amount;
              } else {
                const referrer = await User.findById(partUser.referredBy);
                if (referrer) {
                  referrerMap.set(referrerId, { referrer, totalAmount: part.amount });
                }
              }
              totalReferredAmount += part.amount;
            }
          }

          // Distribute affiliate fee proportionally to referrers
          if (totalReferredAmount > 0 && referrerMap.size > 0) {
            console.log(`[RewardService] 💰 Distributing ${affiliateFee} ${prediction.tokenType} affiliate fee to ${referrerMap.size} referrers`);

            for (const [referrerId, { referrer, totalAmount }] of referrerMap) {
              const referrerShare = (totalAmount / totalReferredAmount) * affiliateFee;

              await User.findByIdAndUpdate(referrer._id, {
                $inc: { [`balances.${prediction.tokenType}`]: referrerShare }
              });

              await Transaction.create({
                user: referrer._id,
                type: 'referral',
                amount: referrerShare,
                tokenType: prediction.tokenType,
                prediction: prediction._id,
                description: `Affiliate reward (proportional share of 1% pool)`,
                status: 'completed'
              });

              console.log(`[RewardService] ✅ Credited ${referrerShare} ${prediction.tokenType} to referrer ${referrer.username}`);
            }
          } else {
            // No referrers - add affiliate fee to treasury
            console.log(`[RewardService] No referrers found, adding ${affiliateFee} ${prediction.tokenType} to treasury`);
            treasuryFee += affiliateFee;
          }
        }

        // 3. LOSS EDGE POOL FEE (2% for BNB)
        if (prediction.tokenType === 'BNB' && lossEdgePoolFee > 0 && waspWallets) {
          let lossEdgePoolUser = await User.findOne({ walletAddress: waspWallets.lossEdgePool.address });

          if (!lossEdgePoolUser) {
            console.log(`[RewardService] Creating Loss Edge Pool user account...`);
            lossEdgePoolUser = await User.create({
              username: 'LossEdgePool',
              email: `lossedgepool@kaido.com`,
              walletAddress: waspWallets.lossEdgePool.address,
              balances: { SOL: 0, SOLY: 0, BNB: 0, KAIDO: 0 },
              isVerified: true
            });
          }

          // Send actual BNB to Loss Edge Pool wallet
          try {
            const { sendBNBFromClaimWallet } = await import('./bnbWalletService');
            const txHash = await sendBNBFromClaimWallet(waspWallets.lossEdgePool.address, lossEdgePoolFee);
            console.log(`[RewardService] 💸 Sent ${lossEdgePoolFee} BNB to Loss Edge Pool wallet. TX: ${txHash}`);
          } catch (error) {
            console.error(`[RewardService] ❌ Failed to send BNB to Loss Edge Pool:`, error);
            throw error;
          }

          await User.findByIdAndUpdate(lossEdgePoolUser._id, {
            $inc: { [`balances.${prediction.tokenType}`]: lossEdgePoolFee }
          });

          await Transaction.create({
            user: lossEdgePoolUser._id,
            type: 'fee',
            amount: lossEdgePoolFee,
            tokenType: prediction.tokenType,
            prediction: prediction._id,
            description: `Loss Edge Pool fee (2% of pool)`,
            status: 'completed'
          });

          console.log(`[RewardService] ✅ Credited ${lossEdgePoolFee} ${prediction.tokenType} to Loss Edge Pool`);
        }

        // 4. TREASURY FEE (1% for BNB)
        if (prediction.tokenType === 'BNB' && treasuryFee > 0 && waspWallets) {
          let treasuryUser = await User.findOne({ walletAddress: waspWallets.kaidoTreasury.address });

          if (!treasuryUser) {
            console.log(`[RewardService] Creating KAIDO Treasury user account...`);
            treasuryUser = await User.create({
              username: 'KAIDOTreasury',
              email: `treasury@kaido.com`,
              walletAddress: waspWallets.kaidoTreasury.address,
              balances: { SOL: 0, SOLY: 0, BNB: 0, KAIDO: 0 },
              isVerified: true
            });
          }

          // Send actual BNB to Treasury wallet
          try {
            const { sendBNBFromClaimWallet } = await import('./bnbWalletService');
            const txHash = await sendBNBFromClaimWallet(waspWallets.kaidoTreasury.address, treasuryFee);
            console.log(`[RewardService] 💸 Sent ${treasuryFee} BNB to Treasury wallet. TX: ${txHash}`);
          } catch (error) {
            console.error(`[RewardService] ❌ Failed to send BNB to Treasury:`, error);
            throw error;
          }

          await User.findByIdAndUpdate(treasuryUser._id, {
            $inc: { [`balances.${prediction.tokenType}`]: treasuryFee }
          });

          await Transaction.create({
            user: treasuryUser._id,
            type: 'fee',
            amount: treasuryFee,
            tokenType: prediction.tokenType,
            prediction: prediction._id,
            description: `Treasury fee (1% of pool)`,
            status: 'completed'
          });

          console.log(`[RewardService] ✅ Credited ${treasuryFee} ${prediction.tokenType} to Treasury`);
        }
      } catch (error) {
        console.error(`[RewardService] Error distributing fees:`, error);
        throw error; // Re-throw to prevent partial distribution
      }
    }
  }

  // NOW PROCESS EACH WINNER (fees already distributed above)
  for (const participation of winningParticipations) {
    if (!participation.user) continue;

    const user = participation.user as any;
    let reward = 0;

    if (isAgentPrediction) {
      // For agent predictions, distribute reward pool equally among winners
      const rewardPoolAmount = prediction.rewardPoolAmount || 0;
      reward = winningParticipations.length > 0
        ? rewardPoolAmount / winningParticipations.length
        : 0;

      console.log(`[RewardService] Agent prediction - reward pool: ${rewardPoolAmount} ${prediction.tokenType}, winners: ${winningParticipations.length}, reward per winner: ${reward}`);
    } else {
      // For regular predictions, calculate proportional reward
      if (winningVolume <= 0) {
        // No winning volume - return user's stake
        reward = participation.amount;
        console.log(`[RewardService] Regular prediction - No winning volume. Returning user's stake: ${participation.amount}`);
      } else {
        // Calculate proportional reward based on stake
        const proportionalStake = participation.amount / winningVolume;
        reward = remainingPool * proportionalStake;

        console.log(`[RewardService] Regular prediction - User stake: ${participation.amount}, Total winning volume: ${winningVolume}, Proportional stake: ${proportionalStake}, Remaining pool: ${remainingPool}, Reward: ${reward}`);
      }
    }

    // Create notification
    const notification = {
      userId: user._id,
      type: 'winnings',
      title: 'You won a prediction!',
      message: `You won ${reward.toFixed(4)} ${prediction.tokenType} from "${prediction.title}"`,
      read: false,
      predictionId: prediction._id,
      timestamp: new Date(),
      link: '/profile/winnings',
      data: {
        reward,
        tokenType: prediction.tokenType,
        predictionTitle: prediction.title,
        participationId: participation._id,
        claimable: true
      }
    };

    // Add notification to user's notifications array
    await User.findByIdAndUpdate(user._id, {
      $push: { notifications: notification }
    });

    // Update participation to mark it as won and claimable
    await Participation.findByIdAndUpdate(participation._id, {
      status: 'won',
      reward: reward,
      claimable: true
    });

    // Create transaction record for win (but don't credit balance yet - users need to claim)
    await Transaction.create({
      user: user._id,
      type: 'win',
      amount: reward,
      tokenType: prediction.tokenType,
      prediction: prediction._id,
      position: participation.position,
      status: 'pending', // Will be completed when claimed
      description: 'Prediction win - claimable'
    });

    // Update user stats
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        wonPredictions: 1,
        reputation: 10 // Award reputation points for winning
      }
    });

    console.log(`[RewardService] ✅ Added winning notification for user ${user._id}, marked participation ${participation._id} as claimable, and created transaction record`);
  }

  // Mark losing participations
  const losingParticipations = await Participation.find({
    prediction: prediction._id,
    position: { $ne: resolvedChoice },
    status: 'active'
  });

  for (const participation of losingParticipations) {
    await Participation.findByIdAndUpdate(participation._id, {
      status: 'lost'
    });
  }

  console.log(`[RewardService] ✅ Marked ${losingParticipations.length} losing participations`);
  console.log(`[RewardService] ✅ Reward distribution completed for prediction ${predictionId}`);
}

