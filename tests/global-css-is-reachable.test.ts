// tests/global-css-is-reachable.test.ts
// WHAT: A class selector in app/styles/components.css must be applicable by
//     something.
// WHY: messmass#412. 70 of its 333 class selectors -- whole families:
//     `.login-*`, `.hashtag-input-*`, `.variable-*`, `.form-input-*`,
//     `.connection-*` -- had no consumer at all. Each carried a WHAT/WHY
//     comment describing it as live, which is the same trust problem #411 fixed
//     for the layout-unit modules: a reader finds an authoritative-sounding
//     rule and believes it. They were left behind by surfaces that were
//     migrated to CSS modules or deleted outright, and nothing noticed, because
//     dead CSS never throws.
// HOW: Deliberately conservative, in the direction of calling things alive. A
//     class counts as reachable if its name appears anywhere in any other
//     source file as a whole word -- even inside a comment or a Markdown doc --
//     or if a template literal anywhere could build it via `prefix-${...}`.
//     That last case matters: `.btn-large` is never written out, but
//     `btn-${variant}` can produce it, and a test that missed that would delete
//     live styling. The point is to catch a NEW family being added with no
//     consumer, not to police every selector.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TARGET = path.join(ROOT, 'app', 'styles', 'components.css');
const SCAN_DIRS = ['app', 'components', 'lib', 'hooks', 'scripts', 'tests'];
const EXTS = new Set(['.tsx', '.ts', '.jsx', '.js', '.mjs', '.css', '.md', '.html', '.json']);
const SKIP = new Set(['node_modules', '.next', '.git', '.claude', 'dist', 'build', 'vendor']);

/** `w3` is matched out of `www.w3.org` inside a background-image data URI. */
const NOT_A_SELECTOR = new Set(['w3']);

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (EXTS.has(path.extname(e.name)) && full !== TARGET) yield full;
  }
}

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');

describe('every global class selector can be applied by something', () => {
  const css = stripComments(fs.readFileSync(TARGET, 'utf8'));
  const defined = [...new Set([...css.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]))];

  const chunks: string[] = [];
  const prefixes = new Set<string>();
  for (const dir of SCAN_DIRS) {
    for (const f of walk(path.join(ROOT, dir))) {
      const s = fs.readFileSync(f, 'utf8');
      chunks.push(s);
      for (const m of s.matchAll(/([A-Za-z][\w-]*-)\$\{/g)) prefixes.add(m[1]);
    }
  }
  const corpus = chunks.join('\n');

  const unreachable = defined.filter((name) => {
    if (NOT_A_SELECTOR.has(name)) return false;
    if (new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(corpus)) return false;
    for (const p of prefixes) if (name.startsWith(p) && name.length > p.length) return false;
    return true;
  });

  it('has no class nothing can apply', () => {
    expect(unreachable.join('\n')).toBe('');
  });

  it('actually looked at both the file and the app', () => {
    // A scan that silently found nothing would pass the assertion above.
    expect(defined.length).toBeGreaterThan(100);
    expect(corpus.length).toBeGreaterThan(100_000);
    expect(prefixes.size).toBeGreaterThan(0);
  });
});
