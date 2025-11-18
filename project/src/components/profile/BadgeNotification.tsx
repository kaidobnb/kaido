import React, { useState, useEffect } from 'react';
import { BadgeData } from './BadgeItem';
import { Award, X } from 'lucide-react';
import { markBadgeNotificationsAsRead } from '../../services/badgeService';

interface BadgeNotificationProps {
  badge: BadgeData;
  onClose: () => void;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badge, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Tier colors
  const getTierColors = () => {
    switch (badge.tier) {
      case 'bronze':
        return {
          bg: 'from-amber-700/30 to-amber-800/30',
          border: 'border-amber-700/40',
          glow: 'amber-700',
        };
      case 'silver':
        return {
          bg: 'from-slate-400/30 to-slate-500/30',
          border: 'border-slate-400/40',
          glow: 'slate-400',
        };
      case 'gold':
        return {
          bg: 'from-yellow-500/30 to-yellow-600/30',
          border: 'border-yellow-500/40',
          glow: 'yellow-500',
        };
      case 'platinum':
        return {
          bg: 'from-cyan-500/30 to-cyan-600/30',
          border: 'border-cyan-500/40',
          glow: 'cyan-500',
        };
      case 'diamond':
        return {
          bg: 'from-purple-500/30 to-purple-600/30',
          border: 'border-purple-500/40',
          glow: 'purple-500',
        };
      default:
        return {
          bg: 'from-purple-500/30 to-purple-600/30',
          border: 'border-purple-500/40',
          glow: 'purple-500',
        };
    }
  };

  const colors = getTierColors();

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
      style={{
        boxShadow: `0 0 20px 2px rgba(var(--color-${colors.glow}), 0.3)`,
      }}
    >
      <div
        className={`bg-gradient-to-br ${colors.bg} backdrop-blur-md rounded-lg border ${colors.border} p-4 w-80 relative overflow-hidden`}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center mb-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mr-4 border border-slate-700">
            <Award className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Badge Unlocked!</h3>
            <p className="text-slate-300 text-sm">You've earned a new badge</p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mr-3 border ${colors.border}`}
            >
              <Award className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium">{badge.name}</p>
              <p className="text-slate-400 text-xs">{badge.description}</p>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default BadgeNotification;
