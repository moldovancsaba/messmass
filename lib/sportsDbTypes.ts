// lib/sportsDbTypes.ts
// TypeScript interfaces for TheSportsDB API responses
// API Documentation: https://www.thesportsdb.com/api.php

/**
 * WHAT: Team entity from TheSportsDB API
 * WHY: Provides sports club metadata for partner enrichment
 */
export interface SportsDbTeam {
  idTeam: string;                    // Unique team ID (e.g., "133604")
  strTeam: string;                   // Team name (e.g., "FC Barcelona")
  strTeamShort?: string;             // Short name (e.g., "Barcelona")
  strAlternate?: string;             // Alternative names
  intFormedYear?: string;            // Year founded (e.g., "1899")
  strSport: string;                  // Sport type (e.g., "Soccer")
  strLeague: string;                 // League name (e.g., "La Liga")
  idLeague: string;                  // League ID
  strStadium?: string;               // Stadium/venue name (e.g., "Camp Nou")
  strStadiumThumb?: string;          // Stadium image URL
  strStadiumDescription?: string;    // Stadium description
  strStadiumLocation?: string;       // Stadium city/location
  intStadiumCapacity?: string;       // Capacity (as string, e.g., "99354")
  strWebsite?: string;               // Official website
  strFacebook?: string;              // Facebook page
  strTwitter?: string;               // Twitter handle
  strInstagram?: string;             // Instagram handle
  strDescriptionEN?: string;         // English description
  strCountry: string;                // Country (e.g., "Spain")
  strTeamBadge?: string;             // Badge/logo URL
  strTeamJersey?: string;            // Jersey image URL
  strTeamLogo?: string;              // Logo URL
  strTeamFanart1?: string;           // Fan art image 1
  strTeamFanart2?: string;           // Fan art image 2
  strTeamFanart3?: string;           // Fan art image 3
  strTeamFanart4?: string;           // Fan art image 4
  strTeamBanner?: string;            // Banner image URL
}

/**
 * WHAT: Venue/Stadium entity from TheSportsDB API
 * WHY: Provides stadium capacity and location for venue utilization metrics
 */
export interface SportsDbVenue {
  idVenue: string;                   // Unique venue ID
  strVenue: string;                  // Venue name
  strVenueAlternate?: string;        // Alternative venue name
  strSport?: string;                 // Primary sport
  strLocation?: string;              // City/location
  strCountry?: string;               // Country
  intCapacity?: string;              // Capacity (as string)
  strThumb?: string;                 // Venue image URL
  strMap?: string;                   // Map URL
  strDescriptionEN?: string;         // English description
  strWebsite?: string;               // Official website
  strFacebook?: string;              // Facebook page
  strTwitter?: string;               // Twitter handle
  strCost?: string;                  // Construction cost
}

/**
 * WHAT: League entity from TheSportsDB API
 * WHY: Provides league context for benchmark comparisons
 */
export interface SportsDbLeague {
  idLeague: string;                  // Unique league ID
  strLeague: string;                 // League name (e.g., "La Liga")
  strSport: string;                  // Sport type
  strLeagueAlternate?: string;       // Alternative names
  strDivision?: string;              // Division level
  intFormedYear?: string;            // Year formed
  strCurrentSeason?: string;         // Current season
  strWebsite?: string;               // Official website
  strFacebook?: string;              // Facebook page
  strTwitter?: string;               // Twitter handle
  strYoutube?: string;               // YouTube channel
  strDescriptionEN?: string;         // English description
  strBadge?: string;                 // League badge/logo URL
  strLogo?: string;                  // League logo URL
  strBanner?: string;                // League banner URL
  strCountry: string;                // Country
  strGender?: string;                // Gender (e.g., "Male", "Female")
}

/**
 * WHAT: API response wrapper for team searches
 * WHY: TheSportsDB returns arrays in "teams" property
 */
export interface SportsDbTeamsResponse {
  teams: SportsDbTeam[] | null;
}

/**
 * WHAT: API response wrapper for venue lookups
 * WHY: TheSportsDB returns arrays in "venues" property
 */
export interface SportsDbVenuesResponse {
  venues: SportsDbVenue[] | null;
}

/**
 * WHAT: API response wrapper for league lookups
 * WHY: TheSportsDB returns arrays in "leagues" property
 */
export interface SportsDbLeaguesResponse {
  leagues: SportsDbLeague[] | null;
}

/**
 * WHAT: Cache entry with TTL
 * WHY: Minimize API calls by caching responses with expiration
 */
export interface CacheEntry<T> {
  data: T;
  expiresAt: number;  // Unix timestamp (ms)
}

/**
 * WHAT: Rate limiter state
 * WHY: Track request timestamps to enforce 3 req/min limit
 */
export interface RateLimiterState {
  requests: number[];  // Array of request timestamps (ms)
  limit: number;       // Max requests allowed
  window: number;      // Time window in ms (60000 = 1 minute)
}

/**
 * WHAT: Event (fixture) from TheSportsDB API
 * WHY: Primary source for scheduling; used to seed drafts
 */
export interface SportsDbEvent {
  idEvent: string;
  strEvent: string;            // e.g., "Barcelona vs Real Madrid"
  strLeague?: string;
  idLeague?: string;
  strSeason?: string;
  dateEvent?: string;          // YYYY-MM-DD
  strTime?: string;            // HH:mm:ss
  strTimestamp?: string;       // ISO timestamp
  idHomeTeam?: string;
  idAwayTeam?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;   // e.g., "Not Started"
  idVenue?: string | null;
  strVenue?: string | null;
}

export interface SportsDbEventsResponse {
  events: SportsDbEvent[] | null;
}
