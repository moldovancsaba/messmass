# Landing / Main Page UI Refactor Plan

**Goal:** Unify the main page (messmass.com) with web UI standards, consistent block widths and implementation, and the existing report design language (responsiveness/scale). Use the [report style system](https://www.messmass.com/admin/styles/6999bbd2680bbfd7dec08b1e) as the single source of visual language; extend the global UI library only where elements are missing so future landing variants stay consistent.

**Implementation status:** Phases 1–5 delivered. Epic and phase issues tracked on [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1) (mvp-factory-control #248, #249–#253).

---

## 1. Current State (Problems)

### 1.1 Fragmented widths and layout
- **Hero:** `.hero` + `.heroInner` with separate padding (24/32/48px) and `max-width: 1200px`.
- **Sections:** `.section` / `.sectionAlt` with own padding; `.sectionInner` again `max-width: 1200px` with duplicate padding rules.
- **Report block:** Wrapped in `.mmContainer` (1200px + padding); inner report grid uses `report-page.module.css` `.container` (1600px, 90% width) and `ReportContent` row/cell layout.
- **Pricing / FAQ / Contact / Footer:** Each uses `.sectionInner` (1200px) but with different inner structures (grids, lists, form).
- **Result:** No single “content width” contract; hero, sections, and report block can drift (1200 vs 1600, different padding).

### 1.2 Style system not applied on landing
- **Report pages** use `useReportStyle(styleId)` which fetches a report style and injects 26 CSS variables (`--chartBackground`, `--chartBorder`, `--chartTitleColor`, `--reportFontFamily`, etc.) via `injectStyleAsCSS()`.
- **Landing (static path)** does not load a report style; it uses only `page.module.css` and local tokens (e.g. `--landing-hero-bg-start`, `--mm-*`). The style edited at [admin/styles/:id](https://www.messmass.com/admin/styles/6999bbd2680bbfd7dec08b1e) does not drive the main page.
- **Static snapshot** does not include `styleId` or embedded `style`; `setLandingStaticSnapshot()` only sends blocks, chartResults, gridSettings, projectStats.

### 1.3 Duplicate and ad‑hoc tokens
- Landing defines its own tokens in `.landing` (`--landing-hero-*`, `--landing-section-inner-max`, `--landing-card-min`, etc.) instead of reusing theme + report style variables.
- Cards (pricing, value, how-it-works) use a mix of `--mm-*` and local classes; report chart cards use `--chartBackground`, `--chartBorder`, etc. No single “card” contract for background/border/radius.

### 1.4 Inconsistent responsiveness
- Report content uses Layout Grammar (row height, container queries, shrink-to-fit) and design tokens from `theme.css` (e.g. `--mm-block-height-*`, `--mm-report-kpi-*`).
- Landing sections use ad‑hoc breakpoints and fixed px in places; not all blocks scale from the same system.

---

## 2. Design Principles (Target)

1. **Single content width:** One token (e.g. `--mm-content-max-width`) and one container pattern for all sections (hero, report block, pricing, FAQ, contact, footer).
2. **Report style = landing style:** The same report style (e.g. style id `6999bbd2680bbfd7dec08b1e`) that defines report page look and feel also drives the main page (colors, font, card surfaces).
3. **Shared layout primitives:** Use the same container, section spacing, and card semantics as report/theme so that new landing variants or new styles don’t fragment.
4. **Extend, don’t duplicate:** If the design system is missing a token or component (e.g. “section title”, “marketing card”), add it to the global theme or shared layout/UI so both report and landing (and future pages) can use it.

---

## 3. Proposed Architecture

### 3.1 Global content width and section layout

- **Add to `app/styles/theme.css` (or a dedicated layout tokens file):**
  - `--mm-content-max-width: 1200px` (or 1400px if product decision; keep one value).
  - `--mm-content-padding-x: 24px` with media queries via a small set of custom properties or a single utility class so padding is consistent (e.g. 24 → 32 → 48 at 768 / 1024).
- **Define one container class** used by both report and landing:
  - e.g. `.mmContent` or reuse `.mmContainer` with rules that reference `--mm-content-max-width` and `--mm-content-padding-x`.
- **Report page:** Use this same container (or a report-specific wrapper that sets `max-width: var(--mm-content-max-width)` and same horizontal padding) so report and landing share the same “content column”.

### 3.2 Apply report style to landing

- **Static landing (snapshot):**
  - **Option A (recommended):** Extend `StaticLandingSnapshot` to include `styleId?: string`. When generating the snapshot in `landing-static-generate`, read the report’s style (from template or project) and store `styleId` in the snapshot. On the client, when rendering `LandingPageStatic`, call `useReportStyle({ styleId: snapshot.styleId })` so the same 26 variables are applied.
  - **Option B:** Embed a serialized style object in the snapshot (e.g. `style: Record<string, string>`) and inject it on the client via a small helper that sets the same CSS variables as `injectStyleAsCSS`. Keeps landing working even if the style is later deleted; tradeoff is duplication and possible drift.
- **Live landing (no snapshot):** Already uses report layout and can use `useReportStyle(report.styleId)` (already in place for `LandingPageLive`).
- **Result:** The style edited at `/admin/styles/6999bbd2680bbfd7dec08b1e` (or the one attached to the landing report) drives both the report page and the main page.

### 3.3 Unify section structure

- **Sections:** Every major section (hero, report content, pricing, FAQ, contact, footer) should share:
  - One outer wrapper (e.g. `<section>` with a shared class like `landingSection` or reuse report’s section semantics).
  - One inner container: the shared content-width class (e.g. `.mmContent` / `.mmContainer`) so all blocks share the same width and horizontal padding.
- **Hero:** Structure as: hero section → shared container → hero content (brand, title, CTAs). Remove duplicate padding (hero + heroInner); use one container and section padding tokens.
- **Pricing / FAQ / Contact:** Use the same container; only the inner layout (grid, list, form) differs. No separate `sectionInner` with its own max-width.

### 3.4 Cards and surfaces

- **Report chart cards** already use `--chartBackground`, `--chartBorder` from the report style.
- **Landing cards** (pricing, value, how-it-works, FAQ) should use the same variables where possible:
  - Background: `var(--chartBackground, var(--mm-white))`
  - Border: `var(--chartBorder, var(--mm-gray-200))`
  - Border-radius: from theme (e.g. `var(--mm-radius-lg)` or `14px` as in current spec).
- **If a semantic token is missing** (e.g. “marketing card background” vs “chart card background”), add a single token in `theme.css` or report style and use it everywhere so one style change updates both report and landing.

### 3.5 Typography and section headings

- **Section titles** (e.g. “Pricing”, “Faq”, “Get in touch”): Already use Pacifico via `.sectionTitle` and `.contactTitle`. Ensure they also use a token that can be overridden by report style if desired (e.g. `--chartTitleColor` or a new `--sectionHeadingColor`). If the report style only has `chartTitleColor`, use that for section headings so one style controls both.
- **Body and small text:** Use theme tokens (`--mm-font-size-*`, `--mm-gray-*`) and, where it makes sense, report style (e.g. `--chartLabelColor`, `--textColor`) so the style system controls readability.

### 3.6 Responsiveness and scale

- **Report content:** Keep existing Layout Grammar and container-query based scaling (e.g. `cqw` for font-size, shrink-to-fit) so report blocks remain the reference for “responsive and scaling”.
- **Landing sections:** Use the same breakpoints and spacing scale as theme (`--mm-space-*`, `--mm-content-padding-x`) and avoid new magic numbers. Where landing has “cards” (pricing, value), use the same grid strategy as report (e.g. min-width + fr, or same grid units) so behaviour is predictable.

---

## 4. Implementation Phases

### Phase 1: Global tokens and one container (no behaviour change to report)
- Add `--mm-content-max-width` and `--mm-content-padding-x` (and optional responsive overrides) to `theme.css`.
- Introduce or standardise one class (e.g. `.mmContent`) that uses these tokens.
- Refactor **landing only** so hero, sections, pricing, FAQ, contact, footer all use this single container class and remove duplicate max-width/padding from `.heroInner`, `.sectionInner`, `.mmContainer` (merge into one pattern).
- **Deliverable:** Landing has one content width and one padding system; report page unchanged.

### Phase 2: Report style on static landing
- Extend `StaticLandingSnapshot` with `styleId?: string`.
- In `app/api/admin/landing-static-generate/route.ts`, resolve the report’s style (from template or project) and pass `styleId` into `setLandingStaticSnapshot({ ..., styleId })`.
- In `LandingPage.tsx` (static branch), read `snapshot.styleId` and call `useReportStyle({ styleId: snapshot.styleId })` so the 26 variables are applied.
- **Deliverable:** After “Update” in admin, the main page uses the same style as the report (e.g. style `6999bbd2680bbfd7dec08b1e`).

### Phase 3: Surfaces and cards use style variables
- Replace landing card background/border in `page.module.css` with `var(--chartBackground)`, `var(--chartBorder)` (with fallbacks to `--mm-*`).
- Optionally add a single “section heading” variable (e.g. reuse `--chartTitleColor` or add `--sectionHeadingColor` in report style) and use it for “Pricing”, “Faq”, “Get in touch” so the style system controls them.
- **Deliverable:** Changing the report style in admin changes both report and landing card/heading look.

### Phase 4: Align report page container with landing (optional)
- If report page currently uses a different width (e.g. 1600px in `.container`), decide product-wise whether report and landing should share the same max-width. If yes, make report content wrapper use `--mm-content-max-width` and same padding so both pages share one layout contract.
- **Deliverable:** One content width and one padding system across report and landing.

### Phase 5: Document and add missing UI primitives
- List any remaining landing-only patterns (e.g. FAQ list, pricing grid). For each, either:
  - Map to existing theme/report tokens and classes, or
  - Add a single primitive to the global UI (e.g. in `theme.css` or a shared `layout.css` / components) and use it on the landing so future landing or style variants reuse it.
- Update this plan or a “Landing & report design system” doc so future changes stay unified.

---

## 5. Files to Touch (Summary)

| Area | Files |
|------|--------|
| Theme / tokens | `app/styles/theme.css` |
| Layout utilities | `app/styles/layout.css` and/or `app/page.module.css` (landing container) |
| Snapshot type & API | `lib/landingSettings.ts`, `app/api/admin/landing-static-generate/route.ts` |
| Landing component | `components/LandingPage.tsx` (useReportStyle for static, container class) |
| Landing CSS | `app/page.module.css` (single container, use style variables for cards/headings) |
| Report page (optional) | `app/styles/report-page.module.css`, `app/report/[slug]/page.tsx` (container width) |
| Docs | This plan, and optionally `docs/features/features-landing-main-page.md` |

---

## 6. Shared UI primitives (Phase 5)

After the refactor, landing and report share these; use them for any new landing or style variant so the UI stays unified.

| Primitive | Where | Use |
|-----------|--------|-----|
| **Content width** | `theme.css`: `--mm-content-max-width`, `--mm-content-padding-x`, `-x-md`, `-x-lg` | One column for all sections; report `.container` and landing `.mmContainer` / `.heroInner` / `.sectionInner` / `.footerInner` use these. |
| **Section vertical rhythm** | Landing: `.mmSection` or `.section` / `.sectionAlt` (56/80px padding) | Use `--mm-space-*` or the same padding scale for new sections. |
| **Card surface** | Report style: `--chartBackground`, `--chartBorder` | Chart cards and landing cards (pricing, value, how-it-works); theme fallbacks: `--mm-white`, `--mm-gray-200`. |
| **Section heading color** | Report style: `--chartTitleColor` | Section titles (Pricing, Faq, Get in touch); fallback `--mm-gray-900`. |
| **Typography scale** | `theme.css`: `--mm-font-size-*`, `--mm-font-weight-*`, `--mm-line-height-*` | Body, labels, small text; report style adds `--reportFontFamily`, `--chartLabelColor`, `--chartValueColor`, `--textColor` when applied. |

**Adding a new primitive:** Define it in `theme.css` (global) or in the report style schema if it is style-specific; then use it in both landing and report so one change updates both.

---

## 7. Success Criteria

- All main page blocks (hero, report block, pricing, FAQ, contact, footer) use the same content width and the same horizontal padding rules.
- The report style selected for the landing report (e.g. [admin/styles/6999bbd2680bbfd7dec08b1e](https://www.messmass.com/admin/styles/6999bbd2680bbfd7dec08b1e)) drives the main page (colors, font, card surfaces) for both static and live landing.
- No duplicated layout or color tokens between landing and report; new tokens are added to the global theme or report style and reused.
- Future landing or style changes can be made in one place (theme, report style, or shared layout) without fragmenting the UI.

---

## 8. References

- Report style system: `lib/reportStyleTypes.ts` (26 colors, `injectStyleAsCSS`), `hooks/useReportStyle.ts`
- Report page layout: `app/styles/report-page.module.css`, `app/report/[slug]/page.tsx`, `app/report/[slug]/ReportContent.tsx`
- Theme tokens: `app/styles/theme.css` (e.g. `--mm-*`, `--chart*` defaults)
- Landing snapshot: `lib/landingSettings.ts` (`StaticLandingSnapshot`), `app/api/admin/landing-static-generate/route.ts`
- Admin style editor: `app/admin/styles/[id]/page.tsx` (style id in URL, e.g. `6999bbd2680bbfd7dec08b1e`)
