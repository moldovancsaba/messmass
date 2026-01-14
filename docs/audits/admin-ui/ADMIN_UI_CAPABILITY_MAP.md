# Admin UI Capability Map
Status: Complete
Last Updated: 2026-01-13T18:30:00.000Z
Canonical: No
Owner: Audit

1 Purpose
- [x] Map Admin UI capabilities for A-UI-00 and capture ownership, inputs, outputs, and duplication using code references.
- [x] Inventory includes all verified admin routes under app/admin.

2 Admin Areas (A-UI-00)

2.1 Partners (A-UI-01)
- [x] Route: /admin/partners
- [x] Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [lib/adapters/partnersAdapter.ts](lib/adapters/partnersAdapter.ts), [components/UnifiedAdminPage.tsx](components/UnifiedAdminPage.tsx)
- [x] Purpose: Manage partner records and partner-level reporting configuration, hashtags, and link associations.
- [x] Entities: Partner, reportTemplateId, styleId, bitlyLinkIds, hashtags, categorizedHashtags, sportsDb, GoogleSheetConfig.
- [x] Inputs: name, emoji, hashtags/categorizedHashtags, report template selection, report style selection, bitly link selection, logo upload, Google Sheets setup, SportsDB lookup.
- [x] Outputs: partner records, share links, report template/style assignment, bitly associations, Google Sheets sync state.
- [x] Ownership scope: Partner.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Template/style assignment duplicates Events; bitly link association overlaps Bitly Manager; hashtag tagging overlaps Hashtag Manager and Category Manager; Google Sheets controls also appear in /admin/partners/[id].
- [x] Connected report/insight dependencies: reportTemplateId/styleId feed report rendering; SharePopup generates report links for partners.

2.1.1 A-UI-01 Documentation Target: Partners
- [x] Concrete page routes: /admin/partners, /admin/partners/[id], /admin/partners/[id]/analytics, /admin/partners/[id]/kyc-data
- [x] Main components: UnifiedAdminPage, FormModal, SharePopup, UnifiedHashtagInput, BitlyLinksSelector, EmojiSelector, TheSportsDBSearch, GoogleSheetsConnectModal, GoogleSheetsSyncButtons.
- [x] Report connections: reportTemplateId/styleId assignments drive partner report rendering; SharePopup uses viewSlug for report links; partner KYC data uses global variables-config for report data.

2.2 Events (A-UI-02)
- [x] Route: /admin/events
- [x] Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/adapters/projectsAdapter.ts](lib/adapters/projectsAdapter.ts), [components/SharePopup.tsx](components/SharePopup.tsx)
- [x] Purpose: Manage event (project) records, partner associations, and reporting configuration.
- [x] Entities: Project (Event), partner1Id/partner2Id, reportTemplateId, styleId, hashtags, categorizedHashtags, viewSlug.
- [x] Inputs: event name/date, partner selection, hashtags/categorizedHashtags, report template/style selection.
- [x] Outputs: event records, share links, report template/style assignment for reports.
- [x] Ownership scope: Event.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Template/style assignment duplicates Partners; bitly associations handled in Bitly Manager; hashtag management overlaps Hashtag Manager; partner assignments overlap /admin/project-partners; event KYC detail exists at /admin/events/[id]/kyc-data.
- [x] Connected report/insight dependencies: reportTemplateId/styleId feed report rendering; SharePopup generates event report links; event stats feed analytics insights.

2.2.1 A-UI-02 Documentation Target: Events
- [x] Concrete page routes: /admin/events, /admin/events/[id]/kyc-data, /admin/project-partners, /admin/quick-add, /admin/projects (redirect)
- [x] Main components: UnifiedAdminPage, FormModal, SharePopup, UnifiedHashtagInput, BitlyLinksEditor.
- [x] Report connections: event report template/style assignments feed report rendering; SharePopup uses viewSlug for report links; event KYC data table ties to report variables.

2.3 Filters (A-UI-03)
- [x] Route: /admin/filter
- [x] Code references: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagMultiSelect.tsx](components/HashtagMultiSelect.tsx), [components/SharePopup.tsx](components/SharePopup.tsx)
- [x] Purpose: Filter project statistics by hashtags and present aggregated results.
- [x] Entities: Hashtag, ProjectStats, report style, filter slug.
- [x] Inputs: selected hashtags, report style selection.
- [x] Outputs: aggregated stats/project list and shareable filter slug.
- [x] Ownership scope: Event (cross-event filter view).
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Hashtag search/pagination duplicates Hashtag Manager; style selection duplicates Styles; filtering overlaps dashboard filter tab.
- [x] Connected report/insight dependencies: Uses report style library; share slug ties to report/share views; filtered stats feed report-like dashboards.

2.3.1 A-UI-03 Documentation Target: Filters
- [x] Concrete page routes: /admin/filter
- [x] Main components: HashtagMultiSelect, SharePopup, UnifiedAdminHeroWithSearch, ColoredCard, ColoredHashtagBubble.
- [x] Report connections: uses /api/report-styles for style selection and persists filter styles for shareable report views.

2.4 Users (A-UI-04)
- [x] Route: /admin/users
- [x] Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)
- [x] Purpose: Manage admin users, roles, and API access.
- [x] Entities: AdminUser, role, API access.
- [x] Inputs: create user (email, name, role), regenerate password, toggle API access, change role.
- [x] Outputs: admin accounts, role assignments, API access state.
- [x] Ownership scope: User.
- [x] Permissions: Authenticated admin session via /api/admin/auth; role enforcement handled by backend endpoints.
- [x] Known inconsistencies: None observed in code references.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: Roles gate access to report and insight administration; no direct report data dependencies.

2.4.1 A-UI-04 Documentation Target: Users
- [x] Concrete page routes: /admin/users
- [x] Main components: UnifiedAdminPage, FormModal, PasswordModal, RoleDropdown, ConfirmDialog.
- [x] Report connections: no direct report data; role permissions control access to report and insight admin areas.

2.5 Insights (A-UI-05)
- [x] Route: /admin/insights
- [x] Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)
- [x] Purpose: View analytics insights with filtering controls.
- [x] Entities: Insight, InsightsMetadata.
- [x] Inputs: type filter, severity filter, limit.
- [x] Outputs: insight list and metadata for analytics monitoring.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: Overlaps /admin/analytics/insights (separate dashboard and endpoints).
- [x] Duplicate flows: Insights are duplicated between /admin/insights and /admin/analytics/insights.
- [x] Connected report/insight dependencies: Consumes /api/analytics/insights; insights derived from analytics data used in executive analytics.

2.5.1 A-UI-05 Documentation Target: Insights
- [x] Concrete page routes: /admin/insights, /admin/analytics/insights
- [x] Main components: AdminHero, InsightCard, ColoredCard.
- [x] Report connections: analytics insights feed executive analytics and dashboard KPIs; no report template configuration.

2.6 KYC (A-UI-06)
- [x] Route: /admin/kyc
- [x] Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)
- [x] Purpose: Manage variables catalog used by analytics and clicker.
- [x] Entities: Variable, variable flags, categories.
- [x] Inputs: variable create/edit, source filters, flags, category tags.
- [x] Outputs: variables configuration for clicker and analytics.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: Partner and event KYC data pages present scoped datasets while variable definitions remain global in /admin/kyc.
- [x] Duplicate flows: Variable definitions are edited here and referenced in ChartAlgorithmManager and Clicker Manager.
- [x] Connected report/insight dependencies: variables-config drives chart algorithms and report templates; KYC data tables surface variables used in reports and analytics.

2.6.1 A-UI-06 Documentation Target: KYC
- [x] Concrete page routes: /admin/kyc, /admin/partners/[id]/kyc-data, /admin/events/[id]/kyc-data
- [x] Main components: UnifiedAdminHeroWithSearch, FormModal, MaterialIcon, ColoredCard.
- [x] Report connections: variables-config feeds chart algorithms and report templates; partner/event KYC data reflects report variables.
- [x] KYC to Algorithms mapping: variables-config consumed by ChartAlgorithmManager for formulas and field definitions. Evidence: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/charts/page.tsx](app/admin/charts/page.tsx)
- [x] KYC to Report templates mapping: report templates reference chart configs that rely on variables-config. Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)
- [x] Partner vs global conflict notes: Partner/event KYC data pages present scoped datasets while variable definitions remain global; no partner-specific variables-config observed.

2.7 Algorithms
- [x] Route: /admin/charts
- [x] Code references: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx)
- [x] Purpose: Manage chart algorithm configurations and formatting defaults.
- [x] Entities: chart config, chart formatting defaults, variables.
- [x] Inputs: chart configuration fields and formulas.
- [x] Outputs: chart configuration used in report rendering and validation.
- [x] Ownership scope: Global.
- [x] Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Depends on variables-config managed in KYC; overlap in variable management surfaces.
- [x] Connected report/insight dependencies: chart configs are referenced by report templates and rendering.

2.8 Clicker Manager
- [x] Route: /admin/clicker-manager
- [x] Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)
- [x] Purpose: Configure variable groups, ordering, and visibility for clicker UI.
- [x] Entities: VariableGroup, Variable.
- [x] Inputs: group order, variable selection, visibility toggles, seed defaults.
- [x] Outputs: clicker layout configuration for editor UI.
- [x] Ownership scope: Global.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Variable definitions are managed in KYC; clicker groups depend on shared variables.
- [x] Connected report/insight dependencies: clicker variables drive data capture for reports and analytics.

2.9 Bitly Manager
- [x] Route: /admin/bitly
- [x] Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [components/ProjectSelector.tsx](components/ProjectSelector.tsx), [components/PartnerSelector.tsx](components/PartnerSelector.tsx)
- [x] Purpose: Manage Bitly links and their associations to projects and partners.
- [x] Entities: BitlyLink, Project, Partner.
- [x] Inputs: link creation, partner/project associations, favorites, sync and analytics actions.
- [x] Outputs: link associations and analytics metadata.
- [x] Ownership scope: Global with partner/event associations.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Partner link association also managed in Partners.
- [x] Connected report/insight dependencies: Bitly links used for report/share URLs and link analytics.

2.10 Hashtag Manager
- [x] Route: /admin/hashtags
- [x] Code references: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)
- [x] Purpose: Manage hashtag colors and browse hashtag usage.
- [x] Entities: Hashtag, HashtagColor.
- [x] Inputs: search term, color updates, cascade actions.
- [x] Outputs: hashtag color metadata for display and filtering.
- [x] Ownership scope: Global.
- [x] Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Hashtag categories are managed separately in Category Manager.
- [x] Connected report/insight dependencies: hashtags drive report filtering and analytics grouping.

2.11 Category Manager
- [x] Route: /admin/categories
- [x] Code references: [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts)
- [x] Purpose: Manage hashtag categories, ordering, and color metadata.
- [x] Entities: HashtagCategory.
- [x] Inputs: category name, color, order.
- [x] Outputs: categories used for hashtag tagging and filtering.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Hashtag color editing lives in Hashtag Manager, splitting hashtag metadata across pages.
- [x] Connected report/insight dependencies: hashtag categories influence report filtering and analytics groupings.

2.12 Reporting
- [x] Route: /admin/visualization
- [x] Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)
- [x] Purpose: Manage report templates, data blocks, and chart assignments.
- [x] Entities: ReportTemplate, DataVisualizationBlock, chart config, user preferences.
- [x] Inputs: template creation, block composition, chart selection, grid settings.
- [x] Outputs: report templates used by partners and events.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: Template selection also exists in Partners and Events; default rules must be aligned.
- [x] Duplicate flows: Template assignment overlaps Partners and Events configuration.
- [x] Connected report/insight dependencies: report templates are core to report rendering and chart selection.

2.13 Style Library
- [x] Route: /admin/styles
- [x] Code references: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- [x] Purpose: Manage report style library for reports.
- [x] Entities: ReportStyle.
- [x] Inputs: create/edit/delete style records; navigation to editor.
- [x] Outputs: styles list and updated style records.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page; relies on admin layout and API access.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Style selection occurs in Partners, Events, and Filters; editor lives at /admin/styles/[id].
- [x] Connected report/insight dependencies: report styles drive report rendering and filter styling.

2.14 Cache Management
- [x] Route: /admin/cache
- [x] Code references: [app/admin/cache/page.tsx](app/admin/cache/page.tsx)
- [x] Purpose: Clear server and browser caches.
- [x] Entities: cache types (build, routes, browser, all).
- [x] Inputs: cache clear actions.
- [x] Outputs: cache invalidation results.
- [x] Ownership scope: Global.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: cache actions affect report and analytics freshness; no direct data dependency.

2.15 User Guide
- [x] Route: /admin/help
- [x] Code references: [app/admin/help/page.tsx](app/admin/help/page.tsx)
- [x] Purpose: Display admin user guide content with role-based messages.
- [x] Entities: user role, guide sections.
- [x] Inputs: none (read-only page).
- [x] Outputs: help and onboarding content.
- [x] Ownership scope: Global.
- [x] Permissions: Uses /api/admin/auth for greeting; page includes guest guidance.
- [x] Known inconsistencies: Comment references END_USER_GUIDE.md which is not present; guide content is embedded in page.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.16 Admin Dashboard (Root)
- [x] Route: /admin
- [x] Code references: [app/admin/page.tsx](app/admin/page.tsx), [components/AdminDashboard.tsx](components/AdminDashboard.tsx), [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts)
- [x] Purpose: Entry dashboard with navigation cards to admin areas.
- [x] Entities: AdminUser, permissions.
- [x] Inputs: none (read-only dashboard).
- [x] Outputs: navigation to admin sections.
- [x] Ownership scope: Global.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: Overlaps /admin/dashboard dashboard view.
- [x] Duplicate flows: Dashboard content overlaps /admin/dashboard.
- [x] Connected report/insight dependencies: Navigation to report and analytics surfaces; no direct report data dependency.

2.17 Dashboard (Legacy)
- [x] Route: /admin/dashboard
- [x] Code references: [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx)
- [x] Purpose: Aggregated dashboard with overview, success metrics, stats, and multi-hashtag filtering.
- [x] Entities: Project, ProjectStats, hashtag slugs.
- [x] Inputs: tab selection, hashtag filter.
- [x] Outputs: aggregated stats and filtered project list.
- [x] Ownership scope: Global.
- [x] Permissions: Reads admin_token/admin_user cookies; no /api/admin/auth check in page.
- [x] Known inconsistencies: Auth guard differs from /api/admin/auth usage in other admin pages.
- [x] Duplicate flows: Overlaps /admin root dashboard and /admin/filter filtering.
- [x] Connected report/insight dependencies: Aggregated stats overlap with insights and report analytics.

2.18 Projects Redirect
- [x] Route: /admin/projects
- [x] Code references: [app/admin/projects/page.tsx](app/admin/projects/page.tsx)
- [x] Purpose: Redirect legacy /admin/projects route to /admin/events.
- [x] Entities: none.
- [x] Inputs: none.
- [x] Outputs: client-side redirect to /admin/events.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: Legacy route kept for backward compatibility.
- [x] Duplicate flows: Duplicate entrypoint to /admin/events.
- [x] Connected report/insight dependencies: None observed.

2.19 Project-Partner Relationships
- [x] Route: /admin/project-partners
- [x] Code references: [app/admin/project-partners/page.tsx](app/admin/project-partners/page.tsx)
- [x] Purpose: Manage partner1/partner2 assignments for projects and auto-suggest partners.
- [x] Entities: Project, Partner.
- [x] Inputs: partner selection, auto-suggest action, filter (all/missing/assigned).
- [x] Outputs: updated partner assignments for projects.
- [x] Ownership scope: Event.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Partner assignment overlaps /admin/events edit flow.
- [x] Connected report/insight dependencies: Partner assignment affects report ownership and analytics grouping.

2.20 Partner Detail
- [x] Route: /admin/partners/[id]
- [x] Code references: [app/admin/partners/[id]/page.tsx](app/admin/partners/[id]/page.tsx), [components/GoogleSheetsConnectModal.tsx](components/GoogleSheetsConnectModal.tsx), [components/GoogleSheetsSyncButtons.tsx](components/GoogleSheetsSyncButtons.tsx)
- [x] Purpose: Partner detail view with Google Sheets integration controls.
- [x] Entities: Partner, GoogleSheetConfig.
- [x] Inputs: connect/disconnect sheet, pull/push sync.
- [x] Outputs: Google Sheets sync status and partner metadata.
- [x] Ownership scope: Partner.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Google Sheets controls also appear in /admin/partners list page.
- [x] Connected report/insight dependencies: Google Sheets sync affects partner data used in reports.

2.21 Partner Analytics
- [x] Route: /admin/partners/[id]/analytics
- [x] Code references: [app/admin/partners/[id]/analytics/page.tsx](app/admin/partners/[id]/analytics/page.tsx)
- [x] Purpose: Partner analytics dashboard with summary, trends, and comparisons.
- [x] Entities: PartnerAnalyticsData, event summaries.
- [x] Inputs: tab selection.
- [x] Outputs: analytics views and tables for partner.
- [x] Ownership scope: Partner.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: Analytics dashboards also exist at /admin/insights and /admin/analytics/*.
- [x] Duplicate flows: Analytics/insight dashboards overlap across partner analytics and global insights.
- [x] Connected report/insight dependencies: Uses analytics datasets that also feed insights and executive analytics.

2.22 Partner KYC Data
- [x] Route: /admin/partners/[id]/kyc-data
- [x] Code references: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx)
- [x] Purpose: Aggregated KYC data across all events for a partner.
- [x] Entities: Partner, VariableMetadata, aggregated stats.
- [x] Inputs: search, category filter.
- [x] Outputs: aggregated KYC table for partner.
- [x] Ownership scope: Partner.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Similar KYC view exists for events.
- [x] Connected report/insight dependencies: KYC data derived from variables-config used in reports and analytics.

2.23 Event KYC Data
- [x] Route: /admin/events/[id]/kyc-data
- [x] Code references: [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx)
- [x] Purpose: Event-specific KYC data table view.
- [x] Entities: Project, VariableMetadata.
- [x] Inputs: search, category filter.
- [x] Outputs: KYC table for a single event.
- [x] Ownership scope: Event.
- [x] Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Similar KYC view exists for partners.
- [x] Connected report/insight dependencies: KYC data derived from variables-config used in reports and analytics.

2.24 Quick Add
- [x] Route: /admin/quick-add
- [x] Code references: [app/admin/quick-add/page.tsx](app/admin/quick-add/page.tsx)
- [x] Purpose: Bulk event creation from sheet data and partner selections.
- [x] Entities: Project, Partner, fixtures.
- [x] Inputs: raw sheet row data, partner selections, match date, fixture selection.
- [x] Outputs: new projects/events and drafted fixtures.
- [x] Ownership scope: Event.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Event creation overlaps /admin/events.
- [x] Connected report/insight dependencies: Newly created events drive report generation and analytics.

2.25 Content Library
- [x] Route: /admin/content-library
- [x] Code references: [app/admin/content-library/page.tsx](app/admin/content-library/page.tsx), [lib/contentAssetTypes.ts](lib/contentAssetTypes.ts)
- [x] Purpose: Manage image/text content assets for chart formulas.
- [x] Entities: ContentAsset, ChartReference.
- [x] Inputs: upload/edit/delete assets, search, filters.
- [x] Outputs: content asset records and usage status.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: Content assets referenced in chart formulas and report templates.

2.26 Admin Design
- [x] Route: /admin/design
- [x] Code references: [app/admin/design/page.tsx](app/admin/design/page.tsx), [hooks/useAvailableFonts.ts](hooks/useAvailableFonts.ts)
- [x] Purpose: Manage admin UI typography settings (global font).
- [x] Entities: UI settings, AvailableFont.
- [x] Inputs: font selection.
- [x] Outputs: updated UI settings via /api/admin/ui-settings.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: Report style editor is separate at /admin/styles.
- [x] Connected report/insight dependencies: Admin UI typography only; no report template dependency.

2.27 API-Football Enrichment
- [x] Route: /admin/api-football-enrich
- [x] Code references: [app/admin/api-football-enrich/page.tsx](app/admin/api-football-enrich/page.tsx)
- [x] Purpose: Manually trigger partner enrichment via API-Football.
- [x] Entities: EnrichmentStatus.
- [x] Inputs: manual trigger action.
- [x] Outputs: enrichment status and processed count.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: Enrichment updates data used in reports and analytics.

2.28 Analytics Insights (Phase 3)
- [x] Route: /admin/analytics/insights
- [x] Code references: [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx)
- [x] Purpose: Insights dashboard with filtering, prioritization, and action tracking.
- [x] Entities: Insight, filters, action state.
- [x] Inputs: filters, search, action/dismiss.
- [x] Outputs: filtered insight list.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: Overlaps /admin/insights (different API endpoint and UX).
- [x] Duplicate flows: Analytics insights duplicated across /admin/insights and /admin/analytics/insights.
- [x] Connected report/insight dependencies: Consumes analytics insights data; informs executive analytics and report KPIs.

2.29 Executive Analytics
- [x] Route: /admin/analytics/executive
- [x] Code references: [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx)
- [x] Purpose: Executive dashboard for aggregated KPIs, trends, and critical insights.
- [x] Entities: ExecutiveMetrics, TrendData, Insight.
- [x] Inputs: period selection.
- [x] Outputs: KPI cards, trend charts, top events, insights.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: Overlaps /admin/dashboard aggregated stats.
- [x] Duplicate flows: Executive analytics overlaps legacy dashboard KPIs.
- [x] Connected report/insight dependencies: Uses analytics data and insights; no report template dependency.

2.30 Admin Login
- [x] Route: /admin/login
- [x] Code references: [app/admin/login/page.tsx](app/admin/login/page.tsx)
- [x] Purpose: Admin login using email/password.
- [x] Entities: Admin session.
- [x] Inputs: email, password.
- [x] Outputs: session cookie and redirect to /admin.
- [x] Ownership scope: User.
- [x] Permissions: Public (pre-auth).
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.31 Admin Register
- [x] Route: /admin/register
- [x] Code references: [app/admin/register/page.tsx](app/admin/register/page.tsx)
- [x] Purpose: Guest registration flow with auto-login.
- [x] Entities: AdminUser (guest).
- [x] Inputs: name, email, password.
- [x] Outputs: guest session and redirect to /admin/help.
- [x] Ownership scope: User.
- [x] Permissions: Public (pre-auth).
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.32 Clear Session
- [x] Route: /admin/clear-session
- [x] Code references: [app/admin/clear-session/page.tsx](app/admin/clear-session/page.tsx)
- [x] Purpose: Clear admin session cookies for login recovery.
- [x] Entities: session cookies.
- [x] Inputs: clear action.
- [x] Outputs: cleared cookies and redirect to /admin/login.
- [x] Ownership scope: User.
- [x] Permissions: Public (no auth check).
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.33 Cookie Test
- [x] Route: /admin/cookie-test
- [x] Code references: [app/admin/cookie-test/page.tsx](app/admin/cookie-test/page.tsx)
- [x] Purpose: Debug auth cookies and /api/admin/auth response.
- [x] Entities: auth status.
- [x] Inputs: none.
- [x] Outputs: auth/cookie diagnostics.
- [x] Ownership scope: User.
- [x] Permissions: Public; calls /api/admin/auth.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: Debug-only route.
- [x] Connected report/insight dependencies: None observed.

2.34 Unauthorized
- [x] Route: /admin/unauthorized
- [x] Code references: [app/admin/unauthorized/page.tsx](app/admin/unauthorized/page.tsx)
- [x] Purpose: Access denied screen with role context and routing help.
- [x] Entities: UserRole.
- [x] Inputs: query param path and auth lookup.
- [x] Outputs: denial message and navigation options.
- [x] Ownership scope: User.
- [x] Permissions: Calls /api/admin/auth for role.
- [x] Known inconsistencies: None observed.
- [x] Duplicate flows: None observed.
- [x] Connected report/insight dependencies: None observed.

2.35 Style Editor
- [x] Route: /admin/styles/[id]
- [x] Code references: [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- [x] Purpose: Edit or create report styles with live preview.
- [x] Entities: ReportStyle.
- [x] Inputs: color fields, name, font settings.
- [x] Outputs: saved report style records.
- [x] Ownership scope: Global.
- [x] Permissions: No explicit auth check in page.
- [x] Known inconsistencies: None noted beyond duplication register.
- [x] Duplicate flows: Style assignment occurs in Partners, Events, and Filters.
- [x] Connected report/insight dependencies: report styles used by report rendering and filter views.

3 Duplication and Noise Register (A-UI-00)

3.1 Partner and Event configuration overlap
- [x] Page routes: /admin/partners, /admin/events
- [x] What duplicates what: reportTemplateId/styleId selection, hashtags/categorizedHashtags assignment, SharePopup usage.
- [x] Recommended merge/remove direction: Partner assignment as default; Event assignment as override.
- [x] Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

3.2 Hashtag search and pagination duplication
- [x] Page routes: /admin/filter, /admin/hashtags
- [x] What duplicates what: /api/hashtags pagination and search handling.
- [x] Recommended merge/remove direction: Single shared search/pagination surface.
- [x] Evidence: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)

3.3 Variable management surface duplication
- [x] Page routes: /admin/kyc, /admin/charts, /admin/clicker-manager
- [x] What duplicates what: variables-config edited in KYC and referenced in algorithms and clicker grouping.
- [x] Recommended merge/remove direction: KYC as primary edit surface; other surfaces read-only for variable definitions.
- [x] Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

3.4 Bitly link association duplication
- [x] Page routes: /admin/bitly, /admin/partners
- [x] What duplicates what: partner link association appears in both Bitly Manager and Partners.
- [x] Recommended merge/remove direction: Centralize link association in Bitly Manager.
- [x] Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

3.5 Hashtag metadata split across pages
- [x] Page routes: /admin/hashtags, /admin/categories
- [x] What duplicates what: hashtag color editing vs category management for hashtags.
- [x] Recommended merge/remove direction: Single hashtag metadata surface (color and categories).
- [x] Evidence: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [app/admin/categories/page.tsx](app/admin/categories/page.tsx)

3.6 Report style assignment duplication
- [x] Page routes: /admin/styles, /admin/partners, /admin/events, /admin/filter
- [x] What duplicates what: style selection occurs in multiple pages.
- [x] Recommended merge/remove direction: Single assignment rule set; keep style editing in /admin/styles.
- [x] Evidence: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)

3.7 Report template assignment duplication
- [x] Page routes: /admin/visualization, /admin/partners, /admin/events
- [x] What duplicates what: template editing vs template assignment across pages.
- [x] Recommended merge/remove direction: Single assignment rule set; keep template editing in /admin/visualization.
- [x] Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)

4 Blockers and Missing Artifacts (A-UI-00)
- [x] Missing artifact: END_USER_GUIDE.md
- [x] Reference location: [app/admin/help/page.tsx:9](app/admin/help/page.tsx)
- [x] Impact: User guide references external file; content currently embedded in page.

5 Coverage Check

5.1 Confirmed present in codebase (page.tsx exists)
- [x] /admin -> app/admin/page.tsx
- [x] /admin/dashboard -> app/admin/dashboard/page.tsx
- [x] /admin/analytics/executive -> app/admin/analytics/executive/page.tsx
- [x] /admin/analytics/insights -> app/admin/analytics/insights/page.tsx
- [x] /admin/insights -> app/admin/insights/page.tsx
- [x] /admin/events -> app/admin/events/page.tsx
- [x] /admin/events/[id]/kyc-data -> app/admin/events/[id]/kyc-data/page.tsx
- [x] /admin/partners -> app/admin/partners/page.tsx
- [x] /admin/partners/[id] -> app/admin/partners/[id]/page.tsx
- [x] /admin/partners/[id]/analytics -> app/admin/partners/[id]/analytics/page.tsx
- [x] /admin/partners/[id]/kyc-data -> app/admin/partners/[id]/kyc-data/page.tsx
- [x] /admin/projects -> app/admin/projects/page.tsx
- [x] /admin/project-partners -> app/admin/project-partners/page.tsx
- [x] /admin/quick-add -> app/admin/quick-add/page.tsx
- [x] /admin/filter -> app/admin/filter/page.tsx
- [x] /admin/users -> app/admin/users/page.tsx
- [x] /admin/kyc -> app/admin/kyc/page.tsx
- [x] /admin/charts -> app/admin/charts/page.tsx
- [x] /admin/clicker-manager -> app/admin/clicker-manager/page.tsx
- [x] /admin/bitly -> app/admin/bitly/page.tsx
- [x] /admin/hashtags -> app/admin/hashtags/page.tsx
- [x] /admin/categories -> app/admin/categories/page.tsx
- [x] /admin/visualization -> app/admin/visualization/page.tsx
- [x] /admin/styles -> app/admin/styles/page.tsx
- [x] /admin/styles/[id] -> app/admin/styles/[id]/page.tsx
- [x] /admin/cache -> app/admin/cache/page.tsx
- [x] /admin/content-library -> app/admin/content-library/page.tsx
- [x] /admin/design -> app/admin/design/page.tsx
- [x] /admin/api-football-enrich -> app/admin/api-football-enrich/page.tsx
- [x] /admin/help -> app/admin/help/page.tsx
- [x] /admin/login -> app/admin/login/page.tsx
- [x] /admin/register -> app/admin/register/page.tsx
- [x] /admin/clear-session -> app/admin/clear-session/page.tsx
- [x] /admin/cookie-test -> app/admin/cookie-test/page.tsx
- [x] /admin/unauthorized -> app/admin/unauthorized/page.tsx

5.2 Suspected or unknown
- [x] None identified in app/admin route scan.