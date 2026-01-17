# Admin UI Final IA
Status: Draft (Inputs updated through A-UI-09; A-UI-01 + A-UI-10-15 pending)
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Provide a minimal, ownership-aligned Admin navigation structure based on A-UI-01 through A-UI-15 outputs.
- [ ] Highlight merged and removed sections without introducing new features.

2 Inputs
- [x] Consolidation decisions: [docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md](docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md)
- [x] Capability inventory: [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md)
- [x] Ownership model: [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md)
- [x] Terminology: [docs/audits/admin-ui/ADMIN_UI_GLOSSARY.md](docs/audits/admin-ui/ADMIN_UI_GLOSSARY.md)

2.1 Traceability to A-UI-01 → A-UI-15 Outputs
| Task ID | Output reference | Notes |
| --- | --- | --- |
| [ ] A-UI-01 Partners | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Partners navigation placement. |
| [x] A-UI-02 Events | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Events navigation placement. |
| [x] A-UI-03 Filters | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Filter navigation placement. |
| [x] A-UI-04 Users | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Users navigation placement. |
| [x] A-UI-05 Insights | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Insights merged into analytics insights. |
| [x] A-UI-06 KYC | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] KYC + clicker navigation placement. |
| [x] A-UI-07 Algorithms | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Algorithms navigation placement. |
| [x] A-UI-08 Admin -> Reporting Contract | [x] [docs/audits/admin-ui/ADMIN_UI_REPORTING_CONTRACT.md](docs/audits/admin-ui/ADMIN_UI_REPORTING_CONTRACT.md) | [x] Contract boundary; non-navigation artifact. |
| [x] A-UI-09 Bitly Manager | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Bitly Manager placement. |
| [ ] A-UI-10 Hashtag Manager | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Hashtag Manager placement. |
| [ ] A-UI-11 Category Manager | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Categories merged into Hashtags. |
| [ ] A-UI-12 Reporting | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Reporting placement. |
| [ ] A-UI-13 Style Library | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Styles placement. |
| [ ] A-UI-14 Cache Management | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Cache placement. |
| [ ] A-UI-15 User Guide | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Help placement. |

3 Final Admin Navigation (Proposed)
| Group | Item | Route | Ownership scope | Action | Source reference |
| --- | --- | --- | --- | --- | --- |
| [ ] Partner & Event Ops | [ ] Partners | [ ] /admin/partners | [ ] Partner | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Partner & Event Ops | [ ] Events | [ ] /admin/events | [ ] Event | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Partner & Event Ops | [ ] Project-Partners | [ ] /admin/project-partners | [ ] Event | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Partner & Event Ops | [ ] Quick Add | [ ] /admin/quick-add | [ ] Event | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Analytics & Insights | [ ] Executive Analytics | [ ] /admin/analytics/executive | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Analytics & Insights | [ ] Insights | [ ] /admin/analytics/insights | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Analytics & Insights | [ ] Filter | [ ] /admin/filter | [ ] Event | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Global Libraries | [ ] KYC Variables | [ ] /admin/kyc | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Global Libraries | [ ] Clicker Manager | [ ] /admin/clicker-manager | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Global Libraries | [ ] Algorithms | [ ] /admin/charts | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Global Libraries | [ ] Reporting Templates | [ ] /admin/visualization | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Global Libraries | [ ] Styles | [ ] /admin/styles | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Global Libraries | [ ] Content Library | [ ] /admin/content-library | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Link & Tag Management | [ ] Bitly Manager | [ ] /admin/bitly | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Link & Tag Management | [ ] Hashtags | [ ] /admin/hashtags | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] System & Access | [ ] Admin Users | [ ] /admin/users | [ ] User | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] System & Access | [ ] Cache Management | [ ] /admin/cache | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] System & Access | [ ] Admin Design | [ ] /admin/design | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] System & Access | [ ] Help / User Guide | [ ] /admin/help | [ ] Global | [ ] KEEP | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |

4 Removed or Merged From Navigation
| Item | Route | Action | Target | Evidence |
| --- | --- | --- | --- | --- |
| [ ] Legacy Dashboard | [ ] /admin/dashboard | [ ] MERGED | [ ] /admin | [ ] [docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md](docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md) |
| [ ] Insights (legacy) | [ ] /admin/insights | [ ] MERGED | [ ] /admin/analytics/insights | [ ] [docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md](docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md) |
| [ ] Categories | [ ] /admin/categories | [ ] MERGED | [ ] /admin/hashtags | [ ] [docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md](docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md) |
| [ ] Projects (legacy) | [ ] /admin/projects | [ ] REMOVED | [ ] /admin/events | [ ] [docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md](docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md) |

5 System and Legacy Routes (Not in Navigation)
| Item | Route | Reason | Evidence |
| --- | --- | --- | --- |
| [ ] Admin Login | [ ] /admin/login | [ ] Pre-auth route. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Admin Register | [ ] /admin/register | [ ] Pre-auth route. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Clear Session | [ ] /admin/clear-session | [ ] Support route for auth recovery. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Cookie Test | [ ] /admin/cookie-test | [ ] Debug route; keep out of IA. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Unauthorized | [ ] /admin/unauthorized | [ ] Error route. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
