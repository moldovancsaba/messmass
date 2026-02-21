# Documentation Index
Status: Active
Last Updated: 2026-02-21T00:00:00.000Z
Canonical: Yes
Owner: Documentation

## Core Resources
- [architecture.md](architecture.md) — Platform architecture, dependency layout, and service-level diagrams.
- [coding-standards.md](coding-standards.md) — Code style, naming conventions, and documentation expectations.
- [documentation-governance.md](documentation-governance.md) — Rules for canonical docs, deprecation, and required metadata.

## Operations & Delivery
- [operations-action-plan.md](operations/operations-action-plan.md) — Tactical queue for ops, sprint goals, and blockers.
- [operations-delivery-focus.md](operations/operations-delivery-focus.md) — Top 5 value/priority board issues and recommended next delivery step.
- [operations-roadmap.md](operations/operations-roadmap.md) — Quarterly roadmap with targets, risks, and dependencies.
- [operations-deployment-checklist.md](operations/operations-deployment-checklist.md) — Pre/post deployment validation, smoke tests, and rollbacks.
- [operations-implementation-complete.md](operations/operations-implementation-complete.md) — Summary of finished implementation work and evidence of completion.

## Security
- [security-overview.md](security/security-overview.md) — Canonical entrypoint and pointers to archived audits and phase closure docs.
- [security/security-enhancements.md](security/security-enhancements.md) — API protection, rate limiting, and middleware details.
- [security/security-migration-guide.md](security/security-migration-guide.md) — Step‑by‑step developer migration instructions for the security stack.

## Charts
- [charts-overview.md](charts/charts-overview.md) — Canonical entrypoint for chart configuration and rendering docs.
- [charts-chart-alignment-summary.md](charts/charts-chart-alignment-summary.md) — Architecture + testing checklist for KPI/Pie/Bar alignment fixes.
- [charts-table-chart-usage-guide.md](charts/charts-table-chart-usage-guide.md) — How to create and populate a `table` chart.

## Design System & Layout Grammar
- [design-overview.md](design/design-overview.md) — Canonical entrypoint for design, layout grammar, and renderer contracts.
- [design/DESIGN_SYSTEM.md](design/design-system.md) — Design tokens, component primitives, and styling rules.
- [design/LAYOUT_GRAMMAR.md](design/design-layout-grammar.md) — The non-negotiable rules used by audits and implementation.
- [design/LAYOUT_SYSTEM.md](design/design-layout-system.md) — Report layout system spec (blocks/items) and behaviors.
- [design/REPORT_LAYOUT_V2_CONTRACT.md](design/design-report-layout-v2-contract.md) — LayoutV2 contract between Admin config and renderer.

## Features
- [features-overview.md](features/features-overview.md) — Canonical entrypoint for subsystem feature docs.
- [features/AUTHENTICATION.md](features/features-authentication.md) — Authentication, roles, sessions, and page-password access.
- [features/PARTNERS_SYSTEM_GUIDE.md](features/features-partners-system-guide.md) — Partner model, UI flows, and partner-related APIs.
- [features/BITLY_INTEGRATION_GUIDE.md](features/features-bitly-integration-guide.md) — Bitly integration architecture, endpoints, and operations.
- [features/GOOGLE_SHEETS_INTEGRATION.md](features/features-google-sheets-integration.md) — Google Sheets integration, auth, sync behavior, and troubleshooting.
- [features/HASHTAG_SYSTEM.md](features/features-hashtag-system.md) — Hashtag system behavior and APIs.

## Admin & Templates
- [admin-end-user-guide.md](admin/admin-end-user-guide.md) — Canonical operator guide for Admin workflows and UI paths.
- [admin/ADMIN_REPORT_TEMPLATE_MODEL.md](admin/admin-report-template-model.md) — Report template data model + runtime selection rules.
- [admin/ADMIN_LAYOUT_V2_SCHEMA.md](admin/admin-layout-v2-schema.md) — LayoutV2 schema contract consumed by Reporting.
- [admin/ADMIN_LAYOUT_V2_TEMPLATE_BUILDER.md](admin/admin-layout-v2-template-builder.md) — Operator guide for authoring LayoutV2 blocks.
- [admin/STYLE_MODEL_AND_ASSIGNMENT_RULES.md](admin/admin-style-model-and-assignment-rules.md) — Where report styles live and how they resolve.
- [admin/clicker_manager.md](admin/admin-clicker-manager.md) — Partner-aware clicker sets and fallback rules.

## API
- [api-public.md](api/api-public.md) — Public, bearer-token API documentation (partners/events read APIs).
- [api-reference.md](api/api-reference.md) — Quick reference for admin/internal APIs and pointers to deeper feature guides.

## Audit, Legacy, and Generated Meta
- `docs/audits/` — Active audit entrypoints (start at `docs/audits/audits-readme.md`).
- `docs/archive/_archive/` — Deprecated/legacy material kept for traceability; do not edit unless explicitly reviving.
- `docs/archive/` — Long-term archived audits and implementation reports.
- Chart alignment history (archived): `archive/_archive/charts/CHART_ALIGNMENT_HISTORY.md`.
- Audit investigations pack (archived): `archive/_archive/investigations/INVESTIGATIONS_PACK_2026.md`.
- `docs/_meta/` — Generated reports used to keep docs consistent:
  - `docs/_meta/meta-docs-inventory.md` — Full inventory + metadata.
  - `docs/_meta/meta-docs-triage.md` — Fixed-order cleanup queue.
  - `docs/_meta/meta-docs-link-check.md` — Markdown link integrity report.
  - `docs/_meta/meta-canonical-map.md` — Canonical vs reference vs archived map.
