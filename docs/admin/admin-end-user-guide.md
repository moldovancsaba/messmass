# END USER GUIDE (Admin Operations)
Status: Complete
Last Updated: 2026-02-21T00:00:00.000Z
Canonical: Yes
Owner: Admin (Katja)

1 Purpose
- Provide the operational user guide for Admin workflows on messmass.com.
- Define the canonical source of truth for guide content and maintenance.
- Map core Admin workflows to UI paths for consistent support and onboarding.

2 Canonical Source and Delivery Approach
- Canonical source: `docs/admin/admin-end-user-guide.md` (this document).
- Delivery approach: Doc-driven.
- Admin Help page (`/admin/help`) should render content from this document.
- Until the Help page is wired to this doc, keep the embedded help content in sync with this file.

3 Roles and Access
- guest: Documentation access only.
- user: View and edit Events, Partners, Filters.
- admin: User access plus KYC, Algorithms, Reporting, Styles.
- superadmin: Full system access including user management.
Evidence: `lib/users.ts`

4 Core Workflow Map (Admin UI Paths)
| Workflow | Admin UI path(s) | Output |
| --- | --- | --- |
| Login and access | `/admin/login` | Authenticated Admin session |
| Admin entry point | `/admin` | Navigation to Admin sections |
| Events list and search | `/admin/events` | Event list + access to editor/report links |
| Event data entry (live) | `/edit/[event-slug]` | Live stats capture (clicker/manual) |
| Event report view | `/report/[event-slug]` | Read-only report output (public view link) |
| Partner management | `/admin/partners`, `/admin/partners/[id]` | Partner setup, associations |
| Project-partner assignment | `/admin/project-partners` | Partner-to-project mapping |
| Report templates + blocks | `/admin/visualization` | Template and block configuration |
| Chart algorithms | `/admin/charts` | Chart configuration and formulas |
| Report styles | `/admin/styles` | Theme and style assignment |
| Variables (KYC) | `/admin/kyc` | Variable definitions + metadata |
| Content library | `/admin/content-library` | Text/image assets for reports |
| Hashtags | `/admin/hashtags` | Hashtag definitions |
| Categories | `/admin/categories` | Category definitions |
| Cache management | `/admin/cache` | Cache invalidation actions |
| User management | `/admin/users` | Role changes and user access |
| Main page (landing report) | `/admin/mainpage` | Choose report for messmass.com; generate static content |
| Help and guide | `/admin/help` | User guide display |

5 Guide Sections (Content Outline)
- Getting Started: login, roles, navigation, events list.
- Event Operations: create/edit events, live tracking via `/edit/[event-slug]`.
- Report Sharing: view link usage, export expectations, visibility rules.
- Data Entry Modes: clicker vs manual entry, field types, validation rules.
- KYC Variables: what variables are, where to manage, naming rules.
- Algorithms and Templates: chart formulas, report templates, data blocks.
- Styles and Themes: style assignment and overrides.
- Content Assets: text and image assets used in reports.
- Hashtags and Categories: tagging and filtering usage.
- Exports: CSV/PDF usage and troubleshooting.
- Cache Management: when to invalidate and what to expect after.
- Main page: choose which event report drives the main site (messmass.com), save selection, and use **Update static content** so the site serves a static snapshot until the next update. See `docs/features/features-landing-main-page.md`.
- Troubleshooting: auth issues, missing data, stale output, permissions.

6 Update and Ownership Process
- Owner: Admin (Katja).
- Approver: Architect (Chappie) for scope and cross-system alignment.
- Update triggers:
  - New Admin UI pages or route changes.
  - Changes to templates, styles, variables, or content assets.
  - Support incidents tied to stale data or permissions.
- Update steps:
  1) Update `docs/admin/admin-end-user-guide.md`.
  2) Sync `/admin/help` content to match this document.
  3) Log state change in `docs/operations/operations-action-plan.md` (A-UI-15).
  4) Notify Architect when updates affect workflow or scope.

7 References (Non-Canonical)
- Embedded help content: `app/admin/help/page.tsx`
- Capability map reference: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-capability-map`
- Execution readiness: `docs/archive/_archive/audits/archive-admin-ui-audits-pack.md#admin-ui-execution-readiness`
- Archived legacy guide (do not use as source of truth): `docs/archive/2025/deprecated-guides/USER_GUIDE.md`
