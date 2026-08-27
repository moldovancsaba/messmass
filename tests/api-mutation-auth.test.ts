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

  it('the exception list has no stale entries', () => {
    // A route that got fixed must be removed from the list, or the list slowly
    // stops meaning anything.
    const stale: string[] = [];
    for (const listed of KNOWN_UNGUARDED) {
      const full = path.join(process.cwd(), listed);
      if (!fs.existsSync(full)) { stale.push(`${listed} (file no longer exists)`); continue; }
      const source = fs.readFileSync(full, 'utf8');
      if (AUTH_PRIMITIVES.some((p) => source.includes(p))) stale.push(`${listed} (now guarded)`);
    }
    expect(stale).toEqual([]);
  });
});
