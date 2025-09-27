#!/usr/bin/env node
/*
  scripts/audit-styles.js
  What: Scans the repository for inline React style props (style={{ ... }}) and hardcoded hex colors.
  Why: Enforce style-system hardening and help identify remnants that should be moved to tokenized classes.

  Notes:
  - Inline style props are generally prohibited. Use classes and design tokens instead.
  - Hardcoded hex colors should live in app/styles/theme.css. This script reports occurrences outside canonical token files.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const INCLUDE_EXTS = new Set(['.tsx', '.jsx', '.css']);
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'out'
]);

// Canonical files allowed to contain hex values (design tokens)
const HEX_ALLOWED_FILES = new Set([
  path.join('app', 'styles', 'theme.css')
]);

const STYLE_PROP_RE = /style\s*=\s*\{\{/g; // style={{
const HEX_COLOR_RE = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full);
    } else if (e.isFile()) {
      const ext = path.extname(e.name);
      if (!INCLUDE_EXTS.has(ext)) continue;
      auditFile(full);
    }
  }
}

const issues = {
  styleProps: [],
  hexColors: []
};

function auditFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Inline style props in TSX/JSX
  if ((filePath.endsWith('.tsx') || filePath.endsWith('.jsx'))) {
    if (STYLE_PROP_RE.test(content)) {
      const count = (content.match(STYLE_PROP_RE) || []).length;
      issues.styleProps.push({ file: rel, count });
    }
  }

  // Hardcoded hex colors (skip allowed token files)
  if (!HEX_ALLOWED_FILES.has(rel)) {
    const matches = content.match(HEX_COLOR_RE);
    if (matches && matches.length) {
      issues.hexColors.push({ file: rel, count: matches.length });
    }
  }
}

walk(ROOT);

function printSection(title, rows) {
  console.log(`\n=== ${title} ===`);
  if (!rows.length) {
    console.log('No issues found.');
    return;
    }
  rows.sort((a, b) => a.file.localeCompare(b.file));
  for (const r of rows) {
    console.log(`${r.file} — ${r.count}`);
  }
}

console.log('Style Audit Report');
printSection('Inline style props (style={{ ... }})', issues.styleProps);
printSection('Hardcoded hex colors (outside token files)', issues.hexColors);

// Exit code guidance: non-zero if style props found (strict), warning if only hex occurrences
if (issues.styleProps.length > 0) {
  process.exitCode = 1;
}
