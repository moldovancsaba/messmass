// lib/cameraPhotoStats.ts
// WHAT: The photo, people and journey counters camera measures for one event (camera#521), written onto the event stats under names that all start with
//     `camera_` (for example camera_gender_female), and registered in the variable catalog (variables_metadata) so reports and charts can use them.
// WHY: messmass already holds variables from other sources (female, male, genAlpha, scarf, approvedImages, the fanmass* family, ...). A camera counter is a
//     different measurement of the same thing, so it gets its own name and is never written into one of those: existing data cannot be harmed, and the
//     team decides in a report which of the two to show. Camera sends WHOLE running totals every time, so camera_gender_female is, at the end, how many
//     women were counted across all annotated photos of the event: a repeated or late push changes nothing and a lost one is repaired by the next.
// HOW: One `$set` on the event with a `stats.<name>` path per counter (never the whole stats object, never a read-modify-write), plus a copy of what was
//     received (`cameraPhotoStats`) for audit. The only names ever accepted match CAMERA_STAT_NAME, so nothing without the prefix can be written, and no
//     key is ever removed. The catalog entries are created with `$setOnInsert` only: an administrator can relabel or recategorise one and a later push
//     leaves it as it is. Both collections are parameters so the writes can be tried on a scratch collection or a fake.

import type { AnyBulkWriteOperation, Collection, Document, ObjectId } from 'mongodb';

/** Every counter camera sends starts with this; it is the namespace that keeps camera's numbers apart from every other source. */
export const CAMERA_STAT_PREFIX = 'camera_';
/** The only shape of a name this module accepts: the prefix, then lower case letters, digits and underscores (an event may add its own option keys, camera_merch_<option>). */
export const CAMERA_STAT_NAME = /^camera_[a-z0-9_]{1,80}$/;
/** Names in one push (totals and averages together). A real event sends about seventy. */
export const MAX_PHOTO_STAT_NAMES = 300;
/** No real event counts more than this; it keeps a typo from becoming a stat. */
export const MAX_PHOTO_STAT_VALUE = 1_000_000_000;
export const MAX_PHOTO_STAT_LABEL_LENGTH = 80;
/** Decimals kept of an average. */
const AVERAGE_DECIMALS = 4;

/** The category the camera counters are filed under in the catalog (messmass admin: /admin/kyc). */
export const CAMERA_CATALOG_CATEGORY = 'Camera';
/** The same for every camera counter, so the catalog lists them by label inside their category. */
export const CAMERA_CATALOG_ORDER = 900;

const TOP_LEVEL_FIELDS = new Set(['totals', 'averages', 'labels']);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export interface PhotoStatsInput {
  /** Whole running totals by name, each a whole number from 0 to 1e9. */
  totals: Record<string, number>;
  /** Averages by name: finite numbers from 0 to 1e9, at most four decimals. Not additive; stored as they are. */
  averages: Record<string, number>;
  /** Display names by counter name, only for names present in totals or averages. */
  labels: Record<string, string>;
}

export type ParsedPhotoStats = { ok: true; value: PhotoStatsInput } | { ok: false; error: string };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** A name in a message is cut short so a hostile key cannot fill a log line. */
const shown = (name: string): string => JSON.stringify(name.length > 60 ? `${name.slice(0, 60)}...` : name);

/** -0 is the same count as 0 but would be stored as a different double. */
const normalizeZero = (value: number): number => value + 0;

function parseNames(
  field: 'totals' | 'averages',
  raw: unknown,
  parseValue: (name: string, value: unknown) => number | string
): { ok: true; values: Record<string, number> } | { ok: false; error: string } {
  if (!isPlainObject(raw)) return { ok: false, error: `${field} must be an object of counters by name` };
  const names = Object.keys(raw);
  if (names.length > MAX_PHOTO_STAT_NAMES) return { ok: false, error: `${field} may hold at most ${MAX_PHOTO_STAT_NAMES} names` };
  const values: Record<string, number> = {};
  for (const name of names.sort()) {
    if (!CAMERA_STAT_NAME.test(name)) {
      return { ok: false, error: `${field}: ${shown(name)} is not a camera counter name (${CAMERA_STAT_PREFIX} then 1 to 80 of a-z, 0-9, _)` };
    }
    const parsed = parseValue(name, raw[name]);
    if (typeof parsed === 'string') return { ok: false, error: parsed };
    values[name] = parsed;
  }
  return { ok: true, values };
}

/**
 * The body of a photo-stats request: `{ totals, averages?, labels? }`, nothing else.
 * Strict on purpose: the names are the only thing that decides which stat is written, so a name that does not match CAMERA_STAT_NAME refuses the whole request
 * and nothing is written. The result lists names in alphabetical order, so the same counters always make the same update.
 */
export function parsePhotoStats(body: unknown): ParsedPhotoStats {
  if (!isPlainObject(body)) return { ok: false, error: 'the body must be an object with totals' };
  for (const field of Object.keys(body)) {
    if (!TOP_LEVEL_FIELDS.has(field)) return { ok: false, error: `unknown field ${shown(field)}; allowed: totals, averages, labels` };
  }

  const totals = parseNames('totals', body.totals, (name, value) =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_PHOTO_STAT_VALUE
      ? normalizeZero(value)
      : `totals: ${name} must be a whole number from 0 to ${MAX_PHOTO_STAT_VALUE}`
  );
  if (!totals.ok) return totals;

  const averages = parseNames('averages', body.averages === undefined ? {} : body.averages, (name, value) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_PHOTO_STAT_VALUE
      ? normalizeZero(Math.round(value * 10 ** AVERAGE_DECIMALS) / 10 ** AVERAGE_DECIMALS)
      : `averages: ${name} must be a number from 0 to ${MAX_PHOTO_STAT_VALUE}`
  );
  if (!averages.ok) return averages;

  const totalNames = Object.keys(totals.values);
  const averageNames = Object.keys(averages.values);
  if (totalNames.length + averageNames.length === 0) return { ok: false, error: 'at least one counter is required' };
  if (totalNames.length + averageNames.length > MAX_PHOTO_STAT_NAMES) {
    return { ok: false, error: `at most ${MAX_PHOTO_STAT_NAMES} names in totals and averages together` };
  }
  const both = totalNames.find((name) => Object.prototype.hasOwnProperty.call(averages.values, name));
  if (both) return { ok: false, error: `${shown(both)} is in both totals and averages` };

  const labels: Record<string, string> = {};
  if (body.labels !== undefined) {
    if (!isPlainObject(body.labels)) return { ok: false, error: 'labels must be an object of texts by counter name' };
    for (const name of Object.keys(body.labels).sort()) {
      const known = Object.prototype.hasOwnProperty.call(totals.values, name) || Object.prototype.hasOwnProperty.call(averages.values, name);
      if (!known) return { ok: false, error: `labels: ${shown(name)} is not in totals or averages` };
      const label = body.labels[name];
      const text = typeof label === 'string' ? label.trim() : '';
      if (text.length < 1 || text.length > MAX_PHOTO_STAT_LABEL_LENGTH || CONTROL_CHARACTERS.test(text)) {
        return { ok: false, error: `labels: the label of ${name} must be text of 1 to ${MAX_PHOTO_STAT_LABEL_LENGTH} characters` };
      }
      labels[name] = text;
    }
  }

  return { ok: true, value: { totals: totals.values, averages: averages.values, labels } };
}

/**
 * Sets the counters of one event to camera's whole totals. Returns false when the event does not exist.
 * One update: a `stats.<name>` path for every total and average (nothing else in `stats` is touched, no key is removed) and the audit copy `cameraPhotoStats`,
 * replaced as a whole. The same input always gives the same stats, so a repeated push changes nothing and the next push repairs a lost one.
 */
export async function applyPhotoStats(projects: Collection<Document>, projectId: ObjectId, input: PhotoStatsInput, now: string): Promise<boolean> {
  const set: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(input.totals)) set[`stats.${name}`] = value;
  for (const [name, value] of Object.entries(input.averages)) set[`stats.${name}`] = value;
  set.cameraPhotoStats = { totals: input.totals, averages: input.averages, updatedAt: now };
  const result = await projects.updateOne({ _id: projectId }, { $set: set });
  return result.matchedCount === 1;
}

/** "camera_gender_female" -> "Camera: gender female": the label of a counter camera sent no label for. */
export function humanizeCameraStatName(name: string): string {
  const rest = name.startsWith(CAMERA_STAT_PREFIX) ? name.slice(CAMERA_STAT_PREFIX.length) : name;
  return `Camera: ${rest.replace(/_+/g, ' ').trim()}`;
}

/** The catalog entry of one counter, as it is created the first time the counter is received. */
export function cameraCatalogEntry(name: string, kind: 'total' | 'average', label: string | undefined, now: string): Document {
  return {
    name,
    label: label ?? humanizeCameraStatName(name),
    type: kind === 'total' ? 'count' : 'numeric',
    category: CAMERA_CATALOG_CATEGORY,
    description:
      kind === 'total'
        ? 'Whole running total counted by the camera service. Written by every push from camera: do not edit by hand.'
        : 'Average per event counted by the camera service. Written by every push from camera: do not edit by hand. Not additive: a report that adds events together shows a sum, not an average.',
    derived: false,
    // Camera writes the value and the event editor must neither offer a tap counter nor an input for it (the same flags as fanmassStatus, which fanmass writes).
    flags: { visibleInClicker: false, editableInManual: false },
    order: CAMERA_CATALOG_ORDER,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Makes sure every received counter has a catalog entry. Every entry is written with `$setOnInsert` only: an entry that exists is never changed, so
 * a label or category an administrator edited stays, and a push cannot undo it. A duplicate-key answer (two first pushes at the same moment) means the
 * entry exists, which is what was wanted. Any other failure is thrown for the caller to report.
 */
export async function registerPhotoStatVariables(variables: Collection<Document>, input: PhotoStatsInput, now: string): Promise<void> {
  const operations: AnyBulkWriteOperation<Document>[] = [];
  const add = (name: string, kind: 'total' | 'average') => {
    operations.push({
      updateOne: { filter: { name }, update: { $setOnInsert: cameraCatalogEntry(name, kind, input.labels[name], now) }, upsert: true },
    });
  };
  for (const name of Object.keys(input.totals)) add(name, 'total');
  for (const name of Object.keys(input.averages)) add(name, 'average');
  if (operations.length === 0) return;

  try {
    await variables.bulkWrite(operations, { ordered: false });
  } catch (error) {
    // The driver gives one WriteError or a list of them.
    const reported = (error as { writeErrors?: { code?: number } | Array<{ code?: number }> } | null)?.writeErrors;
    const writeErrors = Array.isArray(reported) ? reported : reported ? [reported] : [];
    const onlyDuplicates = writeErrors.length > 0 && writeErrors.every((e) => e?.code === 11000);
    if (!onlyDuplicates) throw error;
  }
}
