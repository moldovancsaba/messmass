# Analytics Chart UX Benchmark Plan

Last updated: 2026-05-23
Status: Planned
Owner: Chappie

## Objective

Use `design-sparx/mantine-analytics-dashboard` as a visual and structural benchmark for analytics chart composition, KPI card hierarchy, and filter UX in `{messmass}` without importing code, components, or new dependencies.

## Non-Negotiables

- Do not replace the current chart engine.
- Do not introduce new runtime dependencies.
- Do not import third-party chart/dashboard code.
- Rebuild only stack-compatible patterns using the existing `{messmass}` stack.
- Preserve existing report rendering behavior and export behavior unless a dedicated issue explicitly expands them.

## Benchmark Signals Worth Reusing

The benchmark repository is useful as a reference for:

- KPI card hierarchy with delta badges and period labels
- chart-card structure with consistent headers, actions, and body spacing
- shared period and filter toolbars
- predictable loading, empty, and error states across analytics surfaces
- mixed chart-and-table dashboard sections
- responsive dashboard grid behavior
- reusable chart color/legend/tooltip conventions

The benchmark repository is **not** a migration target for:

- Mantine component architecture
- ApexCharts
- mock API architecture
- global dashboard shell or route structure

## Stack-Compatible Adoption Strategy

All benchmark-inspired improvements must be implemented through local primitives:

- `lib/chartTheme.ts`
- shared chart-card wrappers in local components
- shared period and filter controls in local components
- normalized KPI, legend, tooltip, and state layout rules in local CSS/modules
- existing `Chart.js` and `react-chartjs-2` stack

## Deliverable Lanes

### Lane A — KPI Surface System

Create a reusable KPI/stat-card system for analytics surfaces:

- title
- primary value
- comparison delta
- optional period chip
- optional explanation text
- consistent loading and empty states

### Lane B — Shared Chart Card Wrapper

Create a shared analytics card shell for charts and chart+table composites:

- title
- subtitle / explanatory copy
- actions slot
- loading slot
- error slot
- empty state slot
- footer/meta slot

### Lane C — Period And Filter Toolbar

Create a reusable analytics toolbar that supports:

- preset periods
- custom period entry where already supported by backend
- filter chips / scope pills
- consistent placement across analytics views

This lane must align with the report-variants period engine rather than invent a second time-range model.

### Lane D — Dashboard Grid And Section Layout

Normalize analytics page layout so chart surfaces do not drift visually:

- consistent card heights where appropriate
- responsive two-column and three-column behavior
- predictable spacing between KPI rows, chart rows, and drilldown tables

### Lane E — Legend, Tooltip, And Summary Grammar

Extend the current chart theme system so all canonical charts share:

- palette rules
- tooltip colors
- legend typography
- summary/footer conventions
- delta/benchmark display rules

### Lane F — Loading, Empty, And Error State System

Normalize analytics states so all major dashboards use the same grammar for:

- skeletons
- empty result states
- recoverable errors
- retry affordances where appropriate

### Lane G — Chart And Table Composite Panels

Add a reusable pattern for “chart + ranked table / evidence table” sections:

- chart surface
- supporting rows
- shared header/meta language
- responsive collapse behavior

### Lane H — Rollout Across Current Analytics Surfaces

Apply the new primitives to the current analytics entry points:

- Analytics Home
- Sponsorship Hub
- Partner Activation
- Executive Dashboard
- Marketing Dashboard
- Operations Dashboard
- Insights

## Recommended Dependency Order

1. shared chart card wrapper
2. KPI surface system
3. period and filter toolbar
4. legend, tooltip, and summary grammar
5. loading, empty, and error state system
6. dashboard grid and section layout
7. chart + table composite panels
8. rollout across existing analytics surfaces

## Relationship To Existing Board Work

- builds on `#845 Design System Remediation 6/7: chart and analytics presentation normalization`
- should reuse the report-period foundation from `#832 Report Variants 2/8: shared time-period engine and API contract`
- complements `#784 Unified Sponsorship Performance Hub`
- complements `#788 Partner Activation and Proof-of-Performance Workspace`
- fits under the broader direction of `#44 Advanced Analytics & Insights Platform`

## Acceptance Standard For Future Implementation

Any child issue created from this benchmark plan should:

- identify one concrete reusable primitive or one bounded rollout surface
- avoid any dependency on ApexCharts or Mantine-only APIs
- state exactly which existing local components/pages are affected
- preserve current analytics behavior while improving composition and usability
