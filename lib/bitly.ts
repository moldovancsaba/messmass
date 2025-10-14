// lib/bitly.ts
// WHAT: Bitly API v4 client with rate limiting, retry logic, and Growth tier optimizations
// WHY: Provides resilient integration with Bitly for importing link analytics into MessMass
// REF: https://dev.bitly.com/api-reference/

import config from './config';
import type {
  BitlyLinkMetadata,
  BitlyGroupLinksResponse,
  BitlyClicksSummary,
  BitlyClicksTimeseries,
  BitlyCountriesResponse,
  BitlyReferrersResponse,
  BitlyReferringDomainsResponse,
  BitlyErrorResponse,
  BitlyRateLimitInfo,
  BitlyCampaign,
} from './bitly.types';

// WHAT: Base URL for Bitly API v4
// WHY: Centralized constant to avoid hardcoding across methods
const BITLY_API_BASE = 'https://api-ssl.bitly.com/v4';

// WHAT: Default timeout for API requests in milliseconds
// WHY: Prevents hanging requests; 15 seconds is reasonable for analytics queries
const DEFAULT_TIMEOUT_MS = 15000;

// WHAT: Maximum retry attempts for transient failures (429, 5xx)
// WHY: Growth tier may hit rate limits; exponential backoff improves success rate
const MAX_RETRIES = 3;

/**
 * WHAT: Custom error class for Bitly API failures
 * WHY: Enables type-safe error handling and structured logging in sync operations
 */
export class BitlyApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: BitlyErrorResponse,
    public isRetriable: boolean = false
  ) {
    super(message);
    this.name = 'BitlyApiError';
  }
}

/**
 * WHAT: Extract rate limit information from response headers
 * WHY: Enables proactive rate limit management and informed backoff strategies
 */
function extractRateLimitInfo(headers: Headers): BitlyRateLimitInfo | null {
  const limit = headers.get('X-RateLimit-Limit');
  const remaining = headers.get('X-RateLimit-Remaining');
  const reset = headers.get('X-RateLimit-Reset');

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
    };
  }

  return null;
}

/**
 * WHAT: Core HTTP request function with timeout, retries, and rate limit handling
 * WHY: Centralizes all API communication logic to ensure consistency and resilience
 * 
 * STRATEGY:
 * - Uses AbortController for request timeout
 * - Exponential backoff for 429 (rate limit) and 5xx (server errors)
 * - Respects Retry-After header when present
 * - Surfaces rate limit info for observability
 */
async function bitlyRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<{ data: T; rateLimit: BitlyRateLimitInfo | null }> {
  // WHAT: Ensure we have a valid access token
  // WHY: Fail fast with clear error message if token is missing
  const accessToken = config.bitlyAccessToken;
  if (!accessToken) {
    throw new BitlyApiError(
      'BITLY_ACCESS_TOKEN is not configured. Please set it in environment variables.',
      undefined,
      undefined,
      false
    );
  }

  // WHAT: Setup request timeout using AbortController
  // WHY: Prevents indefinite hanging on slow/stalled connections
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = `${BITLY_API_BASE}${endpoint}`;
    
    // WHAT: Redact token in logs for security
    // WHY: Never log sensitive credentials; use placeholder for debugging
    const sanitizedToken = `${accessToken.slice(0, 4)}...${accessToken.slice(-4)}`;
    console.log(`[Bitly] Request: ${options.method || 'GET'} ${endpoint} (token: ${sanitizedToken})`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // WHAT: Extract rate limit metadata from response headers
    // WHY: Enables monitoring and proactive handling before hitting limits
    const rateLimit = extractRateLimitInfo(response.headers);
    if (rateLimit) {
      console.log(`[Bitly] Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
    }

    // WHAT: Handle successful responses (2xx)
    if (response.ok) {
      const data = await response.json();
      return { data, rateLimit };
    }

    // WHAT: Parse error response for detailed error information
    const errorBody = await response.json().catch(() => null) as BitlyErrorResponse | null;
    const errorMessage = errorBody?.message || response.statusText || 'Unknown error';

    // WHAT: Handle rate limiting (429) with exponential backoff
    // WHY: Growth tier has rate limits; retrying with backoff improves success rate
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      // WHAT: Check for Retry-After header to determine wait time
      // WHY: Respects Bitly's guidance on when to retry
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s

      console.warn(`[Bitly] Rate limited. Retrying in ${waitMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return bitlyRequest<T>(endpoint, options, retryCount + 1);
    }

    // WHAT: Handle server errors (5xx) with exponential backoff
    // WHY: Transient server issues may resolve on retry
    if (response.status >= 500 && retryCount < MAX_RETRIES) {
      const waitMs = Math.pow(2, retryCount) * 1000;
      console.warn(`[Bitly] Server error ${response.status}. Retrying in ${waitMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return bitlyRequest<T>(endpoint, options, retryCount + 1);
    }

    // WHAT: Throw non-retriable error for client errors (4xx except 429) or exhausted retries
    throw new BitlyApiError(
      errorMessage,
      response.status,
      errorBody || undefined,
      false
    );

  } catch (error) {
    clearTimeout(timeoutId);

    // WHAT: Handle fetch abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BitlyApiError(
        `Request timeout after ${DEFAULT_TIMEOUT_MS}ms`,
        undefined,
        undefined,
        true
      );
    }

    // WHAT: Re-throw BitlyApiError instances
    if (error instanceof BitlyApiError) {
      throw error;
    }

    // WHAT: Wrap unexpected errors
    throw new BitlyApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      undefined,
      true
    );
  }
}

/**
 * WHAT: Normalize bitlink input to consistent format (domain/hash without scheme)
 * WHY: Bitly API expects bitlinks in format "bit.ly/abc123" without https://
 * 
 * EXAMPLES:
 * - "https://bit.ly/3fK8Lm2" → "bit.ly/3fK8Lm2"
 * - "bit.ly/3fK8Lm2" → "bit.ly/3fK8Lm2"
 * - "3fK8Lm2" → "bit.ly/3fK8Lm2" (assumes bit.ly domain)
 */
export function normalizeBitlink(input: string): string {
  // WHAT: Remove protocol and trailing slashes
  let normalized = input.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // WHAT: If no domain present, assume bit.ly
  // WHY: Most common case; makes API easier to use
  if (!normalized.includes('/')) {
    normalized = `bit.ly/${normalized}`;
  }
  
  return normalized;
}

/**
 * WHAT: Extract UTM campaign parameters from a URL
 * WHY: Enables campaign attribution and performance tracking in MessMass analytics
 */
export function extractCampaign(url: string): BitlyCampaign {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined,
    };
  } catch {
    // WHAT: Return empty campaign if URL parsing fails
    // WHY: Non-critical data; don't fail the entire operation
    return {};
  }
}

/**
 * WHAT: Fetch metadata for a specific bitlink
 * WHY: Retrieves link details including long URL, title, creation date, and tags
 * REF: GET /v4/bitlinks/{bitlink}
 */
export async function getLink(bitlink: string): Promise<BitlyLinkMetadata> {
  const normalized = normalizeBitlink(bitlink);
  const { data } = await bitlyRequest<BitlyLinkMetadata>(`/bitlinks/${normalized}`);
  return data;
}

/**
 * WHAT: Fetch all bitlinks for the authenticated user
 * WHY: Enables bulk discovery without requiring group GUID - works with access token only
 * REF: GET /v4/user/bitlinks
 * 
 * STRATEGY: This endpoint is preferred when BITLY_ORGANIZATION_GUID is not configured
 * as it automatically fetches all links accessible to the authenticated user.
 */
export async function getUserBitlinks(
  options: { size?: number; page?: number } = {}
): Promise<BitlyGroupLinksResponse> {
  const params = new URLSearchParams();
  if (options.size) params.append('size', options.size.toString());
  if (options.page) params.append('page', options.page.toString());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await bitlyRequest<BitlyGroupLinksResponse>(
    `/user/bitlinks${queryString}`
  );
  
  return data;
}

/**
 * WHAT: Fetch all bitlinks for a group/organization
 * WHY: Enables bulk discovery and association of links with MessMass projects
 * REF: GET /v4/groups/{group_guid}/bitlinks
 * 
 * NOTE: Only use this if you have a specific group GUID. For most cases, use getUserBitlinks() instead.
 */
export async function getGroupBitlinks(
  groupGuid?: string,
  options: { size?: number; page?: number } = {}
): Promise<BitlyGroupLinksResponse> {
  // WHAT: Use configured organization GUID or require it as parameter
  const guid = groupGuid || config.bitlyOrganizationGuid;
  if (!guid) {
    throw new BitlyApiError(
      'BITLY_ORGANIZATION_GUID is not configured and not provided as parameter',
      undefined,
      undefined,
      false
    );
  }

  const params = new URLSearchParams();
  if (options.size) params.append('size', options.size.toString());
  if (options.page) params.append('page', options.page.toString());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await bitlyRequest<BitlyGroupLinksResponse>(
    `/groups/${guid}/bitlinks${queryString}`
  );
  
  return data;
}

/**
 * WHAT: Fetch aggregated click summary for a bitlink
 * WHY: Provides total and unique click counts for dashboard KPIs
 * REF: GET /v4/bitlinks/{bitlink}/clicks/summary
 */
export async function getClicksSummary(
  bitlink: string,
  options: { unit?: 'day' | 'week' | 'month'; units?: number; unit_reference?: string } = {}
): Promise<BitlyClicksSummary> {
  const normalized = normalizeBitlink(bitlink);
  const params = new URLSearchParams();
  
  if (options.unit) params.append('unit', options.unit);
  if (options.units) params.append('units', options.units.toString());
  if (options.unit_reference) params.append('unit_reference', options.unit_reference);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await bitlyRequest<BitlyClicksSummary>(
    `/bitlinks/${normalized}/clicks/summary${queryString}`
  );
  
  return data;
}

/**
 * WHAT: Fetch click timeseries data for trend visualization
 * WHY: Enables daily/weekly/monthly click charts in MessMass dashboards
 * REF: GET /v4/bitlinks/{bitlink}/clicks
 */
export async function getClicksSeries(
  bitlink: string,
  options: { unit?: 'day' | 'week' | 'month'; units?: number; unit_reference?: string } = {}
): Promise<BitlyClicksTimeseries> {
  const normalized = normalizeBitlink(bitlink);
  const params = new URLSearchParams();
  
  // WHAT: Default to daily granularity for detailed trend analysis
  params.append('unit', options.unit || 'day');
  if (options.units) params.append('units', options.units.toString());
  if (options.unit_reference) params.append('unit_reference', options.unit_reference);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await bitlyRequest<BitlyClicksTimeseries>(
    `/bitlinks/${normalized}/clicks${queryString}`
  );
  
  return data;
}

/**
 * WHAT: Fetch geographic distribution of clicks by country
 * WHY: Powers geographic analytics and country-level insights in event dashboards
 * REF: GET /v4/bitlinks/{bitlink}/countries
 */
export async function getCountries(
  bitlink: string,
  options: { unit?: 'day' | 'week' | 'month'; units?: number; unit_reference?: string } = {}
): Promise<BitlyCountriesResponse> {
  const normalized = normalizeBitlink(bitlink);
  const params = new URLSearchParams();
  
  if (options.unit) params.append('unit', options.unit);
  if (options.units) params.append('units', options.units.toString());
  if (options.unit_reference) params.append('unit_reference', options.unit_reference);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await bitlyRequest<BitlyCountriesResponse>(
    `/bitlinks/${normalized}/countries${queryString}`
  );
  
  return data;
}

/**
 * WHAT: Fetch referrer/traffic source breakdown (platform-level)
 * WHY: Enables campaign attribution and source tracking (social, email, direct, etc.)
 * REF: GET /v4/bitlinks/{bitlink}/referrers
 * 
 * EXAMPLES: "Instagram", "Facebook", "direct", "Google", "Bitly QR Code"
 */
export async function getReferrers(
  bitlink: string,
  options: { unit?: 'day' | 'week' | 'month'; units?: number; unit_reference?: string } = {}
): Promise<BitlyReferrersResponse> {
  const normalized = normalizeBitlink(bitlink);
  const params = new URLSearchParams();
  
  if (options.unit) params.append('unit', options.unit);
  if (options.units) params.append('units', options.units.toString());
  if (options.unit_reference) params.append('unit_reference', options.unit_reference);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await bitlyRequest<BitlyReferrersResponse>(
    `/bitlinks/${normalized}/referrers${queryString}`
  );
  
  return data;
}

/**
 * WHAT: Fetch referring domains breakdown (domain-level, more granular than referrers)
 * WHY: Provides detailed traffic source attribution at domain level
 * REF: GET /v4/bitlinks/{bitlink}/referring_domains
 * 
 * EXAMPLES:
 * - "l.instagram.com" (Instagram mobile app)
 * - "www.instagram.com" (Instagram web)
 * - "qr.partners.bit.ly" (QR code scans)
 * - "m.facebook.com" (Facebook mobile)
 * 
 * USE CASE: Distinguishes between mobile and web platforms for better attribution
 */
export async function getReferringDomains(
  bitlink: string,
  options: { unit?: 'day' | 'week' | 'month'; units?: number; unit_reference?: string } = {}
): Promise<BitlyReferringDomainsResponse> {
  const normalized = normalizeBitlink(bitlink);
  const params = new URLSearchParams();
  
  if (options.unit) params.append('unit', options.unit);
  if (options.units) params.append('units', options.units.toString());
  if (options.unit_reference) params.append('unit_reference', options.unit_reference);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await bitlyRequest<BitlyReferringDomainsResponse>(
    `/bitlinks/${normalized}/referring_domains${queryString}`
  );
  
  return data;
}

/**
 * WHAT: Convenience function to fetch all analytics for a bitlink in one call
 * WHY: Reduces API call count and simplifies sync operations
 * 
 * STRATEGY: Fetch all analytics endpoints in parallel for efficiency
 * ENDPOINTS: summary, timeseries, countries, referrers, referring_domains
 */
export async function getFullAnalytics(bitlink: string) {
  const normalized = normalizeBitlink(bitlink);
  
  // WHAT: Fetch all analytics data in parallel
  // WHY: Minimizes total time and respects rate limits by batching
  const [summary, series, countries, referrers, referring_domains] = await Promise.all([
    getClicksSummary(normalized, { unit: 'day', units: -1 }), // All-time summary
    getClicksSeries(normalized, { unit: 'day', units: 90 }), // Last 90 days of daily data
    getCountries(normalized, { unit: 'day', units: -1 }), // All-time by country
    getReferrers(normalized, { unit: 'day', units: -1 }), // All-time referrers (platform-level)
    getReferringDomains(normalized, { unit: 'day', units: -1 }), // All-time domains (granular)
  ]);

  return {
    summary,
    series,
    countries,
    referrers,
    referring_domains,
  };
}
