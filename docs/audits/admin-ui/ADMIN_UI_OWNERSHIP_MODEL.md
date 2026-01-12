# Admin UI Ownership Model
Status: Draft
Last Updated: 2026-01-12T09:56:01.000Z
Canonical: No
Owner: Audit

1 Purpose
- Define ownership scope for Admin UI assets and enforce single source of truth and override rules.

2 Ownership Rules

2.1 Global single sources of truth
- Variables config (KYC), chart algorithms/configs, report templates, and report styles are global libraries.
- Partner and event records store references (IDs) only.

2.2 Override rules
- Event assignment overrides partner assignment.
- Partner assignment overrides global default.
- If neither event nor partner assignment is present, use the global default.

2.3 Noise resolution targets
- Partner-level KYC: treat as references to global variables-config only.
- Partner-level Algorithms: treat as references to global chart-config only.
- Partner-level Reporting: treat as reportTemplateId selection only.
- Partner-level Styles: treat as styleId selection only.

3 Ownership Model Table
| Domain or Asset | Canonical scope | Assignment scope | Override rules or single source of truth | Evidence |
| --- | --- | --- | --- | --- |
| Variables config (KYC) | Global | None (consumed by clicker and algorithms) | Only /api/variables-config is canonical; no partner or event variants | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| Chart algorithms/configs | Global | Used by report templates | Chart-config is global; templates reference configs; no partner-specific definitions | [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx) |
| Clicker variable groups | Global | Editor clicker UI | Groups live in /api/variables-groups; no partner or event overrides | [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| Report templates | Global | Partner, Event | Event overrides partner; partner overrides global default | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Report styles | Global | Partner, Event, Filter view | Event overrides partner; partner overrides global default; filter uses explicit styleId | [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx) |
| Hashtags | Global | Partner, Event | Global hashtag dictionary; partner/event store usage | [components/HashtagEditor.tsx](components/HashtagEditor.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Hashtag categories | Global | Partner, Event | Global categories; used by categorizedHashtags | [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts) |
| Bitly links | Global | Partner, Event | Link definitions are global; associations are many-to-many | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx) |
| Partners | Partner | Referenced by Events and Bitly | Partner is canonical owner of partner metadata | [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx) |
| Events (Projects) | Event | Referenced by Reports and Bitly | Event is canonical owner of event metadata | [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/types/api.ts](lib/types/api.ts) |
| Insights | Global | Read-only | Insights derived from analytics; no partner/event overrides | [app/admin/insights/page.tsx](app/admin/insights/page.tsx) |
| Admin users and roles | Global | User | Role model is global; permissions enforced by auth system | [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts) |
| Cache control | Global | System-wide | Cache actions apply globally | [app/admin/cache/page.tsx](app/admin/cache/page.tsx) |
| User guide content | Global | Read-only | Single guide surface for all admin roles | [app/admin/help/page.tsx](app/admin/help/page.tsx) |
