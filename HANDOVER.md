# Session Handover — messmass GDS 6.1.0 Adoption + AI Analytics Status Fix

Everything below reflects real, verified state as of the commit SHAs quoted —
not assumptions, not self-reported success. If you're picking this up cold:
read section 1 (what's actually open) first, then section 2 (exact repo
state), then section 3 for the full technical trail of *why* things are
built the way they are.

Last verified: 2026-08-16, HEAD `58fe9e96` (v12.1.82), CI green.

---

## 0. Scope of this handover

This document supersedes the previous `HANDOVER.md` (last verified
2026-08-14, messmass HEAD `cd8ab0cb`/v12.1.53) for the **messmass** repo
specifically. Everything in this file is messmass-only and was verified in
this session. The other fleet repos (`camera`, `fanmass`, `launchmass`,
`sso`) were **not touched or re-verified this session** — their state below
is carried forward from the previous handover, unconfirmed. Re-verify them
independently before relying on any of it; do not treat carried-forward
numbers as current fact.

---

## 1. What's actually open right now (read this first)

### 1a. GDS 6.1.0 adoption plan — Phases 4b, 5 (partial), 6 still open

Full plan: `/Users/chappie/.claude/plans/pure-cuddling-swan.md` (local to the
machine this session ran on — if that path doesn't exist for you, the plan's
structure is fully reconstructable from section 3 below and the commit
history from `7d6b31b3` to `58fe9e96`).

**Done and pushed** (Phases 0–3, Phase 4a, Phase 5's first component):
- Phase 0: baseline snapshot (no code).
- Phase 1: fixed version drift — `package.json` claimed 6.0.0, `node_modules`
  actually resolved 3.9.0. Now genuinely on 6.1.0 via vendored GitHub Release
  tarballs (`vendor/gds/*.tgz`) — **not** the npm registry. See section 3a for
  why registry install was abandoned.
- Phase 2: `gds-adoption.json` governance manifest created, tracking all 13
  known local-adapter gaps.
- Phase 3 (3 commits, all landed): root `GdsProvider` now the *only* provider
  in the tree (`app/providers.tsx`) — no more raw `MantineProvider`, no more
  the `/admin/login`-only nested `GdsProvider` workaround
  (`GdsLoginShell.tsx`, deleted). `lib/ui/mantineTheme.ts` rewritten from
  `createTheme({ ...gdsTheme })` to `createPublicBrandTheme({ overrides })`.
- Phase 4a: 17 of `app/styles/theme.css`'s ~80 hardcoded color values aliased
  to `var(--mantine-color-messmassX-N, #original)` where **byte-identical**
  (verified via a live Node fetch of the theme, not assumed).
- Phase 5, component 1 of 10: `components/modals/ConfirmDialog.tsx` deleted;
  `GdsConfirmProvider`/`useGdsConfirm` mounted at root, 3 call sites migrated.

**Open — Phase 4b** (token bridge, remainder): most of `theme.css`'s ~63
remaining color values have **no exact GDS/Mantine equivalent** to alias to.
GDS's default palette is Open Color-derived; messmass's chart/landing colors
are Tailwind-derived — the two systems don't overlap except where messmass's
own custom brand ramps (`messmassBlue`/`Green`/`Amber`/`Red` in
`mantineTheme.ts`) happen to reuse messmass's own darker shades (that's
exactly the 17 that got aliased). Retiring the rest requires **picking a
real replacement color and a visual review** — a design decision, not a
mechanical alias. This is genuinely unstarted; don't assume it's "mostly
done" because Phase 4a landed.

**Open — Phase 5** (component consolidation), 9 of 10 components remaining,
in the plan's stated order (smallest/most-isolated → largest blast radius):
1. ~~`ConfirmDialog` → `GdsConfirmProvider`~~ — **done**, v12.1.82.
2. `components/modals/BaseModal.tsx` → `AdminModal`/`GdsModal`
3. `components/modals/FormModal.tsx` → `AdminCrudForm`/`AdminFormSection`/etc.
4. `components/admin/AdminActionRail.tsx` → `ActionBar` (update
   `tests/admin-action-rail.test.tsx`, `tests/mobile-admin-action-contract.test.ts`
   in the same PR)
5. `components/UnifiedCardView.tsx` → `AdminResourceGrid`/`AdminResourceCard`
6. `components/UnifiedListView.tsx` → `AdminDataTable`/`ResponsiveDataView`
   (GDS names `ResponsiveDataView` as the canonical target for exactly this
   list/card-toggle pattern — steps 5+6 may collapse into one migration)
7. `components/UnifiedAdminHeroWithSearch.tsx` → `PageHeader`/`AdminResourceToolbar`
8. `components/UnifiedAdminPage.tsx` → `AdminResourceManager` (orchestrator —
   composes 5/6/7's replacements, migrate after them)
9. `components/AdminLayout.tsx` → `AppShell` (backs the whole admin section —
   **largest blast radius, do last**)
10. `components/TopHeader.tsx` → `WorkspaceHeader`

Deferred, explicitly not in scope: `GdsAccessGate` for
`components/ServerPageGate.tsx`/`PagePasswordLogin.tsx` — presentation-only,
legitimately scoped away from `lib/pageAccess.ts`'s real authorization logic.

**Open — Phase 6** (governance closeout): flip `gds-adoption.json`'s
`compliance.strictMode` to `true`, promote `gds-compliance check` from
non-blocking (`|| true` in CI) to a hard gate, add
`@sovereignsquad/gds-eslint-config` (deferred since Phase 1 — requires
ESLint 9/10, messmass is on 8.57.0, a separate migration).

### 1b. Not interactively verified: the 7 ConfirmDialog call sites

`npm run type-check`/`lint`/`test`/`build` all pass, and the dialog behavior
comes from GDS's own tested `GdsConfirmProvider` primitive (not
hand-rolled), but **no one has actually clicked through any of the 7
confirm dialogs** (2× clicker-manager, 1× clicker-manager delete-set, 2×
visualization, 1× visualization switch-template, 3× users page) to see them
render and behave correctly. This local dev environment has **no SSO
configured and no local-login fallback** (messmass is SSO-only per
architecture — see `sso-unification-state` in prior session memory), so
getting past `/admin/login` here isn't possible without real SSO access.
**Do this first** if you have SSO access before trusting this migration is
fully done.

### 1c. Credential rotation — still open, not touched this session

Carried forward from the previous handover, unverified this session:

- fanmass `.config/settings.json` → `cameraApiKey` and `messmassApiKey`
- the SSO MongoDB Atlas connection URI
- the messmass OAuth client secret

These were exposed in a prior session's transcript. Rotating them is a human
action, not something an agent should do unprompted. If you don't know
whether this was already resolved, ask rather than assume either way.

### 1d. AI Analytics honest-status fix — done and pushed, one thread still open

Separate from the GDS work (shipped as v12.1.79, between GDS Phase 3 and 4a).
See section 4 for full detail. **Still open**: the user asked a scoping
question that was never answered before the conversation moved to the
zero-image fix directly — "does the per-dimension 'based on X/Y images (Z%)
analysed' caveat need to appear on the client-facing report/dashboard pages
that render these AI variables as chart blocks, not just the admin AI
Analytics workspace?" It currently only exists in the admin surfaces
(`AiAnalyticsView.tsx`, `aiAnalyticsAdapter.tsx`, `AiEventReportView.tsx`).
If the user wants it on public/client report pages too, that's a materially
bigger, different piece of work (touches `ReportCalculator`/`formulaEngine`
and the report template/chart-rendering pipeline) — confirm scope before
starting it.

---

## 2. Exact repo state (verified via `git log -1`, `npm ls`, live CI)

| Repo | Branch | HEAD | Notes |
|---|---|---|---|
| **messmass** | `main` | `58fe9e96` (v12.1.82) | **Verified this session.** CI green on push (see below). |
| fanmass | `main` | `34e1799` | Carried forward, **not re-verified this session**. |
| camera | `main` | `0565bf5` | Carried forward, **not re-verified this session**. |
| launchmass | — | — | Not cloned locally as of the last handover; unchanged since EPIC #6 closed. |

messmass GDS package versions (verified via `npm ls`):
```
@sovereignsquad/gds-admin@6.1.0
@sovereignsquad/gds-core@6.1.0
@sovereignsquad/gds-theme@6.1.0
@sovereignsquad/gds-compliance@6.1.0   (devDependency)
```
All four installed via vendored tarballs (`file:vendor/gds/*.tgz`), **not**
the npm registry — see section 3a.

Commits landed this session, oldest first (all pushed, all CI-green
individually):
```
b156a47c  Hotfix: skip Next's redundant build-time type-check
7d6b31b3  Phase 2: declare gds-adoption.json, the full known-gap inventory
21eb5426  v12.1.77  Phase 3 commit 1/3: mantineTheme.ts → createPublicBrandTheme
968b0b11  v12.1.78  Phase 3 commit 2/3: root GdsProvider swap
c9552aea  v12.1.79  fix: AI Analytics honest status (no_images + progress captions)
0f7a196a  v12.1.80  Phase 3 commit 3/3: delete GdsLoginShell, Phase 3 complete
c4be7be3  v12.1.81  Phase 4a: alias 17 verified-identical theme.css colors
58fe9e96  v12.1.82  Phase 5, component 1/10: retire ConfirmDialog
```
(`233591fb` and earlier — Phase 1 version-drift fix — predate this session's
visible transcript; already merged when this session picked up.)

CI (`gh run watch`) was run after every single push in this session and
confirmed green before moving to the next piece of work — not
self-reported, actually watched to completion each time.

---

## 3. Full technical trail — the "why", not just the "what"

### 3a. Why vendored tarballs instead of the npm registry

First attempt was `@sovereignsquad:registry=https://npm.pkg.github.com` in
`.npmrc` plus GitHub Actions registry auth. Failed on **both** platforms:
- GitHub Actions: `403 Forbidden: The requested installation does not
  exist` — the ambient `secrets.GITHUB_TOKEN` is scoped to the triggering
  repo/org and cannot reach a different org's GitHub Packages, regardless of
  the `permissions:` block. `GITHUB_TOKEN` is also a reserved secret name in
  Actions — cannot be overridden by a repo secret of the same name.
- Vercel: `401 Unauthorized` — no token configured there at all, no
  automatic equivalent.

Pivoted to re-vendoring fresh GitHub Release tarballs for 6.1.0 (the same
mechanism the repo already used for the stale 6.0.0/3.9.0 tarballs, just
refreshed) — zero credentials needed, confirmed working on both CI and
Vercel. `scripts/gds-sync-packages.sh` is the CI drift-guard
(`npm run gds:sync`) that would have caught the original 3.9.0-vs-6.0.0 drift
had it been wired into CI from the start — it now is.

### 3b. `createPublicBrandTheme`'s real signature (verified, not assumed)

```ts
interface PublicBrandThemeOptions {
  editorialSerif?: boolean;
  flatSurfaces?: boolean;
  overrides?: MantineThemeOverride;  // exactly what createTheme() takes
}
```
Implementation (`node_modules/@sovereignsquad/gds-theme/dist/server.js`):
```js
function createPublicBrandTheme({ editorialSerif, flatSurfaces, overrides } = {}) {
  // layers flatSurfaces/editorialSerif lanes, then overrides, via
  // Mantine's own mergeThemeOverrides — deep merge, not replace
  return composeGdsTheme(mergedOverrides); // = mergeMantineTheme(baseTheme, overrides)
}
```
This mattered concretely: the old `mantineTheme.ts` manually spread
`...gdsTheme.colors`/`...gdsTheme.components` before adding messmass's own
overrides. That spread is now **redundant and was removed** —
`createPublicBrandTheme` already deep-merges `overrides` over `gdsTheme` via
Mantine's own `mergeMantineTheme`, so passing only the genuinely-new
`colors`/`components` keys is correct and doesn't lose anything from the
base theme.

### 3c. `GdsProvider`'s internal composition (verified via source read)

```
GdsProvider
 └─ DirectionProvider
     └─ GdsI18nContext.Provider
         └─ GdsIconStyleContext.Provider
             └─ MantineProvider (theme=withGdsGovernedVariants(theme), withCssVariables: true)
                 └─ ModalsProvider
                     └─ OverlayAdapterProvider
                         ├─ Notifications  (no props — Mantine default position: bottom-right)
                         └─ GdsThemeVariablesScope → children
```
This is why the old `MantineProvider` + `ModalsProvider` + `Notifications`
trio in `app/providers.tsx` was fully removed, not nested inside
`GdsProvider` — `GdsProvider` already owns all three. Nesting a second copy
would be the exact anti-pattern GDS's own docs call out.

The one real behavior question this raised: `GdsProvider`'s internal
`<Notifications />` takes no `position` prop, so it defaults to Mantine's
`bottom-right` — the old local mount was `position="top-right"`. **Checked
before assuming it was fine**: grepped the entire app for
`notifications.show(` — zero call sites anywhere. The mount was decorative;
nothing ever rendered through it. No behavior actually changed.

### 3d. Phase 4a's real scope — verified via live Node fetch, not string-eyeballing

The plan's original text said "for each of the 78 hardcoded hex values...
change the value to `var(--gds-color-X, #originalHex)`" — written before
GDS's actual palette was known. Checked the real numbers:
```js
// GDS's default Mantine `blue`: ["#e7f5ff", ..., "#1864ab"]  (Open Color)
// messmass's --mm-color-primary-*: ["#eff6ff", ..., "#1e3a8a"]  (Tailwind)
```
These do not overlap **except** where messmass's own custom brand ramps
(`messmassBlue` etc. in `mantineTheme.ts`) were built by hand-copying
messmass's own darker Tailwind shades into a Mantine-shaped array — so
`messmassBlue[6..9]` happen to equal `--mm-color-primary-600..900` exactly,
byte for byte, while `messmassBlue[0..5]` do not match `--mm-color-primary-50..500`
at all. Verified index-by-index for all four ramps
(`messmassBlue`/`Green`/`Amber`/`Red`) via:
```bash
npx tsx -e "import { messmassMantineTheme } from './lib/ui/mantineTheme'; console.log(messmassMantineTheme.colors.messmassBlue)"
```
17 tokens matched exactly and were aliased. The other ~63 (most of
`theme.css`) genuinely have no GDS equivalent — aliasing them to "the
nearest GDS shade" would be a real, if often small, color change, and needs
a visual review (Phase 4b), not a mechanical find-replace.

**Verified live in a running browser**, not just read from source: computed
`getComputedStyle(document.documentElement).getPropertyValue('--mm-color-primary-600')`
resolved to `#2563eb` — the exact pre-alias literal. Confirmed via
`document.styleSheets` inspection that `--mantine-color-messmassBlue-6:
#2563eb` really is emitted on `:root` by the running app, not just present
in the theme object.

### 3e. `useGdsConfirm()`'s real API (verified via `.d.ts`)

```ts
interface ConfirmRequest {
  title: string;
  message: ReactNode;
  targetName?: string;      // shown in bold above the message
  consequence?: ReactNode;  // rendered beneath the message
  confirmAction?: SemanticAction;  // defaults to 'confirm', or 'delete' when danger
  cancelAction?: SemanticAction;   // defaults to 'cancel'
  danger?: boolean;         // red confirm button
}
interface GdsConfirmApi {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  confirmDestructive: (request: ConfirmRequest & { targetName: string }) => Promise<boolean>;
  confirmAction: <T>(request: GdsConfirmationRequest<T>) => Promise<GdsDestructiveActionResult<T>>;
}
```
This is an **imperative** API — completely different shape from the old
`ConfirmDialog`'s **controlled** `isOpen`/`onClose`/`onConfirm` props. Every
call site needed a real rewrite (moving from local boolean/nullable state
driving a rendered `<ConfirmDialog>` to `const ok = await confirm({...})`
inline in the trigger handler), not a prop-for-prop swap like the earlier
`ColoredHashtagBubble`→`ChoiceChip` migration was.

**A second name collision the plan didn't anticipate**: the plan flagged
GDS's own `ConfirmDialog` export colliding with messmass's local one (solved
by using the hook, not the component, so the collision never actually
occurs). The real collision hit during implementation: `const { confirm } =
useGdsConfirm()` **shadows the global `window.confirm`** for the rest of
the component. `npm run type-check` caught this immediately as a real
compile error — two pre-existing native `confirm(someString)` calls in
`clicker-manager/page.tsx` (delete clicker set) and `visualization/page.tsx`
(switch-to-default-template navigation) broke, because they were now
calling `useGdsConfirm().confirm` with a bare string instead of a
`ConfirmRequest` object. Both were migrated to the same `confirm({ title,
message, danger? })` pattern rather than worked around (e.g. renaming the
destructured variable) — they were themselves instances of the exact
"native `confirm()` bypasses the design system" problem this whole
migration exists to fix. **Other files in the app still have their own
independent native `confirm()`/`window.confirm()` calls** — intentionally
not touched, out of scope for retiring one specific component. If you touch
any of those files for an unrelated reason and destructure a local variable
named `confirm` from `useGdsConfirm()`, run `type-check` before assuming it
compiled clean.

### 3f. Dev-server `.next` corruption — self-inflicted, diagnosed, not a code bug

Running `rm -rf .next && npm run build` (a production build, for
verification) repeatedly in the background while a separate `next dev`
process stayed alive on port 3001 against the *same* `.next` directory
corrupted the dev server's asset manifest — visible as mass `404`s on static
JS/CSS chunks and a completely unstyled page (raw text, no CSS at all,
though still logged-in and functional underneath). This looked alarming
enough to investigate as a possible real regression before realizing it was
self-inflicted: `git log`/type-check/lint were all clean, and killing +
restarting the dev server process resolved it instantly with zero code
changes. **Lesson, restated for emphasis since the previous handover already
said this once**: don't run a production build against the same directory a
live dev server is using. If you need both, verification builds should not
`rm -rf .next` while a dev server might be reading from it — or just don't
run them concurrently.

---

## 4. AI Analytics honest-status fix (v12.1.79, shipped between GDS Phase 3 and 4a)

Separate piece of work, prompted mid-session by the user noticing 153
events stuck showing "Analysing" forever with 0 images, and separately
noting there was no way to tell whether an AI-derived number (brand count,
demographic %) was a final result or drawn from a tiny partial sample.

**Root cause, verified against production (not assumed)**: connected to the
live MongoDB and confirmed 153 camera-linked events had
`fanmassImages: 0, fanmassAnalyzedImages: 0` explicitly reported by
fanmass — `lib/aiAnalytics.ts`'s `deriveEventStatus()` computed
`percent(0, 0) = 0` (its own divide-by-zero guard), and 0% is not `>= 100%`,
so the status fell into `'analyzing'` permanently, with nothing distinguishing
"confirmed empty, nothing to do" from "actively running, wait." Traced the
actual mechanism in fanmass's own source (`services/camera_sync.py`,
`sync_camera_events` → `sync_one_event` → `_ensure_project_for_event`):
fanmass provisions a batch for *every* camera event unconditionally, no
image-count check — that's correct upstream behavior (photos may arrive
later), the bug was entirely in messmass's status derivation.

**Fix**: new `AiEventStatus` value `'no_images'` (`lib/aiAnalytics.ts`),
fires when `hasAny` is true and `imagesDiscovered === 0` **strictly**
(distinct from `null`, which means no count reported yet — stays
`'analyzing'`). Labelled "No image available" everywhere it renders.
Verified against production after the fix: `analyzing` count went from a
false 153 down to a true 0 (no event is actually being processed right
now — corroborated independently by fanmass's own `worker.log` showing its
last push landed 12+ minutes before the check, mid-scheduler-tick).

Every AI-derived number now carries a completeness caveat: the events-list
status badge reads `Analysing · 17 of 1,700 images (1%)` instead of just
`1%`; the Deep Analysis cell prefixes `Based on 17 of 1,700 images analysed
(1%) — Brands: 30 · Merch: 5 · Demographics: 4%`; the per-event report's
Brands/Clubs & federations/Merchandise sections gained the same `Based on X
of Y images analysed (Z%)` caveat the Fan demographics section already had
(which also got its own missing percent added). One runtime whitelist array
(`app/api/analytics/ai/events/route.ts`'s `VALID_STATUSES`) needed the new
status value too — **not caught by `type-check`**, since it's a runtime
string array, not type-exhaustive; would have 400'd the new "No image
available" filter option silently.

**Still genuinely a question, not a decision made unilaterally**: does the
"based on X/Y (Z%)" caveat need to reach client-facing report/dashboard
pages, not just the admin AI Analytics workspace? See section 1d.

---

## 5. Standing conventions (carried forward, still accurate)

- **Merge policy is per-repo, not uniform.** camera and messmass:
  direct-merge-once-green. launchmass and fanmass: explicit human go-ahead.
- **AI-branding ban is standing policy in every repo.** No `Co-Authored-By`,
  no session links, no assistant names in commits, PRs, code, docs, UI, logs
  or config.
- **messmass's real quality gate** is `.github/workflows/ci.yml`:
  `type-check`, `lint`, `test` (363 Jest tests as of this session), `build`,
  `version:verify`, `style:check`, `docs:audit`, `gds:sync` (drift guard,
  new this session), `gds-compliance check` (non-blocking, `|| true`, new
  this session — flags 111 pre-existing raw-color findings unrelated to GDS
  work, tracked as ongoing Phase 4b scope), plus the dependency and
  layout-grammar guardrails.
- **A messmass version bump touches more than `package.json`**: run
  `node scripts/update-version.js` (syncs the lockfile), add a release-notes
  entry, and update the `Version:` header in 7 docs (`docs/low-level-design.md`,
  `docs/architecture.md`, `docs/design/design-system.md`,
  `docs/components/components-unified-input-system.md`,
  `docs/components/components-reusable-components-inventory.md`,
  `docs/guides/guides-input-system-complete.md`,
  `docs/guides/guides-form-input-migration-guide.md`). `version:verify` fails
  otherwise. **This is mandatory on every push to origin/main, not
  optional** — established as a hard rule this session after explicit user
  correction.
- **Every push to origin/main gets watched to completion in CI**
  (`gh run watch <id> --exit-status`), not assumed green from a push
  succeeding. Established this session.
- **fanmass has no CI.** Verification is manual `scripts/smoke_*.py` runs.
- **All issues go to the messmass board.** Roadmap issues live on Project 8,
  not in the repo issue list.
- **Codex bot reviews every PR** on messmass and fanmass. Verify each claim
  against the actual code before accepting or refuting it.

---

## 6. Hard-won lessons worth not relearning

- **Don't run `npm run build` while a dev server is up against the same
  `.next` directory.** Corrupts the dev server's asset manifest (404s on
  static chunks). Happened again this session despite being in the previous
  handover — restart the dev server if it happens, it's not a code bug.
- **Verify UI/data claims against the running app or a live DB read, not
  just type-check/lint/tests passing.** This session's AI Analytics status
  fix was verified against a live production MongoDB read before and after;
  the theme-token aliasing was verified via `getComputedStyle()` in a real
  browser, not just read from source. A change that type-checks clean can
  still be functionally wrong.
- **A runtime string-literal whitelist (`VALID_STATUSES: T[] = [...]`) is
  not type-exhaustive.** Adding a new value to a union type does not force
  every array of that type to be updated — `type-check` will not catch a
  missed one. Grep for other arrays of the same type when adding an enum
  value.
- **Destructuring a hook's return value can silently shadow a global.**
  `const { confirm } = useGdsConfirm()` shadows `window.confirm` for the
  rest of the component scope. `type-check` catches the resulting call-shape
  mismatch, but only if there's a pre-existing native call in the same file
  — worth an explicit grep before assuming a rename-free migration is safe.
- **A CSS variable alias is only a true no-op if verified byte-identical.**
  "GDS probably has something close" is not the same as "GDS has this exact
  value" — the two color systems here (Tailwind-derived vs. Open
  Color-derived) don't overlap except by coincidence at a handful of
  brand-specific shades. Check programmatically before aliasing.
- **Background agents / self-reports misreport completion.** Independently
  verify gate and merge state (CI run watched to completion, `git log`
  checked, computed styles read in a real browser) rather than accepting a
  self-report — including your own past-tense claims in the same session.
- **An issue's or plan's stated hypothesis can be wrong.** The original GDS
  adoption plan assumed "78 hardcoded hex values, alias them all" — the real
  palette overlap was 17, discovered only by fetching the actual computed
  theme object, not by comparing hex strings by eye.
