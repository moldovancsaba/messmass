# LLD Audit — Findings Register

Status: Active
Last Updated: 2026-08-15T07:30:00.000Z
Canonical: Yes (findings register)
Owner: Architecture

**Version:** 12.1.66

Findings from the LLD deep audit (`docs/audits/lld-audit-plan-2026-08-14.md`).
Per rule R5 findings are recorded here and **not fixed on the audit branch**; per
R6 they become board issues. Per R1 every finding carries evidence, and where a
claim is structural rather than demonstrated, it says so.

**Severity** reflects impact **and** whether exploitation was demonstrated:

- **Critical** — verified by execution, live impact today
- **High** — verified in code, impact latent or requires a precondition
- **Medium** — defect with limited or no current impact
- **Low** — hygiene

| ID | Severity | Status | Title | Phase |
|---|---|---|---|---|
| [F-010](#f-010) | **Critical** | **Fixed + rotated** | Page passwords were served to anonymous callers and stored in plaintext | 4 |
| [F-009](#f-009) | **Critical** | **Partly fixed — 33 routes open, frozen by test** | Mutating API routes have no authentication | 4 |
| [F-001](#f-001) | **Critical** | **Fixed** | Page-password protection is client-side only; data APIs are unauthenticated | 4 |
| [F-002](#f-002) | **Critical** | **Fixed** | Unsigned legacy session tokens are accepted, always | 4 |
| [F-020](#f-020) | **High** | Open — confirmed | The entire analytics workspace serves data frozen on 2026-03-18 | 3 |
| [F-022](#f-022) | Low | Open | `/api/analytics/aggregates` queries a document shape that was never written | 3 |
| [F-021](#f-021) | Medium | Open | The only scheduled cron has logged once in ten months | 3 |
| [F-019](#f-019) | Medium | Open | `lib/auditLog.ts` is dead — the API write audit trail was never wired up | 3 |
| [F-017](#f-017) | Medium | **Fixed** | Content-asset deletion guard was inert and its usage panel queried a non-existent collection | 3 |
| [F-018](#f-018) | Low | Open | A missing report renders a JSON parse error instead of "not found" | 2 |
| [F-015](#f-015) | Medium | **Fixed** | Admin preview and partner report format the same number differently | 2 |
| [F-016](#f-016) | Low | Open | `lib/layoutGrammarValidation.ts` is dead code | 2 |
| [F-012](#f-012) | Medium | **Fixed** | CSP granted `unsafe-eval` app-wide for a reason that stopped being true | 2 |
| [F-013](#f-013) | Medium | Open | Page gate prompts for pages that have no password | 2 |
| [F-014](#f-014) | Low | Open | Documented formula-parser rollback has no effect | 2 |
| [F-011](#f-011) | High | Open — needs your decision | Public API keys are users' plaintext passwords | 4 |
| [F-003](#f-003) | High | Open | Middleware admin gate checks cookie presence, never validity | 4 |
| [F-004](#f-004) | High | Open | v3 organisation scoping is not enforced | 4 |
| [F-005](#f-005) | Medium | Open | Identical-branch ternary grants every user the same permissions | 4 |
| [F-006](#f-006) | Medium | Open | Two routes read cookie names nothing ever sets | 4 |
| [F-007](#f-007) | Low | Open | 202 orphaned page passwords for a deleted route | 4 |
| [F-008](#f-008) | Low | Open | `lib/authLockout.ts` is dead code | 4 |

**Deviation from rule R6, declared.** R6 says findings become issues and are not
fixed on the audit branch. F-001, F-002 and F-009 were fixed immediately on the
user's explicit instruction, because all three were live and two were demonstrated
against production data. The remaining findings follow R6 as written.

---

## F-010

### Page passwords were served to anonymous callers and stored in plaintext

**Severity: Critical — demonstrated. Fixed, and all 699 passwords rotated.**

Found while investigating whether the page-password feature could be trusted going
forward. It could not: the feature handed out its own key.

**`POST /api/page-passwords` required no authentication and returned a working
password.** Demonstrated with no session and no credentials of any kind:

```
POST /api/page-passwords {"pageId":"<filter slug>","pageType":"filter"}
  → HTTP 200 · keys: success, shareableLink, pagePassword
  → PASSWORD RETURNED TO ANONYMOUS CALLER: YES — length 32
```

The `pageId` is in the page's own URL, so **every one of the 699 configured
passwords was obtainable by anyone who could open the page**. Guarding the data
routes (F-001) would have been pointless while this stood.

**Compounding defects:**

- **Stored in plaintext.** `page_passwords` documents carried a `password` field
  in the clear; any database read, backup, or log exposed working credentials.
- **Compared with `===`** (`lib/pagePassword.ts`), not a constant-time comparison.

**Not a defect:** generation was already sound — `randomBytes(16)` is 128 bits of
CSPRNG entropy. The weakness was never the password's strength; it was that the
system gave it away and kept it in the clear.

**Fix.**

1. `POST /api/page-passwords` now requires an admin session.
2. Passwords are stored as **bcrypt hashes at cost 12**, matching `lib/users.ts`.
   The plaintext is returned exactly once, at generation, and is never persisted.
3. Validation uses `bcrypt.compare`. A document carrying only a plaintext
   `password` field validates as **false** — pre-existing values are treated as
   void rather than migrated, because they were all disclosed.
4. The legacy-identifier migration path carries the *hash* across. A test caught
   this: the first version copied the retired `password` field, which would have
   migrated records while silently dropping their credential.

**Rotation executed** (`scripts/rotate-page-passwords.ts --commit`), on the
explicit instruction that existing access could be sacrificed:

```
rotated                  : 699
documents with a hash    : 699/699
plaintext fields left    : 0
```

Verified independently against the database afterwards: zero documents carry a
plaintext field, and all 699 carry a cost-12 bcrypt hash. The new plaintexts were
never logged, returned, or stored — they are unrecoverable by design, so every
share link must be re-issued from the admin UI.

**Consequence, accepted in advance:** every previously shared page link is dead.

---

## F-009

### Mutating API routes have no authentication

**Severity: Critical — demonstrated. Core fixed; 35 routes still open.**

Found while fixing F-001, and more severe than it.

`app/api/projects/route.ts` is 1,086 lines exporting POST, PUT and DELETE, and
contains no reference to `getAdminUser`, `requireAPIAuth`, `401`, or
`Unauthorized`. `DELETE` parses `projectId`, looks the document up, and calls
`deleteOne` — with nothing in between.

**Demonstrated.** A CSRF token is obtainable by any anonymous caller from
`/api/csrf-token`. With one, and no session of any kind:

```
DELETE /api/projects?projectId=<valid-format id> → HTTP 404 {"error":"Project not found"}
```

404 means the request passed every gate and executed the database lookup. The id
used does not exist — verified as 0 matching documents beforehand, specifically so
the test could not destroy anything. **Against a real id this deletes the event.**
CSRF was the only barrier, and CSRF is not authentication.

**Scope.** A scan of every `route.ts` exporting a mutating handler found **40 route
files with no authentication primitive**, including `partners`, `hashtags`,
`variables-config`, `data-blocks`, `charts`, `clicker-sets`, `hashtag-categories`
and the Google Sheets connect/disconnect/push/pull routes. Some are legitimately
public (`contact`, `clear-cookies`, `admin/login` which is 410 Gone); most are not.

**Fixed (this change):** `app/api/projects/route.ts`.

- `POST` and `DELETE` require an admin session (`requireSession`).
- `PUT` requires an admin session **or** a page-password grant for that specific
  project's edit slug (`requireProjectWrite`).

The dual path on `PUT` is not a compromise — it is required for correctness.
`components/EditorDashboard.tsx:229` saves live event stats through
`PUT /api/projects`, and that editor authenticates by page password, not by admin
session. A session-only guard would have broken data collection at events.

**Second pass (v12.1.58).** Caller analysis was run across `app`, `components`,
`hooks` and `lib` to find which UI invokes each unguarded route. Six were proven to
have **only** admin-UI callers and are now session-guarded, all verified returning
401 to an anonymous caller holding a valid CSRF token:

`admin/filter-style` · `admin/project-partners/auto-suggest` · `admin/ui-settings` ·
`data-blocks` (POST/PUT/DELETE) · `filter-slug` · `partners/upload-logo`

GET on those routes was re-checked and still returns 200 — the guards are on the
mutating handlers only.

**Count: 40 → 33 unguarded.**

**Why the remaining 33 are not simply guarded.** The same trap as `PUT /api/projects`.
`PartnerEditorDashboard.tsx:58,72` and `OrganizationEditorDashboard.tsx:183` issue
`apiPut` to `partners/edit`, `partners` and `organizations/edit` **from pages
protected by a page password, not an admin session**. A session-only guard there
would break partner and organisation self-service editing in production. Each
needs a scoped grant path resolved against the right identifier — the page-password
`pageId` and the route's `_id` parameter are not obviously the same value, and
guessing that mapping would be the exact failure R2 warns about.

**Recurrence is now blocked.** `tests/api-mutation-auth.test.ts` fails if any new
mutating route ships without an auth primitive, and separately fails if a listed
exception gets fixed but is left on the list. Verified to actually fail: a probe
route with an unguarded `DELETE` was added, the test failed naming it, and passed
again once removed.

---

## F-001

### Page-password protection is client-side only; data APIs are unauthenticated

**Severity: Critical — demonstrated against live data. Fixed.**

Page passwords gate the *rendering* of a page in the browser, but the APIs that
serve that page's data have no authentication. Anyone with the URL can fetch the
protected data directly.

**Mechanism.** `components/PagePasswordLogin.tsx:140` stores successful auth in
**`sessionStorage`**, and `isAuthenticated()` (`:229`) reads it back. Pages gate
their data fetch on that client-side check — e.g.
`app/hashtag/[hashtag]/page.tsx:122-128` calls `fetchHashtagData()` only when
`isAuthenticated()` returns true. The server is never consulted:
`lib/pagePassword.ts` is imported by exactly two routes, both of which *manage*
passwords (`app/api/page-passwords/route.ts`,
`app/api/admin/local-users/route.ts`). **No content-serving route validates a page
password.**

**Demonstrated.** Two filter slugs that have a password configured in
`page_passwords`, requested with no cookies, no token, no headers:

```
GET /api/hashtags/filter-by-slug/2c316d59-… → HTTP 200 · 57 projects · 97 stat keys
GET /api/hashtags/filter-by-slug/33549f34-… → HTTP 200 · 186 projects · 108 stat keys
```

`app/api/hashtags/filter-by-slug/[slug]/route.ts` contains no reference to
`getAdminUser`, `requireAPIAuth`, a password check, or a 401/403 path.
`GET /api/hashtags/trustphone` behaves identically (HTTP 200, 35 stat keys).

**Scale.** `page_passwords` holds **699** documents across `edit` (304),
`stats` (202), `event-report` (99), `partner-report` (63), `filter` (30),
`organization-report` (1). This is a feature in active use, not a vestige.

**Not affected:** `/api/public/*` correctly requires a Bearer token via
`requireAPIAuth` (`app/api/public/partners/route.ts:51`). The gap is in the
non-`/public` data routes that back password-gated pages.

**Fix.** `lib/pageAccess.ts` issues a signed, HttpOnly grant cookie naming exactly
the pages a visitor has unlocked, minted by `PUT /api/page-passwords` on a correct
password. `requirePageAccess(pageType, pageId)` guards the data routes and passes
on any of three conditions: the page has no password configured, the caller holds
an admin session, or the caller holds a grant for that page. The
"no password configured" check is what keeps every unprotected public report
working — the guard activates the moment a password is set and deactivates when it
is removed.

Applied to `GET /api/hashtags/filter-by-slug/[slug]` (filter) and
`GET /api/projects/edit/[slug]` (edit).

**Verified by execution, both directions:**

| Case | Before | After |
|---|---|---|
| Protected filter, no credentials | 200 · 186 projects | **401 PAGE_PASSWORD_REQUIRED** |
| Unprotected filter, no credentials | 200 | 200 · 2 projects (unchanged) |
| Correct password submitted | 200, no server proof | 200 + grant cookie issued |
| Data route with that grant | — | 200 · 186 projects · 108 stat keys |
| Wrong password | 401, no grant | 401, no grant |
| Grant for filter A used on filter B | — | **401** (scoped per page) |
| Tampered grant cookie | — | **401** (signature rejected) |

**Client behaviour.** The grant lives 12 hours while the browser's `sessionStorage`
flag lives as long as the tab, so a long-open tab could have shown an error instead
of a prompt. Both guarded pages now treat `PAGE_PASSWORD_REQUIRED` as "clear local
state and re-prompt". Confirmed in the browser: the filter page renders
"Filter Access Required" with a password field and no error screen.

**Traced (v12.1.58), and deliberately not changed — this needs a product decision.**
The three remaining page types were traced to their data paths:

| Type | Passwords | Page | Data path | Enforcement found |
|---|---:|---|---|---|
| `event-report` | 99 | `/report/[slug]` | `GET /api/projects/stats/[slug]` | **none, client or server** |
| `partner-report` | 63 | `/partner-report/[slug]` | server component, direct `getDb()` | **none** |
| `organization-report` | 1 | `/organization-report/[id]` | client | **none** |

This is **not** the F-001 pattern. For `filter` and `edit` a password gate existed
in the browser and was bypassable. Here there is no gate at all — not server-side,
and not even the client-side `PagePasswordLogin` check. These 163 passwords are
configured and never enforced anywhere.

Two readings are possible and the code cannot distinguish them: either those
reports are meant to be public and the passwords are vestigial, or protection was
intended and never implemented. The passwords are not auto-generated for
everything — 99 of 370 projects and 63 of 202 partners — so someone created them
deliberately, which argues for the second reading.

**Resolved (v12.1.59).** The decision was to enforce, accepting the loss of
existing access. `event-report` is now guarded at `GET /api/projects/stats/[slug]`,
and `partner-report` is guarded in its server component — the check runs before any
partner data is fetched, so on the unauthorised path the data never leaves the
server at all. Because that page is a server component and cannot pass a callback
to a client component, `components/ServerPageGate.tsx` renders the prompt and
refreshes on success; the first attempt passed `undefined as never` as the success
handler, which type-checked and would have crashed the moment anyone entered a
correct password.

Verified: a protected event report returns 401 unauthenticated, an unprotected one
still returns 200 with its data. `organization-report` (1 password) is not yet
guarded — its client data path was not traced.

---

## F-002

### Unsigned legacy session tokens are accepted, always

**Severity: Critical — verified by execution. Fixed.**

`validateLegacySessionToken` (`lib/sessionTokens.ts:111`) accepts a Base64-encoded
JSON blob with **no signature verification**. It checks only that required fields
exist and that `expiresAt` is in the future.

Crucially, **nothing gates this path**. `FEATURE_FLAGS.USE_JWT_SESSIONS`
(`lib/sessionTokens.ts:176`) controls only *generation*. Validation
(`validateSessionToken`, `:158`) routes on `detectTokenFormat`, which returns
`legacy` for any token without three dot-separated parts. So legacy tokens are
accepted even when JWT sessions are enabled.

**Verified.** A forged token, no secret involved:

```
detected format: legacy
validateSessionToken(forged) -> {"token":"forged","expiresAt":"2099-01-01…",
                                 "userId":"000000000000000000000001","role":"superadmin"}
ACCEPTED WITHOUT SIGNATURE: true
```

**Two distinct impacts:**

1. **Session expiry is unenforceable — no precondition.** The holder of a session
   reads their own cookie (HttpOnly blocks JavaScript, not browser devtools),
   edits `expiresAt`, re-encodes, and sets it back. Verified: the same token is
   rejected when expired and accepted when the expiry field alone is edited. There
   is no server-side session store to check against.
2. **Impersonation of any user whose id is known.** `lib/auth.ts:53` passes the
   token's `userId` straight to `findUserById`. Role is re-read from the database,
   so the forged `role` field does not escalate — but the *identity* does. An
   attacker who learns any user's ObjectId becomes that user.

**Precondition for impact 2:** a valid 24-hex ObjectId. `findUserById`
(`lib/users.ts:84`) validates the shape, so blind brute force is infeasible. No
id-leaking public endpoint was found in the surfaces sampled, but that sampling
was not exhaustive — Phase 6 must complete it.

**The fix direction is verified to work:** a JWT with a tampered payload is
correctly rejected by `validateJWTSessionToken`. The defect is accepting the
legacy format at all, not the JWT implementation.

**Environment, now verified.** Production was checked via `vercel env pull` before
changing anything, and the value was never printed: `JWT_SECRET` is present and 66
characters (the production minimum is 32), and `ENABLE_JWT_SESSIONS` is `"true"`.
Production therefore already mints signed JWTs, which is what made the fix safe to
ship — no live session is invalidated and no user is logged out. Locally neither
variable is set, so local sessions were unsigned.

**Fix.** `generateLegacySessionToken`, `validateLegacySessionToken` and
`detectTokenFormat` are deleted rather than deprecated, so the format cannot
return by flipping a flag. `validateSessionToken` always verifies an HS256
signature; its `format` parameter is retained for source compatibility and
deliberately ignored, because it was previously read from the `session-format`
cookie — which is not HttpOnly, letting the caller of a security check choose
which check ran. Generation lost its flag branch too: if minting could fall back
to an unsigned format while validation demanded a signature, one flag flip would
lock out every user.

**Verified after the fix:**

```
forged unsigned token, auto-detect  -> null
forged unsigned token, hint=legacy  -> null
minted token is a JWT (3 parts)     -> true
genuine token still validates       -> true
```

---

## F-020

### Analytics aggregates are five months stale; their cron was never scheduled

**Severity: High — verified against production. Not fixed; needs your decision.**

Three cron routes exist and are correctly `CRON_SECRET`-guarded:

- `/api/cron/analytics-aggregation`
- `/api/cron/bitly-refresh`
- `/api/cron/google-sheets-sync`

**None of them is scheduled.** `vercel.json` declares exactly one cron entry,
`/api/bitly/sync` at `0 3 * * *`, which is a different route. The three above have
no trigger, so nothing runs them.

The consequence is visible in the data. Today is 2026-08-15:

| Collection | Docs | Most recent document |
|---|---:|---|
| `analytics_aggregates` | 69 | **2026-03-18** |
| `aggregation_logs` | 7 | **2026-03-18** |
| `partner_analytics` | 170 | **2026-03-18** |

Aggregation ran until 18 March and has not run since — five months. All three
collections stop on the same day, which points at one trigger being removed rather
than three separate failures.

`analytics_aggregates` is read by **six** analytics endpoints:
`analytics/aggregates`, `analytics/insights/[projectId]`,
`analytics/insights/summary`, `analytics/partner/[partnerId]`,
`analytics/trends`, `analytics/benchmarks`.

**Now established — they serve it directly.** The open question from the first
writeup is answered, and the answer is the bad one.

`app/api/analytics/aggregates/route.ts:76` comments *"Connect to the pre-aggregated
analytics collections"* and reads the collection with no live fallback and no
recomputation. **None of the readers queries `projects` directly.** There are 17
read sites across 12 routes, plus `lib/sponsorshipHub.ts:598`.

Cross-referencing against what the admin UI actually calls, the following surfaces
read this frozen collection:

| Endpoint the UI calls | Reads `analytics_aggregates` |
|---|---|
| `/api/analytics/trends` | yes |
| `/api/analytics/insights` | yes |
| `/api/analytics/executive/metrics` | yes |
| `/api/analytics/executive/insights` | yes |
| `/api/analytics/executive/top-events` | yes |
| `/api/analytics/partner/[partnerId]` | yes |
| `/api/analytics/sponsorship-hub` | yes (via `sponsorshipHub.ts`) |

So the Executive, Insights, Partner and Sponsorship surfaces have been serving
2026-03-18 data for five months. These readers are not broken — they query by
`eventDate`, `projectId` and `partnerContext.partnerId`, all of which exist in the
stored documents. They are simply reading a collection nothing refreshes.

**Where the data came from.** The only non-script writer is
`lib/analytics-aggregator.ts:135`; the bulk write is in
`scripts/aggregateAnalytics.ts:118` — a script run by hand. Combined with the
unscheduled cron, the picture is that aggregation has only ever run manually, and
the last run was 18 March.

Not fixed: adding cron entries changes production scheduling and load, and
re-running the aggregator rewrites the collection every dashboard reads. Both are
your call.

---

## F-022

### `/api/analytics/aggregates` queries a document shape that was never written

**Severity: Low — structurally broken, but no UI consumer.**

The route types the collection as `TimeAggregatedMetrics` and filters on `bucket`,
`periodStart` and `periodEnd` (`lib/analytics-aggregates.types.ts:31-33`). The 69
stored documents contain none of those fields — their shape is per-project:
`projectId, eventDate, aggregationType, fanMetrics, merchMetrics, adMetrics,
demographicMetrics, visitMetrics, bitlyMetrics, partnerContext, rawStats,
createdAt, updatedAt, version`.

Two different aggregation designs met at one collection name: a per-project
writer, and a time-bucketed reader.

Verified by execution against an admin session:

| Request | Result |
|---|---|
| `/api/analytics/aggregates` | **200**, 69 records of the wrong shape |
| `?bucket=daily` | **200**, 0 records |
| `?startDate=2026-01-01&endDate=2026-12-31` | **200**, 0 records |

Every filtered query returns empty with a success status — the endpoint never
signals that its filter cannot match anything.

**Low, not High, for one reason:** no UI calls it. A grep across `app/admin`,
`components` and `hooks` finds no consumer. The dashboards use `trends`,
`insights`, `executive/*` and `partner/*`, which read the same collection with
queries that do match the stored shape. This endpoint is latent, not live.

---

## F-021

### The only scheduled cron has logged once in ten months

**Severity: Medium — verified.**

`/api/bitly/sync` is the single entry in `vercel.json`'s `crons`, scheduled daily
at 03:00. It writes to `bitly_sync_logs` on both its success and failure paths
(`app/api/bitly/sync/route.ts:269` and `:300`), so every run should leave a row.

`bitly_sync_logs` contains **one document, dated 2025-10-27** — roughly ten months
ago.

Either the schedule is not firing, or every run fails before reaching line 269.
Both write paths are inside the handler, so a failure early enough to skip both
would have to be a throw before the try block or a failure to invoke the route at
all. Distinguishing those needs the Vercel cron execution log, which I cannot read
from here.

---

## F-019

### `lib/auditLog.ts` is dead — the API write audit trail was never wired up

**Severity: Medium.**

`lib/auditLog.ts` writes audit entries to `api_audit_logs` from three call sites
inside itself, and has **zero importers** anywhere in `app`, `lib`, `components`
or `hooks`. The collection does not exist in production, which is consistent:
Mongo creates a collection on first insert, so nothing has ever been written.

An audit trail for API write operations was built and never connected. That is a
compliance-shaped gap rather than a functional one — nothing is broken, but there
is no record of API writes and the code implies there is.

**Deliberately not reported as broken logging:** the separate `audit_logs`
collection, written directly by `app/api/admin/permissions/route.ts:314` and
`app/api/admin/projects/[id]/route.ts:120`, also does not exist. Those writes sit
on live reachable paths immediately after a successful permission revoke and
project delete, so the honest reading is that **those two actions have never been
performed in production**, not that their logging fails. Recorded that way rather
than as a defect.

---

## F-017

### Content-asset deletion guard was inert and its usage panel queried a non-existent collection

**Severity: Medium — fixed. Two independent failures of the same safety feature.**

This is the collection-name drift first noticed while scoping the audit plan,
now resolved.

**Failure 1 — the usage panel read a collection that does not exist.**
`app/api/content-assets/usage/route.ts:52` queried `chartConfigurations`
(camelCase). Verified against production: that collection **does not exist**,
while `chart_configurations` holds **146** documents. Mongo collection names are
case-sensitive, so the query returned an empty set and the endpoint always
reported an asset as referenced by zero charts.

**Failure 2 — the deletion guard trusted a counter nothing maintains.**
`app/api/content-assets/route.ts` blocked deletion with
`if (asset.usageCount > 0 && !force)`. `usageCount` is written once, as `0`, at
creation, with the comment *"updated by usage tracking system"* — no such writer
exists anywhere in the codebase. All **40** content assets sit at `usageCount: 0`,
so the guard could never fire.

Both layers of a two-layer protection were therefore inert: an asset could be
deleted while charts referenced it, and the UI would confirm it was unused. The
referencing charts' `[MEDIA:slug]` / `[TEXT:slug]` tokens would then fail to
resolve.

**Fix.** The usage route reads `chart_configurations`. The deletion guard counts
live references at delete time instead of trusting a denormalised field — a count
computed on demand cannot drift out of maintenance.

**Verified.** The guard's regex was validated against fixtures in a scratch
database, including the near-miss case: a chart referencing `hero-banner-2` does
not satisfy a guard for `hero-banner`.

**Current exposure: none.** A live scan found **zero** charts using any
`MEDIA:`/`TEXT:` token, so no asset was actually at risk. The defect was latent —
it would have bitten the first time someone used the content library as intended.

---

## F-018

### A missing report renders a JSON parse error instead of "not found"

**Severity: Low — pre-existing, found incidentally.**

Requesting `/report/<slug>` for a slug that does not exist shows:

> ⚠️ Failed to Load Report — Unexpected token '<', "<!DOCTYPE "... is not valid JSON

`hooks/useReportData.ts:109` falls back to `GET /api/v3/activities/${slug}` when
the v2 lookup misses, then calls `.json()` on the response without checking
`res.ok`. There is **no route handler at that path** — `app/api/v3/activities/`
has `route.ts` and `[id]/participants/`, but no `[id]/route.ts` — so Next.js
returns a 404 HTML page and `JSON.parse` throws on the doctype.

Untouched by this session (0 commits since `bfe95226` modify that file). Found
because a mistyped slug of mine produced it, which is exactly the situation a real
user hits with a stale link.

---

## F-015

### Admin preview and partner report format the same number differently

**Severity: Medium — demonstrated, then fixed.**

The report pipeline has **two independent value formatters** for the same
`formatting` object, and they disagree on every value of 1,000 or more.

| Surface | Implementation | Method |
|---|---|---|
| Admin preview / builder | `lib/chartCalculator.ts:930` | `value.toLocaleString('en-US', …)` |
| Published partner report | `app/report/[slug]/ReportChart.tsx:59` | `value.toFixed(decimals)` |

Both derive decimals identically from `formatting.rounded`, so the divergence is
purely thousands separators. Verified by executing faithful reproductions of both
on identical inputs:

| Value | Formatting | Admin preview | Partner report | Match |
|---|---|---|---|---|
| 1234567 | `rounded: true` | `1,234,567` | `1234567` | **no** |
| 1234567.891 | `rounded: false` | `1,234,567.89` | `1234567.89` | **no** |
| 1500000 | `rounded: true, prefix: €` | `€1,500,000` | `€1500000` | **no** |
| 42 | `rounded: true` | `42` | `42` | yes |
| 87.5 | `rounded: false, suffix: %` | `87.50%` | `87.50%` | yes |

This is a WYSIWYG break on the core value path: an author composes a report,
sees `€1,500,000`, and the partner who opens the link sees `€1500000`. Anything
under 1,000 matches, which is why it survives casual checking.

`ReportChart.tsx` is also internally inconsistent — its chart tooltips
(`:925-926`) *do* use `toLocaleString()`, so within one rendered report a value
can carry separators in a tooltip and lose them in the KPI beside it.

**Fix.** One implementation, `lib/formatChartValue.ts`, used by both surfaces.
Separators are kept, because the builder's rendering is what the author reviewed
and approved, and because sponsors read these numbers at a glance.

Patching one call site would have left two implementations of one rule, which is
how the divergence arose; `tests/format-chart-value.test.ts` (10 cases) pins the
behaviour, including that non-finite values render as `NA` rather than reaching a
partner's report as the word "Infinity".

**Verified end to end in a production build**, not just in unit tests: the
published report for an event with a 61,473 stat now renders `2,531` with a
separator and contains no ungrouped four-digit numbers.

---

## F-016

### `lib/layoutGrammarValidation.ts` is dead code

**Severity: Low — confirmed.**

543 lines exporting 10 symbols, with **zero importers** anywhere in the
repository: not in `app`, `lib`, `components`, `hooks`, `scripts`, or `tests`.

It looks load-bearing because `scripts/check-layout-grammar-guardrail.ts` is a
required CI gate with a matching name — but that script imports only `fs` and
`path` and works by scanning file text for patterns. It never calls this module.

The live implementations are `lib/layoutGrammar.ts`,
`lib/layoutGrammarRuntimeEnforcement.ts` and `lib/layoutV2BlockCalculator.ts`,
which are imported normally. This module was superseded and left behind.

Safe to delete, but recorded rather than removed — Phase 0 flagged 81 unreached
modules and they deserve one deliberate sweep rather than piecemeal deletion.

---

## F-012

### CSP granted `unsafe-eval` app-wide for a reason that stopped being true

**Severity: Medium — fixed and verified in both modes.**

`middleware.ts:114` granted `'unsafe-eval'` in `script-src` for every response, with
the justification *"Formula Engine (new Function)"*. That justification is stale:
the formula engine tokenises and walks expressions
(`lib/formulaEngine.ts:706,777`), and a scan of `app`, `lib`, `components` and
`hooks` finds **no `new Function` and no `eval(`** in first-party source at all.

`'unsafe-eval'` removes one of the strongest protections a CSP offers against
XSS — it is what stops an injected string from becoming executing code. Granting
it in production for a dependency that no longer exists is pure downside.

**Verified by removing it**, rather than reasoned about:

| Mode | Result |
|---|---|
| Development | `EvalError` from `_next/static/chunks/main-app.js` — Next.js's HMR runtime |
| **Production build** | **Report page renders, zero CSP violations** (only unrelated preload warnings) |

So the need is real in development and absent in production. The fix is
conditional rather than a flat removal, because a flat removal breaks local
development entirely.

Confirmed after the change: production serves
`script-src 'self' 'unsafe-inline' https://…` and development still includes
`'unsafe-eval'`.

Note the same file already reasoned correctly about this once — line 124 records
that Chart.js does not need `eval` — but the grant was never revisited when the
formula engine migrated.

---

## F-013

### Page gate prompts for pages that have no password

**Severity: Medium — pre-existing, not introduced by the F-001 work.**

The client and server disagree about what "protected" means.

- **Server** (`requirePageAccess`): conditional — a page with no password record
  is served openly.
- **Client** (`app/filter/[slug]/page.tsx:122`, and the sibling pages): unconditional
  — `isAuthenticated()` reads `sessionStorage`, which is empty on first visit, so
  the password prompt renders regardless of whether a password exists.

Observed on a production build: filter `154254a9-…`, which has **no** password
configured and whose API correctly returns 200 with its data, still renders
"Filter Access Required".

A visitor to such a page cannot proceed — there is no password to enter — while
the same data is served freely by the API. Neither half is dangerous alone; the
inconsistency is the defect, and it predates this audit.

Related and separate: `PagePasswordLogin` fetches `/api/page-config` to style the
prompt, and **that route does not exist** — verified 404. Cosmetic only, since the
call is wrapped in `res.ok`, but it is a dead dependency.

---

## F-014

### Documented formula-parser rollback has no effect

**Severity: Low.**

`lib/featureFlags.ts:51` documents *"ROLLBACK: Set ENABLE_SAFE_FORMULA_PARSER=false
in Vercel"*, and exposes `USE_SAFE_FORMULA_PARSER`. But `lib/formulaEngine.ts`
references the flag **zero times** — the safe parser is the only path.

Harmless in itself, and the safe direction. Recorded because someone following
that documented rollback during an incident would set the variable, see no
change, and lose time.

---

## F-011

### Public API keys are users' plaintext passwords

**Severity: High — verified in production. Not fixed; needs a decision.**

`requireAPIAuth` resolves a Bearer token through `findUserByPassword`
(`lib/apiAuth.ts:81`), and that function is:

```ts
return col.findOne({ password })   // lib/users.ts:258
```

A direct plaintext equality query. The public API's Bearer token **is** the user's
password, which means the design *requires* passwords to be stored in the clear —
`lib/users.ts:28` already marks the field "Legacy plaintext password (deprecated -
use passwordHash instead)", but the API path depends on it.

**Verified against production, read-only:**

| Collection | Docs | Plaintext `password` | `passwordHash` | `apiKeyEnabled` |
|---|---:|---:|---:|---:|
| `users` | 18 | **3** | 14 | 2 |
| `local_users` | 1 | **1** | 0 | 0 |

Both `apiKeyEnabled` users carry a plaintext password, and zero API-enabled users
lack one — consistent with the API path being the reason those values still exist.

**Why High and not Critical.** Unlike F-010, nothing serves these values: no
endpoint returns the field, and `GET /api/admin/users` reads from the SSO service
rather than the local collection. The exposure is at rest — any database read,
backup, dump, or log of a user document yields working credentials.

**Not fixed, deliberately.** The correct fix is a separate `apiKeyHash` field with
its own generated key, decoupling API keys from passwords. But rotating the two
live API keys would break whichever integrations use them, and the camera and
fanmass pipelines were only just restored. Unlike page passwords — where you
explicitly accepted losing existing access — nobody has said these integrations
can go down, and I am not going to infer it.

**What I need from you:** confirmation that the two API-enabled users' keys can be
rotated, and ideally which integrations hold them, so the change can be sequenced
instead of discovered as an outage.

---

## F-003

### Middleware admin gate checks cookie presence, never validity

**Severity: High.**

`middleware.ts:24-32` guards `/admin/**`. Its comment reads *"Step 1 - Check
authentication (user has valid session)"*, but the implementation is:

```ts
const adminSession = request.cookies.get('admin-session');
if (!adminSession?.value) { redirect('/admin/login') }
```

Any non-empty cookie value passes. The comment at `:19` also claims it prevents
*"unauthorized/insufficient access"* — "insufficient" implies a role check, and
there is none beyond an SSO-source check for `/admin/dashboard` (`:37-42`).

A textbook R2 case: the comment states intent, the code states behaviour, and they
differ.

Real protection therefore rests entirely on each route calling `getAdminUser`.
**61 of 182 API routes reference it.** The remaining 121 are not necessarily
unprotected — many are legitimately public — but that disposition does not exist
anywhere today, and producing it is Phase 6 work.

---

## F-004

### v3 organisation scoping is not enforced

**Severity: High — latent, no live exposure today.**

`lib/middleware/v3/orgContext.ts:24-26`:

```ts
const v3OrgId = user.permissions?.includes('superadmin')
  ? '69b322e0cb8e841f95de9aa1' // Real Master Organization ID
  : '69b322e0cb8e841f95de9aa1'; // Defaulting to Master for MVP phase
```

Three defects in three lines: both branches are identical; the predicate can never
be true (`permissions` is always `['read','write','delete','manage-users']`, and
`superadmin` is a *role*, never a member of that array — see F-005); and
`user.organizationIds`, which exists on `AdminUser` (`lib/auth.ts:77`), is ignored
while the comment at `:22` calls it "future".

Every authenticated user of **any** role receives the Master organisation scope.
The middleware does authenticate (401 when no user) and does overwrite any
client-supplied `x-v3-org-id` via `headers.set`, so the header is **not**
spoofable — that was checked specifically.

**Why not Critical:** verified read-only against production, every document in
`v3_activities` (459), `v3_metric_values` (36,528) and `report_styles` (21)
carries the same single `organizationId` — the hardcoded Master. There is one
tenant in this data, so there is nothing to leak across. But `organizations` holds
**10** documents. The first time a second organisation's data lands in any of
these collections, every authenticated user reads it.

Affects 12 `/api/v3/*` routes plus `app/api/report-styles/route.ts`, which is not
a v3 route but uses this middleware for its scoping.

---

## F-005

### Identical-branch ternary grants every user the same permissions

**Severity: Medium — latent.**

`lib/auth.ts:62-63`:

```ts
const basePermissions = ['read', 'write', 'delete', 'manage-users']
const permissions = user.role === 'superadmin' ? basePermissions : basePermissions
```

Both branches return the same array, so every authenticated user — including role
`user` — is handed `delete` and `manage-users`.

Impact is limited today because the only consumer of `.permissions` is the broken
predicate in F-004. `hasPermission` (`lib/auth.ts:96`), which would make this
directly exploitable, has **no callers**: the `hasPermission` hits elsewhere in the
repo belong to an unrelated `lib/shareables/auth/types.ts`. Likewise `isAuthenticated`
and `logoutAdmin` in this module are unused — the only import from `@/lib/auth`
across 63 call sites is `getAdminUser`.

The danger is a future author reaching for `hasPermission` and reasonably assuming
it works.

---

## F-006

### Two routes read cookie names nothing ever sets

**Severity: Medium — functional, fails closed.**

`app/api/me/route.ts:26,41` and `app/api/images/route.ts:36,37` read
`admin_session` and `page_auth` (underscores). The session cookie is
`admin-session` (hyphen, `lib/auth/mintSession.ts:119`), and `page_auth` is never
set anywhere — page-password state lives in `sessionStorage` (F-001).

Consequences: `GET /api/images` returns **401 to everyone**, including
authenticated admins, because its gate (`:39`) tests two cookies that cannot
exist. `GET /api/me` always reports `authenticated: false`.

Fails closed, so not a security hole — but the images endpoint is unusable, and
`/api/me` is actively misleading to any client that trusts it.

---

## F-007

### 202 orphaned page passwords for a deleted route

**Severity: Low — hygiene.**

`page_passwords` holds 202 documents with `pageType: 'stats'`, but no
`app/stats/[slug]/page.tsx` exists in the tree. Git history shows the file had 37
commits, so it existed and was removed without cleaning up its passwords.

No security impact. Recorded because it distorts any count taken from that
collection, including F-001's scale figure.

---

## F-008

### `lib/authLockout.ts` is dead code

**Severity: Low.**

81 lines implementing brute-force lockout, with zero callers, flagged `unreached`
by the Phase 0 graph.

**This is expected, not a vulnerability.** Local login returns
`410 Gone` (`app/api/admin/login/route.ts:23`) — messmass is SSO-only, so
credential brute-forcing is the identity provider's concern. Recorded for removal,
not remediation. Deliberately not filed as a missing-control finding, because
asserting that would have been wrong.
