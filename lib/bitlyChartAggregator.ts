// lib/bitlyChartAggregator.ts
// WHAT: Aggregate Bitly geographic data across all links associated with a project
// WHY: A project may have multiple Bitly links (different campaigns, URLs),
//      and charts need to show combined metrics from ALL links for a holistic view
// HOW: Fetch junction table entries, merge topCountries arrays, sum clicks by country

import { ObjectId } from 'mongodb';
import { getDb } from './db';
import { isoToCountryName } from './isoCountryToName';

/**
 * WHAT: Type definition for Bitly cached country metrics
 * WHY: TypeScript needs explicit types for junction.cachedMetrics.topCountries
 */
interface BitlyCachedCountry {
  country: string;  // ISO 3166-1 alpha-2 code (e.g., "US")
  clicks: number;   // Click count for this country
}

interface BitlyCachedMetrics {
  clicks?: number;
  topCountries?: BitlyCachedCountry[];
  // ... other cached metrics fields
}

interface BitlyProjectLink {
  _id: ObjectId;
  projectId: ObjectId;
  bitlyLink: string;
  cachedMetrics?: BitlyCachedMetrics;
  // ... other junction fields
}

/**
 * WHAT: Aggregated country data for chart display
 * WHY: Chart components need structured data with both ISO code and full name
 */
export interface AggregatedCountry {
  isoCode: string;          // ISO 3166-1 alpha-2 code (e.g., "US", "HU")
  countryName: string;      // Full country name (e.g., "United States", "Hungary")
  clicks: number;           // Total click count across all Bitly links
}

/**
 * WHAT: Result structure for aggregated Bitly country data
 * WHY: Charts need different views: top 5 list, single top country, total count
 */
export interface BitlyCountryAggregation {
  top5: AggregatedCountry[];           // Top 5 countries by clicks (for bar charts)
  topCountry: AggregatedCountry | null; // #1 country (for KPI chart)
  totalCountries: number;               // Total unique countries (for reach metrics)
  allCountries: AggregatedCountry[];    // Complete list (for advanced analytics)
}

/**
 * WHAT: Aggregate Bitly country data across all links for a project
 * WHY: Projects can have multiple Bitly links, and charts need unified view
 * 
 * PROCESS:
 * 1. Fetch all bitly_project_links entries for this project
 * 2. Extract cachedMetrics.topCountries from each link
 * 3. Merge by summing clicks per country (ISO code)
 * 4. Convert ISO codes to full country names
 * 5. Sort by clicks descending
 * 6. Return structured data for charts
 * 
 * @param projectId - MongoDB ObjectId of the project
 * @returns Aggregated country data with top 5, top 1, and total count
 * 
 * PERFORMANCE:
 * - Efficient MongoDB query (indexed by projectId)
 * - In-memory aggregation using Map for O(n) complexity
 * - Only processes cached metrics (no raw Bitly API calls)
 * 
 * EDGE CASES:
 * - No Bitly links → Returns empty arrays, null topCountry, 0 count
 * - Null country codes in data → Filtered out (invalid entries)
 * - Same country across multiple links → Clicks summed correctly
 * - Unknown ISO codes → Uses ISO code as fallback name
 */
export async function aggregateBitlyCountries(
  projectId: ObjectId | string
): Promise<BitlyCountryAggregation> {
  const db = await getDb();
  
  // WHAT: Convert string projectId to ObjectId if needed
  // WHY: MongoDB queries require ObjectId type
  const projectObjectId = typeof projectId === 'string' 
    ? new ObjectId(projectId) 
    : projectId;

  // WHAT: Fetch all Bitly link associations for this project
  // WHY: Need cachedMetrics.topCountries from each link
  // PERFORMANCE: Uses index on { projectId: 1 } for fast lookup
  const junctions = await db
    .collection('bitly_project_links')
    .find({ projectId: projectObjectId })
    .toArray() as BitlyProjectLink[];

  // WHAT: Handle case where project has no Bitly links
  // WHY: Charts need to handle empty state gracefully
  if (junctions.length === 0) {
    return {
      top5: [],
      topCountry: null,
      totalCountries: 0,
      allCountries: []
    };
  }

  // WHAT: Merge topCountries arrays from all links, summing clicks per country
  // WHY: Multiple links may have overlapping countries, need to combine data
  // PERFORMANCE: Map provides O(1) lookup and update, total O(n) complexity
  const countryClickMap = new Map<string, number>();

  junctions.forEach((junction) => {
    const topCountries = junction.cachedMetrics?.topCountries || [];
    
    topCountries.forEach(({ country, clicks }) => {
      // WHAT: Skip null/undefined country codes (data quality issue)
      // WHY: Bitly API sometimes returns null (see BITLY_COUNTRY_DATA_STORAGE.md)
      if (!country) return;

      // WHAT: Sum clicks for each unique country
      // WHY: Country may appear in multiple links
      const existingClicks = countryClickMap.get(country) || 0;
      countryClickMap.set(country, existingClicks + clicks);
    });
  });

  // WHAT: Convert Map to sorted array with full country names
  // WHY: Charts need ordered data with display-ready labels
  const sortedCountries = Array.from(countryClickMap.entries())
    .map(([isoCode, clicks]) => ({
      isoCode,
      countryName: isoToCountryName(isoCode), // Convert "US" → "United States"
      clicks
    }))
    .sort((a, b) => b.clicks - a.clicks); // Sort descending by clicks

  // WHAT: Extract top 5 for bar charts
  // WHY: Bar charts are limited to 5 elements per existing chart system
  const top5 = sortedCountries.slice(0, 5);

  // WHAT: Extract top country for KPI chart
  // WHY: KPI charts display single value (country name + click count)
  const topCountry = sortedCountries[0] || null;

  // WHAT: Count total unique countries for reach metrics
  // WHY: "Countries Reached" metric shows geographic distribution breadth
  const totalCountries = sortedCountries.length;

  return {
    top5,
    topCountry,
    totalCountries,
    allCountries: sortedCountries // Keep full list for advanced use cases
  };
}

/**
 * WHAT: Get total Bitly clicks across all links for a project
 * WHY: Useful for summary statistics and chart totals
 * 
 * @param projectId - MongoDB ObjectId of the project
 * @returns Total click count summed across all associated Bitly links
 * 
 * PERFORMANCE: Single MongoDB query with projection (only fetch clicks field)
 */
export async function getTotalBitlyClicks(
  projectId: ObjectId | string
): Promise<number> {
  const db = await getDb();
  
  const projectObjectId = typeof projectId === 'string' 
    ? new ObjectId(projectId) 
    : projectId;

  // WHAT: Fetch only cachedMetrics.clicks from all junctions
  // WHY: Avoid loading entire documents when only clicks needed
  const junctions = await db
    .collection('bitly_project_links')
    .find(
      { projectId: projectObjectId },
      { projection: { 'cachedMetrics.clicks': 1 } }
    )
    .toArray() as BitlyProjectLink[];

  // WHAT: Sum clicks across all links
  // WHY: Total represents combined performance across all Bitly campaigns
  const totalClicks = junctions.reduce(
    (sum, junction) => sum + (junction.cachedMetrics?.clicks || 0),
    0
  );

  return totalClicks;
}

/**
 * WHAT: Check if project has any Bitly links configured
 * WHY: Charts can conditionally hide/show based on data availability
 * 
 * @param projectId - MongoDB ObjectId of the project
 * @returns true if project has at least one Bitly link, false otherwise
 * 
 * PERFORMANCE: Uses countDocuments() with limit 1 for fast existence check
 */
export async function hasAnyBitlyLinks(
  projectId: ObjectId | string
): Promise<boolean> {
  const db = await getDb();
  
  const projectObjectId = typeof projectId === 'string' 
    ? new ObjectId(projectId) 
    : projectId;

  // WHAT: Count with limit=1 for fast existence check
  // WHY: More efficient than fetching entire documents
  const count = await db
    .collection('bitly_project_links')
    .countDocuments({ projectId: projectObjectId }, { limit: 1 });

  return count > 0;
}
