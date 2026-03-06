# MessMass Developer Handover

This file is onboarding plus operational context for the next agent. Keep it accurate when behavior, process, or current delivery state changes.

**Last Updated:** 2026-03-06 (admin UI consistency delivered under issue #56)

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
- Last known HEAD during this update: `747eb0a40`
- Working tree is already dirty in unrelated files (`MEMORY.md`, `docs/NEXT_AGENT_PROMPT.md`, `docs/messmass-codex-brain-dump.md`, `docs/operations/operations-action-plan.md`, `memory/2026-02-24.md`, plus deleted `USER.md` and `agent-working-loop-canonical-operating-document.md`, and untracked `READMEDEV.md`).
- Most recent documented delivery: Builder mode (clicker) variable inputs and unified card layout, with evidence posted on `mvp-factory-control#49`.

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
