import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prediction from '../models/Prediction';
import Participation from '../models/Participation';
import Transaction from '../models/Transaction';
import User from '../models/User';
import unifiedSportsService from '../services/unifiedSportsService';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaido';
const ADMIN_USER_ID = '68e94cc2d05b8acf52e8e06c'; // Admin user ID

/**
 * Script to:
 * 1. Delete all predictions and related data
 * 2. Create 10 new realistic predictions (5 crypto + 5 sports)
 * 3. Ensure predictions are API-resolvable and won't cause platform loss
 */

async function resetAndSeedPredictions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Step 1: Delete all predictions and related data
    console.log('\n=== STEP 1: Deleting all predictions and related data ===');
    
    const deletedPredictions = await Prediction.deleteMany({});
    console.log(`✓ Deleted ${deletedPredictions.deletedCount} predictions`);
    
    const deletedParticipations = await Participation.deleteMany({});
    console.log(`✓ Deleted ${deletedParticipations.deletedCount} participations`);
    
    const deletedTransactions = await Transaction.deleteMany({ 
      type: { $in: ['prediction', 'win', 'loss', 'refund'] } 
    });
    console.log(`✓ Deleted ${deletedTransactions.deletedCount} prediction-related transactions`);

    // Step 2: Fetch real sports matches from API
    console.log('\n=== STEP 2: Fetching real sports matches from API ===');
    
    let sportsMatches: any[] = [];
    try {
      const featuredCompetitionIds = [
        'PL',  // Premier League
        'PD',  // La Liga
        'BL1', // Bundesliga
        'SA',  // Serie A
        'FL1'  // Ligue 1
      ];

      for (const competitionId of featuredCompetitionIds) {
        try {
          const matches = await unifiedSportsService.getMatchesByCompetition(competitionId, 14);
          // Filter matches that are at least 2 hours away
          const validMatches = matches.filter(match => {
            const matchDate = new Date(match.scheduled);
            const now = new Date();
            const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            return hoursUntilMatch >= 2 && hoursUntilMatch <= 168; // Between 2 hours and 7 days
          });
          sportsMatches.push(...validMatches);
        } catch (error) {
          console.warn(`Failed to fetch matches for ${competitionId}:`, error);
        }
      }
      
      console.log(`✓ Fetched ${sportsMatches.length} valid sports matches`);
    } catch (error) {
      console.error('Error fetching sports matches:', error);
    }

    // Step 3: Create 5 crypto predictions
    console.log('\n=== STEP 3: Creating 5 crypto predictions ===');
    
    const cryptoPredictions = [
      {
        title: 'Will Bitcoin reach $110,000 by end of November 2025?',
        description: 'Predict whether Bitcoin (BTC) will reach or exceed $110,000 USD by November 30, 2025. Resolution based on major exchange data (Binance, Coinbase).',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        endDate: new Date('2025-11-30T23:59:59Z'),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
          { id: 'no', label: 'No', price: 0.5, percentage: 50 }
        ],
        resolveDetails: 'Resolution based on Binance and Coinbase BTC/USD price data',
        asset: 'BTC',
        targetPrice: 110000,
        stakeAmount: 0.01
      },
      {
        title: 'Will Ethereum reach $4,000 by December 2025?',
        description: 'Will Ethereum (ETH) reach or exceed $4,000 USD by December 31, 2025? Resolution based on major exchange data.',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        endDate: new Date('2025-12-31T23:59:59Z'),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
          { id: 'no', label: 'No', price: 0.5, percentage: 50 }
        ],
        resolveDetails: 'Resolution based on major exchange ETH/USD price data',
        asset: 'ETH',
        targetPrice: 4000,
        stakeAmount: 0.01
      },
      {
        title: 'Will BNB reach $700 by end of November 2025?',
        description: 'Predict whether BNB will reach or exceed $700 USD by November 30, 2025.',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        endDate: new Date('2025-11-30T23:59:59Z'),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
          { id: 'no', label: 'No', price: 0.5, percentage: 50 }
        ],
        resolveDetails: 'Resolution based on Binance BNB/USD price data',
        asset: 'BNB',
        targetPrice: 700,
        stakeAmount: 0.1
      },
      {
        title: 'Will Solana reach $200 by December 2025?',
        description: 'Will Solana (SOL) reach or exceed $200 USD by December 31, 2025?',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        endDate: new Date('2025-12-31T23:59:59Z'),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
          { id: 'no', label: 'No', price: 0.5, percentage: 50 }
        ],
        resolveDetails: 'Resolution based on major exchange SOL/USD price data',
        asset: 'SOL',
        targetPrice: 200,
        stakeAmount: 0.1
      },
      {
        title: 'Will XRP reach $3.00 by end of November 2025?',
        description: 'Predict whether XRP will reach or exceed $3.00 USD by November 30, 2025.',
        type: 'binary',
        category: 'crypto',
        tokenType: 'BNB',
        endDate: new Date('2025-11-30T23:59:59Z'),
        choices: [
          { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
          { id: 'no', label: 'No', price: 0.5, percentage: 50 }
        ],
        resolveDetails: 'Resolution based on major exchange XRP/USD price data',
        asset: 'XRP',
        targetPrice: 3.0,
        stakeAmount: 0.01
      }
    ];

    for (const predData of cryptoPredictions) {
      const prediction = await Prediction.create({
        ...predData,
        creator: ADMIN_USER_ID,
        volume: 0,
        participants: 0,
        status: 'active',
        priceRanges: [],
        fees: { creation: 0, resolution: 0 }
      });
      console.log(`✓ Created crypto prediction: ${prediction.title}`);
    }

    // Step 4: Create 5 sports predictions from real matches
    console.log('\n=== STEP 4: Creating 5 sports predictions from real matches ===');

    const selectedMatches = sportsMatches.slice(0, 5);

    if (selectedMatches.length === 0) {
      console.warn('⚠ No sports matches available, skipping sports predictions');
    } else {
      for (const match of selectedMatches) {
        // Check if match has required team data
        if (!match.home || !match.away) {
          console.warn(`⚠ Skipping match ${match.id} - missing team data`);
          continue;
        }

        const matchDate = new Date(match.scheduled);
        const endDate = new Date(matchDate.getTime() - (15 * 60 * 1000)); // 15 minutes before match

        const prediction = await Prediction.create({
          title: `${match.home.name} vs ${match.away.name}`,
          description: `Predict the outcome of ${match.home.name} vs ${match.away.name} in ${match.competition.name}. Match scheduled for ${matchDate.toLocaleString()}.`,
          type: 'multiple',
          category: 'sports',
          tokenType: 'BNB',
          creator: ADMIN_USER_ID,
          endDate: endDate,
          choices: [
            { id: 'home', label: match.home.name, price: 0.33, percentage: 33 },
            { id: 'draw', label: 'Draw', price: 0.34, percentage: 34 },
            { id: 'away', label: match.away.name, price: 0.33, percentage: 33 }
          ],
          resolveDetails: `Resolution based on official match result from ${match.competition.name}`,
          asset: 'SPORTS',
          stakeAmount: 0.01,
          volume: 0,
          participants: 0,
          status: 'active',
          priceRanges: [],
          fees: { creation: 0, resolution: 0 },
          sportsData: {
            matchId: match.id,
            competitionId: match.competition.id,
            competitionName: match.competition.name,
            homeTeam: {
              id: match.home.id,
              name: match.home.name,
              country: match.home.country?.code || 'N/A'
            },
            awayTeam: {
              id: match.away.id,
              name: match.away.name,
              country: match.away.country?.code || 'N/A'
            },
            scheduledDate: matchDate,
            sport: 'soccer',
            autoResolve: true,
            resolutionCriteria: 'full_time_result'
          }
        });
        console.log(`✓ Created sports prediction: ${prediction.title}`);
      }
    }

    // Step 5: Display summary
    console.log('\n=== SUMMARY ===');
    const totalPredictions = await Prediction.countDocuments();
    const cryptoCount = await Prediction.countDocuments({ category: 'crypto' });
    const sportsCount = await Prediction.countDocuments({ category: 'sports' });
    
    console.log(`Total predictions: ${totalPredictions}`);
    console.log(`Crypto predictions: ${cryptoCount}`);
    console.log(`Sports predictions: ${sportsCount}`);
    console.log('\n✅ Reset and seeding completed successfully!');
    console.log('\nAll predictions are:');
    console.log('- API-resolvable (crypto via CoinGecko/CryptoCompare, sports via Football-Data/Sportradar)');
    console.log('- Starting with 0 volume and 0 participants (no platform loss risk)');
    console.log('- Set to realistic future dates');

  } catch (error) {
    console.error('Error in reset and seed script:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
resetAndSeedPredictions()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

