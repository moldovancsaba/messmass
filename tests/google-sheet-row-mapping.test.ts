// tests/google-sheet-row-mapping.test.ts
// WHAT: Writing partner events to a Google Sheet must produce populated rows.
// WHY: messmass#286. lib/googleSheets/rowMapper.ts defaulted its `columnMap`
//     parameter to DEFAULT_COLUMN_MAP = {} -- a migration-era fallback marked
//     "TODO: Remove this after full migration to index-based mapping".
//     lib/googleSheets/partnerSheetOps.ts called `eventToRow(event)` with no
//     map and therefore hit that default, and eventToRow with an empty map
//     computes `maxColIndex = Math.max(...[], 0) = 0` and iterates
//     `Object.entries({})` -- so it returns `['']`, one blank cell, for every
//     event. Chasing that turned up a second, earlier fault in the same path:
//     partnerSheetOps built its header row by reading SHEET_HEADER_LABELS' keys
//     as column letters, but they are field names, so the computed max index
//     was ~1.5e41 and the loop threw `RangeError: Invalid array length`.
//     Provisioning never reached the blank rows -- it died at "write headers".
// HOW: These assert the two halves that have to line up -- that the headers the
//     provisioning code writes round-trip back into a usable index map, and
//     that a mapped row actually carries the event's values. The empty-map case
//     is pinned too, so the failure mode is documented rather than merely gone.

import { getSheetHeaderRow, SHEET_HEADER_LABELS, columnLetterToIndex } from '@/lib/googleSheets/columnMap';
import { generateDynamicColumnMap } from '@/lib/googleSheets/dynamicMapping';
import { eventToRow } from '@/lib/googleSheets/rowMapper';

/** The header row partner sheet provisioning writes. */
const sheetHeaders = getSheetHeaderRow;

const EVENT = {
  eventName: 'Test Event',
  eventDate: '2026-09-16',
  stats: { remoteImages: 123, selfies: 45 },
};

describe('google sheet row mapping', () => {
  const headers = sheetHeaders();
  const map = generateDynamicColumnMap(headers);

  it('round-trips the provisioning headers into a usable column map', () => {
    // If this breaks, provisioning writes headers the puller cannot read back.
    const named = headers.filter((h) => h.trim() !== '').length;
    expect(named).toBeGreaterThan(0);
    expect(Object.keys(map).length).toBeGreaterThan(0);
  });

  it('produces a row as wide as the mapped columns', () => {
    const row = eventToRow(EVENT, map);
    const maxIndex = Math.max(...Object.keys(map).map(Number));
    expect(row.length).toBe(maxIndex + 1);
    expect(row.length).toBeGreaterThan(1);
  });

  it('carries the event values into the row', () => {
    const row = eventToRow(EVENT, map);
    const entry = Object.entries(map).find(([, def]) => (def as { field: string }).field === 'eventName');
    expect(entry).toBeDefined();
    expect(row[Number(entry![0])]).toBe('Test Event');
    expect(row.filter((cell) => cell !== '' && cell != null).length).toBeGreaterThan(1);
  });

  it('collapses to a single blank cell when handed an empty map', () => {
    // The #286 bug, pinned. This is why the empty-map default had to go: the
    // call site that omitted the argument got this silently. The default is
    // gone, so reaching this now takes passing {} on purpose.
    expect(eventToRow(EVENT, {})).toEqual(['']);
  });

  it('does not treat header-label keys as column letters', () => {
    // The crash behind the blank rows. SHEET_HEADER_LABELS is keyed by field
    // name, so reading those keys as base-26 column letters produced a max
    // index of ~1.5e41 and threw RangeError: Invalid array length. Provisioning
    // died at "write headers" before writing anything.
    const asIfLetters = Math.max(...Object.keys(SHEET_HEADER_LABELS).map((k) => columnLetterToIndex(k)));
    expect(asIfLetters).toBeGreaterThan(2 ** 32);
    expect(sheetHeaders().length).toBeLessThan(1000);
  });
});
