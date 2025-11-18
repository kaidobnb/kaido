import React, { useEffect, useState, useRef } from 'react';
import { Trophy, Calendar } from 'lucide-react';
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

interface SportsFixturesTickerProps {
  onOpenModal?: () => void;
}

const SportsFixturesTicker: React.FC<SportsFixturesTickerProps> = ({ onOpenModal }) => {
  const [matches, setMatches] = useState<SportsMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

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
      }
    ];
  };

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const response = await getFeaturedSportsMatches();

        if (response && response.success && Array.isArray(response.matches) && response.matches.length > 0) {
          setMatches(response.matches);
          setError(null);
        } else {
          // Use mock data as fallback
          console.log('Using mock sports fixtures data (API unavailable)');
          setMatches(getMockMatches());
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching sports fixtures, using mock data:', err);
        // Use mock data instead of showing error
        setMatches(getMockMatches());
        setError(null);
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
      return `Today ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getLeagueFlag = (leagueName: string): string => {
    return leagueFlags[leagueName] || '⚽';
  };

  const handleClick = () => {
    if (onOpenModal) {
      onOpenModal();
    }
  };

  return (
    <div className="fixed top-[32px] left-0 right-0 z-30 mb-0 hidden sm:block">
      {/* Sports Fixtures Ticker - Matches crypto ticker styling */}
      <div 
        className="bg-black/95 backdrop-blur-sm border-b border-yellow-500/30 py-1.5 cursor-pointer hover:bg-black/100 transition-colors"
        onClick={handleClick}
      >
        <div className="ticker-container" style={{ height: '24px' }}>
          {isLoading && matches.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-slate-400 text-xs">Loading sports fixtures...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-red-400 text-xs">{error}</span>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-slate-400 text-xs">No upcoming fixtures available</span>
            </div>
          ) : (
            <div
              className="ticker-content items-center space-x-6 inline-flex"
              style={{
                animationPlayState: isPaused ? 'paused' : 'running',
                animationDuration: '40s',
                minWidth: '300%'
              }}
              ref={tickerRef}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Sports Label */}
              <div className="flex items-center bg-yellow-600/20 rounded-md px-2 py-1 border border-yellow-500/30">
                <Trophy className="h-3 w-3 text-yellow-400 mr-1" />
                <span className="text-white text-xs font-medium">SPORTS</span>
              </div>

              {/* Sports Fixtures */}
              {matches.slice(0, 10).map((match, index) => (
                <div key={index} className="flex items-center space-x-1">
                  {/* League Flag */}
                  <span className="text-xs">{match.competition ? getLeagueFlag(match.competition.name) : '⚽'}</span>
                  
                  {/* Match Info */}
                  <span className="text-white text-sm font-medium">
                    {match.home?.name || 'Home'} vs {match.away?.name || 'Away'}
                  </span>
                  
                  {/* Time */}
                  <span className="flex items-center text-xs text-slate-400">
                    <Calendar className="h-3 w-3 mr-0.5" />
                    {formatDate(match.scheduled)}
                  </span>

                  {/* Prediction Badge */}
                  {match.hasPrediction && (
                    <span className="text-xs text-green-400">✓</span>
                  )}
                </div>
              ))}

              {/* Duplicate for continuous scrolling */}
              {matches.slice(0, 10).map((match, index) => (
                <div key={`dup-${index}`} className="flex items-center space-x-1">
                  {/* League Flag */}
                  <span className="text-xs">{match.competition ? getLeagueFlag(match.competition.name) : '⚽'}</span>
                  
                  {/* Match Info */}
                  <span className="text-white text-sm font-medium">
                    {match.home?.name || 'Home'} vs {match.away?.name || 'Away'}
                  </span>
                  
                  {/* Time */}
                  <span className="flex items-center text-xs text-slate-400">
                    <Calendar className="h-3 w-3 mr-0.5" />
                    {formatDate(match.scheduled)}
                  </span>

                  {/* Prediction Badge */}
                  {match.hasPrediction && (
                    <span className="text-xs text-green-400">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SportsFixturesTicker;

