# messmass drift register — fleet audit P3, first edition

Generated 2026-08-19 against HEAD `6d28c7f3` (v12.1.95) by the fleet
documentation audit (messmass#345; method in messmass#344). Every claim
carries file:line evidence. Verdicts: WRONG / STALE / MISSING / CURRENT.
This file is intentionally header-less so the docs:audit version gate does
not bind it to a version it is not about.
Enforcement live: CI runs `inventory:check` (`scripts/fleet-audit-inventory.py
--check`) since 2026-09-08 (messmass#355; rule in `contract-first-rule.md`).

**Re-verification and fixes 2026-10-11 (re-verified @ 96dd913c, v12.3.42).**
Every entry below was checked again on origin/main at 96dd913c, 5 commits after
the previous stamp (184d1e32, the earlier round of the same day). Those 5 commits
changed no application code (`git diff --stat 184d1e32 96dd913c`: the inventory
scanner and its JSON output, the CI workflow's action versions, three guides and
the tutorials index, one hand-over paragraph and release-notes entries), so the
claims about code were re-read where a cited file changed: `HANDOVER.md` (entry
28, lines moved by six), the release notes (entry 68, moved by fifteen),
`scripts/fleet-audit-inventory.py` (the stamp constants, below) and
`docs/_audit/*.json` (the counts in entries 16, 29 and 53 were taken again). The
pull request that records this round (messmass#470) also fixed the documentation
and small-comment items the previous round found (entries 13 to 17, 69 to 77 and
79, with the new entries 84 and 85 found while doing it) and re-reads every claim
it wrote against the code. Line numbers in this file are for 96dd913c, except for
the files that pull request edited, `docs/architecture.md`, `lib/rateLimit.ts`,
`lib/cameraClient.ts`, `app/admin/login/page.tsx` and `middleware.ts`, which are
for its tree (the pull request adds about ninety lines to `architecture.md`). The
stamps on this page are read by `freshness_check` in
`scripts/fleet-audit-inventory.py` (`STAMP_RE` at :104): a stamp more than 30
commits behind HEAD warns (:95), more than 90 fails `npm run inventory:check`
(:102), and a stamp that is not an ancestor of HEAD fails as well (:419-421), which
is why this stamp is a commit on main and not a commit of the pull request. A
shallow checkout skips the stamp part (:402-406), so CI, which checks out with
depth 1, does not measure it; it is measured on a full clone. Only the inventory
check measures the stamps on this page; the freshness part of `docs:audit` reads
`fleet-architecture.md` alone (`scripts/docs-consistency-audit.js:134`).
Moving the sha without re-reading the entries defeats the gate, which is why
this round changed text and added entries, not only the stamp.

Status words in the ledger: TRUE = still true as written; CHANGED = still holds
but the text, number or line had to be updated; FIXED = was open, now fixed;
NEW = found by a re-verification, still open; NOT RE-CHECKABLE = a historical
figure the register does not name enough to measure again. The pull request that
records this round fixes the entries marked FIXED in messmass#470 (and changes only
documentation, comments, `lib/rateLimit.ts` and two files removed as unused); the
entries still NEW (68, 78, 81, 82, 83) need their own code or decision.

## Re-verification ledger @ 96dd913c (2026-10-11)

| No. | Entry | Status | Proof at 96dd913c |
|---|---|---|---|
| 1 | Cron fallback `development_secret` gone; bare-template variants closed (§0) | TRUE | `app/api/cron/analytics-aggregation/route.ts:51-58`; `app/api/bitly/sync/route.ts:189-193`; `app/api/cron/bitly-refresh/route.ts:51-55`. `google-sheets-sync/route.ts:31-43` fails closed in production only (an unset secret passes outside production) |
| 2 | Mutating routes guarded: 8 google-sheet routes, hashtag-style; read sweep (§0) | CHANGED | 8 routes still call `requireSession()` (`.../google-sheet/*/route.ts`, import + one call each); hashtag-style uses `requireAdmin()` (`app/api/admin/hashtag-style/route.ts:21,64`), not `requireSession`; `KNOWN_UNGUARDED_READS` still by-design only (`tests/api-mutation-auth.test.ts:104-140`); the two camera `[debt]` entries left `KNOWN_UNGUARDED` in 0a8f6244 |
| 3 | Bitly cron fires: GET delegates to POST (§0) | TRUE | `app/api/bitly/sync/route.ts:375-377`; `vercel.json` cron `/api/bitly/sync` at `0 3 * * *` |
| 4 | Two stale-SSO admin routes survive (§0) | TRUE | `app/api/admin/permissions/route.ts:16`, `app/api/admin/projects/[id]/route.ts:16` call `{SSO_BASE_URL}/api/validate`; no caller in app, components, hooks, lib, contexts, tests, scripts |
| 5 | architecture.md dependency versions (§1) | CHANGED | React ^19.2.6 `:3373`, uuid `:3377` (now ^14.0.3, was ^14.0.0), Node `:3392`, Next 15.5.27 `:3372`, no jsPDF row, `:3379`; all equal `package.json` |
| 6 | architecture.md WebSocket row (§1) | TRUE | only the removed-in-v12.2.0 block, `:3574-3591` |
| 7 | architecture.md "No External UI Library" / TailAdmin (§1) | TRUE | `:3384` (GDS on Mantine 8, TailAdmin retired); `@mantine/core` ^8.3.18 |
| 8 | architecture.md password-based admin login (§1) | TRUE | `:3400`, `:3407`, `:3466`; `app/api/admin/login/route.ts:20-25` returns 410 |
| 9 | architecture.md rate limiting, CSRF, middleware claims (§1) | CHANGED | rate limiting `:3613` (`middleware.ts:70-83`), CSRF `:3607` (`lib/csrf.ts:4`, `middleware.ts:88-98`), middleware gate `:3610` (`middleware.ts:35,55`, `lib/edgeSessionToken.ts:75`); line numbers moved, and the rate limiting item now lists all seven rate-limit classes (entry 70, fixed) |
| 10 | architecture.md "Edge Functions" (§1) | TRUE | `:3450`; no `runtime = 'edge'` in app, lib or `middleware.ts`; 26 routes set `runtime = 'nodejs'` |
| 11 | architecture.md `NEXT_PUBLIC_WS_URL` / `ADMIN_PASSWORD` env, `useWebSocket` (§1) | TRUE | env block `:3452-3466`; hook only at `:3589`, file absent (`ls hooks/useWebSocket.ts`) |
| 12 | architecture.md header vs footer version; auth sections (§1) | TRUE | `:7` and `:3967` both 12.3.42 = `package.json`; Authentication Model `:3403-3412`, Security Measures `:3604-3613` |
| 13 | "Project Slug… No Passwords Required" (§1) | FIXED | rewritten in messmass#470: `docs/architecture.md:3468` ("Project Slug Access Control"; item 4 `:3480` says page passwords are optional and enforced on the server, item 5 `:3481` says nothing regenerates a slug); proof in code: `app/api/projects/stats/[slug]/route.ts:18` (`requirePageAccess`), `app/api/projects/edit/[slug]/route.ts:46` (`requirePageAccessDecision`), `app/report/[slug]/layout.tsx` (`ServerPageGate`), `app/api/projects/route.ts:804` (`generateProjectSlugs`, the only place slugs are made) |
| 14 | "never have a runtime dependency on fanmass being reachable" (§1) | FIXED | rewritten in messmass#470: `docs/architecture.md:3833-3839` (fanmass can be offline, reads keep working) and "The one blocking call" `:3870`; proof in code: `app/api/integrations/fanmass/events/[eventId]/sync/route.ts:37`, `.../callbacks/route.ts:31` -> `lib/fanmassIntegration.ts:337` -> `fanmassFetch` `:250` (15 s abort `:258`); the only call to `fanmassFetch` is `:343` |
| 15 | "Two channels across the boundary" (§1) | FIXED | rewritten in messmass#470: "Channels across the boundary" `docs/architecture.md:3841` lists the push, poll and ack channels and the provisioning routes; proof: 18 route files under `app/api/integrations/fanmass`, all call `requireFanmassIntegrationAuth`; `fleet-architecture.md:229` (E2: six push + two poll/ack channels) |
| 16 | DB schema summary omits live collections (§1) | FIXED | `docs/architecture.md:3503` ("Database Schema Summary"): the core table is corrected (`variables_metadata`, `variablesGroups`, `aggregation_jobs` replace the three names the code does not open, entry 85) and a second table (`:3523`) lists the 46 other collections that `.collection('<name>')` calls in app/, lib/, components/ and hooks/ open (59 names in all); `collections.json` lists 71 names in all (scripts included) |
| 17 | No CORS section in architecture.md (§1) | FIXED | "6. CORS (`lib/cors.ts`)" `docs/architecture.md:2447`; proof: `lib/cors.ts` used by `middleware.ts:10` and 4 `app/api/public/**` routes (`applyCorsHeaders`) |
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
| 28 | HANDOVER.md stale by 6 patches; fanmass direction sentence (§4) | FIXED | `HANDOVER.md:3` "Last verified: 2026-10-11 (v12.3.42 fleet release)"; direction sentence corrected at `:130-132` (410042ff; moved from `:124-126`) |
| 29 | docs/V3 has 16 files, indexed as Active (§4) | TRUE | 16 files in `docs/V3`; 16 in `docs/_audit/docs.json`; `docs/index.md:35` "(Active)" |
| 30 | v3 org scoping (§4) | TRUE | 14 `app/api/v3` route files; 11 use `withOrgContext`; metrics/sync `requireAdmin`; 2 organizations/report files `validateOrganizationAccess` |
| 31 | V3 spec: `GET /api/v3/activities/{id}` not implemented (§4) | TRUE | `docs/V3/messmass_v3_api_specification.md:22`; no `app/api/v3/activities/[id]/route.ts` |
| 32 | design-system.md is the most accurate doc (§5) | CHANGED | version now 12.3.42 (`:7`); Mantine 8 `:21`, no TailAdmin guidance `:31`; its 12 adapter paths equal the 12 `localAdapters` of `gds-adoption.json`, but no gate compares the two (the old "cross-checked by gds:sync" was wrong: `scripts/gds-sync-packages.sh` only runs `npm ls` on the three GDS packages at 6.3.0; `gds-compliance check` reads `localAdapters`); the old contradiction with architecture.md is gone (`:3384`) |
| 33 | fanmass tutorial is the best integration doc (§5) | TRUE | env names `:39-41`, codes `:45-49` match `lib/config.ts:141-143`, `lib/fanmassIntegration.ts:77,84,254`; contract name `:263` = `lib/aiAnalysisSummary.ts:27`; gap remains (no dashboard-snapshot, command or rescan text) |
| 34 | AI contract versioning, `distinct()` note, page-password and integration-token internals (§5) | CHANGED | contract gate `lib/aiAnalysisSummary.ts:24-25,66`; Stable API strict `lib/mongodb.ts:13-17`; grant mechanics re-read (entry 19); `lib/pageAccess.ts` was rewritten in a5d453d1 and only its entry points and grant facts were re-read; one route breaks the `distinct()` rule (entry 68) |
| 35 | WHAT/WHY adherence; `lib/sponsorshipHub.ts` header (§6) | TRUE | `lib/sponsorshipHub.ts:1-22` WHAT/WHY/SOURCES header; 1453 lines |
| 36 | `app/api/partners/route.ts` guarded (§6) | TRUE | `requireAdmin` `:34,333,402`; PUT `requirePartnerWriteAccess` `:169` |
| 37 | TODO/FIXME count; commented-out code (§6) | CHANGED | 3 matches in `lib/` (50,720 lines), all in comments that record a removed TODO: `lib/bitly-aggregator.ts:254,295`, `lib/bitly.ts:447`; heuristic scan for commented-out statements in `lib/`: 0 hits |
| 38 | `lib/auth.ts` "intentional seam" comment gone (§6) | TRUE | no "seam" in `lib/auth.ts`; per-role table `lib/roles.ts:32` |
| 39 | `app/api/me` and `app/api/images` removed (§6) | TRUE | both paths absent |
| 40 | `lib/config.ts` WS comment gone (§6) | TRUE | no websocket text in `lib/config.ts` |
| 41 | `drive-folders/status` route gone (§6) | TRUE | `app/api/drive-folders` holds only `route.ts` and `[linkId]` |
| 42 | `lib/cameraClient.ts` comment names the real inbound endpoints (§6) | TRUE | fixed again in messmass#470: `lib/cameraClient.ts:12-14` names `partners`, `sso-session`, `frame-context` and `link-stats`, the four routes that call `assertCameraSecret` (entry 69) |
| 43 | `lib/v3/middleware.ts` gone; caller uses orgContext (§6) | TRUE | file absent; `app/api/v3/health/route.ts` uses `withOrgContext` |
| 44 | password-as-key comments corrected (§6) | TRUE | `lib/apiAuth.ts:65-72`, `lib/users.ts` (410042ff) |
| 45 | fit-in-fleet one-pager exists (§6) | TRUE | `docs/_audit/messmass-in-the-fleet.md`, now also names frame-context and link-stats |
| 46 | `app/api/me`, `app/api/images` dead routes removed (§7) | TRUE | same proof as entry 39 |
| 47 | Two SSO-validate routes still queued for deletion (§7) | TRUE | same proof as entry 4 |
| 48 | Also queued: `app/api/stats`, hashtag-style, sports-db/lookup, debug routes (§7) | CHANGED | all five still exist; `debug/categorized-hashtags` has one caller, `app/debug/hashtag-categories/page.tsx:37`; a fourth debug route is not queued (entry 78) |
| 49 | Dead components removed (§7) | TRUE | `BlockEditor`, `LandingReportRoot`, `LandingValueChainSection`, `HashtagInput`, `app/api/landing-report` absent; `UnifiedHashtagInput` live |
| 50 | Dead libs removed; api-docs webhooks gone (§7) | TRUE | `lib/webhooks.ts`, `lib/shareables`, `lib/ssoClient.ts`, `lib/v3/middleware.ts` absent; no "webhook" in `app/api-docs/page.tsx` |
| 51 | `scripts/verify-v3-middleware.ts` imports a deleted file (§7) | TRUE | `scripts/verify-v3-middleware.ts:2`; kept by `docs/_audit/scripts-keep-list.md:176` |
| 52 | Dead infra removed: `server/`, macOS duplicates, `ws`, keyword (§7) | TRUE | `server/` and `package 3.json` absent, no `websocket` keyword; the last duplicate, `app/icon 3.png`, was removed in messmass#470 (entry 74); `git ls-files | grep -E ' [0-9]\.[a-z]+$'` finds nothing |
| 53 | scripts prune: 315 of 421 deleted, 106 kept (§7) | CHANGED | the prune record stands (`scripts-keep-list.md:43-44`); `scripts/` now tracks 112 files, 6 added later by their own changes |
| 54 | gds-compliance carve-out cleared (§7) | TRUE | `.github/workflows/ci.yml` runs `npx gds-compliance check --manifest ./gds-adoption.json` with no `|| true`; the check passes in this round's run |
| 55 | Do not treat integration routes as dead (§7) | CHANGED | 6 camera route files (4 camera-called behind `assertCameraSecret`, 2 operator routes behind the fanmass token that no code in messmass or in the local camera and fanmass checkouts calls); 18 fanmass routes |
| 56 | Fix 1: cron fallback (§8) | TRUE | same proof as entry 1 |
| 57 | Fix 2: google-sheet and hashtag-style guards (§8) | TRUE | same proof as entry 2; `c02f4b6f` exists |
| 58 | Fix 3: docs:audit regex (§8) | TRUE | same proof as entry 25 |
| 59 | Fix 4: dead code and WebSocket claims (§8) | TRUE | same proof as entries 23, 24, 49, 50 |
| 60 | Fix 5: SSO guide and features-authentication (§8) | TRUE | same proof as entries 18, 19 |
| 61 | architecture.md 4,665 -> 3,799 lines; fiction deleted (§9) | CHANGED | 3,877 lines at 96dd913c, 3,968 after messmass#470 (`wc -l docs/architecture.md`) |
| 62 | Changelog archived (§9) | TRUE | `docs/archive/architecture-changelog-2026-09.md` exists |
| 63 | Five CI gates (§9) | TRUE | `package.json:47,48,50`; `tests/comment-counts-match-code.test.ts`, `tests/admin-only-comments-are-enforced.test.ts`; run results in the pull request |
| 64 | F-003 / F-025 security posture (§9) | TRUE | `middleware.ts:35,55`; `lib/edgeSessionToken.ts:2,75`; `app/api/hashtag-categories/route.ts:40-48,179,275,383` (`requireAdmin`) |
| 65 | Dead code figures: 1,610 lines, 70 selectors, 86 classes (§9) | NOT RE-CHECKABLE | historical counts of a finished sweep; the modules and classes are not named, so there is nothing to measure again |
| 66 | F-011, F-004, F-007 closed (§9) | TRUE | 6f31990d, e0f0643f, e098deaa exist; `lib/apiAuth.ts:65-72`; `lib/middleware/v3/orgContext.ts`; the effect of e098deaa on the production data was not re-read (no production database reads in this audit) |
| 67 | Header: CI enforces `inventory:check` (header) | TRUE | `.github/workflows/ci.yml` step `npm run inventory:check`; `package.json:85` |
| 68 | `GET /api/bitly/recalculate` calls `distinct()` under the strict Stable API | NEW | still open at 96dd913c (a behaviour fix, not a documentation one); see §10 |
| 69 | `lib/cameraClient.ts:12-14` names 2 of 4 camera inbound endpoints | FIXED | comment now names all four (`lib/cameraClient.ts:12-14`); see §10 |
| 70 | `lib/rateLimit.ts:4` header contradicts the code; architecture.md lists 6 of 7 classes | FIXED | header `lib/rateLimit.ts:4-10` and the `checkRateLimit` comment (`:162-165`) now say fixed window; `docs/architecture.md:2335-2346` and `:3613` list all seven classes; see §10 |
| 71 | public rate-limit class keyed on the deleted `/stats/` route | FIXED | `lib/rateLimit.ts:291-293,318` (`isPublicPagePath`: `/report/`, `/partner-report/`, `/filter/`, `/hashtag/`; GET and HEAD only); reads 500 -> 120 (`:85`); `tests/rate-limit-classes.test.ts`; see §10 |
| 72 | architecture.md example URL uses the deleted `/stats/` route | FIXED | `docs/architecture.md:3500` now `/report/<uuid>`; see §10 |
| 73 | architecture.md names a collection `variableGroups` that does not exist | FIXED | `docs/architecture.md:3517` (`variablesGroups`); see §10 and entry 85 |
| 74 | `app/icon 3.png` tracked macOS duplicate | FIXED | removed in its own commit; the build registers only `/icon.png/route` (`.next/server/app-paths-manifest.json`); see §10 |
| 75 | `READMEDEV.md:315` and `docs/DEVELOPER-CONDUCT.md:70` list Tailwind (and Socket.io) | FIXED | both lines now name GDS on Mantine 8; `package.json` has neither `tailwindcss` nor `socket.io`; see §10 |
| 76 | `app/admin/login/page.tsx` maps `no_account`, a code nothing emits | FIXED | entry removed in its own commit; see §10 and entry 82 |
| 77 | `lib/pagePassword.ts:27` comment lists the deleted `stats` page type | FIXED | comment now points to `PageType` (`lib/pagePassword.ts:14-22`); see §10 |
| 78 | `app/api/debug/notifications` has no caller and is not queued | NEW | kept on purpose: no caller in code, but `docs/architecture.md:1904,1998` name it as the troubleshooting URL for notifications, so it is a manual tool; the decision to delete it is the owner's; see §10 |
| 79 | `fleet-architecture.md:279` cites architecture.md lines that moved | FIXED | the sentence now names the architecture.md section ("The one blocking call", `docs/architecture.md:3870`) instead of line numbers; see §10 |
| 80 | `middleware.ts:134` CSP still allows `wss://*.pusher.com` | CHANGED | not removed, and the entry was wrong: the allowance is the Vercel toolbar's WebSocket (Vercel documents `connect-src https://vercel.live wss://ws-us3.pusher.com` for the toolbar and Comments), next to the `vercel.live` entries of the same policy; the comment at `middleware.ts:134` now says so; see §10 |
| 81 | `app/admin/events/ProjectsPageClient.tsx` has no importer and tells the user "Stats Link: /stats/<slug>" | NEW | see §10 |
| 82 | `app/admin/login/page.tsx` maps two more codes nothing emits and misses one that is emitted | NEW | see §10 |
| 83 | `/admin/project-partners` still writes and reads only the legacy `partner1` / `partner2` | NEW | see §10 (messmass#430) |
| 84 | `docs/features/features-authentication.md` showed a hard-coded CORS origin list; architecture.md's middleware section said it sets the CSRF cookie | FIXED | found while writing the CORS section (entry 17); see §10 |
| 85 | architecture.md's schema table also named `variablesConfig` and `aggregation_logs`, which the app does not open | FIXED | found while fixing entry 73; see §10 |

Counts: 85 entries: 47 TRUE, 14 CHANGED, 18 FIXED, 1 NOT RE-CHECKABLE and 5 NEW
(still open: 68, 78, 81, 82, 83). At the previous stamp: 67 earlier entries (45
TRUE, 15 CHANGED, 3 STILL WRONG, 2 STILL MISSING, 1 FIXED, 1 NOT RE-CHECKABLE)
and 13 NEW entries.

## 0. Behavior findings escalated out of the docs audit (see messmass#347)
**FULLY RESOLVED via messmass#347 + messmass#348 (2026-09-03) + messmass#386
(2026-09-04)** (re-verified @ 96dd913c, 2026-10-11; ledger 1-4):
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
  repaired. **Correction (2026-09-28, still true at 96dd913c):** two more
  routes with the same pattern survive — `app/api/admin/permissions/route.ts:16`
  and `app/api/admin/projects/[id]/route.ts:16` still call the retired
  `{SSO_BASE_URL}/api/validate` (the endpoint found above to always 401) and
  have no in-app callers (grep over app, components, hooks, lib, contexts,
  tests and scripts, 2026-10-11). Queued for deletion in §7.

## 1. docs/architecture.md architectural claims (re-verified @ 96dd913c, 2026-10-11; ledger 5-17)
The file is 3,968 lines in the tree of the pull request that records this round
(3,877 at 96dd913c, 3,859 at the stamp before; fiction deleted and the changelog
archived in #408/#409); line numbers below are for that tree.
- ~~Dependency versions all wrong (React 18.3.1, Node ≥18, jsPDF 3.0.1, uuid
  11.1.0)~~ FIXED: React ^19.2.6 (:3373), uuid ^14.0.3 (:3377; ^14.0.0 at the
  previous stamp), Node >=24.0.0 <25.0.0 (:3392); no jsPDF row, and :3379
  states there is no html2canvas/jsPDF path. `package.json` agrees on all of
  them.
- ~~"WebSocket (ws) — real-time client-server communication"~~ FIXED: the only
  WebSocket text is the "Removed in v12.2.0" historical block (:3574-3591).
- ~~"No External UI Library" / "TailAdmin V2"~~ FIXED: GDS on Mantine 8 (:3384).
- ~~"Password-Based: admin login with bcrypt"~~ FIXED: SSO-only, 410 noted
  (:3400, :3407, :3466).
- ~~Rate limiting "(To be implemented)"; CSRF "SameSite attribute";
  "Middleware validates session on all protected routes"~~ FIXED: rate
  limiting implemented (:3613), CSRF double-submit (:3607), and :3610 now
  states what middleware checks (HS256 signature + expiry of `admin-session`
  for `/admin/**` and `/dashboard/**`, F-003) and that role checks stay in
  each route. :3613 listed six rate-limit classes where the code has seven; it now
  lists all seven (§10, ledger 70, FIXED).
- ~~"Edge Functions: routes on Vercel Edge"~~ FIXED: Node.js serverless runtime,
  none declare `'edge'` (:3450).
- ~~`NEXT_PUBLIC_WS_URL` and `ADMIN_PASSWORD` required; `hooks/useWebSocket.ts`~~
  FIXED: neither is in the env block (:3452-3466); the hook appears only in the
  removed-in-v12.2.0 block.
- ~~Header Version vs footer Version self-contradictory; no section on SSO,
  camera, the auth layers, CSRF or rate limiting~~ FIXED: header :7 and footer
  :3967 agree; "Authentication Model" (:3403-3412) covers SSO, page passwords,
  machine tokens, stakeholder sessions and the camera bridge (now including
  the link-stats endpoint, :3412); CSRF and rate limiting are in "Security
  Measures" (:3604-3613).
- ~~"Project Slug… No Passwords Required" (also "password-less access" and "no
  session/auth required")~~ FIXED (messmass#470): the section ("Project Slug
  Access Control", `docs/architecture.md:3468`) now says a slug is a bearer link
  only while the page has no password, that `page_passwords` plus
  `requirePageAccess` / `requirePageAccessDecision` gate
  `/api/projects/{stats,edit}/[slug]` (`app/api/projects/stats/[slug]/route.ts:18`,
  `app/api/projects/edit/[slug]/route.ts:46`) and `app/report/[slug]/layout.tsx`
  renders the gate, and that nothing regenerates a slug (the old "Revocable:
  regenerate slugs" and "Simple revocation" lines had no code behind them: slugs
  are made only by `generateProjectSlugs`, `app/api/projects/route.ts:804`). The
  same file says so at :3401 and :3408.
- ~~"messmass must therefore never have a runtime dependency on fanmass being
  reachable"~~ FIXED (messmass#470): `docs/architecture.md:3833-3839` says fanmass
  can be offline and every read surface keeps working, and "The one blocking
  call" (`:3870`) names the exception: `/sync` and `/callbacks` call
  `syncFanmassAnalytics` (`app/api/integrations/fanmass/events/[eventId]/sync/route.ts:37`,
  `.../callbacks/route.ts:31`, `lib/fanmassIntegration.ts:337`), which calls
  `fanmassFetch` (:250, abort after 15 s at :258; its only call is :343).
  Unreachable fanmass ends in `handleRouteError` (`:434`), 500 `INTERNAL_ERROR`
  after at most 15 s; an unset `FANMASS_BASE_URL` is 503 `FANMASS_NOT_CONFIGURED`.
- ~~"Two channels across the boundary"~~ FIXED (messmass#470): "Channels across the
  boundary" (`docs/architecture.md:3841`) lists the six pushes, the two poll and
  ack pairs, the surrounding routes and the provisioning routes of the 18 route
  files under `app/api/integrations/fanmass/**` (each calls
  `requireFanmassIntegrationAuth`); `fleet-architecture.md` (:229) is the fanmass
  side (six push channels plus two poll/ack channels).
- ~~The DB schema summary lists 13 collections~~ FIXED (messmass#470): the table
  (`docs/architecture.md:3503`) keeps the core collections and now says it is not
  the whole schema; a second table (`:3523`) lists the 46 other names that
  `.collection('<name>')` calls open over app/, lib/, components/ and hooks/ (59
  names in all, 49 of them absent from the old table; three of the old rows were
  wrong, entries 73 and 85), with one file that opens each; `collections.json`
  (71 names, scripts included, checked by `npm run inventory:check`) is named as
  the complete list.
- ~~There is no CORS section in architecture.md~~ FIXED (messmass#470): "6. CORS
  (`lib/cors.ts`)" (`docs/architecture.md:2447`) describes `ALLOWED_ORIGINS` (exact
  origins; localhost only when unset), the headers `buildCorsHeaders` sets, where
  it applies (`middleware.ts:10`, and `applyCorsHeaders` in the four
  `app/api/public/**` routes: partners, partners/[id], partners/[id]/events,
  events/[id]) and that it binds browsers only. The same section list (5) now
  matches the real order of `middleware.ts` (the old text said it sets the CSRF
  cookie and logs the start of every request; it does neither, entry 84).

## 1b. ~~WRONG~~ FIXED (messmass#349, re-verified @ 96dd913c, 2026-10-11) — guides and feature docs (ledger 18-22)
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

## 2. ~~The vestigial WebSocket system~~ REMOVED (code) + docs FIXED (messmass#349; re-verified @ 96dd913c, 2026-10-11; ledger 23-24)
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

## 3. ~~The docs:audit gate has a hole~~ FIXED (re-verified @ 96dd913c, 2026-10-11; ledger 25)
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

## 4. STALE / MISSING (selected) (re-verified @ 96dd913c, 2026-10-11; ledger 26-31)
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
  FIXED in 410042ff: `HANDOVER.md:130-132` (`:124-126` at the previous stamp) now says fanmass is the caller on
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

## 5. CURRENT (verified — the good news) (re-verified @ 96dd913c, 2026-10-11; ledger 32-34)
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
  record is gone: architecture.md now says TailAdmin is retired (`:3384`).
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
  (`lib/mongodb.ts:13-17`, architecture.md :3938-3942) but one route breaks it
  (§10, ledger 68).

## 6. ~~Comment health~~ RESOLVED (messmass#353, re-verified @ 96dd913c, 2026-10-11; ledger 35-45)
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
  Stale again on 2026-10-11 (the comment named two of the four routes that call
  `assertCameraSecret`, added by 0a8f6244 and 69146ebd), **FIXED** in messmass#470:
  `lib/cameraClient.ts:12-14` names all four (§10, ledger 69).
  ~~lib/v3/middleware.ts uses symbolic constants (`DEFAULT_ORG_ID`/`MASTER_ORG_ID`)
  in distinct branches — no hardcoded production org ObjectId.~~ The file is gone:
  e0f0643f (#395) found its sentinel strings matched no real organization and
  deleted it; the one caller (v3/health) now uses `lib/middleware/v3/orgContext.ts`.
  The stale password-as-key comments in `lib/apiAuth.ts` (now `:65-72`) and
  `lib/users.ts` (left after 6f31990d removed that fallback) were corrected
  2026-09-28 (410042ff). The fit-in-fleet one-pager
  (docs/_audit/messmass-in-the-fleet.md) exists and now names the camera
  frame-context and link-stats endpoints. A tenth contradicting comment turned
  up in this round: `lib/rateLimit.ts:4` (§10, ledger 70), FIXED in messmass#470.

## 7. Obsoletion queue (re-verified @ 96dd913c, 2026-10-11; ledger 46-55)
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
  fourth debug route, `app/api/debug/notifications`, is not on the queue; it stays
  because docs name it as a manual troubleshooting URL (§10, ledger 78).
- Dead components (zero importers): ~~BlockEditor, LandingReportRoot,
  LandingValueChainSection + /api/landing-report~~ FIXED 2026-08-20 (c56e70af,
  v12.2.0); ~~HashtagInput~~ FIXED 2026-09-08 (messmass#351 leftovers, this
  change — `UnifiedHashtagInput` is the live component and was never affected).
  All five paths are absent at 96dd913c.
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
  followed 2026-09-08, messmass#351). ~~One macOS duplicate survived the
  sweep: `app/icon 3.png`~~ FIXED in messmass#470 (§10, ledger 74). ~~~310 of 400 scripts/ unreferenced incl.
  macOS duplicates (`add-kpi-chart 3.js` …)~~ FIXED 2026-09-08 (messmass#352,
  this change): 315 of 421 tracked scripts deleted, 106 kept; derivation and
  the per-script reason in `scripts-keep-list.md`. That is the record of one
  prune: `scripts/` tracks 112 files at 96dd913c, 6 added since by their own
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

## 8. Highest-value fixes, ranked (re-verified @ 96dd913c, 2026-10-11; ledger 56-60)
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

## 9. Wave 2026-09-16 — documentation audit (Phase 5) and the sweeps it triggered (re-verified @ 96dd913c, 2026-10-11; ledger 61-66)

Twelve findings (F-025 … F-036) closed, plus four earlier security findings.
Recorded here because several corrected claims this register had certified.

**architecture.md: 4,665 → 3,799 lines** (3,877 at 96dd913c and 3,968 after messmass#470, after the
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

## 10. New drift found 2026-10-11 (re-verified @ 96dd913c; ledger 68-85)
Found while re-reading the entries above. Each has its proof. The ones marked
FIXED were fixed by messmass#470 (the documentation and comment items, one rate
limit change, two removals); NEW is still open.

68. **NEW (open): a route uses `distinct()` on a strict Stable API connection.**
   `GET /api/bitly/recalculate` calls `.distinct('projectId')`
   (`app/api/bitly/recalculate/route.ts:202-204`, added in 423894e2,
   2026-09-16, messmass#283). The client is `serverApi: { version: '1', strict:
   true }` (`lib/mongodb.ts:13-17`), architecture.md "Query constraint"
   (`docs/architecture.md:3938-3942`) says `distinct()` is not part of that API and
   fails with `APIStrictError`, and `docs/operations/operations-release-notes.md`
   (the entry that records `APIStrictError` 323, `:3427` at 96dd913c; every open
   pull request adds an entry above it) records that failure on this connection
   (the AI analytics code was changed to `$group`).
   It is the only `.distinct(` call in app/, lib/, components/ and hooks/. Not
   executed here (no database reads), so the failure is taken from the recorded
   error, not reproduced. Reach: nothing in the admin UI calls this GET
   (`app/admin/bitly/page.tsx:590` only POSTs), so the orphan count in the
   status response is what is at risk. Fix shape: a `$group` aggregation. Not a
   documentation item, so not touched by messmass#470.
69. **FIXED: `lib/cameraClient.ts:12-14` named 2 of 4 camera inbound endpoints.**
   The comment said `assertCameraSecret` is "reused by every camera -> messmass
   inbound endpoint" and listed `partners` and `sso-session`; `frame-context`
   (0a8f6244) and `link-stats` (69146ebd) call it too. It now names all four
   (`grep -rn assertCameraSecret app` finds exactly those four routes).
   `comments:check` cannot see this kind of drift, because every cited path exists.
70. **FIXED: `lib/rateLimit.ts` contradicted itself and the doc.** The header
   (`lib/rateLimit.ts:4`) said "token bucket algorithm with sliding window
   tracking"; the code is a fixed-window counter that resets when `resetTime`
   passes (`:193` and `:206`). The header, the `checkRateLimit` comment and
   `docs/security/security-enhancements.md`, `docs/features/features-authentication.md`
   now say fixed window and the key (`<IP>:<exact pathname>`, `:240`, per server
   instance). architecture.md listed six endpoint classes in the Security
   Measures item; `RATE_LIMITS` has seven (`EDITOR_SAVE` came with a5d453d1);
   `docs/architecture.md:2335-2346` and `:3613` now list all seven.
71. **FIXED: the public rate-limit class was keyed on a deleted route.**
   `lib/rateLimit.ts` gave `RATE_LIMITS.PUBLIC` to paths starting with `/stats/`
   or `/hashtag/`; `app/stats` does not exist (the `stats` page type and its 202
   password rows were retired, e098deaa) and `next.config.js` redirects
   `/hashtag/*` to `/filter/*` before middleware runs. The public report pages
   (`/report/*`, `/partner-report/*`, both in the matcher) took the read budget,
   500 a minute "temporarily, for testing". Now `isPublicPagePath`
   (`lib/rateLimit.ts:291-293`, used at `:318`) gives the public class to GET and
   HEAD of `/report/`, `/partner-report/`, `/filter/` and `/hashtag/` (the page
   document; its API calls stay reads), and the read class is 120 a minute. The
   arithmetic (what a report load, the fanmass dashboard and worker, the editor
   and the admin header request; ten people with three tabs behind one IP is 30
   loads, 60 hits on `/api/chart-config/public`, so 2x headroom under 120 and 60)
   is in the comment above `RATE_LIMITS.READ` and in `docs/architecture.md:2335-2346`;
   `tests/rate-limit-classes.test.ts` covers it. The strict classes are unchanged.
   Open observations from reading the code for this: `/api/auth/*` is 5 requests
   per 15 minutes per IP and path, so more than five people signing in through one
   office IP in 15 minutes are refused on the SSO callback; the fanmass dashboard
   snapshot push (`POST /api/integrations/fanmass/dashboard-snapshot`, one fixed
   path, no pacing on fanmass's side) may exceed the write class of 30 a minute
   during its hourly sweep (estimated from fanmass's own notes, not measured); the
   report page fetches `/api/chart-config/public` twice per load
   (`hooks/useReportData.ts:127`, `app/report/[slug]/page.tsx:99`), which a later
   change could halve.
72. **FIXED: architecture.md gave a dead URL.** "View:
   `https://messmass.com/stats/<uuid>`": there is no `app/stats`; the example now
   uses `/report/` (`docs/architecture.md:3500`).
73. **FIXED: architecture.md named a collection that does not exist.** The
   schema row `variableGroups` matched no collection in code; the code uses
   `variablesGroups` (`app/api/variables-groups/route.ts:26`,
   `lib/variableMerge.ts:271`) and `variables_groups` (`:278`, and the index
   script). The row now says `variablesGroups` and names both
   (`docs/architecture.md:3517`).
74. **FIXED: a tracked macOS duplicate remained: `app/icon 3.png`.**
   Byte-identical to `app/icon.png` (`cmp`, 867 bytes each), tracked since
   c27f58ce (2025-08-28), referenced nowhere, and ignored by Next.js (the build's
   `app-paths-manifest.json` has only `/icon.png/route`). Removed in its own commit.
75. **FIXED: two more stack claims listed Tailwind (and Socket.io).**
   `READMEDEV.md:315` and `docs/DEVELOPER-CONDUCT.md:70` now say "Mongoose, and
   GDS on Mantine 8 for the UI". `package.json` has neither `tailwindcss` nor
   `socket.io`.
76. **FIXED: a login-page message for a code nothing emits.**
   `app/admin/login/page.tsx` mapped `no_account`; the SSO callback does not
   redirect with it (`app/api/auth/sso/callback/route.ts:5` says so; it uses
   `no_access`, `:89,102`). The map entry is removed in its own commit. Entry 82
   has what else is in that map.
77. **FIXED: a comment listed the deleted page type.** `lib/pagePassword.ts:27`
   said "Type of page (stats, edit, filter)"; `PageType` is eight other values
   (`:14-22`) and has no `stats`. The comment now points at `PageType`.
78. **NEW (kept, owner's decision): a debug route with no caller is not on the
   queue.** `app/api/debug/notifications/route.ts` is admin-guarded
   (`getAdminUser`, `:17`) and nothing in app, components, hooks, lib, tests,
   scripts or config calls it. It was not removed because the docs present it as
   a manual tool: `docs/architecture.md:1904` ("Production troubleshooting") and
   `:1998` ("Use diagnostic endpoint"), `docs/api/api-reference-complete.md:303`,
   `docs/_audit/api-reference.md:323`. No grep can show that nobody opens that URL
   by hand. Deleting it means updating those four places and the route inventory.
79. **FIXED: a stale cross-reference in the fleet map.**
   `docs/_audit/fleet-architecture.md:279` ended "(contradicts
   architecture.md:3755-3756)". The sentence now names the architecture.md
   section ("The one blocking call") instead of line numbers, and that section
   says the same thing as the fleet map. Only that sentence was edited; the
   fleet map's own stamps are unchanged.
80. **CHANGED: the CSP allowance for `wss://*.pusher.com` is not unused.**
   `middleware.ts:134` lists it in `connect-src` next to `https://vercel.live`,
   and the policy lists `https://vercel.live` in three more directives (`script-src`, `font-src`, `frame-src`). Vercel documents
   `connect-src https://vercel.live wss://ws-us3.pusher.com` for the Vercel
   toolbar and Comments (Vercel docs, "Managing the visibility of the Vercel
   Toolbar", section "Using a Content Security Policy", read 2026-10-11). The
   register's "no Pusher code" is true of messmass itself and beside the point:
   the connection belongs to the toolbar script, which loads on preview
   deployments. Not removed. The comment at `middleware.ts:134` now says so.
81. **NEW (open): a component with no importer tells the user a dead link.**
   `app/admin/events/ProjectsPageClient.tsx` is imported by nothing (only two
   comments in `app/admin/bitly/page.tsx:194,888` name it) and its create-event
   alert says "Stats Link: /stats/<viewSlug>" (`:365`), the deleted route. A
   candidate for the obsoletion queue (§7), not on it yet and not touched here.
82. **NEW (open): the login page maps two more codes nothing emits and misses one
   that is emitted.** `app/admin/login/page.tsx` maps `invalid_sso` and
   `missing_token`; the codes `app/api/auth/sso/callback/route.ts` and
   `.../login/route.ts` redirect with are `sso_not_configured`, `sso_oauth_error`,
   `missing_code`, `session_expired`, `permission_check_failed`, `no_access` and
   `auth_failed` (plus `reason=sso_required` from `middleware.ts`). `sso_oauth_error`
   has no entry and shows the generic "Sign-in failed" message.
83. **NEW (open, messmass#430): `/admin/project-partners` still writes and reads only
   the legacy fields.** `app/api/admin/project-partners/route.ts` (PUT sets or
   unsets `partner1` / `partner2`; GET lists only those) and
   `.../auto-suggest/route.ts` (selects events without `partner1`, which includes
   events that already have `partner1Id`, and sets `partner1`) work on the legacy
   fields, while projects store `partner1Id` / `partner2Id`
   (`app/api/projects/route.ts`, the fixture importers). The issue text says no
   code writes `partner1` any more; this page does. Report-template resolution
   reads both since the pull request for messmass#430 (#474, `lib/projectPartnerRef.ts`); the
   hero, the editor and `isHomeGame` still read `partner1Id` only. Decision for
   the owner: write `partner1Id` / `partner2Id` from that page.
84. **FIXED: two more wrong statements next to the CORS and middleware gaps.**
   `docs/features/features-authentication.md` showed a hard-coded `allowedOrigins`
   array (`https://messmass.com`, `https://admin.messmass.com`, ...) that is not in
   `lib/cors.ts` (`ALLOWED_ORIGINS` from the environment; localhost only when
   unset); architecture.md's middleware item said it "sets CSRF cookie if missing"
   and logs the start of each request, but `middleware.ts` removed cookie setting
   (the note above its `return response`) and only calls `logRequestEnd`.
85. **FIXED: two more schema rows named collections the app does not open.**
   `variablesConfig` is only the source of `scripts/consolidateVariablesConfig.ts`
   (the live store is `variables_metadata`, `app/api/variables-config/route.ts:15`);
   `aggregation_logs` is described in `lib/analytics.types.ts:302` and indexed by
   `scripts/createMissingIndexes.ts`, but no app code opens it: the analytics cron
   writes `aggregation_jobs` (`app/api/cron/analytics-aggregation/route.ts:84`).
