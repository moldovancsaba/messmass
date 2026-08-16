// lib/aiAnalytics.ts
// WHAT: Read model behind the AI Analytics workspace — which events have AI
//     analytics, how far each has got, how fresh it is, and how completely each
//     AI variable is populated across the estate.
// WHY: AI-derived analytics already exist on ~155 events but are invisible in the
//     product. A report author has no way to tell whether a variable is safe to
//     put in a template; one present on 3% of events renders empty for almost
//     everyone, and they find out from a customer.
// HOW: Read-only aggregation over existing collections. No new collection, no
//     schema change, no dependency on fanmass being reachable.

import { getDb } from './fanmassIntegration';

// WHAT: Marks a variable as AI-owned.
// WHY: Single authority. Every consumer goes through this, so widening the
//     definition later (e.g. to a category, or a second producer) is one function
//     rather than a sweep across call sites.
const AI_VARIABLE_PREFIX = 'fanmass';

export function isAiVariableName(name: string): boolean {
  return typeof name === 'string' && name.startsWith(AI_VARIABLE_PREFIX);
}

// WHAT: How old analytics may be before they are called stale.
// WHY: A live event's numbers age quickly; a day-old figure is usually still fine
//     for a finished event. One named constant so it can be tuned in one place.
export const STALE_AFTER_HOURS = 24;

export type AiEventStatus = 'not_connected' | 'no_images' | 'analyzing' | 'complete' | 'error';

export interface AiCoverageSummary {
  totalEvents: number;
  connected: number;
  analyzing: number;
  complete: number;
  noImages: number;
  notConnected: number;
  stale: number;
}

export interface AiEventRow {
  eventId: string;
  eventName: string;
  eventDate: string | null;
  status: AiEventStatus;
  progressPercent: number | null;
  imagesAnalyzed: number | null;
  imagesDiscovered: number | null;
  sources: Array<'camera' | 'drive'>;
  lastAnalyzedAt: string | null;
  isStale: boolean;
  lastError?: string;
  // WHAT: Whether the deeper modules — brands/clubs, merchandise, demographics
  //     — actually produced anything, independent of the base-pass `status`
  //     above. See loadDeepAnalysisByEvent for why these are not implied by it.
  brandCount: number;
  merchandiseCount: number;
  peopleMeasured: number;
  demographicsAnalyzed: number;
  hasDriveFolder: boolean;
  drivePaused: boolean;
  driveSyncPending: boolean;
  rescanPending: boolean;
}

export interface AiVariableRow {
  name: string;
  label: string;
  type: string;
  registered: boolean;
  eventsWithValue: number;
  eventsTotalConnected: number;
  fillRate: number;
  formulaToken: string;
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// WHAT: Percentage, rounded to one decimal and clamped.
// WHY: Shared by fill rate and progress so the two can never drift apart.
function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (part / whole) * 100)) * 10) / 10;
}

// WHAT: Whether analytics are older than the staleness threshold.
// WHY: Unknown is deliberately NOT stale. The estate carries ~155 events analysed
//     before freshness was recorded; flagging them all on day one would train
//     operators to ignore the signal entirely.
export function isStale(lastAnalyzedAt: string | null, now: number = Date.now()): boolean {
  if (!lastAnalyzedAt) return false;
  const parsed = Date.parse(lastAnalyzedAt);
  if (Number.isNaN(parsed)) return false;
  return now - parsed > STALE_AFTER_HOURS * 3600_000;
}

// WHAT: Derive an event's AI status from its stats.
// WHY: Must match the Drive folder badge already shipped, or the same event would
//     read differently in two places. No images means not complete; a full count
//     means complete; anything in between is in progress.
// HOW: `discovered === 0` (strict) means fanmass explicitly reported zero
//     images for this event — whether that's a camera event with nothing
//     uploaded yet or (in principle) a Drive folder that came back empty —
//     as distinct from `discovered === null`, where fanmass hasn't reported a
//     count at all yet. The former can never progress past 0% under the old
//     percent(0, 0) = 0 guard, so it read as "analysing" forever with nothing
//     actually running; it gets its own terminal-until-photos-arrive status.
export function deriveEventStatus(stats: Record<string, unknown>): {
  status: AiEventStatus;
  progressPercent: number | null;
  imagesAnalyzed: number | null;
  imagesDiscovered: number | null;
} {
  const discovered = toNumber(stats.fanmassImages);
  const analyzed = toNumber(stats.fanmassAnalyzedImages);
  const reported = toNumber(stats.fanmassStatus);
  const hasAny = Object.keys(stats).some(isAiVariableName);

  if (!hasAny) {
    return { status: 'not_connected', progressPercent: null, imagesAnalyzed: null, imagesDiscovered: null };
  }
  if (discovered === 0) {
    return { status: 'no_images', progressPercent: null, imagesAnalyzed: analyzed ?? 0, imagesDiscovered: 0 };
  }
  // Prefer the producer's own figure; fall back to counts for events pushed
  // before fanmassStatus existed.
  const progress = reported ?? (discovered !== null && analyzed !== null ? percent(analyzed, discovered) : null);
  const status: AiEventStatus =
    progress === null ? 'analyzing' : progress >= 100 ? 'complete' : 'analyzing';
  return { status, progressPercent: progress, imagesAnalyzed: analyzed, imagesDiscovered: discovered };
}

// WHAT: Event ids with a live rescan request — see lib/aiRescan.ts.
// WHY: Used to disable the row's rescan actions rather than let a second
//     click silently overwrite a request fanmass hasn't served yet.
async function loadPendingRescanEventIds(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db
    .collection('ai_rescan_requests')
    .find({}, { projection: { eventId: 1 } })
    .toArray();
  return new Set(rows.map((row) => String(row.eventId)));
}

async function loadDriveErrorsByEvent(): Promise<Map<string, string>> {
  const db = await getDb();
  const rows = await db
    .collection('drive_folder_links')
    .find({ status: 'error' }, { projection: { eventId: 1, lastError: 1 } })
    .toArray();
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.lastError && !map.has(String(row.eventId))) map.set(String(row.eventId), String(row.lastError));
  }
  return map;
}

export interface DriveFolderEventState {
  folderCount: number;
  anyPaused: boolean;
  allPaused: boolean;
  anySyncPending: boolean;
}

// WHAT: Per-event Drive folder state — how many links, and whether any are
//     paused or have a live "check now" request — for the Check now / Pause
//     row actions on the coverage list.
// WHY: Those actions operate per event (all of an event's linked folders at
//     once — see requestDriveFolderSyncForEvent), so the list needs to know
//     this without a second round trip per row.
async function loadDriveFolderStateByEvent(): Promise<Map<string, DriveFolderEventState>> {
  const db = await getDb();
  const rows = await db
    .collection('drive_folder_links')
    .find({}, { projection: { eventId: 1, paused: 1, syncRequestedAt: 1 } })
    .toArray();
  const map = new Map<string, DriveFolderEventState>();
  for (const row of rows) {
    const eventId = String(row.eventId);
    const state = map.get(eventId) || { folderCount: 0, anyPaused: false, allPaused: true, anySyncPending: false };
    state.folderCount += 1;
    const paused = row.paused === true;
    state.anyPaused = state.anyPaused || paused;
    state.allPaused = state.allPaused && paused;
    state.anySyncPending = state.anySyncPending || Boolean(row.syncRequestedAt);
    map.set(eventId, state);
  }
  return map;
}

export interface DeepAnalysisState {
  brandCount: number;
  merchandiseCount: number;
  peopleMeasured: number;
  demographicsAnalyzed: number;
}

function sumProjection(counts: unknown): number {
  if (!counts || typeof counts !== 'object') return 0;
  return Object.values(counts as Record<string, unknown>).reduce(
    (sum: number, n) => sum + (typeof n === 'number' ? n : 0),
    0
  );
}

// WHAT: Whether the modules beyond the base image pass — brands, clubs,
//     merchandise, demographics — actually produced anything, per event.
// WHY: fanmassAnalyzedImages/fanmassImages (what `status` is derived from)
//     only measure the base pass. An event can show every image analysed while
//     these deeper modules never ran at all; the coverage list had no way to
//     show that difference, which is what made "complete" read as a lie for an
//     event with an empty Brands table and a 0% demographics count.
async function loadDeepAnalysisByEvent(): Promise<Map<string, DeepAnalysisState>> {
  const db = await getDb();
  const docs = await db
    .collection('ai_analysis_summaries')
    .find(
      {},
      {
        projection: {
          eventId: 1,
          'summary.brandMentions': 1,
          'summary.clubMentions': 1,
          'summary.merchandiseCounts': 1,
          'summary.peopleCounts': 1,
          'summary.genderProjection': 1,
          'summary.ageProjection': 1,
          'summary.emotionProjection': 1,
        },
      }
    )
    .toArray();
  const map = new Map<string, DeepAnalysisState>();
  for (const doc of docs) {
    const summary = (doc.summary || {}) as Record<string, unknown>;
    const brandMentions = Array.isArray(summary.brandMentions) ? summary.brandMentions.length : 0;
    const clubMentions = Array.isArray(summary.clubMentions) ? summary.clubMentions.length : 0;
    const merchandiseCount = summary.merchandiseCounts && typeof summary.merchandiseCounts === 'object'
      ? Object.keys(summary.merchandiseCounts as Record<string, unknown>).length
      : 0;
    const peopleMeasured = Number((summary.peopleCounts as Record<string, unknown> | undefined)?.measured) || 0;
    const demographicsAnalyzed = Math.max(
      sumProjection(summary.genderProjection),
      sumProjection(summary.ageProjection),
      sumProjection(summary.emotionProjection)
    );
    map.set(String(doc.eventId), {
      brandCount: brandMentions + clubMentions,
      merchandiseCount,
      peopleMeasured,
      demographicsAnalyzed,
    });
  }
  return map;
}

export async function getAiEvents(options: { status?: AiEventStatus; limit?: number } = {}): Promise<{
  events: AiEventRow[];
  total: number;
}> {
  const db = await getDb();
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
  const [docs, driveErrors, driveFolderState, deepAnalysis, pendingRescans] = await Promise.all([
    db
      .collection('projects')
      .find({}, { projection: { eventName: 1, eventDate: 1, stats: 1, aiLastAnalyzedAt: 1 } })
      .sort({ eventDate: -1 })
      .toArray(),
    loadDriveErrorsByEvent(),
    loadDriveFolderStateByEvent(),
    loadDeepAnalysisByEvent(),
    loadPendingRescanEventIds(),
  ]);

  const rows: AiEventRow[] = docs.map((doc) => {
    const stats = (doc.stats || {}) as Record<string, unknown>;
    const derived = deriveEventStatus(stats);
    const eventId = String(doc._id);
    const lastError = driveErrors.get(eventId);
    const folderState = driveFolderState.get(eventId);
    const deep = deepAnalysis.get(eventId);
    const sources: Array<'camera' | 'drive'> = [];
    if (folderState) sources.push('drive');
    // Any AI data without a Drive link must have arrived through the camera path.
    if (derived.status !== 'not_connected' && !folderState) sources.push('camera');
    const lastAnalyzedAt = typeof doc.aiLastAnalyzedAt === 'string' ? doc.aiLastAnalyzedAt : null;
    return {
      eventId,
      eventName: String(doc.eventName || 'Untitled event'),
      eventDate: doc.eventDate ? String(doc.eventDate) : null,
      status: lastError && derived.status !== 'not_connected' ? 'error' : derived.status,
      progressPercent: derived.progressPercent,
      imagesAnalyzed: derived.imagesAnalyzed,
      imagesDiscovered: derived.imagesDiscovered,
      sources,
      lastAnalyzedAt,
      isStale: isStale(lastAnalyzedAt),
      brandCount: deep?.brandCount ?? 0,
      merchandiseCount: deep?.merchandiseCount ?? 0,
      peopleMeasured: deep?.peopleMeasured ?? 0,
      demographicsAnalyzed: deep?.demographicsAnalyzed ?? 0,
      hasDriveFolder: Boolean(folderState),
      drivePaused: folderState?.allPaused ?? false,
      driveSyncPending: folderState?.anySyncPending ?? false,
      rescanPending: pendingRescans.has(eventId),
      ...(lastError ? { lastError } : {}),
    };
  });

  const filtered = options.status ? rows.filter((r) => r.status === options.status) : rows;
  return { events: filtered.slice(0, limit), total: filtered.length };
}

export async function getAiCoverage(): Promise<AiCoverageSummary> {
  const { events } = await getAiEvents({ limit: 500 });
  const db = await getDb();
  const totalEvents = await db.collection('projects').countDocuments({});
  const connected = events.filter((e) => e.status !== 'not_connected');
  return {
    totalEvents,
    connected: connected.length,
    analyzing: events.filter((e) => e.status === 'analyzing').length,
    complete: events.filter((e) => e.status === 'complete').length,
    noImages: events.filter((e) => e.status === 'no_images').length,
    notConnected: totalEvents - connected.length,
    stale: connected.filter((e) => e.isStale).length,
  };
}

export async function getAiVariables(): Promise<AiVariableRow[]> {
  const db = await getDb();

  // One aggregation for every AI stats key rather than a query per variable.
  const counts = await db
    .collection('projects')
    .aggregate<{ _id: string; n: number }>([
      { $project: { pairs: { $objectToArray: { $ifNull: ['$stats', {}] } } } },
      { $unwind: '$pairs' },
      { $match: { 'pairs.k': { $regex: `^${AI_VARIABLE_PREFIX}` }, 'pairs.v': { $ne: null } } },
      { $group: { _id: '$pairs.k', n: { $sum: 1 } } },
    ])
    .toArray();
  const countByName = new Map(counts.map((c) => [c._id, c.n]));

  const metadata = await db
    .collection('variables_metadata')
    .find({}, { projection: { name: 1, label: 1, type: 1 } })
    .toArray();
  const metaByName = new Map(metadata.filter((m) => isAiVariableName(m.name)).map((m) => [String(m.name), m]));

  const coverage = await getAiCoverage();
  const denominator = coverage.connected;

  // Union of registered metadata and keys actually present. A key present on
  // events but missing from metadata is exactly the case a report author trips
  // over, so it must surface rather than be filtered out.
  const names = new Set<string>([...metaByName.keys(), ...countByName.keys()]);

  return [...names]
    .map((name) => {
      const meta = metaByName.get(name);
      const eventsWithValue = countByName.get(name) ?? 0;
      return {
        name,
        label: String(meta?.label || name),
        type: String(meta?.type || 'unknown'),
        registered: Boolean(meta),
        eventsWithValue,
        eventsTotalConnected: denominator,
        fillRate: percent(eventsWithValue, denominator),
        formulaToken: `[${name}]`,
      };
    })
    .sort((a, b) => b.fillRate - a.fillRate || a.name.localeCompare(b.name));
}
