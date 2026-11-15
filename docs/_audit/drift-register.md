# messmass drift register — fleet audit P3, first edition

Generated 2026-08-19 against HEAD `6d28c7f3` (v12.1.95) by the fleet
documentation audit (messmass#345; method in messmass#344). Every claim
carries file:line evidence. Verdicts: WRONG / STALE / MISSING / CURRENT.
This file is intentionally header-less so the docs:audit version gate does
not bind it to a version it is not about.
Enforcement live: CI runs `inventory:check` (`scripts/fleet-audit-inventory.py
--check`) since 2026-09-08 (messmass#355; rule in `contract-first-rule.md`).

**Re-verification 2026-11-14 (re-verified @ 71a2b79f, v12.3.48).**
Every entry below was checked again on origin/main at 71a2b79f (read at c9644a37;
the two commits after it, d02408be and its merge, change version lines, the
release notes and the hashtags guide, and the entries they touch, 12, 22, 28, 32
and 68, were re-read at 71a2b79f). The stamp this
page carried before, 1f33bf54, was not a re-verification: commit 2cfa9ef9
(2026-11-09, "Resolve CI verification gates, ...") replaced every 96dd913c on
this page with 1f33bf54 and changed nothing else (`git diff 2cfa9ef9^ 2cfa9ef9 --
docs/_audit/drift-register.md`: 26 lines, the sha only), so the last real reading
was the 2026-10-11 round at 96dd913c. This round therefore measured from there:
210 commits from 96dd913c to 71a2b79f (100 of them after 1f33bf54), 347 files
changed up to 1f33bf54 and 222 after it. The 2026-10-11 text below is restored to
96dd913c, the commit it was read at, and kept as history. Method: for every
entry, `git diff --stat` from the old base (96dd913c, or c94d12fb, the merge of
messmass#470, for the files that pull request edited) to 71a2b79f on each cited
file; unchanged files keep their line numbers (the ledger says "unchanged"), and
every changed file was re-read and its lines found again by content. The counts
taken from `docs/_audit/*.json` were taken again (`endpoints.json` 248 routes,
`collections.json` 81 names, `docs.json` 227 docs). What moved most: the Fanmass
integration became photo-first (af08b361, 2026-10-20: the `/sync` and
`/callbacks` pull and the event-level channels answer 410, and the architecture
chapter was rewritten), the camera bridge gained two inbound routes and two
operator routes, every debug API route was deleted (bb3eaac6, 2026-11-08), a
`global-report` page type came with `/report/global` (f68b473c), Fanmass can now
create a match event (244809cf, `match-events`), and event creation moved to
`lib/createEvent.ts`. `freshness_check` (`scripts/fleet-audit-inventory.py:381`,
unchanged since 96dd913c) runs `STAMP_RE.findall` over every `docs/_audit/*.md`
file and measures each distinct sha once, so every stamp on this page counts, not
only the first; this round moved all of them (the header above and the section
headings) to 71a2b79f. `STAMP_RE` (:104) needs the word "verified" followed by a
space and the sha, so the ledger headings ("Re-verification ledger @ ...") and the
2026-10-11 paragraph below, which now says "checked at", are not measured.
Results: 93 entries, 40 TRUE, 40 CHANGED, 1 NOT RE-CHECKABLE and 12 NEW (four
still open from before, 68, 81, 82 and 83, and eight found in this round, 86 to
93, in §11). Nothing was fixed in code by this round. Fixed the same day in documentation:
86 (now FIXED) and the README badge noted under 22.

**Fixes 2026-11-15 (the eleven NEW entries, read at a90337e9, v12.3.48).**
Not a re-verification: only the eleven entries still NEW (68, 81, 82, 83, 87 to 93)
were read again, on origin/main at a90337e9, 16 commits after 71a2b79f, and fixed
where the fix is documentation, a comment or a small code change nobody sees. The
other 82 entries were not re-read, so the stamps on this page stay at 71a2b79f, and
this paragraph names its commit without the word the stamp check looks for. Fixed:
68 (154441c1), 82 (73bc1e02), 89, 90, 91 and 93 (ff6f78e9; 90 also c92611bb), 87 and
88 (c92611bb). Still open, each with what it needs in its ledger row and its entry:
81 and 83 (the owner's decision: a visible change to the events list, a change to
what a page writes to events) and 92, narrowed (the handover text is fixed; the pull
code left without a caller is a removal across code, environment variables and
deployment settings). Line numbers in the 2026-11-15 notes are for the tree of the
pull request that made these fixes.

**Re-verification and fixes 2026-10-11 (checked at 96dd913c, v12.3.42).**
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
it wrote against the code. Line numbers in this file were for 96dd913c (in the
2026-11-14 round's text they are for 71a2b79f, and the old ledger keeps the
96dd913c ones), except for the files that pull request edited, `docs/architecture.md`, `lib/rateLimit.ts`,
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
figure the register does not name enough to measure again. In the 2026-10-11
round, the pull request that recorded it fixed the entries marked FIXED in
messmass#470 (and changed only documentation, comments, `lib/rateLimit.ts` and two
files removed as unused); the entries then still NEW (68, 78, 81, 82, 83) needed
their own code or decision. The 2026-11-14 round changes this page only; its NEW
entries need their own documentation or code change.

## Re-verification ledger @ 71a2b79f (2026-11-14)

"unchanged" = the cited file has no diff from the old base to 71a2b79f, so the
line numbers of the old ledger still hold. Architecture.md lines are for
71a2b79f (4,053 lines).

| No. | Entry | Status | Proof at 71a2b79f |
|---|---|---|---|
| 1 | Cron fallback `development_secret` gone; bare-template variants closed (§0) | TRUE | unchanged: `app/api/cron/analytics-aggregation/route.ts:51-58`, `app/api/bitly/sync/route.ts:189-193`, `app/api/cron/bitly-refresh/route.ts:51-55`, `app/api/cron/google-sheets-sync/route.ts:31-43` (production only) |
| 2 | Mutating routes guarded: 8 google-sheet routes, hashtag-style; read sweep (§0) | CHANGED | 8 `app/api/partners/[id]/google-sheet/*/route.ts` still call `requireSession()`; hashtag-style `requireAdmin()` unchanged (`:21,64`); `KNOWN_UNGUARDED_READS` moved to `tests/api-mutation-auth.test.ts:105-144` and gained three `[public]` reads, `app/api/interactive-report/[partnerSlug]`, `brand-evidence` and `partner-selfies` (`:121-123`); `requireMessmassPrivacyErasureSecret` joined the primitives (`:23`) |
| 3 | Bitly cron fires: GET delegates to POST (§0) | TRUE | unchanged: `app/api/bitly/sync/route.ts:375-377`; `vercel.json:4-5` |
| 4 | Two stale-SSO admin routes survive (§0) | TRUE | unchanged: `app/api/admin/permissions/route.ts:16`, `app/api/admin/projects/[id]/route.ts:16`; still no caller in app, components, hooks, lib, contexts, tests, scripts (only their own comments and two comments in `app/api/drive-folders/*`) |
| 5 | architecture.md dependency versions (§1) | CHANGED | Next 15.5.27 `:3501`, React ^19.2.6 `:3502`, uuid ^14.0.3 `:3506`, no jsPDF row and no client export path `:3508`, Node `:3521`; all equal `package.json:165,167,172,192` |
| 6 | architecture.md WebSocket row (§1) | CHANGED | only the removed-in-v12.2.0 block, now `:3726-3743` |
| 7 | architecture.md "No External UI Library" / TailAdmin (§1) | CHANGED | `:3513` (GDS on Mantine 8, TailAdmin retired); `@mantine/core` ^8.3.18 (`package.json:143`) |
| 8 | architecture.md password-based admin login (§1) | CHANGED | `:3529`, `:3536`, `:3619`; `app/api/admin/login/route.ts:20-25` unchanged, 410 |
| 9 | architecture.md rate limiting, CSRF, middleware claims (§1) | CHANGED | rate limiting `:3765` (seven classes), CSRF `:3759`, middleware gate `:3762`; `middleware.ts:35,55,70-83,88-98` unchanged (only the CSP block, `:129-139`, changed); `lib/csrf.ts`, `lib/edgeSessionToken.ts` unchanged. The CSRF module section further up is wrong (entry 93) |
| 10 | architecture.md "Edge Functions" (§1) | CHANGED | `:3603`; no `runtime = 'edge'` in app, lib or `middleware.ts`; 27 files set `runtime = 'nodejs'` (26 before) |
| 11 | architecture.md `NEXT_PUBLIC_WS_URL` / `ADMIN_PASSWORD` env, `useWebSocket` (§1) | CHANGED | env block `:3605-3619`; hook only at `:3741`, in the removed block; `hooks/useWebSocket.ts` absent |
| 12 | architecture.md header vs footer version; auth sections (§1) | CHANGED | `:7` and `:4052` both 12.3.48 = `package.json:3`; Authentication Model `:3532-3541`, Security Measures `:3756-3765` |
| 13 | "Project Slug… No Passwords Required" (§1) | CHANGED | still fixed: "Project Slug Access Control" `:3621`, item 4 `:3633`, item 5 `:3634`; `app/api/projects/stats/[slug]/route.ts:18` and `app/report/[slug]/layout.tsx` unchanged, `app/api/projects/edit/[slug]/route.ts:46` re-read. Slugs are now made by `generateProjectSlugs` (`lib/slugUtils.ts:162`) through `lib/createEvent.ts:62` (`insertEvent`, used by `POST /api/projects`, `app/api/projects/route.ts:781`, and by Fanmass `match-events`, `lib/fanmassMatchEvents.ts:58`); `lib/slugUtils.ts:306` fills in a missing slug on an old event and replaces none; `lib/fanmassMapping.ts:128` has no caller |
| 14 | "never have a runtime dependency on fanmass being reachable" (§1) | CHANGED | superseded: since af08b361 `/sync` and `/callbacks` answer 410 (`app/api/integrations/fanmass/events/[eventId]/sync/route.ts:4-23`, `app/api/integrations/fanmass/callbacks/route.ts:4-11`), so no request blocks on fanmass; "The one blocking call" is gone from architecture.md, now "AI Analytics & Fanmass Photo Analysis" `:3967`. `syncFanmassAnalytics` (`lib/fanmassIntegration.ts:358`) and `fanmassFetch` (`:259`) have no caller (entry 92) |
| 15 | "Two channels across the boundary" (§1) | CHANGED | superseded: the section is gone; architecture.md `:3976-4022` describes the per-photo contract and says the legacy write endpoints answer 410 (`:4017-4022`); 31 route files under `app/api/integrations/fanmass`, all call `requireFanmassIntegrationAuth`, 13 of them retired (410); `fleet-architecture.md:244` (E2, per-photo contract, re-verified there at cc6f1a23) |
| 16 | DB schema summary omits live collections (§1) | CHANGED | core table `:3660-3674` still right; the second table `:3676` and "46 more collections" `:3658` miss nine collections the app now opens (entry 89); `collections.json` lists 81 names (71 before) |
| 17 | No CORS section in architecture.md (§1) | CHANGED | still fixed, "6. CORS" now `:2576`; `lib/cors.ts` unchanged, used by `middleware.ts:10` and the same 4 `app/api/public/**` routes (`applyCorsHeaders`) |
| 18 | SSO guide rewritten (§1b) | TRUE | unchanged: `docs/guides/guides-tutorial-authentication-sso.md:78,91-94`, `app/api/auth/sso/callback/route.ts:89,102`, `lib/auth/ssoOAuth.ts:76-77` |
| 19 | features-authentication.md corrected (§1b) | CHANGED | four layers `:17`, HS256 `:262`, grant facts `:247` (= `lib/pageAccess.ts:25,36,42,102,146`, unchanged); Machine API Keys moved to `:1189`; the `PageType` list `:331-332` no longer equals the code, which added `global-report` (entry 88) |
| 20 | camera-app guide: bidirectional model (§1b) | CHANGED | `docs/guides/guides-tutorial-camera-app.md:24-57` now says five inbound endpoints (photo-stats added); the code has six (entry 87); operator-backfill note moved to `:188-201` |
| 21 | api-reference.md: login 410, no WebSocket section (§1b) | TRUE | `docs/api/api-reference.md:30` (only the version line changed); no "websocket" in the file |
| 22 | README.md badge, WebSocket, SSO, Fleet (§1b) | CHANGED | badge v12.3.47 (`README.md:15`) one release behind `package.json` 12.3.48 (d02408be bumped the version without it); badge raised to v12.3.48 the same day; SSO env `:86-88`, `:97`; Fleet `:147`, Fanmass `:151` (rewritten for the per-photo contract); no WebSocket text |
| 23 | WebSocket stack deleted in code (§2) | TRUE | `server/` and `hooks/useWebSocket.ts` absent; no `ws`, `@types/ws` or `websocket` in `package.json`; no `new WebSocket(` in app, components, hooks, lib |
| 24 | WebSocket claims removed from the named docs (§2) | TRUE | `docs/operations/ops-warp.md:296,1043` (one-for-one line edits only), `docs/operations/operations-roadmap.md:473,478`, `docs/guides/guides-tutorial-getting-started.md:28`, `docs/audits/system-audit-plan-2026.md:12,51` unchanged; `docs/components/components-reusable-components-inventory.md:376` (polling: `components/TopHeader.tsx:51`, unchanged); no `7654` or WebSocket text in `docs/features/features-authentication.md`; no Socket.io in `docs/DEVELOPER-CONDUCT.md` |
| 25 | docs:audit version gate hole (§3) | TRUE | unchanged: `scripts/lib/docs-version-check.js:16`, `scripts/docs-consistency-audit.js:111-118,134` |
| 26 | low-level-design.md covers only 4 subsystems (§4) | CHANGED | sections now `:11` (whose scope gained the global report), `:138`, `:160`, `:186`, plus Comment Maintenance `:156`; all 27 backticked repo paths it cites exist |
| 27 | low-level-design.md:150 "no mechanical WHAT/WHY" vs the convention (§4) | CHANGED | the line is now `docs/low-level-design.md:158`; `docs/coding-standards.md:146` says the same; practice: 575 of 767 TS/TSX files under app, lib, components, hooks carry a `WHAT:` comment |
| 28 | HANDOVER.md stale; fanmass direction sentence (§4) | CHANGED | `HANDOVER.md:3` "Last verified: 2026-11-06 (v12.3.47 ...)", a dated line (`package.json` is 12.3.48); the direction sentence moved to `:167-169` and is stale again: the `/sync` and `/callbacks` pull it describes answers 410 (entry 92) |
| 29 | docs/V3 has 16 files, indexed as Active (§4) | TRUE | 16 files in `docs/V3`, 16 V3 entries in `docs/_audit/docs.json` (227 docs); `docs/index.md:35` "(Active)" |
| 30 | v3 org scoping (§4) | TRUE | 14 `app/api/v3` route files; 11 use `withOrgContext`; metrics/sync `requireAdmin`; the 2 organizations/report files `validateOrganizationAccess` |
| 31 | V3 spec: `GET /api/v3/activities/{id}` not implemented (§4) | TRUE | unchanged: `docs/V3/messmass_v3_api_specification.md:22`; `app/api/v3/activities/[id]` holds only `participants` |
| 32 | design-system.md is the most accurate doc (§5) | CHANGED | version 12.3.48 (`:7`, the only change); Mantine 8 `:21`, TailAdmin `:31`; its 12 adapter rows (table under `:43`) are the 12 `localAdapters` of `gds-adoption.json` (unchanged); `scripts/gds-sync-packages.sh` unchanged |
| 33 | fanmass tutorial is the best integration doc (§5) | CHANGED | the guide was rewritten for the per-photo contract (75 lines, Last Updated 2026-10-20); the old anchors (env table, failure codes, contract name at `:263`) are gone. Now: contract `fanmass.messmass.photo-analysis.v2` (`:25`) = `lib/fanmassPhotoAnalyses.ts:12`; token `FANMASS_INTEGRATION_TOKEN` with its fallback (`:51`) = `lib/config.ts:145`; 503/401 in `lib/fanmassIntegration.ts:79,86`. The old gap (no dashboard-snapshot, command or rescan text) is moot: those channels are retired. It says Fanmass does not create events (`:15`), which is no longer true (entry 86) |
| 34 | AI contract versioning, `distinct()` note, page-password and integration-token internals (§5) | CHANGED | the contract gate is now an exact string, `lib/fanmassPhotoAnalyses.ts:12,106-107` (409 `CONTRACT_MISMATCH`); `lib/aiAnalysisSummary.ts` was rewritten into the mechanical photo summary (`:26`); Stable API strict `lib/mongodb.ts:13-17` unchanged; architecture.md `distinct()` note `:4024-4025`; `requireFanmassIntegrationAuth` on all 31 fanmass routes; `lib/pageAccess.ts` unchanged; one route still breaks the `distinct()` rule (entry 68) |
| 35 | WHAT/WHY adherence; `lib/sponsorshipHub.ts` header (§6) | TRUE | `lib/sponsorshipHub.ts:1-22` WHAT/WHY/SOURCES header; 1453 lines |
| 36 | `app/api/partners/route.ts` guarded (§6) | TRUE | unchanged: `requireAdmin` `:34,333,402`; `requirePartnerWriteAccess` `:169` |
| 37 | TODO/FIXME count; commented-out code (§6) | CHANGED | still 3 matches in `lib/`, all in comments that record a removed TODO (`lib/bitly-aggregator.ts:254,295`, `lib/bitly.ts:447`, unchanged); `lib/` is now 57,253 lines; heuristic scan for commented-out statements: 0 hits |
| 38 | `lib/auth.ts` "intentional seam" comment gone (§6) | TRUE | unchanged; no "seam"; per-role table `lib/roles.ts:32` |
| 39 | `app/api/me` and `app/api/images` removed (§6) | TRUE | both absent |
| 40 | `lib/config.ts` WS comment gone (§6) | TRUE | no websocket text in `lib/config.ts` |
| 41 | `drive-folders/status` route gone (§6) | TRUE | `app/api/drive-folders` holds only `route.ts` and `[linkId]` |
| 42 | `lib/cameraClient.ts` comment names the real inbound endpoints (§6) | CHANGED | stale again: `lib/cameraClient.ts:12-14` names four routes, six now call `assertCameraSecret` (entry 87) |
| 43 | `lib/v3/middleware.ts` gone; caller uses orgContext (§6) | TRUE | absent; `app/api/v3/health/route.ts:7` imports `withOrgContext` |
| 44 | password-as-key comments corrected (§6) | TRUE | unchanged: `lib/apiAuth.ts:65-72`, `lib/users.ts` |
| 45 | fit-in-fleet one-pager exists (§6) | CHANGED | `docs/_audit/messmass-in-the-fleet.md:10-15` names frame-context, link-stats and now photo-stats; it does not name `partners/[messmassPartnerId]/style-context` (entry 87) |
| 46 | `app/api/me`, `app/api/images` dead routes removed (§7) | TRUE | same proof as entry 39 |
| 47 | Two SSO-validate routes still queued for deletion (§7) | TRUE | same proof as entry 4 |
| 48 | Also queued: `app/api/stats`, hashtag-style, sports-db/lookup, debug routes (§7) | CHANGED | `app/api/stats`, `app/api/admin/hashtag-style` and `app/api/sports-db/lookup` still exist with no caller; bb3eaac6 (2026-11-08) deleted all four `app/api/debug/*` routes (overview-block, categorized-hashtags, notifications, vision-check), but the debug page that called one of them stays (entry 91) |
| 49 | Dead components removed (§7) | TRUE | `BlockEditor`, `LandingReportRoot`, `LandingValueChainSection`, `HashtagInput`, `app/api/landing-report` absent; `components/UnifiedHashtagInput.tsx` live |
| 50 | Dead libs removed; api-docs webhooks gone (§7) | TRUE | `lib/webhooks.ts`, `lib/shareables`, `lib/ssoClient.ts`, `lib/v3/middleware.ts` absent; no "webhook" in `app/api-docs/page.tsx` (rewritten, 31+/38-) |
| 51 | `scripts/verify-v3-middleware.ts` imports a deleted file (§7) | TRUE | unchanged: `scripts/verify-v3-middleware.ts:2`; `docs/_audit/scripts-keep-list.md:176` |
| 52 | Dead infra removed: `server/`, macOS duplicates, `ws`, keyword (§7) | TRUE | `server/`, `package 3.json`, `app/icon 3.png` absent; `git ls-files | grep -E ' [0-9]\.[a-z]+$'` finds nothing |
| 53 | scripts prune: 315 of 421 deleted, 106 kept (§7) | CHANGED | the prune record stands (`scripts-keep-list.md:43-44`); `scripts/` now tracks 140 files (112 at 96dd913c), the 28 more added by their own changes |
| 54 | gds-compliance carve-out cleared (§7) | TRUE | unchanged: `.github/workflows/ci.yml:58` runs `npx gds-compliance check --manifest ./gds-adoption.json` with no `|| true`; passes in this round's run |
| 55 | Do not treat integration routes as dead (§7) | CHANGED | 10 camera route files: 6 behind `assertCameraSecret` (`partners`, `sso-session`, `frame-context`, `link-stats`, `photo-stats`, `partners/[messmassPartnerId]/style-context`) and 4 operator routes behind the fanmass token (`link-partners`, `provision-missing`, `link-existing`, `sync-linked`); 31 fanmass route files; `endpoints.json` 248 routes |
| 56 | Fix 1: cron fallback (§8) | TRUE | same proof as entry 1 |
| 57 | Fix 2: google-sheet and hashtag-style guards (§8) | TRUE | same proof as entry 2; `c02f4b6f` exists |
| 58 | Fix 3: docs:audit regex (§8) | TRUE | same proof as entry 25 |
| 59 | Fix 4: dead code and WebSocket claims (§8) | TRUE | same proof as entries 23, 24, 49, 50 |
| 60 | Fix 5: SSO guide and features-authentication (§8) | TRUE | same proof as entries 18, 19 (the auth flow parts of 19 hold) |
| 61 | architecture.md 4,665 -> 3,799 lines; fiction deleted (§9) | CHANGED | 4,053 lines at 71a2b79f (`wc -l docs/architecture.md`) |
| 62 | Changelog archived (§9) | TRUE | `docs/archive/architecture-changelog-2026-09.md` unchanged |
| 63 | Five CI gates (§9) | TRUE | `package.json:47,48,50`; the two tests under `tests/` unchanged; run results in the pull request |
| 64 | F-003 / F-025 security posture (§9) | TRUE | `middleware.ts:35,55`; unchanged `lib/edgeSessionToken.ts:2,75` and `app/api/hashtag-categories/route.ts:40-48,179,275,383` |
| 65 | Dead code figures: 1,610 lines, 70 selectors, 86 classes (§9) | NOT RE-CHECKABLE | historical counts of a finished sweep; nothing named to measure again |
| 66 | F-011, F-004, F-007 closed (§9) | TRUE | 6f31990d, e0f0643f, e098deaa exist; `lib/apiAuth.ts:65-72`, `lib/middleware/v3/orgContext.ts` unchanged; the data effect of e098deaa not re-read (no production database reads) |
| 67 | Header: CI enforces `inventory:check` (header) | CHANGED | `.github/workflows/ci.yml:45` `npm run inventory:check`; the script line moved to `package.json:86` |
| 68 | `GET /api/bitly/recalculate` calls `distinct()` under the strict Stable API | FIXED | fixed 2026-11-15 (154441c1): the route counts the referenced projects with a `$match` + `$group` aggregation (`app/api/bitly/recalculate/route.ts:206-214`, the reason in the comment `:202-205`); no `.distinct(` is left in app, lib, components or hooks; `tests/bitly-recalculate-status.test.ts` (its fake client throws on `distinct()` the way the strict client does). messmass#469 had been closed "for now" by the owner on 2026-10-11 ("reopen if it shows in the logs"); the fix is one commit, so it can be dropped on its own |
| 69 | `lib/cameraClient.ts:12-14` names 2 of 4 camera inbound endpoints | CHANGED | it names 4; there are 6 now (photo-stats da7403e5, style-context 519889a0); see entry 87 |
| 70 | `lib/rateLimit.ts:4` header contradicts the code; architecture.md lists 6 of 7 classes | CHANGED | still fixed: `lib/rateLimit.ts` unchanged since messmass#470 (`:4-10`, `:162-165`); architecture.md lines now `:2464-2475` and `:3765` |
| 71 | public rate-limit class keyed on the deleted `/stats/` route | CHANGED | still fixed: `lib/rateLimit.ts:285-293,318` and `:85` unchanged; `next.config.js:98-99` still redirects `/hashtag/*` to `/filter/*`; architecture.md `:2464-2475`; `tests/rate-limit-classes.test.ts` unchanged |
| 72 | architecture.md example URL uses the deleted `/stats/` route | CHANGED | still fixed, now `docs/architecture.md:3653` |
| 73 | architecture.md names a collection `variableGroups` that does not exist | CHANGED | still fixed, now `docs/architecture.md:3670`; `app/api/variables-groups/route.ts:26` unchanged, `lib/variableMerge.ts:280-288` |
| 74 | `app/icon 3.png` tracked macOS duplicate | TRUE | absent |
| 75 | `READMEDEV.md:315` and `docs/DEVELOPER-CONDUCT.md:70` list Tailwind (and Socket.io) | TRUE | both lines still say GDS on Mantine 8 (unchanged since messmass#470); no `tailwindcss` or `socket.io` in `package.json` |
| 76 | `app/admin/login/page.tsx` maps `no_account`, a code nothing emits | TRUE | unchanged since messmass#470; no `no_account` in the map (`:16-23`) |
| 77 | `lib/pagePassword.ts:27` comment lists the deleted `stats` page type | CHANGED | still fixed; the comment is now `lib/pagePassword.ts:28` ("one of the PageType values above"); `PageType` is `:14-23`, nine values |
| 78 | `app/api/debug/notifications` has no caller and is not queued | CHANGED | the route is gone (bb3eaac6, 2026-11-08), so the owner's decision is made; the doc places that name it were not updated (entry 90) |
| 79 | `fleet-architecture.md:279` cites architecture.md lines that moved | CHANGED | the sentence is gone: E2 was rewritten for the per-photo contract (`fleet-architecture.md:244`) and architecture.md has no "The one blocking call" section any more |
| 80 | `middleware.ts:134` CSP still allows `wss://*.pusher.com` | CHANGED | still allowed and still the Vercel toolbar's; the comment at `middleware.ts:134` was shortened (it names "the Vercel toolbar's Pusher WebSocket", without the Vercel docs reference); `https://vercel.live` stays in `script-src` `:130`, `font-src` `:133`, `frame-src` `:137` |
| 81 | `app/admin/events/ProjectsPageClient.tsx` has no importer and tells the user "Stats Link: /stats/<slug>" | NEW | still open at a90337e9 (file unchanged since 71a2b79f): no importer, the alert is still `:365`. New: the "Open in Camera" link to Camera vetting (`:897-904`; release notes `:1110` say it is "on each project row") exists only in this unused file; the live list (`app/admin/events/page.tsx`, `lib/adapters/projectsAdapter.tsx`) has no such link, and `messmass-in-the-fleet.md` now says so. Needs the owner's decision: move the Camera link into the live list (a visible change), then delete the file; see §10 |
| 82 | `app/admin/login/page.tsx` maps two more codes nothing emits and misses one that is emitted | FIXED | fixed 2026-11-15 (73bc1e02): `invalid_sso` and `missing_token` removed (map `app/admin/login/page.tsx:17-25`, now only the codes `app/api/auth/sso/callback/route.ts`, `app/api/auth/sso/login/route.ts` and `middleware.ts` send); `sso_oauth_error` keeps the generic "Sign-in failed" text, stated in the comment `:14-16`. A dedicated message for it would be new copy, the owner's call |
| 83 | `/admin/project-partners` still writes and reads only the legacy `partner1` / `partner2` | NEW | still open at a90337e9 (both routes unchanged since 71a2b79f): `auto-suggest/route.ts` still selects events with no `partner1` (`:92-94`) and sets only `partner1` / `partner2` (`:113-118`). Needs the owner's decision: making it write `partner1Id` / `partner2Id` changes what the page writes to production events (messmass#430, open); see §10 |
| 84 | features-authentication.md hard-coded CORS list; middleware section said it sets the CSRF cookie | TRUE | no `allowedOrigins` list in `docs/features/features-authentication.md`; the middleware item stays correct. A third copy of the cookie claim, in the CSRF module section, was missed (entry 93) |
| 85 | architecture.md schema rows `variablesConfig` and `aggregation_logs` | TRUE | the core table names them only in notes (`:3669`, `:3673`); `app/api/variables-config/route.ts:15`, `app/api/cron/analytics-aggregation/route.ts:84`, `lib/analytics.types.ts:302` unchanged |
| 86 | Docs say Fanmass does not create Messmass events; `POST /api/integrations/fanmass/match-events` does | FIXED | fixed the same day: `docs/architecture.md` (the photo-first contract paragraph and the photo-level section) and `docs/guides/guides-tutorial-fanmass.md:15` now say the only events Fanmass creates are match events of SZRT drive photos (`lib/fanmassMatchEvents.ts`) |
| 87 | Camera bridge: comment and docs name four or five inbound routes and two operator routes; the code has six and four | FIXED | fixed 2026-11-15 (c92611bb): `lib/cameraClient.ts:10-17` names the six `assertCameraSecret` routes and the four operator routes; `docs/guides/guides-tutorial-camera-app.md:33-55` (six inbound, style-context added), `:190-210` (link-existing, sync-linked), `:212-228` and `:253-259` (four operator routes); `docs/_audit/messmass-in-the-fleet.md:6-26` |
| 88 | features-authentication.md `PageType` list misses `global-report` | FIXED | fixed 2026-11-15 (c92611bb): `docs/features/features-authentication.md:333-334` and the three other lists (`:275`, `:552`, `:645`) name `global-report`, and the prompt table has its row (`:241`, `/report/global`, pageId `all`) = `lib/pagePassword.ts:23`, `app/interactive-report/global/page.tsx:20,41-43` |
| 89 | architecture.md schema summary misses nine collections the app now opens | FIXED | fixed 2026-11-15 (ff6f78e9): the nine rows added to the second table; `docs/architecture.md:3661` now says 54 more collections (it said 46 for a 45-row table); the scan of `.collection('<name>')` in app, lib, components and hooks (67 names) equals the two tables, no name missing and none extra |
| 90 | Deleted debug routes are still documented | FIXED | fixed 2026-11-15 (ff6f78e9, c92611bb): `docs/architecture.md:2037-2040` says the route was deleted and `:2131` points at `GET /api/notifications`; the `/debug` section of `docs/api/api-reference-complete.md` removed. That file's coverage figures (341 methods in 228 route files, 2026-10-20) predate the 248 route files now and were not re-measured |
| 91 | `app/debug/hashtag-categories/page.tsx` fetches a deleted route | FIXED | fixed 2026-11-15 (ff6f78e9): the page (development only, production answered 404) removed with `components/HashtagCategoryDebug.tsx` and its CSS module, its only user; the generated inventory now lists 85 pages (`docs/architecture.md:1000`) |
| 92 | HANDOVER.md still describes the `/sync` + `/callbacks` pull; its code has no caller | NEW | narrowed 2026-11-15: the text is fixed (c92611bb), a dated note in `HANDOVER.md:169-173` and `docs/_audit/messmass-in-the-fleet.md:27-33`. Still open: the code. `syncFanmassAnalytics` (`lib/fanmassIntegration.ts:358`) has no caller, and with it `fanmassFetch` (`:259`), `recordFanmassSyncFailure` (`:453`), `loadFanmassLink` (`:250`) and `FANMASS_SUMMARY_CONTRACT` (`:11`) go (`mapFanmassSummaryToStats`, `:288`, stays as long as `mapFanmassStatsToFlatStats` names its return type), then `config.fanmassBaseUrl` (`lib/config.ts:143`), `config.fanmassApiKey` (`:144`), `FANMASS_BASE_URL` and `FANMASS_API_KEY` in `.env.example:98-102` and the Vercel settings: a removal larger than this pass; see §11 |
| 93 | architecture.md CSRF module: "HttpOnly" cookie that "middleware sets" | FIXED | fixed 2026-11-15 (ff6f78e9): `docs/architecture.md:2503-2518` now says the cookie is not HttpOnly (`lib/csrf.ts:124`), middleware checks but does not set it (`middleware.ts:150-152`), `GET /api/csrf-token` issues it, and drops "token rotation on validation failure" (`refreshCsrfToken`, `lib/csrf.ts:136`, has no caller) |

Counts: 93 entries: 40 TRUE, 40 CHANGED, 1 FIXED (86, the same day), 1 NOT RE-CHECKABLE and 11 NEW
(still open from before: 68, 81, 82, 83; found in this round: 87 to 93).
After the fixes of 2026-11-15: 40 TRUE, 40 CHANGED, 9 FIXED (86, 68, 82, 87 to 91, 93),
1 NOT RE-CHECKABLE and 3 NEW (81 and 83, the owner's decision; 92, narrowed to its code).

## Re-verification ledger @ 96dd913c (2026-10-11; history)

This is the 2026-10-11 ledger as it was written. Commit 2cfa9ef9 relabelled its
sha 1f33bf54 without re-reading anything; the original sha is restored here.

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
(2026-09-04)** (re-verified @ 71a2b79f, 2026-11-14; ledger 1-4; earlier 96dd913c, 2026-10-11):
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
  public/editor-surface/reference routes now (`tests/api-mutation-auth.test.ts:105-144`;
  `:104-140` at 96dd913c). Since then three interactive-report reads joined the
  `[public]` block (`app/api/interactive-report/[partnerSlug]`, `brand-evidence`,
  `partner-selfies`, `:121-123`) and `requireMessmassPrivacyErasureSecret` joined
  the primitives (`:23`).
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
  repaired. **Correction (2026-09-28, still true at 71a2b79f):** two more
  routes with the same pattern survive — `app/api/admin/permissions/route.ts:16`
  and `app/api/admin/projects/[id]/route.ts:16` still call the retired
  `{SSO_BASE_URL}/api/validate` (the endpoint found above to always 401) and
  have no in-app callers (grep over app, components, hooks, lib, contexts,
  tests and scripts, 2026-10-11 and again 2026-11-14). Queued for deletion in §7.

## 1. docs/architecture.md architectural claims (re-verified @ 71a2b79f, 2026-11-14; ledger 5-17; earlier 96dd913c, 2026-10-11)
The file is 4,053 lines at 71a2b79f (3,968 after messmass#470, 3,877 at 96dd913c;
fiction deleted and the changelog archived in #408/#409); line numbers below are
for 71a2b79f. Most moved by about 130 lines; the Fanmass chapter was rewritten.
- ~~Dependency versions all wrong (React 18.3.1, Node ≥18, jsPDF 3.0.1, uuid
  11.1.0)~~ FIXED: Next 15.5.27 (:3501), React ^19.2.6 (:3502), uuid ^14.0.3
  (:3506), Node >=24.0.0 <25.0.0 (:3521); no jsPDF row, and :3508 states there
  is no html2canvas/jsPDF path. `package.json` agrees on all of them.
- ~~"WebSocket (ws) — real-time client-server communication"~~ FIXED: the only
  WebSocket text is the "Removed in v12.2.0" historical block (:3726-3743).
- ~~"No External UI Library" / "TailAdmin V2"~~ FIXED: GDS on Mantine 8 (:3513).
- ~~"Password-Based: admin login with bcrypt"~~ FIXED: SSO-only, 410 noted
  (:3529, :3536, :3619).
- ~~Rate limiting "(To be implemented)"; CSRF "SameSite attribute";
  "Middleware validates session on all protected routes"~~ FIXED: rate
  limiting implemented (:3765, all seven classes, §10, ledger 70), CSRF
  double-submit (:3759), and :3762 states what middleware checks (HS256
  signature + expiry of `admin-session` for `/admin/**` and `/dashboard/**`,
  F-003) and that role checks stay in each route. The CSRF module section
  further up (:2499-2514) still says the cookie is HttpOnly and that middleware
  sets it; both are wrong (§11, ledger 93).
- ~~"Edge Functions: routes on Vercel Edge"~~ FIXED: Node.js serverless runtime,
  none declare `'edge'` (:3603; 27 files set `runtime = 'nodejs'`).
- ~~`NEXT_PUBLIC_WS_URL` and `ADMIN_PASSWORD` required; `hooks/useWebSocket.ts`~~
  FIXED: neither is in the env block (:3605-3619); the hook appears only in the
  removed-in-v12.2.0 block (:3741).
- ~~Header Version vs footer Version self-contradictory; no section on SSO,
  camera, the auth layers, CSRF or rate limiting~~ FIXED: header :7 and footer
  :4052 agree (12.3.48); "Authentication Model" (:3532-3541) covers SSO, page
  passwords, machine tokens, stakeholder sessions and the camera bridge (:3541
  names `sso-session` and `link-stats`, as examples); CSRF and rate limiting are
  in "Security Measures" (:3756-3765).
- ~~"Project Slug… No Passwords Required" (also "password-less access" and "no
  session/auth required")~~ FIXED (messmass#470), still true: the section
  ("Project Slug Access Control", `docs/architecture.md:3621`) says a slug is a
  bearer link only while the page has no password, that `page_passwords` plus
  `requirePageAccess` / `requirePageAccessDecision` gate
  `/api/projects/{stats,edit}/[slug]` (`app/api/projects/stats/[slug]/route.ts:18`,
  `app/api/projects/edit/[slug]/route.ts:46`) and `app/report/[slug]/layout.tsx`
  renders the gate, and that nothing regenerates a slug (:3634). Slugs are made
  by `generateProjectSlugs` (`lib/slugUtils.ts:162`); since the event-creation
  rules moved to `lib/createEvent.ts`, its caller is `insertEvent` (`:62`), used
  by `POST /api/projects` (`app/api/projects/route.ts:781`) and by Fanmass's
  `match-events` route (`lib/fanmassMatchEvents.ts:58`); `lib/slugUtils.ts:306`
  fills in a slug an old event lacks (it replaces none), and
  `lib/fanmassMapping.ts:128` has no caller. Item 1 (:3630) still names only
  `POST /api/projects`. The same file says so at :3530 and :3537.
- ~~"messmass must therefore never have a runtime dependency on fanmass being
  reachable"~~ FIXED (messmass#470), then superseded: af08b361 (2026-10-20) made
  the Fanmass integration photo-first, and `/sync` and `/callbacks`, the one
  blocking call, now answer 410 without calling fanmass
  (`app/api/integrations/fanmass/events/[eventId]/sync/route.ts:4-23`,
  `app/api/integrations/fanmass/callbacks/route.ts:4-11`). The chapter is now "AI
  Analytics & Fanmass Photo Analysis" (`docs/architecture.md:3967`); it has no
  blocking-call section because there is no such call. `syncFanmassAnalytics`
  (`lib/fanmassIntegration.ts:358`) and `fanmassFetch` (`:259`, abort after 15 s
  at `:267`, its only call `:378`) stayed and have no caller (§11, ledger 92).
- ~~"Two channels across the boundary"~~ FIXED (messmass#470), then superseded:
  the section is gone. architecture.md (:3976-4022) describes one photo result
  or tombstone per call and says the legacy event-summary, stats, sync,
  callback, dashboard-snapshot and link endpoints answer 410 (:4017-4022). In
  code: 31 route files under `app/api/integrations/fanmass/**`, each calls
  `requireFanmassIntegrationAuth`; 13 of them are retired (410), and the live
  ones are the photo intake, the drive-folder and drive-photo routes, the
  evidence and SZRT routes, the hashtag and event-list reads, and `match-events`.
  `fleet-architecture.md` E2 (:244) is the fanmass side (re-verified there at
  cc6f1a23). The chapter says Fanmass does not create Messmass events
  (:3973, :3992); `match-events` does (§11, ledger 86).
- ~~The DB schema summary lists 13 collections~~ FIXED (messmass#470), now
  incomplete again: the core table (`docs/architecture.md:3656`, rows
  :3662-3674) is still right, but the second table (:3676) and the sentence
  "the code opens 46 more collections" (:3658) miss nine collections the app has
  opened since (§11, ledger 89). `collections.json` (81 names, 71 at 96dd913c,
  scripts included, checked by `npm run inventory:check`) is named as the
  complete list.
- ~~There is no CORS section in architecture.md~~ FIXED (messmass#470), still
  true: "6. CORS (`lib/cors.ts`)" (`docs/architecture.md:2576`) describes
  `ALLOWED_ORIGINS` (exact origins; localhost only when unset), the headers
  `buildCorsHeaders` sets, where it applies (`middleware.ts:10`, and
  `applyCorsHeaders` in the four `app/api/public/**` routes: partners,
  partners/[id], partners/[id]/events, events/[id]) and that it binds browsers
  only. The middleware section list (5) matches the real order of
  `middleware.ts` (entry 84).

## 1b. ~~WRONG~~ FIXED (messmass#349, re-verified @ 71a2b79f, 2026-11-14; earlier 96dd913c, 2026-10-11) — guides and feature docs (ledger 18-22)
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
  collection name, the deleted `stats` pageType (the list at :331-332 equalled
  `PageType` in `lib/pagePassword.ts:14-22`), the users schema, and a real
  "Machine API Keys" section (:1189 at 71a2b79f, :1199 before) replacing
  "Planned: API Keys". Re-read 2026-10-11 and 2026-11-14: the page-access grant
  facts at :247 (cookie `page-access`, HS256, at most 40 grants, 12 hour expiry)
  match `lib/pageAccess.ts:25,36,42,102,146` (unchanged). Since f68b473c
  (2026-11-12) `PageType` has a ninth value, `global-report` (`lib/pagePassword.ts:23`),
  which the list at :331-332 does not have (§11, ledger 88).
- ~~**docs/guides/guides-tutorial-camera-app.md:22-24**~~ FIXED: the "one direction"
  claim replaced with the verified bidirectional model (guide :24-52) —
  messmass→Camera provisioning (org/partner/event) plus **four**
  Camera→messmass inbound endpoints (it was two at the previous stamp):
  `POST /api/integrations/camera/partners` upsert, `POST .../sso-session` mint,
  and, added since, `POST .../events/{id}/link-stats` (69146ebd, 2026-10-07)
  and `GET .../events/{id}/frame-context` (0a8f6244, 2026-10-06); all four
  call `assertCameraSecret`. Also kept: the
  shared-secret-guards-both-directions nuance, the messmass→Camera look-change
  notice (`lib/cameraThemeNotify.ts`, guide :49 at 96dd913c) and the
  operator-backfill token distinction (`link-partners` and `provision-missing`
  take `FANMASS_INTEGRATION_TOKEN`, guide :183-196 at 96dd913c, routes
  `app/api/integrations/camera/{link-partners,provision-missing}/route.ts`).
  Re-read 2026-11-14: the guide now says **five** inbound endpoints (`:33`;
  `photo-stats`, da7403e5, was added at `:47-50`), but six routes call
  `assertCameraSecret` (also `partners/[messmassPartnerId]/style-context`,
  519889a0), and its operator section (`:188-201`) and gotcha (`:226-231`)
  still say "two" inbound and "two" operator endpoints, where the code has six
  and four (`link-existing` and `sync-linked`, 84997d9b) (§11, ledger 87).
- ~~**docs/api/api-reference.md:22-25,287-297** — admin login POST + a whole
  "WebSocket API" section, both fictional.~~ FIXED: :30 documents
  `POST /api/admin/login` as 410 Gone; there is no WebSocket section.
- ~~**README.md**: v12.1.88 badge (:15); websocket start instructions (:68-73);
  NEXT_PUBLIC_WS_URL required (:87); "SSO optional, uses SSO_BASE_URL" (:100 —
  mandatory, needs client id+secret). No mention of camera/fanmass.~~ FIXED
  2026-09-28, re-checked 2026-10-11 and 2026-11-14: badge v12.3.47 (:15; v12.3.42
  at 96dd913c; one release behind `package.json` 12.3.48 since d02408be), no WebSocket or `NEXT_PUBLIC_WS_URL`, SSO-only with
  `SSO_CLIENT_ID`/`SSO_CLIENT_SECRET`/`JWT_SECRET` (:86-88, :97), and a Fleet
  section (:147) and a Fanmass Integration section (:151, rewritten for the
  per-photo contract; it says the legacy routes answer 410, which holds).

## 2. ~~The vestigial WebSocket system~~ REMOVED (code) + docs FIXED (messmass#349; re-verified @ 71a2b79f, 2026-11-14; ledger 23-24; earlier 96dd913c, 2026-10-11)
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
Re-checked 2026-10-11 and 2026-11-14 at the lines in ledger 24. The cleanup missed two places that
carry the same kind of stale stack claim, listed in §10 (both fixed since).

## 3. ~~The docs:audit gate has a hole~~ FIXED (re-verified @ 71a2b79f, 2026-11-14; ledger 25; earlier 96dd913c, 2026-10-11)
~~scripts/docs-consistency-audit.js:93,98 version-header regex matches
`**Version**: X` and `Version: X` but NOT `**Version:** X` — the exact format in
docs/features/features-authentication.md:7, docs/api/api-reference.md:7,
api-public.md:7, all frozen at 12.1.16 (June) and silently passing CI. The gate
also reads only the first 25 lines (missing architecture.md:4647's footer)~~:
`VERSION_LINE_RE` in `scripts/lib/docs-version-check.js:16` accepts every
`Version:` stamp format including `**Version:** X`, and
`scripts/docs-consistency-audit.js:111-118` scans each current doc's whole
content, header and footer (both files unchanged since 96dd913c). Still true: it
checks path patterns, npm-script existence, version stamps and fleet-map
freshness, never factual accuracy.

## 4. STALE / MISSING (selected) (re-verified @ 71a2b79f, 2026-11-14; ledger 26-31; earlier 96dd913c, 2026-10-11)
- docs/low-level-design.md is accurate but covers only 4 subsystems (Report Variant
  Period Selector `:11`, whose scope now also lists the global report, Mobile
  Admin Actions `:138`, Unified Admin Entity Forms `:160`, Public Report Shell
  `:186`) — not a low-level design of the system (nothing on
  auth/integrations/data model). Its :158 (:150 at 96dd913c) "no mechanical
  WHAT/WHY blocks" **no longer contradicts a written rule**:
  `docs/coding-standards.md:146` says the same (avoid `WHAT` / `WHY` boilerplate
  that repeats the name). The tension is with practice — 575 of 767 TS/TSX files
  under app/, lib/, components/ and hooks/ carry a `WHAT:` comment (549 of 672 at
  96dd913c). The 27 backticked repo paths the file cites all exist.
- ~~HANDOVER.md stale by 6 patches (v12.1.89 vs .95)~~ FIXED: `HANDOVER.md:3`
  reads "Last verified: 2026-11-06 (v12.3.47: ...)", a dated line (`package.json`
  is 12.3.48).
  ~~its "fanmass always the outbound caller both directions"~~ FIXED in
  410042ff: the sentence (`HANDOVER.md:167-169` now, `:130-132` at 96dd913c) says
  fanmass is the caller on every channel except the `/sync` + `/callbacks` pull.
  Stale again since af08b361: that pull answers 410 and its code has no caller
  (§11, ledger 92).
- docs/V3/** (16 files) indexed as Active over a small live surface (16 files
  in `docs/V3` and among the 227 entries of `docs/_audit/docs.json`;
  `docs/index.md:35` tags the API spec "(Active)").
  ~~12 routes behind a withOrgContext wrapper with a hardcoded org id~~ FIXED
  (#395, e0f0643f): 14 v3 route files; 11 go through `withOrgContext`
  (`lib/middleware/v3/orgContext.ts`), which resolves the org per user
  (`organizationIds`, else Master) with a superadmin-only `?orgId=` override
  validated against `organizations`; the other 3 use `requireAdmin`
  (metrics/sync) or `validateOrganizationAccess` (organizations/report/[id] and
  its /activities). Counted again 2026-10-11 and 2026-11-14 from the route files.
- ~~docs/V3/messmass_v3_api_specification.md:22 lists `GET /api/v3/activities/{id}`
  and :99 claims `useReportData` "bridges V3 Activities"~~ FIXED 2026-09-07
  (v12.3.22): the route never existed; the hook's fallback to it was dead code
  that turned every protected event report's 401 into a JSON-parse crash. Spec
  and playbook now say so (spec :22 "Not implemented"); fallback deleted.

## 5. CURRENT (verified — the good news) (re-verified @ 71a2b79f, 2026-11-14; ledger 32-34; earlier 96dd913c, 2026-10-11)
- **docs/design/design-system.md is the most accurate major doc** (v12.3.48 now;
  GDS/Mantine/theme all verified: Mantine 8 `:21`, TailAdmin guidance rejected
  `:31`; the 12 adapter paths in the table under `:38` equal the 12
  `localAdapters` in `gds-adoption.json`). **Correction:** this entry used to say
  the localAdapters are "cross-checked by gds:sync CI". They are not:
  `scripts/gds-sync-packages.sh` only runs `npm ls` on the three GDS packages at
  6.3.0. `npx gds-compliance check --manifest ./gds-adoption.json` does read
  `localAdapters` (`node_modules/@sovereignsquad/gds-compliance/index.js:782,909,1095,1322`),
  but nothing compares the table in design-system.md with the manifest; that stays
  a manual rule (`design-system.md:38`). The contradiction this entry used to
  record is gone: architecture.md now says TailAdmin is retired (`:3513`). Re-read
  2026-11-14: only the version line changed; `gds-adoption.json`,
  `scripts/gds-sync-packages.sh` and the gds-compliance 6.3.0 lines cited above are
  unchanged.
- **docs/guides/guides-tutorial-fanmass.md** was the single best integration doc
  (at 96dd913c: two-layer framing, env table `:39-41`, failure codes `:45-49`,
  contract name `:263`, matching `lib/config.ts:141-143`,
  `lib/fanmassIntegration.ts:77,84,254` and `lib/aiAnalysisSummary.ts:27`; gap: no
  dashboard-snapshot/command/rescan channels). Re-read 2026-11-14: it was
  rewritten for the per-photo contract (75 lines, Last Updated 2026-10-20) and
  the cited anchors are gone. It still matches the code on what it covers:
  contract `fanmass.messmass.photo-analysis.v2` (`:25`) =
  `PHOTO_ANALYSIS_CONTRACT` (`lib/fanmassPhotoAnalyses.ts:12`); the integration
  token `FANMASS_INTEGRATION_TOKEN` with the Messmass fallback (`:51`) =
  `lib/config.ts:145`, checked by `requireFanmassIntegrationAuth`
  (`lib/fanmassIntegration.ts:76-89`, 503 at `:79`, 401 at `:86`); legacy
  endpoints answer 410 (`:49`). The old gap is moot: those channels are retired.
  One sentence is now wrong: "Fanmass does not create events" (`:15`), while
  `match-events` creates them (§11, ledger 86).
- AI-analytics contract-versioning, page-password and integration-token
  internals — verified at the entry points. The contract gate is no longer a
  major-version check in `lib/aiAnalysisSummary.ts` (rewritten into the
  mechanical photo summary, `:26`): the photo intake refuses any other contract
  string with 409 `CONTRACT_MISMATCH` (`lib/fanmassPhotoAnalyses.ts:12,106-107`,
  and `:616-617` for tombstones). `requirePageAccess` still gates the report data
  route, grants are HS256 cookies (`lib/pageAccess.ts`, unchanged since
  96dd913c; rewritten in a5d453d1, v12.3.39, and not re-audited line by line),
  and `requireFanmassIntegrationAuth` guards all 31 fanmass route files. The
  distinct()/Stable-API note is true as a rule (`lib/mongodb.ts:13-17`;
  architecture.md now `:4024-4025`) but one route breaks it (§10, ledger 68).

## 6. ~~Comment health~~ RESOLVED (messmass#353, re-verified @ 71a2b79f, 2026-11-14; ledger 35-45; earlier 96dd913c, 2026-10-11)
- WHAT/WHY adherence good but uneven: integration/auth surface (lib/fanmass*,
  aiRescan, apiGuards, pageAccess, app/api/integrations/**) is best-in-repo
  (comments explain tradeoffs). ~~lib/sponsorshipHub.ts is 1432 lines with ZERO
  comments~~ FIXED: it now carries a WHAT/WHY/SOURCES header (`:1-22`)
  explaining it is the single sponsorship-hub read model behind the four
  scopes and three admin surfaces (1453 lines now). (app/api/partners/route.ts
  is guarded — F-009/#386: `requireAdmin` at `:34,333,402`,
  `requirePartnerWriteAccess` at `:169`.)
- 3 TODO/FIXME matches in a 57.3k-LOC lib/ (50.7k at 96dd913c, 45k with 8 matches
  before that), and all three are comments that record a removed TODO
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
  `lib/cameraClient.ts:12-14` names all four (§10, ledger 69). **Stale again on
  2026-11-14**: six routes call it now (`photo-stats`, da7403e5, and
  `partners/[messmassPartnerId]/style-context`, 519889a0, joined), and the
  comment still names four (§11, ledger 87).
  ~~lib/v3/middleware.ts uses symbolic constants (`DEFAULT_ORG_ID`/`MASTER_ORG_ID`)
  in distinct branches — no hardcoded production org ObjectId.~~ The file is gone:
  e0f0643f (#395) found its sentinel strings matched no real organization and
  deleted it; the one caller (v3/health) now uses `lib/middleware/v3/orgContext.ts`.
  The stale password-as-key comments in `lib/apiAuth.ts` (now `:65-72`) and
  `lib/users.ts` (left after 6f31990d removed that fallback) were corrected
  2026-09-28 (410042ff). The fit-in-fleet one-pager
  (docs/_audit/messmass-in-the-fleet.md) exists and names the camera
  frame-context, link-stats and (since 2026-10-12) photo-stats endpoints
  (`:10-15`), but not style-context (§11, ledger 87). A tenth contradicting
  comment turned up in the 2026-10-11 round: `lib/rateLimit.ts:4` (§10, ledger
  70), FIXED in messmass#470 and unchanged since.

## 7. Obsoletion queue (re-verified @ 71a2b79f, 2026-11-14; ledger 46-55; earlier 96dd913c, 2026-10-11)
- Dead routes: ~~app/api/me, app/api/images (phantom cookies)~~ FIXED 2026-08-20
  (c56e70af, v12.2.0); the 4 legacy SSO-validate admin routes: 2 deleted
  2026-09-04 (`/api/admin/{projects,users}`, 62a47a0d, messmass#386, see §0),
  2 still queued — `app/api/admin/permissions/route.ts` and
  `app/api/admin/projects/[id]/route.ts` (both call the retired
  `{SSO_BASE_URL}/api/validate` at :16; no in-app callers). Also still queued:
  app/api/stats (no caller), app/api/admin/hashtag-style (now admin-guarded, §0;
  no caller), sports-db/lookup (no caller). ~~debug/overview-block (no caller),
  debug/categorized-hashtags (one caller: the debug page
  `app/debug/hashtag-categories/page.tsx:37`, so it goes with that page)~~ and
  ~~`app/api/debug/notifications` (not queued, kept as a manual tool, §10, ledger
  78)~~: bb3eaac6 (2026-11-08) deleted all four `app/api/debug/*` routes (those
  three and `vision-check`). The debug page stayed and still fetches the deleted
  route (`app/debug/hashtag-categories/page.tsx:42`, §11, ledger 91), and the docs
  that named the routes were not updated (§11, ledger 90). Both fixed 2026-11-15
  (ff6f78e9: the page removed; the docs corrected).
- Dead components (zero importers): ~~BlockEditor, LandingReportRoot,
  LandingValueChainSection + /api/landing-report~~ FIXED 2026-08-20 (c56e70af,
  v12.2.0); ~~HashtagInput~~ FIXED 2026-09-08 (messmass#351 leftovers, this
  change — `UnifiedHashtagInput` is the live component and was never affected).
  All five paths are absent at 96dd913c and at 71a2b79f.
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
  prune: `scripts/` tracked 112 files at 96dd913c (6 added after the prune by
  their own changes: the comment, architecture and preflight gates and two
  one-off data scripts) and tracks 140 at 71a2b79f (28 more, among them the
  snapshot and universal-report index scripts, the SZRT and taxonomy scripts and
  the partner and photo repair scripts), none in the keep-list by design. ~~The CI forbidden-color
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
  Precisely, at 71a2b79f: 31 fanmass route files (18 at 96dd913c; 13 of the 31
  now answer 410 and are kept as retired endpoints); 10 camera route files (6 at
  96dd913c), of which six are called by the camera app behind
  `assertCameraSecret` (`partners`, `sso-session`,
  `events/[messmassEventId]/frame-context`, `events/[messmassEventId]/link-stats`,
  `events/[messmassEventId]/photo-stats`, `partners/[messmassPartnerId]/style-context`)
  and four (`link-partners`, `provision-missing`, and since 84997d9b
  `link-existing` and `sync-linked`) are operator routes behind the fanmass
  integration token — keep them; the first two are curl-only by design (camera
  app guide :188-201, which does not know the other two, §11, ledger 87).
  `endpoints.json` lists 248 routes.

## 8. Highest-value fixes, ranked (re-verified @ 71a2b79f, 2026-11-14; ledger 56-60; earlier 96dd913c, 2026-10-11)
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

## 9. Wave 2026-09-16 — documentation audit (Phase 5) and the sweeps it triggered (re-verified @ 71a2b79f, 2026-11-14; ledger 61-66; earlier 96dd913c, 2026-10-11)

Twelve findings (F-025 … F-036) closed, plus four earlier security findings.
Recorded here because several corrected claims this register had certified.

**architecture.md: 4,665 → 3,799 lines** (3,877 at 96dd913c, 3,968 after messmass#470 and
4,053 at 71a2b79f, after the camera, dependency and auth sections were added and
the Fanmass chapter was rewritten). 43 falsifiable claims were verified
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
existing path while naming too few of them (§10, ledger 69; it happened again,
§11, ledger 87).

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

## 10. New drift found 2026-10-11 (re-verified @ 71a2b79f, 2026-11-14; ledger 68-85; found at 96dd913c)
Found while re-reading the entries above. Each has its proof. The ones marked
FIXED were fixed by messmass#470 (the documentation and comment items, one rate
limit change, two removals); NEW is still open. Line numbers in the entries are
as found on 2026-10-11; each entry ends with what the 2026-11-14 re-read found.

68. **FIXED (2026-11-15): a route used `distinct()` on a strict Stable API connection.**
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
   documentation item, so not touched by messmass#470. Re-read 2026-11-14: still
   open; the route and `lib/mongodb.ts` are unchanged, it is still the only
   `.distinct(` call, the architecture.md rule moved to the end of the rewritten
   Fanmass chapter (`docs/architecture.md:4024-4025`) and the release-notes record
   to `:3488`. Fixed 2026-11-15 (154441c1): `$match` on `projectId` existing (the
   rows `distinct()` would read) and `$group` on it
   (`app/api/bitly/recalculate/route.ts:206-214`), so the status answer keeps its
   numbers; `tests/bitly-recalculate-status.test.ts` fails if `distinct()` comes back.
   The owner had closed messmass#469 "for now" on 2026-10-11; the change is one
   commit and can be dropped on its own.
69. **FIXED: `lib/cameraClient.ts:12-14` named 2 of 4 camera inbound endpoints.**
   The comment said `assertCameraSecret` is "reused by every camera -> messmass
   inbound endpoint" and listed `partners` and `sso-session`; `frame-context`
   (0a8f6244) and `link-stats` (69146ebd) call it too. It now names all four
   (`grep -rn assertCameraSecret app` finds exactly those four routes).
   `comments:check` cannot see this kind of drift, because every cited path exists.
   Re-read 2026-11-14: stale again, six routes call it and the comment names four
   (§11, ledger 87).
70. **FIXED: `lib/rateLimit.ts` contradicted itself and the doc.** The header
   (`lib/rateLimit.ts:4`) said "token bucket algorithm with sliding window
   tracking"; the code is a fixed-window counter that resets when `resetTime`
   passes (`:193` and `:206`). The header, the `checkRateLimit` comment and
   `docs/security/security-enhancements.md`, `docs/features/features-authentication.md`
   now say fixed window and the key (`<IP>:<exact pathname>`, `:240`, per server
   instance). architecture.md listed six endpoint classes in the Security
   Measures item; `RATE_LIMITS` has seven (`EDITOR_SAVE` came with a5d453d1);
   `docs/architecture.md:2335-2346` and `:3613` now list all seven. Re-read
   2026-11-14: `lib/rateLimit.ts` unchanged since messmass#470; the architecture.md
   lines are now `:2464-2475` and `:3765`.
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
   change could halve. Re-read 2026-11-14: still fixed (`lib/rateLimit.ts`
   unchanged, `next.config.js:98-99` still redirects `/hashtag/*`); the
   architecture.md lines are `:2464-2475`. Of the observations, the dashboard
   snapshot push is moot (the route answers 410 since af08b361), and the second
   chart-config fetch is now `app/report/[slug]/page.tsx:100`.
72. **FIXED: architecture.md gave a dead URL.** "View:
   `https://messmass.com/stats/<uuid>`": there is no `app/stats`; the example now
   uses `/report/` (`docs/architecture.md:3500`; `:3653` at 71a2b79f).
73. **FIXED: architecture.md named a collection that does not exist.** The
   schema row `variableGroups` matched no collection in code; the code uses
   `variablesGroups` (`app/api/variables-groups/route.ts:26`,
   `lib/variableMerge.ts:271`) and `variables_groups` (`:278`, and the index
   script). The row now says `variablesGroups` and names both
   (`docs/architecture.md:3517`; `:3670` at 71a2b79f, and the `lib/variableMerge.ts`
   lines are now `:280-288`).
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
   (`:14-22`) and has no `stats`. The comment now points at `PageType`. Re-read
   2026-11-14: still fixed; the comment is `lib/pagePassword.ts:28` and `PageType`
   (`:14-23`) has nine values since `global-report` was added (§11, ledger 88).
78. **NEW (kept, owner's decision): a debug route with no caller is not on the
   queue.** `app/api/debug/notifications/route.ts` is admin-guarded
   (`getAdminUser`, `:17`) and nothing in app, components, hooks, lib, tests,
   scripts or config calls it. It was not removed because the docs present it as
   a manual tool: `docs/architecture.md:1904` ("Production troubleshooting") and
   `:1998` ("Use diagnostic endpoint"), `docs/api/api-reference-complete.md:303`,
   `docs/_audit/api-reference.md:323`. No grep can show that nobody opens that URL
   by hand. Deleting it means updating those four places and the route inventory.
   Re-read 2026-11-14: CHANGED. bb3eaac6 (2026-11-08, "Remove temporary vision
   diagnostic endpoint after Atlas verification") deleted it with the other three
   debug routes and regenerated the route inventory, but did not update the other
   places: `docs/architecture.md:2033,2127` and
   `docs/api/api-reference-complete.md:304` still name it (§11, ledger 90).
79. **FIXED: a stale cross-reference in the fleet map.**
   `docs/_audit/fleet-architecture.md:279` ended "(contradicts
   architecture.md:3755-3756)". The sentence now names the architecture.md
   section ("The one blocking call") instead of line numbers, and that section
   says the same thing as the fleet map. Only that sentence was edited; the
   fleet map's own stamps are unchanged. Re-read 2026-11-14: the sentence is
   gone. The fleet map's E2 was rewritten for the per-photo contract
   (`fleet-architecture.md:244`, re-verified there at cc6f1a23) and architecture.md
   no longer has a blocking-call section.
80. **CHANGED: the CSP allowance for `wss://*.pusher.com` is not unused.**
   `middleware.ts:134` lists it in `connect-src` next to `https://vercel.live`,
   and the policy lists `https://vercel.live` in three more directives (`script-src`, `font-src`, `frame-src`). Vercel documents
   `connect-src https://vercel.live wss://ws-us3.pusher.com` for the Vercel
   toolbar and Comments (Vercel docs, "Managing the visibility of the Vercel
   Toolbar", section "Using a Content Security Policy", read 2026-10-11). The
   register's "no Pusher code" is true of messmass itself and beside the point:
   the connection belongs to the toolbar script, which loads on preview
   deployments. Not removed. The comment at `middleware.ts:134` now says so.
   Re-read 2026-11-14: still allowed; the comment was shortened when the map tile
   hosts were added (1d741434) and now says only "the Vercel toolbar's Pusher
   WebSocket"; `https://vercel.live` is still in `script-src` (`:130`), `font-src`
   (`:133`) and `frame-src` (`:137`).
81. **NEW (open, owner's decision): a component with no importer tells the user a dead link.**
   `app/admin/events/ProjectsPageClient.tsx` is imported by nothing (only two
   comments in `app/admin/bitly/page.tsx:194,888` name it) and its create-event
   alert says "Stats Link: /stats/<viewSlug>" (`:365`), the deleted route. A
   candidate for the obsoletion queue (§7), not on it yet and not touched here.
   Re-read 2026-11-14: still open; still no importer, the alert is still `:365`
   (the file's one change is the camera vetting link). Re-read 2026-11-15 at
   a90337e9: unchanged. That camera link is the reason it is not simply deleted:
   the "Open in Camera" button (`:897-904`, release notes `:1110`, "on each project
   row") exists only in this file, so the live events list (`app/admin/events/page.tsx`
   through `lib/adapters/projectsAdapter.tsx`) never showed it, and
   `messmass-in-the-fleet.md` claimed it did (corrected in c92611bb). The decision for
   the owner: add the Camera link to the live list (a visible change), then delete
   this file; deleting it first would drop the only copy of that link.
82. **FIXED (2026-11-15): the login page mapped two more codes nothing emits and
   missed one that is emitted.** `app/admin/login/page.tsx` maps `invalid_sso` and
   `missing_token`; the codes `app/api/auth/sso/callback/route.ts` and
   `.../login/route.ts` redirect with are `sso_not_configured`, `sso_oauth_error`,
   `missing_code`, `session_expired`, `permission_check_failed`, `no_access` and
   `auth_failed` (plus `reason=sso_required` from `middleware.ts`). `sso_oauth_error`
   has no entry and shows the generic "Sign-in failed" message. Re-read
   2026-11-14: still open; both files unchanged (`invalid_sso` `:17`,
   `missing_token` `:20`; `sso_oauth_error` emitted at
   `app/api/auth/sso/callback/route.ts:46`). Fixed 2026-11-15 (73bc1e02): the two
   unsent codes are removed (no one sees a change: nothing sends them), and the
   comment above the map (`app/admin/login/page.tsx:14-16`) says which files send the
   codes and that `sso_oauth_error` shows the generic "Sign-in failed" text. A
   message of its own for it would be new copy, the owner's call.
83. **NEW (open, owner's decision, messmass#430): `/admin/project-partners` still writes and reads only
   the legacy fields.** `app/api/admin/project-partners/route.ts` (PUT sets or
   unsets `partner1` / `partner2`; GET lists only those) and
   `.../auto-suggest/route.ts` (selects events without `partner1`, which includes
   events that already have `partner1Id`, and sets `partner1`) work on the legacy
   fields, while projects store `partner1Id` / `partner2Id`
   (`app/api/projects/route.ts`, the fixture importers). The issue text says no
   code writes `partner1` any more; this page does. Report-template resolution
   reads both since the pull request for messmass#430 (#474, `lib/projectPartnerRef.ts`); the
   hero, the editor and `isHomeGame` still read `partner1Id` only. Decision for
   the owner: write `partner1Id` / `partner2Id` from that page. Re-read
   2026-11-14: narrowed, still open. The page route now lists partners through
   `projectPartnerId` (`app/api/admin/project-partners/route.ts:43-44`) and its PUT
   writes `partner1Id` / `partner2Id` next to the legacy fields (`:124-137`).
   `auto-suggest/route.ts` still selects events with no `partner1` (`:92-94`,
   which includes events that have `partner1Id`) and sets only `partner1` /
   `partner2` (`:113-118`). Re-read 2026-11-15 at a90337e9: unchanged. Not fixed
   here: making auto-suggest select on `partner1Id` and write `partner1Id` /
   `partner2Id` changes what an admin action writes to production events, which is
   the owner's decision (messmass#430 is open).
84. **FIXED: two more wrong statements next to the CORS and middleware gaps.**
   `docs/features/features-authentication.md` showed a hard-coded `allowedOrigins`
   array (`https://messmass.com`, `https://admin.messmass.com`, ...) that is not in
   `lib/cors.ts` (`ALLOWED_ORIGINS` from the environment; localhost only when
   unset); architecture.md's middleware item said it "sets CSRF cookie if missing"
   and logs the start of each request, but `middleware.ts` removed cookie setting
   (the note above its `return response`) and only calls `logRequestEnd`.
   Re-read 2026-11-14: both still fixed. A third statement of the same kind sits
   in architecture.md's CSRF module section and was missed (§11, ledger 93).
85. **FIXED: two more schema rows named collections the app does not open.**
   `variablesConfig` is only the source of `scripts/consolidateVariablesConfig.ts`
   (the live store is `variables_metadata`, `app/api/variables-config/route.ts:15`);
   `aggregation_logs` is described in `lib/analytics.types.ts:302` and indexed by
   `scripts/createMissingIndexes.ts`, but no app code opens it: the analytics cron
   writes `aggregation_jobs` (`app/api/cron/analytics-aggregation/route.ts:84`).
   Re-read 2026-11-14: still fixed; the core table rows that mention them are
   `docs/architecture.md:3669,3673`, and the cited code is unchanged.

## 11. New drift found 2026-11-14 (re-verified @ 71a2b79f; ledger 86-93)
Found while re-reading the entries above. Each has its proof. None was fixed by
that round, which changed only this page; 86 was fixed the same day (e4e50bf2), and
87 to 91 and 93 on 2026-11-15 (each entry says how); 92 is narrowed to its code.

86. **FIXED (2026-11-14, e4e50bf2): the docs said Fanmass does not create Messmass
   events; it does now.** `POST /api/integrations/fanmass/match-events` (244809cf, 2026-11-14,
   owner answer 509) creates the event of a match from the home club, away club
   and date, through the same `insertEvent` as `POST /api/projects`
   (`app/api/integrations/fanmass/match-events/route.ts`, `lib/fanmassMatchEvents.ts:58`;
   contract `fanmass.messmass.match-event.v1`, `:12`), and provisions its Camera
   mirror after the response. `docs/architecture.md:3973` ("It does not create
   Messmass events or event reports") and `:3992` ("Fanmass does not create
   Messmass events or event reports") and `docs/guides/guides-tutorial-fanmass.md:15`
   ("Fanmass does not create events") say the opposite. The Camera photo
   workflow those sentences describe still does not create events, so the fix is
   to scope them to that workflow and name the match-event route; the fleet map's
   E2 was re-verified at cc6f1a23 and is not part of this entry.
87. **FIXED (2026-11-15): the camera bridge was counted short in a comment and two docs.**
   In code: 10 route files under `app/api/integrations/camera`; six call
   `assertCameraSecret` (`partners`, `sso-session`,
   `events/[messmassEventId]/frame-context`, `events/[messmassEventId]/link-stats`,
   `events/[messmassEventId]/photo-stats` from da7403e5,
   `partners/[messmassPartnerId]/style-context` from 519889a0) and four take the
   fanmass integration token (`link-partners`, `provision-missing`, and
   `link-existing` and `sync-linked` from 84997d9b). `lib/cameraClient.ts:12-14`
   says `assertCameraSecret` is "reused by every camera -> messmass inbound
   endpoint" and names four; `docs/guides/guides-tutorial-camera-app.md:33` says
   "Five inbound endpoints" (no style-context), and its operator note (`:188-201`)
   and gotcha (`:226-231`) still say two inbound endpoints (`partners`,
   `sso-session`) and two operator endpoints; `docs/_audit/messmass-in-the-fleet.md:10-15`
   names neither style-context nor the two new operator routes. The same kind of
   drift as entry 69, which `comments:check` cannot see. Fixed 2026-11-15 (c92611bb):
   the comment (`lib/cameraClient.ts:10-17`) names the six inbound and the four
   operator routes; the guide says six inbound endpoints and describes style-context
   (`:33-55`), documents `link-existing` and `sync-linked` (`:190-210`) and says four
   operator endpoints in the auth note and the gotcha (`:212-228`, `:253-259`); the
   one-pager names style-context and the operator routes (`:6-26`).
88. **FIXED (2026-11-15): the documented `PageType` list missed `global-report`.**
   `docs/features/features-authentication.md:331-332` lists eight page types and
   marks them as `lib/pagePassword.ts PageType`; the type has a ninth,
   `global-report` (`lib/pagePassword.ts:23`, f68b473c, 2026-11-12), with its
   shareable URL `/report/global` (`:474-481`). `docs/low-level-design.md:16-23`
   already describes it. Fixed 2026-11-15 (c92611bb): the schema block
   (`docs/features/features-authentication.md:333-334`) and the three prose lists
   (`:275`, `:552`, `:645`) name it, and the prompt table has its row (`:241`: pageId
   `all`, `app/interactive-report/global/page.tsx:20`; with no password issued the page
   is a 404 for everyone but an admin, `:41`).
89. **FIXED (2026-11-15): architecture.md's schema summary missed nine collections the
   app opens.** `docs/architecture.md:3658` says "the code opens 46 more
   collections, listed in the second table" (`:3676`), as the result of a scan of
   `.collection('<name>')` in app/, lib/, components/ and hooks/. Since then the app
   has started opening `brand_assets` (`app/api/brand-assets/route.ts`),
   `brand_canonical_mappings` and `reclassified_clubs` (both
   `app/api/brand-assets/route.ts`), `fanmass_camera_photo_analyses`
   (`lib/fanmassPhotoAnalyses.ts`, `app/api/hashtags/route.ts`),
   `fanmass_event_drive_photos` (`lib/fanmassDrivePhotos.ts`), `report_snapshots`
   (`lib/reportSnapshotManager.ts`), `reportStyles` (`lib/interactiveReportAggregator.ts:289`), `szrt_vision_analysis`
   (`app/api/interactive-report/partner-selfies/route.ts`) and
   `szrt_vision_progress` (`lib/interactiveReportAggregator.ts`); none is in either
   table. `collections.json` has all of them (81 names; the tenth new name,
   `szrt_vision_dlq`, is opened by scripts only), so `inventory:check` stays green
   while the prose drifts. Fixed 2026-11-15 (ff6f78e9): the nine rows are in the second
   table and the sentence says 54 (`docs/architecture.md:3661`; it said 46, but the
   table had 45 rows). The same scan, run again, finds 67 names, and they are exactly
   the names of the two tables. `fanmass_event_drive_photos` is opened through a
   constant in `lib/fanmassDrivePhotos.ts:15` and by name in
   `lib/hashtagReport/measured.ts`; `reportStyles` is a fallback read after
   `report_styles` (`lib/interactiveReportAggregator.ts:288-289`).
90. **FIXED (2026-11-15): deleted debug routes were still documented.** bb3eaac6
   (2026-11-08) deleted `app/api/debug/{categorized-hashtags,notifications,overview-block,vision-check}`
   and regenerated `docs/_audit/api-reference.md`, but `docs/architecture.md:2033`
   ("Diagnostic Endpoint: `GET /api/debug/notifications` - Production
   troubleshooting") and `:2127` ("Use diagnostic endpoint") and
   `docs/api/api-reference-complete.md:303-305` (three rows) still describe them.
   The audit snapshots under `docs/audits/lld/` name them too; those are dated
   records, not current documentation, and are not counted here. Fixed 2026-11-15
   (ff6f78e9, c92611bb): architecture.md says the route was deleted (`:2037-2040`) and
   its troubleshooting list starts from `GET /api/notifications` (`:2131`); the
   `/debug` section of `api-reference-complete.md` is gone. Seen while doing it, not
   fixed: that file's coverage figures (341 methods in 228 route files, 2026-10-20)
   are older than the 248 route files now.
91. **FIXED (2026-11-15): a debug page fetched a deleted route.**
   `app/debug/hashtag-categories/page.tsx:42` fetches `/api/debug/categorized-hashtags`,
   deleted in bb3eaac6; the page renders only outside production (`notFound()`
   at `:31-33`), so a developer who opens it gets the error state. §7 had said
   the route "goes with that page"; the route went and the page stayed. Fixed
   2026-11-15 (ff6f78e9): the page is removed with `components/HashtagCategoryDebug.tsx`
   and `components/HashtagCategoryDebug.module.css`, which only it used; the generated
   route inventory and module catalogue were regenerated (85 pages,
   `docs/architecture.md:1000`). Production showed a 404 before and after.
92. **NEW (narrowed 2026-11-15, code still open): HANDOVER.md still described the retired `/sync` + `/callbacks`
   pull, and its code is left without a caller.** `HANDOVER.md:167-169` says
   Fanmass "is the caller on every channel except one: messmass's `/sync` and
   `/callbacks` pull the analytics summary from `FANMASS_BASE_URL` (blocking, 15s
   timeout)". Since af08b361 (2026-10-20) both routes answer 410 without calling
   fanmass (`app/api/integrations/fanmass/events/[eventId]/sync/route.ts:4-23`,
   `app/api/integrations/fanmass/callbacks/route.ts:4-11`). The paragraph sits in
   a dated session block (v12.1.89), so a dated note may be the right fix rather
   than a rewrite. In code, `syncFanmassAnalytics` (`lib/fanmassIntegration.ts:358`)
   and `fanmassFetch` (`:259`) are no longer called from anywhere in app/ or lib/:
   a candidate for the obsoletion queue (§7). Text fixed 2026-11-15 (c92611bb): a dated
   note in the session block (`HANDOVER.md:169-173`), and the fleet one-pager's Fanmass
   bullet no longer describes the pull (`docs/_audit/messmass-in-the-fleet.md:27-33`).
   Still open, the code: removing `syncFanmassAnalytics` takes `fanmassFetch`,
   `recordFanmassSyncFailure` (`:453`), `loadFanmassLink` (`:250`) and
   `FANMASS_SUMMARY_CONTRACT` (`:11`) with it,
   then `config.fanmassBaseUrl` and `config.fanmassApiKey` (`lib/config.ts:143-144`)
   and `FANMASS_BASE_URL` and `FANMASS_API_KEY` in `.env.example:98-102` and the
   Vercel settings: one removal across code, the example environment file and the
   deployment settings, for its own change.
93. **FIXED (2026-11-15): architecture.md's CSRF module section contradicted the code.**
   "#### 2. CSRF Protection Module" says the double-submit cookie is "secure,
   HttpOnly, SameSite=Lax" (`docs/architecture.md:2500`), that "Middleware sets
   CSRF cookie on first request" (`:2507`) and that "HttpOnly cookies prevent XSS
   token theft" (`:2512`). The cookie is set with `httpOnly: false`, on purpose,
   because the double-submit pattern needs JavaScript to read it
   (`lib/csrf.ts:124`), and middleware does not set it: `middleware.ts:150-152`
   says cookie setting was removed and the token comes from `/api/csrf-token`
   (`lib/apiClient.ts:31`, `ensureCsrfToken`). Entry 84 fixed the same claim in
   the middleware section; this copy dates from 2025-10-18 and was missed. Fixed
   2026-11-15 (ff6f78e9): the section (`docs/architecture.md:2503-2518`) says the cookie
   is not HttpOnly and why, that middleware checks it but does not set it, that
   `GET /api/csrf-token` issues it, and which paths are exempt (`lib/csrf.ts:159-190`);
   "token rotation on validation failure" is gone, because nothing calls
   `refreshCsrfToken` (`lib/csrf.ts:136`).
