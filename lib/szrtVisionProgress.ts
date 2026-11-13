// The SZRT report's audience, brand and club figures, as measured by the Fanmass deep rerun.
// Fanmass sends the whole picture each time (counts recomputed from every analysed image), Messmass replaces the
// stored figures and never touches `publishApproved`: whether anything is shown is a person's decision.
//
// Only measured values are accepted. A brand or club is counted only where its name was read from the picture
// (Fanmass counts `text_read` regions), and nothing here has a default: no measurement, no figure.

export const SZRT_PROGRESS_COLLECTION = 'szrt_vision_progress';
export const SZRT_PROGRESS_ID = 'szrt_progress';
const MAX_NAMES = 500;
const MAX_NAME_LENGTH = 100;
const SPORT_KEY = /^[A-Za-z0-9 _-]{1,40}$/;

export interface NamedCount { name: string; count: number }
export interface GenderCounts { male: number; female: number; malePct: number; femalePct: number }
export interface AgeCounts { children: number; teens: number; adults: number; seniors: number }

export interface SportAggregate {
  images: number;
  people: number;
  genders: GenderCounts;
  ageGroups: AgeCounts;
  topBrands: Array<{ brand: string; count: number }>;
  distinctBrandsCount: number;
  topEmotions: Array<{ emotion: string; count: number }>;
  /** Share of known emotions that are not neutral, null when no emotion was measured. */
  valence: number | null;
}

export interface SzrtProgressDoc {
  pipeline: string;
  totalImages: number;
  processedCount: number;
  percent: number;
  status: 'running' | 'idle' | 'completed';
  currentSport: string;
  lastUpdated: string;
  /** Images whose opt-in Fanmass recorded (owner policy: an image reaches the local drive only with the opt-in). Absent until Fanmass sends it. */
  optIn?: { images: number; total: number; basis: 'local_drive_policy' };
  aggregates: {
    totalPeople: number;
    genders: GenderCounts;
    ageGroups: AgeCounts;
    topBrands: Array<{ brand: string; count: number }>;
    topClubs: Array<{ club: string; count: number }>;
    topEmotions: Array<{ emotion: string; count: number }>;
    sportsBreakdown: Record<string, SportAggregate>;
  };
}

type Collection = { updateOne: (filter: unknown, update: unknown, options?: unknown) => Promise<unknown> };
export type ProgressDb = { collection: (name: string) => Collection };

function invalid(message: string): never {
  throw Object.assign(new Error(message), { status: 400, code: 'INVALID_SZRT_PROGRESS' });
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function count(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) invalid(`${field} must be a non-negative whole number.`);
  return value;
}

function percent(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) invalid(`${field} must be between 0 and 100.`);
  return Math.round(value * 100) / 100;
}

function genders(value: unknown, field: string): GenderCounts {
  const raw = record(value) ?? invalid(`${field} is required.`);
  const male = count(raw.male, `${field}.male`);
  const female = count(raw.female, `${field}.female`);
  const total = male + female;
  // Shares are derived here from the counts, so they can never disagree with them
  const malePct = total > 0 ? Math.round((male / total) * 1000) / 10 : 0;
  return { male, female, malePct, femalePct: total > 0 ? Math.round((100 - malePct) * 10) / 10 : 0 };
}

function ageGroups(value: unknown, field: string): AgeCounts {
  const raw = record(value) ?? invalid(`${field} is required.`);
  return {
    children: count(raw.children, `${field}.children`),
    teens: count(raw.teens, `${field}.teens`),
    adults: count(raw.adults, `${field}.adults`),
    seniors: count(raw.seniors, `${field}.seniors`),
  };
}

function named<K extends string>(value: unknown, key: K, field: string): Array<{ [P in K]: string } & { count: number }> {
  if (!Array.isArray(value) || value.length > MAX_NAMES) invalid(`${field} must be a list of at most ${MAX_NAMES}.`);
  return value.map((item, index) => {
    const raw = record(item) ?? invalid(`${field}[${index}] must be an object.`);
    const name = typeof raw[key] === 'string' ? (raw[key] as string).trim().slice(0, MAX_NAME_LENGTH) : '';
    if (!name) invalid(`${field}[${index}].${key} is required.`);
    return { [key]: name, count: count(raw.count, `${field}[${index}].count`) } as { [P in K]: string } & { count: number };
  }).sort((a, b) => b.count - a.count);
}

function optInSummary(value: unknown): SzrtProgressDoc['optIn'] {
  if (value === undefined || value === null) return undefined;
  const raw = record(value) ?? invalid('optIn must be an object.');
  if (raw.basis !== 'local_drive_policy') invalid('optIn.basis must be local_drive_policy.');
  const images = count(raw.images, 'optIn.images');
  const total = count(raw.total, 'optIn.total');
  if (images > total) invalid('optIn.images cannot exceed optIn.total.');
  return { images, total, basis: 'local_drive_policy' };
}

export function parseSzrtProgress(body: unknown): SzrtProgressDoc {
  const raw = record(body) ?? invalid('A JSON progress object is required.');
  const pipeline = typeof raw.pipeline === 'string' ? raw.pipeline.trim().slice(0, 80) : '';
  if (!pipeline) invalid('pipeline is required.');
  const totalImages = count(raw.totalImages, 'totalImages');
  const processedCount = count(raw.processedCount, 'processedCount');
  if (processedCount > totalImages) invalid('processedCount cannot exceed totalImages.');
  if (raw.status !== 'running' && raw.status !== 'idle' && raw.status !== 'completed') invalid('status must be running, idle or completed.');
  const lastUpdated = typeof raw.lastUpdated === 'string' ? raw.lastUpdated : '';
  if (!lastUpdated || Number.isNaN(Date.parse(lastUpdated))) invalid('lastUpdated must be a date.');
  const aggregates = record(raw.aggregates) ?? invalid('aggregates is required.');
  const sports = record(aggregates.sportsBreakdown) ?? invalid('aggregates.sportsBreakdown is required.');

  const sportsBreakdown: Record<string, SportAggregate> = {};
  for (const [sport, value] of Object.entries(sports)) {
    if (!SPORT_KEY.test(sport)) invalid(`Invalid sport name "${sport.slice(0, 40)}".`);
    const s = record(value) ?? invalid(`aggregates.sportsBreakdown.${sport} must be an object.`);
    const topBrands = named(s.topBrands, 'brand', `${sport}.topBrands`);
    const valence = s.valence === null || s.valence === undefined ? null : percent(s.valence, `${sport}.valence`);
    sportsBreakdown[sport] = {
      images: count(s.images, `${sport}.images`),
      people: count(s.people, `${sport}.people`),
      genders: genders(s.genders, `${sport}.genders`),
      ageGroups: ageGroups(s.ageGroups, `${sport}.ageGroups`),
      topBrands,
      distinctBrandsCount: topBrands.length,
      topEmotions: named(s.topEmotions, 'emotion', `${sport}.topEmotions`),
      valence,
    };
  }

  return {
    pipeline,
    totalImages,
    processedCount,
    percent: totalImages > 0 ? Math.round((processedCount / totalImages) * 10000) / 100 : 0,
    status: raw.status,
    currentSport: typeof raw.currentSport === 'string' ? raw.currentSport.trim().slice(0, 40) : '',
    lastUpdated,
    ...(raw.optIn !== undefined && raw.optIn !== null ? { optIn: optInSummary(raw.optIn) } : {}),
    aggregates: {
      totalPeople: count(aggregates.totalPeople, 'aggregates.totalPeople'),
      genders: genders(aggregates.genders, 'aggregates.genders'),
      ageGroups: ageGroups(aggregates.ageGroups, 'aggregates.ageGroups'),
      topBrands: named(aggregates.topBrands, 'brand', 'aggregates.topBrands'),
      topClubs: named(aggregates.topClubs, 'club', 'aggregates.topClubs'),
      topEmotions: named(aggregates.topEmotions, 'emotion', 'aggregates.topEmotions'),
      sportsBreakdown,
    },
  };
}

/**
 * Replace the stored figures with the new ones. `publishApproved` is never written here: a new document starts
 * unapproved and an existing approval stays as it is. Old per-image text (`recentImages`), the old model-guess
 * lists and the old venue list are removed, because nothing in the deep rerun measures them.
 */
export async function storeSzrtProgress(db: ProgressDb, doc: SzrtProgressDoc, now: () => string = () => new Date().toISOString()): Promise<void> {
  await db.collection(SZRT_PROGRESS_COLLECTION).updateOne(
    { _id: SZRT_PROGRESS_ID },
    {
      $set: {
        pipeline: doc.pipeline, totalImages: doc.totalImages, processedCount: doc.processedCount, percent: doc.percent,
        status: doc.status, currentSport: doc.currentSport, currentFile: '', lastUpdated: doc.lastUpdated,
        aggregates: { ...doc.aggregates, topVenues: [] }, recentImages: [], receivedAt: now(),
        // Kept as it was when Fanmass sends none (an older Fanmass), never erased
        ...(doc.optIn ? { optIn: doc.optIn } : {}),
      },
      $setOnInsert: { publishApproved: false },
    },
    { upsert: true },
  );
}
