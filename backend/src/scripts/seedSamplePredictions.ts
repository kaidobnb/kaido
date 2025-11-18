import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prediction from '../models/Prediction';
import User from '../models/User';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27018/kaido');
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
        walletAddress: '0xadmin1234567890123456789012345678901234',
        username: 'admin_predictor',
        displayName: 'Admin Predictor',
        profileCompleted: true,
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
        isAdmin: true,
        balances: {
          SOL: 1000,
          SOLY: 50000
        }
      });
      await admin.save();
      console.log('Created admin user');
    }
    
    return admin._id;
  } catch (error) {
    console.error('Error getting/creating admin user:', error);
    throw error;
  }
};

// Seed sample predictions
const seedSamplePredictions = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting to seed sample predictions...\n');
    
    // Get or create admin user
    const adminUserId = await getOrCreateAdminUser();
    
    // Clear existing predictions (optional - comment out to keep existing)
    // await Prediction.deleteMany({});
    // console.log('Cleared existing predictions\n');
    
    const now = new Date();
    const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const pastDate = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const samplePredictions = [
      // Binary Predictions
      {
        title: 'Will Bitcoin reach $100,000 by December 31, 2025?',
        description: 'This prediction will resolve YES if Bitcoin (BTC) reaches or exceeds $100,000 USD at any point before December 31, 2025. Resolution will be based on Binance BTC/USDT price data.',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(70),
        volume: 45230.5,
        participants: 1247,
        choices: [
          { id: 'yes', label: 'Yes', price: 0.72, percentage: 72 },
          { id: 'no', label: 'No', price: 0.28, percentage: 28 }
        ],
        resolveDetails: 'Resolution based on Binance BTC/USDT 1-minute candle data',
        status: 'active',
        asset: 'BTC',
        targetPrice: 100000,
        stakeAmount: 0.1
      },
      {
        title: 'Did Ethereum outperform Bitcoin in Q3 2025?',
        description: 'This prediction has been resolved. It asked whether Ethereum would have a higher percentage gain than Bitcoin during Q3 2025.',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        createdAt: pastDate(90),
        endDate: pastDate(5),
        volume: 32150.75,
        participants: 892,
        choices: [
          { id: 'yes', label: 'Yes', price: 0.45, percentage: 45 },
          { id: 'no', label: 'No', price: 0.55, percentage: 55 }
        ],
        resolveDetails: 'Resolved based on Q3 2025 performance data',
        status: 'resolved',
        resolvedChoice: 'no',
        resolvedAt: pastDate(5),
        resolvedBy: 'api',
        asset: 'ETH',
        stakeAmount: 0.1
      },
      // Multiple Choice Predictions
      {
        title: 'Which altcoin will have the highest gains in November 2025?',
        description: 'Predict which of these altcoins will have the highest percentage gain during November 2025. Options: Solana (SOL), Cardano (ADA), Polkadot (DOT), or Ripple (XRP).',
        type: 'multiple',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(40),
        volume: 28900.25,
        participants: 756,
        choices: [
          { id: 'sol', label: 'Solana (SOL)', price: 0.35, percentage: 35 },
          { id: 'ada', label: 'Cardano (ADA)', price: 0.25, percentage: 25 },
          { id: 'dot', label: 'Polkadot (DOT)', price: 0.28, percentage: 28 },
          { id: 'xrp', label: 'Ripple (XRP)', price: 0.12, percentage: 12 }
        ],
        resolveDetails: 'Resolution based on CoinGecko price data for November 2025',
        status: 'active',
        asset: 'ALTCOINS',
        stakeAmount: 0.05
      },
      {
        title: 'What will be the top performing sector in crypto for Q4 2025?',
        description: 'This prediction has been resolved. It asked which sector would lead the crypto market in Q4 2025.',
        type: 'multiple',
        category: 'crypto',
        tokenType: 'BNB',
        creator: adminUserId,
        createdAt: pastDate(120),
        endDate: pastDate(10),
        volume: 51200.0,
        participants: 1523,
        choices: [
          { id: 'defi', label: 'DeFi', price: 0.30, percentage: 30 },
          { id: 'nft', label: 'NFT & Gaming', price: 0.15, percentage: 15 },
          { id: 'layer2', label: 'Layer 2 Solutions', price: 0.40, percentage: 40 },
          { id: 'ai', label: 'AI & ML Tokens', price: 0.15, percentage: 15 }
        ],
        resolveDetails: 'Resolved based on sector performance metrics',
        status: 'resolved',
        resolvedChoice: 'layer2',
        resolvedAt: pastDate(10),
        resolvedBy: 'admin',
        asset: 'SECTORS',
        stakeAmount: 0.1
      },
      // Sports Predictions
      {
        title: 'Will Manchester City win the Premier League 2025-26 season?',
        description: 'Predict whether Manchester City will win the English Premier League title in the 2025-26 season. Resolution will be based on final league standings.',
        type: 'binary',
        category: 'sports',
        tokenType: 'BNB',
        creator: adminUserId,
        endDate: futureDate(180),
        volume: 67450.0,
        participants: 2341,
        choices: [
          { id: 'yes', label: 'Yes', price: 0.58, percentage: 58 },
          { id: 'no', label: 'No', price: 0.42, percentage: 42 }
        ],
        resolveDetails: 'Resolution based on official Premier League final standings',
        status: 'active',
        asset: 'MANCHESTER_CITY',
        stakeAmount: 0.1,
        sportsData: {
          matchId: 'pl_2025_26',
          competitionId: 'premier_league',
          competitionName: 'English Premier League 2025-26',
          homeTeam: {
            id: 'manchester_city',
            name: 'Manchester City',
            country: 'England'
          },
          awayTeam: {
            id: 'league_avg',
            name: 'League Average',
            country: 'England'
          },
          scheduledDate: futureDate(180),
          sport: 'soccer',
          autoResolve: false,
          resolutionCriteria: 'league_winner'
        }
      },
      {
        title: 'Did Argentina win the Copa America 2025?',
        description: 'This prediction has been resolved. It asked whether Argentina would win the Copa America 2025 tournament.',
        type: 'binary',
        category: 'sports',
        tokenType: 'BNB',
        creator: adminUserId,
        createdAt: pastDate(150),
        endDate: pastDate(20),
        volume: 89320.5,
        participants: 3156,
        choices: [
          { id: 'yes', label: 'Yes', price: 0.68, percentage: 68 },
          { id: 'no', label: 'No', price: 0.32, percentage: 32 }
        ],
        resolveDetails: 'Resolved based on Copa America 2025 final results',
        status: 'resolved',
        resolvedChoice: 'yes',
        resolvedAt: pastDate(20),
        resolvedBy: 'api',
        asset: 'ARGENTINA',
        stakeAmount: 0.1,
        sportsData: {
          matchId: 'copa_2025_final',
          competitionId: 'copa_america',
          competitionName: 'Copa America 2025',
          homeTeam: {
            id: 'argentina',
            name: 'Argentina',
            country: 'Argentina'
          },
          awayTeam: {
            id: 'tournament',
            name: 'Tournament',
            country: 'South America'
          },
          scheduledDate: pastDate(20),
          sport: 'soccer',
          autoResolve: true,
          resolutionCriteria: 'tournament_winner'
        }
      }
    ];
    
    // Insert predictions
    const createdPredictions = await Prediction.insertMany(samplePredictions);
    console.log(`✅ Successfully seeded ${createdPredictions.length} sample predictions!\n`);
    
    // Display created predictions
    createdPredictions.forEach((pred, index) => {
      console.log(`${index + 1}. ${pred.title}`);
      console.log(`   Type: ${pred.type} | Category: ${pred.category} | Status: ${pred.status}`);
      console.log(`   Volume: ${pred.volume} ${pred.tokenType} | Participants: ${pred.participants}\n`);
    });
    
  } catch (error) {
    console.error('Error seeding predictions:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
};

// Run the script
seedSamplePredictions();

