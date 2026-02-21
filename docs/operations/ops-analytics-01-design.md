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
| **Phase 2** | Insights engine: rule-based anomaly/trend detection; reuse/enhance `lib/insightsEngine.ts`, `lib/analytics-insights.ts` | **Done** — summary endpoint added; engines already in place |
| **Phase 3** | Dashboard views: executive, marketing, operations, partner | **Done** — 4 templates delivered (see Phase 3 section below) |
| **Phase 4** | White-label report generation: PDF with branding, report templates | After Phase 3 |

**Non-goals (per issue #38):** Full AI/ML pipeline beyond defined insights; replacing existing reporting flows in v1.

### Phase 3 — Dashboard templates (delivered)

- **Executive:** `/admin/analytics/executive` — high-level KPIs, trends, top events, critical insights.
- **Marketing:** `/admin/analytics/marketing` — campaign/audience view (shared ExecutiveDashboardView, 30d default).
- **Operations:** `/admin/analytics/operations` — delivery/capacity view (shared ExecutiveDashboardView, 30d default).
- **Partner:** `/admin/partners/[id]/analytics` — per-partner analytics (existing).

Shared view: `app/admin/analytics/executive/ExecutiveDashboardView.tsx` (configurable title, subtitle, defaultPeriod). Custom dashboards save preferences, real-time &lt;2s, mobile responsive, and PDF export remain as follow-ups per #59.

---

## 3. Phase 1 backlog (dependencies documented)

- [x] **P1-1** Verify and run `scripts/setupAnalyticsIndexes.ts` in all environments; confirm query plans for `analytics_aggregates` and `partner_analytics` for 1-year range stay under 500ms. **Command:** `npm run analytics:setup-indexes` (or `npx tsx scripts/setupAnalyticsIndexes.ts` with .env.local). **Done (dev 2026-02-21):** Indexes created and verified; run in preview/production when ready.
- [x] **P1-2** Add **partner-to-partner** compare: `GET /api/analytics/compare/partners?partnerIds=id1,id2` — implemented in `app/api/analytics/compare/partners/route.ts`.
- [x] **P1-3** Add **period-to-period** compare: `GET /api/analytics/compare/periods?periodA=2025-01&periodB=2025-02&bucket=monthly&partnerId=optional` — implemented in `app/api/analytics/compare/periods/route.ts`.
- [x] **P1-4** Document public API contract for aggregates + compare in `docs/api/api-analytics.md` (auth, rate limits, query params, response shape).
- [x] **P1-5** Cron schedule and monitoring documented in Section 3b below.

**Dependencies:** Current v8.x data models, Bitly many-to-many, Partners system (all in place). No new collections required for P1-2/P1-3 if reusing existing aggregates.

---

## 3a. Phase 2 — Insights engine (done)

- **Existing:** `lib/insightsEngine.ts` (anomaly, trend, benchmark, risk, opportunity; `generateEventInsights`), `lib/analytics-insights.ts` (per-event and partner `generateInsights` / `generatePartnerInsights`). Executive dashboard uses `GET /api/analytics/executive/insights` (priority filter, period 7d/30d/90d). Partner insights: `GET /api/analytics/insights/partners/[partnerId]`.
- **Added:** `GET /api/analytics/insights/summary` — returns counts only (totalInsights, criticalCount, highCount, mediumCount, lowCount, byCategory, eventsAnalyzed). Query params: `partnerId` (optional), `period` (7d|30d|90d), `maxEvents` (default 50, max 100). Auth: admin. Target: <500ms. Enables dashboards to show “5 critical, 12 high” without loading full insight bodies.

---

## 3b. Cron schedule and monitoring (P1-5)

- **Cron endpoint:** `POST /api/cron/analytics-aggregation`. Auth: `Bearer CRON_SECRET` or admin session. Query: `?force=true` for full re-aggregation.
- **Schedule:** Run daily (e.g. 02:00 UTC). In Vercel: add to `vercel.json` under `crons` or use external scheduler (e.g. cron-job.org) calling the endpoint with `CRON_SECRET`.
- **Job metadata:** Stored in `aggregation_jobs` collection. Fields: jobType, status, startedAt, completedAt, durationMs, recordsProcessed, recordsCreated, recordsUpdated, errors. Monitor for `status: 'failed'` and `errors.length > 0`; alert on consecutive failures.
- **Indexes:** `aggregation_logs` has `startTime`, `status`, `jobType + startTime` (see `scripts/setupAnalyticsIndexes.ts`). Use for "last 7 days of jobs" and failure count queries.

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
