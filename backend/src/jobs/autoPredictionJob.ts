import { CronJob } from 'cron';
import Prediction from '../models/Prediction';
import User from '../models/User';
import AdminSettings from '../models/AdminSettings';
import mongoose from 'mongoose';

// Popular crypto assets for auto-predictions
const CRYPTO_ASSETS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'LINK', 'MATIC',
  'DOGE', 'LTC', 'BCH', 'UNI', 'ATOM', 'FTM', 'ALGO', 'VET', 'ICP', 'NEAR'
];

// Prediction types to create
const PREDICTION_TYPES = ['binary', 'multiple'] as const;

// Get current price from multiple sources
const getCurrentPrice = async (symbol: string): Promise<number> => {
  try {
    // Try CoinGecko first
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${getCoinGeckoId(symbol)}&vs_currencies=usd`);
    const data = await response.json();
    const coinId = getCoinGeckoId(symbol);
    
    if (data[coinId] && data[coinId].usd) {
      return data[coinId].usd;
    }
    
    // Fallback to Binance
    const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
    const binanceData = await binanceResponse.json();
    
    if (binanceData.price) {
      return parseFloat(binanceData.price);
    }
    
    throw new Error('No price data available');
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    // Return fallback prices
    const fallbackPrices: Record<string, number> = {
      'BTC': 68000, 'ETH': 3500, 'BNB': 1114, 'SOL': 150, 'ADA': 0.45,
      'XRP': 0.55, 'DOT': 7.5, 'AVAX': 35, 'LINK': 15, 'MATIC': 0.75
    };
    return fallbackPrices[symbol] || 100;
  }
};

// Map symbols to CoinGecko IDs
const getCoinGeckoId = (symbol: string): string => {
  const mapping: Record<string, string> = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana',
    'ADA': 'cardano', 'XRP': 'ripple', 'DOT': 'polkadot', 'AVAX': 'avalanche-2',
    'LINK': 'chainlink', 'MATIC': 'matic-network', 'DOGE': 'dogecoin',
    'LTC': 'litecoin', 'BCH': 'bitcoin-cash', 'UNI': 'uniswap', 'ATOM': 'cosmos',
    'FTM': 'fantom', 'ALGO': 'algorand', 'VET': 'vechain', 'ICP': 'internet-computer',
    'NEAR': 'near'
  };
  return mapping[symbol] || symbol.toLowerCase();
};

// Generate target price for binary predictions
const generateTargetPrice = (currentPrice: number): number => {
  // Generate a target price that's 3-15% different from current price
  const changePercent = (Math.random() * 12 + 3) * (Math.random() > 0.5 ? 1 : -1);
  const targetPrice = currentPrice * (1 + changePercent / 100);
  
  // Round to appropriate decimal places based on price magnitude
  if (targetPrice >= 1000) return Math.round(targetPrice);
  if (targetPrice >= 100) return Math.round(targetPrice * 10) / 10;
  if (targetPrice >= 1) return Math.round(targetPrice * 100) / 100;
  return Math.round(targetPrice * 10000) / 10000;
};

// Generate price ranges for multiple choice predictions
const generatePriceRanges = (currentPrice: number): string[] => {
  const ranges = [];
  const basePrice = currentPrice;
  
  // Create 4 price ranges around current price
  ranges.push(`Below $${(basePrice * 0.9).toFixed(2)}`);
  ranges.push(`$${(basePrice * 0.9).toFixed(2)} - $${(basePrice * 1.05).toFixed(2)}`);
  ranges.push(`$${(basePrice * 1.05).toFixed(2)} - $${(basePrice * 1.2).toFixed(2)}`);
  ranges.push(`Above $${(basePrice * 1.2).toFixed(2)}`);
  
  return ranges;
};

// Generate expiry date (1-7 days from now)
const generateExpiryDate = (): Date => {
  const daysFromNow = Math.floor(Math.random() * 7) + 1; // 1-7 days
  const hoursFromNow = Math.floor(Math.random() * 24); // 0-23 hours
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000 + hoursFromNow * 60 * 60 * 1000);
};

// Generate prediction title
const generatePredictionTitle = (asset: string, type: 'binary' | 'multiple', targetPrice?: number, expiryDate?: Date): string => {
  const dateStr = expiryDate ? expiryDate.toLocaleDateString() : 'the end date';
  
  if (type === 'binary' && targetPrice) {
    return `Will ${asset} reach $${targetPrice} by ${dateStr}?`;
  } else {
    return `What price range will ${asset} be in by ${dateStr}?`;
  }
};

// Generate prediction description
const generatePredictionDescription = (asset: string, type: 'binary' | 'multiple', currentPrice: number, targetPrice?: number): string => {
  const baseDesc = `Predict the future price movement of ${asset}. Current price: $${currentPrice}.`;
  
  if (type === 'binary' && targetPrice) {
    const change = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(1);
    return `${baseDesc} Target price: $${targetPrice} (${change > '0' ? '+' : ''}${change}% change).`;
  } else {
    return `${baseDesc} Choose which price range ${asset} will fall into at the expiry date.`;
  }
};

/**
 * Auto-prediction creation job
 * Creates new predictions automatically based on admin settings
 */
export const autoPredictionJob = new CronJob(
  '0 */6 * * *', // Run every 6 hours
  async function() {
    try {
      console.log('Running auto-prediction creation job...');

      // Get admin settings
      const adminSettings = await AdminSettings.findOne({});
      if (!adminSettings || !adminSettings.autoPredictionEnabled) {
        console.log('Auto-prediction is disabled');
        return;
      }

      // Get admin user for creating predictions
      const adminUser = await User.findOne({ 
        $or: [
          { walletAddress: process.env.ADMIN_WALLET_ADDRESS },
          { isAdmin: true }
        ]
      });

      if (!adminUser) {
        console.error('Admin user not found for auto-prediction creation');
        return;
      }

      // Check how many active predictions we currently have
      const activePredictionsCount = await Prediction.countDocuments({ status: 'active' });
      const maxPredictions = adminSettings.maxActivePredictions || 20;

      if (activePredictionsCount >= maxPredictions) {
        console.log(`Already have ${activePredictionsCount} active predictions (max: ${maxPredictions})`);
        return;
      }

      // Determine how many predictions to create
      const predictionsToCreate = Math.min(
        adminSettings.predictionsPerBatch || 3,
        maxPredictions - activePredictionsCount
      );

      console.log(`Creating ${predictionsToCreate} new predictions...`);

      // Select random assets
      const selectedAssets = CRYPTO_ASSETS
        .sort(() => Math.random() - 0.5)
        .slice(0, predictionsToCreate);

      // Create predictions
      for (const asset of selectedAssets) {
        try {
          const currentPrice = await getCurrentPrice(asset);
          const type = PREDICTION_TYPES[Math.floor(Math.random() * PREDICTION_TYPES.length)];
          const expiryDate = generateExpiryDate();

          let predictionData: any = {
            creator: adminUser._id,
            asset,
            type,
            tokenType: 'BNB',
            endDate: expiryDate,
            status: 'active',
            stakeAmount: 0.001,
            volume: 0,
            participants: 0,
            resolveDetails: `This prediction will be automatically resolved based on ${asset} price data.`,
            fees: { creation: 0, resolution: 0 }
          };

          if (type === 'binary') {
            const targetPrice = generateTargetPrice(currentPrice);
            predictionData.title = generatePredictionTitle(asset, type, targetPrice, expiryDate);
            predictionData.description = generatePredictionDescription(asset, type, currentPrice, targetPrice);
            predictionData.targetPrice = targetPrice;
            predictionData.choices = [
              { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
              { id: 'no', label: 'No', price: 0.5, percentage: 50 }
            ];
          } else {
            const priceRanges = generatePriceRanges(currentPrice);
            predictionData.title = generatePredictionTitle(asset, type, undefined, expiryDate);
            predictionData.description = generatePredictionDescription(asset, type, currentPrice);
            predictionData.priceRanges = priceRanges;
            predictionData.choices = priceRanges.map((range, index) => ({
              id: `range_${index}`,
              label: range,
              price: 0.25,
              percentage: 25
            }));
          }

          const prediction = await Prediction.create(predictionData);
          console.log(`Created auto-prediction: ${prediction.title}`);

        } catch (error) {
          console.error(`Error creating prediction for ${asset}:`, error);
        }
      }

      console.log('Auto-prediction creation job completed');

    } catch (error) {
      console.error('Error in auto-prediction creation job:', error);
    }
  },
  null, // onComplete
  false, // start
  'UTC' // timezone
);

/**
 * Start the auto-prediction creation job
 */
export const startAutoPredictionJob = () => {
  autoPredictionJob.start();
  console.log('Auto-prediction creation job started');
};

/**
 * Stop the auto-prediction creation job
 */
export const stopAutoPredictionJob = () => {
  autoPredictionJob.stop();
  console.log('Auto-prediction creation job stopped');
};
