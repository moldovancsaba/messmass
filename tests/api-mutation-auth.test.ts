// tests/api-mutation-auth.test.ts
// WHAT: Every API route that exports a state-changing handler must either check
//     authentication or be listed below as a known exception.
// WHY: Audit finding F-009 — 40 route files exported POST/PUT/PATCH/DELETE with no
//     authentication primitive at all. `DELETE /api/projects` was demonstrated
//     reachable by an anonymous caller holding only a CSRF token, which anyone can
//     fetch: it reached the database lookup and would have deleted a real event.
//     Fixing the routes without a guard against recurrence just means the next new
//     route repeats it, silently.
// HOW: The KNOWN_UNGUARDED list freezes the remaining debt. A NEW unguarded route
//     fails this test immediately. Removing an entry as it gets fixed is the
//     intended direction of travel; adding one requires justifying it in review.

import * as fs from 'fs';
import * as path from 'path';

const API_DIR = path.join(process.cwd(), 'app', 'api');

const AUTH_PRIMITIVES = [
  'getAdminUser',
  'requireAPIAuth',
  'requireFanmassIntegrationAuth',
  'requireSession',
  'requireProjectWrite',
  'requirePageAccess',
  'validateAnyPassword',
  'isAdmin(',
  'CRON_SECRET',
];

// WHAT: Routes that export a mutating handler and do not check authentication.
// WHY: Each is either deliberately public or unfixed debt from F-009. They are
//     listed rather than exempted by pattern so the list stays short and visible.
//     Categories, so a reader knows which is which:
//       [public]  — genuinely anonymous by design
//       [debt]    — needs a guard; blocked on deciding whether a page-password
//                   grant path applies, because several are called from
//                   page-password surfaces and a session-only guard would break
//                   live workflows exactly as it would have on PUT /api/projects
const KNOWN_UNGUARDED = new Set<string>([
  // [public]
  'app/api/admin/clear-cookies/route.ts',   // clears cookies; nothing to protect
  'app/api/admin/login/route.ts',           // returns 410 Gone — SSO-only
  'app/api/admin/register/route.ts',        // registration entry point
  'app/api/contact/route.ts',               // public contact form, rate limited
  'app/api/client-error/route.ts',          // records a crash report; a logged-out visitor can crash too
  // [debt] called from page-password surfaces — need a scoped grant path
  'app/api/organizations/edit/[id]/route.ts',
  'app/api/partners/edit/[slug]/route.ts',
  'app/api/projects/[id]/route.ts',
  'app/api/variables-config/route.ts',
  'app/api/variables-groups/route.ts',
  'app/api/clicker-sets/route.ts',
  'app/api/hashtags/route.ts',
  'app/api/hashtags/filter/route.ts',
  'app/api/hashtag-categories/route.ts',
  'app/api/hashtag-colors/route.ts',
  // [debt] admin-facing, not yet verified free of non-admin callers
  'app/api/auto-generate-chart-block/route.ts',
  'app/api/available-fonts/route.ts',
  'app/api/bitly/recalculate/route.ts',
  'app/api/chart-formatting-defaults/route.ts',
  'app/api/charts/route.ts',
  'app/api/grid-settings/route.ts',
  'app/api/sports-db/lookup/route.ts',
  'app/api/sports-db/search/route.ts',
  // [debt] machine integrations — verify their own token handling, then remove
  'app/api/integrations/camera/partners/route.ts',
  'app/api/integrations/camera/sso-session/route.ts',
]);

// WHAT: Read (GET) routes that check no auth primitive. Same contract as
//     KNOWN_UNGUARDED: frozen debt, not endorsement — a NEW unguarded read
//     route fails CI (messmass#348 closed the audit's read-route blind spot).
// WHY: The mutation sweep alone missed that the entire analytics/executive
//     surface serves company-wide revenue/ROI/engagement figures to anonymous
//     callers. Categories (classified 2026-09-03, route-by-route):
//       [public]    — backs an anonymously-reachable share/report surface or
//                     pre-auth flow; open by design (page passwords, where
//                     they apply, are enforced by the consuming page)
//       [reference] — harmless reference/static data, open is acceptable
//       [debt]      — loaders for admin-only UI or raw analytics; the UI is
//                     login-gated but the API is not. Needs a guard or an
//                     explicit page-password grant path.
const KNOWN_UNGUARDED_READS = new Set<string>([
  // [public] auth flow + genuinely public surfaces
  'app/api/admin/clear-cookies/route.ts',
  'app/api/auth/sso/callback/route.ts',
  'app/api/auth/sso/config/route.ts',
  'app/api/auth/sso/login/route.ts',
  'app/api/csrf-token/route.ts',
  'app/api/chart-config/public/route.ts',
  'app/api/derived-variable-config/route.ts',
  'app/api/export/pdf/route.ts',
  'app/api/hashtags/[hashtag]/route.ts',
  'app/api/landing-static/route.ts',
  'app/api/organizations/report/[id]/activities/route.ts',
  'app/api/organizations/report/[id]/route.ts',
  'app/api/partners/report/[slug]/route.ts',
  'app/api/report-config/[identifier]/route.ts',
  'app/api/report-styles/[id]/route.ts',
  'app/api/reports/resolve/route.ts',
  'app/api/variables-config/route.ts',
  // [reference]
  'app/api/countries/[code]/route.ts',
  'app/api/countries/route.ts',
  'app/api/google-sheets/template/route.ts',
  'app/api/hashtag-categories/route.ts',
  'app/api/hashtag-colors/route.ts',
  // [debt] anonymous analytics — company/partner/event commercial metrics
  'app/api/analytics/benchmarks/route.ts',
  'app/api/analytics/compare/partners/route.ts',
  'app/api/analytics/compare/periods/route.ts',
  'app/api/analytics/compare/route.ts',
  'app/api/analytics/event/[projectId]/route.ts',
  'app/api/analytics/executive/insights/route.ts',
  'app/api/analytics/executive/metrics/route.ts',   // whole-business revenue/ROI
  'app/api/analytics/executive/top-events/route.ts',
  'app/api/analytics/insights/[projectId]/route.ts',
  'app/api/analytics/partner/[partnerId]/route.ts',
  'app/api/analytics/trends/route.ts',
  'app/api/bitly/project-metrics/[projectId]/route.ts',
  'app/api/hashtags/filter/route.ts',
  'app/api/hashtags/route.ts',
  'app/api/partners/[id]/events/route.ts',
  'app/api/v3/organizations/report/[id]/route.ts',
  // [debt] admin-UI data loaders, API itself open
  'app/api/admin/partners/route.ts',                // full partner roster + ids
  'app/api/chart-configs/route.ts',
  'app/api/chart-formatting-defaults/route.ts',
  'app/api/charts/route.ts',
  'app/api/clicker-sets/route.ts',
  'app/api/content-assets/usage/route.ts',
  'app/api/grid-settings/route.ts',
  'app/api/hashtags/slugs/route.ts',
  'app/api/projects/[id]/route.ts',
  'app/api/variables-groups/route.ts',
  // [debt] editors reached via page-password surfaces — need a grant path
  'app/api/organizations/edit/[id]/route.ts',
  'app/api/partners/edit/[slug]/route.ts',
  // [debt] debug/self-test endpoints
  'app/api/admin/email-selftest/route.ts',          // leaks superadmin email, sends real mail
  'app/api/bitly/recalculate/route.ts',
  'app/api/debug/categorized-hashtags/route.ts',
  'app/api/debug/overview-block/route.ts',
  'app/api/stats/route.ts',
  // [debt] reference-ish but admin-consumed only
  'app/api/available-fonts/route.ts',
  'app/api/cities/route.ts',
  'app/api/sports-db/lookup/route.ts',
  'app/api/sports-db/search/route.ts',
]);

function findRouteFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findRouteFiles(full, out);
    else if (entry.name === 'route.ts') out.push(full);
  }
  return out;
}

const rel = (p: string) => path.relative(process.cwd(), p).split(path.sep).join('/');

describe('API mutation routes require authentication', () => {
  const routes = findRouteFiles(API_DIR);

  it('finds route files to check', () => {
    expect(routes.length).toBeGreaterThan(100);
  });

  it('every mutating route checks auth or is a listed exception', () => {
    const offenders: string[] = [];
    for (const file of routes) {
      const source = fs.readFileSync(file, 'utf8');
      const mutates = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/.test(source);
      if (!mutates) continue;
      const guarded = AUTH_PRIMITIVES.some((p) => source.includes(p));
      if (!guarded && !KNOWN_UNGUARDED.has(rel(file))) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it('every read route checks auth or is a listed exception', () => {
    const offenders: string[] = [];
    for (const file of routes) {
      const source = fs.readFileSync(file, 'utf8');
      if (!/export\s+async\s+function\s+GET/.test(source)) continue;
      const guarded = AUTH_PRIMITIVES.some((p) => source.includes(p));
      if (!guarded && !KNOWN_UNGUARDED_READS.has(rel(file))) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it('the exception lists have no stale entries', () => {
    // A route that got fixed must be removed from the list, or the list slowly
    // stops meaning anything.
    const stale: string[] = [];
    for (const listed of [...KNOWN_UNGUARDED, ...KNOWN_UNGUARDED_READS]) {
      const full = path.join(process.cwd(), listed);
      if (!fs.existsSync(full)) { stale.push(`${listed} (file no longer exists)`); continue; }
      const source = fs.readFileSync(full, 'utf8');
      if (AUTH_PRIMITIVES.some((p) => source.includes(p))) stale.push(`${listed} (now guarded)`);
    }
    expect(stale).toEqual([]);
  });
});
