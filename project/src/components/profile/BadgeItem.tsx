import React from 'react';
import { Award, Lock, TrendingUp, Zap, Trophy, Star, Clock, Target, Shield } from 'lucide-react';
import Tooltip from '../ui/Tooltip';

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'participation' | 'special' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  dateAwarded?: string;
  progress?: number;
  locked?: boolean;
}

interface BadgeItemProps {
  badge: BadgeData;
  showProgress?: boolean;
}

const BadgeItem: React.FC<BadgeItemProps> = ({ badge, showProgress = false }) => {
  // Icon mapping
  const getIcon = () => {
    switch (badge.icon) {
      case 'award':
        return <Award className="h-4 w-4" />;
      case 'trending-up':
        return <TrendingUp className="h-4 w-4" />;
      case 'zap':
        return <Zap className="h-4 w-4" />;
      case 'trophy':
        return <Trophy className="h-4 w-4" />;
      case 'star':
        return <Star className="h-4 w-4" />;
      case 'clock':
        return <Clock className="h-4 w-4" />;
      case 'target':
        return <Target className="h-4 w-4" />;
      case 'shield':
        return <Shield className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  // Tier colors
  const getTierColors = () => {
    switch (badge.tier) {
      case 'bronze':
        return {
          bg: 'bg-amber-700/20',
          border: 'border-amber-700/40',
          text: 'text-amber-500',
        };
      case 'silver':
        return {
          bg: 'bg-slate-400/20',
          border: 'border-slate-400/40',
          text: 'text-slate-300',
        };
      case 'gold':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/40',
          text: 'text-yellow-400',
        };
      case 'platinum':
        return {
          bg: 'bg-cyan-500/20',
          border: 'border-cyan-500/40',
          text: 'text-cyan-400',
        };
      case 'diamond':
        return {
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/40',
          text: 'text-purple-400',
        };
      default:
        return {
          bg: 'bg-purple-500/20',
          border: 'border-purple-500/40',
          text: 'text-purple-400',
        };
    }
  };

  // Rarity indicator
  const getRarityLabel = () => {
    switch (badge.rarity) {
      case 'common':
        return null; // No label for common
      case 'uncommon':
        return <span className="text-green-400 text-[10px] ml-1">Uncommon</span>;
      case 'rare':
        return <span className="text-blue-400 text-[10px] ml-1">Rare</span>;
      case 'epic':
        return <span className="text-purple-400 text-[10px] ml-1">Epic</span>;
      case 'legendary':
        return <span className="text-yellow-400 text-[10px] ml-1">Legendary</span>;
      default:
        return null;
    }
  };

  const colors = getTierColors();

  return (
    <Tooltip
      content={
        <div className="w-64 p-2">
          <div className="flex items-center mb-1">
            <span className="font-medium text-white">{badge.name}</span>
            {getRarityLabel()}
          </div>
          <p className="text-xs text-slate-300 mb-2">{badge.description}</p>
          {badge.dateAwarded && (
            <p className="text-xs text-slate-400">
              Earned on {new Date(badge.dateAwarded).toLocaleDateString()}
            </p>
          )}
          {showProgress && badge.progress !== undefined && badge.progress < 100 && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{badge.progress}% complete</p>
            </div>
          )}
        </div>
      }
    >
      <div className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full ${colors.bg} ${
            badge.locked ? 'opacity-50' : ''
          } flex items-center justify-center mr-3 border ${colors.border}`}
        >
          {badge.locked ? (
            <Lock className={`h-4 w-4 ${colors.text}`} />
          ) : (
            <span className={colors.text}>{getIcon()}</span>
          )}
        </div>
        <div>
          <div className="flex items-center">
            <p className={`text-white text-sm font-medium ${badge.locked ? 'text-slate-500' : ''}`}>
              {badge.name}
            </p>
            {!badge.locked && getRarityLabel()}
          </div>
          <p className={`text-xs ${badge.locked ? 'text-slate-600' : 'text-slate-400'}`}>
            {badge.description}
          </p>
          {showProgress && badge.progress !== undefined && badge.progress < 100 && !badge.locked && (
            <div className="mt-1 w-full max-w-[150px]">
              <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Tooltip>
  );
};

export default BadgeItem;
