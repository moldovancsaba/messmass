#!/usr/bin/env node
/*
  scripts/generate-settings-inventory.js
  WHAT: Produce a CSV inventory of config-related usages and hard-coded service URLs across code files.
  WHY: Drive refactor to central config loader; eliminate baked settings; satisfy audit/acceptance.

  Scope
  - Files: *.ts, *.tsx, *.js, *.jsx
  - Excludes (fallback path): node_modules, .next, public, docs, package-lock*
  - Patterns: process.env.*, sensitive keys, and http(s) literals

  Output
  - docs/audit/settings-inventory.csv with columns: file,path,line,match,context

  Notes
  - Prefers `git grep` on tracked files for speed and reliability.
  - Falls back to `grep -R` when git repo or command is unavailable.
*/

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), 'docs', 'audit');
const OUT_FILE = path.join(OUT_DIR, 'settings-inventory.csv');

// Extended ERE compatible with git grep and grep -E
const PATTERN = '((?:process\\.env\\.[A-Z0-9_]+)|MONGODB_URI|MONGODB_DB|DATABASE_URL|API_[A-Z_]*|TOKEN|SECRET|PASSWORD|NEXT_PUBLIC_[A-Z_]*|https?://[A-Za-z0-9_./:%#?=&-]+)';

function csvEscape(value) {
  const s = String(value ?? '');
  return '"' + s.replace(/"/g, '""') + '"';
}

function runGitGrep() {
  const args = ['--no-pager', 'grep', '-n', '-E', PATTERN, '--', '*.ts', '*.tsx', '*.js', '*.jsx'];
  const res = spawnSync('git', args, { encoding: 'utf8' });
  if (res.status === 0 && res.stdout.trim().length > 0) {
    return res.stdout;
  }
  return null;
}

function runFallbackGrep() {
  const cmd = [
    "grep -R -n -E",
    `'${PATTERN}'`,
    ".",
    "--include=*.ts --include=*.tsx --include=*.js --include=*.jsx",
    "--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=public --exclude-dir=docs",
    "--exclude=package-lock*"
  ].join(' ');
  const res = spawnSync('sh', ['-c', cmd], { encoding: 'utf8' });
  if (res.status === 0 && res.stdout.trim().length > 0) {
    return res.stdout;
  }
  // grep returns exit 1 when no matches found; still return stdout
  if (res.status === 1 && res.stdout.trim().length === 0) return '';
  return res.stdout || '';
}

function parseLinesToRows(text) {
  const re = new RegExp(PATTERN, 'i');
  const rows = [];
  const lines = text.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    // Expect: path:line:content
    const m = line.match(/^(.*?):(\d+):(.*)$/);
    if (!m) continue;
    const p = m[1];
    const ln = Number(m[2]);
    const context = m[3];
    const mm = context.match(re);
    const match = mm ? mm[0] : '';
    rows.push({ p, ln, match, context });
  }
  return rows;
}

function main() {
  let out = runGitGrep();
  if (out == null) {
    out = runFallbackGrep();
  }
  const rows = parseLinesToRows(out);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const csvRows = [
    'file,path,line,match,context',
    ...rows.map(r => [
      csvEscape(path.basename(r.p)),
      csvEscape(r.p),
      r.ln,
      csvEscape(r.match),
      csvEscape(r.context.replace(/\r?\n/g, ' ').trim())
    ].join(','))
  ];
  fs.writeFileSync(OUT_FILE, csvRows.join('\n'));
  console.log(`Wrote ${OUT_FILE} (${rows.length} matches)`);
}

main();
