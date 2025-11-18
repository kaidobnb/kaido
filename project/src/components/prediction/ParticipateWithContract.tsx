import React, { useState } from 'react';
import { useParticipatePrediction, useTransactionStatus, usePrediction } from '../../hooks/useContracts';
import { getTransactionUrl } from '../../config/contracts';
import { useToast } from '../../hooks/useToast';
import { participateInPrediction as participateAPI } from '../../services/api';
import Button from '../ui/Button';
import { ExternalLink, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ParticipateWithContractProps {
  predictionId: string; // MongoDB ID
  onChainPredictionId: number; // Smart contract ID
  choice: string;
  amount: number;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

/**
 * Component that handles participating in predictions via smart contract
 * and then syncing with the backend database
 */
const ParticipateWithContract: React.FC<ParticipateWithContractProps> = ({
  predictionId,
  onChainPredictionId,
  choice,
  amount,
  onSuccess,
  onError,
  onCancel,
}) => {
  const { showToast } = useToast();
  const { participate, isParticipating, txHash } = useParticipatePrediction();
  const { isConfirming, isConfirmed, isError } = useTransactionStatus(txHash);
  const { prediction, refetch } = usePrediction(onChainPredictionId);
  const [backendSynced, setBackendSynced] = useState(false);

  // Check if prediction is locked
  const isLocked = prediction?.status === 1; // 1 = LOCKED
  const isResolved = prediction?.status === 2; // 2 = RESOLVED

  const handleParticipate = async () => {
    try {
      // Validate prediction status
      if (isLocked) {
        showToast('This prediction is locked. No more participations allowed.', 'error');
        return;
      }

      if (isResolved) {
        showToast('This prediction has already been resolved.', 'error');
        return;
      }

      // Step 1: Participate on-chain
      showToast('Submitting participation to blockchain...', 'info');

      const hash = await participate(onChainPredictionId, choice, amount);

      showToast('Transaction submitted! Waiting for confirmation...', 'info');
    } catch (error) {
      console.error('Error participating on-chain:', error);
      
      // Check if it's a user rejection
      if ((error as any)?.message?.includes('User rejected')) {
        showToast('Transaction rejected', 'error');
      } else if ((error as any)?.message?.includes('locked')) {
        showToast('Prediction is locked. No more participations allowed.', 'error');
      } else {
        showToast('Failed to participate in prediction', 'error');
      }
      
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Step 2: Once transaction is confirmed, sync with backend
  React.useEffect(() => {
    if (isConfirmed && txHash && !backendSynced) {
      syncWithBackend();
    }
  }, [isConfirmed, txHash, backendSynced]);

  const syncWithBackend = async () => {
    try {
      showToast('Syncing with backend...', 'info');

      // Record participation in backend database
      const response = await participateAPI(predictionId, {
        position: choice,
        amount: amount,
        tokenType: 'BNB',
        transactionHash: txHash,
        transactionVerified: true,
        bypassBalanceCheck: true, // Already verified on-chain
        onChain: true,
      });

      if (response.success) {
        setBackendSynced(true);
        showToast('Participation recorded successfully!', 'success');

        // Refetch prediction data
        refetch();

        if (onSuccess) {
          onSuccess(txHash!);
        }
      } else {
        throw new Error(response.message || 'Failed to sync with backend');
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
      showToast('Participation recorded on-chain but failed to sync with backend', 'warning');
    }
  };

  return (
    <div className="space-y-4">
      {/* Warning if locked */}
      {isLocked && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-medium">
              This prediction is locked. No more participations allowed.
            </span>
          </div>
        </div>
      )}

      {/* Warning if resolved */}
      {isResolved && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">
              This prediction has already been resolved.
            </span>
          </div>
        </div>
      )}

      {/* Participate button */}
      {!txHash && !isLocked && !isResolved && (
        <div className="text-center">
          <Button
            onClick={handleParticipate}
            disabled={isParticipating}
            className="w-full"
          >
            {isParticipating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              `Participate with ${amount} BNB`
            )}
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full mt-2"
            >
              Cancel
            </Button>
          )}
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
      {isConfirmed && !backendSynced && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Transaction confirmed!</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Syncing with backend...</span>
          </div>
        </div>
      )}

      {/* Backend synced */}
      {backendSynced && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Participation successful!</span>
          </div>
          <a
            href={getTransactionUrl(txHash!)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
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
          <Button onClick={handleParticipate} className="w-full">
            Try Again
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
        <h4 className="font-medium text-white mb-2">Participation Summary</h4>
        <div className="space-y-1 text-gray-400">
          <div className="flex justify-between">
            <span>Your Choice:</span>
            <span className="text-white font-medium">{choice}</span>
          </div>
          <div className="flex justify-between">
            <span>Stake Amount:</span>
            <span className="text-white">{amount} BNB</span>
          </div>
          <div className="flex justify-between">
            <span>Entry Fee (5%):</span>
            <span className="text-yellow-400">{(amount * 0.05).toFixed(4)} BNB</span>
          </div>
          <div className="flex justify-between">
            <span>To Pool (95%):</span>
            <span className="text-green-400">{(amount * 0.95).toFixed(4)} BNB</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
            <span className="font-medium">Total Cost:</span>
            <span className="text-white font-medium">{amount} BNB</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Entry fee is distributed to Loss-Edge Pool (2%), Creator (1%), Affiliate (1%), and Treasury (1%)
        </p>
      </div>
    </div>
  );
};

export default ParticipateWithContract;

