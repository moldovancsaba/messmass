# Layout Grammar Audit — Full Codebase

**Status:** Remediated (report rendering)  
**Date:** 2026-02-05  
**Scope:** Report rendering (Layout Grammar strict) + Admin/global UI (design consistency)  
**Reference:** [docs/design/LAYOUT_GRAMMAR.md](../../design/LAYOUT_GRAMMAR.md)

**Remediation (2026-02-05):** Report-rendering defects §2.1–2.5 and §7 (fix order 1–6) were fixed: `.chart` root, `.textContentWrapper`, `.textContent`, `.textMarkdown`, `.textMarkdown pre`, `.kpiValueRow`, `.bodyZone` (CellWrapper), TextChart `.content`, and mobile `.chart:not(.image)` / `.pieTitleRow` now use `overflow: visible` so content is never clipped. Bar track (532), image (1046), and mobile `.image` (1287) left as-is (decorative/rounded-corners). Build passes.

---

## 1. Rules Summary

| Rule | Forbidden | Allowed (per spec) |
|------|-----------|---------------------|
| **No scrolling** | `overflow: scroll`, `overflow: auto` on content layers | Modal/sidebar scroll for chrome; not report content |
| **No truncation** | `text-overflow: ellipsis`, `line-clamp` on **content** | Title/subtitle: max 2 lines (`-webkit-line-clamp: 2`) for structural fit |
| **No clipping** | `overflow: hidden` on **content** layers | Decorative/mask containers (e.g. bar track shape, image rounded corners) |

**Content layer** = any container that wraps user-visible text, chart data, or images that must be fully visible.  
**Decorative** = container used only for shape/clip (e.g. rounded bar track); the “content” inside is still fully visible by design.

---

## 2. Report Rendering — Defects (Layout Grammar)

These violate the strict “no scroll, no truncation, no clipping on content” policy for reports.

### 2.1 Clipping risk on content containers

| # | File | Line | Selector / context | Issue | Recommendation |
|---|------|------|--------------------|--------|----------------|
| 1 | `app/report/[slug]/ReportChart.module.css` | 23 | `.chart` | `overflow: hidden` on root chart container. Any content that doesn’t fit (e.g. text, table) is clipped. | Remove or restrict to non-content (e.g. border-radius clip only). Prefer letting content determine height or use `overflow: visible` and ensure height is resolved by block calculator. |
| 2 | `app/report/[slug]/ReportChart.module.css` | 626 | `.textContentWrapper` | `overflow: hidden` on text content wrapper. Multi-line or long content can be clipped. | Rely on font-size reduction and wrapping; use `overflow: visible` and ensure parent height is explicit so content reflows. |
| 3 | `app/report/[slug]/ReportChart.module.css` | 654 | `.textContent` | `overflow: hidden` on markdown content container. Content can be clipped. | Same as above: `overflow: visible`, fit via height + font scaling. |
| 4 | `app/report/[slug]/ReportChart.module.css` | 829 | `.textMarkdown` | `overflow: hidden` on markdown root. Clips overflow. | Same as above. |
| 5 | `app/report/[slug]/ReportChart.module.css` | 900 | `.textMarkdown pre` | `overflow: hidden` on code block. Long lines are wrapped (good) but excess vertical content can still be clipped. | Consider `overflow: visible` and ensure block height or font size accommodates; or document as “code block max height” and treat as aggregation/split. |
| 6 | `components/CellWrapper.module.css` | 92 | `.bodyZone` | `overflow: hidden` on body zone that wraps chart content. Can clip chart body. | Use `overflow: visible`; height must be set by layout so content fits without clipping. |
| 7 | `components/charts/TextChart.module.css` | 62 | `.content` | `overflow: hidden !important` on text chart content area. Clips overflow. | Use `overflow: visible`; rely on measured height and font scaling so content fits. |

### 2.2 Title/subtitle — allowed with caveat

- **Allowed:** `-webkit-line-clamp: 2` and matching `overflow: hidden` on **title/subtitle only** (Layout Grammar permits 2-line structural fit).
- **Locations:**  
  - `ReportChart.module.css`: `.kpi .kpiTitle > *` (222–223), `.textTitleText` (603–604)  
  - `CellWrapper.module.css`: title/subtitle zones use `overflow: hidden` without ellipsis; no line-clamp in CellWrapper — **OK** if title height is fixed and text wraps.

### 2.3 KPI value row

| # | File | Line | Issue | Recommendation |
|---|------|------|--------|----------------|
| 8 | `app/report/[slug]/ReportChart.module.css` | 178–180 | `.kpiValueRow`: `overflow: hidden !important`. Value is content; if it wraps to multiple lines it can be clipped. | Prefer `overflow: visible` and ensure row height (e.g. 30% of KPI grid) is sufficient; rely on font scaling and wrapping so value fits. |

### 2.4 Bar track

| # | File | Line | Issue | Recommendation |
|---|------|------|--------|----------------|
| 9 | `app/report/[slug]/ReportChart.module.css` | 532 | `.barTrack`: `overflow: hidden`. Used for rounded bar shape. Fill is the only “content” and is fully inside the track. | **Review:** Can be considered decorative (shape only). If bar fill can ever extend outside the track, treat as defect and ensure layout prevents it instead of clipping. |

### 2.5 Image and mobile

| # | File | Line | Issue | Recommendation |
|---|------|------|--------|----------------|
| 10 | `app/report/[slug]/ReportChart.module.css` | 1046 | Image chart: `overflow: hidden !important` for “clip image to rounded corners”. | **Review:** If this only applies to border-radius and the image is otherwise fully visible (e.g. `object-fit: contain`), acceptable as decorative. If it clips image content, use a wrapper for radius only and keep image container `overflow: visible`. |
| 11 | `app/report/[slug]/ReportChart.module.css` | 1213, 1234, 1287 | Mobile chart/table/pie overrides: `overflow: hidden`. | Same rules as desktop: no clipping on content. Prefer `overflow: visible` for content containers; use explicit heights and scaling. |

### 2.6 Base chart container (repeated)

- `.chart` (line 23) is the single most impactful defect: it wraps all chart types. Fixing it may require verifying that no chart type relies on this to hide overflow; then remove or replace with a non-clipping approach.

---

## 3. Report Rendering — Allowed or Decorative

- **PIE:** `.pieChartContainer` and legend use `overflow: visible` (P1 1.6) — **compliant.**
- **BAR labels:** `.barLabelCell` uses `overflow: visible` — **compliant.**
- **TABLE:** `.tableContent` / `.tableMarkdown` have no overflow hidden on content — **compliant.**

---

## 4. Admin & Global UI — Design Defects (Not Layout Grammar)

These are general UI issues: scrolling or truncation that may be acceptable in admin but should be consistent and intentional.

### 4.1 Truncation (`text-overflow: ellipsis`)

| # | File | Line | Context | Recommendation |
|---|------|------|---------|-----------------|
| A1 | `app/globals.css` | 1329–1330 | Table cell / generic | Long text truncated with ellipsis. | Confirm scope (admin tables vs report). If used in report tables, remove; if admin-only, document as intentional. |
| A2 | `components/TopHeader.module.css` | 51–52 | Welcome / header text | Ellipsis truncation. | Acceptable for fixed header; ensure critical info is not lost (e.g. tooltip or expand). |
| A3 | `components/ProjectSelector.module.css` | 132–133 | Project name in selector | Ellipsis. | Consider wrap or tooltip for full name. |
| A4 | `components/PartnerSelector.module.css` | 139–140 | Partner name | Ellipsis. | Same as A3. |
| A5 | `components/NotificationPanel.module.css` | 157–158 | Notification text | Ellipsis. | Consider 2-line clamp or “see more” for long messages. |

### 4.2 Scrolling (`overflow: auto` / `overflow-x` / `overflow-y`)

| # | File | Line | Context | Recommendation |
|---|------|------|---------|-----------------|
| B1 | `app/globals.css` | 774 | `.table-overflow-hidden` (or table wrapper) | `overflow-x: auto`. | Table scroll is common in admin; document as intentional. Ensure no report table uses this class. |
| B2 | `app/admin/analytics/executive/ExecutiveDashboard.module.css` | 123 | `.eventsTable` | `overflow-x: auto`. | Intentional for wide tables. OK. |
| B3 | `app/admin/analytics/executive/ExecutiveDashboard.module.css` | 172 | `.insightsFeed` | `overflow-y: auto`, `max-height: 600px`. | Intentional feed scroll. OK. |
| B4 | `app/admin/clicker-manager/page.tsx` | 947 | Variable list container | `max-h-300 overflow-y-auto`. | Intentional list scroll. OK. |
| B5 | `components/UnifiedListView.module.css` | 11 | List view | `overflow-x: auto`. | Ensure only admin lists; not report content. |
| B6 | `components/ChartAlgorithmManager.tsx` | 1917 | Internal panel | `overflow-y: auto`. | Admin UI. OK. |
| B7 | Modals (BaseModal, FormModal, SharePopup, etc.) | various | Modal body | `overflow-y: auto`. | Standard pattern for long modal content. OK. |
| B8 | Sidebar, ProjectSelector, PartnerSelector, etc. | various | Dropdowns/panels | `overflow-y: auto`. | Standard. OK. |

### 4.3 Admin visualization page — inline style

| # | File | Line | Issue | Recommendation |
|---|------|------|--------|----------------|
| C1 | `app/admin/visualization/page.tsx` | 2117 | Inline style for `.chart-legend` in preview: `overflow: hidden`. | Preview is authoring UI; if this affects report export or shared component, align with Layout Grammar (legend content visible). Otherwise document as preview-only. |

### 4.4 Other admin overflow

- `app/admin/visualization/Visualization.module.css` (62, 97): `overflow: hidden` on layout containers — review whether they wrap content that could be clipped.
- `app/admin/events/ProjectsPageClient.tsx` (632), `app/admin/bitly/page.tsx` (878): `table-overflow-hidden` — same as B1.

---

## 5. Guardrail Script

- **Script:** `scripts/check-layout-grammar-guardrail.ts`
- **Behavior:** Scans only `app/report`, `components/charts`, `components/CellWrapper` for forbidden patterns. It **passes** currently because it skips lines that are only comments; patterns that appear on the same line as code (e.g. `overflow: hidden !important; /* comment */`) are still present and are defects per this audit.
- **Recommendation:** Update the guardrail to detect these patterns even when a comment exists on the same line, or add explicit allow-list comments (e.g. `/* Layout Grammar: decorative */`) and treat everything else as a violation.

---

## 6. Summary Counts

| Category | Count |
|----------|--------|
| **Report — defects (fix recommended)** | 11 (including 1 bar/image review) |
| **Report — allowed (title/subtitle or decorative)** | Documented in §2.2, §2.4, §2.5, §3 |
| **Admin/global — truncation** | 5 |
| **Admin/global — scroll** | 8 (most intentional) |
| **Admin/global — other** | 1 (visualization inline style) |

---

## 7. Recommended Fix Order (Report)

1. **`.chart`** (`ReportChart.module.css` line 23) — remove or narrow `overflow: hidden` so the root chart container does not clip content.
2. **Text chart content** — `.textContentWrapper`, `.textContent`, `.textMarkdown` (626, 654, 829): switch to `overflow: visible` and ensure height + font scaling guarantee fit.
3. **`.bodyZone`** (`CellWrapper.module.css` 92) — `overflow: visible`; rely on explicit height from layout.
4. **TextChart.module.css** `.content` (62) — `overflow: visible`; rely on measured height and font scaling.
5. **`.kpiValueRow`** (180) — `overflow: visible` and ensure row height and font scaling for multi-line values.
6. **Mobile overrides** (1213, 1234, 1287) — align with desktop: no clipping on content.
7. **Code block** `.textMarkdown pre` (900) — decide: visible overflow with height/font rules, or document as constrained and add aggregation/split for very long code.
8. **Bar track / image** (532, 1046) — confirm decorative-only; if not, fix layout so no content is clipped.

---

*Layout Grammar Audit 2026-02-05 — Full codebase scan. Update this document when defects are remediated.*
