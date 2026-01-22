# Admin UI Ownership Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define ownership scope for Admin UI assets and enforce single source of truth and override rules.
- [x] Provide a single ownership table covering Global only, Partner overrides, Event-scoped, and User/role-scoped assets.

2 Ownership Model Table
| Domain or Asset | Global only | Partner override allowed | Event-scoped | User/role-scoped | Override rules or single source of truth | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Variables config (KYC) | [x] Yes | [x] No | [x] No | [x] No | [x] Only /api/variables-config is canonical; no partner or event variants. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| Chart algorithms/configs | [x] Yes | [x] No | [x] No | [x] No | [x] Chart-config is global; templates reference configs; no partner-specific definitions. | [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx) |
| Clicker variable groups | [x] Yes | [x] No | [x] No | [x] No | [x] Groups live in /api/variables-groups; no partner or event overrides. | [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| Report templates | [x] No | [x] Yes | [x] Yes | [x] No | [x] Event overrides partner; partner overrides global default. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Report styles | [x] No | [x] Yes | [x] Yes | [x] No | [x] Event overrides partner; partner overrides global default; filter uses explicit styleId. | [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx) |
| Hashtags | [x] Yes | [x] No | [x] No | [x] No | [x] Global hashtag dictionary; partner/event store usage only. | [components/HashtagEditor.tsx](components/HashtagEditor.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Hashtag categories | [x] Yes | [x] No | [x] No | [x] No | [x] Global categories used by categorizedHashtags. | [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts) |
| Bitly links | [x] Yes | [x] No | [x] No | [x] No | [x] Link definitions are global; associations are many-to-many with partners/events. | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx) |
| Partners | [x] No | [x] No | [x] No | [x] No | [x] Partner is canonical owner of partner metadata (partner-scoped). | [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Events (Projects) | [x] No | [x] No | [x] Yes | [x] No | [x] Event is canonical owner of event metadata. | [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/types/api.ts](lib/types/api.ts) |
| Insights | [x] Yes | [x] No | [x] No | [x] No | [x] Insights derived from analytics; no partner/event overrides. | [app/admin/insights/page.tsx](app/admin/insights/page.tsx) |
| Admin users and roles | [x] No | [x] No | [x] No | [x] Yes | [x] Role model is global; permissions enforced by auth system. | [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts) |
| Cache control | [x] Yes | [x] No | [x] No | [x] No | [x] Cache actions apply globally. | [app/admin/cache/page.tsx](app/admin/cache/page.tsx) |
| User guide content | [x] Yes | [x] No | [x] No | [x] No | [x] Single guide surface for all admin roles. | [app/admin/help/page.tsx](app/admin/help/page.tsx) |