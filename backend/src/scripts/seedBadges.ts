import mongoose from 'mongoose';
import Badge from '../models/Badge';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Badge definitions
const badges = [
  {
    name: 'Early Adopter',
    description: 'Joined during beta phase',
    icon: 'award',
    category: 'special',
    tier: 'gold',
    rarity: 'rare',
    requirements: {
      type: 'account_age',
      threshold: 0, // Automatically awarded to early users
    },
  },
  {
    name: 'Accuracy King',
    description: 'Maintained >75% accuracy for 30 days',
    icon: 'target',
    category: 'achievement',
    tier: 'diamond',
    rarity: 'epic',
    requirements: {
      type: 'accuracy_percentage',
      threshold: 75,
      timeframe: 30,
    },
  },
  {
    name: 'Market Maker',
    description: 'Created 10+ prediction markets',
    icon: 'trending-up',
    category: 'achievement',
    tier: 'silver',
    rarity: 'uncommon',
    requirements: {
      type: 'predictions_created',
      threshold: 10,
    },
  },
  {
    name: 'First Prediction',
    description: 'Made your first prediction',
    icon: 'zap',
    category: 'participation',
    tier: 'bronze',
    rarity: 'common',
    requirements: {
      type: 'predictions_participated',
      threshold: 1,
    },
  },
  {
    name: 'First Win',
    description: 'Won your first prediction',
    icon: 'trophy',
    category: 'achievement',
    tier: 'bronze',
    rarity: 'common',
    requirements: {
      type: 'predictions_won',
      threshold: 1,
    },
  },
  {
    name: 'On Fire',
    description: 'Won 5 predictions in a row',
    icon: 'zap',
    category: 'achievement',
    tier: 'gold',
    rarity: 'rare',
    requirements: {
      type: 'predictions_won_streak',
      threshold: 5,
    },
  },
  {
    name: 'Whale',
    description: 'Staked over 100 SOL in predictions',
    icon: 'trending-up',
    category: 'achievement',
    tier: 'platinum',
    rarity: 'epic',
    requirements: {
      type: 'total_volume',
      threshold: 100,
    },
  },
  {
    name: 'Community Builder',
    description: 'Referred 5+ friends who made predictions',
    icon: 'star',
    category: 'special',
    tier: 'gold',
    rarity: 'rare',
    requirements: {
      type: 'referrals_made',
      threshold: 5,
    },
  },
  {
    name: 'SOLY Millionaire',
    description: 'Earned over 1,000,000 SOLY tokens',
    icon: 'trophy',
    category: 'achievement',
    tier: 'diamond',
    rarity: 'legendary',
    requirements: {
      type: 'soly_earned',
      threshold: 1000000,
    },
  },
  {
    name: 'Loyal Predictor',
    description: 'Active for 100+ days',
    icon: 'clock',
    category: 'milestone',
    tier: 'silver',
    rarity: 'uncommon',
    requirements: {
      type: 'account_age',
      threshold: 100,
    },
  },
  {
    name: 'Crypto Oracle',
    description: 'Achieved 90%+ accuracy on 20+ predictions',
    icon: 'shield',
    category: 'achievement',
    tier: 'diamond',
    rarity: 'legendary',
    requirements: {
      type: 'accuracy_percentage',
      threshold: 90,
      timeframe: 0, // All-time
    },
  },
  {
    name: 'Diversified Portfolio',
    description: 'Participated in predictions for 5+ different assets',
    icon: 'star',
    category: 'achievement',
    tier: 'silver',
    rarity: 'uncommon',
    requirements: {
      type: 'unique_assets',
      threshold: 5,
    },
  },
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/solymarket');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed badges
const seedBadges = async () => {
  try {
    await connectDB();

    // Clear existing badges
    await Badge.deleteMany({});
    console.log('Cleared existing badges');

    // Insert new badges
    const result = await Badge.insertMany(badges);
    console.log(`Seeded ${result.length} badges`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding badges:', error);
    process.exit(1);
  }
};

// Run the seed function
seedBadges();
