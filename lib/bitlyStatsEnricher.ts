/**
 * Bitly Stats Enrichment Service
 * 
 * WHAT: Aggregates Bitly country data and enriches project.stats with top 5 countries
 * WHY: Charts need camelCase fields in project.stats for standard formula evaluation
 * HOW: Fetches bitly_project_links, aggregates topCountries, converts ISO to names
 * 
 * PATTERN: Follows projectStatsUtils.ts pattern for consistency with existing enrichment
 */

import { ObjectId } from 'mongodb';
import { aggregateBitlyCountries } from './bitlyChartAggregator';

/**
 * WHAT: Enrichment object containing Bitly country fields for project.stats
 * WHY: Charts need these fields to display top 5 countries with camelCase naming
 * 
 * FIELDS:
 * - bitlyCountry1-5: Country names (e.g., "United States", "Hungary")
 * - bitlyCountry1-5Clicks: Click counts per country
 * - bitlyCountryCount: Total unique countries (already exists)
 * - bitlyTopCountry: #1 country name (already exists)
 * - bitlyClicksByCountry: #1 country click count (already exists)
 */
export interface BitlyStatsEnrichment {
  // Top 5 countries with names and clicks
  bitlyCountry1?: string;
  bitlyCountry1Clicks?: number;
  bitlyCountry2?: string;
  bitlyCountry2Clicks?: number;
  bitlyCountry3?: string;
  bitlyCountry3Clicks?: number;
  bitlyCountry4?: string;
  bitlyCountry4Clicks?: number;
  bitlyCountry5?: string;
  bitlyCountry5Clicks?: number;
  
  // Summary fields (these already exist in schema, but we update them)
  bitlyCountryCount: number;      // Total unique countries
  bitlyTopCountry: string;        // #1 country name
  bitlyClicksByCountry: number;   // #1 country clicks
}

/**
 * WHAT: Enrich project.stats with Bitly country data from junction table
 * WHY: Charts use project.stats fields, not junction table data
 * HOW: Aggregates all bitly_project_links for project, extracts top 5 countries
 * 
 * @param projectId - MongoDB ObjectId of the project
 * @returns Enrichment object with top 5 countries + summary fields
 * 
 * USAGE:
 * ```typescript
 * const enrichment = await enrichProjectStatsWithBitlyCountries(projectId);
 * await db.collection('projects').updateOne(
 *   { _id: projectId },
 *   { $set: { 'stats.bitlyCountry1': enrichment.bitlyCountry1, ... } }
 * );
 * ```
 * 
 * PERFORMANCE:
 * - Single MongoDB query to fetch junction entries
 * - In-memory aggregation using Map (O(n) complexity)
 * - ISO-to-name conversion via optimized lookup table
 * 
 * EDGE CASES:
 * - No Bitly links → Returns empty enrichment (all fields undefined/0)
 * - Less than 5 countries → Only populates available countries
 * - Null country codes → Filtered out during aggregation
 */
export async function enrichProjectStatsWithBitlyCountries(
  projectId: ObjectId | string
): Promise<BitlyStatsEnrichment> {
  // WHAT: Aggregate Bitly country data from junction table
  // WHY: bitlyChartAggregator already handles all the complexity
  const { top5, topCountry, totalCountries } = await aggregateBitlyCountries(projectId);

  // WHAT: Handle empty state (no Bitly links or no country data)
  // WHY: Charts need safe defaults when data is unavailable
  if (top5.length === 0 || !topCountry) {
    return {
      bitlyCountryCount: 0,
      bitlyTopCountry: '',
      bitlyClicksByCountry: 0,
      bitlyCountry1: undefined,
      bitlyCountry1Clicks: undefined,
      bitlyCountry2: undefined,
      bitlyCountry2Clicks: undefined,
      bitlyCountry3: undefined,
      bitlyCountry3Clicks: undefined,
      bitlyCountry4: undefined,
      bitlyCountry4Clicks: undefined,
      bitlyCountry5: undefined,
      bitlyCountry5Clicks: undefined,
    };
  }

  // WHAT: Build enrichment object with top 5 countries
  // WHY: Chart formulas reference these specific field names
  // HOW: Map array indices to numbered fields (bitlyCountry1, bitlyCountry2, etc.)
  const enrichment: BitlyStatsEnrichment = {
    // Summary fields (existing schema)
    bitlyCountryCount: totalCountries,
    bitlyTopCountry: topCountry.countryName,
    bitlyClicksByCountry: topCountry.clicks,
    
    // Top 5 countries (new fields for charts)
    bitlyCountry1: top5[0]?.countryName,
    bitlyCountry1Clicks: top5[0]?.clicks,
    bitlyCountry2: top5[1]?.countryName,
    bitlyCountry2Clicks: top5[1]?.clicks,
    bitlyCountry3: top5[2]?.countryName,
    bitlyCountry3Clicks: top5[2]?.clicks,
    bitlyCountry4: top5[3]?.countryName,
    bitlyCountry4Clicks: top5[3]?.clicks,
    bitlyCountry5: top5[4]?.countryName,
    bitlyCountry5Clicks: top5[4]?.clicks,
  };

  return enrichment;
}

/**
 * WHAT: Get MongoDB update object for enriching project.stats
 * WHY: Convenient helper for $set operations in database updates
 * HOW: Prefixes all enrichment fields with 'stats.' for nested update
 * 
 * @param projectId - MongoDB ObjectId of the project
 * @returns MongoDB $set update object ready for updateOne()
 * 
 * USAGE:
 * ```typescript
 * const updateObj = await getBitlyStatsUpdateObject(projectId);
 * await db.collection('projects').updateOne(
 *   { _id: projectId },
 *   updateObj
 * );
 * ```
 * 
 * EXAMPLE OUTPUT:
 * ```javascript
 * {
 *   $set: {
 *     'stats.bitlyCountry1': 'United States',
 *     'stats.bitlyCountry1Clicks': 1523,
 *     'stats.bitlyCountry2': 'Hungary',
 *     'stats.bitlyCountry2Clicks': 892,
 *     // ... etc
 *   }
 * }
 * ```
 */
export async function getBitlyStatsUpdateObject(
  projectId: ObjectId | string
): Promise<{ $set: Record<string, string | number | undefined> }> {
  // WHAT: Get enrichment data
  const enrichment = await enrichProjectStatsWithBitlyCountries(projectId);

  // WHAT: Build MongoDB update object with 'stats.' prefix
  // WHY: project.stats is nested, need dot notation for updates
  const updateFields: Record<string, string | number | undefined> = {};

  // WHAT: Map enrichment fields to stats.* paths
  // WHY: MongoDB requires dot notation for nested field updates
  Object.entries(enrichment).forEach(([key, value]) => {
    updateFields[`stats.${key}`] = value;
  });

  return { $set: updateFields };
}

/**
 * WHAT: Batch enrich multiple projects with Bitly country data
 * WHY: Efficient bulk updates when recalculating many projects at once
 * HOW: Parallel enrichment + bulk write operation
 * 
 * @param projectIds - Array of project ObjectIds to enrich
 * @returns Number of projects successfully enriched
 * 
 * PERFORMANCE:
 * - Parallel enrichment (all projects processed simultaneously)
 * - Single bulkWrite operation (minimizes database round trips)
 * - Suitable for background jobs and bulk recalculation
 * 
 * USAGE:
 * ```typescript
 * // After Bitly sync completes
 * const affectedProjects = [projectId1, projectId2, projectId3];
 * const count = await batchEnrichProjectsWithBitlyCountries(affectedProjects);
 * console.log(`Enriched ${count} projects`);
 * ```
 */
export async function batchEnrichProjectsWithBitlyCountries(
  projectIds: (ObjectId | string)[]
): Promise<number> {
  if (projectIds.length === 0) {
    return 0;
  }

  // WHAT: Import getDb here to avoid circular dependencies
  // WHY: This function needs direct database access for bulk operations
  const { getDb } = await import('./db');
  const db = await getDb();

  // WHAT: Enrich all projects in parallel
  // WHY: Independent operations, no shared state
  const enrichments = await Promise.all(
    projectIds.map((id) => enrichProjectStatsWithBitlyCountries(id))
  );

  // WHAT: Build bulk write operations
  // WHY: Single database round trip for all updates
  const bulkOps = projectIds.map((projectId, index) => {
    const enrichment = enrichments[index];
    const updateFields: Record<string, string | number | undefined> = {};

    Object.entries(enrichment).forEach(([key, value]) => {
      updateFields[`stats.${key}`] = value;
    });

    return {
      updateOne: {
        filter: { _id: typeof projectId === 'string' ? new ObjectId(projectId) : projectId },
        update: { $set: updateFields },
      },
    };
  });

  // WHAT: Execute bulk write
  // WHY: Efficient batch update of all projects
  const result = await db.collection('projects').bulkWrite(bulkOps);

  return result.modifiedCount;
}
