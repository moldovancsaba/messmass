/**
 * bitly-aggregator.ts
 * 
 * Service for aggregating and filtering Bitly analytics data by date ranges.
 * 
 * WHY: When a Bitly link is shared across multiple events, we need to attribute
 * clicks and analytics to the correct event based on temporal boundaries.
 * This service filters raw Bitly timeseries/geo/referrer data by date ranges
 * and produces cached aggregated metrics for each event period.
 * 
 * WHAT: Core functions:
 * - Filter timeseries data by date range (null = infinity)
 * - Aggregate geographic, referrer, device, browser data within date bounds
 * - Sum total clicks and unique clicks for the period
 * - Produce BitlyProjectMetrics ready for caching in junction table
 */

import { ObjectId } from 'mongodb';
import { getDb } from './db';
import type { BitlyLinkDocument } from './bitly-db.types';
import type {
  AggregationOptions,
  AggregatedMetricsResult,
  BitlyProjectMetrics,
} from './bitly-junction.types';

/**
 * Aggregate Bitly metrics for a specific link filtered by date range.
 * 
 * WHY: This is the core function that powers cached metrics in the junction table.
 * It filters all raw analytics data (timeseries, geo, referrers, etc.) by the
 * provided date range and returns aggregated totals.
 * 
 * WHAT:
 * - Fetches raw Bitly link data from bitly_links collection
 * - Filters timeseries by startDate/endDate (null = unbounded)
 * - Aggregates clicks, countries, referrers within date range
 * - Returns structured metrics ready for caching
 * 
 * @param options - Aggregation parameters including bitlink ID and date range
 * @returns Aggregated metrics for the specified period
 * @throws Error if bitly_links document not found
 */
export async function aggregateMetricsByDateRange(
  options: AggregationOptions
): Promise<AggregatedMetricsResult> {
  const { bitlyLinkId, startDate, endDate, includeTimeseries = true } = options;

  // Fetch raw Bitly link document with all analytics data
  const db = await getDb();
  const linkDoc = await db.collection<BitlyLinkDocument>('bitly_links').findOne({
    _id: bitlyLinkId,
  });

  if (!linkDoc) {
    throw new Error(`Bitly link not found: ${bitlyLinkId.toString()}`);
  }

  // Filter timeseries data by date range
  // WHY: Timeseries is the foundation - all other metrics are derived from filtered dates
  const filteredTimeseries = filterTimeseriesByDateRange(
    linkDoc.clicks_timeseries || [],
    startDate,
    endDate
  );

  // Extract date strings for matching against other data
  // WHY: Some analytics data (geo, referrers) may have timestamps we need to filter
  const dateSet = new Set(filteredTimeseries.map((d) => d.date));

  // Calculate total clicks from filtered timeseries
  // WHY: Sum of daily clicks = total clicks for the period
  const totalClicks = filteredTimeseries.reduce((sum, day) => sum + day.clicks, 0);

  // Estimate unique clicks proportionally
  // WHY: Bitly doesn't provide daily unique clicks, so we estimate based on
  // the ratio of filtered clicks to total clicks
  const uniqueClicks = estimateUniqueClicks(
    totalClicks,
    linkDoc.click_summary.total || 0,
    linkDoc.click_summary.unique || 0
  );

  // Aggregate geographic data
  // WHY: Countries data in Bitly is cumulative, so we estimate proportionally
  const topCountries = aggregateCountries(
    linkDoc.geo.countries || [],
    totalClicks,
    linkDoc.click_summary.total || 0
  );

  // Aggregate traffic source data
  // WHY: Referrers are cumulative, estimate proportionally based on filtered clicks
  const topReferrers = aggregateReferrers(
    linkDoc.referring_domains || linkDoc.referrers || [],
    totalClicks,
    linkDoc.click_summary.total || 0
  );

  // Aggregate device and browser data
  // WHY: Bitly doesn't store historical device/browser timeseries, so we estimate
  // proportionally based on current cumulative distribution
  const deviceClicks = estimateDeviceClicks(
    totalClicks,
    linkDoc.click_summary.total || 0
  );
  const browserClicks = estimateBrowserClicks(
    totalClicks,
    linkDoc.click_summary.total || 0
  );

  // Construct final aggregated metrics
  const metrics: BitlyProjectMetrics = {
    clicks: totalClicks,
    uniqueClicks,
    topCountries,
    topReferrers,
    deviceClicks,
    browserClicks,
    dailyClicks: includeTimeseries ? filteredTimeseries : [],
  };

  return metrics;
}

/**
 * Filter timeseries data by date range.
 * 
 * WHY: Core filtering logic that handles null (infinity) boundaries correctly.
 * 
 * WHAT:
 * - startDate = null means include all data from beginning of time
 * - endDate = null means include all data until end of time
 * - Both null means include ALL data
 * 
 * @param timeseries - Array of daily click records
 * @param startDate - ISO 8601 date string or null for -∞
 * @param endDate - ISO 8601 date string or null for +∞
 * @returns Filtered timeseries array
 */
function filterTimeseriesByDateRange(
  timeseries: Array<{ date: string; clicks: number }>,
  startDate: string | null,
  endDate: string | null
): Array<{ date: string; clicks: number }> {
  return timeseries.filter((day) => {
    // Handle null boundaries (infinity)
    if (startDate && day.date < startDate.substring(0, 10)) {
      return false; // Before start date
    }
    if (endDate && day.date > endDate.substring(0, 10)) {
      return false; // After end date
    }
    return true; // Within bounds
  });
}

/**
 * Estimate unique clicks proportionally based on filtered total clicks.
 * 
 * WHY: Bitly API provides cumulative unique clicks but not daily breakdown.
 * We estimate unique clicks for the date range proportionally.
 * 
 * FORMULA: uniqueFiltered ≈ (clicksFiltered / clicksTotal) × uniqueTotal
 * 
 * @param filteredClicks - Total clicks in filtered date range
 * @param totalClicks - Total clicks for entire link lifetime
 * @param totalUnique - Total unique clicks for entire link lifetime
 * @returns Estimated unique clicks for the date range
 */
function estimateUniqueClicks(
  filteredClicks: number,
  totalClicks: number,
  totalUnique: number
): number {
  if (totalClicks === 0 || totalUnique === 0) {
    return 0;
  }

  // Proportional estimation
  const ratio = filteredClicks / totalClicks;
  return Math.round(ratio * totalUnique);
}

/**
 * Aggregate country data proportionally for the filtered date range.
 * 
 * WHY: Bitly geographic data is cumulative (not time-segmented).
 * We estimate country clicks proportionally based on filtered total clicks.
 * 
 * FORMULA: countryClicksFiltered ≈ (countryClicks / totalClicks) × filteredClicks
 * 
 * @param countries - Cumulative country click data
 * @param filteredClicks - Total clicks in filtered date range
 * @param totalClicks - Total clicks for entire link lifetime
 * @returns Top countries with estimated clicks in date range
 */
function aggregateCountries(
  countries: Array<{ country: string; clicks: number }>,
  filteredClicks: number,
  totalClicks: number
): Array<{ country: string; clicks: number }> {
  if (totalClicks === 0 || filteredClicks === 0) {
    return [];
  }

  const ratio = filteredClicks / totalClicks;

  return countries
    .map((c) => ({
      country: c.country,
      clicks: Math.round(c.clicks * ratio), // Proportional estimation
    }))
    .filter((c) => c.clicks > 0) // Remove zero-click countries
    .sort((a, b) => b.clicks - a.clicks) // Sort descending by clicks
    .slice(0, 10); // Keep top 10
}

/**
 * Aggregate referrer/domain data proportionally for the filtered date range.
 * 
 * WHY: Bitly referrer data is cumulative (not time-segmented).
 * We estimate referrer clicks proportionally based on filtered total clicks.
 * 
 * @param referrers - Cumulative referrer click data
 * @param filteredClicks - Total clicks in filtered date range
 * @param totalClicks - Total clicks for entire link lifetime
 * @returns Top referrers with estimated clicks in date range
 */
function aggregateReferrers(
  referrers: Array<{ domain?: string; referrer?: string; clicks: number }>,
  filteredClicks: number,
  totalClicks: number
): Array<{ domain: string; clicks: number }> {
  if (totalClicks === 0 || filteredClicks === 0) {
    return [];
  }

  const ratio = filteredClicks / totalClicks;

  return referrers
    .map((r) => ({
      domain: r.domain || r.referrer || 'unknown', // Handle both formats
      clicks: Math.round(r.clicks * ratio), // Proportional estimation
    }))
    .filter((r) => r.clicks > 0) // Remove zero-click referrers
    .sort((a, b) => b.clicks - a.clicks) // Sort descending by clicks
    .slice(0, 10); // Keep top 10
}

/**
 * Estimate device distribution for the filtered date range.
 * 
 * WHY: Bitly doesn't store historical device timeseries data in our current schema.
 * For now, we return zero values. Future enhancement: store device data in bitly_links.
 * 
 * TODO: Implement actual device data storage and proportional estimation
 * 
 * @param filteredClicks - Total clicks in filtered date range
 * @param totalClicks - Total clicks for entire link lifetime
 * @returns Device click distribution (currently placeholder zeros)
 */
function estimateDeviceClicks(
  filteredClicks: number,
  totalClicks: number
): {
  mobile: number;
  desktop: number;
  tablet: number;
  other: number;
} {
  // TODO: Implement device data storage and estimation
  // For now, return zeros since device data not yet collected
  return {
    mobile: 0,
    desktop: 0,
    tablet: 0,
    other: 0,
  };
}

/**
 * Estimate browser distribution for the filtered date range.
 * 
 * WHY: Bitly doesn't store historical browser timeseries data in our current schema.
 * For now, we return zero values. Future enhancement: store browser data in bitly_links.
 * 
 * TODO: Implement actual browser data storage and proportional estimation
 * 
 * @param filteredClicks - Total clicks in filtered date range
 * @param totalClicks - Total clicks for entire link lifetime
 * @returns Browser click distribution (currently placeholder zeros)
 */
function estimateBrowserClicks(
  filteredClicks: number,
  totalClicks: number
): {
  chrome: number;
  firefox: number;
  safari: number;
  edge: number;
  other: number;
} {
  // TODO: Implement browser data storage and estimation
  // For now, return zeros since browser data not yet collected
  return {
    chrome: 0,
    firefox: 0,
    safari: 0,
    edge: 0,
    other: 0,
  };
}

/**
 * Batch aggregate metrics for multiple link-project associations.
 * 
 * WHY: Efficient bulk processing when recalculating metrics for many associations
 * at once (e.g., after full sync or bulk event updates).
 * 
 * WHAT:
 * - Takes array of association specs (bitlink ID + date range)
 * - Aggregates metrics for each in parallel
 * - Returns array of results matching input order
 * 
 * @param associations - Array of aggregation options for batch processing
 * @returns Array of aggregated metrics results
 */
export async function batchAggregateMetrics(
  associations: AggregationOptions[]
): Promise<AggregatedMetricsResult[]> {
  // Process all aggregations in parallel for performance
  // WHY: Each aggregation is independent, no shared state
  const results = await Promise.all(
    associations.map((opts) => aggregateMetricsByDateRange(opts))
  );

  return results;
}

/**
 * Get empty metrics placeholder for new associations.
 * 
 * WHY: When creating new link-project associations, we need an initial
 * metrics object before first aggregation completes.
 * 
 * @returns Empty metrics structure with zero values
 */
export function getEmptyMetrics(): BitlyProjectMetrics {
  return {
    clicks: 0,
    uniqueClicks: 0,
    topCountries: [],
    topReferrers: [],
    deviceClicks: {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0,
    },
    browserClicks: {
      chrome: 0,
      firefox: 0,
      safari: 0,
      edge: 0,
      other: 0,
    },
    dailyClicks: [],
  };
}
