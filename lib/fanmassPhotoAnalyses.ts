// Store one Fanmass result per Camera photo, then build Messmass event reports
// from the live set of photo records. Fanmass never submits event aggregates.

import { createHash } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { deriveCompleteFanmassReportStats } from './aiDemographicStats';
import { ensureFanmassAnalyticsVariables } from './fanmassAnalyticsVariables';
import { getDb, nowIso } from './fanmassIntegration';
import { pushEventStats } from './fanmassMapping';

export const PHOTO_ANALYSIS_CONTRACT = 'fanmass.messmass.photo-analysis.v2';
export const PHOTO_ANALYSIS_COLLECTION = 'fanmass_camera_photo_analyses';
export const MAX_PHOTO_ANALYSIS_BYTES = 2_000_000;
const PROHIBITED_CONTENT_CATEGORIES = [
  'nudity', 'sexualContent', 'middleFinger', 'hateSymbols', 'hateWords',
  'alcohol', 'drugs', 'violence', 'weapons', 'other',
] as const;
const MODERATION_SEVERITIES = ['none', 'low', 'medium', 'high'] as const;
const BRAND_APPEARANCE_ITEM_TYPES = ['clothing', 'shoes', 'bag', 'accessory', 'logo', 'other'] as const;
type PhotoAnalysisRecord = Record<string, unknown> & { _id: string };

export function isPhotoAnalysisWriteStale(
  existing: { analysisGeneration?: unknown; sourceRevision?: unknown; tombstone?: unknown } | null,
  incoming: { analysisGeneration: number; sourceRevision: string },
): boolean {
  if (!existing) return false;
  // A deletion is a permanent fence for this exact event/photo key. No
  // delayed or retried analysis generation may recreate erased findings.
  if (existing.tombstone === true) return true;
  return Number(existing.analysisGeneration) > incoming.analysisGeneration
    || (Number(existing.analysisGeneration) === incoming.analysisGeneration && existing.sourceRevision !== incoming.sourceRevision);
}

type PhotoInput = {
  messmassEventId: string;
  cameraPartnerId: string;
  cameraEventId: string;
  cameraPhotoId: string;
  sourceRevision: string;
  analysisGeneration: number;
  analysisStage: 'deep';
  analysisModules: string[];
  analysisModuleStatuses: Record<string, string>;
  analyzedAt?: string;
  status: 'completed';
  summary: Record<string, unknown>;
  boxes: Record<string, unknown>;
  analysis: Record<string, unknown>;
  humanReview: Record<string, unknown> | null;
};

function invalid(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nonEmpty(value: unknown, field: string, max = 160): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', `${field} is required and must be at most ${max} characters.`);
  }
  return value.trim();
}

const REQUIRED_CAMERA_ANALYSIS_MODULES = [
  'scan', 'faces', 'people', 'poster', 'moderation', 'sports_merchandise', 'fashion_brands', 'brand_scan',
] as const;

function parseInput(body: Record<string, unknown>, expectedMessmassEventId: string): PhotoInput {
  if (body.contractVersion !== PHOTO_ANALYSIS_CONTRACT) {
    invalid(409, 'CONTRACT_MISMATCH', `Expected ${PHOTO_ANALYSIS_CONTRACT}.`);
  }
  const messmassEventId = nonEmpty(body.messmassEventId, 'messmassEventId');
  if (messmassEventId !== expectedMessmassEventId) {
    invalid(409, 'MESSMASS_EVENT_ID_MISMATCH', 'The body Messmass event id must match the request path.');
  }
  const cameraPartnerId = nonEmpty(body.cameraPartnerId, 'cameraPartnerId');
  const cameraEventId = nonEmpty(body.cameraEventId, 'cameraEventId');
  const cameraPhotoId = nonEmpty(body.cameraPhotoId, 'cameraPhotoId');
  const sourceRevision = nonEmpty(body.sourceRevision, 'sourceRevision', 64);
  if (!/^[a-f0-9]{64}$/i.test(sourceRevision)) {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', 'sourceRevision must be a SHA-256 digest.');
  }
  const analysisGeneration = Number(body.analysisGeneration);
  if (!Number.isSafeInteger(analysisGeneration) || analysisGeneration < 1) {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', 'analysisGeneration must be a positive integer.');
  }
  if (body.status !== 'completed') {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', 'Only completed per-photo analyses can be stored.');
  }
  if (body.analysisStage !== 'deep') {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', 'analysisStage must be deep before a result is delivered.');
  }
  const analysisModules = body.analysisModules;
  if (!Array.isArray(analysisModules) || REQUIRED_CAMERA_ANALYSIS_MODULES.some((module) => !analysisModules.includes(module))) {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', 'analysisModules must include every required Camera photo analysis module.');
  }
  const analysisModuleStatuses = record(body.analysisModuleStatuses);
  if (!analysisModuleStatuses || REQUIRED_CAMERA_ANALYSIS_MODULES.some((module) => analysisModuleStatuses[module] !== 'completed')) {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', 'Every required analysis module must have a completed status before a photo result is accepted.');
  }
  const summary = record(body.summary);
  const boxes = record(body.boxes);
  const analysis = record(body.analysis);
  if (!summary || !boxes || !analysis) {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', 'summary, boxes, and analysis objects are required.');
  }
  if (!Array.isArray(boxes.people) || !Array.isArray(boxes.faces) || !Array.isArray(boxes.brandRegions)) {
    invalid(400, 'INVALID_PHOTO_ANALYSIS', 'boxes.people, boxes.faces, and boxes.brandRegions must be arrays.');
  }

  const rawReview = body.humanReview;
  let humanReview: Record<string, unknown> | null = null;
  if (rawReview !== undefined && rawReview !== null) {
    const review = record(rawReview);
    const reviewStatus = review?.status;
    if (!review || (reviewStatus !== 'corrected' && reviewStatus !== 'confirmed')
      || review.sourceRevision !== sourceRevision || Number(review.analysisGeneration) !== analysisGeneration
      || typeof review.updatedAt !== 'string' || !review.updatedAt.trim()) {
      invalid(400, 'INVALID_PHOTO_REVIEW', 'Human review must match this photo revision and generation and include its update time.');
    }
    let correction: Record<string, unknown> | null = null;
    if (review.correction !== undefined && review.correction !== null) {
      correction = record(review.correction);
      const correctionBoxes = record(correction?.boxes);
      if (!record(correction?.summary) || !record(correction?.analysis) || !correctionBoxes
        || !Array.isArray(correctionBoxes.people) || !Array.isArray(correctionBoxes.faces)
        || !Array.isArray(correctionBoxes.brandRegions)) {
        invalid(400, 'INVALID_PHOTO_REVIEW', 'Human corrections must contain summary, analysis, and all image-relative box arrays.');
      }
    }
    if (reviewStatus === 'corrected' && !correction) {
      invalid(400, 'INVALID_PHOTO_REVIEW', 'A corrected photo review must include the corrected result.');
    }
    humanReview = {
      status: reviewStatus,
      sourceRevision,
      analysisGeneration,
      updatedAt: review.updatedAt.trim(),
      ...(correction ? { correction } : {}),
    };
  }

  const size = Buffer.byteLength(JSON.stringify(body), 'utf8');
  if (size > MAX_PHOTO_ANALYSIS_BYTES) {
    invalid(413, 'PHOTO_ANALYSIS_TOO_LARGE', `Photo analysis is ${size} bytes; limit is ${MAX_PHOTO_ANALYSIS_BYTES}.`);
  }
  return {
    messmassEventId,
    cameraPartnerId,
    cameraEventId,
    cameraPhotoId,
    sourceRevision,
    analysisGeneration,
    analysisStage: 'deep',
    analysisModules: analysisModules.map((module) => String(module)),
    analysisModuleStatuses: Object.fromEntries(REQUIRED_CAMERA_ANALYSIS_MODULES.map((module) => [module, 'completed'])),
    analyzedAt: typeof body.analyzedAt === 'string' ? body.analyzedAt : undefined,
    status: 'completed',
    summary,
    boxes,
    analysis,
    humanReview,
  };
}

function stableRecordId(eventId: string, cameraPhotoId: string): string {
  return createHash('sha256').update(`${eventId}\n${cameraPhotoId}`).digest('hex');
}

async function requireExactCameraEventLink(
  db: Awaited<ReturnType<typeof getDb>>,
  messmassEventId: string,
  cameraEventId: string,
  cameraPartnerId: string,
): Promise<void> {
  if (!ObjectId.isValid(messmassEventId)) invalid(422, 'INVALID_EVENT_ID', 'Invalid Messmass event id.');
  const event = await db.collection('projects').findOne(
    { _id: new ObjectId(messmassEventId) },
    { projection: { externalRefs: 1, partnerId: 1, partner1Id: 1, partner2Id: 1 } },
  );
  if (!event) invalid(404, 'EVENT_NOT_FOUND', 'Messmass event was not found.');

  const externalRefs = record(event.externalRefs) || {};
  const cameraLink = record(externalRefs.camera) || {};
  if (cameraLink.eventId !== cameraEventId) {
    invalid(409, 'CAMERA_EVENT_ID_MISMATCH', 'The Camera event id is not linked to this Messmass event.');
  }

  const partnerObjectIds = [event.partner1Id, event.partner2Id, event.partnerId]
    .map((value) => value instanceof ObjectId ? value : (typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null))
    .filter((value): value is ObjectId => value !== null);
  if (!partnerObjectIds.length || !await db.collection('partners').findOne(
    { _id: { $in: partnerObjectIds }, cameraPartnerId },
    { projection: { _id: 1 } },
  )) {
    invalid(409, 'CAMERA_PARTNER_ID_MISMATCH', 'The Camera partner id is not linked to this Messmass event.');
  }
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function countMapAdd(target: Record<string, number>, value: unknown): void {
  const source = record(value);
  if (!source) return;
  for (const [key, raw] of Object.entries(source)) {
    const count = typeof raw === 'number' ? raw : number(record(raw)?.count);
    if (Number.isFinite(count) && count > 0) target[key] = (target[key] || 0) + Math.round(count);
  }
}

function namedCountsAdd(target: Map<string, number>, value: unknown): void {
  if (!Array.isArray(value)) return;
  for (const raw of value) {
    const row = record(raw);
    const name = typeof row?.name === 'string' ? row.name.trim() : '';
    const count = number(row?.count);
    if (name && count > 0) target.set(name, (target.get(name) || 0) + Math.round(count));
  }
}

function namedCounts(value: Map<string, number>): Array<{ name: string; count: number }> {
  return [...value.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 100);
}

function generationForAge(rawAge: string, now = new Date()): string {
  if (rawAge === 'unknown') return 'unknown';
  const age = Number(rawAge);
  if (!Number.isInteger(age) || age < 0 || age > 120) return 'unknown';
  const birthYear = now.getFullYear() - age;
  if (birthYear >= 1928 && birthYear <= 1945) return 'silent';
  if (birthYear >= 1946 && birthYear <= 1964) return 'boomer';
  if (birthYear >= 1965 && birthYear <= 1980) return 'genX';
  if (birthYear >= 1981 && birthYear <= 1996) return 'millennial';
  if (birthYear >= 1997 && birthYear <= 2012) return 'genZ';
  if (birthYear >= 2013 && birthYear <= 2024) return 'genAlpha';
  if (birthYear >= 2025 && birthYear <= 2039) return 'genBeta';
  return 'unknown';
}

function aggregatePhotos(eventId: string, photos: Array<Record<string, unknown>>) {
  const genders: Record<string, number> = {};
  const generations: Record<string, number> = {};
  const emotions: Record<string, number> = {};
  const accessories: Record<string, number> = {};
  const merchandise: Record<string, number> = {};
  const prohibitedContent: Record<string, number> = Object.fromEntries(PROHIBITED_CONTENT_CATEGORIES.map((key) => [key, 0]));
  const moderationSeverity: Record<string, number> = Object.fromEntries(MODERATION_SEVERITIES.map((key) => [key, 0]));
  const brandAppearanceTypes: Record<string, number> = Object.fromEntries(BRAND_APPEARANCE_ITEM_TYPES.map((key) => [key, 0]));
  const brandRegionTypes: Record<string, number> = { sports: 0, fashion: 0, unknown: 0 };
  const brandRegionItemTypes: Record<string, number> = {};
  const brands = new Map<string, number>();
  const clubs = new Map<string, number>();
  const brandRegionNames = new Map<string, number>();
  let measuredPeople = 0;
  let personBoxes = 0;
  let faceBoxes = 0;
  let smilingCount = 0;
  let moderationPhotosReviewed = 0;
  let moderationFlaggedPhotos = 0;
  let humanConfirmedPhotos = 0;
  let humanCorrectedPhotos = 0;
  let latestAnalysisAt = '';

  for (const photo of photos) {
    const aiSummary = record(photo.summary) || {};
    const aiBoxes = record(photo.boxes) || {};
    const humanReview = record(photo.humanReview) || {};
    const reviewMatches = humanReview.status === 'confirmed'
      && humanReview.sourceRevision === photo.sourceRevision
      && Number(humanReview.analysisGeneration) === Number(photo.analysisGeneration);
    const correction = reviewMatches ? record(humanReview.correction) : null;
    const summary = correction ? record(correction.summary) || aiSummary : aiSummary;
    const boxes = correction ? record(correction.boxes) || aiBoxes : aiBoxes;
    if (reviewMatches) humanConfirmedPhotos++;
    if (reviewMatches && correction) humanCorrectedPhotos++;
    const people = record(summary.peopleCounts) || {};
    measuredPeople += number(people.measured);
    personBoxes += Array.isArray(boxes.people) ? boxes.people.length : 0;
    faceBoxes += Array.isArray(boxes.faces) ? boxes.faces.length : 0;
    countMapAdd(genders, summary.genderProjection);
    countMapAdd(emotions, summary.emotionProjection);
    countMapAdd(accessories, summary.accessoryProjection);
    countMapAdd(merchandise, summary.merchandiseCounts);
    namedCountsAdd(brands, summary.brandMentions);
    namedCountsAdd(clubs, summary.clubMentions);
    for (const [key, value] of Object.entries(record(summary.brandRegionTypes) || {})) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        brandRegionTypes[key] = (brandRegionTypes[key] || 0) + Math.round(value);
      }
    }
    countMapAdd(brandRegionItemTypes, summary.brandRegionItemTypes);
    namedCountsAdd(brandRegionNames, summary.brandRegionMentions);
    const moderation = record(summary.moderation) || {};
    if (moderation.status === 'completed') {
      moderationPhotosReviewed++;
      if (moderation.flagged === true) moderationFlaggedPhotos++;
      const severity = typeof moderation.severity === 'string' ? moderation.severity : '';
      if (Object.prototype.hasOwnProperty.call(moderationSeverity, severity)) moderationSeverity[severity]++;
      const flags = Array.isArray(moderation.flags)
        ? moderation.flags.filter((value): value is string => typeof value === 'string')
        : Object.entries(record(moderation.categories) || {})
          .filter(([, value]) => record(value)?.detected === true)
          .map(([key]) => key);
      for (const flag of new Set(flags)) {
        if (Object.prototype.hasOwnProperty.call(prohibitedContent, flag)) prohibitedContent[flag]++;
      }
    }
    const fashionBrands = record(summary.fashionBrands) || {};
    if (Array.isArray(fashionBrands.items)) {
      for (const rawItem of fashionBrands.items) {
        const item = record(rawItem);
        if (!item) continue;
        const itemType = typeof item.itemType === 'string' ? item.itemType.trim() : '';
        const key = Object.prototype.hasOwnProperty.call(brandAppearanceTypes, itemType) ? itemType : 'other';
        brandAppearanceTypes[key] += Math.max(1, Math.round(number(item.count) || 1));
      }
    }
    const ageHistogram = record(summary.ageHistogram) || {};
    for (const [age, raw] of Object.entries(ageHistogram)) {
      const count = typeof raw === 'number' ? raw : number(record(raw)?.count);
      if (count > 0) {
        const generation = generationForAge(age);
        generations[generation] = (generations[generation] || 0) + Math.round(count);
      }
    }
    const oneSmilingCount = number(summary.smilingCount);
    smilingCount += oneSmilingCount;
    const analyzedAt = typeof photo.analyzedAt === 'string' ? photo.analyzedAt : '';
    if (analyzedAt > latestAnalysisAt) latestAnalysisAt = analyzedAt;
  }

  const imageCount = photos.length;
  const demographicSample = Math.max(
    Object.values(genders).reduce((sum, value) => sum + value, 0),
    Object.values(generations).reduce((sum, value) => sum + value, 0),
    Object.values(emotions).reduce((sum, value) => sum + value, 0),
  );
  const smilingPct = demographicSample > 0 ? Math.round((smilingCount / demographicSample) * 1000) / 10 : null;
  return {
    contractVersion: 'messmass.camera-photo-results.v1',
    messmassEventId: eventId,
    lastAnalyzedAt: latestAnalysisAt || null,
    photoResultsReceived: imageCount,
    personBoxes,
    faceBoxes,
    peopleCounts: { measured: measuredPeople },
    genderProjection: genders,
    ageProjection: generations,
    emotionProjection: emotions,
    accessoryProjection: accessories,
    smilingCount,
    smilingPct,
    merchandiseCounts: merchandise,
    brandAppearanceTypes,
    brandRegionCount: photos.reduce((sum, photo) => sum + number(record(photo.summary)?.brandRegionCount), 0),
    brandRegionTypes,
    brandRegionItemTypes,
    brandRegionMentions: namedCounts(brandRegionNames),
    humanConfirmedPhotos,
    humanCorrectedPhotos,
    brandMentions: namedCounts(brands),
    clubMentions: namedCounts(clubs),
    demographicPeopleMeasured: demographicSample,
    moderationPhotosReviewed,
    moderationFlaggedPhotos,
    moderationSeverityCounts: moderationSeverity,
    prohibitedContentCounts: prohibitedContent,
  };
}

export async function rebuildFanmassPhotoEventSummary(
  eventId: string,
  options: { allowMissingProject?: boolean } = {},
) {
  const db = await getDb();
  const photos = await db.collection<PhotoAnalysisRecord>(PHOTO_ANALYSIS_COLLECTION)
    .find({ eventId, tombstone: { $ne: true }, status: 'completed' }, {
      projection: { _id: 0, summary: 1, boxes: 1, analyzedAt: 1, sourceRevision: 1, analysisGeneration: 1, humanReview: 1 },
    })
    .toArray() as Array<Record<string, unknown>>;
  const summary = aggregatePhotos(eventId, photos);
  const project = await db.collection('projects').findOne(
    { _id: new ObjectId(eventId) },
    { projection: { stats: 1 } },
  );
  if (!project && !options.allowMissingProject) {
    invalid(404, 'EVENT_NOT_FOUND', 'Messmass event was not found while rebuilding photo analytics.');
  }

  await db.collection('ai_analysis_summaries').updateOne(
    { eventId },
    {
      $set: {
        eventId,
        batchId: 'camera-photo-results',
        sourceType: 'camera_photo_pipeline',
        contractVersion: summary.contractVersion,
        receivedAt: new Date().toISOString(),
        summary,
      },
    },
    { upsert: true },
  );

  // Event deletion or relinking must not prevent an exact photo tombstone from
  // being acknowledged. The per-photo record and aggregate summary are still
  // rebuilt above, but there is no project report projection to update.
  if (!project) {
    return { eventId, imageCount: photos.length, receivedAt: new Date().toISOString() };
  }

  const stats: Record<string, unknown> = { ...deriveCompleteFanmassReportStats(summary) };
  stats.fanmassPhotoResultsReceived = photos.length;
  stats.fanmassHumanConfirmedPhotos = Number(summary.humanConfirmedPhotos || 0);
  stats.fanmassHumanCorrectedPhotos = Number(summary.humanCorrectedPhotos || 0);
  const currentStats = record(project?.stats) || {};
  const obsoleteStats = Object.keys(currentStats).filter(
    (name) => name.startsWith('fanmass') && !Object.prototype.hasOwnProperty.call(stats, name),
  );
  // A successful HTTP acknowledgement means both the durable per-photo record
  // and its current report projections landed. If either projection fails, let
  // Fanmass's idempotent outbox retry this same generation.
  await ensureFanmassAnalyticsVariables(db, Object.keys(stats));
  try {
    await pushEventStats(eventId, stats, { cameraPhotoPipeline: true, unset: obsoleteStats });
  } catch (error) {
    // The event can be removed between the existence check and this projection
    // write. A delete is still complete because the per-photo tombstone and
    // rebuilt summary are durable; ordinary result upserts continue to fail.
    if (!options.allowMissingProject || record(error)?.code !== 'EVENT_NOT_FOUND') throw error;
  }
  return { eventId, imageCount: photos.length, receivedAt: new Date().toISOString() };
}

export async function storeFanmassPhotoAnalysis(
  eventId: string,
  cameraPhotoIdFromPath: string,
  body: Record<string, unknown>,
): Promise<{ eventId: string; cameraPhotoId: string; status: 'stored' | 'ignored_stale'; receivedAt: string }> {
  if (!ObjectId.isValid(eventId)) invalid(422, 'INVALID_EVENT_ID', 'Invalid Messmass event id.');
  const input = parseInput(body, eventId);
  if (input.cameraPhotoId !== cameraPhotoIdFromPath) {
    invalid(400, 'PHOTO_ID_MISMATCH', 'The path photo id and payload photo id must match.');
  }
  const db = await getDb();
  await requireExactCameraEventLink(db, eventId, input.cameraEventId, input.cameraPartnerId);
  const collection = db.collection<PhotoAnalysisRecord>(PHOTO_ANALYSIS_COLLECTION);
  await collection.createIndex({ eventId: 1, cameraPhotoId: 1 }, { unique: true, name: 'fanmass_camera_photo_event_unique' });
  await collection.createIndex({ eventId: 1, tombstone: 1, status: 1 }, { name: 'fanmass_camera_photo_report_read' });

  const receivedAt = new Date().toISOString();
  const id = stableRecordId(eventId, input.cameraPhotoId);
  const update = {
    eventId,
    messmassEventId: input.messmassEventId,
    cameraPartnerId: input.cameraPartnerId,
    cameraEventId: input.cameraEventId,
    cameraPhotoId: input.cameraPhotoId,
    sourceRevision: input.sourceRevision,
    analysisGeneration: input.analysisGeneration,
    analysisStage: input.analysisStage,
    analysisModules: input.analysisModules,
    analysisModuleStatuses: input.analysisModuleStatuses,
    contractVersion: PHOTO_ANALYSIS_CONTRACT,
    status: 'completed',
    tombstone: false,
    analyzedAt: input.analyzedAt || null,
    receivedAt,
    summary: input.summary,
    boxes: input.boxes,
    analysis: input.analysis,
    humanReview: input.humanReview,
  };
  const filter = {
    _id: id,
    tombstone: { $ne: true },
    $or: [
      { analysisGeneration: { $lt: input.analysisGeneration } },
      { analysisGeneration: input.analysisGeneration, sourceRevision: input.sourceRevision, tombstone: { $ne: true } },
    ],
  };
  let stored = false;
  try {
    const result = await collection.updateOne(filter, { $set: update }, { upsert: true });
    stored = result.matchedCount === 1 || result.upsertedCount === 1;
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
  }
  if (!stored) {
    const existing = await collection.findOne({ _id: id }, { projection: { analysisGeneration: 1, sourceRevision: 1, tombstone: 1 } });
    const stale = isPhotoAnalysisWriteStale(existing as Record<string, unknown> | null, input);
    if (!stale) invalid(409, 'PHOTO_RESULT_CONFLICT', 'The photo result could not be safely upserted.');
  }

  const aggregate = await rebuildFanmassPhotoEventSummary(eventId);
  return {
    eventId,
    cameraPhotoId: input.cameraPhotoId,
    status: stored ? 'stored' : 'ignored_stale',
    receivedAt: aggregate.receivedAt,
  };
}

export async function tombstoneFanmassPhotoAnalysis(
  eventId: string,
  cameraPhotoIdFromPath: string,
  body: Record<string, unknown>,
): Promise<{ eventId: string; cameraPhotoId: string; status: 'deleted' | 'ignored_stale'; receivedAt: string }> {
  if (!ObjectId.isValid(eventId)) invalid(422, 'INVALID_EVENT_ID', 'Invalid Messmass event id.');
  if (body.contractVersion !== PHOTO_ANALYSIS_CONTRACT) {
    invalid(409, 'CONTRACT_MISMATCH', `Expected ${PHOTO_ANALYSIS_CONTRACT}.`);
  }
  const messmassEventId = nonEmpty(body.messmassEventId, 'messmassEventId');
  if (messmassEventId !== eventId) {
    invalid(409, 'MESSMASS_EVENT_ID_MISMATCH', 'The body Messmass event id must match the request path.');
  }
  const cameraPartnerId = nonEmpty(body.cameraPartnerId, 'cameraPartnerId');
  const cameraEventId = nonEmpty(body.cameraEventId, 'cameraEventId');
  const cameraPhotoId = nonEmpty(body.cameraPhotoId, 'cameraPhotoId');
  const sourceRevision = nonEmpty(body.sourceRevision, 'sourceRevision', 64);
  const analysisGeneration = Number(body.analysisGeneration);
  if (cameraPhotoId !== cameraPhotoIdFromPath || !/^[a-f0-9]{64}$/i.test(sourceRevision)
    || !Number.isSafeInteger(analysisGeneration) || analysisGeneration < 1) {
    invalid(400, 'INVALID_PHOTO_TOMBSTONE', 'The photo id, revision, and generation are invalid or inconsistent.');
  }

  const db = await getDb();
  const collection = db.collection<PhotoAnalysisRecord>(PHOTO_ANALYSIS_COLLECTION);
  await collection.createIndex({ eventId: 1, cameraPhotoId: 1 }, { unique: true, name: 'fanmass_camera_photo_event_unique' });
  await collection.createIndex({ eventId: 1, tombstone: 1, status: 1 }, { name: 'fanmass_camera_photo_report_read' });
  const id = stableRecordId(eventId, cameraPhotoId);
  const existingPhoto = await collection.findOne(
    { _id: id },
    { projection: { cameraEventId: 1, cameraPartnerId: 1 } },
  );
  if (existingPhoto) {
    // A delete can arrive after an event was deleted or its Camera route was
    // changed. Bind the tombstone to the original stored source identity so a
    // stale/misrouted delete cannot erase another event's photo record.
    if (existingPhoto.cameraEventId !== cameraEventId || existingPhoto.cameraPartnerId !== cameraPartnerId) {
      invalid(409, 'CAMERA_PHOTO_IDENTITY_MISMATCH', 'The deletion identity does not match the stored Camera photo.');
    }
  } else {
    // For a first-seen tombstone, retain the live route check when the event
    // still exists. If the project itself has already been removed, the exact
    // authenticated (event, photo) key is sufficient to create a no-resurrection
    // tombstone; any later upsert still has to pass the live-link check.
    const event = await db.collection('projects').findOne(
      { _id: new ObjectId(eventId) },
      { projection: { _id: 1 } },
    );
    if (event) await requireExactCameraEventLink(db, eventId, cameraEventId, cameraPartnerId);
  }
  const receivedAt = new Date().toISOString();
  let deleted = false;
  try {
    const result = await collection.updateOne(
      { _id: id },
      {
        $set: {
          eventId,
          messmassEventId,
          cameraPartnerId,
          cameraEventId,
          cameraPhotoId,
          contractVersion: PHOTO_ANALYSIS_CONTRACT,
          status: 'deleted',
          tombstone: true,
          receivedAt,
        },
        $unset: {
          analyzedAt: '',
          analysisStage: '',
          analysisModules: '',
          analysisModuleStatuses: '',
          summary: '',
          boxes: '',
          analysis: '',
          humanReview: '',
          sourceRevision: '',
          analysisGeneration: '',
        },
      },
      { upsert: true },
    );
    deleted = result.matchedCount === 1 || result.upsertedCount === 1;
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err;
  }
  if (!deleted) {
    // An idempotent tombstone always wins over analysis delivery for this
    // exact event/photo key, even when requests arrive concurrently.
    const existing = await collection.findOne({ _id: id }, { projection: { tombstone: 1 } });
    if (existing?.tombstone !== true) invalid(409, 'PHOTO_TOMBSTONE_CONFLICT', 'The photo tombstone could not be safely stored.');
  }

  const aggregate = await rebuildFanmassPhotoEventSummary(eventId, { allowMissingProject: true });
  return {
    eventId,
    cameraPhotoId,
    status: deleted ? 'deleted' : 'ignored_stale',
    receivedAt: aggregate.receivedAt,
  };
}

/**
 * Accept a verified privacy deletion using Camera's event/photo references.
 * The coordinator must not need Fanmass generations or analysis revisions to
 * erase a photo: privacy tombstones always win and remove every saved finding.
 */
export async function tombstoneFanmassPhotoAnalysisForErasure(input: {
  messmassEventId: string;
  cameraPartnerId: string;
  cameraEventId: string;
  cameraPhotoId: string;
  requestId: string;
}, dependencies: {
  getDb?: typeof getDb;
  now?: () => string;
  rebuildSummary?: typeof rebuildFanmassPhotoEventSummary;
} = {}): Promise<{ status: 'deleted'; receivedAt: string }> {
  const messmassEventId = nonEmpty(input.messmassEventId, 'messmassEventId');
  const cameraPartnerId = nonEmpty(input.cameraPartnerId, 'cameraPartnerId');
  const cameraEventId = nonEmpty(input.cameraEventId, 'cameraEventId');
  const cameraPhotoId = nonEmpty(input.cameraPhotoId, 'cameraPhotoId').toLowerCase();
  const requestId = nonEmpty(input.requestId, 'requestId');
  if (!/^[0-9a-f]{24}$/.test(cameraPhotoId)) invalid(400, 'INVALID_PHOTO_ID', 'Invalid Camera photo id.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    invalid(400, 'INVALID_PRIVACY_REQUEST', 'Invalid privacy request id.');
  }

  const db = await (dependencies.getDb || getDb)();
  await requireExactCameraEventLink(db, messmassEventId, cameraEventId, cameraPartnerId);
  const collection = db.collection<PhotoAnalysisRecord>('fanmass_camera_photo_analyses');
  await collection.createIndex({ eventId: 1, tombstone: 1, status: 1 }, { name: 'fanmass_camera_photo_report_read' });
  const receivedAt = (dependencies.now || nowIso)();
  const id = stableRecordId(messmassEventId, cameraPhotoId);
  await collection.updateOne(
    { _id: id },
    {
      $set: {
        eventId: messmassEventId,
        cameraPartnerId,
        cameraEventId,
        cameraPhotoId,
        contractVersion: PHOTO_ANALYSIS_CONTRACT,
        status: 'deleted',
        tombstone: true,
        privacyErasure: { requestId, receivedAt },
        receivedAt,
      },
      $unset: {
        analyzedAt: '',
        analysisStage: '',
        analysisModules: '',
        analysisModuleStatuses: '',
        summary: '',
        boxes: '',
        analysis: '',
        humanReview: '',
        sourceRevision: '',
        analysisGeneration: '',
      },
    },
    { upsert: true },
  );
  await (dependencies.rebuildSummary || rebuildFanmassPhotoEventSummary)(messmassEventId);
  return { status: 'deleted', receivedAt };
}

/** Admin read model for the photo-by-photo results and saved detection boxes. */
export async function listFanmassPhotoAnalysisDetails(eventId: string, options: { offset?: number; limit?: number } = {}) {
  if (!ObjectId.isValid(eventId)) invalid(422, 'INVALID_EVENT_ID', 'Invalid Messmass event id.');
  const db = await getDb();
  const collection = db.collection<PhotoAnalysisRecord>(PHOTO_ANALYSIS_COLLECTION);
  const filter = { eventId, status: 'completed', tombstone: { $ne: true } };
  const total = await collection.countDocuments(filter);
  const requestedLimit = Number.isFinite(options.limit) ? Math.trunc(options.limit as number) : 100;
  const requestedOffset = Number.isFinite(options.offset) ? Math.trunc(options.offset as number) : 0;
  const limit = Math.min(Math.max(requestedLimit, 1), 100);
  const offset = Math.max(requestedOffset, 0);
  const rows = await collection
    .find(
      filter,
      { projection: { _id: 0, cameraPhotoId: 1, analyzedAt: 1, summary: 1, boxes: 1 } },
    )
    .sort({ analyzedAt: -1, cameraPhotoId: 1 })
    .skip(offset)
    .limit(limit)
    .toArray();
  return {
    total,
    limit,
    offset,
    photos: rows.map((row) => ({
      cameraPhotoId: String(row.cameraPhotoId || ''),
      analyzedAt: typeof row.analyzedAt === 'string' ? row.analyzedAt : null,
      summary: record(row.summary) || {},
      boxes: record(row.boxes) || { people: [], faces: [] },
    })),
  };
}
