# Admin UI: Width and Hero Usage

**Status:** Active  
**Last updated:** 2026-02-06  
**Related:** OPS-ADMIN-02 (completed)

## 1. Single HERO source

- **Component:** `UnifiedAdminHeroWithSearch`  
- Use this hero for all admin list/dashboard pages that need a title, search, and optional view toggle.
- Do not introduce new hero variants; extend this component or its props if behavior needs to change.

## 2. Content surface and background

- **Token:** `--content-bg`  
  - Default: `var(--mm-gray-50)` (set in `app/styles/theme.css`).  
  - Can be overridden by Admin Design (Design Manager): `app/admin/layout.tsx` injects `--content-bg` when a style with `contentBackgroundColor` is selected.
- **Class:** `.content-surface`  
  - Defined in `app/styles/layout.css`.  
  - Sets `background: var(--content-bg)`.  
  - Applied to the main content area in `AdminLayout` (`<main className={... mainContent content-surface }>`).

## 3. Width and page container

- **Token:** `--mm-admin-content-max-width`  
  - Default: `1600px` (in `app/styles/theme.css`).  
  - Used by:
    - `AdminLayout` main content (`.mainContent`) and footer (`.footerContent`)
    - Any `.page-container` that sits **inside** `.content-surface` (so all admin pages using `.page-container` get the same max width as the main content)
- **Page wrapper:** Use `.page-container` for the outer wrapper of admin page content. Inside admin it automatically uses `--mm-admin-content-max-width`; outside admin it remains `1200px`.
- **Inner sections:** Page-level modules may use a smaller `max-width` (e.g. 900px, 1400px) for readability; when touching those pages, prefer the token or document the reason for a different width.

## 4. Summary

| Item              | Where                         | Purpose                          |
|-------------------|-------------------------------|----------------------------------|
| HERO              | `UnifiedAdminHeroWithSearch`  | Single source for admin heroes   |
| `--content-bg`    | theme + admin layout inject   | Main content background          |
| `.content-surface`| layout.css + AdminLayout main | Apply content background + width |
| `--mm-admin-content-max-width` | theme + layout + AdminLayout | Consistent admin content width   |
| `.page-container` | layout.css (inside .content-surface) | Page wrapper; 1600px in admin  |
