# Delivery Focus (MessMass)
Status: Active
Last Updated: 2026-02-21
Canonical: No
Owner: Product

**Source of truth:** [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1) (Product = messmass). Issues live in [mvp-factory-control](https://github.com/moldovancsaba/mvp-factory-control).

## Top 5 value & high-priority (from board, Product = messmass)

*Reconsidered 2026-02-21 after #38 Done and P1-1 (indexes) run in dev.*

| Priority | Status  | Issue | Title |
|----------|---------|-------|--------|
| P0 | Roadmap | [#44](https://github.com/moldovancsaba/mvp-factory-control/issues/44) | Advanced Analytics & Insights Platform (Q1–Q2 2026) |
| P0 | Roadmap | [#57](https://github.com/moldovancsaba/mvp-factory-control/issues/57) | Milestone: Analytics Platform Phase 1 — Data Aggregation & Storage (Q1 2026) |
| P0 | Roadmap | [#58](https://github.com/moldovancsaba/mvp-factory-control/issues/58) | Milestone: Analytics Platform Phase 2 — Insights Engine (Q1–Q2 2026) |
| P0 | Roadmap | [#59](https://github.com/moldovancsaba/mvp-factory-control/issues/59) | Milestone: Analytics Platform Phase 3 — Advanced Dashboards (Q2 2026) |
| P1 | Roadmap | [#46](https://github.com/moldovancsaba/mvp-factory-control/issues/46) | SSO Integration with DoneIsBetter (Q1 2026) |

**Note:** #38 (OPS-ANALYTICS-01) is Done; it delivered Phase 1 compare APIs + Phase 2 insights summary, so #57 and #58 have partial delivery. Next executable options: **#46** (SSO), **#57** / **#58** (formal milestone closure or follow-up), **#45** (Google Sheets Phase 3), **#39** (Layout Grammar Editor).

## Recommended next delivery step

1. **Move one item to Ready:** In [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1), set **Status = Ready** for the issue you want to execute next (e.g. [#38 OPS-ANALYTICS-01](https://github.com/moldovancsaba/mvp-factory-control/issues/38) or Phase 1 [#57](https://github.com/moldovancsaba/mvp-factory-control/issues/57)), and ensure the issue body has a valid [Executable Prompt Package](https://github.com/moldovancsaba/mvp-factory-control/blob/main/docs/EXECUTABLE_PROMPT_PACKAGE.md).
2. **Execute:** Agent or dev picks the Ready card, runs implementation, updates board fields and posts evidence in the issue.
3. **Close:** Move Status to Done and document in release notes as needed.

## Recently completed

- [#59](https://github.com/moldovancsaba/mvp-factory-control/issues/59) Analytics Phase 3 — Advanced Dashboards — **Done**. 4 dashboard templates: Executive (`/admin/analytics/executive`), Marketing (`/admin/analytics/marketing`), Operations (`/admin/analytics/operations`), Partner (`/admin/partners/[id]/analytics`). Shared `ExecutiveDashboardView` with configurable title/subtitle/defaultPeriod. Design doc Phase 3 section updated. Follow-ups: custom preferences save, PDF export, real-time &lt;2s (optional).
- [#45](https://github.com/moldovancsaba/mvp-factory-control/issues/45) Google Sheets Phase 3 Event-Level Sync — **Done**. Event-level pull (eventId in pull API), editor UI Pull/Push on /edit/[slug], status/health unchanged; docs updated.
- [#57](https://github.com/moldovancsaba/mvp-factory-control/issues/57) Analytics Phase 1 milestone — **Done** (closure; delivered via #38). Evidence on issue.
- [#58](https://github.com/moldovancsaba/mvp-factory-control/issues/58) Analytics Phase 2 milestone — **Done** (closure; delivered via #38). Evidence on issue.
- [#39](https://github.com/moldovancsaba/mvp-factory-control/issues/39) Layout Grammar Editor Integration — **Done**. Edit Block modal: Update Block button disabled when layout check fails; realtime Layout check + save blocking already in place (OPS-LAYOUT-01). Runtime validation unchanged.
- [#46](https://github.com/moldovancsaba/mvp-factory-control/issues/46) SSO Integration with DoneIsBetter (Q1 2026) — **Done**. lib/ssoClient, /api/auth/sso/login, callback, config; dashboard requires SSO when SSO_BASE_URL set; login page SSO entry; coexists with existing users. Evidence: [comment](https://github.com/moldovancsaba/mvp-factory-control/issues/46#issuecomment-3938458755).
- **P1-1 (OPS-ANALYTICS-01):** Analytics indexes run in dev (2026-02-21) — `npm run analytics:setup-indexes`; all collections verified. Run in preview/production when ready.
- [#38](https://github.com/moldovancsaba/mvp-factory-control/issues/38) OPS-ANALYTICS-01: Advanced Analytics & Insights (Q1–Q2 2026) — **Done** (2026-02-21). Phase 1: compare/partners, compare/periods, [api-analytics.md](../api/api-analytics.md), cron/monitoring. Phase 2: `GET /api/analytics/insights/summary`. Evidence comment posted on issue.
- [#71](https://github.com/moldovancsaba/mvp-factory-control/issues/71) Style hardening Phase 4: modal/dialog positioning extraction — **Done** (2026-02-21). Evidence: [comment](https://github.com/moldovancsaba/mvp-factory-control/issues/71#issuecomment-3938421863).

## In progress

- None. Next: pick a Ready item (e.g. [#47](https://github.com/moldovancsaba/mvp-factory-control/issues/47), [#48](https://github.com/moldovancsaba/mvp-factory-control/issues/48)).
