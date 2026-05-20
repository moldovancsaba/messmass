# Analytics API
Status: Active
Last Updated: 2026-05-20
Canonical: Yes
Owner: Backend

**Version:** 12.1.12

## Purpose

This document covers the current analytics read APIs that power the `{messmass}` analytics workspace, sponsorship surfaces, and external-style compare endpoints.

## Access Model

There are two access patterns in the current code:

- admin-session required
- rate-limited read endpoints without the same admin-session requirement

### Admin-auth endpoints

- `GET /api/analytics/aggregates`
- `GET /api/analytics/aggregates/partners`
- `GET /api/analytics/insights/summary`
- `GET /api/analytics/sponsorship-hub`

### Rate-limited compare/trend endpoints

- `GET /api/analytics/compare`
- `GET /api/analytics/compare/partners`
- `GET /api/analytics/compare/periods`
- `GET /api/analytics/trends`

These compare/trend routes use read-rate limiting and return `429` when throttled.

## Core Endpoints

### `GET /api/analytics/aggregates`

Time-bucketed aggregate metrics from `analytics_aggregates`.

Query parameters:

- `bucket` — `daily`, `weekly`, `monthly`, or `yearly`
- `startDate`
- `endDate`
- `partnerId`
- `partnerIds` — comma-separated
- `hashtag`
- `year`
- `month`
- `limit` — default `100`, max `1000`
- `offset`
- `sortBy` — `date`, `attendance`, `engagement`, `merchandise`
- `sortOrder` — `asc` or `desc`

Response shape:

```json
{
  "data": [],
  "metadata": {
    "totalRecords": 0,
    "returnedRecords": 0,
    "hasMore": false,
    "aggregatedAt": "2026-05-20T10:00:00.000Z",
    "queryTimeMs": 42
  }
}
```

### `GET /api/analytics/aggregates/partners`

Partner-level analytics rollups from `partner_analytics`.

Query parameters:

- `partnerId`
- `limit` — default `100`, max `1000`
- `offset`
- `sortBy` — `name`, `totalEvents`, `totalAttendees`, `avgAttendees`
- `sortOrder` — `asc` or `desc`

### `GET /api/analytics/sponsorship-hub`

Primary server endpoint for the Sponsorship Hub and related activation surfaces.

Query parameters:

- `scopeType` — `portfolio`, `partner`, `organization`, `project`
- `scopeId` — required for all non-portfolio scopes
- `rangePreset` — `all`, `30d`, `90d`, `365d`

Response pattern:

```json
{
  "success": true,
  "data": {}
}
```

This route currently powers:

- sponsorship rollups
- scope summaries
- partner/project breakdowns
- partner activation and proof-of-performance data dependencies

## Compare Endpoints

### `GET /api/analytics/compare`

Compares 2 to 5 projects.

Query parameters:

- `projectIds` — required, comma-separated, 2 to 5 IDs
- `metrics` — optional, comma-separated

Default metrics when omitted:

- `fans`
- `merch`
- `adValue`
- `engagement`
- `penetration`

Response shape:

```json
{
  "success": true,
  "data": {
    "metrics": [],
    "events": [],
    "rankings": {},
    "deltas": []
  },
  "timestamp": "2026-05-20T10:00:00.000Z"
}
```

### `GET /api/analytics/compare/partners`

Compares 2 to 5 partners.

Query parameters:

- `partnerIds` — required, comma-separated, 2 to 5 IDs
- `metrics` — optional

Current default metrics:

- `totalAttendees`
- `totalEvents`
- `avgMerchandiseRate`
- `totalBitlyClicks`

### `GET /api/analytics/compare/periods`

Compares two time periods.

Query parameters:

- `periodA` — required
- `periodB` — required
- `bucket` — `daily`, `weekly`, `monthly`, `yearly`, default `monthly`
- `partnerId` — optional

Supported period examples in current implementation:

- `2026-01`
- `2026`
- `2026-01-15`

## Trends And Insights

### `GET /api/analytics/trends`

Returns time-series analytics points.

Query parameters:

- `startDate` — required
- `endDate` — required
- `partnerId` — optional
- `metrics` — optional
- `groupBy` — `day`, `week`, or `month`

Current default metrics:

- `fans`
- `merch`
- `adValue`
- `engagement`

### `GET /api/analytics/insights/summary`

Returns lightweight counts for dashboard surfaces.

Query parameters:

- `partnerId` — optional
- `period` — `7d`, `30d`, `90d`, default `30d`
- `maxEvents` — default `50`, max `100`

Response shape:

```json
{
  "success": true,
  "data": {
    "totalInsights": 0,
    "criticalCount": 0,
    "highCount": 0,
    "mediumCount": 0,
    "lowCount": 0,
    "byCategory": {},
    "eventsAnalyzed": 0,
    "period": "30d",
    "partnerId": null
  },
  "metadata": {
    "queryTimeMs": 40
  },
  "timestamp": "2026-05-20T10:00:00.000Z"
}
```

## Related Analytics Routes

These are active in code but are not the main focus of this document:

- `GET /api/analytics/insights`
- `GET /api/analytics/insights/[projectId]`
- `GET /api/analytics/insights/partners/[partnerId]`
- `GET /api/analytics/executive/insights`
- `GET /api/analytics/executive/metrics`
- `GET /api/analytics/executive/top-events`
- `GET /api/analytics/partner/[partnerId]`
- `GET /api/analytics/event/[projectId]`
- `GET /api/analytics/benchmarks`

## Common Failure Modes

- `401` on admin endpoints when no valid admin session exists
- `400` for missing required IDs, invalid ID formats, or invalid date ranges
- `404` when requested analytics documents are missing for a compared entity set
- `429` on compare/trend endpoints when rate-limited
- `500` for internal analytics calculation or database failures

## Product Context

These APIs back the current analytics workspace model:

- `/admin/analytics`
- `/admin/analytics/sponsorship`
- `/admin/analytics/sponsorship/activation`
- `/admin/analytics/executive`
- `/admin/analytics/marketing`
- `/admin/analytics/operations`
- `/admin/analytics/insights`

## Related Docs

- `/Users/moldovancsaba/Projects/messmass/docs/admin/admin-end-user-guide.md`
- `/Users/moldovancsaba/Projects/messmass/docs/api/api-reference.md`
- `/Users/moldovancsaba/Projects/messmass/docs/features/features-bitly-integration-guide.md`
