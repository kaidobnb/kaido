import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import * as lpVaultService from '../services/lpVaultService';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS, LPVaultABI } from '../config/contracts';

// Types for vault data
export interface VaultStats {
  totalTVL: number;
  totalStakers: number;
  apy: number;
  isLoading: boolean;
  error: string | null;
}

export interface UserStake {
  stakedAmount: number;
  stakedAt: Date | null;
  isLoading: boolean;
  error: string | null;
}

export interface PendingRewards {
  totalRewards: number;
  boostVaultRewards: number;
  creatorBackingRewards: number;
  engagementSupportRewards: number;
  isLoading: boolean;
  error: string | null;
}

export interface ActivityItem {
  id: string;
  type: 'stake' | 'unstake' | 'claim' | 'reward';
  amount: number;
  timestamp: Date;
  txHash?: string;
}

// Hook to fetch total vault TVL and stats
export const useVaultTVL = (): VaultStats => {
  const [stats, setStats] = useState<VaultStats>({
    totalTVL: 0,
    totalStakers: 0,
    apy: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchVaultStats = async () => {
      try {
        const vaultStats = await lpVaultService.getVaultStats();
        const totalTVL = parseFloat(vaultStats.balances.total);

        setStats({
          totalTVL,
          totalStakers: vaultStats.totalStakers,
          apy: 12.5, // TODO: Calculate APY based on yield
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching vault stats:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch vault stats',
        }));
      }
    };

    fetchVaultStats();
  }, []);

  return stats;
};

// Hook to fetch user's staked amount
export const useUserStake = (): UserStake & { refetch: () => Promise<void> } => {
  const { wallet } = useWallet();
  const [stake, setStake] = useState<UserStake>({
    stakedAmount: 0,
    stakedAt: null,
    isLoading: true,
    error: null,
  });

  const fetchUserStake = useCallback(async () => {
    if (!wallet.connected || !wallet.address) {
      setStake({ stakedAmount: 0, stakedAt: null, isLoading: false, error: null });
      return;
    }

    try {
      setStake(prev => ({ ...prev, isLoading: true }));
      const userInfo = await lpVaultService.getUserLPInfo(wallet.address);
      setStake({
        stakedAmount: parseFloat(userInfo.balance),
        stakedAt: null, // TODO: Track stake timestamp
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching user stake:', error);
      setStake(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch stake info',
      }));
    }
  }, [wallet.connected, wallet.address]);

  useEffect(() => {
    fetchUserStake();
  }, [fetchUserStake]);

  return { ...stake, refetch: fetchUserStake };
};

// Hook to fetch user's pending rewards
export const usePendingRewards = (): PendingRewards & { refetch: () => Promise<void> } => {
  const { wallet } = useWallet();
  const [rewards, setRewards] = useState<PendingRewards>({
    totalRewards: 0,
    boostVaultRewards: 0,
    creatorBackingRewards: 0,
    engagementSupportRewards: 0,
    isLoading: true,
    error: null,
  });

  const fetchRewards = useCallback(async () => {
    if (!wallet.connected || !wallet.address) {
      setRewards({
        totalRewards: 0, boostVaultRewards: 0, creatorBackingRewards: 0,
        engagementSupportRewards: 0, isLoading: false, error: null,
      });
      return;
    }

    try {
      setRewards(prev => ({ ...prev, isLoading: true }));
      const userInfo = await lpVaultService.getUserLPInfo(wallet.address);
      const totalRewards = parseFloat(userInfo.claimableRewards);

      // TODO: Get breakdown by yield source from backend
      setRewards({
        totalRewards,
        boostVaultRewards: totalRewards * 0.4, // Approximate
        creatorBackingRewards: totalRewards * 0.4, // Approximate
        engagementSupportRewards: totalRewards * 0.2, // Approximate
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewards(prev => ({ ...prev, isLoading: false, error: 'Failed to fetch rewards' }));
    }
  }, [wallet.connected, wallet.address]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  return { ...rewards, refetch: fetchRewards };
};

// Hook to stake BNB into the vault
export const useStakeBNB = () => {
  const { wallet } = useWallet();
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [error, setError] = useState<string | null>(null);

  const stakeBNB = useCallback(async (amount: number): Promise<{ success: boolean; txHash?: string }> => {
    if (!wallet.connected || !wallet.address) {
      setError('Wallet not connected');
      return { success: false };
    }

    if (amount <= 0) {
      setError('Invalid amount');
      return { success: false };
    }

    if (amount > wallet.balance.bnb) {
      setError('Insufficient BNB balance');
      return { success: false };
    }

    try {
      setError(null);
      reset(); // Reset previous transaction state
      writeContract({
        address: CONTRACTS.LP_VAULT,
        abi: LPVaultABI,
        functionName: 'stake',
        value: parseEther(amount.toString()),
      });

      return { success: true, txHash: hash };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stake BNB';
      setError(errorMessage);
      return { success: false };
    }
  }, [wallet.connected, wallet.address, wallet.balance.bnb, writeContract, hash, reset]);

  return {
    stakeBNB,
    isStaking: isPending || isConfirming,
    error: error || (writeError?.message ?? null),
    isSuccess,
    hash
  };
};

// Hook to unstake BNB from the vault
export const useUnstakeBNB = () => {
  const { wallet } = useWallet();
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [error, setError] = useState<string | null>(null);

  const unstakeBNB = useCallback(async (amount: number): Promise<{ success: boolean; txHash?: string }> => {
    if (!wallet.connected || !wallet.address) {
      setError('Wallet not connected');
      return { success: false };
    }

    if (amount <= 0) {
      setError('Invalid amount');
      return { success: false };
    }

    try {
      setError(null);
      reset(); // Reset previous transaction state
      writeContract({
        address: CONTRACTS.LP_VAULT,
        abi: LPVaultABI,
        functionName: 'unstake',
        args: [parseEther(amount.toString())],
      });

      return { success: true, txHash: hash };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unstake BNB';
      setError(errorMessage);
      return { success: false };
    }
  }, [wallet.connected, wallet.address, writeContract, hash, reset]);

  return {
    unstakeBNB,
    isUnstaking: isPending || isConfirming,
    error: error || (writeError?.message ?? null),
    isSuccess,
    hash
  };
};

// Hook to claim LP rewards
export const useClaimRewards = () => {
  const { wallet } = useWallet();
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [error, setError] = useState<string | null>(null);

  const claimRewards = useCallback(async (): Promise<{ success: boolean; txHash?: string; amount?: number }> => {
    if (!wallet.connected || !wallet.address) {
      setError('Wallet not connected');
      return { success: false };
    }

    try {
      setError(null);

      // Get claimable amount first
      const userInfo = await lpVaultService.getUserLPInfo(wallet.address);
      const claimableAmount = parseFloat(userInfo.claimableRewards);

      if (claimableAmount <= 0) {
        setError('No rewards to claim');
        return { success: false };
      }

      reset(); // Reset previous transaction state
      writeContract({
        address: CONTRACTS.LP_VAULT,
        abi: LPVaultABI,
        functionName: 'claimRewards',
      });

      return { success: true, txHash: hash, amount: claimableAmount };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim rewards';
      setError(errorMessage);
      return { success: false };
    }
  }, [wallet.connected, wallet.address, writeContract, hash, reset]);

  return {
    claimRewards,
    isClaiming: isPending || isConfirming,
    error: error || (writeError?.message ?? null),
    isSuccess,
    hash
  };
};

// Hook to fetch activity history
export const useVaultActivity = (): { activities: ActivityItem[]; isLoading: boolean; error: string | null } => {
  const { wallet } = useWallet();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!wallet.connected || !wallet.address) {
        setActivities([]);
        setIsLoading(false);
        return;
      }

      try {
        const events = await lpVaultService.getUserActivity(wallet.address);

        // Convert backend events to ActivityItem format
        const activityItems: ActivityItem[] = events.map(event => ({
          id: event.id,
          type: event.type,
          amount: parseFloat(event.amount),
          timestamp: new Date(event.timestamp * 1000), // Convert Unix timestamp to Date
        }));

        setActivities(activityItems);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError('Failed to fetch activity');
        setActivities([]);
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [wallet.connected, wallet.address]);

  return { activities, isLoading, error };
};

