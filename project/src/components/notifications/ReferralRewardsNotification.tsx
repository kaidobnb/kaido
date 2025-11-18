import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useReferralRewards } from '../../contexts/ReferralRewardsContext';
import { useToast } from '../../hooks/useToast';

const ReferralRewardsNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated, userProfile } = useAuth();
  const { rewards, pendingClaim } = useReferralRewards();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Get user-specific storage key
  const getStorageKey = () => {
    if (!userProfile?.id) return null;
    return `referralRewardsNotification_dismissed_${userProfile.id}`;
  };

  // Check for claimable referral rewards when rewards data changes
  useEffect(() => {
    if (isAuthenticated && userProfile?.id && rewards.BNB.total > 0 && !pendingClaim) {
      // Check if notification was previously dismissed
      const storageKey = getStorageKey();
      if (storageKey) {
        const dismissedData = localStorage.getItem(storageKey);

        if (dismissedData) {
          try {
            const parsed = JSON.parse(dismissedData);
            const lastDismissed = new Date(parsed.timestamp);
            const now = new Date();

            // If notification was dismissed less than 24 hours ago, don't show it again
            if (now.getTime() - lastDismissed.getTime() < 24 * 60 * 60 * 1000) {
              console.log('Referral rewards notification was recently dismissed, skipping display');
              return;
            }
          } catch (parseError) {
            console.error('Error parsing dismissed notification data:', parseError);
            // Continue with the check if there's an error parsing the data
          }
        }
      }

      // Show the notification if we have rewards and no pending claim
      setIsVisible(true);

      // Check if we've shown a toast notification recently
      const toastKey = `referralRewardsToast_${userProfile.id}`;
      const lastToastShown = localStorage.getItem(toastKey);
      let shouldShowToast = true;

      if (lastToastShown) {
        try {
          const parsed = JSON.parse(lastToastShown);
          const lastShown = new Date(parsed.timestamp);
          const now = new Date();

          // Only show toast if it's been more than 1 hour since the last one
          if (now.getTime() - lastShown.getTime() < 60 * 60 * 1000) {
            shouldShowToast = false;
            console.log('Skipping referral rewards toast notification (shown recently)');
          }
        } catch (error) {
          console.error('Error parsing toast timestamp:', error);
        }
      }

      // Show a toast notification if we haven't shown one recently
      if (shouldShowToast) {
        showToast({
          type: 'success',
          title: 'Referral Rewards Available!',
          message: `You have ${rewards.BNB.total.toFixed(4)} BNB in referral rewards waiting to be claimed.`,
          duration: 8000
        });

        // Save that we've shown a toast
        localStorage.setItem(toastKey, JSON.stringify({
          timestamp: new Date().toISOString(),
          amount: rewards.SOL.total
        }));
      }
    } else if (pendingClaim) {
      // If there's a pending claim, hide the notification
      setIsVisible(false);
    }
  }, [isAuthenticated, userProfile?.id, rewards.BNB.total, pendingClaim, showToast]);

  // Handle close button click
  const handleClose = () => {
    setIsVisible(false);

    // Save dismissal to localStorage
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({
        timestamp: new Date().toISOString()
      }));
    }
  };

  // Handle view rewards button click
  const handleViewRewards = () => {
    navigate('/profile/rewards');
    setIsVisible(false);

    // Save dismissal to localStorage
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({
        timestamp: new Date().toISOString()
      }));
    }
  };

  // If there are no rewards or the notification is not visible, don't render anything
  if (rewards.BNB.total === 0 || !isVisible || pendingClaim) {
    return null;
  }

  // Format the total rewards amount
  const formatTotals = () => {
    if (rewards.BNB.total > 0) {
      return `${rewards.BNB.total.toFixed(4)} BNB`;
    }
    return '0 BNB';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-800 rounded-lg shadow-lg border border-green-500/30 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="bg-green-500/20 p-2 rounded-full mr-3">
              <Users className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Referral Rewards Available!</h3>
              <p className="text-slate-300 text-sm mt-1">
                You have referral rewards totaling {formatTotals()} ready to claim.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={handleViewRewards}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            View & Claim Referral Rewards
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralRewardsNotification;
