// lib/hashtagReport/measured.ts
// WHAT: The measured layer of the hashtag report: what machines wrote about the events that carry the hashtag.
// WHY: "No manually entered number, by design" is enforced here, not promised. The only event stats this layer can
//     read are the counters Camera writes (an explicit allowlist, all named camera_*): the database projection names
//     them one by one, so a clicker stat, a sheet import or a typed table is never even fetched. Photo figures come
//     from the per-photo Fanmass rollups. Both are sums over events, so they add up exactly.

import { ObjectId } from 'mongodb';

import { toPhotoHashtag } from '../photoHashtags';
import { mergePhotoSummaries } from './mergeSummaries';
import type { HashtagEvent, MeasuredCounters, MeasuredDrivePhotos, MeasuredLayer, NamedCount } from './types';

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
export type ReportDb = {
  collection: (name: string) => {
    find: (filter: Record<string, unknown>, options?: Record<string, unknown>) => Cursor;
    countDocuments: (filter: Record<string, unknown>) => Promise<number>;
  };
};

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The events of a hashtag, written with or without the leading #, in any case. */
export function hashtagFilter(hashtag: string, organizationId?: string): Record<string, unknown> {
  const id = hashtag.trim().replace(/^#/, '');
  const filter: Record<string, unknown> = {
    $or: [
      { hashtags: id },
      { hashtags: `#${id}` },
      { hashtags: { $regex: new RegExp(`^#?${escapeRegex(id)}$`, 'i') } },
      // The classic hashtag report also reads a hashtag list stored as one comma-separated text
      { hashtags: { $regex: new RegExp(`(^|,)\\s*#?${escapeRegex(id)}\\s*(,|$)`, 'i') } },
    ],
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

  // The opt-in is counted from the stored per-photo results themselves: a result carries it or it does not
  const withOptIn = projects.length
    ? await db.collection('fanmass_camera_photo_analyses').countDocuments({
        eventId: { $in: projects.map((p) => String(p._id)) },
        tombstone: { $ne: true },
        status: 'completed',
        'optIn.received': true,
      })
    : 0;

  // Drive photos Fanmass tagged with the hashtag or placed in these events (lib/fanmassDrivePhotos.ts)
  const tag = toPhotoHashtag(hashtag.trim());
  const driveFilter: Record<string, unknown> = projects.length
    ? { $or: [{ hashtags: tag }, { eventId: { $in: projects.map((p) => String(p._id)) } }] }
    : { hashtags: tag };
  const drivePhotos = await db.collection('fanmass_event_drive_photos')
    .find(driveFilter, { projection: { eventId: 1, assignment: 1, optIn: 1, analysis: 1 } })
    .toArray();
  const drive = sumDrivePhotos(drivePhotos);
  // The events those photos sit in, by name (a tagged photo may sit in an event that does not carry the hashtag)
  const driveEventIds = [...new Set(drivePhotos.filter((photo) => photo.eventId).map((photo) => String(photo.eventId)))];
  const nameOf = new Map(projects.map((p) => [String(p._id), String(p.eventName ?? '')]));
  const missing = driveEventIds.filter((id) => !nameOf.has(id) && ObjectId.isValid(id));
  if (missing.length) {
    const more = await db.collection('projects').find({ _id: { $in: missing.map((id) => new ObjectId(id)) } }, { projection: { eventName: 1 } }).toArray();
    for (const p of more) nameOf.set(String(p._id), String(p.eventName ?? ''));
  }
  const perEvent = new Map<string, number>();
  for (const photo of drivePhotos) {
    if (!photo.eventId) continue;
    const name = nameOf.get(String(photo.eventId)) || 'Unnamed event';
    perEvent.set(name, (perEvent.get(name) ?? 0) + 1);
  }
  drive.events = topNames(perEvent);
  const driveByEvent = new Map<string, number>();
  for (const photo of drivePhotos) driveByEvent.set(String(photo.eventId), (driveByEvent.get(String(photo.eventId)) ?? 0) + 1);

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
        drivePhotos: driveByEvent.get(String(project._id)) ?? 0,
      };
    })
    .sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')) || a.name.localeCompare(b.name));

  const photos = mergePhotoSummaries(projects.map((p) => rollupByEvent.get(String(p._id))).filter((r): r is Record<string, unknown> => Boolean(r)));
  photos.withOptIn = withOptIn;
  photos.tagged = await db.collection('fanmass_camera_photo_analyses').countDocuments({ hashtags: tag, tombstone: { $ne: true }, status: 'completed' });
  return { events, counters, photos, drive };
}

const whole = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0);

function topNames(counts: Map<string, number>): NamedCount[] {
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 100);
}

/** Sum the placed drive photos: counts add, names are counted once per photo. */
export function sumDrivePhotos(rows: Array<Record<string, any>>): MeasuredDrivePhotos {
  const out: MeasuredDrivePhotos = { photos: 0, placed: 0, placedOverHalf: 0, analysed: 0, withOptIn: 0, people: 0, genders: {}, ageGroups: {}, emotions: {}, brands: [], clubs: [], events: [] };
  const brands = new Map<string, number>();
  const clubs = new Map<string, number>();
  const add = (target: Record<string, number>, source: unknown) => {
    for (const [key, value] of Object.entries((source && typeof source === 'object' ? source : {}) as Record<string, unknown>)) {
      if (whole(value) > 0) target[key] = (target[key] ?? 0) + whole(value);
    }
  };
  for (const row of rows) {
    out.photos += 1;
    if (row.eventId) {
      out.placed += 1;
      if (Number(row.assignment?.confidence) > 0.5) out.placedOverHalf += 1;
    }
    if (row.optIn?.received === true) out.withOptIn += 1;
    const a = row.analysis;
    if (!a || typeof a !== 'object') continue;
    out.analysed += 1;
    out.people += whole(a.people);
    add(out.genders, a.genders);
    add(out.ageGroups, a.ageGroups);
    add(out.emotions, a.emotions);
    for (const name of new Set<string>(Array.isArray(a.brands) ? a.brands : [])) brands.set(name, (brands.get(name) ?? 0) + 1);
    for (const name of new Set<string>(Array.isArray(a.clubs) ? a.clubs : [])) clubs.set(name, (clubs.get(name) ?? 0) + 1);
  }
  out.brands = topNames(brands);
  out.clubs = topNames(clubs);
  return out;
}
