# Admin UI Consolidation Plan
Status: Draft (Inputs updated through A-UI-09; A-UI-01 + A-UI-10-15 pending)
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Convert A-UI-01 through A-UI-15 outputs into explicit merge, remove, or freeze decisions for Admin UI consolidation.
- [ ] Provide execution-ready direction without introducing new features or redesign.

2 Inputs
- [x] Capability inventory and duplication register: [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md)
- [x] Ownership rules and scopes: [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md)
- [x] Terminology alignment: [docs/audits/admin-ui/ADMIN_UI_GLOSSARY.md](docs/audits/admin-ui/ADMIN_UI_GLOSSARY.md)

2.1 Traceability to A-UI-01 → A-UI-15 Outputs
| Task ID | Output reference | Notes |
| --- | --- | --- |
| [ ] A-UI-01 Partners | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Partners routes and duplication references. |
| [x] A-UI-02 Events | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Events routes, overrides, and duplication references. |
| [x] A-UI-03 Filters | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Filter routes and report-style dependencies. |
| [x] A-UI-04 Users | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] User management ownership scope. |
| [x] A-UI-05 Insights | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Insights routes overlap with analytics insights. |
| [x] A-UI-06 KYC | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] KYC variables, algorithms, and clicker dependencies. |
| [x] A-UI-07 Algorithms | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Chart algorithms scope and dependencies. |
| [x] A-UI-08 Admin -> Reporting Contract | [x] [docs/audits/admin-ui/ADMIN_UI_REPORTING_CONTRACT.md](docs/audits/admin-ui/ADMIN_UI_REPORTING_CONTRACT.md) | [x] Contract boundary documented; non-IA consolidation dependency. |
| [x] A-UI-09 Bitly Manager | [x] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [x] Bitly link ownership and associations. |
| [ ] A-UI-10 Hashtag Manager | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Hashtag editing and duplication with categories. |
| [ ] A-UI-11 Category Manager | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Category ownership and duplication with hashtags. |
| [ ] A-UI-12 Reporting | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Report template ownership and assignments. |
| [ ] A-UI-13 Style Library | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Report style ownership and assignments. |
| [ ] A-UI-14 Cache Management | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Cache control scope. |
| [ ] A-UI-15 User Guide | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) | [ ] Guide scope and missing artifact blocker. |

3 Consolidation & Removal Plan
| Item | Action | Current location | Target location | Rationale | Risk | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| [ ] Legacy dashboard | [ ] MERGE | [ ] /admin/dashboard | [ ] /admin | [ ] Duplicate dashboard metrics and entrypoint. | [ ] Existing bookmarks and workflows. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Insights dashboard duplication | [ ] MERGE | [ ] /admin/insights | [ ] /admin/analytics/insights | [ ] Single insights surface reduces drift. | [ ] Users relying on /admin/insights. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Projects legacy route | [ ] REMOVE | [ ] /admin/projects | [ ] /admin/events | [ ] Legacy redirect route; not part of final IA. | [ ] External links if redirect removed. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Partner/Event assignment controls (templates, styles, hashtags) | [ ] MERGE | [ ] /admin/partners + /admin/events | [ ] Shared assignment component used by both pages | [ ] Reduce duplicated assignment flows. | [ ] Incorrect override behavior if unified incorrectly. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Hashtag search and pagination | [ ] MERGE | [ ] /admin/filter + /admin/hashtags | [ ] Shared hashtag search component/hook | [ ] Single search behavior across admin views. | [ ] Regressions in filter UX. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Variable definitions (KYC) | [ ] MERGE | [ ] /admin/kyc + /admin/charts + /admin/clicker-manager | [ ] /admin/kyc as sole edit surface; other pages read-only for variables | [ ] Enforce global single source of truth. | [ ] Algorithm editing may require variable updates. | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Bitly association controls | [ ] MERGE | [ ] /admin/partners (bitly assignments) | [ ] /admin/bitly | [ ] Centralize link association ownership. | [ ] Partner workflow disruption. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Hashtag metadata management | [ ] MERGE | [ ] /admin/hashtags + /admin/categories | [ ] /admin/hashtags | [ ] Single hashtag metadata surface. | [ ] Category-only workflows may be affected. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] Report style assignment controls | [ ] MERGE | [ ] /admin/partners + /admin/events + /admin/filter | [ ] Shared style assignment component used by all relevant pages | [ ] Ensure consistent override rules. | [ ] Incorrect style inheritance. | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Report template assignment controls | [ ] MERGE | [ ] /admin/partners + /admin/events | [ ] Shared template assignment component used by both pages | [ ] Ensure consistent override rules. | [ ] Incorrect template inheritance. | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Filter analytics duplication | [ ] REMOVE | [ ] /admin/dashboard (filter tab) | [ ] /admin/filter | [ ] Single filter surface reduces drift. | [ ] Legacy dashboard dependency. | [ ] [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md) |
| [ ] KYC variables library | [ ] FREEZE | [ ] /admin/kyc | [ ] /admin/kyc | [ ] Canonical global variable definitions. | [ ] None if ownership model enforced. | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Report templates library | [ ] FREEZE | [ ] /admin/visualization | [ ] /admin/visualization | [ ] Canonical report template definitions. | [ ] None if assignment controls consolidated. | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
| [ ] Report styles library | [ ] FREEZE | [ ] /admin/styles | [ ] /admin/styles | [ ] Canonical report style definitions. | [ ] None if assignment controls consolidated. | [ ] [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md) |
