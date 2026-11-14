// lib/hashtagReport/index.ts
// WHAT: The unified hashtag report: one builder for EVERY hashtag.
// WHY: The report is Fanmass data and Messmass calculations, nothing else:
//   1. measured   (lib/hashtagReport/measured.ts)   what machines wrote: Fanmass photo results and Camera counters,
//   2. calculated (lib/hashtagReport/calculated.ts) Messmass calculations over the measured layer, each with its two
//      counts, or nothing when the counts cannot give a real share,
//   3. manual numbers (clicker stats, sheet imports, typed tables) are not part of this report at all.
// The layers never mix: the calculated layer only reads the measured layer, and the measured layer can only fetch
// what its allowlisted projection names.

import { calculate } from './calculated';
import { loadMeasuredLayer, type ReportDb } from './measured';
import type { HashtagReport } from './types';

export type { HashtagReport } from './types';

export async function buildHashtagReport(db: ReportDb, hashtag: string, organizationId?: string): Promise<HashtagReport> {
  const id = hashtag.trim().replace(/^#/, '');
  return build(await loadMeasuredLayer(db, id, organizationId), { type: 'hashtag', id });
}

/** The same report over every event and every drive photo: what /report/global shows. */
export async function buildAllEventsReport(db: ReportDb): Promise<HashtagReport> {
  return build(await loadMeasuredLayer(db, null), { type: 'all', id: 'all' });
}

function build(measured: HashtagReport['measured'], scope: HashtagReport['scope']): HashtagReport {
  return {
    success: true,
    scope,
    generatedAt: new Date().toISOString(),
    measured,
    calculated: calculate(measured),
    coverage: {
      events: measured.events.length,
      eventsWithCounters: measured.events.filter((event) => event.hasCounters).length,
      eventsWithPhotoResults: measured.events.filter((event) => event.hasPhotoResults).length,
      eventsWithDrivePhotos: measured.events.filter((event) => event.drivePhotos > 0).length,
    },
  };
}
