/**
 * Project Stats Utilities
 *
 * WHAT: Ensure required derived metrics exist on project.stats
 * WHY: Benchmarking and insights modules expect `stats.allImages` and `stats.totalFans`
 *      to be present on the projects collection for fast lookups. Some historical
 *      documents may lack these derived fields. This utility centralizes the logic
 *      to compute and persist them consistently across create/update/migrations.
 */

import type { ProjectStats } from './analyticsCalculator';
import { getStoredOrDerivedTotalFans } from './totalFans';

/**
 * Add or recompute derived metrics on a stats object.
 * - allImages = remoteImages + hostessImages + selfies
 * - totalFans = remoteFans + stadium (or indoor + outdoor for legacy)
 *
 * Strategy: Prefer the stored `totalFans` value and only fall back to legacy
 * field derivation when the stored value is absent.
 */
export function addDerivedMetrics<T extends Partial<ProjectStats>>(stats: T): T & { allImages: number; totalFans: number } {
  // Defensive defaults to handle partially filled legacy stats
  const remoteImages = Number((stats as any).remoteImages || 0);
  const hostessImages = Number((stats as any).hostessImages || 0);
  const selfies = Number((stats as any).selfies || 0);

  const allImages = remoteImages + hostessImages + selfies;

  const totalFans = getStoredOrDerivedTotalFans(stats);

  // Return a new object preserving original fields plus derived metrics
  return {
    ...(stats as any),
    allImages,
    totalFans,
  };
}
