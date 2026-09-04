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
  'requirePartnerWrite',
  'requirePageAccess',
  'validateAnyPassword',
  'validateOrganizationAccess',
  // Route-local page-password gates on the two editor loaders (messmass#386):
  // alias-aware variants of requirePageAccess, defined in their route files.
  'requirePartnerEditPageAccess',
  'requireOrgEditPageAccess',
  // Local admin gate in the admin/fanmass routes (getAdminUser + role check
  // inside a module-level helper, invisible to a handler-scoped scan).
  'requireAdmin(',
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
  // [debt] called from page-password surfaces — need a scoped grant path.
  //     (messmass#386 resolved most of this category: organizations/edit and
  //     partners/edit got alias-aware page-access gates; projects/[id] and
  //     hashtags/filter proved admin-only-consumed and got requireSession;
  //     variables-groups and clicker-sets got requireSession on their
  //     mutating handlers only, GET staying open for the editors. The four
  //     below remain genuinely shared with page-password editors.)
  'app/api/variables-config/route.ts',
  'app/api/hashtags/route.ts',
  'app/api/hashtag-categories/route.ts',
  'app/api/hashtag-colors/route.ts',
  // [debt] admin-facing, not yet verified free of non-admin callers
  'app/api/auto-generate-chart-block/route.ts',
  // [debt] machine integrations — verify their own token handling, then remove
  'app/api/integrations/camera/partners/route.ts',
  'app/api/integrations/camera/sso-session/route.ts',
]);

// WHAT: Read routes whose GET handler checks no auth primitive. Same contract
//     as KNOWN_UNGUARDED: every entry is deliberate — a NEW unguarded read
//     route fails CI (messmass#348 closed the audit's read-route blind spot).
//     Read checks are scoped to the GET handler's own body (see
//     handlerSource) because a file may legitimately guard its mutating
//     handlers while GET stays open for page-password surfaces.
// WHY: The mutation sweep alone missed that the entire analytics/executive
//     surface served company-wide revenue/ROI/engagement figures to anonymous
//     callers. messmass#386 guarded 33 of the 37 debt entries (requireSession
//     for admin-consumed routes, alias-aware page-access gates for the two
//     editor loaders), reclassified 3 as by-design [editor] reads, and found
//     1 (v3/organizations/report) already guarded via validateOrganizationAccess
//     but invisible to the old primitive list. What remains is by-design only:
//       [public]    — backs an anonymously-reachable share/report surface or
//                     pre-auth flow; open by design (page passwords, where
//                     they apply, are enforced via requirePageAccess by the
//                     routes that serve protected data)
//       [editor]    — feeds page-password editor surfaces (EditorDashboard,
//                     OrganizationEditorDashboard) whose users hold a page
//                     grant, not a session; low-sensitivity UI config, same
//                     precedent as variables-config
//       [reference] — harmless reference/static data, open is acceptable
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
  // [editor] page-password editor surfaces consume these without a session.
  //     NOTE: variables-groups and clicker-sets GETs perform idempotent
  //     lazy-init writes (ensureDefault* insertOne + a legacy backfill) that
  //     an anonymous caller can trigger — accepted as bounded init, their
  //     destructive handlers (POST/PUT/DELETE) are requireSession-guarded.
  'app/api/variables-config/route.ts',
  'app/api/variables-groups/route.ts',              // EditorDashboard clicker/variable config
  'app/api/clicker-sets/route.ts',                  // OrganizationEditorDashboard clicker config
  'app/api/hashtags/route.ts',                      // hashtag autocomplete in EditorDashboard
  'app/api/content-assets/route.ts',                // lib/formulaEngine fetches it during report/editor rendering; mutations guarded
  // [reference]
  'app/api/countries/[code]/route.ts',
  'app/api/countries/route.ts',
  'app/api/google-sheets/template/route.ts',
  'app/api/hashtag-categories/route.ts',
  'app/api/hashtag-colors/route.ts',
]);

// WHAT: The source of one exported handler, from `export async function X` to
//     the next export (or EOF).
// WHY: Read checks must be scoped to the GET handler's own body — a file may
//     guard its mutating handlers while GET stays deliberately open for
//     page-password surfaces (variables-groups, clicker-sets), and a
//     whole-file primitive scan cannot tell those apart.
function handlerSource(source: string, method: string): string | null {
  const match = source.match(new RegExp(`export\\s+async\\s+function\\s+${method}\\b`));
  if (!match || match.index === undefined) return null;
  const rest = source.slice(match.index + match[0].length);
  const next = rest.search(/export\s+(async\s+)?function\s|export\s+const\s/);
  return next === -1 ? rest : rest.slice(0, next);
}

// WHAT: One handler's body — or, when it merely delegates to a sibling handler
//     (`return POST(request)` on the Vercel-cron GET, `return PUT(...)` on a
//     PATCH alias, `return GET(request)` on a cron POST), the delegate's body,
//     since that is where the auth actually lives. Any method may delegate to
//     any other, so delegation-following is symmetric (one hop is enough in
//     this codebase). Used by both the read and mutation sweeps so a guarded
//     delegate is not mistaken for an unguarded alias.
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
function effectiveHandlerSource(source: string, method: string): string | null {
  const own = handlerSource(source, method);
  if (own === null) return null;
  const delegation = own.match(/return\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/);
  if (delegation && delegation[1] !== method) {
    return handlerSource(source, delegation[1]) ?? own;
  }
  return own;
}
function effectiveGetSource(source: string): string | null {
  return effectiveHandlerSource(source, 'GET');
}

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

  it('every mutating handler checks auth or is a listed exception', () => {
    // Per-handler, not per-file: a file whose GET is guarded must not shield an
    // unguarded POST/PUT/PATCH/DELETE in the same file. messmass#350 found
    // PUT /api/admin/project-partners open this way — the file imports
    // requireSession for its GET, so a file-level `source.includes` passed it
    // while the PUT mutated project<->partner links unauthenticated.
    const offenders: string[] = [];
    for (const file of routes) {
      const source = fs.readFileSync(file, 'utf8');
      if (KNOWN_UNGUARDED.has(rel(file))) continue;
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
        const body = effectiveHandlerSource(source, method);
        if (body === null) continue;
        if (!AUTH_PRIMITIVES.some((p) => body.includes(p))) {
          offenders.push(`${rel(file)} (${method})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('every read route checks auth in its GET handler or is a listed exception', () => {
    const offenders: string[] = [];
    for (const file of routes) {
      const source = fs.readFileSync(file, 'utf8');
      const getSource = effectiveGetSource(source);
      if (getSource === null) continue;
      const guarded = AUTH_PRIMITIVES.some((p) => getSource.includes(p));
      if (!guarded && !KNOWN_UNGUARDED_READS.has(rel(file))) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it('the exception lists have no stale entries', () => {
    // A route that got fixed must be removed from the list, or the list slowly
    // stops meaning anything. Mutation entries are judged file-level (as the
    // offender check does); read entries are judged on the GET handler alone.
    const stale: string[] = [];
    for (const listed of KNOWN_UNGUARDED) {
      const full = path.join(process.cwd(), listed);
      if (!fs.existsSync(full)) { stale.push(`${listed} (file no longer exists)`); continue; }
      const source = fs.readFileSync(full, 'utf8');
      if (AUTH_PRIMITIVES.some((p) => source.includes(p))) stale.push(`${listed} (now guarded)`);
    }
    for (const listed of KNOWN_UNGUARDED_READS) {
      const full = path.join(process.cwd(), listed);
      if (!fs.existsSync(full)) { stale.push(`${listed} (file no longer exists)`); continue; }
      const getSource = effectiveGetSource(fs.readFileSync(full, 'utf8'));
      if (getSource === null) { stale.push(`${listed} (no longer exports GET)`); continue; }
      if (AUTH_PRIMITIVES.some((p) => getSource.includes(p))) stale.push(`${listed} (GET now guarded)`);
    }
    expect(stale).toEqual([]);
  });
});
