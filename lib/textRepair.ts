// lib/textRepair.ts
// WHAT: Detects and repairs "mojibake" text -- valid UTF-8 that was, at some
//     earlier point (an old import), decoded as Windows-1252 and stored that
//     way. Classic symptom: "Váci" stored/displayed as "VÃ¡ci".
// WHY: Surfaced when partner names started appearing in camera via the sync
//     backfill (e.g. "VÃ¡ci NKSE" instead of "Váci NKSE") -- the corruption
//     was already in messmass's own database, sync just made it visible
//     elsewhere.
// HOW: repairMojibake() reverses ONE layer of "UTF-8 bytes shown as
//     Windows-1252" by mapping each character back to its cp1252 byte value,
//     then re-decoding those bytes as UTF-8. Returns null (never guesses) if
//     the string isn't representable in cp1252, or the round-trip doesn't
//     produce valid UTF-8 -- this is what makes it safe to run on already-
//     correct text of ANY language/script: real multi-byte UTF-8 characters
//     (á, ő, Ü, 北, ...) fail the round-trip and are left untouched.

const CP1252_TO_CODEPOINT: number[] = (() => {
  const dec = new TextDecoder('windows-1252');
  const table: number[] = new Array(256);
  for (let b = 0; b < 256; b++) {
    table[b] = dec.decode(Buffer.from([b])).codePointAt(0)!;
  }
  return table;
})();

const CODEPOINT_TO_CP1252: Map<number, number> = new Map(
  CP1252_TO_CODEPOINT.map((cp, byte) => [cp, byte])
);

/**
 * repairMojibake
 * Returns the repaired string if `str` is detectably "UTF-8 shown as
 * Windows-1252" mojibake, or null if it isn't (including: already-correct
 * text in any language, or text that just happens to not be representable
 * this way). Never returns a guess -- only an exact, verified repair.
 */
export function repairMojibake(str: string): string | null {
  if (!str) return null;
  const bytes: number[] = [];
  for (const ch of str) {
    const byte = CODEPOINT_TO_CP1252.get(ch.codePointAt(0)!);
    if (byte === undefined) return null;
    bytes.push(byte);
  }
  const repaired = Buffer.from(bytes).toString('utf8');
  if (repaired.includes('�')) return null; // invalid UTF-8 -- not a match
  if (repaired === str) return null; // nothing to fix
  return repaired;
}
