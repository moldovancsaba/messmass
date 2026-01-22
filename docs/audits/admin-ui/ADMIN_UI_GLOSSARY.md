# Admin UI Glossary
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Terms

1.1 Admin Session
- [x] Definition: Cookie-backed admin session used to authorize access to /admin pages and APIs.
- [x] Code references: [lib/auth.ts](lib/auth.ts), [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts)

1.2 Admin User
- [x] Definition: Admin account with role and permissions for managing system data.
- [x] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)

1.3 Admin Role
- [x] Definition: Role assigned to an admin user (admin, superadmin, api) used for permission checks.
- [x] Code references: [lib/auth.ts](lib/auth.ts), [lib/users.ts](lib/users.ts)

1.4 Superadmin
- [x] Definition: Highest admin role with full permissions.
- [x] Code references: [lib/auth.ts](lib/auth.ts), [app/admin/charts/page.tsx](app/admin/charts/page.tsx)

1.5 Global Scope
- [x] Definition: System-wide configuration applied when no partner or event overrides exist.
- [x] Code references: [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md)

1.6 Partner Scope
- [x] Definition: Partner-specific data or overrides used as defaults for that partner.
- [x] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

1.7 Event Scope
- [x] Definition: Event-specific (project-specific) data or overrides that supersede partner defaults.
- [x] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx)

1.8 User/Role Scope
- [x] Definition: Data or permissions scoped to an individual admin user or role.
- [x] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)

1.9 Partner
- [x] Definition: Business entity configured with hashtags, styles, and report templates.
- [x] Code references: [lib/partner.types.ts](lib/partner.types.ts), [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

1.10 Event (Project)
- [x] Definition: Event record used for reporting and analytics.
- [x] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/types/api.ts](lib/types/api.ts)

1.11 Report
- [x] Definition: Generated output for events or partners using templates, styles, and chart configurations.
- [x] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.12 Report Template
- [x] Definition: Template definition for report layout and data blocks.
- [x] Code references: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.13 Data Block
- [x] Definition: Reusable block of charts used inside report templates.
- [x] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.14 Chart Configuration
- [x] Definition: Algorithm and formatting configuration used to render charts.
- [x] Code references: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)

1.15 Chart Algorithm
- [x] Definition: Formula logic and rules that power chart calculations within chart configurations.
- [x] Code references: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx)

1.16 Report Style
- [x] Definition: Visual style theme applied to report pages.
- [x] Code references: [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts), [app/admin/styles/page.tsx](app/admin/styles/page.tsx)

1.17 Report Template Assignment
- [x] Definition: Selection of reportTemplateId at partner or event scope to control report generation.
- [x] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

1.18 Report Style Assignment
- [x] Definition: Selection of styleId at partner, event, or filter scope to control report styling.
- [x] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.19 Hashtag
- [x] Definition: Tag assigned to partners or events for filtering and categorization.
- [x] Code references: [components/HashtagEditor.tsx](components/HashtagEditor.tsx), [lib/types/hashtags.ts](lib/types/hashtags.ts)

1.20 Hashtag Category
- [x] Definition: Category used to group hashtags and enforce categorizedHashtags structure.
- [x] Code references: [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts), [app/admin/categories/page.tsx](app/admin/categories/page.tsx)

1.21 Filter (Hashtag Filter)
- [x] Definition: Hashtag-based filter view that aggregates project statistics and shareable results.
- [x] Code references: [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.22 Share Slug (View Slug)
- [x] Definition: Slug used by SharePopup to generate shareable report or filter links.
- [x] Code references: [components/SharePopup.tsx](components/SharePopup.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.23 KYC Variable
- [x] Definition: Variable definition used by analytics and clicker workflows.
- [x] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)

1.24 Variables Config
- [x] Definition: Canonical variables catalog exposed by /api/variables-config.
- [x] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)

1.25 Variable Group
- [x] Definition: Clicker grouping and ordering of variables.
- [x] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

1.26 KYC Data
- [x] Definition: Aggregated event or partner stats keyed to KYC variables.
- [x] Code references: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx)

1.27 Clicker
- [x] Definition: Editor UI mode for data entry during events.
- [x] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx), [app/admin/help/page.tsx](app/admin/help/page.tsx)

1.28 Clicker Manager
- [x] Definition: Admin page for configuring variable groups, ordering, and visibility for clicker UI.
- [x] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

1.29 Bitly Link
- [x] Definition: Short link record with analytics and associations to partners or events.
- [x] Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx)

1.30 Insight
- [x] Definition: Analytics output item (anomaly, trend, benchmark, prediction, recommendation).
- [x] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)

1.31 Analytics Insights
- [x] Definition: Admin insights dashboards for monitoring and filtering analytics insights.
- [x] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx)

1.32 Executive Analytics
- [x] Definition: Executive dashboard for KPIs, trends, and critical insights.
- [x] Code references: [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx)

1.33 Content Asset
- [x] Definition: Image or text asset referenced by chart formulas or report templates.
- [x] Code references: [app/admin/content-library/page.tsx](app/admin/content-library/page.tsx), [lib/contentAssetTypes.ts](lib/contentAssetTypes.ts)

1.34 Cache Management
- [x] Definition: Admin controls for clearing server and browser caches.
- [x] Code references: [app/admin/cache/page.tsx](app/admin/cache/page.tsx)

1.35 User Guide
- [x] Definition: Admin help content providing guidance and onboarding.
- [x] Code references: [app/admin/help/page.tsx](app/admin/help/page.tsx)

1.36 Admin Dashboard
- [x] Definition: Root admin landing page with navigation to admin areas.
- [x] Code references: [app/admin/page.tsx](app/admin/page.tsx), [components/AdminDashboard.tsx](components/AdminDashboard.tsx)

1.37 Legacy Dashboard
- [x] Definition: Older aggregated dashboard with stats and filtering at /admin/dashboard.
- [x] Code references: [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx)