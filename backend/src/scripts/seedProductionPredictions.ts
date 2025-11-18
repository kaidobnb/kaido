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

// Create or get admin user
const getOrCreateAdminUser = async () => {
  try {
    let admin = await User.findOne({ isAdmin: true });
    
    if (!admin) {
      admin = new User({
        walletAddress: process.env.ADMIN_WALLET_ADDRESS || '0xd1AFD60f7B8F4b68C377381E65d8d43Fae0dF7CD',
        username: 'kaido_admin',
        displayName: 'KAIDO Admin',
        profileCompleted: true,
        avatar: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        isAdmin: true,
        balances: {
          BNB: 1000,
          KAIDO: 100000
        }
      });
      await admin.save();
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Found existing admin user');
    }
    
    return admin._id;
  } catch (error) {
    console.error('Error getting/creating admin user:', error);
    throw error;
  }
};

// Generate fake users for participation
const generateFakeUsers = async (count: number): Promise<any[]> => {
  console.log(`\n🤖 Generating ${count} fake users...`);
  const fakeUsers = [];

  for (let i = 0; i < count; i++) {
    const walletAddress = `0x${faker.string.alphanumeric(40)}`;
    const username = faker.internet.userName().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const user = new User({
      walletAddress,
      username: `${username}_${i}`,
      displayName: faker.person.fullName(),
      profileCompleted: true,
      avatar: faker.image.avatar(),
      balances: {
        BNB: faker.number.float({ min: 0.5, max: 100, precision: 0.001 }),
        KAIDO: faker.number.float({ min: 100, max: 10000, precision: 0.1 })
      },
      isAdmin: false
    });

    await user.save();
    fakeUsers.push(user);
  }

  console.log(`✅ Created ${fakeUsers.length} fake users`);
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
  console.log(`\n📊 Seeding participation for: ${prediction.title}`);
  
  // Determine volume range based on token type
  let totalVolume: number;
  if (prediction.tokenType === 'BNB') {
    totalVolume = faker.number.float({ min: 10, max: 50, precision: 0.001 });
  } else if (prediction.tokenType === 'KAIDO') {
    totalVolume = faker.number.float({ min: 1000, max: 5000, precision: 0.1 });
  } else {
    totalVolume = faker.number.float({ min: 20, max: 100, precision: 0.01 });
  }

  console.log(`   Target volume: ${totalVolume} ${prediction.tokenType}`);

  // Determine number of participants (10-30 for realistic activity)
  const participantCount = faker.number.int({ min: 10, max: 30 });
  
  // Shuffle users and select participants
  const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
  const selectedUsers = shuffledUsers.slice(0, participantCount);

  // Split participants between choices
  const choices = prediction.choices || [];
  if (choices.length === 0) {
    console.log('   ⚠️  No choices found, skipping...');
    return;
  }

  // Calculate distribution based on current percentages or evenly
  const choiceDistribution: { [key: string]: number } = {};
  choices.forEach((choice: any) => {
    choiceDistribution[choice.id] = choice.percentage ? choice.percentage / 100 : 1 / choices.length;
  });

  const creationDate = prediction.createdAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let totalActualVolume = 0;
  let participantIndex = 0;

  // Generate participation for each choice
  for (const choice of choices) {
    const choiceVolume = totalVolume * choiceDistribution[choice.id];
    const choiceParticipants = Math.max(1, Math.floor(participantCount * choiceDistribution[choice.id]));
    
    let remainingVolume = choiceVolume;

    for (let i = 0; i < choiceParticipants && participantIndex < selectedUsers.length; i++) {
      const user = selectedUsers[participantIndex++];
      
      // Determine stake amount
      const maxStake = Math.min(remainingVolume, totalVolume / participantCount * 2);
      const minStake = prediction.tokenType === 'BNB' ? 0.01 : 
                       prediction.tokenType === 'KAIDO' ? 10 : 0.1;
      
      const stakeAmount = faker.number.float({ 
        min: minStake, 
        max: Math.max(minStake, maxStake), 
        precision: prediction.tokenType === 'BNB' ? 0.001 : 0.1 
      });

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
      const transaction = new Transaction({
        user: user._id,
        type: 'prediction',
        amount: stakeAmount,
        tokenType: prediction.tokenType,
        prediction: prediction._id,
        position: choice.id,
        status: 'completed',
        createdAt: participationDate
      });

      await transaction.save();

      // Update user balance (simulate they had the tokens)
      await User.findByIdAndUpdate(user._id, {
        $inc: {
          [`balances.${prediction.tokenType}`]: stakeAmount
        }
      });

      remainingVolume -= stakeAmount;
      totalActualVolume += stakeAmount;
    }
  }

  // Update prediction with new volume and participant count
  prediction.volume = totalActualVolume;
  prediction.participants = participantIndex;
  await prediction.save();

  console.log(`   ✅ ${prediction.participants} participants, ${totalActualVolume.toFixed(3)} ${prediction.tokenType} volume`);
};

// Main seeding function
const seedProductionPredictions = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting production prediction seeding...\n');

    // Get or create admin user
    const adminUserId = await getOrCreateAdminUser();

    const now = new Date();
    const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const pastDate = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Check if predictions already exist
    const existingCount = await Prediction.countDocuments();
    console.log(`\n📊 Current predictions in database: ${existingCount}`);

    if (existingCount > 0) {
      console.log('\n⚠️  Predictions already exist. Do you want to:');
      console.log('   1. Add volume to existing predictions');
      console.log('   2. Create new predictions');
      console.log('   3. Both');
      console.log('\nDefaulting to option 3 (Both)...\n');
    }

    // Generate fake users for participation
    const fakeUsers = await generateFakeUsers(100);

    // Add volume to existing active predictions
    const existingPredictions = await Prediction.find({ 
      status: 'active',
      $or: [
        { volume: { $lt: 5 } },
        { participants: { $lt: 5 } }
      ]
    }).limit(20);

    if (existingPredictions.length > 0) {
      console.log(`\n📈 Adding volume to ${existingPredictions.length} existing predictions...\n`);
      for (const prediction of existingPredictions) {
        await generateBalancedParticipation(prediction, fakeUsers);
      }
    }

    // Create new sample predictions
    console.log('\n📝 Creating new sample predictions...\n');

    const samplePredictions = [
      // High-profile crypto predictions
      {
        title: 'Will Bitcoin reach $100,000 by end of 2025?',
        description: 'Predict whether Bitcoin (BTC) will reach or exceed $100,000 USD by December 31, 2025. Resolution based on major exchange data (Binance, Coinbase).',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(60),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.65, percentage: 65 },
          { id: 'no', label: 'No', price: 0.35, percentage: 35 }
        ],
        resolveDetails: 'Resolution based on Binance and Coinbase BTC/USD price data',
        status: 'active',
        asset: 'BTC',
        targetPrice: 100000,
        stakeAmount: 0.01
      },
      {
        title: 'Will Ethereum reach $5,000 in 2025?',
        description: 'Will Ethereum (ETH) reach or exceed $5,000 USD at any point in 2025? Resolution based on major exchange data.',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(90),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.58, percentage: 58 },
          { id: 'no', label: 'No', price: 0.42, percentage: 42 }
        ],
        resolveDetails: 'Resolution based on major exchange ETH/USD price data',
        status: 'active',
        asset: 'ETH',
        targetPrice: 5000,
        stakeAmount: 0.01
      },
      {
        title: 'Will BNB outperform Bitcoin in Q1 2026?',
        description: 'Will BNB have a higher percentage gain than Bitcoin during Q1 2026 (January 1 - March 31)?',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(120),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.45, percentage: 45 },
          { id: 'no', label: 'No', price: 0.55, percentage: 55 }
        ],
        resolveDetails: 'Resolution based on percentage price change comparison',
        status: 'active',
        asset: 'BNB',
        stakeAmount: 0.01
      },
      {
        title: 'Which Layer 2 will have highest TVL by June 2026?',
        description: 'Predict which Ethereum Layer 2 solution will have the highest Total Value Locked (TVL) by June 30, 2026.',
        type: 'multiple',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(210),
        choices: [
          { id: 'arbitrum', label: 'Arbitrum', price: 0.35, percentage: 35 },
          { id: 'optimism', label: 'Optimism', price: 0.28, percentage: 28 },
          { id: 'base', label: 'Base', price: 0.25, percentage: 25 },
          { id: 'polygon', label: 'Polygon zkEVM', price: 0.12, percentage: 12 }
        ],
        resolveDetails: 'Resolution based on L2Beat TVL data',
        status: 'active',
        asset: 'ETH',
        stakeAmount: 0.01
      },
      {
        title: 'Will Solana reach $300 in 2025?',
        description: 'Will Solana (SOL) reach or exceed $300 USD at any point in 2025?',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(150),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.52, percentage: 52 },
          { id: 'no', label: 'No', price: 0.48, percentage: 48 }
        ],
        resolveDetails: 'Resolution based on major exchange SOL/USD price data',
        status: 'active',
        asset: 'SOL',
        targetPrice: 300,
        stakeAmount: 0.1
      },
      {
        title: 'Which altcoin will have highest gains in 2025?',
        description: 'Predict which of these major altcoins will have the highest percentage gain in 2025.',
        type: 'multiple',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(180),
        choices: [
          { id: 'sol', label: 'Solana (SOL)', price: 0.30, percentage: 30 },
          { id: 'ada', label: 'Cardano (ADA)', price: 0.25, percentage: 25 },
          { id: 'avax', label: 'Avalanche (AVAX)', price: 0.22, percentage: 22 },
          { id: 'dot', label: 'Polkadot (DOT)', price: 0.23, percentage: 23 }
        ],
        resolveDetails: 'Resolution based on percentage price change comparison',
        status: 'active',
        asset: 'CRYPTO',
        stakeAmount: 0.1
      },
      {
        title: 'Will XRP win SEC lawsuit appeal by Q2 2026?',
        description: 'Will Ripple (XRP) successfully win or settle the SEC lawsuit appeal by June 30, 2026?',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(200),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.60, percentage: 60 },
          { id: 'no', label: 'No', price: 0.40, percentage: 40 }
        ],
        resolveDetails: 'Resolution based on official court documents and SEC announcements',
        status: 'active',
        asset: 'XRP',
        stakeAmount: 0.01
      },
      {
        title: 'Will a Bitcoin ETF reach $100B AUM in 2025?',
        description: 'Will any Bitcoin spot ETF reach $100 billion in Assets Under Management (AUM) in 2025?',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(240),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.55, percentage: 55 },
          { id: 'no', label: 'No', price: 0.45, percentage: 45 }
        ],
        resolveDetails: 'Resolution based on official ETF AUM data from fund providers',
        status: 'active',
        asset: 'BTC',
        stakeAmount: 0.01
      },
      {
        title: 'Will Cardano launch smart contracts upgrade in 2025?',
        description: 'Will Cardano successfully launch a major smart contracts upgrade (Hydra or similar) in 2025?',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(270),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.48, percentage: 48 },
          { id: 'no', label: 'No', price: 0.52, percentage: 52 }
        ],
        resolveDetails: 'Resolution based on official Cardano Foundation announcements',
        status: 'active',
        asset: 'ADA',
        stakeAmount: 0.1
      },
      {
        title: 'Which DeFi protocol will have highest TVL in 2026?',
        description: 'Predict which DeFi protocol will have the highest Total Value Locked by end of 2026.',
        type: 'multiple',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(300),
        choices: [
          { id: 'aave', label: 'Aave', price: 0.32, percentage: 32 },
          { id: 'uniswap', label: 'Uniswap', price: 0.28, percentage: 28 },
          { id: 'makerdao', label: 'MakerDAO', price: 0.25, percentage: 25 },
          { id: 'curve', label: 'Curve Finance', price: 0.15, percentage: 15 }
        ],
        resolveDetails: 'Resolution based on DeFiLlama TVL data',
        status: 'active',
        asset: 'DEFI',
        stakeAmount: 0.01
      }
    ];

    // Insert new predictions
    const createdPredictions = await Prediction.insertMany(samplePredictions);
    console.log(`✅ Created ${createdPredictions.length} new predictions\n`);

    // Add volume to newly created predictions
    console.log('📈 Adding volume to new predictions...\n');
    for (const prediction of createdPredictions) {
      await generateBalancedParticipation(prediction, fakeUsers);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('='.repeat(60));

    const finalCount = await Prediction.countDocuments();
    const activeCount = await Prediction.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();
    const totalParticipations = await Participation.countDocuments();

    console.log(`\n📊 Database Statistics:`);
    console.log(`   Total Predictions: ${finalCount}`);
    console.log(`   Active Predictions: ${activeCount}`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Total Participations: ${totalParticipations}`);
    console.log('\n✨ Production database is ready!\n');

  } catch (error) {
    console.error('❌ Error seeding predictions:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
};

// Run the script
seedProductionPredictions();

