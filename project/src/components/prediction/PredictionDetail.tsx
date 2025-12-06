import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, DollarSign, Users, MessageSquare, Share2, Bookmark, Info, CheckCircle, XCircle } from 'lucide-react';
import { Prediction } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../ui/Card';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import ReferralLink from '../predictions/ReferralLink';
import VotePredictionChart from './VotePredictionChart';
import CommentInput from './CommentInput';
import { participateInPrediction, getComments, addComment, getPredictionById, getRecentVotes } from '../../services/api';
import { updatePredictionChoices } from '../../utils/predictionUtils';
import { useToast } from '../../hooks/useToast';
import { useWallet } from '../../contexts/WalletContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { createBnbTransaction, createKaidoTransaction, checkTransactionStatus } from '../../utils/transactionUtils';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { useAppKitProvider } from '@reown/appkit/react';
import ParticipateWithContract from './ParticipateWithContract';
import ClaimWinningsButton from './ClaimWinningsButton';
import ClaimLossEdgeButton from './ClaimLossEdgeButton';
import { usePrediction } from '../../hooks/useContracts';

interface PredictionDetailProps {
  prediction: Prediction | any;
}

// PriceChart component
const PriceChart: React.FC<{ prediction: any }> = ({ prediction }) => {
  const { id } = useParams<{ id: string }>();

  // Extract data from prediction with fallbacks
  const tokenType = prediction?.tokenType || 'BNB';
  const asset = prediction?.asset || 'BTC';

  // Calculate current probability based on choices
  const yesChoice = prediction?.choices?.find((c: any) => c.id === 'yes');
  const currentProbability = yesChoice ? yesChoice.price : 0.5;

  // Extract target price if available
  const targetPrice = prediction?.targetPrice || 0;

  // Simplified chart component that doesn't use the problematic VotePredictionChart
  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-lg p-6">
        {/* Burgundy gradient background - matching hero section */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
          }}></div>
        </div>

        <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg text-white font-medium">{asset} Prediction Market</h3>
            <p className="text-slate-400 text-sm">
              Created on {new Date(prediction?.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex items-center px-3 py-1 rounded-md bg-black/30 border border-yellow-500/20 text-slate-300">
              <span className="font-medium">
                {(currentProbability * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Static chart placeholder */}
        <div className="w-full h-64 bg-black/20 border border-yellow-500/10 rounded-lg mb-6 flex flex-col items-center justify-center">
          <div className="text-slate-300 mb-2">Prediction Chart</div>
          <p className="text-slate-400 text-sm text-center max-w-md">
            This prediction was created for {asset}
            {targetPrice > 0 ? ` with a target price of $${targetPrice.toLocaleString()}` : ''}
          </p>
        </div>

        {/* Yes/No Counter with Progress Bars */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">Yes</span>
            <div className="bg-black/30 border border-yellow-500/20 h-2 w-32 md:w-48 lg:w-64 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full"
                style={{ width: `${currentProbability * 100}%` }}
              ></div>
            </div>
            <span className="text-white">{(currentProbability * 100).toFixed(0)}%</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-white">{(100 - currentProbability * 100).toFixed(0)}%</span>
            <div className="bg-black/30 border border-yellow-500/20 h-2 w-32 md:w-48 lg:w-64 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full"
                style={{ width: `${100 - currentProbability * 100}%` }}
              ></div>
            </div>
            <span className="text-white font-medium">No</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="text-white text-sm font-medium mb-2">Market Stats</h4>
            <div className="space-y-2">
              {targetPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Target Price:</span>
                  <span className="text-white text-sm">${targetPrice.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Yes Probability:</span>
                <span className="text-white text-sm">{(currentProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">No Probability:</span>
                <span className="text-white text-sm">{(100 - currentProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Volume:</span>
                <span className="text-white text-sm">{prediction?.volume || 0} {tokenType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Participants:</span>
                <span className="text-white text-sm">{prediction?.participants || 1}</span>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="text-white text-sm font-medium mb-2">Prediction Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Asset:</span>
                <span className="text-white text-sm">{asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Token Type:</span>
                <span className="text-white text-sm">{tokenType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">End Date:</span>
                <span className="text-white text-sm">{new Date(prediction?.endDate || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Status:</span>
                <span className="text-white text-sm">{prediction?.status || 'active'}</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

const PredictionDetail: React.FC<PredictionDetailProps> = ({ prediction = {} }) => {
  const { id } = useParams<{ id: string }>();
  const [amount, setAmount] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isValidPrediction, setIsValidPrediction] = useState<boolean>(true);
  const tokenType = prediction?.tokenType || 'BNB'; // Default to BNB if not specified

  // Validate prediction data on mount and when prediction changes
  useEffect(() => {
    console.log('Validating prediction data:', prediction);

    // Check if prediction is an empty object
    if (!prediction || Object.keys(prediction).length === 0) {
      console.error('Empty prediction object received');
      setIsValidPrediction(false);
      return;
    }

    // Check for required fields
    if (!prediction._id) {
      console.error('Prediction missing _id field:', prediction);
      setIsValidPrediction(false);
      return;
    }

    // Check for choices array
    if (!Array.isArray(prediction.choices) || prediction.choices.length === 0) {
      console.warn('Prediction missing choices array:', prediction);
      // We'll still consider it valid but log a warning
    }

    setIsValidPrediction(true);
  }, [prediction]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const calculateTimeRemaining = (endDate?: string) => {
    if (!endDate) return 'N/A';

    try {
      const end = new Date(endDate);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) return 'Ended';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        return `${days}d ${hours}h remaining`;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
      }

      return `${minutes}m remaining`;
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 'Invalid date';
    }
  };

  const { showToast } = useToast();
  const { wallet, connectWallet } = useWallet();
  const { address, isConnected } = useAccount();
  const { sendTransaction, isPending: isSendingTransaction, error: sendTransactionError } = useSendTransaction();
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);

  // Fetch comments for this prediction
  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;

      try {
        setLoadingComments(true);
        const response = await getComments(id);
        if (response && response.success && Array.isArray(response.comments)) {
          setComments(response.comments);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoadingComments(false);
      }
    };

    // Only fetch comments if we have a valid prediction
    if (prediction && prediction._id) {
      fetchComments();
    }
  }, [id, prediction]);

  // Function to handle the API call after transaction is successful
  const handleParticipationAPI = async (participationData: any) => {
    try {
      console.log('📤 Sending participation data to API:', participationData);

      // Call the API to participate in the prediction
      const response = await participateInPrediction(id || '', participationData);

      if (response && response.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Successfully participated in prediction'
        });

        // Add notification
        const choiceLabel = prediction.choices?.find((c: any) => c.id === selectedChoice)?.label || selectedChoice;
        addNotification({
          type: 'prediction_created',
          title: 'Prediction Participation',
          message: prediction.type === 'agent'
            ? `You selected "${choiceLabel}" for "${prediction.title}"`
            : `You placed ${amount} ${tokenType} on "${choiceLabel}" for "${prediction.title}"`,
          link: `/prediction/${id}`,
          data: {
            predictionId: id,
            amount: prediction.type === 'agent' ? 0 : amount,
            tokenType,
            position: selectedChoice
          }
        });

        // Reset form
        setAmount('');
        setSelectedChoice(null);

        // Fetch updated prediction data
        try {
          const updatedPredictionResponse = await getPredictionById(id || '');
          if (updatedPredictionResponse && updatedPredictionResponse.success) {
            window.dispatchEvent(new CustomEvent('predictionUpdated', {
              detail: { prediction: updatedPredictionResponse.prediction }
            }));

            if (window && (window as any).updatePredictionVotes) {
              console.log('Calling updatePredictionVotes to refresh vote counts immediately');
              (window as any).updatePredictionVotes();
            }
          }
        } catch (updateError) {
          console.error('Error fetching updated prediction:', updateError);
        }
      } else {
        throw new Error(response?.message || 'Failed to participate in prediction');
      }
    } catch (error: any) {
      console.error('Error participating in prediction:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to participate in prediction'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuy = async () => {
    // Check if prediction has ended
    if (prediction.endDate && new Date(prediction.endDate) < new Date()) {
      showToast({
        type: 'error',
        title: 'Market Ended',
        message: 'This prediction has ended and is no longer accepting trades'
      });
      return;
    }

    if (!selectedChoice) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please select a position'
      });
      return;
    }

    // For regular predictions, amount is required
    if (prediction.type !== 'agent' && !amount) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please enter an amount'
      });
      return;
    }

    if (!wallet.connected) {
      showToast({
        type: 'info',
        title: 'Connect Wallet',
        message: 'Please connect your wallet to participate'
      });
      connectWallet();
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare participation data
      const participationData: any = {
        position: selectedChoice,
        tokenType: tokenType
      };

      // For regular predictions, include amount
      if (prediction.type !== 'agent') {
        participationData.amount = parseFloat(amount);
      } else {
        // For agent predictions, amount is 0
        participationData.amount = 0;
      }

      // Process the transaction using wagmi if using BNB
      console.log('🔍 Debug: tokenType =', tokenType, 'prediction.tokenType =', prediction?.tokenType);
      console.log('🔍 Debug: amount =', amount, 'prediction.type =', prediction?.type);
      console.log('🔍 Debug: isConnected =', isConnected, 'address =', address);

      if (tokenType === 'BNB') {
        console.log('🚀 Starting BNB transaction flow');
        console.log('🔍 sendTransaction hook available:', !!sendTransaction);
        console.log('🔍 sendTransaction pending:', isSendingTransaction);
        console.log('🔍 sendTransaction error:', sendTransactionError);

        try {
          // Check if wallet is connected
          if (!isConnected || !address) {
            throw new Error('Wallet not connected');
          }

          // Check if sendTransaction is available
          if (!sendTransaction) {
            throw new Error('sendTransaction hook not available');
          }

          // Create BNB transaction using wagmi
          const transaction = await createBnbTransaction(
            address as Address,
            parseFloat(amount)
          );

          console.log('📝 Created BNB transaction:', transaction);

          // Send the transaction using wagmi's sendTransaction (same approach as chat widget)
          console.log('📤 Calling sendTransaction...');

          // Show user that transaction is being processed
          showToast({
            type: 'info',
            title: 'Transaction Pending',
            message: 'Please confirm the transaction in your wallet...'
          });

          // Use Promise-based approach like the chat widget
          const txHash = await new Promise<string>((resolve, reject) => {
            console.log('🔄 About to call sendTransaction with:', transaction);
            sendTransaction(transaction, {
              onSuccess: (hash) => {
                console.log('✅ Transaction sent successfully:', hash);
                resolve(hash);
              },
              onError: (error) => {
                console.error('❌ Transaction failed:', error);
                reject(error);
              }
            });
          });

          console.log('🎉 Transaction completed with hash:', txHash);

          // Add transaction hash to participation data
          participationData.transactionHash = txHash;
          participationData.bypassBalanceCheck = true;
          participationData.walletBalanceBefore = wallet.balance?.bnb || 0;
          participationData.transactionAmount = parseFloat(amount);
          participationData.transactionFee = 0.002;

          console.log('📤 Calling API with transaction data:', participationData);

          // Continue with API call after successful transaction
          await handleParticipationAPI(participationData);
          return;
        } catch (txError) {
          console.error('BNB transaction error:', txError);
          showToast({
            type: 'error',
            title: 'Transaction Failed',
            message: txError instanceof Error ? txError.message : 'Failed to process BNB payment'
          });
          setIsSubmitting(false);
          return;
        }
      } else if (tokenType === 'KAIDO') {
        try {
          // Check if wallet is connected
          if (!isConnected || !address) {
            throw new Error('Wallet not connected');
          }

          // Create KAIDO transaction using wagmi
          const transaction = await createKaidoTransaction(
            address as Address,
            parseFloat(amount)
          );

          console.log('Sending KAIDO transaction:', transaction);

          // Send the transaction using wagmi's sendTransaction
          const txHash = await new Promise<string>((resolve, reject) => {
            sendTransaction(transaction, {
              onSuccess: (hash) => {
                console.log('KAIDO transaction sent successfully:', hash);
                resolve(hash);
              },
              onError: (error) => {
                console.error('KAIDO transaction failed:', error);
                reject(error);
              }
            });
          });

          console.log('KAIDO transaction sent with hash:', txHash);

          // Add transaction hash to participation data
          participationData.transactionHash = txHash;
          participationData.bypassBalanceCheck = true; // Tell backend to bypass balance check
          participationData.tokenType = 'KAIDO'; // Specify token type

          // Add additional debugging information
          participationData.walletBalanceBefore = wallet.balance?.kaido || 0;
          participationData.transactionAmount = parseFloat(amount);
          participationData.transactionFee = 0.002; // Estimated transaction fee

          console.log('KAIDO transaction completed successfully');

          // Continue with API call after successful KAIDO transaction
          await handleParticipationAPI(participationData);
          return;
        } catch (txError) {
          console.error('KAIDO transaction error:', txError);
          showToast({
            type: 'error',
            title: 'Transaction Failed',
            message: txError instanceof Error ? txError.message : 'Failed to process KAIDO payment'
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log('⚠️ No transaction processing for tokenType:', tokenType);
        // For non-BNB/KAIDO tokens, call API directly
        await handleParticipationAPI(participationData);
        return;
      }
    } catch (error: any) {
      console.error('Error in handleBuy:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to process participation'
      });
      setIsSubmitting(false);
    }
  };



  // We're now using the LivePriceChart component instead of this static chart

  // Use React.memo to prevent unnecessary re-renders of the Comments component
  const Comments = React.memo(() => {
    // Handle comment submission
    const handleCommentSubmit = async (text: string) => {
      if (!text.trim()) return;

      if (!wallet.connected) {
        showToast({
          type: 'info',
          title: 'Connect Wallet',
          message: 'Please connect your wallet to comment'
        });
        connectWallet();
        return;
      }

      try {
        // Call the API to add a comment
        const response = await addComment(id || '', text);

        if (response && response.success) {
          showToast({
            type: 'success',
            title: 'Success',
            message: 'Comment added successfully'
          });

          // Add notification
          addNotification({
            type: 'comment',
            title: 'Comment Added',
            message: `You commented on "${prediction.title}"`,
            link: `/prediction/${id}`,
            data: {
              predictionId: id,
              comment: text
            }
          });

          // Refresh comments
          try {
            setLoadingComments(true);
            const commentsResponse = await getComments(id || '');
            if (commentsResponse && commentsResponse.success && Array.isArray(commentsResponse.comments)) {
              setComments(commentsResponse.comments);
            }
          } catch (refreshError) {
            console.error('Error refreshing comments:', refreshError);
          } finally {
            setLoadingComments(false);
          }
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            message: response?.message || 'Failed to add comment'
          });
        }
      } catch (error: any) {
        console.error('Error adding comment:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: error?.message || 'Failed to add comment'
        });
      }
    };

    return (
      <div className="space-y-4">
        <CommentInput
          onSubmit={handleCommentSubmit}
          disabled={!wallet.connected}
          placeholder={wallet.connected ? "Add a comment..." : "Connect wallet to comment..."}
          autoFocus={false}
        />

        {loadingComments ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
          </div>
        ) : comments.length > 0 ? (
          comments.map((commentItem) => (
            <div key={commentItem._id} className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Avatar
                    src={commentItem.user?.avatar || '/images/default-avatar.png'}
                    alt={commentItem.user?.username || 'Anonymous'}
                    size="sm"
                    className="mr-2"
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{commentItem.user?.username || 'Anonymous'}</div>
                    <div className="text-xs text-slate-400">{formatDate(commentItem.createdAt)}</div>
                  </div>
                </div>
                {commentItem.position && (
                  <Badge variant={commentItem.position === 'yes' ? 'success' : 'danger'}>
                    {commentItem.position === 'yes' ? 'YES' : 'NO'}
                  </Badge>
                )}
              </div>
              <p className="text-slate-300 text-sm">{commentItem.text || commentItem.content}</p>
            </div>
          ))
        ) : (
          <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4 text-center">
            <p className="text-slate-400">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    );
  });

  const MarketInfo = () => (
    <div className="space-y-4">
      <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">Market Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Creator</span>
            <Link to={`/profile/${prediction.creator?.id || 'unknown'}`} className="text-yellow-400 hover:text-yellow-300">
              {prediction.creator?.username === 'admin' || prediction.creator?.username === 'admin_predictor'
                ? 'KAIDO Agent'
                : prediction.creator?.username || 'Anonymous'}
            </Link>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Created</span>
            <span className="text-slate-300">{formatDate(prediction.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Resolution Date</span>
            <span className="text-slate-300">{formatDate(prediction.endDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Volume</span>
            <span className="text-slate-300">{(prediction.volume || 0).toLocaleString()} {prediction.tokenType || 'BNB'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Creator Stake</span>
            <span className="text-slate-300">{(prediction.stakeAmount || 0).toLocaleString()} {prediction.tokenType || 'BNB'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Participants</span>
            <span className="text-slate-300">{(prediction.participants || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">Resolution Details</h4>
        <p className="text-slate-300 text-sm">{prediction.resolveDetails || 'No resolution details available.'}</p>
      </div>
    </div>
  );

  // Show error UI if prediction data is invalid
  if (!isValidPrediction) {
    return (
      <div className="bg-black/40 rounded-xl p-8 border border-yellow-500/30 backdrop-blur-sm max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Invalid Prediction Data</h2>
        <p className="text-slate-400 mb-6">
          The prediction data received is incomplete or invalid. This might be due to:
        </p>
        <ul className="list-disc list-inside text-slate-400 mb-6 space-y-2">
          <li>The prediction was recently created and is still being processed</li>
          <li>The prediction was deleted or removed from the system</li>
          <li>There was an error in the data received from the server</li>
        </ul>
        <div className="flex space-x-4">
          <Link to="/" className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
            Back to Home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>

        {/* Debug information for developers */}
        <div className="mt-8 p-4 bg-slate-900 rounded-lg">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Debug Information:</h3>
          <pre className="text-xs text-slate-500 overflow-auto max-h-40">
            {JSON.stringify(prediction, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card variant="burgundy">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar
                  src={prediction.creator?.avatar || '/images/default-avatar.png'}
                  alt={prediction.creator?.username || 'Anonymous'}
                  size="sm"
                  className="mr-2"
                />
                <div>
                  <div className="text-xs text-slate-400">Created by</div>
                  <div className="text-sm font-medium text-white">
                    {prediction.creator?.username === 'admin' || prediction.creator?.username === 'admin_predictor'
                      ? 'KAIDO Agent'
                      : prediction.creator?.username || 'Anonymous'}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {/* Agent/User Badge */}
                {prediction.isAgentCreated && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  >
                    🤖 AI Created
                  </Badge>
                )}
                <Badge variant={
                  prediction.type === 'binary'
                    ? 'primary'
                    : prediction.type === 'agent'
                      ? 'success'
                      : 'secondary'
                }>
                  {prediction.type === 'binary'
                    ? 'Yes/No'
                    : prediction.type === 'agent'
                      ? 'Agent'
                      : 'Multi-Choice'}
                </Badge>
                {prediction.type !== 'agent' && (
                  <Badge variant="secondary">
                    {prediction.tokenType === 'BNB' ? '5% Fee' : 'Free'}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <h1 className="text-2xl font-medium text-white mb-2">
              {prediction.title || 'Untitled Prediction'}
            </h1>
            <p className="text-slate-300 mb-6">{prediction.description || 'No description available.'}</p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-slate-400 mr-2" />
                <div>
                  <div className="text-xs text-slate-400">Ends</div>
                  <div className="text-sm font-medium text-white">{calculateTimeRemaining(prediction.endDate)}</div>
                </div>
              </div>

              <div className="flex items-center bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg px-3 py-2">
                <DollarSign className="h-4 w-4 text-slate-400 mr-2" />
                <div>
                  <div className="text-xs text-slate-400">Volume</div>
                  <div className="text-sm font-medium text-white">{(prediction.volume || 0).toLocaleString()} {prediction.tokenType || 'BNB'}</div>
                </div>
              </div>

              <div className="flex items-center bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg px-3 py-2">
                <Users className="h-4 w-4 text-slate-400 mr-2" />
                <div>
                  <div className="text-xs text-slate-400">Participants</div>
                  <div className="text-sm font-medium text-white">{(prediction.participants || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            <PriceChart prediction={prediction} />
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-700">
            <div className="flex space-x-2">
              <Button variant="tertiary" size="sm" leftIcon={<MessageSquare className="h-4 w-4" />}>
                {comments?.length || 0} Comments
              </Button>
              <Button variant="tertiary" size="sm" leftIcon={<Share2 className="h-4 w-4" />}>
                Share
              </Button>
            </div>
            <Button variant="tertiary" size="sm" leftIcon={<Bookmark className="h-4 w-4" />}>
              Save
            </Button>
          </CardFooter>
        </Card>

        <Card variant="burgundy">
          <CardContent className="p-0">
            <Tabs
              tabs={[
                {
                  id: 'comments',
                  label: (
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Comments
                    </div>
                  ),
                  content: <Comments />
                },
                {
                  id: 'info',
                  label: (
                    <div className="flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Market Info
                    </div>
                  ),
                  content: <MarketInfo />
                }
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card variant="burgundy" className="sticky top-24">
          <CardHeader>
            <h3 className="text-lg font-medium text-white">
              {prediction.status === 'resolved' || prediction.status === 'cancelled' ? 'Market Closed' :
               (prediction.endDate && new Date(prediction.endDate) < new Date() ? 'Market Ended' : 'Trade')}
            </h3>
            {prediction.status === 'resolved' && (
              <div className="mt-2 bg-yellow-500/20 border border-yellow-500/30 rounded-md p-2">
                <p className="text-sm text-yellow-300">This prediction has been resolved.</p>
              </div>
            )}
            {prediction.status === 'cancelled' && (
              <div className="mt-2 bg-red-500/20 border border-red-500/30 rounded-md p-2">
                <p className="text-sm text-red-300">This prediction has been cancelled.</p>
              </div>
            )}
          </CardHeader>

          {prediction.status === 'resolved' || prediction.status === 'cancelled' ? (
            <CardContent className="space-y-4">
              <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                  prediction.status === 'resolved' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {prediction.status === 'resolved' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  {prediction.status === 'resolved' ? 'Prediction Resolved' : 'Prediction Cancelled'}
                </h4>
                <p className="text-slate-400 mb-4">
                  {prediction.status === 'resolved'
                    ? 'This prediction market has been resolved. No further trading is possible.'
                    : 'This prediction market has been cancelled. No further trading is possible.'}
                </p>

                {prediction.status === 'resolved' && prediction.resolvedChoice && (
                  <div className="bg-black/30 border border-yellow-500/20 rounded-lg p-3 mb-4">
                    <div className="text-sm text-slate-300 mb-1">Winning Position:</div>
                    <div className="text-lg font-medium text-white flex items-center">
                      <span className="mr-2 text-green-400">✓</span>
                      {prediction.choices?.find(c => c.id === prediction.resolvedChoice)?.label || prediction.resolvedChoice}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Resolved on {new Date(prediction.resolvedAt || prediction.updatedAt || '').toLocaleDateString()}
                    </div>
                  </div>
                )}

                {prediction.status === 'resolved' && (
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => window.location.href = '/profile/winnings'}
                  >
                    Check Your Winnings
                  </Button>
                )}
              </div>
            </CardContent>
          ) : prediction.endDate && new Date(prediction.endDate) < new Date() ? (
            <CardContent className="space-y-4">
              <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-yellow-500/20">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">
                  Prediction Ended
                </h4>
                <p className="text-slate-400 mb-4">
                  This prediction has ended and is awaiting resolution. No further trading is possible.
                </p>
              </div>
            </CardContent>
          ) : (
            <>
              <CardContent className="space-y-4">
                <div className="flex space-x-3 mb-6">
                  {prediction.choices?.map((choice) => (
                    <Button
                      key={choice.id}
                      variant={
                        prediction.type === 'binary'
                          ? choice.id === 'yes' ? 'yes' : 'no'
                          : 'secondary'
                      }
                      size="md"
                      fullWidth
                      className={selectedChoice === choice.id ? 'ring-2 ring-yellow-500' : ''}
                      onClick={() => setSelectedChoice(choice.id)}
                    >
                      {choice.label}
                    </Button>
                  ))}
                </div>

                {prediction.type !== 'agent' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Amount ({prediction.tokenType || 'BNB'})
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          // Just set the value without auto-correcting
                          // Validation will happen on submit
                          setAmount(e.target.value);
                        }}
                        onFocus={(e) => {
                          // Clear placeholder value on focus to allow easy typing
                          if (amount === '' || amount === '0') {
                            setAmount('');
                          }
                        }}
                        min="0.01"
                        step="0.01"
                        placeholder="Min 0.01"
                        className="flex-grow"
                      />
                      <Button variant="tertiary" size="sm" onClick={() => setAmount('0.01')}>
                        0.01
                      </Button>
                      <Button variant="tertiary" size="sm" onClick={() => setAmount('1')}>
                        1
                      </Button>
                      <Button variant="tertiary" size="sm" onClick={() => setAmount('5')}>
                        5
                      </Button>
                      <Button variant="tertiary" size="sm" onClick={() => setAmount('10')}>
                        10
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Minimum participation amount is 0.01 BNB
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center mb-2">
                      <Wallet className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-sm font-medium text-green-400">Agent Prediction</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      Participate without committing funds by holding at least {prediction.minKaidoRequired || 10} KAIDO tokens.
                    </p>
                    {prediction.maxParticipants && (
                      <div className="mt-2 text-xs text-slate-400">
                        Limited to {prediction.maxParticipants} participants ({prediction.participants || 0} joined so far)
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-400">
                      {prediction.type === 'agent' ? 'Potential Reward' : 'Potential Profit'}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {selectedChoice && prediction.choices ? (() => {
                        // For agent predictions, calculate potential reward based on reward pool
                        if (prediction.type === 'agent') {
                          const rewardPool = prediction.rewardPoolAmount || 0;

                          // Get the number of participants who selected this choice
                          const choice = prediction.choices.find(c => c.id === selectedChoice);
                          const choicePercentage = choice?.percentage || 0;
                          const totalParticipants = prediction.participants || 0;

                          // Estimate participants for this choice
                          const choiceParticipants = Math.max(1, Math.round((choicePercentage / 100) * totalParticipants));

                          // Calculate potential reward (equal share of pool)
                          const potentialReward = rewardPool / (choiceParticipants + 1); // +1 for current user

                          return `${potentialReward.toFixed(2)} ${prediction.tokenType}`;
                        }

                        // For regular predictions, calculate based on pool amounts
                        if (!amount) return `0 ${tokenType}`;

                        // Calculate potential profit based on actual pool amounts
                        const totalVolume = prediction.volume || 0;
                        if (totalVolume === 0) {
                          // If there's no volume yet, calculate based on equal odds (50/50)
                          const userStake = parseFloat(amount);
                          const potentialProfit = userStake; // 1:1 odds for first bet

                          console.log('No volume yet, using 1:1 odds:', {
                            userStake,
                            potentialProfit
                          });

                          return `${potentialProfit.toFixed(2)} ${tokenType}`;
                        }

                        // Get position volumes
                        const positionVolumes: {[key: string]: number} = {};
                        let totalPositionVolume = 0;

                        prediction.choices.forEach((choice: any) => {
                          // Calculate actual volume for each position based on percentage
                          const choiceVolume = totalVolume * (choice.percentage / 100);
                          positionVolumes[choice.id] = choiceVolume;
                          totalPositionVolume += choiceVolume;
                        });

                        // Calculate potential payout based on pool ratio
                        const selectedPositionVolume = positionVolumes[selectedChoice] || 0;
                        const otherPositionsVolume = totalPositionVolume - selectedPositionVolume;
                        const userStake = parseFloat(amount);

                        // Special case: if the selected position has no volume yet
                        if (selectedPositionVolume === 0 && otherPositionsVolume > 0) {
                          // First bet on this position gets favorable odds
                          const potentialPayout = userStake + otherPositionsVolume;
                          const potentialProfit = potentialPayout - userStake;

                          console.log('First bet on position, favorable odds:', {
                            userStake,
                            otherPositionsVolume,
                            potentialPayout,
                            potentialProfit
                          });

                          return `${potentialProfit.toFixed(2)} ${tokenType}`;
                        }

                        // Add user's stake to the selected position's volume
                        const newSelectedPositionVolume = selectedPositionVolume + userStake;

                        // Calculate potential payout (user's stake / new position volume * total pool)
                        const userShareOfPosition = userStake / newSelectedPositionVolume;
                        const potentialPayout = userShareOfPosition * (newSelectedPositionVolume + otherPositionsVolume);

                        // Calculate profit (payout - stake)
                        const potentialProfit = potentialPayout - userStake;

                        // Log calculation details for debugging
                        console.log('Potential profit calculation:', {
                          totalVolume,
                          positionVolumes,
                          selectedPositionVolume,
                          otherPositionsVolume,
                          newSelectedPositionVolume,
                          userStake,
                          userShareOfPosition,
                          potentialPayout,
                          potentialProfit
                        });

                        return `${potentialProfit.toFixed(2)} ${tokenType}`;
                      })() : `0 ${tokenType}`}
                    </span>
                  </div>
                  {prediction.type !== 'agent' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Agent Fee ({tokenType === 'BNB' ? '5%' : 'Free'})</span>
                        <span className="text-sm font-medium text-white">
                          {(parseFloat(amount || '0') * (tokenType === 'BNB' ? 0.05 : 0)).toFixed(2)} {tokenType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-400">Amount to Pool</span>
                        <span className="text-sm font-medium text-white">
                          {(parseFloat(amount || '0') * (tokenType === 'BNB' ? 0.95 : 1)).toFixed(2)} {tokenType}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-slate-400">Creator Reward</span>
                        <span className="text-sm font-medium text-slate-400">
                          {tokenType === 'BNB' ? '1%' : '0.5%'} of winning pool
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-slate-400">Total Reward Pool</span>
                      <span className="text-sm font-medium text-white">
                        {prediction.rewardPoolAmount || 0} {prediction.tokenType}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                {/* Check if this is an on-chain prediction */}
                {prediction.onChainId ? (
                  // On-chain prediction - use smart contract component
                  <div className="space-y-3">
                    {prediction.status === 'resolved' ? (
                      // Show claim buttons if resolved
                      <>
                        <ClaimWinningsButton
                          onChainPredictionId={prediction.onChainId}
                          userChoice={selectedChoice || ''}
                          userStake={parseFloat(amount || '0')}
                          onSuccess={(txHash, winnings) => {
                            showToast({
                              type: 'success',
                              title: 'Winnings Claimed!',
                              message: `You claimed ${winnings} BNB`
                            });
                          }}
                        />
                        <ClaimLossEdgeButton
                          onChainPredictionId={prediction.onChainId}
                          userChoice={selectedChoice || ''}
                          userStake={parseFloat(amount || '0')}
                          onSuccess={(txHash, compensation) => {
                            showToast({
                              type: 'success',
                              title: 'Compensation Claimed!',
                              message: `You received ${compensation.toFixed(4)} BNB from Loss-Edge Pool`
                            });
                          }}
                        />
                      </>
                    ) : (
                      // Show participate button if active
                      <ParticipateWithContract
                        predictionId={prediction._id || id || ''}
                        onChainPredictionId={prediction.onChainId}
                        choice={selectedChoice || ''}
                        amount={parseFloat(amount || '0')}
                        onSuccess={(txHash) => {
                          showToast({
                            type: 'success',
                            title: 'Success',
                            message: 'Participation successful!'
                          });
                          // Refresh prediction data
                          if (id) {
                            getPredictionById(id).then((response) => {
                              if (response.success) {
                                // Update local state if needed
                              }
                            });
                          }
                        }}
                        onError={(error) => {
                          showToast({
                            type: 'error',
                            title: 'Error',
                            message: error
                          });
                        }}
                      />
                    )}
                    <div className="text-center">
                      <span className="text-xs text-green-400">
                        ✓ On-chain prediction (BSC Testnet)
                      </span>
                    </div>
                  </div>
                ) : (
                  // Off-chain prediction - use traditional button
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={
                        !selectedChoice ||
                        (!amount && prediction.type !== 'agent') ||
                        isSubmitting ||
                        (prediction.endDate && new Date(prediction.endDate) < new Date())
                      }
                      onClick={handleBuy}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : prediction.endDate && new Date(prediction.endDate) < new Date() ? (
                        'Market has ended'
                      ) : prediction.type === 'agent' ? (
                        selectedChoice ? `Select ${prediction.choices?.find(c => c.id === selectedChoice)?.label || 'Position'}` : 'Select a position'
                      ) : (
                        selectedChoice ? `Buy ${prediction.choices?.find(c => c.id === selectedChoice)?.label || 'Position'}` : 'Select a position'
                      )}
                    </Button>

                    <div className="text-center">
                      {prediction.type === 'agent' ? (
                        <span className="text-xs text-slate-400">
                          Winners share a reward pool of {prediction.rewardPoolAmount} {prediction.tokenType}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Using KAIDO token reduces agent fees from 5% to 2%
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardFooter>
            </>
          )}
        </Card>

        {/* Referral Link Component */}
        <ReferralLink
          predictionId={id || '60f1a5c5e6b3f52d8c4a7e1d'}
          predictionTitle={prediction.title || 'Prediction'}
          tokenType={tokenType as 'BNB' | 'KAIDO'}
        />
      </div>
    </div>
  );
};

export default PredictionDetail;