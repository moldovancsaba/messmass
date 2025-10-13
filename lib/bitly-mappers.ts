// lib/bitly-mappers.ts
// WHAT: Mapping and normalization utilities for Bitly API responses to MongoDB documents
// WHY: Ensures consistent data transformation and ISO 8601 timestamp compliance
// STRATEGY: Preserve all useful fields for future analytics extensibility while ensuring data quality

import { ObjectId } from 'mongodb';
import type {
  BitlyLinkMetadata,
  BitlyClicksSummary,
  BitlyClicksTimeseries,
  BitlyCountriesResponse,
  BitlyReferrersResponse,
} from './bitly.types';
import type { BitlyLinkDocument } from './bitly-db.types';
import { extractCampaign } from './bitly';

/**
 * WHAT: Convert ISO 8601 timestamp to include milliseconds if missing
 * WHY: MessMass standard requires millisecond precision (YYYY-MM-DDTHH:MM:SS.sssZ)
 * 
 * EXAMPLES:
 * - "2025-01-13T09:00:00Z" → "2025-01-13T09:00:00.000Z"
 * - "2025-01-13T09:00:00.123Z" → "2025-01-13T09:00:00.123Z" (unchanged)
 */
function ensureMilliseconds(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      // WHAT: Fallback to current timestamp if invalid
      // WHY: Prevents data corruption; logs warning for investigation
      console.warn(`[Bitly Mapper] Invalid timestamp: ${isoString}, using current time`);
      return new Date().toISOString();
    }
    return date.toISOString(); // Always includes milliseconds
  } catch {
    console.warn(`[Bitly Mapper] Failed to parse timestamp: ${isoString}, using current time`);
    return new Date().toISOString();
  }
}

/**
 * WHAT: Ensure number is finite and non-negative
 * WHY: Prevents NaN/Infinity in analytics data; ensures data quality
 */
function ensureFiniteNumber(value: number | undefined, defaultValue = 0): number {
  if (value === undefined || value === null || !Number.isFinite(value) || value < 0) {
    return defaultValue;
  }
  return value;
}

/**
 * WHAT: Map Bitly link metadata to MongoDB document structure
 * WHY: Transforms Bitly API response into MessMass database schema
 * 
 * USE CASE: Called when associating a new Bitly link with a project
 * 
 * STRATEGY:
 * - Extract all useful fields from Bitly metadata
 * - Parse UTM campaign parameters from long_url
 * - Initialize empty analytics structures (populated by sync)
 * - Set timestamps in ISO 8601 with milliseconds
 */
export function mapBitlyLinkToDoc(
  projectId: ObjectId | null,
  bitlyLink: BitlyLinkMetadata,
  customTitle?: string
): Omit<BitlyLinkDocument, '_id' | 'createdAt' | 'updatedAt'> {
  const now = new Date().toISOString();
  
  // WHAT: Extract campaign parameters from destination URL
  // WHY: Enables campaign attribution without additional API calls
  const campaign = extractCampaign(bitlyLink.long_url);
  
  return {
    projectId,
    
    // WHAT: Normalize bitlink to consistent format
    // WHY: Ensures queries work consistently (e.g., "bit.ly/abc" not "https://bit.ly/abc")
    bitlink: bitlyLink.id,
    link_id: bitlyLink.id, // Store Bitly's internal ID for reference
    long_url: bitlyLink.long_url,
    
    // WHAT: Use custom title if provided, fall back to Bitly title or generate from bitlink
    // WHY: Allows admins to override Bitly's title for MessMass context
    title: customTitle || bitlyLink.title || bitlyLink.id,
    
    // WHAT: Store group GUID if available
    // WHY: Supports multi-workspace filtering and organization
    group_guid: undefined, // Bitly API doesn't return this in link metadata, set during sync if needed
    
    tags: bitlyLink.tags || [],
    campaign,
    
    // WHAT: Convert Bitly's created_at to ISO 8601 with milliseconds
    // WHY: MessMass timestamp standard requires millisecond precision
    bitly_created_at: ensureMilliseconds(bitlyLink.created_at),
    
    // WHAT: Initialize click summary with zero values
    // WHY: Sync service will populate real data; prevents undefined errors
    click_summary: {
      total: 0,
      unique: 0,
      updatedAt: now,
    },
    
    // WHAT: Initialize empty analytics arrays
    // WHY: Sync service populates these; empty arrays prevent null reference errors
    clicks_timeseries: [],
    geo: {
      countries: [],
      cities: [],
    },
    referrers: [],
    
    // WHAT: Set lastSyncAt to epoch to trigger immediate sync
    // WHY: Indicates this link has never been synced
    lastSyncAt: new Date(0).toISOString(), // 1970-01-01T00:00:00.000Z
    lastClicksSyncedUntil: undefined,
    
    archived: bitlyLink.archived || false,
  };
}

/**
 * WHAT: Map Bitly clicks summary to MongoDB click_summary structure
 * WHY: Normalizes API response to consistent database format
 */
export function mapClicksSummary(response: BitlyClicksSummary) {
  const now = new Date().toISOString();
  
  return {
    total: ensureFiniteNumber(response.total_clicks),
    unique: undefined, // Bitly API doesn't provide unique clicks in summary
    updatedAt: now,
  };
}

/**
 * WHAT: Map Bitly clicks timeseries to MongoDB clicks_timeseries structure
 * WHY: Converts API response to daily click array, limited to last 365 days
 * 
 * STRATEGY:
 * - Keep only last 365 days to control document size
 * - Ensure all dates are ISO 8601 format (YYYY-MM-DD)
 * - Ensure all click counts are finite non-negative numbers
 */
export function mapSeriesToDaily(response: BitlyClicksTimeseries) {
  // WHAT: Filter to last 365 days and validate data
  // WHY: Controls MongoDB document size; 365 days sufficient for trend analysis
  const maxDays = 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxDays);
  
  return response.link_clicks
    .filter(metric => {
      // WHAT: Parse date and ensure it's within retention window
      try {
        const metricDate = new Date(metric.date);
        return metricDate >= cutoffDate;
      } catch {
        console.warn(`[Bitly Mapper] Invalid date in timeseries: ${metric.date}`);
        return false;
      }
    })
    .map(metric => ({
      // WHAT: Normalize date to YYYY-MM-DD format
      // WHY: Consistent date format for queries and aggregation
      date: metric.date.split('T')[0], // Extract date part only
      clicks: ensureFiniteNumber(metric.clicks),
    }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort chronologically
}

/**
 * WHAT: Map Bitly countries response to MongoDB geo.countries structure
 * WHY: Normalizes geographic data for analytics queries
 */
export function mapCountries(response: BitlyCountriesResponse) {
  return response.metrics.map(metric => ({
    country: metric.country, // ISO 3166-1 alpha-2 code (e.g., "US", "HU")
    clicks: ensureFiniteNumber(metric.clicks),
  }));
}

/**
 * WHAT: Map Bitly referrers response to MongoDB referrers structure
 * WHY: Normalizes traffic source data for attribution analysis
 * 
 * STRATEGY: Sort by click count descending to surface top sources
 */
export function mapReferrers(response: BitlyReferrersResponse) {
  return response.metrics
    .map(metric => ({
      referrer: metric.referrer || 'direct', // Default to 'direct' if undefined
      clicks: ensureFiniteNumber(metric.clicks),
    }))
    .sort((a, b) => b.clicks - a.clicks); // Sort by clicks descending
}

/**
 * WHAT: Calculate the date boundary for incremental timeseries sync
 * WHY: Enables efficient sync by only fetching new data since last sync
 * 
 * LOGIC:
 * - If lastClicksSyncedUntil exists → fetch from day after that date
 * - Otherwise → fetch last 90 days
 * 
 * RETURNS: ISO 8601 date string (YYYY-MM-DD) representing the start of sync window
 */
export function calculateSyncStartDate(lastClicksSyncedUntil?: string): string {
  if (lastClicksSyncedUntil) {
    // WHAT: Fetch from day after last synced date
    // WHY: Avoids re-fetching already synced days
    const lastSyncDate = new Date(lastClicksSyncedUntil);
    lastSyncDate.setDate(lastSyncDate.getDate() + 1);
    return lastSyncDate.toISOString().split('T')[0];
  }
  
  // WHAT: No previous sync → fetch last 90 days
  // WHY: Reasonable default for initial sync; balances data volume and API calls
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  return ninetyDaysAgo.toISOString().split('T')[0];
}

/**
 * WHAT: Calculate the number of days between two dates
 * WHY: Determines `units` parameter for Bitly API calls
 */
export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays); // At least 1 day
}

/**
 * WHAT: Merge new timeseries data with existing data
 * WHY: Preserves historical data while adding new days
 * 
 * STRATEGY:
 * - Create map of existing data by date
 * - Overlay new data (overwrites if date exists)
 * - Keep only last 365 days
 * - Sort chronologically
 */
export function mergeTimeseries(
  existing: Array<{ date: string; clicks: number }>,
  newData: Array<{ date: string; clicks: number }>
): Array<{ date: string; clicks: number }> {
  // WHAT: Create map of all data points by date
  const dataMap = new Map<string, number>();
  
  // WHAT: Add existing data to map
  existing.forEach(point => {
    dataMap.set(point.date, point.clicks);
  });
  
  // WHAT: Overlay new data (overwrites if date already exists)
  // WHY: New data is more authoritative than stale cached data
  newData.forEach(point => {
    dataMap.set(point.date, point.clicks);
  });
  
  // WHAT: Convert map back to array, filter to last 365 days, and sort
  const maxDays = 365;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxDays);
  
  return Array.from(dataMap.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= cutoffDate;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
