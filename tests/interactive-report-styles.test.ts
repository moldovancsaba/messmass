// tests/interactive-report-styles.test.ts
// WHAT: Every design token the interactive report styles use without a fallback is defined somewhere.
// WHY: A token that does not exist makes the whole declaration invalid, so the browser drops it: the report header lost
//     its padding, its title weight and its line height on 2026-11-09 and nobody noticed (`--mm-space-7`,
//     `--mm-font-weight-extrabold` and `--mm-line-height-relaxed` were never defined).

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');

function cssFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(full);
    return entry.name.endsWith('.css') ? [full] : [];
  });
}

describe('the design tokens of the interactive report', () => {
  const sources = [
    ...cssFiles(path.join(root, 'app')),
    ...cssFiles(path.join(root, 'components')),
    ...cssFiles(path.join(root, 'node_modules/@sovereignsquad')),
    ...cssFiles(path.join(root, 'node_modules/@moldovancsaba')),
  ];
  const defined = new Set<string>();
  for (const file of sources) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(match[1]);
  }

  it('finds the token definitions it checks against', () => {
    expect(defined.has('--mm-space-6')).toBe(true);
    expect(defined.has('--mm-font-weight-bold')).toBe(true);
  });

  it.each(cssFiles(path.join(root, 'components/theme/interactive-report')).map((file) => [path.basename(file), file]))(
    '%s uses only defined tokens where it has no fallback',
    (_name, file) => {
      const css = fs.readFileSync(file, 'utf8');
      // var(--token) with no comma before the closing parenthesis has no fallback
      const missing = [...new Set([...css.matchAll(/var\((--[a-zA-Z0-9-]+)\s*\)/g)].map((m) => m[1]))].filter((token) => !defined.has(token));
      expect(missing).toEqual([]);
    },
  );
});
