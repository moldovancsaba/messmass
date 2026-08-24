# Analytics API
Status: Active
Last Updated: 2026-08-14T15:00:00.000Z
Canonical: Yes
Owner: Backend

**Version:** 12.3.1

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

### Any-authenticated-role endpoints (AI Analytics)

The AI Analytics endpoints deliberately require a session but **no particular
role**. Their audience is report authors deciding which AI variables are
populated widely enough to build into a report, and that is not an admin-only
job. Do not add a role check to these without changing the product decision
behind it.

- `GET /api/analytics/ai/coverage`
- `GET /api/analytics/ai/events`
- `GET /api/analytics/ai/events/[eventId]/summary`
- `GET /api/analytics/ai/variables`

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

## AI Analytics Endpoints

Read model behind `/admin/analytics/ai`. All four are read-only aggregations over
existing collections — no new schema, and no runtime dependency on fanmass being
reachable. Implementation: `lib/aiAnalytics.ts` and `lib/aiAnalysisSummary.ts`.

An AI-owned variable is one whose name starts with `fanmass`. `isAiVariableName()`
in `lib/aiAnalytics.ts` is the single authority for that test; widen the definition
there rather than at call sites.

### `GET /api/analytics/ai/coverage`

Estate-level counts.

```json
{ "success": true, "data": {
  "totalEvents": 369, "connected": 155, "analyzing": 152,
  "complete": 3, "notConnected": 214, "stale": 0
} }
```

`stale` counts connected events whose analytics are older than
`STALE_AFTER_HOURS` (24). An event with **no** freshness stamp is deliberately
NOT stale: ~155 events were analysed before freshness was recorded, and flagging
all of them on day one would train operators to ignore the signal.

### `GET /api/analytics/ai/events`

Per-event status rows. Optional `status` and `limit` (default 200, max 500).

| Field | Meaning |
|---|---|
| `status` | `not_connected` \| `analyzing` \| `complete` \| `error` |
| `progressPercent` | Producer's own `fanmassStatus`, falling back to analysed/discovered |
| `imagesAnalyzed` / `imagesDiscovered` | Counts behind the progress figure |
| `sources` | `drive`, `camera`, or both — inferred from `drive_folder_links` |
| `lastAnalyzedAt` / `isStale` | Freshness stamp and its derived flag |
| `lastError` | Present only when a linked Drive folder is in `error` |

Status derivation (`deriveEventStatus`) must match the Drive folder badge already
shipped, or the same event reads differently in two places.

### `GET /api/analytics/ai/events/[eventId]/summary`

The stored structured analysis for one event — brand mentions, club/federation
mentions, merchandise, and demographic projections. `404` with a distinct code
when the event exists but has never received a summary push; that is not the same
as an invalid event id.

### `GET /api/analytics/ai/variables`

Every AI-owned variable with its fill rate across connected events, plus the
`formulaToken` to paste into a chart formula.

The result is the **union** of registered `variables_metadata` and keys actually
present on events. A key present on events but absent from metadata is exactly the
case a report author trips over, so it surfaces with `registered: false` rather
than being filtered out.

Fill rate is the number that decides whether a variable belongs in a template: the
merch variables sit at 1.3% (2 of 155 events), so a report built on one renders
empty almost everywhere. The same figure is surfaced inline in the chart-formula
picker; see `tests/ai-variable-hint.test.ts` for the hint's exact wording rules.

> Implementation note: these aggregations use `$group`, never `distinct()`. The
> Mongo client runs Stable API v1 with `strict: true`, and `distinct` is not part
> of that API — it fails with `APIStrictError`.

## Fanmass Ingest Endpoint

`POST /api/integrations/fanmass/events/[eventId]/analysis-summary`

Not an analytics read endpoint, but the producer side of the summary above.
Authenticated with the fanmass integration token (`requireFanmassIntegrationAuth`),
the same token as the stats push, and failure-isolated from it.

- **Contract gate:** `contractVersion` must start with
  `fanmass.messmass.analytics-summary.v1`. A same-major producer may add fields
  and they are stored untouched; a different major is rejected `409`, because
  silent storage would hand the report undefined behaviour.
- **Size gate:** `MAX_SUMMARY_BYTES` = 1MB, ~50x observed real size. The lists are
  producer-controlled, so the bound is not optional.
- **Latest wins:** one document per event in `ai_analysis_summaries`. The summary
  is a snapshot of the batch's current analysis, not an event log.
- **`receivedAt` is server-assigned**, never producer-supplied. `generatedAt` is
  the producer's own stamp and is informational only.

Stored as a document rather than stats keys on purpose: stats names are chart
variables with registration semantics, and twenty brand rows are not twenty
variables.

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
- `/admin/analytics/ai` and `/admin/analytics/ai/[eventId]`

## Related Docs

- `/Users/moldovancsaba/Projects/messmass/docs/admin/admin-end-user-guide.md`
- `/Users/moldovancsaba/Projects/messmass/docs/api/api-reference.md`
- `/Users/moldovancsaba/Projects/messmass/docs/features/features-bitly-integration-guide.md`
