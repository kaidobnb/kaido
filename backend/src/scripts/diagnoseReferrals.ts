import mongoose from 'mongoose';
import User from '../models/User';
import Referral from '../models/Referral';
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

// Diagnose referral issues for a specific user
const diagnoseUserReferrals = async (walletAddress: string) => {
  try {
    console.log(`Diagnosing referrals for wallet: ${walletAddress}`);

    // Find the user by wallet address
    const user = await User.findOne({ walletAddress });

    if (!user) {
      console.error(`User with wallet address ${walletAddress} not found`);
      return;
    }

    console.log(`Found user: ${user._id}, username: ${user.username || 'unknown'}`);

    // Check if the user has a referral code
    console.log(`Referral code: ${user.referralCode || 'none'}`);

    // Find users who have this user as their referrer (in User collection)
    const referredUsers = await User.find({ referredBy: user._id });
    console.log(`Found ${referredUsers.length} users with referredBy set to this user`);

    // List all referred users
    if (referredUsers.length > 0) {
      console.log('Referred users:');
      referredUsers.forEach((refUser, index) => {
        console.log(`  ${index + 1}. ID: ${refUser._id}, Username: ${refUser.username || 'unknown'}, Wallet: ${refUser.walletAddress || 'unknown'}, Created: ${refUser.createdAt}`);
      });
    }

    // Find referral records where this user is the referrer (in Referral collection)
    const referralRecords = await Referral.find({ referrer: user._id });
    console.log(`Found ${referralRecords.length} referral records with this user as referrer`);

    // List all referral records
    if (referralRecords.length > 0) {
      console.log('Referral records:');
      referralRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record._id}, Referred: ${record.referred}, Status: ${record.status}, HasPredicted: ${record.hasPredicted}, Created: ${record.createdAt}`);
      });
    }

    // Check for discrepancies
    const referredUserIds = new Set(referredUsers.map(u => (u._id as mongoose.Types.ObjectId).toString()));
    const referralRecordReferredIds = new Set(referralRecords.map(r => r.referred.toString()));

    // Find users who have referredBy set but no referral record
    const missingReferralRecords = [];
    for (const refUser of referredUsers) {
      if (!referralRecordReferredIds.has((refUser._id as mongoose.Types.ObjectId).toString())) {
        missingReferralRecords.push(refUser);
      }
    }

    // Find referral records with no corresponding referredBy in User
    const missingReferredByUsers = [];
    for (const record of referralRecords) {
      if (!referredUserIds.has(record.referred.toString())) {
        missingReferredByUsers.push(record);
      }
    }

    console.log(`Found ${missingReferralRecords.length} users missing referral records`);
    console.log(`Found ${missingReferredByUsers.length} referral records missing referredBy`);

    // List users missing referral records
    if (missingReferralRecords.length > 0) {
      console.log('Users missing referral records:');
      missingReferralRecords.forEach((refUser, index) => {
        console.log(`  ${index + 1}. ID: ${refUser._id}, Username: ${refUser.username || 'unknown'}, Wallet: ${refUser.walletAddress || 'unknown'}`);
      });
    }

    // List referral records missing referredBy
    if (missingReferredByUsers.length > 0) {
      console.log('Referral records missing referredBy:');
      missingReferredByUsers.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record._id}, Referred: ${record.referred}`);
      });
    }

    // Check if there are any users who have used this user's referral code
    if (user.referralCode) {
      const usersWithReferralCode = await User.find({ referralCodeUsed: user.referralCode });
      console.log(`Found ${usersWithReferralCode.length} users who used referral code: ${user.referralCode}`);

      // List users who used the referral code
      if (usersWithReferralCode.length > 0) {
        console.log('Users who used referral code:');
        usersWithReferralCode.forEach((refUser, index) => {
          console.log(`  ${index + 1}. ID: ${refUser._id}, Username: ${refUser.username || 'unknown'}, Wallet: ${refUser.walletAddress || 'unknown'}, ReferredBy: ${refUser.referredBy || 'none'}`);
        });
      }
    }

  } catch (error) {
    console.error('Error diagnosing referrals:', error);
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

    await diagnoseUserReferrals(walletAddress);
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
