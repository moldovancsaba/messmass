// lib/bitly.types.ts
// WHAT: TypeScript interfaces for Bitly API v4 responses
// WHY: Provides type safety and IntelliSense for Bitly API integration, narrowly scoped to fields we consume
// REF: https://dev.bitly.com/api-reference/

/**
 * Bitlink metadata response
 * REF: GET /v4/bitlinks/{bitlink}
 * WHAT: Core information about a shortened Bitly link
 */
export interface BitlyLinkMetadata {
  id: string; // Full bitlink (e.g., "bit.ly/3fK8Lm2")
  link: string; // Full short URL with https
  long_url: string; // Original destination URL
  title?: string; // Custom title for the link
  created_at: string; // ISO 8601 timestamp
  tags?: string[]; // User-defined tags
  deeplinks?: {
    // Deep links for mobile apps (optional, not primary focus)
    app_id?: string;
    app_uri_path?: string;
    install_url?: string;
    install_type?: string;
  }[];
  custom_bitlinks?: string[]; // Custom branded short links
  archived?: boolean; // Whether link is archived
}

/**
 * Group bitlinks list response
 * REF: GET /v4/groups/{group_guid}/bitlinks
 * WHAT: Paginated list of bitlinks in a workspace/group
 */
export interface BitlyGroupLinksResponse {
  links: BitlyLinkMetadata[];
  pagination?: {
    total?: number;
    page?: number;
    size?: number;
    prev?: string; // Previous page URL
    next?: string; // Next page URL
  };
}

/**
 * Clicks summary response
 * REF: GET /v4/bitlinks/{bitlink}/clicks/summary
 * WHAT: Aggregated click statistics for a bitlink
 */
export interface BitlyClicksSummary {
  total_clicks: number; // All clicks including duplicates
  unit_reference?: string; // ISO 8601 date reference
  units?: number; // Number of time units in the summary
  unit?: 'day' | 'week' | 'month'; // Time unit for aggregation
}

/**
 * Individual click metric for timeseries
 * WHAT: Single data point in a timeseries representing clicks for a specific period
 */
export interface BitlyClickMetric {
  clicks: number; // Number of clicks in this period
  date: string; // ISO 8601 timestamp for the period
}

/**
 * Clicks timeseries response
 * REF: GET /v4/bitlinks/{bitlink}/clicks
 * WHAT: Time-based click data for trend analysis
 * WHY: Enables daily/weekly/monthly trend visualization in MessMass dashboards
 */
export interface BitlyClicksTimeseries {
  link_clicks: BitlyClickMetric[]; // Array of click metrics over time
  unit_reference?: string; // ISO 8601 date reference
  units?: number; // Number of time units returned
  unit?: 'day' | 'week' | 'month' | 'hour' | 'minute'; // Time unit granularity
}

/**
 * Individual country click metric
 * WHAT: Click count for a specific country
 */
export interface BitlyCountryMetric {
  country: string; // ISO 3166-1 alpha-2 country code (e.g., "US", "HU")
  clicks: number; // Number of clicks from this country
}

/**
 * Countries response
 * REF: GET /v4/bitlinks/{bitlink}/countries
 * WHAT: Geographic distribution of clicks by country
 * WHY: Powers geographic analytics and heat maps in event dashboards
 */
export interface BitlyCountriesResponse {
  metrics: BitlyCountryMetric[]; // Array of country-level click metrics
  unit_reference?: string; // ISO 8601 date reference
  units?: number; // Number of time units
  unit?: 'day' | 'week' | 'month'; // Time unit for aggregation
}

/**
 * Individual city click metric (optional, Growth tier may have limited data)
 * WHAT: Click count for a specific city
 */
export interface BitlyCityMetric {
  city: string; // City name
  country?: string; // ISO 3166-1 alpha-2 country code
  clicks: number; // Number of clicks from this city
}

/**
 * Cities response (optional endpoint, may not be available in all tiers)
 * REF: GET /v4/bitlinks/{bitlink}/cities
 * WHAT: City-level geographic distribution of clicks
 */
export interface BitlyCitiesResponse {
  metrics: BitlyCityMetric[]; // Array of city-level click metrics
  unit_reference?: string;
  units?: number;
  unit?: 'day' | 'week' | 'month';
}

/**
 * Individual referrer click metric
 * WHAT: Click count for a specific referrer/traffic source
 */
export interface BitlyReferrerMetric {
  referrer: string; // Referrer domain or "direct" for direct traffic
  clicks: number; // Number of clicks from this referrer
}

/**
 * Referrers response
 * REF: GET /v4/bitlinks/{bitlink}/referrers
 * WHAT: Traffic source breakdown showing where clicks originated
 * WHY: Enables campaign attribution and source tracking in event analytics
 */
export interface BitlyReferrersResponse {
  metrics: BitlyReferrerMetric[]; // Array of referrer-level click metrics
  unit_reference?: string; // ISO 8601 date reference
  units?: number; // Number of time units
  unit?: 'day' | 'week' | 'month'; // Time unit for aggregation
}

/**
 * Error response from Bitly API
 * WHAT: Standard error structure returned by Bitly on failures
 * WHY: Enables consistent error handling and user-friendly error messages
 */
export interface BitlyErrorResponse {
  message: string; // Human-readable error description
  description?: string; // Additional error details
  resource?: string; // API endpoint that failed
  errors?: Array<{
    field?: string; // Field that caused the error
    message?: string; // Field-specific error message
  }>;
}

/**
 * Rate limit information from response headers
 * WHAT: Rate limiting metadata extracted from X-RateLimit-* headers
 * WHY: Allows proactive rate limit management and backoff strategies
 */
export interface BitlyRateLimitInfo {
  limit: number; // Total requests allowed per time window
  remaining: number; // Requests remaining in current window
  reset: number; // Unix timestamp when rate limit resets
}

/**
 * UTM campaign parameters extracted from long_url
 * WHAT: Standard UTM tracking parameters for marketing attribution
 * WHY: Enables campaign performance tracking within MessMass analytics
 */
export interface BitlyCampaign {
  utm_source?: string; // Campaign source (e.g., "facebook", "email")
  utm_medium?: string; // Campaign medium (e.g., "social", "cpc")
  utm_campaign?: string; // Campaign name (e.g., "summer_promo")
  utm_term?: string; // Paid keywords (e.g., "event+tickets")
  utm_content?: string; // Content variant (e.g., "banner_a", "link_text")
}
