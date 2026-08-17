# Session Handover — messmass

Last verified: 2026-08-17, HEAD `434380d1` (v12.1.86, committed/pushed/CI-green).
The "Fanmass nav item" work below (section 0) is now **done, verified, and
about to be committed as v12.1.87** in this same session — read it for
what shipped, not as a resume-first item. Also fixed this session:
`docs/HANDOVER.md` was a five-week-stale duplicate of this file, silently
excluded from `npm run docs:audit` — it's now a short pointer here instead,
and every doc that pointed agents at it (`AGENTS.md`, `README.md`,
`READMEDEV.md`, `docs/NEXT_AGENT_PROMPT.md`,
`docs/features/features-overview.md`) was repointed. See v12.1.86's release
notes entry for the full list.

---

## 0. "Fanmass nav item" — done, v12.1.87

**Plan file (approved by user, read this in full before touching anything)**:
`/Users/chappie/.claude/plans/pure-cuddling-swan.md` — "Phase 1: single
'Fanmass' nav item in messmass admin". If that path doesn't exist in your
environment, the plan is fully reconstructable from this section.

**What this is**: user wants messmass's admin panel to have one new nav item,
"Fanmass", that links out (new tab, `target="_blank"`) to fanmass's own web
UI pages (Executive Dashboard, Analytics, Run Control, Entity Curation
[rename/merge/reclassify brand-vs-club entities], Settings). Explicitly
**not** an iframe embed (user chose plain links over iframe when asked —
iframe was technically viable, zero blocking headers on fanmass's side, but
user wanted the simpler zero-cross-origin-risk option). Explicitly **not**
deep integration — that's a separate, later planning exercise, not started.

**Shipped as v12.1.87**, all six files below:
1. `lib/config.ts` — added `fanmassAppUrl?: string` to the `AppConfig` type
   (near the other `fanmass*` fields, ~line 60) and
   `fanmassAppUrl: getEnv('FANMASS_APP_URL')` to the config binding
   (~line 154). **Distinct** from the pre-existing `fanmassBaseUrl` — that
   one is the server-to-server API base used by
   `lib/fanmassIntegration.ts`, not necessarily the same origin as the
   human-facing web UI.
2. `app/admin/fanmass/page.tsx` (new file) — plain **server component** (no
   `'use client'`, no hooks — just static links built from
   `config.fanmassAppUrl`). Renders one `AnalyticsSectionCard`
   (`@/components/analytics/AnalyticsSectionCard`) containing a
   `FANMASS_PAGES` array of 5 entries (Executive Dashboard
   `/dashboard/executive`, Analytics `/dashboard/analytics`, Run Control
   `/dashboard/run-control`, Entity Curation `/dashboard/annotation`,
   Settings `/dashboard/settings`), each rendered as a card with a
   `target="_blank" rel="noopener noreferrer"` anchor. If
   `config.fanmassAppUrl` is falsy, renders an explanatory empty state
   instead of dead links.
3. `app/admin/fanmass/page.module.css` (new file) — matches the existing
   `.wrapper` flex-column pattern from
   `app/admin/analytics/ai/AiAnalyticsView.module.css`; design tokens only,
   no hardcoded colors (would fail `npm run style:check` otherwise).
4. `lib/adminNavigation.ts` — added a `Fanmass` item to the `analytics`
   section's `items` array (right after `Insights`, before the section
   closes), `path: '/admin/fanmass'`, `icon: 'query_stats'`.
5. `lib/permissions.ts` — added `'Fanmass': ['admin', 'superadmin']` to
   `MENU_PERMISSIONS` (same tier as the other dashboard-style items in that
   section). **This step is load-bearing**: a nav label missing from
   `MENU_PERMISSIONS` is invisible to every role, and
   `tests/nav-menu-permissions.test.ts` will fail without it.
6. `.env.example` — documented the new `FANMASS_APP_URL` var (defaulted to
   `http://localhost:8787` as an example value) right after the existing
   `FANMASS_INTEGRATION_TOKEN` line.

**Verified before commit**: `type-check`, `lint`, the targeted
`tests/nav-menu-permissions.test.ts` then the full suite (363/363 passing),
`style:check`, a clean `rm -rf .next && npm run build` (confirmed no live
`next dev` process was running against this `.next` first), dependency and
layout guardrails, and a secret-scan of the diff — all clean.

**What was not verified, and why**: a live signed-in browser click-through
to confirm "Fanmass" renders in the sidebar and `/admin/fanmass` looks right.
messmass is SSO-only with no local dev-login bypass in this repo, and this
local environment's `.env.local` has no `FANMASS_*` vars set — so instead,
`app/admin/fanmass/page.tsx` was read directly to confirm its empty-state
branch (`!baseUrl`) is what actually renders when `FANMASS_APP_URL` is
unset, which it is here. **Whoever next has real SSO access and a
`FANMASS_APP_URL`/reachable fanmass instance should do the actual
click-through** — don't assume this substituted for it.

---

## 1. Standing rules for this repo (apply to everything below and everything after)

- **Every push to `origin/main` gets a version bump.** Not optional, not
  something to ask about — established as a hard rule after explicit user
  correction earlier in this engagement. See step 7 above for the exact
  mechanics.
- **Every push gets watched to completion in CI**
  (`gh run watch <id> --exit-status`), never assumed green from a
  successful `git push`.
- **Never claim a UI/data fix works without checking the real thing** — a
  running app, a live database read, a browser screenshot. Type-check and
  lint passing is necessary, not sufficient. This exact lesson got relearned
  twice this session (see section 3 below).
- **AI-branding ban**: no `Co-Authored-By`, no assistant names, no session
  links anywhere — commits, PRs, code, docs, UI, logs, config.
- messmass's real quality gate is `.github/workflows/ci.yml`:
  `type-check`, `lint`, `test`, `build`, `version:verify`, `style:check`,
  `docs:audit`, `gds:sync`, `gds-compliance check` (non-blocking),
  dependency + layout-grammar guardrails.

---

## 2. GDS 6.1.0 adoption plan — still open (unrelated to the Fanmass work above)

Separate, older effort, still genuinely mid-flight. Full plan was at
`/Users/chappie/.claude/plans/pure-cuddling-swan.md` — **that file has since
been overwritten by the Fanmass plan in section 0**, so the GDS plan's own
document no longer exists standalone; everything you need is summarized
here.

**Done and pushed** (verified, CI-green, through v12.1.81): Phase 0
(baseline), Phase 1 (fixed 3.9.0-vs-6.0.0 version drift, now genuinely on
GDS 6.1.0 via vendored GitHub Release tarballs — registry install was tried
and abandoned, see section 3a of the version history if you need the
why), Phase 2 (`gds-adoption.json` governance manifest), Phase 3 (root
`GdsProvider` is the only provider in the tree — no raw `MantineProvider`,
no nested per-route workaround), Phase 4a (17 of ~80 `theme.css` color
values aliased to GDS/Mantine CSS variables — the ones verified
byte-identical; the rest have no exact GDS equivalent, Tailwind-derived vs.
Open Color-derived palettes), Phase 5 component 1 of 10
(`ConfirmDialog` retired for `GdsConfirmProvider`/`useGdsConfirm`).

**Open — Phase 4b**: token bridge, remainder. Most of `theme.css`'s
remaining ~63 color values have no exact GDS match — retiring them needs a
deliberate replacement-color choice + visual review, not a mechanical
alias. Genuinely unstarted.

**Open — Phase 5**, 9 of 10 components remaining, in this order (smallest
blast radius → largest, per the plan's own reasoning):
`components/modals/BaseModal.tsx` → `AdminModal`/`GdsModal`;
`components/modals/FormModal.tsx` → `AdminCrudForm`;
`components/admin/AdminActionRail.tsx` → `ActionBar` (update
`tests/admin-action-rail.test.tsx` +
`tests/mobile-admin-action-contract.test.ts` in the same PR);
`components/UnifiedCardView.tsx` → `AdminResourceGrid`;
`components/UnifiedListView.tsx` → `AdminDataTable`/`ResponsiveDataView`
(may collapse with the previous one — GDS names `ResponsiveDataView` as the
canonical target for exactly this list/card-toggle pattern);
`components/UnifiedAdminHeroWithSearch.tsx` → `PageHeader`;
`components/UnifiedAdminPage.tsx` → `AdminResourceManager` (orchestrator,
migrate after the three above since it composes them);
`components/AdminLayout.tsx` → `AppShell` (**do this last** — backs the
whole admin section, largest blast radius);
`components/TopHeader.tsx` → `WorkspaceHeader`.
Deferred/out of scope: `GdsAccessGate` for
`ServerPageGate.tsx`/`PagePasswordLogin.tsx`.

**Open — Phase 6**: flip `gds-adoption.json`'s `compliance.strictMode` to
`true`, promote `gds-compliance check` from non-blocking to a hard CI gate,
add `@sovereignsquad/gds-eslint-config` (needs ESLint 9/10, messmass is on
8.57.0 — separate migration).

---

## 3. AI Analytics status fixes — done, pushed, verified (v12.1.79, v12.1.84, v12.1.85)

The user flagged (with screenshots) that AI-analysis status was
misleading in multiple, compounding ways. All fixed and shipped:

**v12.1.79** — 153 camera-linked events with zero photos were stuck showing
"Analysing" forever. Root cause: `percent(0, 0) = 0` in
`lib/aiAnalytics.ts`'s `deriveEventStatus()` could never reach the 100%
needed for `'complete'`, so it fell into `'analyzing'` with nothing actually
running. Added a distinct `'no_images'` status. Also added "based on X of Y
images analysed (Z%)" captions to every place a brand/merch/demographic
number is shown, so partial results are never mistaken for final ones.

**v12.1.84** — the deeper bug: fanmass has always sent a `summary.status`
field (`'ready'|'partial'|'running'`) and a `summary.warnings` array,
**stored in MongoDB's `ai_analysis_summaries` collection the whole time,
never read by any messmass code**. The base-image-pass counter hitting 100%
does not mean fanmass's deep analysis (brands/merch/demographics) is done —
that's a separate, slower pass. Confirmed against live production: 4 of 5
flagged events had `fanmassStatus: 100` (messmass showed "Images complete")
while their stored summary said `status: "partial"` with an explicit
`"Fanmass analysis is not complete yet."` warning. `getAiEvents()` now
downgrades `'complete'` → `'analyzing'` whenever the base pass is 100% but
`deepStatus !== 'ready'`.

**v12.1.85** — follow-up: the v12.1.84 fix wired this into the events list
and the per-event report's top banner, but **missed the per-event report's
own section captions** (Brands, Clubs & federations, Merchandise, Fan
demographics) — they still computed their own "(100%)" claim independently
and kept contradicting the banner right above them. `imageProgressNote()`
in `AiEventReportView.tsx` now takes a `deepStatus` param; when it isn't
`'ready'`, all four captions say "Deep analysis still running" instead of a
percentage. Swept the whole app for every other place rendering these
numbers (`grep` for `brandMentions`/`merchandiseCounts`/
`demographicsAnalyzed`/`brandCount`/`merchandiseCount`) — confirmed only
these two files render them, both fixed.

**Still genuinely open, not decided**: does the "based on X/Y (Z%)" caveat
need to reach **client-facing** report/dashboard pages (the ones built from
`fanmass*` formula-engine variables, a completely different rendering path
from the admin AI Analytics workspace), or is admin-only sufficient? User
never answered this scoping question directly — don't assume either way,
ask before building it.

---

## 4. Hard-won lessons this session (don't relearn these)

- **A runtime string-array whitelist (`VALID_STATUSES: T[] = [...]`) is not
  type-exhaustive.** Adding a value to a union type does not force every
  array of that type to update — `type-check` won't catch a missed one.
  Happened with `app/api/analytics/ai/events/route.ts`'s `VALID_STATUSES`
  when adding the `no_images` status.
- **Destructuring a hook's return value can silently shadow a global.**
  `const { confirm } = useGdsConfirm()` shadows `window.confirm` for the
  rest of that component's scope — broke two pre-existing native
  `confirm()` calls in `clicker-manager/page.tsx` and `visualization/page.tsx`,
  caught by `type-check`, not by inspection.
- **A CSS variable alias is only a true no-op if verified byte-identical**,
  not "probably close enough" — checked programmatically
  (`getComputedStyle` in a live browser) before trusting it.
- **Don't run `npm run build` while a `next dev` process is live against
  the same `.next` directory** — corrupts the dev server's asset manifest
  (mass 404s on static chunks, page renders completely unstyled). Not a
  code bug; restarting the dev server fixes it with zero code changes. Hit
  this exact thing again this session despite it being in an earlier
  handover already.
- **Verify against the real system, not just green checks.** The AI
  Analytics status bug (section 3) type-checked and passed lint/tests for
  who knows how long before anyone actually looked at what the numbers
  meant against live data. When a user says "I want to know the actual
  status," that means read the real database/API response, don't infer
  from what the code appears to compute.
- **A plan file gets overwritten by the next `EnterPlanMode` session** —
  if there's a still-relevant old plan (like the GDS one), its content
  needs to be captured somewhere durable (like this handover) *before*
  starting a new planning session, or it's gone.
