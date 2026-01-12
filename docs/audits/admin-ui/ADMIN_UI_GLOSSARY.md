# Admin UI Glossary
Status: Draft
Last Updated: 2026-01-12T09:56:01.000Z
Canonical: No
Owner: Audit

1 Terms

1.1 Admin Session
- Definition: Cookie-backed admin session used to authorize access to /admin pages and APIs.
- Code references: [lib/auth.ts](lib/auth.ts), [hooks/useAdminAuth.ts](hooks/useAdminAuth.ts)

1.2 Admin User
- Definition: Admin account with role and permissions for managing system data.
- Code references: [app/admin/users/page.tsx](app/admin/users/page.tsx), [lib/auth.ts](lib/auth.ts)

1.3 Superadmin
- Definition: Highest admin role with full permissions.
- Code references: [lib/auth.ts](lib/auth.ts), [app/admin/charts/page.tsx](app/admin/charts/page.tsx)

1.4 Partner
- Definition: Business entity configured with hashtags, styles, and report templates.
- Code references: [lib/partner.types.ts](lib/partner.types.ts), [app/admin/partners/page.tsx](app/admin/partners/page.tsx)

1.5 Event (Project)
- Definition: Event record used for reporting and analytics.
- Code references: [app/admin/events/page.tsx](app/admin/events/page.tsx), [lib/types/api.ts](lib/types/api.ts)

1.6 Report Template
- Definition: Template definition for report layout and data blocks.
- Code references: [lib/reportTemplateTypes.ts](lib/reportTemplateTypes.ts), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.7 Data Block
- Definition: Reusable block of charts used inside report templates.
- Code references: [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)

1.8 Chart Configuration
- Definition: Algorithm and formatting configuration used to render charts.
- Code references: [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx), [lib/chartConfigTypes.ts](lib/chartConfigTypes.ts)

1.9 Report Style
- Definition: Visual style theme applied to report pages.
- Code references: [lib/reportStyleTypes.ts](lib/reportStyleTypes.ts), [app/admin/styles/page.tsx](app/admin/styles/page.tsx)

1.10 Hashtag
- Definition: Tag assigned to partners or events for filtering and categorization.
- Code references: [components/HashtagEditor.tsx](components/HashtagEditor.tsx), [lib/types/hashtags.ts](lib/types/hashtags.ts)

1.11 Hashtag Category
- Definition: Category used to group hashtags and enforce categorizedHashtags structure.
- Code references: [lib/hashtagCategoryTypes.ts](lib/hashtagCategoryTypes.ts), [app/admin/categories/page.tsx](app/admin/categories/page.tsx)

1.12 KYC Variable
- Definition: Variable definition used by analytics and clicker workflows.
- Code references: [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)

1.13 Variable Group
- Definition: Clicker grouping and ordering of variables.
- Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)

1.14 Clicker
- Definition: Editor UI mode for data entry during events.
- Code references: [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx), [app/admin/help/page.tsx](app/admin/help/page.tsx)

1.15 Bitly Link
- Definition: Short link record with analytics and associations to partners or events.
- Code references: [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx)

1.16 Insight
- Definition: Analytics output item (anomaly, trend, benchmark, prediction, recommendation).
- Code references: [app/admin/insights/page.tsx](app/admin/insights/page.tsx)

1.17 Share Slug
- Definition: Slug used by SharePopup to generate shareable links.
- Code references: [components/SharePopup.tsx](components/SharePopup.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx)
