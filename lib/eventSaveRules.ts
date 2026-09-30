// lib/eventSaveRules.ts
// WHAT: What one event save through PUT /api/projects may carry: the rules for
//     a field-level stat (key, value, increment), for the size of one save,
//     and for the shape of the hashtag lists.
// WHY: The route refuses a save that breaks them with a 400 and writes nothing,
//     and the event editor must never queue such a save: its queue kept
//     retrying a refused save and merged every later change into it, so one bad
//     key (a nested [fanmass.x] token from Builder mode) stopped every save of
//     that device for the rest of the event. One copy of the rules, imported
//     by both, so they cannot drift apart. No dependencies: it runs in the
//     browser too.

// WHAT: Most stat keys (changed, removed and counted together) in one save.
// WHY: Each key becomes a `stats.<key>` path in one update. The event editor
//     splits its saves well below this (EDITOR_SAVE_MAX_KEYS in
//     components/EditorDashboard.tsx), so a large change -- Compact Indices
//     rewrites every report slot -- is sent as several saves.
export const MAX_EVENT_STAT_CHANGES = 1000;
export const MAX_EVENT_STAT_KEY_LENGTH = 100;
// WHY: The longest stat values are report texts; 100 000 characters is far
//     past any of them, and keeps one save far below the 16 MB document limit.
export const MAX_EVENT_STAT_STRING_LENGTH = 100_000;
// WHY: A clicker save counts the taps made since the last one; nobody taps a
//     million times between two saves.
export const MAX_EVENT_STAT_INCREMENT = 1_000_000;

// WHAT: May this key be written as `stats.<key>`?
// WHY: A dot addresses a nested field (fanmass owns the nested `fanmass`
//     values, which formulas read as [fanmass.x]) and a `$` anywhere can be
//     read as an operator, so either could write outside the one stat named.
//     NUL is not a legal field name, and `__proto__` does not survive a
//     plain-object copy.
export function isWritableEventStatKey(key: unknown): key is string {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length <= MAX_EVENT_STAT_KEY_LENGTH &&
    !key.includes('.') &&
    !key.includes('$') &&
    !key.includes('\0') &&
    key !== '__proto__'
  );
}

// WHAT: May this be stored as one stat value? null means "remove the stat".
// WHY: The editor writes numbers and strings only. An object (such as the
//     `fanmass` namespace) is refused, so a tab can never write back its stale
//     copy of one.
export function isWritableEventStatValue(value: unknown): boolean {
  return (
    value === null ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    (typeof value === 'string' && value.length <= MAX_EVENT_STAT_STRING_LENGTH)
  );
}

// WHAT: May this be applied as a counter increment (a clicker save)?
export function isWritableEventStatIncrement(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && Math.abs(value) <= MAX_EVENT_STAT_INCREMENT;
}

// ---------------------------------------------------------------------------
// Hashtags
// ---------------------------------------------------------------------------

// WHAT: Limits on the hashtag lists one save may store.
// WHY: Every page that lists or filters by hashtag reads every event's lists
//     (getAllHashtagRepresentations over find({})), and one malformed list --
//     a number where a string belongs, a category that is not an array --
//     made all of them answer 500 until the document was repaired by hand.
//     The limits are far past any real event.
export const MAX_EVENT_HASHTAGS = 200;
export const MAX_EVENT_HASHTAG_LENGTH = 100;
export const MAX_EVENT_HASHTAG_CATEGORIES = 50;
export const MAX_EVENT_HASHTAG_CATEGORY_LENGTH = 100;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function hashtagListProblem(list: unknown, what: string): string | null {
  if (!Array.isArray(list)) return `${what} must be an array of hashtags`;
  if (list.length > MAX_EVENT_HASHTAGS) return `${what} may hold at most ${MAX_EVENT_HASHTAGS} hashtags`;
  for (const hashtag of list) {
    if (typeof hashtag !== 'string' || hashtag.trim().length === 0) {
      return `${what} must hold non-empty text hashtags only`;
    }
    if (hashtag.length > MAX_EVENT_HASHTAG_LENGTH) {
      return `${what} holds a hashtag over ${MAX_EVENT_HASHTAG_LENGTH} characters`;
    }
  }
  return null;
}

// WHAT: Why this `hashtags` value cannot be stored, or null when it can.
//     undefined (not sent) and null (clear the list) are fine.
export function eventHashtagsProblem(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return hashtagListProblem(value, 'hashtags');
}

// WHAT: Why this `categorizedHashtags` value cannot be stored, or null when it
//     can. undefined (not sent) and null (clear it) are fine.
// WHY: Each category name becomes a `categorizedHashtags.<name>` query path
//     when a removed hashtag is checked for remaining use, so it must be a
//     plain field name: no dot, no leading `$`. The stricter category-name
//     pattern (lowercase, digits, `_`, `-`) is not required here, because the
//     admin form sends an event's stored categories back with every save, and
//     one stored before that pattern existed must keep saving.
export function eventCategorizedHashtagsProblem(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) return 'categorizedHashtags must be an object of hashtag lists';
  const entries = Object.entries(value);
  if (entries.length > MAX_EVENT_HASHTAG_CATEGORIES) {
    return `categorizedHashtags may hold at most ${MAX_EVENT_HASHTAG_CATEGORIES} categories`;
  }
  for (const [category, list] of entries) {
    if (
      category.trim().length === 0 ||
      category.length > MAX_EVENT_HASHTAG_CATEGORY_LENGTH ||
      category.includes('.') ||
      category.startsWith('$') ||
      category.includes('\0') ||
      category === '__proto__'
    ) {
      return `Invalid hashtag category name: ${JSON.stringify(category.slice(0, 60))}`;
    }
    const problem = hashtagListProblem(list, `categorizedHashtags.${category.slice(0, 60)}`);
    if (problem) return problem;
  }
  return null;
}
