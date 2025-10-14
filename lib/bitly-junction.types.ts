/**
 * bitly-junction.types.ts
 * 
 * TypeScript types for the many-to-many junction table between Bitly links and projects.
 * 
 * WHY: Bitly links can be reused across multiple events/projects. Each link-project association
 * requires temporal segmentation to attribute analytics data to the correct event period.
 * 
 * WHAT: Defines the schema for storing link-project associations with:
 * - Date ranges (startDate/endDate) - nullable for infinity bounds
 * - Auto-calculation metadata
 * - Cached aggregated metrics per event period
 * - Timestamps for data freshness tracking
 */

import { ObjectId } from 'mongodb';

/**
 * Represents a single association between a Bitly link and a project/event
 * with temporal boundaries and cached analytics metrics.
 * 
 * Collection name: bitly_project_links
 */
export interface BitlyProjectLink {
  _id: ObjectId;
  
  // Link references
  bitlyLinkId: ObjectId;          // Reference to bitly_links collection
  projectId: ObjectId;             // Reference to projects collection
  
  // Temporal boundaries for data attribution
  // null = infinity (unbounded)
  startDate: string | null;        // ISO 8601 with milliseconds (YYYY-MM-DDTHH:MM:SS.sssZ) or null for -∞
  endDate: string | null;          // ISO 8601 with milliseconds (YYYY-MM-DDTHH:MM:SS.sssZ) or null for +∞
  
  // Metadata
  autoCalculated: boolean;         // True if date ranges computed by algorithm, false if manually set
  
  // Cached aggregated metrics for this event period
  // These are recomputed when:
  // - Bitly sync completes (new data available)
  // - Event date changes (date range boundaries change)
  // - Manual refresh requested
  cachedMetrics: BitlyProjectMetrics;
  
  // Timestamps
  createdAt: string;               // ISO 8601 with milliseconds
  updatedAt: string;               // ISO 8601 with milliseconds
  lastSyncedAt: string | null;    // ISO 8601 with milliseconds - when cachedMetrics last refreshed
}

/**
 * Aggregated Bitly metrics for a specific project-link association,
 * filtered by the date range (startDate to endDate).
 * 
 * WHY: Pre-computed aggregates avoid expensive date-range filtering on every query.
 * These are cached snapshots updated after sync or recalculation.
 */
export interface BitlyProjectMetrics {
  // Core click metrics
  clicks: number;                  // Total clicks in date range
  uniqueClicks: number;            // Unique visitors in date range
  
  // Geographic data
  // Top countries with click counts in this period
  topCountries: Array<{
    country: string;               // ISO 3166-1 alpha-2 code (e.g., "US", "GB")
    clicks: number;
  }>;
  
  // Traffic source data
  // Top referring domains in this period
  topReferrers: Array<{
    domain: string;                // e.g., "facebook.com", "direct" for direct traffic
    clicks: number;
  }>;
  
  // Device type distribution
  deviceClicks: {
    mobile: number;
    desktop: number;
    tablet: number;
    other: number;
  };
  
  // Browser distribution
  browserClicks: {
    chrome: number;
    firefox: number;
    safari: number;
    edge: number;
    other: number;
  };
  
  // Timeseries data (daily clicks within date range)
  // Useful for charting trends within the event period
  dailyClicks: Array<{
    date: string;                  // ISO 8601 date (YYYY-MM-DD)
    clicks: number;
  }>;
}

/**
 * Input type for creating a new link-project association.
 * Used by APIs and migration scripts.
 */
export interface CreateBitlyProjectLinkInput {
  bitlyLinkId: ObjectId;
  projectId: ObjectId;
  startDate?: string | null;       // Optional - if omitted, will be auto-calculated
  endDate?: string | null;         // Optional - if omitted, will be auto-calculated
  autoCalculated?: boolean;        // Optional - defaults to true
}

/**
 * Input type for updating date ranges on an existing association.
 * Allows manual override of auto-calculated ranges.
 */
export interface UpdateBitlyProjectLinkInput {
  startDate?: string | null;
  endDate?: string | null;
  autoCalculated?: boolean;        // Set to false if manually overriding
}

/**
 * Result of date range calculation for a single project.
 * Used by the date calculator service.
 */
export interface CalculatedDateRange {
  projectId: ObjectId;
  startDate: string | null;        // null = -∞
  endDate: string | null;          // null = +∞
}

/**
 * Database indexes for optimal query performance.
 * 
 * Required indexes on bitly_project_links collection:
 * 
 * 1. Compound index for link-to-projects lookup:
 *    { bitlyLinkId: 1, projectId: 1 } (unique)
 * 
 * 2. Index for project-to-links lookup:
 *    { projectId: 1 }
 * 
 * 3. Index for finding stale cached data:
 *    { lastSyncedAt: 1 }
 * 
 * 4. Index for auto-calculated associations:
 *    { bitlyLinkId: 1, autoCalculated: 1 }
 */

/**
 * Aggregation pipeline helper types
 */

/**
 * Options for aggregating metrics from raw Bitly data.
 */
export interface AggregationOptions {
  bitlyLinkId: ObjectId;
  startDate: string | null;        // null = include all data before endDate
  endDate: string | null;          // null = include all data after startDate
  includeTimeseries?: boolean;     // Whether to include dailyClicks array (can be expensive)
}

/**
 * Result of metric aggregation from raw Bitly analytics data.
 * This is the output of the aggregation service that populates cachedMetrics.
 */
export type AggregatedMetricsResult = BitlyProjectMetrics;
