#!/usr/bin/env node
/*
 * Fails when a comment cites a repository path that no longer resolves.
 *
 * Deleting code does not delete the comments that point at it. Every removal
 * this repo has made -- the WebSocket server, UnifiedDataVisualization,
 * StatsCharts, components/charts/*, lib/export/pdf.ts -- left behind
 * present-tense references, and one of them justified an API response shape by
 * naming a consumer that had already been deleted. A reader, human or agent,
 * trusts those names and goes looking.
 *
 * Finding F-029 / issue #404.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks', 'scripts'];
const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.css']);
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.claude', 'dist', 'build']);

/* Paths that are intentionally absent: generated at build time, created by a
 * script, or belonging to a sibling repo. Each needs a reason. */
const ALLOWLIST = new Map([
  ['app/api/export/pdf/route.js', 'build output referenced when describing the compiled route'],
]);

/* A path-shaped token inside a comment: starts at a scanned top-level directory
 * and ends in a source extension. Deliberately narrow -- prose mentioning
 * "components/" in general should not trip this. */
const PATH_RE = /\b((?:app|components|lib|hooks|scripts|server)\/[A-Za-z0-9_\-./[\]]*\.(?:tsx?|jsx?|mjs|css))/g;

/* Sibling repos in the fleet. A path belonging to one of these is correct as
 * written and must not be resolved against this checkout. */
const SIBLING_REPOS = /(camera|fanmass|launchmass|sso)(?:'s)?[\s/]$/;

/* The same attribution written after the path: "... on the camera side". */
const SIBLING_SUFFIX = /\b(on|in|from)\s+(the\s+)?(camera|fanmass|launchmass|sso)\b/i;

/* A comment may name a deleted file on purpose -- to say what something
 * replaced. That is the opposite of the rot this check exists for, so a path in
 * a clause carrying one of these markers is left alone. The architecture doc's
 * WebSocket section is the model: explicitly past tense, and therefore honest. */
const HISTORICAL = /\b(old|former(ly)?|previous(ly)?|replaced|superseded|used to|no longer|deleted|removed|retired|legacy|before)\b/i;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.claude') {
      if (SKIP_DIRS.has(entry.name)) continue;
    }
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SCAN_EXT.has(path.extname(entry.name))) yield full;
  }
}

/* Return only the comment regions of a source file, so a real import path or a
 * string literal is never reported. Handles //, /* *​/ and JSX {/* *​/}. */
function commentsOf(source, ext) {
  const out = [];
  const isCss = ext === '.css';
  let i = 0;
  let state = 'code';
  let start = 0;
  let quote = '';
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (state === 'code') {
      if (!isCss && (source[i] === '"' || source[i] === "'" || source[i] === '`')) {
        quote = source[i];
        state = 'string';
        i += 1;
        continue;
      }
      if (two === '/*') { state = 'block'; start = i + 2; i += 2; continue; }
      if (!isCss && two === '//') { state = 'line'; start = i + 2; i += 2; continue; }
      i += 1;
    } else if (state === 'string') {
      if (source[i] === '\\') { i += 2; continue; }
      if (source[i] === quote) state = 'code';
      i += 1;
    } else if (state === 'block') {
      if (two === '*/') { out.push([start, i]); state = 'code'; i += 2; continue; }
      i += 1;
    } else { // line
      if (source[i] === '\n') { out.push([start, i]); state = 'code'; }
      i += 1;
    }
  }
  if (state === 'block' || state === 'line') out.push([start, source.length]);
  return out.map(([a, b]) => ({ text: source.slice(a, b), offset: a }));
}

const findings = [];
let scanned = 0;
let cited = 0;

for (const dir of SCAN_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    scanned += 1;
    const source = fs.readFileSync(file, 'utf8');
    const ext = path.extname(file);
    for (const comment of commentsOf(source, ext)) {
      for (const match of comment.text.matchAll(PATH_RE)) {
        const cite = match[1];
        cited += 1;
        if (ALLOWLIST.has(cite)) continue;
        if (fs.existsSync(path.join(ROOT, cite))) continue;

        /* Context is taken from the raw source, not the comment region: a run of
         * `//` lines is many regions, so a qualifier on the line above would
         * otherwise be invisible. */
        const at = comment.offset + match.index;
        const before = source.slice(Math.max(0, at - 220), at);
        const around = source.slice(Math.max(0, at - 220), at + cite.length + 160);

        /* Attributed to a sibling repo, e.g. "camera's lib/x.ts" or
         * "lib/x.ts on the camera side"? */
        if (SIBLING_REPOS.test(before) || SIBLING_SUFFIX.test(around)) continue;

        /* Explicitly describing something that is gone? */
        if (HISTORICAL.test(around)) continue;
        const line = source.slice(0, comment.offset + match.index).split('\n').length;
        findings.push({ file: path.relative(ROOT, file), line, cite });
      }
    }
  }
}

console.log(`Comment path check: ${scanned} files, ${cited} cited paths.`);

if (findings.length === 0) {
  console.log('✅ Every path cited in a comment resolves.');
  process.exit(0);
}

console.log(`\n❌ ${findings.length} comment(s) cite a path that does not exist:\n`);
for (const f of findings) {
  console.log(`   ${f.file}:${f.line}`);
  console.log(`      cites: ${f.cite}`);
}
console.log('\nFix the comment, or add the path to ALLOWLIST in this script with a reason.');
process.exit(1);
