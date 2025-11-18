import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import Prediction from '../models/Prediction';
import User from '../models/User';
import Participation from '../models/Participation';
import { SUPPORTED_TOKENS } from '../config/tokens';

// Load environment variables
dotenv.config();

// CryptoCompare API configuration
const CRYPTOCOMPARE_API_URL = 'https://min-api.cryptocompare.com/data';
const CRYPTOCOMPARE_API_KEY = process.env.CRYPTOCOMPARE_API_KEY || '0bb48079e29c9de72aef520f5395277a5dc38e86a98d9ab6dfab0c14c8aec09b';

// Symbol mapping for different APIs
const CRYPTOCOMPARE_SYMBOLS: Record<string, string> = {
  'BTC': 'BTC',
  'ETH': 'ETH',
  'SOL': 'SOL',
  'ADA': 'ADA',
  'DOGE': 'DOGE',
  'XRP': 'XRP',
  'DOT': 'DOT',
  'AVAX': 'AVAX',
  'LINK': 'LINK',
  'MATIC': 'MATIC'
};

const COINGECKO_SYMBOLS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'XRP': 'ripple',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'MATIC': 'matic-network'
};

const BINANCE_SYMBOLS: Record<string, string> = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'SOL': 'SOLUSDT',
  'ADA': 'ADAUSDT',
  'DOGE': 'DOGEUSDT',
  'XRP': 'XRPUSDT',
  'DOT': 'DOTUSDT',
  'AVAX': 'AVAXUSDT',
  'LINK': 'LINKUSDT',
  'MATIC': 'MATICUSDT'
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/solymarket';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get current price for a crypto asset
const getCurrentPrice = async (symbol: string): Promise<number> => {
  try {
    console.log(`Fetching price for ${symbol}...`);

    // Try CryptoCompare first
    try {
      // Get the correct symbol for CryptoCompare
      const cryptoCompareSymbol = CRYPTOCOMPARE_SYMBOLS[symbol] || symbol;

      // Try the v2 multi endpoint first (more reliable)
      try {
        const v2Response = await axios.get(`${CRYPTOCOMPARE_API_URL}/v2/price`, {
          params: {
            fsym: cryptoCompareSymbol,
            tsyms: 'USD',
            api_key: CRYPTOCOMPARE_API_KEY
          },
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        });

        if (v2Response.data && v2Response.data.USD) {
          console.log(`Got price for ${symbol} from CryptoCompare v2: $${v2Response.data.USD}`);
          return v2Response.data.USD;
        }
      } catch (v2Error) {
        console.warn(`CryptoCompare v2 endpoint failed, trying standard endpoint:`, v2Error);
      }

      // Try the standard price endpoint
      const response = await axios.get(`${CRYPTOCOMPARE_API_URL}/price`, {
        params: {
          fsym: cryptoCompareSymbol,
          tsyms: 'USD',
          api_key: CRYPTOCOMPARE_API_KEY
        },
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (response.data && response.data.USD) {
        console.log(`Got price for ${symbol} from CryptoCompare: $${response.data.USD}`);
        return response.data.USD;
      }

      throw new Error('Invalid response from CryptoCompare');
    } catch (cryptoCompareError) {
      console.warn(`CryptoCompare API failed for ${symbol}, trying CoinGecko as fallback:`, cryptoCompareError);

      // Try CoinGecko as backup
      try {
        // Get the correct ID for CoinGecko
        const coinId = COINGECKO_SYMBOLS[symbol] || symbol.toLowerCase();
        const backupUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;

        const backupResponse = await axios.get(backupUrl, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        });

        if (backupResponse.data && backupResponse.data[coinId] && backupResponse.data[coinId].usd) {
          const price = backupResponse.data[coinId].usd;
          console.log(`Got price from CoinGecko API for ${symbol}: $${price}`);
          return price;
        }

        throw new Error('Invalid response from CoinGecko');
      } catch (coinGeckoError: any) {
        console.error(`CoinGecko API also failed for ${symbol}:`, coinGeckoError?.message || 'Unknown error');

        // Try a third API as last resort (Binance)
        try {
          console.log(`Trying Binance API for ${symbol}...`);
          // Get the correct symbol for Binance
          const binanceSymbol = BINANCE_SYMBOLS[symbol] || `${symbol}USDT`;
          const binanceUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`;

          const binanceResponse = await axios.get(binanceUrl, {
            timeout: 10000,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            }
          });

          if (binanceResponse.data && binanceResponse.data.price) {
            const price = parseFloat(binanceResponse.data.price);
            console.log(`Got price from Binance API for ${symbol}: $${price}`);
            return price;
          }

          throw new Error('Invalid response from Binance');
        } catch (binanceError: any) {
          console.error(`All APIs failed for ${symbol}:`, binanceError?.message || 'Unknown error');
          throw new Error(`Could not fetch price for ${symbol} from any API`);
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol} from all sources:`, error);
    // Return a fallback price based on the symbol - only as last resort
    const fallbackPrices: Record<string, number> = {
      'BTC': 68000,
      'ETH': 3500,
      'SOL': 150,
      'ADA': 0.45,
      'DOGE': 0.15,
      'XRP': 0.55,
      'DOT': 7.5,
      'AVAX': 35,
      'LINK': 15,
      'MATIC': 0.75
    };
    console.warn(`Using fallback price for ${symbol}: $${fallbackPrices[symbol] || 100}`);
    return fallbackPrices[symbol] || 100;
  }
};

// Generate a random date within the next week
const getRandomExpiryDate = (): Date => {
  const now = new Date();
  const daysToAdd = Math.floor(Math.random() * 7) + 1; // 1-7 days
  const expiryDate = new Date(now);
  expiryDate.setDate(now.getDate() + daysToAdd);
  return expiryDate;
};

// Generate a target price that's slightly higher or lower than the current price
const generateTargetPrice = (currentPrice: number): number => {
  // Generate a random percentage change between -7% and +7%
  // Randomly decide if we want higher or lower
  const isHigher = Math.random() > 0.5;

  // Generate a percentage change between 2% and 7%
  const percentageChange = 2 + (Math.random() * 5);

  // Apply the change in the chosen direction
  const targetPrice = isHigher ?
    currentPrice * (1 + percentageChange / 100) :
    currentPrice * (1 - percentageChange / 100);

  // Round to appropriate decimal places based on price magnitude
  if (targetPrice > 10000) {
    return Math.round(targetPrice / 100) * 100; // Round to nearest 100
  } else if (targetPrice > 1000) {
    return Math.round(targetPrice / 10) * 10; // Round to nearest 10
  } else if (targetPrice > 100) {
    return Math.round(targetPrice); // Round to nearest 1
  } else if (targetPrice > 10) {
    return Math.round(targetPrice * 10) / 10; // Round to nearest 0.1
  } else if (targetPrice > 1) {
    return Math.round(targetPrice * 100) / 100; // Round to nearest 0.01
  } else if (targetPrice > 0.1) {
    return Math.round(targetPrice * 1000) / 1000; // Round to nearest 0.001
  } else {
    return Math.round(targetPrice * 10000) / 10000; // Round to nearest 0.0001
  }
};

// Create a prediction title based on asset, target price, and current price
const generatePredictionTitle = (asset: string, targetPrice: number, currentPrice: number, expiryDate: Date): string => {
  const formattedDate = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Determine if target is higher or lower than current price
  const isHigherTarget = targetPrice > currentPrice;

  // Titles for higher targets
  const higherTitles = [
    `Will ${asset} reach $${targetPrice} by ${formattedDate}?`,
    `${asset} to hit $${targetPrice} before ${formattedDate}?`,
    `${asset} above $${targetPrice} on ${formattedDate}?`,
    `Can ${asset} break $${targetPrice} by ${formattedDate}?`,
    `${asset} to surpass $${targetPrice} before ${formattedDate}?`,
    `${asset} to rally to $${targetPrice} by ${formattedDate}?`,
    `${asset} to climb above $${targetPrice} before ${formattedDate}?`
  ];

  // Titles for lower targets
  const lowerTitles = [
    `Will ${asset} drop to $${targetPrice} by ${formattedDate}?`,
    `${asset} to fall below $${targetPrice} before ${formattedDate}?`,
    `${asset} under $${targetPrice} on ${formattedDate}?`,
    `${asset} to decline to $${targetPrice} by ${formattedDate}?`,
    `Will ${asset} dip below $${targetPrice} before ${formattedDate}?`,
    `${asset} to correct to $${targetPrice} by ${formattedDate}?`
  ];

  // Choose from appropriate list
  const titles = isHigherTarget ? higherTitles : lowerTitles;
  return titles[Math.floor(Math.random() * titles.length)];
};

// Create a prediction description
const generatePredictionDescription = (asset: string, targetPrice: number, currentPrice: number, expiryDate: Date): string => {
  const formattedDate = expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const isHigherTarget = targetPrice > currentPrice;

  if (isHigherTarget) {
    const percentIncrease = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(1);
    return `This market will resolve to YES if the price of ${asset} reaches or exceeds $${targetPrice} (a ${percentIncrease}% increase from current price) at any point before ${formattedDate}. The resolution source will be CryptoCompare price data.`;
  } else {
    const percentDecrease = ((currentPrice - targetPrice) / currentPrice * 100).toFixed(1);
    return `This market will resolve to YES if the price of ${asset} falls to or below $${targetPrice} (a ${percentDecrease}% decrease from current price) at any point before ${formattedDate}. The resolution source will be CryptoCompare price data.`;
  }
};

// Generate fake users for participation
const generateFakeUsers = async (count: number): Promise<any[]> => {
  const fakeUsers = [];

  for (let i = 0; i < count; i++) {
    const walletAddress = faker.string.alphanumeric(40);
    const username = faker.internet.userName();

    const user = new User({
      walletAddress,
      username,
      displayName: username,
      profileCompleted: true,
      avatar: faker.image.avatar(),
      balances: {
        SOL: faker.number.float({ min: 1, max: 100, precision: 0.01 }),
        SOLY: faker.number.float({ min: 100, max: 10000, precision: 0.1 })
      },
      isAdmin: false
    });

    await user.save();
    fakeUsers.push(user);
  }

  return fakeUsers;
};

// Main function to generate predictions
const generatePredictions = async () => {
  try {
    await connectDB();

    // Clear existing predictions and participations
    console.log('Clearing existing predictions and participations...');
    await Participation.deleteMany({});
    console.log('All participations deleted');

    await Prediction.deleteMany({});
    console.log('All predictions deleted');

    // Select 10 assets from the supported tokens
    const selectedAssets = SUPPORTED_TOKENS
      .map(token => token.symbol)
      .slice(0, 10); // Take the first 10 tokens

    console.log('Selected assets:', selectedAssets);

    // Generate 30 fake users for participation
    console.log('Generating fake users...');
    const fakeUsers = await generateFakeUsers(30);
    console.log(`Created ${fakeUsers.length} fake users`);

    // Create predictions for each asset
    for (const asset of selectedAssets) {
      // Get current price
      const currentPrice = await getCurrentPrice(asset);

      // Generate target price
      const targetPrice = generateTargetPrice(currentPrice);

      // Generate expiry date
      const expiryDate = getRandomExpiryDate();

      // Create prediction
      const title = generatePredictionTitle(asset, targetPrice, currentPrice, expiryDate);
      const description = generatePredictionDescription(asset, targetPrice, currentPrice, expiryDate);

      console.log(`Creating prediction: ${title}`);

      // Randomly select a creator from the fake users
      const creatorIndex = Math.floor(Math.random() * fakeUsers.length);
      const creator = fakeUsers[creatorIndex];

      // Generate a random creation date between 1-7 days ago
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7) - 1);

      const prediction = new Prediction({
        title,
        description,
        type: 'binary',
        tokenType: 'SOL',
        creator: creator._id, // Random user as creator
        createdAt, // Random creation date
        endDate: expiryDate,
        volume: 0, // Will be updated as users participate
        participants: 0, // Will be updated as users participate
        choices: [
          { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
          { id: 'no', label: 'No', price: 0.5, percentage: 50 }
        ],
        resolveDetails: `This prediction will be resolved based on ${asset} price data on ${expiryDate.toLocaleDateString()}.`,
        status: 'active',
        asset,
        targetPrice,
        stakeAmount: 0.1
      });

      await prediction.save();

      // Generate balanced participation
      await generateBalancedParticipation(prediction, fakeUsers);
    }

    console.log('Finished generating predictions');
    process.exit(0);
  } catch (error) {
    console.error('Error generating predictions:', error);
    process.exit(1);
  }
};

// Generate a random timestamp between creation date and now
const generateRandomTimestamp = (creationDate: Date) => {
  const now = new Date();
  const creationTime = creationDate.getTime();
  const currentTime = now.getTime();

  // Random time between creation and now
  const randomTime = creationTime + Math.random() * (currentTime - creationTime);
  return new Date(randomTime);
};

// Generate balanced participation for a prediction
const generateBalancedParticipation = async (prediction: any, users: any[]) => {
  // Total volume to generate (between 15 and 30 SOL)
  const totalVolume = faker.number.float({ min: 15, max: 30, precision: 0.01 });

  // Split volume between YES and NO positions to ensure it's balanced
  const yesVolume = totalVolume / 2;
  const noVolume = totalVolume / 2;

  let yesVolumeRemaining = yesVolume;
  let noVolumeRemaining = noVolume;

  // Shuffle users to randomize participation
  const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
  const halfPoint = Math.floor(shuffledUsers.length / 2);

  // Get the creation date of the prediction
  const creationDate = prediction.createdAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Distribute YES volume among first half of shuffled users
  for (let i = 0; i < halfPoint; i++) {
    if (yesVolumeRemaining < 0.5) break; // Ensure we have at least the minimum stake amount left

    // Determine stake amount for this user (between 0.5 and remaining volume, max 3.5 SOL per user)
    const maxStake = Math.min(yesVolumeRemaining, 3.5);
    const stakeAmount = faker.number.float({ min: 0.5, max: maxStake, precision: 0.01 });

    // Generate random timestamp for this participation
    const participationDate = generateRandomTimestamp(creationDate);

    // Create participation record
    const participation = new Participation({
      user: shuffledUsers[i]._id,
      prediction: prediction._id,
      position: 'yes',
      amount: stakeAmount,
      tokenType: 'SOL',
      status: 'active',
      createdAt: participationDate
    });

    await participation.save();

    // Update remaining volume
    yesVolumeRemaining -= stakeAmount;

    // Update prediction volume and participants
    prediction.volume += stakeAmount;
    prediction.participants += 1;
  }

  // Distribute NO volume among second half of shuffled users
  for (let i = halfPoint; i < shuffledUsers.length; i++) {
    if (noVolumeRemaining < 0.5) break; // Ensure we have at least the minimum stake amount left

    // Determine stake amount for this user (between 0.5 and remaining volume, max 3.5 SOL per user)
    const maxStake = Math.min(noVolumeRemaining, 3.5);
    const stakeAmount = faker.number.float({ min: 0.5, max: maxStake, precision: 0.01 });

    // Generate random timestamp for this participation
    const participationDate = generateRandomTimestamp(creationDate);

    // Create participation record
    const participation = new Participation({
      user: shuffledUsers[i]._id,
      prediction: prediction._id,
      position: 'no',
      amount: stakeAmount,
      tokenType: 'SOL',
      status: 'active',
      createdAt: participationDate
    });

    await participation.save();

    // Update remaining volume
    noVolumeRemaining -= stakeAmount;

    // Update prediction volume and participants
    prediction.volume += stakeAmount;
    prediction.participants += 1;
  }

  // Save updated prediction
  await prediction.save();

  console.log(`Generated balanced participation for prediction ${prediction.title}`);
  console.log(`Total volume: ${prediction.volume} SOL, Participants: ${prediction.participants}`);
};

// Run the script
generatePredictions();
