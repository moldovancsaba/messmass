// WHAT: Pure helpers for report content slot (reportImageN / reportTextN) validation
// WHY: Holes (gaps) in the occupied slot sequence misalign auto-generated chart blocks
//      (the Compact action re-numbers to fix them). Surfacing WHERE the gaps are lets
//      operators fix them before the report renders. Pure + DB-free so it is unit-testable.

/**
 * WHAT: Find gap indices in an ascending list of occupied slots.
 * WHY: A "hole" is an empty slot index below the highest occupied one — e.g. slots
 *      1 and 3 occupied → index 2 is a hole. Trailing free slots are not holes.
 * @param occupied ascending-by-index occupied slot entries (as returned by getOccupied)
 * @returns the missing indices between 1 and the highest occupied index
 */
export function findSlotHoles(occupied: { index: number }[]): number[] {
  if (occupied.length === 0) return [];
  const max = occupied.reduce((m, o) => Math.max(m, o.index), 0);
  const present = new Set(occupied.map((o) => o.index));
  const holes: number[] = [];
  for (let i = 1; i < max; i++) {
    if (!present.has(i)) holes.push(i);
  }
  return holes;
}
