#!/usr/bin/env node
/*
 * Generates the two sections of docs/architecture.md that rot fastest, because
 * both are derivable from the filesystem and neither was ever re-derived.
 *
 * The module catalogue claimed FormModal was "1-148" (it is 219 lines),
 * UnifiedHashtagInput "1-298" (449), ReportChart "400" (2,203), and cited a
 * REUSABLE_COMPONENTS_INVENTORY.md that does not exist. The URL/API reference
 * mixed live routes with dead ones -- /stats/[slug], /admin/variables,
 * GET /api/page-config -- with no marker saying which was which. Roughly 85% of
 * the catalogue's line references were wrong. It is the section read first.
 *
 * Hand-maintained counts drift the moment anyone stops maintaining them, and
 * nobody maintains a count. So: write it from the code, and let CI fail when
 * the committed output no longer matches.
 *
 *   node scripts/generate-architecture-sections.js           rewrite in place
 *   node scripts/generate-architecture-sections.js --check   CI gate
 *
 * Finding F-035 / issue #410.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DOC = path.join(ROOT, 'docs', 'architecture.md');
const ENDPOINTS = path.join(ROOT, 'docs', '_audit', 'endpoints.json');

const MARK = (name) => [`<!-- GENERATED:${name} -->`, `<!-- /GENERATED:${name} -->`];

/* ---------------------------------------------------------------- helpers */

function* walk(dir, skip = new Set(['node_modules', '.next', '.git', '.claude'])) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full, skip);
    else yield full;
  }
}

const rel = (p) => path.relative(ROOT, p);
const lineCount = (p) => fs.readFileSync(p, 'utf8').split('\n').length;

/* ------------------------------------------------------------ page routes */

/** A file route's URL: the path under app/ minus the filename and route groups. */
function routeOf(file) {
  const segs = rel(file).split(path.sep).slice(1, -1).filter((s) => !/^\(.*\)$/.test(s));
  return '/' + segs.join('/');
}

function pages() {
  const out = [];
  for (const f of walk(path.join(ROOT, 'app'))) {
    if (path.basename(f) !== 'page.tsx') continue;
    const route = routeOf(f);
    if (route.startsWith('/api')) continue;
    out.push({ route: route === '/' ? '/' : route, file: rel(f) });
  }
  return out.sort((a, b) => a.route.localeCompare(b.route));
}

/* -------------------------------------------------------------- api routes */

function endpoints() {
  if (!fs.existsSync(ENDPOINTS)) {
    console.error(`missing ${rel(ENDPOINTS)} -- run: npm run inventory:write`);
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(ENDPOINTS, 'utf8'));
  const list = Array.isArray(raw) ? raw : raw.endpoints || raw.items || [];
  return list.slice().sort((a, b) => a.path.localeCompare(b.path));
}

/* --------------------------------------------------------------- modules */

/** Importers of a module, counted by resolved specifier rather than by name. */
function importGraph() {
  const files = [];
  for (const dir of ['app', 'components', 'lib', 'hooks']) {
    for (const f of walk(path.join(ROOT, dir))) {
      if (/\.tsx?$/.test(f)) files.push(f);
    }
  }
  const importers = new Map(); // module path -> Set of importing files

  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const spec = m[1];
      let base;
      if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2));
      else if (spec.startsWith('.')) base = path.resolve(path.dirname(f), spec);
      else continue; // package import
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const cand = base + ext;
        if (fs.existsSync(cand)) {
          if (!importers.has(cand)) importers.set(cand, new Set());
          importers.get(cand).add(f);
          break;
        }
      }
    }
  }
  return { files, importers };
}

function countIn(dir, test) {
  let n = 0;
  for (const f of walk(path.join(ROOT, dir))) if (test(f)) n += 1;
  return n;
}

function cssVars(file) {
  if (!fs.existsSync(file)) return 0;
  return new Set(
    [...fs.readFileSync(file, 'utf8').matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1])
  ).size;
}

function cssClasses(file) {
  if (!fs.existsSync(file)) return 0;
  return new Set(
    [...fs.readFileSync(file, 'utf8').matchAll(/^\s*\.([\w-]+)/gm)].map((m) => m[1])
  ).size;
}

/* --------------------------------------------------------------- renderers */

function renderModules({ importers }) {
  const tsx = (f) => /\.tsx$/.test(f);
  const ts = (f) => /\.ts$/.test(f) && !/\.d\.ts$/.test(f);

  const rows = [
    ['UI Components', countIn('components', tsx), '`components/`'],
    ['Utility Modules', countIn('lib', ts), '`lib/`'],
    ['Hooks', countIn('hooks', ts) + countIn('hooks', tsx), '`hooks/`'],
    ['Design Tokens', cssVars(path.join(ROOT, 'app/styles/theme.css')), '`app/styles/theme.css`'],
    ['Utility CSS classes', cssClasses(path.join(ROOT, 'app/styles/utilities.css')), '`app/styles/utilities.css`'],
    ['App routes (pages)', pages().length, '`app/**/page.tsx`'],
    ['API routes', endpoints().length, '`app/api/**/route.ts`'],
  ];

  const top = [...importers.entries()]
    .filter(([p]) => /[/\\](components|lib|hooks)[/\\]/.test(p))
    .map(([p, s]) => ({ file: rel(p), importers: s.size, lines: lineCount(p) }))
    .sort((a, b) => b.importers - a.importers)
    .slice(0, 15);

  return [
    '',
    '| Category | Count | Location |',
    '|----------|-------|----------|',
    ...rows.map(([label, n, loc]) => `| **${label}** | ${n} | ${loc} |`),
    '',
    'The modules with the most importers — the ones whose change radius is',
    'largest, and the ones to read first:',
    '',
    '| Module | Importers | Lines |',
    '|--------|-----------|-------|',
    ...top.map((t) => `| \`${t.file}\` | ${t.importers} | ${t.lines} |`),
    '',
    'Importers are counted by resolved import specifier, not by symbol name, so',
    'a re-export through a barrel file counts for the barrel. A module missing',
    'from this table has few importers or none; that is not on its own proof it',
    'is dead — settle reachability with a symbol search and a build.',
    '',
  ].join('\n');
}

function renderRoutes() {
  const ps = pages();
  const es = endpoints();

  const byPrefix = new Map();
  for (const e of es) {
    const key = '/' + (e.path.split('/')[2] || '');
    if (!byPrefix.has(key)) byPrefix.set(key, []);
    byPrefix.get(key).push(e);
  }

  const out = ['', `### Pages (${ps.length})`, '', '| Route | File |', '|-------|------|'];
  for (const p of ps) out.push(`| \`${p.route}\` | \`${p.file}\` |`);

  out.push('', `### API routes (${es.length})`, '');
  out.push('`auth` is the guard symbol the route actually calls. A blank cell');
  out.push('means the route calls none — public by construction, or a gap.');
  out.push('');
  for (const [prefix, list] of [...byPrefix.entries()].sort()) {
    out.push(`#### \`/api${prefix}\``, '', '| Route | Methods | Auth |', '|-------|---------|------|');
    for (const e of list) {
      const auth = (e.auth_markers || []).join(', ');
      out.push(`| \`${e.path}\` | ${(e.methods || []).join(', ')} | ${auth ? `\`${auth}\`` : '—'} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------- main */

function splice(doc, name, body) {
  const [open, close] = MARK(name);
  const s = doc.indexOf(open);
  const e = doc.indexOf(close);
  if (s === -1 || e === -1) {
    console.error(`missing ${open} / ${close} markers in ${rel(DOC)}`);
    process.exit(2);
  }
  return doc.slice(0, s + open.length) + '\n' + body + doc.slice(e);
}

const graph = importGraph();
const current = fs.readFileSync(DOC, 'utf8');
let next = splice(current, 'modules', renderModules(graph));
next = splice(next, 'routes', renderRoutes());

if (process.argv.includes('--check')) {
  if (next === current) {
    console.log('✅ architecture.md generated sections match the filesystem.');
    process.exit(0);
  }
  console.log('❌ architecture.md generated sections are stale.\n');
  console.log('   Routes or modules changed without regenerating them.');
  console.log('   Fix: npm run architecture:generate  (then commit the result)');
  process.exit(1);
}

fs.writeFileSync(DOC, next);
console.log('Wrote the generated route inventory and module catalogue into docs/architecture.md.');
