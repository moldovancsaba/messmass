// lib/fanmassEventHashtags.ts
// WHAT: Fanmass adds hashtags to Messmass events it knows belong to a campaign (the SZRT games: #tippmixreport2026).
// WHY: Owner 2026-11-14: "Tippmix has to be added to the events", automatically. Additive only: a hashtag is added to
//     an event's plain hashtag list when the event does not carry it yet in any of its lists (any case); nothing is
//     ever removed or replaced, so the undo is removing that one hashtag again. Only the Fanmass token reaches it.

import { ObjectId, type Db } from 'mongodb';

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

/** Every tag an event carries, lowercase, from its plain list and every category list. */
function carried(event: Record<string, unknown>): Set<string> {
  const out = new Set<string>();
  const add = (list: unknown) => { if (Array.isArray(list)) for (const tag of list) out.add(String(tag).replace(/^#/, '').toLowerCase()); };
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
    const missing = input.hashtags.filter((tag) => !have.has(tag));
    if (!missing.length) { result.unchanged.push(id); continue; }
    await db.collection('projects').updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { hashtags: { $each: missing } }, $set: { updatedAt: now.toISOString() } },
    );
    result.added.push({ eventId: id, hashtags: missing });
  }
  return result;
}
