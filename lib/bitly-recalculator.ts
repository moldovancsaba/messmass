/**
 * bitly-recalculator.ts
 * 
 * Orchestration service for recalculating Bitly date ranges and cached metrics.
 * 
 * WHY: When events are added, deleted, or have date changes, the temporal boundaries
 * for Bitly link analytics attribution must be recomputed. This service coordinates:
 * 1. Date range recalculation using the smart algorithm
 * 2. Metric re-aggregation for affected associations
 * 3. Database updates with new cached data
 * 
 * WHAT: Triggered by:
 * - Event date change (eventDate field updated)
 * - Event creation (new event added with Bitly links)
 * - Event deletion (event removed, redistribute ranges)
 * - Manual refresh request (admin UI button)
 * 
 * TRIGGERS:
 * - app/api/projects PUT route (event date change)
 * - app/api/projects DELETE route (event deletion)
 * - app/api/bitly/recalculate POST route (manual trigger)
 * - app/api/cron/bitly-refresh GET route (background job)
 */

import { ObjectId } from 'mongodb';
import { getDb } from './db';
import { calculateDateRanges } from './bitly-date-calculator';
import {
  aggregateMetricsByDateRange,
  batchAggregateMetrics,
} from './bitly-aggregator';
import type {
  BitlyProjectLink,
  CreateBitlyProjectLinkInput,
} from './bitly-junction.types';

/**
 * Recalculate all date ranges and metrics for a specific Bitly link.
 * 
 * WHY: When events using this link change dates or are added/deleted,
 * all associations for this link must be recomputed to maintain accurate
 * temporal segmentation.
 * 
 * WHAT:
 * 1. Fetch all projects associated with this bitlink
 * 2. Calculate new date ranges using smart algorithm
 * 3. Aggregate metrics for each new date range
 * 4. Update junction table with new ranges and cached metrics
 * 
 * @param bitlyLinkId - ObjectId of the bitly_links document
 * @returns Array of updated junction table entries
 */
export async function recalculateLinkRanges(
  bitlyLinkId: ObjectId
): Promise<BitlyProjectLink[]> {
  const db = await getDb();
  const junctionCollection = db.collection<BitlyProjectLink>('bitly_project_links');
  const projectsCollection = db.collection('projects');

  // Step 1: Find all existing associations for this bitlink
  // WHY: We need to know which projects are linked to recalculate ranges
  const existingAssociations = await junctionCollection
    .find({ bitlyLinkId, autoCalculated: true })
    .toArray();

  if (existingAssociations.length === 0) {
    // No auto-calculated associations found, nothing to recalculate
    return [];
  }

  // Step 2: Fetch project details (eventDate, createdAt) for date calculation
  const projectIds = existingAssociations.map((assoc) => assoc.projectId);
  const projects = await projectsCollection
    .find(
      { _id: { $in: projectIds } },
      { projection: { eventDate: 1, createdAt: 1 } }
    )
    .toArray();

  if (projects.length === 0) {
    // Projects no longer exist, should delete orphaned associations
    // TODO: Handle orphaned associations cleanup
    return [];
  }

  // Step 3: Calculate new date ranges using smart algorithm
  // WHY: Algorithm handles overlaps, buffers, and infinity bounds
  const eventInfos = projects.map((p) => ({
    projectId: p._id.toString(),
    eventDate: p.eventDate,
    createdAt: p.createdAt,
  }));
  
  const calculatedRangesMap = calculateDateRanges(
    bitlyLinkId.toString(), // bitlink identifier for logging
    eventInfos
  );

  // Step 4: Aggregate metrics for each new date range
  // WHY: Cached metrics must reflect new temporal boundaries
  const aggregationOptions = projects.map((p) => {
    const range = calculatedRangesMap.get(p._id.toString())!;
    return {
      bitlyLinkId,
      startDate: range.startDate,
      endDate: range.endDate,
      includeTimeseries: true,
    };
  });

  const aggregatedMetrics = await batchAggregateMetrics(aggregationOptions);

  // Step 5: Update junction table with new ranges and metrics
  // WHY: Persist recalculated data for fast query access
  const now = new Date().toISOString();
  const bulkOperations = projects.map((p, index) => {
    const range = calculatedRangesMap.get(p._id.toString())!;
    return {
      updateOne: {
        filter: {
          bitlyLinkId,
          projectId: p._id,
        },
        update: {
          $set: {
            startDate: range.startDate,
            endDate: range.endDate,
            cachedMetrics: aggregatedMetrics[index],
            lastSyncedAt: now,
            updatedAt: now,
          },
        },
      },
    };
  });

  if (bulkOperations.length > 0) {
    await junctionCollection.bulkWrite(bulkOperations);
  }

  // Step 6: Return updated associations for verification
  const updatedAssociations = await junctionCollection
    .find({ bitlyLinkId })
    .toArray();

  return updatedAssociations;
}

/**
 * Recalculate date ranges and metrics for all Bitly links associated with a project.
 * 
 * WHY: When a project's eventDate changes, ALL Bitly links associated with that
 * project need recalculation (since their date ranges depend on event chronology).
 * 
 * WHAT:
 * 1. Find all bitlinks associated with this project
 * 2. For each bitlink, recalculate all its project associations
 * 
 * @param projectId - ObjectId of the projects document
 * @returns Number of bitlinks recalculated
 */
export async function recalculateProjectLinks(
  projectId: ObjectId
): Promise<number> {
  const db = await getDb();
  const junctionCollection = db.collection<BitlyProjectLink>('bitly_project_links');

  // Find all bitlinks associated with this project
  const associations = await junctionCollection
    .find({ projectId })
    .toArray();

  if (associations.length === 0) {
    return 0;
  }

  // Get unique bitlink IDs
  const uniqueBitlinkIds = Array.from(
    new Set(associations.map((assoc) => assoc.bitlyLinkId.toString()))
  ).map((id) => new ObjectId(id));

  // Recalculate each bitlink (which affects all its project associations)
  // WHY: Date ranges depend on ALL projects using a bitlink, not just one
  await Promise.all(
    uniqueBitlinkIds.map((bitlinkId) => recalculateLinkRanges(bitlinkId))
  );

  return uniqueBitlinkIds.length;
}

/**
 * Handle project deletion by recalculating ranges for remaining events.
 * 
 * WHY: When an event is deleted, date ranges for remaining events using the
 * same bitlinks must be redistributed (previous event's end becomes new boundary).
 * 
 * WHAT:
 * 1. Find all bitlinks that were associated with deleted project
 * 2. Delete junction table entries for deleted project
 * 3. Recalculate remaining associations for affected bitlinks
 * 
 * @param projectId - ObjectId of the deleted projects document
 * @returns Number of bitlinks affected and recalculated
 */
export async function handleProjectDeletion(
  projectId: ObjectId
): Promise<number> {
  const db = await getDb();
  const junctionCollection = db.collection<BitlyProjectLink>('bitly_project_links');

  // Step 1: Find bitlinks associated with deleted project
  const deletedAssociations = await junctionCollection
    .find({ projectId })
    .toArray();

  if (deletedAssociations.length === 0) {
    return 0;
  }

  const affectedBitlinkIds = Array.from(
    new Set(deletedAssociations.map((assoc) => assoc.bitlyLinkId.toString()))
  ).map((id) => new ObjectId(id));

  // Step 2: Delete junction table entries for deleted project
  // WHY: Clean up orphaned associations
  await junctionCollection.deleteMany({ projectId });

  // Step 3: Recalculate remaining associations for affected bitlinks
  // WHY: Date ranges need redistribution after event removal
  await Promise.all(
    affectedBitlinkIds.map((bitlinkId) => recalculateLinkRanges(bitlinkId))
  );

  return affectedBitlinkIds.length;
}

/**
 * Create a new link-project association with auto-calculated date ranges.
 * 
 * WHY: When linking a Bitly URL to a new event, we must calculate initial
 * date ranges based on all events using this link.
 * 
 * WHAT:
 * 1. Check if association already exists
 * 2. Create association with empty metrics initially
 * 3. Trigger full recalculation for the bitlink
 * 
 * @param input - Association creation parameters
 * @returns Created or existing association
 */
export async function createLinkAssociation(
  input: CreateBitlyProjectLinkInput
): Promise<BitlyProjectLink> {
  const db = await getDb();
  const junctionCollection = db.collection<BitlyProjectLink>('bitly_project_links');

  // Check if association already exists
  const existing = await junctionCollection.findOne({
    bitlyLinkId: input.bitlyLinkId,
    projectId: input.projectId,
  });

  if (existing) {
    // Association already exists, return it
    return existing;
  }

  // Create new association with placeholder values
  // WHY: Initial creation before recalculation computes accurate ranges
  const now = new Date().toISOString();
  const newAssociation: Omit<BitlyProjectLink, '_id'> = {
    bitlyLinkId: input.bitlyLinkId,
    projectId: input.projectId,
    startDate: null, // Will be calculated
    endDate: null, // Will be calculated
    autoCalculated: input.autoCalculated ?? true,
    cachedMetrics: {
      clicks: 0,
      uniqueClicks: 0,
      topCountries: [],
      topReferrers: [],
      deviceClicks: { mobile: 0, desktop: 0, tablet: 0, other: 0 },
      browserClicks: { chrome: 0, firefox: 0, safari: 0, edge: 0, other: 0 },
      dailyClicks: [],
    },
    createdAt: now,
    updatedAt: now,
    lastSyncedAt: null,
  };

  const result = await junctionCollection.insertOne(
    newAssociation as BitlyProjectLink
  );

  // Trigger recalculation to compute accurate ranges and metrics
  await recalculateLinkRanges(input.bitlyLinkId);

  // Fetch updated association with calculated values
  const created = await junctionCollection.findOne({ _id: result.insertedId });

  if (!created) {
    throw new Error('Failed to create link association');
  }

  return created;
}

/**
 * Refresh cached metrics for all associations (without recalculating date ranges).
 * 
 * WHY: After Bitly sync completes and new analytics data arrives, we need to
 * update cached metrics while keeping existing date ranges intact.
 * 
 * WHAT:
 * 1. Fetch all associations
 * 2. Re-aggregate metrics using existing date ranges
 * 3. Update cachedMetrics and lastSyncedAt fields
 * 
 * @returns Number of associations refreshed
 */
export async function refreshAllCachedMetrics(): Promise<number> {
  const db = await getDb();
  const junctionCollection = db.collection<BitlyProjectLink>('bitly_project_links');

  // Fetch all associations
  const allAssociations = await junctionCollection.find({}).toArray();

  if (allAssociations.length === 0) {
    return 0;
  }

  // Build aggregation options using existing date ranges
  const aggregationOptions = allAssociations.map((assoc) => ({
    bitlyLinkId: assoc.bitlyLinkId,
    startDate: assoc.startDate,
    endDate: assoc.endDate,
    includeTimeseries: true,
  }));

  // Batch aggregate metrics
  const aggregatedMetrics = await batchAggregateMetrics(aggregationOptions);

  // Update cached metrics in database
  const now = new Date().toISOString();
  const bulkOperations = allAssociations.map((assoc, index) => ({
    updateOne: {
      filter: { _id: assoc._id },
      update: {
        $set: {
          cachedMetrics: aggregatedMetrics[index],
          lastSyncedAt: now,
          updatedAt: now,
        },
      },
    },
  }));

  if (bulkOperations.length > 0) {
    await junctionCollection.bulkWrite(bulkOperations);
  }

  return allAssociations.length;
}

/**
 * Refresh cached metrics for a specific Bitly link (all its associations).
 * 
 * WHY: Targeted refresh after syncing a specific bitlink, more efficient
 * than refreshing all associations globally.
 * 
 * @param bitlyLinkId - ObjectId of the bitly_links document
 * @returns Number of associations refreshed
 */
export async function refreshLinkMetrics(bitlyLinkId: ObjectId): Promise<number> {
  const db = await getDb();
  const junctionCollection = db.collection<BitlyProjectLink>('bitly_project_links');

  // Fetch associations for this bitlink
  const associations = await junctionCollection
    .find({ bitlyLinkId })
    .toArray();

  if (associations.length === 0) {
    return 0;
  }

  // Build aggregation options
  const aggregationOptions = associations.map((assoc) => ({
    bitlyLinkId: assoc.bitlyLinkId,
    startDate: assoc.startDate,
    endDate: assoc.endDate,
    includeTimeseries: true,
  }));

  // Aggregate metrics
  const aggregatedMetrics = await batchAggregateMetrics(aggregationOptions);

  // Update cached metrics
  const now = new Date().toISOString();
  const bulkOperations = associations.map((assoc, index) => ({
    updateOne: {
      filter: { _id: assoc._id },
      update: {
        $set: {
          cachedMetrics: aggregatedMetrics[index],
          lastSyncedAt: now,
          updatedAt: now,
        },
      },
    },
  }));

  if (bulkOperations.length > 0) {
    await junctionCollection.bulkWrite(bulkOperations);
  }

  // WHAT: Enrich project.stats with updated Bitly country data
  // WHY: Charts read from project.stats, not junction table
  // HOW: After updating cachedMetrics, sync top 5 countries to project.stats
  // PATTERN: Follows established stats enrichment pattern (see projectStatsUtils.ts)
  const { batchEnrichProjectsWithBitlyCountries } = await import('./bitlyStatsEnricher');
  const uniqueProjectIds = Array.from(
    new Set(associations.map((assoc) => assoc.projectId))
  );
  
  try {
    await batchEnrichProjectsWithBitlyCountries(uniqueProjectIds);
  } catch (error) {
    // WHAT: Log error but don't fail the entire refresh
    // WHY: Cached metrics are still updated, stats enrichment is supplementary
    console.error('[Bitly Recalculator] Failed to enrich project.stats:', error);
  }

  return associations.length;
}
