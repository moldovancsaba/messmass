# Brain Dump
Status: Active
Last Updated: 2026-05-14
Canonical: Yes
Owner: Documentation

**Purpose:** quick-reference notes that capture the state of this repo and how the docs/ tree is organized after today's refactor.

## Current release
- Current shipped product version: `v12.1.12`.
- Current delivery branch: `main`.
- Latest shipped repo slice: admin workspace regression fixes plus version/documentation sync.

## Builder mode (clicker) — one input per variable + unified layout
- Event edit page (e.g. `/edit/[slug]`) has **Builder** mode: it loads the report template and chart configs, then renders a builder per chart. **Every chart type** parses element formulas, extracts variables via `extractVariablesFromFormula()` (from `lib/formulaEngine`), deduplicates, and shows **one input per variable**. Image/table charts infer variable from title (e.g. "Report Image 3") or chartId when formula is empty; table fallback: `reportTable1`.
- **Unified card layout:** Each card shows (1) title (2) chartId (3) per variable: label + [registry name] (4) input. CSS: `.chart-builder-card-body`, `.chart-builder-card-id`, `.chart-builder-variable-meta`, `.chart-builder-registry-name`, `.chart-builder-variable-row`. Overflow: `min-width: 0`, `overflow: hidden` on cards and `.builder-chart-wrapper` so inputs stay inside the card.
- **Chart types:** KPI, Bar, Pie, Text, Table, Image, Value chain. Components: `ChartBuilderKPI.tsx` … `ChartBuilderValueChain.tsx`; container: `BuilderMode.tsx`. Plan: `docs/plan-builder-mode-variable-inputs.md`. Feature doc: `docs/features/features-reporting-builder.md`.
- **Board evidence:** Builder delivery evidence posted on mvp-factory-control [#49](https://github.com/moldovancsaba/mvp-factory-control/issues/49#issuecomment-3957698585). Handover: `docs/NEXT_AGENT_PROMPT.md`.

## Admin UI consistency (issue #56)
- Admin management pages now use `UnifiedAdminHeroWithSearch` as the canonical hero path, including badges when a page needs status/count context. Legacy `AdminHero` remains exception-only for untouched detail/editor flows.
- The shared admin shell remains: `AdminLayout` -> `.content-surface` -> `.page-container` -> page content. Outer page width is token-driven by `--mm-admin-content-max-width`; narrower widths are only allowed as inner readable wrappers.
- The current canonical workspace map is: `/admin` as Admin Workspace, `/admin/reports` as Reporting Workspace, and `/admin/analytics` as Analytics Workspace. Legacy routes such as `/admin/dashboard` and `/admin/insights` now redirect into those canonical homes.
- Touched routes in the workspace-consolidation delivery include `/admin`, `/admin/reports`, `/admin/analytics`, `/admin/styles`, `/admin/content-library`, `/admin/mainpage`, `/admin/messages`, `/admin/help`, and `/admin/events`.
- Styling hygiene for touched scope: no inline style objects remain in those routes; the help page guest access notice moved into CSS modules, event action icons use CSS classes, and styles color swatches now render through SVG instead of React `style` props.

## Production hotfixes (issues #345, #346, #348, #349)
- Partner report related-event cards now display Total Fans Engaged from a derived total-fans path instead of undercounting legacy events that only store `indoor` / `outdoor`.
- The partner-report API enriches returned event stats with `addDerivedMetrics(...)`, while the client card component still has a client-safe fallback that derives `totalFans` without importing server-only modules.
- Project delete actions now use the shared CSRF-safe `apiDelete(...)` path in both the shared projects adapter and the admin events page, and surfaced errors are no longer collapsed into a generic failure string.
- Admin event surfaces now use `getStoredOrDerivedTotalFans(...)` so list view, card view, dashboard summaries, filter pages, and event sorting prefer stored `stats.totalFans` and only derive when the stored value is absent.
- Partner admin card-view `Edit Stats` is now aligned with list view and opens `/partner-edit/[id]` using `_id || viewSlug`, removing the card-only dependency on `viewSlug`.

## Style editor & preview (v11.59.0)
- Style editor (Admin → Styles → [id]) injects style on every field change and after fetch so preview updates immediately. Bar/pie in report and preview use CSS variables (`--barColor1`…`--barColor5`, `--pieColor1`/`--pieColor2`) so colors stay in sync. ReportStylePreview includes Value Chain block and Landing page section. See `docs/release-notes-11.59.0.md`, `docs/features/features-landing-main-page.md`.

## Top-Level Structure
- `docs/index.md` is the canonical curated entrypoint (core resources, operations, security, charts, design, features, admin, API, and legacy/meta).
- `docs/PROJECT_MANAGEMENT.md` is the SSOT rulebook for board usage, card cadence, and issue hygiene.
- `docs/HANDOVER.md` is the living handover log for current repo truth and next-agent continuity.
- `docs/documentation-governance.md` defines the rules for canonical docs, required metadata, and the deprecation/redirect strategy.
- Active operations docs live in `docs/operations/` (action plan, roadmap, deployment checklists, implementation closure evidence, learnings, and release notes). Execution state is only in `docs/operations/operations-action-plan.md`.
- Security artifacts are consolidated under `docs/security/` (canonical docs). Security audits and phase-closure reports were moved under `docs/archive/_archive/security/` to reduce the risk of working from outdated sources.
- Chart docs are explicitly split: canonical guidance in `docs/charts/` (start at `docs/charts/charts-overview.md`), historical one-off notes in `docs/archive/_archive/charts/`.
- Design contracts and layout grammar live in `docs/design/` (start at `docs/design/design-overview.md`); older “fix plan / fix complete” notes moved to `docs/archive/_archive/design/`.
- Feature-level subsystem docs live in `docs/features/` (start at `docs/features/features-overview.md`).
- Legacy audits and implementation reports remain under `docs/archive/2025/`. Deprecated guides were moved to `docs/archive/_archive/deprecated-guides-2025/` to reduce the risk of using outdated sources.
- Closed audit investigations were consolidated into `docs/archive/_archive/investigations/archive-investigations-pack-2026.md`. The active folder `docs/audits/investigations/` now only contains `README.md` (index/pointer) to keep active doc count low.
- Architecture/admin references are still tucked under `docs/architecture`, `docs/admin`, `docs/api`, `docs/design`, `docs/components`, `docs/conventions`, `docs/guides`, `docs/migrations`, and `docs/setup`. Keep using those folders for new entries.

## Key Project Context
- Chart rendering fixes (KPI, Pie, Bar) rely on CSS Grid + container queries. Canonical chart docs live in `docs/charts/` (overview + alignment summary + table chart guide); pixel-level KPI analysis and title-overflow fix notes were archived into `docs/archive/_archive/charts/`.
- Security project runs in four phases: password security (bcrypt migration), session security (JWT session refactor), XSS protection (sanitization and logging), and code injection protection. Historical phase completion notes live in `docs/archive/_archive/security/archive-security-archive-pack.md`.
- Operations documentation is the single source of truth for rollout plans, checklists, and remediation steps. Point references to `docs/operations/*` from other docs to avoid stale root file names.
- Engineering discipline rule: **Fix the class, not the instance** (no single-point patching). Treat every reported bug as a likely pattern; search for all instances, fix the whole class (or document remaining scope), then say done. Source: `docs/coding-standards.md` and `docs/operations/operations-learnings.md`.
- Execution state lives in `docs/operations/operations-action-plan.md` only (single executable queue). TASKLIST.md was removed per merge rule—no separate task list.
- Use `docs/index.md` as the canonical overview—if you add a new key doc, make sure it’s linked there.
- Deprecated or archived content should go into `docs/archive/_archive/` or `docs/archive/2025/` so readers know not to rely on it.
- Deprecated entrypoints under `docs/` are deleted (not kept as redirect stubs) to prevent working from the wrong source. When a file moves, update internal links and use `docs/index.md` + `docs/_meta/meta-canonical-map.md` to find the canonical doc.
- Some archived design notes were consolidated to reduce file count (e.g., the Block Saving Fix plan and template selection persistence note were merged into their corresponding archived implementation/plan docs under `docs/archive/_archive/design/`).
- Archived chart fix notes were consolidated into a single file: `docs/archive/_archive/charts/archive-chart-alignment-history.md` (includes appendices for KPI pixel analysis and title overflow fix notes).
- Historical UI plan/tracker documents that duplicated the canonical design folder were consolidated into `docs/archive/_archive/design/archive-ui-master-plans-pack.md` and removed from the active root.
- One-off delivered feature summaries that were previously kept at `docs/*.md` were consolidated into `docs/archive/_archive/features/archive-delivered-one-offs-pack-2026.md` (canonical feature guides live in `docs/features/`).
- Historical fix notes under `docs/fixes/` were consolidated into `docs/archive/_archive/fixes/fixes-pack-2025-12.md` and the `docs/fixes/` folder was removed to prevent stale guidance.
- The large set of legacy "deprecated guides (2025)" was consolidated into `docs/archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md`. The former stub files were deleted per merge rule; links point to LEGACY_GUIDES_PACK.md#legacy-* anchors.
- The `docs/archive/2025/` directory was consolidated into three packs to reduce file count:
  - `docs/archive/2025/archive-documentation-refactor-pack.md`
  - `docs/archive/2025/archive-implementation-reports-pack.md`
  - `docs/archive/2025/archive-old-audits-pack.md`

## Maintenance Notes
- Run a global search whenever you rename or move docs so links get updated (some references still pointed to root names before this refactor).
- Verified reference hygiene today by scanning for each renamed/relocated doc and ensuring every mention points to the new path (no stale `*.md` links remain outside the new folders).
- Conducted a full hash-based scan across every Markdown file to ensure no two files contain identical normalized content; this scan confirmed there are no outright duplicates left in the active `docs/` tree.
- Link integrity is enforced via `scripts/docs_link_check.py` and the generated report `docs/_meta/meta-docs-link-check.md` (current state: 0 broken links under `docs/`, including `archive/_archive/`).
- Use `docs/_meta/meta-docs-inventory.md` (generated) to see the full list of docs and their header metadata, and `docs/_meta/meta-docs-triage.md` to drive cleanup in a fixed order.
- Potential consolidation candidates still in the repo:
  - Chart alignment archival notes were consolidated into `docs/archive/_archive/charts/archive-chart-alignment-history.md`. If/when the architecture dive (`CHART_ALIGNMENT_FIXES_v12.md`) is restored, we can further reduce historical material or re-point references.
  - `docs/archive/2025/deprecated-guides/` is intentionally minimal now; it contains the canonical [VARIABLE_SYSTEM_HISTORY.md](archive/2025/deprecated-guides/archive-variable-system-history.md). All other legacy guides were moved to `docs/archive/_archive/deprecated-guides-2025/`, and the raw variable-system originals were moved to [archive/_archive/legacy-variable-system](archive/_archive/legacy-variable-system) for audit traceability.
- The `docs/charts/charts-chart-alignment-summary.md` links to archived [archive/_archive/charts/CHART_ALIGNMENT_HISTORY.md](archive/_archive/charts/archive-chart-alignment-history.md) for deeper context; keep it in `archive/_archive/charts/`.
- For quick context, re-open this file to recall where to find each documentation area and the high-level priorities.
