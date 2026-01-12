# Admin UI Capability Map
Status: Draft
Last Updated: 2026-01-12T11:08:31.000Z
Canonical: No
Owner: Audit

1 Purpose
- Map Admin UI capabilities for A-UI-00 and capture ownership, inputs, outputs, and duplication using code references.
- Inventory includes all verified admin routes under app/admin.

2 Admin Areas (A-UI-00)

2.1 Partners
- Route: /admin/partners
- Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [lib/adapters/partnersAdapter.ts](lib/adapters/partnersAdapter.ts), [components/UnifiedAdminPage.tsx](components/UnifiedAdminPage.tsx)
- Purpose: Manage partner records and partner-level reporting configuration, hashtags, and link associations.
- Primary entities: Partner, reportTemplateId, styleId, bitlyLinkIds, hashtags, categorizedHashtags, sportsDb.
- Inputs: name, emoji, hashtags/categorizedHashtags, report template selection, report style selection, bitly link selection, logo upload, Google Sheets setup.
- Outputs: partner records, share links, report template/style assignment, bitly associations, Google Sheets sync data.
- Ownership scope: Partner.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- Known inconsistencies and duplicate flows: Template/style assignment duplicates Events; bitly link association overlaps Bitly Manager; hashtag tagging overlaps Hashtag Manager and Category Manager; Google Sheets controls also appear in /admin/partners/[id].

2.2 Events
- Route: /admin/events
- Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/adapters/projectsAdapter.ts](lib/adapters/projectsAdapter.ts), [components/SharePopup.tsx](components/SharePopup.tsx)
- Purpose: Manage event (project) records, partner associations, and reporting configuration.
- Primary entities: Project (Event), partner1Id/partner2Id, reportTemplateId, styleId, hashtags, categorizedHashtags.
- Inputs: event name/date, partner selection, hashtags/categorizedHashtags, report template/style selection.
- Outputs: event records, share links, report template/style assignment for reports.
- Ownership scope: Event.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- Known inconsistencies and duplicate flows: Template/style assignment duplicates Partners; bitly associations handled in Bitly Manager; hashtag management overlaps Hashtag Manager; partner assignments overlap /admin/project-partners; event KYC detail exists at /admin/events/[id]/kyc-data.

2.3 Filters
- Route: /admin/filter
- Code references: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagMultiSelect.tsx](components/HashtagMultiSelect.tsx), [components/SharePopup.tsx](components/SharePopup.tsx)
- Purpose: Filter project statistics by hashtags and present aggregated results.
- Primary entities: Hashtag, ProjectStats, report style, filter slug.
- Inputs: selected hashtags, report style selection.
- Outputs: aggregated stats/project list and shareable filter slug.
- Ownership scope: Event (cross-event filter view).
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Hashtag search/pagination duplicates Hashtag Manager; style selection duplicates Styles; filtering overlaps dashboard filter tab.

2.4 Users
- Route: /admin/users
- Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)
- Purpose: Manage admin users, roles, and API access.
- Primary entities: AdminUser, role, API access.
- Inputs: create user (email, name, role), regenerate password, toggle API access, change role.
- Outputs: admin accounts, role assignments, API access state.
- Ownership scope: User.
- Permissions: Authenticated admin session via /api/admin/auth; role enforcement handled by backend endpoints.
- Known inconsistencies and duplicate flows: None observed in code references.

2.5 Insights
- Route: /admin/insights
- Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)
- Purpose: View analytics insights with filtering controls.
- Primary entities: Insight, InsightsMetadata.
- Inputs: type filter, severity filter, limit.
- Outputs: insight list and metadata for analytics monitoring.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Overlaps /admin/analytics/insights (separate dashboard and endpoints).

2.6 KYC
- Route: /admin/kyc
- Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)
- Purpose: Manage variables catalog used by analytics and clicker.
- Primary entities: Variable, variable flags, categories.
- Inputs: variable create/edit, source filters, flags, category tags.
- Outputs: variables configuration for clicker and analytics.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Variable definitions are edited here and referenced in ChartAlgorithmManager and Clicker Manager.

2.7 Algorithms
- Route: /admin/charts
- Code references: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx)
- Purpose: Manage chart algorithm configurations and formatting defaults.
- Primary entities: chart config, chart formatting defaults, variables.
- Inputs: chart configuration fields and formulas.
- Outputs: chart configuration used in report rendering and validation.
- Ownership scope: Global.
- Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- Known inconsistencies and duplicate flows: Depends on variables-config managed in KYC; overlap in variable management surfaces.

2.8 Clicker Manager
- Route: /admin/clicker-manager
- Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)
- Purpose: Configure variable groups, ordering, and visibility for clicker UI.
- Primary entities: VariableGroup, Variable.
- Inputs: group order, variable selection, visibility toggles, seed defaults.
- Outputs: clicker layout configuration for editor UI.
- Ownership scope: Global.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- Known inconsistencies and duplicate flows: Variable definitions are managed in KYC; clicker groups depend on shared variables.

2.9 Bitly Manager
- Route: /admin/bitly
- Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [components/ProjectSelector.tsx](components/ProjectSelector.tsx), [components/PartnerSelector.tsx](components/PartnerSelector.tsx)
- Purpose: Manage Bitly links and their associations to projects and partners.
- Primary entities: BitlyLink, Project, Partner.
- Inputs: link creation, partner/project associations, favorites, sync and analytics actions.
- Outputs: link associations and analytics metadata.
- Ownership scope: Global with partner/event associations.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: Partner link association also managed in Partners.

2.10 Hashtag Manager
- Route: /admin/hashtags
- Code references: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)
- Purpose: Manage hashtag colors and browse hashtag usage.
- Primary entities: Hashtag, HashtagColor.
- Inputs: search term, color updates, cascade actions.
- Outputs: hashtag color metadata for display and filtering.
- Ownership scope: Global.
- Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- Known inconsistencies and duplicate flows: Hashtag categories are managed separately in Category Manager.

2.11 Category Manager
- Route: /admin/categories
- Code references: [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts)
- Purpose: Manage hashtag categories, ordering, and color metadata.
- Primary entities: HashtagCategory.
- Inputs: category name, color, order.
- Outputs: categories used for hashtag tagging and filtering.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Hashtag color editing lives in Hashtag Manager, splitting hashtag metadata across pages.

2.12 Reporting
- Route: /admin/visualization
- Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)
- Purpose: Manage report templates, data blocks, and chart assignments.
- Primary entities: ReportTemplate, DataVisualizationBlock, chart config, user preferences.
- Inputs: template creation, block composition, chart selection, grid settings.
- Outputs: report templates used by partners and events.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Template selection also exists in Partners and Events; default rules must be aligned.

2.13 Style Library
- Route: /admin/styles
- Code references: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- Purpose: Manage report style library for reports.
- Primary entities: ReportStyle.
- Inputs: create/edit/delete style records; navigation to editor.
- Outputs: styles list and updated style records.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Style selection occurs in Partners, Events, and Filters; editor lives at /admin/styles/[id].

2.14 Cache Management
- Route: /admin/cache
- Code references: [app/admin/cache/page.tsx](app/admin/cache/page.tsx)
- Purpose: Clear server and browser caches.
- Primary entities: cache types (build, routes, browser, all).
- Inputs: cache clear actions.
- Outputs: cache invalidation results.
- Ownership scope: Global.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: None observed in code references.

2.15 User Guide
- Route: /admin/help
- Code references: [app/admin/help/page.tsx](app/admin/help/page.tsx)
- Purpose: Display admin user guide content with role-based messages.
- Primary entities: user role, guide sections.
- Inputs: none (read-only page).
- Outputs: help and onboarding content.
- Ownership scope: Global.
- Permissions: Uses /api/admin/auth for greeting; page includes guest guidance.
- Known inconsistencies and duplicate flows: Comment references END_USER_GUIDE.md which is not present; guide content is embedded in page.

2.16 Admin Dashboard (Root)
- Route: /admin
- Code references: [app/admin/page.tsx](app/admin/page.tsx), [components/AdminDashboard.tsx](components/AdminDashboard.tsx), [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts)
- Purpose: Entry dashboard with navigation cards to admin areas.
- Primary entities: AdminUser, permissions.
- Inputs: none (read-only dashboard).
- Outputs: navigation to admin sections.
- Ownership scope: Global.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: Overlaps /admin/dashboard dashboard view.

2.17 Dashboard (Legacy)
- Route: /admin/dashboard
- Code references: [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx)
- Purpose: Aggregated dashboard with overview, success metrics, stats, and multi-hashtag filtering.
- Primary entities: Project, ProjectStats, hashtag slugs.
- Inputs: tab selection, hashtag filter.
- Outputs: aggregated stats and filtered project list.
- Ownership scope: Global.
- Permissions: Reads admin_token/admin_user cookies; no /api/admin/auth check in page.
- Known inconsistencies and duplicate flows: Overlaps /admin root dashboard and /admin/filter filtering.

2.18 Projects Redirect
- Route: /admin/projects
- Code references: [app/admin/projects/page.tsx](app/admin/projects/page.tsx)
- Purpose: Redirect legacy /admin/projects route to /admin/events.
- Primary entities: none.
- Inputs: none.
- Outputs: client-side redirect to /admin/events.
- Ownership scope: Global.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: Legacy route kept for backward compatibility.

2.19 Project-Partner Relationships
- Route: /admin/project-partners
- Code references: [app/admin/project-partners/page.tsx](app/admin/project-partners/page.tsx)
- Purpose: Manage partner1/partner2 assignments for projects and auto-suggest partners.
- Primary entities: Project, Partner.
- Inputs: partner selection, auto-suggest action, filter (all/missing/assigned).
- Outputs: updated partner assignments for projects.
- Ownership scope: Event.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: Partner assignment overlaps /admin/events edit flow.

2.20 Partner Detail
- Route: /admin/partners/[id]
- Code references: [app/admin/partners/[id]/page.tsx](app/admin/partners/[id]/page.tsx), [components/GoogleSheetsConnectModal.tsx](components/GoogleSheetsConnectModal.tsx), [components/GoogleSheetsSyncButtons.tsx](components/GoogleSheetsSyncButtons.tsx)
- Purpose: Partner detail view with Google Sheets integration controls.
- Primary entities: Partner, GoogleSheetConfig.
- Inputs: connect/disconnect sheet, pull/push sync.
- Outputs: Google Sheets sync status and partner metadata.
- Ownership scope: Partner.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: Google Sheets controls also appear in /admin/partners list page.

2.21 Partner Analytics
- Route: /admin/partners/[id]/analytics
- Code references: [app/admin/partners/[id]/analytics/page.tsx](app/admin/partners/[id]/analytics/page.tsx)
- Purpose: Partner analytics dashboard with summary, trends, and comparisons.
- Primary entities: PartnerAnalyticsData, event summaries.
- Inputs: tab selection.
- Outputs: analytics views and tables for partner.
- Ownership scope: Partner.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: Analytics dashboards also exist at /admin/insights and /admin/analytics/*.

2.22 Partner KYC Data
- Route: /admin/partners/[id]/kyc-data
- Code references: [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx)
- Purpose: Aggregated KYC data across all events for a partner.
- Primary entities: Partner, VariableMetadata, aggregated stats.
- Inputs: search, category filter.
- Outputs: aggregated KYC table for partner.
- Ownership scope: Partner.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: Similar KYC view exists for events.

2.23 Event KYC Data
- Route: /admin/events/[id]/kyc-data
- Code references: [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx)
- Purpose: Event-specific KYC data table view.
- Primary entities: Project, VariableMetadata.
- Inputs: search, category filter.
- Outputs: KYC table for a single event.
- Ownership scope: Event.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: Similar KYC view exists for partners.

2.24 Quick Add
- Route: /admin/quick-add
- Code references: [app/admin/quick-add/page.tsx](app/admin/quick-add/page.tsx)
- Purpose: Bulk event creation from sheet data and partner selections.
- Primary entities: Project, Partner, fixtures.
- Inputs: raw sheet row data, partner selections, match date, fixture selection.
- Outputs: new projects/events and drafted fixtures.
- Ownership scope: Event.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: Event creation overlaps /admin/events.

2.25 Content Library
- Route: /admin/content-library
- Code references: [app/admin/content-library/page.tsx](app/admin/content-library/page.tsx), [lib/contentAssetTypes.ts](lib/contentAssetTypes.ts)
- Purpose: Manage image/text content assets for chart formulas.
- Primary entities: ContentAsset, ChartReference.
- Inputs: upload/edit/delete assets, search, filters.
- Outputs: content asset records and usage status.
- Ownership scope: Global.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: None observed in code references.

2.26 Admin Design
- Route: /admin/design
- Code references: [app/admin/design/page.tsx](app/admin/design/page.tsx), [hooks/useAvailableFonts.ts](hooks/useAvailableFonts.ts)
- Purpose: Manage admin UI typography settings (global font).
- Primary entities: UI settings, AvailableFont.
- Inputs: font selection.
- Outputs: updated UI settings via /api/admin/ui-settings.
- Ownership scope: Global.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: Report style editor is separate at /admin/styles.

2.27 API-Football Enrichment
- Route: /admin/api-football-enrich
- Code references: [app/admin/api-football-enrich/page.tsx](app/admin/api-football-enrich/page.tsx)
- Purpose: Manually trigger partner enrichment via API-Football.
- Primary entities: EnrichmentStatus.
- Inputs: manual trigger action.
- Outputs: enrichment status and processed count.
- Ownership scope: Global.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: None observed in code references.

2.28 Analytics Insights (Phase 3)
- Route: /admin/analytics/insights
- Code references: [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx)
- Purpose: Insights dashboard with filtering, prioritization, and action tracking.
- Primary entities: Insight, filters, action state.
- Inputs: filters, search, action/dismiss.
- Outputs: filtered insight list.
- Ownership scope: Global.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: Overlaps /admin/insights (different API endpoint and UX).

2.29 Executive Analytics
- Route: /admin/analytics/executive
- Code references: [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx)
- Purpose: Executive dashboard for aggregated KPIs, trends, and critical insights.
- Primary entities: ExecutiveMetrics, TrendData, Insight.
- Inputs: period selection.
- Outputs: KPI cards, trend charts, top events, insights.
- Ownership scope: Global.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: Overlaps /admin/dashboard aggregated stats.

2.30 Admin Login
- Route: /admin/login
- Code references: [app/admin/login/page.tsx](app/admin/login/page.tsx)
- Purpose: Admin login using email/password.
- Primary entities: Admin session.
- Inputs: email, password.
- Outputs: session cookie and redirect to /admin.
- Ownership scope: User.
- Permissions: Public (pre-auth).
- Known inconsistencies and duplicate flows: None observed in code references.

2.31 Admin Register
- Route: /admin/register
- Code references: [app/admin/register/page.tsx](app/admin/register/page.tsx)
- Purpose: Guest registration flow with auto-login.
- Primary entities: AdminUser (guest).
- Inputs: name, email, password.
- Outputs: guest session and redirect to /admin/help.
- Ownership scope: User.
- Permissions: Public (pre-auth).
- Known inconsistencies and duplicate flows: None observed in code references.

2.32 Clear Session
- Route: /admin/clear-session
- Code references: [app/admin/clear-session/page.tsx](app/admin/clear-session/page.tsx)
- Purpose: Clear admin session cookies for login recovery.
- Primary entities: session cookies.
- Inputs: clear action.
- Outputs: cleared cookies and redirect to /admin/login.
- Ownership scope: User.
- Permissions: Public (no auth check).
- Known inconsistencies and duplicate flows: None observed in code references.

2.33 Cookie Test
- Route: /admin/cookie-test
- Code references: [app/admin/cookie-test/page.tsx](app/admin/cookie-test/page.tsx)
- Purpose: Debug auth cookies and /api/admin/auth response.
- Primary entities: auth status.
- Inputs: none.
- Outputs: auth/cookie diagnostics.
- Ownership scope: User.
- Permissions: Public; calls /api/admin/auth.
- Known inconsistencies and duplicate flows: Debug-only route.

2.34 Unauthorized
- Route: /admin/unauthorized
- Code references: [app/admin/unauthorized/page.tsx](app/admin/unauthorized/page.tsx)
- Purpose: Access denied screen with role context and routing help.
- Primary entities: UserRole.
- Inputs: query param path and auth lookup.
- Outputs: denial message and navigation options.
- Ownership scope: User.
- Permissions: Calls /api/admin/auth for role.
- Known inconsistencies and duplicate flows: None observed in code references.

2.35 Style Editor
- Route: /admin/styles/[id]
- Code references: [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- Purpose: Edit or create report styles with live preview.
- Primary entities: ReportStyle.
- Inputs: color fields, name, font settings.
- Outputs: saved report style records.
- Ownership scope: Global.
- Permissions: No explicit auth check in page.
- Known inconsistencies and duplicate flows: Style assignment occurs in Partners, Events, and Filters.

3 Duplication and Noise (A-UI-00)

3.1 Partner and Event configuration overlap
- Evidence: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)
- Duplicated flows: reportTemplateId/styleId selection, hashtags/categorizedHashtags assignment, SharePopup usage.
- Merge/remove candidate: Treat Partner as default assignment and Event as override only; consolidate assignment UI into shared component.

3.2 Hashtag search and pagination duplication
- Evidence: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)
- Duplicated flows: /api/hashtags pagination and search handling.
- Merge/remove candidate: Consolidate hashtag search/pagination into a shared hook or component.

3.3 Variable management surface duplication
- Evidence: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)
- Duplicated flows: variables-config is edited in KYC and used in algorithms and clicker grouping.
- Merge/remove candidate: Keep KYC as the only edit surface; make other pages read-only for variable definitions.

3.4 Bitly link association duplication
- Evidence: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx)
- Duplicated flows: partner link association appears in both Bitly Manager and Partners.
- Merge/remove candidate: Centralize associations in Bitly Manager; keep partner view read-only.

3.5 Hashtag metadata split across pages
- Evidence: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [app/admin/categories/page.tsx](app/admin/categories/page.tsx)
- Duplicated flows: hashtag color editing vs category management.
- Merge/remove candidate: Unify hashtag color and category management in a single Hashtag Management surface.

3.6 Report style assignment duplication
- Evidence: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)
- Duplicated flows: style selection occurs in multiple pages.
- Merge/remove candidate: Use a shared style assignment component and formalize override rules (global -> partner -> event).

3.7 Report template assignment duplication
- Evidence: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx)
- Duplicated flows: template editing vs template assignment across pages.
- Merge/remove candidate: Keep template editing centralized and standardize assignment rules in one shared UI.

4 Coverage Check

4.1 Confirmed present in codebase (page.tsx exists)
- /admin -> app/admin/page.tsx
- /admin/dashboard -> app/admin/dashboard/page.tsx
- /admin/analytics/executive -> app/admin/analytics/executive/page.tsx
- /admin/analytics/insights -> app/admin/analytics/insights/page.tsx
- /admin/insights -> app/admin/insights/page.tsx
- /admin/events -> app/admin/events/page.tsx
- /admin/events/[id]/kyc-data -> app/admin/events/[id]/kyc-data/page.tsx
- /admin/partners -> app/admin/partners/page.tsx
- /admin/partners/[id] -> app/admin/partners/[id]/page.tsx
- /admin/partners/[id]/analytics -> app/admin/partners/[id]/analytics/page.tsx
- /admin/partners/[id]/kyc-data -> app/admin/partners/[id]/kyc-data/page.tsx
- /admin/projects -> app/admin/projects/page.tsx
- /admin/project-partners -> app/admin/project-partners/page.tsx
- /admin/quick-add -> app/admin/quick-add/page.tsx
- /admin/filter -> app/admin/filter/page.tsx
- /admin/users -> app/admin/users/page.tsx
- /admin/kyc -> app/admin/kyc/page.tsx
- /admin/charts -> app/admin/charts/page.tsx
- /admin/clicker-manager -> app/admin/clicker-manager/page.tsx
- /admin/bitly -> app/admin/bitly/page.tsx
- /admin/hashtags -> app/admin/hashtags/page.tsx
- /admin/categories -> app/admin/categories/page.tsx
- /admin/visualization -> app/admin/visualization/page.tsx
- /admin/styles -> app/admin/styles/page.tsx
- /admin/styles/[id] -> app/admin/styles/[id]/page.tsx
- /admin/cache -> app/admin/cache/page.tsx
- /admin/content-library -> app/admin/content-library/page.tsx
- /admin/design -> app/admin/design/page.tsx
- /admin/api-football-enrich -> app/admin/api-football-enrich/page.tsx
- /admin/help -> app/admin/help/page.tsx
- /admin/login -> app/admin/login/page.tsx
- /admin/register -> app/admin/register/page.tsx
- /admin/clear-session -> app/admin/clear-session/page.tsx
- /admin/cookie-test -> app/admin/cookie-test/page.tsx
- /admin/unauthorized -> app/admin/unauthorized/page.tsx

4.2 Suspected or unknown
- None identified in app/admin route scan.
