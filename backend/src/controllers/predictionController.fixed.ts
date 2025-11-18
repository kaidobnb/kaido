import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Prediction, { IPrediction } from '../models/Prediction';
import User from '../models/User';
import Participation from '../models/Participation';
import Transaction from '../models/Transaction';
import { IUser } from '../models/User';
import { getCurrentPrice } from '../services/cryptoService';
import { sendPartnerFee } from '../services/walletService';
import AdminSettings from '../models/AdminSettings';
import Referral from '../models/Referral';
import { updatePartnerRecord } from './partnerController';

// Admin wallet address for collecting fees and handling payouts
const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '6rzmRYho7VViFwy6scyyfGvNRT6Y7PudPWtAyT5H8QEs';

/**
 * Process partner fee distribution
 * This function handles the distribution of fees to partner wallets
 * @param prediction The prediction object
 * @param feeAmount The total fee amount
 * @param tokenType The token type (SOL or SOLY)
 * @param userId The user ID who created the prediction
 */
const processPartnerFeeDistribution = async (
  prediction: any,
  feeAmount: number,
  tokenType: string,
  userId: mongoose.Types.ObjectId
) => {
  try {
    console.log(`[PARTNER FEE] Starting partner fee distribution for prediction ${prediction._id}`);
    console.log(`[PARTNER FEE] Total fee amount: ${feeAmount} ${tokenType}`);

    // Get admin settings
    const adminSettings = await AdminSettings.findOne({});
    if (!adminSettings) {
      console.error('[PARTNER FEE] No admin settings found, cannot distribute partner fees');
      return;
    }

    // Get active partner wallets
    const activePartnerWallets = adminSettings.partnerWallets.filter(partner => partner.active);
    console.log(`[PARTNER FEE] Found ${activePartnerWallets.length} active partner wallets`);

    if (activePartnerWallets.length === 0) {
      console.log('[PARTNER FEE] No active partner wallets found, skipping distribution');
      return;
    }

    // Process each partner wallet
    for (const partner of activePartnerWallets) {
      try {
        const partnerFeePercentage = partner.feePercentage / 100;
        const partnerFeeAmount = feeAmount * partnerFeePercentage;

        console.log(`[PARTNER FEE] Processing partner ${partner.name || partner.walletAddress}`);
        console.log(`[PARTNER FEE] Fee percentage: ${partner.feePercentage}%, Amount: ${partnerFeeAmount} ${tokenType}`);

        if (partnerFeeAmount <= 0) {
          console.log(`[PARTNER FEE] Fee amount is zero or negative, skipping`);
          continue;
        }

        // Create transaction record
        const transaction = await Transaction.create({
          user: userId,
          type: 'partner_fee',
          amount: partnerFeeAmount,
          tokenType,
          prediction: prediction._id,
          description: `Partner fee to ${partner.name || partner.walletAddress}`,
          status: 'pending'
        });

        console.log(`[PARTNER FEE] Created transaction record: ${transaction._id}`);

        // Update partner record
        try {
          await updatePartnerRecord(
            partner.walletAddress, // Use walletAddress as the partner ID
            partner.name || 'Unnamed Partner',
            partner.walletAddress,
            partnerFeeAmount,
            prediction._id,
            prediction.title
          );
          console.log(`[PARTNER FEE] Updated partner record for ${partner.name || partner.walletAddress}`);
        } catch (recordError) {
          console.error(`[PARTNER FEE] Error updating partner record:`, recordError);
        }

        // Only process blockchain transactions for SOL
        if (tokenType === 'SOL') {
          try {
            console.log(`[PARTNER FEE] Sending ${partnerFeeAmount} SOL to partner wallet ${partner.walletAddress}`);

            // Send the fee from admin wallet to partner wallet
            const txSignature = await sendPartnerFee(
              partner.walletAddress,
              partnerFeeAmount,
              prediction._id instanceof mongoose.Types.ObjectId
                ? prediction._id.toString()
                : String(prediction._id)
            );

            // Update transaction record with signature
            await Transaction.findByIdAndUpdate(transaction._id, {
              txHash: txSignature,
              status: 'completed'
            });

            console.log(`[PARTNER FEE] Transaction successful: ${txSignature}`);
          } catch (err) {
            const error = err as Error;
            console.error(`[PARTNER FEE] Error sending fee to partner wallet:`, error);

            // Update transaction record with error
            await Transaction.findByIdAndUpdate(transaction._id, {
              status: 'failed',
              description: `Failed partner fee to ${partner.name || partner.walletAddress}: ${error.message || 'Unknown error'}`
            });
          }
        } else {
          console.log(`[PARTNER FEE] Skipping blockchain transaction for non-SOL token type: ${tokenType}`);

          // Mark transaction as completed for non-SOL tokens
          await Transaction.findByIdAndUpdate(transaction._id, {
            status: 'completed'
          });
        }
      } catch (partnerError) {
        console.error(`[PARTNER FEE] Error processing partner ${partner.name || partner.walletAddress}:`, partnerError);
      }
    }

    console.log(`[PARTNER FEE] Partner fee distribution completed for prediction ${prediction._id}`);
  } catch (error) {
    console.error('[PARTNER FEE] Error in partner fee distribution:', error);
  }
};

// @desc    Create a new prediction
// @route   POST /api/predictions
// @access  Private
export const createPrediction = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    // Extract all fields from the request body
    const {
      title,
      description,
      type,
      tokenType,
      endDate,
      duration,
      choices,
      resolveDetails,
      asset,
      targetPrice,
      priceRanges,
      stakeAmount = 0.001, // Default stake amount
      minSolyRequired = 0,
      maxParticipants = 0,
      rewardPoolAmount = 0,
      transactionHash = '',
      bypassBalanceCheck = false
    } = req.body;

    // Log the received request for debugging
    console.log('Prediction creation request:', {
      endDate,
      duration,
      currentServerTime: new Date().toISOString()
    });

    // Basic validation
    if (!title || !description || !type || !tokenType || !endDate || !asset || !resolveDetails) {
      return res.status(400).json({
        message: 'Please provide all required fields',
        missingFields: {
          title: !title,
          description: !description,
          type: !type,
          tokenType: !tokenType,
          endDate: !endDate,
          asset: !asset,
          resolveDetails: !resolveDetails
        }
      });
    }

    // Validate minimum stake amount for non-agent predictions
    if (type !== 'agent' && stakeAmount < 0.01) {
      return res.status(400).json({
        message: 'Minimum stake amount is 0.01 BNB'
      });
    }

    // Define the type for prediction choices
    interface PredictionChoice {
      id: string;
      label: string;
      price: number;
      percentage: number;
    }

    // Format choices based on prediction type
    let formattedChoices: PredictionChoice[] = [];

    if (type === 'binary') {
      // For binary predictions, create yes/no choices
      formattedChoices = [
        { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
        { id: 'no', label: 'No', price: 0.5, percentage: 50 }
      ];
    } else if (type === 'multiple' && choices && Array.isArray(choices)) {
      // For multiple-choice predictions, use provided choices
      formattedChoices = choices.map((choice: any, index: number) => ({
        id: choice.id || `choice-${index + 1}`,
        label: choice.label,
        price: 1 / choices.length, // Equal probability initially
        percentage: 100 / choices.length
      }));
    } else if (type === 'agent') {
      // For agent predictions, create yes/no choices
      formattedChoices = [
        { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
        { id: 'no', label: 'No', price: 0.5, percentage: 50 }
      ];
    }

    // Admin wallet address for collecting fees
    const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '6rzmRYho7VViFwy6scyyfGvNRT6Y7PudPWtAyT5H8QEs';

    // Get admin settings for fee configuration
    let adminSettings = await AdminSettings.findOne({});
    if (!adminSettings) {
      // Create default settings if none exist
      adminSettings = await AdminSettings.create({
        autoApproveClaims: false,
        creationFeePercentage: 10, // 10% creation fee
        resolutionFeePercentage: 5, // 5% resolution fee
        creatorSharePercentage: 20, // 20% of resolution fee goes to creator (1% of total pool)
        partnerWallets: []
      });
    }

    // Calculate fee based on token type
    let feePercentage = 0;
    if (type !== 'agent') {
      switch (tokenType) {
        case 'BNB':
          feePercentage = 0.05; // 5% for BNB
          break;
        case 'KAIDO':
          feePercentage = 0; // 0% (free) for KAIDO
          break;
        default:
          feePercentage = adminSettings.creationFeePercentage / 100; // Use admin settings for other tokens
      }
    }
    const feeAmount = stakeAmount * feePercentage;
    const actualStakeAmount = stakeAmount - feeAmount;

    // Create prediction with all required fields
    const predictionData: any = {
      title,
      description,
      type,
      tokenType,
      creator: user._id,
      endDate,
      duration: duration, // Include duration in minutes
      choices: formattedChoices,
      resolveDetails,
      asset,
      targetPrice,
      priceRanges,
      stakeAmount: actualStakeAmount,
      volume: type === 'agent' ? 0 : actualStakeAmount, // No volume for agent predictions
      participants: type === 'agent' ? 0 : 1, // Start with 0 participants for agent predictions
      adminWallet: ADMIN_WALLET_ADDRESS,
      fees: {
        creation: feeAmount,
        resolution: 0
      }
    };

    // Add agent-specific fields if applicable
    if (type === 'agent') {
      predictionData.minSolyRequired = minSolyRequired;
      predictionData.maxParticipants = maxParticipants;
      predictionData.rewardPoolAmount = rewardPoolAmount;
    }

    // Create the prediction
    const prediction = await Prediction.create(predictionData);

    // Create a transaction record for the prediction creation
    if (type !== 'agent') {
      await Transaction.create({
        user: user._id,
        type: 'prediction',
        amount: stakeAmount,
        tokenType,
        prediction: prediction._id,
        position: 'creator',
        status: 'completed',
        txHash: transactionHash,
        description: 'Prediction creation'
      });

      // Process creation fees
      if (feeAmount > 0) {
        // Create transaction record for the fee
        await Transaction.create({
          user: user._id,
          type: 'fee',
          amount: feeAmount,
          tokenType,
          prediction: prediction._id,
          description: `${feePercentage * 100}% creation fee`,
          status: 'completed',
          txHash: transactionHash || undefined
        });

        // Process partner fee distribution
        console.log(`Starting partner fee distribution for prediction ${prediction._id}`);

        // Call our dedicated function to handle partner fee distribution
        await processPartnerFeeDistribution(
          prediction,
          feeAmount,
          tokenType,
          user._id
        );

        // Find admin user to credit remaining fees
        const adminUser = await User.findOne({ walletAddress: ADMIN_WALLET_ADDRESS });

        if (adminUser) {
          // Get active partner wallets to calculate their total percentage
          const activePartnerWallets = adminSettings.partnerWallets.filter(partner => partner.active);

          // Calculate remaining fee after partner distributions
          const partnerFeesTotal = activePartnerWallets.reduce((total, partner) => {
            return total + (feeAmount * (partner.feePercentage / 100));
          }, 0);

          const adminFeeAmount = feeAmount - partnerFeesTotal;

          if (adminFeeAmount > 0) {
            // Credit remaining fee to admin wallet
            await User.findByIdAndUpdate(adminUser._id, {
              $inc: {
                [`balances.${tokenType}`]: adminFeeAmount
              }
            });

            console.log(`Credited ${adminFeeAmount} ${tokenType} to admin wallet`);
          }
        } else {
          console.warn(`Admin user with wallet ${ADMIN_WALLET_ADDRESS} not found. Fees not credited.`);
        }
      }
    }

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
  try {
    const { limit = 10, page = 1 } = req.query;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get predictions
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('creator', 'username avatar');

    // Get total count for pagination
    const total = await Prediction.countDocuments();

    res.status(200).json({
      success: true,
      count: predictions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      predictions
    });
  } catch (error) {
    console.error('Error getting predictions:', error);
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
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format'
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
    const { position, amount } = req.body;
    const predictionId = req.params.id;

    // Validate input
    if (!position || !amount) {
      return res.status(400).json({ message: 'Please provide position and amount' });
    }

    // Validate minimum participation amount
    if (amount < 0.01) {
      return res.status(400).json({ message: 'Minimum participation amount is 0.01 BNB' });
    }

    // Find the prediction
    const prediction = await Prediction.findById(predictionId);

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    // Check if prediction is active
    if (prediction.status !== 'active') {
      return res.status(400).json({ message: 'This prediction is not active' });
    }

    // Get admin settings for fee configuration
    let adminSettings = await AdminSettings.findOne({});
    if (!adminSettings) {
      // Create default settings if none exist
      adminSettings = await AdminSettings.create({
        autoApproveClaims: false,
        creationFeePercentage: 10, // 10% creation fee
        resolutionFeePercentage: 5, // 5% resolution fee
        creatorSharePercentage: 20, // 20% of resolution fee goes to creator (1% of total pool)
        referralRewardPercentage: 2, // 2% referral reward percentage
        partnerWallets: []
      });
    }

    // Calculate fees for regular predictions (not agent predictions)
    let feeAmount = 0;
    let netAmount = amount; // Amount that goes to the pool after fee deduction

    if (prediction.type !== 'agent') {
      // Calculate participation fee based on token type
      let feePercentage = 0;
      switch (prediction.tokenType) {
        case 'BNB':
          feePercentage = 0.05; // 5% for BNB
          break;
        case 'KAIDO':
          feePercentage = 0; // 0% (free) for KAIDO
          break;
        case 'SOL':
          feePercentage = 0.05; // 5% for SOL
          break;
        case 'SOLY':
          feePercentage = 0.02; // 2% for SOLY
          break;
        default:
          feePercentage = 0.05; // Default 5%
      }

      feeAmount = amount * feePercentage;
      netAmount = amount - feeAmount;

      console.log(`Participation fee calculation: ${amount} ${prediction.tokenType} - ${feeAmount} fee = ${netAmount} to pool`);

      // Credit fee to admin balance if there's a fee
      if (feeAmount > 0) {
        const adminUser = await User.findOne({ walletAddress: process.env.ADMIN_WALLET_ADDRESS });
        if (adminUser) {
          await User.findByIdAndUpdate(adminUser._id, {
            $inc: {
              [`balances.${prediction.tokenType}`]: feeAmount
            }
          });

          // Create transaction record for the fee
          await Transaction.create({
            user: adminUser._id,
            type: 'fee',
            amount: feeAmount,
            tokenType: prediction.tokenType,
            prediction: prediction._id,
            description: `Participation fee from ${user.username || user.walletAddress}`,
            status: 'completed'
          });

          console.log(`Credited ${feeAmount} ${prediction.tokenType} participation fee to admin wallet`);
        }
      }
    }

    // Create participation record with the original amount (before fee deduction)
    await Participation.create({
      user: user._id,
      prediction: prediction._id,
      position,
      amount,
      tokenType: prediction.tokenType
    });

    // Update prediction stats with net amount (after fee deduction)
    await Prediction.findByIdAndUpdate(prediction._id, {
      $inc: {
        volume: netAmount, // Only add net amount to pool
        participants: 1
      }
    });

    // Process referral reward if applicable (only for regular predictions, not agent predictions)
    if (user.referredBy && prediction.type !== 'agent') {
      try {
        // Get the referrer
        const referrer = await User.findById(user.referredBy);

        if (referrer) {
          console.log(`Processing referral reward for user ${user._id} referred by ${referrer._id}`);

          // Calculate referral reward based on admin settings (2% of user's stake amount)
          const referralRewardPercentage = adminSettings.referralRewardPercentage / 100; // Convert from percentage to decimal
          const referralRewardAmount = amount * referralRewardPercentage;

          console.log(`Calculated referral reward: ${referralRewardAmount} ${prediction.tokenType} (${adminSettings.referralRewardPercentage}% of ${amount} ${prediction.tokenType})`);

          if (referralRewardAmount > 0) {
            // Create a transaction record for the referral reward
            const transaction = await Transaction.create({
              user: referrer._id,
              type: 'referral',
              amount: referralRewardAmount,
              tokenType: prediction.tokenType,
              status: 'pending',
              referredUser: user._id,
              prediction: prediction._id,
              description: `Referral reward for ${user.username || user.walletAddress}'s prediction participation`
            });

            console.log(`Created referral reward transaction: ${transaction._id} for ${referralRewardAmount} ${prediction.tokenType}`);

            // Find or create the referral record
            let referral = await Referral.findOne({
              referrer: referrer._id,
              referred: user._id
            });

            if (!referral) {
              // Create a new referral record if it doesn't exist
              referral = await Referral.create({
                referrer: referrer._id,
                referred: user._id,
                status: 'active',
                hasPredicted: true,
                rewards: { BNB: referralRewardAmount }
              });
              console.log(`Created new referral record: ${referral._id}`);
            } else {
              // Update existing referral record
              await Referral.findByIdAndUpdate(
                referral._id,
                {
                  hasPredicted: true,
                  $inc: { 'rewards.BNB': referralRewardAmount }
                }
              );
              console.log(`Updated existing referral record: ${referral._id}`);
            }

            // Create a notification for the referrer
            try {
              // Check if a similar notification was sent in the last 24 hours
              const oneDayAgo = new Date();
              oneDayAgo.setDate(oneDayAgo.getDate() - 1);

              const existingNotification = await User.findOne({
                _id: referrer._id,
                'notifications': {
                  $elemMatch: {
                    type: 'referral',
                    'timestamp': { $gte: oneDayAgo }
                  }
                }
              });

              if (!existingNotification) {
                await User.updateOne(
                  { _id: referrer._id },
                  {
                    $push: {
                      notifications: {
                        userId: referrer._id,
                        type: 'referral',
                        title: 'New Referral Reward',
                        message: `You earned ${referralRewardAmount.toFixed(4)} ${prediction.tokenType} from ${user.username || user.walletAddress}'s prediction participation`,
                        read: false,
                        timestamp: new Date()
                      }
                    }
                  }
                );
                console.log(`Added notification to referrer ${referrer._id} about new referral reward`);
              }
            } catch (notificationError) {
              console.error('Error creating notification for referral reward:', notificationError);
            }
          }
        } else {
          console.log(`Referrer ${user.referredBy} not found for user ${user._id}`);
        }
      } catch (referralError) {
        console.error('Error processing referral reward:', referralError);
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
      description: 'Prediction winnings claimed'
    });

    res.status(200).json({
      success: true,
      message: 'Winnings claimed successfully',
      amount: reward,
      tokenType: prediction.tokenType
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
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    // Find all claimable participations for this user
    const claimableParticipations = await Participation.find({
      user: user._id,
      claimable: true,
      claimed: { $ne: true }
    }).populate<{ prediction: IPrediction }>('prediction');

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

    // Format response
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
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format'
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
