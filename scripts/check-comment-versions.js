#!/usr/bin/env node
/*
 * Fails when a comment claims a version that has not shipped, or promises a
 * removal that is already overdue.
 *
 * Version stamps in headers are never revisited. Five files here were stamped
 * "v12.4.0 - Phase 3" for a release that does not exist, and one branch carried
 * "will be removed after migration in v8.17.0" four majors past that point. Both
 * read as fact to anyone who has not checked the tags.
 *
 * This deliberately does NOT ban version references outright. Naming the release
 * that introduced or replaced something is real history and often the most
 * useful line in a header -- the check only objects when the claim is checkably
 * false against package.json.
 *
 * Finding F-031 / issue #406.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CURRENT = require(path.join(ROOT, 'package.json')).version;
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks'];
const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.css']);
const SKIP = new Set(['node_modules', '.next', '.git', '.claude', 'dist', 'build']);

/** Exceptions need a reason. */
const ALLOWLIST = new Map();

const cmp = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
};

/* Any vX.Y.Z token. */
const VERSION_RE = /\bv(\d+\.\d+\.\d+)\b/g;
/* A promise to remove something by a named version. */
const PROMISE_RE = /\b(?:will be |to be |should be )?remove[d]?\s+(?:after|in|by)\s+(?:migration\s+in\s+)?v?(\d+\.\d+\.\d+)\b/gi;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SCAN_EXT.has(path.extname(entry.name))) yield full;
  }
}

const commentLines = (source) =>
  source
    .split('\n')
    .map((text, i) => ({ line: i + 1, text: text.trim() }))
    .filter(({ text }) => /^(\/\/|\*|\/\*)/.test(text));

const unshipped = [];
const overdue = [];
let scanned = 0;

for (const dir of SCAN_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    scanned += 1;
    const rel = path.relative(ROOT, file);
    const source = fs.readFileSync(file, 'utf8');
    for (const { line, text } of commentLines(source)) {
      if (ALLOWLIST.has(`${rel}:${line}`)) continue;

      for (const m of text.matchAll(VERSION_RE)) {
        if (cmp(m[1], CURRENT) > 0) {
          unshipped.push({ rel, line, claimed: m[1], text: text.slice(0, 92) });
        }
      }
      for (const m of text.matchAll(PROMISE_RE)) {
        if (cmp(m[1], CURRENT) < 0) {
          overdue.push({ rel, line, due: m[1], text: text.slice(0, 92) });
        }
      }
    }
  }
}

console.log(`Comment version check: ${scanned} files, current version ${CURRENT}.`);

if (unshipped.length === 0 && overdue.length === 0) {
  console.log('✅ No comment claims an unshipped version or an overdue removal.');
  process.exit(0);
}

if (unshipped.length) {
  console.log(`\n❌ ${unshipped.length} comment(s) claim a version newer than ${CURRENT}:\n`);
  for (const f of unshipped) console.log(`   ${f.rel}:${f.line}  claims v${f.claimed}\n      ${f.text}`);
}
if (overdue.length) {
  console.log(`\n❌ ${overdue.length} removal promise(s) are overdue:\n`);
  for (const f of overdue) console.log(`   ${f.rel}:${f.line}  due v${f.due}, now ${CURRENT}\n      ${f.text}`);
}
console.log('\nDrop the stamp, or do the removal. Git blame already records when something landed.');
process.exit(1);
