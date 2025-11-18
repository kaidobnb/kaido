import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminSettings from '../models/AdminSettings';
import User from '../models/User';
import Prediction from '../models/Prediction';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Get current price from CoinGecko
const getCurrentPrice = async (symbol: string): Promise<number> => {
  try {
    const coinGeckoId = getCoinGeckoId(symbol);
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`);
    const data = await response.json();
    
    if (data[coinGeckoId] && data[coinGeckoId].usd) {
      return data[coinGeckoId].usd;
    }
    
    throw new Error('No price data available');
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    // Return fallback prices
    const fallbackPrices: Record<string, number> = {
      'BTC': 68000, 'ETH': 3500, 'BNB': 1114, 'SOL': 150, 'ADA': 0.45
    };
    return fallbackPrices[symbol] || 100;
  }
};

// Map symbols to CoinGecko IDs
const getCoinGeckoId = (symbol: string): string => {
  const mapping: Record<string, string> = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana', 'ADA': 'cardano'
  };
  return mapping[symbol] || symbol.toLowerCase();
};

// Generate target price for binary predictions
const generateTargetPrice = (currentPrice: number): number => {
  const changePercent = (Math.random() * 12 + 3) * (Math.random() > 0.5 ? 1 : -1);
  const targetPrice = currentPrice * (1 + changePercent / 100);
  
  if (targetPrice >= 1000) return Math.round(targetPrice);
  if (targetPrice >= 100) return Math.round(targetPrice * 10) / 10;
  if (targetPrice >= 1) return Math.round(targetPrice * 100) / 100;
  return Math.round(targetPrice * 10000) / 10000;
};

// Generate expiry date (1-7 days from now)
const generateExpiryDate = (): Date => {
  const daysFromNow = Math.floor(Math.random() * 7) + 1;
  const hoursFromNow = Math.floor(Math.random() * 24);
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000 + hoursFromNow * 60 * 60 * 1000);
};

const enableAutoPredicionsAndCreate = async () => {
  try {
    await connectDB();

    console.log('Enabling auto-predictions and creating initial predictions...');

    // Find or create admin settings
    let adminSettings = await AdminSettings.findOne({});
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({
        autoApproveClaims: false,
        autoPredictionEnabled: true,
        maxActivePredictions: 20,
        predictionsPerBatch: 5,
        autoPredictionInterval: '0 */6 * * *'
      });
      console.log('Created new admin settings with auto-prediction enabled');
    } else {
      adminSettings.autoPredictionEnabled = true;
      adminSettings.maxActivePredictions = 20;
      adminSettings.predictionsPerBatch = 5;
      await adminSettings.save();
      console.log('Updated admin settings to enable auto-prediction');
    }

    // Find admin user
    const adminUser = await User.findOne({ 
      $or: [
        { walletAddress: process.env.ADMIN_WALLET_ADDRESS },
        { isAdmin: true }
      ]
    });

    let finalAdminUser = adminUser;
    if (!finalAdminUser) {
      console.error('Admin user not found. Creating one...');
      finalAdminUser = await User.create({
        username: 'admin',
        walletAddress: process.env.ADMIN_WALLET_ADDRESS || '0xac01Ee787F54FB1A2D8a08bA597c4b0a75Da83eb',
        isAdmin: true,
        balances: {
          BNB: 1000,
          KAIDO: 10000
        }
      });
      console.log('Created admin user:', finalAdminUser.walletAddress);
    }

    // Check current predictions
    const currentPredictions = await Prediction.countDocuments({ status: 'active' });
    console.log(`Current active predictions: ${currentPredictions}`);

    if (currentPredictions < 5) {
      console.log('Creating initial predictions...');
      
      const assets = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'];
      
      for (const asset of assets) {
        try {
          const currentPrice = await getCurrentPrice(asset);
          const targetPrice = generateTargetPrice(currentPrice);
          const expiryDate = generateExpiryDate();

          const prediction = await Prediction.create({
            title: `Will ${asset} reach $${targetPrice} by ${expiryDate.toLocaleDateString()}?`,
            description: `Predict whether ${asset} will reach the target price of $${targetPrice}. Current price: $${currentPrice}.`,
            type: 'binary',
            tokenType: 'BNB',
            creator: finalAdminUser._id,
            endDate: expiryDate,
            status: 'active',
            stakeAmount: 0.001,
            volume: 0,
            participants: 0,
            choices: [
              { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
              { id: 'no', label: 'No', price: 0.5, percentage: 50 }
            ],
            resolveDetails: `This prediction will be automatically resolved based on ${asset} price data.`,
            asset,
            targetPrice,
            fees: { creation: 0, resolution: 0 }
          });

          console.log(`Created prediction: ${prediction.title}`);
        } catch (error) {
          console.error(`Error creating prediction for ${asset}:`, error);
        }
      }
    }

    console.log('Auto-predictions enabled and initial predictions created!');
    console.log('The system will now automatically create new predictions every 6 hours.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
enableAutoPredicionsAndCreate();
