import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Referral from '../models/Referral';
import Transaction, { ITransaction } from '../models/Transaction';
import Participation from '../models/Participation';
import { IUser } from '../models/User';
import crypto from 'crypto';
import { hasClaimWalletSufficientBalance, sendTokensFromClaimWallet } from '../services/bnbWalletService';

// @desc    Generate referral code
// @route   POST /api/referrals/generate
// @access  Private
export const generateReferralCode = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    // Double-check if user already has a referral code by fetching the latest data
    const currentUser = await User.findById(user._id);

    if (currentUser?.referralCode) {
      console.log(`User ${user._id} already has referral code: ${currentUser.referralCode}, returning existing code`);
      return res.status(200).json({
        success: true,
        referralCode: currentUser.referralCode,
        message: 'Referral code already exists'
      });
    }

    // Generate unique referral code - prioritize username for more user-friendly codes
    // First check if user has a username
    if (user.username && user.username.length >= 3) {
      console.log(`User ${user._id} has username: ${user.username}, using it for referral code`);
      // Try to use username directly first
      const usernameCode = user.username.toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Check if this username-based code is already in use
      const existingUsernameUser = await User.findOne({ referralCode: usernameCode }) as (IUser & { _id: mongoose.Types.ObjectId }) | null;
      if (!existingUsernameUser) {
        console.log(`Username-based code ${usernameCode} is available, using it`);

        // Save the username-based code to the user
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          { referralCode: usernameCode },
          { new: true }
        );

        console.log(`Updated user ${user._id} with username-based referral code: ${usernameCode}`);
        console.log(`Verification - user now has code: ${updatedUser?.referralCode}`);

        return res.status(201).json({
          success: true,
          referralCode: usernameCode,
          message: 'Username-based referral code generated successfully'
        });
      } else {
        console.log(`Username-based code ${usernameCode} is already taken, will use hash-based code`);
      }
    }

    // If username is not available or already taken, use the deterministic hash function
    const seed = user.username || user.walletAddress;
    console.log(`Generating hash-based referral code for user ${user._id} with seed: ${seed}`);
    const referralCode = generateUniqueCode(seed);
    console.log(`Generated referral code: ${referralCode} for user ${user._id}`);

    // Check if this code is already in use by another user
    const existingCodeUser = await User.findOne({ referralCode }) as (IUser & { _id: mongoose.Types.ObjectId }) | null;
    if (existingCodeUser && existingCodeUser._id.toString() !== user._id.toString()) {
      console.log(`Referral code ${referralCode} is already in use by user ${existingCodeUser._id}`);
      // In this case, we'll append a unique identifier to make it unique
      const uniqueReferralCode = `${referralCode}${user._id.toString().substring(0, 4)}`;
      console.log(`Generated unique referral code: ${uniqueReferralCode} for user ${user._id}`);

      // Update user with the unique referral code
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { referralCode: uniqueReferralCode },
        { new: true }
      );

      return res.status(201).json({
        success: true,
        referralCode: uniqueReferralCode,
        message: 'Unique referral code generated successfully'
      });
    }

    // Update user with referral code
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { referralCode },
      { new: true }
    );

    console.log(`Updated user ${user._id} with referral code: ${referralCode}`);
    console.log(`Verification - user now has code: ${updatedUser?.referralCode}`);

    res.status(201).json({
      success: true,
      referralCode,
      message: 'Referral code generated successfully'
    });
  } catch (error) {
    console.error('Error generating referral code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating referral code'
    });
  }
};

// @desc    Apply referral code
// @route   POST /api/referrals/apply
// @access  Private
export const applyReferralCode = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    // Accept either 'code' or 'referralCode' parameter for flexibility
    const referralCode = req.body.referralCode || req.body.code;

    console.log('Applying referral code:', referralCode, 'for user:', user._id, user.username || user.walletAddress);

    if (!referralCode) {
      console.log('No referral code provided');
      return res.status(400).json({
        success: false,
        message: 'Please provide a referral code'
      });
    }

    // Check if user already has a referrer
    if (user.referredBy) {
      console.log('User already has a referrer:', user.referredBy);
      return res.status(400).json({
        success: false,
        message: 'You have already used a referral code'
      });
    }

    // Find referrer by code
    const referrer = await User.findOne({ referralCode });

    console.log('Searching for referrer with code:', referralCode);
    console.log('Referrer found:', referrer ? 'Yes' : 'No');

    if (referrer) {
      console.log('Referrer details:', {
        id: referrer._id,
        username: referrer.username || 'No username',
        walletAddress: referrer.walletAddress ? `${referrer.walletAddress.substring(0, 6)}...` : 'No wallet'
      });
    }

    if (!referrer) {
      console.log('Invalid referral code, no user found with code:', referralCode);
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    // Check if user is trying to refer themselves
    if ((referrer._id as any).toString() === user._id.toString()) {
      console.log('User trying to refer themselves:', user._id);
      return res.status(400).json({
        success: false,
        message: 'You cannot refer yourself'
      });
    }

    console.log('Found referrer:', referrer._id, referrer.username || referrer.walletAddress);

    // Prevent self-referral
    if ((referrer._id as any).toString() === user._id.toString()) {
      console.log('Self-referral attempt detected');
      return res.status(400).json({
        success: false,
        message: 'You cannot refer yourself'
      });
    }

    // Check if a referral record already exists
    const existingReferral = await Referral.findOne({
      referrer: referrer._id,
      referred: user._id
    });

    if (existingReferral) {
      console.log('Referral record already exists:', existingReferral._id);

      // If the record exists but the user doesn't have referredBy set, fix it
      if (!user.referredBy) {
        console.log('Fixing missing referredBy field for user');
        await User.findByIdAndUpdate(user._id, { referredBy: referrer._id });

        return res.status(200).json({
          success: true,
          message: `Referral relationship fixed. You are now referred by ${referrer.username || 'the referrer'}.`,
          fixed: true
        });
      }

      return res.status(200).json({
        success: true,
        message: `You are already referred by ${referrer.username || 'this user'}.`,
        alreadyApplied: true
      });
    }

    // Instead of using transactions, we'll perform operations sequentially
    try {
      // First, update the user with the referrer
      console.log('Updating user with referrer:', {
        userId: user._id ? user._id.toString() : 'unknown',
        referrerId: referrer._id ? referrer._id.toString() : 'unknown'
      });

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { referredBy: referrer._id },
        { new: true }
      );

      if (!updatedUser) {
        console.error(`Failed to update user ${user._id} with referrer ${referrer._id}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to update user with referrer'
        });
      }

      console.log('Updated user with referrer:', updatedUser?._id, 'referredBy:', updatedUser?.referredBy);

      // Then create the referral record
      console.log('Creating referral record with:', {
        referrer: referrer._id ? referrer._id.toString() : 'unknown',
        referred: user._id ? user._id.toString() : 'unknown',
        status: 'active'
      });

      const referral = await Referral.create({
        referrer: referrer._id,
        referred: user._id,
        status: 'active',
        hasPredicted: false, // Initially set to false until they make a prediction
        rewards: { SOL: 0, BNB: 0, KAIDO: 0 } // Initialize rewards for all supported tokens
      });

      if (!referral) {
        console.error(`Failed to create referral record for referrer ${referrer._id} and referred ${user._id}`);

        // Try to rollback the user update
        await User.findByIdAndUpdate(
          user._id,
          { $unset: { referredBy: 1 } }
        );

        return res.status(500).json({
          success: false,
          message: 'Failed to create referral record'
        });
      }

      console.log('Created referral record:', referral._id);

      // Verify the referral was created correctly
      const verifyReferral = await Referral.findById(referral._id);
      console.log('Verified referral record:', {
        id: verifyReferral?._id,
        referrer: verifyReferral?.referrer.toString(),
        referred: verifyReferral?.referred.toString(),
        status: verifyReferral?.status
      });

      // Create notification for referrer about new referral
      try {
        // Check if a similar notification already exists in the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const existingNotification = await User.findOne({
          _id: referrer._id,
          'notifications.type': 'system',
          'notifications.title': 'New Referral',
          'notifications.timestamp': { $gte: oneDayAgo }
        });

        if (existingNotification) {
          console.log(`Skipping notification for referrer ${referrer._id} as a similar one was sent in the last 24 hours`);
        } else {
          await User.updateOne(
            { _id: referrer._id },
            {
              $push: {
                notifications: {
                  userId: referrer._id,
                  type: 'system',
                  title: 'New Referral',
                  message: `${user.username || 'A new user'} has joined using your referral code!`,
                  read: false,
                  timestamp: new Date()
                }
              }
            }
          );
          console.log(`Added notification to referrer ${referrer._id} about new referral`);
        }
      } catch (notificationError) {
        console.error('Error creating notification for referrer:', notificationError);
        // Continue even if notification fails
      }

      console.log('Referral process completed successfully');

      // Run the fixReferralCounts function to ensure everything is consistent
      try {
        // Ensure referrer._id is treated as a mongoose.Types.ObjectId
        const referrerId = typeof referrer._id === 'string'
          ? new mongoose.Types.ObjectId(referrer._id)
          : referrer._id as mongoose.Types.ObjectId;

        await fixReferralCounts(referrerId);
      } catch (fixError) {
        console.error('Error running fixReferralCounts:', fixError);
        // Continue even if fix fails
      }
    } catch (error) {
      console.error('Error in referral process:', error);

      // Try to rollback any changes if possible
      try {
        await User.findByIdAndUpdate(
          user._id,
          { $unset: { referredBy: 1 } }
        );

        // Also try to remove any referral record that might have been created
        await Referral.deleteOne({
          referrer: referrer._id,
          referred: user._id
        });
      } catch (rollbackError) {
        console.error('Error rolling back changes:', rollbackError);
      }

      return res.status(500).json({
        success: false,
        message: 'Server error while processing referral'
      });
    }

    // Prepare success response
    const response = {
      success: true,
      message: `Referral code applied successfully. You are now referred by ${referrer.username || 'the referrer'}.`
    };

    console.log('Sending success response:', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to fix referral counts and ensure referral rewards
export const fixReferralCounts = async (userId: mongoose.Types.ObjectId): Promise<void> => {
  try {
    // Validate the userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId provided to fixReferralCounts:', userId);
      return;
    }

    console.log(`Fixing referral counts for user: ${userId}`);

    // Ensure userId is a valid ObjectId
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    console.log(`Using ObjectId: ${userIdObj.toString()} for referral count fix`);

    // Get all users who have this user as their referrer
    const referredUsers = await User.find({ referredBy: userIdObj })
      .select('_id username walletAddress createdAt');
    console.log(`Found ${referredUsers.length} users with referredBy set to ${userIdObj}`);

    // Get all referral records where this user is the referrer
    const referralRecords = await Referral.find({ referrer: userIdObj });
    console.log(`Found ${referralRecords.length} referral records with referrer set to ${userIdObj}`);

    // Check for discrepancies
    const referredUserIds = new Set(referredUsers.map(u => u._id ? u._id.toString() : ''));
    const referralRecordReferredIds = new Set(referralRecords.map(r => r.referred ? r.referred.toString() : ''));

    // Find users who have referredBy set but no referral record
    const missingReferralRecords = [];
    for (const refUser of referredUsers) {
      if (refUser._id && !referralRecordReferredIds.has(refUser._id.toString())) {
        missingReferralRecords.push(refUser);
      }
    }

    // Find referral records with no corresponding referredBy in User
    const missingReferredByUsers = [];
    for (const record of referralRecords) {
      if (record.referred && !referredUserIds.has(record.referred.toString())) {
        missingReferredByUsers.push(record);
      }
    }

    console.log(`Found ${missingReferralRecords.length} users missing referral records`);
    console.log(`Found ${missingReferredByUsers.length} referral records missing referredBy`);

    // Fix missing referral records
    for (const refUser of missingReferralRecords) {
      console.log(`Creating missing referral record for user ${refUser._id}`);

      try {
        // Skip if refUser._id is missing
        if (!refUser._id) {
          console.log('Skipping referral record creation for user with missing _id');
          continue;
        }

        // Check if a referral record already exists (double-check to avoid duplicates)
        const existingRecord = await Referral.findOne({
          referrer: userIdObj,
          referred: refUser._id
        });

        if (existingRecord) {
          console.log(`Referral record already exists for user ${refUser._id}, skipping creation`);
          continue;
        }

        // Check if the user has made any predictions
        const hasParticipated = await Participation.findOne({ user: refUser._id });
        const hasPredicted = !!hasParticipated;

        const newReferral = await Referral.create({
          referrer: userIdObj,
          referred: refUser._id,
          status: 'active',
          hasPredicted: hasPredicted,
          rewards: { SOL: 0, BNB: 0, KAIDO: 0 }
        });

        console.log(`Created missing referral record: ${newReferral._id} for user ${refUser._id}, hasPredicted=${hasPredicted}`);

        // If the user has made predictions, create a referral reward
        if (hasPredicted) {
          // Check if there's already a reward transaction
          const existingReward = await Transaction.findOne({
            user: userIdObj,
            type: 'referral',
            description: { $regex: new RegExp(`${refUser._id}`) }
          });

          if (!existingReward) {
            console.log(`No referral reward found for user ${refUser._id}, creating one`);

            // Use KAIDO rewards for BNB Smart Chain
            const minimumReward = 100; // Minimum reward of 100 KAIDO tokens
            const tokenType = 'KAIDO';

            const transaction = await Transaction.create({
              user: userIdObj,
              type: 'referral',
              amount: minimumReward,
              tokenType: tokenType,
              status: 'pending',
              description: `Referral reward for user ${refUser._id} prediction participation`
            });

            console.log(`Created referral reward transaction: ${transaction._id} for ${minimumReward} ${tokenType}`);

            // Update the referral record with the reward amount
            await Referral.findByIdAndUpdate(
              newReferral._id,
              { $inc: { [`rewards.${tokenType}`]: minimumReward } }
            );

            // Create a notification for the referrer
            try {
              // Check if a similar notification already exists in the last 24 hours
              const oneDayAgo = new Date();
              oneDayAgo.setDate(oneDayAgo.getDate() - 1);

              const existingNotification = await User.findOne({
                _id: userIdObj,
                'notifications.type': 'referral',
                'notifications.title': 'New Referral Reward',
                'notifications.timestamp': { $gte: oneDayAgo }
              });

              if (existingNotification) {
                console.log(`Skipping notification for referrer ${userIdObj} as a similar reward notification was sent in the last 24 hours`);
              } else {
                await User.updateOne(
                  { _id: userIdObj },
                  {
                    $push: {
                      notifications: {
                        userId: userIdObj,
                        type: 'referral',
                        title: 'New Referral Reward',
                        message: `You earned ${minimumReward.toFixed(4)} SOL from ${refUser.username || refUser.walletAddress || 'a user'}'s prediction participation`,
                        read: false,
                        timestamp: new Date()
                      }
                    }
                  }
                );
                console.log(`Added notification to referrer ${userIdObj} about new referral reward`);
              }
            } catch (notificationError) {
              console.error('Error creating notification for referral reward:', notificationError);
            }
          } else {
            console.log(`Referral reward already exists for user ${refUser._id}: ${existingReward._id}`);
          }
        }
      } catch (err) {
        console.error(`Error creating referral record for user ${refUser._id ? refUser._id.toString() : 'unknown'}:`, err);
      }
    }

    // Fix missing referredBy in User
    for (const record of missingReferredByUsers) {
      console.log(`Fixing missing referredBy for user ${record.referred}`);

      // Check if the user exists before updating
      const userExists = await User.findById(record.referred);
      if (!userExists) {
        console.log(`User ${record.referred} does not exist, skipping referredBy update`);
        continue;
      }

      try {
        const updatedUser = await User.findByIdAndUpdate(
          record.referred,
          { referredBy: userIdObj },
          { new: true }
        );
        console.log(`Successfully updated referredBy for user ${record.referred} -> ${updatedUser?._id}`);
      } catch (err) {
        console.error(`Error updating referredBy for user ${record.referred}:`, err);
      }
    }

    // Check for users who have participated in predictions but don't have hasPredicted set to true
    const referralRecordsWithPredictions = await Referral.find({
      referrer: userIdObj,
      hasPredicted: false
    });

    if (referralRecordsWithPredictions.length > 0) {
      console.log(`Found ${referralRecordsWithPredictions.length} referral records that might need hasPredicted update`);

      for (const record of referralRecordsWithPredictions) {
        // Check if the referred user has participated in any predictions
        const hasParticipated = await Participation.findOne({ user: record.referred });

        if (hasParticipated) {
          console.log(`User ${record.referred} has participated in predictions but hasPredicted is false, updating`);
          try {
            await Referral.findByIdAndUpdate(
              record._id,
              { hasPredicted: true }
            );
            console.log(`Successfully updated hasPredicted for referral ${record._id}`);

            // Check if there's a pending referral reward transaction
            const existingReward = await Transaction.findOne({
              user: userIdObj,
              type: 'referral',
              description: { $regex: new RegExp(`${record.referred}`) }
            });

            // If no reward exists, create one
            if (!existingReward) {
              console.log(`No referral reward found for user ${record.referred}, creating one`);

              // Calculate referral reward for KAIDO tokens
              const minimumReward = 100; // Minimum reward of 100 KAIDO tokens

              try {
                // First check if a reward already exists for this user
                const existingReward = await Transaction.findOne({
                  user: userIdObj,
                  type: 'referral',
                  description: { $regex: new RegExp(`${record.referred}`) }
                });

                if (existingReward) {
                  console.log(`Referral reward already exists for user ${record.referred}: ${existingReward._id}`);
                } else {
                  // Create a transaction record for the referral reward
                  const tokenType = 'KAIDO';
                  const kaidoReward = 100; // 100 KAIDO tokens reward

                  const transaction = await Transaction.create({
                    user: userIdObj,
                    type: 'referral',
                    amount: kaidoReward,
                    tokenType: tokenType,
                    status: 'pending',
                    description: `Referral reward for user ${record.referred} prediction participation`
                  });

                  console.log(`Created referral reward transaction: ${transaction._id} for ${kaidoReward} ${tokenType}`);

                  // Update the referral record with the reward amount only if we created a new reward
                  await Referral.findByIdAndUpdate(
                    record._id,
                    { $inc: { [`rewards.${tokenType}`]: kaidoReward } }
                  );
                }

                // Create a notification for the referrer only if we created a new reward
                if (!existingReward) {
                  try {
                    // Check if a similar notification already exists in the last 24 hours
                    const oneDayAgo = new Date();
                    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

                    const existingNotification = await User.findOne({
                      _id: userIdObj,
                      'notifications.type': 'referral',
                      'notifications.title': 'New Referral Reward',
                      'notifications.timestamp': { $gte: oneDayAgo }
                    });

                    if (existingNotification) {
                      console.log(`Skipping notification for referrer ${userIdObj} as a similar reward notification was sent in the last 24 hours`);
                    } else {
                      const referredUser = await User.findById(record.referred).select('username walletAddress');
                      await User.updateOne(
                        { _id: userIdObj },
                        {
                          $push: {
                            notifications: {
                              userId: userIdObj,
                              type: 'referral',
                              title: 'New Referral Reward',
                              message: `You earned ${minimumReward.toFixed(4)} SOL from ${referredUser?.username || referredUser?.walletAddress || 'a user'}'s prediction participation`,
                              read: false,
                              timestamp: new Date()
                            }
                          }
                        }
                      );
                      console.log(`Added notification to referrer ${userIdObj} about new referral reward`);
                    }
                  } catch (notificationError) {
                    console.error('Error creating notification for referral reward:', notificationError);
                  }
                }
              } catch (rewardErr) {
                console.error(`Error creating referral reward transaction for user ${record.referred}:`, rewardErr);
              }
            } else {
              console.log(`Referral reward already exists for user ${record.referred}: ${existingReward._id}`);
            }
          } catch (err) {
            console.error(`Error updating hasPredicted for referral ${record._id}:`, err);
          }
        }
      }
    }

    // Check for any duplicate referral records and clean them up
    const referredUserCounts: { [key: string]: mongoose.Types.ObjectId[] } = {};
    for (const record of referralRecords) {
      if (!record.referred) continue;

      const referredId = record.referred.toString();
      if (!referredUserCounts[referredId]) {
        referredUserCounts[referredId] = [];
      }
      // Ensure record._id is treated as a mongoose.Types.ObjectId
      referredUserCounts[referredId].push(record._id as mongoose.Types.ObjectId);
    }

    // Find duplicates (more than one record for the same referred user)
    const duplicates = Object.entries(referredUserCounts)
      .filter(([_, recordIds]) => recordIds.length > 1)
      .map(([referredId, recordIds]) => ({ referredId, recordIds }));

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} users with duplicate referral records`);

      for (const { referredId, recordIds } of duplicates) {
        console.log(`User ${referredId} has ${recordIds.length} referral records`);

        // Keep the oldest record and remove the rest
        const records = await Referral.find({ _id: { $in: recordIds } }).sort({ createdAt: 1 });
        const oldestRecord = records[0];
        const duplicateRecords = records.slice(1);

        console.log(`Keeping oldest record ${oldestRecord._id} and removing ${duplicateRecords.length} duplicates`);

        // Remove duplicate records
        for (const record of duplicateRecords) {
          try {
            await Referral.findByIdAndDelete(record._id);
            console.log(`Successfully removed duplicate referral record ${record._id}`);
          } catch (err) {
            console.error(`Error removing duplicate referral record ${record._id}:`, err);
          }
        }
      }
    }

    // Verify the fixes
    const updatedReferredUsers = await User.find({ referredBy: userIdObj })
      .select('_id username walletAddress createdAt');
    const updatedReferralRecords = await Referral.find({ referrer: userIdObj });

    console.log(`After fixes: Found ${updatedReferredUsers.length} users with referredBy set to ${userIdObj}`);
    console.log(`After fixes: Found ${updatedReferralRecords.length} referral records with referrer set to ${userIdObj}`);

    if (missingReferralRecords.length > 0 || missingReferredByUsers.length > 0 || duplicates.length > 0) {
      console.log(`Fixed ${missingReferralRecords.length + missingReferredByUsers.length + duplicates.length} referral discrepancies`);
    } else {
      console.log('No referral discrepancies found');
    }
  } catch (error) {
    console.error('Error fixing referral counts:', error);
  }
};

// @desc    Get referral stats
// @route   GET /api/referrals/stats
// @access  Private
export const getReferralStats = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    console.log(`Getting referral stats for user: ${user._id}, username: ${user.username || 'unknown'}, wallet: ${user.walletAddress || 'unknown'}`);

    // Force a consistency check on every stats request to ensure data integrity
    await ensureReferralConsistency(user._id);

    // Also run our new fix function to ensure referral counts are correct
    await fixReferralCounts(user._id);

    console.log('Getting referral stats for user:', user._id, user.username || user.walletAddress);

    // Ensure user ID is a valid ObjectId
    const userId = typeof user._id === 'string' ? new mongoose.Types.ObjectId(user._id) : user._id;
    console.log(`Using ObjectId: ${userId.toString()} for referral stats query`);

    // Get all users who were referred by this user (clicked link and connected wallet)
    const referredUsers = await User.find({
      referredBy: userId
    }).select('_id username avatar createdAt');

    console.log('Found referred users from User collection:', referredUsers.length);
    console.log('User ID being searched for referrals:', userId);

    // Debug: Check if the user ID is in the correct format
    console.log('User ID type:', typeof userId);
    console.log('User ID toString:', userId.toString());

    // Double-check by querying the Referral collection directly
    const referralRecords = await Referral.find({
      referrer: userId
    });
    console.log('Found referral records from Referral collection:', referralRecords.length);

    // Check for discrepancies and fix them
    const referralRecordReferredIds = new Set(referralRecords.map(r => r.referred.toString()));
    const userIdSet = new Set(referredUsers.map(u => u._id ? u._id.toString() : ''));

    // Find referral records with no corresponding referredBy in User
    const missingReferredByUsers = [];
    for (const record of referralRecords) {
      if (!userIdSet.has(record.referred.toString())) {
        missingReferredByUsers.push(record);
      }
    }

    // Find users who have referredBy set but no referral record
    const missingReferralRecords = [];
    for (const refUser of referredUsers) {
      if (refUser._id && !referralRecordReferredIds.has(refUser._id.toString())) {
        missingReferralRecords.push(refUser);
      }
    }

    console.log(`Discrepancy check: ${missingReferredByUsers.length} users missing referredBy, ${missingReferralRecords.length} missing referral records`);

    // Fix missing referredBy fields
    if (missingReferredByUsers.length > 0) {
      console.log('Fixing users with missing referredBy field');

      for (const record of missingReferredByUsers) {
        const referredUser = await User.findById(record.referred);
        if (referredUser && !referredUser.referredBy) {
          console.log(`Fixing missing referredBy for user ${referredUser._id ? referredUser._id.toString() : 'unknown'}`);
          await User.findByIdAndUpdate(
            referredUser._id,
            { referredBy: userId }
          );
        }
      }
    }

    // Fix missing referral records
    if (missingReferralRecords.length > 0) {
      console.log('Creating missing referral records');

      for (const refUser of missingReferralRecords) {
        console.log(`Creating missing referral record for user ${refUser._id}`);

        // Check if a referral record already exists (double-check to avoid duplicates)
        const existingRecord = await Referral.findOne({
          referrer: userId,
          referred: refUser._id
        });

        if (existingRecord) {
          console.log(`Referral record already exists for user ${refUser._id}, skipping creation`);
          continue;
        }

        await Referral.create({
          referrer: userId,
          referred: refUser._id,
          status: 'active',
          hasPredicted: false,
          rewards: { SOL: 0 }
        });
      }
    }

    // If any fixes were made, refresh the data
    if (missingReferredByUsers.length > 0 || missingReferralRecords.length > 0) {
      // Refresh the referred users list
      const updatedReferredUsers = await User.find({
        referredBy: userId
      }).select('_id username avatar createdAt');

      console.log('Updated referred users count after fix:', updatedReferredUsers.length);
      referredUsers.length = 0;
      updatedReferredUsers.forEach(user => referredUsers.push(user));

      // Refresh referral records
      const updatedReferralRecords = await Referral.find({
        referrer: userId
      });
      console.log('Updated referral records count after fix:', updatedReferralRecords.length);
    }

    referredUsers.forEach((refUser, index) => {
      console.log(`Referred user ${index + 1}:`, {
        id: refUser._id,
        username: refUser.username,
        createdAt: refUser.createdAt
      });
    });

    // Calculate total referrals (users who clicked link and connected wallet)
    const totalReferrals = referredUsers.length;

    // Log the total referrals count for debugging
    console.log(`Total referrals count: ${totalReferrals}`);

    // Double-check by counting referral records directly
    const referralCount = await Referral.countDocuments({ referrer: userId });
    console.log(`Direct referral record count: ${referralCount}`);

    // If there's a discrepancy, log it
    if (totalReferrals !== referralCount) {
      console.log(`WARNING: Discrepancy between User.referredBy count (${totalReferrals}) and Referral records count (${referralCount})`);
    }

    // Get all referrals where user is the referrer
    const referrals = await Referral.find({ referrer: userId });

    console.log('Found referral records:', referrals.length);
    referrals.forEach((ref, index) => {
      console.log(`Referral record ${index + 1}:`, {
        id: ref._id,
        referred: ref.referred,
        status: ref.status,
        hasPredicted: ref.hasPredicted,
        rewards: ref.rewards
      });
    });

    // Get all referral transactions (both pending and completed)
    const allReferralTransactions = await Transaction.find({
      user: userId,
      type: 'referral',
      tokenType: 'BNB'
    });

    console.log(`Found ${allReferralTransactions.length} total referral transactions`);

    // Calculate total rewards (including both pending and completed transactions)
    const totalRewards = {
      BNB: 0
    };

    // Add up all transaction amounts
    allReferralTransactions.forEach(tx => {
      totalRewards.BNB += tx.amount;
    });

    console.log('Total rewards calculated (from all transactions):', totalRewards);

    // Log each transaction for debugging
    allReferralTransactions.forEach(tx => {
      console.log(`Referral transaction: ${tx._id}, amount: ${tx.amount} SOL, status: ${tx.status}, prediction: ${tx.prediction || 'none'}, referredUser: ${tx.referredUser || 'none'}`);
    });

    // Get pending rewards from transactions
    const pendingRewards = {
      BNB: 0
    };

    const pendingTransactions = await Transaction.find({
      user: userId,
      type: 'referral',
      status: 'pending',
      tokenType: 'BNB'
    });

    console.log('Found pending transactions:', pendingTransactions.length);
    pendingTransactions.forEach((tx, index) => {
      console.log(`Pending transaction ${index + 1}:`, {
        id: tx._id,
        amount: tx.amount,
        tokenType: tx.tokenType,
        status: tx.status
      });
    });

    pendingTransactions.forEach(tx => {
      pendingRewards.BNB += tx.amount;
    });

    console.log('Pending rewards calculated:', pendingRewards);

    // Calculate active referrals (users who have made at least one prediction)
    // Get the IDs of all referred users
    const referredUserIdsForParticipation = referredUsers.map(user => user._id);

    console.log('Referred user IDs for participation check:', referredUserIdsForParticipation);

    // Find all participations by referred users
    const participations = await Participation.find({
      user: { $in: referredUserIdsForParticipation }
    }).distinct('user');

    console.log('Found participations from referred users:', participations.length);
    console.log('Participation user IDs:', participations);

    // Count unique users who have participated in predictions
    const activeReferrals = participations.length;

    console.log('Active referrals calculated:', activeReferrals);

    // Prepare response
    const response = {
      success: true,
      stats: {
        totalReferrals,
        activeReferrals,
        totalEarned: { BNB: totalRewards.BNB, SOL: 0, SOLY: 0 }, // Prioritize BNB
        pendingRewards: { BNB: pendingRewards.BNB, SOL: 0, SOLY: 0 } // Prioritize BNB
      },
      referredUsers: referredUsers.map(user => ({
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        joinedAt: user.createdAt
      }))
    };

    console.log('Sending referral stats response:', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get claimable referral rewards
// @route   GET /api/referrals/claimable
// @access  Private
export const getClaimableReferralRewards = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    console.log(`Getting claimable referral rewards for user: ${user._id}, username: ${user.username || 'unknown'}`);

    // Check if the user already has a pending claim
    const existingClaim = await Transaction.findOne({
      user: user._id,
      type: 'referral_claim',
      status: { $in: ['pending_admin', 'processing'] }
    });

    let hasPendingClaim = false;
    if (existingClaim) {
      console.log(`User ${user._id} has a pending claim: ${existingClaim._id}, status: ${existingClaim.status}`);
      hasPendingClaim = true;
    }

    // Find all pending referral transactions for this user
    // Use a more detailed query to ensure we're getting all relevant transactions
    // Only include transactions with status 'pending' (not 'processing' or other statuses)
    const pendingRewards = await Transaction.find({
      user: user._id,
      type: 'referral',
      status: 'pending' // Only get truly pending rewards that can be claimed
    }).populate('prediction').populate('referredUser', 'username walletAddress');

    // Also get all completed referral transactions for total earned calculation
    const completedRewards = await Transaction.find({
      user: user._id,
      type: 'referral',
      status: 'completed'
    });

    console.log(`Found ${pendingRewards.length} pending referral rewards and ${completedRewards.length} completed referral rewards`);

    // Calculate total earned from both pending and completed rewards by token type
    const totalEarnedByToken = {
      BNB: 0,
      SOL: 0, // Legacy compatibility
      KAIDO: 0
    };

    pendingRewards.forEach(reward => {
      if (totalEarnedByToken[reward.tokenType as keyof typeof totalEarnedByToken] !== undefined) {
        totalEarnedByToken[reward.tokenType as keyof typeof totalEarnedByToken] += reward.amount;
      }
    });
    completedRewards.forEach(reward => {
      if (totalEarnedByToken[reward.tokenType as keyof typeof totalEarnedByToken] !== undefined) {
        totalEarnedByToken[reward.tokenType as keyof typeof totalEarnedByToken] += reward.amount;
      }
    });

    console.log(`Total earned from all referral rewards:`, totalEarnedByToken);

    // Log detailed information about the query and results
    console.log(`Referral rewards query: user=${user._id}, type=referral, status=pending`);
    console.log(`Query returned ${pendingRewards.length} pending referral rewards`);

    // Check if there are any transactions at all for this user
    const allUserTransactions = await Transaction.find({ user: user._id }).countDocuments();
    console.log(`User has ${allUserTransactions} total transactions of all types`);

    // Check if there are any referral transactions regardless of status
    const allReferralTransactions = await Transaction.find({
      user: user._id,
      type: 'referral'
    }).countDocuments();
    console.log(`User has ${allReferralTransactions} total referral transactions (any status)`);

    // Check if user has any referred users who have made predictions
    const referrals = await Referral.find({ referrer: user._id, hasPredicted: true }).countDocuments();
    console.log(`User has ${referrals} referrals who have made predictions`);

    // Log each found transaction for debugging
    pendingRewards.forEach(reward => {
      console.log(`Found pending reward: ${reward._id}, amount: ${reward.amount} ${reward.tokenType}, created: ${reward.createdAt}`);
    });

    console.log(`Found ${pendingRewards.length} pending referral rewards`);

    // Group rewards by token type and deduplicate by prediction ID
    const groupedRewards = {
      BNB: {
        total: 0, // Pending rewards total
        totalEarned: totalEarnedByToken.BNB, // Total earned (pending + completed)
        transactions: [] as any[]
      },
      SOL: {
        total: 0, // Pending rewards total (legacy compatibility)
        totalEarned: totalEarnedByToken.SOL, // Total earned (pending + completed)
        transactions: [] as any[]
      },
      KAIDO: {
        total: 0, // Pending rewards total
        totalEarned: totalEarnedByToken.KAIDO, // Total earned (pending + completed)
        transactions: [] as any[]
      }
    };

    // Process all pending rewards without any deduplication
    console.log(`Processing all ${pendingRewards.length} pending rewards without deduplication`);

    // Log each reward for debugging
    pendingRewards.forEach((reward, index) => {
      console.log(`Reward ${index + 1}/${pendingRewards.length}: ID=${reward._id}, amount=${reward.amount} ${reward.tokenType}, prediction=${reward.prediction ? (reward.prediction as any)._id : 'none'}, description=${reward.description || 'none'}`);
    });

    // Add all rewards to the grouped rewards by token type
    pendingRewards.forEach(reward => {
      const tokenType = reward.tokenType as 'SOL' | 'BNB' | 'KAIDO';

      if (groupedRewards[tokenType]) {
        // Add to the total and transactions list
        groupedRewards[tokenType].total += reward.amount;
        groupedRewards[tokenType].transactions.push({
          id: reward._id,
          amount: reward.amount,
          description: reward.description || '',
          createdAt: reward.createdAt,
          prediction: reward.prediction ? {
            id: (reward.prediction as any)._id,
            title: (reward.prediction as any).title
          } : null,
          referredUser: reward.referredUser ? {
            id: (reward.referredUser as any)._id,
            username: (reward.referredUser as any).username || 'Anonymous',
            walletAddress: (reward.referredUser as any).walletAddress
          } : null
        });

        console.log(`Added reward ${reward._id} for ${reward.amount} ${tokenType} to claimable rewards list`);
      }
    });

    console.log(`Grouped rewards: BNB: ${groupedRewards.BNB.total}`);

    res.status(200).json({
      success: true,
      rewards: {
        BNB: groupedRewards.BNB,
        SOL: { total: 0, totalEarned: 0, transactions: [] }, // Legacy compatibility
        KAIDO: groupedRewards.KAIDO,
        SOLY: { total: 0, totalEarned: 0, transactions: [] } // Legacy compatibility
      },
      hasPendingClaim: hasPendingClaim,
      pendingClaim: existingClaim ? {
        id: existingClaim._id,
        amount: existingClaim.amount,
        tokenType: existingClaim.tokenType,
        status: existingClaim.status,
        createdAt: existingClaim.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error getting claimable referral rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Claim referral rewards
// @route   POST /api/referrals/claim
// @access  Private
export const claimReferralRewards = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };
    const { tokenType } = req.body;

    if (!tokenType || !['SOL', 'BNB', 'KAIDO'].includes(tokenType)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid token type (SOL, BNB, or KAIDO)'
      });
    }

    console.log(`Claiming ${tokenType} referral rewards for user: ${user._id}`);

    // Check if the user already has a pending claim
    const existingClaim = await Transaction.findOne({
      user: user._id,
      type: 'referral_claim',
      tokenType,
      status: { $in: ['pending_admin', 'processing'] }
    });

    if (existingClaim) {
      console.log(`User ${user._id} already has a pending claim: ${existingClaim._id}`);
      return res.status(400).json({
        success: false,
        message: `You already have a pending ${tokenType} referral rewards claim. Please wait for it to be processed.`
      });
    }

    // Find all pending referral transactions for this user and token type
    const pendingRewards = await Transaction.find({
      user: user._id,
      type: 'referral',
      status: 'pending',
      tokenType
    }).populate('prediction');

    console.log(`Found ${pendingRewards.length} pending referral rewards to claim`);

    if (pendingRewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No pending ${tokenType} referral rewards found`
      });
    }

    // Process ALL pending rewards without any deduplication
    console.log(`Processing all ${pendingRewards.length} pending rewards without deduplication`);

    // Log each reward being processed with detailed information
    pendingRewards.forEach((reward, index) => {
      console.log(`Processing reward ${index + 1}/${pendingRewards.length}: ID=${reward._id}, amount=${reward.amount} ${reward.tokenType}, prediction=${reward.prediction ? (reward.prediction as any)._id : 'unknown'}, description=${reward.description || 'none'}, created=${reward.createdAt}`);
    });

    // Calculate total reward amount from all rewards
    const totalReward = pendingRewards.reduce((sum, reward) => sum + reward.amount, 0);

    console.log(`Found ${pendingRewards.length} pending ${tokenType} rewards, total: ${totalReward}`);

    // Process the claim using the helper function with ALL pending rewards
    const claimTx = await processClaim(user, tokenType, pendingRewards, totalReward);

    res.status(200).json({
      success: true,
      message: `Claim for ${totalReward} ${tokenType} initiated successfully. Awaiting admin approval.`,
      claim: {
        id: claimTx._id,
        amount: totalReward,
        tokenType,
        status: 'pending_admin',
        transactionIds: claimTx.metadata?.transactionIds || []
      }
    });

  } catch (error) {
    console.error('Error claiming referral rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admin approve referral claim
// @route   POST /api/referrals/admin/approve-claim
// @access  Private (Admin only)
export const adminApproveReferralClaim = async (req: Request, res: Response) => {
  try {
    const admin = req.user as IUser & { _id: mongoose.Types.ObjectId };

    const { claimId } = req.body;

    if (!claimId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a claim ID'
      });
    }

    console.log(`Admin ${admin._id} approving referral claim: ${claimId}`);

    // Find the claim transaction
    const claimTransaction = await Transaction.findById(claimId);

    if (!claimTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    // Check if claim is pending admin approval
    if (claimTransaction.status !== 'pending_admin' as ITransaction['status']) {
      return res.status(400).json({
        success: false,
        message: `Claim cannot be approved. Current status: ${claimTransaction.status}`
      });
    }

    // Get the user who made the claim
    const user = await User.findById(claimTransaction.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`Processing claim for user: ${user._id}, amount: ${claimTransaction.amount} ${claimTransaction.tokenType}`);

    // Get the transaction IDs from metadata
    const metadata = claimTransaction.metadata as { transactionIds?: string[] } || {};
    const transactionIds = metadata.transactionIds || [];

    if (!transactionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'No transactions associated with this claim'
      });
    }

    console.log(`Found ${transactionIds.length} transactions to process`);

    // Update claim status to processing
    await Transaction.findByIdAndUpdate(claimId, {
      status: 'processing',
      description: `Claim for ${claimTransaction.amount} ${claimTransaction.tokenType} referral rewards - Processing payment`
    });

    // Perform operations sequentially with blockchain transaction
    try {
      // Check if user has a wallet address
      if (!user.walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'User does not have a wallet address'
        });
      }

      console.log(`Processing blockchain transaction for user ${user._id} with wallet ${user.walletAddress}`);

      // Check if claim wallet has sufficient balance
      const hasSufficientBalance = await hasClaimWalletSufficientBalance(
        claimTransaction.amount,
        claimTransaction.tokenType as 'BNB' | 'KAIDO'
      );
      if (!hasSufficientBalance) {
        console.error(`Claim wallet has insufficient balance to pay out ${claimTransaction.amount} ${claimTransaction.tokenType}`);
        return res.status(400).json({
          success: false,
          message: `Claim wallet has insufficient balance to pay out ${claimTransaction.amount} ${claimTransaction.tokenType}`
        });
      }

      console.log(`Claim wallet has sufficient balance. Proceeding with transaction...`);

      // Send the actual blockchain transaction
      let txHash;
      try {
        console.log(`Sending ${claimTransaction.amount} ${claimTransaction.tokenType} from claim wallet to ${user.walletAddress}`);
        txHash = await sendTokensFromClaimWallet(
          user.walletAddress,
          claimTransaction.amount,
          claimTransaction.tokenType as 'BNB' | 'KAIDO'
        );
        console.log(`Blockchain transaction successful. Transaction hash: ${txHash}`);
      } catch (error) {
        const txError = error as Error;
        console.error('Error sending blockchain transaction:', txError);
        return res.status(500).json({
          success: false,
          message: `Failed to send blockchain transaction: ${txError.message || 'Unknown error'}`
        });
      }

      // Mark the claim as completed with the transaction hash
      await Transaction.findByIdAndUpdate(
        claimId,
        {
          status: 'completed',
          txHash: txHash,
          description: `Claim for ${claimTransaction.amount} ${claimTransaction.tokenType} referral rewards - Completed with transaction ${txHash}`
        }
      );

      // Update all the original transactions to completed
      await Transaction.updateMany(
        { _id: { $in: transactionIds } },
        {
          status: 'completed',
          description: `${claimTransaction.tokenType} referral reward - Paid out with transaction ${txHash}`
        }
      );

      // Add notification to the user about their approved claim
      await User.updateOne(
        { _id: user._id },
        {
          $push: {
            notifications: {
              userId: user._id,
              type: 'system',
              title: 'Referral Rewards Approved',
              message: `Your claim for ${claimTransaction.amount} ${claimTransaction.tokenType} in referral rewards has been approved and paid out! Transaction: ${txHash}`,
              read: false,
              timestamp: new Date(),
              data: {
                claimId: claimTransaction._id,
                amount: claimTransaction.amount,
                tokenType: claimTransaction.tokenType,
                status: 'completed',
                txHash: txHash
              }
            }
          }
        }
      );

      console.log(`Added notification to user ${user._id} about their approved claim`);
      console.log(`Approval process completed successfully for claim: ${claimId}`);
    } catch (error) {
      console.error('Error in approval process:', error);

      // Try to revert the claim status if there was an error
      try {
        await Transaction.findByIdAndUpdate(
          claimId,
          {
            status: 'pending_admin',
            description: `Claim for ${claimTransaction.amount} ${claimTransaction.tokenType} referral rewards - Failed to process`
          }
        );
      } catch (revertError) {
        console.error('Error reverting claim status:', revertError);
      }

      throw error;
    }

    console.log(`Updated ${transactionIds.length} transactions to completed status`);

    res.status(200).json({
      success: true,
      message: `Successfully approved and processed claim for ${claimTransaction.amount} ${claimTransaction.tokenType}`,
      claim: {
        id: claimTransaction._id,
        amount: claimTransaction.amount,
        tokenType: claimTransaction.tokenType,
        status: 'completed',
        userId: user._id,
        username: user.username || 'Unknown'
      }
    });

  } catch (error) {
    console.error('Error approving referral claim:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pending referral claims for admin
// @route   GET /api/referrals/admin/pending-claims
// @access  Private (Admin only)
export const getAdminPendingClaims = async (req: Request, res: Response) => {
  try {
    const admin = req.user as IUser & { _id: mongoose.Types.ObjectId };

    console.log(`Admin ${admin._id} getting pending referral claims`);

    // Find all pending admin approval claims
    const pendingClaims = await Transaction.find({
      type: 'referral_claim' as ITransaction['type'],
      status: 'pending_admin' as ITransaction['status']
    }).populate('user', 'username walletAddress');

    console.log(`Found ${pendingClaims.length} pending referral claims`);

    // Format the response
    const formattedClaims = pendingClaims.map(claim => ({
      id: claim._id,
      amount: claim.amount,
      tokenType: claim.tokenType,
      status: claim.status,
      description: claim.description,
      createdAt: claim.createdAt,
      user: {
        id: claim.user._id,
        username: (claim.user as any).username || 'Unknown',
        walletAddress: (claim.user as any).walletAddress
      },
      transactionIds: (claim.metadata as { transactionIds?: string[] } || {}).transactionIds || []
    }));

    res.status(200).json({
      success: true,
      claims: formattedClaims
    });

  } catch (error) {
    console.error('Error getting pending referral claims:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Check if user has a referrer
// @route   GET /api/referrals/check
// @access  Private
export const checkReferralStatus = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    console.log('Checking referral status for user:', user._id, user.username || user.walletAddress);

    // Force a consistency check to ensure data integrity
    await ensureReferralConsistency(user._id);

    // Also run our new fix function to ensure referral counts are correct
    await fixReferralCounts(user._id);

    // Check if user has a referrer
    let hasReferrer = !!user.referredBy;

    // If user has a referrer, get the referrer details
    let referrer = null;
    if (hasReferrer) {
      referrer = await User.findById(user.referredBy)
        .select('_id username avatar referralCode');

      console.log('Found referrer:', referrer?._id, referrer?.username);

      // If the referrer doesn't exist but the user has a referredBy field, clear it
      if (!referrer) {
        console.error(`User ${user._id} has referredBy set to ${user.referredBy} but this user doesn't exist`);

        // Clear the invalid referredBy field
        await User.findByIdAndUpdate(user._id, { $unset: { referredBy: 1 } });

        // Update the hasReferrer flag
        hasReferrer = false;

        console.log(`Cleared invalid referredBy field for user ${user._id}`);
      }
    }

    // Get user's own referral code
    const referralCode = user.referralCode || null;

    const response = {
      success: true,
      hasReferrer,
      referrer: referrer ? {
        id: referrer._id,
        username: referrer.username,
        avatar: referrer.avatar
      } : null,
      referralCode
    };

    console.log('Sending referral status response:', response);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error checking referral status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to generate a unique referral code
// This function is deterministic - same input always produces same output
// This ensures referral codes remain consistent for users
const generateUniqueCode = (seed: string): string => {
  // If the seed is a username and it's at least 3 characters long, use it directly
  if (seed && !seed.includes('@') && !seed.includes('.') && seed.length >= 3 && seed.length <= 8) {
    // Convert to uppercase and remove any special characters
    return seed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  // Otherwise, use a hash of the seed
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  return hash.substring(0, 8).toUpperCase();
};

// Helper function to ensure referral data consistency
const ensureReferralConsistency = async (userId: mongoose.Types.ObjectId): Promise<void> => {
  try {
    console.log(`Ensuring referral consistency for user: ${userId}`);

    // Ensure userId is a valid ObjectId
    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    console.log(`Using ObjectId: ${userIdObj.toString()} for referral consistency check`);

    // Get all users who have this user as their referrer
    const referredUsers = await User.find({ referredBy: userIdObj })
      .select('_id username walletAddress createdAt');

    // Get all referral records where this user is the referrer
    const referralRecords = await Referral.find({ referrer: userIdObj });

    console.log(`Found ${referredUsers.length} users with referredBy set to ${userIdObj}`);
    console.log(`Found ${referralRecords.length} referral records with referrer set to ${userIdObj}`);

    // Check for discrepancies
    const referredUserIds = new Set(referredUsers.map(u => u._id ? u._id.toString() : ''));
    const referralRecordReferredIds = new Set(referralRecords.map(r => r.referred ? r.referred.toString() : ''));

    // Find users who have referredBy set but no referral record
    const missingReferralRecords = [];
    for (const refUser of referredUsers) {
      if (refUser._id && !referralRecordReferredIds.has(refUser._id.toString())) {
        missingReferralRecords.push(refUser);
      }
    }

    // Find referral records with no corresponding referredBy in User
    const missingReferredByUsers = [];
    for (const record of referralRecords) {
      if (record.referred && !referredUserIds.has(record.referred.toString())) {
        missingReferredByUsers.push(record);
      }
    }

    console.log(`Found ${missingReferralRecords.length} users missing referral records`);
    console.log(`Found ${missingReferredByUsers.length} referral records missing referredBy`);

    // Log all referred users for debugging
    if (referredUsers.length > 0) {
      console.log('Referred users:');
      referredUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. User ID: ${user._id}, Username: ${user.username || 'No username'}, Wallet: ${user.walletAddress ? user.walletAddress.substring(0, 8) + '...' : 'No wallet'}`);
      });
    } else {
      console.log('No referred users found');
    }

    // Fix missing referral records
    for (const refUser of missingReferralRecords) {
      console.log(`Creating missing referral record for user ${refUser._id}`);

      // Check if the user exists before creating a referral record
      const userExists = await User.findById(refUser._id);
      if (!userExists) {
        console.log(`User ${refUser._id} does not exist, skipping referral record creation`);
        continue;
      }

      try {
        // Check if a referral record already exists (double-check to avoid duplicates)
        const existingRecord = await Referral.findOne({
          referrer: userIdObj,
          referred: refUser._id
        });

        if (existingRecord) {
          console.log(`Referral record already exists for user ${refUser._id}, skipping creation`);
          continue;
        }

        // Check if the user has made any predictions
        const hasParticipated = await Participation.findOne({ user: refUser._id });
        const hasPredicted = !!hasParticipated;

        if (hasPredicted) {
          console.log(`User ${refUser._id} has made predictions, setting hasPredicted=true`);
        }

        const newReferral = await Referral.create({
          referrer: userIdObj,
          referred: refUser._id,
          status: 'active',
          hasPredicted: hasPredicted, // Set based on whether they've made predictions
          rewards: { SOL: 0 }
        });
        console.log(`Successfully created referral record: ${newReferral._id} for user ${refUser._id}, hasPredicted=${hasPredicted}`);
      } catch (err) {
        console.error(`Error creating referral record for user ${refUser._id}:`, err);
      }
    }

    // Fix missing referredBy in User
    for (const record of missingReferredByUsers) {
      console.log(`Fixing missing referredBy for user ${record.referred}`);

      // Check if the user exists before updating
      const userExists = await User.findById(record.referred);
      if (!userExists) {
        console.log(`User ${record.referred} does not exist, skipping referredBy update`);
        continue;
      }

      try {
        const updatedUser = await User.findByIdAndUpdate(
          record.referred,
          { referredBy: userIdObj },
          { new: true }
        );
        console.log(`Successfully updated referredBy for user ${record.referred} -> ${updatedUser?._id}`);
      } catch (err) {
        console.error(`Error updating referredBy for user ${record.referred}:`, err);
      }
    }

    // Check for users who have participated in predictions but don't have hasPredicted set to true
    const referralRecordsWithPredictions = await Referral.find({
      referrer: userIdObj,
      hasPredicted: false
    });

    if (referralRecordsWithPredictions.length > 0) {
      console.log(`Found ${referralRecordsWithPredictions.length} referral records that might need hasPredicted update`);

      for (const record of referralRecordsWithPredictions) {
        // Check if the referred user has participated in any predictions
        const hasParticipated = await Participation.findOne({ user: record.referred });

        if (hasParticipated) {
          console.log(`User ${record.referred} has participated in predictions but hasPredicted is false, updating`);
          try {
            await Referral.findByIdAndUpdate(
              record._id,
              { hasPredicted: true }
            );
            console.log(`Successfully updated hasPredicted for referral ${record._id}`);

            // Check if there's a pending referral reward transaction
            const existingReward = await Transaction.findOne({
              user: userIdObj,
              type: 'referral',
              status: 'pending',
              description: { $regex: new RegExp(`${record.referred}`) }
            });

            // If no reward exists, create one
            if (!existingReward) {
              console.log(`No referral reward found for user ${record.referred}, creating one`);

              // Calculate referral reward (2% for BNB)
              const referralRewardPercentage = 0.02; // Fixed at 2% for BNB
              const minimumReward = 0.001; // Minimum reward of 0.001 BNB

              try {
                // Create a transaction record for the referral reward
                const transaction = await Transaction.create({
                  user: userIdObj,
                  type: 'referral',
                  amount: minimumReward, // Use minimum reward amount
                  tokenType: 'BNB',
                  status: 'pending',
                  description: `Referral reward for user ${record.referred} prediction participation`
                });

                console.log(`Created referral reward transaction: ${transaction._id} for ${minimumReward} BNB`);
              } catch (rewardErr) {
                console.error(`Error creating referral reward transaction for user ${record.referred}:`, rewardErr);
              }
            }
          } catch (err) {
            console.error(`Error updating hasPredicted for referral ${record._id}:`, err);
          }
        }
      }
    }

    // Check for any duplicate referral records and clean them up
    const referredUserCounts: { [key: string]: mongoose.Types.ObjectId[] } = {};
    for (const record of referralRecords) {
      const referredId = record.referred.toString();
      if (!referredUserCounts[referredId]) {
        referredUserCounts[referredId] = [];
      }
      // Ensure record._id is treated as a mongoose.Types.ObjectId
      referredUserCounts[referredId].push(record._id as mongoose.Types.ObjectId);
    }

    // Find duplicates (more than one record for the same referred user)
    const duplicates = Object.entries(referredUserCounts)
      .filter(([_, recordIds]) => recordIds.length > 1)
      .map(([referredId, recordIds]) => ({ referredId, recordIds }));

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} users with duplicate referral records`);

      for (const { referredId, recordIds } of duplicates) {
        console.log(`User ${referredId} has ${(recordIds as any[]).length} referral records`);

        // Keep the oldest record and remove the rest
        const records = await Referral.find({ _id: { $in: recordIds } }).sort({ createdAt: 1 });
        const oldestRecord = records[0];
        const duplicateRecords = records.slice(1);

        console.log(`Keeping oldest record ${oldestRecord._id} and removing ${duplicateRecords.length} duplicates`);

        // Remove duplicate records
        for (const record of duplicateRecords) {
          try {
            await Referral.findByIdAndDelete(record._id);
            console.log(`Successfully removed duplicate referral record ${record._id}`);
          } catch (err) {
            console.error(`Error removing duplicate referral record ${record._id}:`, err);
          }
        }
      }
    }

    if (missingReferralRecords.length > 0 || missingReferredByUsers.length > 0 || duplicates.length > 0) {
      console.log(`Fixed ${missingReferralRecords.length + missingReferredByUsers.length + duplicates.length} referral discrepancies`);

      // Verify the fixes
      const updatedReferredUsers = await User.find({ referredBy: userIdObj })
        .select('_id username walletAddress createdAt');
      const updatedReferralRecords = await Referral.find({ referrer: userIdObj });

      console.log(`After fixes: Found ${updatedReferredUsers.length} users with referredBy set to ${userIdObj}`);
      console.log(`After fixes: Found ${updatedReferralRecords.length} referral records with referrer set to ${userIdObj}`);
    } else {
      console.log('No referral discrepancies found');
    }
  } catch (error) {
    console.error('Error ensuring referral consistency:', error);
    // Don't throw the error, just log it
  }
};

// Helper function to process a referral claim
const processClaim = async (
  user: IUser & { _id: mongoose.Types.ObjectId },
  tokenType: string,
  pendingRewards: ITransaction[],
  totalReward: number
): Promise<ITransaction> => {
  try {
    // Mark all transactions as processing to prevent them from being claimed again
    const transactionIds = pendingRewards.map(reward => reward._id);
    const updateResult = await Transaction.updateMany(
      { _id: { $in: transactionIds } },
      {
        status: 'processing',
        description: `${tokenType} referral reward - Awaiting admin approval`
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} of ${transactionIds.length} transactions to processing status`);

    console.log(`Marked ${transactionIds.length} transactions as awaiting admin approval`);

    // Create a claim record in the database
    // We'll use the Transaction model to create a special admin approval transaction
    const claimTransaction = await Transaction.create({
      user: user._id,
      type: 'referral_claim' as ITransaction['type'],
      amount: totalReward,
      tokenType,
      status: 'pending_admin' as ITransaction['status'],
      description: `Claim for ${totalReward} ${tokenType} referral rewards - Awaiting admin approval`,
      metadata: {
        transactionIds, // Store the IDs of the transactions being claimed
        claimedAt: new Date()
      }
    });

    console.log(`Created claim transaction: ${claimTransaction._id}`);

    // Add notification for admin about pending claim
    const adminUsers = await User.find({ isAdmin: true });

    if (adminUsers.length > 0) {
      const adminNotificationPromises = adminUsers.map(admin =>
        User.updateOne(
          { _id: admin._id },
          {
            $push: {
              notifications: {
                userId: admin._id,
                type: 'system',
                title: 'Pending Referral Claim',
                message: `User ${user.username || user.walletAddress} has claimed ${totalReward} ${tokenType} in referral rewards.`,
                read: false,
                timestamp: new Date(),
                data: {
                  claimId: claimTransaction._id,
                  amount: totalReward,
                  tokenType
                }
              }
            }
          }
        )
      );

      await Promise.all(adminNotificationPromises);
      console.log(`Added notifications to ${adminUsers.length} admin users about pending claim`);
    }

    // Add notification to the user about their claim
    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          notifications: {
            userId: user._id,
            type: 'system',
            title: 'Referral Claim Submitted',
            message: `Your claim for ${totalReward} ${tokenType} in referral rewards has been submitted and is awaiting approval.`,
            read: false,
            timestamp: new Date(),
            data: {
              claimId: claimTransaction._id,
              amount: totalReward,
              tokenType,
              status: 'pending'
            }
          }
        }
      }
    );

    console.log(`Added notification to user ${user._id} about their claim submission`);
    console.log(`Claim process completed successfully: ${claimTransaction._id}`);

    return claimTransaction;
  } catch (error) {
    console.error('Error in claim process:', error);

    // Try to revert any changes if possible
    try {
      const transactionIds = pendingRewards.map(reward => reward._id);
      await Transaction.updateMany(
        { _id: { $in: transactionIds } },
        {
          status: 'pending',
          description: `${tokenType} referral reward - Pending`
        }
      );
    } catch (revertError) {
      console.error('Error reverting transaction status:', revertError);
    }

    throw error;
  }
};
