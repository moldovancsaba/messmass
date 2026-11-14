// lib/hashtagReport/measured.ts
// WHAT: The measured layer of the hashtag report: what machines wrote about the events that carry the hashtag.
// WHY: "No manually entered number, by design" is enforced here, not promised. The only event stats this layer can
//     read are the counters Camera writes (an explicit allowlist, all named camera_*): the database projection names
//     them one by one, so a clicker stat, a sheet import or a typed table is never even fetched. Photo figures come
//     from the per-photo Fanmass rollups. Both are sums over events, so they add up exactly.

import { ObjectId } from 'mongodb';

import { parseHashtagQuery } from '../hashtagCategoryUtils';
import { compactHashtag, hashtagSpellings } from '../photoHashtags';
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
    aggregate: (pipeline: Array<Record<string, unknown>>) => Cursor;
  };
};

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The events of a hashtag, written with or without the leading #, in any case, in the plain hashtag list or in any
 * category list, exactly as the admin hashtag filter matches them (lib/hashtagCategoryUtils.ts matchHashtagInProject).
 * A `category:tag` query matches that category list only. */
export function hashtagFilter(hashtag: string, organizationId?: string, typedOnly = false): Record<string, unknown> {
  const { category, hashtag: id } = parseHashtagQuery(hashtag.trim().replace(/^#/, ''));
  // Any case, a leading #, underscores anywhere: typed and automatic spellings of one name are one hashtag
  const spellings = hashtagSpellings(id);
  const compact = compactHashtag(id);
  const filter: Record<string, unknown> = {
    $or: category
      ? [{ [`categorizedHashtags.${category}`]: { $regex: spellings } }]
      : [
          { hashtags: { $regex: spellings } },
          // The classic hashtag report also reads a hashtag list stored as one comma-separated text
          { hashtags: { $regex: new RegExp(`(^|,)\\s*${spellings.source.slice(1, -1)}\\s*(,|$)`, 'i') } },
          // The hashtags Fanmass wrote onto the event's photos (lib/fanmassEventHashtags.ts): typed and automatic
          // hashtags work together, the reports stay separate (owner 2026-11-14)
          ...(typedOnly ? [] : [{ fanmassHashtags: { $regex: spellings } }]),
          // Any category list (categorizedHashtags: { category: [tags] })
          { $expr: { $gt: [{ $size: { $filter: {
            // Guarded: a malformed document (no object, a value that is not a list) never fails the whole query
            input: { $cond: [{ $eq: [{ $type: '$categorizedHashtags' }, 'object'] }, { $objectToArray: '$categorizedHashtags' }, []] },
            cond: { $in: [compact, { $map: {
              input: { $cond: [{ $isArray: '$$this.v' }, '$$this.v', []] },
              as: 'tag',
              in: { $replaceAll: { input: { $replaceAll: { input: { $toLower: { $toString: '$$tag' } }, find: '_', replacement: '' } }, find: '#', replacement: '' } },
            } }] },
          } } }, 0] } },
        ],
  };
  if (organizationId) filter.organizationId = organizationId;
  return filter;
}

/** The events carrying every one of the hashtags (the admin filter's AND), or every event when there are none. */
export function eventsFilter(hashtags: string[] | null, organizationId?: string, typedOnly = false): Record<string, unknown> {
  const org = organizationId ? { organizationId } : {};
  if (!hashtags) return org;
  return { $and: hashtags.map((tag) => ({ $or: (hashtagFilter(tag, undefined, typedOnly) as { $or: unknown[] }).$or })), ...org };
}

/** Every spelling of a query's hashtag on a photo: `category:tag` becomes `tag` (lib/photoHashtags.ts). */
const photoTag = (query: string) => hashtagSpellings(parseHashtagQuery(query.trim().replace(/^#/, '')).hashtag);

const reported = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** The events carrying every hashtag of `hashtags`, plus the events holding photos tagged with all of them; `null`
 * measures every event and every drive photo: the all-events report (/report/global). */
export async function loadMeasuredLayer(db: ReportDb, hashtags: string[] | null, organizationId?: string): Promise<MeasuredLayer> {
  const tagged = await db.collection('projects').find(eventsFilter(hashtags, organizationId), { projection: MACHINE_EVENT_PROJECTION }).toArray();
  const taggedIds = tagged.map((p) => String(p._id));
  // A typed hashtag is about the whole event: all its photos count. A hashtag Fanmass wrote (a brand, an emotion) is about
  // the photos it was found in: only those count, also when the event carries it among its Fanmass hashtags.
  const typedIds = hashtags === null
    ? taggedIds
    : (await db.collection('projects').find(eventsFilter(hashtags, organizationId, true), { projection: { _id: 1 } }).toArray()).map((p) => String(p._id));

  // Drive photos Fanmass tagged with the hashtag or placed in these events (lib/fanmassDrivePhotos.ts)
  const photoTags = hashtags === null ? null : hashtags.map(photoTag);
  // One hashtag is matched as a value (the index serves it), several as all of them
  const tag = photoTags === null ? null : photoTags.length === 1 ? { $regex: photoTags[0] } : { $all: photoTags };
  const driveFilter: Record<string, unknown> = tag === null ? {} : typedIds.length
    ? { $or: [{ hashtags: tag }, { eventId: { $in: typedIds } }] }
    : { hashtags: tag };
  const drivePhotos = db.collection('fanmass_event_drive_photos');

  // An event holding photos of the hashtag is one of its events too, whether or not anyone typed the hashtag onto it:
  // the event list follows Fanmass's placements by itself (owner 2026-11-14: the report must be fully automatic).
  const placedIn = tag === null ? [] : await drivePhotos.aggregate([{ $match: driveFilter }, { $group: { _id: '$eventId' } }]).toArray();
  const joinedIds = placedIn.map((row) => String(row._id ?? ''))
    .filter((id) => id && !taggedIds.includes(id) && ObjectId.isValid(id));
  const joined = joinedIds.length
    ? await db.collection('projects').find(
        { _id: { $in: joinedIds.map((id) => new ObjectId(id)) }, ...(organizationId ? { organizationId } : {}) },
        { projection: MACHINE_EVENT_PROJECTION },
      ).toArray()
    : [];
  const [facet] = await drivePhotos.aggregate(driveSummaryPipeline(driveFilter)).toArray();
  const { drive, byEvent: driveByEvent } = readDriveSummary(facet);
  // In the report because its photos carry the hashtag (placed there, or among its Fanmass hashtags), not typed on it
  const typedSet = new Set(typedIds);
  const joinedSet = new Set([...tagged, ...joined].map((p) => String(p._id)).filter((id) => !typedSet.has(id)));
  const projects = [...tagged, ...joined];
  const eventIds = projects.map((p) => String(p._id));

  const rollups = eventIds.length
    ? await db.collection('ai_analysis_summaries')
        .find({ eventId: { $in: eventIds }, sourceType: 'camera_photo_pipeline' }, { projection: { eventId: 1, summary: 1 } })
        .toArray()
    : [];
  const rollupByEvent = new Map(rollups.map((row) => [String(row.eventId), (row.summary ?? {}) as Record<string, unknown>]));

  // The opt-in is counted from the stored per-photo results themselves: a result carries it or it does not
  const withOptIn = eventIds.length
    ? await db.collection('fanmass_camera_photo_analyses').countDocuments({
        eventId: { $in: eventIds },
        tombstone: { $ne: true },
        status: 'completed',
        'optIn.received': true,
      })
    : 0;

  const nameOf = new Map(projects.map((p) => [String(p._id), String(p.eventName ?? '')]));
  const perEvent = new Map<string, number>();
  for (const [eventId, count] of driveByEvent) {
    if (!eventId) continue;
    const name = nameOf.get(eventId) || 'Unnamed event';
    perEvent.set(name, (perEvent.get(name) ?? 0) + count);
  }
  drive.events = topNames(perEvent);

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
        joinedBy: joinedSet.has(String(project._id)) ? 'photos' as const : 'hashtag' as const,
      };
    })
    .sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')) || a.name.localeCompare(b.name));

  const photos = mergePhotoSummaries(projects.map((p) => rollupByEvent.get(String(p._id))).filter((r): r is Record<string, unknown> => Boolean(r)));
  photos.withOptIn = withOptIn;
  photos.tagged = tag === null ? 0 : await db.collection('fanmass_camera_photo_analyses').countDocuments({ hashtags: tag, tombstone: { $ne: true }, status: 'completed' });
  return { events, counters, photos, drive };
}

function topNames(counts: Map<string, number>): NamedCount[] {
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 100);
}

/** A positive count rounded to a whole number, or 0 (the database form of the rule every photo count follows). */
const wholeExpr = (path: string) => ({ $cond: [{ $and: [{ $isNumber: path }, { $gt: [path, 0] }] }, { $round: [path, 0] }, 0] });
const isAnalysed = { $eq: [{ $type: '$analysis' }, 'object'] };

/** Sum the drive photos inside the database, so only the totals travel: downloading the 11,312 rows of the SZRT library
 * took 36 s on production, the same sums in the database take about one. Counts add, a breakdown adds each photo's
 * whole positive numbers, names are counted once per photo, and only analysed photos (an analysis object) give them. */
export function driveSummaryPipeline(match: Record<string, unknown>): Array<Record<string, unknown>> {
  const breakdown = (field: string) => [
    { $match: { [`analysis.${field}`]: { $type: 'object' } } },
    { $project: { kv: { $objectToArray: `$analysis.${field}` } } },
    { $unwind: '$kv' },
    { $project: { k: '$kv.k', n: wholeExpr('$kv.v') } },
    { $match: { n: { $gt: 0 } } },
    { $group: { _id: '$k', count: { $sum: '$n' } } },
  ];
  const names = (field: string) => [
    { $match: { [`analysis.${field}`]: { $type: 'array' } } },
    { $project: { name: { $setUnion: [`$analysis.${field}`, []] } } },
    { $unwind: '$name' },
    { $group: { _id: '$name', count: { $sum: 1 } } },
  ];
  return [
    { $match: match },
    { $facet: {
      totals: [{ $group: {
        _id: null,
        photos: { $sum: 1 },
        placed: { $sum: { $cond: [{ $ifNull: ['$eventId', false] }, 1, 0] } },
        placedOverHalf: { $sum: { $cond: [{ $and: [{ $ifNull: ['$eventId', false] }, { $isNumber: '$assignment.confidence' }, { $gt: ['$assignment.confidence', 0.5] }] }, 1, 0] } },
        withOptIn: { $sum: { $cond: [{ $eq: ['$optIn.received', true] }, 1, 0] } },
        analysed: { $sum: { $cond: [isAnalysed, 1, 0] } },
        people: { $sum: { $cond: [isAnalysed, wholeExpr('$analysis.people'), 0] } },
      } }],
      genders: breakdown('genders'),
      ageGroups: breakdown('ageGroups'),
      emotions: breakdown('emotions'),
      brands: names('brands'),
      clubs: names('clubs'),
      events: [{ $group: { _id: '$eventId', count: { $sum: 1 } } }],
    } },
  ];
}

type Row = { _id: unknown; count: number };
type DriveFacet = { totals?: Array<Record<string, number>>; genders?: Row[]; ageGroups?: Row[]; emotions?: Row[]; brands?: Row[]; clubs?: Row[]; events?: Row[] };

/** The result of driveSummaryPipeline as the measured drive block, plus the photo count of every event (key: event id). */
export function readDriveSummary(facet?: DriveFacet | Record<string, unknown>): { drive: MeasuredDrivePhotos; byEvent: Map<string, number> } {
  const f = (facet ?? {}) as DriveFacet;
  const t = f.totals?.[0] ?? {};
  const map = (rows?: Row[]) => Object.fromEntries((rows ?? []).map((row) => [String(row._id), row.count]));
  const list = (rows?: Row[]) => topNames(new Map((rows ?? []).map((row) => [String(row._id), row.count])));
  return {
    drive: {
      photos: t.photos ?? 0, placed: t.placed ?? 0, placedOverHalf: t.placedOverHalf ?? 0, analysed: t.analysed ?? 0,
      withOptIn: t.withOptIn ?? 0, people: t.people ?? 0,
      genders: map(f.genders), ageGroups: map(f.ageGroups), emotions: map(f.emotions),
      brands: list(f.brands), clubs: list(f.clubs), events: [],
    },
    byEvent: new Map((f.events ?? []).map((row) => [String(row._id ?? ''), row.count])),
  };
}
