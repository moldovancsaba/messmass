# Admin UI Capability Map
Status: Draft
Last Updated: 2026-01-12T09:56:01.000Z
Canonical: No
Owner: Audit

1 Purpose
- Map Admin UI capabilities for A-UI-00 and capture ownership, inputs, outputs, and duplication using code references.

2 Admin Areas (A-UI-00)

2.1 Partners
- Code references: [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [lib/adapters/partnersAdapter.ts](lib/adapters/partnersAdapter.ts), [components/UnifiedAdminPage.tsx](components/UnifiedAdminPage.tsx)
- Purpose: Manage partner records and partner-level reporting configuration, hashtags, and link associations.
- Primary entities: Partner, reportTemplateId, styleId, bitlyLinkIds, hashtags, categorizedHashtags, sportsDb.
- Inputs: name, emoji, hashtags/categorizedHashtags, report template selection, report style selection, bitly link selection, logo upload, Google Sheets setup.
- Outputs: partner records, share links, report template/style assignment, bitly associations, Google Sheets sync data.
- Ownership scope: Partner.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- Known inconsistencies and duplicate flows: Template/style assignment duplicates Events; bitly link association overlaps Bitly Manager; hashtag tagging overlaps Hashtag Manager and Category Manager.

2.2 Events
- Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/adapters/projectsAdapter.ts](lib/adapters/projectsAdapter.ts), [components/SharePopup.tsx](components/SharePopup.tsx)
- Purpose: Manage event (project) records, partner associations, and reporting configuration.
- Primary entities: Project (Event), partner1Id/partner2Id, reportTemplateId, styleId, hashtags, categorizedHashtags.
- Inputs: event name/date, partner selection, hashtags/categorizedHashtags, report template/style selection.
- Outputs: event records, share links, report template/style assignment for reports.
- Ownership scope: Event.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- Known inconsistencies and duplicate flows: Template/style assignment duplicates Partners; bitly associations handled in Bitly Manager; hashtag management overlaps Hashtag Manager.

2.3 Filters
- Code references: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagMultiSelect.tsx](components/HashtagMultiSelect.tsx), [components/SharePopup.tsx](components/SharePopup.tsx)
- Purpose: Filter project statistics by hashtags and present aggregated results.
- Primary entities: Hashtag, ProjectStats, report style, filter slug.
- Inputs: selected hashtags, report style selection.
- Outputs: aggregated stats/project list and shareable filter slug.
- Ownership scope: Event (cross-event filter view).
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Hashtag search/pagination duplicates Hashtag Manager; style selection duplicates Styles.

2.4 Users
- Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)
- Purpose: Manage admin users, roles, and API access.
- Primary entities: AdminUser, role, API access.
- Inputs: create user (email, name, role), regenerate password, toggle API access, change role.
- Outputs: admin accounts, role assignments, API access state.
- Ownership scope: User.
- Permissions: Authenticated admin session via /api/admin/auth; role enforcement handled by backend endpoints.
- Known inconsistencies and duplicate flows: None observed in code references.

2.5 Insights
- Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)
- Purpose: View analytics insights with filtering controls.
- Primary entities: Insight, InsightsMetadata.
- Inputs: type filter, severity filter, limit.
- Outputs: insight list and metadata for analytics monitoring.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: None observed in code references.

2.6 KYC
- Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)
- Purpose: Manage variables catalog used by analytics and clicker.
- Primary entities: Variable, variable flags, categories.
- Inputs: variable create/edit, source filters, flags, category tags.
- Outputs: variables configuration for clicker and analytics.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Variable definitions are edited here and referenced in ChartAlgorithmManager and Clicker Manager.

2.7 Algorithms
- Code references: [app/admin/charts/page.tsx](app/admin/charts/page.tsx), [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx)
- Purpose: Manage chart algorithm configurations and formatting defaults.
- Primary entities: chart config, chart formatting defaults, variables.
- Inputs: chart configuration fields and formulas.
- Outputs: chart configuration used in report rendering and validation.
- Ownership scope: Global.
- Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- Known inconsistencies and duplicate flows: Depends on variables-config managed in KYC; overlap in variable management surfaces.

2.8 Clicker Manager
- Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)
- Purpose: Configure variable groups, ordering, and visibility for clicker UI.
- Primary entities: VariableGroup, Variable.
- Inputs: group order, variable selection, visibility toggles, seed defaults.
- Outputs: clicker layout configuration for editor UI.
- Ownership scope: Global.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth); no explicit role gating in page.
- Known inconsistencies and duplicate flows: Variable definitions are managed in KYC; clicker groups depend on shared variables.

2.9 Bitly Manager
- Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [components/ProjectSelector.tsx](components/ProjectSelector.tsx), [components/PartnerSelector.tsx](components/PartnerSelector.tsx)
- Purpose: Manage Bitly links and their associations to projects and partners.
- Primary entities: BitlyLink, Project, Partner.
- Inputs: link creation, partner/project associations, favorites, sync and analytics actions.
- Outputs: link associations and analytics metadata.
- Ownership scope: Global with partner/event associations.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: Partner link association also managed in Partners.

2.10 Hashtag Manager
- Code references: [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [components/HashtagEditor.tsx](components/HashtagEditor.tsx)
- Purpose: Manage hashtag colors and browse hashtag usage.
- Primary entities: Hashtag, HashtagColor.
- Inputs: search term, color updates, cascade actions.
- Outputs: hashtag color metadata for display and filtering.
- Ownership scope: Global.
- Permissions: Client-side role gate uses /api/auth/check for admin or superadmin.
- Known inconsistencies and duplicate flows: Hashtag categories are managed separately in Category Manager.

2.11 Category Manager
- Code references: [app/admin/categories/page.tsx](app/admin/categories/page.tsx), [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts)
- Purpose: Manage hashtag categories, ordering, and color metadata.
- Primary entities: HashtagCategory.
- Inputs: category name, color, order.
- Outputs: categories used for hashtag tagging and filtering.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Hashtag color editing lives in Hashtag Manager, splitting hashtag metadata across pages.

2.12 Reporting
- Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)
- Purpose: Manage report templates, data blocks, and chart assignments.
- Primary entities: ReportTemplate, DataVisualizationBlock, chart config, user preferences.
- Inputs: template creation, block composition, chart selection, grid settings.
- Outputs: report templates used by partners and events.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Template selection also exists in Partners and Events; default rules must be aligned.

2.13 Style Editor
- Code references: [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx), [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts)
- Purpose: Manage report style library for reports.
- Primary entities: ReportStyle.
- Inputs: create/edit/delete style records.
- Outputs: styles applied to reports and filter views.
- Ownership scope: Global.
- Permissions: No explicit auth check in page; relies on admin layout and API access.
- Known inconsistencies and duplicate flows: Style selection occurs in Partners, Events, and Filters, duplicating assignment UX.

2.14 Cache Management
- Code references: [app/admin/cache/page.tsx](app/admin/cache/page.tsx)
- Purpose: Clear server and browser caches.
- Primary entities: cache types (build, routes, browser, all).
- Inputs: cache clear actions.
- Outputs: cache invalidation results.
- Ownership scope: Global.
- Permissions: Authenticated admin session via /api/admin/auth (useAdminAuth).
- Known inconsistencies and duplicate flows: None observed in code references.

2.15 User Guide
- Code references: [app/admin/help/page.tsx](app/admin/help/page.tsx)
- Purpose: Display admin user guide content with role-based messages.
- Primary entities: user role, guide sections.
- Inputs: none (read-only page).
- Outputs: help and onboarding content.
- Ownership scope: Global.
- Permissions: Uses /api/admin/auth for greeting; page includes guest guidance.
- Known inconsistencies and duplicate flows: Comment references END_USER_GUIDE.md which is not present; guide content is embedded in page.

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
