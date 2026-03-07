# MessMass Developer Handover

This file is onboarding plus operational context for the next agent. Keep it accurate when behavior, process, or current delivery state changes.

**Last Updated:** 2026-03-06 (admin UI consistency documented under issue #56; production hotfixes tracked under #345, #346, #348, and #349; style hardening Phase 5 active under #72)

## SSOT (Work Tracking)
- Board: <https://github.com/users/moldovancsaba/projects/1>
- Issues repo: `moldovancsaba/mvp-factory-control`
- Rules:
  - Track MessMass delivery work only in `mvp-factory-control` and on Project 1.
  - Do not create or manage product work as local task files.
  - Use [PROJECT_MANAGEMENT.md](/Users/moldovancsaba/Projects/messmass/docs/PROJECT_MANAGEMENT.md) for the required SSOT cadence.
  - Update this handover doc whenever current truth changes materially.

## Current Repo Truth
- Active branch: `landing-overhaul`
- Last known HEAD during this update: `d464ab33f`
- Working tree is already dirty in unrelated files (`MEMORY.md`, `docs/NEXT_AGENT_PROMPT.md`, `docs/messmass-codex-brain-dump.md`, `docs/operations/operations-action-plan.md`, `memory/2026-02-24.md`, plus deleted `USER.md` and `agent-working-loop-canonical-operating-document.md`, and untracked `READMEDEV.md`).
- Most recent documented code delivery: partner report/delete-project hotfixes plus admin `totalFans` consistency and partner card-view report-edit fixes on `landing-overhaul`, tracked under `mvp-factory-control#345`, `#346`, `#348`, and `#349`.
- Current active delivery: style hardening Phase 5 CSS consolidation under `mvp-factory-control#72`.

## Current Priorities
- Board-derived priority reference: [operations-delivery-focus.md](/Users/moldovancsaba/Projects/messmass/docs/operations/operations-delivery-focus.md)
- Execution queue reference: [operations-action-plan.md](/Users/moldovancsaba/Projects/messmass/docs/operations/operations-action-plan.md)
- Current `operations-delivery-focus.md` says there is no item in progress and recommends picking a Ready card next.
- The action plan still contains older state memory for Builder mode and analytics/security tracks; use the board as final authority if there is any mismatch.

## Docs Index
- [README.md](/Users/moldovancsaba/Projects/messmass/README.md) — local dev and high-level overview
- [index.md](/Users/moldovancsaba/Projects/messmass/docs/index.md) — canonical docs entrypoint
- [messmass-codex-brain-dump.md](/Users/moldovancsaba/Projects/messmass/docs/messmass-codex-brain-dump.md) — repo structure and current mental model refresher
- [PROJECT_MANAGEMENT.md](/Users/moldovancsaba/Projects/messmass/docs/PROJECT_MANAGEMENT.md) — SSOT rules and board cadence
- [NEXT_AGENT_PROMPT.md](/Users/moldovancsaba/Projects/messmass/docs/NEXT_AGENT_PROMPT.md) — continuation package from the last recorded delivery
- [operations-action-plan.md](/Users/moldovancsaba/Projects/messmass/docs/operations/operations-action-plan.md) — execution queue and state memory
- [operations-delivery-focus.md](/Users/moldovancsaba/Projects/messmass/docs/operations/operations-delivery-focus.md) — board-derived priority shortlist
- [architecture.md](/Users/moldovancsaba/Projects/messmass/docs/architecture.md) — system architecture
- [documentation-governance.md](/Users/moldovancsaba/Projects/messmass/docs/documentation-governance.md) — canonical doc rules

## Quick Runtime Pointers
- Next.js app: `/app`, `/components`, `/lib`
- WebSocket server: `/server` on port `7654`
- Main local dev command: `npm run dev`
- Build gate used across the repo: `npm run build`

## Known Working Context
- Builder mode on `/edit/[slug]` renders one input per chart variable across KPI, Bar, Pie, Text, Table, Image, and Value chain.
- Image and table builders infer variables when formulas are empty.
- Unified builder card layout and overflow controls live in shared builder components and CSS.
- Style editor preview updates immediately for bar/pie CSS vars and includes Value Chain and Landing page sections.

## Handover Log

## 2026-03-06 14:05:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `77a8a7f59`
- Objective: Execute style hardening Phase 5 by consolidating duplicated CSS in equivalent editor state shells.

### What changed
- Activated SSOT card `#72` on Project 1.
- Added shared stylesheet `app/styles/editor-states.module.css` for loading/error states used by both event and partner editors.
- Updated:
  - `app/edit/[slug]/page.tsx`
  - `app/partner-edit/[slug]/page.tsx`
- Removed duplicated local CSS modules:
  - `app/edit/[slug]/page.module.css`
  - `app/partner-edit/[slug]/page.module.css`
- Removed dead unreferenced CSS modules:
  - `app/admin/bitly/bitly.module.css`
  - `app/partner-report/[slug]/PartnerReport.module.css`
- Prepared patch version `11.60.3` and release-note entry for the consolidation.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> pending until version artifacts are written for `11.60.3`

### Known issues / risks
- Additional CSS duplication remains elsewhere in the repo; this delivery currently covers the shared editor-state duplication and a pair of dead unreferenced route-local CSS modules.

### Immediate next actions
1. Write version artifacts for `11.60.3`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 14:35:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `b9dcfabc1`
- Objective: Continue `#72` by removing dead CSS artifacts that duplicate already-canonical shared style layers.

### What changed
- Removed dead unreferenced utility module:
  - `app/styles/utilities.module.css`
- Confirmed the canonical utility layer remains:
  - `app/styles/utilities.css` imported by `app/globals.css`
- Prepared patch version `11.60.4` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` still has remaining Phase 5 scope if more duplicate or dead CSS artifacts are found, but this slice is isolated to one unused utility module with no active imports.

### Immediate next actions
1. Run validation gates for `11.60.4`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 14:55:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `43fd6308f`
- Objective: Continue `#72` by removing additional dead admin CSS modules with no live imports.

### What changed
- Removed dead unreferenced admin modules:
  - `app/admin/admin.module.css`
  - `app/admin/categories/Categories.module.css`
  - `app/admin/events/Projects.module.css`
- Prepared patch version `11.60.5` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open because additional style-system duplication may still exist outside these dead admin artifacts.

### Immediate next actions
1. Run validation gates for `11.60.5`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 15:10:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `eaf767a50`
- Objective: Continue `#72` by removing another dead route-local stylesheet with no live import path.

### What changed
- Removed dead unreferenced route module:
  - `app/api-docs/page.module.css`
- Confirmed the active API docs page continues to use:
  - `app/admin/help/page.module.css`
- Prepared patch version `11.60.6` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open because more dead or duplicated CSS may still exist, but this slice is isolated to a single route module with no active imports.

### Immediate next actions
1. Run validation gates for `11.60.6`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 15:25:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `1c0ea0c75`
- Objective: Continue `#72` by removing dead backup artifacts from the active partners admin tree.

### What changed
- Removed dead inactive partners backup page:
  - `app/admin/partners/page_old_backup.tsx`
- Removed the orphaned stylesheet only imported by that backup page:
  - `app/admin/partners/PartnerManager.module.css`
- Prepared patch version `11.60.7` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open because additional dead or duplicated style assets may still exist elsewhere in the app tree.

### Immediate next actions
1. Run validation gates for `11.60.7`.
2. Post evidence to SSOT card `#72`.
3. Commit, push, and continue with the next actionable duplication target if the card scope remains open.

## 2026-03-07 09:35:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `fef3937d7`
- Objective: Continue `#72` by removing the remaining `.OLD.css` report artifacts and cleaning the stale audit/doc references to those files.

### What changed
- Removed dead legacy stylesheets:
  - `app/partner-report/[slug]/page.module.OLD.css`
  - `app/report/[slug]/page.module.OLD.css`
- Updated the archived admin UI audit pack so the report evidence points at the live `app/report/[slug]/page.tsx` route instead of a deleted stylesheet.
- Removed obsolete hardcoded-values inventory rows that referenced the deleted partner-report `.OLD.css` file.
- Prepared patch version `11.60.9` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open for any remaining duplicate or dead CSS artifacts outside this low-risk report cleanup slice.

### Immediate next actions
1. Post evidence to SSOT card `#72`.
2. Commit and push `11.60.9`.
3. Continue with the next actionable duplication target if the card scope remains open.

## 2026-03-07 10:05:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `63371a540`
- Objective: Continue `#72` by removing stale current-doc references to deleted CSS modules and syncing the audit inventory with the cleaned source tree.

### What changed
- Updated current docs to reference live shared stylesheets instead of deleted CSS modules:
  - `docs/components/components-reusable-components-inventory.md`
  - `docs/architecture.md`
- Removed obsolete `docs/audits/hardcoded-values-inventory.csv` rows that still referenced deleted `app/partner-report/[slug]/PartnerReport.module.css` and `app/partner-edit/[slug]/page.module.css`.
- Prepared patch version `11.60.10` and release-note entry for this documentation-truth cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open for any remaining duplicate or dead style assets or stale documentation references outside this low-risk truth-sync slice.

### Immediate next actions
1. Post evidence to SSOT card `#72`.
2. Commit and push `11.60.10`.
3. Continue with the next actionable duplication target if the card scope remains open.

## 2026-03-07 09:05:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `fdc4af424`
- Objective: Continue `#72` by removing non-canonical backup files still living under the active `app/` source tree.

### What changed
- Removed dead backup files:
  - `app/admin/design/Design.module.css.backup`
  - `app/api/projects/edit/[slug]/route.ts.backup`
  - `app/api/public/events/[id]/stats/route.ts.bak`
- Updated the one historical release-note reference that still mentioned the old design backup artifact.
- Prepared patch version `11.60.8` and release-note entry for this additional Phase 5 cleanup slice.

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed
- `npm run lint` -> passed (warnings only)
- `npm run version:verify` -> passed

### Known issues / risks
- `#72` remains open because the remaining `.OLD.css` files still have audit/doc references and should be handled in a dedicated follow-up cleanup slice.

### Immediate next actions
1. Post evidence to SSOT card `#72`.
2. Commit and push `11.60.8`.
3. Continue with the next actionable duplication target if the card scope remains open.

## 2026-03-06 13:10:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `d464ab33f`
- Objective: Fix admin `totalFans` drift across event surfaces and align partner admin card-view report-edit behavior with the working list-view path.

### What changed
- Created SSOT bug cards `#348` and `#349` in `moldovancsaba/mvp-factory-control`, attached them to Project 1, and moved both into active tracked delivery.
- Added `getStoredOrDerivedTotalFans(...)` in `lib/projectStatsUtils.ts` so admin surfaces prefer stored `stats.totalFans` and only derive from legacy fields when that value is absent.
- Updated admin Total Fans surfaces:
  - `lib/adapters/projectsAdapter.tsx`
  - `app/admin/events/ProjectsPageClient.tsx`
  - `app/admin/dashboard/page.tsx`
  - `app/admin/filter/page.tsx`
  - `/api/projects` total-fans sort path
- Fixed partner admin card-view `Edit Stats` so it uses `_id || viewSlug`, matching the working list-view path.
- Added a dedicated hotfix note at `docs/2026-03-06_ADMIN_TOTALFANS_PARTNER_CARD_EDIT_HOTFIX.md`.
- Prepared the repo for patch version `11.60.2`.

### Validation
- Planned and required for closure:
  - `npm run build`
  - `npm run type-check`
  - `npm run lint`
  - `npm run version:verify`
  - `python3 scripts/docs_inventory.py`
  - `python3 scripts/docs_triage.py`
  - `python3 scripts/docs_link_check.py`
  - `python3 scripts/docs_canonical_map.py`

### Known issues / risks
- Existing unrelated working-tree changes still predate this work and remain untouched.

### Immediate next actions
1. Run the full validation gate set for the new hotfix.
2. Post evidence to SSOT cards `#348` and `#349`.
3. Commit, push, and continue with the next tracked delivery item without stopping.

## 2026-03-06 12:15:00 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `31978dfd6`
- Objective: Track and document two production hotfixes separately: partner report related-event cards showing Total Fans Engaged and the admin delete-project failure path.

### What changed
- Created SSOT bug cards `#345` and `#346` in `moldovancsaba/mvp-factory-control` and attached them to Project 1.
- Set `#345` to `In Progress (NOW)` with a start note; set `#346` to `Ready (NEXT)` with a planning note.
- Documented the hotfix scope and implementation in `docs/2026-03-06_PARTNER_REPORT_DELETE_HOTFIX.md`.
- Prepared the repo for a patch version update from `11.60.0` to `11.60.1` tied to these production fixes.

### Files touched
- `docs/2026-03-06_PARTNER_REPORT_DELETE_HOTFIX.md`
- `docs/index.md`
- `docs/messmass-codex-brain-dump.md`
- `docs/HANDOVER.md`
- `docs/operations/operations-action-plan.md`
- `docs/operations/operations-release-notes.md`
- `package.json`
- `package-lock.json`

### Validation
- `npm run build` -> passed
- `npm run type-check` -> passed after rerunning once `.next/types` was regenerated by build
- `npm run version:verify` -> passed
- `npm run lint` -> failed on pre-existing repo-wide issues outside `#345` / `#346` scope (for example `app/dashboard/filter/[filterSlug]/page.tsx`, `components/ChartBuilderImage.tsx`, `components/LandingKPIChart.tsx`, `components/ReportStylePreview.tsx`)

### Known issues / risks
- Repo-wide lint remains a required gate and may still fail on work outside the two hotfix files.
- Several unrelated working-tree changes predate this work and remain untouched.

### Immediate next actions
1. Commit and push the `11.60.1` release-doc/version follow-up.
2. Decide whether to clear the repo-wide lint backlog now or keep `#345` and `#346` blocked until that broader gate is addressed.
3. Continue with the next tracked board item after the hotfix branch state is recorded.

## 2026-03-06 10:23:04 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `747eb0a40`
- Objective: Restore the missing MessMass `docs/PROJECT_MANAGEMENT.md` and `docs/HANDOVER.md` using the established structure from the sibling `reply` and `hatori` projects.

### What changed
- Added `docs/PROJECT_MANAGEMENT.md` to define MessMass SSOT rules, board cadence, and manual GitHub CLI fallback commands.
- Added `docs/HANDOVER.md` to provide onboarding context, current repo truth, canonical doc links, and a dated handover log.
- Updated the docs entrypoints to reference the newly restored files.

### Files touched
- `docs/PROJECT_MANAGEMENT.md`
- `docs/HANDOVER.md`
- `docs/index.md`
- `docs/messmass-codex-brain-dump.md`

### Validation
- `find /Users/moldovancsaba/Projects/reply -type f \( -name 'PROJECT_MANAGEMENT.md' -o -name 'HANDOVER.md' \)` -> confirmed sibling source files exist
- `find /Users/moldovancsaba/Projects/hatori -type f \( -name 'PROJECT_MANAGEMENT.md' -o -name 'HANDOVER.md' \)` -> confirmed sibling source files exist
- `sed -n '1,260p'` on sibling docs -> extracted structure for SSOT and handover format
- `git status --short` before edits -> confirmed dirty tree and avoided unrelated files

### Known issues / risks
- The active SSOT card for the next delivery is still not confirmed in this repo context.
- Existing dirty files predate this change and were left untouched.

### Immediate next actions
1. Confirm the active MessMass board card before any product implementation work.
2. Add a start note on that card using the cadence in `docs/PROJECT_MANAGEMENT.md`.
3. Keep `docs/HANDOVER.md`, `docs/NEXT_AGENT_PROMPT.md`, and the board in sync after each meaningful milestone.

## 2026-03-06 10:57:03 CET - Codex Agent
- Branch: `landing-overhaul`
- Base commit: `747eb0a40`
- Objective: Deliver `mvp-factory-control#56` with tracked child issues, admin hero standardization, width/content-surface normalization, inline-style cleanup in touched scope, and documentation/version/release-note sync.

### What changed
- Created tracked child issues on the SSOT board for the five-part delivery under parent `#56`.
- Extended `UnifiedAdminHeroWithSearch` to support badges so migrated admin pages can use one canonical hero path.
- Migrated touched admin management pages from `AdminHero` to `UnifiedAdminHeroWithSearch`.
- Normalized touched pages onto `.page-container` as the shared outer shell and removed local outer-width drift from styles/insights/help.
- Removed inline styles from touched scope:
  - help page guest notice moved to CSS modules
  - event action icons moved to CSS class styling
  - style swatches render via SVG instead of React `style`
  - dashboard gender bar uses SVG geometry instead of inline width styles
- Updated canonical admin UI guidance and release artifacts.

### Files touched
- `components/UnifiedAdminHeroWithSearch.tsx`
- `components/UnifiedAdminHeroWithSearch.module.css`
- `app/admin/dashboard/page.tsx`
- `app/admin/styles/page.tsx`
- `app/admin/styles/styles.module.css`
- `app/admin/insights/page.tsx`
- `app/admin/insights/page.module.css`
- `app/admin/content-library/page.tsx`
- `app/admin/mainpage/page.tsx`
- `app/admin/messages/page.tsx`
- `app/admin/help/page.tsx`
- `app/admin/help/page.module.css`
- `app/admin/events/ProjectsPageClient.tsx`
- `app/admin/events/Projects.module.css`
- `app/styles/layout.css`
- `docs/operations/admin-ui-width-and-hero.md`
- `docs/messmass-codex-brain-dump.md`
- `docs/operations/operations-release-notes.md`
- `package.json`

### Validation
- Planned final gate set for this delivery:
  - `npm run build`
  - `npm run lint`
  - `npm run type-check`
  - `npm run version:verify`
  - `python3 scripts/docs_inventory.py`
  - `python3 scripts/docs_triage.py`
  - `python3 scripts/docs_link_check.py`
  - `python3 scripts/docs_canonical_map.py`

### Known issues / risks
- Existing unrelated dirty files predate this delivery and remain untouched.
- `app/admin/styles/[id]` still uses legacy `AdminHero`; it was intentionally left out because it is a detail/editor flow outside the touched management-page scope.

### Immediate next actions
1. Run the full validation gates and fix any failures.
2. Post milestone/done evidence to child issues `#340`-`#344` and parent `#56`.
3. Commit and push once the build, lint, type-check, docs, version, and release notes are green.
