import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPredictions, getRecentVotes } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { useToast } from '../hooks/useToast';
import PredictionCard from '../components/predictions/PredictionCard';
import Button from '../components/ui/Button';
import { ArrowLeft, Filter, SortDesc } from 'lucide-react';

const AllPredictionsPage: React.FC = () => {
  const { showToast } = useToast();
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'volume' | 'participants'>('newest');
  const [filterType, setFilterType] = useState<'all' | 'binary' | 'multiple'>('all');

  // Fetch predictions with polling
  const fetchPredictions = async () => {
    try {
      // Fetch real predictions from backend
      const response = await getPredictions();

      // Check if the response has the expected structure
      if (response && response.success && Array.isArray(response.predictions)) {
        // Use the predictions array from the response
        let predictions = response.predictions || [];

        // Filter out resolved predictions
        predictions = predictions.filter(prediction =>
          prediction.status !== 'resolved' && prediction.status !== 'cancelled'
        );

        // Fetch votes for each prediction and update percentages
        const updatedPredictions = await Promise.all(
          predictions.map(async (prediction) => {
            try {
              if (prediction._id) {
                const votesResponse = await getRecentVotes(prediction._id);

                if (votesResponse && votesResponse.success && Array.isArray(votesResponse.votes)) {
                  const votes = votesResponse.votes;

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

  // Apply filters and sorting
  const filteredAndSortedPredictions = React.useMemo(() => {
    let filtered = [...predictions];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(p =>
        filterType === 'binary' ? p.type === 'binary' : p.type !== 'binary'
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'volume':
        filtered.sort((a, b) => (b.volume || 0) - (a.volume || 0));
        break;
      case 'participants':
        filtered.sort((a, b) => (b.participants || 0) - (a.participants || 0));
        break;
    }

    return filtered;
  }, [predictions, filterType, sortBy]);

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="flex items-center mb-8 mt-4">
        <Link to="/" className="mr-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Prediction Markets</h1>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-slate-900/50 rounded-lg p-4 mb-8 border border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-black/50 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 hover:border-[#F3BA2F]/50 focus:border-[#F3BA2F] focus:outline-none transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="volume">Highest Volume</option>
              <option value="participants">Most Participants</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Prediction Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-black/50 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 hover:border-[#F3BA2F]/50 focus:border-[#F3BA2F] focus:outline-none transition-colors"
            >
              <option value="all">All Types</option>
              <option value="binary">Binary (Yes/No)</option>
              <option value="multiple">Multi-Choice</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto sm:ml-auto"
              onClick={() => {
                setSortBy('newest');
                setFilterType('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Display predictions */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="py-4">
          {filteredAndSortedPredictions.length === 0 ? (
            <div className="text-center py-10 bg-slate-800/30 rounded-lg">
              <p className="text-slate-400">No predictions found matching your filters.</p>
              {filterType !== 'all' && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilterType('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-slate-400 mb-6">Showing {filteredAndSortedPredictions.length} predictions</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedPredictions.map((prediction) => (
                  <div key={prediction._id || prediction.id} onClick={() => window.location.href = `/prediction/${prediction._id || prediction.id}`}>
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
                      poolSize={prediction.volume || 0}
                      poolToken={prediction.tokenType as 'SOL' | 'SOLY'}
                      participants={prediction.participants || 0}
                      minSolyRequired={prediction.minSolyRequired}
                      maxParticipants={prediction.maxParticipants}
                      yesPercentage={prediction.type === 'binary' && prediction.choices ?
                        prediction.choices.find(c => c.id === 'yes')?.percentage || 50 : 50
                      }
                      priceRanges={prediction.type === 'multiple' && prediction.choices ?
                        prediction.choices.map(choice => ({
                          range: choice.label,
                          percentage: choice.percentage
                        })) : []
                      }
                      glowColor={prediction.type === 'binary' ? '#F3BA2F' : '#FCD34D'}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AllPredictionsPage;
