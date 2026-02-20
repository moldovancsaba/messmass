# Chart Alignment & Layout Fixes (2026)
Status: Active
Last Updated: 2026-02-04T03:00:00.000Z
Canonical: Yes
Owner: Operations

## Summary of Issues Addressed
- **KPI Chart Title Overlap**: restructured KPI cards with a 3fr-4fr-3fr CSS Grid to keep title at the bottom, title no longer compresses icon/value zones.
- **Pie Chart Vertical Misalignment**: fixed pie containers to a fixed 70%/30% split, removed padding and introduced container queries to align multiple pies regardless of title length.
- **Bar Chart Width Scaling**: removed viewport-based `max-width` rules, added container queries and grid-relative widths so bar tracks now match their grid columns and never overflow.

## Implementation Notes
- **Primary files**:
  - `app/report/[slug]/ReportChart.module.css`: converted KPI, pie, and bar styles to grid/container-query-friendly definitions, added `container-type: size` to every chart row, removed viewport sizes.
  - `app/report/[slug]/ReportChart.tsx`: removed the ad-hoc `CellWrapper` around KPI titles, rendered the title inside a dedicated grid cell so layout relies solely on CSS.
- **Browser support**:
  - CSS Grid and `display: contents` are supported by all modern browsers; container queries are targeted at Chrome 105+, Firefox 90+, Safari 16+ with graceful degradation.
- **Architectural principles**:
  1. Grid over flex for deterministic proportions.
  2. Fixed height containers (not flex compression) for consistent alignment.
  3. Container queries for text scaling instead of viewport units.
  4. Grid column `width: 100%` to avoid mixing viewport/column measurements.

## Testing Checklist
- KPI cards render in 3 rows (30%/40%/30%) with the title in the final row.
- Pie charts maintain identical heights regardless of title length and legend text scales via container queries.
- Bar charts fill the entire grid column width without overflow, even on narrow cells.
- Existing automated suites and manual regression tests (report rendering, PDF export) pass with these class changes.

## Deployment Guidance
1. Validate CSS-only changes in a staging release (builds are quick and do not touch JS).
2. Monitor report rendering on smaller blocks to ensure the container queries behave as expected.
3. Rollback is simply a revert of `ReportChart.module.css` and `ReportChart.tsx` if a regression occurs.

## Reference Materials
- Historical execution notes (archived): `docs/archive/_archive/charts/archive-chart-alignment-history.md`.
- Architecture deep dive cited in the deployment checklist: `CHART_ALIGNMENT_FIXES_v12.md` (add link once revived).
