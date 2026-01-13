# Admin UI Insights Model
Status: Draft
Last Updated: 2026-01-13T14:56:04.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Define what an Admin Insight is and how it is generated.
- [ ] Inventory Insights endpoints and Admin surfaces.
- [ ] Resolve duplication C-02 with a single canonical Insights surface.
- [ ] Map dependencies on event inputs, KYC variables, and clicker groups.
- [ ] Identify downstream consumers (Admin vs reporting).

2 Insight Definition (Computed, Not Stored)
- [ ] Insights are computed on request from event stats and analytics aggregates; they are not persisted as a separate collection. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts).
- [ ] There are two Insight schemas in code today:
  - [ ] analytics-insights (type + severity) used by `/api/analytics/insights`. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts).
  - [ ] insightsEngine (category + priority) used by event/executive endpoints. Evidence: [lib/insightsEngine.ts](lib/insightsEngine.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts), [app/api/analytics/executive/insights/route.ts](app/api/analytics/executive/insights/route.ts).

3 Data Inputs and Generation Engines
| Engine | Inputs | Output scope | Evidence |
| --- | --- | --- | --- |
| [ ] analytics-insights | projects collection + event stats; anomaly/trend/benchmark/prediction modules | Global or partner insights (computed) | [lib/analytics-insights.ts](lib/analytics-insights.ts), [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts), [app/api/analytics/insights/partners/[partnerId]/route.ts](app/api/analytics/insights/partners/[partnerId]/route.ts) |
| [ ] insightsEngine | analytics_aggregates + partner context + historical aggregates | Event and executive insights (computed) | [lib/insightsEngine.ts](lib/insightsEngine.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts), [app/api/analytics/executive/insights/route.ts](app/api/analytics/executive/insights/route.ts) |

4 Dependencies (Events, KYC, Clicker)
- [ ] Events: analytics-insights reads `projects` event stats; insightsEngine reads `analytics_aggregates` for event metrics. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts), [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts).
- [ ] KYC variables: No direct references to `/api/variables-config` or KYC metadata in insights engines or Admin insights pages; dependencies are indirect via event stats. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts), [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx).
- [ ] Clicker groups: No direct references in insights engines; clicker configuration does not feed insights generation. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts).

5 Admin Surfaces and API Inventory
| Surface | API endpoint | Engine | Scope | Notes | Evidence |
| --- | --- | --- | --- | --- | --- |
| [ ] /admin/insights | /api/analytics/insights | analytics-insights | Global (recent events) | Uses type + severity filters. | [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts) |
| [ ] /admin/analytics/insights | /api/analytics/insights/all?limit=100 | insightsEngine (expected) | Global | API route `/api/analytics/insights/all` not found; response shape mismatch. | [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx) |
| [ ] /admin/analytics/executive | /api/analytics/executive/insights | insightsEngine | Global (critical/high) | Executive insights feed. | [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx), [app/api/analytics/executive/insights/route.ts](app/api/analytics/executive/insights/route.ts) |
| [ ] Event insights (API only) | /api/analytics/insights/[projectId] | insightsEngine | Event | Per-event insights report. | [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts) |
| [ ] Partner insights (API only) | /api/analytics/insights/partners/[partnerId] | analytics-insights | Partner | Partner-level insights across events. | [app/api/analytics/insights/partners/[partnerId]/route.ts](app/api/analytics/insights/partners/[partnerId]/route.ts) |

6 Ownership and Scope
- [ ] Ownership is global; insights are derived from event data and analytics aggregates, not edited manually. Evidence: [app/api/analytics/insights/route.ts](app/api/analytics/insights/route.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts).
- [ ] Partner and event scopes are derived views only (no overrides). Evidence: [app/api/analytics/insights/partners/[partnerId]/route.ts](app/api/analytics/insights/partners/[partnerId]/route.ts), [app/api/analytics/insights/[projectId]/route.ts](app/api/analytics/insights/[projectId]/route.ts).

7 Duplication Resolution (C-02)
- [ ] Canonical Insights surface: `/admin/analytics/insights` (Phase 3 dashboard).
- [ ] Deprecate or redirect `/admin/insights` to `/admin/analytics/insights` per consolidation plan. Evidence: [docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md](docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md).
- [ ] Align the canonical surface to a single API and schema (choose analytics-insights or insightsEngine; do not mix). Evidence: [docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md](docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx).

8 Downstream Consumers
- [ ] Admin analytics dashboards consume insights directly (/admin/insights, /admin/analytics/insights, /admin/analytics/executive). Evidence: [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx), [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx).
- [ ] Reporting consumption not observed in report UI code; insights appear Admin-only at present. Evidence: [app/report/[slug]/page.module.OLD.css](app/report/[slug]/page.module.OLD.css).

9 Risks and Gaps
- [ ] `/api/analytics/insights/all` endpoint is referenced but not present; /admin/analytics/insights expects `data.insights` payload. Evidence: [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx).
- [ ] Schema mismatch: analytics-insights uses severity/type; insightsEngine uses priority/category. Evidence: [lib/analytics-insights.ts](lib/analytics-insights.ts), [lib/insightsEngine.ts](lib/insightsEngine.ts).
- [ ] Role gating mismatch: `/admin/insights` is superadmin-only in route protection; `/admin/analytics/insights` is not. Evidence: [lib/routeProtection.ts](lib/routeProtection.ts), [middleware.ts](middleware.ts).
- [ ] Action tracking is UI-only TODO; no backend persistence for action/dismiss. Evidence: [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx).

10 Admin Constraints (Do This / Do Not Do This)
- [ ] Do: Treat insights as computed outputs from analytics data; do not edit manually.
- [ ] Do: Use one canonical Insights surface and one schema.
- [ ] Do not: Introduce partner/event overrides for insights definitions.
- [ ] Do not: Ship a UI that depends on missing endpoints or mismatched response shapes.
