// lib/hashtagReport/measured.ts
// WHAT: The measured layer of the hashtag report: what machines wrote about the events that carry the hashtag.
// WHY: "No manually entered number, by design" is enforced here, not promised. The only event stats this layer can
//     read are the counters Camera writes (an explicit allowlist, all named camera_*): the database projection names
//     them one by one, so a clicker stat, a sheet import or a typed table is never even fetched. Photo figures come
//     from the per-photo Fanmass rollups. Both are sums over events, so they add up exactly.

import { mergePhotoSummaries } from './mergeSummaries';
import type { HashtagEvent, MeasuredCounters, MeasuredLayer } from './types';

/** The additive counters Camera writes onto an event (lib/cameraPhotoStats.ts). Averages are not additive and are left out. */
export const CAMERA_TOTAL_COUNTERS = [
  'camera_images_taken',
  'camera_images_approved',
  'camera_images_rejected',
  'camera_images_shown_on_slideshow',
  'camera_consents_accepted',
  'camera_source_visits',
  'camera_source_photo_submissions',
  'camera_journey_opens',
  'camera_journeys_completed',
  'camera_journeys_finished',
  'camera_journey_cta_clicks',
  'camera_shares',
  'camera_downloads',
] as const;

/** Event identity plus the allowlisted counters; no other `stats` key is ever named. */
export const MACHINE_EVENT_PROJECTION: Record<string, 1> = Object.fromEntries([
  'eventName', 'eventDate',
  ...CAMERA_TOTAL_COUNTERS.map((name) => `stats.${name}`),
].map((field) => [field, 1]));

type Cursor = { toArray: () => Promise<Array<Record<string, any>>> };
export type ReportDb = { collection: (name: string) => { find: (filter: Record<string, unknown>, options?: Record<string, unknown>) => Cursor } };

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The events of a hashtag, written with or without the leading #, in any case. */
export function hashtagFilter(hashtag: string, organizationId?: string): Record<string, unknown> {
  const id = hashtag.trim().replace(/^#/, '');
  const filter: Record<string, unknown> = {
    $or: [{ hashtags: id }, { hashtags: `#${id}` }, { hashtags: { $regex: new RegExp(`^#?${escapeRegex(id)}$`, 'i') } }],
  };
  if (organizationId) filter.organizationId = organizationId;
  return filter;
}

const reported = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export async function loadMeasuredLayer(db: ReportDb, hashtag: string, organizationId?: string): Promise<MeasuredLayer> {
  const projects = await db.collection('projects').find(hashtagFilter(hashtag, organizationId), { projection: MACHINE_EVENT_PROJECTION }).toArray();

  const rollups = projects.length
    ? await db.collection('ai_analysis_summaries')
        .find({ eventId: { $in: projects.map((p) => String(p._id)) }, sourceType: 'camera_photo_pipeline' }, { projection: { eventId: 1, summary: 1 } })
        .toArray()
    : [];
  const rollupByEvent = new Map(rollups.map((row) => [String(row.eventId), (row.summary ?? {}) as Record<string, unknown>]));

  const counters: MeasuredCounters = {};
  const events: HashtagEvent[] = projects
    .map((project) => {
      const stats = (project.stats ?? {}) as Record<string, unknown>;
      let hasCounters = false;
      for (const name of CAMERA_TOTAL_COUNTERS) {
        if (reported(stats[name])) {
          counters[name] = (counters[name] ?? 0) + (stats[name] as number);
          hasCounters = true;
        }
      }
      const rollup = rollupByEvent.get(String(project._id));
      return {
        id: String(project._id),
        name: String(project.eventName ?? ''),
        date: typeof project.eventDate === 'string' && project.eventDate ? project.eventDate : null,
        hasCounters,
        hasPhotoResults: Number(rollup?.photoResultsReceived ?? 0) > 0,
      };
    })
    .sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')) || a.name.localeCompare(b.name));

  return {
    events,
    counters,
    photos: mergePhotoSummaries(projects.map((p) => rollupByEvent.get(String(p._id))).filter((r): r is Record<string, unknown> => Boolean(r))),
  };
}
