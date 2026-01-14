# Admin UI Algorithms (Chart Creator) Model
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define the Chart Algorithm configuration model and Admin create/edit flow.
- [x] Map dependencies on KYC variables and report templates.
- [x] Document access rules and validation requirements.

2 Source of Truth and Storage
- [x] Chart configurations are stored in MongoDB `chart_configurations` and managed via `/api/chart-config` CRUD. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).

3 Chart Configuration Model (ChartConfiguration)
| Field | Definition | Evidence |
| --- | --- | --- |
| [x] chartId | Unique chart identifier (e.g., "gender-distribution"). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] title | Human-readable chart title. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] type | Chart type: pie, bar, kpi, text, image, table. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] order | Display order (positive number). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] isActive | Visibility flag for template/rendering. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts) |
| [x] elements | Chart elements array (see Element Model). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] icon/iconVariant | Material icon name + variant. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] emoji | Legacy emoji (deprecated). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] subtitle | Optional subtitle/description. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] showTotal/totalLabel | Totals display options (bar charts). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] aspectRatio | Image/text chart aspect ratio. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] heroSettings | HERO block visibility settings. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] alignmentSettings | Block alignment settings (titles/descriptions/charts). | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] showTitle | Chart-level title visibility. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] showPercentages | Pie chart percentage visibility. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] createdAt/updatedAt/createdBy/lastModifiedBy | Audit fields written by API. | [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |

4 Chart Type Rules (Element Counts)
- [x] pie requires exactly 2 elements. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] bar requires exactly 5 elements. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] kpi requires exactly 1 element. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] text/image/table require exactly 1 element. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).

5 Element Model and Formatting
| Field | Definition | Evidence |
| --- | --- | --- |
| [x] id | Unique element id. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] label | Label for legend/row display. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] formula | Formula with KYC variables in `[var]` tokens. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts) |
| [x] color | Hex color for series. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts) |
| [x] formatting | Optional { rounded, prefix, suffix }. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] parameters | Optional [PARAM:key] values for formulas. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts) |
| [x] manualData | Optional [MANUAL:key] values for formulas. | [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts) |

6 Admin Surfaces and API Inventory
| Surface | API | Notes | Evidence |
| --- | --- | --- | --- |
| [x] /admin/charts | /api/chart-config | Chart Algorithm Manager UI (CRUD + search/sort/pagination). | [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx) |
| [x] /api/chart-config | GET/POST/PUT/DELETE | Admin CRUD with auth + validation. | [app/api/chart-config/route.ts](app/api/chart-config/route.ts) |
| [x] /api/chart-configs | GET | Active charts for visualization manager dropdown. | [app/api/chart-configs/route.ts](app/api/chart-configs/route.ts), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx) |
| [x] /api/chart-config/public | GET | Active charts for report rendering (public). | [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts) |

7 Create/Edit/Delete Flow
- [x] Variables load from `/api/variables-config` for formula picker. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Create/update uses `/api/chart-config` POST/PUT with CSRF-aware apiClient. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/chart-config/route.ts](app/api/chart-config/route.ts), [lib/apiClient.ts](lib/apiClient.ts).
- [x] Delete uses `/api/chart-config?configurationId=` DELETE with confirmation prompt. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] Search/sort/pagination handled via `/api/chart-config` query params (search, offset, limit, sortField, sortOrder). Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] Toggle isActive and ordering via PUT updates. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/api/chart-config/route.ts](app/api/chart-config/route.ts).

8 Validation Rules (UI + API)
- [x] API validates required fields, element counts, formatting object shape, hero/alignment settings, and order > 0. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] API rejects duplicate chartId values on create/update. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] UI validates formula syntax via formulaEngine before save. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/formulaEngine.ts](lib/formulaEngine.ts).

9 Dependencies (KYC + Report Templates)
- [x] KYC variables are the source for formula tokens (global-only), fetched from `/api/variables-config`. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/formulaEngine.ts](lib/formulaEngine.ts), [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Report templates depend on active chart configurations via `/api/chart-configs` (template picker) and `/api/chart-config/public` (rendering). Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/api/chart-configs/route.ts](app/api/chart-configs/route.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts).

10 Permissions and Access
- [x] /admin/charts requires admin/superadmin (client-side /api/auth/check), and route protection sets /admin/charts to admin. Evidence: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [app/api/auth/check/route.ts](app/api/auth/check/route.ts), [lib/routeProtection.ts](lib/routeProtection.ts).
- [x] /api/chart-config POST/PUT/DELETE requires getAdminUser. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts), [lib/auth.ts](lib/auth.ts).
- [x] /api/chart-config/public and /api/chart-configs are public read-only endpoints. Evidence: [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [app/api/chart-configs/route.ts](app/api/chart-configs/route.ts).

11 Risks and Gaps
- [x] Auth model split: /admin/charts uses /api/auth/check while routeProtection uses its own role map. Evidence: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [lib/routeProtection.ts](lib/routeProtection.ts).
- [x] API validates structure but does not validate formula correctness; invalid formulas can be persisted if UI validation is bypassed. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx).
- [x] Multiple read endpoints (/api/chart-configs, /api/chart-config/public) increase drift risk if filters diverge. Evidence: [app/api/chart-configs/route.ts](app/api/chart-configs/route.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts).

12 Admin Constraints (Do This / Do Not Do This)
- [x] Do: Treat chart configurations as global; no partner/event overrides.
- [x] Do: Keep KYC variables current before editing formulas.
- [x] Do: Use Chart Algorithm Manager for edits; keep /api/chart-config as the single admin write API.
- [x] Do not: Persist charts with invalid formulas or missing required elements.
- [x] Do not: Use public endpoints for admin editing workflows.