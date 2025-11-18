import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Prediction, { IPrediction } from '../models/Prediction';
import User from '../models/User';
import Participation, { IParticipation } from '../models/Participation';
import Transaction from '../models/Transaction';
import { IUser } from '../models/User';
import Referral, { IReferral } from '../models/Referral';
import { getCurrentPrice } from '../services/cryptoService';
import { sendTokensFromClaimWallet, hasClaimWalletSufficientBalance } from '../services/walletService';
import AdminSettings from '../models/AdminSettings';

// Admin wallet address for collecting fees and handling payouts
const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '6rzmRYho7VViFwy6scyyfGvNRT6Y7PudPWtAyT5H8QEs';

// Implement the functions directly here

// @desc    Create a new prediction
// @route   POST /api/predictions
// @access  Private
export const createPrediction = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    // Basic validation
    const {
      title,
      description,
      type,
      tokenType,
      endDate,
      asset,
      stakeAmount,
      resolveDetails,
      choices,
      targetPrice,
      priceRanges
    } = req.body;

    if (!title || !description || !type || !tokenType || !endDate || !asset) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create prediction data with required fields
    const actualStakeAmount = stakeAmount || 0.001;

    const predictionData: any = {
      title,
      description,
      type,
      tokenType,
      creator: user._id,
      endDate,
      asset,
      status: 'active',
      // Set default values for required fields if not provided
      stakeAmount: actualStakeAmount,
      // Initialize volume with the creator's stake amount for non-agent predictions
      volume: type === 'agent' ? 0 : actualStakeAmount,
      // Initialize participants count to 1 for non-agent predictions (the creator)
      participants: type === 'agent' ? 0 : 1,
      resolveDetails: resolveDetails || `This prediction will be resolved based on ${asset} price data on ${new Date(endDate).toLocaleDateString()}.`
    };

    // Add optional fields if provided
    if (choices && Array.isArray(choices)) {
      predictionData.choices = choices;
    } else if (type === 'binary') {
      // Default binary choices
      predictionData.choices = [
        { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
        { id: 'no', label: 'No', price: 0.5, percentage: 50 }
      ];
    } else if ((type === 'multiple' || type === 'multi-choice') && priceRanges && Array.isArray(priceRanges)) {
      // For multiple-choice predictions, format choices based on price ranges
      predictionData.type = 'multiple'; // Ensure consistent type in database
      predictionData.priceRanges = priceRanges; // Store the original price ranges
      predictionData.choices = priceRanges.map((range: string, index: number) => ({
        id: `range-${index + 1}`,
        label: range,
        price: 1 / priceRanges.length,
        percentage: 100 / priceRanges.length
      }));
      console.log('Created multi-choice prediction with choices:', predictionData.choices);
    }

    if (targetPrice !== undefined) {
      predictionData.targetPrice = targetPrice;
    }

    console.log('Creating prediction with data:', predictionData);

    // Create the prediction
    const prediction = await Prediction.create(predictionData);

    res.status(201).json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all predictions
// @route   GET /api/predictions
// @access  Public
export const getPredictions = async (req: Request, res: Response) => {
  console.log('[getPredictions] Received request for predictions');
  try {
    const { limit = 10, page = 1 } = req.query;
    console.log(`[getPredictions] Query params: limit=${limit}, page=${page}`);

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    console.log(`[getPredictions] Calculated skip: ${skip}`);

    // Get predictions
    console.log('[getPredictions] Querying database for predictions');

    // Log the MongoDB connection status
    console.log('[getPredictions] MongoDB connection state:', mongoose.connection.readyState);

    // Log the available collections - safely check if db exists first
    let collections = [];
    if (mongoose.connection.db) {
      collections = await mongoose.connection.db.listCollections().toArray();
      console.log('[getPredictions] Available collections:', collections.map(c => c.name));
    } else {
      console.log('[getPredictions] No database connection available');
    }

    // Count all predictions in the database
    const allPredictionsCount = await Prediction.countDocuments();
    console.log('[getPredictions] Total predictions in database before query:', allPredictionsCount);

    // Get predictions without pagination first to check if there are any
    const allPredictions = await Prediction.find().sort({ createdAt: -1 });
    console.log('[getPredictions] All predictions (without pagination):', allPredictions.length);

    // Now get the paginated predictions
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('creator', 'username avatar');

    console.log(`[getPredictions] Found ${predictions.length} predictions`);

    // Get total count for pagination
    const total = await Prediction.countDocuments();
    console.log(`[getPredictions] Total predictions in database: ${total}`);

    console.log('[getPredictions] Sending response');
    res.status(200).json({
      success: true,
      count: predictions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      predictions
    });
  } catch (error) {
    console.error('[getPredictions] Error getting predictions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get prediction by ID
// @route   GET /api/predictions/:id
// @access  Public
export const getPredictionById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // For demo/mock predictions with simple numeric IDs, return mock data
      console.log(`[getPredictionById] Non-MongoDB ID format detected: ${id}, returning mock data`);

      const mockPrediction = {
        _id: id,
        id: id,
        title: `BTC to Reach $100,000 by December 31, 2024?`,
        description: `A prediction market for BTC price reaching $100,000 by December 31, 2024.`,
        type: 'binary',
        tokenType: 'BNB',
        creator: {
          username: 'SolyAdmin',
          avatar: '/images/default-avatar.png'
        },
        createdAt: new Date().toISOString(),
        endDate: '2024-12-31T00:00:00.000Z',
        volume: 0.5,
        participants: 3,
        choices: [
          { id: 'yes', label: 'Yes', price: 0.6, percentage: 60 },
          { id: 'no', label: 'No', price: 0.4, percentage: 40 }
        ],
        status: 'active',
        asset: 'BTC',
        targetPrice: 100000,
        stakeAmount: 0.1
      };

      return res.status(200).json({
        success: true,
        prediction: mockPrediction
      });
    }

    // Find the prediction
    const prediction = await Prediction.findById(id)
      .populate('creator', 'username avatar');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    res.status(200).json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error getting prediction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Participate in a prediction
// @route   POST /api/predictions/:id/participate
// @access  Private
export const participateInPrediction = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    const { position, tokenType, transactionHash, bypassBalanceCheck } = req.body;
    let amount = req.body.amount || 0;
    const predictionId = req.params.id;

    console.log('[participateInPrediction] Request body:', req.body);

    // For agent predictions, we don't require an amount
    if (!position) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a position'
      });
    }

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(predictionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format'
      });
    }

    // Find the prediction
    const prediction = await Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Check if prediction is active
    if (prediction.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This prediction is not active'
      });
    }

    // Determine if we should bypass balance check
    let shouldBypassBalanceCheck = false;

    // For regular predictions, check if we should bypass the balance check
    if ((prediction.type as 'binary' | 'multiple' | 'agent') !== 'agent') {
      shouldBypassBalanceCheck = Boolean(bypassBalanceCheck && transactionHash);

      // Log transaction information for debugging
      console.log('[participateInPrediction] Transaction info:', {
        transactionHash,
        bypassBalanceCheck,
        shouldBypassBalanceCheck,
        userBalance: (user.balances as any)[prediction.tokenType],
        requiredAmount: amount
      });

      // For BNB and KAIDO predictions, require transaction hash
      if ((prediction.tokenType === 'BNB' || prediction.tokenType === 'KAIDO') && !transactionHash) {
        return res.status(400).json({
          success: false,
          message: `Transaction hash is required for ${prediction.tokenType} predictions`
        });
      }

      // Check if user has enough balance (skip if bypassing)
      if (!shouldBypassBalanceCheck && (user.balances as any)[prediction.tokenType] < amount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${prediction.tokenType} balance`
        });
      }
    }

    // Check if user has participated before
    const existingParticipations = await Participation.find({
      user: user._id,
      prediction: prediction._id
    });

    // For agent predictions, check if user has already participated at all
    if ((prediction.type as 'binary' | 'multiple' | 'agent') === 'agent') {
      if (existingParticipations.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You have already participated in this agent prediction'
        });
      }
    }

    // Track if this is the user's first participation in this prediction
    const isFirstParticipation = existingParticipations.length === 0;

    // Create participation record
    try {
      await Participation.create({
        user: user._id,
        prediction: prediction._id,
        position,
        amount,
        tokenType: prediction.tokenType
      });
    } catch (error: any) {
      // Handle duplicate key error (user trying to participate multiple times)
      if (error.code === 11000) {
        console.log('Duplicate participation detected, updating existing participation...');

        // Update existing participation with additional amount
        await Participation.findOneAndUpdate(
          { user: user._id, prediction: prediction._id, position },
          { $inc: { amount } }
        );

        console.log('Successfully updated existing participation with additional amount');
      } else {
        // If it's not a duplicate key error, rethrow it
        throw error;
      }
    }

    // Create transaction record (with amount 0 for agent predictions)
    await Transaction.create({
      user: user._id,
      type: 'prediction',
      amount,
      tokenType: prediction.tokenType,
      prediction: prediction._id,
      position,
      status: 'completed',
      txHash: transactionHash || undefined, // Store the transaction hash if provided
      description: (prediction.type as 'binary' | 'multiple' | 'agent') === 'agent' ? 'Agent prediction participation' : undefined
    });

    // Update prediction stats (only count first participation for participant count)
    const updateData: any = {
      $inc: {
        volume: amount
      }
    };

    if (isFirstParticipation) {
      updateData.$inc.participants = 1;
    }

    await Prediction.findByIdAndUpdate(prediction._id, updateData);

    // Process referral reward if applicable
    if (user.referredBy) {
      try {
        console.log(`Processing referral reward for user ${user._id} who was referred by ${user.referredBy}`);

        // Ensure the referredBy is a valid ObjectId
        const referrerId = typeof user.referredBy === 'string' ?
          new mongoose.Types.ObjectId(user.referredBy) : user.referredBy;

        // Find the referrer
        const referrer = await User.findById(referrerId);

        if (!referrer) {
          console.warn(`Referrer ${user.referredBy} not found for user ${user._id}`);
          return res.status(200).json({
            success: true,
            message: 'Successfully participated in prediction'
          });
        }

        console.log(`Found referrer: ${referrer._id}, username: ${referrer.username || 'unknown'}`);

        // Find or create the referral record
        let referral = await Referral.findOne({
          referrer: referrerId,
          referred: user._id
        });

        if (!referral) {
          // Create a new referral record if it doesn't exist
          console.log(`No referral record found, creating new one for referrer ${referrerId} and user ${user._id}`);
          referral = await Referral.create({
            referrer: referrerId,
            referred: user._id,
            status: 'active',
            hasPredicted: true,
            rewards: { SOL: 0 }
          });
          console.log(`Created new referral record: ${referral._id}`);
        } else if (!referral.hasPredicted) {
          // Update the existing referral record
          console.log(`Updating existing referral record ${referral._id} to set hasPredicted=true`);
          await Referral.findByIdAndUpdate(referral._id, {
            hasPredicted: true
          });
        }

        // Only process rewards for SOL predictions
        if (prediction.tokenType !== 'SOL') {
          console.log(`Skipping referral reward for non-SOL prediction (tokenType: ${prediction.tokenType})`);
          return res.status(200).json({
            success: true,
            message: 'Successfully participated in prediction'
          });
        }

        // Get admin settings for referral reward configuration
        const adminSettings = await AdminSettings.findOne({});
        const referralRewardPercentage = (adminSettings?.referralRewardPercentage || 2) / 100; // Default 2%

        // Calculate referral reward (2% for regular predictions)
        const referralReward = parseFloat((amount * referralRewardPercentage).toFixed(4)); // 2% of the prediction amount, with 4 decimal places
        console.log(`Calculated referral reward: ${referralReward} SOL (${(referralRewardPercentage * 100)}% of ${amount} SOL)`);

        // Generate a unique description that includes the prediction ID and timestamp
        const timestamp = new Date().toISOString();
        const uniqueDescription = `Referral reward for ${user.username || user.walletAddress}'s prediction on ${prediction.title} (ID: ${prediction._id}, Time: ${timestamp})`;

        console.log(`Creating new referral reward with description: ${uniqueDescription}`);

        // Create the transaction record for the referral reward
        const transaction = await Transaction.create({
          user: referrerId,
          type: 'referral',
          amount: referralReward,
          tokenType: 'SOL',
          prediction: prediction._id,
          referredUser: user._id,
          status: 'pending', // Set to pending so it can be claimed
          description: uniqueDescription
        });

        console.log(`Successfully created referral transaction: ${transaction._id} with status 'pending' for claiming`);

        // Update the referral record with the reward
        const updatedReferral = await Referral.findByIdAndUpdate(
          referral._id,
          { $inc: { 'rewards.SOL': referralReward } },
          { new: true }
        );

        console.log(`Updated referral record rewards: ${JSON.stringify(updatedReferral?.rewards)}`);

        // Create a notification for the referrer
        await User.updateOne(
          { _id: referrerId },
          {
            $push: {
              notifications: {
                userId: referrerId,
                type: 'referral',
                title: 'New Referral Reward',
                message: `You earned ${referralReward.toFixed(4)} ${prediction.tokenType} from ${user.username || user.walletAddress}'s prediction on ${prediction.title}. Visit your profile to claim this reward. You earn 2% on EVERY prediction your referred users make!`,
                read: false,
                timestamp: new Date()
              }
            }
          }
        );

        console.log(`Added notification to referrer ${referrerId} about referral reward`);

      } catch (error) {
        // Log the error but don't fail the whole transaction
        const referralError = error as Error;
        console.error('Error processing referral reward:', referralError);
        console.error(referralError.stack);
      }
    } else {
      console.log(`User ${user._id} (${user.username || user.walletAddress}) does not have a referrer`);
    }

    res.status(200).json({
      success: true,
      message: 'Successfully participated in prediction'
    });
  } catch (error) {
    console.error('Error participating in prediction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Resolve a prediction
// @route   POST /api/predictions/:id/resolve
// @access  Private (Admin only)
export const resolvePrediction = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    const { resolvedChoice } = req.body;
    const id = req.params.id;

    // Check if user is admin
    const isAdmin = user.walletAddress === ADMIN_WALLET_ADDRESS;
    const isSystemApi = String(user._id) === 'system';

    if (!isAdmin && !isSystemApi) {
      return res.status(403).json({
        success: false,
        message: 'Only admin or system API can resolve predictions'
      });
    }

    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format'
      });
    }

    const prediction = await Prediction.findById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Check if prediction is already resolved
    if (prediction.status !== 'active') {
      return res.status(400).json({ message: 'This prediction is already resolved or cancelled' });
    }

    // Update prediction status
    await Prediction.findByIdAndUpdate(prediction._id, {
      status: 'resolved',
      resolvedChoice,
      resolvedAt: new Date()
    });

    // Distribute rewards using the shared service
    try {
      console.log(`[resolvePrediction] Starting reward distribution for prediction ${id}`);
      const { distributeRewards } = await import('../services/rewardDistributionService');
      await distributeRewards(id, resolvedChoice);
      console.log(`[resolvePrediction] Rewards distributed successfully for prediction ${id}`);
    } catch (rewardError) {
      console.error(`[resolvePrediction] ❌ ERROR distributing rewards for prediction ${id}:`);
      console.error(rewardError);
      // Don't fail the entire request if reward distribution fails
      // The prediction is already marked as resolved
    }

    res.status(200).json({
      success: true,
      message: 'Prediction resolved successfully',
      resolvedChoice
    });
  } catch (error) {
    console.error('Error resolving prediction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user predictions
// @route   GET /api/predictions/user
// @access  Private
export const getUserPredictions = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const { status, limit = 10, page = 1 } = req.query;

    // Find all participations for this user
    const query: any = { user: user._id };
    if (status) query.status = status;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get participations with populated predictions
    const participations = await Participation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: 'prediction',
        populate: {
          path: 'creator',
          select: 'username avatar'
        }
      });

    // Get total count for pagination
    const total = await Participation.countDocuments(query);

    // Format response
    const userPredictions = participations.map(p => ({
      participation: {
        id: p._id,
        position: p.position,
        amount: p.amount,
        status: p.status,
        reward: p.reward || 0,
        claimable: p.claimable || false,
        createdAt: p.createdAt
      },
      prediction: p.prediction
    }));

    res.status(200).json({
      success: true,
      count: userPredictions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      predictions: userPredictions
    });
  } catch (error) {
    console.error('Error getting user predictions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get claimable creator fees
// @route   GET /api/predictions/claimable-creator-fees
// @access  Private
export const getClaimableCreatorFees = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    console.log(`[getClaimableCreatorFees] Getting claimable creator fees for user ${user.username}`);

    // Find all pending creator fee transactions for this user
    const pendingFees = await Transaction.find({
      user: user._id,
      type: 'fee',
      status: 'pending',
      description: { $regex: /Creator reward.*claimable/ }
    }).populate('prediction', 'title tokenType');

    // Group by token type
    const feesByToken: { [key: string]: { total: number; transactions: any[] } } = {
      BNB: { total: 0, transactions: [] },
      KAIDO: { total: 0, transactions: [] },
      SOL: { total: 0, transactions: [] },
      SOLY: { total: 0, transactions: [] }
    };

    for (const fee of pendingFees) {
      const tokenType = fee.tokenType;
      if (feesByToken[tokenType]) {
        feesByToken[tokenType].total += fee.amount;
        feesByToken[tokenType].transactions.push({
          id: fee._id,
          amount: fee.amount,
          prediction: fee.prediction,
          createdAt: fee.createdAt
        });
      }
    }

    res.status(200).json({
      success: true,
      fees: feesByToken,
      totalCount: pendingFees.length
    });
  } catch (error) {
    console.error('Error getting claimable creator fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Claim creator fees
// @route   POST /api/predictions/claim-creator-fees
// @access  Private
export const claimCreatorFees = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    const { tokenType } = req.body;

    if (!tokenType || !['BNB', 'KAIDO', 'SOL', 'SOLY'].includes(tokenType)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid token type (BNB, KAIDO, SOL, or SOLY)'
      });
    }

    console.log(`[claimCreatorFees] User ${user.username} claiming ${tokenType} creator fees`);

    // Find all pending creator fee transactions for this user and token type
    const pendingFees = await Transaction.find({
      user: user._id,
      type: 'fee',
      status: 'pending',
      tokenType,
      description: { $regex: /Creator reward.*claimable/ }
    });

    if (pendingFees.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No pending ${tokenType} creator fees found`
      });
    }

    // Calculate total fee amount
    const totalFees = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);

    console.log(`[claimCreatorFees] Found ${pendingFees.length} pending fees totaling ${totalFees} ${tokenType}`);

    // Send blockchain transaction
    let txHash: string;
    try {
      console.log(`[claimCreatorFees] Sending ${totalFees} ${tokenType} to ${user.walletAddress}`);

      if (tokenType === 'BNB' || tokenType === 'KAIDO') {
        const { sendTokensFromClaimWallet } = await import('../services/bnbWalletService');
        txHash = await sendTokensFromClaimWallet(
          user.walletAddress,
          totalFees,
          tokenType as 'BNB' | 'KAIDO'
        );
      } else if (tokenType === 'SOL' || tokenType === 'SOLY') {
        const { sendTokensFromClaimWallet } = await import('../services/walletService');
        txHash = await sendTokensFromClaimWallet(
          user.walletAddress,
          totalFees,
          tokenType as 'SOL' | 'SOLY'
        );
      } else {
        throw new Error(`Unsupported token type: ${tokenType}`);
      }

      console.log(`[claimCreatorFees] Blockchain transaction successful. Hash: ${txHash}`);
    } catch (blockchainError) {
      console.error('[claimCreatorFees] Error sending blockchain transaction:', blockchainError);
      return res.status(500).json({
        success: false,
        message: `Failed to send blockchain transaction: ${(blockchainError as Error).message}`
      });
    }

    // Mark all fee transactions as completed
    await Transaction.updateMany(
      {
        _id: { $in: pendingFees.map(f => f._id) }
      },
      {
        status: 'completed',
        transactionHash: txHash,
        description: 'Creator reward (1% of pool) - claimed'
      }
    );

    // Update user balance
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        [`balances.${tokenType}`]: totalFees
      }
    });

    res.status(200).json({
      success: true,
      message: 'Creator fees claimed successfully',
      amount: totalFees,
      tokenType,
      transactionHash: txHash,
      feesCount: pendingFees.length
    });
  } catch (error) {
    console.error('Error claiming creator fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Claim prediction winnings
// @route   POST /api/predictions/claim/:id
// @access  Private
export const claimWinnings = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    const participationId = req.params.id;

    // Find the participation
    const participation = await Participation.findById(participationId)
      .populate<{ prediction: IPrediction }>('prediction');

    if (!participation) {
      return res.status(404).json({ message: 'Participation not found' });
    }

    // Check if this participation belongs to the user
    if (participation.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to claim these winnings' });
    }

    // Check if the participation is claimable
    if (!participation.claimable) {
      return res.status(400).json({ message: 'These winnings are not claimable' });
    }

    // Check if the participation has already been claimed
    if (participation.claimed) {
      return res.status(400).json({ message: 'These winnings have already been claimed' });
    }

    // Get the prediction from the populated field
    const prediction = participation.prediction as IPrediction;

    const reward = participation.reward || 0;

    // Send blockchain transaction based on token type
    let txHash: string;
    try {
      console.log(`[claimWinnings] Sending ${reward} ${prediction.tokenType} to ${user.walletAddress}`);

      if (prediction.tokenType === 'BNB' || prediction.tokenType === 'KAIDO') {
        const { sendTokensFromClaimWallet } = await import('../services/bnbWalletService');
        txHash = await sendTokensFromClaimWallet(
          user.walletAddress,
          reward,
          prediction.tokenType as 'BNB' | 'KAIDO'
        );
      } else if (prediction.tokenType === 'SOL' || prediction.tokenType === 'SOLY') {
        const { sendTokensFromClaimWallet } = await import('../services/walletService');
        txHash = await sendTokensFromClaimWallet(
          user.walletAddress,
          reward,
          prediction.tokenType as 'SOL' | 'SOLY'
        );
      } else {
        throw new Error(`Unsupported token type: ${prediction.tokenType}`);
      }

      console.log(`[claimWinnings] Blockchain transaction successful. Hash: ${txHash}`);
    } catch (blockchainError) {
      console.error('[claimWinnings] Error sending blockchain transaction:', blockchainError);
      return res.status(500).json({
        success: false,
        message: `Failed to send blockchain transaction: ${(blockchainError as Error).message}`
      });
    }

    // Mark participation as claimed
    await Participation.findByIdAndUpdate(participationId, {
      claimed: true,
      claimable: false,
      claimedAt: new Date()
    });

    // Update user balance
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        [`balances.${prediction.tokenType}`]: reward,
        claimedWinnings: reward
      }
    });

    // Create transaction record for the claim
    await Transaction.create({
      user: user._id,
      type: 'win', // Changed from 'claim' to 'win' which is a valid enum value
      amount: reward,
      tokenType: prediction.tokenType,
      prediction: prediction._id,
      status: 'completed',
      description: 'Prediction winnings claimed',
      transactionHash: txHash
    });

    res.status(200).json({
      success: true,
      message: 'Winnings claimed successfully',
      amount: reward,
      tokenType: prediction.tokenType,
      transactionHash: txHash
    });
  } catch (error) {
    console.error('Error claiming winnings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get claimable winnings for user
// @route   GET /api/predictions/claimable
// @access  Private
export const getClaimableWinnings = async (req: Request, res: Response) => {
  console.log('[getClaimableWinnings] Received request for claimable winnings');
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    console.log(`[getClaimableWinnings] User ID: ${user._id}`);

    // Find all claimable participations for this user
    console.log('[getClaimableWinnings] Querying database for claimable participations');
    const claimableParticipations = await Participation.find({
      user: user._id,
      claimable: true,
      claimed: { $ne: true }
    }).populate<{ prediction: IPrediction }>('prediction');

    console.log(`[getClaimableWinnings] Found ${claimableParticipations.length} claimable participations`);

    // Calculate total claimable amount by token type
    const claimableTotals: { [key: string]: number } = {};

    claimableParticipations.forEach(p => {
      const prediction = p.prediction as IPrediction;
      const tokenType = prediction.tokenType;
      const reward = p.reward || 0;

      if (!claimableTotals[tokenType]) {
        claimableTotals[tokenType] = 0;
      }

      claimableTotals[tokenType] += reward;
    });

    console.log(`[getClaimableWinnings] Calculated totals: ${JSON.stringify(claimableTotals)}`);

    // Format response
    console.log('[getClaimableWinnings] Formatting response');
    const claimableWinnings = claimableParticipations.map(p => {
      const prediction = p.prediction as IPrediction;

      return {
        id: p._id,
        prediction: {
          id: prediction._id,
          title: prediction.title,
          asset: prediction.asset,
          resolvedChoice: prediction.resolvedChoice
        },
        position: p.position,
        amount: p.amount,
        reward: p.reward || 0,
        tokenType: prediction.tokenType
      };
    });

    res.status(200).json({
      success: true,
      count: claimableWinnings.length,
      totals: claimableTotals,
      winnings: claimableWinnings
    });
  } catch (error) {
    console.error('Error getting claimable winnings:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get votes (participations) for a prediction
// @route   GET /api/predictions/:id/votes
// @access  Public
export const getPredictionVotes = async (req: Request, res: Response) => {
  try {
    const predictionId = req.params.id;

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(predictionId)) {
      // For demo/mock predictions with simple numeric IDs, return empty votes
      console.log(`[getPredictionVotes] Non-MongoDB ID format detected: ${predictionId}, returning empty votes`);

      return res.status(200).json({
        success: true,
        count: 0,
        votes: []
      });
    }

    // Find the prediction first to make sure it exists
    const prediction = await Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Find all participations for this prediction, sorted by most recent first
    const participations = await Participation.find({ prediction: predictionId })
      .sort({ createdAt: -1 })
      .limit(20) // Limit to 20 most recent votes
      .populate('user', 'username avatar');

    // Format the votes for the frontend
    const votes = participations.map(p => {
      // Convert the document to a plain object with proper typing
      const pObj = p.toObject() as {
        _id: mongoose.Types.ObjectId;
        user: any; // We'll handle this with type checking
        position: string;
        amount: number;
        tokenType: string;
        createdAt: Date;
      };

      // Create a safe user object with default values
      const userObj = {
        id: pObj.user && typeof pObj.user === 'object' && '_id' in pObj.user ?
          pObj.user._id.toString() : 'unknown',
        username: pObj.user && typeof pObj.user === 'object' && 'username' in pObj.user ?
          pObj.user.username : 'Anonymous',
        avatar: pObj.user && typeof pObj.user === 'object' && 'avatar' in pObj.user ?
          pObj.user.avatar : '/images/default-avatar.png'
      };

      // Format the createdAt date
      const createdAtISO = pObj.createdAt ? new Date(pObj.createdAt).toISOString() : new Date().toISOString();

      return {
        id: pObj._id.toString(),
        _id: pObj._id.toString(), // Include both id and _id for compatibility
        user: userObj,
        position: pObj.position, // 'yes' or 'no' for binary predictions
        amount: pObj.amount,
        tokenType: pObj.tokenType,
        timestamp: pObj.createdAt,
        createdAt: createdAtISO, // Add explicit createdAt field in ISO format
        probability: prediction.choices.find(c => c.id === pObj.position)?.percentage || 50
      };
    });

    res.status(200).json({
      success: true,
      count: votes.length,
      votes
    });
  } catch (error) {
    console.error('Error getting prediction votes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get top winners for a prediction
// @route   GET /api/predictions/:id/winners
// @access  Public
export const getPredictionWinners = async (req: Request, res: Response) => {
  try {
    const predictionId = req.params.id;
    const limit = Number(req.query.limit) || 3; // Default to top 3 winners

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(predictionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format'
      });
    }

    // Find the prediction
    const prediction = await Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Check if prediction is resolved
    if (prediction.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Prediction is not resolved yet'
      });
    }

    // Find winning participations for this prediction
    const winningParticipations = await Participation.find({
      prediction: predictionId,
      position: prediction.resolvedChoice,
      status: 'won'
    })
      .sort({ reward: -1 }) // Sort by highest reward first
      .limit(limit)
      .populate('user', 'username avatar');

    // Format the winners for the response
    const winners = winningParticipations.map(p => {
      // Convert the document to a plain object with proper typing
      const pObj = p.toObject() as {
        _id: mongoose.Types.ObjectId;
        user: any; // We'll handle this with type checking
        position: string;
        amount: number;
        reward?: number;
        tokenType: string;
      };

      // Extract user data with proper type checking
      const userObj = pObj.user && typeof pObj.user === 'object' ? {
        username: 'username' in pObj.user && pObj.user.username ? pObj.user.username : 'Anonymous',
        avatar: 'avatar' in pObj.user && pObj.user.avatar ? pObj.user.avatar : '/images/default-avatar.png'
      } : {
        username: 'Anonymous',
        avatar: '/images/default-avatar.png'
      };

      return {
        id: pObj._id.toString(),
        user: userObj,
        position: pObj.position,
        amount: pObj.amount,
        reward: pObj.reward || 0,
        tokenType: pObj.tokenType
      };
    });

    // Get the asset price at prediction resolution time
    let assetPriceAtResolution = null;
    try {
      if (prediction.resolvedAt) {
        const priceData = await getCurrentPrice(prediction.asset);
        assetPriceAtResolution = priceData;
      }
    } catch (priceError) {
      console.error('Error fetching asset price:', priceError);
      // Continue without price data
    }

    res.status(200).json({
      success: true,
      count: winners.length,
      winners,
      prediction: {
        id: prediction._id,
        title: prediction.title,
        asset: prediction.asset,
        resolvedChoice: prediction.resolvedChoice,
        resolvedAt: prediction.resolvedAt,
        assetPriceAtResolution
      }
    });
  } catch (error) {
    console.error('Error getting prediction winners:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
