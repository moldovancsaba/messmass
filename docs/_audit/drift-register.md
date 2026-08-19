# messmass drift register — fleet audit P3, first edition

Generated 2026-08-19 against HEAD `6d28c7f3` (v12.1.95) by the fleet
documentation audit (messmass#345; method in messmass#344). Every claim
carries file:line evidence. Verdicts: WRONG / STALE / MISSING / CURRENT.
This file is intentionally header-less so the docs:audit version gate does
not bind it to a version it is not about.

## 0. Behavior findings escalated out of the docs audit (see messmass#347)
- **Cron auth bypass**: app/api/cron/analytics-aggregation/route.ts:51 uses
  `process.env.CRON_SECRET || 'development_secret'` — any caller passing
  `Bearer development_secret` authenticates when CRON_SECRET is unset.
- **Unauthenticated mutating routes**: the 8 `/api/partners/[id]/google-sheet/*`
  routes (connect/push/pull/provision/…) and `POST /api/admin/hashtag-style`
  have no auth primitive. `tests/api-mutation-auth.test.ts` freezes a
  `KNOWN_UNGUARDED` set (~31 mutating routes labelled [public]/[debt]) and only
  fails CI on NEW unguarded mutating routes — read-only anonymous analytics/
  executive/report routes are not covered at all.
- **Bitly cron never fires**: vercel.json:3-6 schedules `/api/bitly/sync` but
  the route exports POST only (route.ts:174) and Vercel crons issue GET → 405.
- Four `/api/admin/{permissions,projects,projects/[id],users}` routes still
  authenticate against the retired `{SSO_BASE_URL}/api/validate` (lib/ssoClient.ts).

## 1. WRONG — docs/architecture.md architectural claims (4649 lines; the
changelog was extracted to docs/archive on 2026-08-17, so the body claims
current state and is fully in scope)
- Dependency versions all wrong: React 18.3.1 (:4123) vs ^19.2.6; Node ≥18
  (:4145) vs >=24; jsPDF 3.0.1 (:4128) vs ^4.2.1; uuid 11.1.0 (:4131) vs ^14.
- "WebSocket (ws) — real-time client-server communication" (:4129) — ws is
  installed but nothing in app/components/hooks/contexts opens a socket.
- "No External UI Library: built from scratch" (:4137) and "TailAdmin V2"
  (:4136) — actual mandated stack is Mantine 8 + vendored GDS 6.2.0
  (docs/design/design-system.md:21-23,33 forbids TailAdmin).
- "Password-Based: admin login with bcrypt" (:4153) — local login is 410 Gone
  (app/api/admin/login/route.ts:20-25); SSO OAuth is the only path.
- "Rate Limiting: (To be implemented)" (:4285) — shipped (lib/rateLimit.ts,
  middleware.ts:64-78). "CSRF: SameSite attribute" (:4280) — real mechanism is
  double-submit token (lib/csrf.ts). "Middleware validates session on all
  protected routes" (:4283) — middleware does NO API auth; 76 route files have none.
- "Edge Functions: routes on Vercel Edge" (:4274) — many force runtime='nodejs'.
- `NEXT_PUBLIC_WS_URL` and `ADMIN_PASSWORD` listed as required env
  (:4185-4186) — both dead/unconsumed. "hooks/useWebSocket.ts" (:4248-4263) —
  file does not exist.
- "Project Slug… No Passwords Required" (:4204-4218) — page_passwords +
  requirePageAccess gate /api/projects/{stats,edit}/[slug].
- DB schema summary (:4222-4238) omits ~15 live collections (page_passwords,
  fanmass_*, ai_*, drive_folder_links, report_variants/templates, v3 collections).
- "Two channels across the AI/fanmass boundary" (:4537-4540) — 18 fanmass
  endpoints exist. "messmass must never depend on fanmass being reachable"
  (:4530) — /sync and /callbacks make blocking outbound calls to FANMASS_BASE_URL.
- Header Version 12.1.95 (line 7) vs footer Version 12.1.33 / 2025-10-19
  (:4647) — self-contradictory. No section at all on SSO, camera, the three
  auth layers, or CSRF/CORS/rate-limit (MISSING).

## 1b. WRONG — guides and feature docs
- **docs/guides/guides-tutorial-authentication-sso.md** (worst drift): teaches
  email+password login at /admin/login (:17,33 — returns 410) and a
  token-validate SSO flow that auto-provisions denial (:66-83 — all wrong; real
  flow is OAuth2 auth-code + central permission store and DOES auto-provision;
  `no_account` replaced by `no_access`).
- **docs/features/features-authentication.md** (Canonical:Yes, v12.1.16): curl
  POST /api/admin/login returning a token (:58-78 — 410); POST /api/page-passwords
  with no auth (:80-101 — now requires requireSession, the leak it caused was
  fixed); `pageType:"stats"` (:86 — not in allowlist, correct is event-report);
  "dual-layer" (:16 — there are three layers).
- **docs/guides/guides-tutorial-camera-app.md:22-24** "one direction, camera
  does not create partners back in messmass" — WRONG; POST
  /api/integrations/camera/partners inserts new partners (lib/cameraPartnerSync.ts:77).
  Missing: the sso-session mint edge and camera being messmass's email transport.
- **docs/api/api-reference.md:22-25,287-297** — admin login POST + a whole
  "WebSocket API" section, both fictional.
- **README.md**: v12.1.88 badge (:15); websocket start instructions (:68-73);
  NEXT_PUBLIC_WS_URL required (:87); "SSO optional, uses SSO_BASE_URL" (:100 —
  mandatory, needs client id+secret). No mention of camera/fanmass.

## 2. The vestigial WebSocket system — every live doc still claiming it works
server/websocket-server.js exists (251 lines, :7654) with ZERO client
connections anywhere. Docs asserting it is live: README.md:30,33,68-73,87;
AGENTS.md:65; docs/architecture.md:1601,1660,4129,4175,4185,4248-4263;
docs/api/api-reference.md:287-297; docs/operations/ops-warp.md:90-91,289-321,999;
docs/features/features-authentication.md:717; .env.example NEXT_PUBLIC_WS_URL;
package.json:4,13 (description + keywords); and server/.env 3.local (a tracked
.env pointing at a Railway URL). docs/operations/operations-roadmap.md:473 lists
it as a FUTURE item — self-contradicting all the above.

## 3. The docs:audit gate has a hole
scripts/docs-consistency-audit.js:93,98 version-header regex matches
`**Version**: X` and `Version: X` but NOT `**Version:** X` — the exact format in
docs/features/features-authentication.md:7, docs/api/api-reference.md:7,
api-public.md:7, all frozen at 12.1.16 (June) and silently passing CI. The gate
also reads only the first 25 lines (missing architecture.md:4647's footer) and
checks only path patterns + npm-script existence + version headers, never
factual accuracy.

## 4. STALE / MISSING (selected)
- docs/low-level-design.md is accurate but covers only 4 subsystems — not a
  low-level design of the system (nothing on auth/integrations/data model);
  its :150 "no mechanical WHAT/WHY blocks" contradicts the repo-wide convention.
- HANDOVER.md stale by 6 patches (v12.1.89 vs .95) but unusually honest;
  its "fanmass always the outbound caller both directions" is true only for the
  new dashboard/command channel, false for the older /sync + /callbacks pull.
- docs/V3/** (16 files) indexed as Active but the live V3 surface is 12 routes
  behind a withOrgContext wrapper with a hardcoded org id.

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

## 6. Comment health
- WHAT/WHY adherence good but uneven: integration/auth surface (lib/fanmass*,
  aiRescan, apiGuards, pageAccess, app/api/integrations/**) is best-in-repo
  (comments explain tradeoffs); older analytics/partner code is bare —
  lib/sponsorshipHub.ts is 1432 lines with ZERO comments; app/api/partners/route.ts
  (unauthenticated CRUD) has 5%.
- 8 TODO/FIXME total across a 45k-LOC lib/; ~zero commented-out code.
- Comments contradicting code (9): lib/auth.ts:61-63 (both ternary branches
  identical — permissions NOT derived from role), :93 ("4-tier" — 5 roles);
  app/api/me/route.ts:25-41 and app/api/images/route.ts:34-48 read phantom
  cookies `admin_session`/`page_auth` (real: `admin-session`/`page-access`) so
  both routes ALWAYS return unauthenticated/401 — dead; lib/config.ts:113-114
  vs :124-125 (fallback that doesn't exist); drive-folders/status/route.ts:6-7
  ("HMAC-signed callback path" that doesn't exist); cameraClient.ts:13 (wrong
  route path); lib/v3/middleware.ts:24-26 hardcodes a production org ObjectId in
  both ternary branches.

## 7. Obsoletion queue
- Dead routes: app/api/me, app/api/images (phantom cookies), app/api/stats,
  app/api/admin/hashtag-style, sports-db/lookup, debug/{overview-block,
  categorized-hashtags}, the 4 legacy SSO-validate admin routes.
- Dead components (zero importers): BlockEditor, HashtagInput, LandingReportRoot,
  LandingValueChainSection — removing the last two also kills /api/landing-report.
- Dead libs: lib/webhooks.ts (474 lines, zero importers, yet app/api-docs
  advertises a webhook system); lib/shareables/** (incl. passwordAuth.ts with
  'admin123' fallback); lib/ssoClient.ts; duplicate lib/v3/middleware.ts.
- Dead infra: entire server/ dir + tracked macOS-duplicate files
  (`package 3.json`, `server/.env 3.local`, etc.); ~310 of 400 scripts/
  unreferenced incl. macOS duplicates (`add-kpi-chart 3.js` …) — pruning clears
  the CI carve-out for 24 forbidden-color findings "all in scripts/".
- DO NOT treat as dead: all /api/integrations/{fanmass,camera}/** (fanmass and
  camera call them with tokens), /api/public/** (external Bearer), /api/cron/**.

## 8. Highest-value fixes, ranked
1. Remove the `'development_secret'` cron fallback (auth bypass).
2. Guard/delete the 8 google-sheet + hashtag-style unauthenticated mutations.
3. Fix the docs:audit version regex to accept `**Version:** X` (3 canonical
   docs frozen at 12.1.16 pass CI today).
4. Delete server/, lib/webhooks.ts, lib/shareables/, 4 dead components,
   app/api/{me,images}; drop ws/@types/ws; strip WebSocket claims from the 10
   doc locations in §2.
5. Rewrite the SSO/auth guide + features-authentication.md against
   app/api/auth/sso/callback/route.ts (both instruct readers to use a 410 endpoint).
