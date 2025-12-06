import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, Wallet, Clock, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import GlowEffect from '../effects/GlowEffect';
import { Spinner } from '../ui/Spinner';
import { useWallet } from '../../contexts/WalletContext';
import { useUserStake, useUnstakeBNB } from '../../hooks/useVault';
import { useToast } from '../../hooks/useToast';
import UnstakeConfirmModal from './UnstakeConfirmModal';

interface UnstakeCardProps {
  onUnstakeSuccess?: () => void;
}

const UnstakeCard: React.FC<UnstakeCardProps> = ({ onUnstakeSuccess }) => {
  const { wallet, connectWallet } = useWallet();
  const { stakedAmount, stakedAt, isLoading: isLoadingStake } = useUserStake();
  const { unstakeBNB, isUnstaking, isSuccess, hash } = useUnstakeBNB();
  const { showToast } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastSuccessHash, setLastSuccessHash] = useState<string | undefined>();
  const [unstakeAmount, setUnstakeAmount] = useState(0);

  // Watch for transaction success
  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash) {
      setLastSuccessHash(hash);
      showToast({
        type: 'success',
        title: 'Unstake Successful!',
        message: `Successfully unstaked ${unstakeAmount.toFixed(4)} BNB from the LP Vault`,
      });
      // Wait a bit for the blockchain to update before refreshing
      setTimeout(() => {
        onUnstakeSuccess?.();
      }, 2000);
    }
  }, [isSuccess, hash, lastSuccessHash, unstakeAmount, showToast, onUnstakeSuccess]);

  const handleUnstakeClick = () => {
    if (stakedAmount <= 0) {
      showToast({ type: 'error', title: 'No Stake', message: 'You have no BNB staked in the vault' });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmUnstake = async () => {
    setUnstakeAmount(stakedAmount);
    setShowConfirmModal(false);
    await unstakeBNB(stakedAmount);
  };

  // Calculate days staked
  const daysStaked = stakedAt
    ? Math.floor((Date.now() - stakedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <GlowEffect glowColor="#8B5CF6" className="h-full">
        <Card className="h-full bg-slate-900/90 border-purple-500/30">
          <CardHeader className="border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">Unstake BNB</h3>
                <p className="text-xs md:text-sm text-slate-400">Withdraw your staked BNB</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            {!wallet.connected ? (
              <div className="text-center py-6 md:py-8">
                <Wallet className="w-12 h-12 md:w-16 md:h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 mb-4 text-sm md:text-base">Connect your wallet to view stake</p>
                <Button variant="secondary" onClick={connectWallet} className="min-h-[44px]">
                  Connect Wallet
                </Button>
              </div>
            ) : isLoadingStake ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" color="purple" />
              </div>
            ) : (
              <>
                {/* Staked Amount Display */}
                <div className="bg-slate-800/50 rounded-lg p-4 md:p-5 border border-purple-500/20">
                  <div className="text-center">
                    <p className="text-xs md:text-sm text-slate-400 mb-2">Your Staked BNB</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                      {stakedAmount.toFixed(4)} <span className="text-lg text-yellow-400">BNB</span>
                    </p>
                    {stakedAt && (
                      <div className="flex items-center justify-center gap-1 text-xs md:text-sm text-slate-400 mt-2">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Staked for {daysStaked} day{daysStaked !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning Notice */}
                {stakedAmount > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 md:p-4">
                    <div className="flex items-start gap-2 md:gap-3">
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs md:text-sm text-yellow-200/80">
                        <p className="font-medium mb-1">Unstaking will forfeit pending rewards</p>
                        <p className="text-yellow-200/60">Claim your rewards before unstaking to avoid losing them.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unstake Button */}
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleUnstakeClick}
                  disabled={stakedAmount <= 0 || isUnstaking}
                  className="min-h-[48px] md:min-h-[52px] text-base md:text-lg font-semibold border-purple-500/50 hover:bg-purple-500/20"
                >
                  {isUnstaking ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" color="white" />
                      Unstaking...
                    </span>
                  ) : stakedAmount <= 0 ? (
                    'No BNB Staked'
                  ) : (
                    'Unstake All BNB'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </GlowEffect>

      {/* Confirmation Modal */}
      <UnstakeConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmUnstake}
        amount={stakedAmount}
        isUnstaking={isUnstaking}
      />
    </>
  );
};

export default UnstakeCard;

