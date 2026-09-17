// lib/v3/metricMaterializer.ts
// WHAT: Reads a V3Activity's already-synced project data and writes real
//     MetricValue records for it -- messmass#232.
// WHY: lib/v3/syncEngine.ts already mirrors every v2 project's full `stats`
//     object into `activity.metadata.stats` on every save (checked before
//     writing anything new: this runs live today, called from
//     app/api/partners/route.ts, app/api/admin/project-partners/route.ts,
//     lib/fanmassMapping.ts, lib/cameraPartnerSync.ts). The metric layer
//     just never turned that into MetricDefinition-shaped MetricValue rows.
//     This reuses that existing data and the existing fan/ad-value
//     calculators (lib/analyticsCalculator.ts) rather than recomputing
//     anything from scratch.
// HOW: organizationId and entityId are taken directly from the activity
//     document, not re-derived -- whatever real-org assignment eventually
//     lands on entities/activities (still open, same caveat as #395) is
//     inherited automatically, with zero change needed here.
//
// SCOPE NOTE: Bitly is materialized as click totals only (bitly-clicks), not
// the full device/browser breakdown. That estimate is date-range-dependent
// and computed by lib/bitly-aggregator.ts's full pipeline (messmass#283);
// reproducing it here for a v1 proof of the materialization pipeline itself
// would be disproportionate. Flagged, not silently dropped.

import { ObjectId } from 'mongodb';
import connectV3 from '@/lib/mongoose-v3';
import V3Activity from '@/lib/models/v3/Activity';
import V3MetricValue from '@/lib/models/v3/MetricValue';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { calculateFanMetrics, calculateAdMetrics, type ProjectStats } from '@/lib/analyticsCalculator';

async function getBitlyClicksForProject(projectId: string): Promise<number> {
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const links = await db
    .collection('bitly_project_links')
    .find({ projectId: new ObjectId(projectId) })
    .project({ 'cachedMetrics.clicks': 1 })
    .toArray();
  return links.reduce((sum, link: any) => sum + (link.cachedMetrics?.clicks || 0), 0);
}

const REQUIRED_NUMERIC_FIELDS: (keyof ProjectStats)[] = [
  'remoteImages', 'hostessImages', 'selfies', 'stadium',
  'female', 'male', 'genAlpha', 'genYZ', 'genX', 'boomer',
  'merched', 'jersey', 'scarf', 'flags', 'baseballCap', 'other',
  'eventAttendees',
];

/**
 * WHAT: Defaults every field calculateFanMetrics/calculateAdMetrics require
 *     to 0 when missing or non-numeric.
 * WHY: Only 304 of 459 v3_activities carry metadata.stats at all, and
 *     nothing here checked whether those are *complete* -- calling these
 *     calculators against a stored document that's missing a required field
 *     would produce NaN silently rather than a clear error. Explicit, not
 *     inferred from what happened not to crash in testing.
 */
export function normalizeStats(raw: Partial<ProjectStats>): ProjectStats {
  const normalized = { ...raw } as ProjectStats;
  for (const field of REQUIRED_NUMERIC_FIELDS) {
    const value = (raw as any)[field];
    (normalized as any)[field] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }
  return normalized;
}

/** Pure -- the actual metric values, given already-fetched stats. Materializing (the DB write) is a thin wrapper around this. */
export function computeMetricValues(rawStats: Partial<ProjectStats>, bitlyClicks: number): Record<string, number> {
  const stats = normalizeStats(rawStats);
  const fanMetrics = calculateFanMetrics(stats);
  const adMetrics = calculateAdMetrics(stats, fanMetrics);
  return {
    'total-fans': fanMetrics.totalFans,
    'total-images': stats.remoteImages + stats.hostessImages + stats.selfies,
    'total-merched': stats.merched,
    'ad-value-estimate': adMetrics.totalROI,
    'bitly-clicks': bitlyClicks,
  };
}

export interface MaterializeResult {
  activityId: string;
  metricsWritten: number;
}

/** Materializes (upserts) every catalog metric for one V3Activity, from its already-synced project stats. */
export async function materializeActivityMetrics(activityId: string): Promise<MaterializeResult | { error: 'activity_not_found' | 'no_stats' | 'no_owner_entity' }> {
  await connectV3();
  const activity = await V3Activity.findById(activityId).lean();
  if (!activity) return { error: 'activity_not_found' };

  const stats = (activity as any).metadata?.stats as Partial<ProjectStats> | undefined;
  if (!stats) return { error: 'no_stats' };
  if (!(activity as any).ownerEntityId) return { error: 'no_owner_entity' };

  const originalProjectId = (activity as any).metadata?.originalId as string | undefined;
  const bitlyClicks = originalProjectId && ObjectId.isValid(originalProjectId) ? await getBitlyClicksForProject(originalProjectId) : 0;

  const values = computeMetricValues(stats, bitlyClicks);
  const now = new Date();
  let written = 0;

  for (const [metricKey, value] of Object.entries(values)) {
    await V3MetricValue.findOneAndUpdate(
      { activityId: activity._id, metricKey },
      {
        $set: {
          organizationId: (activity as any).organizationId,
          entityId: (activity as any).ownerEntityId,
          value,
          timestamp: now,
        },
      },
      { upsert: true }
    );
    written += 1;
  }

  return { activityId, metricsWritten: written };
}

export interface MaterializeAllResult {
  activitiesEligible: number;
  activitiesMaterialized: number;
  skipped: { activityId: string; reason: 'no_stats' | 'no_owner_entity' }[];
}

/** Materializes every activity that has both stats and an owner entity -- 121 of 459 today, checked against production. */
export async function materializeAllActivities(): Promise<MaterializeAllResult> {
  await connectV3();
  const eligible = await V3Activity.find({
    'metadata.stats': { $exists: true, $ne: null },
    ownerEntityId: { $exists: true, $ne: null },
  })
    .select('_id')
    .lean();

  const skipped: MaterializeAllResult['skipped'] = [];
  let materialized = 0;

  for (const activity of eligible) {
    const result = await materializeActivityMetrics(activity._id.toString());
    if ('error' in result) {
      skipped.push({ activityId: activity._id.toString(), reason: result.error as 'no_stats' | 'no_owner_entity' });
    } else {
      materialized += 1;
    }
  }

  return { activitiesEligible: eligible.length, activitiesMaterialized: materialized, skipped };
}
