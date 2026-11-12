// Human-in-the-loop review of the proof behind SZRT brand and club figures. Optional to use, always possible:
// a person can read every sample (including weak ones and rejected ones), confirm it, reject it, correct the name
// or kind it was matched to, add a sample of their own, or delete one they added.
//
// A person's decision wins over the machine. A reviewed sample is never overwritten or removed by a later
// delivery (lib/szrtBrandEvidence.ts), a rejected one is never shown as proof, and Fanmass reads the decisions
// back (`listReviewOverrides`) so the report figures follow them too. An automatic sample is rejected, not deleted:
// the rejection stays on record, otherwise the next delivery of the same region would bring it back.

import { randomUUID } from 'node:crypto';
import {
  EVIDENCE_MEDIA_FOLDER,
  PLACEHOLDERS,
  SZRT_EVIDENCE_COLLECTION,
  decodeImage,
  evidenceNameKey,
  invalid,
  parseBox,
  record,
  text,
  type BrandEvidenceDoc,
  type EvidenceKind,
  type EvidenceReview,
  type MediaUploader,
} from './szrtBrandEvidence';
import { storeMedia } from './mediaStorage';

export const REVIEW_PAGE_LIMIT = 100;
export const MAX_OVERRIDES = 5000;

export type ReviewFilter = 'needs_review' | 'confirmed' | 'rejected' | 'corrected' | 'human' | 'all';
export type ReviewAction = 'confirm' | 'reject' | 'correct' | 'restore';

type Cursor = { sort: (s: unknown) => Cursor; skip: (n: number) => Cursor; limit: (n: number) => Cursor; toArray: () => Promise<unknown[]> };
type ReviewCollection = {
  find: (filter: unknown, options?: unknown) => Cursor;
  findOne: (filter: unknown) => Promise<unknown>;
  countDocuments: (filter: unknown) => Promise<number>;
  updateOne: (filter: unknown, update: unknown) => Promise<unknown>;
  insertOne: (doc: unknown) => Promise<unknown>;
  deleteOne: (filter: unknown) => Promise<unknown>;
};
export type ReviewDb = { collection: (name: string) => ReviewCollection };

const KINDS = new Set(['brand', 'club']);
const REVIEW_FILTERS = new Set(['needs_review', 'confirmed', 'rejected', 'corrected', 'human', 'all']);
const ACTIONS = new Set(['confirm', 'reject', 'correct', 'restore']);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanName(value: unknown): string {
  const name = text(value, 100);
  if (!name || PLACEHOLDERS.has(name.toLowerCase())) invalid(400, 'INVALID_EVIDENCE_REVIEW', 'A real brand or club name is required.');
  return name;
}

function cleanKind(value: unknown): EvidenceKind {
  if (typeof value !== 'string' || !KINDS.has(value)) invalid(400, 'INVALID_EVIDENCE_REVIEW', 'kind must be brand or club.');
  return value as EvidenceKind;
}

/** What the review page lists. Needs-review shows the weakest proof first: that is where a person is most useful. */
export async function listEvidenceForReview(
  db: ReviewDb,
  input: { status?: string; kind?: string; name?: string; limit?: number; offset?: number },
): Promise<{ total: number; limit: number; offset: number; rows: Array<BrandEvidenceDoc & { id: string }> }> {
  const status = (REVIEW_FILTERS.has(input.status ?? '') ? input.status : 'needs_review') as ReviewFilter;
  const filter: Record<string, unknown> = {};
  if (status === 'needs_review') Object.assign(filter, { review: { $exists: false }, source: { $ne: 'human' } });
  else if (status === 'human') filter.source = 'human';
  else if (status !== 'all') filter['review.status'] = status;
  if (input.kind && KINDS.has(input.kind)) filter.entityKind = input.kind;
  const key = evidenceNameKey(input.name ?? '');
  if (key) filter.nameKey = { $regex: `^${escapeRegex(key)}` };
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? 50), 1), REVIEW_PAGE_LIMIT);
  const offset = Math.max(Math.trunc(input.offset ?? 0), 0);
  const collection = db.collection(SZRT_EVIDENCE_COLLECTION);
  const sort = status === 'needs_review' ? { score: 1, _id: 1 } : { 'review.at': -1, receivedAt: -1, _id: 1 };
  const [total, rows] = await Promise.all([
    collection.countDocuments(filter),
    collection.find(filter).sort(sort).skip(offset).limit(limit).toArray() as Promise<BrandEvidenceDoc[]>,
  ]);
  return { total, limit, offset, rows: rows.map((row) => ({ ...row, id: row._id })) };
}

/** Confirm, reject, correct or restore one sample. `by` is the signed-in person; it is stored with the decision. */
export async function reviewEvidence(
  db: ReviewDb,
  id: string,
  input: unknown,
  by: string,
  now: () => string = () => new Date().toISOString(),
): Promise<BrandEvidenceDoc> {
  const body = record(input) ?? invalid(400, 'INVALID_EVIDENCE_REVIEW', 'A JSON object is required.');
  const action = typeof body.action === 'string' && ACTIONS.has(body.action) ? (body.action as ReviewAction) : invalid(400, 'INVALID_EVIDENCE_REVIEW', 'action must be confirm, reject, correct or restore.');
  const collection = db.collection(SZRT_EVIDENCE_COLLECTION);
  const doc = (await collection.findOne({ _id: id })) as BrandEvidenceDoc | null;
  if (!doc) invalid(404, 'EVIDENCE_NOT_FOUND', 'No such sample.');
  const note = text(body.note, 300);
  const stamp = { by, at: now(), note };

  let update: Record<string, unknown>;
  if (action === 'restore') {
    const original = doc.review?.original;
    update = { $unset: { review: '' }, ...(original ? { $set: { name: original.name, nameKey: original.nameKey, entityKind: original.entityKind } } : {}) };
  } else if (action === 'correct') {
    const name = cleanName(body.name);
    const entityKind = cleanKind(body.kind ?? doc.entityKind);
    const original = doc.review?.original ?? { name: doc.name, nameKey: doc.nameKey, entityKind: doc.entityKind };
    const review: EvidenceReview = { status: 'corrected', ...stamp, original };
    update = { $set: { name, nameKey: evidenceNameKey(name), entityKind, review } };
  } else {
    const review: EvidenceReview = { status: action === 'confirm' ? 'confirmed' : 'rejected', ...stamp, ...(doc.review?.original ? { original: doc.review.original } : {}) };
    update = { $set: { review } };
  }
  await collection.updateOne({ _id: id }, update);
  return (await collection.findOne({ _id: id })) as BrandEvidenceDoc;
}

const defaultUploader: MediaUploader = async (bytes, folder) => (await storeMedia(bytes, { folder }))?.url ?? null;

/** A person adds a proof of their own: a picture (crop) and the name and kind it shows. It counts as proof. */
export async function createHumanEvidence(
  db: ReviewDb,
  input: unknown,
  by: string,
  options: { upload?: MediaUploader; now?: () => string; id?: () => string } = {},
): Promise<BrandEvidenceDoc> {
  const body = record(input) ?? invalid(400, 'INVALID_EVIDENCE', 'A JSON object is required.');
  const name = cleanName(body.name);
  const entityKind = cleanKind(body.kind);
  const crop = decodeImage(body.crop) ?? invalid(400, 'INVALID_EVIDENCE', 'crop must be a JPEG or PNG image (base64) of at most 1.5 MB.');
  const box = body.box === undefined || body.box === null ? { x: 0, y: 0, w: 1, h: 1 } : (parseBox(body.box) ?? invalid(400, 'INVALID_EVIDENCE', 'box must be fractions of the picture.'));
  const at = (options.now ?? (() => new Date().toISOString()))();
  const uuid = (options.id ?? randomUUID)();
  const cropUrl = await (options.upload ?? defaultUploader)(crop, EVIDENCE_MEDIA_FOLDER);
  if (!cropUrl) invalid(503, 'MEDIA_STORAGE_FAILED', 'The picture could not be stored.');
  const doc: BrandEvidenceDoc = {
    _id: `human:${uuid}`,
    fileKey: `human/${uuid}`,
    sport: text(body.sport, 40) || 'Other',
    entityKind,
    name,
    nameKey: evidenceNameKey(name),
    tier: 'human',
    method: 'human',
    match: null,
    readText: text(body.readText, 160),
    ocrConfidence: null,
    confidence: 1,
    itemType: 'other',
    onPerson: false,
    box,
    area: Math.round(box.w * box.h * 1e6) / 1e6,
    score: 1,
    cropUrl,
    analyzedAt: at,
    pipeline: 'human',
    receivedAt: at,
    source: 'human',
    review: { status: 'confirmed', by, at, note: text(body.note, 300) },
  };
  await db.collection(SZRT_EVIDENCE_COLLECTION).insertOne(doc);
  return doc;
}

/** Delete a sample the person added. An automatic one is rejected instead, so a delivery cannot bring it back. */
export async function deleteHumanEvidence(db: ReviewDb, id: string): Promise<void> {
  const collection = db.collection(SZRT_EVIDENCE_COLLECTION);
  const doc = (await collection.findOne({ _id: id })) as BrandEvidenceDoc | null;
  if (!doc) invalid(404, 'EVIDENCE_NOT_FOUND', 'No such sample.');
  if (doc.source !== 'human') {
    invalid(409, 'AUTOMATIC_EVIDENCE_CANNOT_BE_DELETED', 'Reject it instead: a rejected proof stays on record so it is not delivered again.');
  }
  await collection.deleteOne({ _id: id });
}

export interface ReviewOverride {
  id: string;
  fileKey: string;
  /** The Fanmass region the decision is about; empty for a sample a person added. */
  regionId: string;
  source: 'fanmass' | 'human';
  status: 'confirmed' | 'rejected' | 'corrected';
  name: string;
  kind: EvidenceKind;
}

/** Every decision a person made, for Fanmass to apply when it counts the figures. */
export async function listReviewOverrides(db: ReviewDb): Promise<ReviewOverride[]> {
  const rows = (await db
    .collection(SZRT_EVIDENCE_COLLECTION)
    .find({ $or: [{ review: { $exists: true } }, { source: 'human' }] })
    .sort({ _id: 1 })
    .limit(MAX_OVERRIDES)
    .toArray()) as BrandEvidenceDoc[];
  return rows.map((row) => ({
    id: row._id,
    fileKey: row.fileKey,
    regionId: row.source === 'human' ? '' : row._id.split('#')[1] ?? '',
    source: row.source === 'human' ? 'human' : 'fanmass',
    status: row.review?.status ?? 'confirmed',
    name: row.name,
    kind: row.entityKind,
  }));
}
