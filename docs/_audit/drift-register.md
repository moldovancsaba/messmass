# messmass drift register — fleet audit P3, first edition

Generated 2026-08-19 against HEAD `6d28c7f3` (v12.1.95) by the fleet
documentation audit (messmass#345; method in messmass#344). Every claim
carries file:line evidence. Verdicts: WRONG / STALE / MISSING / CURRENT.
This file is intentionally header-less so the docs:audit version gate does
not bind it to a version it is not about.
Enforcement live: CI runs `inventory:check` (`scripts/fleet-audit-inventory.py
--check`) since 2026-09-08 (messmass#355; rule in `contract-first-rule.md`).

## 0. Behavior findings escalated out of the docs audit (see messmass#347)
**FULLY RESOLVED via messmass#347 + messmass#348 (2026-09-03) + messmass#386
(2026-09-04)**:
- ~~**Cron auth bypass**~~ FIXED: the `'development_secret'` fallback is gone
  (analytics-aggregation fails closed, route.ts:51-58). messmass#348 also
  closed the two remaining fail-open variants: `/api/bitly/sync` compared
  against a bare `` `Bearer ${process.env.CRON_SECRET}` `` (so `Bearer
  undefined` authenticated when the secret was unset) and
  `/api/cron/bitly-refresh` skipped auth entirely when the secret was unset.
- ~~**Unauthenticated mutating routes**~~ FIXED: all 8
  `/api/partners/[id]/google-sheet/*` routes and `POST /api/admin/hashtag-style`
  call `requireSession()`. `tests/api-mutation-auth.test.ts` now also covers
  read routes: every GET without an auth primitive must appear in
  `KNOWN_UNGUARDED_READS`, so a new anonymous analytics/PII read fails CI.
  messmass#386 (v12.3.18) then guarded 33 of the 37 debt entries, reclassified
  3 as by-design editor reads (their destructive handlers guarded), found 1
  already guarded but invisible to the primitive list, made the sweep judge
  the GET handler's own body, and closed the 10 further anonymous GETs that
  per-handler honesty surfaced — the list holds only by-design
  public/editor-surface/reference routes now.
- ~~**Bitly cron never fires**~~ FIXED: `/api/bitly/sync` exports a GET that
  delegates to POST, so the 03:00 UTC Vercel cron (GET) now executes with the
  same auth (cron secret or admin session).
- ~~Stale-SSO admin routes~~ FIXED (messmass#386 wave, 2026-09-04): the two
  remaining `/api/admin/{projects,users}` collection routes authenticated
  against the retired `{SSO_BASE_URL}/api/validate` — always 401, and grep
  found zero callers (the admin UI uses `/api/admin/users/[id]/role`), so
  both routes and the orphaned `lib/ssoClient.ts` were deleted rather than
  repaired. **Correction (re-verified @ dd34e229, 2026-09-28):** two more
  routes with the same pattern survive — `app/api/admin/permissions/route.ts:16`
  and `app/api/admin/projects/[id]/route.ts:16` still call the retired
  `{SSO_BASE_URL}/api/validate` (the endpoint found above to always 401) and
  have no in-app callers. Queued for deletion in §7.

## 1. docs/architecture.md architectural claims (re-verified @ dd34e229, 2026-09-28)
The file is 3,859 lines now (fiction deleted and the changelog archived in
#408/#409); line numbers below are current.
- ~~Dependency versions all wrong (React 18.3.1, Node ≥18, jsPDF 3.0.1, uuid
  11.1.0)~~ FIXED: React ^19.2.6 (:3358), uuid ^14.0.0 (:3363), Node
  >=24.0.0 <25.0.0 (:3378); no jsPDF row, and :3365 states there is no
  html2canvas/jsPDF path.
- ~~"WebSocket (ws) — real-time client-server communication"~~ FIXED: the only
  WebSocket text is the "Removed in v12.2.0" historical block (:3494-3511).
- ~~"No External UI Library" / "TailAdmin V2"~~ FIXED: GDS on Mantine 8 (:3370).
- ~~"Password-Based: admin login with bcrypt"~~ FIXED: SSO-only, 410 noted
  (:3385, :3438).
- ~~Rate limiting "(To be implemented)"; CSRF "SameSite attribute";
  "Middleware validates session on all protected routes"~~ FIXED: rate
  limiting implemented (:3533), CSRF double-submit (:3527), and :3530 now
  states what middleware checks (HS256 signature + expiry of `admin-session`
  for `/admin/**`, F-003) and that role checks stay in each route.
- ~~"Edge Functions: routes on Vercel Edge"~~ FIXED: Node.js serverless runtime,
  none declare `'edge'` (:3422).
- ~~`NEXT_PUBLIC_WS_URL` and `ADMIN_PASSWORD` required; `hooks/useWebSocket.ts`~~
  FIXED: neither is in the env block (:3425-3438); the hook appears only in the
  removed-in-v12.2.0 block.
- ~~Header Version vs footer Version self-contradictory; no section on SSO,
  camera, the auth layers, CSRF or rate limiting~~ FIXED: header :7 and footer
  :3858 agree; "Authentication Model" (:3388-3397) covers SSO, page passwords,
  machine tokens, stakeholder sessions and the camera bridge; CSRF and rate
  limiting are in "Security Measures".
- STILL WRONG: "Project Slug… No Passwords Required" (:3452) — page_passwords +
  requirePageAccess gate /api/projects/{stats,edit}/[slug].
- STILL WRONG: "messmass must therefore never have a runtime dependency on
  fanmass being reachable" (:3755-3756) — /sync and /callbacks make blocking
  outbound calls to FANMASS_BASE_URL (15s timeout).
- STILL WRONG: "Two channels across the boundary" (:3759) — the E2 edge in
  `fleet-architecture.md` has six push channels plus two poll/ack channels.
- STILL MISSING: the DB schema summary (:3476-3492) omits ~15 live collections
  (page_passwords, fanmass_*, ai_*, drive_folder_links, report_variants,
  stakeholder_grants, v3 collections); there is no CORS section although
  `lib/cors.ts` exists.

## 1b. ~~WRONG~~ FIXED (messmass#349, re-verified @ dd34e229, 2026-09-28) — guides and feature docs
- ~~**docs/guides/guides-tutorial-authentication-sso.md**~~ FIXED: Section 4
  rewritten to the real OAuth2 authorization-code flow (login → `/api/oauth/authorize`,
  callback → `/api/oauth/token`, central per-app permission store), auto-provisioning,
  and `no_access` (not `no_account`); the intro, gotcha, and troubleshooting
  `no_account`/pre-provision references were corrected too.
- ~~**docs/features/features-authentication.md**~~ FIXED: the Executive Summary
  ("email/password", "dual-layer"→three layers), the Quick Start "Admin Login" curl
  (was `POST /api/admin/login` → now the SSO flow, 410 noted), and the deep "Login
  Endpoint" section (was email/password + forgeable base64 token → now the SSO callback
  + JWT HS256, F-002) were all corrected. The page-password/pageType items were already
  fixed in the F-009/#376 waves. **This mark was premature until 2026-09-28**: the
  Executive Summary still said "dual-layer" (:17) and Core Concepts still said "base64-encoded
  JSON session token" (:247). Both are now fixed (four layers; JWT HS256 per
  `lib/sessionTokens.ts:2`), along with the `page_passwords` collection name, the deleted
  `stats` pageType, the users schema, and a real "Machine API Keys" section replacing
  "Planned: API Keys".
- ~~**docs/guides/guides-tutorial-camera-app.md:22-24**~~ FIXED: the "one direction"
  claim replaced with the verified bidirectional model — messmass→Camera provisioning
  (org/partner/event) plus the two Camera→messmass inbound channels
  (`POST /api/integrations/camera/partners` upsert, `POST .../sso-session` mint), the
  shared-secret-guards-both-directions nuance, and the operator-backfill token
  distinction. (The sso-session mint and camera-as-email-transport edges are now named.)
- ~~**docs/api/api-reference.md:22-25,287-297** — admin login POST + a whole
  "WebSocket API" section, both fictional.~~ FIXED: :30 documents
  `POST /api/admin/login` as 410 Gone; there is no WebSocket section.
- ~~**README.md**: v12.1.88 badge (:15); websocket start instructions (:68-73);
  NEXT_PUBLIC_WS_URL required (:87); "SSO optional, uses SSO_BASE_URL" (:100 —
  mandatory, needs client id+secret). No mention of camera/fanmass.~~ FIXED
  2026-09-28: badge v12.3.37, no WebSocket or `NEXT_PUBLIC_WS_URL`, SSO-only with
  `SSO_CLIENT_ID`/`SSO_CLIENT_SECRET`/`JWT_SECRET`, and a Fleet section.

## 2. ~~The vestigial WebSocket system~~ REMOVED (code) + docs FIXED (messmass#349)
**Code:** the WebSocket stack was not merely vestigial — it was fully DELETED in
commit c56e70af (v12.2.0, 2026-08-20): `server/` (incl. `server/websocket-server.js`),
`hooks/useWebSocket.ts`, and the `ws` + `@types/ws` deps are gone; nothing opens a
socket; `NEXT_PUBLIC_WS_URL` is consumed nowhere. Live updates are REST + polling only.
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

## 3. ~~The docs:audit gate has a hole~~ FIXED (re-verified @ dd34e229)
~~scripts/docs-consistency-audit.js:93,98 version-header regex matches
`**Version**: X` and `Version: X` but NOT `**Version:** X` — the exact format in
docs/features/features-authentication.md:7, docs/api/api-reference.md:7,
api-public.md:7, all frozen at 12.1.16 (June) and silently passing CI. The gate
also reads only the first 25 lines (missing architecture.md:4647's footer)~~:
`VERSION_LINE_RE` in `scripts/lib/docs-version-check.js` accepts every
`Version:` stamp format including `**Version:** X`, and
`scripts/docs-consistency-audit.js:111-118` scans each current doc's whole
content, header and footer. Still true: it checks path patterns, npm-script
existence, version stamps and fleet-map freshness, never factual accuracy.

## 4. STALE / MISSING (selected)
- docs/low-level-design.md is accurate but covers only 4 subsystems — not a
  low-level design of the system (nothing on auth/integrations/data model);
  its :150 "no mechanical WHAT/WHY blocks" contradicts the repo-wide convention.
- HANDOVER.md stale by 6 patches (v12.1.89 vs .95) but unusually honest;
  its "fanmass always the outbound caller both directions" is true only for the
  new dashboard/command channel, false for the older /sync + /callbacks pull.
- docs/V3/** (16 files) indexed as Active over a small live surface.
  ~~12 routes behind a withOrgContext wrapper with a hardcoded org id~~ FIXED
  (#395, e0f0643f): 14 v3 route files; 11 go through `withOrgContext`
  (`lib/middleware/v3/orgContext.ts`), which resolves the org per user
  (`organizationIds`, else Master) with a superadmin-only `?orgId=` override
  validated against `organizations`; the other 3 use `requireAdmin`
  (metrics/sync) or `validateOrganizationAccess` (organizations/report/[id] and
  its /activities).
- ~~docs/V3/messmass_v3_api_specification.md:22 lists `GET /api/v3/activities/{id}`
  and :99 claims `useReportData` "bridges V3 Activities"~~ FIXED 2026-09-07
  (v12.3.22): the route never existed; the hook's fallback to it was dead code
  that turned every protected event report's 401 into a JSON-parse crash. Spec
  and playbook now say so; fallback deleted.

## 5. CURRENT (verified — the good news)
- **docs/design/design-system.md is the most accurate major doc** (v12.1.95;
  GDS/Mantine/theme all verified; localAdapters cross-checked by gds:sync CI).
  Its "no TailAdmin" rule directly contradicts architecture.md:4136 —
  architecture.md is the wrong one.
- **docs/guides/guides-tutorial-fanmass.md** is the single best integration doc
  (two-layer framing, env table, failure codes, contract name all verified) —
  only gap is it predates v12.1.89 (no dashboard-snapshot/command/rescan channels).
- AI-analytics contract-versioning, distinct()/Stable-API notes, page-password
  and integration-token internals — verified.

## 6. ~~Comment health~~ RESOLVED (messmass#353, re-verified @ dd34e229, 2026-09-28)
- WHAT/WHY adherence good but uneven: integration/auth surface (lib/fanmass*,
  aiRescan, apiGuards, pageAccess, app/api/integrations/**) is best-in-repo
  (comments explain tradeoffs). ~~lib/sponsorshipHub.ts is 1432 lines with ZERO
  comments~~ FIXED: it now carries a WHAT/WHY/SOURCES header explaining it is the
  single sponsorship-hub read model behind the four scopes and three admin
  surfaces. (app/api/partners/route.ts is now guarded — F-009/#386.)
- 8 TODO/FIXME total across a 45k-LOC lib/; ~zero commented-out code.
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
  cameraClient.ts's header/assert comment now names the real inbound endpoints.
  ~~lib/v3/middleware.ts uses symbolic constants (`DEFAULT_ORG_ID`/`MASTER_ORG_ID`)
  in distinct branches — no hardcoded production org ObjectId.~~ The file is gone:
  e0f0643f (#395) found its sentinel strings matched no real organization and
  deleted it; the one caller (v3/health) now uses `lib/middleware/v3/orgContext.ts`.
  The stale password-as-key comments in `lib/apiAuth.ts` and `lib/users.ts` (left
  after 6f31990d removed that fallback) were corrected 2026-09-28. The fit-in-fleet
  one-pager (docs/_audit/messmass-in-the-fleet.md) exists.

## 7. Obsoletion queue
- Dead routes: ~~app/api/me, app/api/images (phantom cookies)~~ FIXED 2026-08-20
  (c56e70af, v12.2.0); the 4 legacy SSO-validate admin routes: 2 deleted
  2026-09-04 (`/api/admin/{projects,users}`, 62a47a0d, messmass#386, see §0),
  2 still queued — `app/api/admin/permissions/route.ts` and
  `app/api/admin/projects/[id]/route.ts` (both call the retired
  `{SSO_BASE_URL}/api/validate` at :16; no in-app callers). Also still queued:
  app/api/stats, app/api/admin/hashtag-style (now admin-guarded, §0),
  sports-db/lookup, debug/{overview-block, categorized-hashtags}.
- Dead components (zero importers): ~~BlockEditor, LandingReportRoot,
  LandingValueChainSection + /api/landing-report~~ FIXED 2026-08-20 (c56e70af,
  v12.2.0); ~~HashtagInput~~ FIXED 2026-09-08 (messmass#351 leftovers, this
  change — `UnifiedHashtagInput` is the live component and was never affected).
- Dead libs: ~~lib/webhooks.ts (474 lines, zero importers)~~ FIXED 2026-08-20
  (c56e70af); ~~app/api-docs advertised the webhook system~~ FIXED 2026-09-08
  (messmass#351, this change — nav link, feature bullet, `#webhooks` section
  and the "use webhooks instead of polling" tip removed); ~~lib/shareables/**
  (incl. passwordAuth.ts with 'admin123' fallback)~~ FIXED 2026-08-20
  (c56e70af); ~~lib/ssoClient.ts~~ FIXED 2026-09-04 (messmass#386);
  ~~duplicate lib/v3/middleware.ts~~ FIXED 2026-09-17 (deleted in e0f0643f,
  #395). Follow-on: `scripts/verify-v3-middleware.ts` still imports it and no
  longer runs (listed in `scripts-keep-list.md` only because AGENTS.md named it).
- Dead infra: ~~entire server/ dir + tracked macOS-duplicate files
  (`package 3.json`, `server/.env 3.local`, etc.); ws/@types/ws dependency~~
  FIXED 2026-08-20 (c56e70af, v12.2.0; the `websocket` package.json keyword
  followed 2026-09-08, messmass#351). ~~~310 of 400 scripts/ unreferenced incl.
  macOS duplicates (`add-kpi-chart 3.js` …)~~ FIXED 2026-09-08 (messmass#352,
  this change): 315 of 421 tracked scripts deleted, 106 kept; derivation and
  the per-script reason in `scripts-keep-list.md`. ~~The CI forbidden-color
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

## 8. Highest-value fixes, ranked
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

## 9. Wave 2026-09-16 — documentation audit (Phase 5) and the sweeps it triggered

Twelve findings (F-025 … F-036) closed, plus four earlier security findings.
Recorded here because several corrected claims this register had certified.

**architecture.md: 4,665 → 3,799 lines.** 43 falsifiable claims were verified
false; roughly 85% of its file-path and line-count claims failed. Deleted as
fiction: the Page Styles System (487 lines of invented endpoints and a hook),
the Formula Validation System (built on a component that does not exist), the
PDF export section describing html2canvas and jsPDF (neither is a dependency),
the chart-type-to-component mapping, and nine "Future Enhancements" blocks.
293 lines of narrative moved to `docs/archive/architecture-changelog-2026-09.md`.
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

**Security posture moved materially.** F-003: the middleware `/admin/**` gate
tested cookie *presence* — `admin-session=x` passed. It now verifies HS256 via
Web Crypto (`lib/edgeSessionToken.ts`; the existing validator cannot load in the
Edge runtime). F-025: 26 routes documented admin-only and enforced no role.
Five routes accepted anonymous writes, three demonstrated live against the
running app, not inferred — including `/api/hashtag-categories`, which was not
unguarded but carried a local `validateAdminAccess()` returning true whenever an
`admin-session` cookie was merely present, i.e. F-003 re-implemented in one file.

**Dead code**: 1,610 lines across five modules, each with authoritative-sounding
comments and zero importers. Plus 70 unreachable CSS selectors, and 86 applied
classes that styled nothing — Tailwind names in a repo with no Tailwind, which
is why every `alert alert-danger` banner rendered as bare text.

~~**Still open, deliberately**: F-011 (rotate the two service-account API keys —
`apiKeyHash` already exists and neither key has ever been used), F-004 (v3 org
scoping needs a tenancy policy before it can resolve from `organizationIds`),
F-007 (202 orphaned `page_passwords` rows — a production delete).~~ All three
closed 2026-09-16/17: F-011 by 6f31990d (#397, the plaintext passwords that
doubled as API keys retired; `apiKeyHash` is the only path), F-004 by e0f0643f
(#395, per-user org resolution plus a validated superadmin override), F-007 by
e098deaa (#390, the 202 orphaned rows removed).

