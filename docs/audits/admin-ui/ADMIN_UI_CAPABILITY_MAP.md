# Admin UI Capability Map
Status: Draft
Last Updated: 2026-01-13T00:13:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [ ] Map Admin UI capabilities for A-UI-00 and capture ownership, inputs, outputs, and duplication using code references.
- [ ] Inventory includes all verified admin routes under app/admin.

2 Admin Areas (A-UI-00)

2.1 Partners (A-UI-01)
- [ ] Route: /admin/partners
- [ ] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [lib/adapters/partnersAdapter.ts](lib/adapters/partnersAdapter.ts), [components/UnifiedAdminPage.tsx](components/UnifiedAdminPage.tsx)
- [ ] Purpose: Manage partner records and partner-level reporting configuration, hashtags, and link associations.
- [ ] Entities: Partner, reportTemplateId, styleId, bitlyLinkIds, hashtags, categorizedHashtags, sportsDb, GoogleSheetConfig.
- [ ] Inputs: name, emoji, hashtags/categorizedHashtags, report template selection, report style selection, bitly link selection, logo upload, Google Sheets setup, SportsDB lookup.
- [ ] Outputs: partner records, share links, report template/style assignment, bitly associations, Google Sheets sync state.
- [ ] Ownership scope: Partner.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Template/style assignment duplicates Events; bitly link association overlaps Bitly Manager; hashtag tagging overlaps Hashtag Manager and Category Manager; Google Sheets controls also appear in /admin/partners/[id].
- [ ] Connected report/insight dependencies: reportTemplateId/styleId feed report rendering; SharePopup generates report links for partners.

2.1.1 A-UI-01 Documentation Target: Partners
- [ ] Concrete page routes: /admin/partners, /admin/partners/[id], /admin/partners/[id]/analytics, /admin/partners/[id]/kyc-data
- [ ] Main components: UnifiedAdminPage, FormModal, SharePopup, UnifiedHashtagInput, BitlyLinksSelector, EmojiSelector, TheSportsDBSearch, GoogleSheetsConnectModal, GoogleSheetsSyncButtons.
- [ ] Report connections: reportTemplateId/styleId assignments drive partner report rendering; SharePopup uses viewSlug for report links; partner KYC data uses global variables-config for report data.

2.2 Events (A-UI-02)
- [ ] Route: /admin/events
- [ ] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/adapters/projectsAdapter.ts](lib/adapters/projectsAdapter.ts), [components/SharePopup.tsx](components/SharePopup.tsx)
- [ ] Purpose: Manage event (project) records, partner associations, and reporting configuration.
- [ ] Entities: Project (Event), partner1Id/partner2Id, reportTemplateId, styleId, hashtags, categorizedHashtags, viewSlug.
- [ ] Inputs: event name/date, partner selection, hashtags/categorizedHashtags, report template/style selection.
- [ ] Outputs: event records, share links, report template/style assignment for reports.
- [ ] Ownership scope: Event.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Template/style assignment duplicates Partners; bitly associations handled in Bitly Manager; hashtag management overlaps Hashtag Manager; partner assignments overlap /admin/project-partners; event KYC detail exists at /admin/events/[id]/kyc-data.
- [ ] Connected report/insight dependencies: reportTemplateId/styleId feed report rendering; SharePopup generates event report links; event stats feed analytics insights.

2.2.1 A-UI-02 Documentation Target: Events
- [ ] Concrete page routes: /admin/events, /admin/events/[id]/kyc-data, /admin/project-partners, /admin/quick-add, /admin/projects (redirect)
- [ ] Main components: UnifiedAdminPage, FormModal, SharePopup, UnifiedHashtagInput, BitlyLinksEditor.
- [ ] Report connections: event report template/style assignments feed report rendering; SharePopup uses viewSlug for report links; event KYC data table ties to report variables.

2.3 Filters (A-UI-03)
- [ ] Route: /admin/filter
- [ ] Code references: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagMultiSelect.tsx](components/HashtagMultiSelect.tsx), [components/SharePopup.tsx](components/SharePopup.tsx)
- [ ] Purpose: Filter project statistics by hashtags and present aggregated results.
- [ ] Entities: Hashtag, ProjectStats, report style, filter slug.
- [ ] Inputs: selected hashtags, report style selection.
- [ ] Outputs: aggregated stats/project list and shareable filter slug.
- [ ] Ownership scope: Event (cross-event filter view).
- [ ] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Hashtag search/pagination duplicates Hashtag Manager; style selection duplicates Styles; filtering overlaps dashboard filter tab.
- [ ] Connected report/insight dependencies: Uses report style library; share slug ties to report/share views; filtered stats feed report-like dashboards.

2.3.1 A-UI-03 Documentation Target: Filters
- [ ] Concrete page routes: /admin/filter
- [ ] Main components: HashtagMultiSelect, SharePopup, UnifiedAdminHeroWithSearch, ColoredCard, ColoredHashtagBubble.
- [ ] Report connections: uses /api/report-styles for style selection and persists filter styles for shareable report views.

2.4 Users (A-UI-04)
- [ ] Route: /admin/users
- [ ] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)
- [ ] Purpose: Manage admin users, roles, and API access.
- [ ] Entities: AdminUser, role, API access.
- [ ] Inputs: create user (email, name, role), regenerate password, toggle API access, change role.
- [ ] Outputs: admin accounts, role assignments, API access state.
- [ ] Ownership scope: User.
- [ ] Permissions: Authenticated admin session via /api/admin/auth; role enforcement handled by backend endpoints.
- [ ] Known inconsistencies: None observed in code references.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: Roles gate access to report and insight administration; no direct report data dependencies.

2.4.1 A-UI-04 Documentation Target: Users
- [ ] Concrete page routes: /admin/users
- [ ] Main components: UnifiedAdminPage, FormModal, PasswordModal, RoleDropdown, ConfirmDialog.
- [ ] Report connections: no direct report data; role permissions control access to report and insight admin areas.

2.5 Insights (A-UI-05)
- [ ] Route: /admin/insights
- [ ] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)
- [ ] Purpose: View analytics insights with filtering controls.
- [ ] Entities: Insight, InsightsMetadata.
- [ ] Inputs: type filter, severity filter, limit.
- [ ] Outputs: insight list and metadata for analytics monitoring.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [ ] Known inconsistencies: Overlaps /admin/analytics/insights (separate dashboard and endpoints).
- [ ] Duplicate flows: Insights are duplicated between /admin/insights and /admin/analytics/insights.
- [ ] Connected report/insight dependencies: Consumes /api/analytics/insights; insights derived from analytics data used in executive analytics.

2.5.1 A-UI-05 Documentation Target: Insights
- [ ] Concrete page routes: /admin/insights, /admin/analytics/insights
- [ ] Main components: AdminHero, InsightCard, ColoredCard.
- [ ] Report connections: analytics insights feed executive analytics and dashboard KPIs; no report template configuration.

2.6 KYC (A-UI-06)
- [ ] Route: /admin/kyc
- [ ] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)
- [ ] Purpose: Manage variables catalog used by analytics and clicker.
- [ ] Entities: Variable, variable flags, categories.
- [ ] Inputs: variable create/edit, source filters, flags, category tags.
- [ ] Outputs: variables configuration for clicker and analytics.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [ ] Known inconsistencies: Partner and event KYC data pages present scoped datasets while variable definitions remain global in /admin/kyc.
- [ ] Duplicate flows: Variable definitions are edited here and referenced in ChartAlgorithmManager and Clicker Manager.
- [ ] Connected report/insight dependencies: variables-config drives chart algorithms and report templates; KYC data tables surface variables used in reports and analytics.

2.6.1 A-UI-06 Documentation Target: KYC
- [ ] Concrete page routes: /admin/kyc, /admin/partners/[id]/kyc-data, /admin/events/[id]/kyc-data
- [ ] Main components: UnifiedAdminHeroWithSearch, FormModal, MaterialIcon, ColoredCard.
- [ ] Report connections: variables-config feeds chart algorithms and report templates; partner/event KYC data reflects report variables.
- [ ] KYC to Algorithms mapping: variables-config consumed by ChartAlgorithmManager for formulas and field definitions. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/charts/page.tsx](app/admin/charts/page.tsx)
- [ ] KYC to Report templates mapping: report templates reference chart configs that rely on variables-config. Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)
- [ ] Partner vs global conflict notes: Partner/event KYC data pages present scoped datasets while variable definitions remain global; no partner-specific variables-config observed.

2.7 Algorithms
- [ ] Route: /admin/charts
- [ ] Code references: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx)
- [ ] Purpose: Manage chart algorithm configurations and formatting defaults.
- [ ] Entities: chart config, chart formatting defaults, variables.
- [ ] Inputs: chart configuration fields and formulas.
- [ ] Outputs: chart configuration used in report rendering and validation.
- [ ] Ownership scope: Global.
- [ ] Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Depends on variables-config managed in KYC; overlap in variable management surfaces.
- [ ] Connected report/insight dependencies: chart configs are referenced by report templates and rendering.

2.8 Clicker Manager
- [ ] Route: /admin/clicker-manager
- [ ] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)
- [ ] Purpose: Configure variable groups, ordering, and visibility for clicker UI.
- [ ] Entities: VariableGroup, Variable.
- [ ] Inputs: group order, variable selection, visibility toggles, seed defaults.
- [ ] Outputs: clicker layout configuration for editor UI.
- [ ] Ownership scope: Global.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Variable definitions are managed in KYC; clicker groups depend on shared variables.
- [ ] Connected report/insight dependencies: clicker variables drive data capture for reports and analytics.

2.9 Bitly Manager
- [ ] Route: /admin/bitly
- [ ] Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [components/ProjectSelector.tsx](components/ProjectSelector.tsx), [components/PartnerSelector.tsx](components/PartnerSelector.tsx)
- [ ] Purpose: Manage Bitly links and their associations to projects and partners.
- [ ] Entities: BitlyLink, Project, Partner.
- [ ] Inputs: link creation, partner/project associations, favorites, sync and analytics actions.
- [ ] Outputs: link associations and analytics metadata.
- [ ] Ownership scope: Global with partner/event associations.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Partner link association also managed in Partners.
- [ ] Connected report/insight dependencies: Bitly links used for report/share URLs and link analytics.

2.10 Hashtag Manager
- [ ] Route: /admin/hashtags
- [ ] Code references: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)
- [ ] Purpose: Manage hashtag colors and browse hashtag usage.
- [ ] Entities: Hashtag, HashtagColor.
- [ ] Inputs: search term, color updates, cascade actions.
- [ ] Outputs: hashtag color metadata for display and filtering.
- [ ] Ownership scope: Global.
- [ ] Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Hashtag categories are managed separately in Category Manager.
- [ ] Connected report/insight dependencies: hashtags drive report filtering and analytics grouping.

2.11 Category Manager
- [ ] Route: /admin/categories
- [ ] Code references: [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts)
- [ ] Purpose: Manage hashtag categories, ordering, and color metadata.
- [ ] Entities: HashtagCategory.
- [ ] Inputs: category name, color, order.
- [ ] Outputs: categories used for hashtag tagging and filtering.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Hashtag color editing lives in Hashtag Manager, splitting hashtag metadata across pages.
- [ ] Connected report/insight dependencies: hashtag categories influence report filtering and analytics groupings.

2.12 Reporting
- [ ] Route: /admin/visualization
- [ ] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)
- [ ] Purpose: Manage report templates, data blocks, and chart assignments.
- [ ] Entities: ReportTemplate, DataVisualizationBlock, chart config, user preferences.
- [ ] Inputs: template creation, block composition, chart selection, grid settings.
- [ ] Outputs: report templates used by partners and events.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [ ] Known inconsistencies: Template selection also exists in Partners and Events; default rules must be aligned.
- [ ] Duplicate flows: Template assignment overlaps Partners and Events configuration.
- [ ] Connected report/insight dependencies: report templates are core to report rendering and chart selection.

2.13 Style Library
- [ ] Route: /admin/styles
- [ ] Code references: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- [ ] Purpose: Manage report style library for reports.
- [ ] Entities: ReportStyle.
- [ ] Inputs: create/edit/delete style records; navigation to editor.
- [ ] Outputs: styles list and updated style records.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Style selection occurs in Partners, Events, and Filters; editor lives at /admin/styles/[id].
- [ ] Connected report/insight dependencies: report styles drive report rendering and filter styling.

2.14 Cache Management
- [ ] Route: /admin/cache
- [ ] Code references: [app/admin/cache/page.tsx](app/admin/cache/page.tsx)
- [ ] Purpose: Clear server and browser caches.
- [ ] Entities: cache types (build, routes, browser, all).
- [ ] Inputs: cache clear actions.
- [ ] Outputs: cache invalidation results.
- [ ] Ownership scope: Global.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: cache actions affect report and analytics freshness; no direct data dependency.

2.15 User Guide
- [ ] Route: /admin/help
- [ ] Code references: [app/admin/help/page.tsx](app/admin/help/page.tsx)
- [ ] Purpose: Display admin user guide content with role-based messages.
- [ ] Entities: user role, guide sections.
- [ ] Inputs: none (read-only page).
- [ ] Outputs: help and onboarding content.
- [ ] Ownership scope: Global.
- [ ] Permissions: Uses /api/admin/auth for greeting; page includes guest guidance.
- [ ] Known inconsistencies: Comment references END_USER_GUIDE.md which is not present; guide content is embedded in page.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: None observed.

2.16 Admin Dashboard (Root)
- [ ] Route: /admin
- [ ] Code references: [app/admin/page.tsx](app/admin/page.tsx), [components/AdminDashboard.tsx](components/AdminDashboard.tsx), [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts)
- [ ] Purpose: Entry dashboard with navigation cards to admin areas.
- [ ] Entities: AdminUser, permissions.
- [ ] Inputs: none (read-only dashboard).
- [ ] Outputs: navigation to admin sections.
- [ ] Ownership scope: Global.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [ ] Known inconsistencies: Overlaps /admin/dashboard dashboard view.
- [ ] Duplicate flows: Dashboard content overlaps /admin/dashboard.
- [ ] Connected report/insight dependencies: Navigation to report and analytics surfaces; no direct report data dependency.

2.17 Dashboard (Legacy)
- [ ] Route: /admin/dashboard
- [ ] Code references: [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx)
- [ ] Purpose: Aggregated dashboard with overview, success metrics, stats, and multi-hashtag filtering.
- [ ] Entities: Project, ProjectStats, hashtag slugs.
- [ ] Inputs: tab selection, hashtag filter.
- [ ] Outputs: aggregated stats and filtered project list.
- [ ] Ownership scope: Global.
- [ ] Permissions: Reads admin_token/admin_user cookies; no /api/admin/auth check in page.
- [ ] Known inconsistencies: Auth guard differs from /api/admin/auth usage in other admin pages.
- [ ] Duplicate flows: Overlaps /admin root dashboard and /admin/filter filtering.
- [ ] Connected report/insight dependencies: Aggregated stats overlap with insights and report analytics.

2.18 Projects Redirect
- [ ] Route: /admin/projects
- [ ] Code references: [app/admin/projects/page.tsx](app/admin/projects/page.tsx)
- [ ] Purpose: Redirect legacy /admin/projects route to /admin/events.
- [ ] Entities: none.
- [ ] Inputs: none.
- [ ] Outputs: client-side redirect to /admin/events.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: Legacy route kept for backward compatibility.
- [ ] Duplicate flows: Duplicate entrypoint to /admin/events.
- [ ] Connected report/insight dependencies: None observed.

2.19 Project-Partner Relationships
- [ ] Route: /admin/project-partners
- [ ] Code references: [app/admin/project-partners/page.tsx](app/admin/project-partners/page.tsx)
- [ ] Purpose: Manage partner1/partner2 assignments for projects and auto-suggest partners.
- [ ] Entities: Project, Partner.
- [ ] Inputs: partner selection, auto-suggest action, filter (all/missing/assigned).
- [ ] Outputs: updated partner assignments for projects.
- [ ] Ownership scope: Event.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Partner assignment overlaps /admin/events edit flow.
- [ ] Connected report/insight dependencies: Partner assignment affects report ownership and analytics grouping.

2.20 Partner Detail
- [ ] Route: /admin/partners/[id]
- [ ] Code references: [app/admin/partners/[id]/page.tsx](app/admin/partners/[id]/page.tsx), [components/GoogleSheetsConnectModal.tsx](components/GoogleSheetsConnectModal.tsx), [components/GoogleSheetsSyncButtons.tsx](components/GoogleSheetsSyncButtons.tsx)
- [ ] Purpose: Partner detail view with Google Sheets integration controls.
- [ ] Entities: Partner, GoogleSheetConfig.
- [ ] Inputs: connect/disconnect sheet, pull/push sync.
- [ ] Outputs: Google Sheets sync status and partner metadata.
- [ ] Ownership scope: Partner.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Google Sheets controls also appear in /admin/partners list page.
- [ ] Connected report/insight dependencies: Google Sheets sync affects partner data used in reports.

2.21 Partner Analytics
- [ ] Route: /admin/partners/[id]/analytics
- [ ] Code references: [app/admin/partners/[id]/analytics/page.tsx](app/admin/partners/[id]/analytics/page.tsx)
- [ ] Purpose: Partner analytics dashboard with summary, trends, and comparisons.
- [ ] Entities: PartnerAnalyticsData, event summaries.
- [ ] Inputs: tab selection.
- [ ] Outputs: analytics views and tables for partner.
- [ ] Ownership scope: Partner.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [ ] Known inconsistencies: Analytics dashboards also exist at /admin/insights and /admin/analytics/*.
- [ ] Duplicate flows: Analytics/insight dashboards overlap across partner analytics and global insights.
- [ ] Connected report/insight dependencies: Uses analytics datasets that also feed insights and executive analytics.

2.22 Partner KYC Data
- [ ] Route: /admin/partners/[id]/kyc-data
- [ ] Code references: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx)
- [ ] Purpose: Aggregated KYC data across all events for a partner.
- [ ] Entities: Partner, VariableMetadata, aggregated stats.
- [ ] Inputs: search, category filter.
- [ ] Outputs: aggregated KYC table for partner.
- [ ] Ownership scope: Partner.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Similar KYC view exists for events.
- [ ] Connected report/insight dependencies: KYC data derived from variables-config used in reports and analytics.

2.23 Event KYC Data
- [ ] Route: /admin/events/[id]/kyc-data
- [ ] Code references: [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx)
- [ ] Purpose: Event-specific KYC data table view.
- [ ] Entities: Project, VariableMetadata.
- [ ] Inputs: search, category filter.
- [ ] Outputs: KYC table for a single event.
- [ ] Ownership scope: Event.
- [ ] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Similar KYC view exists for partners.
- [ ] Connected report/insight dependencies: KYC data derived from variables-config used in reports and analytics.

2.24 Quick Add
- [ ] Route: /admin/quick-add
- [ ] Code references: [app/admin/quick-add/page.tsx](app/admin/quick-add/page.tsx)
- [ ] Purpose: Bulk event creation from sheet data and partner selections.
- [ ] Entities: Project, Partner, fixtures.
- [ ] Inputs: raw sheet row data, partner selections, match date, fixture selection.
- [ ] Outputs: new projects/events and drafted fixtures.
- [ ] Ownership scope: Event.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Event creation overlaps /admin/events.
- [ ] Connected report/insight dependencies: Newly created events drive report generation and analytics.

2.25 Content Library
- [ ] Route: /admin/content-library
- [ ] Code references: [app/admin/content-library/page.tsx](app/admin/content-library/page.tsx), [lib/contentAssetTypes.ts](lib/contentAssetTypes.ts)
- [ ] Purpose: Manage image/text content assets for chart formulas.
- [ ] Entities: ContentAsset, ChartReference.
- [ ] Inputs: upload/edit/delete assets, search, filters.
- [ ] Outputs: content asset records and usage status.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: Content assets referenced in chart formulas and report templates.

2.26 Admin Design
- [ ] Route: /admin/design
- [ ] Code references: [app/admin/design/page.tsx](app/admin/design/page.tsx), [hooks/useAvailableFonts.ts](hooks/useAvailableFonts.ts)
- [ ] Purpose: Manage admin UI typography settings (global font).
- [ ] Entities: UI settings, AvailableFont.
- [ ] Inputs: font selection.
- [ ] Outputs: updated UI settings via /api/admin/ui-settings.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: Report style editor is separate at /admin/styles.
- [ ] Connected report/insight dependencies: Admin UI typography only; no report template dependency.

2.27 API-Football Enrichment
- [ ] Route: /admin/api-football-enrich
- [ ] Code references: [app/admin/api-football-enrich/page.tsx](app/admin/api-football-enrich/page.tsx)
- [ ] Purpose: Manually trigger partner enrichment via API-Football.
- [ ] Entities: EnrichmentStatus.
- [ ] Inputs: manual trigger action.
- [ ] Outputs: enrichment status and processed count.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: Enrichment updates data used in reports and analytics.

2.28 Analytics Insights (Phase 3)
- [ ] Route: /admin/analytics/insights
- [ ] Code references: [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx)
- [ ] Purpose: Insights dashboard with filtering, prioritization, and action tracking.
- [ ] Entities: Insight, filters, action state.
- [ ] Inputs: filters, search, action/dismiss.
- [ ] Outputs: filtered insight list.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: Overlaps /admin/insights (different API endpoint and UX).
- [ ] Duplicate flows: Analytics insights duplicated across /admin/insights and /admin/analytics/insights.
- [ ] Connected report/insight dependencies: Consumes analytics insights data; informs executive analytics and report KPIs.

2.29 Executive Analytics
- [ ] Route: /admin/analytics/executive
- [ ] Code references: [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx)
- [ ] Purpose: Executive dashboard for aggregated KPIs, trends, and critical insights.
- [ ] Entities: ExecutiveMetrics, TrendData, Insight.
- [ ] Inputs: period selection.
- [ ] Outputs: KPI cards, trend charts, top events, insights.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: Overlaps /admin/dashboard aggregated stats.
- [ ] Duplicate flows: Executive analytics overlaps legacy dashboard KPIs.
- [ ] Connected report/insight dependencies: Uses analytics data and insights; no report template dependency.

2.30 Admin Login
- [ ] Route: /admin/login
- [ ] Code references: [app/admin/login/page.tsx](app/admin/login/page.tsx)
- [ ] Purpose: Admin login using email/password.
- [ ] Entities: Admin session.
- [ ] Inputs: email, password.
- [ ] Outputs: session cookie and redirect to /admin.
- [ ] Ownership scope: User.
- [ ] Permissions: Public (pre-auth).
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: None observed.

2.31 Admin Register
- [ ] Route: /admin/register
- [ ] Code references: [app/admin/register/page.tsx](app/admin/register/page.tsx)
- [ ] Purpose: Guest registration flow with auto-login.
- [ ] Entities: AdminUser (guest).
- [ ] Inputs: name, email, password.
- [ ] Outputs: guest session and redirect to /admin/help.
- [ ] Ownership scope: User.
- [ ] Permissions: Public (pre-auth).
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: None observed.

2.32 Clear Session
- [ ] Route: /admin/clear-session
- [ ] Code references: [app/admin/clear-session/page.tsx](app/admin/clear-session/page.tsx)
- [ ] Purpose: Clear admin session cookies for login recovery.
- [ ] Entities: session cookies.
- [ ] Inputs: clear action.
- [ ] Outputs: cleared cookies and redirect to /admin/login.
- [ ] Ownership scope: User.
- [ ] Permissions: Public (no auth check).
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: None observed.

2.33 Cookie Test
- [ ] Route: /admin/cookie-test
- [ ] Code references: [app/admin/cookie-test/page.tsx](app/admin/cookie-test/page.tsx)
- [ ] Purpose: Debug auth cookies and /api/admin/auth response.
- [ ] Entities: auth status.
- [ ] Inputs: none.
- [ ] Outputs: auth/cookie diagnostics.
- [ ] Ownership scope: User.
- [ ] Permissions: Public; calls /api/admin/auth.
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: Debug-only route.
- [ ] Connected report/insight dependencies: None observed.

2.34 Unauthorized
- [ ] Route: /admin/unauthorized
- [ ] Code references: [app/admin/unauthorized/page.tsx](app/admin/unauthorized/page.tsx)
- [ ] Purpose: Access denied screen with role context and routing help.
- [ ] Entities: UserRole.
- [ ] Inputs: query param path and auth lookup.
- [ ] Outputs: denial message and navigation options.
- [ ] Ownership scope: User.
- [ ] Permissions: Calls /api/admin/auth for role.
- [ ] Known inconsistencies: None observed.
- [ ] Duplicate flows: None observed.
- [ ] Connected report/insight dependencies: None observed.

2.35 Style Editor
- [ ] Route: /admin/styles/[id]
- [ ] Code references: [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- [ ] Purpose: Edit or create report styles with live preview.
- [ ] Entities: ReportStyle.
- [ ] Inputs: color fields, name, font settings.
- [ ] Outputs: saved report style records.
- [ ] Ownership scope: Global.
- [ ] Permissions: No explicit auth check in page.
- [ ] Known inconsistencies: None noted beyond duplication register.
- [ ] Duplicate flows: Style assignment occurs in Partners, Events, and Filters.
- [ ] Connected report/insight dependencies: report styles used by report rendering and filter views.

3 Duplication and Noise Register (A-UI-00)

3.1 Partner and Event configuration overlap
- [ ] Page routes: /admin/partners, /admin/events
- [ ] What duplicates what: reportTemplateId/styleId selection, hashtags/categorizedHashtags assignment, SharePopup usage.
- [ ] Recommended merge/remove direction: Partner assignment as default; Event assignment as override.
- [ ] Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

3.2 Hashtag search and pagination duplication
- [ ] Page routes: /admin/filter, /admin/hashtags
- [ ] What duplicates what: /api/hashtags pagination and search handling.
- [ ] Recommended merge/remove direction: Single shared search/pagination surface.
- [ ] Evidence: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)

3.3 Variable management surface duplication
- [ ] Page routes: /admin/kyc, /admin/charts, /admin/clicker-manager
- [ ] What duplicates what: variables-config edited in KYC and referenced in algorithms and clicker grouping.
- [ ] Recommended merge/remove direction: KYC as primary edit surface; other surfaces read-only for variable definitions.
- [ ] Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

3.4 Bitly link association duplication
- [ ] Page routes: /admin/bitly, /admin/partners
- [ ] What duplicates what: partner link association appears in both Bitly Manager and Partners.
- [ ] Recommended merge/remove direction: Centralize link association in Bitly Manager.
- [ ] Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

3.5 Hashtag metadata split across pages
- [ ] Page routes: /admin/hashtags, /admin/categories
- [ ] What duplicates what: hashtag color editing vs category management for hashtags.
- [ ] Recommended merge/remove direction: Single hashtag metadata surface (color and categories).
- [ ] Evidence: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [app/admin/categories/page.tsx](app/admin/categories/page.tsx)

3.6 Report style assignment duplication
- [ ] Page routes: /admin/styles, /admin/partners, /admin/events, /admin/filter
- [ ] What duplicates what: style selection occurs in multiple pages.
- [ ] Recommended merge/remove direction: Single assignment rule set; keep style editing in /admin/styles.
- [ ] Evidence: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

3.7 Report template assignment duplication
- [ ] Page routes: /admin/visualization, /admin/partners, /admin/events
- [ ] What duplicates what: template editing vs template assignment across pages.
- [ ] Recommended merge/remove direction: Single assignment rule set; keep template editing in /admin/visualization.
- [ ] Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

4 Blockers and Missing Artifacts (A-UI-00)
- [ ] Missing artifact: END_USER_GUIDE.md
- [ ] Reference location: [app/admin/help/page.tsx:9](app/admin/help/page.tsx)
- [ ] Impact: User guide references external file; content currently embedded in page.

5 Coverage Check

5.1 Confirmed present in codebase (page.tsx exists)
- [ ] /admin -> app/admin/page.tsx
- [ ] /admin/dashboard -> app/admin/dashboard/page.tsx
- [ ] /admin/analytics/executive -> app/admin/analytics/executive/page.tsx
- [ ] /admin/analytics/insights -> app/admin/analytics/insights/page.tsx
- [ ] /admin/insights -> app/admin/insights/page.tsx
- [ ] /admin/events -> app/admin/events/page.tsx
- [ ] /admin/events/[id]/kyc-data -> app/admin/events/[id]/kyc-data/page.tsx
- [ ] /admin/partners -> app/admin/partners/page.tsx
- [ ] /admin/partners/[id] -> app/admin/partners/[id]/page.tsx
- [ ] /admin/partners/[id]/analytics -> app/admin/partners/[id]/analytics/page.tsx
- [ ] /admin/partners/[id]/kyc-data -> app/admin/partners/[id]/kyc-data/page.tsx
- [ ] /admin/projects -> app/admin/projects/page.tsx
- [ ] /admin/project-partners -> app/admin/project-partners/page.tsx
- [ ] /admin/quick-add -> app/admin/quick-add/page.tsx
- [ ] /admin/filter -> app/admin/filter/page.tsx
- [ ] /admin/users -> app/admin/users/page.tsx
- [ ] /admin/kyc -> app/admin/kyc/page.tsx
- [ ] /admin/charts -> app/admin/charts/page.tsx
- [ ] /admin/clicker-manager -> app/admin/clicker-manager/page.tsx
- [ ] /admin/bitly -> app/admin/bitly/page.tsx
- [ ] /admin/hashtags -> app/admin/hashtags/page.tsx
- [ ] /admin/categories -> app/admin/categories/page.tsx
- [ ] /admin/visualization -> app/admin/visualization/page.tsx
- [ ] /admin/styles -> app/admin/styles/page.tsx
- [ ] /admin/styles/[id] -> app/admin/styles/[id]/page.tsx
- [ ] /admin/cache -> app/admin/cache/page.tsx
- [ ] /admin/content-library -> app/admin/content-library/page.tsx
- [ ] /admin/design -> app/admin/design/page.tsx
- [ ] /admin/api-football-enrich -> app/admin/api-football-enrich/page.tsx
- [ ] /admin/help -> app/admin/help/page.tsx
- [ ] /admin/login -> app/admin/login/page.tsx
- [ ] /admin/register -> app/admin/register/page.tsx
- [ ] /admin/clear-session -> app/admin/clear-session/page.tsx
- [ ] /admin/cookie-test -> app/admin/cookie-test/page.tsx
- [ ] /admin/unauthorized -> app/admin/unauthorized/page.tsx

5.2 Suspected or unknown
- [ ] None identified in app/admin route scan.
