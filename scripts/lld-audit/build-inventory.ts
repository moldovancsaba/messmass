// scripts/lld-audit/build-inventory.ts
// WHAT: Phase 0 instrumentation for the LLD deep audit — builds the coverage
//     ledger, the route → module → collection graph, and the collection
//     read/write matrix.
// WHY: Rule R4 of the audit plan requires completeness to be mechanical rather
//     than remembered. If the ledger is hand-maintained it will drift within a
//     week and silently under-report coverage, which is the exact failure the
//     audit exists to prevent.
// HOW: TypeScript compiler API, not grep. Import edges are resolved through
//     ts.resolveModuleName so path aliases (`@/lib/x`), extensionless imports and
//     index files resolve to real files; collection names are read off the AST so
//     a name inside a comment or a string that merely looks like a call is never
//     counted. grep gets both of those wrong, and this file is the evidence base
//     for everything the audit later asserts.
//
// Run: npx tsx scripts/lld-audit/build-inventory.ts

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs/audits/lld');
const GRAPH_DIR = path.join(OUT_DIR, 'graphs');

const CODE_EXT = ['.ts', '.tsx', '.js', '.jsx'];

type Kind = 'route' | 'page' | 'app-module' | 'lib' | 'component' | 'hook' | 'test' | 'script';

interface Unit {
  id: string;
  kind: Kind;
  file: string;
  lines: number;
  lastCommit: string;
  domain: string;
  disposition: string;
  phase: string;
  evidence: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// File enumeration
// ---------------------------------------------------------------------------

// WHAT: Directories excluded from the scan.
// WHY: `scripts/lld-audit` is the audit's own instrumentation, not part of the
//     system under audit. Including it let the harness's own `db.collection('probe')`
//     appear in the ledger as a real collection — the instrument contaminating its
//     own measurement. Excluded so counts reconcile against the pre-audit repo.
const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git', 'lld-audit']);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (CODE_EXT.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join('/');

function countLines(file: string): number {
  // Matches `wc -l` semantics (newline count) so ledger totals reconcile with
  // the figures quoted in the audit plan, which were produced by wc.
  const buf = fs.readFileSync(file);
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === 0x0a) n++;
  return n;
}

// ---------------------------------------------------------------------------
// Git recency — one pass, not one process per file
// ---------------------------------------------------------------------------

function lastCommitDates(): Map<string, string> {
  const map = new Map<string, string>();
  const raw = execSync('git log --name-only --format="C|%aI" --no-merges', {
    cwd: ROOT,
    maxBuffer: 1024 * 1024 * 256,
    encoding: 'utf8',
  });
  let current = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('C|')) current = line.slice(2).trim();
    else if (line.trim() && current && !map.has(line.trim())) map.set(line.trim(), current);
  }
  return map;
}

function churnCounts(sinceMonths = 12): Map<string, number> {
  const map = new Map<string, number>();
  const raw = execSync(`git log --since="${sinceMonths} months ago" --name-only --pretty=format: --no-merges`, {
    cwd: ROOT,
    maxBuffer: 1024 * 1024 * 256,
    encoding: 'utf8',
  });
  for (const line of raw.split('\n')) {
    const f = line.trim();
    if (f) map.set(f, (map.get(f) ?? 0) + 1);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

function classify(file: string): Kind | null {
  const r = rel(file);
  if (r.startsWith('tests/')) return 'test';
  if (r.startsWith('scripts/')) return 'script';
  if (r.startsWith('hooks/')) return 'hook';
  if (r.startsWith('components/')) return 'component';
  if (r.startsWith('lib/')) return 'lib';
  if (r.startsWith('app/')) {
    const base = path.basename(r);
    if (base === 'route.ts' || base === 'route.tsx') return 'route';
    if (base === 'page.tsx' || base === 'page.ts') return 'page';
    return 'app-module';
  }
  return null;
}

// WHAT: Coarse domain label used to slice the ledger by audit phase.
// WHY: Phases 2–8 are domain sweeps. Without a domain column the ledger cannot
//     answer "is phase 5 complete", which is the question R4 exists to answer.
function domainOf(r: string): string {
  const api = r.match(/^app\/api\/([^/]+)/);
  if (api) {
    const g = api[1];
    if (g === 'integrations' || g === 'drive-folders' || g === 'cron' || g === 'google-sheets') return 'integrations';
    if (g === 'analytics') return 'analytics';
    if (g === 'auth' || g === 'me' || g === 'csrf-token' || g === 'page-passwords') return 'auth';
    if (['charts', 'chart-config', 'chart-configs', 'chart-formatting-defaults', 'reports', 'report-config',
         'report-variants', 'report-templates', 'report-styles', 'data-blocks', 'auto-generate-chart-block',
         'landing-report', 'landing-static'].includes(g)) return 'reporting';
    if (['variables-config', 'variables-groups', 'stats', 'projects', 'hashtags', 'hashtag-colors',
         'hashtag-categories', 'clicker-sets', 'filter-slug'].includes(g)) return 'data';
    if (g === 'admin') return 'admin';
    return g;
  }
  if (/^app\/(report|stats|partner-report|organization-report)/.test(r)) return 'reporting';
  if (/^app\/admin\/analytics/.test(r)) return 'analytics';
  if (/^app\/admin/.test(r)) return 'admin';
  if (/^lib\/(analytics|insights|sponsorship)/i.test(r)) return 'analytics';
  if (/^lib\/(formula|chart|report|layout|template)/i.test(r)) return 'reporting';
  if (/^lib\/(auth|permissions|csrf|session|pagePassword)/i.test(r)) return 'auth';
  if (/^lib\/(fanmass|camera|bitly|googleSheets|webhooks|sports)/i.test(r)) return 'integrations';
  if (/^lib\/(mongodb|db|adminEntity|adminData)/i.test(r)) return 'data';
  return 'uncategorised';
}

// ---------------------------------------------------------------------------
// AST: collection references
// ---------------------------------------------------------------------------

type Access = 'read' | 'write' | 'unknown';

const WRITE_METHODS = new Set([
  'insertOne', 'insertMany', 'updateOne', 'updateMany', 'replaceOne', 'deleteOne',
  'deleteMany', 'findOneAndUpdate', 'findOneAndReplace', 'findOneAndDelete',
  'bulkWrite', 'drop', 'createIndex', 'createIndexes', 'rename',
]);
const READ_METHODS = new Set([
  'find', 'findOne', 'countDocuments', 'estimatedDocumentCount', 'aggregate', 'distinct', 'watch',
]);

interface CollectionRef {
  name: string;
  file: string;
  line: number;
  access: Access;
  method: string;
}

// WHAT: Classify a set of method names into a single access verdict.
// WHY: A handle used for both find() and updateOne() is a write path for risk
//     purposes — the stronger classification wins, because the matrix exists to
//     answer "who can change this data".
function verdict(methods: string[]): { access: Access; method: string } {
  const writes = methods.filter((m) => WRITE_METHODS.has(m));
  const reads = methods.filter((m) => READ_METHODS.has(m));
  if (writes.length) return { access: 'write', method: [...new Set(writes)].sort().join('/') };
  if (reads.length) return { access: 'read', method: [...new Set(reads)].sort().join('/') };
  return { access: 'unknown', method: '' };
}

// WHAT: Find `X.collection('name')` and record how the result is actually used.
// WHY: The audit needs a read/write matrix, not just "this file mentions the
//     collection". A route that only reads is a very different risk from one that
//     writes, and drift between two names matters most when both sides write.
// HOW: Two shapes have to be handled, because the codebase uses both heavily.
//     Chained — `db.collection('x').find()` — is readable from the parent node.
//     Bound — `const col = db.collection('x'); col.updateOne(...)` — is not, and
//     that shape accounts for the majority of call sites here. For it we take the
//     declared identifier and collect every method invoked on it within the same
//     source file. Known limitation, recorded rather than hidden: an identifier
//     shadowed in a nested scope would over-collect. Phase 3 dispositions each
//     `unknown` and spot-checks the bound ones.
function collectionRefsIn(sf: ts.SourceFile): CollectionRef[] {
  const refs: CollectionRef[] = [];

  // Pass 1: every `ident.method(` in the file, so bound handles can be resolved.
  const methodsByIdent = new Map<string, string[]>();
  const collectMethods = (node: ts.Node) => {
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      const id = node.expression.text;
      if (!methodsByIdent.has(id)) methodsByIdent.set(id, []);
      methodsByIdent.get(id)!.push(node.name.text);
    }
    ts.forEachChild(node, collectMethods);
  };
  collectMethods(sf);

  // Ancestry is tracked explicitly rather than read from `node.parent`. Source
  // files obtained from a ts.Program have no parent pointers until the binder
  // runs, which it does not here — relying on them silently misclassified every
  // chained call in app/ and lib/ as `unknown` while the separately-parsed
  // scripts/ pass worked, which is precisely the kind of quiet analyser bug that
  // would have corrupted the ledger.
  const visit = (node: ts.Node, ancestors: ts.Node[]) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'collection' &&
      node.arguments.length > 0
    ) {
      const arg = node.arguments[0];
      if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
        let access: Access = 'unknown';
        let method = '';
        const parent = ancestors[ancestors.length - 1];

        // Shape 1 — chained directly off the collection() call.
        if (parent && ts.isPropertyAccessExpression(parent) && parent.expression === node) {
          const v = verdict([parent.name.text]);
          access = v.access;
          method = v.method || parent.name.text;
        }

        // Shape 2 — assigned to a variable, then used elsewhere in the file.
        if (access === 'unknown') {
          for (let i = ancestors.length - 1; i >= 0; i--) {
            const a = ancestors[i];
            if (ts.isAwaitExpression(a) || ts.isParenthesizedExpression(a) || ts.isAsExpression(a)) continue;
            if (ts.isVariableDeclaration(a) && ts.isIdentifier(a.name)) {
              const v = verdict(methodsByIdent.get(a.name.text) ?? []);
              access = v.access;
              method = v.method;
            }
            break;
          }
        }

        const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
        refs.push({ name: arg.text, file: rel(sf.fileName), line: line + 1, access, method });
      }
    }
    ancestors.push(node);
    ts.forEachChild(node, (c) => visit(c, ancestors));
    ancestors.pop();
  };
  visit(sf, []);
  return refs;
}

// ---------------------------------------------------------------------------
// Program construction + import graph
// ---------------------------------------------------------------------------

function loadProgram(files: string[]): ts.Program {
  const cfgPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json');
  if (!cfgPath) throw new Error('tsconfig.json not found — cannot resolve imports accurately.');
  const cfgFile = ts.readConfigFile(cfgPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(cfgFile.config, ts.sys, ROOT);
  return ts.createProgram({
    rootNames: files,
    options: { ...parsed.options, noEmit: true, skipLibCheck: true },
  });
}

function importEdges(sf: ts.SourceFile, options: ts.CompilerOptions): string[] {
  const out: string[] = [];
  const add = (spec: string) => {
    const resolved = ts.resolveModuleName(spec, sf.fileName, options, ts.sys);
    const f = resolved.resolvedModule?.resolvedFileName;
    if (f && !f.includes('node_modules')) out.push(rel(f));
  };
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) add(node.moduleSpecifier.text);
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) add(node.moduleSpecifier.text);
    else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length && ts.isStringLiteral(node.arguments[0])
    ) add((node.arguments[0] as ts.StringLiteral).text);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return [...new Set(out)];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  fs.mkdirSync(GRAPH_DIR, { recursive: true });

  const appFiles = walk(path.join(ROOT, 'app'));
  const libFiles = walk(path.join(ROOT, 'lib'));
  const compFiles = walk(path.join(ROOT, 'components'));
  const hookFiles = walk(path.join(ROOT, 'hooks'));
  const testFiles = walk(path.join(ROOT, 'tests'));
  const scriptFiles = walk(path.join(ROOT, 'scripts'));

  const graphFiles = [...appFiles, ...libFiles, ...compFiles, ...hookFiles];
  const program = loadProgram(graphFiles);
  const options = program.getCompilerOptions();

  // --- import graph + collection refs over the resolved program -------------
  const imports = new Map<string, string[]>();
  const refs: CollectionRef[] = [];
  for (const f of graphFiles) {
    const sf = program.getSourceFile(f);
    if (!sf) continue;
    imports.set(rel(f), importEdges(sf, options));
    refs.push(...collectionRefsIn(sf));
  }

  // --- scripts: collection refs only (deferred from the audit, but they are
  //     where most of the collection-name drift lives, so the matrix needs them)
  for (const f of scriptFiles) {
    const text = fs.readFileSync(f, 'utf8');
    const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true);
    refs.push(...collectionRefsIn(sf));
  }

  // --- transitive reachability: route/page -> collections ------------------
  function reachable(entry: string): Set<string> {
    const seen = new Set<string>();
    const stack = [entry];
    while (stack.length) {
      const cur = stack.pop()!;
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const dep of imports.get(cur) ?? []) if (!seen.has(dep)) stack.push(dep);
    }
    return seen;
  }

  const refsByFile = new Map<string, CollectionRef[]>();
  for (const r of refs) {
    if (!refsByFile.has(r.file)) refsByFile.set(r.file, []);
    refsByFile.get(r.file)!.push(r);
  }

  const entryPoints = graphFiles.map(rel).filter((r) => {
    const b = path.basename(r);
    return r.startsWith('app/') && (b === 'route.ts' || b === 'page.tsx');
  });

  const entryToCollections = new Map<string, Map<string, Access[]>>();
  const entryModuleCount = new Map<string, number>();
  for (const e of entryPoints) {
    const mods = reachable(e);
    entryModuleCount.set(e, mods.size);
    const cols = new Map<string, Access[]>();
    for (const m of mods) {
      for (const r of refsByFile.get(m) ?? []) {
        if (!cols.has(r.name)) cols.set(r.name, []);
        cols.get(r.name)!.push(r.access);
      }
    }
    entryToCollections.set(e, cols);
  }

  // --- domain backfill via reverse reachability -----------------------------
  // WHAT: Give every lib/component/hook the domain of the entry points that
  //     actually reach it, instead of guessing from its path.
  // WHY: Path heuristics left 306 units "uncategorised", which makes the ledger
  //     useless for answering "is phase 6 complete". The import graph already
  //     knows the true answer. Modules reached from more than one domain are
  //     `shared` (they belong to Phase 8, crosscutting); modules no entry point
  //     reaches at all are `unreached` — dead-code candidates, and a finding in
  //     their own right rather than a blank cell.
  const domainsByModule = new Map<string, Set<string>>();
  for (const e of entryPoints) {
    const d = domainOf(e);
    for (const m of reachable(e)) {
      if (!domainsByModule.has(m)) domainsByModule.set(m, new Set());
      domainsByModule.get(m)!.add(d);
    }
  }
  function resolvedDomain(r: string, kind: Kind): string {
    if (kind === 'route' || kind === 'page') return domainOf(r);
    if (kind === 'script') return 'scripts';
    if (kind === 'test') return 'tests';
    const ds = domainsByModule.get(r);
    if (!ds || ds.size === 0) return 'unreached';
    if (ds.size === 1) return [...ds][0];
    return 'shared';
  }

  // --- ledger ---------------------------------------------------------------
  const lastCommit = lastCommitDates();
  const churn = churnCounts(12);
  const units: Unit[] = [];

  const push = (file: string) => {
    const r = rel(file);
    const kind = classify(file);
    if (!kind) return;
    units.push({
      id: r,
      kind,
      file: r,
      lines: countLines(file),
      lastCommit: lastCommit.get(r) ?? '',
      domain: resolvedDomain(r, kind),
      // scripts/ is deferred by explicit scope decision (see audit plan §9);
      // recorded as a visible disposition rather than an unmentioned gap.
      disposition: kind === 'script' ? 'deferred' : 'pending',
      phase: '',
      evidence: '',
      notes: kind === 'script' ? 'scope decision 2026-08-14: scripts/ deferred (low risk, one-off migrations)' : '',
    });
  };

  [...appFiles, ...libFiles, ...compFiles, ...hookFiles, ...testFiles, ...scriptFiles].forEach(push);

  // Collections are units too: each needs an owner and a documented lifecycle.
  const collectionNames = [...new Set(refs.map((r) => r.name))].sort();
  for (const name of collectionNames) {
    const mine = refs.filter((r) => r.name === name);
    const writers = new Set(mine.filter((r) => r.access === 'write').map((r) => r.file));
    const readers = new Set(mine.filter((r) => r.access === 'read').map((r) => r.file));
    const appCode = mine.filter((r) => !r.file.startsWith('scripts/'));
    units.push({
      id: `collection:${name}`,
      kind: 'collection' as Kind,
      file: '',
      lines: 0,
      lastCommit: '',
      domain: 'data',
      disposition: 'pending',
      phase: '3',
      evidence: '',
      notes: `${mine.length} refs; ${writers.size} writer files; ${readers.size} reader files; ${appCode.length} refs in app/lib code`,
    });
  }

  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = 'id,kind,file,lines,last_commit,churn_12mo,domain,disposition,phase,evidence,notes';
  const rows = units.map((u) =>
    [u.id, u.kind, u.file, u.lines, u.lastCommit, churn.get(u.file) ?? 0, u.domain, u.disposition, u.phase, u.evidence, u.notes]
      .map(esc).join(',')
  );
  fs.writeFileSync(path.join(OUT_DIR, 'ledger.csv'), [header, ...rows].join('\n') + '\n');

  // --- collection matrix ----------------------------------------------------
  const matrix: string[] = [
    '# Collection Read/Write Matrix',
    '',
    'Status: Active',
    'Last Updated: ' + new Date().toISOString(),
    'Canonical: No (generated)',
    'Owner: Architecture',
    '',
    '**Generated** by `scripts/lld-audit/build-inventory.ts`. Do not hand-edit.',
    '',
    'Access is classified from the AST: the method called on the collection handle.',
    '`unknown` means the handle was stored in a variable first, so the call site does',
    'not reveal intent — those need manual disposition in Phase 3.',
    '',
    '| Collection | Refs | App/lib refs | Script refs | Writers | Readers | Unknown |',
    '|---|---:|---:|---:|---:|---:|---:|',
  ];
  for (const name of collectionNames) {
    const mine = refs.filter((r) => r.name === name);
    const appRefs = mine.filter((r) => !r.file.startsWith('scripts/'));
    const scriptRefs = mine.filter((r) => r.file.startsWith('scripts/'));
    matrix.push(
      `| \`${name}\` | ${mine.length} | ${appRefs.length} | ${scriptRefs.length} | ` +
      `${mine.filter((r) => r.access === 'write').length} | ` +
      `${mine.filter((r) => r.access === 'read').length} | ` +
      `${mine.filter((r) => r.access === 'unknown').length} |`
    );
  }
  matrix.push('', '## Every reference, by collection', '');
  for (const name of collectionNames) {
    matrix.push(`### \`${name}\``, '');
    for (const r of refs.filter((x) => x.name === name).sort((a, b) => a.file.localeCompare(b.file))) {
      matrix.push(`- \`${r.file}:${r.line}\` — ${r.access}${r.method ? ` (\`.${r.method}()\`)` : ''}`);
    }
    matrix.push('');
  }
  fs.writeFileSync(path.join(GRAPH_DIR, 'collection-matrix.md'), matrix.join('\n'));

  // --- entry point graph ----------------------------------------------------
  const graph: string[] = [
    '# Entry Point → Collection Graph',
    '',
    'Status: Active',
    'Last Updated: ' + new Date().toISOString(),
    'Canonical: No (generated)',
    'Owner: Architecture',
    '',
    '**Generated** by `scripts/lld-audit/build-inventory.ts`. Do not hand-edit.',
    '',
    'Each row is an API route or page, the number of modules transitively reachable',
    'from it through resolved imports, and every collection touched anywhere in that',
    'reachable set. An entry with 0 collections either does no data access or reaches',
    'it through a path this analysis cannot see — both are Phase 2–7 questions.',
    '',
    '| Entry point | Modules | Collections |',
    '|---|---:|---|',
  ];
  const sortedEntries = [...entryToCollections.entries()].sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
  for (const [e, cols] of sortedEntries) {
    const names = [...cols.keys()].sort();
    graph.push(`| \`${e}\` | ${entryModuleCount.get(e) ?? 0} | ${names.length ? names.map((n) => `\`${n}\``).join(', ') : '—'} |`);
  }
  fs.writeFileSync(path.join(GRAPH_DIR, 'entry-point-graph.md'), graph.join('\n'));

  fs.writeFileSync(
    path.join(GRAPH_DIR, 'raw-graph.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        imports: Object.fromEntries(imports),
        collectionRefs: refs,
        entryPoints: Object.fromEntries(
          [...entryToCollections.entries()].map(([k, v]) => [k, { modules: entryModuleCount.get(k) ?? 0, collections: [...v.keys()].sort() }])
        ),
      },
      null,
      2
    )
  );

  // --- reconciliation report ------------------------------------------------
  const by = (k: Kind) => units.filter((u) => u.kind === k).length;
  const summary = {
    route: by('route'),
    page: by('page'),
    'app-module': by('app-module'),
    lib: by('lib'),
    component: by('component'),
    hook: by('hook'),
    test: by('test'),
    script: by('script'),
    collection: units.filter((u) => u.kind === ('collection' as Kind)).length,
  };
  const byDomain = new Map<string, number>();
  for (const u of units) {
    if (u.kind === ('collection' as Kind) || u.disposition === 'deferred' || u.kind === 'test') continue;
    byDomain.set(u.domain, (byDomain.get(u.domain) ?? 0) + 1);
  }
  const total = units.length;
  console.log('Ledger written:', path.join('docs/audits/lld', 'ledger.csv'));
  console.table(summary);
  console.log('TOTAL UNITS:', total);
  console.log('app/ files (route+page+app-module):', summary.route + summary.page + summary['app-module']);
  console.log('entry points analysed:', entryPoints.length);
  console.log('distinct collections (AST):', collectionNames.length);
  const unresolvedAccess = refs.filter((r) => r.access === 'unknown').length;
  console.log(`collection refs: ${refs.length} (unknown access: ${unresolvedAccess})`);
  console.log('\nNon-deferred working set by domain:');
  for (const [d, n] of [...byDomain.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${d}`);
  }
}

main();
