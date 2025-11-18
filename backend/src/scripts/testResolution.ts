import mongoose from 'mongoose';
import Prediction from '../models/Prediction';
import Participation from '../models/Participation';
import User from '../models/User';
import Transaction from '../models/Transaction';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido';

async function testResolution() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a resolved BNB prediction
    const prediction = await Prediction.findOne({
      status: 'resolved',
      tokenType: 'BNB'
    });

    if (!prediction) {
      console.log('❌ No resolved BNB prediction found');
      process.exit(1);
    }

    console.log(`\n📊 Prediction: ${prediction.title}`);
    console.log(`   ID: ${prediction._id}`);
    console.log(`   Volume: ${prediction.volume} BNB`);
    console.log(`   Resolved Choice: ${prediction.resolvedChoice}`);
    console.log(`   Resolution Fee: ${prediction.fees?.resolution || 0} BNB`);

    // Count transactions by type
    const transactions = await Transaction.find({
      prediction: prediction._id
    });

    const transactionsByType: { [key: string]: number } = {};
    const transactionAmounts: { [key: string]: number } = {};

    transactions.forEach(tx => {
      const key = `${tx.type} - ${tx.description}`;
      transactionsByType[key] = (transactionsByType[key] || 0) + 1;
      transactionAmounts[key] = (transactionAmounts[key] || 0) + tx.amount;
    });

    console.log(`\n💰 Transactions (${transactions.length} total):`);
    Object.entries(transactionsByType).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} transactions, total: ${transactionAmounts[key].toFixed(6)} BNB`);
    });

    // Check for duplicates
    const duplicates = Object.entries(transactionsByType).filter(([key, count]) => 
      count > 1 && key.includes('Creator') || key.includes('Loss Edge') || key.includes('Treasury')
    );

    if (duplicates.length > 0) {
      console.log(`\n❌ DUPLICATE TRANSACTIONS FOUND:`);
      duplicates.forEach(([key, count]) => {
        console.log(`   ${key}: ${count} duplicates`);
      });
    } else {
      console.log(`\n✅ No duplicate fee transactions found`);
    }

    // Check Loss Edge Pool and Treasury
    const lossEdgePool = await User.findOne({ username: 'LossEdgePool' });
    const treasury = await User.findOne({ username: 'KAIDOTreasury' });

    console.log(`\n🏦 Special Accounts:`);
    if (lossEdgePool) {
      console.log(`   Loss Edge Pool: ${(lossEdgePool.balances as any)?.BNB || 0} BNB`);
    } else {
      console.log(`   Loss Edge Pool: NOT CREATED`);
    }

    if (treasury) {
      console.log(`   KAIDO Treasury: ${(treasury.balances as any)?.BNB || 0} BNB`);
    } else {
      console.log(`   KAIDO Treasury: NOT CREATED`);
    }

    // Check participations
    const participations = await Participation.find({
      prediction: prediction._id
    });

    const participationsByStatus: { [key: string]: number } = {};
    participations.forEach(p => {
      participationsByStatus[p.status] = (participationsByStatus[p.status] || 0) + 1;
    });

    console.log(`\n👥 Participations (${participations.length} total):`);
    Object.entries(participationsByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testResolution();

