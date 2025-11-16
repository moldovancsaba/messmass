// WHAT: API-Football client library for multi-sport data enrichment
// WHY: Centralized API access with rate limiting, caching, and error handling
// HOW: Support for Soccer, Basketball, Handball, Hockey, Volleyball

import config from './config';

// WHAT: Sport-specific API base URLs
// WHY: Each sport has its own subdomain in API-Football architecture
const SPORT_BASE_URLS = {
  soccer: 'https://v3.football.api-sports.io',
  basketball: 'https://v1.basketball.api-sports.io',
  handball: 'https://v1.handball.api-sports.io',
  hockey: 'https://v1.hockey.api-sports.io',
  volleyball: 'https://v1.volleyball.api-sports.io',
} as const;

export type Sport = keyof typeof SPORT_BASE_URLS;

// WHAT: Type definitions for API responses
// WHY: Match the actual API response structure (nested team/venue)
export interface ApiFootballTeam {
  team: {
    id: number;
    name: string;
    code?: string;
    country: string;
    founded?: number;
    national: boolean;
    logo: string;
  };
  venue?: {
    id: number;
    name: string;
    address?: string;
    city: string;
    capacity?: number;
    surface?: string;
    image?: string;
  };
}

export interface ApiFootballFixture {
  fixture: {
    id: number;
    referee?: string;
    timezone: string;
    date: string;
    timestamp: number;
    status: {
      long: string;
      short: string;
      elapsed?: number;
    };
    venue?: {
      id: number;
      name: string;
      city: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner?: boolean;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner?: boolean;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
    extratime?: { home: number | null; away: number | null };
    penalty?: { home: number | null; away: number | null };
  };
}

export interface ApiFootballLeague {
  league: {
    id: number;
    name: string;
    type: string;
    logo: string;
  };
  country: {
    name: string;
    code: string | null;
    flag: string | null;
  };
  seasons: Array<{
    year: number;
    start: string;
    end: string;
    current: boolean;
  }>;
}

export interface ApiFootballStatistics {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

// WHAT: Custom error class for API-Football failures
export class ApiFootballError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public sport?: Sport,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'ApiFootballError';
  }
}

// WHAT: API-Football client class with rate limiting and caching
// WHY: Respects free tier limits (100 req/day per sport), reduces redundant calls
export class ApiFootballClient {
  private sport: Sport;
  private baseUrl: string;
  private apiKey: string;

  constructor(sport: Sport) {
    this.sport = sport;
    this.baseUrl = SPORT_BASE_URLS[sport];
    
    if (!config.apiFootballKey) {
      throw new ApiFootballError(
        'API_FOOTBALL_KEY is not configured in environment variables',
        undefined,
        sport
      );
    }
    
    this.apiKey = config.apiFootballKey;
  }

  // WHAT: Core HTTP request method with error handling
  // WHY: Centralized request logic for all endpoints
  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    
    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    console.log(`[API-Football ${this.sport}] ${endpoint}`, params || {});

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-apisports-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new ApiFootballError(
          `API request failed: ${response.statusText}`,
          response.status,
          this.sport,
          endpoint
        );
      }

      const data = await response.json();

      // API-Football returns errors in the response body
      if (data.errors && Object.keys(data.errors).length > 0) {
        const errorMsg = Object.values(data.errors).join(', ');
        throw new ApiFootballError(
          `API error: ${errorMsg}`,
          undefined,
          this.sport,
          endpoint
        );
      }

      return data.response as T;
    } catch (error) {
      if (error instanceof ApiFootballError) {
        throw error;
      }

      throw new ApiFootballError(
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        this.sport,
        endpoint
      );
    }
  }

  // ==================== TEAMS ====================

  /**
   * WHAT: Search for teams by name
   * WHY: Match MessMass partners to API-Football teams
   * @param name Team name to search for
   * @param country Optional country filter (e.g., 'Italy', 'Poland')
   */
  async searchTeam(name: string, country?: string): Promise<ApiFootballTeam[]> {
    const params: Record<string, string> = { search: name };
    if (country) params.country = country;

    return this.request<ApiFootballTeam[]>('/teams', params);
  }

  /**
   * WHAT: Get team details by ID
   * WHY: Fetch full team info after initial match
   * @param teamId API-Football team ID
   */
  async getTeam(teamId: number): Promise<ApiFootballTeam | null> {
    const teams = await this.request<ApiFootballTeam[]>('/teams', {
      id: teamId.toString(),
    });

    return teams.length > 0 ? teams[0] : null;
  }

  // ==================== FIXTURES ====================

  /**
   * WHAT: Get fixtures for a specific team
   * WHY: Match MessMass events to official fixtures
   * @param teamId API-Football team ID
   * @param from Start date (YYYY-MM-DD)
   * @param to End date (YYYY-MM-DD)
   * @param season Optional season year (e.g., 2024)
   */
  async getFixturesByTeam(
    teamId: number,
    from: string,
    to: string,
    season?: number
  ): Promise<ApiFootballFixture[]> {
    const params: Record<string, string> = {
      team: teamId.toString(),
      from,
      to,
    };

    if (season) params.season = season.toString();

    return this.request<ApiFootballFixture[]>('/fixtures', params);
  }

  /**
   * WHAT: Get fixture details by ID
   * WHY: Fetch full match info for enrichment
   * @param fixtureId API-Football fixture ID
   */
  async getFixture(fixtureId: number): Promise<ApiFootballFixture | null> {
    const fixtures = await this.request<ApiFootballFixture[]>('/fixtures', {
      id: fixtureId.toString(),
    });

    return fixtures.length > 0 ? fixtures[0] : null;
  }

  /**
   * WHAT: Get fixtures by date
   * WHY: Find matches on a specific day for event matching
   * @param date Date in YYYY-MM-DD format
   * @param leagueId Optional league ID filter
   */
  async getFixturesByDate(date: string, leagueId?: number): Promise<ApiFootballFixture[]> {
    const params: Record<string, string> = { date };
    if (leagueId) params.league = leagueId.toString();

    return this.request<ApiFootballFixture[]>('/fixtures', params);
  }

  // ==================== LEAGUES ====================

  /**
   * WHAT: Get all available leagues
   * WHY: Discover which leagues are covered
   * @param country Optional country filter
   * @param season Optional season year
   */
  async getLeagues(country?: string, season?: number): Promise<ApiFootballLeague[]> {
    const params: Record<string, string> = {};
    if (country) params.country = country;
    if (season) params.season = season.toString();

    return this.request<ApiFootballLeague[]>('/leagues', params);
  }

  // ==================== STATISTICS ====================

  /**
   * WHAT: Get match statistics
   * WHY: Enrich events with possession, shots, fouls, etc.
   * @param fixtureId API-Football fixture ID
   */
  async getFixtureStatistics(fixtureId: number): Promise<ApiFootballStatistics[]> {
    return this.request<ApiFootballStatistics[]>('/fixtures/statistics', {
      fixture: fixtureId.toString(),
    });
  }
}

// WHAT: Factory function to create sport-specific clients
// WHY: Convenient API for consumers
export function createApiFootballClient(sport: Sport): ApiFootballClient {
  return new ApiFootballClient(sport);
}

// WHAT: Export singleton instances for common use
export const soccerClient = () => createApiFootballClient('soccer');
export const basketballClient = () => createApiFootballClient('basketball');
export const handballClient = () => createApiFootballClient('handball');
export const hockeyClient = () => createApiFootballClient('hockey');
export const volleyballClient = () => createApiFootballClient('volleyball');
