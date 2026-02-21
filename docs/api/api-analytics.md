# Analytics API (Aggregates & Compare)
Status: Active
Last Updated: 2026-02-21
Canonical: No
Owner: Backend

**Version:** 11.55.1  
**OPS-ANALYTICS-01 Phase 1** — Contract for pre-aggregated analytics and comparison endpoints.

---

## Overview

- **Performance target:** &lt;500ms for 1-year datasets (aggregates); &lt;300ms for event compare.
- **Auth:** Admin session required for `/api/analytics/aggregates` and `/api/analytics/aggregates/partners`. Compare endpoints use rate limiting (see [api-public.md](api-public.md) for bearer token).
- **Rate limits:** Read operations — 100 requests/minute per client (same as READ in api-public).

---

## Aggregates

### GET /api/analytics/aggregates

Time-bucketed metrics. **Auth:** Admin.

| Param      | Type   | Description |
|-----------|--------|-------------|
| bucket    | string | `daily` \| `weekly` \| `monthly` \| `yearly` |
| startDate | string | ISO 8601 date (e.g. `2025-01-01`) |
| endDate   | string | ISO 8601 date |
| partnerId | string | Filter by partner ID |
| partnerIds| string | Comma-separated partner IDs |
| hashtag   | string | Filter by hashtag |
| year      | number | Filter by year |
| month     | number | 1–12 |
| limit     | number | Default 100, max 1000 |
| offset    | number | Pagination |
| sortBy    | string | `date` \| `attendance` \| `engagement` \| `merchandise` |
| sortOrder | string | `asc` \| `desc` |

**Response:** `{ data: TimeAggregatedMetrics[], metadata: { totalRecords, returnedRecords, hasMore, nextOffset, aggregatedAt, queryTimeMs } }`

### GET /api/analytics/aggregates/partners

Partner-level aggregates. **Auth:** Admin.

| Param     | Type   | Description |
|-----------|--------|-------------|
| partnerId | string | Filter by partner |
| limit     | number | Default 100, max 1000 |
| offset    | number | Pagination |
| sortBy    | string | `name` \| `totalEvents` \| `totalAttendees` \| `avgAttendees` |
| sortOrder | string | `asc` \| `desc` |

**Response:** `{ data: PartnerAnalytics[], metadata: { totalPartners, returnedRecords, hasMore, nextOffset, aggregatedAt, queryTimeMs } }`

---

## Compare

### GET /api/analytics/compare

Event-to-event comparison (2–5 projects).

| Param      | Type   | Description |
|-----------|--------|-------------|
| projectIds| string | **Required.** Comma-separated project IDs (2–5) |
| metrics   | string | Optional. Comma-separated: `fans`, `merch`, `adValue`, `engagement`, `penetration` |

**Response:** `{ success, data: { metrics, events, rankings, deltas }, timestamp }`

### GET /api/analytics/compare/partners

Partner-to-partner comparison (2–5 partners). **Added:** OPS-ANALYTICS-01 P1-2.

| Param      | Type   | Description |
|-----------|--------|-------------|
| partnerIds| string | **Required.** Comma-separated partner IDs (2–5) |
| metrics   | string | Optional. Default: totalAttendees, totalEvents, avgMerchandiseRate, totalBitlyClicks |

**Response:** `{ success, data: { partners, metrics, rankings, deltas }, metadata: { queryTimeMs }, timestamp }`

### GET /api/analytics/compare/periods

Period-to-period comparison. **Added:** OPS-ANALYTICS-01 P1-3.

| Param     | Type   | Description |
|-----------|--------|-------------|
| periodA   | string | **Required.** Start of period A (e.g. `2025-01` or `2025-01-15`) |
| periodB   | string | **Required.** Start of period B (same format) |
| bucket    | string | `daily` \| `weekly` \| `monthly` \| `yearly` (default: monthly) |
| partnerId | string | Optional partner filter |

**Response:** `{ success, data: { periodA: { label, range, metrics, recordCount }, periodB: { ... }, deltas, bucket, partnerId }, metadata: { queryTimeMs }, timestamp }`

---

## Types (reference)

- **TimeAggregatedMetrics:** bucket, periodStart, periodEnd, partnerId, eventCount, totalAttendees, avgAttendees, totalImages, totalFans, totalMerchedFans, merchandiseRate, totalBitlyClicks, demographics, lastAggregatedAt, etc. See `lib/analytics-aggregates.types.ts`.
- **PartnerAnalytics:** partnerId, partnerName, totalEvents, totalAttendees, avgAttendeesPerEvent, totalBitlyClicks, attendanceTrend, etc.

---

## Cron (aggregation job)

- **Endpoint:** `POST /api/cron/analytics-aggregation`
- **Auth:** `Authorization: Bearer <CRON_SECRET>` or admin session.
- **Query:** `?force=true` to force full re-aggregation.
- **Schedule:** Run daily (e.g. 02:00 UTC). Configure in Vercel Cron or equivalent. See [ops-analytics-01-design.md](../operations/ops-analytics-01-design.md) P1-5.
