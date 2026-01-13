# Admin UI Roles and Permissions
Status: Draft
Last Updated: 2026-01-13T14:05:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Document Admin roles, permissions, and enforcement points for A-UI-04.
- [ ] Provide a role-by-capability matrix and enforcement plan for execution.

2 Role Definitions and Sources
| Role | Source of truth | Summary | Evidence |
| --- | --- | --- | --- |
| guest | lib/users.ts | Default role for self-registration; intended for documentation access only. | [lib/users.ts](lib/users.ts), [app/api/admin/register/route.ts](app/api/admin/register/route.ts) |
| user | lib/users.ts | Basic authenticated user role (no explicit capability gates documented in UI). | [lib/users.ts](lib/users.ts) |
| admin | lib/users.ts, lib/auth.ts | Admin role used for Admin UI access; role-gated on charts and hashtags pages. | [lib/users.ts](lib/users.ts), [lib/auth.ts](lib/auth.ts), [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx) |
| superadmin | lib/users.ts, lib/auth.ts | Highest admin role; required for user password regeneration and deletion. | [lib/users.ts](lib/users.ts), [lib/auth.ts](lib/auth.ts), [app/api/admin/local-users/[id]/route.ts](app/api/admin/local-users/[id]/route.ts) |
| api | lib/auth.ts | Legacy API-only role present in AdminUser type; not present in UserRole union. | [lib/auth.ts](lib/auth.ts), [lib/users.ts](lib/users.ts) |

3 Permissions Model (Current)
- [ ] AdminUser.permissions exists but is the same basePermissions list for all roles (read/write/delete/manage-users). Evidence: [lib/auth.ts](lib/auth.ts).
- [ ] hasPermission helper exists but is not used by app or API routes. Evidence: [lib/auth.ts](lib/auth.ts).
- [ ] Role list mismatch: AdminUser includes api role; UserRole union excludes api. Evidence: [lib/auth.ts](lib/auth.ts), [lib/users.ts](lib/users.ts).

4 Current Enforcement Points
| Layer | Entry point | Check type | Role enforcement | Evidence |
| --- | --- | --- | --- | --- |
| UI | useAdminAuth hook | Session check via /api/admin/auth | Authenticated only (no role gating) | [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts), [app/api/admin/auth/route.ts](app/api/admin/auth/route.ts) |
| UI | /admin/charts | Client-side /api/auth/check | admin or superadmin only | [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [app/api/auth/check/route.ts](app/api/auth/check/route.ts) |
| UI | /admin/hashtags | Client-side /api/auth/check | admin or superadmin only | [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [app/api/auth/check/route.ts](app/api/auth/check/route.ts) |
| API | /api/admin/auth | getAdminUser | Authenticated only | [app/api/admin/auth/route.ts](app/api/admin/auth/route.ts), [lib/auth.ts](lib/auth.ts) |
| API | /api/admin/local-users (GET/POST) | getAdminUser | Authenticated only | [app/api/admin/local-users/route.ts](app/api/admin/local-users/route.ts) |
| API | /api/admin/local-users/[id] (PUT/DELETE) | getAdminUser + role check | superadmin only | [app/api/admin/local-users/[id]/route.ts](app/api/admin/local-users/[id]/route.ts) |
| API | /api/admin/local-users/[id]/api-access (PUT) | getAdminUser | Authenticated only | [app/api/admin/local-users/[id]/api-access/route.ts](app/api/admin/local-users/[id]/api-access/route.ts) |

5 Role-by-Capability Matrix (Current, Documented)
| Capability | guest | user | admin | superadmin | api | Notes | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Admin login/register/help | Yes (register/help) | Yes | Yes | Yes | No | Guest role created via registration; help route is public after login. | [app/admin/register/page.tsx](app/admin/register/page.tsx), [app/admin/help/page.tsx](app/admin/help/page.tsx) |
| Admin dashboard and navigation | Implicit | Implicit | Implicit | Implicit | No | Most admin pages use useAdminAuth only. | [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts), [app/admin/page.tsx](app/admin/page.tsx) |
| Events and Partners management | Implicit | Implicit | Implicit | Implicit | No | No role gate on /admin/events or /admin/partners. | [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx) |
| Filters | Implicit | Implicit | Implicit | Implicit | No | /admin/filter relies on admin layout/session. | [app/admin/filter/page.tsx](app/admin/filter/page.tsx) |
| Reporting templates and styles | Implicit | Implicit | Implicit | Implicit | No | No role gates on /admin/visualization or /admin/styles. | [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/styles/page.tsx](app/admin/styles/page.tsx) |
| KYC variables | Implicit | Implicit | Implicit | Implicit | No | No role gate on /admin/kyc. | [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx) |
| Algorithms (chart configs) | No | No | Yes | Yes | No | Explicit role gate in /admin/charts. | [app/admin/charts/page.tsx](app/admin/charts/page.tsx) |
| Hashtags | No | No | Yes | Yes | No | Explicit role gate in /admin/hashtags. | [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx) |
| Admin users management | Implicit | Implicit | Implicit | Superadmin for regen/delete | No | API enforces superadmin for password regen/delete; list/create are auth-only. | [app/admin/users/page.tsx](app/admin/users/page.tsx), [app/api/admin/local-users/route.ts](app/api/admin/local-users/route.ts), [app/api/admin/local-users/[id]/route.ts](app/api/admin/local-users/[id]/route.ts) |

6 Missing or Implicit Permission Rules (Gaps)
- [ ] Partner Admin / Operator roles requested by product are not defined in code; current roles are guest/user/admin/superadmin/api only.
- [ ] Permissions array is not role-differentiated and hasPermission is unused in app routes.
- [ ] Most Admin UI pages enforce authentication only; role-based access is limited to charts and hashtags.
- [ ] User management endpoints allow any authenticated admin to list/create users; only regenerate/delete is superadmin-gated.
- [ ] api role exists in AdminUser but not in UserRole union, indicating schema mismatch.

7 Execution-Ready Enforcement Plan (Where and How)
- [ ] Use /api/admin/auth (getAdminUser) as the canonical auth source for Admin UI pages; align any /api/auth/check usage to the same role source.
- [ ] Apply role checks in API routes for sensitive actions (users, role changes, destructive actions) using getAdminUser and role comparisons.
- [ ] For charts and hashtags, keep admin/superadmin gates and document role rules in one place (this doc).
- [ ] Document intended access for each capability in the matrix before refactor changes.
- [ ] Resolve role mismatch (api role) in the role model before enforcing permissions more broadly.
