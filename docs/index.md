# Documentation Index
Status: Active
Last Updated: 2026-02-05T21:07:42.000Z
Canonical: Yes
Owner: Documentation

## Core Resources
- [ARCHITECTURE.md](ARCHITECTURE.md) — Platform architecture, dependency layout, and service-level diagrams.
- [CODING_STANDARDS.md](CODING_STANDARDS.md) — Code style, naming conventions, and documentation expectations.
- [DOCUMENTATION_GOVERNANCE.md](DOCUMENTATION_GOVERNANCE.md) — Rules for canonical docs, deprecation, and required metadata.
- [AUDIT_ACTION_PLAN.md](AUDIT_ACTION_PLAN.md) — Consolidated plan outlining audit-driven tasks and owners.

## Operations & Delivery
- [operations/ACTION_PLAN.md](operations/ACTION_PLAN.md) — Tactical queue for ops, sprint goals, and blockers.
- [operations/ROADMAP.md](operations/ROADMAP.md) — Quarterly roadmap with targets, risks, and dependencies.
- [operations/DEPLOYMENT_CHECKLIST.md](operations/DEPLOYMENT_CHECKLIST.md) — Pre/post deployment validation, smoke tests, and rollbacks.
- [operations/IMPLEMENTATION_COMPLETE.md](operations/IMPLEMENTATION_COMPLETE.md) — Summary of finished implementation work and evidence of completion.

## Security
- [security/SECURITY_OVERVIEW.md](security/SECURITY_OVERVIEW.md) — Canonical entrypoint and pointers to archived audits and phase closure docs.
- [security/security-enhancements.md](security/security-enhancements.md) — API protection, rate limiting, and middleware details.
- [security/security-migration-guide.md](security/security-migration-guide.md) — Step‑by‑step developer migration instructions for the security stack.

## Charts
- [charts/CHARTS_OVERVIEW.md](charts/CHARTS_OVERVIEW.md) — Canonical entrypoint for chart configuration and rendering docs.
- [charts/CHART_ALIGNMENT_SUMMARY.md](charts/CHART_ALIGNMENT_SUMMARY.md) — Architecture + testing checklist for KPI/Pie/Bar alignment fixes.
- [charts/TABLE_CHART_USAGE_GUIDE.md](charts/TABLE_CHART_USAGE_GUIDE.md) — How to create and populate a `table` chart.

## Design System & Layout Grammar
- [design/DESIGN_OVERVIEW.md](design/DESIGN_OVERVIEW.md) — Canonical entrypoint for design, layout grammar, and renderer contracts.
- [design/DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md) — Design tokens, component primitives, and styling rules.
- [design/LAYOUT_GRAMMAR.md](design/LAYOUT_GRAMMAR.md) — The non-negotiable rules used by audits and implementation.
- [design/LAYOUT_SYSTEM.md](design/LAYOUT_SYSTEM.md) — Report layout system spec (blocks/items) and behaviors.
- [design/REPORT_LAYOUT_V2_CONTRACT.md](design/REPORT_LAYOUT_V2_CONTRACT.md) — LayoutV2 contract between Admin config and renderer.

## Features
- [features/FEATURES_OVERVIEW.md](features/FEATURES_OVERVIEW.md) — Canonical entrypoint for subsystem feature docs.
- [features/AUTHENTICATION.md](features/AUTHENTICATION.md) — Authentication, roles, sessions, and page-password access.
- [features/PARTNERS_SYSTEM_GUIDE.md](features/PARTNERS_SYSTEM_GUIDE.md) — Partner model, UI flows, and partner-related APIs.
- [features/BITLY_INTEGRATION_GUIDE.md](features/BITLY_INTEGRATION_GUIDE.md) — Bitly integration architecture, endpoints, and operations.
- [features/GOOGLE_SHEETS_INTEGRATION.md](features/GOOGLE_SHEETS_INTEGRATION.md) — Google Sheets integration, auth, sync behavior, and troubleshooting.
- [features/HASHTAG_SYSTEM.md](features/HASHTAG_SYSTEM.md) — Hashtag system behavior and APIs.

## Admin & Templates
- [admin/END_USER_GUIDE.md](admin/END_USER_GUIDE.md) — Canonical operator guide for Admin workflows and UI paths.
- [admin/ADMIN_REPORT_TEMPLATE_MODEL.md](admin/ADMIN_REPORT_TEMPLATE_MODEL.md) — Report template data model + runtime selection rules.
- [admin/ADMIN_LAYOUT_V2_SCHEMA.md](admin/ADMIN_LAYOUT_V2_SCHEMA.md) — LayoutV2 schema contract consumed by Reporting.
- [admin/ADMIN_LAYOUT_V2_TEMPLATE_BUILDER.md](admin/ADMIN_LAYOUT_V2_TEMPLATE_BUILDER.md) — Operator guide for authoring LayoutV2 blocks.
- [admin/STYLE_MODEL_AND_ASSIGNMENT_RULES.md](admin/STYLE_MODEL_AND_ASSIGNMENT_RULES.md) — Where report styles live and how they resolve.
- [admin/clicker_manager.md](admin/clicker_manager.md) — Partner-aware clicker sets and fallback rules.

## API
- [api/API_PUBLIC.md](api/API_PUBLIC.md) — Public, bearer-token API documentation (partners/events read APIs).
- [api/API_REFERENCE.md](api/API_REFERENCE.md) — Quick reference for admin/internal APIs and pointers to deeper feature guides.

## Audit, Legacy, and Generated Meta
- `docs/audits/` — Active audit entrypoints (start at `docs/audits/README.md`).
- `docs/archive/_archive/` — Deprecated/legacy material kept for traceability; do not edit unless explicitly reviving.
- `docs/archive/` — Long-term archived audits and implementation reports.
- Chart alignment history (archived): `archive/_archive/charts/CHART_ALIGNMENT_HISTORY.md`.
- Audit investigations pack (archived): `archive/_archive/investigations/INVESTIGATIONS_PACK_2026.md`.
- `docs/_meta/` — Generated reports used to keep docs consistent:
  - `docs/_meta/DOCS_INVENTORY.md` — Full inventory + metadata.
  - `docs/_meta/DOCS_TRIAGE.md` — Fixed-order cleanup queue.
  - `docs/_meta/DOCS_LINK_CHECK.md` — Markdown link integrity report.
  - `docs/_meta/CANONICAL_MAP.md` — Canonical vs reference vs archived map.
