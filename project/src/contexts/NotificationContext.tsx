import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getClaimableWinnings, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getClaimableReferralRewards, forceCheckReferralRewards, checkNewReferralRewards } from '../services/api';
import { Notification } from '../components/notifications/NotificationDropdown';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isAuthenticated, userProfile } = useAuth();

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications from the backend
  useEffect(() => {
    // Only load notifications if user is authenticated
    if (!isAuthenticated || !userProfile?.id) {
      return;
    }

    // Fetch notifications from the backend
    const fetchNotifications = async () => {
      try {
        const response = await getUserNotifications();

        if (response.success && response.notifications) {
          console.log('Fetched notifications from backend:', response.notifications);

          // Convert backend notifications to frontend format
          const formattedNotifications: Notification[] = response.notifications.map((notification: any) => ({
            id: notification._id || `notification-${Date.now()}-${Math.random()}`,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            timestamp: notification.timestamp || new Date().toISOString(),
            read: notification.read || false,
            predictionId: notification.predictionId,
            link: notification.predictionId ? `/prediction/${notification.predictionId}?includeResolved=true` : undefined,
            data: notification.data
          }));

          setNotifications(formattedNotifications);
        } else {
          console.error('Failed to fetch notifications:', response);

          // Fallback to localStorage if API fails
          const notificationKey = `userNotifications_${userProfile.id}`;
          const savedNotifications = localStorage.getItem(notificationKey);

          if (savedNotifications) {
            try {
              const parsedNotifications = JSON.parse(savedNotifications);
              setNotifications(parsedNotifications);
            } catch (error) {
              console.error('Error parsing saved notifications:', error);
              localStorage.removeItem(notificationKey);
            }
          } else {
            // Add welcome notification for new users
            const welcomeNotification: Notification = {
              id: `notification-${Date.now()}-welcome`,
              type: 'system',
              title: 'Welcome to SolyMarket',
              message: 'Thanks for joining SolyMarket! Start making predictions now.',
              timestamp: new Date().toISOString(),
              read: false
            };
            setNotifications([welcomeNotification]);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Set up polling to refresh notifications every 60 seconds
    const intervalId = setInterval(fetchNotifications, 60000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, userProfile?.id]);

  // Save notifications to localStorage when they change
  useEffect(() => {
    // Only save notifications if user is authenticated
    if (!isAuthenticated || !userProfile?.id || notifications.length === 0) {
      return;
    }

    // Use user-specific key for notifications
    const notificationKey = `userNotifications_${userProfile.id}`;
    localStorage.setItem(notificationKey, JSON.stringify(notifications));
  }, [notifications, isAuthenticated, userProfile?.id]);

  // Check for winnings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const checkWinnings = async () => {
        try {
          const response = await getClaimableWinnings();
          if (response.success && response.count > 0) {
            // Format totals
            const formatTotals = () => {
              const { totals } = response;
              const parts = [];

              if (totals.SOL) {
                parts.push(`${totals.SOL.toFixed(2)} SOL`);
              }

              if (totals.SOLY) {
                parts.push(`${totals.SOLY.toFixed(2)} SOLY`);
              }

              return parts.join(' and ');
            };

            // Add a notification for each winning if it doesn't already exist
            response.winnings.forEach((winning: any) => {
              // Check if we already have a notification for this winning
              const existingNotification = notifications.find(
                n => n.type === 'winnings' &&
                     n.data &&
                     n.data.participationId === winning.id
              );

              if (!existingNotification) {
                addNotification({
                  type: 'winnings',
                  title: 'You won a prediction!',
                  message: `You won ${winning.reward.toFixed(2)} ${winning.tokenType} from "${winning.prediction.title}"`,
                  link: '/profile/winnings',
                  data: {
                    ...winning,
                    participationId: winning.id,
                    claimable: true
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error('Error checking winnings:', error);
        }
      };

      // Check for winnings immediately and then every 60 seconds
      checkWinnings();
      const intervalId = setInterval(checkWinnings, 60000);

      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, notifications]);

  // Check for referral rewards when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const checkReferralRewards = async () => {
        try {
          console.log('Checking for new referral rewards...');
          // First check if there are any new rewards
          const newRewardsResponse = await checkNewReferralRewards();
          console.log('New referral rewards check response:', newRewardsResponse);

          if (newRewardsResponse.success && newRewardsResponse.hasNewRewards) {
            console.log(`Found ${newRewardsResponse.count} new referral rewards`);

            // Force a fresh check to get the latest data
            const response = await forceCheckReferralRewards();
            console.log('Force check referral rewards response:', response);

            if (response.success && response.rewards) {
              console.log('Found claimable referral rewards:', response.rewards);

              // Check for BNB rewards (primary)
              if (response.rewards.BNB && response.rewards.BNB.total > 0) {
                console.log(`Found ${response.rewards.BNB.total.toFixed(4)} BNB in referral rewards`);

                // Check if we already have a notification for BNB referral rewards
                const existingBNBNotification = notifications.find(
                  n => n.type === 'referral_bonus' &&
                       n.data &&
                       n.data.tokenType === 'BNB'
                );

                // Also check localStorage to prevent duplicate notifications across sessions
                const notificationKey = `referralRewardNotification_BNB_${userProfile?.id}`;
                const storedNotification = localStorage.getItem(notificationKey);
                let storedAmount = 0;

                if (storedNotification) {
                  try {
                    const parsed = JSON.parse(storedNotification);
                    storedAmount = parsed.amount || 0;
                  } catch (e) {
                    console.warn('Failed to parse stored BNB notification data:', e);
                  }
                }

                // Only show notification if it doesn't exist or if the amount has increased significantly
                const shouldShowNotification = !existingBNBNotification &&
                  (response.rewards.BNB.total > storedAmount + 0.001); // Only show if increased by more than 0.001 BNB

                if (shouldShowNotification) {
                  console.log('Creating new notification for BNB referral rewards');
                  addNotification({
                    type: 'referral_bonus',
                    title: 'Referral Rewards Available!',
                    message: `You have ${response.rewards.BNB.total.toFixed(4)} BNB in referral rewards to claim.`,
                    link: '/referrals',
                    data: {
                      amount: response.rewards.BNB.total,
                      tokenType: 'BNB',
                      claimable: true
                    }
                  });

                  // Store the current amount in localStorage
                  localStorage.setItem(notificationKey, JSON.stringify({
                    amount: response.rewards.BNB.total,
                    timestamp: new Date().toISOString()
                  }));
                } else {
                  console.log('BNB referral reward notification already exists or amount has not changed significantly');
                }
              }

              // Check for SOL rewards (legacy)
              if (response.rewards.SOL && response.rewards.SOL.total > 0) {
                console.log(`Found ${response.rewards.SOL.total.toFixed(4)} SOL in referral rewards`);

                // Check if we already have a notification for SOL referral rewards
                const existingSOLNotification = notifications.find(
                  n => n.type === 'referral_bonus' &&
                       n.data &&
                       n.data.tokenType === 'SOL'
                );

                // Also check localStorage to prevent duplicate notifications across sessions
                const notificationKey = `referralRewardNotification_SOL_${userProfile?.id}`;
                const storedNotification = localStorage.getItem(notificationKey);
                let storedAmount = 0;

                if (storedNotification) {
                  try {
                    const parsed = JSON.parse(storedNotification);
                    storedAmount = parsed.amount || 0;
                  } catch (e) {
                    console.error('Error parsing stored notification:', e);
                  }
                }

                // Only show notification if it doesn't exist or if the amount has increased significantly
                const shouldShowNotification = !existingSOLNotification &&
                  (response.rewards.SOL.total > storedAmount + 0.001); // Only show if increased by more than 0.001 SOL

                if (shouldShowNotification) {
                  console.log('Creating new notification for SOL referral rewards');
                  addNotification({
                    type: 'referral_bonus',
                    title: 'Referral Rewards Available!',
                    message: `You have ${response.rewards.SOL.total.toFixed(4)} SOL in referral rewards to claim.`,
                    link: '/referrals',
                    data: {
                      amount: response.rewards.SOL.total,
                      tokenType: 'SOL',
                      claimable: true
                    }
                  });

                  // Store the current amount in localStorage
                  localStorage.setItem(notificationKey, JSON.stringify({
                    amount: response.rewards.SOL.total,
                    timestamp: new Date().toISOString()
                  }));
                } else {
                  console.log('SOL referral reward notification already exists or amount has not changed significantly');
                }
              }

              // Check for SOLY rewards
              if (response.rewards.SOLY && response.rewards.SOLY.total > 0) {
                console.log(`Found ${response.rewards.SOLY.total.toLocaleString()} SOLY in referral rewards`);

                // Check if we already have a notification for SOLY referral rewards
                const existingSOLYNotification = notifications.find(
                  n => n.type === 'referral_bonus' &&
                       n.data &&
                       n.data.tokenType === 'SOLY'
                );

                // Also check localStorage to prevent duplicate notifications across sessions
                const notificationKey = `referralRewardNotification_SOLY_${userProfile?.id}`;
                const storedNotification = localStorage.getItem(notificationKey);
                let storedAmount = 0;

                if (storedNotification) {
                  try {
                    const parsed = JSON.parse(storedNotification);
                    storedAmount = parsed.amount || 0;
                  } catch (e) {
                    console.error('Error parsing stored notification:', e);
                  }
                }

                // Only show notification if it doesn't exist or if the amount has increased significantly
                const shouldShowNotification = !existingSOLYNotification &&
                  (response.rewards.SOLY.total > storedAmount + 1); // Only show if increased by more than 1 SOLY

                if (shouldShowNotification) {
                  console.log('Creating new notification for SOLY referral rewards');
                  addNotification({
                    type: 'referral_bonus',
                    title: 'Referral Rewards Available!',
                    message: `You have ${response.rewards.SOLY.total.toLocaleString()} SOLY in referral rewards to claim.`,
                    link: '/referrals',
                    data: {
                      amount: response.rewards.SOLY.total,
                      tokenType: 'SOLY',
                      claimable: true
                    }
                  });

                  // Store the current amount in localStorage
                  localStorage.setItem(notificationKey, JSON.stringify({
                    amount: response.rewards.SOLY.total,
                    timestamp: new Date().toISOString()
                  }));
                } else {
                  console.log('SOLY referral reward notification already exists or amount has not changed significantly');
                }
              }
            }
          } else {
            // Even if there are no new rewards, still check for existing ones occasionally
            // but use a random chance to avoid doing this on every check
            if (Math.random() < 0.2) { // 20% chance to check for existing rewards
              console.log('No new rewards found, but checking for existing rewards anyway');
              const response = await getClaimableReferralRewards();

              if (response.success && response.rewards) {
                const hasRewards = response.rewards.SOL.total > 0 || response.rewards.SOLY.total > 0;

                if (hasRewards) {
                  console.log('Found existing claimable referral rewards:', response.rewards);

                  // Check for existing SOL rewards
                  if (response.rewards.SOL && response.rewards.SOL.total > 0) {
                    const existingSOLNotification = notifications.find(
                      n => n.type === 'referral_bonus' && n.data && n.data.tokenType === 'SOL'
                    );

                    // Also check localStorage to prevent duplicate notifications across sessions
                    const notificationKey = `referralRewardNotification_SOL_${userProfile?.id}`;
                    const storedNotification = localStorage.getItem(notificationKey);
                    let storedAmount = 0;
                    let lastNotified = new Date(0); // Default to epoch start

                    if (storedNotification) {
                      try {
                        const parsed = JSON.parse(storedNotification);
                        storedAmount = parsed.amount || 0;
                        if (parsed.timestamp) {
                          lastNotified = new Date(parsed.timestamp);
                        }
                      } catch (e) {
                        console.error('Error parsing stored notification:', e);
                      }
                    }

                    // Only show notification if it doesn't exist, amount has increased, or it's been more than a day
                    const oneDayAgo = new Date();
                    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

                    const shouldShowNotification = !existingSOLNotification &&
                      (response.rewards.SOL.total > storedAmount + 0.001 || lastNotified < oneDayAgo);

                    if (shouldShowNotification) {
                      addNotification({
                        type: 'referral_bonus',
                        title: 'Referral Rewards Available!',
                        message: `You have ${response.rewards.SOL.total.toFixed(4)} SOL in referral rewards to claim.`,
                        link: '/referrals',
                        data: {
                          amount: response.rewards.SOL.total,
                          tokenType: 'SOL',
                          claimable: true
                        }
                      });

                      // Store the current amount in localStorage
                      localStorage.setItem(notificationKey, JSON.stringify({
                        amount: response.rewards.SOL.total,
                        timestamp: new Date().toISOString()
                      }));
                    }
                  }

                  // Check for existing SOLY rewards
                  if (response.rewards.SOLY && response.rewards.SOLY.total > 0) {
                    const existingSOLYNotification = notifications.find(
                      n => n.type === 'referral_bonus' && n.data && n.data.tokenType === 'SOLY'
                    );

                    // Also check localStorage to prevent duplicate notifications across sessions
                    const notificationKey = `referralRewardNotification_SOLY_${userProfile?.id}`;
                    const storedNotification = localStorage.getItem(notificationKey);
                    let storedAmount = 0;
                    let lastNotified = new Date(0); // Default to epoch start

                    if (storedNotification) {
                      try {
                        const parsed = JSON.parse(storedNotification);
                        storedAmount = parsed.amount || 0;
                        if (parsed.timestamp) {
                          lastNotified = new Date(parsed.timestamp);
                        }
                      } catch (e) {
                        console.error('Error parsing stored notification:', e);
                      }
                    }

                    // Only show notification if it doesn't exist, amount has increased, or it's been more than a day
                    const oneDayAgo = new Date();
                    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

                    const shouldShowNotification = !existingSOLYNotification &&
                      (response.rewards.SOLY.total > storedAmount + 1 || lastNotified < oneDayAgo);

                    if (shouldShowNotification) {
                      addNotification({
                        type: 'referral_bonus',
                        title: 'Referral Rewards Available!',
                        message: `You have ${response.rewards.SOLY.total.toLocaleString()} SOLY in referral rewards to claim.`,
                        link: '/referrals',
                        data: {
                          amount: response.rewards.SOLY.total,
                          tokenType: 'SOLY',
                          claimable: true
                        }
                      });

                      // Store the current amount in localStorage
                      localStorage.setItem(notificationKey, JSON.stringify({
                        amount: response.rewards.SOLY.total,
                        timestamp: new Date().toISOString()
                      }));
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking referral rewards:', error);
        }
      };

      // Check for referral rewards immediately and then every 60 seconds
      checkReferralRewards();
      const intervalId = setInterval(checkReferralRewards, 60000);

      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, notifications]);

  // Add a new notification with deduplication
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // Check for duplicate notifications based on type and content
    const isDuplicate = notifications.some(existingNotification => {
      // For referral code generation notifications
      if (notification.type === 'system' &&
          notification.title === 'Referral Code Generated' &&
          existingNotification.type === 'system' &&
          existingNotification.title === 'Referral Code Generated') {
        return true;
      }

      // For referral rewards notifications
      if (notification.type === 'referral_bonus' &&
          existingNotification.type === 'referral_bonus' &&
          notification.data?.tokenType === existingNotification.data?.tokenType) {
        return true;
      }

      return false;
    });

    // If it's a duplicate, don't add it
    if (isDuplicate) {
      console.log('Prevented duplicate notification:', notification.title);
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only the latest 50 notifications
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      // Update UI immediately for better user experience
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );

      // Call API to update backend
      const response = await markNotificationAsRead(id);

      if (!response.success) {
        console.error('Failed to mark notification as read:', response);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Update UI immediately for better user experience
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      // Call API to update backend
      const response = await markAllNotificationsAsRead();

      if (!response.success) {
        console.error('Failed to mark all notifications as read:', response);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);

    // Only remove from localStorage if user is authenticated
    if (isAuthenticated && userProfile?.id) {
      const notificationKey = `userNotifications_${userProfile.id}`;
      localStorage.removeItem(notificationKey);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
