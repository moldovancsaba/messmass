// lib/dataBlockLineage.ts
// WHAT: The flattening rule for data_blocks duplication lineage.
// WHY: messmass#230. Pulled out of app/api/data-blocks/duplicate/route.ts so
//     tests/data-block-lineage.test.ts calls this exact function instead of a
//     hand-mirrored copy of it -- the prior version of that test reimplemented
//     the rule locally with no import at all, so it could not have caught a
//     divergence between the test and the route's real logic.

export function resolveSourceBlockId(source: { _id: unknown; sourceBlockId?: string | null }): string {
  return source.sourceBlockId ? String(source.sourceBlockId) : String(source._id);
}
