/**
 * fanmass mapping helpers — server-to-server CRUD used by the token-authed
 * /api/integrations/fanmass/{partners,events,variables} endpoints.
 *
 * Reuses messmass's own invariant helpers (slug generation, derived-metric
 * enrichment, V3 sync) so integration-created partners/events/variables are
 * identical to ones created via the admin UI. In messmass a "project" IS an
 * event and a "variable" name IS the stats key.
 */
import { ObjectId, type Db } from 'mongodb';
import { getDb } from './fanmassIntegration';
import { generateUniquePartnerViewSlug } from './partnerIdentifier';
import { generateProjectSlugs } from './slugUtils';
import { prepareStatsForAnalytics } from './dataValidator';
import { addDerivedMetrics } from './projectStatsUtils';
import { syncPartnerToV3Entity } from './v3/syncEngine';

function nowIso(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

export interface MMPartner {
  id: string;
  name: string;
  emoji: string | null;
  logoUrl: string | null;
  hashtags: string[];
  viewSlug: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function toPartner(doc: any): MMPartner {
  return {
    id: String(doc._id),
    name: doc.name,
    emoji: doc.emoji ?? null,
    logoUrl: doc.logoUrl ?? null,
    hashtags: Array.isArray(doc.hashtags) ? doc.hashtags : [],
    viewSlug: doc.viewSlug ?? null,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

export async function listPartners(opts: { search?: string; limit?: number; offset?: number } = {}) {
  const db = await getDb();
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const offset = Math.max(opts.offset ?? 0, 0);
  const query: Record<string, unknown> = {};
  if (opts.search) query.name = { $regex: opts.search, $options: 'i' };
  const cursor = db.collection('partners').find(query).sort({ name: 1 }).skip(offset).limit(limit);
  const [docs, total] = await Promise.all([cursor.toArray(), db.collection('partners').countDocuments(query)]);
  return { partners: docs.map(toPartner), pagination: { total, limit, offset, hasMore: offset + docs.length < total } };
}

export async function createPartner(input: { name: string; emoji?: string; logoUrl?: string; hashtags?: string[] }): Promise<MMPartner> {
  const name = String(input.name || '').trim();
  if (!name) throw Object.assign(new Error('name is required'), { status: 400, code: 'NAME_REQUIRED' });
  const db = await getDb();
  const viewSlug = await generateUniquePartnerViewSlug(db as unknown as Db);
  const partnerData: Record<string, unknown> = {
    name,
    emoji: String(input.emoji || '📷').trim() || '📷', // messmass requires an emoji
    hashtags: Array.isArray(input.hashtags) ? input.hashtags : [],
    categorizedHashtags: {},
    bitlyLinks: [],
    logoUrl: input.logoUrl || undefined,
    viewSlug,
    source: 'fanmass',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const result = await db.collection('partners').insertOne(partnerData);
  syncPartnerToV3Entity({ ...partnerData, _id: result.insertedId } as any).catch(() => {});
  return toPartner({ ...partnerData, _id: result.insertedId });
}

// ---------------------------------------------------------------------------
// Events (projects)
// ---------------------------------------------------------------------------

export interface MMEvent {
  id: string;
  eventName: string;
  eventDate: string | null;
  viewSlug: string | null;
  editSlug: string | null;
  stats: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

function toEvent(doc: any): MMEvent {
  return {
    id: String(doc._id),
    eventName: doc.eventName,
    eventDate: doc.eventDate ?? null,
    viewSlug: doc.viewSlug ?? null,
    editSlug: doc.editSlug ?? null,
    stats: doc.stats ?? {},
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

export async function listPartnerEvents(partnerId: string): Promise<MMEvent[]> {
  if (!ObjectId.isValid(partnerId)) {
    throw Object.assign(new Error('Invalid partner id'), { status: 422, code: 'INVALID_PARTNER_ID' });
  }
  const db = await getDb();
  const oid = new ObjectId(partnerId);
  const events = await db.collection('projects')
    .find({ $or: [{ partnerId: oid }, { partner1Id: oid }, { partner2Id: oid }] })
    .sort({ eventDate: -1 })
    .toArray();
  return events.map(toEvent);
}

export async function createEvent(input: { eventName: string; eventDate?: string; partner1Id?: string; stats?: Record<string, unknown> }): Promise<MMEvent> {
  const eventName = String(input.eventName || '').trim();
  if (!eventName) throw Object.assign(new Error('eventName is required'), { status: 400, code: 'EVENT_NAME_REQUIRED' });
  const db = await getDb();
  const { viewSlug, editSlug } = await generateProjectSlugs();
  const prepared = prepareStatsForAnalytics((input.stats ?? {}) as any);
  const doc: Record<string, unknown> = {
    eventName,
    eventDate: String(input.eventDate || nowIso()),
    stats: prepared.stats,
    hashtags: [],
    categorizedHashtags: {},
    viewSlug,
    editSlug,
    source: 'fanmass',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  if (input.partner1Id && ObjectId.isValid(input.partner1Id)) {
    doc.partner1Id = new ObjectId(input.partner1Id);
    doc.partnerId = new ObjectId(input.partner1Id); // also set legacy single ref for public reads
  }
  const result = await db.collection('projects').insertOne(doc);
  return toEvent({ ...doc, _id: result.insertedId });
}

export async function getEvent(eventId: string): Promise<MMEvent | null> {
  if (!ObjectId.isValid(eventId)) return null;
  const db = await getDb();
  const doc = await db.collection('projects').findOne({ _id: new ObjectId(eventId) });
  return doc ? toEvent(doc) : null;
}

// ---------------------------------------------------------------------------
// Variables (variables_metadata) — variable.name IS the stats key
// ---------------------------------------------------------------------------

export interface MMVariable {
  name: string;
  label: string;
  type: string;
  category: string;
  unit: string | null;
  derived: boolean;
  formula: string | null;
  isSystem: boolean;
}

const VAR_NAME_RE = /^[a-zA-Z][a-zA-Z0-9]*$/;

function toVariable(doc: any): MMVariable {
  return {
    name: doc.name,
    label: doc.label ?? doc.name,
    type: doc.type ?? 'count',
    category: doc.category ?? 'Custom',
    unit: doc.unit ?? null,
    derived: Boolean(doc.derived),
    formula: doc.formula ?? null,
    isSystem: Boolean(doc.isSystem),
  };
}

export async function listVariables(): Promise<MMVariable[]> {
  const db = await getDb();
  const docs = await db.collection('variables_metadata').find({}).sort({ category: 1, order: 1, name: 1 }).toArray();
  return docs.map(toVariable);
}

export async function createVariable(input: { name: string; label?: string; type?: string; category?: string; unit?: string; description?: string }): Promise<{ variable: MMVariable; created: boolean }> {
  const name = String(input.name || '').replace(/^stats\./, '').trim();
  if (!VAR_NAME_RE.test(name)) {
    throw Object.assign(new Error('Variable name must be camelCase (letters/digits, starting with a letter)'), { status: 400, code: 'INVALID_VARIABLE_NAME' });
  }
  const db = await getDb();
  const existing = await db.collection('variables_metadata').findOne({ name });
  const setOnInsert: Record<string, unknown> = {
    name,
    isSystem: false,
    type: input.type || 'count',
    category: input.category || 'Custom',
    derived: false,
    flags: { visibleInClicker: false, editableInManual: true },
    order: 999,
    label: input.label || name,
    createdAt: nowIso(),
  };
  const set: Record<string, unknown> = { updatedAt: nowIso() };
  if (existing) {
    if (input.label) set.label = input.label;
    if (input.type) set.type = input.type;
    if (input.category) set.category = input.category;
    if (input.unit !== undefined) set.unit = input.unit;
    if (input.description !== undefined) set.description = input.description;
  } else {
    if (input.unit !== undefined) setOnInsert.unit = input.unit;
    if (input.description !== undefined) setOnInsert.description = input.description;
  }
  await db.collection('variables_metadata').updateOne({ name }, { $set: set, $setOnInsert: setOnInsert }, { upsert: true });
  const saved = await db.collection('variables_metadata').findOne({ name });
  return { variable: toVariable(saved), created: !existing };
}

// ---------------------------------------------------------------------------
// Push stats — partial merge into an event's stats (never touches derived vars)
// ---------------------------------------------------------------------------

export async function pushEventStats(eventId: string, statsPartial: Record<string, unknown>): Promise<{ eventId: string; stats: Record<string, unknown>; applied: string[] }> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  if (!statsPartial || typeof statsPartial !== 'object') {
    throw Object.assign(new Error('stats object is required'), { status: 400, code: 'STATS_REQUIRED' });
  }
  const db = await getDb();
  const oid = new ObjectId(eventId);
  const event = await db.collection('projects').findOne({ _id: oid }, { projection: { stats: 1 } });
  if (!event) throw Object.assign(new Error('Event not found'), { status: 404, code: 'EVENT_NOT_FOUND' });

  // Do not overwrite derived (formula-computed) variables.
  const derivedNames = new Set(
    (await db.collection('variables_metadata').find({ derived: true }, { projection: { name: 1 } }).toArray()).map((v) => v.name),
  );
  const applied: string[] = [];
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(statsPartial)) {
    if (derivedNames.has(k)) continue;
    clean[k] = v;
    applied.push(k);
  }

  const mergedStats = addDerivedMetrics({ ...(event.stats || {}), ...clean } as any);
  await db.collection('projects').updateOne({ _id: oid }, { $set: { stats: mergedStats, updatedAt: new Date().toISOString() } });
  return { eventId, stats: mergedStats, applied };
}
