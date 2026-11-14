# Analytics API
Status: Active
Last Updated: 2026-10-20T16:53:00.000Z
Canonical: Yes
Owner: Backend

**Version:** 12.3.47

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

### Admin endpoints (AI Analytics)

AI Analytics contains event-level views mechanically derived from stored
per-photo Fanmass results. All reads require an administrator session.
For Camera photo analysis, Fanmass does not read Messmass reports or event
metadata. Each result carries the exact Camera partner/event/photo IDs and
linked Messmass event ID; this API validates those links and stores one
photo-level result. Messmass is the only owner of event report aggregation.

- `GET /api/analytics/ai/events`
- `GET /api/analytics/ai/events/[eventId]/summary`
- `GET /api/analytics/ai/events/[eventId]/photos`

The former coverage and variable-catalogue endpoints return `410 Gone`; they
reported event completion or fill-rate concepts that the photo-result contract
cannot establish.

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

`/admin/analytics/ai` and its APIs are now based only on active, completed rows in
`fanmass_camera_photo_analyses`. The page reports event groups and sums of photo
results, person/face boxes, and observed labels. It does not infer event progress,
freshness, complete coverage, or audience reach because Messmass does not hold
Camera's eligible-photo denominator.

### `GET /api/analytics/ai/events`

Returns events that have at least one active photo result, plus totals summed from
those same result rows. `limit` is clamped to 1–500. Each event includes
`photoResultsReceived`, photo-level detections, bounding-box counts, observed
brand/club/merchandise detections, completed moderation-check and flagged-photo
counts, and the last photo analysis timestamp.

### `GET /api/analytics/ai/events/[eventId]/summary`

Returns Messmass's derived roll-up only when its source is the current
`camera_photo_pipeline`. The roll-up includes received results, people and
boxes, brand/club/merchandise labels, brand-appearance item types, and the
moderation check count, flagged-photo count, severity and prohibited-content
category counts. Old producer event summaries are not read.

### `GET /api/analytics/ai/events/[eventId]/photos`

Returns up to 100 per-photo rows by offset, including the identity-free result
summary, per-photo prohibited-content outcome, and saved image-relative
person/face boxes. `limit` and `offset` support pagination so large events do
not load every box into a single response.

### Retired endpoints

`GET /api/analytics/ai/coverage` returns `410 EVENT_COVERAGE_UNAVAILABLE`, because
the result set does not contain the eligible Camera photo denominator.
`GET /api/analytics/ai/variables` returns `410 AI_VARIABLE_FILL_RATES_RETIRED`;
the former cross-event fill rates mixed obsolete batch data with per-photo data.
The chart variable picker no longer shows those misleading hints.

> Implementation note: aggregations use `$group`, not `distinct()`. Mongo's
> Stable API v1 strict mode does not support `distinct()`.

## Fanmass photo result boundary

`POST` and `DELETE /api/integrations/fanmass/events/[eventId]/photos/[photoId]`
are the only Fanmass analytics write operations. Fanmass independently reads
Camera Atlas, chooses one eligible photo, analyzes that photo locally, then
sends one identity-free result containing the Messmass event ID and Camera
partner/event/photo IDs, source revision, generation, normalized findings, and
image-relative person/face boxes. Fanmass sends no image bytes, image URL,
guest identity, event report, event status, audience projection, or dashboard
snapshot.

Messmass stores one current row per `(Messmass event ID, Camera photo ID)` in
`fanmass_camera_photo_analyses`. Repeated deliveries are idempotent and stale
source revisions cannot replace newer results. A deletion writes a permanent
tombstone for that exact event/photo key; no later result generation can
recreate it. Messmass then regenerates the event roll-up without that photo.
Both report
totals and the AI Analytics page are derived from active, completed per-photo
rows. The page shows how many results Messmass received, the detections and
boxes in those rows, completed moderation checks and flagged outcomes, and the
saved box coordinates per photo. Zero moderation category counts mean no such
flags were returned among completed checks; unreturned categories remain
distinct from a completed negative check.

The contract has no event photo denominator, completion percentage, stale
status, or projected audience. Messmass does not own Camera's eligible-photo
denominator, and photo-level people detections are not unique attendees.

SSO has a separate, exact-reference privacy boundary:
`DELETE /api/integrations/privacy/erase-camera-photo` accepts only
`request_id`, `camera_partner_id`, `camera_event_id`, and `camera_photo_id`,
authenticated with `X-SSO-Privacy-Secret` using the dedicated
`MESSMASS_PRIVACY_ERASURE_SECRET`. Messmass resolves its own event id through
the exact Camera event and partner links; missing or duplicate event links fail
closed. The endpoint writes an irreversible tombstone even when no analysis row
exists and rebuilds the event roll-up. It never accepts identity, image URLs,
or a client-selected Messmass event id. Missing credentials fail closed.

Event-level `/analysis-summary`, `/stats`, `/sync`, callback, and
`/dashboard-snapshot` writes are retired and return HTTP 410. The former
`fanmass.messmass.analytics-summary.v1` and dashboard-snapshot contracts are
historical only; they must not be used for Camera photo analytics.

## SZRT brand proof samples

The SZRT report shows no brand or club figure without a sample behind it. This is a separate boundary from the
Camera photo results above and applies to the SZRT campaign's own picture library only.

`POST /api/integrations/fanmass/szrt-evidence` (`requireFanmassIntegrationAuth`) receives
`{ pipeline, samples: [{ fileKey, sport, analyzedAt, region, crop }] }` with at most 40 samples. `region` is one brand
region of the Fanmass analysis (`regionId`, `shortName`, `visibleText`, `itemType`, `confidence`, `bbox`, and
`evidence` with `tier`, `method`, `match`, `ocrText`, `ocrConfidence`, `entityKind`, `onPerson`); `crop` is a base64
JPEG or PNG of at most 1.5 MB. Fanmass pixelates every face before cutting the crop and sends no full photo.
Messmass stores the crop in R2 under its SHA-256 (`szrt-evidence/`) and upserts one row per
`(fileKey, regionId)` in `szrt_brand_evidence`. The answer lists every sample it skipped with a reason
(`placeholder_name`, `invalid_box`, `text_read_without_text`, `invalid_crop_image`, `media_storage_failed`, ...); a
broken envelope is `400`, more than 40 samples `413`, and a missing R2 configuration `503`
`MEDIA_STORAGE_NOT_CONFIGURED`.

`GET /api/interactive-report/brand-evidence?kind=brand|club&name=...` (public, SZRT tenant only) returns up to 12
samples, strongest first and at most one per photo, plus how many photos prove the name and how many only had a
model suggestion. It returns nothing until a person set `publishApproved: true` on the SZRT vision document, like the
rest of the SZRT vision data. A sample with tier `model_identified` is counted but never returned as proof, and no
response carries a file name or path.

`POST /api/integrations/fanmass/szrt-progress` (`requireFanmassIntegrationAuth`) receives the report's audience, brand
and club figures from the same deep rerun: `{ pipeline, totalImages, processedCount, status, currentSport,
lastUpdated, optIn?: { images, total, basis: 'local_drive_policy' }, aggregates: { totalPeople, genders, ageGroups, topBrands, topClubs, topEmotions, sportsBreakdown } }`.
The optional `optIn` says how many of the images Fanmass holds have a recorded opt-in (an image reaches the local drive only with one); it is stored on the progress document and shown in the report's Fanmass section, and an older Fanmass that sends none leaves the stored value as it was.
Fanmass sends the whole picture each time; Messmass validates it (whole non-negative counts, a processed count not
above the total, sport names and list lengths bounded), derives every share from the counts, and replaces the stored
figures in `szrt_vision_progress` (`_id: szrt_progress`). It clears the old per-image text and model-guess lists and
never writes `publishApproved`: a new document starts unapproved and an existing approval is left as it is. A brand
or club is counted only where its name was read from the picture, once per photo; there are no default values, so an
unmeasured figure stays zero or empty.

`POST /api/integrations/fanmass/szrt-publish` (`requireFanmassIntegrationAuth`) is the only writer of the publication
switch (`publishApproved` on `szrt_progress`). Body `{ approved: boolean, approvedBy: string, note? }`; it records who
decided and when (`publishApprovedBy`, `publishApprovedAt`, `publishApprovalNote`), drops the cached SZRT report
snapshots so the change shows at once, and answers `409 NO_FIGURES_DELIVERED` when asked to publish before the deep
rerun delivered figures, so the retired worker's numbers can never become visible. Withdrawing (`approved: false`) is
always accepted.

`GET /api/interactive-report/partner-selfies` serves the partner record's own details and no analysed selfie: it no
longer reads `szrt_vision_analysis` (the retired worker's per-image brand lists and scene text). Remove that data with
`scripts/purge-szrt-legacy-vision.ts` (dry run by default; `--apply` backs both legacy collections up to `backups/`
before deleting).

### Global evidence library and its human review

The proof behind every brand and club figure Fanmass produces lives in one global library (`fanmass_evidence`), for any
project or event: each sample carries an `origin` (`szrt` for the SZRT campaign, later a Camera event or anything else
Fanmass analyses). A report reads only its own origin (the SZRT report reads `szrt`).

- `POST /api/integrations/fanmass/evidence` (`requireFanmassIntegrationAuth`) receives the samples (see the SZRT section
  above for the sample shape) with an `origin`; the old `POST /api/integrations/fanmass/szrt-evidence` is the same handler
  and a sender that names no origin is `szrt`. Its optional `replaceFiles` (file keys of that origin, at most 200) first
  removes what Fanmass delivered earlier for those pictures, never a reviewed row or one a person added; an empty `samples`
  list is accepted with `replaceFiles`, to withdraw a proof that no longer holds. A reviewed row is never overwritten
  (`skipped` reason `human_reviewed`).
- Review is optional, being able to is not: `GET /api/admin/fanmass-evidence?status=needs_review|confirmed|rejected|corrected|human|all&kind&name&origin&limit&offset`
  (admin session, page `/admin/fanmass-evidence`) lists samples of any origin, weakest unreviewed proof first.
  `POST /api/admin/fanmass-evidence` adds a sample a person made: `{ name, kind, crop (base64 JPEG or PNG, up to 1.5 MB),
  origin?, sport?, readText?, note?, box? }`; it is stored in R2 and counts as proof (`tier: human`, `source: human`).
  `PATCH /api/admin/fanmass-evidence/[id]` with `{ action: confirm | reject | correct | restore, name?, kind?, note? }`
  stores `review: { status, by, at, note }` (a correction keeps the original name and kind; `restore` puts them back).
  `DELETE /api/admin/fanmass-evidence/[id]` deletes only a sample a person added: an automatic one answers
  `409 AUTOMATIC_EVIDENCE_CANNOT_BE_DELETED` and must be rejected, so a delivery cannot bring it back.
- A rejected sample is never returned as proof; a confirmed, corrected or person-added one is proof, marked as checked by a person.
- The decisions feed the figures: `GET /api/integrations/fanmass/evidence-reviews[?origin=]` returns every decision and every
  added sample (`id, origin, fileKey, regionId, source, status, name, kind`); Fanmass applies them when it counts (rejected is
  not counted, corrected is counted under its corrected name and kind, an added sample counts once).
- And they train the system: `GET /api/integrations/fanmass/evidence-training` returns rules from every decision, for every
  origin: `deny` (this exact text is not that name: rejected samples, the original of a corrected one) and `alias` (this
  exact text is that name: corrected, confirmed and person-added samples). `text` is the text folded to lowercase letters and
  digits. Fanmass applies both to every later analysis and re-judges results already made.
- `POST /api/integrations/fanmass/szrt-progress` drops the cached SZRT reports after storing, so the brand and club lists
  show new figures at once instead of within the hour.

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

## Unified hashtag report

`GET /api/hashtag-report/{hashtag}` returns the unified hashtag report for any hashtag (with or without the leading `#`):
`{ success, scope: { type: 'hashtag', id }, generatedAt, measured: { events, photos, counters }, calculated, coverage }`.
`measured` holds only what machines wrote (the per-photo Fanmass rollups of the hashtag's events and the `camera_*` counters Camera
writes); `calculated` holds Messmass calculations over it, each with `value`, `numerator`, `denominator` and `basis` (`value` is
null when the counts cannot give a real share); no manually entered number is read. Public unless the hashtag has a page password
(then 401 `PAGE_PASSWORD_REQUIRED`, like the other hashtag reports). The first call for a large hashtag may take several seconds
(`maxDuration` 60).
