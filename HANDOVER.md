# Session Handover — messmass

Last verified: 2026-08-17 (v12.1.89, committed/pushed).

**Fanmass Unified Dashboard & Settings v1 shipped this session**
(messmass#336–#342, plus fanmass#79–#81 in the sibling repo). `/admin/fanmass`
went from a static five-card outbound-link grid to a native, tabbed
dashboard (Executive Dashboard, Analytics, Run Control, Entity Curation,
Settings) fed by a new asynchronous push/poll channel — Fanmass has no
public URL and is always the outbound caller in both directions, exactly
mirroring the existing `ai_rescan_requests` pattern rather than inventing a
new mechanism. See `docs/operations/operations-release-notes.md`'s
`[v12.1.89]` entry for the full file list and known limitations.

**Two coordination gaps found and closed while implementing, not left as
open TODOs**: (1) `fanmass#340`'s stop-batch command needs a `runId`, which
the originally-scoped snapshot payload didn't carry — added `activeRun` to
fanmass's `build_dashboard_snapshot()`. (2) `fanmass#341`'s issue draft
assumed `entity.confirm_cluster`/`reject_cluster` meant reclassify/delete on
the entity catalog; the real dispatcher (fanmass#80) uses them for
face-cluster confirm/reject, a different concept, and has no delete
handler at all — the UI was built against what the dispatcher actually
does, and the delete button was deliberately left out rather than wired to
a command type that would sit "unrecognized, pending forever."

**Not done — messmass#343 (release-gate issue), the initiative's capstone**:
requires a live SSO-authenticated browser session (screenshots, real
click-throughs) and both processes running against each other, neither of
which this session had access to. Everything gate-able without a browser
session (full local `type-check`/`lint`/`test`/`style:check`/`build`,
grep-verified no Messmass→Fanmass call path in the new code, three-layer
settings-allowlist rejection proven via `tests/fanmass-settings-allowlist.test.ts`
+ fanmass's `scripts/smoke_settings_writeback.py`) is done; the rest needs a
human operator with real admin credentials.

---

## 0. Prior housekeeping session (2026-08-17, v12.1.88, committed/pushed/CI-green)

**Housekeeping done that session** (repo hygiene sweep, all verified):
- `coverage/` (456 tracked files) untracked and added to `.gitignore` —
  it's `npm run test:coverage` output, never should have been committed.
  This stops further growth of the 460MB `.git`; it does **not** shrink the
  existing history — that needs a `git filter-repo` pass, which rewrites
  every commit SHA and requires a coordinated force-push + all-clones
  re-clone. Deliberately not done unilaterally; get explicit sign-off
  first if you want to reclaim that space.
- `Archive.zi2.zip` (3.7MB, a macOS-zipped snapshot of old `app/` files
  including `__MACOSX/` cruft and `.DS_Store`) removed — violated
  `docs/root-structure.md`'s own canonical-root list and had no reachable
  purpose.
- `ADMIN_PASSWORD` removed from `.env.example` — confirmed dead: not read
  anywhere in live `app/`/`lib/` code except the unused `config.adminPassword`
  field binding and an entirely unreferenced demo module
  (`lib/shareables/auth/passwordAuth.ts`, which also hardcodes an
  `'admin123'` fallback — dead code, not a live vuln, but worth deleting in
  a future pass). Local admin login is 410 Gone; this var did nothing.
- Stale GDS version references fixed in `README.md` and
  `docs/coding-standards.md` — both said GDS packages resolve from the
  **published registry at 3.9.0**, which was backwards: the real, current
  mechanism is vendored GitHub Release tarballs under `vendor/gds/` at
  **6.2.0** (registry install was tried and abandoned — see the GDS section
  below). `docs/coding-standards.md`'s own `**Version:**` header was also
  stale at 12.1.16 (from June) — bumped to 12.1.88.
- `README.md`'s version badge and "Current release version" line were
  stale at v12.1.85 — bumped to v12.1.88. Note `npm run version:verify`
  does **not** catch README drift — it only gates `package-lock.json` (×2)
  and the release-notes entry. The `docs/architecture.md` /
  `docs/low-level-design.md` `Version:` headers are separately correct
  (already 12.1.88) but are a **manual** bump, not automated by
  `scripts/update-version.js` — that script only touches the lockfile and
  release notes. Don't assume "ran version:update" covers doc headers.

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

## 2. GDS adoption plan — now on 6.2.0, Phase 4b/5/6 still open

Separate, older effort, still genuinely mid-flight. Full plan was at
`/Users/chappie/.claude/plans/pure-cuddling-swan.md`, since overwritten by a
later plan — everything you need is summarized here.

**Done and pushed** (verified, CI-green): Phase 0 (baseline), Phase 1 (fixed
3.9.0-vs-6.0.0 version drift, on GDS 6.2.0 via vendored GitHub Release
tarballs under `vendor/gds/` — registry install was tried and abandoned),
Phase 2 (`gds-adoption.json` governance manifest), Phase 3 (root
`GdsProvider` is the only provider in the tree — no raw `MantineProvider`,
no nested per-route workaround), Phase 4a (17 of ~80 `theme.css` color
values aliased to GDS/Mantine CSS variables — the ones verified
byte-identical; the rest have no exact GDS equivalent, Tailwind-derived vs.
Open Color-derived palettes), Phase 5 component 1 of 10
(`ConfirmDialog` retired for `GdsConfirmProvider`/`useGdsConfirm`).
camera is also on GDS 6.2.0 (its own vendored tarballs, v2.24.0) — the two
apps aren't required to move in lockstep, but currently do.

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

**Open — Phase 6, gate readiness verified this session (corrects a stale
number)**: CI's non-blocking `npx gds-compliance check` currently reports
**24** `forbidden-color` findings, not the "111" figure previously quoted
in this file and the CI comment — that 111 turns out to be the count under
`compliance.strictMode: true`, not the real baseline. Tested `strictMode:
true` directly this session (scratch edit to `gds-adoption.json`, reverted,
never committed): it surfaces **486** findings across 12 rule families
(`strict.raw-color` 110, `strict.raw-control` 105, `strict.inline-style`
46, `strict.browser-dialog` 42, `strict.import.mantine-core` 22,
`strict.raw-table` 14, and more) — confirming Phase 6 is genuinely blocked
on Phase 5 landing, not just unstarted paperwork. The current 24
non-strict findings are all in `scripts/` and one `tests/` fixture file —
zero in `app/`, `components/`, or `lib/`. They **cannot** be scoped out via
`gds-adoption.json`'s `approvedExceptions`: read the vendored
`node_modules/@sovereignsquad/gds-compliance/index.js` directly and
confirmed `forbidden-color` (unlike the `strict.*` family) is pushed
unconditionally from `scanSourceFile()`, with no exception-suppression
path, and the file walker's `IGNORED_DIRS` (`node_modules`, `.git`,
`.next`, `dist`, `coverage`) is a hardcoded constant, not manifest-
configurable — `scripts/`/`tests/` can't be excluded from the walk either.
Zeroing these out for real means either editing each of the ~23 files
(raw hex literals in one-off debug/seed/test scripts — low value, since
none of it is shipped UI) or asking upstream GDS to add a
scripts/tests-exclusion mechanism. Don't add `@sovereignsquad/gds-eslint-config`
yet either (needs ESLint 9/10, messmass is on 8.57.0 — separate migration).

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
