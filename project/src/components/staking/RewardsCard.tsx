import React, { useState, useEffect } from 'react';
import { Gift, Wallet, TrendingUp, Users, Zap } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import GlowEffect from '../effects/GlowEffect';
import { Spinner } from '../ui/Spinner';
import { useWallet } from '../../contexts/WalletContext';
import { usePendingRewards, useClaimRewards } from '../../hooks/useVault';
import { useToast } from '../../hooks/useToast';

interface RewardsCardProps {
  onClaimSuccess?: () => void;
}

const RewardsCard: React.FC<RewardsCardProps> = ({ onClaimSuccess }) => {
  const { wallet, connectWallet } = useWallet();
  const {
    totalRewards,
    boostVaultRewards,
    creatorBackingRewards,
    engagementSupportRewards,
    isLoading: isLoadingRewards,
  } = usePendingRewards();
  const { claimRewards, isClaiming, isSuccess, hash } = useClaimRewards();
  const { showToast } = useToast();
  const [lastSuccessHash, setLastSuccessHash] = useState<string | undefined>();
  const [claimAmount, setClaimAmount] = useState(0);

  // Watch for transaction success
  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash) {
      setLastSuccessHash(hash);
      showToast({
        type: 'success',
        title: 'Rewards Claimed!',
        message: `Successfully claimed ${claimAmount.toFixed(4)} BNB in rewards`,
      });
      // Wait a bit for the blockchain to update before refreshing
      setTimeout(() => {
        onClaimSuccess?.();
      }, 2000);
    }
  }, [isSuccess, hash, lastSuccessHash, claimAmount, showToast, onClaimSuccess]);

  const handleClaim = async () => {
    if (totalRewards <= 0) {
      showToast({ type: 'error', title: 'No Rewards', message: 'You have no rewards to claim' });
      return;
    }

    setClaimAmount(totalRewards);
    await claimRewards();
  };

  const rewardSources = [
    { label: 'Boost Vault', amount: boostVaultRewards, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Creator Backing', amount: creatorBackingRewards, icon: Users, color: 'text-blue-400' },
    { label: 'Engagement Support', amount: engagementSupportRewards, icon: Zap, color: 'text-purple-400' },
  ];

  return (
    <GlowEffect glowColor="#22C55E" className="h-full">
      <Card className="h-full bg-slate-900/90 border-green-500/30">
        <CardHeader className="border-b border-green-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">LP Rewards</h3>
              <p className="text-xs md:text-sm text-slate-400">Claim your earned rewards</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
          {!wallet.connected ? (
            <div className="text-center py-6 md:py-8">
              <Wallet className="w-12 h-12 md:w-16 md:h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-4 text-sm md:text-base">Connect your wallet to view rewards</p>
              <Button variant="success" onClick={connectWallet} className="min-h-[44px]">
                Connect Wallet
              </Button>
            </div>
          ) : isLoadingRewards ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" color="green" />
            </div>
          ) : (
            <>
              {/* Total Rewards Display */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 md:p-5 border border-green-500/20">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-slate-400 mb-2">Pending Rewards</p>
                  <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {totalRewards.toFixed(4)} <span className="text-lg text-yellow-400">BNB</span>
                  </p>
                </div>
              </div>

              {/* Reward Breakdown */}
              <div className="space-y-2 md:space-y-3">
                <p className="text-xs md:text-sm text-slate-400 font-medium">Reward Sources</p>
                {rewardSources.map((source) => {
                  const Icon = source.icon;
                  return (
                    <div
                      key={source.label}
                      className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2.5 md:p-3 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${source.color}`} />
                        <span className="text-xs md:text-sm text-slate-300">{source.label}</span>
                      </div>
                      <span className="text-xs md:text-sm text-white font-medium">
                        +{source.amount.toFixed(4)} BNB
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Claim Button */}
              <Button
                variant="success"
                fullWidth
                onClick={handleClaim}
                disabled={totalRewards <= 0 || isClaiming}
                className="min-h-[48px] md:min-h-[52px] text-base md:text-lg font-semibold"
              >
                {isClaiming ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" color="white" />
                    Claiming...
                  </span>
                ) : totalRewards <= 0 ? (
                  'No Rewards Available'
                ) : (
                  'Claim Rewards'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </GlowEffect>
  );
};

export default RewardsCard;

