# Charts & Visualizations Catalog
Status: Active
Last Updated: 2026-11-20T16:00:00.000Z
Canonical: Yes
Owner: Frontend / Architecture
Version: 12.7.0

## Purpose

This document serves as the authoritative source of truth for all chart types supported across {messmass} report templates, visualization blocks, and administrative dashboards.

## Supported Chart Types

| Type | Name | Purpose | Anatomy & Layout Rules | Configuration Key |
|---|---|---|---|---|
| `kpi` | **KPI Metric Card** | Single prominent hero metric | Top-left title, top-right icon badge (brand tint), bottom-left bold tabular numeral (`clamp(1.75rem, 2.3vw, 2.25rem)`). | `chartId`, `title`, `formula`, `icon`, `iconVariant`, `formatting` |
| `pie` | **Donut Chart** | Circular 2-to-6 slice distribution | Cutout 72% donut chart, centered dominant percentage callout, bottom/right dot legend with percentages. | `chartId`, `title`, `elements[]`, `showPercentages` |
| `bar` | **Horizontal Bar Chart** | Ranked comparison (1 to 7 items) | Vertical stack of horizontal bars: label, filled track with brand color ramp, and value/percentage callout. | `chartId`, `title`, `elements[]` |
| `text` | **Editorial Text Slot** | Rich narrative / explanations | Header title with markdown body (headings, bold, lists, links) rendered via `parseMarkdown` and sanitized. | `chartId`, `title`, `formula` (points to `reportText1..N`) |
| `image` | **Media Image Slot** | Sponsor banners & photos | Aspect-ratio aware container (`1:1`, `16:9`, `9:16`) with click-to-open `ImageLightboxModal`. | `chartId`, `aspectRatio`, `formula` (points to `reportImage1..N`) |
| `table` | **Data Table** | Multi-dimensional tabular stats | Clean table rows with headers, alternating row striping, and numeric alignment. | `chartId`, `title`, `elements[]` |
| `value` | **Value Composite** | Combined KPI + Bar breakdown | Renders a KPI hero metric card directly alongside an itemized horizontal bar distribution. | `chartId`, `title`, `formula`, `elements[]` |
| `valuechain` | **Executive Summary Card** | Structured title + narrative | Top row title with right-aligned icon badge, followed by a multiline descriptive text callout. | `chartId`, `elements[]` (element 0 = title, element 1 = description) |

## Related Specifications

- [`charts-formula-engine-specification.md`](charts-formula-engine-specification.md): Formula syntax, arithmetic evaluation, and variable resolution.
- [`charts-theme-and-styling-guide.md`](charts-theme-and-styling-guide.md): Brand color tokens, dynamic CSS variables, and Material Icons.
- [`charts-layout-v2-grid-system.md`](charts-layout-v2-grid-system.md): Editorial 6-unit grid, coalescing, and responsive breakpoints.
- [`charts-table-chart-usage-guide.md`](charts-table-chart-usage-guide.md): Configuration and data binding for table charts.
