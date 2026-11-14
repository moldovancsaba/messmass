// lib/fanmassEventHashtags.ts
// WHAT: Fanmass adds hashtags to Messmass events it knows belong to a campaign (the SZRT games: #tippmixreport2026).
// WHY: Owner 2026-11-14: "Tippmix has to be added to the events", automatically. Additive only: a hashtag is added to
//     an event's plain hashtag list when the event does not carry it yet in any of its lists (any case); nothing is
//     ever removed or replaced, so the undo is removing that one hashtag again. Only the Fanmass token reaches it.

import { ObjectId, type Db } from 'mongodb';

import { compactHashtag } from './photoHashtags';

export const EVENT_HASHTAGS_CONTRACT = 'fanmass.messmass.event-hashtags.v1';
const MAX_EVENTS = 500;
const MAX_HASHTAGS = 5;

export interface EventHashtagsRequest { hashtags: string[]; eventIds: string[] }
export interface EventHashtagsResult {
  added: Array<{ eventId: string; hashtags: string[] }>;
  unchanged: string[];
  /** No such event. */
  missing: string[];
  /** The event's hashtag list is not a list (an old comma-separated text): left untouched for a person to fix. */
  skipped: string[];
}

function invalid(message: string, status = 400, code = 'INVALID_EVENT_HASHTAGS'): never {
  throw Object.assign(new Error(message), { status, code });
}

export function parseEventHashtagsRequest(body: unknown): EventHashtagsRequest {
  const raw = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : invalid('A JSON object is required.');
  if (raw.contractVersion !== EVENT_HASHTAGS_CONTRACT) invalid(`Expected ${EVENT_HASHTAGS_CONTRACT}.`, 409, 'CONTRACT_MISMATCH');
  if (!Array.isArray(raw.hashtags) || !raw.hashtags.length || raw.hashtags.length > MAX_HASHTAGS) invalid(`hashtags must list 1-${MAX_HASHTAGS} hashtags.`);
  const hashtags = [...new Set(raw.hashtags.map((tag) => (typeof tag === 'string' ? tag.trim().replace(/^#/, '').toLowerCase() : '')))];
  if (hashtags.some((tag) => !/^[a-z0-9_]{1,60}$/.test(tag))) invalid('A hashtag is lowercase letters, digits and _ only, at most 60.');
  if (!Array.isArray(raw.eventIds) || !raw.eventIds.length || raw.eventIds.length > MAX_EVENTS) invalid(`eventIds must list 1-${MAX_EVENTS} events.`);
  const eventIds = [...new Set(raw.eventIds.map(String))];
  if (eventIds.some((id) => !ObjectId.isValid(id) || id.length !== 24)) invalid('Every event id must be a Messmass event id.');
  return { hashtags, eventIds };
}

/** Every hashtag an event carries, in its compact identity (lib/photoHashtags.ts), from its plain and category lists. */
function carried(event: Record<string, unknown>): Set<string> {
  const out = new Set<string>();
  const add = (list: unknown) => { if (Array.isArray(list)) for (const tag of list) out.add(compactHashtag(String(tag))); };
  add(event.hashtags);
  const categorized = event.categorizedHashtags;
  if (categorized && typeof categorized === 'object' && !Array.isArray(categorized)) Object.values(categorized).forEach(add);
  return out;
}

export async function addEventHashtags(db: Db, input: EventHashtagsRequest, now = new Date()): Promise<EventHashtagsResult> {
  const events = await db.collection('projects')
    .find({ _id: { $in: input.eventIds.map((id) => new ObjectId(id)) } }, { projection: { hashtags: 1, categorizedHashtags: 1 } })
    .toArray();
  const found = new Map(events.map((event) => [String(event._id), event as Record<string, unknown>]));
  const result: EventHashtagsResult = { added: [], unchanged: [], missing: [], skipped: [] };
  for (const id of input.eventIds) {
    const event = found.get(id);
    if (!event) { result.missing.push(id); continue; }
    if (event.hashtags !== undefined && event.hashtags !== null && !Array.isArray(event.hashtags)) { result.skipped.push(id); continue; }
    const have = carried(event);
    const missing = input.hashtags.filter((tag) => !have.has(compactHashtag(tag)));
    if (!missing.length) { result.unchanged.push(id); continue; }
    await db.collection('projects').updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { hashtags: { $each: missing } }, $set: { updatedAt: now.toISOString() } },
    );
    result.added.push({ eventId: id, hashtags: missing });
  }
  return result;
}

/** Fanmass hashtags of every event: the hashtags Fanmass wrote onto its photos (drive and Camera), without the event's own
 * typed hashtags (Messmass copies those onto each photo), kept in `fanmassHashtags` apart from the typed `hashtags`.
 * Owner 2026-11-14: typed and automatic hashtags work together in the filter, the reports stay separate. Recomputed
 * whole on every call, so a photo that moved or was erased takes its hashtags with it. */
export async function refreshFanmassHashtags(db: Db, now = new Date()): Promise<{ events: number; changed: number; cleared: number }> {
  const perEvent = (collection: string, match: Record<string, unknown>) => db.collection(collection).aggregate([
    { $match: { ...match, eventId: { $nin: [null, ''] }, 'hashtags.0': { $exists: true } } },
    { $unwind: '$hashtags' },
    { $group: { _id: '$eventId', tags: { $addToSet: '$hashtags' } } },
  ]).toArray();
  const [drive, camera] = await Promise.all([
    perEvent('fanmass_event_drive_photos', {}),
    perEvent('fanmass_camera_photo_analyses', { tombstone: { $ne: true }, status: 'completed' }),
  ]);
  const tagsOf = new Map<string, Set<string>>();
  for (const row of [...drive, ...camera]) {
    const id = String(row._id);
    if (!ObjectId.isValid(id) || id.length !== 24) continue;
    const set = tagsOf.get(id) ?? new Set<string>();
    for (const tag of row.tags as string[]) set.add(String(tag).toLowerCase());
    tagsOf.set(id, set);
  }
  const ids = [...tagsOf.keys()];
  const events = ids.length
    ? await db.collection('projects').find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }, { projection: { hashtags: 1, categorizedHashtags: 1, fanmassHashtags: 1 } }).toArray()
    : [];
  let changed = 0;
  for (const event of events) {
    const typed = carried(event as Record<string, unknown>);
    const tags = [...(tagsOf.get(String(event._id)) ?? [])].filter((tag) => !typed.has(compactHashtag(tag))).sort().slice(0, 300);
    if (JSON.stringify(tags) === JSON.stringify(event.fanmassHashtags ?? [])) continue;
    await db.collection('projects').updateOne({ _id: event._id }, { $set: { fanmassHashtags: tags, fanmassHashtagsAt: now.toISOString() } });
    changed += 1;
  }
  // An event whose photos all left keeps no Fanmass hashtags
  const stale = await db.collection('projects').updateMany(
    { fanmassHashtags: { $exists: true }, _id: { $nin: events.map((event) => event._id) } },
    { $unset: { fanmassHashtags: '', fanmassHashtagsAt: '' } },
  );
  return { events: events.length, changed, cleared: stale.modifiedCount };
}

/** Every event's identity, for Fanmass to find the Messmass event of a campaign game by its date and clubs. */
export async function listEvents(db: Db): Promise<Array<{ id: string; name: string; date: string }>> {
  const rows = await db.collection('projects').find({}, { projection: { eventName: 1, eventDate: 1 } }).limit(20000).toArray();
  return rows.map((row) => ({ id: String(row._id), name: String(row.eventName ?? ''), date: String(row.eventDate ?? '') }));
}
