# Partner Report and Delete Project Hotfix
Status: Active
Last Updated: 2026-03-06T00:00:00.000Z
Canonical: No
Owner: Engineering

## Scope
- SSOT issue [#345](https://github.com/moldovancsaba/mvp-factory-control/issues/345): partner report related-event cards must show Total Fans Engaged.
- SSOT issue [#346](https://github.com/moldovancsaba/mvp-factory-control/issues/346): production delete-project failure path.

## What Changed

### 1. Partner report related-event card fans now use Total Fans Engaged
**WHAT**: Related-event cards on partner reports now display the derived total fans value rather than undercounting legacy events that only store `indoor` and `outdoor`.

**WHY**: The production report cards could show only the remote-fans portion when historical events did not have a persisted `remoteFans` field. That made the card disagree with the report's intended Total Fans Engaged metric.

**HOW**:
- `app/api/partners/report/[slug]/route.ts` now enriches event stats with `addDerivedMetrics(...)` before returning partner report events.
- `app/partner-report/[slug]/PartnerEventsList.tsx` now renders card fans via a client-safe `getTotalFans(...)` helper:
  - use `stats.totalFans` when present
  - otherwise derive `remoteFans` from `remoteFans` or `indoor + outdoor`
  - then add `stadium`

## 2. Admin project deletion now uses the CSRF-safe client path
**WHAT**: Project delete actions now go through the shared `apiDelete(...)` client wrapper and surface the actual backend error when deletion fails.

**WHY**: One production delete path bypassed the CSRF-aware client and collapsed every failure into a generic `Failed to delete project` message, which made diagnosis impossible and could fail under production middleware.

**HOW**:
- `lib/adapters/projectsAdapter.tsx` replaced raw `fetch(..., { method: 'DELETE' })` with `apiDelete(...)`.
- `app/admin/events/ProjectsPageClient.tsx` now reports the actual returned error or thrown client error.

## Validation
- `npm run build`
- `npm run type-check`
- `npm run lint` (currently still required as a repo-wide gate; run status must be recorded on the SSOT card when executed)

## Files
- `app/api/partners/report/[slug]/route.ts`
- `app/partner-report/[slug]/PartnerEventsList.tsx`
- `lib/adapters/projectsAdapter.tsx`
- `app/admin/events/ProjectsPageClient.tsx`
