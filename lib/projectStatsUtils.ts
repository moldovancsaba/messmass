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
import { calculateFanMetrics } from './analyticsCalculator';

/**
 * Add or recompute derived metrics on a stats object.
 * - allImages = remoteImages + hostessImages + selfies
 * - totalFans = remoteFans + stadium (or indoor + outdoor for legacy)
 *
 * Strategy: We reuse calculateFanMetrics() to respect legacy fields and
 * guard-rails already defined (e.g., safe division, legacy indoor/outdoor).
 */
export function addDerivedMetrics<T extends Partial<ProjectStats>>(stats: T): T & { allImages: number; totalFans: number } {
  // Defensive defaults to handle partially filled legacy stats
  const remoteImages = Number((stats as any).remoteImages || 0);
  const hostessImages = Number((stats as any).hostessImages || 0);
  const selfies = Number((stats as any).selfies || 0);

  const allImages = remoteImages + hostessImages + selfies;

  // Use existing calculator to unify legacy handling (remoteFans vs indoor/outdoor)
  const fanMetrics = calculateFanMetrics(({
    remoteImages,
    hostessImages,
    selfies,
    approvedImages: (stats as any).approvedImages || 0,
    rejectedImages: (stats as any).rejectedImages || 0,
    remoteFans: (stats as any).remoteFans,
    indoor: (stats as any).indoor,
    outdoor: (stats as any).outdoor,
    stadium: Number((stats as any).stadium || 0),
    female: Number((stats as any).female || 0),
    male: Number((stats as any).male || 0),
    genAlpha: Number((stats as any).genAlpha || 0),
    genYZ: Number((stats as any).genYZ || 0),
    genX: Number((stats as any).genX || 0),
    boomer: Number((stats as any).boomer || 0),
    merched: Number((stats as any).merched || 0),
    jersey: Number((stats as any).jersey || 0),
    scarf: Number((stats as any).scarf || 0),
    flags: Number((stats as any).flags || 0),
    baseballCap: Number((stats as any).baseballCap || 0),
    other: Number((stats as any).other || 0),
    eventAttendees: Number((stats as any).eventAttendees || 0),
    visitQrCode: Number((stats as any).visitQrCode || 0),
    visitShortUrl: Number((stats as any).visitShortUrl || 0),
    visitWeb: Number((stats as any).visitWeb || 0),
    socialVisit: Number((stats as any).socialVisit || 0),
    eventValuePropositionVisited: Number((stats as any).eventValuePropositionVisited || 0),
    eventValuePropositionPurchases: Number((stats as any).eventValuePropositionPurchases || 0),
    bitlyTotalClicks: Number((stats as any).bitlyTotalClicks || 0),
    bitlyUniqueClicks: Number((stats as any).bitlyUniqueClicks || 0),
    bitlyMobileClicks: Number((stats as any).bitlyMobileClicks || 0),
    bitlyDesktopClicks: Number((stats as any).bitlyDesktopClicks || 0),
    bitlyTabletClicks: Number((stats as any).bitlyTabletClicks || 0),
    bitlyClicksByCountry: (stats as any).bitlyClicksByCountry,
    bitlyTopCountry: (stats as any).bitlyTopCountry,
    bitlyReferrers: (stats as any).bitlyReferrers,
    bitlyTopReferrer: (stats as any).bitlyTopReferrer,
  } as unknown) as ProjectStats);

  const totalFans = Number(fanMetrics.totalFans || 0);

  // Return a new object preserving original fields plus derived metrics
  return {
    ...(stats as any),
    allImages,
    totalFans,
  };
}