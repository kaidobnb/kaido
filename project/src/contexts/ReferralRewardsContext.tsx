import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getClaimableReferralRewards } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/useToast';

interface ReferralRewards {
  BNB: {
    total: number;
    transactions: any[];
  };
  SOL: {
    total: number;
    transactions: any[];
  };
  KAIDO: {
    total: number;
    transactions: any[];
  };
}

interface ReferralRewardsContextType {
  rewards: ReferralRewards;
  isLoading: boolean;
  lastUpdated: Date | null;
  isPolling: boolean;
  pendingClaim: boolean;
  togglePolling: () => void;
  fetchRewards: (silent?: boolean) => Promise<void>;
}

const defaultRewards = {
  BNB: { total: 0, transactions: [] },
  SOL: { total: 0, transactions: [] },
  KAIDO: { total: 0, transactions: [] }
};

const ReferralRewardsContext = createContext<ReferralRewardsContextType>({
  rewards: defaultRewards,
  isLoading: false,
  lastUpdated: null,
  isPolling: true,
  pendingClaim: false,
  togglePolling: () => {},
  fetchRewards: async () => {}
});

export const useReferralRewards = () => useContext(ReferralRewardsContext);

export const ReferralRewardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rewards, setRewards] = useState<ReferralRewards>(defaultRewards);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [pendingClaim, setPendingClaim] = useState<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL = 60000; // 1 minute in milliseconds
  
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  
  const togglePolling = () => {
    setIsPolling(prev => !prev);
  };
  
  const fetchRewards = async (silent = false) => {
    if (!userProfile) return;
    
    try {
      if (!silent) {
        setIsLoading(true);
      }
      
      const response = await getClaimableReferralRewards();
      
      if (response && response.success && response.rewards) {
        // Check if there are any changes to the rewards (prioritize BNB)
        const currentTotal = rewards.BNB.total;
        const newTotal = response.rewards.BNB?.total || 0;
        const hasChanged = currentTotal !== newTotal ||
                          rewards.BNB.transactions.length !== (response.rewards.BNB?.transactions?.length || 0);
        
        // Update the rewards state with safe structure
        setRewards({
          BNB: response.rewards.BNB || { total: 0, transactions: [] },
          SOL: response.rewards.SOL || { total: 0, transactions: [] },
          KAIDO: response.rewards.KAIDO || { total: 0, transactions: [] }
        });
        
        // Update the last updated timestamp
        setLastUpdated(new Date());
        
        // Show a toast notification if there are new rewards (but only if not in silent mode or if there's a significant change)
        if (hasChanged && newTotal > currentTotal) {
          const newRewardsAmount = (newTotal - currentTotal).toFixed(4);
          showToast({
            type: 'success',
            title: 'New Referral Rewards',
            message: `You have ${newRewardsAmount} BNB in new referral rewards available to claim!`
          });
        }
        
        // Check if there's a pending claim directly from the API response
        if (response.hasPendingClaim) {
          console.log('User has a pending claim:', response.pendingClaim);
          setPendingClaim(true);
        } else {
          // Fallback check for any pending admin approval or processing transactions across all token types
          const hasPendingAdmin = ['SOL', 'BNB', 'KAIDO'].some(tokenType =>
            response.rewards[tokenType]?.transactions?.some(
              tx => (tx.status === 'pending_admin' || tx.status === 'processing') ||
                   (tx.description && tx.description.includes('Awaiting admin approval'))
            )
          );

          setPendingClaim(hasPendingAdmin);
        }
      } else {
        console.warn('Failed to load claimable rewards:', response);
        // Don't reset rewards on failure to avoid losing data
        if (rewards.BNB.total === 0 && rewards.SOL.total === 0 && rewards.KAIDO.total === 0) {
          setRewards(defaultRewards);
        }
      }
    } catch (error) {
      console.error('Error fetching claimable rewards:', error);
      // Don't reset rewards on failure to avoid losing data
      if (rewards.BNB.total === 0) {
        setRewards(defaultRewards);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };
  
  // Setup polling when component mounts or user profile changes
  useEffect(() => {
    if (userProfile) {
      // Initial fetch
      fetchRewards();
      
      // Setup polling if enabled
      if (isPolling) {
        console.log(`Setting up global polling for referral rewards every ${POLLING_INTERVAL / 1000} seconds`);
        
        // Clear any existing interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        // Set up new polling interval
        pollingIntervalRef.current = setInterval(() => {
          console.log('Global polling for referral rewards...');
          fetchRewards(true); // Silent mode to avoid loading indicators
        }, POLLING_INTERVAL);
      } else if (pollingIntervalRef.current) {
        // Clear interval if polling is disabled
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
    
    // Cleanup function to clear interval when component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        console.log('Cleaning up global referral rewards polling interval');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [userProfile, isPolling]);
  
  const value = {
    rewards,
    isLoading,
    lastUpdated,
    isPolling,
    pendingClaim,
    togglePolling,
    fetchRewards
  };
  
  return (
    <ReferralRewardsContext.Provider value={value}>
      {children}
    </ReferralRewardsContext.Provider>
  );
};
