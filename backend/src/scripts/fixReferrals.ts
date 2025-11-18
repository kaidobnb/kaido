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
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

// Fix referral records for all users
const fixAllReferrals = async () => {
  try {
    console.log('Starting referral fix script...');

    // Find all users who have been referred by someone
    const referredUsers = await User.find({ referredBy: { $exists: true, $ne: null } });
    console.log(`Found ${referredUsers.length} users with referredBy set`);

    // Find all referral records
    const referralRecords = await Referral.find({});
    console.log(`Found ${referralRecords.length} referral records`);

    // Create a map of referred user IDs to referrer IDs
    const referredToReferrerMap = new Map();
    for (const user of referredUsers) {
      if (user.referredBy) {
        referredToReferrerMap.set((user._id as mongoose.Types.ObjectId).toString(), (user.referredBy as mongoose.Types.ObjectId).toString());
      }
    }

    // Create a map of existing referral records
    const existingReferrals = new Map();
    for (const record of referralRecords) {
      const key = `${record.referrer.toString()}-${record.referred.toString()}`;
      existingReferrals.set(key, record);
    }

    // Find missing referral records
    let createdCount = 0;
    let updatedCount = 0;

    for (const user of referredUsers) {
      if (!user.referredBy) continue;
      const referrerId = (user.referredBy as mongoose.Types.ObjectId).toString();
      const referredId = (user._id as mongoose.Types.ObjectId).toString();
      const key = `${referrerId}-${referredId}`;

      if (!existingReferrals.has(key)) {
        console.log(`Creating missing referral record for user ${referredId} referred by ${referrerId}`);

        // Check if the user has made any predictions
        const hasParticipated = await Participation.findOne({ user: user._id });
        const hasPredicted = !!hasParticipated;

        // Create the referral record
        const newReferral = await Referral.create({
          referrer: new mongoose.Types.ObjectId(referrerId),
          referred: user._id,
          status: 'active',
          hasPredicted: hasPredicted,
          rewards: { SOL: 0 }
        });

        console.log(`Created referral record: ${newReferral._id}`);
        createdCount++;

        // If the user has made predictions, create a referral reward
        if (hasPredicted) {
          const minimumReward = 0.01; // Minimum reward of 0.01 SOL

          // Check if a reward transaction already exists
          const existingReward = await Transaction.findOne({
            user: new mongoose.Types.ObjectId(referrerId),
            type: 'referral',
            description: { $regex: new RegExp(`${referredId}`) }
          });

          if (!existingReward) {
            const transaction = await Transaction.create({
              user: new mongoose.Types.ObjectId(referrerId),
              type: 'referral',
              amount: minimumReward,
              tokenType: 'SOL',
              status: 'pending',
              description: `Referral reward for user ${referredId} prediction participation`
            });

            console.log(`Created referral reward transaction: ${transaction._id} for ${minimumReward} SOL`);
          }
        }
      } else {
        // Check if the existing record has hasPredicted set correctly
        const record = existingReferrals.get(key);
        if (!record.hasPredicted) {
          const hasParticipated = await Participation.findOne({ user: user._id });
          if (hasParticipated) {
            console.log(`Updating hasPredicted for referral ${record._id}`);
            await Referral.findByIdAndUpdate(record._id, { hasPredicted: true });
            updatedCount++;

            // Create a referral reward if one doesn't exist
            const existingReward = await Transaction.findOne({
              user: new mongoose.Types.ObjectId(referrerId),
              type: 'referral',
              description: { $regex: new RegExp(`${referredId}`) }
            });

            if (!existingReward) {
              const minimumReward = 0.01; // Minimum reward of 0.01 SOL
              const transaction = await Transaction.create({
                user: new mongoose.Types.ObjectId(referrerId),
                type: 'referral',
                amount: minimumReward,
                tokenType: 'SOL',
                status: 'pending',
                description: `Referral reward for user ${referredId} prediction participation`
              });

              console.log(`Created referral reward transaction: ${transaction._id} for ${minimumReward} SOL`);
            }
          }
        }
      }
    }

    console.log(`Created ${createdCount} new referral records`);
    console.log(`Updated ${updatedCount} existing referral records`);

    // Verify the fixes
    const updatedReferralRecords = await Referral.find({});
    console.log(`After fixes: Found ${updatedReferralRecords.length} total referral records`);

    console.log('Referral fix script completed successfully');
  } catch (error) {
    console.error('Error fixing referrals:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
connectDB().then(() => {
  fixAllReferrals().catch(err => {
    console.error('Error running fix script:', err);
    process.exit(1);
  });
});
