// tests/report-workspace-is-the-partner-entry.test.ts
// WHAT: The partners list view offers Reports, not Open Editor; the events list
//     view still offers Open Editor.
// WHY: messmass#244 Phase E — "remove Open Editor dependency from list views
//     after parity is proven". The partner action's own comment asserted there
//     was no parity, which turned out to be stale: the Reports workspace links
//     to /partner-edit/{viewSlug} for the default variant (the exact URL the
//     removed action used) and ?variant={slug} for every other, which the
//     removed action could never reach. A strict superset.
//
//     The asymmetry is the point of this file. Events are NOT a report-variant
//     owner type, there is no events workspace, and /edit/{editSlug} is live
//     data capture at events. "Finishing" Phase E by removing it there would
//     delete the capture workflow, so that is asserted as a requirement rather
//     than left to judgement.

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('report-variant owners enter through the Reports workspace', () => {
  const partners = read('lib/adapters/partnersAdapter.tsx');
  const projects = read('lib/adapters/projectsAdapter.tsx');

  it('gives the partners list a Reports action', () => {
    expect(partners).toContain("id: 'partner-reports-workspace'");
    expect(partners).toContain('/reports');
  });

  it('no longer routes the partners list straight at the editor', () => {
    expect(partners).not.toContain("id: 'partner-open-editor'");
    // The path may still appear in the explanatory comment; what must be gone
    // is an executable getHref pointing at it.
    expect(partners).not.toMatch(/getHref:.*partner-edit/);
  });

  it('keeps Open Editor on the events list, which has no workspace', () => {
    expect(projects).toContain("id: 'project-open-editor'");
    expect(projects).toMatch(/getHref:.*\/edit\//);
  });

  it('has a workspace route for every report-variant owner type', () => {
    // Phase B. A workspace that exists but has no route is not an entry point.
    for (const route of [
      'app/admin/organizations/[id]/reports/page.tsx',
      'app/admin/partners/[id]/reports/page.tsx',
      'app/admin/hashtags/[hashtag]/reports/page.tsx',
      'app/admin/filter/[slug]/reports/page.tsx',
    ]) {
      expect(fs.existsSync(path.join(ROOT, route))).toBe(true);
    }
  });

  it('reaches the same editor the removed action did, for the default variant', () => {
    // The parity claim, pinned. The partner route builds /partner-edit/{slug}
    // with no query string when the variant is the default.
    const route = read('app/admin/partners/[id]/reports/page.tsx');
    expect(route).toContain('/partner-edit/');
    expect(route).toMatch(/variant\s*\?[\s\S]*variant=\$\{encodeURIComponent\(variant\)\}[\s\S]*:\s*`\/partner-edit\/\$\{slug\}`/);
  });
});
