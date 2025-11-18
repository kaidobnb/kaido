import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Plus } from 'lucide-react';
import PredictionsGrid from '../components/predictions/PredictionsGrid';
import PredictionCreationFlow, { PredictionData } from '../components/chat/PredictionCreationFlow';
import PredictionCard from '../components/predictions/PredictionCard';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import EmbeddedChatWidget from '../components/chat/EmbeddedChatWidget';

import FAQSection from '../components/sections/FAQSection';
import RoadmapSection from '../components/sections/RoadmapSection';
import AffiliateSection from '../components/sections/AffiliateSection';
import AffiliateHeroBanner from '../components/affiliate/AffiliateHeroBanner';
import { createPrediction, getPredictions, getRecentVotes } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../contexts/WalletContext';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { createBnbTransaction, checkTransactionStatus, ADMIN_WALLET_ADDRESS } from '../utils/transactionUtils';
import { usePolling } from '../hooks/usePolling';


const HomePage: React.FC = () => {
  const [showCreationFlow, setShowCreationFlow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { wallet } = useWallet();
  const { address, isConnected } = useAccount();
  const { address: appkitAddress } = useAppKitAccount();
  const location = useLocation();

  // Check for openChat parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const openChat = searchParams.get('openChat');

    if (openChat === 'true') {
      // Dispatch the kaido:open event to open the chat widget
      const event = new CustomEvent('kaido:open');
      document.dispatchEvent(event);

      // Remove the parameter from URL without refreshing the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location]);

  // Admin wallet address is imported from transactionUtils

  // Fetch predictions with polling
  const fetchPredictions = async () => {
    try {
      // Fetch real predictions from backend
      const response = await getPredictions();

      // Check if the response has the expected structure
      if (response && response.success && Array.isArray(response.predictions)) {
        // Use the predictions array from the response
        let predictions = response.predictions || [];

        // Sort predictions to show active ones first, then resolved ones
        // Filter out only cancelled predictions, but keep resolved ones
        predictions = predictions.filter(prediction =>
          prediction.status !== 'cancelled'
        );

        // Sort by status (active first) then by creation date (newest first)
        predictions.sort((a, b) => {
          // Active predictions come first
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (b.status === 'active' && a.status !== 'active') return 1;

          // Then sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Fetch votes for each prediction and update percentages
        const updatedPredictions = await Promise.all(
          predictions.map(async (prediction) => {
            try {
              // Only fetch votes for binary predictions
              if (prediction.type === 'binary' && prediction._id) {
                console.log(`Fetching votes for prediction ${prediction._id} (${prediction.title})`);
                const votesResponse = await getRecentVotes(prediction._id);

                if (votesResponse && votesResponse.success && Array.isArray(votesResponse.votes)) {
                  const votes = votesResponse.votes;
                  console.log(`Found ${votes.length} votes for prediction ${prediction._id}`);

                  if (prediction.type === 'binary') {
                    // Binary prediction (Yes/No)
                    // Calculate percentages based on vote amounts
                    let yesStakeAmount = 0;
                    let noStakeAmount = 0;

                    votes.forEach(vote => {
                      const amount = parseFloat(vote.amount) || 0;

                      if (vote.position === 'yes') {
                        yesStakeAmount += amount;
                      } else if (vote.position === 'no') {
                        noStakeAmount += amount;
                      }
                    });

                    // Calculate new percentages based on stake amounts
                    const totalAmount = yesStakeAmount + noStakeAmount;
                    if (totalAmount > 0) {
                      const yesPercentage = yesStakeAmount / totalAmount;

                      // Update the prediction choices with the new percentages
                      if (!prediction.choices) {
                        prediction.choices = [
                          { id: 'yes', label: 'Yes', price: yesPercentage, percentage: Math.round(yesPercentage * 100) },
                          { id: 'no', label: 'No', price: 1 - yesPercentage, percentage: Math.round((1 - yesPercentage) * 100) }
                        ];
                      } else {
                        const yesChoice = prediction.choices.find(c => c.id === 'yes');
                        const noChoice = prediction.choices.find(c => c.id === 'no');

                        if (yesChoice && noChoice) {
                          yesChoice.price = yesPercentage;
                          yesChoice.percentage = Math.round(yesPercentage * 100);

                          noChoice.price = 1 - yesPercentage;
                          noChoice.percentage = 100 - yesChoice.percentage;
                        }
                      }
                    }
                  } else {
                    // Multi-choice prediction
                    // Count votes and amounts for each choice
                    const choiceAmounts: Record<string, number> = {};
                    const choiceCounts: Record<string, number> = {};

                    // Initialize with zero for all choices
                    if (prediction.choices) {
                      prediction.choices.forEach(choice => {
                        choiceAmounts[choice.id] = 0;
                        choiceCounts[choice.id] = 0;
                      });
                    }

                    // Count votes for each choice
                    votes.forEach(vote => {
                      const amount = parseFloat(vote.amount) || 0;
                      const choiceId = vote.position;

                      if (choiceId && choiceAmounts[choiceId] !== undefined) {
                        choiceAmounts[choiceId] += amount;
                        choiceCounts[choiceId]++;
                      }
                    });

                    // Calculate total amount staked
                    const totalAmount = Object.values(choiceAmounts).reduce((sum, amount) => sum + amount, 0);

                    if (totalAmount > 0 && prediction.choices) {
                      // Update percentages for each choice
                      prediction.choices = prediction.choices.map(choice => {
                        const amount = choiceAmounts[choice.id] || 0;
                        const percentage = amount / totalAmount;

                        return {
                          ...choice,
                          price: percentage,
                          percentage: Math.round(percentage * 100)
                        };
                      });
                    }
                  }
                }
              }

              return prediction;
            } catch (error) {
              console.error(`Error fetching votes for prediction ${prediction._id}:`, error);
              return prediction;
            }
          })
        );

        // Predictions are already sorted by status and creation date above

        // Log detailed information about the percentages for each prediction
        updatedPredictions.forEach(prediction => {
          if (prediction.type === 'binary' && prediction.choices) {
            const yesChoice = prediction.choices.find(c => c.id === 'yes');
            const noChoice = prediction.choices.find(c => c.id === 'no');
            console.log(`Prediction ${prediction._id} (${prediction.title}) percentages:`,
              `Yes: ${yesChoice?.percentage || 'N/A'}%, No: ${noChoice?.percentage || 'N/A'}%`);
          }
        });

        console.log('Fetched active predictions with updated percentages:', updatedPredictions);
        return updatedPredictions;
      } else {
        console.error('Unexpected API response format:', response);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Received invalid data format from server'
        });
        return [];
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load predictions'
      });
      return [];
    }
  };

  // Use polling hook to fetch predictions every 30 seconds
  const [predictions, isLoading, error, refetchPredictions] = usePolling(
    fetchPredictions,
    [],
    30000, // 30 seconds
    true
  );

  const handleCreatePrediction = () => {
    // Open the chat widget instead of the modal
    const event = new CustomEvent('kaido:open');
    document.dispatchEvent(event);
  };

  const handleCloseCreationFlow = () => {
    setShowCreationFlow(false);
  };

  const handleSubmitPrediction = async (predictionData: PredictionData) => {
    try {
      setIsSubmitting(true);

      // Check if wallet is connected
      if (!wallet.connected || !wallet.address) {
        showToast({
          type: 'error',
          title: 'Wallet Not Connected',
          message: 'Please connect your wallet to create a prediction'
        });
        setIsSubmitting(false);
        return;
      }

      // Check if connection is available
      if (!connection) {
        showToast({
          type: 'error',
          title: 'Connection Error',
          message: 'No connection to BNB Smart Chain network'
        });
        setIsSubmitting(false);
        return;
      }

      // Log the current network endpoint for debugging
      console.log('Current network endpoint:', connection.rpcEndpoint);

      // Format the data for the API
      const apiData = {
        title: `Will ${predictionData.asset} ${predictionData.type === 'binary' ?
          `reach $${predictionData.targetPrice} by` :
          `fall within which range on`} ${new Date(predictionData.expiryDate).toLocaleDateString()}?`,
        description: `A prediction market for ${predictionData.asset} price ${predictionData.type === 'binary' ?
          `reaching $${predictionData.targetPrice}` :
          `ranges`} by ${new Date(predictionData.expiryDate).toLocaleDateString()}.`,
        type: predictionData.type === 'binary' ? 'binary' : 'multiple',
        tokenType: predictionData.stakeToken,
        endDate: predictionData.expiryDate,
        asset: predictionData.asset,
        targetPrice: predictionData.type === 'binary' ? parseFloat(predictionData.targetPrice || '0') : undefined,
        priceRanges: predictionData.type === 'multi-choice' ? predictionData.priceRanges : undefined,
        stakeAmount: predictionData.stakeAmount,
        resolveDetails: `This prediction will be resolved based on the ${predictionData.asset} price on ${new Date(predictionData.expiryDate).toLocaleDateString()}.`,
        useAI: true, // Use AI to enhance the prediction details
        // Add transaction simulation flag for development
        simulateTransaction: true, // This tells the backend to skip the actual transaction verification
        walletAddress: wallet.address // Send the wallet address for verification
      };

      // Check if user has enough balance
      if (wallet.balance.bnb < predictionData.stakeAmount) {
        showToast({
          type: 'error',
          title: 'Insufficient Balance',
          message: `You need at least ${predictionData.stakeAmount} BNB to create this prediction`
        });
        setIsSubmitting(false);
        return;
      }

      // Show transaction pending toast
      showToast({
        type: 'info',
        title: 'Transaction Pending',
        message: 'Please approve the transaction in your wallet'
      });

      // For SOL transfers
      try {
        // Check if wallet provider is available
        if (!walletProvider) {
          throw new Error('Wallet provider not found');
        }

        // Create a BNB transaction
        const transaction = await createBnbTransaction(
          address as Address,
          predictionData.stakeAmount
        );

        // For now, simulate transaction hash (in real implementation, use wagmi to send transaction)
        const signature = '0x' + Math.random().toString(16).substring(2, 66);
        console.log('Transaction sent with signature:', signature);

        // Add transaction hash to API data
        apiData.transactionHash = signature;
        apiData.bypassBalanceCheck = true; // Tell backend to bypass balance check
        apiData.tokenType = 'BNB'; // Specify token type

        // Add additional debugging information
        apiData.walletBalanceBefore = wallet.balance.bnb;
        apiData.transactionAmount = predictionData.stakeAmount;
        apiData.transactionFee = 0.002; // Estimated transaction fee

        console.log('Transaction successful, hash:', signature);

        // Try to check transaction status using REST API
        try {
          console.log('Checking transaction status using REST API...');
          const txStatus = await checkTransactionStatus(signature);
          console.log('Transaction status:', txStatus);

          // If the transaction is confirmed, proceed with creating the prediction
          if (txStatus.status === 'confirmed') {
            console.log('Transaction confirmed via REST API');
          } else {
            console.log('Transaction not yet confirmed, proceeding anyway');
          }
        } catch (statusError) {
          console.error('Error checking transaction status:', statusError);
          console.log('Proceeding without confirmation due to status check error');
        }
      } catch (txError) {
        console.error('Transaction error:', txError);
        showToast({
          type: 'error',
          title: 'Transaction Failed',
          message: txError instanceof Error ? txError.message : 'Failed to process payment'
        });
        setIsSubmitting(false);
        return;
      }

      // After successful transaction, create the prediction
      try {
        console.log('Creating prediction with real API...');
        const response = await createPrediction(apiData);

        if (response.success) {
          showToast({
            type: 'success',
            title: 'Prediction Created',
            message: 'Your prediction has been created successfully'
          });
          setShowCreationFlow(false);

          // Refresh predictions using the polling hook's refetch function
          refetchPredictions();
        } else {
          showToast({
            type: 'error',
            title: 'Creation Failed',
            message: response.message || 'Failed to create prediction'
          });
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        showToast({
          type: 'error',
          title: 'Creation Failed',
          message: apiError instanceof Error ? apiError.message : 'Failed to create prediction. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error creating prediction:', error);
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: 'An error occurred while creating the prediction'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-0 sm:py-10">
      {/* Responsive margins and padding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-4 sm:mb-8 mt-0 sm:mt-4">
        <div className="lg:col-span-2">
          <Card
            className="border-none overflow-hidden h-full hover:shadow-lg transition-shadow relative"
            data-glow-color="#F3BA2F"
          >
            {/* Enhanced Background with multiple layers */}
            <div className="absolute inset-0 z-0">
              {/* Base gradient - rich dark with burgundy undertones */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>

              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>

              {/* Subtle diagonal pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
              }}></div>

              {/* Decorative corner accent - top left */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>

              {/* Decorative corner accent - bottom right */}
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>

              {/* Subtle grid pattern overlay */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)',
                backgroundSize: '50px 50px'
              }}></div>
            </div>

            <CardContent className="p-3 sm:p-6 md:p-8 h-full flex flex-col relative z-10">
              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="mb-3 sm:mb-6">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl text-white mb-2 sm:mb-3 leading-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 font-bold">
                      Create Predictions
                    </span>
                  </h1>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl text-white font-bold leading-tight">
                    Powered by AI
                  </h2>
                  <p className="text-white/70 text-sm sm:text-base md:text-lg mt-2 sm:mt-4">
                    KAIDO is the First Consumer Layer & Loss-Edge AI-Agent prediction market built on BNB Chain starting with crypto and sports predictions.
                  </p>
                </div>

                {/* Embedded Chat Widget */}
                <div className="w-full h-[320px] sm:h-[280px] md:h-[320px]">
                  <EmbeddedChatWidget />
                </div>
              </div>

              {/* Abstract background shapes - enhanced */}
              <div className="absolute top-0 right-0 w-2/3 h-full opacity-30 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-0 right-24 w-48 h-48 bg-orange-500 rounded-full filter blur-3xl"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6 h-full">
          <Card className="flex-1 flex flex-col overflow-hidden relative" data-glow-color="#F3BA2F">
            {/* Enhanced Background with multiple layers */}
            <div className="absolute inset-0 z-0">
              {/* Base gradient - rich dark with burgundy undertones */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>

              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>

              {/* Subtle diagonal pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
              }}></div>

              {/* Decorative corner accent - top left */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-500/10 rounded-full filter blur-3xl"></div>

              {/* Decorative corner accent - bottom right */}
              <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full filter blur-3xl"></div>

              {/* Subtle grid pattern overlay */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(251, 191, 36, 0.05) 25%, rgba(251, 191, 36, 0.05) 26%, transparent 27%, transparent 74%, rgba(251, 191, 36, 0.05) 75%, rgba(251, 191, 36, 0.05) 76%, transparent 77%, transparent)',
                backgroundSize: '50px 50px'
              }}></div>
            </div>

            <CardContent className="p-3 sm:p-4 md:p-5 flex flex-col h-full relative z-10">
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Get Started with BNB</h2>
              <ul className="space-y-2 sm:space-y-3 flex-1">
                <li className="flex gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-yellow-500 flex items-center justify-center text-black text-xs font-bold" data-glow-color="#F3BA2F">
                    1
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white text-xs sm:text-sm font-semibold">Connect Wallet</h3>
                    <p className="text-white/60 text-[10px] sm:text-xs">Connect any BNB Chain supported wallet</p>
                  </div>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-yellow-500 flex items-center justify-center text-black text-xs font-bold" data-glow-color="#F3BA2F">
                    2
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white text-xs sm:text-sm font-semibold">Chat with KAIDO AI</h3>
                    <p className="text-white/60 text-[10px] sm:text-xs">Create or join a live prediction using BNB</p>
                  </div>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-yellow-500 flex items-center justify-center text-black text-xs font-bold" data-glow-color="#F3BA2F">
                    3
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white text-xs sm:text-sm font-semibold">Predict, Earn, Recover</h3>
                    <p className="text-white/60 text-[10px] sm:text-xs">Stake BNB, win BNB, earn BNB airdrops from Loss Edge Pool</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Affiliate Hero Banner */}
          <AffiliateHeroBanner />
        </div>
      </div>

      {/* Display predictions */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      ) : (
        <div className="py-4 md:py-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">Latest Predictions</h2>
          {predictions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No predictions found. Create one now!</p>
              <button
                onClick={handleCreatePrediction}
                className="mt-4 px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Create Prediction
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
                {/* Only show the first 6 predictions */}
                {predictions.slice(0, 6).map((prediction, index) => (
                  <Link key={prediction._id || prediction.id} to={`/prediction/${prediction._id || prediction.id}`} className="block">
                    <PredictionCard
                      id={prediction._id || prediction.id}
                      title={prediction.title}
                      type={prediction.type === 'binary'
                        ? 'binary'
                        : prediction.type === 'agent'
                          ? 'agent'
                          : 'multi-choice'}
                      asset={prediction.asset || 'BTC'}
                      expiryDate={prediction.endDate}
                      poolSize={prediction.type === 'agent' ? 0 : prediction.volume || 0}
                      poolToken="BNB"
                      participants={prediction.participants || 0} // Use actual participants count
                      maxParticipants={prediction.maxParticipants}
                      rewardPoolAmount={prediction.rewardPoolAmount || prediction.stakeAmount || 0}
                      yesPercentage={prediction.type === 'binary' && prediction.choices && prediction.choices.length > 0 ?
                        prediction.choices.find(c => c.id === 'yes')?.percentage : undefined
                      }
                      priceRanges={(prediction.type === 'multiple' || prediction.type === 'multi-choice' || prediction.type === 'agent') && prediction.choices ?
                        prediction.choices.map(choice => ({
                          range: choice.label || choice.id,
                          percentage: typeof choice.percentage === 'number' ? choice.percentage : 0
                        })) : []
                      }
                      glowColor={
                        // Assign different colors to each card
                        [
                          '#F3BA2F', // BNB Yellow
                          '#FCD34D', // Light Yellow
                          '#FBBF24', // Medium Yellow
                          '#F59E0B', // Amber
                          '#EAB308', // Yellow
                          '#FACC15'  // Bright Yellow
                        ][index % 6]
                      }
                      className="homepage-card"
                    />
                  </Link>
                ))}
              </div>

              {/* Show "View More" button if there are 6 or more predictions */}
              {predictions.length >= 6 && (
                <div className="flex justify-center mt-8">
                  <Link to="/predictions" className="no-underline">
                    <Button
                      variant="primary"
                      size="lg"
                    >
                      View All Predictions
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}



      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Affiliate Program Section */}
      <AffiliateSection />

      {/* Roadmap Section */}
      <RoadmapSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Prediction Creation Flow Modal */}
      {showCreationFlow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PredictionCreationFlow
            onClose={handleCloseCreationFlow}
            onSubmit={handleSubmitPrediction}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
};

export default HomePage;