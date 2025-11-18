import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import Prediction from '../models/Prediction';
import User from '../models/User';
import Participation from '../models/Participation';
import Transaction from '../models/Transaction';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Generate fake users for participation
const generateFakeUsers = async (count: number): Promise<any[]> => {
  const fakeUsers = [];

  for (let i = 0; i < count; i++) {
    const walletAddress = `0x${faker.string.alphanumeric(40)}`;
    const username = faker.internet.userName();

    const user = new User({
      walletAddress,
      username,
      displayName: username,
      profileCompleted: true,
      avatar: faker.image.avatar(),
      balances: {
        BNB: faker.number.float({ min: 1, max: 50, precision: 0.001 }),
        KAIDO: faker.number.float({ min: 100, max: 5000, precision: 0.1 })
      },
      isAdmin: false
    });

    await user.save();
    fakeUsers.push(user);
  }

  return fakeUsers;
};

// Generate random timestamp between prediction creation and now
const generateRandomTimestamp = (creationDate: Date): Date => {
  const now = new Date();
  const timeDiff = now.getTime() - creationDate.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(creationDate.getTime() + randomTime);
};

// Generate balanced participation for a prediction
const generateBalancedParticipation = async (prediction: any, users: any[]) => {
  console.log(`\nSeeding participation for: ${prediction.title}`);
  console.log(`Token type: ${prediction.tokenType}`);
  
  // Determine volume range based on token type
  let totalVolume: number;
  if (prediction.tokenType === 'BNB') {
    totalVolume = faker.number.float({ min: 5, max: 25, precision: 0.001 });
  } else if (prediction.tokenType === 'KAIDO') {
    totalVolume = faker.number.float({ min: 500, max: 2500, precision: 0.1 });
  } else {
    totalVolume = faker.number.float({ min: 10, max: 50, precision: 0.01 });
  }

  console.log(`Target total volume: ${totalVolume} ${prediction.tokenType}`);

  // Determine number of participants (5-15 for realistic activity)
  const participantCount = faker.number.int({ min: 5, max: 15 });
  
  // Shuffle users and select participants
  const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
  const selectedUsers = shuffledUsers.slice(0, participantCount);

  // Split participants between choices
  const choices = prediction.choices || [];
  if (choices.length === 0) {
    console.log('No choices found for prediction, skipping...');
    return;
  }

  // For binary predictions, split roughly 60/40 to make it more interesting
  let choiceDistribution: { [key: string]: number } = {};
  
  if (choices.length === 2) {
    // Binary prediction - create slight bias
    const bias = Math.random() > 0.5 ? 0.6 : 0.4;
    choiceDistribution[choices[0].id] = bias;
    choiceDistribution[choices[1].id] = 1 - bias;
  } else {
    // Multi-choice - distribute more evenly with some randomness
    const weights = choices.map(() => Math.random() + 0.5);
    const totalWeight = weights.reduce((sum: number, w: number) => sum + w, 0);
    choices.forEach((choice: any, index: number) => {
      choiceDistribution[choice.id] = weights[index] / totalWeight;
    });
  }

  console.log('Choice distribution:', choiceDistribution);

  // Get the creation date of the prediction
  const creationDate = prediction.createdAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let totalActualVolume = 0;
  let participantIndex = 0;

  // Generate participation for each choice
  for (const choice of choices) {
    const choiceVolume = totalVolume * choiceDistribution[choice.id];
    const choiceParticipants = Math.max(1, Math.floor(participantCount * choiceDistribution[choice.id]));
    
    console.log(`Choice ${choice.label}: ${choiceVolume.toFixed(3)} ${prediction.tokenType} from ${choiceParticipants} participants`);

    let remainingVolume = choiceVolume;
    
    for (let i = 0; i < choiceParticipants && participantIndex < selectedUsers.length; i++) {
      const user = selectedUsers[participantIndex++];
      
      // Determine stake amount for this user
      const isLastParticipant = i === choiceParticipants - 1;
      let stakeAmount: number;
      
      if (isLastParticipant) {
        // Last participant gets remaining volume
        stakeAmount = remainingVolume;
      } else {
        // Random stake amount (10-40% of remaining volume)
        const maxStake = remainingVolume * 0.4;
        const minStake = prediction.tokenType === 'BNB' ? 0.001 : 
                        prediction.tokenType === 'KAIDO' ? 10 : 0.01;
        stakeAmount = faker.number.float({ 
          min: Math.max(minStake, remainingVolume * 0.1), 
          max: Math.max(minStake, maxStake), 
          precision: prediction.tokenType === 'BNB' ? 0.001 : 
                    prediction.tokenType === 'KAIDO' ? 0.1 : 0.01
        });
      }

      // Generate random timestamp for this participation
      const participationDate = generateRandomTimestamp(creationDate);

      // Create participation record
      const participation = new Participation({
        user: user._id,
        prediction: prediction._id,
        position: choice.id,
        amount: stakeAmount,
        tokenType: prediction.tokenType,
        status: 'active',
        createdAt: participationDate
      });

      await participation.save();

      // Create transaction record
      await Transaction.create({
        user: user._id,
        type: 'prediction',
        amount: stakeAmount,
        tokenType: prediction.tokenType,
        prediction: prediction._id,
        description: `Staked on ${choice.label}`,
        status: 'completed',
        createdAt: participationDate,
        txHash: `0x${faker.string.alphanumeric(64)}`
      });

      // Update user balance (simulate they had the tokens)
      await User.findByIdAndUpdate(user._id, {
        $inc: {
          [`balances.${prediction.tokenType}`]: stakeAmount
        }
      });

      remainingVolume -= stakeAmount;
      totalActualVolume += stakeAmount;
      
      console.log(`  ${user.username}: ${stakeAmount.toFixed(3)} ${prediction.tokenType} on ${choice.label}`);
    }
  }

  // Update prediction with new volume and participant count
  prediction.volume = totalActualVolume;
  prediction.participants = participantIndex;
  await prediction.save();

  console.log(`✅ Seeded ${prediction.participants} participants with ${totalActualVolume.toFixed(3)} ${prediction.tokenType} total volume`);
};

// Main seeding function
const seedActivePredictions = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting to seed active predictions with participation...\n');

    // Get all active predictions that have low or no volume
    const activePredictions = await Prediction.find({ 
      status: 'active',
      $or: [
        { volume: { $lt: 1 } }, // Less than 1 unit of volume
        { participants: { $lt: 3 } }, // Less than 3 participants
        { volume: { $exists: false } }, // No volume field
        { participants: { $exists: false } } // No participants field
      ]
    });

    if (activePredictions.length === 0) {
      console.log('No active predictions found that need seeding.');
      return;
    }

    console.log(`Found ${activePredictions.length} active predictions to seed:`);
    activePredictions.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title} (${p.tokenType}) - Current volume: ${p.volume || 0}, Participants: ${p.participants || 0}`);
    });

    // Generate fake users for participation (enough for all predictions)
    console.log('\n🤖 Generating fake users for participation...');
    const fakeUsers = await generateFakeUsers(50);
    console.log(`Created ${fakeUsers.length} fake users`);

    // Seed each prediction
    for (const prediction of activePredictions) {
      await generateBalancedParticipation(prediction, fakeUsers);
    }

    console.log('\n🎉 Successfully seeded all active predictions with realistic participation!');
    console.log('\nSummary:');
    
    // Show final stats
    for (const prediction of activePredictions) {
      const updated = await Prediction.findById(prediction._id);
      if (updated) {
        console.log(`📊 ${updated.title}: ${updated.volume.toFixed(3)} ${updated.tokenType} volume, ${updated.participants} participants`);
      }
    }

  } catch (error) {
    console.error('❌ Error seeding predictions:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
seedActivePredictions();
