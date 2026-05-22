# Design System Audit — 2026-05-22

Scope:
- `{messmass}` current codebase
- external reference system: `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM`
- repo-local enforcement docs: `docs/coding-standards.md`, `docs/HANDOVER.md`

## Executive Summary

The product is not merely carrying a few leftover hardcoded values. It is currently operating with **three overlapping UI systems**:

1. the external `GENERAL_DESIGN_SYSTEM` Mantine-first platform contract
2. the repo-local `{messmass}` token-and-wrapper system (`ColoredCard`, `FormModal`, `theme.css`, unified inputs)
3. older feature-level ad hoc styling patterns using inline styles, raw colors, raw HTML controls, and utility-like classes

The result is structural inconsistency rather than isolated drift.

## Highest-Severity Findings

### 1. The repo is not aligned with the external platform foundation at all

The external SSOT says Mantine is the only approved foundational UI system and explicitly forbids large custom CSS islands and raw hex/rgb values in feature code.

References:
- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/FOUNDATION.md:10`
- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/FOUNDATION.md:19`
- `/Users/Shared/Projects/GENERAL_DESIGN_SYSTEM/FOUNDATION.md:35`

Current `{messmass}` reality:
- custom wrapper system instead of Mantine primitives
- large custom CSS surfaces
- repeated raw color literals and inline style usage in feature code

Impact:
- the product cannot honestly claim compliance with the shared design system
- future migration cost keeps compounding because local patterns are still being extended

### 2. Shared admin/navigation surfaces still use inline styles and hardcoded colors

This is a P1 issue because these are top-level shared surfaces that set the styling grammar for the whole app.

References:
- `/Users/moldovancsaba/Projects/messmass/components/AdminDashboard.tsx:102`
- `/Users/moldovancsaba/Projects/messmass/components/AdminDashboard.tsx:109`
- `/Users/moldovancsaba/Projects/messmass/components/AdminDashboard.tsx:126`
- `/Users/moldovancsaba/Projects/messmass/lib/adminNavigation.ts:34`
- `/Users/moldovancsaba/Projects/messmass/lib/adminNavigation.ts:97`
- `/Users/moldovancsaba/Projects/messmass/lib/adminNavigation.ts:260`

Why this is wrong:
- shared navigation accent colors are baked in as hex values instead of token aliases
- the admin dashboard layout is still driven by inline style objects instead of a canonical CSS/module or theme layer

### 3. Newly built report-variant surfaces are still using raw HTML fields instead of the repo’s own unified input primitives

This is a P1 issue because it shows drift is still being introduced in new work, not just legacy work.

References:
- `/Users/moldovancsaba/Projects/messmass/app/admin/partners/[id]/reports/page.tsx:308`
- `/Users/moldovancsaba/Projects/messmass/app/admin/partners/[id]/reports/page.tsx:318`
- `/Users/moldovancsaba/Projects/messmass/app/admin/organizations/[id]/reports/page.tsx:294`
- `/Users/moldovancsaba/Projects/messmass/app/admin/organizations/[id]/reports/page.tsx:303`
- `/Users/moldovancsaba/Projects/messmass/components/OrganizationEditorDashboard.tsx:310`
- `/Users/moldovancsaba/Projects/messmass/components/OrganizationEditorDashboard.tsx:349`

Why this is wrong:
- `HANDOVER.md` and `coding-standards.md` require unified inputs for standard text/number controls
- these surfaces still use raw `<input>` and `<select>` fields directly

### 4. Utility-like classes and inline style escapes still exist inside adapters and list renderers

This is a P1/P2 boundary issue because adapters are shared display infrastructure.

References:
- `/Users/moldovancsaba/Projects/messmass/lib/adapters/partnersAdapter.tsx:144`
- `/Users/moldovancsaba/Projects/messmass/lib/adapters/partnersAdapter.tsx:160`
- `/Users/moldovancsaba/Projects/messmass/lib/adapters/partnersAdapter.tsx:167`
- `/Users/moldovancsaba/Projects/messmass/lib/adapters/partnersAdapter.tsx:184`
- `/Users/moldovancsaba/Projects/messmass/lib/adapters/usersAdapter.tsx:60`
- `/Users/moldovancsaba/Projects/messmass/lib/adapters/usersAdapter.tsx:68`

Patterns found:
- `text-*` and `flex flex-wrap gap-*` utility-style classes in renderers
- inline badge styling with raw radius, spacing, and colors
- inline image presentation styling

### 5. Global/shared CSS still contains many raw rgba/hex surfaces and decorative shadow values

This is a P1 issue because these values influence multiple screens at once and directly conflict with token ownership.

References:
- `/Users/moldovancsaba/Projects/messmass/components/UnifiedAdminHeroWithSearch.module.css:12`
- `/Users/moldovancsaba/Projects/messmass/components/UnifiedAdminHeroWithSearch.module.css:50`
- `/Users/moldovancsaba/Projects/messmass/components/UnifiedAdminHeroWithSearch.module.css:67`
- `/Users/moldovancsaba/Projects/messmass/components/UnifiedAdminHeroWithSearch.module.css:83`
- `/Users/moldovancsaba/Projects/messmass/app/globals.css:303`
- `/Users/moldovancsaba/Projects/messmass/app/globals.css:1458`

Why this is wrong:
- fallback token usage is mixed with raw rgba values
- shadow/elevation decisions are repeated locally instead of centrally defined
- the external system explicitly says decorative shadow layering is prohibited

### 6. Chart components still hardcode palettes, typography, and tooltip colors

This is a P1/P2 issue because chart surfaces are central to the product and should be style-driven.

References:
- `/Users/moldovancsaba/Projects/messmass/components/analytics/LineChart.tsx:135`
- `/Users/moldovancsaba/Projects/messmass/components/analytics/LineChart.tsx:170`
- `/Users/moldovancsaba/Projects/messmass/components/analytics/LineChart.tsx:175`
- `/Users/moldovancsaba/Projects/messmass/components/charts/PieChart.tsx:155`
- `/Users/moldovancsaba/Projects/messmass/components/charts/VerticalBarChart.tsx:181`

Patterns found:
- raw fallback palettes
- hardcoded `Inter`
- hardcoded tooltip and grid colors
- mixed token comments with non-token implementation

### 7. Role/status chips and analytics badges are still color-mapped manually in feature code

This is a P2 issue because it repeats across admin surfaces and should be centralized as semantic status tokens or one shared badge component.

References:
- `/Users/moldovancsaba/Projects/messmass/lib/adapters/usersAdapter.tsx:60`
- `/Users/moldovancsaba/Projects/messmass/components/DataQualityInsights.tsx:110`
- `/Users/moldovancsaba/Projects/messmass/components/DataQualityInsights.tsx:203`
- `/Users/moldovancsaba/Projects/messmass/components/SaveStatusIndicator.tsx:48`

## Specific Drift Categories

### Raw HTML field usage

There are still widespread direct `<input>`, `<select>`, and `<textarea>` usages across admin and shared components, including:
- `components/OrganizationEditorDashboard.tsx`
- `components/PartnerEditorDashboard.tsx`
- `app/admin/partners/page.tsx`
- `app/admin/events/page.tsx`
- `app/admin/visualization/page.tsx`
- `app/admin/kyc/page.tsx`
- `app/admin/content-library/page.tsx`

This is inconsistent with the repo’s own “use unified inputs” rule, even before considering Mantine.

### Inline style usage

Still widespread in shared and feature code:
- `components/AdminDashboard.tsx`
- `components/AnalyticsWorkspaceNav.tsx`
- `components/ReportingWorkspaceNav.tsx`
- `components/RoleDropdown.tsx`
- `components/StylePreview.tsx`
- `components/DataQualityInsights.tsx`

Not all inline style usage is automatically wrong, but the current usage pattern is too broad to qualify as “documented exception CSS”.

### Raw color literals

Still widespread in:
- navigation config
- adapters
- charts
- preview components
- global CSS
- analytics widgets

This is the clearest indicator that token centralization is not actually enforced.

## Recommended Remediation Order

### Phase 1 — Stop introducing new drift

1. Freeze new raw `<input>/<select>/<textarea>` usage in admin/reporting surfaces.
2. Freeze new inline style objects in shared UI surfaces.
3. Freeze new raw color literals in `app`, `components`, and `lib`.

Required enforcement:
- lint/grep check for new raw color literals
- lint/grep check for new inline `style={{...}}` in shared UI
- lint/grep check for new raw form controls outside approved wrappers

### Phase 2 — Normalize shared infrastructure first

1. `components/AdminDashboard.tsx`
2. `lib/adminNavigation.ts`
3. `components/UnifiedAdminHeroWithSearch.module.css`
4. adapter badge/renderer styling (`usersAdapter`, `partnersAdapter`, `insightsAdapter`, `kycAdapter`)
5. `SaveStatusIndicator`, `DataQualityInsights`

Reason:
- these files broadcast style patterns across the rest of the app

### Phase 3 — Normalize report-authoring and variant workflows

1. `app/admin/organizations/[id]/reports/page.tsx`
2. `app/admin/partners/[id]/reports/page.tsx`
3. `components/OrganizationEditorDashboard.tsx`
4. `components/PartnerEditorDashboard.tsx`
5. `app/admin/visualization/page.tsx`

Reason:
- these are active admin/reporting flows, and they are currently mixing old and new patterns

### Phase 4 — Normalize chart and analytics presentation

1. `components/analytics/LineChart.tsx`
2. `components/charts/PieChart.tsx`
3. `components/charts/VerticalBarChart.tsx`
4. shared chart status/tooltip styling

Reason:
- chart styling should come from one token/style layer, not per-component palettes

## Strategic Recommendation

There is one decision the product owner should make explicitly:

1. **Adopt the external `GENERAL_DESIGN_SYSTEM` as real implementation law**, which means a planned Mantine migration.
2. **Or** keep `{messmass}` on its current custom token-and-wrapper system, but then stop claiming Mantine alignment and rewrite the local enforcement docs to match reality.

Right now the repo is in the middle:
- external SSOT says Mantine-only
- local repo behavior is custom wrapper/token-based
- legacy code still bypasses even the local wrapper system

That middle state is the main design-system problem.

## Bottom Line

The strongest conclusion from this audit is:

- the issue is not isolated leftover styling debt
- the issue is **design-system authority fragmentation**
- shared infrastructure and newly added surfaces are still introducing noncompliant patterns
- without enforcement, the codebase will continue to drift even while individual screens get cleaned up
