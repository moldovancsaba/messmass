# Admin UI KYC Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define the KYC variable model as the single source of truth for Admin, Algorithms, Clicker, and Reporting.
- [x] Document ownership rules, dependencies, and guardrails for Admin execution.

2 Source of Truth
- [x] Canonical source is `/api/variables-config`, backed by MongoDB `variables_metadata` collection. Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Admin UI editor is `/admin/kyc` and is the only intended edit surface. Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx).

3 Variable Model (Current)
| Field | Definition | Evidence |
| --- | --- | --- |
| [x] name | Variable identifier (camelCase, no `stats.` prefix). | [app/api/variables-config/route.ts](app/api/variables-config/route.ts) |
| [x] label | Display label; falls back to alias or humanized name. | [app/api/variables-config/route.ts](app/api/variables-config/route.ts) |
| [x] type | Data type (count, numeric, currency, percentage, text, boolean, date, etc.). | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] category | Grouping label used for filters and tags. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] description | Optional explanation or derived formula description. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] derived + formula | Derived variable definition and formula logic. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] flags.visibleInClicker | Controls inclusion in clicker UI. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] flags.editableInManual | Controls manual edit capability. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| [x] isSystem | System variable guard (cannot delete). | [app/api/variables-config/route.ts](app/api/variables-config/route.ts) |
| [x] order | Category ordering for UI. | [app/api/variables-config/route.ts](app/api/variables-config/route.ts) |

4 Variable Definition Lifecycle
- [x] Create/Edit: `/admin/kyc` calls `/api/variables-config` (POST) with camelCase names and metadata. Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Delete: `/admin/kyc` calls `/api/variables-config` (DELETE); blocked for `isSystem` variables. Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Cache: 5-minute in-memory cache; invalidate after create/update/delete. Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts), [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx).

5 Ownership Rules and Overrides
- [x] Ownership is global-only; there are no partner or event overrides for variable definitions. Evidence: [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md).
- [x] Partner/event KYC pages are read-only data views, not definition editors. Evidence: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx).
- [x] Override paths: None identified in code; all variable definitions resolve from `/api/variables-config`. Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx).

6 Dependency Map (Algorithms, Clicker, Reporting)
| Area | Dependency on KYC | What is consumed | Evidence |
| --- | --- | --- | --- |
| [x] Algorithms | ChartAlgorithmManager loads variables from `/api/variables-config` for formulas. | Variable list for formula validation and chart configs. | [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/formulaEngine.ts](lib/formulaEngine.ts) |
| [x] Clicker | Clicker Manager loads variables from `/api/variables-config` to build variable groups. | Variable names, flags, and categories. | [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx) |
| [x] Reporting | Report templates reference chart configs that use KYC variables and formulas. | Variables referenced by chart configs and formula engine. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts) |
| [x] KYC data views | Partner/event KYC pages load variables for display context. | Variable metadata for table headers and filters. | [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx) |

7 What Breaks If KYC Is Wrong
- [x] Formula evaluation fails when variable names do not match stats fields. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts).
- [x] Charts render incorrectly if variable types or derived formulas are invalid. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts).
- [x] Clicker groups lose variables if names are removed or cache is stale. Evidence: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx).
- [x] Reporting templates cannot resolve chart configs if variables are missing. Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/formulaEngine.ts](lib/formulaEngine.ts).

8 Duplication Candidates
- [x] C-10: Partner and event KYC data views are parallel read-only surfaces; no overrides permitted. Evidence: [ACTION_PLAN.md](ACTION_PLAN.md), [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md).

9 Admin Constraints (Do This / Do Not Do This)
- [x] Do: Edit variables only in `/admin/kyc` and via `/api/variables-config`.
- [x] Do: Use camelCase variable names without `stats.` prefix.
- [x] Do: Invalidate variables cache after create/update/delete.
- [x] Do not: Introduce partner- or event-scoped variable edits.
- [x] Do not: Delete or rename `isSystem` variables.

10 Phase 2 (Proposal Only, No Execution)
- [ ] Add admin authentication checks to `/api/variables-config` POST/PUT/DELETE to enforce global-only edits by Admin roles.
- [ ] Standardize auth checks to `/api/admin/auth` for Admin UI pages that currently use `/api/auth/check`.
- [ ] Document and implement a single permission gate for KYC edits (admin/superadmin).
