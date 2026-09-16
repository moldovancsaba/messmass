// tests/no-dynamic-code-evaluation.test.ts
// WHAT: First-party source must contain no dynamic code evaluation.
// WHY: middleware.ts drops 'unsafe-eval' from the production CSP, and the
//     comment justifying that says there is no `new Function` or `eval`
//     anywhere in first-party source. When that was written it was already
//     false: components/ChartAlgorithmManager.tsx ran
//     `Function('"use strict"; return (' + testFormula + ')')()` on whatever an
//     admin typed into the formula field, as a fallback when the safe parser
//     threw (messmass#286). It could not work in production -- the CSP threw
//     EvalError and the surrounding catch swallowed it -- so dev and production
//     silently disagreed about the same formula.
// HOW: A security claim in a comment is worth nothing unless something checks
//     it. This is that check. Note `Function(` without `new` is the form that
//     was actually present, and the form a grep for "new Function" misses --
//     which is how it survived an earlier sweep in this same session.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SCAN = ['app', 'components', 'lib', 'hooks'];
const SKIP = new Set(['node_modules', '.next', '.git', '.claude', 'dist', 'build', 'vendor']);

/** `new Function(...)`, bare `Function(...)` as a call, and `eval(...)`. */
const DYNAMIC_EVAL = /(?:\bnew\s+Function\s*\(|(?<![\w.$])Function\s*\(|(?<![\w.$])eval\s*\()/;

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) yield full;
  }
}

/** Comments discuss the ban; only executable lines can violate it. */
function codeLines(source: string): { line: number; text: string }[] {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return withoutBlocks
    .split('\n')
    .map((text, i) => ({ line: i + 1, text }))
    .filter(({ text }) => !/^\s*\/\//.test(text) && text.trim() !== '');
}

describe('no dynamic code evaluation in first-party source', () => {
  const offenders: string[] = [];
  let scanned = 0;

  for (const dir of SCAN) {
    for (const file of walk(path.join(ROOT, dir))) {
      scanned += 1;
      for (const { line, text } of codeLines(fs.readFileSync(file, 'utf8'))) {
        if (DYNAMIC_EVAL.test(text)) {
          offenders.push(`${path.relative(ROOT, file)}:${line}  ${text.trim().slice(0, 90)}`);
        }
      }
    }
  }

  it('contains no Function() constructor or eval() call', () => {
    expect(offenders.join('\n')).toBe('');
  });

  it("keeps the production CSP's justification true", () => {
    // If this ever needs relaxing, the middleware comment must change in the
    // same commit -- the point is that the two cannot drift apart again.
    const middleware = fs.readFileSync(path.join(ROOT, 'middleware.ts'), 'utf8');
    expect(middleware).toContain("'unsafe-eval'");
    expect(middleware).toMatch(/process\.env\.NODE_ENV !== 'production'/);
  });

  it('actually scanned the source tree', () => {
    expect(scanned).toBeGreaterThan(300);
  });
});
