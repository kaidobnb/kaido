import sportradarService from './sportradarService';
import footballDataService from './footballDataService';

export type SportsApiProvider = 'sportradar' | 'football-data';

// Unified interface for sports data
export interface UnifiedCompetition {
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

export interface UnifiedTeam {
  id: string;
  name: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
}

export interface UnifiedMatch {
  id: string;
  scheduled: string;
  home?: UnifiedTeam;
  away?: UnifiedTeam;
  competition: {
    id: string;
    name: string;
  };
  status: 'not_started' | 'live' | 'ended' | 'postponed' | 'cancelled' | 'suspended';
  match_status?: string;
  home_score?: number;
  away_score?: number;
}

class UnifiedSportsService {
  private currentProvider: SportsApiProvider;

  constructor() {
    // Default provider from environment or fallback to football-data
    this.currentProvider = (process.env.DEFAULT_SPORTS_API_PROVIDER as SportsApiProvider) || 'football-data';
    console.log(`UnifiedSportsService initialized with provider: ${this.currentProvider}`);
  }

  /**
   * Get the current API provider
   */
  getCurrentProvider(): SportsApiProvider {
    return this.currentProvider;
  }

  /**
   * Set the API provider
   */
  setProvider(provider: SportsApiProvider): void {
    console.log(`Switching sports API provider from ${this.currentProvider} to ${provider}`);
    this.currentProvider = provider;
  }

  /**
   * Get the appropriate service instance based on current provider
   */
  private getService() {
    switch (this.currentProvider) {
      case 'sportradar':
        return sportradarService;
      case 'football-data':
        return footballDataService;
      default:
        console.warn(`Unknown provider ${this.currentProvider}, falling back to football-data`);
        return footballDataService;
    }
  }

  /**
   * Get all available competitions/leagues
   */
  async getCompetitions(): Promise<UnifiedCompetition[]> {
    try {
      console.log(`Fetching competitions using ${this.currentProvider} API`);
      const service = this.getService();
      const competitions = await service.getCompetitions();
      
      console.log(`Successfully fetched ${competitions.length} competitions from ${this.currentProvider}`);
      return competitions;
    } catch (error) {
      console.error(`Error fetching competitions from ${this.currentProvider}:`, error);
      
      // If current provider fails, try the other one as fallback
      const fallbackProvider: SportsApiProvider = this.currentProvider === 'sportradar' ? 'football-data' : 'sportradar';
      console.log(`Attempting fallback to ${fallbackProvider}`);
      
      try {
        const fallbackService = fallbackProvider === 'sportradar' ? sportradarService : footballDataService;
        const competitions = await fallbackService.getCompetitions();
        console.log(`Fallback successful: fetched ${competitions.length} competitions from ${fallbackProvider}`);
        return competitions;
      } catch (fallbackError) {
        console.error(`Fallback to ${fallbackProvider} also failed:`, fallbackError);
        
        // Return mock data as last resort
        console.log('Returning mock competition data as last resort');
        return this.getMockCompetitions();
      }
    }
  }

  /**
   * Get upcoming matches for a specific competition
   */
  async getMatchesByCompetition(competitionId: string, days: number = 7): Promise<UnifiedMatch[]> {
    try {
      console.log(`Fetching matches for competition ${competitionId} using ${this.currentProvider} API`);

      // Convert competition ID to the format expected by the current provider
      let convertedCompetitionId = competitionId;

      // If the ID is in Sportradar format and we're using Football-Data, convert it
      if (competitionId.startsWith('sr:competition:') && this.currentProvider === 'football-data') {
        convertedCompetitionId = this.convertCompetitionId(competitionId, 'sportradar', 'football-data');
        console.log(`Converted Sportradar ID ${competitionId} to Football-Data ID ${convertedCompetitionId}`);
      }
      // If the ID is in Football-Data format and we're using Sportradar, convert it
      else if (competitionId.startsWith('fd:competition:') && this.currentProvider === 'sportradar') {
        convertedCompetitionId = this.convertCompetitionId(competitionId, 'football-data', 'sportradar');
        console.log(`Converted Football-Data ID ${competitionId} to Sportradar ID ${convertedCompetitionId}`);
      }

      const service = this.getService();
      const matches = await service.getMatchesByCompetition(convertedCompetitionId, days);

      console.log(`Successfully fetched ${matches.length} matches from ${this.currentProvider}`);
      return matches;
    } catch (error) {
      console.error(`Error fetching matches from ${this.currentProvider}:`, error);

      // If current provider fails, try the other one as fallback
      const fallbackProvider: SportsApiProvider = this.currentProvider === 'sportradar' ? 'football-data' : 'sportradar';
      console.log(`Attempting fallback to ${fallbackProvider} for matches`);

      try {
        // Convert competition ID if needed for fallback
        let fallbackCompetitionId = competitionId;
        if (this.currentProvider === 'sportradar' && fallbackProvider === 'football-data') {
          // Convert Sportradar ID to Football-Data ID if possible
          fallbackCompetitionId = this.convertCompetitionId(competitionId, 'sportradar', 'football-data');
        } else if (this.currentProvider === 'football-data' && fallbackProvider === 'sportradar') {
          // Convert Football-Data ID to Sportradar ID if possible
          fallbackCompetitionId = this.convertCompetitionId(competitionId, 'football-data', 'sportradar');
        }

        const fallbackService = fallbackProvider === 'sportradar' ? sportradarService : footballDataService;
        const matches = await fallbackService.getMatchesByCompetition(fallbackCompetitionId, days);
        console.log(`Fallback successful: fetched ${matches.length} matches from ${fallbackProvider}`);
        return matches;
      } catch (fallbackError) {
        console.error(`Fallback to ${fallbackProvider} also failed:`, fallbackError);
        return [];
      }
    }
  }

  /**
   * Convert competition IDs between different API providers
   */
  private convertCompetitionId(competitionId: string, fromProvider: SportsApiProvider, toProvider: SportsApiProvider): string {
    // Competition ID mapping between providers
    const competitionMapping: Record<string, Record<string, string>> = {
      'sportradar-to-football-data': {
        'sr:competition:17': 'fd:competition:2021', // Premier League
        'sr:competition:34': 'fd:competition:2014', // La Liga
        'sr:competition:23': 'fd:competition:2019', // Serie A
        'sr:competition:35': 'fd:competition:2002', // Bundesliga
        'sr:competition:238': 'fd:competition:2015', // Ligue 1
      },
      'football-data-to-sportradar': {
        'fd:competition:2021': 'sr:competition:17', // Premier League
        'fd:competition:2014': 'sr:competition:34', // La Liga
        'fd:competition:2019': 'sr:competition:23', // Serie A
        'fd:competition:2002': 'sr:competition:35', // Bundesliga
        'fd:competition:2015': 'sr:competition:238', // Ligue 1
      }
    };

    const mappingKey = `${fromProvider}-to-${toProvider}`;
    const mapping = competitionMapping[mappingKey];
    
    if (mapping && mapping[competitionId]) {
      console.log(`Converted competition ID ${competitionId} to ${mapping[competitionId]} for ${toProvider}`);
      return mapping[competitionId];
    }
    
    console.log(`No mapping found for competition ID ${competitionId}, using original ID`);
    return competitionId;
  }

  /**
   * Get mock competitions as fallback
   */
  private getMockCompetitions(): UnifiedCompetition[] {
    return [
      {
        id: "mock:competition:1",
        name: "Premier League",
        country: { id: "mock:country:1", name: "England", code: "ENG" },
        category: { id: "mock:category:1", name: "England" }
      },
      {
        id: "mock:competition:2",
        name: "La Liga",
        country: { id: "mock:country:2", name: "Spain", code: "ESP" },
        category: { id: "mock:category:2", name: "Spain" }
      },
      {
        id: "mock:competition:3",
        name: "Serie A",
        country: { id: "mock:country:3", name: "Italy", code: "ITA" },
        category: { id: "mock:category:3", name: "Italy" }
      },
      {
        id: "mock:competition:4",
        name: "Bundesliga",
        country: { id: "mock:country:4", name: "Germany", code: "GER" },
        category: { id: "mock:category:4", name: "Germany" }
      },
      {
        id: "mock:competition:5",
        name: "Ligue 1",
        country: { id: "mock:country:5", name: "France", code: "FRA" },
        category: { id: "mock:category:5", name: "France" }
      }
    ];
  }

  /**
   * Clear all caches for both providers
   */
  clearAllCaches(): void {
    console.log('Clearing caches for all sports API providers');
    sportradarService.clearCache();
    footballDataService.clearCache();
  }

  /**
   * Validate match for prediction creation
   */
  validateMatchForPrediction(match: UnifiedMatch): { valid: boolean; reason?: string } {
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

  /**
   * Get API provider status and information
   */
  getProviderInfo(): {
    current: SportsApiProvider;
    available: SportsApiProvider[];
    rateLimit: Record<SportsApiProvider, string>;
  } {
    return {
      current: this.currentProvider,
      available: ['sportradar', 'football-data'],
      rateLimit: {
        'sportradar': '1 request/second (1000/month trial)',
        'football-data': '10 requests/minute (14,400/day free)'
      }
    };
  }
}

export default new UnifiedSportsService();
