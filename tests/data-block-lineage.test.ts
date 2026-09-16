// tests/data-block-lineage.test.ts
// WHAT: Duplicating a data block records which block it came from, and always
//     points at the original rather than an intermediate copy.
// WHY: messmass#230. Content reuse already happens by hand-copying data_blocks
//     with no tracked lineage -- "compare results across template runs" (the
//     issue's own acceptance check) has nothing to group by without it.
// HOW: Calls the real resolveSourceBlockId from lib/dataBlockLineage.ts (what
//     the route itself calls) rather than a copy of it -- this file previously
//     reimplemented the rule inline with no import at all, so it could not
//     have caught a divergence from the route's real logic. The flattening
//     rule (a copy of a copy points at the ROOT original, not its immediate
//     parent) is the one non-obvious piece here, so it's what this pins.

import { resolveSourceBlockId as duplicate } from '@/lib/dataBlockLineage';

describe('data block duplication lineage', () => {
  it('a first duplicate points at its source', () => {
    expect(duplicate({ _id: 'block-A' })).toBe('block-A');
  });

  it('a duplicate of a duplicate still points at the original, not the intermediate copy', () => {
    // block-B was created FROM block-A (sourceBlockId: 'block-A'). Duplicating
    // block-B must record 'block-A', not 'block-B' -- otherwise every
    // duplication hop breaks the chain that "compare across runs" needs.
    const blockB = { _id: 'block-B', sourceBlockId: 'block-A' };
    expect(duplicate(blockB)).toBe('block-A');
  });

  it('a third-generation duplicate still resolves to the same original', () => {
    const blockC = { _id: 'block-C', sourceBlockId: 'block-A' };
    expect(duplicate(blockC)).toBe('block-A');
  });
});
