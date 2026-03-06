# Admin Total Fans + Partner Card Edit Hotfix
Status: Active
Last Updated: 2026-03-06T00:00:00.000Z
Canonical: No
Owner: Engineering

## Scope
- SSOT bug `#349`: use stored `[totalFans]` consistently across admin event surfaces.
- SSOT bug `#348`: fix partner admin card-view report-edit action so it matches the working list-view path.

## Root Cause

### Admin Total Fans divergence
- Several admin surfaces were recomputing fans from `indoor + outdoor + stadium` or `remoteFans + stadium`.
- Production data already stores `stats.totalFans`, and some events keep authoritative values there that do not match those fallback calculations.
- Sorting in `/api/projects` was also using recomputed fan totals, so the displayed value and sort order could drift from the event's stored truth.

### Partner card-view report-edit failure
- Partner list view and card view were not actually aligned.
- List-view partner report-edit used `_id || viewSlug`.
- Card-view partner report-edit still required `viewSlug`, so partners without a valid `viewSlug` failed only in card view.

## Fix

### Canonical Total Fans helper
- Added `getStoredOrDerivedTotalFans(...)` in `lib/projectStatsUtils.ts`.
- Behavior:
  - prefer stored `stats.totalFans`
  - accept numeric strings
  - only derive from legacy fields when `totalFans` is genuinely absent

### Admin surfaces aligned to stored `totalFans`
- `lib/adapters/projectsAdapter.tsx`
- `app/admin/events/ProjectsPageClient.tsx`
- `app/admin/dashboard/page.tsx`
- `app/admin/filter/page.tsx`
- `app/api/projects/route.ts`

### Partner card-view edit/report-editor alignment
- `lib/adapters/partnersAdapter.tsx`
- `app/admin/partners/page.tsx`

## What To Verify
- `/admin/events`
  - list view shows stored `totalFans`
  - card view shows stored `totalFans`
  - sort by `Total Fans` follows stored `totalFans`
- `/admin/dashboard`
  - aggregate and recent-event fans reflect stored `totalFans`
- `/admin/filter`
  - event total fans reflects stored `totalFans`
- `/admin/partners`
  - card-view `Edit Stats` opens `/partner-edit/[id]`
  - list-view `Edit Stats` still works

## Validation
- Pending final command evidence in the release entry for `v11.60.2`.
