import axios from 'axios';

// Sportradar API configuration
const SPORTRADAR_API_KEY = '08R8yLz0sCfu8T1732qqJZkcxWjnJiGVM3vE422r';
const SPORTRADAR_BASE_URL = 'https://api.sportradar.com/soccer/trial/v4/en';

// Rate limiting: Sportradar trial allows 1000 requests per month, 1 request per second
const API_DELAY = 1100; // 1.1 seconds between requests to be safe

let lastRequestTime = 0;

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const competitionsCache = new Map<string, { data: any; timestamp: number }>();
const matchesCache = new Map<string, { data: any; timestamp: number }>();

// Helper function to enforce rate limiting
const enforceRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < API_DELAY) {
    const waitTime = API_DELAY - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
};

// Helper function to check if cache is valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper function to get from cache
const getFromCache = <T>(cache: Map<string, { data: T; timestamp: number }>, key: string): T | null => {
  const cached = cache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    console.log(`Cache hit for key: ${key}`);
    return cached.data;
  }
  if (cached) {
    console.log(`Cache expired for key: ${key}`);
    cache.delete(key);
  }
  return null;
};

// Helper function to set cache
const setCache = <T>(cache: Map<string, { data: T; timestamp: number }>, key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`Cached data for key: ${key}`);
};

// Types for Sportradar API responses
export interface SportradarCompetition {
  id: string;
  name: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
  category: {
    id: string;
    name: string;
  };
}

export interface SportradarTeam {
  id: string;
  name: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
}

export interface SportradarMatch {
  id: string;
  scheduled: string; // ISO date string
  home?: SportradarTeam;
  away?: SportradarTeam;
  competition: {
    id: string;
    name: string;
  };
  status: 'not_started' | 'live' | 'ended' | 'postponed' | 'cancelled';
  match_status?: string;
  home_score?: number;
  away_score?: number;
}

export interface SportradarMatchResult {
  id: string;
  status: 'not_started' | 'live' | 'ended' | 'postponed' | 'cancelled';
  home_score: number;
  away_score: number;
  match_status: string;
  period_scores?: Array<{
    home_score: number;
    away_score: number;
    type: string;
  }>;
}

class SportradarService {
  /**
   * Clear all caches
   */
  clearCache(): void {
    competitionsCache.clear();
    matchesCache.clear();
    console.log('Sportradar cache cleared');
  }

  private async makeRequest<T>(endpoint: string, retryCount: number = 0): Promise<T> {
    await enforceRateLimit();

    try {
      // Ensure endpoint has .json extension
      const jsonEndpoint = endpoint.endsWith('.json') ? endpoint : `${endpoint}.json`;
      const url = `${SPORTRADAR_BASE_URL}${jsonEndpoint}?api_key=${SPORTRADAR_API_KEY}`;
      console.log(`Making Sportradar API request to: ${url} (attempt ${retryCount + 1})`);

      const response = await axios.get<T>(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KAIDO-Platform/1.0'
        }
      });

      console.log(`Sportradar API response received for: ${endpoint}`, response.status);
      return response.data;
    } catch (error) {
      console.error(`Sportradar API error for ${endpoint}:`, error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          // Rate limit exceeded - implement exponential backoff
          if (retryCount < 3) {
            const backoffDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
            console.log(`Rate limit exceeded. Retrying in ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return this.makeRequest<T>(endpoint, retryCount + 1);
          } else {
            throw new Error('Rate limit exceeded after 3 retries. Please try again later.');
          }
        } else if (error.response?.status === 401) {
          throw new Error('Invalid API key or unauthorized access.');
        } else if (error.response?.status === 404) {
          throw new Error('Resource not found.');
        }
        console.error(`HTTP ${error.response?.status}: ${error.response?.statusText}`);
        console.error('Response data:', error.response?.data);
      }

      throw new Error(`Failed to fetch data from Sportradar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available competitions/leagues
   */
  async getCompetitions(): Promise<SportradarCompetition[]> {
    try {
      // Check cache first
      const cacheKey = 'competitions';
      const cachedData = getFromCache(competitionsCache, cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Try to fetch from Sportradar API first
      const response = await this.makeRequest<{ competitions: SportradarCompetition[] }>('/competitions');
      console.log('Sportradar API response structure:', {
        hasCompetitions: !!response.competitions,
        competitionsLength: response.competitions?.length || 0,
        firstCompetition: response.competitions?.[0],
        responseKeys: Object.keys(response)
      });

      const competitions = response.competitions || [];

      // Cache the result
      setCache(competitionsCache, cacheKey, competitions);

      return competitions;
    } catch (error) {
      console.error('Error fetching competitions from Sportradar, using mock data:', error);

      // Return mock data for testing when Sportradar API is not available
      return [
        {
          id: 'sr:competition:17',
          name: 'Premier League',
          country: {
            id: 'sr:country:4',
            name: 'England',
            code: 'ENG'
          },
          category: {
            id: 'sr:category:1',
            name: 'England'
          }
        },
        {
          id: 'sr:competition:34',
          name: 'La Liga',
          country: {
            id: 'sr:country:32',
            name: 'Spain',
            code: 'ESP'
          },
          category: {
            id: 'sr:category:5',
            name: 'Spain'
          }
        },
        {
          id: 'sr:competition:23',
          name: 'Serie A',
          country: {
            id: 'sr:country:14',
            name: 'Italy',
            code: 'ITA'
          },
          category: {
            id: 'sr:category:3',
            name: 'Italy'
          }
        },
        {
          id: 'sr:competition:35',
          name: 'Bundesliga',
          country: {
            id: 'sr:country:9',
            name: 'Germany',
            code: 'GER'
          },
          category: {
            id: 'sr:category:2',
            name: 'Germany'
          }
        },
        {
          id: 'sr:competition:238',
          name: 'Ligue 1',
          country: {
            id: 'sr:country:8',
            name: 'France',
            code: 'FRA'
          },
          category: {
            id: 'sr:category:4',
            name: 'France'
          }
        }
      ];
    }
  }

  /**
   * Get upcoming matches for a specific competition
   */
  async getMatchesByCompetition(competitionId: string, days: number = 7): Promise<SportradarMatch[]> {
    try {
      console.log(`Fetching matches for competition: ${competitionId} for next ${days} days`);

      // Check cache first
      const cacheKey = `matches_${competitionId}_${days}`;
      const cachedData = getFromCache(matchesCache, cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const allMatches: SportradarMatch[] = [];
      const now = new Date();

      // Reduced from 30 days to 7 days to minimize API calls
      // Get matches for the next X days by fetching daily schedules
      for (let i = 0; i <= days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

        try {
          const response = await this.makeRequest<{ schedules: any[] }>(
            `/schedules/${dateString}/schedules`
          );

          if (response.schedules) {
            // Filter matches for the specific competition
            const competitionMatches = response.schedules
              .filter(schedule =>
                schedule.sport_event?.sport_event_context?.competition?.id === competitionId &&
                schedule.sport_event?.competitors?.length >= 2 // Ensure we have both teams
              )
              .map(schedule => {
                const homeTeam = schedule.sport_event.competitors?.find((c: any) => c.qualifier === 'home');
                const awayTeam = schedule.sport_event.competitors?.find((c: any) => c.qualifier === 'away');

                return {
                  id: schedule.sport_event.id,
                  scheduled: schedule.sport_event.start_time,
                  status: schedule.sport_event_status?.status || 'not_started',
                  home: homeTeam ? {
                    id: homeTeam.id,
                    name: homeTeam.name,
                    country: {
                      id: homeTeam.country_code || homeTeam.id,
                      name: homeTeam.country || homeTeam.name,
                      code: homeTeam.country_code || 'UNK'
                    }
                  } : undefined,
                  away: awayTeam ? {
                    id: awayTeam.id,
                    name: awayTeam.name,
                    country: {
                      id: awayTeam.country_code || awayTeam.id,
                      name: awayTeam.country || awayTeam.name,
                      code: awayTeam.country_code || 'UNK'
                    }
                  } : undefined,
                  competition: {
                    id: schedule.sport_event.sport_event_context.competition.id,
                    name: schedule.sport_event.sport_event_context.competition.name
                  }
                };
              })
              .filter(match => match.home && match.away); // Only include matches with both teams

            allMatches.push(...competitionMatches);
          }
        } catch (dayError) {
          // Continue if a specific day fails (might be no matches that day)
          console.log(`No matches found for ${dateString}:`, dayError);
        }
      }

      // Filter for upcoming matches only (not started, not ended)
      const upcomingMatches = allMatches.filter(match => {
        const matchDate = new Date(match.scheduled);
        return (
          match.status === 'not_started' &&
          matchDate > now
        );
      });

      console.log(`Found ${upcomingMatches.length} upcoming matches for competition ${competitionId}`);

      // Sort by date (soonest first)
      const sortedMatches = upcomingMatches.sort((a, b) =>
        new Date(a.scheduled).getTime() - new Date(b.scheduled).getTime()
      );

      // Cache the result
      setCache(matchesCache, cacheKey, sortedMatches);

      return sortedMatches;
    } catch (error) {
      console.error(`Error fetching matches for competition ${competitionId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific match
   */
  async getMatchDetails(matchId: string): Promise<SportradarMatch> {
    try {
      const response = await this.makeRequest<SportradarMatch>(`/matches/${matchId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching match details for ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Get match result for resolution (after match is completed)
   */
  async getMatchResult(matchId: string): Promise<SportradarMatchResult> {
    try {
      const response = await this.makeRequest<SportradarMatchResult>(`/matches/${matchId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching match result for ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a match is completed and ready for resolution
   */
  async isMatchCompleted(matchId: string): Promise<boolean> {
    try {
      const match = await this.getMatchResult(matchId);
      return match.status === 'ended';
    } catch (error) {
      console.error(`Error checking match completion for ${matchId}:`, error);
      return false;
    }
  }

  /**
   * Get popular/featured competitions (manually curated list)
   */
  getFeaturedCompetitions(): string[] {
    return [
      'sr:competition:17', // Premier League
      'sr:competition:34', // La Liga
      'sr:competition:23', // Serie A
      'sr:competition:35', // Bundesliga
      'sr:competition:34', // Ligue 1
      'sr:competition:7',  // Champions League
      'sr:competition:679' // Europa League
    ];
  }

  /**
   * Validate match for prediction creation
   */
  validateMatchForPrediction(match: SportradarMatch): { valid: boolean; reason?: string } {
    const now = new Date();
    const matchDate = new Date(match.scheduled);
    const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (!match.home || !match.away) {
      return { valid: false, reason: 'Match must have both home and away teams' };
    }

    if (match.status !== 'not_started') {
      return { valid: false, reason: 'Match has already started or ended' };
    }

    if (hoursUntilMatch < 1) {
      return { valid: false, reason: 'Match starts in less than 1 hour' };
    }

    if (hoursUntilMatch > 24 * 7) {
      return { valid: false, reason: 'Match is more than 7 days away' };
    }

    return { valid: true };
  }
}

export default new SportradarService();
