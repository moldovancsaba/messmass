# Bitly Integration Guide
Status: Active
Last Updated: 2026-05-20
Canonical: Yes
Owner: Product

**Version:** 12.1.12  
**Primary admin surface:** `/admin/bitly`

## Purpose

This document describes the current `{messmass}` Bitly system: how Bitly links are stored, how they connect to projects and partners, which admin actions exist, and which APIs back the workflow.

## What The Current System Does

The live Bitly system supports:

- importing Bitly links from the configured Bitly group
- associating one Bitly link with multiple projects
- associating Bitly links with partners
- recalculating cached project-level attribution when associations change
- refreshing analytics on demand or through scheduled sync
- exposing project-level cached metrics to reports and analytics

## Canonical Admin Workflow

Use `/admin/bitly` for all admin Bitly work.

Main jobs on that page:

- search links by bitlink, long URL, or title
- filter favorites
- import links from Bitly
- attach links to projects
- attach links to partners
- refresh analytics for a link or for the broader link set
- review link analytics and association coverage

## Data Model

### `bitly_links`

Stores the link itself plus cached analytics pulled from Bitly.

Representative fields:

- `bitlink`
- `long_url`
- `title`
- `tags`
- `favorite`
- `archived`
- `click_summary`
- `clicks_timeseries`
- `geo.countries`
- `referrers`
- `referring_domains`
- `lastSyncAt`
- `lastClicksSyncedUntil`

### `bitly_project_links`

Junction collection for many-to-many project attribution.

Representative fields:

- `bitlyLinkId`
- `projectId`
- `startDate`
- `endDate`
- `autoCalculated`
- `cachedMetrics`
- `lastSyncedAt`

### `partners.bitlyLinkIds`

Partner-side reverse association list used by partner and Bitly workflows.

## Association Model

### Project associations

Links are connected to projects through `bitly_project_links`, not by a single `projectId` on the link.

This enables:

- one link used across multiple events
- one event using multiple links
- cached project-specific metrics for reports and analytics

### Partner associations

Links can also be attached to partners. This is managed from the Bitly admin surface and stored on the partner record via `bitlyLinkIds`.

## Analytics and Attribution

Project-level attribution is based on cached association metrics, not a naive total-link click count.

The current system supports:

- project-level cached click totals
- unique clicks
- top countries
- top referrers
- browser/device breakdowns
- daily click series

The recalculation workflow is responsible for keeping these association-level caches aligned after project-link changes.

## Current API Surface

All routes below are current code paths.

### Link management

- `GET /api/bitly/links`
  - admin-only
  - supports `search`, `projectId`, `includeAnalytics`, `includeUnassigned`, `favorite`, `limit`, `offset`, `sortField`, `sortOrder`
- `POST /api/bitly/links`
  - admin-only
  - body: `{ projectId?, bitlinkOrLongUrl, title?, tags? }`
  - imports or associates a Bitly link
- `PUT /api/bitly/links/[linkId]`
  - admin-only
  - updates title, tags, favorite, archived state, or legacy `projectId` metadata
- `DELETE /api/bitly/links/[linkId]`
  - admin-only
  - soft-archives by default
  - supports `?hard=true` for permanent delete

### Project associations

- `DELETE /api/bitly/associations`
  - admin-only
  - query: `bitlyLinkId`, `projectId`
  - removes a project-link association

### Partner associations

- `POST /api/bitly/partners/associate`
  - admin-only
  - body: `{ bitlyLinkId, partnerId }`
- `DELETE /api/bitly/partners/associate`
  - admin-only
  - query: `bitlyLinkId`, `partnerId`

### Import and sync

- `POST /api/bitly/pull`
  - admin-only
  - body: `{ limit? }`
  - imports links from the configured Bitly group
- `POST /api/bitly/sync`
  - admin-only for manual runs, or cron via `CRON_SECRET`
  - body: `{ linkIds?: string[] }`
  - refreshes cached analytics
- `POST /api/bitly/recalculate`
  - body: `{ mode: 'bitlink' | 'project' | 'all', bitlyLinkId?, projectId? }`
  - refreshes project attribution caches
- `GET /api/bitly/recalculate`
  - lightweight status endpoint

### Read APIs for reports and admin drilldowns

- `GET /api/bitly/analytics/[linkId]`
  - admin-only
  - supports `?refresh=true`
  - returns cached or freshly pulled analytics for one link
- `GET /api/bitly/project-metrics/[projectId]`
  - returns cached project-level Bitly metrics aggregated from current associations

## Sync Modes

### Manual sync

Admins can trigger sync from the Bitly UI or refresh a single link through the analytics endpoint.

### Scheduled sync

`POST /api/bitly/sync` also supports cron-style execution through `Authorization: Bearer <CRON_SECRET>`.

## Operational Notes

- imported links may be unassigned at first; that is expected
- partner association success should clear stale UI error state before showing success
- project-partner workflows and partner defaults can indirectly affect which links matter operationally, but Bitly link association is still managed explicitly from the Bitly/admin system

## Environment Requirements

Current Bitly integration depends on:

- `BITLY_ACCESS_TOKEN`
- `BITLY_GROUP_GUID`

Other environment variables may exist in deployment, but these are the core runtime requirements visible from the current integration flow.

## Common Troubleshooting

### Links are not appearing after import

Check:

- admin auth
- `BITLY_GROUP_GUID`
- whether the links already exist in `bitly_links`

### Project metrics look wrong

Run recalculation through `POST /api/bitly/recalculate` using the right mode, then re-check `/api/bitly/project-metrics/[projectId]`.

### Link analytics are stale

Use `/api/bitly/analytics/[linkId]?refresh=true` or run manual sync.

### Partner association looks successful but the page still shows an error

This was a recent UI regression area. Use the current `main` branch or release `v12.1.12+`, where stale error clearing was fixed on the Bitly admin page.

## Related Docs

- `/Users/moldovancsaba/Projects/messmass/docs/features/features-partners-system-guide.md`
- `/Users/moldovancsaba/Projects/messmass/docs/api/api-analytics.md`
- `/Users/moldovancsaba/Projects/messmass/docs/admin/admin-end-user-guide.md`
