# messmass drift register — fleet audit P3, first edition

Generated 2026-08-19 against HEAD `6d28c7f3` (v12.1.95) by the fleet
documentation audit (messmass#345; method in messmass#344). Every claim
carries file:line evidence. Verdicts: WRONG / STALE / MISSING / CURRENT.
This file is intentionally header-less so the docs:audit version gate does
not bind it to a version it is not about.
Enforcement live: CI runs `inventory:check` (`scripts/fleet-audit-inventory.py
--check`) since 2026-09-08 (messmass#355; rule in `contract-first-rule.md`).

**Re-verification 2026-10-11 (re-verified @ 184d1e32, v12.3.42).** Every entry
below was checked again against the code on origin/main, 45 commits after the
previous stamp (dd34e229, 2026-09-28; that round's text was committed in
410042ff). The read-through ran at 5db51a7d; while it ran, main moved by one
commit, 184d1e32 (the v12.3.42 version bump: 33 files, version stamps plus one
release-notes entry and one hand-over paragraph, no code), and only the files
that commit touched were checked again: README.md, HANDOVER.md,
docs/architecture.md, docs/design/design-system.md,
docs/features/features-authentication.md, docs/low-level-design.md,
docs/operations/operations-release-notes.md, the component inventory,
`fleet-version-policy.md` and `package.json`. Line numbers in this file are for
184d1e32; that commit moved `HANDOVER.md` by two lines and the release notes by
eight, and nothing else this page cites. The stamps on this
page are read by `freshness_check` in `scripts/fleet-audit-inventory.py`
(`STAMP_RE` at :83): a stamp more than 30 commits behind HEAD warns
(:74), more than 90 fails `npm run inventory:check` (:81), and CI runs that on
every pull request. Only the inventory check measures the stamps on this page;
the freshness part of `docs:audit` reads `fleet-architecture.md` alone
(`scripts/docs-consistency-audit.js:134`).
Moving the sha without re-reading the entries defeats the gate, which is why
this round changed text and added entries, not only the stamp.

Status words in the ledger: TRUE = still true as written; CHANGED = still holds
but the text, number or line had to be updated; FIXED = was open, now fixed;
STILL WRONG / STILL MISSING = known drift confirmed still open; NEW = not in
the previous register; NOT RE-CHECKABLE = a historical figure the register does
not name enough to measure again. Nothing under NEW or STILL was fixed by the
pull request that records this round: it changes this file only, and each item
needs its own code or doc change.

## Re-verification ledger @ 184d1e32 (2026-10-11)

| No. | Entry | Status | Proof at 184d1e32 |
|---|---|---|---|
| 1 | Cron fallback `development_secret` gone; bare-template variants closed (§0) | TRUE | `app/api/cron/analytics-aggregation/route.ts:51-58`; `app/api/bitly/sync/route.ts:189-193`; `app/api/cron/bitly-refresh/route.ts:51-55`. `google-sheets-sync/route.ts:31-43` fails closed in production only (an unset secret passes outside production) |
| 2 | Mutating routes guarded: 8 google-sheet routes, hashtag-style; read sweep (§0) | CHANGED | 8 routes still call `requireSession()` (`.../google-sheet/*/route.ts`, import + one call each); hashtag-style uses `requireAdmin()` (`app/api/admin/hashtag-style/route.ts:21,64`), not `requireSession`; `KNOWN_UNGUARDED_READS` still by-design only (`tests/api-mutation-auth.test.ts:104-140`); the two camera `[debt]` entries left `KNOWN_UNGUARDED` in 0a8f6244 |
| 3 | Bitly cron fires: GET delegates to POST (§0) | TRUE | `app/api/bitly/sync/route.ts:375-377`; `vercel.json` cron `/api/bitly/sync` at `0 3 * * *` |
| 4 | Two stale-SSO admin routes survive (§0) | TRUE | `app/api/admin/permissions/route.ts:16`, `app/api/admin/projects/[id]/route.ts:16` call `{SSO_BASE_URL}/api/validate`; no caller in app, components, hooks, lib, contexts, tests, scripts |
| 5 | architecture.md dependency versions (§1) | CHANGED | React ^19.2.6 `:3363`, uuid `:3367` (now ^14.0.3, was ^14.0.0), Node `:3382`, Next 15.5.27 `:3362`, no jsPDF row, `:3369`; all equal `package.json` |
| 6 | architecture.md WebSocket row (§1) | TRUE | only the removed-in-v12.2.0 block, `:3512-3529` |
| 7 | architecture.md "No External UI Library" / TailAdmin (§1) | TRUE | `:3374` (GDS on Mantine 8, TailAdmin retired); `@mantine/core` ^8.3.18 |
| 8 | architecture.md password-based admin login (§1) | TRUE | `:3390`, `:3397`, `:3456`; `app/api/admin/login/route.ts:20-25` returns 410 |
| 9 | architecture.md rate limiting, CSRF, middleware claims (§1) | CHANGED | rate limiting `:3551` (`middleware.ts:70-83`), CSRF `:3545` (`lib/csrf.ts:4`, `middleware.ts:88-98`), middleware gate `:3548` (`middleware.ts:35,55`, `lib/edgeSessionToken.ts:75`); line numbers moved, and `:3551` lists six rate-limit classes where the code has seven (entry 70) |
| 10 | architecture.md "Edge Functions" (§1) | TRUE | `:3440`; no `runtime = 'edge'` in app, lib or `middleware.ts`; 26 routes set `runtime = 'nodejs'` |
| 11 | architecture.md `NEXT_PUBLIC_WS_URL` / `ADMIN_PASSWORD` env, `useWebSocket` (§1) | TRUE | env block `:3442-3456`; hook only at `:3527`, file absent (`ls hooks/useWebSocket.ts`) |
| 12 | architecture.md header vs footer version; auth sections (§1) | TRUE | `:7` and `:3876` both 12.3.42 = `package.json`; Authentication Model `:3393-3402`, Security Measures `:3542-3551` |
| 13 | "Project Slug… No Passwords Required" (§1) | STILL WRONG | `:3470`, also `:3460`, `:3487`; `app/api/projects/stats/[slug]/route.ts:18` (`requirePageAccess`), `app/api/projects/edit/[slug]/route.ts:46` (`requirePageAccessDecision`); the same file says so at `:3391`, `:3398` |
| 14 | "never have a runtime dependency on fanmass being reachable" (§1) | STILL WRONG | `:3773-3774`; `app/api/integrations/fanmass/events/[eventId]/sync/route.ts:37`, `.../callbacks/route.ts:31` -> `lib/fanmassIntegration.ts:337` -> `fanmassFetch` `:250` (15 s abort `:258`) |
| 15 | "Two channels across the boundary" (§1) | STILL WRONG | `:3777`; `fleet-architecture.md:229` (E2: six push + two poll/ack channels); 18 route files under `app/api/integrations/fanmass`, all call `requireFanmassIntegrationAuth` |
| 16 | DB schema summary omits live collections (§1) | STILL MISSING | table `:3494-3510` lists 13; 49 more names are opened by app/, lib/, components/, hooks/ (count in §1); row `:3506` names a collection that does not exist (entry 73) |
| 17 | No CORS section in architecture.md (§1) | STILL MISSING | no "CORS" in `docs/architecture.md`; `lib/cors.ts` used by `middleware.ts:10` and 4 `app/api/public/**` routes |
| 18 | SSO guide rewritten (§1b) | TRUE | `docs/guides/guides-tutorial-authentication-sso.md:78,91-94`; callback redirects `no_access` at `app/api/auth/sso/callback/route.ts:89,102`; `lib/auth/ssoOAuth.ts:76-77` |
| 19 | features-authentication.md corrected (§1b) | TRUE | four layers `:17`; HS256 + `lib/sessionTokens.ts:2` at `:262`; `PageType` list `:331-332` = `lib/pagePassword.ts:14-22`; Machine API Keys `:1199`; grant facts `:247` = `lib/pageAccess.ts:25,36,42,102,146` |
| 20 | camera-app guide: bidirectional model (§1b) | CHANGED | `docs/guides/guides-tutorial-camera-app.md:24-52`: four inbound endpoints now, not two (frame-context, link-stats added by 0a8f6244, 69146ebd); operator-backfill token note `:183-196` |
| 21 | api-reference.md: login 410, no WebSocket section (§1b) | TRUE | `docs/api/api-reference.md:30`; no "websocket" in the file |
| 22 | README.md badge, WebSocket, SSO, Fleet (§1b) | CHANGED | badge now v12.3.42 (`README.md:15`); SSO env `:86-88`, `:93`; Fleet `:143`, Fanmass `:147`; no WebSocket text |
| 23 | WebSocket stack deleted in code (§2) | TRUE | c56e70af exists; `server/` and `hooks/useWebSocket.ts` absent; `ws`, `@types/ws` absent from `package.json`; no `new WebSocket(` in app, components, hooks, lib |
| 24 | WebSocket claims removed from the named docs (§2) | TRUE | `docs/operations/ops-warp.md:296,1043`, `docs/features/features-authentication.md:819-820`, `docs/operations/operations-roadmap.md:473,478`, `docs/guides/guides-tutorial-getting-started.md:28`, `docs/components/components-reusable-components-inventory.md:376` (polling: `components/TopHeader.tsx:51`), `docs/audits/system-audit-plan-2026.md:12,51`; `docs/DEVELOPER-CONDUCT.md` has no Socket.io (but see entry 75) |
| 25 | docs:audit version gate hole (§3) | TRUE | `scripts/lib/docs-version-check.js:16` (`VERSION_LINE_RE`); `scripts/docs-consistency-audit.js:111-118` |
| 26 | low-level-design.md covers only 4 subsystems (§4) | TRUE | `docs/low-level-design.md:11,130,152,178` (four subsystem sections) plus Comment Maintenance `:148`; all 25 repo paths it cites exist |
| 27 | low-level-design.md:150 "no mechanical WHAT/WHY" contradicts the convention (§4) | CHANGED | `docs/coding-standards.md:146` says the same thing; the contradiction is with practice, not with a written rule (549 of 672 TS/TSX files under app, lib, components, hooks carry a `WHAT:` comment) |
| 28 | HANDOVER.md stale by 6 patches; fanmass direction sentence (§4) | FIXED | `HANDOVER.md:3` "Last verified: 2026-10-11 (v12.3.42 fleet release)"; direction sentence corrected at `:124-126` (410042ff) |
| 29 | docs/V3 has 16 files, indexed as Active (§4) | TRUE | 16 files in `docs/V3`; 16 in `docs/_audit/docs.json`; `docs/index.md:35` "(Active)" |
| 30 | v3 org scoping (§4) | TRUE | 14 `app/api/v3` route files; 11 use `withOrgContext`; metrics/sync `requireAdmin`; 2 organizations/report files `validateOrganizationAccess` |
| 31 | V3 spec: `GET /api/v3/activities/{id}` not implemented (§4) | TRUE | `docs/V3/messmass_v3_api_specification.md:22`; no `app/api/v3/activities/[id]/route.ts` |
| 32 | design-system.md is the most accurate doc (§5) | CHANGED | version now 12.3.42 (`:7`); Mantine 8 `:21`, no TailAdmin guidance `:31`; its 12 adapter paths equal the 12 `localAdapters` of `gds-adoption.json`, but no gate compares the two (the old "cross-checked by gds:sync" was wrong: `scripts/gds-sync-packages.sh` only runs `npm ls` on the three GDS packages at 6.3.0; `gds-compliance check` reads `localAdapters`); the old contradiction with architecture.md is gone (`:3374`) |
| 33 | fanmass tutorial is the best integration doc (§5) | TRUE | env names `:39-41`, codes `:45-49` match `lib/config.ts:141-143`, `lib/fanmassIntegration.ts:77,84,254`; contract name `:263` = `lib/aiAnalysisSummary.ts:27`; gap remains (no dashboard-snapshot, command or rescan text) |
| 34 | AI contract versioning, `distinct()` note, page-password and integration-token internals (§5) | CHANGED | contract gate `lib/aiAnalysisSummary.ts:24-25,66`; Stable API strict `lib/mongodb.ts:13-17`; grant mechanics re-read (entry 19); `lib/pageAccess.ts` was rewritten in a5d453d1 and only its entry points and grant facts were re-read; one route breaks the `distinct()` rule (entry 68) |
| 35 | WHAT/WHY adherence; `lib/sponsorshipHub.ts` header (§6) | TRUE | `lib/sponsorshipHub.ts:1-22` WHAT/WHY/SOURCES header; 1453 lines |
| 36 | `app/api/partners/route.ts` guarded (§6) | TRUE | `requireAdmin` `:34,333,402`; PUT `requirePartnerWriteAccess` `:169` |
| 37 | TODO/FIXME count; commented-out code (§6) | CHANGED | 3 matches in `lib/` (50,720 lines), all in comments that record a removed TODO: `lib/bitly-aggregator.ts:254,295`, `lib/bitly.ts:447`; heuristic scan for commented-out statements in `lib/`: 0 hits |
| 38 | `lib/auth.ts` "intentional seam" comment gone (§6) | TRUE | no "seam" in `lib/auth.ts`; per-role table `lib/roles.ts:32` |
| 39 | `app/api/me` and `app/api/images` removed (§6) | TRUE | both paths absent |
| 40 | `lib/config.ts` WS comment gone (§6) | TRUE | no websocket text in `lib/config.ts` |
| 41 | `drive-folders/status` route gone (§6) | TRUE | `app/api/drive-folders` holds only `route.ts` and `[linkId]` |
| 42 | `lib/cameraClient.ts` comment names the real inbound endpoints (§6) | CHANGED | stale again: `lib/cameraClient.ts:12-14` names 2 of 4 (entry 69) |
| 43 | `lib/v3/middleware.ts` gone; caller uses orgContext (§6) | TRUE | file absent; `app/api/v3/health/route.ts` uses `withOrgContext` |
| 44 | password-as-key comments corrected (§6) | TRUE | `lib/apiAuth.ts:65-72`, `lib/users.ts` (410042ff) |
| 45 | fit-in-fleet one-pager exists (§6) | TRUE | `docs/_audit/messmass-in-the-fleet.md`, now also names frame-context and link-stats |
| 46 | `app/api/me`, `app/api/images` dead routes removed (§7) | TRUE | same proof as entry 39 |
| 47 | Two SSO-validate routes still queued for deletion (§7) | TRUE | same proof as entry 4 |
| 48 | Also queued: `app/api/stats`, hashtag-style, sports-db/lookup, debug routes (§7) | CHANGED | all five still exist; `debug/categorized-hashtags` has one caller, `app/debug/hashtag-categories/page.tsx:37`; a fourth debug route is not queued (entry 78) |
| 49 | Dead components removed (§7) | TRUE | `BlockEditor`, `LandingReportRoot`, `LandingValueChainSection`, `HashtagInput`, `app/api/landing-report` absent; `UnifiedHashtagInput` live |
| 50 | Dead libs removed; api-docs webhooks gone (§7) | TRUE | `lib/webhooks.ts`, `lib/shareables`, `lib/ssoClient.ts`, `lib/v3/middleware.ts` absent; no "webhook" in `app/api-docs/page.tsx` |
| 51 | `scripts/verify-v3-middleware.ts` imports a deleted file (§7) | TRUE | `scripts/verify-v3-middleware.ts:2`; kept by `docs/_audit/scripts-keep-list.md:176` |
| 52 | Dead infra removed: `server/`, macOS duplicates, `ws`, keyword (§7) | CHANGED | `server/` and `package 3.json` absent, no `websocket` keyword; one duplicate survives: `app/icon 3.png` (entry 74) |
| 53 | scripts prune: 315 of 421 deleted, 106 kept (§7) | CHANGED | the prune record stands (`scripts-keep-list.md:43-44`); `scripts/` now tracks 112 files, 6 added later by their own changes |
| 54 | gds-compliance carve-out cleared (§7) | TRUE | `.github/workflows/ci.yml` runs `npx gds-compliance check --manifest ./gds-adoption.json` with no `|| true`; the check passes in this round's run |
| 55 | Do not treat integration routes as dead (§7) | CHANGED | 6 camera route files (4 camera-called behind `assertCameraSecret`, 2 operator routes behind the fanmass token that no code in messmass or in the local camera and fanmass checkouts calls); 18 fanmass routes |
| 56 | Fix 1: cron fallback (§8) | TRUE | same proof as entry 1 |
| 57 | Fix 2: google-sheet and hashtag-style guards (§8) | TRUE | same proof as entry 2; `c02f4b6f` exists |
| 58 | Fix 3: docs:audit regex (§8) | TRUE | same proof as entry 25 |
| 59 | Fix 4: dead code and WebSocket claims (§8) | TRUE | same proof as entries 23, 24, 49, 50 |
| 60 | Fix 5: SSO guide and features-authentication (§8) | TRUE | same proof as entries 18, 19 |
| 61 | architecture.md 4,665 -> 3,799 lines; fiction deleted (§9) | CHANGED | now 3,877 lines (`wc -l docs/architecture.md`) |
| 62 | Changelog archived (§9) | TRUE | `docs/archive/architecture-changelog-2026-09.md` exists |
| 63 | Five CI gates (§9) | TRUE | `package.json:47,48,50`; `tests/comment-counts-match-code.test.ts`, `tests/admin-only-comments-are-enforced.test.ts`; run results in the pull request |
| 64 | F-003 / F-025 security posture (§9) | TRUE | `middleware.ts:35,55`; `lib/edgeSessionToken.ts:2,75`; `app/api/hashtag-categories/route.ts:40-48,179,275,383` (`requireAdmin`) |
| 65 | Dead code figures: 1,610 lines, 70 selectors, 86 classes (§9) | NOT RE-CHECKABLE | historical counts of a finished sweep; the modules and classes are not named, so there is nothing to measure again |
| 66 | F-011, F-004, F-007 closed (§9) | TRUE | 6f31990d, e0f0643f, e098deaa exist; `lib/apiAuth.ts:65-72`; `lib/middleware/v3/orgContext.ts`; the effect of e098deaa on the production data was not re-read (no production database reads in this audit) |
| 67 | Header: CI enforces `inventory:check` (header) | TRUE | `.github/workflows/ci.yml` step `npm run inventory:check`; `package.json:85` |
| 68 | `GET /api/bitly/recalculate` calls `distinct()` under the strict Stable API | NEW | see §10 |
| 69 | `lib/cameraClient.ts:12-14` names 2 of 4 camera inbound endpoints | NEW | see §10 |
| 70 | `lib/rateLimit.ts:4` header contradicts the code; architecture.md `:3551` lists 6 of 7 classes | NEW | see §10 |
| 71 | `lib/rateLimit.ts:280-282` public class keyed on the deleted `/stats/` route | NEW | see §10 |
| 72 | architecture.md `:3491` example URL uses the deleted `/stats/` route | NEW | see §10 |
| 73 | architecture.md `:3506` names a collection `variableGroups` that does not exist | NEW | see §10 |
| 74 | `app/icon 3.png` tracked macOS duplicate | NEW | see §10 |
| 75 | `READMEDEV.md:315` and `docs/DEVELOPER-CONDUCT.md:70` list Tailwind (and Socket.io) | NEW | see §10 |
| 76 | `app/admin/login/page.tsx:17` maps `no_account`, a code nothing emits | NEW | see §10 |
| 77 | `lib/pagePassword.ts:27` comment lists the deleted `stats` page type | NEW | see §10 |
| 78 | `app/api/debug/notifications` has no caller and is not queued | NEW | see §10 |
| 79 | `fleet-architecture.md:279` cites architecture.md lines that moved | NEW | see §10 |
| 80 | `middleware.ts:134` CSP still allows `wss://*.pusher.com` | NEW | see §10 |

Counts: 67 earlier entries (45 TRUE, 15 CHANGED, 3 STILL WRONG, 2 STILL
MISSING, 1 FIXED, 1 NOT RE-CHECKABLE) and 13 NEW entries, 80 in all.

## 0. Behavior findings escalated out of the docs audit (see messmass#347)
**FULLY RESOLVED via messmass#347 + messmass#348 (2026-09-03) + messmass#386
(2026-09-04)** (re-verified @ 184d1e32, 2026-10-11; ledger 1-4):
- ~~**Cron auth bypass**~~ FIXED: the `'development_secret'` fallback is gone
  (analytics-aggregation fails closed, route.ts:51-58). messmass#348 also
  closed the two remaining fail-open variants: `/api/bitly/sync` compared
  against a bare `` `Bearer ${process.env.CRON_SECRET}` `` (so `Bearer
  undefined` authenticated when the secret was unset) and
  `/api/cron/bitly-refresh` skipped auth entirely when the secret was unset.
  Both now fail closed (`bitly/sync/route.ts:189-193`, `cron/bitly-refresh/route.ts:51-55`).
  The third cron, `google-sheets-sync`, fails closed in production only
  (`route.ts:31-43` answers 503 when `CRON_SECRET` is unset and `NODE_ENV` is
  `production`; outside production it continues).
- ~~**Unauthenticated mutating routes**~~ FIXED: all 8
  `/api/partners/[id]/google-sheet/*` routes call `requireSession()`;
  `POST /api/admin/hashtag-style` calls `requireAdmin()` (`route.ts:21,64`; this
  entry used to say `requireSession()`).
  `tests/api-mutation-auth.test.ts` now also covers
  read routes: every GET without an auth primitive must appear in
  `KNOWN_UNGUARDED_READS`, so a new anonymous analytics/PII read fails CI.
  messmass#386 (v12.3.18) then guarded 33 of the 37 debt entries, reclassified
  3 as by-design editor reads (their destructive handlers guarded), found 1
  already guarded but invisible to the primitive list, made the sweep judge
  the GET handler's own body, and closed the 10 further anonymous GETs that
  per-handler honesty surfaced — the list holds only by-design
  public/editor-surface/reference routes now (`tests/api-mutation-auth.test.ts:104-140`).
  Since 0a8f6244 (2026-10-06) `assertCameraSecret` is a recognised primitive
  there, and the two camera integration routes that sat in `KNOWN_UNGUARDED`
  as `[debt]` are off that list.
- ~~**Bitly cron never fires**~~ FIXED: `/api/bitly/sync` exports a GET that
  delegates to POST (`route.ts:375-377`), so the 03:00 UTC Vercel cron (GET)
  now executes with the same auth (cron secret or admin session).
- ~~Stale-SSO admin routes~~ FIXED (messmass#386 wave, 2026-09-04): the two
  remaining `/api/admin/{projects,users}` collection routes authenticated
  against the retired `{SSO_BASE_URL}/api/validate` — always 401, and grep
  found zero callers (the admin UI uses `/api/admin/users/[id]/role`), so
  both routes and the orphaned `lib/ssoClient.ts` were deleted rather than
  repaired. **Correction (2026-09-28, still true at 184d1e32):** two more
  routes with the same pattern survive — `app/api/admin/permissions/route.ts:16`
  and `app/api/admin/projects/[id]/route.ts:16` still call the retired
  `{SSO_BASE_URL}/api/validate` (the endpoint found above to always 401) and
  have no in-app callers (grep over app, components, hooks, lib, contexts,
  tests and scripts, 2026-10-11). Queued for deletion in §7.

## 1. docs/architecture.md architectural claims (re-verified @ 184d1e32, 2026-10-11; ledger 5-17)
The file is 3,877 lines now (3,859 at the previous stamp; fiction deleted and
the changelog archived in #408/#409); line numbers below are current.
- ~~Dependency versions all wrong (React 18.3.1, Node ≥18, jsPDF 3.0.1, uuid
  11.1.0)~~ FIXED: React ^19.2.6 (:3363), uuid ^14.0.3 (:3367; ^14.0.0 at the
  previous stamp), Node >=24.0.0 <25.0.0 (:3382); no jsPDF row, and :3369
  states there is no html2canvas/jsPDF path. `package.json` agrees on all of
  them.
- ~~"WebSocket (ws) — real-time client-server communication"~~ FIXED: the only
  WebSocket text is the "Removed in v12.2.0" historical block (:3512-3529).
- ~~"No External UI Library" / "TailAdmin V2"~~ FIXED: GDS on Mantine 8 (:3374).
- ~~"Password-Based: admin login with bcrypt"~~ FIXED: SSO-only, 410 noted
  (:3390, :3397, :3456).
- ~~Rate limiting "(To be implemented)"; CSRF "SameSite attribute";
  "Middleware validates session on all protected routes"~~ FIXED: rate
  limiting implemented (:3551), CSRF double-submit (:3545), and :3548 now
  states what middleware checks (HS256 signature + expiry of `admin-session`
  for `/admin/**` and `/dashboard/**`, F-003) and that role checks stay in
  each route. :3551 has one stale detail, see §10 (ledger 70).
- ~~"Edge Functions: routes on Vercel Edge"~~ FIXED: Node.js serverless runtime,
  none declare `'edge'` (:3440).
- ~~`NEXT_PUBLIC_WS_URL` and `ADMIN_PASSWORD` required; `hooks/useWebSocket.ts`~~
  FIXED: neither is in the env block (:3442-3456); the hook appears only in the
  removed-in-v12.2.0 block.
- ~~Header Version vs footer Version self-contradictory; no section on SSO,
  camera, the auth layers, CSRF or rate limiting~~ FIXED: header :7 and footer
  :3876 agree; "Authentication Model" (:3393-3402) covers SSO, page passwords,
  machine tokens, stakeholder sessions and the camera bridge (now including
  the link-stats endpoint, :3402); CSRF and rate limiting are in "Security
  Measures" (:3542-3551).
- STILL WRONG: "Project Slug… No Passwords Required" (:3470; also :3460
  "password-less access" and :3487 "no session/auth required") —
  page_passwords + requirePageAccess gate /api/projects/{stats,edit}/[slug]
  (`app/api/projects/stats/[slug]/route.ts:18`,
  `app/api/projects/edit/[slug]/route.ts:46`). The same file says so at :3391
  and :3398.
- STILL WRONG: "messmass must therefore never have a runtime dependency on
  fanmass being reachable" (:3773-3774) — /sync and /callbacks make blocking
  outbound calls to FANMASS_BASE_URL (15s timeout):
  `app/api/integrations/fanmass/events/[eventId]/sync/route.ts:37` and
  `.../callbacks/route.ts:31` call `syncFanmassAnalytics`
  (`lib/fanmassIntegration.ts:337`), which calls `fanmassFetch` (:250, abort
  after 15 s at :258).
- STILL WRONG: "Two channels across the boundary" (:3777) — the E2 edge in
  `fleet-architecture.md` (:229) has six push channels plus two poll/ack
  channels; `app/api/integrations/fanmass/**` holds 18 route files, each
  calling `requireFanmassIntegrationAuth`.
- STILL MISSING: the DB schema summary (:3494-3510) lists 13 collections. A scan
  of `.collection('<name>')` calls (the inventory scanner's pattern) over app/,
  lib/, components/, hooks/ and `middleware.ts` finds 49 more names the table
  omits (page_passwords, fanmass_event_links, fanmass_commands,
  fanmass_dashboard_snapshot, ai_analysis_summaries, ai_rescan_requests,
  drive_folder_links, report_variants, report_templates, report_styles,
  stakeholder_grants, organizations, ...); `collections.json` lists 71 names
  in all. The earlier text said "~15". The row `variableGroups` (:3506) names
  nothing real (§10).
- STILL MISSING: there is no CORS section in architecture.md although
  `lib/cors.ts` exists and is used by `middleware.ts:10` and the four
  `app/api/public/**` routes (partners, partners/[id], partners/[id]/events,
  events/[id]). CORS is covered only in `docs/features/features-authentication.md`
  and `docs/api/api-public.md`.

## 1b. ~~WRONG~~ FIXED (messmass#349, re-verified @ 184d1e32, 2026-10-11) — guides and feature docs (ledger 18-22)
- ~~**docs/guides/guides-tutorial-authentication-sso.md**~~ FIXED: Section 4
  rewritten to the real OAuth2 authorization-code flow (login → `/api/oauth/authorize`,
  callback → `/api/oauth/token`, central per-app permission store; guide :78,
  :104-106), auto-provisioning, and `no_access` (not `no_account`; guide
  :91-94, code `app/api/auth/sso/callback/route.ts:89,102`); the intro, gotcha,
  and troubleshooting `no_account`/pre-provision references were corrected too.
- ~~**docs/features/features-authentication.md**~~ FIXED: the Executive Summary
  ("email/password", "dual-layer"→three layers), the Quick Start "Admin Login" curl
  (was `POST /api/admin/login` → now the SSO flow, 410 noted), and the deep "Login
  Endpoint" section (was email/password + forgeable base64 token → now the SSO callback
  + JWT HS256, F-002) were all corrected. The page-password/pageType items were already
  fixed in the F-009/#376 waves. **This mark was premature until 2026-09-28**: the
  Executive Summary still said "dual-layer" (:17) and Core Concepts still said "base64-encoded
  JSON session token" (:247). Both are now fixed (four layers at :17; JWT HS256 per
  `lib/sessionTokens.ts:2`, cited at :262), along with the `page_passwords`
  collection name, the deleted `stats` pageType (list at :331-332 equals
  `PageType` in `lib/pagePassword.ts:14-22`), the users schema, and a real
  "Machine API Keys" section (:1199) replacing "Planned: API Keys". Re-read
  2026-10-11: the page-access grant facts at :247 (cookie `page-access`,
  HS256, at most 40 grants, 12 hour expiry) match `lib/pageAccess.ts:25,36,42,102,146`.
- ~~**docs/guides/guides-tutorial-camera-app.md:22-24**~~ FIXED: the "one direction"
  claim replaced with the verified bidirectional model (guide :24-52) —
  messmass→Camera provisioning (org/partner/event) plus **four**
  Camera→messmass inbound endpoints (it was two at the previous stamp):
  `POST /api/integrations/camera/partners` upsert, `POST .../sso-session` mint,
  and, added since, `POST .../events/{id}/link-stats` (69146ebd, 2026-10-07)
  and `GET .../events/{id}/frame-context` (0a8f6244, 2026-10-06); all four
  call `assertCameraSecret`. Also kept: the
  shared-secret-guards-both-directions nuance, the messmass→Camera look-change
  notice (`lib/cameraThemeNotify.ts`, guide :49) and the operator-backfill token
  distinction (`link-partners` and `provision-missing` take
  `FANMASS_INTEGRATION_TOKEN`, guide :183-196, routes
  `app/api/integrations/camera/{link-partners,provision-missing}/route.ts`).
- ~~**docs/api/api-reference.md:22-25,287-297** — admin login POST + a whole
  "WebSocket API" section, both fictional.~~ FIXED: :30 documents
  `POST /api/admin/login` as 410 Gone; there is no WebSocket section.
- ~~**README.md**: v12.1.88 badge (:15); websocket start instructions (:68-73);
  NEXT_PUBLIC_WS_URL required (:87); "SSO optional, uses SSO_BASE_URL" (:100 —
  mandatory, needs client id+secret). No mention of camera/fanmass.~~ FIXED
  2026-09-28, re-checked 2026-10-11: badge v12.3.42 (:15; it was v12.3.37 at
  the previous stamp), no WebSocket or `NEXT_PUBLIC_WS_URL`, SSO-only with
  `SSO_CLIENT_ID`/`SSO_CLIENT_SECRET`/`JWT_SECRET` (:86-88, :93), and a Fleet
  section (:143) and a Fanmass Integration section (:147).

## 2. ~~The vestigial WebSocket system~~ REMOVED (code) + docs FIXED (messmass#349; re-verified @ 184d1e32, 2026-10-11; ledger 23-24)
**Code:** the WebSocket stack was not merely vestigial — it was fully DELETED in
commit c56e70af (v12.2.0, 2026-08-20): `server/` (incl. `server/websocket-server.js`),
`hooks/useWebSocket.ts`, and the `ws` + `@types/ws` deps are gone; nothing opens a
socket (no `new WebSocket(` in app, components, hooks or lib); `NEXT_PUBLIC_WS_URL`
is consumed nowhere. Live updates are REST + polling only (the unread
count polls every 30 s, `components/TopHeader.tsx:51`).
(This register's earlier "server/websocket-server.js exists (251 lines)" line was itself
stale — the file no longer exists.)
**Docs (FIXED @ 62a47a0d):** the live-server claims were removed or relabelled
"removed in v12.2.0" across README.md, docs/architecture.md (tech-stack row, deploy
target, `NEXT_PUBLIC_WS_URL`, the Real-Time Architecture block, the stat-update path),
docs/operations/ops-warp.md (start command, headline, deploy), docs/DEVELOPER-CONDUCT.md
(the never-used "Socket.io" stack item), docs/guides/guides-tutorial-getting-started.md
(realtime-collaborators claim), docs/components/components-reusable-components-inventory.md
(NotificationPanel = polling), docs/features/features-authentication.md (the
localhost:7654 CORS origin), docs/audits/system-audit-plan-2026.md +
docs/audits/settings-inventory.csv (obsolete scope/rows), and
docs/operations/operations-roadmap.md (relabelled the item as abandoned, not future).
Re-checked 2026-10-11 at the lines in ledger 24. The cleanup missed two places that
carry the same kind of stale stack claim, listed in §10.

## 3. ~~The docs:audit gate has a hole~~ FIXED (re-verified @ 184d1e32, 2026-10-11; ledger 25)
~~scripts/docs-consistency-audit.js:93,98 version-header regex matches
`**Version**: X` and `Version: X` but NOT `**Version:** X` — the exact format in
docs/features/features-authentication.md:7, docs/api/api-reference.md:7,
api-public.md:7, all frozen at 12.1.16 (June) and silently passing CI. The gate
also reads only the first 25 lines (missing architecture.md:4647's footer)~~:
`VERSION_LINE_RE` in `scripts/lib/docs-version-check.js:16` accepts every
`Version:` stamp format including `**Version:** X`, and
`scripts/docs-consistency-audit.js:111-118` scans each current doc's whole
content, header and footer. Still true: it checks path patterns, npm-script
existence, version stamps and fleet-map freshness, never factual accuracy.

## 4. STALE / MISSING (selected) (re-verified @ 184d1e32, 2026-10-11; ledger 26-31)
- docs/low-level-design.md is accurate but covers only 4 subsystems (Report Variant
  Period Selector `:11`, Mobile Admin Actions `:130`, Unified Admin Entity Forms
  `:152`, Public Report Shell `:178`) — not a low-level design of the system
  (nothing on auth/integrations/data model). Its :150 "no mechanical WHAT/WHY
  blocks" **no longer contradicts a written rule**: `docs/coding-standards.md:146`
  says the same (avoid `WHAT` / `WHY` boilerplate that repeats the name). The
  tension is with practice — 549 of 672 TS/TSX files under app/, lib/,
  components/ and hooks/ still carry a `WHAT:` comment. The 25 repo paths the
  file cites all exist.
- ~~HANDOVER.md stale by 6 patches (v12.1.89 vs .95)~~ FIXED: `HANDOVER.md:3`
  reads "Last verified: 2026-10-11 (v12.3.42 fleet release)", equal to
  `package.json`. ~~its "fanmass always the outbound caller both directions"~~
  FIXED in 410042ff: `HANDOVER.md:124-126` now says fanmass is the caller on
  every channel except the `/sync` + `/callbacks` pull.
- docs/V3/** (16 files) indexed as Active over a small live surface (16 files
  in `docs/V3` and in `docs/_audit/docs.json`; `docs/index.md:35` tags the API
  spec "(Active)").
  ~~12 routes behind a withOrgContext wrapper with a hardcoded org id~~ FIXED
  (#395, e0f0643f): 14 v3 route files; 11 go through `withOrgContext`
  (`lib/middleware/v3/orgContext.ts`), which resolves the org per user
  (`organizationIds`, else Master) with a superadmin-only `?orgId=` override
  validated against `organizations`; the other 3 use `requireAdmin`
  (metrics/sync) or `validateOrganizationAccess` (organizations/report/[id] and
  its /activities). Counted again 2026-10-11 from the route files.
- ~~docs/V3/messmass_v3_api_specification.md:22 lists `GET /api/v3/activities/{id}`
  and :99 claims `useReportData` "bridges V3 Activities"~~ FIXED 2026-09-07
  (v12.3.22): the route never existed; the hook's fallback to it was dead code
  that turned every protected event report's 401 into a JSON-parse crash. Spec
  and playbook now say so (spec :22 "Not implemented"); fallback deleted.

## 5. CURRENT (verified — the good news) (re-verified @ 184d1e32, 2026-10-11; ledger 32-34)
- **docs/design/design-system.md is the most accurate major doc** (v12.3.42 now;
  GDS/Mantine/theme all verified: Mantine 8 `:21`, TailAdmin guidance rejected
  `:31`; the 12 adapter paths in the table under `:38` equal the 12
  `localAdapters` in `gds-adoption.json`). **Correction:** this entry used to say
  the localAdapters are "cross-checked by gds:sync CI". They are not:
  `scripts/gds-sync-packages.sh` only runs `npm ls` on the three GDS packages at
  6.3.0. `npx gds-compliance check --manifest ./gds-adoption.json` does read
  `localAdapters` (`node_modules/@sovereignsquad/gds-compliance/index.js:782,909,1095,1322`),
  but nothing compares the table in design-system.md with the manifest; that stays
  a manual rule (`design-system.md:38`). The contradiction this entry used to
  record is gone: architecture.md now says TailAdmin is retired (`:3374`).
- **docs/guides/guides-tutorial-fanmass.md** is the single best integration doc
  (two-layer framing, env table `:39-41`, failure codes `:45-49`, contract name
  `:263` all match `lib/config.ts:141-143`, `lib/fanmassIntegration.ts:77,84,254`
  and `lib/aiAnalysisSummary.ts:27`) — only gap is it predates v12.1.89 (no
  dashboard-snapshot/command/rescan channels), still true.
- AI-analytics contract-versioning (`lib/aiAnalysisSummary.ts:24-25,66`, 409 on a
  different major), page-password and integration-token internals — verified at
  the entry points (`requirePageAccess` still gates the report data route,
  grants are HS256 cookies, `requireFanmassIntegrationAuth` on all 18 fanmass
  routes). `lib/pageAccess.ts` was rewritten in a5d453d1 (v12.3.39) and was not
  re-audited line by line. The distinct()/Stable-API note is true as a rule
  (`lib/mongodb.ts:13-17`, architecture.md :3847-3851) but one route breaks it
  (§10, ledger 68).

## 6. ~~Comment health~~ RESOLVED (messmass#353, re-verified @ 184d1e32, 2026-10-11; ledger 35-45)
- WHAT/WHY adherence good but uneven: integration/auth surface (lib/fanmass*,
  aiRescan, apiGuards, pageAccess, app/api/integrations/**) is best-in-repo
  (comments explain tradeoffs). ~~lib/sponsorshipHub.ts is 1432 lines with ZERO
  comments~~ FIXED: it now carries a WHAT/WHY/SOURCES header (`:1-22`)
  explaining it is the single sponsorship-hub read model behind the four
  scopes and three admin surfaces (1453 lines now). (app/api/partners/route.ts
  is guarded — F-009/#386: `requireAdmin` at `:34,333,402`,
  `requirePartnerWriteAccess` at `:169`.)
- 3 TODO/FIXME matches in a 50.7k-LOC lib/ (8 across 45k LOC at the previous
  stamp), and all three are comments that record a removed TODO
  (`lib/bitly-aggregator.ts:254,295`, `lib/bitly.ts:447`); a heuristic scan of
  `lib/` for commented-out statements (import/export/const/await lines behind
  `//`) finds none.
- ~~Comments contradicting code (9)~~ ALL RESOLVED, re-verified 2026-09-16.
  **This entry had itself drifted**: it recorded that lib/auth.ts explained its
  identical-branch ternary as "an intentional seam". That comment is gone --
  F-005 (#391) replaced the flat permission constant with a per-role table in
  lib/roles.ts, so there is no seam left to explain. A register entry that
  certifies a comment which no longer exists is the same failure the register
  was built to catch; it is corrected rather than re-stamped. app/api/me and
  app/api/images were removed (dead routes gone, phantom-cookie comments with
  them). lib/config.ts was refactored — no contradictory fallback claim, and the
  WS comment is gone. drive-folders/status route no longer exists.
  ~~cameraClient.ts's header/assert comment now names the real inbound endpoints.~~
  **Stale again** (2026-10-11): `lib/cameraClient.ts:12-14` says the check is
  reused by "every camera -> messmass inbound endpoint" and names two
  (`partners`, `sso-session`); four routes call `assertCameraSecret` since
  0a8f6244 and 69146ebd (§10, ledger 69).
  ~~lib/v3/middleware.ts uses symbolic constants (`DEFAULT_ORG_ID`/`MASTER_ORG_ID`)
  in distinct branches — no hardcoded production org ObjectId.~~ The file is gone:
  e0f0643f (#395) found its sentinel strings matched no real organization and
  deleted it; the one caller (v3/health) now uses `lib/middleware/v3/orgContext.ts`.
  The stale password-as-key comments in `lib/apiAuth.ts` (now `:65-72`) and
  `lib/users.ts` (left after 6f31990d removed that fallback) were corrected
  2026-09-28 (410042ff). The fit-in-fleet one-pager
  (docs/_audit/messmass-in-the-fleet.md) exists and now names the camera
  frame-context and link-stats endpoints. A tenth contradicting comment turned
  up in this round: `lib/rateLimit.ts:4` (§10, ledger 70).

## 7. Obsoletion queue (re-verified @ 184d1e32, 2026-10-11; ledger 46-55)
- Dead routes: ~~app/api/me, app/api/images (phantom cookies)~~ FIXED 2026-08-20
  (c56e70af, v12.2.0); the 4 legacy SSO-validate admin routes: 2 deleted
  2026-09-04 (`/api/admin/{projects,users}`, 62a47a0d, messmass#386, see §0),
  2 still queued — `app/api/admin/permissions/route.ts` and
  `app/api/admin/projects/[id]/route.ts` (both call the retired
  `{SSO_BASE_URL}/api/validate` at :16; no in-app callers). Also still queued:
  app/api/stats (no caller), app/api/admin/hashtag-style (now admin-guarded, §0;
  no caller), sports-db/lookup (no caller), debug/overview-block (no caller),
  debug/categorized-hashtags (one caller: the debug page
  `app/debug/hashtag-categories/page.tsx:37`, so it goes with that page). A
  fourth debug route, `app/api/debug/notifications`, is not on the queue (§10).
- Dead components (zero importers): ~~BlockEditor, LandingReportRoot,
  LandingValueChainSection + /api/landing-report~~ FIXED 2026-08-20 (c56e70af,
  v12.2.0); ~~HashtagInput~~ FIXED 2026-09-08 (messmass#351 leftovers, this
  change — `UnifiedHashtagInput` is the live component and was never affected).
  All five paths are absent at 184d1e32.
- Dead libs: ~~lib/webhooks.ts (474 lines, zero importers)~~ FIXED 2026-08-20
  (c56e70af); ~~app/api-docs advertised the webhook system~~ FIXED 2026-09-08
  (messmass#351, this change — nav link, feature bullet, `#webhooks` section
  and the "use webhooks instead of polling" tip removed); ~~lib/shareables/**
  (incl. passwordAuth.ts with 'admin123' fallback)~~ FIXED 2026-08-20
  (c56e70af); ~~lib/ssoClient.ts~~ FIXED 2026-09-04 (messmass#386);
  ~~duplicate lib/v3/middleware.ts~~ FIXED 2026-09-17 (deleted in e0f0643f,
  #395). Follow-on: `scripts/verify-v3-middleware.ts` still imports it (`:2`)
  and no longer runs (listed in `scripts-keep-list.md:176` only because AGENTS.md named it).
- Dead infra: ~~entire server/ dir + tracked macOS-duplicate files
  (`package 3.json`, `server/.env 3.local`, etc.); ws/@types/ws dependency~~
  FIXED 2026-08-20 (c56e70af, v12.2.0; the `websocket` package.json keyword
  followed 2026-09-08, messmass#351). **One macOS duplicate survived the
  sweep**: `app/icon 3.png` (§10). ~~~310 of 400 scripts/ unreferenced incl.
  macOS duplicates (`add-kpi-chart 3.js` …)~~ FIXED 2026-09-08 (messmass#352,
  this change): 315 of 421 tracked scripts deleted, 106 kept; derivation and
  the per-script reason in `scripts-keep-list.md`. That is the record of one
  prune: `scripts/` tracks 112 files at 184d1e32, 6 added since by their own
  changes (the comment, architecture and preflight gates and two one-off
  data scripts), none in the keep-list by design. ~~The CI forbidden-color
  carve-out did NOT clear: `gds-compliance check` still reports 71 findings,
  only 4 of them in scripts/ (all kept seeders) and 65 in app/, components/,
  lib/, hooks/ — the "24, all in scripts/" figure in ci.yml was already stale
  before the prune, so `|| true` stays.~~ FIXED 2026-09-08 (messmass#387,
  v12.3.26): all 71 findings cleared — UI colours swapped for theme.css
  tokens, data colours (chart palettes, seeded style presets, hashtag
  colours, e-mail inline styles) moved to `lib/theme/*.ts` (the checker's
  exempt lane, now also listed in `themeOwnershipPaths`); the `|| true`
  carve-out is gone and the step blocks CI.
- DO NOT treat as dead: all /api/integrations/{fanmass,camera}/** (fanmass and
  camera call them with tokens), /api/public/** (external Bearer), /api/cron/**.
  Precisely: 18 fanmass route files; 6 camera route files, of which four are
  called by the camera app behind `assertCameraSecret` (`partners`,
  `sso-session`, `events/[messmassEventId]/frame-context`,
  `events/[messmassEventId]/link-stats`) and two (`link-partners`,
  `provision-missing`) are operator backfills behind the fanmass integration
  token that no code in messmass or in the local camera and fanmass checkouts
  calls — keep them, they are curl-only by design (camera app guide :183-196).

## 8. Highest-value fixes, ranked (re-verified @ 184d1e32, 2026-10-11; ledger 56-60)
1. ~~Remove the `'development_secret'` cron fallback (auth bypass).~~ FIXED
   (messmass#347/#348, §0).
2. ~~Guard/delete the 8 google-sheet + hashtag-style unauthenticated
   mutations.~~ FIXED (§0; the google-sheet routes call `requireSession()`,
   hashtag-style `requireAdmin()` since c02f4b6f).
3. ~~Fix the docs:audit version regex to accept `**Version:** X` (3 canonical
   docs frozen at 12.1.16 pass CI today).~~ FIXED (§3).
4. ~~Delete server/, lib/webhooks.ts, lib/shareables/, 4 dead components,
   app/api/{me,images}; drop ws/@types/ws; strip WebSocket claims from the 10
   doc locations in §2.~~ FIXED: code 2026-08-20 (c56e70af, v12.2.0; 3 of the
   4 components), docs 2026-09-04 (62a47a0d, §2), HashtagInput + the api-docs
   webhook advertisement 2026-09-08 (messmass#351, this change).
5. ~~Rewrite the SSO/auth guide + features-authentication.md against
   app/api/auth/sso/callback/route.ts (both instruct readers to use a 410
   endpoint).~~ FIXED (messmass#349, completed 2026-09-28; §1b).

## 9. Wave 2026-09-16 — documentation audit (Phase 5) and the sweeps it triggered (re-verified @ 184d1e32, 2026-10-11; ledger 61-66)

Twelve findings (F-025 … F-036) closed, plus four earlier security findings.
Recorded here because several corrected claims this register had certified.

**architecture.md: 4,665 → 3,799 lines** (3,877 at 184d1e32, after the
camera, dependency and auth sections were added). 43 falsifiable claims were verified
false; roughly 85% of its file-path and line-count claims failed. Deleted as
fiction: the Page Styles System (487 lines of invented endpoints and a hook),
the Formula Validation System (built on a component that does not exist), the
PDF export section describing html2canvas and jsPDF (neither is a dependency),
the chart-type-to-component mapping, and nine "Future Enhancements" blocks.
293 lines of narrative moved to `docs/archive/architecture-changelog-2026-09.md`
(exists).
Its route inventory and module catalogue are now **generated**, not written —
`npm run architecture:check` fails when they drift.

**Five CI gates came out of it**, each bound to how this documentation actually
went wrong, so the drift fails a build instead of accumulating:

| Gate | Catches |
|---|---|
| `npm run comments:check` | a comment citing a path that no longer resolves |
| `npm run comments:versions` | a comment claiming an unshipped version or an overdue removal |
| `npm run architecture:check` | the generated sections drifting from the filesystem |
| `tests/comment-counts-match-code.test.ts` | a stated cardinality contradicting the live collection |
| `tests/admin-only-comments-are-enforced.test.ts` | a route claiming admin-only while guarding on session alone |

All five exist (`package.json:47,48,50`; the two tests under `tests/`).
Note what they do not catch: `comments:check` accepts a comment that cites an
existing path while naming too few of them (§10, ledger 69).

**Security posture moved materially.** F-003: the middleware `/admin/**` gate
tested cookie *presence* — `admin-session=x` passed. It now verifies HS256 via
Web Crypto (`lib/edgeSessionToken.ts`; the existing validator cannot load in the
Edge runtime; `middleware.ts:35,55`). F-025: 26 routes documented admin-only and enforced no role.
Five routes accepted anonymous writes, three demonstrated live against the
running app, not inferred — including `/api/hashtag-categories`, which was not
unguarded but carried a local `validateAdminAccess()` returning true whenever an
`admin-session` cookie was merely present, i.e. F-003 re-implemented in one file.
(Now `requireAdmin()` on its three mutating handlers,
`app/api/hashtag-categories/route.ts:179,275,383`.)

**Dead code**: 1,610 lines across five modules, each with authoritative-sounding
comments and zero importers. Plus 70 unreachable CSS selectors, and 86 applied
classes that styled nothing — Tailwind names in a repo with no Tailwind, which
is why every `alert alert-danger` banner rendered as bare text. (Historical
counts; not re-measurable from what the register names.)

~~**Still open, deliberately**: F-011 (rotate the two service-account API keys —
`apiKeyHash` already exists and neither key has ever been used), F-004 (v3 org
scoping needs a tenancy policy before it can resolve from `organizationIds`),
F-007 (202 orphaned `page_passwords` rows — a production delete).~~ All three
closed 2026-09-16/17: F-011 by 6f31990d (#397, the plaintext passwords that
doubled as API keys retired; `apiKeyHash` is the only path), F-004 by e0f0643f
(#395, per-user org resolution plus a validated superadmin override), F-007 by
e098deaa (#390, the 202 orphaned rows removed). The three commits exist; the
data effect of e098deaa was not re-read, because this audit reads no
production database.

## 10. New drift found 2026-10-11 (re-verified @ 184d1e32; ledger 68-80)
Found while re-reading the entries above. Each has its proof; none is fixed by
the change that records it.

68. **A route uses `distinct()` on a strict Stable API connection.**
   `GET /api/bitly/recalculate` calls `.distinct('projectId')`
   (`app/api/bitly/recalculate/route.ts:202-204`, added in 423894e2,
   2026-09-16, messmass#283). The client is `serverApi: { version: '1', strict:
   true }` (`lib/mongodb.ts:13-17`), architecture.md :3847-3851 says
   `distinct()` is not part of that API and fails with `APIStrictError`, and
   `docs/operations/operations-release-notes.md:3411-3412` records that failure
   on this connection (error 323; the AI analytics code was changed to `$group`).
   It is the only `.distinct(` call in app/, lib/, components/ and hooks/. Not
   executed here (no database reads), so the failure is taken from the recorded
   error, not reproduced. Reach: nothing in the admin UI calls this GET
   (`app/admin/bitly/page.tsx:590` only POSTs), so the orphan count in the
   status response is what is at risk. Fix shape: a `$group` aggregation.
69. **`lib/cameraClient.ts:12-14` names 2 of 4 camera inbound endpoints.** The
   comment says `assertCameraSecret` is "reused by every camera -> messmass
   inbound endpoint" and lists `partners` and `sso-session`; `frame-context`
   (0a8f6244) and `link-stats` (69146ebd) call it too. `comments:check` cannot
   see this, because both cited paths still exist.
70. **`lib/rateLimit.ts` contradicts itself and the doc.** The header
   (`lib/rateLimit.ts:4`) says "token bucket algorithm with sliding window
   tracking"; the code is a fixed-window counter that resets when `resetTime`
   passes (`:156-180`), which is what architecture.md :3551 says. :3551 also
   lists six endpoint classes (auth, write, read, public, contact form, PDF
   export); `RATE_LIMITS` has seven, `EDITOR_SAVE` (`lib/rateLimit.ts:58`) was
   added in a5d453d1 and is documented in the Security Enhancements section.
71. **The public rate-limit class is keyed on a deleted route.**
   `lib/rateLimit.ts:280-282` gives `RATE_LIMITS.PUBLIC` to paths starting with
   `/stats/` or `/hashtag/`; `app/stats` does not exist (the `stats` page type
   and its 202 password rows were retired, e098deaa). The public report pages
   (`/report/*`, `/partner-report/*`, both in the matcher, `middleware.ts:174-175`) are not
   matched, so they take the read budget (500 per minute), not the public one
   (60). The documentation describes the class as written, so doc and code
   agree; both describe a route that is gone.
72. **architecture.md :3491 gives a dead URL.** "View:
   `https://messmass.com/stats/<uuid>`": there is no `app/stats`, and the same
   section says the view address is `/report/[slug]` (:3463).
73. **architecture.md :3506 names a collection that does not exist.** The
   schema row `variableGroups` matches no collection in code; the code uses
   `variablesGroups` (`lib/variableMerge.ts:271`) and `variables_groups`
   (`:278`), and `variableGroups` appears nowhere in app, lib, components,
   hooks, scripts or tests.
74. **A tracked macOS duplicate remains: `app/icon 3.png`.** Byte-identical to
   `app/icon.png` (`cmp`, 867 bytes each), tracked since c27f58ce (2025-08-28).
   The §7 sweep removed the other duplicates.
75. **Two more stack claims list Tailwind (and Socket.io).**
   `READMEDEV.md:315` — "Next.js App Router, Vercel, MongoDB, Tailwind,
   Mongoose, Socket.io"; `docs/DEVELOPER-CONDUCT.md:70` — "…MongoDB, Tailwind,
   Mongoose". `package.json` has neither `tailwindcss` nor `socket.io`; the UI
   stack is GDS on Mantine 8. §2 certified the Socket.io removal from
   DEVELOPER-CONDUCT only.
76. **A login-page message for a code nothing emits.**
   `app/admin/login/page.tsx:17` maps `no_account` to "No {messmass} account
   for this identity yet"; the SSO callback no longer redirects with it
   (`app/api/auth/sso/callback/route.ts:5` says so; it uses `no_access`, `:89,102`).
77. **A comment lists the deleted page type.** `lib/pagePassword.ts:27`:
   "Type of page (stats, edit, filter)"; `PageType` is eight other values
   (`:14-22`) and has no `stats`.
78. **A debug route with no caller is not on the queue.**
   `app/api/debug/notifications/route.ts` is admin-guarded (`getAdminUser`,
   `:17`) and nothing in app, components, hooks or lib calls it.
79. **A stale cross-reference in the fleet map.**
   `docs/_audit/fleet-architecture.md:279` ends "(contradicts
   architecture.md:3755-3756)"; the sentence is at architecture.md :3773-3774
   now. Not edited here: the fleet map has its own stamps and owner.
80. **The CSP still allows a WebSocket service nothing uses.**
   `middleware.ts:134` lists `wss://*.pusher.com` ("Pusher WebSockets") in
   `connect-src`; there is no Pusher code or dependency (grep over app, lib,
   components, hooks, `package.json`).
