import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { checkNewReferrals } from '../../services/api';

const ReferralNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [referralData, setReferralData] = useState<any>(null);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const { isAuthenticated, userProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Get user-specific storage key
  const getStorageKey = () => {
    if (!userProfile?.id) return null;
    return `referralNotification_dismissed_${userProfile.id}`;
  };

  // Check for new referrals when the component mounts
  useEffect(() => {
    const checkForReferrals = async () => {
      if (isAuthenticated && !hasChecked && userProfile?.id) {
        try {
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
                  console.log('Referral notification was recently dismissed, skipping check');
                  setHasChecked(true);
                  return;
                }
              } catch (parseError) {
                console.error('Error parsing dismissed notification data:', parseError);
                // Continue with the check if there's an error parsing the data
              }
            }
          }

          console.log('Checking for new referrals...');
          const response = await checkNewReferrals();

          if (response.success) {
            console.log('Referral check response:', response);

            // If there are any referrals, store the data
            if (response.totalReferrals > 0) {
              setReferralData(response);

              // Only show the notification if there are recent referrals
              if (response.recentReferralsCount > 0) {
                // Check if we've already shown this notification for these specific referrals
                const shownKey = `referralNotification_shown_${userProfile.id}`;
                const shownData = localStorage.getItem(shownKey);

                let shouldShow = true;
                if (shownData) {
                  try {
                    const parsed = JSON.parse(shownData);
                    // Only show if the count has increased
                    if (parsed.count >= response.recentReferralsCount) {
                      shouldShow = false;
                    }
                  } catch (parseError) {
                    console.error('Error parsing shown notification data:', parseError);
                  }
                }

                if (shouldShow) {
                  setIsVisible(true);

                  // Save that we've shown this notification
                  localStorage.setItem(shownKey, JSON.stringify({
                    count: response.recentReferralsCount,
                    timestamp: new Date().toISOString()
                  }));

                  // Check if we've shown a toast notification recently
                  const toastKey = `referralToast_${userProfile.id}`;
                  const lastToastShown = localStorage.getItem(toastKey);
                  let shouldShowToast = true;

                  if (lastToastShown) {
                    try {
                      const parsed = JSON.parse(lastToastShown);
                      const lastShown = new Date(parsed.timestamp);
                      const now = new Date();

                      // Only show toast if it's been more than 30 minutes since the last one
                      if (now.getTime() - lastShown.getTime() < 30 * 60 * 1000) {
                        shouldShowToast = false;
                        console.log('Skipping referral toast notification (shown recently)');
                      }
                    } catch (error) {
                      console.error('Error parsing toast timestamp:', error);
                    }
                  }

                  // Show a toast notification if we haven't shown one recently
                  if (shouldShowToast) {
                    showToast({
                      type: 'success',
                      title: 'New Referrals!',
                      message: `You have ${response.recentReferralsCount} new referrals!`,
                      duration: 5000
                    });

                    // Save that we've shown a toast
                    localStorage.setItem(toastKey, JSON.stringify({
                      timestamp: new Date().toISOString(),
                      count: response.recentReferralsCount
                    }));
                  }
                } else {
                  console.log('Skipping notification as it was already shown');
                }
              }
            }

            // If any discrepancies were fixed, log it
            if (response.discrepanciesFixed > 0) {
              console.log(`Fixed ${response.discrepanciesFixed} referral discrepancies`);
            }
          }
        } catch (error) {
          console.error('Error checking for referrals:', error);
        } finally {
          setHasChecked(true);
        }
      }
    };

    checkForReferrals();

    // Set up periodic checking for new referrals
    const intervalId = setInterval(() => {
      if (isAuthenticated && userProfile?.id) {
        checkForReferrals();
      }
    }, 60000 + Math.floor(Math.random() * 10000)); // Check approximately every minute with some randomization

    return () => clearInterval(intervalId);
  }, [isAuthenticated, hasChecked, showToast, userProfile?.id]);

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

  // Handle view referrals button click
  const handleViewReferrals = () => {
    navigate('/referrals');
    setIsVisible(false);

    // Save dismissal to localStorage
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({
        timestamp: new Date().toISOString()
      }));
    }
  };

  // If there are no referrals or the notification is not visible, don't render anything
  if (!referralData || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-sm bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-lg overflow-hidden animate-slideUp">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="bg-purple-700 rounded-full p-2 mr-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">New Referrals!</h3>
              <p className="text-purple-200 text-sm">
                {referralData.recentReferralsCount} new users have joined using your referral link!
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-purple-200 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={handleViewReferrals}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
          >
            View Your Referrals
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralNotification;
