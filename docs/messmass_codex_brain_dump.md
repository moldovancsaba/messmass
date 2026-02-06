# Brain Dump
Status: Active
Last Updated: 2026-02-05T21:09:55.000Z
Canonical: Yes
Owner: Documentation

**Purpose:** quick-reference notes that capture the state of this repo and how the docs/ tree is organized after today's refactor.

## Top-Level Structure
- `docs/index.md` is the canonical curated entrypoint (core resources, operations, security, charts, design, features, admin, API, and legacy/meta).
- `docs/DOCUMENTATION_GOVERNANCE.md` defines the rules for canonical docs, required metadata, and the deprecation/redirect strategy.
- Active operations docs live in `docs/operations/` (action plan, roadmap, tasklist, deployment checklist, implementation review, CTO remediation, learnings, release notes, warp updates, and agent names).
- Security artifacts are consolidated under `docs/security/` (canonical docs). Security audits and phase-closure reports were moved under `docs/archive/_archive/security/` to reduce the risk of working from outdated sources.
- Chart docs are explicitly split: canonical guidance in `docs/charts/` (start at `docs/charts/CHARTS_OVERVIEW.md`), historical one-off notes in `docs/archive/_archive/charts/`.
- Design contracts and layout grammar live in `docs/design/` (start at `docs/design/DESIGN_OVERVIEW.md`); older “fix plan / fix complete” notes moved to `docs/archive/_archive/design/`.
- Feature-level subsystem docs live in `docs/features/` (start at `docs/features/FEATURES_OVERVIEW.md`).
- Legacy audits and implementation reports remain under `docs/archive/2025/`. Deprecated guides were moved to `docs/archive/_archive/deprecated-guides-2025/` to reduce the risk of using outdated sources.
- Closed audit investigations were consolidated into `docs/archive/_archive/investigations/INVESTIGATIONS_PACK_2026.md`. The active folder `docs/audits/investigations/` now only contains `README.md` (index/pointer) to keep active doc count low.
- Architecture/admin references are still tucked under `docs/architecture`, `docs/admin`, `docs/api`, `docs/design`, `docs/components`, `docs/conventions`, `docs/guides`, `docs/migrations`, and `docs/setup`. Keep using those folders for new entries.

## Key Project Context
- Chart rendering fixes (KPI, Pie, Bar) rely on CSS Grid + container queries. Canonical chart docs live in `docs/charts/` (overview + alignment summary + table chart guide); pixel-level KPI analysis and title-overflow fix notes were archived into `docs/archive/_archive/charts/`.
- Security project runs in four phases: password security (bcrypt migration), session security (JWT session refactor), XSS protection (sanitization and logging), and code injection protection. Historical phase completion notes live in `docs/archive/_archive/security/SECURITY_ARCHIVE_PACK.md`.
- Operations documentation is the single source of truth for rollout plans, checklists, and remediation steps. Point references to `docs/operations/*` from other docs to avoid stale root file names.
- Engineering discipline rule: **Fix the class, not the instance** (no single-point patching). Treat every reported bug as a likely pattern; search for all instances, fix the whole class (or document remaining scope), then say done. Source: `docs/CODING_STANDARDS.md` and `docs/operations/LEARNINGS.md`.
- Execution state lives in `docs/operations/ACTION_PLAN.md` only (single executable queue). TASKLIST.md was removed per merge rule—no separate task list.
- Use `docs/index.md` as the canonical overview—if you add a new key doc, make sure it’s linked there.
- Deprecated or archived content should go into `docs/archive/_archive/` or `docs/archive/2025/` so readers know not to rely on it.
- Deprecated entrypoints under `docs/` are deleted (not kept as redirect stubs) to prevent working from the wrong source. When a file moves, update internal links and use `docs/index.md` + `docs/_meta/CANONICAL_MAP.md` to find the canonical doc.
- Some archived design notes were consolidated to reduce file count (e.g., the Block Saving Fix plan and template selection persistence note were merged into their corresponding archived implementation/plan docs under `docs/archive/_archive/design/`).
- Archived chart fix notes were consolidated into a single file: `docs/archive/_archive/charts/CHART_ALIGNMENT_HISTORY.md` (includes appendices for KPI pixel analysis and title overflow fix notes).
- Historical UI plan/tracker documents that duplicated the canonical design folder were consolidated into `docs/archive/_archive/design/UI_MASTER_PLANS_PACK.md` and removed from the active root.
- One-off delivered feature summaries that were previously kept at `docs/*.md` were consolidated into `docs/archive/_archive/features/DELIVERED_ONE_OFFS_PACK_2026.md` (canonical feature guides live in `docs/features/`).
- Historical fix notes under `docs/fixes/` were consolidated into `docs/archive/_archive/fixes/FIXES_PACK_2025-12.md` and the `docs/fixes/` folder was removed to prevent stale guidance.
- The large set of legacy "deprecated guides (2025)" was consolidated into `docs/archive/_archive/deprecated-guides-2025/LEGACY_GUIDES_PACK.md`. The former stub files were deleted per merge rule; links point to LEGACY_GUIDES_PACK.md#legacy-* anchors.
- The `docs/archive/2025/` directory was consolidated into three packs to reduce file count:
  - `docs/archive/2025/DOCUMENTATION_REFACTOR_PACK.md`
  - `docs/archive/2025/IMPLEMENTATION_REPORTS_PACK.md`
  - `docs/archive/2025/OLD_AUDITS_PACK.md`

## Maintenance Notes
- Run a global search whenever you rename or move docs so links get updated (some references still pointed to root names before this refactor).
- Verified reference hygiene today by scanning for each renamed/relocated doc and ensuring every mention points to the new path (no stale `*.md` links remain outside the new folders).
- Conducted a full hash-based scan across every Markdown file to ensure no two files contain identical normalized content; this scan confirmed there are no outright duplicates left in the active `docs/` tree.
- Link integrity is enforced via `scripts/docs_link_check.py` and the generated report `docs/_meta/DOCS_LINK_CHECK.md` (current state: 0 broken links under `docs/`, including `archive/_archive/`).
- Use `docs/_meta/DOCS_INVENTORY.md` (generated) to see the full list of docs and their header metadata, and `docs/_meta/DOCS_TRIAGE.md` to drive cleanup in a fixed order.
- Potential consolidation candidates still in the repo:
  - Chart alignment archival notes were consolidated into `docs/archive/_archive/charts/CHART_ALIGNMENT_HISTORY.md`. If/when the architecture dive (`CHART_ALIGNMENT_FIXES_v12.md`) is restored, we can further reduce historical material or re-point references.
  - `docs/archive/2025/deprecated-guides/` is intentionally minimal now; it contains the canonical [VARIABLE_SYSTEM_HISTORY.md](archive/2025/deprecated-guides/VARIABLE_SYSTEM_HISTORY.md). All other legacy guides were moved to `docs/archive/_archive/deprecated-guides-2025/`, and the raw variable-system originals were moved to [archive/_archive/legacy-variable-system](archive/_archive/legacy-variable-system) for audit traceability.
- The `docs/charts/CHART_ALIGNMENT_SUMMARY.md` links to archived [archive/_archive/charts/CHART_ALIGNMENT_HISTORY.md](archive/_archive/charts/CHART_ALIGNMENT_HISTORY.md) for deeper context; keep it in `archive/_archive/charts/`.
- For quick context, re-open this file to recall where to find each documentation area and the high-level priorities.
