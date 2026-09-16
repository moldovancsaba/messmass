// tests/api-reference-covers-every-route.test.ts
// WHAT: Every route in the generated endpoint inventory must appear in the API
//     reference, and the reference's own coverage claim must be true.
// WHY: messmass#345. docs/_audit/api-reference.md opened with "Coverage: 194 of
//     194 routes documented" while five routes were absent from it --
//     /api/admin/variables/merge, /api/admin/variables/merge-candidates,
//     /api/blob-upload-token, /api/derived-variable-config and /api/export/pdf.
//     The number was counted by hand once and then repeated. A coverage claim
//     nobody re-counts is worse than no claim, because it is quoted.
// HOW: The denominator is docs/_audit/endpoints.json, which
//     scripts/fleet-audit-inventory.py generates and `npm run inventory:check`
//     already gates against the filesystem. So a new route fails the inventory
//     gate first, and this second -- there is no path where a route exists,
//     is inventoried, and stays undocumented.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const INVENTORY = path.join(ROOT, 'docs', '_audit', 'endpoints.json');
const REFERENCE = path.join(ROOT, 'docs', '_audit', 'api-reference.md');

interface Endpoint {
  path: string;
  methods?: string[];
  file?: string;
}

describe('the API reference covers every inventoried route', () => {
  const raw = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const endpoints: Endpoint[] = raw.items ?? raw.endpoints ?? raw;
  const reference = fs.readFileSync(REFERENCE, 'utf8');

  it('documents every route in the inventory', () => {
    // Substring, not word-boundary: the reference legitimately writes a route
    // inside a table cell, a bullet or a code span, and sometimes groups
    // sibling routes on one line.
    const undocumented = endpoints
      .map((e) => e.path)
      .filter((p) => !reference.includes(p))
      .sort();
    expect(undocumented.join('\n')).toBe('');
  });

  it('states a coverage figure that matches the inventory', () => {
    const claim = reference.match(/Coverage:\s*(\d+)\s*of\s*(\d+)\s*routes/);
    expect(claim).not.toBeNull();
    const [, covered, total] = claim!;
    expect(Number(total)).toBe(endpoints.length);
    expect(Number(covered)).toBe(endpoints.length);
  });

  it('keeps the adjudication totals adding up to the inventory', () => {
    // The adjudication table splits every route into exactly one bucket. If
    // those three numbers stop summing to the route count, one bucket was
    // updated and the others were not -- which is how the previous run came to
    // claim 34 + 40 + 120 against a 194-route inventory.
    const nums = [...reference.matchAll(/^\|\s*(?:Fully guarded|Open write method|Open GET only)[^|]*\|\s*\*\*(\d+)\*\*\s*\|/gm)]
      .map((m) => Number(m[1]));
    expect(nums).toHaveLength(3);
    expect(nums.reduce((a, b) => a + b, 0)).toBe(endpoints.length);
  });

  it('has an inventory worth checking against', () => {
    expect(endpoints.length).toBeGreaterThan(100);
    expect(endpoints.every((e) => typeof e.path === 'string' && e.path.startsWith('/api'))).toBe(true);
  });
});
