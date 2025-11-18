import React, { useState, useEffect } from 'react';
import { Trophy, Check, Clock, DollarSign, TrendingUp } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Avatar from '../ui/Avatar';
import { getPredictionWinners } from '../../services/api';

interface ResolvedPredictionCardProps {
  predictionId: string;
  asset: string;
  resolvedChoice: string;
  resolvedAt?: Date;
  choices: Array<{
    id: string;
    label: string;
  }>;
}

const ResolvedPredictionCard: React.FC<ResolvedPredictionCardProps> = ({
  predictionId,
  asset,
  resolvedChoice,
  resolvedAt,
  choices
}) => {
  const [winners, setWinners] = useState<any[]>([]);
  const [assetPrice, setAssetPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get the label for the resolved choice
  const resolvedChoiceLabel = choices.find(c => c.id === resolvedChoice)?.label || resolvedChoice;

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        setIsLoading(true);
        const response = await getPredictionWinners(predictionId);
        
        if (response.success) {
          setWinners(response.winners || []);
          setAssetPrice(response.prediction?.assetPriceAtResolution || null);
        } else {
          setError('Failed to load winners');
        }
      } catch (err) {
        console.error('Error fetching winners:', err);
        setError('An error occurred while fetching winners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWinners();
  }, [predictionId]);

  return (
    <Card className="bg-slate-800 border border-slate-700 overflow-hidden">
      <CardHeader className="bg-slate-800/50 border-b border-slate-700/50 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Trophy className="h-5 w-5 text-amber-400 mr-2" />
            Prediction Resolved
          </h3>
          {resolvedAt && (
            <div className="text-sm text-slate-400 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(resolvedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-6">
          {/* Winning Answer */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Check className="h-5 w-5 text-green-400 mr-2" />
              <h4 className="text-md font-medium text-white">Winning Answer</h4>
            </div>
            <div className="text-xl font-bold text-green-400 mt-1">
              {resolvedChoiceLabel}
            </div>
          </div>
          
          {/* Asset Price */}
          {assetPrice !== null && (
            <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-400 mr-2" />
                <h4 className="text-md font-medium text-white">{asset} Price at Resolution</h4>
              </div>
              <div className="text-xl font-bold text-white mt-1">
                ${assetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
          
          {/* Top Winners */}
          <div>
            <h4 className="text-md font-medium text-white mb-3 flex items-center">
              <Trophy className="h-5 w-5 text-amber-400 mr-2" />
              Top Winners
            </h4>
            
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-slate-400">
                {error}
              </div>
            ) : winners.length > 0 ? (
              <div className="space-y-3">
                {winners.map((winner, index) => (
                  <div key={winner.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative">
                        <Avatar 
                          src={winner.user.avatar || '/images/default-avatar.png'} 
                          alt={winner.user.username} 
                          size="sm"
                        />
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-xs font-bold text-black rounded-full w-5 h-5 flex items-center justify-center">
                          {index + 1}
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-white font-medium">{winner.user.username}</div>
                        <div className="text-xs text-slate-400">
                          Bet: {winner.amount.toFixed(4)} {winner.tokenType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {winner.reward.toFixed(4)} {winner.tokenType}
                      </div>
                      <div className="text-xs text-slate-400">
                        Reward
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">
                No winners found
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResolvedPredictionCard;
