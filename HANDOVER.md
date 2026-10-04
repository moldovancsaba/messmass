# Session Handover — messmass

Last verified: 2026-10-04 (v12.3.40, 68cdee0b = production).

**2026-10-02 status (verified against git, GitHub, Vercel and the local Mac)**
- **Versions and production.** messmass, camera, fanmass, try-on and savetheworld
  are on 12.3.40 (sso 5.41.0). messmass `3e3fc847`, savetheworld `052ef84` and
  sso `d6c385be` are what production serves; CI is green on every `main`. camera
  `main` is at `bdd2d7b` (live) with five commits after 12.3.40 and no version bump
  (see "image.direct" below).
- **Editor fix is working in use.** 32 saves landed on the second event that had
  been all zeros after the 2026-09-30 deploy; it now holds 18 non-zero values.
  Tracked on the board as #421 (done).
- **Paused on purpose (owner):** the try-on and fanmass services on this Mac
  (stopped and disabled, ports closed) and try-on on every camera event. messmass's
  `fanmass_dashboard_snapshot` documents therefore stopped updating (newest push
  received 2026-09-29 10:21 UTC). Restart steps: the memory note "tryon-fanmass-paused" or the try-on and
  fanmass RUNBOOKs.
- **Protection.** `main` in messmass, camera and sso requires a PR and a passing
  check, applies to admins, and blocks force-pushes. Every change to those repos
  goes through a PR. camera also has a Vercel Firewall rule rate-limiting
  `POST /api/submissions` (100 a minute per IP).
- **Dependency alerts: 0 open in messmass, camera, sso and fanmass (2026-10-04).**
  They were messmass 5, sso 16 (two critical `next`), fanmass 5 and camera 11 on
  2026-09-28 to 10-02. Cleared by merging the Dependabot fixes and, where
  Dependabot could not, by hand: `sharp` (the `next` bump in sso only widened its
  allowed range, so the lockfile had stayed on the vulnerable 0.34.5) and
  `@tiptap/*` (a dead transitive dependency of the vendored design-system
  package, pinned through `overrides` in sso, camera and fanmass). sso moved to
  `nodemailer` 10, checked against its pooled SMTP usage with a local fake server
  before merging. `npm audit --omit=dev` is 0 in sso and camera. The `npm audit`
  highs that remain in sso are its jest and eslint dev toolchain, which ships
  nothing. New advisories appear daily, so re-check after merges.
- **image.direct (new, separate repo).** camera is being connected to a separate
  renderer app that is meant to replace the local try-on worker. Camera's callback
  handler is implemented and default-disabled; dispatch is not built; no event uses
  it. Contract: camera `docs/IMAGE_DIRECT_INTEGRATION.md`; fleet map edge E8;
  tracking in camera #162 to #166 and #170. An earlier idea of a camera-hosted
  gateway for third-party renderers (design draft on the local `try-on` and
  `camera` branches `feature/tryon-partner-gateway`) is not being built.
- **Stale items:** messmass #299 and fanmass #69 ("Adopt existing camera
  partners/events", reverse backfill) are old open PRs; camera's equivalent #88 was
  closed on 2026-09-30. camera #118 (fleet audit P2+P3) is delivered and can be
  closed.
- **Board.** Project 8: #421 and #422 added as done; #343 (fanmass release gate)
  moved to Backlog while fanmass is paused; #356 (fleet epic) stays open as the
  tracker.

**2026-09-30 addendum (v12.3.39 and v12.3.40)**
- **Event editor incident and fix (v12.3.39, PR #417).** An event with no edit
  password opened its editor for the operator, but every `PUT /api/projects`
  answered 401 and the editor showed "Save Error" for 3 seconds, then "Ready"
  (PZPN x Bosnia and Herzegovina, 2026-09-27; the cause landed in 8bb4ad2a on
  09-16). The loader now issues a signed grant when the editor is opened by its
  edit link and has no password, editors show a persistent "Not saved" status and
  keep unsaved values on the device, an editor that cannot save is read-only,
  saves are field-level, and partner editors need an admin session or a password.
  Details: release notes `[v12.3.39]`, `docs/features/features-authentication.md`
  "Page-access grants and editor saves".
- **Vercel deploys failed 2026-09-28** with "Resource provisioning failed" until a
  suspended Atlas Marketplace resource connected to the project was disconnected
  (see the memory note "vercel-resource-provisioning-failed" or the release notes).
- **Owner decisions 2026-09-30:** try-on and fanmass are paused (local services
  stopped on purpose; `tryOn.enabled` off on every camera event); messmass and
  camera keep separate logins (`client_credentials` not enabled for their SSO
  clients); the fan-selfie consent question is closed with no change; branch
  protection on `main` now applies to admins and blocks force-pushes in messmass,
  camera and sso (the old bypass list for the owner, the ChatGPT Codex connector
  and Cursor was removed from messmass).
- v12.3.40 is version-only here (camera removed its try-on sync cron).

**2026-09-28 addendum (what happened after the 2026-09-07 entry below)**
- **2026-09-08 remediation**: scripts prune and dead-code removal (#352),
  fleet inventory-drift CI gate (#355), all 71 GDS forbidden-color findings
  cleared and the compliance check made blocking (#387, v12.3.26), GDS
  installed from vendored tarballs (v12.3.29), fleet version re-aligned
  (12.3.28), savetheworld added to the fleet map (v12.3.31).
- **2026-09-09**: API keys decoupled from login passwords (643a3241, #397);
  the docs gate hard-fails on stale or unresolvable contract stamps (#346).
- **2026-09-16/17**: sponsorship platform Phase A (#226–#236, #244) and a
  security wave (#388–#397, #400/#406/#407) went to `main` as 80 commits
  without release notes; they are recorded under "Also shipped since
  v12.3.36" in the `[v12.3.37]` entry of
  [docs/operations/operations-release-notes.md](docs/operations/operations-release-notes.md).
- **2026-09-28 alignment audit (v12.3.37)**: fanmass web crash-loop fixed
  (fanmass 7268cf7), camera publish-selfies scoped to its event (camera
  ccd77d5), API-key management role-gated (admin/superadmin only), version
  bumps no longer rewrite doc history (`npm run version:update` edits stamp
  lines only).
- **Open**: messmass#343 (needs a live SSO browser session; fanmass is paused
  by the owner); the stakeholder flow needs its `stakeholder-callback` redirect_uri
  registered on SSO before it is reachable (35bc7e3d), no route consumes the
  `stakeholder-session` yet, and its error redirect `/stakeholder-access` has
  no page; fanmass has no `apiKey` configured, so its key-gated routes
  (including the analytics-summary pull messmass makes) answer 401
  `api_key_not_configured` (see the fleet map's 2026-09-28 notes); two dead
  routes still call the retired SSO `/api/validate` (drift register §7);
  Dependabot alerts in sso and fanmass (camera has been at 0 since 2026-09-29).

**2026-09-07 (v12.3.22, live)** — password-protected event reports work
end-to-end for the first time: `/report/[slug]` now renders the password
prompt via its server layout (same gate as partner-report), and the
`useReportData` fallback to the never-built `GET /api/v3/activities/{id}`
was deleted — it had been turning every protected report's 401 into
"Failed to Load Report — The string did not match the expected pattern".
Details: release notes `[v12.3.22]`, `docs/audits/lld/findings.md` F-001
(2026-09-07 addendum), `docs/operations/operations-learnings.md`. CI's
`Verify` job was failing at `npm ci` with a GitHub Packages 403
(sovereignsquad org billing limit); resolved in v12.3.29 (61c27e79) by
installing GDS from vendored tarballs under `vendor/gds/`.

**Fanmass Unified Dashboard & Settings v1 shipped this session**
(messmass#336–#342, plus fanmass#79–#81 in the sibling repo). `/admin/fanmass`
went from a static five-card outbound-link grid to a native, tabbed
dashboard (Executive Dashboard, Analytics, Run Control, Entity Curation,
Settings) fed by a new asynchronous push/poll channel — Fanmass has no
public URL and is the caller on every channel except one: messmass's
`/sync` and `/callbacks` pull the analytics summary from `FANMASS_BASE_URL`
(blocking, 15s timeout; b109bcd9). The new channel mirrors the existing
`ai_rescan_requests` pattern rather than inventing a new mechanism. See `docs/operations/operations-release-notes.md`'s
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
  (Superseded in v12.3.37: `version:update` now also bumps the `Version:`
  stamp line of every current doc, and nothing else.)

---

## 1. Standing rules for this repo (apply to everything below and everything after)

- **Every push to `origin/main` gets a version bump.** Not optional, not
  something to ask about — established as a hard rule after explicit user
  correction earlier in this engagement. Mechanics: set the new version in
  `package.json`, run `npm run version:update` (syncs the lockfile and every
  current doc's `Version:` stamp; never a find-and-replace of the old version
  string), add a release-notes entry, then run `npm run preflight`.
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
  `type-check`, `lint`, `test`, `style:check`, `version:verify`,
  `docs:audit`, `inventory:check`, `gds:sync`, `gds-compliance check`
  (blocking since v12.3.26), `comments:check`, `comments:versions`,
  `architecture:check`, dependency + layout-grammar guardrails, `build`.
  `npm run preflight` runs the same list locally with one exit code.

---

## 2. GDS adoption plan — now on 6.3.0, Phase 4b/5/6 still open

Separate, older effort, still genuinely mid-flight. The original plan file
no longer exists; this section is the record.

**Done and pushed** (verified, CI-green): Phase 0 (baseline), Phase 1 (fixed
3.9.0-vs-6.0.0 version drift, on GDS 6.3.0 via vendored GitHub Release
tarballs under `vendor/gds/` — registry install was tried and abandoned),
Phase 2 (`gds-adoption.json` governance manifest), Phase 3 (root
`GdsProvider` is the only provider in the tree — no raw `MantineProvider`,
no nested per-route workaround), Phase 4a (17 of ~80 `theme.css` color
values aliased to GDS/Mantine CSS variables — the ones verified
byte-identical; the rest have no exact GDS equivalent, Tailwind-derived vs.
Open Color-derived palettes), Phase 5 component 1 of 10
(`ConfirmDialog` retired for `GdsConfirmProvider`/`useGdsConfirm`).
camera 12.3.37 is also on GDS 6.3.0 via its own vendored tarballs.

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

**Open — Phase 6, strict mode only**: the non-strict `npx gds-compliance
check` baseline is 0 and blocking in CI. All 71 `forbidden-color` findings
were cleared in v12.3.26 (2f1f50ef, #387): UI colours moved to `theme.css`
tokens and data colours to `lib/theme/*.ts`, the checker's exempt lane.
Strict mode (`compliance.strictMode: true`; **~486** findings across 12 rule
families on 2026-08-17 — `strict.raw-color` 110, `strict.raw-control` 105,
`strict.inline-style` 46, `strict.browser-dialog` 42,
`strict.import.mantine-core` 22, `strict.raw-table` 14, and more) stays
blocked on Phase 5 landing. Don't add `@sovereignsquad/gds-eslint-config`
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
- **A plan file gets overwritten by the next planning session** —
  if there's a still-relevant old plan (like the GDS one), its content
  needs to be captured somewhere durable (like this handover) *before*
  starting a new planning session, or it's gone.
