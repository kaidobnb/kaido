import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { IUser } from '../models/User';
import Transaction from '../models/Transaction';
import Referral, { IReferral } from '../models/Referral';
import {
  generateReferralCode,
  applyReferralCode,
  getReferralStats,
  checkReferralStatus,
  getClaimableReferralRewards,
  claimReferralRewards,
  adminApproveReferralClaim,
  getAdminPendingClaims,
  fixReferralCounts
} from '../controllers/referralController';
import { protect } from '../middleware/authMiddleware';
import { adminOnly } from '../middleware/adminMiddleware';
import { checkReferralCode } from '../middleware/inviteOnlyMiddleware';

const router = express.Router();

// Wrapper function to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply protect middleware to individual routes instead of globally
// This allows more fine-grained control over which routes need which middleware

// Public route to check if a referral code is valid
router.get('/check-code/:referralCode', asyncHandler(checkReferralCode));

router.post('/generate', protect, asyncHandler(generateReferralCode));
router.post('/apply', protect, asyncHandler(applyReferralCode));
router.get('/stats', protect, asyncHandler(getReferralStats));
router.get('/check', protect, asyncHandler(checkReferralStatus));

// Force fix referrals for the current user
router.get('/force-fix', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser & { _id: mongoose.Types.ObjectId };

    console.log(`Force fixing referrals for user: ${user._id}, username: ${user.username || 'unknown'}`);

    // Find all users who have this user as their referrer
    const referredUsers = await mongoose.model('User').find({ referredBy: user._id })
      .select('_id username walletAddress createdAt');

    console.log(`Found ${referredUsers.length} users with referredBy set to this user`);

    // Find existing referral records
    const existingReferralRecords = await Referral.find({ referrer: user._id });
    console.log(`Found ${existingReferralRecords.length} existing referral records`);

    // Create a map of existing referral records
    const existingReferralMap = new Map();
    for (const record of existingReferralRecords) {
      existingReferralMap.set(record.referred.toString(), record);
    }

    // Create missing referral records
    let createdCount = 0;
    for (const refUser of referredUsers) {
      if (!existingReferralMap.has(refUser._id.toString())) {
        console.log(`Creating referral record for user ${refUser._id}`);

        // Check if the user has made any predictions
        const hasParticipated = await mongoose.model('Participation').findOne({ user: refUser._id });
        const hasPredicted = !!hasParticipated;

        // Create the referral record
        const newReferral = await Referral.create({
          referrer: user._id,
          referred: refUser._id,
          status: 'active',
          hasPredicted: hasPredicted,
          rewards: { SOL: 0, BNB: 0, KAIDO: 0 }
        });

        console.log(`Created referral record: ${newReferral._id}, hasPredicted: ${hasPredicted}`);
        createdCount++;
      }
    }

    // Check if there are any users who have used this user's referral code but don't have a referral record
    if (user.referralCode) {
      const usersWithReferralCode = await mongoose.model('User').find({ referralCodeUsed: user.referralCode });
      console.log(`Found ${usersWithReferralCode.length} users who used referral code: ${user.referralCode}`);

      for (const refUser of usersWithReferralCode) {
        // Ensure referredBy is set
        if (!refUser.referredBy || refUser.referredBy.toString() !== user._id.toString()) {
          console.log(`Setting referredBy for user ${refUser._id} to ${user._id}`);
          await mongoose.model('User').findByIdAndUpdate(refUser._id, { referredBy: user._id });
        }

        // Create referral record if it doesn't exist
        if (!existingReferralMap.has(refUser._id.toString())) {
          console.log(`Creating referral record for user ${refUser._id} who used referral code`);

          // Check if the user has made any predictions
          const hasParticipated = await mongoose.model('Participation').findOne({ user: refUser._id });
          const hasPredicted = !!hasParticipated;

          // Create the referral record
          const newReferral = await Referral.create({
            referrer: user._id,
            referred: refUser._id,
            status: 'active',
            hasPredicted: hasPredicted,
            rewards: { SOL: 0, BNB: 0, KAIDO: 0 }
          });

          console.log(`Created referral record: ${newReferral._id}, hasPredicted: ${hasPredicted}`);
          createdCount++;
        }
      }
    }

    // Get updated counts
    const updatedReferralRecords = await Referral.find({ referrer: user._id });
    const updatedReferredUsers = await mongoose.model('User').find({ referredBy: user._id });

    res.status(200).json({
      success: true,
      message: `Force fixed referrals. Created ${createdCount} new referral records.`,
      referralCount: updatedReferralRecords.length,
      referredUsersCount: updatedReferredUsers.length
    });
  } catch (error) {
    console.error('Error force fixing referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}));

// Check for new referrals (not rewards, just referrals)
router.get('/check-new-referrals', asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;

    if (!user || !user._id) {
      console.error('No user found in request or user has no ID');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        hasNewReferrals: false,
        count: 0
      });
    }

    console.log(`Checking for new referrals for user: ${user._id}, username: ${user.username || 'unknown'}`);

    try {
      // First, ensure the user ID is a valid ObjectId
      const userId = typeof user._id === 'string' ? new mongoose.Types.ObjectId(user._id) : user._id;
      console.log(`Using ObjectId: ${userId.toString()} for referral queries`);

      // Call the fixReferralCounts function to ensure referral counts are correct
      try {
        // Convert to string and back to ObjectId to ensure it's a valid ObjectId
        const userIdStr = userId.toString();
        const validUserId = new mongoose.Types.ObjectId(userIdStr);
        await fixReferralCounts(validUserId);
      } catch (error) {
        console.error('Error converting userId for fixReferralCounts:', error);
      }

      // Get all referral records for this user
      const referralRecords = await Referral.find({ referrer: userId })
        .populate('referred', '_id username walletAddress createdAt')
        .sort({ createdAt: -1 });

      console.log(`Found ${referralRecords.length} total referrals for user ${userId}`);

      // Get all users who have this user as their referrer
      const referredUsers = await mongoose.model('User').find({ referredBy: userId })
        .select('_id username walletAddress createdAt')
        .sort({ createdAt: -1 });

      console.log(`Found ${referredUsers.length} users with referredBy set to ${userId}`);

      // Check for discrepancies
      const referralRecordReferredIds = new Set(referralRecords.map(r => (r.referred as any)._id.toString()));
      const referredUserIds = new Set(referredUsers.map(u => u._id.toString()));

      // Find referral records with no corresponding referredBy in User
      const missingReferredByUsers = [];
      for (const record of referralRecords) {
        if (!referredUserIds.has((record.referred as any)._id.toString())) {
          missingReferredByUsers.push(record);
        }
      }

      // Find users who have referredBy set but no referral record
      const missingReferralRecords = [];
      for (const refUser of referredUsers) {
        if (!referralRecordReferredIds.has(refUser._id.toString())) {
          missingReferralRecords.push(refUser);
        }
      }

      console.log(`Discrepancy check: ${missingReferredByUsers.length} users missing referredBy, ${missingReferralRecords.length} missing referral records`);

      // Fix any discrepancies
      let fixedCount = 0;

      // Fix missing referredBy fields
      for (const record of missingReferredByUsers) {
        const referredUser = await mongoose.model('User').findById((record.referred as any)._id);
        if (referredUser && !referredUser.referredBy) {
          console.log(`Fixing missing referredBy for user ${(record.referred as any)._id}`);
          await mongoose.model('User').findByIdAndUpdate(
            (record.referred as any)._id,
            { referredBy: userId }
          );
          fixedCount++;
        }
      }

      // Fix missing referral records
      for (const refUser of missingReferralRecords) {
        console.log(`Creating missing referral record for user ${refUser._id}`);

        // Check if the user exists before creating a referral record
        const userExists = await mongoose.model('User').findById(refUser._id);
        if (!userExists) {
          console.log(`User ${refUser._id} does not exist, skipping referral record creation`);
          continue;
        }

        try {
          // Check if the user has made any predictions
          const hasParticipated = await mongoose.model('Participation').findOne({ user: refUser._id });
          const hasPredicted = !!hasParticipated;

          if (hasPredicted) {
            console.log(`User ${refUser._id} has made predictions, setting hasPredicted=true`);
          }

          const newReferral = await Referral.create({
            referrer: userId,
            referred: refUser._id,
            status: 'active',
            hasPredicted: hasPredicted, // Set based on whether they've made predictions
            rewards: { SOL: 0, BNB: 0, KAIDO: 0 }
          });
          console.log(`Successfully created referral record: ${newReferral._id}, hasPredicted=${hasPredicted}`);

          // If the user has made predictions, create a referral reward transaction
          if (hasPredicted) {
            try {
              // Calculate referral reward for KAIDO tokens
              const minimumReward = 100; // Minimum reward of 100 KAIDO tokens
              const tokenType = 'KAIDO';

              // Create a transaction record for the referral reward
              const transaction = await Transaction.create({
                user: userId,
                type: 'referral',
                amount: minimumReward, // Use minimum reward amount
                tokenType: tokenType,
                status: 'pending',
                referredUser: refUser._id, // Store the referred user ID
                description: `Referral reward for user ${refUser._id} prediction participation`
              });

              console.log(`Created referral reward transaction: ${transaction._id} for ${minimumReward} ${tokenType}`);
            } catch (rewardErr) {
              console.error(`Error creating referral reward transaction for user ${refUser._id}:`, rewardErr);
            }
          }

          fixedCount++;
        } catch (err) {
          console.error(`Error creating referral record for user ${refUser._id}:`, err);
        }
      }

      // Check for users who have participated in predictions but don't have hasPredicted set to true
      const referralRecordsWithPredictions = await Referral.find({
        referrer: userId,
        hasPredicted: false
      });

      if (referralRecordsWithPredictions.length > 0) {
        console.log(`Found ${referralRecordsWithPredictions.length} referral records that might need hasPredicted update`);

        for (const record of referralRecordsWithPredictions) {
          // Check if the referred user has participated in any predictions
          const hasParticipated = await mongoose.model('Participation').findOne({ user: record.referred });

          if (hasParticipated) {
            console.log(`User ${record.referred} has participated in predictions but hasPredicted is false, updating`);
            try {
              await Referral.findByIdAndUpdate(
                record._id,
                { hasPredicted: true }
              );
              console.log(`Successfully updated hasPredicted for referral ${record._id}`);
              fixedCount++;
            } catch (err) {
              console.error(`Error updating hasPredicted for referral ${record._id}:`, err);
            }
          }
        }
      }

      // After fixing discrepancies, refresh the data to ensure we have the most up-to-date information
      let updatedReferralRecords = referralRecords;
      let updatedReferredUsers = referredUsers;

      if (fixedCount > 0) {
        // Refresh the referral records
        updatedReferralRecords = await Referral.find({ referrer: userId })
          .populate('referred', '_id username walletAddress createdAt')
          .sort({ createdAt: -1 });

        // Refresh the referred users
        updatedReferredUsers = await mongoose.model('User').find({ referredBy: userId })
          .select('_id username walletAddress createdAt')
          .sort({ createdAt: -1 });

        console.log(`After fixing discrepancies: Found ${updatedReferralRecords.length} referral records and ${updatedReferredUsers.length} referred users`);
      }

      // Get recent referrals (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentReferrals = updatedReferralRecords.filter(r =>
        new Date((r as any).createdAt) >= oneDayAgo
      );

      console.log(`Found ${recentReferrals.length} recent referrals (created in the last 24 hours)`);

      // Ensure we're using the most accurate count (should be the same after fixes)
      const totalReferrals = Math.max(updatedReferralRecords.length, updatedReferredUsers.length);

      return res.status(200).json({
        success: true,
        totalReferrals: totalReferrals,
        hasNewReferrals: recentReferrals.length > 0,
        recentReferralsCount: recentReferrals.length,
        discrepanciesFixed: fixedCount,
        recentReferrals: recentReferrals.map(r => ({
          id: r._id,
          username: (r.referred as any).username || 'Anonymous',
          walletAddress: (r.referred as any).walletAddress,
          joinedAt: (r.referred as any).createdAt,
          hasPredicted: r.hasPredicted
        })),
        referredUsers: updatedReferredUsers.map(user => ({
          id: user._id,
          username: user.username || 'Anonymous',
          walletAddress: user.walletAddress,
          joinedAt: user.createdAt
        }))
      });
    } catch (dbError) {
      console.error('Database error when checking for referrals:', dbError);
      return res.status(200).json({
        success: false,
        message: 'Error checking for referrals',
        hasNewReferrals: false,
        count: 0,
        totalReferrals: 0
      });
    }
  } catch (error) {
    console.error('Error checking for new referrals:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      hasNewReferrals: false,
      count: 0,
      totalReferrals: 0
    });
  }
}));
router.get('/claimable', protect, asyncHandler(getClaimableReferralRewards));
router.post('/claim', protect, asyncHandler(claimReferralRewards));

// Check for new referral rewards
router.get('/check-new-rewards', protect, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;

    if (!user || !user._id) {
      console.error('No user found in request or user has no ID');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        hasNewRewards: false,
        count: 0
      });
    }

    console.log(`Checking for new referral rewards for user: ${user._id}, username: ${user.username || 'unknown'}`);

    try {
      // First, ensure the user ID is a valid ObjectId
      const userId = typeof user._id === 'string' ? new mongoose.Types.ObjectId(user._id) : user._id;
      console.log(`Using ObjectId: ${userId.toString()} for referral reward queries`);

      // Ensure userId is a valid ObjectId
      try {
        // Convert to string and back to ObjectId to ensure it's a valid ObjectId
        const userIdStr = userId.toString();
        const validUserId = new mongoose.Types.ObjectId(userIdStr);
        // Use validUserId for subsequent operations if needed
      } catch (error) {
        console.error('Error converting userId:', error);
      }

      // First check for any pending referral transactions regardless of creation date
      const allPendingRewards = await Transaction.find({
        user: userId,
        type: 'referral',
        status: 'pending'
      }).countDocuments();

      console.log(`User ${userId} has ${allPendingRewards} total pending referral rewards`);

      // Check if user has any referred users
      const referredUsers = await Referral.find({ referrer: userId }).populate('referred', 'username');
      console.log(`Found referred users: ${referredUsers.length}`);

      // Log each referred user
      referredUsers.forEach((ref: IReferral, index: number) => {
        console.log(`Referred user ${index + 1}: {
          id: ${ref.referred._id},
          username: ${(ref.referred as any).username || 'unknown'},
          hasPredicted: ${ref.hasPredicted},
          status: ${ref.status},
          rewards: ${JSON.stringify(ref.rewards)}
        }`);
      });

      // Check if any referred users have made predictions
      const predictingReferrals = await Referral.find({
        referrer: userId,
        hasPredicted: true
      }).countDocuments();
      console.log(`User has ${predictingReferrals} referrals who have made predictions`);

      // Then find recent pending referral transactions (created in the last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      console.log(`Looking for rewards created after: ${oneDayAgo.toISOString()}`);

      const recentRewards = await Transaction.find({
        user: userId,
        type: 'referral',
        status: 'pending',
        createdAt: { $gte: oneDayAgo }
      }).countDocuments();

      console.log(`Found ${recentRewards} recent referral rewards (created in the last 24 hours)`);

      // If there are no recent rewards but there are total pending rewards,
      // log this information as it might indicate the user has older unclaimed rewards
      if (recentRewards === 0 && allPendingRewards > 0) {
        console.log(`User ${userId} has ${allPendingRewards} older pending rewards that should be shown`);
      }

      // Check if there are any referral transactions with other statuses
      const otherStatusTransactions = await Transaction.find({
        user: userId,
        type: 'referral',
        status: { $ne: 'pending' }
      }).countDocuments();
      console.log(`User has ${otherStatusTransactions} referral transactions with status other than 'pending'`);

      // Check if there are any participations from referred users
      const referredUserIds = referredUsers.map((ref: IReferral) => ref.referred._id);
      if (referredUserIds.length > 0) {
        const participations = await mongoose.model('Participation').find({
          user: { $in: referredUserIds }
        }).countDocuments();
        console.log(`Found ${participations} participations from referred users`);
      }

      return res.status(200).json({
        success: true,
        hasNewRewards: recentRewards > 0,
        count: recentRewards,
        totalPendingRewards: allPendingRewards,
        hasPendingRewards: allPendingRewards > 0,
        referredUsersCount: referredUsers.length,
        predictingReferralsCount: predictingReferrals
      });
    } catch (dbError) {
      console.error('Database error when checking for referral rewards:', dbError);
      return res.status(200).json({
        success: false,
        message: 'Error checking for rewards',
        hasNewRewards: false,
        count: 0,
        totalPendingRewards: 0,
        hasPendingRewards: false,
        referredUsersCount: 0,
        predictingReferralsCount: 0
      });
    }
  } catch (error) {
    console.error('Error checking for new referral rewards:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      hasNewRewards: false,
      count: 0,
      totalPendingRewards: 0,
      hasPendingRewards: false,
      referredUsersCount: 0,
      predictingReferralsCount: 0
    });
  }
}));

// Admin routes - protected with both auth and admin middleware
router.get('/admin/pending-claims', protect, adminOnly, asyncHandler(getAdminPendingClaims));
router.post('/admin/approve-claim', protect, adminOnly, asyncHandler(adminApproveReferralClaim));

export default router;
