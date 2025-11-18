import React, { useState, useRef } from 'react';
import { DollarSign, RefreshCw, Check, Clock, AlertCircle, Pause, Play } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import { claimReferralRewards } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { useReferralRewards } from '../../contexts/ReferralRewardsContext';

interface ReferralRewardsProps {
  onRewardsUpdated?: () => void;
}

interface RewardTransaction {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  prediction?: {
    id: string;
    title: string;
  };
  referredUser?: {
    id: string;
    username: string;
    walletAddress: string;
  };
}

interface TokenRewards {
  total: number;
  totalEarned?: number; // Total earned (pending + completed)
  transactions: RewardTransaction[];
}

interface ClaimableRewards {
  SOL: TokenRewards;
  BNB: TokenRewards;
  KAIDO: TokenRewards;
}

const ReferralRewards: React.FC<ReferralRewardsProps> = ({ onRewardsUpdated }) => {
  const [isClaimingSOL, setIsClaimingSOL] = useState<boolean>(false);
  const [isClaimingBNB, setIsClaimingBNB] = useState<boolean>(false);
  const [isClaimingKAIDO, setIsClaimingKAIDO] = useState<boolean>(false);
  const { showToast } = useToast();
  const { userProfile } = useAuth();
  const {
    rewards,
    isLoading,
    lastUpdated,
    isPolling,
    pendingClaim: pendingClaimSOL,
    togglePolling,
    fetchRewards
  } = useReferralRewards();



  const handleClaimRewards = async (tokenType: 'SOL' | 'BNB' | 'KAIDO') => {
    if (!userProfile) return;

    // Check if a claim is already pending
    if (pendingClaimSOL) {
      showToast({
        type: 'warning',
        title: 'Claim Already Pending',
        message: `You already have a pending ${tokenType} referral rewards claim. Please wait for it to be processed.`
      });
      return;
    }

    try {
      // Set the appropriate claiming state
      if (tokenType === 'SOL') setIsClaimingSOL(true);
      else if (tokenType === 'BNB') setIsClaimingBNB(true);
      else if (tokenType === 'KAIDO') setIsClaimingKAIDO(true);

      const response = await claimReferralRewards(tokenType);

      if (response && response.success) {
        showToast({
          type: 'success',
          title: 'Claim Submitted',
          message: `Your ${tokenType} referral rewards claim has been submitted and is awaiting admin approval.`
        });

        // Refresh rewards after claiming to get the updated status
        fetchRewards();

        // Notify parent component if needed
        if (onRewardsUpdated) {
          onRewardsUpdated();
        }
      } else {
        showToast({
          type: 'error',
          title: 'Claim Failed',
          message: response?.message || `Failed to claim ${tokenType} referral rewards.`
        });
      }
    } catch (error) {
      console.error(`Error claiming ${tokenType} rewards:`, error);
      showToast({
        type: 'error',
        title: 'Error',
        message: `Failed to claim ${tokenType} referral rewards.`
      });
    } finally {
      // Reset the appropriate claiming state
      if (tokenType === 'SOL') setIsClaimingSOL(false);
      else if (tokenType === 'BNB') setIsClaimingBNB(false);
      else if (tokenType === 'KAIDO') setIsClaimingKAIDO(false);
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to render token rewards
  const renderTokenRewards = (tokenType: 'SOL' | 'BNB' | 'KAIDO', tokenData: TokenRewards, isClaimingState: boolean) => {
    if (pendingClaimSOL || tokenData.total <= 0) return null;

    const tokenColors = {
      SOL: 'text-yellow-400',
      BNB: 'text-orange-400',
      KAIDO: 'text-purple-400'
    };

    const decimals = tokenType === 'KAIDO' ? 0 : 4;

    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <DollarSign className={`h-5 w-5 ${tokenColors[tokenType]} mr-2`} />
            <span className="text-white font-medium">{tokenType} Rewards</span>
          </div>
          <span className="text-xl font-bold text-white">{tokenData.total.toFixed(decimals)} {tokenType}</span>
        </div>

        {tokenData.totalEarned !== undefined && (
          <div className="flex justify-between items-center mb-4 bg-slate-700/30 p-2 rounded">
            <span className="text-slate-300 text-sm">Total Earned (Lifetime):</span>
            <span className="text-white font-medium">{tokenData.totalEarned.toFixed(decimals)} {tokenType}</span>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">
            You have {tokenData.transactions.length} pending {tokenType} {tokenData.transactions.length === 1 ? 'reward' : 'rewards'}
          </p>

          {tokenData.transactions.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-3 max-h-32 overflow-y-auto">
              {tokenData.transactions.map((tx, index) => (
                <div key={tx.id} className={`text-xs ${index > 0 ? 'mt-2 pt-2 border-t border-slate-600/50' : ''}`}>
                  <div className="flex justify-between">
                    <span className="text-slate-300">{formatDate(tx.createdAt)}</span>
                    <span className={tokenColors[tokenType]}>{tx.amount.toFixed(decimals)} {tokenType}</span>
                  </div>
                  {tx.referredUser ? (
                    <p className="text-slate-400 mt-1 truncate">
                      Reward from <span className="text-purple-400">{tx.referredUser.username || 'Anonymous'}</span>'s prediction
                    </p>
                  ) : (
                    <p className="text-slate-400 mt-1 truncate">{tx.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={() => handleClaimRewards(tokenType)}
          disabled={isClaimingState}
        >
          {isClaimingState ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Claim {tokenData.total.toFixed(decimals)} {tokenType}
            </>
          )}
        </Button>
      </div>
    );
  };

  // Only consider rewards as available if they're not already claimed (pending approval)
  const hasRewards = !pendingClaimSOL && (rewards.BNB.total > 0 || rewards.SOL.total > 0 || rewards.KAIDO.total > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-purple-400 mr-2" />
            <div>
              <h3 className="text-lg font-medium text-white flex items-center">
                Claimable Referral Rewards
                {(rewards.BNB.total > 0 || rewards.SOL.total > 0 || rewards.KAIDO.total > 0) && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-purple-500 text-white text-xs font-bold rounded-full">
                    !
                  </span>
                )}
              </h3>
              {lastUpdated && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                  {isPolling && (
                    <span className="ml-2 text-green-400 animate-pulse">•</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="tertiary"
              size="sm"
              onClick={togglePolling}
              title={isPolling ? "Pause auto-refresh" : "Enable auto-refresh"}
            >
              {isPolling ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => fetchRewards()}
              disabled={isLoading}
              title="Manually refresh rewards"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!userProfile ? (
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-slate-300">Connect your wallet to view your claimable rewards</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : pendingClaimSOL ? (
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <div className="bg-amber-900/30 border border-amber-700/30 rounded-lg p-3 text-center mb-4">
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-400 mr-2" />
                <span className="text-amber-300 text-sm">Referral Rewards Claim Pending</span>
              </div>
              <p className="text-xs text-amber-200/80 mt-2">
                Your referral rewards claim is awaiting admin approval
              </p>
              <p className="text-xs text-amber-200/60 mt-1">
                Funds will be sent to your wallet once approved
              </p>
            </div>
            <p className="text-slate-300">Check back later for the status of your claim</p>
          </div>
        ) : !hasRewards ? (
          <div className="bg-slate-800 rounded-lg p-4 text-center">
            <p className="text-slate-300">You don't have any claimable referral rewards yet</p>
            <p className="text-sm text-slate-400 mt-2">
              Share your referral link with friends and earn rewards when they participate in predictions!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* BNB Rewards (Primary) */}
            {renderTokenRewards('BNB', rewards.BNB, isClaimingBNB)}

            {/* KAIDO Rewards */}
            {renderTokenRewards('KAIDO', rewards.KAIDO, isClaimingKAIDO)}

            {/* SOL Rewards (Legacy) */}
            {renderTokenRewards('SOL', rewards.SOL, isClaimingSOL)}

            <div className="text-center text-sm text-slate-400">
              <p>Referral rewards are earned when users you referred participate in predictions.</p>
              <p className="mt-1">Share your referral link to earn more BNB rewards!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralRewards;
