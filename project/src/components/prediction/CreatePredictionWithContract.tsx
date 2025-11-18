import React, { useState } from 'react';
import { useCreatePrediction, useTransactionStatus } from '../../hooks/useContracts';
import { getTransactionUrl } from '../../config/contracts';
import { useToast } from '../../hooks/useToast';
import { createPrediction as createPredictionAPI } from '../../services/api';
import Button from '../ui/Button';
import { ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface CreatePredictionWithContractProps {
  predictionData: {
    title: string;
    description: string;
    type: 'binary' | 'multiple';
    asset: string;
    targetPrice?: number;
    priceRanges?: string[];
    endDate: string;
    stakeAmount: number;
    tokenType: string;
    resolveDetails: string;
  };
  onSuccess?: (predictionId: string, txHash: string) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

/**
 * Component that handles creating predictions on-chain via smart contract
 * and then syncing with the backend database
 */
const CreatePredictionWithContract: React.FC<CreatePredictionWithContractProps> = ({
  predictionData,
  onSuccess,
  onError,
  onCancel,
}) => {
  const { showToast } = useToast();
  const { createPrediction, isCreating, txHash } = useCreatePrediction();
  const { isConfirming, isConfirmed, isError } = useTransactionStatus(txHash);
  const [backendSynced, setBackendSynced] = useState(false);
  const [predictionId, setPredictionId] = useState<string | null>(null);

  const handleCreatePrediction = async () => {
    try {
      // Step 1: Create prediction on-chain
      showToast('Creating prediction on blockchain...', 'info');

      const endDateTimestamp = Math.floor(new Date(predictionData.endDate).getTime() / 1000);

      const hash = await createPrediction({
        title: predictionData.title,
        description: predictionData.description,
        predictionType: predictionData.type === 'binary' ? 0 : 1,
        category: 0, // 0 = CRYPTO (for now, can be extended for sports)
        asset: predictionData.asset,
        targetPrice: predictionData.targetPrice || 0,
        endDate: endDateTimestamp,
        choices: predictionData.type === 'binary' ? ['YES', 'NO'] : predictionData.priceRanges || [],
        creatorStake: predictionData.stakeAmount,
      });

      showToast('Transaction submitted! Waiting for confirmation...', 'info');
    } catch (error) {
      console.error('Error creating prediction on-chain:', error);
      showToast('Failed to create prediction on blockchain', 'error');
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

      // Get the on-chain prediction ID from the transaction receipt
      // The PredictionCreated event emits the prediction ID
      // For now, we'll use a placeholder - in production, you'd parse the event logs
      // TODO: Parse transaction receipt to get actual prediction ID from PredictionCreated event
      const onChainPredictionId = 0; // Placeholder - will be updated when we parse events

      // Create prediction in backend database with transaction hash and on-chain ID
      const response = await createPredictionAPI({
        ...predictionData,
        transactionHash: txHash,
        onChainId: onChainPredictionId,
        transactionVerified: true,
        bypassBalanceCheck: true, // Already verified on-chain
        onChain: true, // Mark as on-chain prediction
      });

      if (response.success) {
        setBackendSynced(true);
        setPredictionId(response.prediction._id);
        showToast('Prediction created successfully!', 'success');

        if (onSuccess) {
          onSuccess(response.prediction._id, txHash!);
        }
      } else {
        throw new Error(response.message || 'Failed to sync with backend');
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
      showToast('Prediction created on-chain but failed to sync with backend', 'warning');
    }
  };

  return (
    <div className="space-y-4">
      {/* Transaction Status */}
      {!txHash && (
        <div className="text-center">
          <Button
            onClick={handleCreatePrediction}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Prediction...
              </>
            ) : (
              'Create Prediction on Blockchain'
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
      {backendSynced && predictionId && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Prediction created successfully!</span>
          </div>
          <div className="space-y-2 text-sm">
            <a
              href={getTransactionUrl(txHash!)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View transaction</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={`/predictions/${predictionId}`}
              className="text-purple-400 hover:text-purple-300 flex items-center space-x-1"
            >
              <span>View prediction</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
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
          <Button onClick={handleCreatePrediction} className="w-full">
            Try Again
          </Button>
        </div>
      )}

      {/* Summary */}
      <div className="bg-slate-800/50 rounded-lg p-4 space-y-2 text-sm">
        <h4 className="font-medium text-white mb-2">Prediction Summary</h4>
        <div className="space-y-1 text-gray-400">
          <div className="flex justify-between">
            <span>Title:</span>
            <span className="text-white">{predictionData.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="text-white capitalize">{predictionData.type}</span>
          </div>
          <div className="flex justify-between">
            <span>Asset:</span>
            <span className="text-white">{predictionData.asset}</span>
          </div>
          {predictionData.targetPrice && (
            <div className="flex justify-between">
              <span>Target Price:</span>
              <span className="text-white">${predictionData.targetPrice.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Your Stake:</span>
            <span className="text-white">{predictionData.stakeAmount} BNB</span>
          </div>
          <div className="flex justify-between">
            <span>Entry Fee (5%):</span>
            <span className="text-yellow-400">{(predictionData.stakeAmount * 0.05).toFixed(4)} BNB</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
            <span className="font-medium">Total Cost:</span>
            <span className="text-white font-medium">{predictionData.stakeAmount} BNB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePredictionWithContract;

