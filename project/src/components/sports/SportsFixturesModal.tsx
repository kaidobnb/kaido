import React, { useEffect, useState } from 'react';
import { X, Calendar, Trophy } from 'lucide-react';
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

interface SportsFixturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SportsFixturesModal: React.FC<SportsFixturesModalProps> = ({ isOpen, onClose }) => {
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

  // Mock data for demonstration (fallback when API is unavailable)
  const getMockMatches = (): SportsMatch[] => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    return [
      {
        id: 'mock-1',
        home: { id: '1', name: 'Manchester United' },
        away: { id: '2', name: 'Liverpool' },
        scheduled: tomorrow.toISOString(),
        status: 'scheduled',
        competition: { name: 'Premier League' },
        hasPrediction: true
      },
      {
        id: 'mock-2',
        home: { id: '3', name: 'Real Madrid' },
        away: { id: '4', name: 'Barcelona' },
        scheduled: tomorrow.toISOString(),
        status: 'scheduled',
        competition: { name: 'La Liga' },
        hasPrediction: false
      },
      {
        id: 'mock-3',
        home: { id: '5', name: 'Bayern Munich' },
        away: { id: '6', name: 'Borussia Dortmund' },
        scheduled: dayAfter.toISOString(),
        status: 'scheduled',
        competition: { name: 'Bundesliga' },
        hasPrediction: true
      },
      {
        id: 'mock-4',
        home: { id: '7', name: 'AC Milan' },
        away: { id: '8', name: 'Inter Milan' },
        scheduled: dayAfter.toISOString(),
        status: 'scheduled',
        competition: { name: 'Serie A' },
        hasPrediction: false
      },
      {
        id: 'mock-5',
        home: { id: '9', name: 'PSG' },
        away: { id: '10', name: 'Marseille' },
        scheduled: tomorrow.toISOString(),
        status: 'scheduled',
        competition: { name: 'Ligue 1' },
        hasPrediction: true
      },
      {
        id: 'mock-6',
        home: { id: '11', name: 'Chelsea' },
        away: { id: '12', name: 'Arsenal' },
        scheduled: dayAfter.toISOString(),
        status: 'scheduled',
        competition: { name: 'Premier League' },
        hasPrediction: false
      },
      {
        id: 'mock-7',
        home: { id: '13', name: 'Atletico Madrid' },
        away: { id: '14', name: 'Sevilla' },
        scheduled: tomorrow.toISOString(),
        status: 'scheduled',
        competition: { name: 'La Liga' },
        hasPrediction: true
      },
      {
        id: 'mock-8',
        home: { id: '15', name: 'Juventus' },
        away: { id: '16', name: 'Napoli' },
        scheduled: dayAfter.toISOString(),
        status: 'scheduled',
        competition: { name: 'Serie A' },
        hasPrediction: false
      },
      {
        id: 'mock-9',
        home: { id: '17', name: 'Manchester City' },
        away: { id: '18', name: 'Tottenham' },
        scheduled: tomorrow.toISOString(),
        status: 'scheduled',
        competition: { name: 'Premier League' },
        hasPrediction: true
      },
      {
        id: 'mock-10',
        home: { id: '19', name: 'RB Leipzig' },
        away: { id: '20', name: 'Bayer Leverkusen' },
        scheduled: dayAfter.toISOString(),
        status: 'scheduled',
        competition: { name: 'Bundesliga' },
        hasPrediction: false
      }
    ];
  };

  useEffect(() => {
    if (isOpen) {
      const fetchMatches = async () => {
        try {
          setIsLoading(true);
          const response = await getFeaturedSportsMatches();

          if (response && response.success && Array.isArray(response.matches) && response.matches.length > 0) {
            setMatches(response.matches);
            setError(null);
          } else {
            // Use mock data as fallback
            console.log('Using mock sports fixtures data in modal (API unavailable)');
            setMatches(getMockMatches());
            setError(null);
          }
        } catch (err) {
          console.error('Error fetching sports fixtures in modal, using mock data:', err);
          // Use mock data instead of showing error
          setMatches(getMockMatches());
          setError(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMatches();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" style={{ zIndex: 10000 }}>
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg border border-yellow-500/30 max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
          <div className="flex items-center">
            <Trophy className="h-6 w-6 text-yellow-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Upcoming Sports Fixtures</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-slate-400 text-sm">No upcoming fixtures available</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="bg-black/60 rounded-lg p-4 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors"
                >
                  {/* Competition Name with Flag */}
                  {match.competition && (
                    <div className="text-sm text-yellow-400 font-medium mb-3 truncate">
                      <span className="mr-2">{getLeagueFlag(match.competition.name)}</span>
                      {match.competition.name}
                    </div>
                  )}

                  {/* Match Details */}
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-white mb-1 truncate">
                      {match.home?.name || 'Home Team'}
                    </div>
                    <div className="text-xs text-slate-500 text-center my-1">VS</div>
                    <div className="text-sm font-semibold text-white truncate">
                      {match.away?.name || 'Away Team'}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="flex items-center text-xs text-slate-400 mb-2">
                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{formatDate(match.scheduled)}</span>
                  </div>

                  {/* Prediction Status */}
                  {match.hasPrediction && (
                    <div className="inline-block bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded border border-green-500/20">
                      ✓ Prediction Available
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-yellow-500/20 flex justify-center">
          <a
            href="/predictions"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
            onClick={onClose}
          >
            View All Predictions
          </a>
        </div>
      </div>
    </div>
  );
};

export default SportsFixturesModal;

