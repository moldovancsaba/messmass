// lib/hashtagReport/index.ts
// WHAT: The unified hashtag report: one builder for EVERY hashtag.
// WHY: The report is Fanmass data and Messmass calculations, nothing else:
//   1. measured   (lib/hashtagReport/measured.ts)   what machines wrote: Fanmass photo results and Camera counters,
//   2. calculated (lib/hashtagReport/calculated.ts) Messmass calculations over the measured layer, each with its two
//      counts, or nothing when the counts cannot give a real share,
//   3. manual numbers (clicker stats, sheet imports, typed tables) are not part of this report at all.
// The layers never mix: the calculated layer only reads the measured layer, and the measured layer can only fetch
// what its allowlisted projection names.

import { ObjectId } from 'mongodb';

import { calculate } from './calculated';
import { loadMeasuredLayer, type ReportDb } from './measured';
import type { HashtagReport } from './types';

export type { HashtagReport } from './types';

export async function buildHashtagReport(db: ReportDb, hashtag: string, organizationId?: string): Promise<HashtagReport> {
  const id = hashtag.trim().replace(/^#/, '');
  return build(await loadMeasuredLayer(db, [id], organizationId), { type: 'hashtag', id, tags: [id] });
}

/** The same report for several hashtags at once (the admin hashtag filter): events and photos carrying all of them. */
export async function buildFilterReport(db: ReportDb, hashtags: string[], id = ''): Promise<HashtagReport> {
  const tags = [...new Set(hashtags.map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean))];
  return build(await loadMeasuredLayer(db, tags), { type: 'filter', id: id || tags.join(','), tags });
}

/** The same report over every event and every drive photo: what /report/global shows. */
export async function buildAllEventsReport(db: ReportDb): Promise<HashtagReport> {
  return build(await loadMeasuredLayer(db, null), { type: 'all', id: 'all', tags: [] });
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

/** The hashtags of a saved filter (filter_slugs, by slug or id), or the slug itself read as comma-separated hashtags,
 * the same resolution as the classic filter report (lib/interactiveReportAggregator.ts). */
export async function filterSlugHashtags(db: ReportDb, slug: string): Promise<string[]> {
  const bySlug = await db.collection('filter_slugs').find({ slug }, { projection: { hashtags: 1 }, limit: 1 }).toArray();
  const byId = !bySlug.length && /^[0-9a-f]{24}$/i.test(slug)
    ? await db.collection('filter_slugs').find({ _id: new ObjectId(slug) }, { projection: { hashtags: 1 }, limit: 1 }).toArray()
    : [];
  const saved = ((bySlug[0] ?? byId[0])?.hashtags ?? []) as string[];
  const tags = saved.length ? saved : slug.split(',');
  return tags.map((tag) => String(tag).trim().replace(/^#/, '')).filter(Boolean);
}
