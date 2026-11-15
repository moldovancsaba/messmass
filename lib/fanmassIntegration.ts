import { Db, ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { info, warn, error as logError } from '@/lib/logger';
import { deriveCompleteFanmassReportStats } from './aiDemographicStats';
import { ensureFanmassAnalyticsVariables } from './fanmassAnalyticsVariables';

const DB_NAME = config.dbName;
export const EVENT_CONTEXT_CONTRACT = 'messmass.fanmass.event-context.v1';

export type FanmassLinkStatus =
  | 'linked'
  | 'importing'
  | 'analyzing'
  | 'ready'
  | 'partial'
  | 'failed'
  | 'stale'
  | 'unauthorized'
  | 'unavailable';

export type FanmassEventLink = {
  eventId: string;
  fanmassBatchId: string;
  status: FanmassLinkStatus;
  contextVersion: string;
  contextHash?: string;
  sourceMode: 'api';
  retryCount: number;
  lastRequestedAt?: string;
  lastCompletedAt?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  lastSyncSnapshot?: unknown;
  audit: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function jsonError(status: number, code: string, message: string, details?: unknown): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: nowIso(),
      },
    },
    { status }
  );
}

export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: { timestamp: nowIso() },
    },
    { status }
  );
}

export function getCorrelationId(request: NextRequest): string {
  return request.headers.get('x-correlation-id') || crypto.randomUUID();
}

export function requireFanmassIntegrationAuth(request: NextRequest): NextResponse | null {
  const token = config.fanmassIntegrationToken;
  if (!token) {
    return jsonError(503, 'FANMASS_INTEGRATION_NOT_CONFIGURED', 'Fanmass integration token is not configured.');
  }

  const auth = request.headers.get('authorization') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const apiKey = request.headers.get('x-api-key') || '';
  if (bearer !== token && apiKey !== token) {
    return jsonError(401, 'INVALID_INTEGRATION_TOKEN', 'Invalid Fanmass integration token.');
  }
  return null;
}

export function retiredFanmassEndpoint(code: string, message: string): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status: 410 },
  );
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

function normalizeObjectId(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) return value;
  if (typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value);
  return null;
}

function stringifyId(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === 'string') return value;
  return String(value);
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

export async function loadEventContext(eventId: string, correlationId: string) {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }

  const db = await getDb();
  const event = await db.collection('projects').findOne({ _id: new ObjectId(eventId) });
  if (!event) {
    throw Object.assign(new Error('Messmass event was not found.'), { status: 404, code: 'EVENT_NOT_FOUND' });
  }

  const partnerIds = [event.partner1Id, event.partner2Id, ...(Array.isArray(event.partnerIds) ? event.partnerIds : [])]
    .map(normalizeObjectId)
    .filter((id): id is ObjectId => Boolean(id));
  const uniquePartnerIds = Array.from(new Map(partnerIds.map((id) => [id.toString(), id])).values());
  const partners = uniquePartnerIds.length
    ? await db.collection('partners').find({ _id: { $in: uniquePartnerIds } }).toArray()
    : [];

  const organizationId = stringifyId(event.organizationId || event.orgId);
  const organizationObjectId = normalizeObjectId(organizationId);
  const organization = organizationObjectId
    ? await db.collection('organizations').findOne({ _id: organizationObjectId })
    : null;

  const driveFolderDocs = await db
    .collection('drive_folder_links')
    .find({ eventId }, { projection: { folderId: 1, folderUrl: 1, label: 1 } })
    .toArray();

  const context = {
    contractVersion: EVENT_CONTEXT_CONTRACT,
    messmassEventId: event._id.toString(),
    eventName: String(event.eventName || event.name || 'Untitled event'),
    eventDateIso: event.eventDate ? new Date(event.eventDate).toISOString() : null,
    organizationId,
    organizationName: organization?.name || event.organizationName || null,
    partnerIds: partners.map((partner) => partner._id.toString()),
    partnerNames: partners.map((partner) => String(partner.name || partner.partnerName || '')).filter(Boolean),
    hashtags: normalizeStringArray(event.hashtags),
    categorizedHashtags: event.categorizedHashtags || {},
    reportTemplateId: stringifyId(event.reportTemplateId),
    styleId: stringifyId(event.styleId),
    // folderId/folderUrl/label only — status is fanmass's write, not messmass's read.
    driveFolders: driveFolderDocs.map((doc) => ({
      folderId: doc.folderId,
      folderUrl: doc.folderUrl,
      label: doc.label ?? undefined,
    })),
    sourceUpdatedAt: event.updatedAt || event.createdAt || null,
    syncCorrelationId: correlationId,
  };

  info('fanmass_event_context_built', {
    eventId,
    partnerCount: context.partnerIds.length,
    correlationId,
  });
  return context;
}

export async function ensureFanmassIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection('fanmass_event_links').createIndex({ eventId: 1 }, { unique: true }),
    db.collection('fanmass_event_links').createIndex({ fanmassBatchId: 1 }, { unique: true, sparse: true }),
    db.collection('fanmass_event_links').createIndex({ updatedAt: -1 }),
  ]);
}

export async function upsertFanmassLink(
  eventId: string,
  fanmassBatchId: string,
  options: {
    status?: FanmassLinkStatus;
    contextVersion?: string;
    contextHash?: string;
    correlationId: string;
    auditAction?: string;
  }
): Promise<FanmassEventLink> {
  if (!ObjectId.isValid(eventId)) {
    throw Object.assign(new Error('Invalid event id.'), { status: 422, code: 'INVALID_EVENT_ID' });
  }
  if (!fanmassBatchId.trim()) {
    throw Object.assign(new Error('fanmassBatchId is required.'), { status: 422, code: 'BATCH_ID_REQUIRED' });
  }

  const db = await getDb();
  await ensureFanmassIndexes(db);
  const existingEvent = await db.collection('projects').findOne({ _id: new ObjectId(eventId) }, { projection: { _id: 1 } });
  if (!existingEvent) {
    throw Object.assign(new Error('Messmass event was not found.'), { status: 404, code: 'EVENT_NOT_FOUND' });
  }

  const timestamp = nowIso();
  const audit = {
    action: options.auditAction || 'link_upserted',
    at: timestamp,
    correlationId: options.correlationId,
    fanmassBatchId,
  };
  await db.collection<FanmassEventLink>('fanmass_event_links').updateOne(
    { eventId },
    {
      $set: {
        eventId,
        fanmassBatchId,
        status: options.status || 'linked',
        contextVersion: options.contextVersion || EVENT_CONTEXT_CONTRACT,
        contextHash: options.contextHash,
        sourceMode: 'api',
        updatedAt: timestamp,
      },
      $setOnInsert: {
        retryCount: 0,
        createdAt: timestamp,
      },
      $push: { audit },
    },
    { upsert: true }
  );
  const link = await db.collection<FanmassEventLink>('fanmass_event_links').findOne({ eventId }, { projection: { _id: 0 } });
  if (!link) {
    throw Object.assign(new Error('Failed to load Fanmass link after upsert.'), { status: 500, code: 'LINK_UPSERT_FAILED' });
  }
  return link;
}

function asNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function mapFanmassSummaryToStats(summary: any) {
  return {
    batchId: summary.batchId,
    status: summary.status,
    imageCount: asNumber(summary.imageCounts?.total),
    analyzedImageCount: asNumber(summary.imageCounts?.analyzed),
    peopleCount: asNumber(summary.peopleCounts?.measured),
    projectedReach: asNumber(summary.peopleCounts?.projected),
    confidence: asNumber(summary.confidence),
    brands: Array.isArray(summary.brandMentions) ? summary.brandMentions : [],
    clubs: Array.isArray(summary.clubMentions) ? summary.clubMentions : [],
    merchandise: summary.merchandiseCounts || {},
    gender: summary.genderProjection || {},
    age: summary.ageProjection || {},
    emotion: summary.emotionProjection || {},
    accessories: summary.accessoryProjection || {},
    smilingPct: typeof summary.smilingPct === 'number' ? summary.smilingPct : null,
    warnings: Array.isArray(summary.warnings) ? summary.warnings : [],
    sourceRunIds: Array.isArray(summary.sourceRunIds) ? summary.sourceRunIds : [],
    lastSyncedAt: nowIso(),
    contractVersion: summary.contractVersion,
  };
}

function firstNamedCount(items: unknown[], nameKeys: string[]): { name: string; count: number } {
  const first = items.find((item) => item && typeof item === 'object') as Record<string, unknown> | undefined;
  if (!first) {
    return { name: '', count: 0 };
  }

  const name = nameKeys.map((key) => first[key]).find((value) => typeof value === 'string' && value.trim()) || '';
  return {
    name: String(name),
    count: asNumber(first.count ?? first.mentions ?? first.value ?? first.total),
  };
}

export function mapFanmassStatsToFlatStats(fanmassStats: ReturnType<typeof mapFanmassSummaryToStats>) {
  const topBrand = firstNamedCount(fanmassStats.brands, ['brandName', 'brand', 'name', 'label']);
  const topClub = firstNamedCount(fanmassStats.clubs, ['clubName', 'club', 'name', 'label']);
  const analysisProgress = fanmassStats.imageCount > 0
    ? Math.round(Math.min(100, (fanmassStats.analyzedImageCount / fanmassStats.imageCount) * 100) * 10) / 10
    : 0;

  return {
    fanmassBatchId: String(fanmassStats.batchId || ''),
    // `fanmassStatus` is the established numeric progress variable. Keep the
    // textual ready/partial/running state in a separate, unambiguous key.
    fanmassStatus: analysisProgress,
    fanmassAnalysisState: String(fanmassStats.status || ''),
    fanmassImages: fanmassStats.imageCount,
    fanmassAnalyzedImages: fanmassStats.analyzedImageCount,
    // Preserve the older count aliases for existing charts during migration.
    fanmassImageCount: fanmassStats.imageCount,
    fanmassAnalyzedImageCount: fanmassStats.analyzedImageCount,
    fanmassPeopleCount: fanmassStats.peopleCount,
    fanmassProjectedReach: fanmassStats.projectedReach,
    fanmassConfidence: fanmassStats.confidence,
    fanmassBrandCount: fanmassStats.brands.length,
    fanmassTopBrandName: topBrand.name,
    fanmassTopBrandCount: topBrand.count,
    fanmassClubCount: fanmassStats.clubs.length,
    fanmassTopClubName: topClub.name,
    fanmassTopClubCount: topClub.count,
    fanmassWarningCount: fanmassStats.warnings.length,
    fanmassSourceRunCount: fanmassStats.sourceRunIds.length,
    fanmassLastSyncedAt: fanmassStats.lastSyncedAt,
  };
}

export async function handleRouteError(err: unknown): Promise<NextResponse> {
  const error = err as Error & { status?: number; code?: string; details?: unknown };
  const status = error.status || 500;
  const code = error.code || 'INTERNAL_ERROR';
  logError('fanmass_integration_route_failed', { status, code, details: error.details }, error instanceof Error ? error : undefined);
  return jsonError(status, code, error.message || 'Fanmass integration request failed.', error.details);
}
