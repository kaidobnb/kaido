import express, { Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/adminMiddleware';
import Prediction from '../models/Prediction';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Participation from '../models/Participation';
import AdminSettings from '../models/AdminSettings';
import Referral from '../models/Referral';
import mongoose from 'mongoose';
import { sendTokensFromClaimWallet, hasClaimWalletSufficientBalance } from '../services/walletService';
import { getPartnerRecords, payoutPartnerFees } from '../controllers/partnerController';
import { startAutoPredictionJob, stopAutoPredictionJob } from '../jobs/autoPredictionJob';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// All routes are protected and admin-only
router.use(protect);
router.use(adminOnly);

// Get dashboard stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const predictionCount = await Prediction.countDocuments();
    const activeCount = await Prediction.countDocuments({ status: 'active' });
    const resolvedCount = await Prediction.countDocuments({ status: 'resolved' });
    const transactionCount = await Transaction.countDocuments();

    // Get total volume
    const volumeAggregation = await Prediction.aggregate([
      { $group: { _id: null, totalVolume: { $sum: '$volume' } } }
    ]);
    const totalVolume = volumeAggregation.length > 0 ? volumeAggregation[0].totalVolume : 0;

    // Get fee totals
    const feeAggregation = await Transaction.aggregate([
      { $match: { type: 'fee' } },
      { $group: {
        _id: '$tokenType',
        totalFees: { $sum: '$amount' }
      }}
    ]);

    // Format fee totals
    const feeTotals: Record<string, number> = {};
    feeAggregation.forEach(item => {
      feeTotals[item._id] = item.totalFees;
    });

    res.status(200).json({
      success: true,
      stats: {
        userCount,
        predictionCount,
        activeCount,
        resolvedCount,
        transactionCount,
        totalVolume,
        feeTotals
      }
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Get all predictions with pagination and filtering
router.get('/predictions', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { status, sort = 'createdAt', order = 'desc', limit = 10, page = 1 } = req.query;

    // Build query
    const query: any = {};
    if (status) query.status = status;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    // Get predictions
    const predictions = await Prediction.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('creator', 'username walletAddress');

    // Get total count
    const total = await Prediction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: predictions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      predictions
    });
  } catch (error) {
    console.error('Error getting admin predictions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Get all users with pagination and filtering
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { sort = 'createdAt', order = 'desc', limit = 10, page = 1 } = req.query;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    // Get users
    const users = await User.find()
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .select('-password');

    // Get total count
    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users
    });
  } catch (error) {
    console.error('Error getting admin users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Get all transactions with pagination and filtering
router.get('/transactions', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { type, tokenType, sort = 'createdAt', order = 'desc', limit = 10, page = 1 } = req.query;

    // Build query
    const query: any = {};
    if (type) query.type = type;
    if (tokenType) query.tokenType = tokenType;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    // Get transactions
    const transactions = await Transaction.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'username walletAddress')
      .populate('prediction', 'title');

    // Get total count
    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      transactions
    });
  } catch (error) {
    console.error('Error getting admin transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Get prediction details with participations
router.get('/predictions/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const prediction = await Prediction.findById(req.params.id)
      .populate('creator', 'username walletAddress');

    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }

    // Get participations
    const participations = await Participation.find({ prediction: prediction._id })
      .populate('user', 'username walletAddress');

    // Get transactions
    const transactions = await Transaction.find({ prediction: prediction._id })
      .populate('user', 'username walletAddress');

    res.status(200).json({
      success: true,
      prediction,
      participations,
      transactions
    });
  } catch (error) {
    console.error('Error getting admin prediction details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Cancel a prediction
router.post('/predictions/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }

    // Check if prediction is already resolved or cancelled
    if (prediction.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Prediction is already resolved or cancelled' });
    }

    // Update prediction status
    prediction.status = 'cancelled';
    prediction.resolvedAt = new Date();
    await prediction.save();

    // Refund all participants
    const participations = await Participation.find({ prediction: prediction._id });
    console.log(`Found ${participations.length} participations to refund for prediction ${prediction._id}`);

    for (const participation of participations) {
      try {
        // Create refund transaction - use a valid transaction type from the enum
        const transaction = await Transaction.create({
          user: participation.user,
          type: 'withdrawal', // Using 'withdrawal' instead of 'refund' as it's a valid enum value
          amount: participation.amount,
          tokenType: participation.tokenType,
          prediction: prediction._id,
          description: 'Refund: Prediction cancelled by admin',
          status: 'completed'
        });

        console.log(`Created refund transaction ${transaction._id} for user ${participation.user}`);

        // Update user balance
        const updatedUser = await User.findByIdAndUpdate(
          participation.user,
          {
            $inc: {
              [`balances.${participation.tokenType}`]: participation.amount
            }
          },
          { new: true }
        );

        console.log(`Updated balance for user ${participation.user}. New balance: ${updatedUser?.balances?.[participation.tokenType as 'SOL' | 'SOLY']}`);

        // Update participation status to make it claimable
        await Participation.findByIdAndUpdate(
          participation._id,
          {
            status: 'refunded',
            claimable: true
          }
        );
      } catch (participationError) {
        console.error(`Error processing refund for participation ${participation._id}:`, participationError);
        // Continue with other participations even if one fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Prediction cancelled and participants refunded'
    });
  } catch (error) {
    console.error('Error cancelling prediction:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error'
    });
  }
}));

// Get pending claim approvals
router.get('/claims/pending', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get all participations that are claimed but not admin approved
    const pendingClaims = await Participation.find({
      claimed: true,
      adminApproved: false
    })
      .populate('user', 'username walletAddress')
      .populate('prediction', 'title asset tokenType');

    // Get related transactions
    const claimIds = pendingClaims.map(claim => claim._id);
    const transactions = await Transaction.find({
      type: 'withdrawal',
      status: 'pending',
      adminApproved: false
    })
      .populate('user', 'username walletAddress')
      .populate('prediction', 'title');

    // Transform the data to match the frontend expectations
    const formattedClaims = pendingClaims.map(claim => {
      // Convert to plain object with any type
      const claimObj = claim.toObject() as any;

      // Type guard for user object
      const isPopulatedUser = (user: any): user is {
        _id: mongoose.Types.ObjectId;
        username?: string;
        walletAddress?: string;
      } => {
        return typeof user === 'object' && user !== null && '_id' in user;
      };

      // Type guard for prediction object
      const isPopulatedPrediction = (prediction: any): prediction is {
        _id: mongoose.Types.ObjectId;
        title: string;
        asset: string;
        tokenType: 'SOL' | 'SOLY';
      } => {
        return typeof prediction === 'object' && prediction !== null && '_id' in prediction;
      };

      // Create user object with safe defaults
      const userObj = {
        id: 'unknown',
        username: 'Anonymous',
        walletAddress: ''
      };

      // Create prediction object with safe defaults
      const predictionObj = {
        id: 'unknown',
        title: 'Unknown Prediction',
        asset: 'Unknown',
        tokenType: 'SOL' as const
      };

      // Handle user object
      if (claimObj.user) {
        if (isPopulatedUser(claimObj.user)) {
          userObj.id = claimObj.user._id.toString();
          if (claimObj.user.username) {
            userObj.username = claimObj.user.username;
          }
          if (claimObj.user.walletAddress) {
            userObj.walletAddress = claimObj.user.walletAddress;
          }
        } else if (mongoose.Types.ObjectId.isValid(claimObj.user)) {
          userObj.id = claimObj.user.toString();
        }
      }

      // Handle prediction object
      if (claimObj.prediction) {
        if (isPopulatedPrediction(claimObj.prediction)) {
          predictionObj.id = claimObj.prediction._id.toString();
          predictionObj.title = claimObj.prediction.title;
          predictionObj.asset = claimObj.prediction.asset;
          predictionObj.tokenType = claimObj.prediction.tokenType;
        } else if (mongoose.Types.ObjectId.isValid(claimObj.prediction)) {
          predictionObj.id = claimObj.prediction.toString();
        }
      }

      return {
        id: claimObj._id.toString(), // Convert _id to id string
        user: userObj,
        prediction: predictionObj,
        position: claimObj.position,
        amount: claimObj.amount,
        reward: claimObj.reward,
        createdAt: claimObj.createdAt,
        claimedAt: claimObj.claimedAt
      };
    });

    // Transform transactions
    const formattedTransactions = transactions.map(tx => {
      // Convert to plain object with any type
      const txObj = tx.toObject() as any;

      // Type guard for user object
      const isPopulatedUser = (user: any): user is {
        _id: mongoose.Types.ObjectId;
        username?: string;
      } => {
        return typeof user === 'object' && user !== null && '_id' in user;
      };

      // Type guard for prediction object
      const isPopulatedPrediction = (prediction: any): prediction is {
        _id: mongoose.Types.ObjectId;
        title: string;
      } => {
        return typeof prediction === 'object' && prediction !== null && '_id' in prediction;
      };

      // Create user object with safe defaults
      const userObj = {
        id: 'unknown',
        username: 'Anonymous'
      };

      // Create prediction object with safe defaults
      const predictionObj = {
        id: 'unknown',
        title: 'Unknown Prediction'
      };

      // Handle user object
      if (txObj.user) {
        if (isPopulatedUser(txObj.user)) {
          userObj.id = txObj.user._id.toString();
          if (txObj.user.username) {
            userObj.username = txObj.user.username;
          }
        } else if (mongoose.Types.ObjectId.isValid(txObj.user)) {
          userObj.id = txObj.user.toString();
        }
      }

      // Handle prediction object
      if (txObj.prediction) {
        if (isPopulatedPrediction(txObj.prediction)) {
          predictionObj.id = txObj.prediction._id.toString();
          predictionObj.title = txObj.prediction.title;
        } else if (mongoose.Types.ObjectId.isValid(txObj.prediction)) {
          predictionObj.id = txObj.prediction.toString();
        }
      }

      return {
        id: txObj._id.toString(),
        user: userObj,
        prediction: predictionObj,
        amount: txObj.amount,
        tokenType: txObj.tokenType,
        status: txObj.status,
        createdAt: txObj.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: pendingClaims.length,
      claims: formattedClaims,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('Error getting pending claims:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Approve a claim
router.post('/claims/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };
    const participationId = req.params.id;

    // Find the participation
    const participation = await Participation.findById(participationId)
      .populate<{ prediction: any }>('prediction');

    if (!participation) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    // Check if already approved
    if (participation.adminApproved) {
      return res.status(400).json({ success: false, message: 'Claim already approved' });
    }

    // Approve the claim
    const approved = await approveClaimTransaction(participationId, participation.user);

    if (!approved) {
      return res.status(500).json({ success: false, message: 'Failed to approve claim' });
    }

    res.status(200).json({
      success: true,
      message: 'Claim approved successfully'
    });
  } catch (error) {
    console.error('Error approving claim:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Toggle auto-approve setting
router.post('/settings/auto-approve', asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Enabled must be a boolean value' });
    }

    // Find or create admin settings
    let settings = await AdminSettings.findOne({});

    if (!settings) {
      settings = await AdminSettings.create({
        autoApproveClaims: enabled,
        updatedBy: user._id
      });
    } else {
      settings.autoApproveClaims = enabled;
      settings.updatedBy = user._id;
      settings.lastUpdated = new Date();
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: `Auto-approve claims ${enabled ? 'enabled' : 'disabled'}`,
      settings
    });
  } catch (error) {
    console.error('Error updating auto-approve setting:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Get admin settings
router.get('/settings', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Find or create admin settings
    let settings = await AdminSettings.findOne({});

    if (!settings) {
      settings = await AdminSettings.create({
        autoApproveClaims: false
      });
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting admin settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Helper function to approve a claim transaction
const approveClaimTransaction = async (participationId: string, userId: mongoose.Types.ObjectId) => {
  try {
    // Find the participation
    const participation = await Participation.findById(participationId)
      .populate<{ prediction: any }>('prediction');

    if (!participation) {
      throw new Error('Participation not found');
    }

    // Get prediction details
    const prediction = participation.prediction;

    // Get reward amount
    const reward = participation.reward || 0;

    // Get user details for wallet address
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has a wallet address
    if (!user.walletAddress) {
      throw new Error('User does not have a wallet address');
    }

    // Check if claim wallet has sufficient balance
    const hasSufficientBalance = await hasClaimWalletSufficientBalance(reward);
    if (!hasSufficientBalance) {
      throw new Error(`Claim wallet has insufficient balance to pay out ${reward} ${prediction.tokenType}`);
    }

    // Mark participation as admin approved
    await Participation.findByIdAndUpdate(participationId, {
      adminApproved: true
    });

    // Update transaction status
    await Transaction.updateOne(
      {
        user: userId,
        prediction: prediction._id,
        position: participation.position,
        type: 'win',
        status: 'processing'
      },
      {
        status: 'completed',
        description: 'Prediction win - claimed and approved'
      }
    );

    // Update withdrawal transaction
    const withdrawalTx = await Transaction.findOneAndUpdate(
      {
        user: userId,
        prediction: prediction._id,
        type: 'withdrawal',
        status: 'pending',
        adminApproved: false
      },
      {
        status: 'processing', // Set to processing while we send the on-chain transaction
        description: 'Prediction winnings withdrawal to wallet (processing)',
        adminApproved: true
      },
      { new: true }
    );

    if (!withdrawalTx) {
      throw new Error('Withdrawal transaction not found');
    }

    // Send tokens to user's wallet
    try {
      console.log(`Sending ${reward} ${prediction.tokenType} to ${user.walletAddress}`);

      // Send tokens from claim wallet to user's wallet
      const txSignature = await sendTokensFromClaimWallet(
        user.walletAddress,
        reward,
        prediction.tokenType as 'SOL' | 'SOLY'
      );

      // Update transaction with signature
      await Transaction.findByIdAndUpdate(withdrawalTx._id, {
        status: 'completed',
        description: `Prediction winnings withdrawal to wallet (completed)`,
        txHash: txSignature
      });

      console.log(`Successfully sent ${reward} ${prediction.tokenType} to ${user.walletAddress}`);
      console.log(`Transaction signature: ${txSignature}`);
    } catch (error) {
      // Type assertion to handle the error properly
      const sendError: Error = error instanceof Error ? error : new Error(String(error));
      console.error('Error sending tokens to user wallet:', sendError);

      // Update transaction to failed status
      await Transaction.findByIdAndUpdate(withdrawalTx._id, {
        status: 'failed',
        description: `Failed to send tokens: ${sendError.message}`
      });

      // Still update user balance in the app
      await User.findByIdAndUpdate(userId, {
        $inc: {
          [`balances.${prediction.tokenType}`]: reward,
          claimedWinnings: reward
        }
      });

      // Return true because we still want to mark the claim as approved in the app
      // The admin will need to manually send the tokens
      return true;
    }

    // Update user balance
    await User.findByIdAndUpdate(userId, {
      $inc: {
        [`balances.${prediction.tokenType}`]: reward,
        claimedWinnings: reward
      }
    });

    return true;
  } catch (error) {
    console.error('Error approving claim transaction:', error);
    return false;
  }
};

// Debug endpoint to check referral status
router.post('/debug/check-referral', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { referrer, referred } = req.body;

    if (!referrer || !referred) {
      return res.status(400).json({
        success: false,
        message: 'Referrer and referred IDs are required'
      });
    }

    const referral = await Referral.findOne({
      referrer,
      referred
    });

    return res.status(200).json({
      success: true,
      referral
    });
  } catch (error) {
    console.error('Error checking referral:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// Debug endpoint to check transactions
router.post('/debug/check-transactions', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { user, type, prediction } = req.body;

    const query: any = {};
    if (user) query.user = user;
    if (type) query.type = type;
    if (prediction) query.prediction = prediction;

    const transactions = await Transaction.find(query);

    return res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error checking transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// Debug endpoint to check notifications
router.post('/debug/check-notifications', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { user, type } = req.body;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const userDoc = await User.findById(user);

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let notifications = userDoc.notifications || [];

    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }

    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error checking notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// Endpoint to fix missing referral rewards
router.post('/fix-referral-rewards', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('Starting to fix missing referral rewards...');

    // Find all referrals where hasPredicted is true
    const referrals = await Referral.find({ hasPredicted: true });
    console.log(`Found ${referrals.length} referrals with hasPredicted=true`);

    let fixedCount = 0;
    let alreadyRewardedCount = 0;

    for (const referral of referrals) {
      // Find the referred user
      const referredUser = await User.findById(referral.referred);
      if (!referredUser) {
        console.log(`Referred user ${referral.referred} not found, skipping`);
        continue;
      }

      // Find the referrer
      const referrer = await User.findById(referral.referrer);
      if (!referrer) {
        console.log(`Referrer ${referral.referrer} not found, skipping`);
        continue;
      }

      // Find participations by the referred user
      const participations = await Participation.find({ user: referral.referred })
        .populate('prediction');

      console.log(`Found ${participations.length} participations by referred user ${referredUser.username || referredUser.walletAddress}`);

      for (const participation of participations) {
        // Skip if prediction is not populated
        if (!participation.prediction || typeof participation.prediction === 'string' ||
            !('tokenType' in participation.prediction)) {
          console.log('Prediction not properly populated, skipping');
          continue;
        }

        // Cast prediction to any to avoid TypeScript errors
        const prediction = participation.prediction as any;

        // Check if a referral reward transaction already exists for this prediction
        const existingTransaction = await Transaction.findOne({
          user: referral.referrer,
          type: 'referral',
          prediction: prediction._id
        });

        if (existingTransaction) {
          console.log(`Referral reward already exists for prediction ${prediction._id}, skipping`);
          alreadyRewardedCount++;
          continue;
        }

        // Get admin settings for referral reward configuration
        const adminSettings = await AdminSettings.findOne({});
        // Use the configured referral reward percentage or default to 2% for SOL and 0.5% for SOLY
        const configuredReferralPercentage = adminSettings?.referralRewardPercentage || 2;
        const referralRewardPercentage = prediction.tokenType === 'SOL' ?
          configuredReferralPercentage / 100 : // Convert from percentage to decimal for SOL
          0.005; // Fixed 0.5% for SOLY
        let referralReward = 0;

        // For agent predictions, use a fixed minimum reward
        if (prediction.type === 'agent') {
          referralReward = prediction.tokenType === 'SOL' ? 0.01 : 1; // 0.01 SOL or 1 SOLY minimum
          console.log(`Agent prediction - using fixed minimum reward: ${referralReward} ${prediction.tokenType}`);
        } else {
          // For regular predictions, calculate based on amount
          const numericAmount = typeof participation.amount === 'string' ?
            parseFloat(participation.amount) : participation.amount;
          referralReward = numericAmount * referralRewardPercentage;
          console.log(`Regular prediction - calculated referral reward: ${referralReward} ${prediction.tokenType}`);
        }

        // Skip if the reward is too small
        if (referralReward <= 0) {
          console.log(`Referral reward is too small (${referralReward}), skipping`);
          continue;
        }

        // Create a transaction record for the referral reward
        const referralTransaction = await Transaction.create({
          user: referral.referrer,
          type: 'referral',
          amount: referralReward,
          tokenType: prediction.tokenType,
          prediction: prediction._id,
          status: 'pending',
          description: `Referral reward from ${referredUser.username || 'user'}'s prediction participation - Claimable (Fixed)`
        });

        console.log(`Created pending referral transaction: ${referralTransaction._id}`);

        // Add notification to referrer
        await User.updateOne(
          { _id: referral.referrer },
          {
            $push: {
              notifications: {
                userId: referral.referrer,
                type: 'referral_bonus',
                title: 'New Referral Reward!',
                message: `You earned ${prediction.tokenType === 'SOL' ? referralReward.toFixed(4) : referralReward.toFixed(2)} ${prediction.tokenType} from ${referredUser.username || 'a user'}'s prediction participation.`,
                read: false,
                timestamp: new Date(),
                predictionId: prediction._id,
                data: {
                  amount: referralReward,
                  tokenType: prediction.tokenType,
                  transactionId: referralTransaction._id,
                  referredUser: referredUser.username || 'a user',
                  claimable: true
                }
              }
            }
          }
        );

        console.log(`Added notification to referrer ${referrer.username || referrer.walletAddress}`);
        fixedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Fixed ${fixedCount} missing referral rewards. ${alreadyRewardedCount} were already rewarded.`
    });
  } catch (error) {
    console.error('Error fixing referral rewards:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// Update partner wallet settings
router.post('/settings/partner-wallets', asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };
    const { partnerWallets, creationFeePercentage, resolutionFeePercentage, referralRewardPercentage } = req.body;

    // Validate input
    if (!Array.isArray(partnerWallets)) {
      return res.status(400).json({
        success: false,
        message: 'Partner wallets must be an array'
      });
    }

    // Validate fee percentages
    if (typeof creationFeePercentage !== 'number' || creationFeePercentage < 0 || creationFeePercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Creation fee percentage must be a number between 0 and 100'
      });
    }

    if (typeof resolutionFeePercentage !== 'number' || resolutionFeePercentage < 0 || resolutionFeePercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Resolution fee percentage must be a number between 0 and 100'
      });
    }

    // Validate referral reward percentage
    if (typeof referralRewardPercentage !== 'number' || referralRewardPercentage < 0 || referralRewardPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Referral reward percentage must be a number between 0 and 100'
      });
    }

    // Validate partner wallets
    for (const wallet of partnerWallets) {
      if (!wallet.walletAddress || typeof wallet.walletAddress !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Each partner wallet must have a valid wallet address'
        });
      }

      if (typeof wallet.feePercentage !== 'number' || wallet.feePercentage < 0 || wallet.feePercentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'Each partner wallet must have a fee percentage between 0 and 100'
        });
      }
    }

    // Calculate total percentage to ensure it doesn't exceed 100%
    const totalPercentage = partnerWallets
      .filter(wallet => wallet.active)
      .reduce((total, wallet) => total + wallet.feePercentage, 0);

    if (totalPercentage > 100) {
      return res.status(400).json({
        success: false,
        message: `Total partner fee percentage (${totalPercentage}%) exceeds 100% of the creation fee`
      });
    }

    // Find or create admin settings
    let settings = await AdminSettings.findOne({});

    if (!settings) {
      settings = await AdminSettings.create({
        autoApproveClaims: false,
        creationFeePercentage,
        resolutionFeePercentage,
        referralRewardPercentage,
        partnerWallets,
        updatedBy: user._id,
        lastUpdated: new Date()
      });
    } else {
      // Update existing settings
      settings.creationFeePercentage = creationFeePercentage;
      settings.resolutionFeePercentage = resolutionFeePercentage;
      settings.referralRewardPercentage = referralRewardPercentage;
      settings.partnerWallets = partnerWallets;
      settings.updatedBy = user._id;
      settings.lastUpdated = new Date();
      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: 'Partner wallet settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating partner wallet settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// Partner records routes
router.get('/partner-records', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('Received request for partner records');

    // Check if PartnerRecord model exists
    let partnerRecords = [];
    try {
      // Import the model dynamically to avoid circular dependencies
      const PartnerRecord = mongoose.model('PartnerRecord');
      partnerRecords = await PartnerRecord.find().sort({ partnerName: 1 });
      console.log(`Found ${partnerRecords.length} partner records`);
    } catch (modelError) {
      console.error('Error loading PartnerRecord model:', modelError);
      // If the model doesn't exist, just return an empty array
    }

    res.status(200).json({
      success: true,
      message: 'Partner records retrieved successfully',
      partnerRecords
    });
  } catch (error) {
    console.error('Error in partner records endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));
router.post('/partner-records/payout', asyncHandler(async (req: Request, res: Response) => {
  try {
    console.log('Received request to payout partner fees');

    // Check if PartnerRecord model exists
    try {
      // Import the model dynamically to avoid circular dependencies
      mongoose.model('PartnerRecord');
      // If the model exists, call the controller function
      return await payoutPartnerFees(req, res);
    } catch (modelError) {
      console.error('Error loading PartnerRecord model:', modelError);
      // If the model doesn't exist, return a meaningful response
      return res.status(200).json({
        success: true,
        message: 'No partner records to payout',
        results: []
      });
    }
  } catch (error) {
    console.error('Error in partner records payout endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// Auto-prediction management endpoints

// Get auto-prediction settings
router.get('/auto-predictions/settings', asyncHandler(async (req: Request, res: Response) => {
  try {
    let settings = await AdminSettings.findOne({});

    if (!settings) {
      settings = await AdminSettings.create({
        autoApproveClaims: false,
        autoPredictionEnabled: false,
        maxActivePredictions: 20,
        predictionsPerBatch: 3,
        autoPredictionInterval: '0 */6 * * *'
      });
    }

    res.status(200).json({
      success: true,
      settings: {
        autoPredictionEnabled: settings.autoPredictionEnabled,
        maxActivePredictions: settings.maxActivePredictions,
        predictionsPerBatch: settings.predictionsPerBatch,
        autoPredictionInterval: settings.autoPredictionInterval
      }
    });
  } catch (error) {
    console.error('Error getting auto-prediction settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Update auto-prediction settings
router.post('/auto-predictions/settings', asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as { _id: mongoose.Types.ObjectId };
    const {
      autoPredictionEnabled,
      maxActivePredictions,
      predictionsPerBatch,
      autoPredictionInterval
    } = req.body;

    // Validate input
    if (typeof autoPredictionEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'autoPredictionEnabled must be a boolean'
      });
    }

    if (maxActivePredictions && (typeof maxActivePredictions !== 'number' || maxActivePredictions < 1 || maxActivePredictions > 100)) {
      return res.status(400).json({
        success: false,
        message: 'maxActivePredictions must be a number between 1 and 100'
      });
    }

    if (predictionsPerBatch && (typeof predictionsPerBatch !== 'number' || predictionsPerBatch < 1 || predictionsPerBatch > 10)) {
      return res.status(400).json({
        success: false,
        message: 'predictionsPerBatch must be a number between 1 and 10'
      });
    }

    // Find or create admin settings
    let settings = await AdminSettings.findOne({});

    if (!settings) {
      settings = await AdminSettings.create({
        autoApproveClaims: false,
        autoPredictionEnabled,
        maxActivePredictions: maxActivePredictions || 20,
        predictionsPerBatch: predictionsPerBatch || 3,
        autoPredictionInterval: autoPredictionInterval || '0 */6 * * *',
        updatedBy: user._id
      });
    } else {
      settings.autoPredictionEnabled = autoPredictionEnabled;
      if (maxActivePredictions) settings.maxActivePredictions = maxActivePredictions;
      if (predictionsPerBatch) settings.predictionsPerBatch = predictionsPerBatch;
      if (autoPredictionInterval) settings.autoPredictionInterval = autoPredictionInterval;
      settings.updatedBy = user._id;
      settings.lastUpdated = new Date();
      await settings.save();
    }

    // Start or stop the auto-prediction job based on the setting
    if (autoPredictionEnabled) {
      startAutoPredictionJob();
    } else {
      stopAutoPredictionJob();
    }

    res.status(200).json({
      success: true,
      message: `Auto-prediction ${autoPredictionEnabled ? 'enabled' : 'disabled'}`,
      settings: {
        autoPredictionEnabled: settings.autoPredictionEnabled,
        maxActivePredictions: settings.maxActivePredictions,
        predictionsPerBatch: settings.predictionsPerBatch,
        autoPredictionInterval: settings.autoPredictionInterval
      }
    });
  } catch (error) {
    console.error('Error updating auto-prediction settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

// Manually trigger auto-prediction creation
router.post('/auto-predictions/trigger', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { count } = req.body;
    const predictionsToCreate = Math.min(count || 1, 10); // Max 10 at once

    // Get admin user
    const adminUser = await User.findOne({
      $or: [
        { walletAddress: process.env.ADMIN_WALLET_ADDRESS },
        { isAdmin: true }
      ]
    });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    // Import the auto-prediction creation logic
    const { autoPredictionJob } = await import('../jobs/autoPredictionJob');

    // Manually trigger the job
    await autoPredictionJob.fireOnTick();

    res.status(200).json({
      success: true,
      message: `Auto-prediction creation triggered successfully`
    });
  } catch (error) {
    console.error('Error triggering auto-prediction creation:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}));

export default router;
