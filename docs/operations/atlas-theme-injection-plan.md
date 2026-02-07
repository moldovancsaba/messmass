# Atlas-Managed Theme Injection Plan (OPS-STYLE-01 Phase 6)
Status: Planning
Last Updated: 2026-02-06
Canonical: Yes
Owner: Frontend / Design

**Purpose:** Document how theme variables could be injected or overridden from an external source (e.g. Atlas, API, or build) so the design system remains single-source while supporting multi-tenant or CMS-driven theming.

---

## Current state

- **Source of truth:** `app/styles/theme.css` defines `:root` CSS custom properties (`--mm-*`, `--z-*`, etc.).
- **Loading:** `app/globals.css` imports `theme.css` first; tokens are available globally.
- **Overrides today:** Page/partner styles can override chart and report tokens (e.g. `--chartBackground`) via inline style or class on a wrapper; see report styles and page-style system.

---

## Goal (Phase 6)

- **Prepare** for Atlas-managed theme injection: document options and prerequisites without committing to a specific implementation.
- **Keep** a single design system (theme.css) as baseline; injection would **override** or **supplement** tokens, not replace the file.

---

## Option A: Runtime injection (client)

- **How:** A script or layout component reads theme config (from API or `__NEXT_DATA__`) and sets CSS custom properties on `document.documentElement` (or a scope element).
- **Example:** `document.documentElement.style.setProperty('--mm-color-primary-500', theme.primary)`.
- **Pros:** No rebuild; instant switch per tenant or user.  
- **Cons:** Flash of default theme if config loads after first paint; need to decide where config lives (API, cookie, build-time embed).

---

## Option B: Build-time injection

- **How:** Build step (e.g. Node script or Next.js plugin) reads theme config (file or API) and generates a `theme-overrides.css` or replaces values in a generated theme file.
- **Pros:** No runtime cost; no FOUC.  
- **Cons:** One theme per build unless we build multiple bundles per tenant.

---

## Option C: Hybrid (baseline + runtime overrides)

- **How:** theme.css remains the baseline. A small runtime script or layout runs after hydration and applies overrides from API/cookie/Atlas to `:root`.
- **Pros:** Single codebase; theme.css stays canonical; overrides only where needed.  
- **Cons:** Same as Option A for FOUC if not careful (e.g. inline critical overrides in first HTML).

---

## Prerequisites (before implementation)

1. **Token contract:** Decide which tokens are overridable (e.g. colors, radii, shadows) vs fixed (e.g. z-index scale).
2. **Atlas schema:** If Atlas holds theme, define schema (e.g. `primary`, `secondary`, `fontFamily`) and mapping to `--mm-*` names.
3. **Scope:** Decide injection scope: global (`:root`) vs scoped (e.g. `[data-theme="partner-x"]`) for multi-tenant.
4. **Performance:** Avoid large inline style blocks; prefer a small set of overrides or a single generated override file.

---

## Recommended next steps

1. **Product/design:** Confirm which tokens must be tenant- or page-configurable.
2. **Engineering:** If Atlas is the source, add a “theme” or “branding” document/schema and an API or export that returns a flat key-value map of CSS variable names to values.
3. **Frontend:** Implement Option C (runtime overrides) with a single `<ThemeInjector>` or layout effect that runs once and applies overrides from props or API; ensure no FOUC (e.g. critical overrides in first paint if needed).

---

## References

- OPS-STYLE-01: `docs/operations/operations-action-plan.md`
- Theme: `app/styles/theme.css`
- Report/page style overrides: existing page-style and report-style systems in codebase.
