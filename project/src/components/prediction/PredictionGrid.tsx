import React, { useState } from 'react';
import { Filter, TrendingUp, Clock, Tag } from 'lucide-react';
import { PredictionSummary } from '../../types';
import PredictionCard from './PredictionCard';
import Button from '../ui/Button';

interface PredictionGridProps {
  predictions: PredictionSummary[];
  title?: string;
}

const PredictionGrid: React.FC<PredictionGridProps> = ({ 
  predictions,
  title = 'Trending Predictions'
}) => {
  const [filter, setFilter] = useState<'all' | 'binary' | 'multiple'>('all');
  const [sortBy, setSortBy] = useState<'trending' | 'endingSoon' | 'volume'>('trending');
  const [showFilters, setShowFilters] = useState(false);

  const filterPredictions = () => {
    let filtered = [...predictions];
    
    if (filter !== 'all') {
      filtered = filtered.filter(prediction => prediction.type === filter);
    }
    
    switch (sortBy) {
      case 'trending':
        return filtered.sort((a, b) => b.volume - a.volume);
      case 'endingSoon':
        return filtered.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
      case 'volume':
        return filtered.sort((a, b) => b.volume - a.volume);
      default:
        return filtered;
    }
  };

  const filteredPredictions = filterPredictions();

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl text-white font-medium mb-4 sm:mb-0">{title}</h2>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="tertiary" 
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filter
          </Button>
          
          <div className="hidden md:flex space-x-2">
            <Button 
              variant={sortBy === 'trending' ? 'primary' : 'tertiary'} 
              size="sm"
              leftIcon={<TrendingUp className="h-4 w-4" />}
              onClick={() => setSortBy('trending')}
            >
              Trending
            </Button>
            <Button 
              variant={sortBy === 'endingSoon' ? 'primary' : 'tertiary'} 
              size="sm"
              leftIcon={<Clock className="h-4 w-4" />}
              onClick={() => setSortBy('endingSoon')}
            >
              Ending Soon
            </Button>
            <Button 
              variant={sortBy === 'volume' ? 'primary' : 'tertiary'} 
              size="sm"
              leftIcon={<Tag className="h-4 w-4" />}
              onClick={() => setSortBy('volume')}
            >
              Volume
            </Button>
          </div>
        </div>
      </div>
      
      {showFilters && (
        <div className="bg-slate-800 p-4 rounded-lg mb-6 flex flex-wrap gap-3">
          <Button 
            variant={filter === 'all' ? 'primary' : 'tertiary'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Predictions
          </Button>
          <Button 
            variant={filter === 'binary' ? 'primary' : 'tertiary'} 
            size="sm"
            onClick={() => setFilter('binary')}
          >
            Yes/No
          </Button>
          <Button 
            variant={filter === 'multiple' ? 'primary' : 'tertiary'} 
            size="sm"
            onClick={() => setFilter('multiple')}
          >
            Multi-Choice
          </Button>
          
          <div className="md:hidden w-full mt-3 flex space-x-2">
            <Button 
              variant={sortBy === 'trending' ? 'primary' : 'tertiary'} 
              size="sm"
              leftIcon={<TrendingUp className="h-4 w-4" />}
              onClick={() => setSortBy('trending')}
            >
              Trending
            </Button>
            <Button 
              variant={sortBy === 'endingSoon' ? 'primary' : 'tertiary'} 
              size="sm"
              leftIcon={<Clock className="h-4 w-4" />}
              onClick={() => setSortBy('endingSoon')}
            >
              Ending Soon
            </Button>
            <Button 
              variant={sortBy === 'volume' ? 'primary' : 'tertiary'} 
              size="sm"
              leftIcon={<Tag className="h-4 w-4" />}
              onClick={() => setSortBy('volume')}
            >
              Volume
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPredictions.map((prediction) => (
          <PredictionCard key={prediction.id} prediction={prediction} />
        ))}
      </div>
    </div>
  );
};

export default PredictionGrid;