import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader } from '../ui/Card';
import GlowEffect from '../effects/GlowEffect';
import { Spinner } from '../ui/Spinner';
import { useWallet } from '../../contexts/WalletContext';
import { useStakeBNB } from '../../hooks/useVault';
import { useToast } from '../../hooks/useToast';

interface StakeCardProps {
  onStakeSuccess?: () => void;
}

const StakeCard: React.FC<StakeCardProps> = ({ onStakeSuccess }) => {
  const { wallet, connectWallet } = useWallet();
  const { stakeBNB, isStaking, error, isSuccess, hash } = useStakeBNB();
  const { showToast } = useToast();
  const [amount, setAmount] = useState<string>('');
  const [lastSuccessHash, setLastSuccessHash] = useState<string | undefined>();

  // Safely get BNB balance with fallback to 0
  const bnbBalance = wallet?.balance?.bnb ?? 0;

  // Watch for transaction success
  useEffect(() => {
    if (isSuccess && hash && hash !== lastSuccessHash) {
      setLastSuccessHash(hash);
      const stakeAmount = parseFloat(amount);
      showToast({
        type: 'success',
        title: 'Stake Successful!',
        message: `Successfully staked ${stakeAmount} BNB into the LP Vault`,
      });
      setAmount('');
      // Wait a bit for the blockchain to update before refreshing
      setTimeout(() => {
        onStakeSuccess?.();
      }, 2000);
    }
  }, [isSuccess, hash, lastSuccessHash, amount, showToast, onStakeSuccess]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxClick = () => {
    // Leave some BNB for gas fees (0.005 BNB)
    const maxAmount = Math.max(0, bnbBalance - 0.005);
    setAmount(maxAmount.toFixed(6));
  };

  const handleStake = async () => {
    const stakeAmount = parseFloat(amount);
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      showToast({ type: 'error', title: 'Invalid Amount', message: 'Please enter a valid amount to stake' });
      return;
    }

    const result = await stakeBNB(stakeAmount);
    if (!result.success && error) {
      showToast({ type: 'error', title: 'Stake Failed', message: error || 'Failed to stake BNB' });
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const isValidAmount = parsedAmount > 0 && parsedAmount <= wallet.balance.bnb;
  const insufficientBalance = parsedAmount > wallet.balance.bnb;

  return (
    <GlowEffect glowColor="#F3BA2F" className="h-full">
      <Card className="h-full bg-slate-900/90 border-yellow-500/30">
        <CardHeader className="border-b border-yellow-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <ArrowUpCircle className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Stake BNB</h3>
              <p className="text-xs md:text-sm text-slate-400">Deposit BNB to earn LP rewards</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
          {!wallet.connected ? (
            <div className="text-center py-6 md:py-8">
              <Wallet className="w-12 h-12 md:w-16 md:h-16 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-4 text-sm md:text-base">Connect your wallet to stake BNB</p>
              <Button variant="primary" onClick={connectWallet} className="min-h-[44px]">
                Connect Wallet
              </Button>
            </div>
          ) : (
            <>
              {/* Balance Display */}
              <div className="bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm text-slate-400">Available Balance</span>
                  <span className="text-sm md:text-base text-white font-medium">
                    {bnbBalance.toFixed(4)} BNB
                  </span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs md:text-sm text-slate-400">Amount to Stake</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full bg-slate-800/70 border border-slate-600 rounded-lg px-4 py-3 md:py-4 text-white text-lg md:text-xl font-medium focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 pr-20"
                  />
                  <button
                    onClick={handleMaxClick}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs md:text-sm font-medium rounded hover:bg-yellow-500/30 transition-colors min-h-[32px]"
                  >
                    MAX
                  </button>
                </div>
                {insufficientBalance && (
                  <div className="flex items-center gap-2 text-red-400 text-xs md:text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Insufficient BNB balance</span>
                  </div>
                )}
              </div>

              {/* Stake Button */}
              <Button
                variant="primary"
                fullWidth
                onClick={handleStake}
                disabled={!isValidAmount || isStaking}
                className="min-h-[48px] md:min-h-[52px] text-base md:text-lg font-semibold"
              >
                {isStaking ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" color="black" />
                    Staking...
                  </span>
                ) : (
                  'Stake BNB'
                )}
              </Button>

              {/* Info Text */}
              <p className="text-xs text-slate-500 text-center">
                Staked BNB earns rewards from three revenue engines
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </GlowEffect>
  );
};

export default StakeCard;

