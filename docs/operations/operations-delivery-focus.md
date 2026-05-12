# Delivery Focus ({messmass})
Status: Active
Last Updated: 2026-05-02
Canonical: No
Owner: Product

**Source of truth:** [MVP Factory Board](https://github.com/users/moldovancsaba/projects/1) (Product = messmass). Issues live in [mvp-factory-control](https://github.com/moldovancsaba/mvp-factory-control). **When a delivery is completed:** update the board (move the relevant issue to **Done**, post evidence link in the issue); update this doc and release notes.

## Top 5 value & high-priority (from board, Product = messmass)

*Rechecked 2026-05-02 against the live board state.*

| Priority | Status  | Issue | Title |
|----------|---------|-------|--------|
| P1 | In Progress | [#72](https://github.com/moldovancsaba/mvp-factory-control/issues/72) | Style hardening Phase 5: consolidate duplicated CSS |
| P0 | Roadmap | [#44](https://github.com/moldovancsaba/mvp-factory-control/issues/44) | Advanced Analytics & Insights Platform (Q1–Q2 2026) |
| P0 | Done | [#354+](https://github.com/moldovancsaba/mvp-factory-control/issues/354) | {messmass} Phase 15: Organization Hierarchy & Activity Connectivity |
| P0 | Done | [#57](https://github.com/moldovancsaba/mvp-factory-control/issues/57) | Milestone: Analytics Platform Phase 1 — Data Aggregation & Storage (Q1 2026) |
| P1 | Roadmap | [#46+](https://github.com/moldovancsaba/mvp-factory-control/issues/46) | SSO Integration with DoneIsBetter (Ongoing Hardening) |
| P1 | Done | [#403](https://github.com/moldovancsaba/mvp-factory-control/issues/403) | V3 Organization Context Middleware (Permissions Foundation) |

**Note:** The board still has **#72** active. Local docs previously drifted and incorrectly said there was no item in progress; that mismatch was corrected in the `v12.1.11` cleanup slice.

## Recommended next delivery step

1. **Continue #72 low-risk cleanup slices:** finish remaining small hardcoded/dead-style removals or decide whether the remaining UI debt should be split into a new card.
2. **Cross-Organization Reporting Permissions:** implement granular RBAC for organization managers to restrict data visibility to their specific sub-entities once `#72` is closed or intentionally paused.

## Recently completed

- **Organization Admin Data Flow Recovery** (2026-04-24): Restored `/admin/organizations` against the live `organizations` + `partners` records, fixed the member assignment modal, added admin organization reporting endpoints, and synchronized docs/manuals. Version bumped to **v12.1.7**.
- **Report Content Slots Management** (2026-03-17): Implemented markdown presets for text elements and multi-ratio image previews in the Builder UI. Created `tests/chart-preset-validation.test.ts`. Version bumped to **v12.1.6**.
- **V3 Organization Context Middleware** (2026-03-16): Implemented foundational RBAC groundwork by injecting `x-v3-org-id` into API requests. Created `/api/v3/health`. Version bumped to **v12.1.5**.
- **Style Hardening Phase 5** (2026-03-16): Consolidated legacy hero components into `UnifiedAdminHeroWithSearch`. Removed orphaned assets. Version bumped to **v12.1.4**.
- **Phase 15: Organization Hierarchy & Activity Connectivity** (2026-03-14): Finalized the V3 organization hierarchy. Implemented `ManageMembersModal`, aggregated activity APIs (`/api/v3/organizations/report/[id]/activities`), and `OrganizationReportView`. Version bumped to **v12.1.0**.
- **Phase 14: Organization Report Initial Implementation** (2026-03-13): Added "Report" and "Edit Stats" actions to Organization Admin. Created base `OrganizationReportView` and aggregation hooks.
- **React 19 & Next.js 15 Upgrade** (2026-03-13): Major technical upgrade to resolve hydration deadlocks and modernize the stack. Version bumped to **v12.0.0**.
- **Branding Standardization** (2026-03-13): Normalized product branding to `{messmass}` across 200+ files and documentation assets.
- **Builder mode (clicker) — variable inputs** (2026-02-24): All chart types on `/edit/[slug]` Builder show one input per variable from formulas.

## In progress

- **Style hardening Phase 5** ([#72](https://github.com/moldovancsaba/mvp-factory-control/issues/72)): still active on the board; latest slice moved `/admin/clear-session` and `not-found` away from hardcoded page-level utility styling.
