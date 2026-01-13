# Admin UI Ownership Model
Status: Draft
Last Updated: 2026-01-13T00:13:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Define ownership scope for Admin UI assets and enforce single source of truth and override rules.
- [ ] Provide a single ownership table covering Global only, Partner overrides, Event-scoped, and User/role-scoped assets.

2 Ownership Model Table
| Domain or Asset | Global only | Partner override allowed | Event-scoped | User/role-scoped | Override rules or single source of truth | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Variables config (KYC) | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Only /api/variables-config is canonical; no partner or event variants. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| Chart algorithms/configs | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Chart-config is global; templates reference configs; no partner-specific definitions. | [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx) |
| Clicker variable groups | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Groups live in /api/variables-groups; no partner or event overrides. | [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| Report templates | [ ] No | [ ] Yes | [ ] Yes | [ ] No | [ ] Event overrides partner; partner overrides global default. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Report styles | [ ] No | [ ] Yes | [ ] Yes | [ ] No | [ ] Event overrides partner; partner overrides global default; filter uses explicit styleId. | [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx) |
| Hashtags | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Global hashtag dictionary; partner/event store usage only. | [components/HashtagEditor.tsx](components/HashtagEditor.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Hashtag categories | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Global categories used by categorizedHashtags. | [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts) |
| Bitly links | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Link definitions are global; associations are many-to-many with partners/events. | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx) |
| Partners | [ ] No | [ ] No | [ ] No | [ ] No | [ ] Partner is canonical owner of partner metadata (partner-scoped). | [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Events (Projects) | [ ] No | [ ] No | [ ] Yes | [ ] No | [ ] Event is canonical owner of event metadata. | [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/types/api.ts](lib/types/api.ts) |
| Insights | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Insights derived from analytics; no partner/event overrides. | [app/admin/insights/page.tsx](app/admin/insights/page.tsx) |
| Admin users and roles | [ ] No | [ ] No | [ ] No | [ ] Yes | [ ] Role model is global; permissions enforced by auth system. | [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts) |
| Cache control | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Cache actions apply globally. | [app/admin/cache/page.tsx](app/admin/cache/page.tsx) |
| User guide content | [ ] Yes | [ ] No | [ ] No | [ ] No | [ ] Single guide surface for all admin roles. | [app/admin/help/page.tsx](app/admin/help/page.tsx) |
