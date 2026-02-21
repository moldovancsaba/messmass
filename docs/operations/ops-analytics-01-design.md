# OPS-ANALYTICS-01: Advanced Analytics & Insights — Design & Phase 1 Plan
Status: Active
Last Updated: 2026-02-21
Canonical: No
Owner: Product / Engineering

**Board:** [MVP Factory #38](https://github.com/moldovancsaba/mvp-factory-control/issues/38)  
**Objective:** Deliver Advanced Analytics & Insights platform; start with aggregation tables and comparative analytics APIs (<500ms target).

---

## 1. Current state (already in codebase)

### 1.1 Aggregation tables & performance target

- **Collections:** `analytics_aggregates`, `partner_analytics`, `event_comparisons` (see `lib/analytics-aggregates.types.ts`).
- **Types:** `TimeAggregatedMetrics` (time-bucketed: daily/weekly/monthly/yearly), `PartnerAnalytics`, `EventComparison`.
- **Performance target:** <500ms for 1-year datasets (documented in `app/api/analytics/aggregates/route.ts`).
- **Indexes:** `scripts/setupAnalyticsIndexes.ts` — indexes on `analytics_aggregates` (projectId, eventDate, aggregationType, partnerId+eventDate, updatedAt), `partner_analytics`, `event_comparisons`, `aggregation_logs`.
- **Cron:** `POST /api/cron/analytics-aggregation` calls `runFullAggregation()` from `lib/analytics-aggregator.ts` (daily job).

### 1.2 APIs today

| API | Purpose | Performance |
|-----|---------|-------------|
| `GET /api/analytics/aggregates` | Time-bucketed metrics (filters: bucket, startDate, endDate, partnerId, partnerIds, hashtag, limit, sort) | <500ms target |
| `GET /api/analytics/aggregates/partners` | Partner-level aggregates | <500ms target |
| `GET /api/analytics/compare?projectIds=...` | Event-to-event comparison (2–5 events); rankings, deltas | <300ms target |
| `GET /api/analytics/partner/[partnerId]` | Single-partner analytics from aggregates | — |
| `GET /api/analytics/executive/top-events` | Top events (period: 30d, 90d, all) | — |
| `GET /api/analytics/executive/insights` | Executive insights (7d, 30d, 90d) | — |
| `GET /api/analytics/executive/metrics` | Executive metrics with period-over-period growth | — |
| `GET /api/analytics/trends` | Time-series trends (optional partnerId) | — |
| `GET /api/analytics/insights/[projectId]` | Project-level insights | — |
| `GET /api/analytics/insights/partners/[partnerId]` | Partner-level insights | — |
| `GET /api/analytics/benchmarks` | Benchmark by period/category | — |

---

## 2. Scope and sequencing (defined)

| Phase | Scope | Status / sequencing |
|-------|--------|----------------------|
| **Phase 1** | Aggregation tables + indexes + cron; comparative API (event-to-event ✅); **extend** partner-to-partner and period-to-period compare | In progress (this doc + Phase 1 backlog) |
| **Phase 2** | Insights engine: rule-based anomaly/trend detection; reuse/enhance `lib/insightsEngine.ts`, `lib/analytics-insights.ts` | After Phase 1 |
| **Phase 3** | Dashboard views: executive (exists), marketing, operations, partner (partner dashboard exists at `/admin/partners/[id]/analytics`) | After Phase 2 |
| **Phase 4** | White-label report generation: PDF with branding, report templates | After Phase 3 |

**Non-goals (per issue #38):** Full AI/ML pipeline beyond defined insights; replacing existing reporting flows in v1.

---

## 3. Phase 1 backlog (dependencies documented)

- [ ] **P1-1** Verify and run `scripts/setupAnalyticsIndexes.ts` in all environments; confirm query plans for `analytics_aggregates` and `partner_analytics` for 1-year range stay under 500ms.
- [ ] **P1-2** Add **partner-to-partner** compare: e.g. `GET /api/analytics/compare/partners?partnerIds=id1,id2&period=30d` returning aggregated metrics per partner and deltas/rankings (reuse `partner_analytics` or aggregates filtered by partner).
- [ ] **P1-3** Add **period-to-period** compare: e.g. `GET /api/analytics/compare/periods?partnerId=...&periodA=2025-01&periodB=2025-02` or reuse/formalize executive metrics period comparison.
- [ ] **P1-4** Document public API contract for aggregates + compare (auth, rate limits, query params, response shape) in `docs/api/` or existing api-reference.
- [ ] **P1-5** Ensure cron `analytics-aggregation` is scheduled (e.g. Vercel Cron) and job metadata in `aggregation_jobs` is monitored for failures.

**Dependencies:** Current v8.x data models, Bitly many-to-many, Partners system (all in place). No new collections required for P1-2/P1-3 if reusing existing aggregates.

---

## 4. Risks and mitigations

- **Data model / query performance:** Mitigation: indexes in place; Phase 1 includes verification (P1-1).
- **Cross-system (partners, Bitly):** Mitigation: aggregation reads from existing `projects` and related collections; partner/Bitly already integrated in aggregator.

---

## 5. Definition of Done (issue #38)

- [x] Aggregation tables and APIs planned for <500ms — **documented above; already implemented and documented.**
- [x] Comparative analytics API, insights service, dashboards, white-label: **scope and sequencing defined** (Section 2).
- [x] Phase 1 backlog items created and dependencies documented — **Section 3.**

Next: Execute P1-1 through P1-5; then move to Phase 2 (insights engine).
