import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PredictionCard from './PredictionCard';
import { getPredictions } from '../../services/api';

// Fallback mock data in case API fails
const mockPredictions = [
  {
    id: '1',
    title: 'Will BTC reach $100k by end of May?',
    type: 'binary' as const,
    asset: 'BTC',
    expiryDate: '2025-05-31',
    poolSize: 250,
    poolToken: 'SOL' as const,
    participants: 124,
    yesPercentage: 75,
  },
  {
    id: '2',
    title: 'ETH price ranges for April 30th',
    type: 'multi-choice' as const,
    asset: 'ETH',
    expiryDate: '2025-04-30',
    poolSize: 180,
    poolToken: 'SOL' as const,
    participants: 87,
    priceRanges: [
      { range: '$4,000-$5,000', percentage: 15 },
      { range: '$5,000-$6,000', percentage: 30 },
      { range: '$6,000-$7,000', percentage: 45 },
      { range: 'Above $7,000', percentage: 10 },
    ],
  },
  {
    id: '3',
    title: 'Will Solana reach $300 before April 15th?',
    type: 'binary' as const,
    asset: 'SOL',
    expiryDate: '2025-04-15',
    poolSize: 120,
    poolToken: 'SOL' as const,
    participants: 56,
    yesPercentage: 62,
  },
  {
    id: '4',
    title: 'BTC price after Bitcoin halving',
    type: 'multi-choice' as const,
    asset: 'BTC',
    expiryDate: '2025-06-30',
    poolSize: 350,
    poolToken: 'SOL' as const,
    participants: 203,
    priceRanges: [
      { range: '$80k-$90k', percentage: 20 },
      { range: '$90k-$100k', percentage: 35 },
      { range: '$100k-$110k', percentage: 30 },
      { range: 'Above $110k', percentage: 15 },
    ],
  },
  {
    id: '5',
    title: 'Will ETH flip BTC in market cap in 2025?',
    type: 'binary' as const,
    asset: 'ETH',
    expiryDate: '2025-12-31',
    poolSize: 500,
    poolToken: 'SOLY' as const,
    participants: 312,
    yesPercentage: 28,
  },
  {
    id: '6',
    title: 'SOL price ranges by end of Q2',
    type: 'multi-choice' as const,
    asset: 'SOL',
    expiryDate: '2025-06-30',
    poolSize: 200,
    poolToken: 'SOLY' as const,
    participants: 98,
    priceRanges: [
      { range: '$200-$250', percentage: 15 },
      { range: '$250-$300', percentage: 40 },
      { range: '$300-$350', percentage: 35 },
      { range: 'Above $350', percentage: 10 },
    ],
  },
];

interface PredictionsGridProps {
  onPredictionClick?: (id: string) => void;
}

// Helper function to map API prediction to our component format
const mapApiPrediction = (prediction: any) => {
  return {
    id: prediction._id,
    title: prediction.title,
    type: prediction.type === 'binary'
      ? 'binary'
      : prediction.type === 'agent'
        ? 'agent'
        : 'multi-choice',
    asset: prediction.asset,
    expiryDate: prediction.endDate,
    poolSize: prediction.type === 'agent' ? 0 : prediction.volume,
    poolToken: prediction.tokenType,
    participants: prediction.participants,
    minSolyRequired: prediction.minSolyRequired,
    maxParticipants: prediction.maxParticipants,
    rewardPoolAmount: prediction.rewardPoolAmount,
    yesPercentage: prediction.type === 'binary' && prediction.choices
      ? prediction.choices.find((c: any) => c.id === 'yes')?.percentage || 50
      : undefined,
    priceRanges: (prediction.type === 'multiple' || prediction.type === 'agent') && prediction.choices
      ? prediction.choices.map((c: any) => ({
          range: c.label,
          percentage: c.percentage
        }))
      : undefined
  };
};

const PredictionsGrid: React.FC<PredictionsGridProps> = ({ onPredictionClick }) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const response = await getPredictions();

        if (response.success) {
          setPredictions(response.predictions);
        } else {
          console.error('Failed to fetch predictions:', response.message);
          setError('Failed to load predictions');
          // Fall back to mock data
          setPredictions(mockPredictions);
        }
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError('Error loading predictions');
        // Fall back to mock data
        setPredictions(mockPredictions);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  // Define glow colors
  const trendingColors = [
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Cyan
  ];

  const popularColors = [
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#84cc16', // Lime
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#d946ef'  // Fuchsia
  ];

  // Get trending predictions (sort by volume)
  const trendingPredictions = [...predictions]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 3);

  // Get popular predictions (sort by participants)
  const popularPredictions = [...predictions]
    .sort((a, b) => b.participants - a.participants)
    .filter(p => !trendingPredictions.some(tp => tp._id === p._id))
    .slice(0, 3);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Prediction Markets</h2>
        <Link to="/predictions" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          View All →
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-100">{error}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Top row - trending predictions */}
          <div>
            <h3 className="text-lg font-medium text-slate-300 mb-4">Trending Markets</h3>
            {trendingPredictions.length === 0 ? (
              <div className="bg-black/50 rounded-lg p-8 text-center border border-yellow-500/30">
                <p className="text-white">No predictions available yet. Create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {trendingPredictions.map((prediction, index) => {
                  const mappedPrediction = mapApiPrediction(prediction);
                  const glowColor = trendingColors[index % trendingColors.length];

                  return (
                    <div
                      key={mappedPrediction.id}
                      className="h-full flex"
                      style={{
                        aspectRatio: '4/3',
                        minWidth: 0
                      }}
                    >
                      <Link
                        to={`/prediction/${mappedPrediction.id}`}
                        className="block w-full h-full"
                        onClick={() => onPredictionClick && onPredictionClick(mappedPrediction.id)}
                      >
                        <PredictionCard
                          {...mappedPrediction}
                          glowColor={glowColor}
                        />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subtle divider between rows */}
          {(trendingPredictions.length > 0 && popularPredictions.length > 0) && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
            </div>
          )}

          {/* Bottom row - popular predictions */}
          {popularPredictions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-slate-300 mb-4">Popular Markets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {popularPredictions.map((prediction, index) => {
                  const mappedPrediction = mapApiPrediction(prediction);
                  const glowColor = popularColors[index % popularColors.length];

                  return (
                    <div
                      key={mappedPrediction.id}
                      className="h-full flex"
                      style={{
                        aspectRatio: '4/3',
                        minWidth: 0
                      }}
                    >
                      <Link
                        to={`/prediction/${mappedPrediction.id}`}
                        className="block w-full h-full"
                        onClick={() => onPredictionClick && onPredictionClick(mappedPrediction.id)}
                      >
                        <PredictionCard
                          {...mappedPrediction}
                          glowColor={glowColor}
                        />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionsGrid;
