import { BadgeData } from '../components/profile/BadgeItem';
import { getUserBadges as fetchUserBadges, checkForNewBadges as fetchNewBadges, markBadgeNotificationsAsRead as markBadgesRead } from './api';

// Define badge requirements types
export type BadgeRequirementType =
  | 'predictions_created'
  | 'predictions_participated'
  | 'predictions_won'
  | 'accuracy_percentage'
  | 'kaido_earned'
  | 'referrals_made'
  | 'account_age'
  | 'login_streak'
  | 'special_event';

// Badge definitions with their requirements
export const BADGE_DEFINITIONS: BadgeData[] = [
  // Achievement Badges
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'Joined during beta phase',
    icon: 'award',
    category: 'special',
    tier: 'gold',
    rarity: 'rare',
  },
  {
    id: 'accuracy-king',
    name: 'Accuracy King',
    description: 'Maintained >75% accuracy for 30 days',
    icon: 'target',
    category: 'achievement',
    tier: 'diamond',
    rarity: 'epic',
  },
  {
    id: 'market-maker',
    name: 'Market Maker',
    description: 'Created 10+ prediction markets',
    icon: 'trending-up',
    category: 'achievement',
    tier: 'silver',
    rarity: 'uncommon',
  },
  {
    id: 'first-prediction',
    name: 'First Prediction',
    description: 'Made your first prediction',
    icon: 'zap',
    category: 'participation',
    tier: 'bronze',
    rarity: 'common',
  },
  {
    id: 'first-win',
    name: 'First Win',
    description: 'Won your first prediction',
    icon: 'trophy',
    category: 'achievement',
    tier: 'bronze',
    rarity: 'common',
  },
  {
    id: 'prediction-streak',
    name: 'On Fire',
    description: 'Won 5 predictions in a row',
    icon: 'zap',
    category: 'achievement',
    tier: 'gold',
    rarity: 'rare',
  },
  {
    id: 'whale',
    name: 'Whale',
    description: 'Staked over 100 BNB in predictions',
    icon: 'trending-up',
    category: 'achievement',
    tier: 'platinum',
    rarity: 'epic',
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description: 'Referred 5+ friends who made predictions',
    icon: 'star',
    category: 'special',
    tier: 'gold',
    rarity: 'rare',
  },
  {
    id: 'kaido-millionaire',
    name: 'KAIDO Millionaire',
    description: 'Earned over 1,000,000 KAIDO tokens',
    icon: 'trophy',
    category: 'achievement',
    tier: 'diamond',
    rarity: 'legendary',
  },
  {
    id: 'loyal-predictor',
    name: 'Loyal Predictor',
    description: 'Active for 100+ days',
    icon: 'clock',
    category: 'milestone',
    tier: 'silver',
    rarity: 'uncommon',
  },
  {
    id: 'crypto-oracle',
    name: 'Crypto Oracle',
    description: 'Achieved 90%+ accuracy on 20+ predictions',
    icon: 'shield',
    category: 'achievement',
    tier: 'diamond',
    rarity: 'legendary',
  },
  {
    id: 'diversified-portfolio',
    name: 'Diversified Portfolio',
    description: 'Participated in predictions for 5+ different assets',
    icon: 'star',
    category: 'achievement',
    tier: 'silver',
    rarity: 'uncommon',
  },
];

// Get user badges from API
export const getUserBadges = async (): Promise<BadgeData[]> => {
  try {
    const response = await fetchUserBadges();
    if (response.success) {
      return response.badges;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
};

// Check if user has earned new badges
export const checkForNewBadges = async (): Promise<BadgeData[]> => {
  try {
    const response = await fetchNewBadges();
    if (response.success) {
      return response.newBadges || [];
    }
    return [];
  } catch (error) {
    console.error('Error checking for new badges:', error);
    return [];
  }
};

// Mark badge notifications as read
export const markBadgeNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const response = await markBadgesRead();
    return response.success;
  } catch (error) {
    console.error('Error marking badge notifications as read:', error);
    return false;
  }
};

// Get mock badges for development (remove in production)
export const getMockBadges = (): BadgeData[] => {
  // Return a mix of locked and unlocked badges
  return BADGE_DEFINITIONS.map((badge, index) => ({
    ...badge,
    locked: index > 2, // First 3 badges are unlocked
    dateAwarded: index <= 2 ? new Date().toISOString() : undefined,
    progress: index === 3 ? 75 : index === 4 ? 50 : index === 5 ? 25 : undefined,
  }));
};

export default {
  getUserBadges,
  checkForNewBadges,
  markBadgeNotificationsAsRead,
  getMockBadges,
};
