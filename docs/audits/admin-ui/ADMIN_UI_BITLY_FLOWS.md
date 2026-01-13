# Admin UI Bitly Flows
Status: Draft
Last Updated: 2026-01-13T15:51:35.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Map Admin Bitly association flows for partners and events.
- [ ] Identify duplicate entry points (C-08) and declare canonical flow.
- [ ] Provide execution-ready steps for association, sync, and removal.

2 Canonical Flow Declaration (C-08)
- [ ] Canonical association surface: /admin/bitly for link-to-project and link-to-partner management. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [ACTION_PLAN.md](ACTION_PLAN.md).
- [ ] /admin/partners Bitly selector is a duplicate entry point and should be treated as read-only for association changes. Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [ACTION_PLAN.md](ACTION_PLAN.md).

3 Flow: Import Links from Bitly (Global)
- [ ] Admin triggers "Get Links from Bitly" in /admin/bitly. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [ ] UI calls POST /api/bitly/pull (limit=100). Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/pull/route.ts](app/api/bitly/pull/route.ts).
- [ ] New bitly_links are inserted with projectId null (unassigned). Evidence: [app/api/bitly/pull/route.ts](app/api/bitly/pull/route.ts), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).

4 Flow: Associate Link to Event (Project) in /admin/bitly
- [ ] Admin uses "Add Link" or "Add to Project" in /admin/bitly. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [ ] POST /api/bitly/links with { projectId, bitlinkOrLongUrl } creates or reuses bitly_links and writes bitly_project_links association. Evidence: [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts), [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts).
- [ ] Association metadata (startDate/endDate/autoCalculated/cachedMetrics) is stored in bitly_project_links. Evidence: [lib/bitly-junction.types.ts](lib/bitly-junction.types.ts), [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts).

5 Flow: Associate/Remove Link to Event inside /admin/events
- [ ] Event edit modal displays BitlyLinksEditor component. Evidence: [app/admin/events/page.tsx](app/admin/events/page.tsx), [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx).
- [ ] Add link uses POST /api/bitly/links (projectId + bitlink). Evidence: [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).
- [ ] Remove link uses DELETE /api/bitly/associations (junction delete). Evidence: [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts).

6 Flow: Associate Link to Partner in /admin/bitly
- [ ] Admin selects partner association from /admin/bitly row controls. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [ ] POST /api/bitly/partners/associate adds link id to partners.bitlyLinkIds. Evidence: [app/api/bitly/partners/associate/route.ts](app/api/bitly/partners/associate/route.ts).
- [ ] DELETE /api/bitly/partners/associate removes link id from partners.bitlyLinkIds. Evidence: [app/api/bitly/partners/associate/route.ts](app/api/bitly/partners/associate/route.ts).

7 Flow: Partner Link Selection in /admin/partners (Duplicate Entry Point)
- [ ] Partner create/edit form includes BitlyLinksSelector. Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [components/BitlyLinksSelector.tsx](components/BitlyLinksSelector.tsx).
- [ ] Selector reads links via GET /api/bitly/links. Evidence: [components/BitlyLinksSelector.tsx](components/BitlyLinksSelector.tsx), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).
- [ ] Partner save uses /api/partners (bitlyLinkIds not handled). Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/api/partners/route.ts](app/api/partners/route.ts).

8 Flow: Sync and Metrics Refresh
- [ ] "Sync Now" triggers POST /api/bitly/sync to refresh bitly_links analytics. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/sync/route.ts](app/api/bitly/sync/route.ts).
- [ ] "Refresh Metrics" triggers POST /api/bitly/recalculate to update cached metrics in bitly_project_links. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/recalculate/route.ts](app/api/bitly/recalculate/route.ts).

9 Flow: Remove or Archive Link
- [ ] Delete association uses DELETE /api/bitly/associations (junction only). Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/associations/route.ts](app/api/bitly/associations/route.ts).
- [ ] Archive link uses DELETE /api/bitly/links/[linkId] (soft delete). Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/links/[linkId]/route.ts](app/api/bitly/links/[linkId]/route.ts).

10 Visibility Rules
- [ ] /admin/bitly shows all links (assigned + unassigned) with project and partner associations. Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/api/bitly/links/route.ts](app/api/bitly/links/route.ts).
- [ ] /admin/events Bitly editor shows only links associated to the selected project. Evidence: [components/BitlyLinksEditor.tsx](components/BitlyLinksEditor.tsx), [app/api/bitly/project-metrics/[projectId]/route.ts](app/api/bitly/project-metrics/[projectId]/route.ts).
- [ ] /admin/partners Bitly selector is for browsing/selection only until bitlyLinkIds persistence is aligned. Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/api/partners/route.ts](app/api/partners/route.ts).
