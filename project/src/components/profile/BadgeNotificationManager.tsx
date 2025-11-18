import React, { useState, useEffect } from 'react';
import { BadgeData } from './BadgeItem';
import BadgeNotification from './BadgeNotification';
import { checkForNewBadges, markBadgeNotificationsAsRead } from '../../services/badgeService';
import { useAuth } from '../../contexts/AuthContext';

const BadgeNotificationManager: React.FC = () => {
  const [newBadges, setNewBadges] = useState<BadgeData[]>([]);
  const [currentBadge, setCurrentBadge] = useState<BadgeData | null>(null);
  const { isAuthenticated, userProfile } = useAuth();

  // Check for new badges on component mount and when auth state changes
  useEffect(() => {
    // Only check for badges if user is authenticated
    if (!isAuthenticated || !userProfile?.id) {
      return;
    }

    const checkBadges = async () => {
      const badges = await checkForNewBadges();
      if (badges.length > 0) {
        setNewBadges(badges);
      }
    };

    checkBadges();

    // Check for new badges every 5 minutes
    const interval = setInterval(checkBadges, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, userProfile?.id]);

  // Show badges one at a time
  useEffect(() => {
    if (newBadges.length > 0 && !currentBadge) {
      // Show the first badge
      setCurrentBadge(newBadges[0]);

      // Remove it from the queue
      setNewBadges(prev => prev.slice(1));
    }
  }, [newBadges, currentBadge]);

  // Handle notification close
  const handleClose = async () => {
    setCurrentBadge(null);

    // If this was the last badge, mark all as read
    if (newBadges.length === 0) {
      await markBadgeNotificationsAsRead();
    }
  };

  if (!currentBadge) return null;

  return <BadgeNotification badge={currentBadge} onClose={handleClose} />;
};

export default BadgeNotificationManager;
