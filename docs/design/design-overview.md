# Design Overview
Status: Active
Last Updated: 2026-02-05T00:00:00.000Z
Canonical: Yes
Owner: Design / Architecture

## Purpose
This folder is the source of truth for report rendering constraints (layout grammar), design tokens, and the contracts between Admin configuration and the report renderer.

## Canonical Documents
- `docs/design/design-system.md` - Design tokens, component primitives, and styling rules.
- `docs/design/design-layout-grammar.md` - The non-negotiable rules (no scrolling, no clipping, determinism) used by audits and implementation.
- `docs/design/design-layout-system.md` - The report layout system spec and block/item behaviors.
- `docs/design/design-report-layout-v2-contract.md` - Contract between LayoutV2 (Admin) and renderer (Reporting).
- `docs/design/design-font-management-system.md` - Font scaling, syncing, and typography constraints.
- `docs/design/design-chart-height-system.md` - Height allocation rules for chart blocks and their implications.

## Planning / Reference
- Table chart height control is tracked as future work in `docs/operations/operations-roadmap.md` (detailed historical plan is archived at `docs/archive/_archive/design/TABLE_CHART_HEIGHT_CONTROL_PLAN.md`).
- `docs/archive/_archive/design/REPORT_TEXT_SIZING_PLAN.md` - Plan for improving text sizing and markdown behavior (archived; roadmap item points here).
- `docs/design/design-layout-grammar-compliance.md` - Evidence-style compliance report used by audits.

## Archived (Do Not Edit)
Older “fix plan / fix complete” notes that are no longer referenced live are kept under `docs/archive/_archive/design/`.

Historical UI plan/tracker documents that used to live at the repo root are preserved as a single pack:
- `docs/archive/_archive/design/archive-ui-master-plans-pack.md`
