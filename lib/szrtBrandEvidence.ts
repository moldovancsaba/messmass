// Proof behind a brand or club figure in the SZRT report: the crop of the picture where its name was read,
// the box, and how it was identified. Fanmass reads the text in each picture (Apple Vision OCR) and sends
// one sample per proven region; the report shows them, never a number without a sample behind it.
//
// A name only a model recalled (`model_identified`) is stored and counted but never shown as proof.

import { createHash } from 'node:crypto';
import { storeMedia } from './mediaStorage';

export const SZRT_EVIDENCE_COLLECTION = 'szrt_brand_evidence';
export const EVIDENCE_SAMPLE_LIMIT = 12;
export const MAX_EVIDENCE_BATCH = 40;
export const MAX_EVIDENCE_IMAGE_BYTES = 1_500_000;
export const EVIDENCE_MEDIA_FOLDER = 'szrt-evidence';

export type EvidenceKind = 'brand' | 'club';
export type EvidenceTier = 'text_read' | 'model_identified';

export interface EvidenceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BrandEvidenceDoc {
  _id: string;
  fileKey: string;
  sport: string;
  entityKind: EvidenceKind;
  name: string;
  nameKey: string;
  tier: EvidenceTier;
  method: string;
  match: string | null;
  readText: string;
  ocrConfidence: number | null;
  confidence: number;
  itemType: string;
  onPerson: boolean;
  box: EvidenceBox;
  area: number;
  score: number;
  cropUrl: string;
  photoUrl?: string;
  analyzedAt: string;
  pipeline: string;
  receivedAt: string;
}

/** What the report may show for one sample. Nothing that identifies a person or a file path. */
export interface EvidenceSample {
  id: string;
  sport: string;
  tier: EvidenceTier;
  method: string;
  match: string | null;
  readText: string;
  ocrConfidence: number | null;
  confidence: number;
  itemType: string;
  onPerson: boolean;
  box: EvidenceBox;
  cropUrl: string;
  photoUrl: string | null;
  analyzedAt: string;
}

export interface BrandEvidenceListing {
  kind: EvidenceKind;
  name: string;
  /** Distinct photos where the name was read from the picture. */
  provenPhotos: number;
  /** Distinct photos where only the model suggested it. Counted for transparency, never shown as proof. */
  modelIdentifiedPhotos: number;
  samples: EvidenceSample[];
}

export interface ParsedEvidenceSample {
  /** Position in the request, so a skip can be reported against the sender's own list. */
  index: number;
  doc: Omit<BrandEvidenceDoc, 'cropUrl' | 'photoUrl' | 'receivedAt'>;
  crop: Buffer;
  photo: Buffer | null;
}

export type EvidenceSkip = { index: number; reason: string };

type Collection = {
  updateOne: (filter: unknown, update: unknown, options?: unknown) => Promise<unknown>;
  find: (filter: unknown, options?: unknown) => { sort: (s: unknown) => { limit: (n: number) => { toArray: () => Promise<unknown[]> } } };
  aggregate: (pipeline: unknown[]) => { toArray: () => Promise<unknown[]> };
  createIndex?: (spec: unknown, options?: unknown) => Promise<unknown>;
};
export type EvidenceDb = { collection: (name: string) => Collection };
export type MediaUploader = (bytes: Buffer, folder: string) => Promise<string | null>;

const PLACEHOLDERS = new Set(['', 'unknown', 'n/a', 'na', 'none', 'null', 'undefined', 'brand', 'logo', 'other', 'unsure']);
const FILE_KEY = /^[A-Za-z0-9 _-]{1,40}\/[A-Za-z0-9._-]{1,120}$/;
const SAFE_ID = /^[A-Za-z0-9_-]{1,40}$/;

function invalid(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function unit(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : null;
}

/** Lookup key for a brand or club name: case, accents and punctuation do not matter. */
export function evidenceNameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseBox(value: unknown): EvidenceBox | null {
  const raw = record(value);
  if (!raw) return null;
  const x = unit(raw.x);
  const y = unit(raw.y);
  const w = unit(raw.w);
  const h = unit(raw.h);
  if (x === null || y === null || w === null || h === null || w <= 0 || h <= 0 || x + w > 1.01 || y + h > 1.01) return null;
  return { x, y, w, h };
}

function decodeImage(value: unknown): Buffer | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const bytes = Buffer.from(value.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
  if (bytes.length === 0 || bytes.length > MAX_EVIDENCE_IMAGE_BYTES) return null;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const png = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return jpeg || png ? bytes : null;
}

/** 0..1, higher is stronger proof: what the OCR read, how sure the match was, exact before partial. */
function evidenceScore(confidence: number, ocrConfidence: number | null, match: string | null): number {
  return Math.round(confidence * (ocrConfidence ?? 1) * (match === 'exact' ? 1 : 0.9) * 1000) / 1000;
}

/**
 * One envelope of samples from Fanmass: `{ pipeline, samples: [{ fileKey, sport, analyzedAt, region, crop, photo? }] }`,
 * where `region` is one brand region of the Fanmass analysis and `crop` / `photo` are base64 images.
 * A broken envelope is refused; a bad sample is skipped with its reason so the rest still arrives.
 */
export function parseEvidenceBatch(body: unknown): { parsed: ParsedEvidenceSample[]; skipped: EvidenceSkip[] } {
  const envelope = record(body);
  const samples = envelope?.samples;
  if (!envelope || !Array.isArray(samples) || samples.length === 0) {
    invalid(400, 'INVALID_EVIDENCE_BATCH', 'A JSON object with a non-empty samples array is required.');
  }
  if (samples.length > MAX_EVIDENCE_BATCH) {
    invalid(413, 'EVIDENCE_BATCH_TOO_LARGE', `At most ${MAX_EVIDENCE_BATCH} samples per request.`);
  }
  const pipeline = text(envelope.pipeline, 80);
  if (!pipeline) invalid(400, 'INVALID_EVIDENCE_BATCH', 'pipeline is required.');

  const parsed: ParsedEvidenceSample[] = [];
  const skipped: EvidenceSkip[] = [];
  samples.forEach((raw, index) => {
    const sample = record(raw);
    const region = record(sample?.region);
    const evidence = record(region?.evidence);
    const fail = (reason: string) => skipped.push({ index, reason });
    if (!sample || !region || !evidence) return fail('missing_region');

    const fileKey = text(sample.fileKey, 200);
    if (!FILE_KEY.test(fileKey)) return fail('invalid_file_key');
    const regionId = text(region.regionId, 40);
    if (!SAFE_ID.test(regionId)) return fail('invalid_region_id');
    const name = text(region.shortName, 100);
    if (PLACEHOLDERS.has(name.toLowerCase())) return fail('placeholder_name');
    const tier = evidence.tier === 'text_read' || evidence.tier === 'model_identified' ? evidence.tier : null;
    if (!tier) return fail('invalid_tier');
    const entityKind = evidence.entityKind === 'club' ? 'club' : evidence.entityKind === 'brand' ? 'brand' : null;
    if (!entityKind) return fail('invalid_entity_kind');
    const box = parseBox(region.bbox);
    if (!box) return fail('invalid_box');
    const confidence = unit(region.confidence);
    if (confidence === null) return fail('invalid_confidence');
    const ocrConfidence = evidence.ocrConfidence === undefined || evidence.ocrConfidence === null ? null : unit(evidence.ocrConfidence);
    if (evidence.ocrConfidence !== undefined && evidence.ocrConfidence !== null && ocrConfidence === null) return fail('invalid_ocr_confidence');
    // Proof is the text read from the picture. A text_read sample without the text is not proof.
    const readText = text(evidence.ocrText ?? region.visibleText, 160);
    if (tier === 'text_read' && !readText) return fail('text_read_without_text');
    const analyzedAt = text(sample.analyzedAt, 40);
    if (!analyzedAt || Number.isNaN(Date.parse(analyzedAt))) return fail('invalid_analyzed_at');
    const crop = decodeImage(sample.crop);
    if (!crop) return fail('invalid_crop_image');
    const photo = sample.photo === undefined || sample.photo === null ? null : decodeImage(sample.photo);
    if (sample.photo !== undefined && sample.photo !== null && !photo) return fail('invalid_photo_image');

    const match = text(evidence.match, 20) || null;
    parsed.push({
      index,
      crop,
      photo,
      doc: {
        _id: `${fileKey}#${regionId}`,
        fileKey,
        sport: text(sample.sport, 40) || fileKey.split('/')[0],
        entityKind,
        name,
        nameKey: evidenceNameKey(name),
        tier,
        method: text(evidence.method, 40) || 'ocr',
        match,
        readText,
        ocrConfidence,
        confidence,
        itemType: text(region.itemType, 48) || 'other',
        onPerson: evidence.onPerson === true,
        box,
        area: Math.round(box.w * box.h * 1e6) / 1e6,
        score: evidenceScore(confidence, ocrConfidence, match),
        analyzedAt,
        pipeline,
      },
    });
  });
  return { parsed, skipped };
}

const defaultUploader: MediaUploader = async (bytes, folder) => (await storeMedia(bytes, { folder }))?.url ?? null;

let indexed = false;

/** Upload the images (content-addressed, so a resend is free) and upsert one document per region. */
export async function storeEvidenceBatch(
  db: EvidenceDb,
  samples: ParsedEvidenceSample[],
  options: { upload?: MediaUploader; now?: () => string } = {},
): Promise<{ stored: number; skipped: EvidenceSkip[] }> {
  const upload = options.upload ?? defaultUploader;
  const now = options.now ?? (() => new Date().toISOString());
  const collection = db.collection(SZRT_EVIDENCE_COLLECTION);
  if (!indexed && collection.createIndex) {
    await collection.createIndex({ entityKind: 1, nameKey: 1, tier: 1, score: -1, area: -1 }, { name: 'szrt_evidence_lookup' });
    indexed = true;
  }
  const skipped: EvidenceSkip[] = [];
  let stored = 0;
  for (const sample of samples) {
    const { index } = sample;
    const cropUrl = await upload(sample.crop, EVIDENCE_MEDIA_FOLDER);
    const photoUrl = sample.photo ? await upload(sample.photo, EVIDENCE_MEDIA_FOLDER) : null;
    if (!cropUrl || (sample.photo && !photoUrl)) {
      skipped.push({ index, reason: 'media_storage_failed' });
      continue;
    }
    const { _id, ...fields } = sample.doc;
    await collection.updateOne(
      { _id },
      { $set: { ...fields, cropUrl, ...(photoUrl ? { photoUrl } : {}), receivedAt: now() }, ...(photoUrl ? {} : { $unset: { photoUrl: '' } }) },
      { upsert: true },
    );
    stored += 1;
  }
  return { stored, skipped };
}

function toSample(doc: BrandEvidenceDoc): EvidenceSample {
  return {
    id: createHash('sha256').update(doc._id).digest('hex').slice(0, 16),
    sport: doc.sport,
    tier: doc.tier,
    method: doc.method,
    match: doc.match,
    readText: doc.readText,
    ocrConfidence: doc.ocrConfidence,
    confidence: doc.confidence,
    itemType: doc.itemType,
    onPerson: doc.onPerson,
    box: doc.box,
    cropUrl: doc.cropUrl,
    photoUrl: doc.photoUrl ?? null,
    analyzedAt: doc.analyzedAt,
  };
}

/** Strongest proof first, at most one sample per photo so twelve tiles show twelve different pictures. */
export function pickEvidence(docs: BrandEvidenceDoc[], limit = EVIDENCE_SAMPLE_LIMIT): BrandEvidenceDoc[] {
  const seen = new Set<string>();
  const picked: BrandEvidenceDoc[] = [];
  const ordered = [...docs].sort((a, b) => b.score - a.score || b.area - a.area || a._id.localeCompare(b._id));
  for (const doc of ordered) {
    if (doc.tier !== 'text_read' || seen.has(doc.fileKey)) continue;
    seen.add(doc.fileKey);
    picked.push(doc);
    if (picked.length >= limit) break;
  }
  return picked;
}

async function distinctPhotos(collection: Collection, match: Record<string, unknown>): Promise<number> {
  const rows = (await collection.aggregate([{ $match: match }, { $group: { _id: '$fileKey' } }, { $count: 'n' }]).toArray()) as Array<{ n?: number }>;
  return Number(rows[0]?.n) || 0;
}

export async function listBrandEvidence(
  db: EvidenceDb,
  input: { kind: EvidenceKind; name: string; limit?: number },
): Promise<BrandEvidenceListing> {
  const nameKey = evidenceNameKey(input.name);
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? EVIDENCE_SAMPLE_LIMIT), 1), EVIDENCE_SAMPLE_LIMIT);
  if (!nameKey) return { kind: input.kind, name: input.name, provenPhotos: 0, modelIdentifiedPhotos: 0, samples: [] };
  const collection = db.collection(SZRT_EVIDENCE_COLLECTION);
  const base = { entityKind: input.kind, nameKey };
  const strongest = (await collection
    .find({ ...base, tier: 'text_read' })
    .sort({ score: -1, area: -1, _id: 1 })
    .limit(limit * 6)
    .toArray()) as BrandEvidenceDoc[];
  const [provenPhotos, modelIdentifiedPhotos] = await Promise.all([
    distinctPhotos(collection, { ...base, tier: 'text_read' }),
    distinctPhotos(collection, { ...base, tier: 'model_identified' }),
  ]);
  return {
    kind: input.kind,
    name: strongest[0]?.name ?? input.name,
    provenPhotos,
    modelIdentifiedPhotos,
    samples: pickEvidence(strongest, limit).map(toSample),
  };
}
