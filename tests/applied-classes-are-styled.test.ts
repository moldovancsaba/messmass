// tests/applied-classes-are-styled.test.ts
// WHAT: A global class an element applies must resolve to at least one rule
//     with declarations in it.
// WHY: #413, the mirror of #412. 86 classes were applied by markup and styled
//     by nothing. CSS never throws, so the element just rendered plain -- most
//     visibly `<div className="alert alert-danger">` on /admin/bitly,
//     /admin/partners and in EditorDashboard, where none of the four classes
//     existed and every error and success banner rendered as bare paragraph
//     text. An error banner that does not look like an error is worse than no
//     banner, because the page still believes it told the user.
//     The cause was Tailwind class names in a repo with no Tailwind: no
//     dependency, no config, no PostCSS plugin. They compiled fine, because an
//     unknown class is legal.
// HOW: A rule with an empty body does not count. That distinction matters here:
//     app/styles/ carries 128 empty rules and 145 classes defined in more than
//     one global stylesheet, so "it exists somewhere" was true of classes that
//     still did nothing, which is exactly why nobody checked.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SCAN = ['app', 'components'];
const SKIP = new Set(['node_modules', '.next', '.git', '.claude', 'dist', 'build', 'vendor']);

/**
 * Classes that carry no styling on purpose.
 *
 * Two kinds, and both are legitimate:
 *   - component root markers, where the real styling is a CSS module on the
 *     same element (`hashtag-editor`, `image-uploader`, `dashboard-layout`);
 *   - cross-file contracts, where the name exists so something else can find
 *     the element (`report-hero` / `report-content` / `report-chart` mirror the
 *     ids the PDF export and the sibling report pages agree on).
 *
 * `role-*` is the awkward case: RoleDropdown styles every one of those elements
 * with inline `style={{}}` and an eslint-disable. The class names are honest
 * markers, but the inline styles are their own violation of the token rule and
 * are not in scope here.
 *
 * Adding a name to this list is a claim that the element is styled some other
 * way. It is not a way to silence the gate.
 */
const INTENTIONALLY_UNSTYLED = new Set([
  'back-link', 'chart-algorithm-manager', 'config-info', 'dashboard-back',
  'dashboard-layout', 'form-checkbox', 'form-help', 'form-help-text',
  'formatting-note', 'hashtag-editor', 'hashtag-multi-select', 'image-uploader',
  'link', 'loading-centered-container', 'radio-group', 'radio-label',
  'report-chart', 'report-content', 'report-hero', 'role-badge',
  'role-dropdown-item', 'role-dropdown-menu', 'role-dropdown-trigger',
  'stat-subtitle', 'tab-content',
]);

/**
 * Syntax only a utility framework can provide.
 *
 * Deliberately narrow. This repo's own design system uses Tailwind-*shaped*
 * names that are real and work -- `text-sm`, `bg-gray-50`, `rounded-lg` are all
 * defined in app/styles/. Banning the shape would fail on the system's own
 * vocabulary. What cannot exist here is variant-prefix syntax (`hover:`, `md:`)
 * and the `space-y-*` owl selector, because nothing generates them: there is no
 * tailwind dependency, no config, and no PostCSS plugin. A colour-scale name
 * that happens to be undefined is caught by the first test instead.
 */
const FRAMEWORK_ONLY = /^(?:hover|focus|active|group-hover|sm|md|lg|xl|2xl):|^space-[xy]-/;

function* walk(dir: string, exts: Set<string>): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full, exts);
    else if (exts.has(path.extname(e.name))) yield full;
  }
}

/** Source without comments: a class named in a JSDoc example is not applied. */
const codeOnly = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');

describe('every applied global class resolves to a rule with declarations', () => {
  const applied = new Map<string, Set<string>>();
  const styled = new Set<string>();

  for (const dir of SCAN) {
    for (const file of walk(path.join(ROOT, dir), new Set(['.tsx']))) {
      const raw = fs.readFileSync(file, 'utf8');
      const src = codeOnly(raw);
      const add = (tok: string) => {
        if (!applied.has(tok)) applied.set(tok, new Set());
        applied.get(tok)!.add(path.relative(ROOT, file));
      };
      for (const m of src.matchAll(/className="([^"{}]+)"/g)) m[1].split(/\s+/).filter(Boolean).forEach(add);
      for (const m of src.matchAll(/className=\{`([^`]*)`\}/g))
        m[1].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).filter(Boolean).forEach(add);
      // styled-jsx blocks define classes for the component they sit in
      for (const m of raw.matchAll(/<style[^>]*>\{`([\s\S]*?)`\}<\/style>/g))
        for (const c of m[1].matchAll(/\.([A-Za-z][\w-]*)/g)) styled.add(c[1]);
    }
  }

  for (const dir of SCAN) {
    for (const file of walk(path.join(ROOT, dir), new Set(['.css']))) {
      if (file.includes('.module.')) continue; // module classes are not global
      const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!m[2].trim()) continue; // an empty rule styles nothing
        for (const c of m[1].matchAll(/\.([A-Za-z][\w-]*)/g)) styled.add(c[1]);
      }
    }
  }

  const unstyled = [...applied.keys()]
    .filter((c) => !styled.has(c) && !INTENTIONALLY_UNSTYLED.has(c))
    .sort();

  it('has no class that styles nothing', () => {
    const detail = unstyled.map((c) => `${c}  (${[...applied.get(c)!].join(', ')})`).join('\n');
    expect(detail).toBe('');
  });

  it('uses no utility-framework syntax, since there is no framework to compile it', () => {
    const tw = [...applied.keys()].filter((c) => FRAMEWORK_ONLY.test(c)).sort();
    expect(tw.join(', ')).toBe('');
  });

  it('does not let the allowlist rot', () => {
    // An entry that is now styled, or no longer applied anywhere, should go.
    const stale = [...INTENTIONALLY_UNSTYLED].filter((c) => styled.has(c) || !applied.has(c)).sort();
    expect(stale.join(', ')).toBe('');
  });

  it('actually scanned something', () => {
    expect(applied.size).toBeGreaterThan(300);
    expect(styled.size).toBeGreaterThan(300);
  });
});
