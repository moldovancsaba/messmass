# Release Notes — v11.59.0

**Date:** 2026-02-21 (style editor); 2026-02-24 (Builder mode)  
**Focus:** Style editor preview refresh (bar/pie colors), inject-on-change, Value Chain + Landing preview; Builder mode (clicker) variable inputs for all chart types.

---

## Summary

The style editor (Admin → Styles → [style]) preview now updates **immediately** when any style field changes. Bar and pie chart colors in the report and in the preview use CSS variables so they stay in sync with the edited style. The style editor preview also includes a **Value Chain** block and a **Landing page** section so admins can see how the style looks on the main page without leaving the editor.

**Builder mode (clicker):** On the event edit page (`/edit/[slug]`), Builder mode now shows **one input per variable** for every chart type. Variables are extracted from each chart’s element formulas via `extractVariablesFromFormula()` (stats-only; PARAM/MEDIA-style tokens skipped), deduplicated, and rendered as inputs so users can fill all data that feeds the report. Value chain is supported; text chart empty-input bug fixed; card-style layout and Material Icons applied across all chart builders.

---

## New in this release

### 1. Style editor preview refresh (bar and pie)

- **Bar charts:** Report bar colors now use CSS variables (`--barColor1` … `--barColor5`) per bar. The style editor injects these; changing bar colors in the editor updates the live preview and the report immediately.
- **Pie charts:** Pie legend dots in the report and in the style preview use `var(--pieColor1)`, `var(--pieColor2)` (and theme fallbacks) instead of resolved colors, so they stay in sync when the style changes.

### 2. Inject style on change and after fetch

- **On change:** When a field is edited, the editor builds the next style object, calls `injectStyleAsCSS(next)`, then updates state so the preview reflects the change in the same interaction (no wait for useEffect).
- **After fetch:** When the style is loaded from the API, the editor merges with defaults, then sets state and calls `injectStyleAsCSS(merged)` so the first paint shows the loaded style. A `useEffect([style])` keeps the document in sync and cleans up on unmount.

### 3. Value Chain and Landing preview in style editor

- **Value Chain block:** The style editor preview shows a Value Chain–style block (icon, title row, description row) using `--kpiIconColor`, `--chartTitleColor`, `--chartLabelColor`.
- **Landing page section:** A "Landing page" section below the report preview shows hero strip (gradient + title + subtitle), value cards, and a pricing-style card using the same CSS variables as the real landing (`--landingHeroBgStart`, `--chartBackground`, `--cardBorderRadius`, `--cardShadow`, etc.).

---

## Technical details

- **Style editor:** `app/admin/styles/[id]/page.tsx` — handleChange injects next style before setState; after fetch, merged style is set and injected; useEffect(style) injects/removes.
- **Report bar:** `app/report/[slug]/ReportChart.tsx` — bar track uses `--bar-color: var(--barColorN)`; pie legend uses `--dot-color` / `--dot-border-color` with `var(--pieColorN)`.
- **Preview component:** `components/ReportStylePreview.tsx` — Value Chain block; Landing preview block; pie legend uses CSS vars.
- **Preview CSS:** `components/ReportStylePreview.module.css` — value chain and landing preview classes using theme/style variables.

---

## 4. Builder mode (clicker) — variable inputs (2026-02-24)

- **All chart types** (KPI, Bar, Pie, Text, Table, Image, Value chain) now derive variables from element formulas, deduplicate, and show **one input per variable** in the Builder card.
- **Value chain** is supported (no more "Unknown chart type: valuechain"); dedicated `ChartBuilderValueChain` with number/textarea per variable.
- **Text/Table/Image:** One textarea or uploader per variable; text chart shows current content and is editable; table and image builders use the same variable-extraction pattern.
- **Card style and icons:** All builders use consistent card layout and Material Icons in the header.
- **Technical:** `lib/formulaEngine.ts` — `extractVariablesFromFormula()`; components: `BuilderMode.tsx`, `ChartBuilderKPI`, `ChartBuilderBar`, `ChartBuilderPie`, `ChartBuilderText`, `ChartBuilderTable`, `ChartBuilderImage`, `ChartBuilderValueChain`. Plan: `docs/plan-builder-mode-variable-inputs.md`.

---

## Upgrade notes

- No migration or config changes. Version bump to 11.59.0 in `package.json`, README, and docs that display version.
