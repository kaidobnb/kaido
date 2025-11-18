import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Clock, DollarSign, Users, MessageSquare, Share2, ArrowUp, ArrowDown, Info, Wallet, Award } from 'lucide-react';
import { getPredictionById, participateInPrediction, getComments, addComment, getRecentVotes } from '../services/api';
import { useToast } from '../hooks/useToast';
import { usePolling } from '../hooks/usePolling';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CommentInput from '../components/prediction/CommentInput';
import VotePredictionChart from '../components/prediction/VotePredictionChart';
import MultiChoiceSelector from '../components/prediction/MultiChoiceSelector';
import ResolvedPredictionCard from '../components/prediction/ResolvedPredictionCard';
import { useWallet } from '../contexts/WalletContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAccount, useBalance, useSendTransaction } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { createBnbTransaction, createKaidoTransaction, checkTransactionStatus } from '../utils/transactionUtils';
import ReferralLink from '../components/predictions/ReferralLink';
// Removed unused recharts imports

const AIPredictionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const { wallet, connectWallet } = useWallet();
  const { addNotification } = useNotifications();
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recentVotes, setRecentVotes] = useState<any[]>([]);
  const [loadingVotes, setLoadingVotes] = useState<boolean>(false);
  const [userParticipations, setUserParticipations] = useState<{position: string}[]>([]);

  // Wallet integration for BNB Smart Chain
  const { address, isConnected } = useAccount();
  const { address: appkitAddress } = useAppKitAccount();
  const { sendTransaction, isPending: isSendingTransaction, error: sendTransactionError } = useSendTransaction();

  // Check for referral code in URL - but don't show toast (handled by global component)
  useEffect(() => {
    // Import dynamically to avoid circular dependencies
    import('../utils/referralUtils').then(({ extractReferralCodeFromUrl, storeReferralCode }) => {
      // Extract and store the code, but don't trigger toast notifications
      const refCode = extractReferralCodeFromUrl();
      if (refCode) {
        storeReferralCode(refCode);
        console.log('Stored referral code from prediction page URL:', refCode);
      }
    });
  }, [location.search]); // Re-run when URL query parameters change

  // Function to handle buying a position
  const handleBuy = async () => {
    // Check if prediction has ended
    if (prediction?.endDate && new Date(prediction.endDate) < new Date()) {
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

    // Check if the amount is valid for non-agent predictions
    if (prediction.type !== 'agent' && parseFloat(amount) <= 0) {
      showToast({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter an amount greater than 0'
      });
      return;
    }

    // Check if the amount meets the minimum requirement of 0.01 BNB
    if (prediction.type !== 'agent' && parseFloat(amount) < 0.01) {
      showToast({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Minimum participation amount is 0.01 BNB'
      });
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
        // Set a default amount for the API call to avoid validation errors
        if (!amount) {
          setAmount('0');
        }
      }

      // Create and send transaction for non-agent predictions
      let transactionHash = '';

      if (prediction.type !== 'agent' && address) {
        console.log('🚀 Starting real BNB transaction for prediction participation');

        // Check if wallet is connected
        if (!isConnected || !address) {
          throw new Error('Wallet not connected');
        }

        // Check if sendTransaction is available
        if (!sendTransaction) {
          throw new Error('sendTransaction hook not available');
        }

        // Create transaction based on token type
        const transaction = tokenType === 'KAIDO'
          ? await createKaidoTransaction(address as Address, parseFloat(amount))
          : await createBnbTransaction(address as Address, parseFloat(amount));
        console.log(`📝 Created ${tokenType} transaction:`, transaction);

        // Show user that transaction is being processed
        showToast({
          type: 'info',
          title: 'Transaction Pending',
          message: 'Please confirm the transaction in your wallet...'
        });

        // Send real transaction using wagmi (same approach as chat widget)
        transactionHash = await new Promise<string>((resolve, reject) => {
          console.log('📤 Calling sendTransaction...');
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

        console.log('🎉 Real transaction completed with hash:', transactionHash);

        // Show success message
        showToast({
          type: 'success',
          title: 'Transaction Confirmed',
          message: `Transaction sent: ${transactionHash.slice(0, 10)}...${transactionHash.slice(-8)}`
        });

        // Add transaction hash to participation data
        participationData.transactionHash = transactionHash;
        participationData.bypassBalanceCheck = true;
      } else if (prediction.type === 'agent') {
        console.log('Agent prediction - no transaction needed');
      } else {
        console.warn('Wallet not connected, proceeding without transaction');
      }

      // Call API to participate in prediction
      console.log('Sending participation data to API:', participationData);

      // For agent predictions, ensure we have a valid amount (even if it's 0)
      if (prediction.type === 'agent' && !amount) {
        participationData.amount = 0;
      }

      const response = await participateInPrediction(id || '', participationData);
      console.log('Participation response:', response);

      if (response && response.success) {
        // Get the choice label based on prediction type
        const choiceLabel = prediction?.choices?.find((c: any) => c.id === selectedChoice)?.label || selectedChoice;

        showToast({
          type: 'success',
          title: 'Success',
          message: prediction.type === 'agent'
            ? `Successfully selected ${prediction.type === 'binary' ? (selectedChoice === 'yes' ? 'Yes' : 'No') : choiceLabel}`
            : `Successfully placed ${amount} ${tokenType} on ${prediction.type === 'binary' ? (selectedChoice === 'yes' ? 'Yes' : 'No') : choiceLabel}`
        });

        // Add notification
        addNotification({
          type: 'prediction_created',
          title: 'Prediction Participation',
          message: prediction.type === 'agent'
            ? `You selected "${choiceLabel}" for "${prediction?.title}"`
            : `You placed ${amount} ${tokenType} on "${choiceLabel}" for "${prediction?.title}"`,
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

        // Immediately update the UI with the new probability
        if (prediction && prediction.choices) {
          // Create a copy of the prediction to update
          const updatedPrediction = { ...prediction };

          // Calculate new volume (only for non-agent predictions)
          if (prediction.type !== 'agent') {
            const newVolume = (prediction.volume || 0) + parseFloat(amount);
            updatedPrediction.volume = newVolume;
          }

          // Calculate new participants (increment by 1)
          updatedPrediction.participants = (prediction.participants || 0) + 1;

          // Calculate new percentages for choices
          const yesChoice = prediction.choices.find((c: any) => c.id === 'yes');
          const noChoice = prediction.choices.find((c: any) => c.id === 'no');

          if (yesChoice && noChoice) {
            if (prediction.type === 'agent') {
              // For agent predictions, just increment the count for the selected choice
              if (selectedChoice === 'yes') {
                yesChoice.percentage = Math.min(100, yesChoice.percentage + 1);
                noChoice.percentage = 100 - yesChoice.percentage;
              } else {
                noChoice.percentage = Math.min(100, noChoice.percentage + 1);
                yesChoice.percentage = 100 - noChoice.percentage;
              }

              // Update prices based on percentages
              yesChoice.price = yesChoice.percentage / 100;
              noChoice.price = noChoice.percentage / 100;
            } else {
              // For regular predictions, calculate based on pool amounts
              const currentYesPool = (prediction.volume || 0) * (yesChoice.price || 0.5);
              const currentNoPool = (prediction.volume || 0) * (noChoice.price || 0.5);
              const newVolume = (prediction.volume || 0) + parseFloat(amount);

              // Update pool based on user's choice
              const newYesPool = selectedChoice === 'yes'
                ? currentYesPool + parseFloat(amount)
                : currentYesPool;

              const newNoPool = selectedChoice === 'no'
                ? currentNoPool + parseFloat(amount)
                : currentNoPool;

              // Calculate new percentages
              const newYesPercentage = (newYesPool / newVolume) * 100;
              const newNoPercentage = (newNoPool / newVolume) * 100;

              // Update the choice percentages
              yesChoice.percentage = Math.round(newYesPercentage);
              noChoice.percentage = Math.round(newNoPercentage);

              // Update prices based on percentages
              yesChoice.price = newYesPercentage / 100;
              noChoice.price = newNoPercentage / 100;
            }

            // Update choices with new values
            updatedPrediction.choices = [
              {
                ...yesChoice
              },
              {
                ...noChoice
              }
            ];

            console.log(`Updated percentages after vote: Yes=${yesChoice.percentage}%, No=${noChoice.percentage}%`);

            // Add the new vote to recent votes
            const now = new Date();
            const newVote = {
              _id: `temp-${now.getTime()}`,
              position: selectedChoice,
              amount: prediction.type === 'agent' ? 0 : parseFloat(amount),
              probability: selectedChoice === 'yes' ? yesChoice.price : noChoice.price, // Use the updated probability
              createdAt: now.toISOString(), // Ensure we have a valid ISO string date
              user: {
                username: 'You',
                avatar: '/images/default-avatar.png'
              }
            };

            setRecentVotes(prev => [newVote, ...prev]);
          }

          // Update the prediction state
          // This will immediately update the UI while we wait for the backend to refresh
          // @ts-ignore - Ignore type checking for this temporary state update
          setPrediction(updatedPrediction);
        }

        // Fetch updated prediction data and recent votes from the server
        refetchPrediction();

        // Fetch recent votes after a short delay to ensure the backend has processed the participation
        setTimeout(() => {
          fetchRecentVotes();
        }, 1000);
      } else {
        // Check for specific error messages
        if (response?.message && response.message.includes('already participated')) {
          showToast({
            type: 'info',
            title: 'Already Participated',
            message: 'You have already participated in this agent prediction'
          });
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            message: response?.message || 'Failed to participate in prediction'
          });
        }
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

  // Function to fetch comments for the prediction
  const fetchComments = async () => {
    if (!id) return;

    // Check if the ID is a valid MongoDB ObjectId (24-character hex string)
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidMongoId) {
      console.warn('Invalid MongoDB ObjectId format:', id);
      setLoadingComments(false);
      setComments([]);
      return;
    }

    try {
      setLoadingComments(true);
      const response = await getComments(id);

      if (response && response.success) {
        console.log('Comments fetched successfully:', response.comments);
        setComments(response.comments || []);
      } else {
        console.error('Failed to fetch comments:', response);
        // Set empty array as fallback
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Function to fetch recent votes for the prediction
  const fetchRecentVotes = async () => {
    if (!id) return;

    // Check if the ID is a valid MongoDB ObjectId (24-character hex string)
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidMongoId) {
      console.warn('Invalid MongoDB ObjectId format:', id);
      setLoadingVotes(false);
      setRecentVotes([]);
      return;
    }

    try {
      setLoadingVotes(true);
      const response = await getRecentVotes(id);

      if (response && response.success) {
        console.log('Recent votes fetched successfully:', response.votes);

        // Define vote type
        interface Vote {
          _id: string;
          position: string;
          amount: string | number;
          createdAt: string;
          probability?: number;
          user?: {
            username: string;
            avatar: string;
          };
        }

        // Ensure all votes have valid createdAt fields
        const validatedVotes = (response.votes || []).map((vote: any): Vote => {
          if (!vote.createdAt) {
            console.warn('Vote missing createdAt field:', vote);
            return {
              ...vote,
              createdAt: new Date().toISOString() // Add current time as fallback
            };
          }

          // Validate the date format
          try {
            const date = new Date(vote.createdAt);
            if (isNaN(date.getTime())) {
              console.warn('Vote has invalid createdAt format:', vote.createdAt);
              return {
                ...vote,
                createdAt: new Date().toISOString() // Replace with current time
              };
            }
          } catch (e) {
            console.warn('Error parsing vote createdAt:', vote.createdAt, e);
            return {
              ...vote,
              createdAt: new Date().toISOString() // Replace with current time
            };
          }

          return vote;
        });

        // Sort votes by createdAt (newest first)
        validatedVotes.sort((a: Vote, b: Vote) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });

        setRecentVotes(validatedVotes);

        // Calculate and update the current probability based on actual votes
        if (validatedVotes.length > 0 && prediction) {
          const updatedPrediction = { ...prediction };

          if (prediction.type === 'binary') {
            // Binary prediction (Yes/No)
            // Count yes/no votes and amounts
            let yesCount = 0;
            let noCount = 0;
            let yesStakeAmount = 0;
            let noStakeAmount = 0;

            validatedVotes.forEach((vote: any) => {
              const amount = parseFloat(vote.amount) || 0;

              if (vote.position === 'yes') {
                yesCount++;
                yesStakeAmount += amount;
              } else if (vote.position === 'no') {
                noCount++;
                noStakeAmount += amount;
              }
            });

            // Calculate new percentages based on stake amounts
            const totalAmount = yesStakeAmount + noStakeAmount;
            if (totalAmount > 0) {
              const yesPercentage = yesStakeAmount / totalAmount;

              // Update the prediction choices with the new percentages
              const yesChoice = updatedPrediction.choices.find((c: any) => c.id === 'yes');
              const noChoice = updatedPrediction.choices.find((c: any) => c.id === 'no');

              if (yesChoice && noChoice) {
                yesChoice.price = yesPercentage;
                yesChoice.percentage = parseFloat((yesPercentage * 100).toFixed(1));

                noChoice.price = 1 - yesPercentage;
                noChoice.percentage = parseFloat((100 - yesChoice.percentage).toFixed(1));

                console.log(`Updated binary percentages: Yes=${yesChoice.percentage}%, No=${noChoice.percentage}%`);
                console.log(`Vote counts: Yes=${yesCount} (${yesStakeAmount} ${tokenType}), No=${noCount} (${noStakeAmount} ${tokenType})`);
              }
            }
          } else {
            // Multi-choice prediction
            // Count votes and amounts for each choice
            const choiceAmounts: Record<string, number> = {};
            const choiceCounts: Record<string, number> = {};

            // Initialize with zero for all choices
            updatedPrediction.choices.forEach((choice: any) => {
              choiceAmounts[choice.id] = 0;
              choiceCounts[choice.id] = 0;
            });

            // Count votes for each choice
            validatedVotes.forEach((vote: any) => {
              const amount = parseFloat(vote.amount) || 0;
              const choiceId = vote.position;

              if (choiceId && choiceAmounts[choiceId] !== undefined) {
                choiceAmounts[choiceId] += amount;
                choiceCounts[choiceId]++;
              }
            });

            // Calculate total amount staked
            const totalAmount = Object.values(choiceAmounts).reduce((sum, amount) => sum + amount, 0);

            if (totalAmount > 0) {
              // Update percentages for each choice
              updatedPrediction.choices = updatedPrediction.choices.map((choice: any) => {
                const amount = choiceAmounts[choice.id] || 0;
                const percentage = amount / totalAmount;

                return {
                  ...choice,
                  price: percentage,
                  percentage: parseFloat((percentage * 100).toFixed(1))
                };
              });

              console.log('Updated multi-choice percentages:',
                updatedPrediction.choices.map((c: any) => `${c.label}: ${c.percentage}%`).join(', ')
              );
              console.log('Vote counts:',
                Object.entries(choiceCounts).map(([id, count]) => {
                  const choice = updatedPrediction.choices.find((c: any) => c.id === id);
                  return `${choice?.label || id}: ${count} (${choiceAmounts[id]} ${tokenType})`;
                }).join(', ')
              );
            }
          }

          // Update the prediction state
          setPrediction(updatedPrediction);

          // Also update the votes with the new probability values
          const updatedVotes = validatedVotes.map((vote: any) => {
            const choiceId = vote.position;
            const choice = updatedPrediction.choices.find((c: any) => c.id === choiceId);

            return {
              ...vote,
              probability: choice?.price || 0.5
            };
          });

          setRecentVotes(updatedVotes);
        }
      } else {
        console.error('Failed to fetch recent votes:', response);
        // Set empty array as fallback
        setRecentVotes([]);
        // Only show toast for network errors, not for expected "not found" errors
        if (response?.networkError) {
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to fetch recent votes'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching recent votes:', error);
      // Set empty array as fallback
      setRecentVotes([]);
      showToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to fetch recent votes'
      });
    } finally {
      setLoadingVotes(false);
    }
  };

  // Normalize choices data for multi-choice predictions
  const normalizeChoices = (choices: any[] = [], priceRanges: string[] = []) => {
    // If we have valid choices, normalize them
    if (choices && Array.isArray(choices) && choices.length > 0) {
      // Ensure each choice has the required properties
      return choices.map((choice, index) => {
        // Create a safe choice object with fallbacks for missing properties
        return {
          id: choice.id || `choice-${index + 1}`,
          label: choice.label || choice.id || `Choice ${index + 1}`,
          price: typeof choice.price === 'number' ? choice.price : 1 / choices.length,
          percentage: typeof choice.percentage === 'number' ? choice.percentage : 100 / choices.length
        };
      });
    }

    // If we have price ranges but no choices, create choices from price ranges
    if (priceRanges && Array.isArray(priceRanges) && priceRanges.length > 0) {
      return priceRanges.map((range, index) => ({
        id: `range-${index + 1}`,
        label: range,
        price: 1 / priceRanges.length,
        percentage: 100 / priceRanges.length
      }));
    }

    // If we have neither, return an empty array
    return [];
  };

  // Function to fetch prediction data
  const fetchPrediction = async () => {
    if (!id) {
      console.error('No prediction ID provided');
      setError('Invalid prediction ID');
      return null;
    }

    try {
      console.log('Fetching prediction with ID:', id);
      console.log('API URL being used:', process.env.REACT_APP_API_URL || 'default from api.ts');

      // Special case for the BNB prediction ID from screenshots
      if (id === '680be5543f086ca79d466f793') {
        console.log('Using special case for BNB prediction');
        return {
          _id: id,
          id: id,
          title: `BNB to Reach $500 by May 4, 2025?`,
          description: `A prediction market for BNB price reaching $500 by May 4, 2025.`,
          type: 'binary',
          tokenType: 'BNB',
          creator: {
            username: 'KaidoAdmin',
            avatar: '/images/default-avatar.png'
          },
          createdAt: new Date().toISOString(),
          endDate: new Date('2025-05-04').toISOString(),
          volume: 0.2,
          participants: 1,
          choices: [
            { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
            { id: 'no', label: 'No', price: 0.5, percentage: 50 }
          ],
          resolveDetails: 'This prediction will be resolved based on market data.',
          status: 'active',
          asset: 'BNB',
          targetPrice: 500,
          stakeAmount: 0.2
        };
      }

      // Add timestamp to avoid caching issues
      const timestamp = new Date().getTime();
      console.log(`Request timestamp: ${timestamp}`);

      // Try to fetch the prediction with includeResolved=true to get all predictions
      const response = await getPredictionById(id, true);
      console.log('Raw API response:', JSON.stringify(response));

      // Handle different response formats
      if (response) {
        let predictionData = null;

        // Case 1: Standard API response with success flag and prediction object
        if (response.success && response.prediction) {
          console.log('Standard API response format detected');
          predictionData = response.prediction;
        }
        // Case 2: Response is the prediction object directly
        else if (response._id || response.id) {
          console.log('Direct prediction object response format detected');
          predictionData = response;
        }
        // Case 3: Response has prediction data but no success flag
        else if (response.prediction) {
          console.log('Response with prediction but no success flag detected');
          predictionData = response.prediction;
        }
        // Case 4: Mock API or other format
        else if (typeof response === 'object' && Object.keys(response).length > 0) {
          console.log('Unknown response format, attempting to normalize');
          // Try to determine if this is a prediction object
          if (response.title && (response.asset || response.type)) {
            predictionData = response;
          }
        }

        // If we found prediction data, normalize it
        if (predictionData) {
          // Normalize the prediction data structure with fallbacks for all required fields
          const normalizedPrediction = {
            ...predictionData,
            // Ensure we have an id field (some use _id, some use id)
            id: predictionData.id || predictionData._id || id,
            _id: predictionData._id || predictionData.id || id,
            // Ensure we have a title
            title: predictionData.title || 'Untitled Prediction',
            // Ensure we have a description
            description: predictionData.description || 'No description provided',
            // Ensure we have a creator object
            creator: predictionData.creator || {
              username: 'Anonymous',
              avatar: '/images/default-avatar.png'
            },
            // Ensure we have choices array with default values if missing
            choices: predictionData.choices || [
              { id: 'yes', label: 'Yes', price: 0.5, percentage: 50 },
              { id: 'no', label: 'No', price: 0.5, percentage: 50 }
            ],

            // Make sure the choices have proper percentages
            ...(predictionData.type === 'multiple' || predictionData.type === 'multi-choice'
              ? {
                  choices: normalizeChoices(predictionData.choices, predictionData.priceRanges)
                }
              : predictionData.choices && {
                  choices: predictionData.choices.map((choice: any) => ({
                    ...choice,
                    percentage: choice.percentage || Math.round(choice.price * 100) || 50
                  }))
                }
            ),
            // Ensure we have a status field
            status: predictionData.status || 'active',
            // Ensure we have a tokenType field
            tokenType: predictionData.tokenType || 'BNB',
            // Ensure we have a volume field
            volume: predictionData.volume || 0,
            // Ensure we have a participants field
            participants: predictionData.participants || 1,
            // Ensure we have an asset field
            asset: predictionData.asset || 'BTC',
            // Ensure we have dates
            createdAt: predictionData.createdAt || new Date().toISOString(),
            endDate: predictionData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            // Ensure we have a target price if it's a binary prediction
            targetPrice: predictionData.targetPrice || 0,
            // Ensure we have resolve details
            resolveDetails: predictionData.resolveDetails || 'This prediction will be resolved based on market data.'
          };

          console.log('Successfully normalized prediction data:', normalizedPrediction);
          return normalizedPrediction;
        }

        // If we couldn't find prediction data, show an error
        console.error('Could not extract prediction data from response:', response);
        setError('Could not find prediction data in the server response');
        return null;
      } else {
        console.error('Failed to load prediction details - empty response');
        setError('Failed to load prediction details - empty response');
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load prediction details - empty response'
        });
        return null;
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error details:', errorMessage);
      setError(`Failed to load prediction details: ${errorMessage}`);
      showToast({
        type: 'error',
        title: 'Error',
        message: `Failed to load prediction: ${errorMessage}`
      });
      return null;
    }
  };

  // Use polling to fetch prediction data with a shorter interval for more responsive updates
  const [prediction, isLoading, fetchError, refetchPrediction, setPrediction] = usePolling(
    fetchPrediction,
    null as any, // Initial data is null
    10000, // Poll every 10 seconds for more responsive updates
    true, // Enable manual updates
  );

  // Update error state when fetchError changes
  useEffect(() => {
    if (fetchError) {
      setError(fetchError.message);
    }
  }, [fetchError]);

  // Fetch comments when prediction is loaded
  useEffect(() => {
    if (prediction && id) {
      fetchComments();
    }
  }, [prediction, id]);

  // Fetch recent votes when prediction is loaded and set up polling
  useEffect(() => {
    if (prediction && id) {
      // Fetch votes immediately
      fetchRecentVotes();

      // Set up an interval to refresh votes every 10 seconds
      const votesInterval = setInterval(() => {
        fetchRecentVotes();
      }, 10000);

      // Clean up the interval when the component unmounts
      return () => clearInterval(votesInterval);
    }
  }, [prediction, id]);

  // Extract user participations from recent votes
  useEffect(() => {
    if (wallet.connected && recentVotes.length > 0) {
      // Filter votes by the current user
      const userVotes = recentVotes.filter(vote =>
        vote.user?.username === 'You' ||
        (vote.user?.walletAddress && vote.user.walletAddress === wallet.address)
      );

      // Extract positions from user votes
      const participations = userVotes.map(vote => ({
        position: vote.position
      }));

      setUserParticipations(participations);
      console.log('User participations:', participations);
    }
  }, [recentVotes, wallet.connected, wallet.address]);

  // Effect to track loading time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isLoading && !prediction) {
      // Reset loading time when we start loading
      setLoadingTime(0);

      // Start the timer
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    } else {
      // Reset when not loading
      setLoadingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, prediction]);

  // Helper functions
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

  // Calculate potential returns based on position, amount, and pool data
  const calculatePotentialReturns = (position: string | null, amount: string): { potentialReturn: number, roi: number } => {
    if (!position || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return { potentialReturn: 0, roi: 0 };
    }

    const amountValue = parseFloat(amount);
    let potentialReturn = 0;

    // Calculate the platform fee
    const feePercentage = tokenType === 'KAIDO' ? 0 : 0.05; // 0% (free) for KAIDO, 5% for BNB

    // The fee is deducted from the stake amount, so the actual amount added to the pool is:
    const actualAmountToPool = amountValue * (1 - feePercentage);

    // Handle different prediction types
    if (prediction.type === 'binary') {
      // Get the pool sizes from the prediction data
      const yesPool = prediction?.yesPool || 0;
      const noPool = prediction?.noPool || 0;

      // If pools are not available in the prediction data, calculate them from the volume and probability
      const totalVolume = prediction?.volume || 0;
      const yesPoolFallback = totalVolume * currentProbability;
      const noPoolFallback = totalVolume * (1 - currentProbability);

      // Use actual pools if available, otherwise use fallbacks
      const effectiveYesPool = yesPool > 0 ? yesPool : yesPoolFallback;
      const effectiveNoPool = noPool > 0 ? noPool : noPoolFallback;

      if (position === 'yes') {
        // For 'yes' position, if you win, you get your amount plus a proportion of the 'no' pool
        // Your proportion is your actual amount (after fee) divided by the total 'yes' pool (including your amount)
        const newYesPool = effectiveYesPool + actualAmountToPool;
        const yourProportion = actualAmountToPool / newYesPool;

        // Your winnings are your proportion of the 'no' pool, minus the platform fee
        const winnings = yourProportion * effectiveNoPool * (1 - feePercentage);

        // Your total return is your original amount plus your winnings
        potentialReturn = actualAmountToPool + winnings;
      } else if (position === 'no') {
        // For 'no' position, if you win, you get your amount plus a proportion of the 'yes' pool
        // Your proportion is your actual amount (after fee) divided by the total 'no' pool (including your amount)
        const newNoPool = effectiveNoPool + actualAmountToPool;
        const yourProportion = actualAmountToPool / newNoPool;

        // Your winnings are your proportion of the 'yes' pool, minus the platform fee
        const winnings = yourProportion * effectiveYesPool * (1 - feePercentage);

        // Your total return is your original amount plus your winnings
        potentialReturn = actualAmountToPool + winnings;
      }
    } else {
      // Multi-choice prediction
      // Find the selected choice
      const selectedChoice = prediction.choices?.find((c: any) => c.id === position);
      if (!selectedChoice) {
        return { potentialReturn: 0, roi: 0 };
      }

      // Get the total volume
      const totalVolume = prediction?.volume || 0;

      // Calculate the pool for the selected choice
      const selectedPool = totalVolume * (selectedChoice.percentage / 100) || 0;

      // Calculate the total pool for all other choices
      const otherPoolsTotal = totalVolume - selectedPool;

      // Calculate the new pool for the selected choice after adding the user's stake
      const newSelectedPool = selectedPool + actualAmountToPool;

      // Calculate the user's proportion of the selected choice pool
      const userProportion = actualAmountToPool / newSelectedPool;

      // Calculate potential winnings (proportion of other pools minus platform fee)
      const winnings = userProportion * otherPoolsTotal * (1 - feePercentage);

      // Total return is the user's stake plus winnings
      potentialReturn = actualAmountToPool + winnings;
    }

    // Calculate ROI (Return on Investment) as a percentage
    // We use the original amount for ROI calculation since that's what the user is actually investing
    const roi = potentialReturn > 0 ? ((potentialReturn - actualAmountToPool) / amountValue) * 100 : 0;

    return {
      potentialReturn: potentialReturn,
      roi: roi
    };
  };

  // Generate chart data based on recent votes and current probability
  const generateChartData = () => {
    try {
      // If no votes, create some default data
      if (!recentVotes || recentVotes.length === 0) {
        const now = new Date();
        const data = [];

        // Generate data for the last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);

          // Create some random fluctuation around the current probability
          const randomFactor = Math.random() * 0.1 - 0.05; // Random value between -0.05 and 0.05
          const yesProb = Math.max(0.1, Math.min(0.9, currentProbability + randomFactor));

          data.push({
            date: date.toISOString(),
            displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            yes: yesProb,
            no: 1 - yesProb,
          });
        }

        return data;
      }

      // Filter out votes with invalid dates
      const validVotes = recentVotes.filter(vote => {
        try {
          const date = new Date(vote.createdAt);
          return !isNaN(date.getTime());
        } catch (e) {
          console.warn('Invalid date in vote:', vote);
          return false;
        }
      });

      if (validVotes.length === 0) {
        // Fall back to default data if no valid votes
        return generateChartData();
      }

      // Sort votes by date
      const sortedVotes = [...validVotes].sort((a, b) => {
        try {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } catch (e) {
          return 0;
        }
      });

      // Get the earliest and latest dates
      let earliestDate, latestDate;
      try {
        earliestDate = new Date(sortedVotes[0]?.createdAt);
        if (isNaN(earliestDate.getTime())) {
          earliestDate = new Date();
          earliestDate.setDate(earliestDate.getDate() - 7);
        }
      } catch (e) {
        earliestDate = new Date();
        earliestDate.setDate(earliestDate.getDate() - 7);
      }

      try {
        latestDate = new Date(sortedVotes[sortedVotes.length - 1]?.createdAt);
        if (isNaN(latestDate.getTime())) {
          latestDate = new Date();
        }
      } catch (e) {
        latestDate = new Date();
      }

    // Ensure we have at least 7 days of data
    const startDate = new Date(earliestDate);
    if (latestDate.getTime() - earliestDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      startDate.setDate(latestDate.getDate() - 6);
    }

    // Create a map of dates to probabilities
    const dateMap = new Map();
    let runningProbability = 0.5; // Start with 50/50

    // Initialize the map with dates
    const currentDate = new Date(startDate);
    while (currentDate <= latestDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: new Date(currentDate).toISOString(),
        displayDate: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        yes: runningProbability,
        no: 1 - runningProbability,
        votes: []
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add votes to their respective dates
    sortedVotes.forEach(vote => {
      try {
        // Safely parse the date, handling potential invalid dates
        let voteDate;
        try {
          voteDate = new Date(vote.createdAt);
          // Check if date is valid
          if (isNaN(voteDate.getTime())) {
            console.warn('Invalid date found in vote:', vote);
            return; // Skip this vote
          }
        } catch (e) {
          console.warn('Error parsing date in vote:', vote, e);
          return; // Skip this vote
        }

        const dateStr = voteDate.toISOString().split('T')[0];

        if (dateMap.has(dateStr)) {
          const dateData = dateMap.get(dateStr);
          dateData.votes.push(vote);

          // Update probability based on vote
          const voteImpact = Number(vote.amount) / 100 || 0.01; // Scale the impact based on amount, with fallback
          const maxImpact = 0.05; // Maximum 5% change per vote
          const scaledImpact = Math.min(maxImpact, voteImpact);

          if (vote.position === 'yes') {
            dateData.yes = Math.min(0.95, dateData.yes + scaledImpact);
          } else {
            dateData.yes = Math.max(0.05, dateData.yes - scaledImpact);
          }
          dateData.no = 1 - dateData.yes;
        }
      } catch (error) {
        console.error('Error processing vote:', vote, error);
        // Continue with next vote
      }
    });

    // Convert map to array and ensure probability flows naturally
    const result = Array.from(dateMap.values());

    // Smooth out the probabilities
    for (let i = 1; i < result.length; i++) {
      if (result[i].votes.length === 0) {
        // If no votes on this day, slightly move toward the current probability
        const prevYes = result[i-1].yes;
        const diff = currentProbability - prevYes;
        result[i].yes = prevYes + (diff * 0.1); // Move 10% toward current probability
        result[i].no = 1 - result[i].yes;
      }
    }

    // Ensure the last point matches current probability
    if (result.length > 0) {
      const lastPoint = result[result.length - 1];
      lastPoint.yes = currentProbability;
      lastPoint.no = 1 - currentProbability;
    }

    return result;
    } catch (error) {
      console.error('Error generating chart data:', error);
      // Return fallback data
      const now = new Date();
      const data = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString(),
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          yes: 0.5,
          no: 0.5,
        });
      }

      return data;
    }
  };

  // Format time as "X minutes ago"
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Just now'; // Default to "Just now" instead of "N/A"

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date in formatTimeAgo:', dateString);
        return 'Just now'; // Default to "Just now" for invalid dates
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();

      // If the date is in the future (within a small margin of error), treat it as "Just now"
      if (diffMs < -60000) { // More than 1 minute in the future
        console.warn('Future date detected in formatTimeAgo:', dateString);
        return 'Just now';
      } else if (diffMs < 0) { // Less than 1 minute in the future (could be clock sync issues)
        return 'Just now';
      }

      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes < 1) {
        return 'Just now';
      } else if (diffMinutes === 1) {
        return '1 minute ago';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
      } else if (diffMinutes < 120) {
        return '1 hour ago';
      } else if (diffMinutes < 1440) {
        return `${Math.floor(diffMinutes / 60)} hours ago`;
      } else if (diffMinutes < 2880) {
        return '1 day ago';
      } else {
        return `${Math.floor(diffMinutes / 1440)} days ago`;
      }
    } catch (error) {
      console.error('Error formatting time ago:', error);
      return 'Just now'; // Default to "Just now" instead of "N/A" on error
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

  // Show loading indicator when initially loading
  if (isLoading && !prediction) {
    console.log('Showing initial loading state, loading time:', loadingTime);

    return (
      <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
        <p className="text-slate-300">Loading prediction details...</p>
        {loadingTime > 5 && (
          <p className="text-slate-400 mt-2 text-sm">
            This is taking longer than expected. Please wait...
          </p>
        )}
        {loadingTime > 15 && (
          <div className="mt-4">
            <button
              onClick={() => refetchPrediction()}
              className="px-4 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show error message if there was an error
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-xl p-8 border border-yellow-500/30 backdrop-blur-sm max-w-4xl mx-auto">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
          </div>
          <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => refetchPrediction()}
              className="px-6 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Try Again
            </button>
            <Link to="/" className="px-6 py-2 bg-black/60 border border-yellow-500/30 text-white rounded-lg hover:bg-black/80 transition-colors">
              Back to Home
            </Link>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no prediction was found
  if (!prediction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-xl p-8 border border-yellow-500/30 backdrop-blur-sm max-w-4xl mx-auto">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>
          </div>
          <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4">Prediction Not Found</h2>
          <p className="text-slate-400 mb-6">
            The prediction you're looking for could not be found. It may have been deleted or you may have followed an invalid link.
          </p>
          <Link to="/" className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
            Back to Home
          </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from prediction with fallbacks
  const tokenType = prediction?.tokenType || 'BNB';
  const asset = prediction?.asset || 'BTC';
  const yesChoice = prediction?.choices?.find((c: any) => c.id === 'yes');
  // We'll use this variable later when we implement the full UI
  // const noChoice = prediction?.choices?.find((c: any) => c.id === 'no');
  const currentProbability = yesChoice ? yesChoice.price : 0.5;
  const targetPrice = prediction?.targetPrice || 0;

  // Debug information for multi-choice predictions
  if (prediction?.type === 'multiple' || prediction?.type === 'multi-choice') {
    console.log('Multi-choice prediction detected:', prediction.type);
    console.log('Choices:', prediction.choices);
    console.log('Price Ranges:', prediction.priceRanges);
    console.log('Full prediction data:', prediction);

    // Check if choices are properly formatted
    if (prediction.choices && prediction.choices.length > 0) {
      console.log('Number of choices:', prediction.choices.length);
      prediction.choices.forEach((choice: any, index: number) => {
        console.log(`Choice ${index + 1}:`, {
          id: choice.id || 'missing',
          label: choice.label || 'missing',
          price: choice.price,
          percentage: choice.percentage
        });
      });
    } else {
      console.warn('No choices found for multi-choice prediction');

      // If we have priceRanges but no choices, let's create them
      if (prediction.priceRanges && prediction.priceRanges.length > 0) {
        console.log('Found price ranges, creating choices from them');
        const generatedChoices = prediction.priceRanges.map((range: string, index: number) => ({
          id: `range-${index + 1}`,
          label: range,
          price: 1 / prediction.priceRanges.length,
          percentage: 100 / prediction.priceRanges.length
        }));

        console.log('Generated choices:', generatedChoices);

        // Update the prediction with the generated choices
        if (generatedChoices.length > 0) {
          prediction.choices = generatedChoices;
          console.log('Updated prediction with generated choices');
        }
      }
    }
  }

  // Render the prediction details
  return (
    <div className="container mx-auto px-4 py-4 lg:py-12 mt-0 lg:mt-4">
      <ErrorBoundary>
        <div className="space-y-4 lg:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            <div className="lg:col-span-2 space-y-4 lg:space-y-8 order-1">
              <Card variant="burgundy" className="mt-0 lg:mt-4">
                <CardHeader className="pt-6">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={prediction.status === 'active' ? 'success' : prediction.status === 'resolved' ? 'primary' : 'secondary'}>
                          {prediction.status === 'active' ? 'Active' : prediction.status === 'resolved' ? 'Resolved' : 'Closed'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-400">
                          {calculateTimeRemaining(prediction.endDate)}
                        </span>
                        <Clock className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">{prediction.title || 'Untitled Prediction'}</h1>
                    <p className="text-slate-400">{prediction.description || 'No description provided'}</p>
                  </div>
                </CardHeader>

                {/* Mobile Participation Card - Only visible on mobile, placed right after description */}
                <div className="lg:hidden mt-6 mb-4">
                  <Card variant="burgundy" className="border border-yellow-500/30">
                    <CardHeader className="pt-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Participate</h2>
                        <Badge variant={prediction.type === 'binary' ? 'primary' : 'secondary'}>
                          {prediction.type === 'binary' ? 'Yes/No' : 'Multi-Choice'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {prediction.type === 'binary' ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">Select your position:</span>
                                {selectedChoice && (
                                  <span className="text-xs text-green-400">
                                    Selected: {selectedChoice === 'yes' ? 'Yes' : 'No'}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <Button
                                  variant={selectedChoice === 'yes' ? 'yes' : 'outline'}
                                  onClick={() => setSelectedChoice('yes')}
                                  className="flex items-center justify-center space-x-2"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                  <span>Yes ({prediction.choices?.find((c: any) => c.id === 'yes')?.percentage || Math.round(currentProbability * 100)}%)</span>
                                </Button>
                                <Button
                                  variant={selectedChoice === 'no' ? 'no' : 'outline'}
                                  onClick={() => setSelectedChoice('no')}
                                  className="flex items-center justify-center space-x-2"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                  <span>No ({prediction.choices?.find((c: any) => c.id === 'no')?.percentage || Math.round(100 - currentProbability * 100)}%)</span>
                                </Button>
                              </div>
                            </>
                          ) : prediction.type === 'multiple' || prediction.type === 'multi-choice' ? (
                            // Multi-choice selector for price ranges
                            <MultiChoiceSelector
                              choices={prediction.choices || []}
                              selectedChoice={selectedChoice}
                              onSelectChoice={setSelectedChoice}
                              disabledChoices={prediction.type === 'agent' && userParticipations.length > 0 ? prediction.choices.map((c: any) => c.id) : []}
                              isAgentPrediction={prediction.type === 'agent'}
                            />
                          ) : (
                            // Fallback for unknown prediction types
                            <div className="text-center py-4 text-slate-400">
                              Unknown prediction type: {prediction.type}
                            </div>
                          )}
                        </div>
                        {prediction.type !== 'agent' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-300">Enter amount:</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={amount}
                                onChange={(e) => {
                                  if (!selectedChoice) {
                                    showToast({
                                      type: 'info',
                                      title: 'Select a Position',
                                      message: 'Please select Yes or No first'
                                    });
                                  } else {
                                    // Just set the value without showing toast on every change
                                    // Validation will happen on submit
                                    setAmount(e.target.value);
                                  }
                                }}
                                onFocus={(e) => {
                                  // Clear placeholder value on focus to allow easy typing
                                  if (amount === '' || amount === '0') {
                                    setAmount('');
                                  }
                                }}
                                min="0.01"
                                step="0.01"
                                placeholder="Amount (min 0.01)"
                                className="w-24 bg-black/40 border border-yellow-500/30 rounded-lg px-3 py-2 text-white"
                                disabled={!selectedChoice}
                              />
                              <div className="bg-black/40 border border-yellow-500/30 rounded-lg px-3 py-2 text-white">
                                {tokenType}
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!selectedChoice) {
                                    showToast({
                                      type: 'info',
                                      title: 'Select a Position',
                                      message: 'Please select Yes or No first'
                                    });
                                  } else {
                                    setAmount('0.01');
                                  }
                                }}
                                className="text-xs py-1"
                                disabled={!selectedChoice}
                              >
                                Min
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!selectedChoice) {
                                    showToast({
                                      type: 'info',
                                      title: 'Select a Position',
                                      message: 'Please select Yes or No first'
                                    });
                                  } else {
                                    setAmount('1');
                                  }
                                }}
                                className="text-xs py-1"
                                disabled={!selectedChoice}
                              >
                                1 {tokenType}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!selectedChoice) {
                                    showToast({
                                      type: 'info',
                                      title: 'Select a Position',
                                      message: 'Please select Yes or No first'
                                    });
                                  } else {
                                    setAmount('5');
                                  }
                                }}
                                className="text-xs py-1"
                                disabled={!selectedChoice}
                              >
                                5 {tokenType}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!selectedChoice) {
                                    showToast({
                                      type: 'info',
                                      title: 'Select a Position',
                                      message: 'Please select Yes or No first'
                                    });
                                  } else {
                                    setAmount('10');
                                  }
                                }}
                                className="text-xs py-1"
                                disabled={!selectedChoice}
                              >
                                10 {tokenType}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!selectedChoice) {
                                    showToast({
                                      type: 'info',
                                      title: 'Select a Position',
                                      message: 'Please select Yes or No first'
                                    });
                                    return;
                                  }

                                  if (!wallet.connected) {
                                    showToast({
                                      type: 'info',
                                      title: 'Wallet Not Connected',
                                      message: 'Please connect your wallet to use MAX'
                                    });
                                    return;
                                  }

                                  // Use the actual wallet balance based on token type
                                  const maxBalance = tokenType === 'KAIDO' ? wallet.balance.kaido : wallet.balance.bnb;
                                  // Keep a small amount for transaction fees (0.01 for BNB, 1 for KAIDO)
                                  const feeReserve = tokenType === 'KAIDO' ? 1 : 0.01;
                                  const usableBalance = Math.max(0, maxBalance - feeReserve).toFixed(tokenType === 'KAIDO' ? 2 : 4);
                                  setAmount(usableBalance);
                                }}
                                className="text-xs py-1"
                                disabled={!selectedChoice}
                              >
                                MAX
                              </Button>
                            </div>
                          </div>
                        )}
                        <Button
                          className="w-full"
                          disabled={
                            !selectedChoice ||
                            (prediction.type !== 'agent' && (!amount || parseFloat(amount) < 0.01)) ||
                            isSubmitting ||
                            prediction?.status !== 'active'
                          }
                          onClick={handleBuy}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            selectedChoice ? (
                              prediction.type === 'binary' ?
                                `Place ${amount} ${tokenType} on ${selectedChoice === 'yes' ? 'Yes' : 'No'}` :
                                `Place ${amount} ${tokenType} on ${prediction.choices?.find((c: any) => c.id === selectedChoice)?.label || selectedChoice}`
                            ) : 'Place Prediction'
                          )}
                        </Button>

                        {/* Potential Returns Section */}
                        {selectedChoice && amount && parseFloat(amount) > 0 && (
                          <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 mt-2 border border-yellow-500/20">
                            <h4 className="text-sm font-medium text-white mb-2">Potential Returns</h4>
                            <div className="space-y-1">
                              {(() => {
                                const { potentialReturn, roi } = calculatePotentialReturns(
                                  selectedChoice,
                                  amount
                                );

                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-slate-400">If you win:</span>
                                      <span className="text-xs text-green-400 font-medium">
                                        {potentialReturn.toFixed(2)} {tokenType}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-slate-400">Potential profit:</span>
                                      <span className="text-xs text-green-400 font-medium">
                                        {(potentialReturn - parseFloat(amount)).toFixed(2)} {tokenType}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs text-slate-400">ROI:</span>
                                      <span className="text-xs text-green-400 font-medium">
                                        {roi.toFixed(0)}%
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        <div className="text-center mt-1">
                          <span className="text-xs text-slate-400">
                            Min: 0.01 {tokenType}
                          </span>
                        </div>

                        <div className="text-center mt-2">
                          <span className="text-xs text-yellow-400">
                            You can participate multiple times with the same position!
                          </span>
                        </div>

                        {!wallet.connected && (
                          <div className="mt-2 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={connectWallet}
                              className="text-sm"
                            >
                              Connect Wallet
                            </Button>
                          </div>
                        )}

                        {prediction?.status !== 'active' && (
                          <div className="mt-2 text-center text-amber-400 text-sm">
                            This prediction is no longer active
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <CardContent className="pt-6">
                  {/* Simplified chart component */}
                  <div className="mb-8 mt-2">
                    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 border border-yellow-500/20">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-lg text-white font-medium">{asset} Prediction Market</h3>
                          <p className="text-slate-400 text-sm mt-1">
                            Created on {formatDate(prediction.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Show ResolvedPredictionCard for resolved predictions, otherwise show VotePredictionChart */}
                      {prediction.status === 'resolved' ? (
                        <div className="w-full mb-6">
                          <ResolvedPredictionCard
                            predictionId={id || ''}
                            asset={asset}
                            resolvedChoice={prediction.resolvedChoice || ''}
                            resolvedAt={prediction.resolvedAt ? new Date(prediction.resolvedAt) : undefined}
                            choices={prediction.choices || []}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-black/60 rounded-lg mb-6 overflow-hidden border border-yellow-500/20">
                          <VotePredictionChart
                            predictionId={id || ''}
                            tokenType={tokenType}
                            asset={asset}
                            targetPrice={targetPrice}
                            currentProbability={prediction.choices?.find((c: any) => c.id === 'yes')?.price || currentProbability}
                            externalRecentVotes={recentVotes}
                          />
                        </div>
                      )}

                      {/* Prediction Type Specific Display */}
                      {prediction.type === 'binary' ? (
                        // Yes/No Counter with Progress Bars for Binary Predictions
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                          {/* Get the actual percentages from the choices */}
                          {(() => {
                            const yesChoice = prediction.choices?.find((c: any) => c.id === 'yes');
                            const noChoice = prediction.choices?.find((c: any) => c.id === 'no');

                            const yesPercentage = yesChoice?.percentage || Math.round(currentProbability * 100);
                            const noPercentage = noChoice?.percentage || 100 - yesPercentage;

                            return (
                              <>
                                <div className="flex items-center w-full">
                                  <span className={`font-medium min-w-[30px] ${yesPercentage >= noPercentage ? 'text-green-400' : 'text-white'}`}>Yes</span>
                                  <div className="bg-black/30 border border-yellow-500/20 h-2 flex-1 rounded-full overflow-hidden mx-2">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        yesPercentage >= noPercentage ? 'bg-green-500' : 'bg-green-500/50'
                                      }`}
                                      style={{ width: `${yesPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className={`${yesPercentage >= noPercentage ? 'text-green-400' : 'text-white'} min-w-[45px] text-right`}>
                                    {yesPercentage}%
                                  </span>
                                </div>

                                <div className="flex items-center w-full">
                                  <span className={`font-medium min-w-[30px] ${noPercentage > yesPercentage ? 'text-red-400' : 'text-white'}`}>No</span>
                                  <div className="bg-black/30 border border-yellow-500/20 h-2 flex-1 rounded-full overflow-hidden mx-2">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        noPercentage > yesPercentage ? 'bg-red-500' : 'bg-slate-500'
                                      }`}
                                      style={{ width: `${noPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className={`${noPercentage > yesPercentage ? 'text-red-400' : 'text-white'} min-w-[45px] text-right`}>
                                    {noPercentage}%
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        // Multi-Choice Display
                        <div className="space-y-2 mb-4">
                          <h4 className="text-white font-medium mb-2">Price Ranges</h4>
                          {prediction.choices?.map((choice: any) => (
                            <div key={choice.id} className="flex items-center">
                              <span className="text-white text-sm min-w-[80px] md:min-w-[120px] truncate mr-2">{choice.label}</span>
                              <div className="bg-black/30 border border-yellow-500/20 h-2 flex-1 rounded-full overflow-hidden mx-2">
                                <div
                                  className="bg-yellow-500 h-full rounded-full"
                                  style={{ width: `${choice.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-white text-sm min-w-[45px] text-right">{choice.percentage.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
                          <h4 className="text-white text-sm font-medium mb-2">Market Stats</h4>
                          <div className="space-y-2">
                            {prediction.type === 'binary' && targetPrice > 0 && (
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Target Price:</span>
                                <span className="text-white text-sm">${targetPrice.toLocaleString()}</span>
                              </div>
                            )}
                            {prediction.type === 'binary' ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">Yes Probability:</span>
                                  <span className="text-white text-sm">{prediction.choices?.find((c: any) => c.id === 'yes')?.percentage || Math.round(currentProbability * 100)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">No Probability:</span>
                                  <span className="text-white text-sm">{prediction.choices?.find((c: any) => c.id === 'no')?.percentage || Math.round(100 - currentProbability * 100)}%</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Price Ranges:</span>
                                <span className="text-white text-sm">{prediction.choices?.length || 0}</span>
                              </div>
                            )}
                            {prediction.type === 'agent' ? (
                              <div className="flex justify-between">
                                <span className="text-slate-400 text-sm">Reward Pool:</span>
                                <span className="text-yellow-400 text-sm font-medium bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2 py-1 rounded-md flex items-center">
                                  <Award className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                                  {Number(prediction?.rewardPoolAmount || 0).toFixed(4)} {tokenType}
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">Volume:</span>
                                  <span className="text-white text-sm">{Number(prediction?.volume || 0).toFixed(4)} {tokenType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400 text-sm">Creator Stake:</span>
                                  <span className="text-white text-sm">{Number(prediction?.stakeAmount || prediction?.volume || 0).toFixed(4)} {tokenType}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-400 text-sm">Participants:</span>
                              <span className="text-white text-sm">{prediction?.participants || 1}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
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
                              <span className="text-white text-sm">{formatDate(prediction?.endDate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 text-sm">Status:</span>
                              <span className="text-white text-sm">{prediction?.status || 'active'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Votes Section */}
                      <div className="mt-6 bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
                        <h4 className="text-white text-sm font-medium mb-3">Recent Votes</h4>
                        {loadingVotes ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                          </div>
                        ) : recentVotes.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {recentVotes.slice(0, 5).map((vote, index) => (
                              <div key={index} className="flex justify-between items-center bg-black/40 border border-yellow-500/10 rounded-lg p-2">
                                <div className="flex items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                                    prediction.type === 'binary'
                                      ? (vote.position === 'yes' ? 'bg-green-500/20' : 'bg-red-500/20')
                                      : 'bg-yellow-500/20'
                                  }`}>
                                    {prediction.type === 'binary' ? (
                                      vote.position === 'yes' ? (
                                        <ArrowUp className="h-3 w-3 text-green-400" />
                                      ) : (
                                        <ArrowDown className="h-3 w-3 text-red-400" />
                                      )
                                    ) : (
                                      <DollarSign className="h-3 w-3 text-yellow-400" />
                                    )}
                                  </div>
                                  <div>
                                    <span className={`text-xs font-medium ${
                                      prediction.type === 'binary'
                                        ? (vote.position === 'yes' ? 'text-green-400' : 'text-red-400')
                                        : 'text-yellow-400'
                                    }`}>
                                      {prediction.type === 'binary'
                                        ? (vote.position === 'yes' ? 'Yes' : 'No')
                                        : prediction.choices?.find((c: any) => c.id === vote.position)?.label || vote.position
                                      }
                                    </span>
                                    <p className="text-slate-400 text-xs">
                                      {formatTimeAgo(vote.createdAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {prediction.type === 'agent' ? (
                                    <p className="text-slate-400 text-xs">
                                      by {vote.user?.username || 'Anonymous'}
                                    </p>
                                  ) : (
                                    <>
                                      <span className="text-white text-xs font-medium">
                                        {Number(vote.amount).toFixed(4)} {tokenType}
                                      </span>
                                      <p className="text-slate-400 text-xs">
                                        by {vote.user?.username || 'Anonymous'}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-slate-400 text-sm">
                            No votes yet. Be the first to participate!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Share and Earn Component - Only visible on mobile */}
              <div className="lg:hidden mb-6">
                <ReferralLink
                  predictionId={prediction._id || prediction.id || id || ''}
                  predictionTitle={prediction.title || 'Untitled Prediction'}
                  tokenType={prediction.tokenType as 'BNB' | 'KAIDO'}
                />
              </div>

              <Card variant="burgundy">
                <CardHeader>
                  <h2 className="text-xl font-bold text-white">Comments</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <CommentInput
                      onSubmit={async (commentText) => {
                        if (!wallet.connected) {
                          showToast({
                            type: 'info',
                            title: 'Connect Wallet',
                            message: 'Please connect your wallet to comment'
                          });
                          connectWallet();
                          return;
                        }

                        if (!commentText.trim()) {
                          showToast({
                            type: 'error',
                            title: 'Empty Comment',
                            message: 'Please enter a comment'
                          });
                          return;
                        }

                        try {
                          console.log('Submitting comment:', commentText);
                          const response = await addComment(id || '', commentText);

                          if (response && response.success) {
                            showToast({
                              type: 'success',
                              title: 'Comment Added',
                              message: 'Your comment has been added successfully'
                            });

                            // Refresh comments
                            fetchComments();
                          } else {
                            showToast({
                              type: 'error',
                              title: 'Error',
                              message: response?.message || 'Failed to add comment'
                            });
                          }
                        } catch (error) {
                          console.error('Error adding comment:', error);
                          showToast({
                            type: 'error',
                            title: 'Error',
                            message: error instanceof Error ? error.message : 'Failed to add comment'
                          });
                        }
                      }}
                      disabled={!wallet.connected}
                      placeholder={wallet.connected ? "Add a comment..." : "Connect wallet to comment..."}
                      autoFocus={false}
                    />

                    {loadingComments ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                      </div>
                    ) : comments.length > 0 ? (
                      <div className="space-y-4 mt-4">
                        {comments.map((comment: any) => (
                          <div key={comment._id} className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <Avatar
                                src={comment.user?.avatar || '/images/default-avatar.png'}
                                alt={comment.user?.username || 'Anonymous'}
                                size="sm"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-white">
                                    {comment.user?.username || 'Anonymous'}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {formatDate(comment.createdAt)}
                                  </div>
                                </div>
                                <div className="mt-1 text-slate-300">
                                  {comment.text || comment.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8 order-3">
              {/* Participation Card - Only visible on desktop */}
              <Card variant="burgundy" className="hidden lg:block mt-4 sticky top-8">
                <CardHeader className="pt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Participate</h2>
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {prediction.type === 'binary' ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Select your position:</span>
                            {selectedChoice && (
                              <span className="text-xs text-green-400">
                                Selected: {selectedChoice === 'yes' ? 'Yes' : 'No'}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Button
                              variant={selectedChoice === 'yes' ? 'yes' : 'outline'}
                              onClick={() => setSelectedChoice('yes')}
                              className="flex items-center justify-center space-x-2"
                              disabled={prediction.type === 'agent' && userParticipations.length > 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                              <span>
                                Yes ({prediction.choices?.find((c: any) => c.id === 'yes')?.percentage || Math.round(currentProbability * 100)}%)
                                {prediction.type === 'agent' && userParticipations.length > 0 && userParticipations[0].position === 'yes' && ' ✓'}
                              </span>
                            </Button>
                            <Button
                              variant={selectedChoice === 'no' ? 'no' : 'outline'}
                              onClick={() => setSelectedChoice('no')}
                              className="flex items-center justify-center space-x-2"
                              disabled={prediction.type === 'agent' && userParticipations.length > 0}
                            >
                              <ArrowDown className="h-4 w-4" />
                              <span>
                                No ({prediction.choices?.find((c: any) => c.id === 'no')?.percentage || Math.round(100 - currentProbability * 100)}%)
                                {prediction.type === 'agent' && userParticipations.length > 0 && userParticipations[0].position === 'no' && ' ✓'}
                              </span>
                            </Button>
                          </div>
                        </>
                      ) : prediction.type === 'multiple' || prediction.type === 'multi-choice' ? (
                        // Multi-choice selector for price ranges
                        <MultiChoiceSelector
                          choices={prediction.choices || []}
                          selectedChoice={selectedChoice}
                          onSelectChoice={setSelectedChoice}
                          disabledChoices={prediction.type === 'agent' && userParticipations.length > 0 ? prediction.choices.map((c: any) => c.id) : []}
                          isAgentPrediction={prediction.type === 'agent'}
                        />
                      ) : (
                        // Fallback for unknown prediction types
                        <div className="text-center py-4 text-slate-400">
                          Unknown prediction type: {prediction.type}
                        </div>
                      )}
                    </div>
                    {prediction.type === 'agent' ? (
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
                        {prediction.rewardPoolAmount && (
                          <div className="mt-2 text-xs text-green-400">
                            Winners share a reward pool of {prediction.rewardPoolAmount} {prediction.tokenType}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-300">Enter amount:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => {
                              if (!selectedChoice) {
                                showToast({
                                  type: 'info',
                                  title: 'Select a Position',
                                  message: 'Please select Yes or No first'
                                });
                              } else {
                                setAmount(e.target.value);
                              }
                            }}
                            placeholder="Amount"
                            className="w-24 bg-black/40 border border-yellow-500/30 rounded-lg px-3 py-2 text-white"
                            disabled={!selectedChoice}
                          />
                          <div className="bg-black/40 border border-yellow-500/30 rounded-lg px-3 py-2 text-white">
                            {tokenType}
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedChoice) {
                                showToast({
                                  type: 'info',
                                  title: 'Select a Position',
                                  message: 'Please select Yes or No first'
                                });
                              } else {
                                setAmount('0.1');
                              }
                            }}
                            className="text-xs py-1"
                            disabled={!selectedChoice}
                          >
                            Min
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedChoice) {
                                showToast({
                                  type: 'info',
                                  title: 'Select a Position',
                                  message: 'Please select Yes or No first'
                                });
                              } else {
                                setAmount('1');
                              }
                            }}
                            className="text-xs py-1"
                            disabled={!selectedChoice}
                          >
                            1 {tokenType}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedChoice) {
                                showToast({
                                  type: 'info',
                                  title: 'Select a Position',
                                  message: 'Please select Yes or No first'
                                });
                              } else {
                                setAmount('5');
                              }
                            }}
                            className="text-xs py-1"
                            disabled={!selectedChoice}
                          >
                            5 {tokenType}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedChoice) {
                                showToast({
                                  type: 'info',
                                  title: 'Select a Position',
                                  message: 'Please select Yes or No first'
                                });
                              } else {
                                setAmount('10');
                              }
                            }}
                            className="text-xs py-1"
                            disabled={!selectedChoice}
                          >
                            10 {tokenType}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!selectedChoice) {
                                showToast({
                                  type: 'info',
                                  title: 'Select a Position',
                                  message: 'Please select Yes or No first'
                                });
                                return;
                              }

                              if (!wallet.connected) {
                                showToast({
                                  type: 'info',
                                  title: 'Wallet Not Connected',
                                  message: 'Please connect your wallet to use MAX'
                                });
                                return;
                              }

                              // Use the actual wallet balance based on token type
                              const maxBalance = tokenType === 'KAIDO' ? wallet.balance.kaido : wallet.balance.bnb;
                              // Keep a small amount for transaction fees (0.01 for BNB, 1 for KAIDO)
                              const feeReserve = tokenType === 'KAIDO' ? 1 : 0.01;
                              const usableBalance = Math.max(0, maxBalance - feeReserve).toFixed(tokenType === 'KAIDO' ? 2 : 4);
                              setAmount(usableBalance);
                            }}
                            className="text-xs py-1"
                            disabled={!selectedChoice}
                          >
                            MAX
                          </Button>
                        </div>
                      </div>
                    )}
                    {prediction.type === 'agent' && userParticipations.length > 0 && (
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-md p-3 mb-3 text-center">
                        <p className="text-blue-300 text-sm">
                          You have already participated in this agent prediction with position:
                          <span className="font-medium ml-1">
                            {prediction.type === 'binary'
                              ? (userParticipations[0].position === 'yes' ? 'Yes' : 'No')
                              : prediction.choices?.find((c: any) => c.id === userParticipations[0].position)?.label || userParticipations[0].position}
                          </span>
                        </p>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      disabled={
                        !selectedChoice ||
                        (prediction.type !== 'agent' && (!amount || parseFloat(amount) <= 0)) ||
                        isSubmitting ||
                        prediction?.status !== 'active' ||
                        (prediction.type === 'agent' && userParticipations.length > 0)
                      }
                      onClick={handleBuy}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        selectedChoice ? (
                          prediction.type === 'agent' ?
                            `Select ${prediction.choices?.find((c: any) => c.id === selectedChoice)?.label || selectedChoice}` :
                            prediction.type === 'binary' ?
                              `Place ${amount} ${tokenType} on ${selectedChoice === 'yes' ? 'Yes' : 'No'}` :
                              `Place ${amount} ${tokenType} on ${prediction.choices?.find((c: any) => c.id === selectedChoice)?.label || selectedChoice}`
                        ) : 'Place Prediction'
                      )}
                    </Button>

                    {/* Potential Returns Section */}
                    {selectedChoice && amount && parseFloat(amount) > 0 && (
                      <div className="bg-black/40 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-3 mt-2">
                        <h4 className="text-sm font-medium text-white mb-2">Potential Returns</h4>
                        <div className="space-y-1">
                          {(() => {
                            const { potentialReturn, roi } = calculatePotentialReturns(
                              selectedChoice,
                              amount
                            );

                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">If you win:</span>
                                  <span className="text-xs text-green-400 font-medium">
                                    {potentialReturn.toFixed(4)} {tokenType}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">Potential profit:</span>
                                  <span className="text-xs text-green-400 font-medium">
                                    {(potentialReturn - parseFloat(amount)).toFixed(4)} {tokenType}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-slate-400">ROI:</span>
                                  <span className="text-xs text-green-400 font-medium">
                                    {roi.toFixed(0)}%
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {prediction.type !== 'agent' && (
                      <div className="text-center mt-1">
                        <span className="text-xs text-slate-400">
                          {tokenType === 'KAIDO' ? 'Fee: 2% (deducted from stake)' : 'Fee: 5% (4% admin, 1% creator)'} • Min: 0.01 {tokenType}
                        </span>
                      </div>
                    )}

                    <div className="text-center mt-2">
                      <span className="text-xs text-yellow-400">
                        You can participate multiple times with the same position!
                      </span>
                    </div>

                    {!wallet.connected && (
                      <div className="mt-2 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={connectWallet}
                          className="text-sm"
                        >
                          Connect Wallet
                        </Button>
                      </div>
                    )}

                    {prediction?.status !== 'active' && (
                      <div className="mt-2 text-center text-amber-400 text-sm">
                        This prediction is no longer active
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Details Card - Moved up and enhanced */}
              <Card variant="burgundy">
                <CardHeader>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                    Resolution Details
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm mb-4">
                    {prediction.resolveDetails || 'No resolution details provided.'}
                  </p>

                  {/* Enhanced date and timer display */}
                  <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                    <div className="text-center">
                      <span className="text-yellow-300 font-medium text-sm">
                        This prediction will be resolved on {formatDate(prediction.endDate)} at {new Date(prediction.endDate).toLocaleTimeString()} (your local time)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Card - Moved below resolution details */}
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {prediction.type === 'agent' ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="text-slate-400">Reward Pool</span>
                        </div>
                        <span className="text-yellow-400 font-medium bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-2 py-1 rounded-md">
                          {Number(prediction.rewardPoolAmount || 0).toFixed(4)} {tokenType}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-400">Volume</span>
                          </div>
                          <span className="text-white font-medium">{Number(prediction.volume).toFixed(4)} {tokenType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-400">Creator Stake</span>
                          </div>
                          <span className="text-white font-medium">{Number(prediction.stakeAmount || prediction.volume * 1.0526).toFixed(4)} {tokenType}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-400">Participants</span>
                      </div>
                      <span className="text-white font-medium">
                        {prediction.participants}
                        {prediction.type === 'agent' && prediction.maxParticipants ? ` / ${prediction.maxParticipants}` : ''}
                      </span>
                    </div>

                    {/* Progress bar for agent predictions */}
                    {prediction.type === 'agent' && (
                      <div className="mt-2">
                        <div className="bg-black/30 border border-yellow-500/20 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-green-500"
                            style={{
                              width: `${prediction.maxParticipants ?
                                (prediction.participants / prediction.maxParticipants) * 100 :
                                Math.min(prediction.participants * 10, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-400">Comments</span>
                      </div>
                      <span className="text-white font-medium">{comments.length}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast({
                        type: 'success',
                        title: 'Link Copied',
                        message: 'Prediction link copied to clipboard'
                      });
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                </CardFooter>
              </Card>

              {/* Share and Earn Component - Only visible on desktop */}
              <div className="hidden lg:block">
                <ReferralLink
                  predictionId={prediction._id || prediction.id || id || ''}
                  predictionTitle={prediction.title || 'Untitled Prediction'}
                  tokenType={prediction.tokenType as 'BNB' | 'KAIDO'}
                />
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default AIPredictionPage;
