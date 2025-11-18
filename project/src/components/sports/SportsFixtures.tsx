import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { getFeaturedSportsMatches } from '../../services/api';

interface Team {
  id: string;
  name: string;
  country?: {
    name: string;
    code: string;
  };
}

interface SportsMatch {
  id: string;
  home: Team;
  away: Team;
  scheduled: string;
  status: string;
  competition?: {
    name: string;
  };
  hasPrediction?: boolean;
}

const SportsFixtures: React.FC = () => {
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // League to country flag mapping
  const leagueFlags: { [key: string]: string } = {
    'Premier League': '🇬🇧',
    'La Liga': '🇪🇸',
    'Serie A': '🇮🇹',
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷',
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const response = await getFeaturedSportsMatches();

        if (response && response.success && Array.isArray(response.matches)) {
          setMatches(response.matches);
        } else {
          setError('Failed to load sports fixtures');
        }
      } catch (err) {
        console.error('Error fetching sports fixtures:', err);
        setError('Failed to load sports fixtures');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();

    // Refresh every 5 minutes
    const interval = setInterval(fetchMatches, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getLeagueFlag = (leagueName: string): string => {
    return leagueFlags[leagueName] || '⚽';
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 border border-yellow-500/20">
        <div className="flex items-center justify-center h-32">
          <span className="text-slate-400 text-sm">Loading sports fixtures...</span>
        </div>
      </div>
    );
  }

  if (error || matches.length === 0) {
    return (
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 border border-yellow-500/20">
        <div className="flex items-center justify-center h-32">
          <span className="text-slate-400 text-sm">{error || 'No upcoming fixtures available'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/10">
      <div className="flex items-center mb-3">
        <Trophy className="h-4 w-4 text-yellow-400 mr-2" />
        <h2 className="text-lg font-bold text-white">Upcoming Sports Fixtures</h2>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <div className="flex gap-2 min-w-min">
          {matches.slice(0, 8).map((match) => (
            <div
              key={match.id}
              className="flex-shrink-0 w-56 bg-black/60 rounded-lg p-2.5 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors"
            >
              {/* Competition Name with Flag */}
              {match.competition && (
                <div className="text-xs text-yellow-400 font-medium mb-1.5 truncate">
                  <span className="mr-1">{getLeagueFlag(match.competition.name)}</span>
                  {match.competition.name}
                </div>
              )}

              {/* Match Details - Compact */}
              <div className="mb-1.5">
                <div className="text-xs font-semibold text-white truncate">
                  {match.home?.name || 'Home Team'}
                </div>
                <div className="text-xs text-slate-500 text-center my-0.5">VS</div>
                <div className="text-xs font-semibold text-white truncate">
                  {match.away?.name || 'Away Team'}
                </div>
              </div>

              {/* Date and Time */}
              <div className="flex items-center text-xs text-slate-400 mb-1.5">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate text-xs">{formatDate(match.scheduled)}</span>
              </div>

              {/* Prediction Status */}
              {match.hasPrediction && (
                <div className="inline-block bg-green-500/10 text-green-400 text-xs px-1.5 py-0.5 rounded border border-green-500/20">
                  ✓ Prediction
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-center">
        <a
          href="/predictions"
          className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-1.5 px-4 rounded-lg transition-colors text-xs"
        >
          View All
        </a>
      </div>
    </div>
  );
};

export default SportsFixtures;

