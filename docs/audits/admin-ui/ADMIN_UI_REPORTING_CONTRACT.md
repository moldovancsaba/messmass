# Admin UI to Reporting Contract
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Define the Admin-owned configuration contract that Reporting consumes.
- [x] Declare required vs optional fields per entity.
- [x] Set compatibility and breaking-change rules for Admin updates.

2 Contract Boundary (Admin -> Reporting)
- [x] Admin is the single writer for configuration entities (templates, chart configs, variables).
- [x] Reporting is read-only and must consume Admin outputs via documented APIs.
- [x] Any Reporting reliance outside this contract is out of scope and must be surfaced.

3 Contract Entities Summary
| Entity | Admin source | Reporting consumer | Notes | Evidence |
| --- | --- | --- | --- | --- |
| [x] Events / Projects | Admin data entry + ingestion | /api/projects/stats, /api/report-config | Reporting uses event stats + template resolution. | [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx) |
| [x] KYC Variables | /admin/kyc -> /api/variables-config | Formula tokens in charts | Variable names must match stats fields. | [app/api/variables-config/route.ts](app/api/variables-config/route.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts) |
| [x] Algorithms (Chart Configs) | /admin/charts -> /api/chart-config | /api/chart-config/public | Charts render from Admin configs. | [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [lib/report-calculator.ts](lib/report-calculator.ts) |
| [x] Report Templates + Blocks | /admin/visualization -> /api/report-templates + /api/data-blocks | /api/report-config | Templates select charts and layout. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/api/report-templates/route.ts](app/api/report-templates/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts) |
| [x] Insights | /admin/insights (Admin only) | None observed | Not part of Reporting contract. | [docs/audits/admin-ui/ADMIN_UI_INSIGHTS_MODEL.md](docs/audits/admin-ui/ADMIN_UI_INSIGHTS_MODEL.md), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx) |

4 Events / Projects Contract
- [x] Required identifiers: project _id and viewSlug (report URL). Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).
- [x] Required fields for Reporting:
  - [x] eventName, eventDate. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [hooks/useReportData.ts](hooks/useReportData.ts).
  - [x] stats object with fields referenced by chart formulas. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts).
  - [x] partner1 (and partner2 if present) with name/emoji/logoUrl for hero. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).
  - [x] reportTemplateId (optional override) and styleIdEnhanced (optional override). Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts).
- [x] Optional fields consumed by Reporting:
  - [x] hashtags and categorizedHashtags. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [hooks/useReportData.ts](hooks/useReportData.ts).
  - [x] createdAt/updatedAt for export metadata. Evidence: [app/api/projects/stats/[slug]/route.ts](app/api/projects/stats/[slug]/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).

5 KYC Variables Contract
- [x] Source of truth is /api/variables-config (variables_metadata). Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts), [docs/audits/admin-ui/ADMIN_UI_KYC_MODEL.md](docs/audits/admin-ui/ADMIN_UI_KYC_MODEL.md).
- [x] Required variable fields (Admin-owned metadata):
  - [x] name (maps directly to stats field, no stats. prefix). Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts), [lib/formulaEngine.ts](lib/formulaEngine.ts).
  - [x] type, category, label/alias for Admin visibility. Evidence: [app/api/variables-config/route.ts](app/api/variables-config/route.ts).
- [x] Reporting-compatible formula tokens:
  - [x] [fieldName] maps to stats[fieldName] directly. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts).
  - [x] [PARAM:key], [MANUAL:key] for admin-defined parameters/manual data. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts), [lib/chartCalculator.ts](lib/chartCalculator.ts).
  - [x] [MEDIA:slug], [TEXT:slug] for content assets used in text/image charts. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts).
- [x] Derived fields are computed at render time and are safe to reference: allImages, remoteFans, totalFans. Evidence: [lib/dataValidator.ts](lib/dataValidator.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).

6 Algorithms (Chart Configurations) Contract
- [x] Admin write API: /api/chart-config (chart_configurations). Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] Reporting read API: /api/chart-config/public (active charts only). Evidence: [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).
- [x] Required fields for Reporting:
  - [x] chartId (stable identifier). Evidence: [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts).
  - [x] type (kpi/pie/bar/text/image/table). Evidence: [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/report-calculator.ts](lib/report-calculator.ts).
  - [x] isActive, order, elements (formula + label + color). Evidence: [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts), [lib/report-calculator.ts](lib/report-calculator.ts).
  - [x] formatting (optional) for numeric output. Evidence: [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts), [lib/report-calculator.ts](lib/report-calculator.ts).
- [x] Legacy /api/charts exists (charts collection) and should not diverge from chart_configurations. Evidence: [app/api/charts/route.ts](app/api/charts/route.ts).

7 Report Templates and Blocks Contract
- [x] Report templates stored in report_templates. Evidence: [app/api/report-templates/route.ts](app/api/report-templates/route.ts), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts).
- [x] Required template fields:
  - [x] name, type (event/partner/global), isDefault. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts).
  - [x] dataBlocks array with blockId + order. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts).
  - [x] gridSettings (desktop/tablet/mobile units). Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [hooks/useReportLayout.ts](hooks/useReportLayout.ts).
- [x] Optional template fields used by Reporting:
  - [x] styleId (report styles). Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [hooks/useReportStyle.ts](hooks/useReportStyle.ts).
  - [x] heroSettings and alignmentSettings. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [hooks/useReportLayout.ts](hooks/useReportLayout.ts), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).
- [x] Data blocks stored in data_blocks and must include charts with chartId/width/order. Evidence: [app/api/data-blocks/route.ts](app/api/data-blocks/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts), [hooks/useReportLayout.ts](hooks/useReportLayout.ts).
- [x] Template resolution hierarchy is project -> partner -> default -> hardcoded. Evidence: [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts).

8 Insights Contract
- [x] Insights are Admin-only; Reporting does not fetch insights in report rendering. Evidence: [docs/audits/admin-ui/ADMIN_UI_INSIGHTS_MODEL.md](docs/audits/admin-ui/ADMIN_UI_INSIGHTS_MODEL.md), [app/report/[slug]/page.tsx](app/report/[slug]/page.tsx).

9 Compatibility Expectations (No Version Field)
- [x] No explicit versioning exists; compatibility is enforced by stable identifiers and field presence. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts).
- [x] Admin UI version labels follow package.json (currently 11.55.1) and are informational only; the contract remains ID-based. Evidence: [package.json](package.json), [app/admin/help/page.tsx](app/admin/help/page.tsx).
- [x] Template compatibility validator flags missing charts/variables. Evidence: [lib/templateCompatibilityValidator.ts](lib/templateCompatibilityValidator.ts).
- [x] Admin changes must keep chartId and variable names stable across templates. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts), [app/api/chart-config/route.ts](app/api/chart-config/route.ts).

10 Breaking-Change Rules
- [x] Breaking: renaming/removing chartId referenced by templates. Mitigation: create new chartId, migrate templates, keep old chartId until cutover. Evidence: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts).
- [x] Breaking: renaming/removing KYC variable names used in formulas. Mitigation: add alias variable + migration, run compatibility validation. Evidence: [lib/formulaEngine.ts](lib/formulaEngine.ts), [lib/templateCompatibilityValidator.ts](lib/templateCompatibilityValidator.ts).
- [x] Breaking: changing chart type or element count without updating templates. Mitigation: update chart config + template references together. Evidence: [app/api/chart-config/route.ts](app/api/chart-config/route.ts).
- [x] Breaking: deleting report templates or data blocks referenced by projects/partners. Mitigation: reassign reportTemplateId before deletion. Evidence: [app/api/report-templates/route.ts](app/api/report-templates/route.ts), [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts).

11 Execution Checklist (Contract Enforcement)
- [x] Before Admin changes: run template compatibility checks for affected templates. Evidence: [lib/templateCompatibilityValidator.ts](lib/templateCompatibilityValidator.ts).
- [x] After Admin changes: verify /api/report-config resolves and /api/chart-config/public returns required charts. Evidence: [app/api/report-config/[identifier]/route.ts](app/api/report-config/[identifier]/route.ts), [app/api/chart-config/public/route.ts](app/api/chart-config/public/route.ts).
- [x] Record change in ACTION_PLAN.md with evidence links for traceability. Evidence: [ACTION_PLAN.md](ACTION_PLAN.md).
