import React, { useState } from 'react';
import { useClaimWinnings, useTransactionStatus, usePrediction } from '../../hooks/useContracts';
import { getTransactionUrl } from '../../config/contracts';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import { ExternalLink, Loader2, CheckCircle, XCircle, Trophy } from 'lucide-react';

interface ClaimWinningsButtonProps {
  onChainPredictionId: number;
  userChoice: string;
  userStake: number;
  onSuccess?: (txHash: string, amount: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Component for claiming winnings from resolved predictions
 */
const ClaimWinningsButton: React.FC<ClaimWinningsButtonProps> = ({
  onChainPredictionId,
  userChoice,
  userStake,
  onSuccess,
  onError,
}) => {
  const { showToast } = useToast();
  const { claimWinnings, isClaiming, txHash } = useClaimWinnings();
  const { isConfirming, isConfirmed, isError } = useTransactionStatus(txHash);
  const { prediction, refetch } = usePrediction(onChainPredictionId);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);

  // Check if user won
  const isWinner = prediction?.resolvedChoice === userChoice;
  const isResolved = prediction?.status === 2; // 2 = RESOLVED

  // Calculate estimated winnings (simplified - actual calculation is done on-chain)
  const estimatedWinnings = isWinner && prediction
    ? (parseFloat(prediction.totalPool) * (userStake / parseFloat(prediction.totalPool)))
    : 0;

  const handleClaim = async () => {
    try {
      if (!isResolved) {
        showToast('Prediction has not been resolved yet', 'error');
        return;
      }

      if (!isWinner) {
        showToast('You did not win this prediction', 'error');
        return;
      }

      showToast('Claiming winnings...', 'info');

      const hash = await claimWinnings(onChainPredictionId);

      showToast('Transaction submitted! Waiting for confirmation...', 'info');
    } catch (error) {
      console.error('Error claiming winnings:', error);

      // Check for specific errors
      if ((error as any)?.message?.includes('User rejected')) {
        showToast('Transaction rejected', 'error');
      } else if ((error as any)?.message?.includes('already claimed')) {
        showToast('Winnings already claimed', 'error');
      } else if ((error as any)?.message?.includes('not a winner')) {
        showToast('You are not a winner of this prediction', 'error');
      } else {
        showToast('Failed to claim winnings', 'error');
      }

      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Handle successful claim
  React.useEffect(() => {
    if (isConfirmed && txHash) {
      showToast('Winnings claimed successfully!', 'success');
      refetch();

      if (onSuccess) {
        onSuccess(txHash, estimatedWinnings);
      }
    }
  }, [isConfirmed, txHash]);

  if (!isResolved) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm">
          Prediction not yet resolved. Check back later to claim your winnings.
        </p>
      </div>
    );
  }

  if (!isWinner) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
        <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 font-medium">You did not win this prediction</p>
        <p className="text-gray-400 text-sm mt-1">
          Winning choice: <span className="text-white font-medium">{prediction?.resolvedChoice}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Claim button */}
      {!txHash && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Trophy className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-medium text-lg">You Won!</span>
          </div>
          <div className="text-center mb-4">
            <p className="text-gray-400 text-sm mb-1">Estimated Winnings</p>
            <p className="text-white text-2xl font-bold">{estimatedWinnings.toFixed(4)} BNB</p>
          </div>
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Claim Winnings
              </>
            )}
          </Button>
        </div>
      )}

      {/* Transaction submitted */}
      {txHash && !isConfirmed && !isError && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-blue-400 font-medium">
              {isConfirming ? 'Confirming transaction...' : 'Transaction submitted'}
            </span>
          </div>
          <a
            href={getTransactionUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View on BSCScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Transaction confirmed */}
      {isConfirmed && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-medium text-lg">Winnings Claimed!</span>
          </div>
          <div className="text-center mb-3">
            <p className="text-gray-400 text-sm mb-1">Amount Received</p>
            <p className="text-white text-2xl font-bold">{estimatedWinnings.toFixed(4)} BNB</p>
          </div>
          <a
            href={getTransactionUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center space-x-1"
          >
            <span>View transaction</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Transaction error */}
      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Transaction failed</span>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            The transaction was rejected or failed. Please try again.
          </p>
          <Button onClick={handleClaim} className="w-full">
            Try Again
          </Button>
        </div>
      )}

      {/* Details */}
      <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
        <h4 className="font-medium text-white mb-2">Claim Details</h4>
        <div className="space-y-1 text-gray-400">
          <div className="flex justify-between">
            <span>Your Choice:</span>
            <span className="text-white font-medium">{userChoice}</span>
          </div>
          <div className="flex justify-between">
            <span>Winning Choice:</span>
            <span className="text-green-400 font-medium">{prediction?.resolvedChoice}</span>
          </div>
          <div className="flex justify-between">
            <span>Your Stake:</span>
            <span className="text-white">{userStake} BNB</span>
          </div>
          <div className="flex justify-between">
            <span>Total Pool:</span>
            <span className="text-white">{prediction?.totalPool} BNB</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
            <span className="font-medium">Estimated Winnings:</span>
            <span className="text-green-400 font-medium">{estimatedWinnings.toFixed(4)} BNB</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Winnings are distributed proportionally based on your stake
        </p>
      </div>
    </div>
  );
};

export default ClaimWinningsButton;

