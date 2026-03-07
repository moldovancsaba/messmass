# Release Notes — v11.58.0

**Date:** 2026-02-21  
**Focus:** Style editor drives all landing page visuals (colors + dimensions).

---

## Summary

The MessMass style editor (Admin → Styles → [style]) now controls **all** landing page visuals: colors (hero, footer, page background) and dimensions (section/hero padding, card sizes, border radius, shadow, landing block typography). When a style is applied to the landing report (via static snapshot or live), the main page and report blocks use these values with theme fallbacks.

---

## New in this release

### 1. Landing colors in the style editor (9 fields)

- **Landing** category in the style editor:
  - Landing hero gradient (start, mid, end)
  - Landing hero text, muted text
  - Landing hero CTA border, border hover, text hover
  - Landing page background

Values are stored with the style and injected as CSS variables (e.g. `--landingHeroBgStart`). Landing CSS uses `var(--landingHeroBgStart, var(--mm-landing-hero-bg-start))` so the style overrides the theme when set.

### 2. Dimensions & surfaces in the style editor (13 fields)

New **Dimensions & surfaces** section in the style editor:

- **Landing dimensions:** Section padding (vertical, large screens), hero padding (min/max), landing card min width, landing card min wide, FAQ max width, paragraph max width, landing card icon size.
- **Surfaces:** Card border radius, card shadow (used by landing cards and report chart cards).
- **Landing typography:** Landing block title size, landing block value size, landing block icon size (report block on main page).

All values are optional; defaults match `theme.css`. When set, they are injected as CSS variables (e.g. `--sectionPaddingY`, `--cardBorderRadius`, `--landingBlockBaseFontSize`) and used by landing and report with theme fallbacks.

### 3. Documentation and standards

- **Landing feature doc:** `docs/features/features-landing-main-page.md` updated with v11.58.0 entry.
- **Refactor plan:** `docs/landing-main-page-ui-refactor-plan.md` §6 extended with "Style editor dimensions (v11.58.0)".
- **Coding standards:** Landing and public page styling rule already requires global tokens only; style editor is the single place to set them.

---

## Technical details

- **Types:** `lib/reportStyleTypes.ts` — `ReportStyle` gains optional dimension fields; `DIMENSION_FIELDS` and `DimensionFieldDefinition`; `injectStyleAsCSS` / `removeStyleCSS` handle dimension vars.
- **API:** `app/api/report-styles/route.ts` — POST/PUT persist dimension fields from request body; new styles get defaults from `DEFAULT_STYLE`.
- **Editor:** `app/admin/styles/[id]/page.tsx` — "Dimensions & surfaces" section with text inputs grouped by category.
- **Landing CSS:** `app/page.module.css` — section/hero padding, card radius/shadow, icon size, card min widths, FAQ/paragraph max widths use style vars with theme fallbacks.
- **Report landing block:** `app/styles/report-page.module.css` — `.landingReportWrap` uses `--landingBlockBaseFontSize`, `--landingBlockSubtitleFontSize`, `--landingMaxIconFont` with fallbacks.
- **Report chart cards:** `app/report/[slug]/ReportChart.module.css` — `.chart` uses `--cardBorderRadius` and `--cardShadow` with fallbacks so chart cards match style when set.

---

## Upgrade notes

- **Existing styles:** Load and save once in the style editor to add dimension defaults to the document; no migration required.
- **Version:** Bump to 11.58.0 in `package.json`, README, and docs that display version.
