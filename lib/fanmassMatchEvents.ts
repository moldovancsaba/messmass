// lib/fanmassMatchEvents.ts
// WHAT: Fanmass asks Messmass to create the event of a sports match it holds photos of: home club, away club, date.
// WHY: Owner answer 509 (2026-11-14): SZRT drive photos of five campaign games had no Messmass event. The event is made
//     exactly like Quick Add's match builder (lib/matchEvent.ts, lib/createEvent.ts): the two clubs must be Messmass
//     partners already, matched by name with case and accents ignored, and exactly one partner per name; anything
//     else is refused with the candidates, never guessed. The same match on the same date is created once.

import type { Db } from 'mongodb';
import { insertEvent } from './createEvent';
import { buildMatchEvent, EMPTY_MATCH_STATS } from './matchEvent';

export const MATCH_EVENT_CONTRACT = 'fanmass.messmass.match-event.v1';

export interface MatchEventRequest { home: string; away: string; eventDate: string }

function invalid(status: number, code: string, message: string, details?: unknown): never {
  throw Object.assign(new Error(message), { status, code, details });
}

/** Names compared without case, accents, punctuation or spaces ("NYÍREGYHÁZA SPARTACUS FC" = "Nyíregyháza Spartacus FC"). */
export const foldName = (text: string): string =>
  text.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function parseMatchEventRequest(body: unknown): MatchEventRequest {
  const raw = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : invalid(400, 'INVALID_MATCH_EVENT', 'A JSON object is required.');
  if (raw.contractVersion !== MATCH_EVENT_CONTRACT) invalid(409, 'CONTRACT_MISMATCH', `Expected ${MATCH_EVENT_CONTRACT}.`);
  const text = (value: unknown, field: string) => {
    const out = typeof value === 'string' ? value.trim() : '';
    if (!out || out.length > 120) invalid(400, 'INVALID_MATCH_EVENT', `${field} must be a club name.`);
    return out;
  };
  const eventDate = typeof raw.eventDate === 'string' ? raw.eventDate.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(Date.parse(eventDate))) invalid(400, 'INVALID_MATCH_EVENT', 'eventDate must be YYYY-MM-DD.');
  const home = text(raw.home, 'home');
  const away = text(raw.away, 'away');
  if (foldName(home) === foldName(away)) invalid(400, 'INVALID_MATCH_EVENT', 'home and away must be two clubs.');
  return { home, away, eventDate };
}

type PartnerDoc = { _id: unknown; name: string; hashtags?: string[]; categorizedHashtags?: Record<string, string[]> };

/** The one partner whose folded name equals the club's; refused when there is none or more than one. */
export function pickPartner(partners: PartnerDoc[], club: string, side: string): PartnerDoc {
  const key = foldName(club);
  const exact = partners.filter((p) => foldName(String(p.name ?? '')) === key);
  if (exact.length === 1) return exact[0];
  const near = partners.filter((p) => foldName(String(p.name ?? '')).includes(key) || key.includes(foldName(String(p.name ?? '')))).map((p) => p.name).slice(0, 10);
  invalid(409, exact.length ? 'AMBIGUOUS_PARTNER' : 'PARTNER_NOT_FOUND', `${side} club "${club}" ${exact.length ? 'matches several partners' : 'is not a Messmass partner'}.`, { candidates: exact.length ? exact.map((p) => p.name) : near });
}

export async function createMatchEvent(db: Db, request: MatchEventRequest): Promise<{ created: boolean; eventId: string; eventName: string; project: Record<string, any> }> {
  const partners = (await db.collection('partners').find({}, { projection: { name: 1, hashtags: 1, categorizedHashtags: 1 } }).toArray()) as unknown as PartnerDoc[];
  const home = pickPartner(partners, request.home, 'home');
  const away = pickPartner(partners, request.away, 'away');
  const existing = await db.collection('projects').findOne({ partner1Id: home._id, partner2Id: away._id, eventDate: request.eventDate });
  if (existing) return { created: false, eventId: String(existing._id), eventName: String(existing.eventName ?? ''), project: existing };
  const match = buildMatchEvent(home, away);
  const { insertedId, project } = await insertEvent(db, {
    ...match,
    eventDate: request.eventDate,
    stats: EMPTY_MATCH_STATS,
    partner1Id: String(home._id),
    partner2Id: String(away._id),
  });
  return { created: true, eventId: String(insertedId), eventName: match.eventName, project: { ...project, _id: insertedId } };
}
