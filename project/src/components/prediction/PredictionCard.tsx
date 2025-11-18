import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Clock, Users, Wallet } from 'lucide-react';
import { PredictionSummary } from '../../types';
import Card, { CardContent } from '../ui/Card';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

interface PredictionCardProps {
  prediction: PredictionSummary;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatVolume = (volume: number, tokenType: string = 'SOL') => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(4)}M ${tokenType}`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(4)}K ${tokenType}`;
    }
    return `${volume.toFixed(4)} ${tokenType}`;
  };

  const getProbabilityColor = (probability: number) => {
    if (probability > 0.66) return 'text-green-400';
    if (probability > 0.33) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Use the creator's avatar if available, otherwise use default avatar
  const getCreatorAvatar = () => {
    if (prediction.createdBy && typeof prediction.createdBy === 'object' && prediction.createdBy.avatar) {
      return prediction.createdBy.avatar;
    }
    return '/images/default-avatar.png';
  };

  return (
    <Card hover className="h-full transition-all duration-300">
      <Link to={`/prediction/${prediction.id}`}>
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <Avatar
                  src={getCreatorAvatar()}
                  alt={prediction.createdBy && typeof prediction.createdBy === 'object' ? prediction.createdBy.username || 'Creator' : 'Creator'}
                  size="sm"
                  className="mr-2"
                />
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
              <div className="flex items-center text-xs text-slate-400">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDate(prediction.endDate)}</span>
              </div>
            </div>

            <h3 className="text-white font-medium mb-4 line-clamp-2">
              {prediction.title}
            </h3>

            <div className="flex justify-between mb-4">
              <div className="flex items-center">
                {prediction.type === 'agent' ? (
                  <div className="flex items-center">
                    <Wallet className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-sm text-green-300">
                      {prediction.minSolyRequired || 10} SOLY min
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-300">{formatVolume(prediction.volume, prediction.tokenType)}</span>
                )}
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 text-slate-400 mr-1" />
                <span className="text-sm text-slate-300">
                  {prediction.participants || 1}
                  {prediction.type === 'agent' && prediction.maxParticipants && (
                    <span> / {prediction.maxParticipants}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 p-4 flex justify-between items-center">
            {prediction.type === 'binary' ? (
              <>
                <div className="flex items-center">
                  {prediction.currentProbability > 0.5 ? (
                    <ArrowUp className="h-4 w-4 text-green-400 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-400 mr-1" />
                  )}
                  <span className={`font-medium ${getProbabilityColor(prediction.currentProbability)}`}>
                    {Math.round(prediction.currentProbability * 100)}% chance
                  </span>
                </div>
                {prediction.userPosition && (
                  <div className="flex items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      prediction.userPosition === 'yes'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      Your position: {prediction.userPosition.toUpperCase()}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-400">Top prediction</span>
                  <span className={`text-xs font-medium ${getProbabilityColor(prediction.currentProbability || 0.5)}`}>
                    {Math.round((prediction.currentProbability || 0.5) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full h-2"
                    style={{ width: `${(prediction.currentProbability || 0.5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default PredictionCard;