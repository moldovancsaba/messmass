# Report Theme, Brand Styles & Visual Badge Guide
Status: Active
Last Updated: 2026-11-20T16:00:00.000Z
Canonical: Yes
Owner: Design System / Frontend
Version: 12.5.0

## 1. Dynamic Brand Styles (`useReportStyle`)

Reports and visualization editors dynamically load brand theme definitions from the `report_styles` collection via the `useReportStyle` hook.

When a style is loaded, it injects a `<style id="report-custom-style">` block directly into the document `<head>` exposing CSS custom properties:

```css
:root {
  --primary: #fc005a;                  /* Brand Primary */
  --secondary: #1e293b;                /* Brand Secondary */
  --kpiIconColor: #fc005a;             /* KPI Badge Icon Tint */
  --kpiIconBadgeBackground: rgba(252, 0, 90, 0.08); /* Subtle Badge Pill */
  --chartTooltipBackground: #0f172a;   /* Tooltip Dark Slate */
  --chartTooltipText: #ffffff;
  --pieColor1: #fc005a;                /* Multi-slice pie palette */
  --pieColor2: #1e293b;
  --pieColor3: #3b82f6;
  --pieColor4: #10b981;
  --pieColor5: #f59e0b;
  --pieColor6: #8b5cf6;
}
```

## 2. KPI Card Anatomy & Material Icons

KPI cards adhere to a strict 3-row layout:

```
┌───────────────────────────────────────────────┐
│ Metric Title                [ Icon Badge ]    │  <-- Header Row
│                                               │
│ 791 (or 67.02%)                               │  <-- Hero Tabular Numeral
└───────────────────────────────────────────────┘
```

- **Title (`.kpiTitle`)**: Clean, sentence-cased label with `preventPhraseBreaks` to eliminate awkward line wraps.
- **Icon Badge (`.kpiIconBadge`)**: Fixed dimensions (`34px x 34px` desktop, `42px x 42px` mixed row), soft border-radius (`9px`), and 8% brand tint background.
- **Material Icon (`.kpiIcon`)**: Google Material Symbols Outlined or Rounded (e.g., `ads_click`, `campaign`, `shopping_bag`, `savings`, `people`, `visibility`).
- **Hero Numeral (`.kpiValueRow`)**: Large, bold tabular digits (`clamp(1.75rem, 2.3vw, 2.25rem)`, `font-weight: 700`, `letter-spacing: -0.03em`).

## 3. Donut & Multi-Slice Palettes

For pie/donut charts:
- 2 slices: Uses `--primary` and `--secondary`.
- 3 to 6 slices: Uses custom properties `--pieColor1` through `--pieColor6`, falling back to accessible multi-slice palette ramps to prevent color collisions.
- Dominant percentage callout is centered inside the donut cutout (72% inner radius).
