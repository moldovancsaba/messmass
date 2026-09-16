// tests/comment-counts-match-code.test.ts
// WHAT: When a comment states how many things a code-owned collection holds,
//     that number must be right.
// WHY: The colour-count cluster is the worst documentation drift in the repo:
//     "26 color fields" and "35 color properties" sat beside an array of 40, the
//     wrong number was copied into a hook, an editor header and a runtime
//     console.log, and one file contradicted itself. Nobody noticed for months
//     because nothing connected the prose to the array.
// HOW: Not a ban on writing numbers. A survey of comment counts found ~101 in
//     this repo and the large majority are legitimate and stable -- "2 columns"
//     for a CSS grid, "exactly 1 element" as a validation rule, "clamped to 2
//     lines". Banning those would produce a gate that cries wolf and gets
//     switched off. Instead this binds the few phrases that name a collection
//     the code actually owns, and verifies them. Add a row when a new
//     collection acquires prose that counts it.

import fs from 'fs';
import path from 'path';
import { COLOR_FIELDS, DIMENSION_FIELDS } from '@/lib/reportStyleTypes';
// Deliberately no import from lib/users: it pulls in mongodb and getDb at module
// load, which hangs a test that only needs to read source text.

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks'];
const SCAN_EXT = new Set(['.ts', '.tsx', '.css']);
const SKIP = new Set(['node_modules', '.next', '.git', '.claude', 'dist', 'build']);

const styleCategories = new Set(
  [...COLOR_FIELDS, ...DIMENSION_FIELDS].map((f) => f.category)
);

/** phrase → the number the code actually produces */
const BOUND_COUNTS: { label: string; pattern: RegExp; actual: number }[] = [
  { label: 'COLOR_FIELDS', pattern: /(\d+)\s+colou?r\s+(?:fields?|properties|propert(?:y|ies))/gi, actual: COLOR_FIELDS.length },
  { label: 'COLOR_FIELDS', pattern: /(\d+)\s+colou?rs\b(?!\s*\+)/gi, actual: COLOR_FIELDS.length },
  { label: 'style fields (COLOR+DIMENSION)', pattern: /(\d+)\s+(?:style\s+)?fields\b/gi, actual: COLOR_FIELDS.length + DIMENSION_FIELDS.length },
  { label: 'style categories', pattern: /(?:scrolling|across|all)\s+(\w+)\s+categories/gi, actual: styleCategories.size },
];

const WORD_NUMBER: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SCAN_EXT.has(path.extname(entry.name))) yield full;
  }
}

function commentLines(source: string): { line: number; text: string }[] {
  return source
    .split('\n')
    .map((text, i) => ({ line: i + 1, text: text.trim() }))
    .filter(({ text }) => /^(\/\/|\*|\/\*)/.test(text));
}

describe('comment counts match the code they describe', () => {
  const offenders: string[] = [];

  for (const dir of SCAN_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const file of walk(abs)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const { line, text } of commentLines(source)) {
        for (const { label, pattern, actual } of BOUND_COUNTS) {
          for (const m of text.matchAll(new RegExp(pattern))) {
            const raw = m[1].toLowerCase();
            const claimed = /^\d+$/.test(raw) ? Number(raw) : WORD_NUMBER[raw];
            if (claimed === undefined) continue; // not a number we can read
            if (claimed !== actual) {
              offenders.push(
                `${path.relative(ROOT, file)}:${line} claims ${claimed} for ${label} (actual ${actual})\n      ${text.slice(0, 96)}`
              );
            }
          }
        }
      }
    }
  }

  it('states no cardinality that contradicts the collection', () => {
    expect(offenders.join('\n')).toBe('');
  });

  it('is actually bound to live collections, not frozen numbers', () => {
    // If someone adds a field, `actual` moves with it -- that is the whole point.
    expect(COLOR_FIELDS.length).toBeGreaterThan(0);
    expect(DIMENSION_FIELDS.length).toBeGreaterThan(0);
    expect(styleCategories.size).toBeGreaterThan(0);
  });
});
