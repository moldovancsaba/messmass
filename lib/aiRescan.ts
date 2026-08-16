// lib/aiRescan.ts
// WHAT: Operator-requested re-analysis for one event's AI data — either a
//       specific module (demographics, brands/clubs/merchandise) or a full
//       force restart of every module.
// WHY: Analysis runs live on fanmass and are scoped per event, not per Drive
//      folder — unlike Check now / Pause (lib/driveFolders.ts), which are
//      about whether fanmass is still watching a folder for new files. This
//      is about redoing analysis fanmass has already run.
// HOW: Same "flag the next poll notices" pattern as driveFolders.ts, since
//      fanmass only polls messmass and has no reachable address of its own.
//      One pending request per event (collection is small; upsert keyed by
//      eventId). Cleared by fanmass once it has actually queued the run —
//      see app/api/integrations/fanmass/rescan-requests/[eventId]/route.ts —
//      not on request, so a crash between "flag set" and "run queued" leaves
//      the flag in place for the next poll to retry rather than losing it.

import { Db, ObjectId } from 'mongodb';
import { getDb } from './fanmassIntegration';

// WHAT: fanmass module ids this control can request, mapped to what each
//      actually feeds in the AI event report (verified against fanmass's own
//      MODULE_REGISTRY — see services/analytics_modules.py — not guessed).
// WHY sports_merchandise + fashion_brands together: the report's Brands,
//      Clubs & federations, and Merchandise sections are all three read from
//      one module's output (sportsMerchandise) plus fashion_brands' output
//      (fashionBrands) — there is no separate "merchandise module" to target.
// WHY fashion_brands is included in the "brands" preset here even though
//      fanmass's own default run (MESSMASS_RUN_PROPERTIES) omits it: the
//      report's Brands table reads fashionBrands, so a rescan explicitly
//      asked for by an operator should actually populate it, even though the
//      routine auto-trigger after ingestion does not run it by default.
export const RESCAN_MODULE_OPTIONS = [
  { id: 'demographics', label: 'Demographics', properties: ['people'] },
  { id: 'brands', label: 'Brands, clubs & merchandise', properties: ['sports_merchandise', 'fashion_brands'] },
  { id: 'poster_faces', label: 'Poster faces', properties: ['poster_faces'] },
] as const;

export type RescanModuleId = (typeof RESCAN_MODULE_OPTIONS)[number]['id'];

// null means every module, including fashion_brands (see WHY above) — a
// superset of fanmass's own default MESSMASS_RUN_PROPERTIES.
export const RESCAN_ALL_PROPERTIES = ['poster_faces', 'people', 'brand_scan', 'sports_merchandise', 'fashion_brands'];

export interface AiRescanRequest {
  eventId: string;
  properties: string[] | null;
  moduleId: RescanModuleId | 'all';
  requestedAt: string;
  requestedBy?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toRescanRequest(doc: any): AiRescanRequest {
  return {
    eventId: String(doc.eventId),
    properties: Array.isArray(doc.properties) ? doc.properties.map(String) : null,
    moduleId: doc.moduleId || 'all',
    requestedAt: doc.requestedAt,
    requestedBy: doc.addedBy ?? undefined,
  };
}

async function ensureRescanIndexes(db: Db): Promise<void> {
  await db.collection('ai_rescan_requests').createIndex({ eventId: 1 }, { unique: true });
}

// WHAT: Ask for a module rescan (properties non-null) or a full restart
//      (moduleId 'all', properties null -> RESCAN_ALL_PROPERTIES on the
//      fanmass side).
export async function requestRescan(
  eventId: string,
  moduleId: RescanModuleId | 'all',
  requestedBy?: string
): Promise<AiRescanRequest> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  const option = moduleId === 'all' ? null : RESCAN_MODULE_OPTIONS.find((o) => o.id === moduleId);
  if (moduleId !== 'all' && !option) {
    throw Object.assign(new Error(`Unknown rescan module: ${moduleId}`), { status: 400, code: 'INVALID_RESCAN_MODULE' });
  }
  const db = await getDb();
  await ensureRescanIndexes(db);
  const timestamp = nowIso();
  const doc = {
    eventId,
    moduleId,
    properties: option ? [...option.properties] : null,
    requestedAt: timestamp,
    addedBy: requestedBy || undefined,
  };
  await db.collection('ai_rescan_requests').replaceOne({ eventId }, doc, { upsert: true });
  return toRescanRequest(doc);
}

export async function getRescanRequest(eventId: string): Promise<AiRescanRequest | null> {
  const db = await getDb();
  const doc = await db.collection('ai_rescan_requests').findOne({ eventId });
  return doc ? toRescanRequest(doc) : null;
}

// WHAT: Every pending request, for fanmass's poll.
// WHY: Rescans are rare operator actions, not a per-tick discovery sweep like
//     Drive folders — a plain find() is cheap enough with no projection tuning.
export async function listPendingRescanRequests(): Promise<AiRescanRequest[]> {
  const db = await getDb();
  const docs = await db.collection('ai_rescan_requests').find({}).toArray();
  return docs.map(toRescanRequest);
}

// WHAT: Called by fanmass once it has actually queued the run.
// WHY: Deleting rather than marking "done" — a rescan request has no useful
//     state once served; the run itself is now tracked as a normal analysis
//     run, visible the same way any other run is.
export async function clearRescanRequest(eventId: string): Promise<void> {
  const db = await getDb();
  await db.collection('ai_rescan_requests').deleteOne({ eventId });
}
