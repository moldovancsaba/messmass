# Admin UI Glossary
Status: Draft
Last Updated: 2026-01-13T00:13:00.000Z
Canonical: No
Owner: Audit

1 Terms

1.1 Admin Session
- [ ] Definition: Cookie-backed admin session used to authorize access to /admin pages and APIs.
- [ ] Code references: [lib/auth.ts](lib/auth.ts), [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts)

1.2 Admin User
- [ ] Definition: Admin account with role and permissions for managing system data.
- [ ] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)

1.3 Admin Role
- [ ] Definition: Role assigned to an admin user (admin, superadmin, api) used for permission checks.
- [ ] Code references: [lib/auth.ts](lib/auth.ts), [lib/users.ts](lib/users.ts)

1.4 Superadmin
- [ ] Definition: Highest admin role with full permissions.
- [ ] Code references: [lib/auth.ts](lib/auth.ts), [app/admin/charts/page.tsx](app/admin/charts/page.tsx)

1.5 Global Scope
- [ ] Definition: System-wide configuration applied when no partner or event overrides exist.
- [ ] Code references: [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md)

1.6 Partner Scope
- [ ] Definition: Partner-specific data or overrides used as defaults for that partner.
- [ ] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

1.7 Event Scope
- [ ] Definition: Event-specific (project-specific) data or overrides that supersede partner defaults.
- [ ] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx)

1.8 User/Role Scope
- [ ] Definition: Data or permissions scoped to an individual admin user or role.
- [ ] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)

1.9 Partner
- [ ] Definition: Business entity configured with hashtags, styles, and report templates.
- [ ] Code references: [lib/partner.types.ts](lib/partner.types.ts), [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

1.10 Event (Project)
- [ ] Definition: Event record used for reporting and analytics.
- [ ] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/types/api.ts](lib/types/api.ts)

1.11 Report
- [ ] Definition: Generated output for events or partners using templates, styles, and chart configurations.
- [ ] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.12 Report Template
- [ ] Definition: Template definition for report layout and data blocks.
- [ ] Code references: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.13 Data Block
- [ ] Definition: Reusable block of charts used inside report templates.
- [ ] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.14 Chart Configuration
- [ ] Definition: Algorithm and formatting configuration used to render charts.
- [ ] Code references: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)

1.15 Chart Algorithm
- [ ] Definition: Formula logic and rules that power chart calculations within chart configurations.
- [ ] Code references: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx)

1.16 Report Style
- [ ] Definition: Visual style theme applied to report pages.
- [ ] Code references: [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts), [app/admin/styles/page.tsx](app/admin/styles/page.tsx)

1.17 Report Template Assignment
- [ ] Definition: Selection of reportTemplateId at partner or event scope to control report generation.
- [ ] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

1.18 Report Style Assignment
- [ ] Definition: Selection of styleId at partner, event, or filter scope to control report styling.
- [ ] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.19 Hashtag
- [ ] Definition: Tag assigned to partners or events for filtering and categorization.
- [ ] Code references: [components/HashtagEditor.tsx](components/HashtagEditor.tsx), [lib/types/hashtags.ts](lib/types/hashtags.ts)

1.20 Hashtag Category
- [ ] Definition: Category used to group hashtags and enforce categorizedHashtags structure.
- [ ] Code references: [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts), [app/admin/categories/page.tsx](app/admin/categories/page.tsx)

1.21 Filter (Hashtag Filter)
- [ ] Definition: Hashtag-based filter view that aggregates project statistics and shareable results.
- [ ] Code references: [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.22 Share Slug (View Slug)
- [ ] Definition: Slug used by SharePopup to generate shareable report or filter links.
- [ ] Code references: [components/SharePopup.tsx](components/SharePopup.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

1.23 KYC Variable
- [ ] Definition: Variable definition used by analytics and clicker workflows.
- [ ] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)

1.24 Variables Config
- [ ] Definition: Canonical variables catalog exposed by /api/variables-config.
- [ ] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)

1.25 Variable Group
- [ ] Definition: Clicker grouping and ordering of variables.
- [ ] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

1.26 KYC Data
- [ ] Definition: Aggregated event or partner stats keyed to KYC variables.
- [ ] Code references: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx)

1.27 Clicker
- [ ] Definition: Editor UI mode for data entry during events.
- [ ] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx), [app/admin/help/page.tsx](app/admin/help/page.tsx)

1.28 Clicker Manager
- [ ] Definition: Admin page for configuring variable groups, ordering, and visibility for clicker UI.
- [ ] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

1.29 Bitly Link
- [ ] Definition: Short link record with analytics and associations to partners or events.
- [ ] Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx)

1.30 Insight
- [ ] Definition: Analytics output item (anomaly, trend, benchmark, prediction, recommendation).
- [ ] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)

1.31 Analytics Insights
- [ ] Definition: Admin insights dashboards for monitoring and filtering analytics insights.
- [ ] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx)

1.32 Executive Analytics
- [ ] Definition: Executive dashboard for KPIs, trends, and critical insights.
- [ ] Code references: [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx)

1.33 Content Asset
- [ ] Definition: Image or text asset referenced by chart formulas or report templates.
- [ ] Code references: [app/admin/content-library/page.tsx](app/admin/content-library/page.tsx), [lib/contentAssetTypes.ts](lib/contentAssetTypes.ts)

1.34 Cache Management
- [ ] Definition: Admin controls for clearing server and browser caches.
- [ ] Code references: [app/admin/cache/page.tsx](app/admin/cache/page.tsx)

1.35 User Guide
- [ ] Definition: Admin help content providing guidance and onboarding.
- [ ] Code references: [app/admin/help/page.tsx](app/admin/help/page.tsx)

1.36 Admin Dashboard
- [ ] Definition: Root admin landing page with navigation to admin areas.
- [ ] Code references: [app/admin/page.tsx](app/admin/page.tsx), [components/AdminDashboard.tsx](components/AdminDashboard.tsx)

1.37 Legacy Dashboard
- [ ] Definition: Older aggregated dashboard with stats and filtering at /admin/dashboard.
- [ ] Code references: [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx)
