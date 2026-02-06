# Design Overview
Status: Active
Last Updated: 2026-02-05T00:00:00.000Z
Canonical: Yes
Owner: Design / Architecture

## Purpose
This folder is the source of truth for report rendering constraints (layout grammar), design tokens, and the contracts between Admin configuration and the report renderer.

## Canonical Documents
- `docs/design/DESIGN_SYSTEM.md` - Design tokens, component primitives, and styling rules.
- `docs/design/LAYOUT_GRAMMAR.md` - The non-negotiable rules (no scrolling, no clipping, determinism) used by audits and implementation.
- `docs/design/LAYOUT_SYSTEM.md` - The report layout system spec and block/item behaviors.
- `docs/design/REPORT_LAYOUT_V2_CONTRACT.md` - Contract between LayoutV2 (Admin) and renderer (Reporting).
- `docs/design/FONT_MANAGEMENT_SYSTEM.md` - Font scaling, syncing, and typography constraints.
- `docs/design/CHART_HEIGHT_SYSTEM.md` - Height allocation rules for chart blocks and their implications.

## Planning / Reference
- `docs/design/TABLE_CHART_HEIGHT_CONTROL_PLAN.md` - Implementation plan for table chart height control.
- `docs/design/REPORT_TEXT_SIZING_PLAN.md` - Plan for improving text sizing and markdown behavior.
- `docs/design/LAYOUT_GRAMMAR_COMPLIANCE.md` - Evidence-style compliance report used by audits.

## Archived (Do Not Edit)
Older “fix plan / fix complete” notes that are no longer referenced live are kept under `docs/archive/_archive/design/`.

Historical UI plan/tracker documents that used to live at the repo root are preserved as a single pack:
- `docs/archive/_archive/design/UI_MASTER_PLANS_PACK.md`
