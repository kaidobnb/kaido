import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prediction from '../models/Prediction';
import Participation from '../models/Participation';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { faker } from '@faker-js/faker';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido';
const ADMIN_USER_ID = '68e94cc2d05b8acf52e8e06c'; // Admin user ID

/**
 * Script to:
 * 1. Reorder predictions (alternating sports/crypto)
 * 2. Add realistic volume and participants
 * 3. Ensure no platform loss (balanced positions)
 */

async function reorderAndAddVolume() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Step 1: Fetch all predictions
    console.log('\n=== STEP 1: Fetching predictions ===');
    const allPredictions = await Prediction.find().sort({ createdAt: -1 });
    
    const cryptoPredictions = allPredictions.filter(p => p.category === 'crypto');
    const sportsPredictions = allPredictions.filter(p => p.category === 'sports');
    
    console.log(`Found ${cryptoPredictions.length} crypto predictions`);
    console.log(`Found ${sportsPredictions.length} sports predictions`);

    // Step 2: Delete all existing participations and transactions
    console.log('\n=== STEP 2: Cleaning up existing participations ===');
    await Participation.deleteMany({});
    await Transaction.deleteMany({ type: 'prediction' });
    console.log('✓ Deleted all existing participations and transactions');

    // Step 3: Reorder predictions (alternating sports/crypto)
    console.log('\n=== STEP 3: Reordering predictions ===');
    const reorderedPredictions: any[] = [];
    const maxLength = Math.max(cryptoPredictions.length, sportsPredictions.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < sportsPredictions.length) {
        reorderedPredictions.push(sportsPredictions[i]);
      }
      if (i < cryptoPredictions.length) {
        reorderedPredictions.push(cryptoPredictions[i]);
      }
    }

    // Update createdAt to reflect new order (newest first)
    const now = new Date();
    console.log('Updating prediction timestamps...');

    // Get the raw MongoDB collection to bypass Mongoose timestamps
    const predictionCollection = mongoose.connection.collection('predictions');

    for (let i = 0; i < reorderedPredictions.length; i++) {
      const newCreatedAt = new Date(now.getTime() - (i * 60000)); // 1 minute apart
      const pred = reorderedPredictions[i];

      // Use raw MongoDB update to bypass Mongoose timestamps
      await predictionCollection.updateOne(
        { _id: pred._id },
        {
          $set: {
            createdAt: newCreatedAt,
            volume: 0,
            participants: 0
          }
        }
      );
      console.log(`  ${i + 1}. [${pred.category.toUpperCase()}] ${pred.title} → ${newCreatedAt.toISOString()}`);
    }
    console.log('✓ Predictions reordered (alternating sports/crypto)');

    // Step 4: Generate fake users for participation
    console.log('\n=== STEP 4: Generating fake users ===');
    const fakeUsers: any[] = [];
    const numFakeUsers = 50;

    for (let i = 0; i < numFakeUsers; i++) {
      const username = faker.internet.userName().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const walletAddress = `0x${faker.string.hexadecimal({ length: 40, casing: 'lower', prefix: '' })}`;
      
      const user = await User.create({
        walletAddress,
        username: `${username}_${i}`,
        displayName: faker.person.fullName(),
        profileCompleted: true,
        balances: {
          BNB: parseFloat((Math.random() * 10 + 1).toFixed(4)), // 1-11 BNB
          KAIDO: parseFloat((Math.random() * 5000 + 500).toFixed(2)) // 500-5500 KAIDO
        }
      });
      fakeUsers.push(user);
    }
    console.log(`✓ Generated ${fakeUsers.length} fake users`);

    // Step 5: Add volume and participants to predictions
    console.log('\n=== STEP 5: Adding volume and participants ===');
    
    for (const prediction of reorderedPredictions) {
      const numParticipants = Math.floor(Math.random() * 8) + 3; // 3-10 participants
      const selectedUsers = faker.helpers.shuffle(fakeUsers).slice(0, numParticipants);
      
      // Determine stake amounts based on token type
      let minStake: number, maxStake: number;
      if (prediction.tokenType === 'BNB') {
        minStake = 0.05;
        maxStake = 0.5;
      } else { // KAIDO
        minStake = 50;
        maxStake = 500;
      }

      // For KAIDO (0% fee), we need to ensure balanced positions to avoid platform loss
      // For BNB (5% fee), the platform is protected by fees
      const isKAIDO = prediction.tokenType === 'KAIDO';
      
      // Track volume per choice to ensure balance
      const choiceVolumes: { [key: string]: number } = {};
      prediction.choices.forEach((choice: any) => {
        choiceVolumes[choice.id] = 0;
      });

      let totalVolume = 0;
      const participations: any[] = [];

      for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i];
        const amount = parseFloat((Math.random() * (maxStake - minStake) + minStake).toFixed(prediction.tokenType === 'BNB' ? 4 : 2));
        
        // For KAIDO, distribute positions evenly to avoid platform loss
        // For BNB, can be more random since platform takes 5% fee
        let position: string;
        if (isKAIDO) {
          // Distribute evenly across choices
          const choiceIds = Object.keys(choiceVolumes);
          const sortedChoices = choiceIds.sort((a, b) => choiceVolumes[a] - choiceVolumes[b]);
          position = sortedChoices[0]; // Pick the choice with least volume
        } else {
          // Random distribution for BNB (platform is protected by fees)
          const randomChoice = faker.helpers.arrayElement(prediction.choices) as any;
          position = randomChoice.id;
        }

        // Calculate fee
        const feePercentage = prediction.tokenType === 'BNB' ? 0.05 : 0;
        const feeAmount = amount * feePercentage;
        const netAmount = amount - feeAmount;

        // Create participation
        const participation = await Participation.create({
          user: user._id,
          prediction: prediction._id,
          position,
          amount: netAmount,
          tokenType: prediction.tokenType,
          status: 'active'
        });
        participations.push(participation);

        // Create transaction
        await Transaction.create({
          user: user._id,
          type: 'prediction',
          amount: netAmount,
          tokenType: prediction.tokenType,
          prediction: prediction._id,
          position,
          status: 'completed',
          description: `Participated in prediction: ${prediction.title}`
        });

        // Update user balance (deduct stake)
        await User.findByIdAndUpdate(user._id, {
          $inc: { [`balances.${prediction.tokenType}`]: -amount }
        });

        choiceVolumes[position] += netAmount;
        totalVolume += netAmount;
      }

      // Update prediction volume and participants
      await Prediction.findByIdAndUpdate(prediction._id, {
        volume: totalVolume,
        participants: participations.length
      });

      // Update choice percentages based on actual volume
      const updatedChoices = prediction.choices.map((choice: any) => {
        const choiceVolume = choiceVolumes[choice.id] || 0;
        const percentage = totalVolume > 0 ? Math.round((choiceVolume / totalVolume) * 100) : choice.percentage;
        const choiceObj = choice.toObject ? choice.toObject() : choice;
        return {
          ...choiceObj,
          percentage
        };
      });

      await Prediction.findByIdAndUpdate(prediction._id, {
        choices: updatedChoices
      });

      console.log(`✓ ${prediction.title}`);
      console.log(`  Token: ${prediction.tokenType}, Volume: ${totalVolume.toFixed(4)}, Participants: ${participations.length}`);
      console.log(`  Distribution: ${Object.entries(choiceVolumes).map(([k, v]) => `${k}: ${((v as number) / totalVolume * 100).toFixed(1)}%`).join(', ')}`);
    }

    // Step 6: Display summary
    console.log('\n=== SUMMARY ===');
    const updatedPredictions = await Prediction.find().sort({ createdAt: -1 });
    
    console.log('\nPrediction Order (newest to oldest):');
    updatedPredictions.forEach((p, i) => {
      console.log(`${i + 1}. [${p.category.toUpperCase()}] ${p.title}`);
      console.log(`   ${p.tokenType}: ${p.volume.toFixed(4)} | ${p.participants} participants`);
    });

    const totalUsers = await User.countDocuments();
    const totalParticipations = await Participation.countDocuments();
    const totalTransactions = await Transaction.countDocuments({ type: 'prediction' });
    
    console.log(`\nTotal Users: ${totalUsers}`);
    console.log(`Total Participations: ${totalParticipations}`);
    console.log(`Total Prediction Transactions: ${totalTransactions}`);
    
    console.log('\n✅ Reordering and volume addition completed successfully!');
    console.log('\nPlatform Safety:');
    console.log('- BNB predictions: Protected by 5% fee');
    console.log('- KAIDO predictions: Balanced positions (no platform loss risk)');
    console.log('- All volumes are realistic for a new platform');

  } catch (error) {
    console.error('Error in reorder and add volume script:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
reorderAndAddVolume()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

