import mongoose from 'mongoose';
import User from '../models/User';
import Referral from '../models/Referral';
import Participation from '../models/Participation';
import Transaction from '../models/Transaction';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

// Force fix referrals for a specific user
const forceFixUserReferrals = async (walletAddress: string) => {
  try {
    console.log(`Force fixing referrals for wallet: ${walletAddress}`);

    // Find the user by wallet address
    const user = await User.findOne({ walletAddress });

    if (!user) {
      console.error(`User with wallet address ${walletAddress} not found`);
      return;
    }

    console.log(`Found user: ${user._id}, username: ${user.username || 'unknown'}`);

    // Check if the user has a referral code
    if (!user.referralCode) {
      // Generate a referral code if none exists
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await User.findByIdAndUpdate(user._id, { referralCode });
      console.log(`Generated new referral code: ${referralCode}`);
    } else {
      console.log(`Existing referral code: ${user.referralCode}`);
    }

    // Find users who have used this user's referral code
    const usersWithReferralCode = await User.find({ referralCodeUsed: user.referralCode });
    console.log(`Found ${usersWithReferralCode.length} users who used referral code: ${user.referralCode}`);

    // Ensure all users who used the referral code have referredBy set
    for (const refUser of usersWithReferralCode) {
      if (!refUser.referredBy || refUser.referredBy.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
        console.log(`Setting referredBy for user ${refUser._id} to ${user._id}`);
        await User.findByIdAndUpdate(refUser._id, { referredBy: user._id });
      }
    }

    // Find all users who have this user as their referrer
    const referredUsers = await User.find({ referredBy: user._id });
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
      if (!existingReferralMap.has((refUser._id as mongoose.Types.ObjectId).toString())) {
        console.log(`Creating referral record for user ${refUser._id}`);

        // Check if the user has made any predictions
        const hasParticipated = await Participation.findOne({ user: refUser._id });
        const hasPredicted = !!hasParticipated;

        // Create the referral record
        const newReferral = await Referral.create({
          referrer: user._id,
          referred: refUser._id,
          status: 'active',
          hasPredicted: hasPredicted,
          rewards: { SOL: 0 }
        });

        console.log(`Created referral record: ${newReferral._id}, hasPredicted: ${hasPredicted}`);
        createdCount++;

        // If the user has made predictions, create a referral reward
        if (hasPredicted) {
          const minimumReward = 0.01; // Minimum reward of 0.01 SOL

          // Check if a reward transaction already exists
          const existingReward = await Transaction.findOne({
            user: user._id,
            type: 'referral',
            description: { $regex: new RegExp(`${refUser._id}`) }
          });

          if (!existingReward) {
            const transaction = await Transaction.create({
              user: user._id,
              type: 'referral',
              amount: minimumReward,
              tokenType: 'SOL',
              status: 'pending',
              description: `Referral reward for user ${refUser._id} prediction participation`
            });

            console.log(`Created referral reward transaction: ${transaction._id} for ${minimumReward} SOL`);
          }
        }
      }
    }

    console.log(`Created ${createdCount} new referral records`);

    // Verify the fixes
    const updatedReferralRecords = await Referral.find({ referrer: user._id });
    console.log(`After fixes: Found ${updatedReferralRecords.length} referral records`);

    // Check if there are any users who have used this user's referral code but don't have a referral record
    if (user.referralCode) {
      const usersWithReferralCode = await User.find({ referralCodeUsed: user.referralCode });
      const referralRecordReferredIds = new Set(updatedReferralRecords.map(r => r.referred.toString()));

      for (const refUser of usersWithReferralCode) {
        if (!referralRecordReferredIds.has((refUser._id as mongoose.Types.ObjectId).toString())) {
          console.log(`User ${refUser._id} used referral code but has no referral record, creating one`);

          // Check if the user has made any predictions
          const hasParticipated = await Participation.findOne({ user: refUser._id });
          const hasPredicted = !!hasParticipated;

          // Create the referral record
          const newReferral = await Referral.create({
            referrer: user._id,
            referred: refUser._id,
            status: 'active',
            hasPredicted: hasPredicted,
            rewards: { SOL: 0 }
          });

          console.log(`Created referral record: ${newReferral._id}, hasPredicted: ${hasPredicted}`);

          // Also ensure referredBy is set
          if (!refUser.referredBy || refUser.referredBy.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
            console.log(`Setting referredBy for user ${refUser._id} to ${user._id}`);
            await User.findByIdAndUpdate(refUser._id, { referredBy: user._id });
          }
        }
      }
    }

    // Final verification
    const finalReferralRecords = await Referral.find({ referrer: user._id });
    console.log(`Final count: ${finalReferralRecords.length} referral records`);

  } catch (error) {
    console.error('Error force fixing referrals:', error);
  }
};

// Run the script
const run = async () => {
  const conn = await connectDB();

  try {
    // Get wallet address from command line arguments
    const walletAddress = process.argv[2];

    if (!walletAddress) {
      console.error('Please provide a wallet address as a command line argument');
      process.exit(1);
    }

    await forceFixUserReferrals(walletAddress);
  } catch (error) {
    console.error('Error running script:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Execute the script
run();
