// tests/page-gate-is-server-driven.test.ts
// WHAT: A page-password gate must be raised by the server's answer, never by a
//     client-side flag.
// WHY: F-013 / #393. Five pages called isAuthenticated() -- a sessionStorage
//     read -- on mount and rendered PagePasswordLogin whenever it returned
//     false. It returns false on every first visit, because sessionStorage is
//     empty. So a page with no password configured showed a gate that could not
//     be passed: there was no password to type, and the data fetch never ran.
//     The server had been right all along, answering 200 for an unprotected
//     page and 401 PAGE_PASSWORD_REQUIRED for a protected one.
// HOW: Source-level, deliberately. The defect was a mount-time decision made
//     from the wrong source of truth, which a rendering test can assert only by
//     reproducing the whole fetch stack. What must stay true is simpler and
//     checkable: no gated page decides access from storage, and each one still
//     handles the 401 that raises the gate.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

/** Every page that can render PagePasswordLogin. */
const GATED_PAGES = [
  'app/filter/[slug]/page.tsx',
  'app/hashtag/[hashtag]/page.tsx',
  'app/edit/[slug]/page.tsx',
  'app/partner-edit/[slug]/PartnerEditClient.tsx',
  'app/organization-edit/[id]/page.tsx',
];

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Source with comments stripped: the fix left prose that names what it removed. */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n');

describe('the page gate is raised by the server, not by sessionStorage', () => {
  it('covers every page that renders the password prompt', () => {
    // If a new gated page appears, it must be listed here -- otherwise this
    // suite silently stops covering the thing it exists for.
    const rendering: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (/\.tsx$/.test(e.name) && read(path.relative(ROOT, full)).includes('<PagePasswordLogin')) {
          rendering.push(path.relative(ROOT, full));
        }
      }
    };
    walk(path.join(ROOT, 'app'));
    expect(rendering.sort()).toEqual([...GATED_PAGES].sort());
  });

  for (const page of GATED_PAGES) {
    describe(page, () => {
      it('does not decide access from sessionStorage', () => {
        const src = code(page);
        expect(src).not.toMatch(/\bisAuthenticated\s*\(/);
        expect(src).not.toMatch(/sessionStorage/);
      });

      it('raises the gate on the server saying PAGE_PASSWORD_REQUIRED', () => {
        expect(read(page)).toContain('PAGE_PASSWORD_REQUIRED');
      });
    });
  }

  it('no longer exports the client-side check at all', () => {
    // Leaving it exported invites the next page to reintroduce the bug.
    expect(code('components/PagePasswordLogin.tsx')).not.toMatch(/export function isAuthenticated/);
  });

  it('the server still answers 401 PAGE_PASSWORD_REQUIRED for a protected page', () => {
    // The gate now depends entirely on this contract, so it is worth pinning.
    expect(read('lib/pageAccess.ts')).toContain('PAGE_PASSWORD_REQUIRED');
  });
});
