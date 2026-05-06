# Documentation Index
Status: Active
Last Updated: 2026-03-07T00:00:00.000Z
Canonical: Yes
Owner: Documentation

## Core Resources
- [DEVELOPER-CONDUCT.md](DEVELOPER-CONDUCT.md) — Product Owner mandate: AI developer conduct, documentation = code, stack discipline, build quality. Non-negotiable.
- [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) — SSOT board rules, required cadence, and delivery tracking process.
- [HANDOVER.md](HANDOVER.md) — Current repo handover, active context, and dated agent log.
- [root-structure.md](root-structure.md) — Canonical top-level repository structure and what is allowed at root.
- [architecture.md](architecture.md) — Platform architecture, dependency layout, and service-level diagrams.
- [coding-standards.md](coding-standards.md) — Code style, naming conventions, and documentation expectations.
- [documentation-governance.md](documentation-governance.md) — Rules for canonical docs, deprecation, and required metadata.

## Operations & Delivery
- [operations-action-plan.md](operations/operations-action-plan.md) — Tactical queue for ops, sprint goals, and blockers.
- [operations-delivery-focus.md](operations/operations-delivery-focus.md) — Top 5 value/priority board issues and recommended next delivery step.
- [ops-analytics-01-design.md](operations/ops-analytics-01-design.md) — OPS-ANALYTICS-01 design, Phase 1 backlog, scope/sequencing.
- [operations-roadmap.md](operations/operations-roadmap.md) — Quarterly roadmap with targets, risks, and dependencies.
- [operations-deployment-checklist.md](operations/operations-deployment-checklist.md) — Pre/post deployment validation, smoke tests, and rollbacks.
- [operations-implementation-complete.md](operations/operations-implementation-complete.md) — Summary of finished implementation work and evidence of completion.
- [V3/messmass_v3_api_specification.md](V3/messmass_v3_api_specification.md) — (Active) V3 REST API specification.
- [V3/messmass_v3_migration_playbook.md](V3/messmass_v3_migration_playbook.md) — Migration execution and operational rules.
- [V3/messmass_v3_quickstart_guide.md](V3/messmass_v3_quickstart_guide.md) — (NEW) Admin quickstart guide for V3 data management.
- [guides/admin/organizations.md](guides/admin/organizations.md) — (NEW) Administrator guide for Organization management and reporting.

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
- [2026-03-06_ADMIN_TOTALFANS_PARTNER_CARD_EDIT_HOTFIX.md](2026-03-06_ADMIN_TOTALFANS_PARTNER_CARD_EDIT_HOTFIX.md) — Production hotfix notes for admin `totalFans` consistency and partner card-view report-edit actions.
- [2026-03-06_PARTNER_REPORT_DELETE_HOTFIX.md](2026-03-06_PARTNER_REPORT_DELETE_HOTFIX.md) — Production hotfix notes for partner report total-fans cards and admin delete-project failure handling.
- [features/AUTHENTICATION.md](features/features-authentication.md) — Authentication, roles, sessions, and page-password access.
- [features/PARTNERS_SYSTEM_GUIDE.md](features/features-partners-system-guide.md) — Partner model, UI flows, and partner-related APIs.
- [features/BITLY_INTEGRATION_GUIDE.md](features/features-bitly-integration-guide.md) — Bitly integration architecture, endpoints, and operations.
- [features/GOOGLE_SHEETS_INTEGRATION.md](features/features-google-sheets-integration.md) — Google Sheets integration, auth, sync behavior, and troubleshooting.
- [features/HASHTAG_SYSTEM.md](features/features-hashtag-system.md) — Hashtag system behavior and APIs.
- [features/features-reporting-builder.md](features/features-reporting-builder.md) — Reporting & Builder mode (clicker): variable inputs per chart on `/edit/[slug]`.

## Admin & Templates
- [admin-end-user-guide.md](admin/admin-end-user-guide.md) — Canonical operator guide for Admin workflows and UI paths.
- [admin/admin-entity-system.md](admin/admin-entity-system.md) — Shared admin entity contract, capability matrix, and action engine for admin-managed surfaces.
- [admin/ADMIN_REPORT_TEMPLATE_MODEL.md](admin/admin-report-template-model.md) — Report template data model + runtime selection rules.
- [admin/ADMIN_LAYOUT_V2_SCHEMA.md](admin/admin-layout-v2-schema.md) — LayoutV2 schema contract consumed by Reporting.
- [admin/ADMIN_LAYOUT_V2_TEMPLATE_BUILDER.md](admin/admin-layout-v2-template-builder.md) — Operator guide for authoring LayoutV2 blocks.
- [admin/STYLE_MODEL_AND_ASSIGNMENT_RULES.md](admin/admin-style-model-and-assignment-rules.md) — Where report styles live and how they resolve.
- [admin/clicker_manager.md](admin/admin-clicker-manager.md) — Partner-aware clicker sets and fallback rules.

## API
- [api-public.md](api/api-public.md) — Public, bearer-token API documentation (partners/events read APIs).
- [api-reference.md](api/api-reference.md) — Quick reference for admin/internal APIs and pointers to deeper feature guides.
- [api-analytics.md](api/api-analytics.md) — Analytics aggregates and compare API (OPS-ANALYTICS-01 Phase 1).

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
