import { findSlotHoles } from '@/lib/reportContentSlots';

// WHAT: Verify gap detection in occupied report-content slots (#125)
// WHY: Holes misalign auto-generated chart blocks; the UI surfaces these indices.

describe('findSlotHoles', () => {
  const occ = (...indices: number[]) => indices.map((index) => ({ index }));

  it('returns no holes for a contiguous sequence from 1', () => {
    expect(findSlotHoles(occ(1, 2, 3))).toEqual([]);
  });

  it('returns no holes for an empty list', () => {
    expect(findSlotHoles([])).toEqual([]);
  });

  it('finds a single interior gap', () => {
    expect(findSlotHoles(occ(1, 3))).toEqual([2]);
  });

  it('finds multiple gaps and ignores trailing free slots', () => {
    // occupied 1,4,6 → holes 2,3,5 (nothing above 6 is a hole)
    expect(findSlotHoles(occ(1, 4, 6))).toEqual([2, 3, 5]);
  });

  it('reports leading gap when the sequence does not start at 1', () => {
    expect(findSlotHoles(occ(3))).toEqual([1, 2]);
  });

  it('is order-independent (max index defines the ceiling)', () => {
    expect(findSlotHoles(occ(6, 1, 4))).toEqual([2, 3, 5]);
  });
});
