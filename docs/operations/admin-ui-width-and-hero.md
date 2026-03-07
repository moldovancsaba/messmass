# Admin UI: Width and Hero Usage

Status: Active
Last Updated: 2026-03-06
Canonical: Yes
Owner: Admin / Frontend

Related: OPS-ADMIN-02 (completed)

## 1. Single HERO source

- **Component:** `UnifiedAdminHeroWithSearch`  
- Use this hero for all admin list/dashboard pages that need a title, search, and optional view toggle.
- Use this as the default hero for admin management pages even when a page does not need search or view toggle.
- `AdminHero` is now legacy/exception-only for untouched detail/editor flows; do not use it for new admin management pages.
- Do not introduce new hero variants; extend this component or its props if behavior needs to change.
- Supported shared hero features in the canonical path now include:
  - title + subtitle
  - back link
  - action buttons
  - badges
  - optional search
  - optional view toggle

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
- **Inner sections:** A page may use a smaller inner readable-width wrapper for long-form prose or editor readability, but the outer page shell must still be `.page-container`. Document the reason in code or docs when the inner width is intentionally narrower.
- **Do not do this on touched admin pages:**
  - custom outer container `max-width` that fights the shared shell
  - page-level ad hoc background wrappers that duplicate `.content-surface`
  - inline style objects for layout or hero presentation

## 4. Summary

| Item              | Where                         | Purpose                          |
|-------------------|-------------------------------|----------------------------------|
| HERO              | `UnifiedAdminHeroWithSearch`  | Single source for admin heroes   |
| `--content-bg`    | theme + admin layout inject   | Main content background          |
| `.content-surface`| layout.css + AdminLayout main | Apply content background + width |
| `--mm-admin-content-max-width` | theme + layout + AdminLayout | Consistent admin content width   |
| `.page-container` | layout.css (inside .content-surface) | Page wrapper; 1600px in admin  |

## 5. Routes standardized under issue #56

- Standardized to `UnifiedAdminHeroWithSearch` in this delivery:
  - `/admin/dashboard`
  - `/admin/styles`
  - `/admin/insights`
  - `/admin/content-library`
  - `/admin/mainpage`
  - `/admin/messages`
  - `/admin/help`
  - `/admin/events`
- Verified for shared outer shell alignment during this delivery:
  - `/admin/partners`
  - `/admin/users`
  - `/admin/categories`
  - `/admin/filter`
  - `/admin/hashtags`
  - `/admin/bitly`
  - `/admin/clicker-manager`
  - `/admin/visualization`
  - `/admin/kyc`
