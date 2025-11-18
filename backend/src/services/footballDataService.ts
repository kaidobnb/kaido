import axios from 'axios';

// Football-Data.org API configuration
const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '3d137705a49b4e4598dd82f5e929d1bb';
const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

// Rate limiting: Football-Data.org allows 10 requests per minute
const API_DELAY = 6100; // 6.1 seconds between requests to be safe (10 requests per minute)

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
    console.log(`Football-Data cache hit for key: ${key}`);
    return cached.data;
  }
  if (cached) {
    console.log(`Football-Data cache expired for key: ${key}`);
    cache.delete(key);
  }
  return null;
};

// Helper function to set cache
const setCache = <T>(cache: Map<string, { data: T; timestamp: number }>, key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`Football-Data cached data for key: ${key}`);
};

// Types for Football-Data.org API responses
export interface FootballDataCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem?: string;
  area: {
    id: number;
    name: string;
    code: string;
    flag?: string;
  };
  currentSeason?: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday?: number;
  };
}

export interface FootballDataTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED';
  matchday?: number;
  stage?: string;
  group?: string;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score: {
    winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW';
    duration: string;
    fullTime: {
      home?: number;
      away?: number;
    };
    halfTime: {
      home?: number;
      away?: number;
    };
  };
  competition: {
    id: number;
    name: string;
    code: string;
    type: string;
    emblem?: string;
  };
}

// Mapping functions to convert Football-Data.org format to our standard format
const mapCompetition = (comp: FootballDataCompetition): any => ({
  id: `fd:competition:${comp.id}`,
  name: comp.name,
  country: {
    id: `fd:country:${comp.area.id}`,
    name: comp.area.name,
    code: comp.area.code
  },
  category: {
    id: `fd:category:${comp.area.id}`,
    name: comp.area.name
  }
});

const mapTeam = (team: FootballDataTeam | null | undefined): any => {
  if (!team || !team.id) {
    return null;
  }

  return {
    id: `fd:team:${team.id}`,
    name: team.name || 'Unknown Team',
    country: {
      id: `fd:country:unknown`,
      name: 'Unknown',
      code: 'UNK'
    }
  };
};

const mapMatch = (match: FootballDataMatch): any => {
  return {
    id: `fd:match:${match.id}`,
    scheduled: match.utcDate,
    home: match.homeTeam ? mapTeam(match.homeTeam) : null,
    away: match.awayTeam ? mapTeam(match.awayTeam) : null,
  competition: {
    id: `fd:competition:${match.competition.id}`,
    name: match.competition.name
  },
  status: mapStatus(match.status),
    match_status: match.status,
    home_score: match.score.fullTime.home,
    away_score: match.score.fullTime.away
  };
};

const mapStatus = (status: string): string => {
  switch (status) {
    case 'SCHEDULED': return 'not_started';
    case 'LIVE':
    case 'IN_PLAY': return 'live';
    case 'FINISHED': return 'ended';
    case 'POSTPONED': return 'postponed';
    case 'CANCELLED': return 'cancelled';
    case 'SUSPENDED': return 'suspended';
    default: return 'not_started';
  }
};

class FootballDataService {
  /**
   * Clear all caches
   */
  clearCache(): void {
    competitionsCache.clear();
    matchesCache.clear();
    console.log('Football-Data cache cleared');
  }

  /**
   * Make a request to the Football-Data.org API with rate limiting and exponential backoff
   */
  private async makeRequest<T>(endpoint: string, retryCount: number = 0): Promise<T> {
    await enforceRateLimit();
    
    const url = `${FOOTBALL_DATA_BASE_URL}${endpoint}`;
    console.log(`Making Football-Data API request to: ${url} (attempt ${retryCount + 1})`);
    
    try {
      const response = await axios.get<T>(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'X-Auth-Token': FOOTBALL_DATA_API_KEY,
          'Accept': 'application/json',
          'User-Agent': 'Kaido-Platform/1.0'
        }
      });
      
      console.log(`Football-Data API request successful: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`Football-Data API error for ${endpoint}:`, error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          // Rate limit exceeded - implement exponential backoff
          if (retryCount < 3) {
            const backoffDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
            console.log(`Football-Data rate limit exceeded. Retrying in ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return this.makeRequest<T>(endpoint, retryCount + 1);
          } else {
            throw new Error('Rate limit exceeded after 3 retries. Please try again later.');
          }
        } else if (error.response?.status === 403) {
          throw new Error('Access forbidden. Check your API key or subscription.');
        } else if (error.response?.status === 404) {
          throw new Error('Resource not found.');
        }
        console.error(`HTTP ${error.response?.status}: ${error.response?.statusText}`);
        console.error('Response data:', error.response?.data);
      }

      throw new Error(`Failed to fetch data from Football-Data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available competitions/leagues
   */
  async getCompetitions(): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = 'competitions';
      const cachedData = getFromCache(competitionsCache, cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch from Football-Data.org API
      const response = await this.makeRequest<{ competitions: FootballDataCompetition[] }>('/competitions');
      console.log('Football-Data API response structure:', {
        hasCompetitions: !!response.competitions,
        competitionsLength: response.competitions?.length || 0,
        firstCompetition: response.competitions?.[0]
      });
      
      const competitions = response.competitions?.map(mapCompetition) || [];
      
      // Cache the result
      setCache(competitionsCache, cacheKey, competitions);
      
      return competitions;
    } catch (error) {
      console.error('Error fetching competitions from Football-Data:', error);
      throw error;
    }
  }

  /**
   * Get upcoming matches for a specific competition
   */
  async getMatchesByCompetition(competitionId: string, days: number = 7): Promise<any[]> {
    try {
      // Extract the actual competition ID from our prefixed format
      const actualId = competitionId.replace('fd:competition:', '');
      console.log(`Fetching matches for Football-Data competition: ${actualId} for next ${days} days`);

      // Check cache first
      const cacheKey = `matches_${actualId}_${days}`;
      const cachedData = getFromCache(matchesCache, cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Calculate date range
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + days);
      
      const dateFrom = now.toISOString().split('T')[0];
      const dateTo = endDate.toISOString().split('T')[0];

      // Fetch matches from Football-Data.org API
      const response = await this.makeRequest<{ matches: FootballDataMatch[] }>(
        `/competitions/${actualId}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      const matches = response.matches?.map(mapMatch) || [];
      
      // Filter for upcoming matches only
      const upcomingMatches = matches.filter(match => {
        const matchDate = new Date(match.scheduled);
        return (
          match.status === 'not_started' &&
          matchDate > now
        );
      });

      console.log(`Found ${upcomingMatches.length} upcoming matches for Football-Data competition ${actualId}`);

      // Sort by date (soonest first)
      const sortedMatches = upcomingMatches.sort((a, b) =>
        new Date(a.scheduled).getTime() - new Date(b.scheduled).getTime()
      );
      
      // Cache the result
      setCache(matchesCache, cacheKey, sortedMatches);
      
      return sortedMatches;
    } catch (error) {
      console.error(`Error fetching matches for Football-Data competition ${competitionId}:`, error);
      return [];
    }
  }
}

export default new FootballDataService();
