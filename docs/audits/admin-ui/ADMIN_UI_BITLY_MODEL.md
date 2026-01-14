# Admin UI Bitly Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define the Bitly link data model and ownership boundaries.
- [x] Document the Admin-managed collections used for Bitly analytics.
- [x] Capture known inconsistencies and duplication points (C-08).

2 Ownership Scope and Permissions
| Entity | Ownership scope | Admin surface | Permissions | Evidence |
| --- | --- | --- | --- | --- |
| [x] bitly_links | Global | /admin/bitly | Admin (getAdminUser) | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |
| [x] bitly_project_links | Event | /admin/bitly, /admin/events | Admin (getAdminUser for mutations) | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts) |
| [x] partners.bitlyLinkIds | Partner | /admin/bitly, /admin/partners | Admin (getAdminUser) | [app/api/bitly/partners/associate/route.ts](app/api/bitly/partners/associate/route.ts), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [lib/partner.types.ts](lib/partner.types.ts) |

3 Bitly Link Document (bitly_links)
| Field | Required | Description | Evidence |
| --- | --- | --- | --- |
| [x] bitlink | Yes | Normalized short link (e.g., bit.ly/abc123). | [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts), [lib/bitly-db.types.ts](lib/bitly-db.types.ts) |
| [x] long_url | Yes | Destination URL for the short link. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |
| [x] title | Yes | Display title (Bitly or custom). | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |
| [x] tags | No | Optional tags synced from Bitly or provided by Admin. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |
| [x] click_summary | Yes | Snapshot metrics (total, unique, updatedAt). | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] clicks_timeseries | Yes | Daily click series (last 365 days). | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] geo.countries | Yes | Country click distribution. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] referrers | Yes | Top referrers by clicks. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] referring_domains | Yes | Referring domains by clicks. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] lastSyncAt | Yes | Last Bitly sync timestamp. | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts) |
| [x] favorite | No | Admin favorite flag. | [app/api/bitly/links/[linkId]/route.ts](app/api/bitly/links/[linkId]/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx) |
| [x] archived | No | Soft delete flag (hidden from active lists). | [app/api/bitly/links/[linkId]/route.ts](app/api/bitly/links/[linkId]/route.ts) |
| [x] createdAt/updatedAt | Yes | Audit timestamps (ISO 8601). | [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts) |

4 Bitly Project Link Junction (bitly_project_links)
| Field | Required | Description | Evidence |
| --- | --- | --- | --- |
| [x] bitlyLinkId | Yes | Reference to bitly_links._id. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts) |
| [x] projectId | Yes | Reference to projects._id. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts) |
| [x] startDate/endDate | No | Date range boundaries for attribution (nullable). | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts) |
| [x] autoCalculated | Yes | True when date ranges are computed automatically. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts) |
| [x] cachedMetrics | Yes | Aggregated metrics for the project-link period. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts) |
| [x] lastSyncedAt | No | Timestamp when cached metrics were refreshed. | [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/recalculate/route.ts](app/api/bitly/recalculate/route.ts) |

5 Partner Bitly Association (partners.bitlyLinkIds)
- [x] Partners store Bitly link associations as bitlyLinkIds (ObjectId[]). Evidence: [lib/partner.types.ts](lib/partner.types.ts).
- [x] Bitly page writes partner associations through /api/bitly/partners/associate. Evidence: [app/api/bitly/partners/associate/route.ts](app/api/bitly/partners/associate/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).

6 Inputs and Sync Sources
- [x] Bulk import from Bitly group via /api/bitly/pull. Evidence: [app/api/bitly/pull/route.ts](app/api/bitly/pull/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [x] Daily/manual analytics sync via /api/bitly/sync (cron + admin button). Evidence: [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [x] Cached metric refresh for associations via /api/bitly/recalculate. Evidence: [app/api/bitly/recalculate/route.ts](app/api/bitly/recalculate/route.ts), [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).

7 Outputs and Downstream Dependencies
- [x] Project-level Bitly metrics are exposed via /api/bitly/project-metrics/[projectId]. Evidence: [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts), [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx).
- [x] Bitly stats enrich project.stats fields used by KYC variables. Evidence: [lib/bitlyStatsEnricher.ts](lib/bitlyStatsEnricher.ts), [docs/conventions/VARIABLE_DICTIONARY.md](docs/conventions/VARIABLE_DICTIONARY.md).

8 Known Inconsistencies and Gaps
- [x] Legacy projectId field exists on bitly_links, but current association flow uses bitly_project_links. Evidence: [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).
- [x] bitly-db.types.ts describes many-to-one, but code uses many-to-many junction table. Evidence: [lib/bitly-db.types.ts](lib/bitly-db.types.ts), [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts).
- [x] /admin/partners UI allows Bitly selection, but partners API does not accept bitlyLinkIds in create/update payloads. Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/api/partners/route.ts](app/api/partners/route.ts).
- [x] /api/bitly/project-metrics has no admin auth guard. Evidence: [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts).

9 Duplicate Association Flows (C-08)
- [x] Partner association is exposed in both /admin/bitly and /admin/partners. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [ACTION_PLAN.md](ACTION_PLAN.md).

10 Connected Dependencies
- [x] Bitly variables are categorized under KYC Variable Dictionary (Bitly metrics). Evidence: [docs/conventions/VARIABLE_DICTIONARY.md](docs/conventions/VARIABLE_DICTIONARY.md).
- [x] Route protection requires admin for /admin/bitly. Evidence: [lib/routeProtection.ts](lib/routeProtection.ts).