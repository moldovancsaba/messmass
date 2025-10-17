// lib/sportsDbApi.ts
// TheSportsDB API wrapper with rate limiting and caching
// API Documentation: https://www.thesportsdb.com/api.php
// Free Tier: 3 requests per minute

import type {
  SportsDbTeam,
  SportsDbVenue,
  SportsDbLeague,
  SportsDbTeamsResponse,
  SportsDbVenuesResponse,
  SportsDbLeaguesResponse,
  CacheEntry,
  RateLimiterState
} from './sportsDbTypes';

/**
 * WHAT: TheSportsDB API configuration
 * WHY: Centralize API settings for easy updates
 */
const SPORTSDB_CONFIG = {
  baseUrl: process.env.SPORTSDB_BASE_URL || 'https://www.thesportsdb.com/api/v1/json',
  apiKey: process.env.SPORTSDB_API_KEY || '3', // Free tier key
  rateLimit: 3,      // Max requests per minute
  rateLimitWindow: 60000, // 1 minute in ms
  cacheTTL: {
    search: 3600000,   // 1 hour for search results
    lookup: 86400000,  // 24 hours for team/venue/league lookups
  }
};

/**
 * WHAT: In-memory cache for API responses
 * WHY: Reduce API calls and improve response times
 */
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * WHAT: Rate limiter state
 * WHY: Track request timestamps to enforce 3 req/min limit
 */
const rateLimiter: RateLimiterState = {
  requests: [],
  limit: SPORTSDB_CONFIG.rateLimit,
  window: SPORTSDB_CONFIG.rateLimitWindow
};

/**
 * WHAT: Get cached data if valid
 * WHY: Avoid unnecessary API calls
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) {
    return null;
  }
  
  // Check if cache expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * WHAT: Store data in cache with TTL
 * WHY: Make responses available for future requests
 */
function setInCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl
  });
}

/**
 * WHAT: Check if rate limit allows new request
 * WHY: Enforce 3 req/min limit to comply with API restrictions
 */
function canMakeRequest(): boolean {
  const now = Date.now();
  const windowStart = now - rateLimiter.window;
  
  // Remove old timestamps outside current window
  rateLimiter.requests = rateLimiter.requests.filter(ts => ts > windowStart);
  
  // Check if we're under the limit
  return rateLimiter.requests.length < rateLimiter.limit;
}

/**
 * WHAT: Record a new API request timestamp
 * WHY: Track request count for rate limiting
 */
function recordRequest(): void {
  rateLimiter.requests.push(Date.now());
}

/**
 * WHAT: Wait until rate limit window resets
 * WHY: Prevent 429 rate limit errors from API
 * RETURNS: Promise that resolves when safe to make request
 */
async function waitForRateLimit(): Promise<void> {
  while (!canMakeRequest()) {
    const now = Date.now();
    const oldestRequest = rateLimiter.requests[0];
    const waitTime = (oldestRequest + rateLimiter.window) - now + 100; // +100ms buffer
    
    console.log(`[SportsDB] Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

/**
 * WHAT: Generic fetch wrapper with rate limiting and caching
 * WHY: Centralize error handling, rate limiting, and caching logic
 */
async function fetchWithRateLimit<T>(
  endpoint: string,
  cacheKey: string,
  cacheTTL: number
): Promise<T> {
  // Check cache first
  const cached = getFromCache<T>(cacheKey);
  if (cached !== null) {
    console.log(`[SportsDB] Cache hit: ${cacheKey}`);
    return cached;
  }
  
  // Wait if rate limit reached
  await waitForRateLimit();
  
  // Build full URL
  const url = `${SPORTSDB_CONFIG.baseUrl}/${SPORTSDB_CONFIG.apiKey}/${endpoint}`;
  
  console.log(`[SportsDB] Fetching: ${url}`);
  
  try {
    recordRequest();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json() as T;
    
    // Cache successful response
    setInCache(cacheKey, data, cacheTTL);
    
    return data;
    
  } catch (error) {
    console.error(`[SportsDB] API Error:`, error);
    throw error;
  }
}

/**
 * WHAT: Search for teams by name
 * WHY: Enable partner-to-team matching in admin UI
 * EXAMPLE: searchTeams("barcelona") => [{idTeam: "133604", strTeam: "FC Barcelona", ...}]
 */
export async function searchTeams(query: string): Promise<SportsDbTeam[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const endpoint = `searchteams.php?t=${encodeURIComponent(query)}`;
  const cacheKey = `search:teams:${query.toLowerCase()}`;
  
  const response = await fetchWithRateLimit<SportsDbTeamsResponse>(
    endpoint,
    cacheKey,
    SPORTSDB_CONFIG.cacheTTL.search
  );
  
  return response.teams || [];
}

/**
 * WHAT: Extract team ID from TheSportsDB URL
 * WHY: Support direct URL-based enrichment when user pastes team profile URL
 * EXAMPLE: extractTeamIdFromUrl("https://www.thesportsdb.com/team/141401-eisbären-berlin") => "141401"
 * RETURNS: Team ID string or null if URL is invalid
 */
export function extractTeamIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  const urlMatch = url.match(/thesportsdb\.com\/team\/(\d+)/i);
  return urlMatch ? urlMatch[1] : null;
}

/**
 * WHAT: Lookup team by ID
 * WHY: Fetch complete team details including stadium capacity for enrichment
 * EXAMPLE: lookupTeam("133604") => {idTeam: "133604", strTeam: "FC Barcelona", intStadiumCapacity: "99354", ...}
 */
export async function lookupTeam(teamId: string): Promise<SportsDbTeam | null> {
  if (!teamId || teamId.trim().length === 0) {
    return null;
  }
  
  const endpoint = `lookupteam.php?id=${encodeURIComponent(teamId)}`;
  const cacheKey = `lookup:team:${teamId}`;
  
  const response = await fetchWithRateLimit<SportsDbTeamsResponse>(
    endpoint,
    cacheKey,
    SPORTSDB_CONFIG.cacheTTL.lookup
  );
  
  return response.teams?.[0] || null;
}

/**
 * WHAT: Lookup venue by ID
 * WHY: Fetch stadium capacity and location details
 * EXAMPLE: lookupVenue("11") => {idVenue: "11", strVenue: "Camp Nou", intCapacity: "99354", ...}
 */
export async function lookupVenue(venueId: string): Promise<SportsDbVenue | null> {
  if (!venueId || venueId.trim().length === 0) {
    return null;
  }
  
  const endpoint = `lookupvenue.php?id=${encodeURIComponent(venueId)}`;
  const cacheKey = `lookup:venue:${venueId}`;
  
  const response = await fetchWithRateLimit<SportsDbVenuesResponse>(
    endpoint,
    cacheKey,
    SPORTSDB_CONFIG.cacheTTL.lookup
  );
  
  return response.venues?.[0] || null;
}

/**
 * WHAT: Lookup league by ID
 * WHY: Fetch league metadata for benchmark comparisons
 * EXAMPLE: lookupLeague("4335") => {idLeague: "4335", strLeague: "La Liga", strCountry: "Spain", ...}
 */
export async function lookupLeague(leagueId: string): Promise<SportsDbLeague | null> {
  if (!leagueId || leagueId.trim().length === 0) {
    return null;
  }
  
  const endpoint = `lookupleague.php?id=${encodeURIComponent(leagueId)}`;
  const cacheKey = `lookup:league:${leagueId}`;
  
  const response = await fetchWithRateLimit<SportsDbLeaguesResponse>(
    endpoint,
    cacheKey,
    SPORTSDB_CONFIG.cacheTTL.lookup
  );
  
  return response.leagues?.[0] || null;
}

/**
 * WHAT: Clear all cached data
 * WHY: Allow manual cache invalidation if needed
 */
export function clearCache(): void {
  cache.clear();
  console.log('[SportsDB] Cache cleared');
}

/**
 * WHAT: Get current cache statistics
 * WHY: Monitor cache performance and hit rates
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys())
  };
}

/**
 * WHAT: Get current rate limiter state
 * WHY: Debug rate limiting issues
 */
export function getRateLimiterState() {
  const now = Date.now();
  const windowStart = now - rateLimiter.window;
  const activeRequests = rateLimiter.requests.filter(ts => ts > windowStart);
  
  return {
    activeRequests: activeRequests.length,
    limit: rateLimiter.limit,
    canMakeRequest: canMakeRequest(),
    oldestRequest: activeRequests[0] ? new Date(activeRequests[0]).toISOString() : null
  };
}
