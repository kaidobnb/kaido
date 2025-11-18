import React, { useState, useEffect } from 'react';
import { useClaimLossEdge, useTransactionStatus, usePrediction, useLossEdgeCompensation } from '../../hooks/useContracts';
import { getTransactionUrl } from '../../config/contracts';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import { ExternalLink, Loader2, CheckCircle, XCircle, Heart } from 'lucide-react';

interface ClaimLossEdgeButtonProps {
  onChainPredictionId: number;
  userChoice: string;
  userStake: number;
  onSuccess?: (txHash: string, amount: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Component for claiming Loss-Edge compensation for losing predictions
 */
const ClaimLossEdgeButton: React.FC<ClaimLossEdgeButtonProps> = ({
  onChainPredictionId,
  userChoice,
  userStake,
  onSuccess,
  onError,
}) => {
  const { showToast } = useToast();
  const { claimLossEdge, isClaiming, txHash } = useClaimLossEdge();
  const { isConfirming, isConfirmed, isError } = useTransactionStatus(txHash);
  const { prediction, refetch } = usePrediction(onChainPredictionId);
  const { compensation, isLoading: isLoadingCompensation } = useLossEdgeCompensation(
    onChainPredictionId,
    userStake
  );
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);

  // Check if user lost
  const isLoser = prediction?.resolvedChoice && prediction.resolvedChoice !== userChoice;
  const isResolved = prediction?.status === 2; // 2 = RESOLVED

  const handleClaim = async () => {
    try {
      if (!isResolved) {
        showToast('Prediction has not been resolved yet', 'error');
        return;
      }

      if (!isLoser) {
        showToast('Only losers can claim Loss-Edge compensation', 'error');
        return;
      }

      if (!compensation || compensation === 0) {
        showToast('No compensation available', 'error');
        return;
      }

      showToast('Claiming Loss-Edge compensation...', 'info');

      const hash = await claimLossEdge(onChainPredictionId);

      showToast('Transaction submitted! Waiting for confirmation...', 'info');
    } catch (error) {
      console.error('Error claiming Loss-Edge compensation:', error);

      // Check for specific errors
      if ((error as any)?.message?.includes('User rejected')) {
        showToast('Transaction rejected', 'error');
      } else if ((error as any)?.message?.includes('already claimed')) {
        showToast('Compensation already claimed', 'error');
      } else if ((error as any)?.message?.includes('Winners cannot claim')) {
        showToast('Winners cannot claim Loss-Edge compensation', 'error');
      } else {
        showToast('Failed to claim compensation', 'error');
      }

      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Handle successful claim
  useEffect(() => {
    if (isConfirmed && txHash && compensation) {
      showToast('Loss-Edge compensation claimed successfully!', 'success');
      setClaimedAmount(compensation);
      refetch();

      if (onSuccess) {
        onSuccess(txHash, compensation);
      }
    }
  }, [isConfirmed, txHash, compensation]);

  if (!isResolved) {
    return null; // Don't show anything if not resolved
  }

  if (!isLoser) {
    return null; // Don't show for winners
  }

  if (isLoadingCompensation) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
        <Loader2 className="w-6 h-6 text-gray-400 mx-auto mb-2 animate-spin" />
        <p className="text-gray-400 text-sm">Loading compensation info...</p>
      </div>
    );
  }

  if (!compensation || compensation === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm">
          No Loss-Edge compensation available for this prediction.
        </p>
      </div>
    );
  }

  const netLoss = userStake - compensation;
  const compensationPercentage = (compensation / userStake) * 100;

  return (
    <div className="space-y-4">
      {/* Claim button */}
      {!txHash && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Heart className="w-6 h-6 text-purple-400" />
            <span className="text-purple-400 font-medium text-lg">Loss-Edge Compensation</span>
          </div>
          <div className="text-center mb-4">
            <p className="text-gray-400 text-sm mb-1">Available Compensation</p>
            <p className="text-white text-2xl font-bold">{compensation.toFixed(4)} BNB</p>
            <p className="text-gray-500 text-xs mt-1">
              ({compensationPercentage.toFixed(1)}% of your loss)
            </p>
          </div>
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Claim Compensation
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
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-6 h-6 text-purple-400" />
            <span className="text-purple-400 font-medium text-lg">Compensation Claimed!</span>
          </div>
          <div className="text-center mb-3">
            <p className="text-gray-400 text-sm mb-1">Amount Received</p>
            <p className="text-white text-2xl font-bold">{(claimedAmount || compensation).toFixed(4)} BNB</p>
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
        <h4 className="font-medium text-white mb-2">Compensation Details</h4>
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
            <span>Your Stake (Lost):</span>
            <span className="text-red-400">{userStake.toFixed(4)} BNB</span>
          </div>
          <div className="flex justify-between">
            <span>Compensation:</span>
            <span className="text-purple-400">+{compensation.toFixed(4)} BNB</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
            <span className="font-medium">Net Loss:</span>
            <span className="text-white font-medium">{netLoss.toFixed(4)} BNB</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Loss-Edge Pool compensates losers proportionally to reduce their losses
        </p>
      </div>
    </div>
  );
};

export default ClaimLossEdgeButton;

