import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PredictionDetail from '../components/prediction/PredictionDetail';
import { getPredictionById, getRecentVotes } from '../services/api';
import { useToast } from '../hooks/useToast';
import { usePolling } from '../hooks/usePolling';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { Info, Clock, Award, Share2 } from 'lucide-react';
import { getUpdatedPercentages, updatePredictionChoices } from '../utils/predictionUtils';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

const PredictionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loadingTime, setLoadingTime] = useState(0);

  // Check if we should include resolved predictions
  const queryParams = new URLSearchParams(location.search);
  const includeResolved = queryParams.get('includeResolved') === 'true';

  // Check for referral code in URL - but don't show toast (handled by global component)
  useEffect(() => {
    // Import dynamically to avoid circular dependencies
    import('../utils/referralUtils').then(({ extractReferralCodeFromUrl, storeReferralCode }) => {
      // Extract and store the code, but don't trigger toast notifications
      const refCode = extractReferralCodeFromUrl();
      if (refCode) {
        storeReferralCode(refCode);
        console.log('Stored referral code from legacy prediction page URL:', refCode);
      }
    });
  }, [location.search]); // Re-run when URL query parameters change

  // Function to fetch prediction data
  const fetchPrediction = async () => {
    if (!id) {
      console.error('No prediction ID provided');
      setError('Invalid prediction ID');
      return null;
    }

    try {
      console.log('Fetching prediction with ID:', id, includeResolved ? '(including resolved)' : '');
      console.log('API URL being used:', process.env.REACT_APP_API_URL || 'default from api.ts');

      // Add timestamp to avoid caching issues
      const timestamp = new Date().getTime();
      console.log(`Request timestamp: ${timestamp}`);

      const response = await getPredictionById(id, includeResolved);
      console.log('Raw API response:', JSON.stringify(response));

      if (response && response.success && response.prediction) {
        // Validate prediction data structure
        if (!response.prediction._id) {
          console.error('Prediction missing _id field:', response.prediction);
          setError('Invalid prediction data received from server');
          return null;
        }

        if (!response.prediction.creator) {
          console.warn('Prediction missing creator field:', response.prediction);
          // We'll continue anyway but log the warning
        }

        console.log('Successfully fetched prediction:', response.prediction);
        return response.prediction;
      } else {
        console.error('Failed to load prediction details:', response);

        // Check for network errors
        if (response && response.networkError) {
          console.error('Network error detected:', response.message);
          setError(`Network error: ${response.message}`);
          showToast({
            type: 'error',
            title: 'Network Error',
            message: 'Could not connect to the server. Please check your connection.'
          });
          return null;
        }

        // Check for specific error messages
        if (response && response.message) {
          if (response.message === 'Invalid prediction ID format') {
            setError('Invalid prediction ID format. The prediction ID is not valid.');
            showToast({
              type: 'error',
              title: 'Invalid ID',
              message: 'The prediction ID format is invalid'
            });
          } else {
            setError(response.message || 'Failed to load prediction details');
            showToast({
              type: 'error',
              title: 'Error',
              message: response.message || 'Failed to load prediction details'
            });
          }
        } else {
          setError('Failed to load prediction details');
          showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to load prediction details'
          });
        }
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

  // Function to fetch resolved prediction data
  const fetchResolvedPrediction = async () => {
    if (!id) {
      return null;
    }

    try {
      console.log('Attempting to fetch resolved prediction with ID:', id);
      // Always include resolved predictions in this call
      const response = await getPredictionById(id, true);

      if (response && response.success && response.prediction) {
        console.log('Found resolved prediction:', response.prediction);
        return response.prediction;
      }
    } catch (err) {
      console.error('Error fetching resolved prediction:', err);
    }
    return null;
  };

  // Use polling to fetch prediction data every 15 seconds
  const [prediction, isLoading, fetchError, refetchPrediction] = usePolling(
    fetchPrediction,
    null,
    15000, // 15 seconds
    true
  );

  // Use a separate polling hook for resolved predictions
  // This will only be used if the regular fetch fails with "Prediction not found"
  const [resolvedPrediction, isLoadingResolved, fetchErrorResolved] = usePolling(
    fetchResolvedPrediction,
    null,
    0, // Don't poll, just fetch once
    false
  );

  // Effect to handle automatic fetching of resolved predictions when needed
  useEffect(() => {
    // If we get a "Prediction not found" error and we're not already including resolved predictions,
    // update the URL to include the parameter
    if ((error && error.includes('Prediction not found') ||
        (fetchError && fetchError?.message && fetchError.message.includes('Prediction not found'))) &&
        !includeResolved && id) {
      navigate(`/prediction/${id}?includeResolved=true`, { replace: true });
    }
  }, [error, fetchError, includeResolved, id, navigate]);

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
              className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // Check if we have a resolved prediction
  if (resolvedPrediction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary>
          {/* Use the simplified version for resolved predictions too */}
          <SimplePredictionDetail />
        </ErrorBoundary>
      </div>
    );
  }

  // Show loading indicator for resolved prediction
  if (isLoadingResolved && !resolvedPrediction) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if ((error || fetchError) && !prediction) {
    // Determine the appropriate error title and message
    let errorTitle = "Prediction Not Found";
    let errorMessage = error || fetchError?.message || 'The prediction you are looking for does not exist.';

    // Check if it's an invalid ID format error
    if (error && error.includes('Invalid prediction ID format')) {
      errorTitle = "Invalid Prediction ID";
      errorMessage = "The prediction ID format is invalid. Please check the URL and try again.";
    }

    // Check if the prediction is resolved but we're not including resolved predictions
    const isResolved =
      (fetchError && fetchError.isResolved) ||
      (error && error.includes('Prediction is resolved or cancelled'));

    if (isResolved && !includeResolved) {
      // Redirect to the same page with includeResolved=true
      navigate(`/prediction/${id}?includeResolved=true`, { replace: true });
      return (
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[60vh] flex flex-col justify-center">
        <div className="max-w-md mx-auto relative overflow-hidden rounded-xl p-8 border border-yellow-500/30 backdrop-blur-sm">
          {/* Enhanced Background with multiple layers - matching hero section */}
          <div className="absolute inset-0 z-0">
            {/* Base gradient - rich dark with burgundy undertones */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>

            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>

            {/* Subtle diagonal pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
            }}></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4">{errorTitle}</h2>
            <p className="text-slate-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => navigate('/')}
              className="mx-auto px-6 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Log the prediction data to help debug
  console.log('Rendering prediction detail with data:', prediction);

  // Check if prediction is valid
  if (!prediction || !prediction._id) {
    console.error('Invalid prediction data:', prediction);
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[60vh] flex flex-col justify-center">
        <div className="max-w-md mx-auto relative overflow-hidden rounded-xl p-8 border border-yellow-500/30 backdrop-blur-sm">
          {/* Enhanced Background with multiple layers - matching hero section */}
          <div className="absolute inset-0 z-0">
            {/* Base gradient - rich dark with burgundy undertones */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>

            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>

            {/* Subtle diagonal pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
            }}></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Prediction</h2>
            <p className="text-slate-400 mb-6">There was an issue loading the prediction details. Please try again.</p>
            <button
              onClick={() => refetchPrediction()}
              className="mx-auto px-6 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  // Create a simplified version of the prediction detail that doesn't use the problematic chart
  const SimplePredictionDetail = () => {
    const [yesVotes, setYesVotes] = useState<number>(0);
    const [noVotes, setNoVotes] = useState<number>(0);
    const [yesAmount, setYesAmount] = useState<number>(0);
    const [noAmount, setNoAmount] = useState<number>(0);
    const [isLoadingVotes, setIsLoadingVotes] = useState<boolean>(false);
    const [lastVoteTimestamp, setLastVoteTimestamp] = useState<number>(0);

    // Function to update vote counts and amounts
    const updateVoteCounts = async () => {
      if (!id) return;

      try {
        setIsLoadingVotes(true);
        const response = await getRecentVotes(id);

        if (response && response.success && Array.isArray(response.votes)) {
          // Count yes/no votes and amounts
          let yesCount = 0;
          let noCount = 0;
          let yesStakeAmount = 0;
          let noStakeAmount = 0;

          response.votes.forEach(vote => {
            const amount = parseFloat(vote.amount) || 0;

            if (vote.position === 'yes') {
              yesCount++;
              yesStakeAmount += amount;
            } else if (vote.position === 'no') {
              noCount++;
              noStakeAmount += amount;
            }
          });

          // Update vote counts and amounts
          setYesVotes(yesCount);
          setNoVotes(noCount);
          setYesAmount(yesStakeAmount);
          setNoAmount(noStakeAmount);
          setLastVoteTimestamp(Date.now());

          console.log(`Found ${response.votes.length} votes: Yes=${yesCount} (${yesStakeAmount}), No=${noCount} (${noStakeAmount})`);

          // Try to update the prediction choices in the database
          if (response.votes.length > 0) {
            try {
              console.log('Attempting to update prediction choices in the database...');
              const updated = await updatePredictionChoices(id);
              console.log('Prediction choices update result:', updated);
            } catch (updateError) {
              console.error('Error updating prediction choices:', updateError);
            }
          }
        } else {
          console.log('No votes found or invalid response format');
        }
      } catch (error) {
        console.error('Error fetching votes:', error);
      } finally {
        setIsLoadingVotes(false);
      }
    };

    // Make updateVoteCounts available globally for immediate updates after voting
    useEffect(() => {
      if (window) {
        (window as any).updatePredictionVotes = updateVoteCounts;
      }
      return () => {
        if (window) {
          delete (window as any).updatePredictionVotes;
        }
      };
    }, []);

    // Fetch votes for the prediction
    useEffect(() => {
      updateVoteCounts();

      // Set up polling to refresh votes every 10 seconds
      const intervalId = setInterval(updateVoteCounts, 10000);

      return () => clearInterval(intervalId);
    }, [id, lastVoteTimestamp]);

    // Calculate percentages based on actual vote amounts (not just counts)
    const calculatePercentages = async () => {
      // First try to get updated percentages from our utility function
      try {
        if (id) {
          const manualPercentages = await getUpdatedPercentages(id);
          if (manualPercentages.yesPercentage !== 50 || yesAmount > 0 || noAmount > 0) {
            console.log('Using manually calculated percentages:', manualPercentages);
            return manualPercentages;
          }
        }
      } catch (error) {
        console.error('Error getting manual percentages:', error);
      }

      // Fall back to local calculation if manual calculation fails

      // First try to calculate based on stake amounts
      const totalAmount = yesAmount + noAmount;
      if (totalAmount > 0) {
        const yesPercentage = Math.round((yesAmount / totalAmount) * 100);
        const noPercentage = 100 - yesPercentage;

        // Log the calculation for debugging
        console.log(`Calculating percentages based on amounts: Yes=${yesAmount}, No=${noAmount}, Total=${totalAmount}`);
        console.log(`Calculated percentages: Yes=${yesPercentage}%, No=${noPercentage}%`);

        return { yesPercentage, noPercentage };
      }

      // Fallback to vote counts if no amounts
      const totalVotes = yesVotes + noVotes;
      if (totalVotes > 0) {
        const yesPercentage = Math.round((yesVotes / totalVotes) * 100);
        const noPercentage = 100 - yesPercentage;

        console.log(`Calculating percentages based on counts: Yes=${yesVotes}, No=${noVotes}, Total=${totalVotes}`);
        console.log(`Calculated percentages: Yes=${yesPercentage}%, No=${noPercentage}%`);

        return { yesPercentage, noPercentage };
      }

      // If no votes or amounts, default to 50/50
      console.log('No votes or amounts found, defaulting to 50/50');
      return { yesPercentage: 50, noPercentage: 50 };
    };

    if (!prediction) return null;

    // Use state to store the calculated percentages
    const [percentages, setPercentages] = useState({ yesPercentage: 50, noPercentage: 50 });

    // Update percentages when votes change
    useEffect(() => {
      const updatePercentages = async () => {
        const newPercentages = await calculatePercentages();
        setPercentages(newPercentages);
      };

      updatePercentages();
    }, [yesVotes, noVotes, yesAmount, noAmount, id]);

    const { yesPercentage, noPercentage } = percentages;

    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-xl p-8 border border-yellow-500/30 backdrop-blur-sm mt-4">
          {/* Enhanced Background with multiple layers - matching hero section */}
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

          <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2">
              <Badge variant={prediction.status === 'active' ? 'success' : prediction.status === 'resolved' ? 'primary' : 'secondary'}>
                {prediction.status === 'active' ? 'Active' : prediction.status === 'resolved' ? 'Resolved' : 'Closed'}
              </Badge>
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
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-400">
                {calculateTimeRemaining(prediction.endDate)}
              </span>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">{prediction.title || 'Untitled Prediction'}</h1>
          <p className="text-slate-400 mb-8">{prediction.description || 'No description provided'}</p>

          {/* Yes/No Percentage Bars or Agent Progress */}
          <div className="mb-8">
            {prediction.type === 'agent' ? (
              <>
                <h3 className="text-white font-medium mb-3">Participation Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 w-full">
                      <span className="font-medium text-green-400">Participants</span>
                      <div className="bg-slate-700 h-3 flex-grow rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-green-500"
                          style={{ width: `${prediction.maxParticipants ?
                            (prediction.participants / prediction.maxParticipants) * 100 :
                            Math.min(prediction.participants * 10, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-green-400">
                        {prediction.participants} {prediction.maxParticipants ?
                          `/ ${prediction.maxParticipants} (${Math.round((prediction.participants / prediction.maxParticipants) * 100)}%)` :
                          'participants'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-2">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-yellow-400 font-medium">
                        {prediction.rewardPoolAmount || 0} {prediction.tokenType} Reward Pool
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">
                      This is an agent prediction. Users can participate without committing funds if they hold at least {prediction.minKaidoRequired || 10} KAIDO tokens.
                      Winners will share the reward pool based on their correct predictions.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-white font-medium mb-3">Current Votes</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${yesPercentage >= noPercentage ? 'text-green-400' : 'text-white'}`}>Yes</span>
                      <div className="bg-slate-700 h-2 w-32 md:w-48 lg:w-64 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            yesPercentage >= noPercentage ? 'bg-green-500' : 'bg-green-500/50'
                          }`}
                          style={{ width: `${yesPercentage}%` }}
                        ></div>
                      </div>
                      <span className={`${yesPercentage >= noPercentage ? 'text-green-400' : 'text-white'}`}>
                        {yesVotes} votes / {yesAmount.toFixed(4)} {prediction.tokenType} ({yesPercentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${noPercentage > yesPercentage ? 'text-red-400' : 'text-white'}`}>No</span>
                      <div className="bg-slate-700 h-2 w-32 md:w-48 lg:w-64 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            noPercentage > yesPercentage ? 'bg-red-500' : 'bg-red-500/50'
                          }`}
                          style={{ width: `${noPercentage}%` }}
                        ></div>
                      </div>
                      <span className={`${noPercentage > yesPercentage ? 'text-red-400' : 'text-white'}`}>
                        {noVotes} votes / {noAmount.toFixed(4)} {prediction.tokenType} ({noPercentage}%)
                      </span>
                    </div>
                  </div>

                  {isLoadingVotes && (
                    <div className="mt-2 text-xs text-slate-400 flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-500 mr-2"></div>
                      Updating vote counts...
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-black/40 rounded-lg p-5 border border-yellow-500/20 backdrop-blur-sm">
              <h3 className="text-white font-medium mb-3">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Asset:</span>
                  <span className="text-white">{prediction.asset || 'N/A'}</span>
                </div>
                {prediction.type === 'binary' && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Price:</span>
                    <span className="text-white">${prediction.targetPrice?.toLocaleString() || 'N/A'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">End Date:</span>
                  <span className="text-white font-medium">{formatDate(prediction.endDate)}</span>
                </div>
                {prediction.type === 'agent' && prediction.minKaidoRequired > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min KAIDO Required:</span>
                    <span className="text-white">{prediction.minKaidoRequired} KAIDO</span>
                  </div>
                )}
                {prediction.type === 'agent' && prediction.maxParticipants > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Participants:</span>
                    <span className="text-white">{prediction.participants} / {prediction.maxParticipants}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume:</span>
                  <span className="text-white">{prediction.volume?.toLocaleString() || '0'} {prediction.tokenType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Creator Stake:</span>
                  <span className="text-white">{prediction.stakeAmount?.toLocaleString() || '0'} {prediction.tokenType}</span>
                </div>
              </div>
            </div>

            <div className="bg-black/40 rounded-lg p-5 border border-yellow-500/20 backdrop-blur-sm">
              <h3 className="text-white font-medium mb-3">Choices</h3>
              <div className="space-y-3">
                {prediction.choices?.map((choice: any) => (
                  <div key={choice.id} className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{choice.label}</div>
                      <div className="text-slate-400 text-sm mt-1">Current price: {choice.price?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="text-white text-lg font-bold">
                      {choice.id === 'yes' ? yesPercentage : choice.id === 'no' ? noPercentage : choice.percentage?.toFixed(0) || '0'}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution Details with enhanced date visibility */}
          {prediction.resolveDetails && (
            <div className="bg-black/30 rounded-lg p-5 mb-8 border border-yellow-500/20 backdrop-blur-sm">
              <h3 className="text-white font-medium mb-3 flex items-center">
                <Clock className="h-5 w-5 text-yellow-400 mr-2" />
                Resolution Details
              </h3>
              <p className="text-slate-300 text-sm mb-3">{prediction.resolveDetails}</p>

              {/* Enhanced date and timer display */}
              <div className="bg-black/50 rounded-lg p-3 border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                <div className="text-center">
                  <span className="text-yellow-300 font-medium">
                    This prediction will be resolved on {formatDate(prediction.endDate)} at {new Date(prediction.endDate).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Creator section moved below resolution details */}
          <div className="bg-black/40 rounded-lg p-5 mb-8 border border-yellow-500/20 backdrop-blur-sm">
            <h3 className="text-white font-medium mb-3">Created by</h3>
            <div className="flex items-center">
              <Avatar
                src={prediction.creator?.avatar || '/images/default-avatar.png'}
                alt={prediction.creator?.username || 'Anonymous'}
                size="md"
                className="mr-3"
              />
              <div>
                <div className="text-white font-medium">
                  {prediction.creator?.username === 'admin' || prediction.creator?.username === 'admin_predictor'
                    ? 'KAIDO Agent'
                    : prediction.creator?.username || 'Anonymous'}
                </div>
                <div className="text-slate-400 text-sm">Created on {formatDate(prediction.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Share button */}
          <div className="bg-black/40 rounded-lg p-5 mb-8 border border-yellow-500/20 backdrop-blur-sm flex items-center justify-center">
            <button
              onClick={() => {
                // Copy current URL to clipboard
                navigator.clipboard.writeText(window.location.href);
                showToast({
                  type: 'success',
                  title: 'Link Copied',
                  message: 'Prediction link copied to clipboard'
                });
              }}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-black rounded-lg transition-colors flex items-center"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </button>
          </div>

          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 md:py-12 mt-2 sm:mt-4">
      <ErrorBoundary
        fallback={
          <div className="relative overflow-hidden rounded-xl p-8 border border-yellow-500/30 backdrop-blur-sm max-w-4xl mx-auto mt-4">
            {/* Enhanced Background with multiple layers - matching hero section */}
            <div className="absolute inset-0 z-0">
              {/* Base gradient - rich dark with burgundy undertones */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/30 to-slate-900"></div>

              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-orange-950/20"></div>

              {/* Subtle diagonal pattern */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 20px)'
              }}></div>
            </div>

            <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Prediction</h2>
            <p className="text-slate-400 mb-6">
              There was an error loading the prediction details. This might be due to:
            </p>
            <ul className="list-disc list-inside text-slate-400 mb-6 space-y-2">
              <li>The prediction data is temporarily unavailable</li>
              <li>There was an error rendering the prediction chart</li>
              <li>The prediction may have been deleted or removed</li>
            </ul>
            <div className="flex space-x-4">
              <button
                onClick={() => refetchPrediction()}
                className="px-6 py-2 bg-yellow-600 text-black rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Back to Home
              </button>
            </div>
            </div>
          </div>
        }
      >
        {/* Use the simplified version instead of the full component */}
        <SimplePredictionDetail />
      </ErrorBoundary>
    </div>
  );
};

export default PredictionPage;