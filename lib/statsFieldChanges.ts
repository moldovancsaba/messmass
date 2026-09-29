// lib/statsFieldChanges.ts
// WHAT: Field-level stats saves for the live editors: a save names only the
//     stat values it changes (`statsChanges`) and the stat keys it removes
//     (`statsRemoved`), and the route writes only those keys.
// WHY: The editors used to send their whole `stats` object on every save, and
//     the routes replaced the stored one with it. A value anyone else wrote
//     since the tab last loaded -- a fanmass results sync, a Google Sheets
//     pull, an admin, a second device -- was put back to the tab's old copy by
//     its next click, and the save was still confirmed. Writing only the keys a
//     save changed leaves every other value as it is stored.
// HOW: parseStatsFieldChanges validates the body fields;
//     applyStatsFieldChanges builds the resulting stats from the stored copy;
//     statsUpdateOperators turns the difference into dotted $set/$unset paths,
//     so a value written between the route's read and its write is not undone
//     either. A key that cannot be a field path is refused, not dropped.
// NOTE: Server-only helpers with no dependencies; the editors build the
//     request in components/EditorDashboard.tsx (EditorSaveRequestBody) and
//     components/PartnerEditorDashboard.tsx (partnerSaveRequest). The late-write
//     guard every editor save route applies (parseEditorSequence,
//     editorSequenceGuard) lives here too.

export interface StatsFieldChanges {
  /** Stat values this save sets, by stat key. */
  changes: Record<string, unknown>;
  /** Stat keys this save removes. */
  removed: string[];
}

export type StatsFieldChangesParse =
  | { ok: true; value: StatsFieldChanges | null } // null: the body has no field-level stats
  | { ok: false; error: string };

const MAX_STAT_KEY_LENGTH = 200;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

// WHAT: May this stat key be written as `stats.<key>`?
// WHY: A dot would address a nested field, a leading `$` is an operator, and
//     `__proto__` would not survive being copied into a plain object.
export function isStorableStatKey(key: string): boolean {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length <= MAX_STAT_KEY_LENGTH &&
    !key.includes('.') &&
    !key.startsWith('$') &&
    !key.includes('\0') &&
    key !== '__proto__'
  );
}

/** Read `statsChanges` / `statsRemoved` from a request body (or a variant's metadata). */
export function parseStatsFieldChanges(source: { statsChanges?: unknown; statsRemoved?: unknown } | null | undefined): StatsFieldChangesParse {
  const rawChanges = source?.statsChanges;
  const rawRemoved = source?.statsRemoved;
  if (rawChanges === undefined && rawRemoved === undefined) return { ok: true, value: null };

  if (rawChanges !== undefined && !isPlainObject(rawChanges)) {
    return { ok: false, error: 'statsChanges must be an object' };
  }
  if (rawRemoved !== undefined && !(Array.isArray(rawRemoved) && rawRemoved.every((k) => typeof k === 'string'))) {
    return { ok: false, error: 'statsRemoved must be an array of stat keys' };
  }

  const changes = (rawChanges ?? {}) as Record<string, unknown>;
  const removed = Array.from(new Set((rawRemoved ?? []) as string[]));
  const badKey = [...Object.keys(changes), ...removed].find((key) => !isStorableStatKey(key));
  if (badKey !== undefined) {
    return { ok: false, error: `Invalid stat key: ${JSON.stringify(badKey.slice(0, 60))}` };
  }
  const both = removed.find((key) => Object.prototype.hasOwnProperty.call(changes, key));
  if (both !== undefined) {
    return { ok: false, error: `Stat key both changed and removed: ${both}` };
  }
  return { ok: true, value: { changes, removed } };
}

/** The stored stats with this save's changes applied. Never mutates `current`. */
export function applyStatsFieldChanges(current: unknown, fieldChanges: StatsFieldChanges): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(isPlainObject(current) ? current : {}) };
  for (const [key, value] of Object.entries(fieldChanges.changes)) next[key] = value;
  for (const key of fieldChanges.removed) delete next[key];
  return next;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (isPlainObject(value) && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) out[key] = canonical(value[key]);
    return out;
  }
  return value;
}

function sameStatValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  try {
    return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Late-write guard (tabId + clientSeq)
// ---------------------------------------------------------------------------

// WHAT: Which editor tab sent a save, and that save's place in the tab's
//     sequence of saves.
// WHY: A save can outlive the editor's patience with it: a slow request is
//     given up on after 25 s (SAVE_REQUEST_TIMEOUT_MS) and sent again, and the
//     first one can still reach the database after a newer one, putting the
//     older values back. Each editor save route makes its write conditional on
//     no save from the same tab with the same or a higher number having landed
//     first (editorSequenceGuard). A retry of the very same request carries the
//     same number, so whichever copy lands second changes nothing.
export interface EditorSequence {
  tabId: string;
  clientSeq: number;
}

// WHAT: The tab id format accepted by the guard.
// WHY: The id becomes the `editorSeq.<tabId>` field path, so it must be a
//     plain name of bounded length.
export const EDITOR_TAB_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export type EditorSequenceParse =
  | { ok: true; value: EditorSequence | null } // null: the body names no tab (admin forms, older tabs)
  | { ok: false; error: string };

/** Read `tabId` + `clientSeq` from a request body: both or neither. */
export function parseEditorSequence(source: { tabId?: unknown; clientSeq?: unknown } | null | undefined): EditorSequenceParse {
  const tabId = source?.tabId;
  const clientSeq = source?.clientSeq;
  if (tabId === undefined && clientSeq === undefined) return { ok: true, value: null };
  if (typeof tabId !== 'string' || !EDITOR_TAB_ID_PATTERN.test(tabId)) {
    return { ok: false, error: 'tabId must be 8-64 letters, digits, "_" or "-", sent with clientSeq' };
  }
  if (typeof clientSeq !== 'number' || !Number.isSafeInteger(clientSeq) || clientSeq < 0) {
    return { ok: false, error: 'clientSeq must be a non-negative integer, sent with tabId' };
  }
  return { ok: true, value: { tabId, clientSeq } };
}

// WHAT: The filter clause and the $set entry that make one write conditional
//     on the guard and record it.
// HOW: `editorSeq.<tabId>` holds the highest save number stored for that tab.
//     The filter matches only while that number is lower (or absent), so of
//     two saves from one tab the one with the higher number wins whichever
//     order they arrive in, in one atomic update. A write that matches
//     nothing on a document that exists was late: the route answers
//     { success: true, stale: true }.
export function editorSequenceGuard(sequence: EditorSequence): { filter: Record<string, unknown>; set: Record<string, number> } {
  const path = `editorSeq.${sequence.tabId}`;
  return {
    filter: { [path]: { $not: { $gte: sequence.clientSeq } } },
    set: { [path]: sequence.clientSeq },
  };
}

// WHAT: The $set/$unset paths that turn the stored stats (`current`) into
//     `next`, touching only keys whose value differs.
// WHY: Unchanged keys are left out, so a concurrent writer of another key
//     (fanmass sync, sheet pull) keeps its value even if it lands between the
//     route's read and its write. `removed` is honoured only for keys `next`
//     no longer has (a total the route fills back in stays).
// NOTE: When the stored value is not an object (missing, or null on an old
//     document) there is nothing to address with a dotted path, so the whole
//     field is set.
export function statsUpdateOperators(
  field: string,
  current: unknown,
  next: Record<string, unknown>,
  removed: string[] = []
): { set: Record<string, unknown>; unset: Record<string, ''> } {
  if (!isPlainObject(current)) return { set: { [field]: next }, unset: {} };
  const set: Record<string, unknown> = {};
  const unset: Record<string, ''> = {};
  for (const [key, value] of Object.entries(next)) {
    if (!sameStatValue(value, current[key])) set[`${field}.${key}`] = value;
  }
  for (const key of removed) {
    if (!(key in next) && key in current) unset[`${field}.${key}`] = '';
  }
  return { set, unset };
}
