# Release Notes — v11.59.0

**Date:** 2026-02-21  
**Focus:** Style editor preview refresh (bar/pie colors), inject-on-change, Value Chain + Landing preview in style editor.

---

## Summary

The style editor (Admin → Styles → [style]) preview now updates **immediately** when any style field changes. Bar and pie chart colors in the report and in the preview use CSS variables so they stay in sync with the edited style. The style editor preview also includes a **Value Chain** block and a **Landing page** section so admins can see how the style looks on the main page without leaving the editor.

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

## Upgrade notes

- No migration or config changes. Version bump to 11.59.0 in `package.json`, README, and docs that display version.
