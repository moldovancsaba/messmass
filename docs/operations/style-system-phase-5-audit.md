# Style System Phase 5 – CSS Duplication Audit (OPS-STYLE-01)
Status: Active
Last Updated: 2026-02-06
Canonical: Yes
Owner: Frontend / Design

**Purpose:** Audit duplicated CSS and recommend consolidation. Phase 5 of OPS-STYLE-01.

---

## Current structure

| Layer | Path | Role |
|-------|------|------|
| Theme | `app/styles/theme.css` | Design tokens (colors, spacing, z-index, shadows, radii) |
| Utilities | `app/styles/utilities.css` | Reusable utility classes (padding, margin, z-index, etc.) |
| Components | `app/styles/components.css` | Global component styles (buttons, forms, dropdowns, etc.) |
| Layout | `app/styles/layout.css` | Page layout, grid, responsive |
| Admin | `app/styles/admin.css` | Admin dashboard typography and layout |
| Admin pages | `app/styles/admin-pages.module.css` | Admin error/warning boxes and shared patterns |
| Module CSS | 90+ `*.module.css` | Component-scoped styles |

---

## Duplication notes

1. **Admin hero / title**
   - `admin.css`: `.admin-title`, `.admin-subtitle`, `.admin-role`, etc.
   - Components: `AdminHero.module.css`, `UnifiedAdminHeroWithSearch`, `AdminPageHero`
   - **Recommendation:** Prefer one source (e.g. shared admin hero component + theme tokens). No immediate merge; track in future cleanup.

Related planning/execution: `docs/operations/operations-action-plan.md`.

2. **Error / warning boxes**
   - `admin-pages.module.css`: `.errorContainer`, `.warningBox`, `.warningText`, etc.
   - Similar patterns may exist in other admin page modules.
   - **Recommendation:** Keep in admin-pages.module.css as single shared module; ensure new admin pages use it.

3. **Modal / overlay patterns**
   - BaseModal, ConfirmDialog, FormModal, ImageLightbox, SharePopup each have overlay + content.
   - **Done in Phase 4:** z-index and modal layout tokens in theme.css; BaseModal and ImageLightbox use tokens.
   - **Recommendation:** Migrate remaining modal-like overlays to use `--mm-modal-*` and `--mm-z-*` tokens.

4. **Dropdown / popover z-index**
   - **Done in Phase 4:** Replaced hardcoded 1000 with `var(--z-dropdown)` in CSS and `.z-dropdown` utility in TSX where applicable.

---

## Consolidation recommendations

- **Short term:** No file merges required. Theme tokens (Phase 4) and this audit provide the baseline.
- **Medium term:** (1) New styles should use theme tokens and utilities. (2) When touching an admin page, prefer importing `admin-pages.module.css` for error/warning/empty states. (3) Prefer one Admin HERO component and deprecate duplicate hero CSS in admin.css.
- **Long term:** Consider merging small, single-purpose global CSS files into `components.css` or theme if they grow; keep module CSS per-component.

---

## ESLint guardrail (OPS-STYLE-01)

- **Rule:** `react/forbid-dom-props` forbids the `style` prop (`.eslintrc.js`).
- **Exception:** Dynamic values allowed with `// WHAT/WHY` comment. Use CSS modules or utility classes (e.g. `.z-dropdown`); prefer design tokens in CSS.

---

## References

- OPS-STYLE-01: `docs/operations/operations-action-plan.md`
- Theme tokens: `app/styles/theme.css`
- Utilities: `app/styles/utilities.css`
- ESLint: `.eslintrc.js` (forbid-dom-props)
