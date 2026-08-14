# Entry Point → Collection Graph

Status: Active
Last Updated: 2026-08-14T19:32:22.210Z
Canonical: No (generated)
Owner: Architecture

**Generated** by `scripts/lld-audit/build-inventory.ts`. Do not hand-edit.

Each row is an API route or page, the number of modules transitively reachable
from it through resolved imports, and every collection touched anywhere in that
reachable set. An entry with 0 collections either does no data access or reaches
it through a path this analysis cannot see — both are Phase 2–7 questions.

| Entry point | Modules | Collections |
|---|---:|---|
| `app/api/projects/route.ts` | 30 | `bitly_links`, `bitly_project_links`, `countries`, `drive_folder_links`, `fanmass_event_links`, `filter_slugs`, `hashtags`, `notifications`, `organizations`, `partners`, `projects`, `report_styles`, `users` |
| `app/api/hashtags/[hashtag]/route.ts` | 12 | `data_blocks`, `filter_slugs`, `hashtag_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports` |
| `app/api/report-variants/[id]/route.ts` | 17 | `data_blocks`, `filter_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports`, `users` |
| `app/api/report-variants/route.ts` | 17 | `data_blocks`, `filter_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports`, `users` |
| `app/api/admin/landing-static-generate/route.ts` | 19 | `chart_configurations`, `data_blocks`, `filter_slugs`, `partners`, `projects`, `report_templates`, `settings`, `users` |
| `app/api/hashtags/filter-by-slug/[slug]/route.ts` | 13 | `data_blocks`, `filter_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports` |
| `app/api/organizations/edit/[id]/route.ts` | 16 | `data_blocks`, `filter_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports` |
| `app/api/organizations/report/[id]/activities/route.ts` | 18 | `data_blocks`, `filter_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports` |
| `app/api/organizations/report/[id]/route.ts` | 19 | `data_blocks`, `filter_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports` |
| `app/api/partners/edit/[slug]/route.ts` | 13 | `data_blocks`, `filter_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports` |
| `app/api/partners/report/[slug]/route.ts` | 17 | `data_blocks`, `filter_slugs`, `organizations`, `partners`, `projects`, `report_templates`, `report_variants`, `reports` |
| `app/api/analytics/ai/coverage/route.ts` | 11 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects`, `users`, `variables_metadata` |
| `app/api/analytics/ai/events/[eventId]/summary/route.ts` | 11 | `ai_analysis_summaries`, `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects`, `users` |
| `app/api/analytics/ai/events/route.ts` | 11 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects`, `users`, `variables_metadata` |
| `app/api/analytics/ai/variables/route.ts` | 11 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects`, `users`, `variables_metadata` |
| `app/api/cron/analytics-aggregation/route.ts` | 11 | `aggregation_jobs`, `analytics_aggregates`, `bitly_project_links`, `partner_analytics`, `partners`, `projects`, `users` |
| `app/api/integrations/fanmass/events/[eventId]/stats/route.ts` | 21 | `drive_folder_links`, `fanmass_event_links`, `filter_slugs`, `organizations`, `partners`, `projects`, `variables_metadata` |
| `app/api/integrations/fanmass/events/route.ts` | 21 | `drive_folder_links`, `fanmass_event_links`, `filter_slugs`, `organizations`, `partners`, `projects`, `variables_metadata` |
| `app/api/integrations/fanmass/partners/[partnerId]/events/route.ts` | 21 | `drive_folder_links`, `fanmass_event_links`, `filter_slugs`, `organizations`, `partners`, `projects`, `variables_metadata` |
| `app/api/integrations/fanmass/partners/route.ts` | 21 | `drive_folder_links`, `fanmass_event_links`, `filter_slugs`, `organizations`, `partners`, `projects`, `variables_metadata` |
| `app/api/integrations/fanmass/variables/route.ts` | 21 | `drive_folder_links`, `fanmass_event_links`, `filter_slugs`, `organizations`, `partners`, `projects`, `variables_metadata` |
| `app/admin/analytics/sponsorship/activation/page.tsx` | 34 | `analytics_aggregates`, `bitly_project_links`, `organizations`, `partners`, `projects`, `users` |
| `app/admin/analytics/sponsorship/page.tsx` | 34 | `analytics_aggregates`, `bitly_project_links`, `organizations`, `partners`, `projects`, `users` |
| `app/api/admin/fanmass/events/[eventId]/route.ts` | 10 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects`, `users` |
| `app/api/analytics/sponsorship-hub/route.ts` | 11 | `analytics_aggregates`, `bitly_project_links`, `organizations`, `partners`, `projects`, `users` |
| `app/api/bitly/links/route.ts` | 20 | `bitly_links`, `bitly_project_links`, `countries`, `partners`, `projects`, `users` |
| `app/api/drive-folders/[linkId]/route.ts` | 12 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects`, `users` |
| `app/api/drive-folders/route.ts` | 12 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects`, `users` |
| `app/api/integrations/fanmass/events/[eventId]/analysis-summary/route.ts` | 7 | `ai_analysis_summaries`, `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/landing-report/route.ts` | 10 | `chart_configurations`, `data_blocks`, `partners`, `projects`, `report_styles`, `report_templates` |
| `app/admin/analytics/sponsorship/activation/recap/[partnerId]/page.tsx` | 11 | `analytics_aggregates`, `bitly_project_links`, `organizations`, `partners`, `projects` |
| `app/api/hashtags/route.ts` | 7 | `hashtag_colors`, `hashtag_slugs`, `hashtags`, `partners`, `projects` |
| `app/api/integrations/camera/link-partners/route.ts` | 8 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/integrations/camera/provision-missing/route.ts` | 8 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/integrations/fanmass/callbacks/route.ts` | 6 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/integrations/fanmass/drive-folders/route.ts` | 8 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/integrations/fanmass/events/[eventId]/context/route.ts` | 6 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/integrations/fanmass/events/[eventId]/drive-folders/status/route.ts` | 8 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/integrations/fanmass/events/[eventId]/link/route.ts` | 6 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/integrations/fanmass/events/[eventId]/sync/route.ts` | 6 | `drive_folder_links`, `fanmass_event_links`, `organizations`, `partners`, `projects` |
| `app/api/admin/sync-events-to-camera/route.ts` | 11 | `organizations`, `partners`, `projects`, `users` |
| `app/api/admin/sync-partners-to-camera/route.ts` | 11 | `organizations`, `partners`, `projects`, `users` |
| `app/api/bitly/recalculate/route.ts` | 15 | `bitly_links`, `bitly_project_links`, `countries`, `projects` |
| `app/api/cron/bitly-refresh/route.ts` | 14 | `bitly_links`, `bitly_project_links`, `countries`, `projects` |
| `app/api/football-data/sync/route.ts` | 13 | `football_data_fixtures`, `partners`, `projects`, `users` |
| `app/api/report-config/[identifier]/route.ts` | 9 | `data_blocks`, `partners`, `projects`, `report_templates` |
| `app/api/report-templates/assign/route.ts` | 9 | `partners`, `projects`, `report_templates`, `users` |
| `app/api/sports-db/fixtures/draft/route.ts` | 15 | `partners`, `projects`, `sportsdb_fixtures`, `users` |
| `app/api/sports-db/sync/route.ts` | 15 | `partners`, `projects`, `sportsdb_fixtures`, `users` |
| `app/filter/[slug]/page.tsx` | 51 | `page_passwords`, `partners`, `projects`, `reports` |
| `app/hashtag/[hashtag]/page.tsx` | 52 | `page_passwords`, `partners`, `projects`, `reports` |
| `app/page.tsx` | 44 | `partners`, `projects`, `reports`, `settings` |
| `app/api/admin/organizations/[id]/members/route.ts` | 14 | `organizations`, `partners`, `users` |
| `app/api/admin/organizations/[id]/route.ts` | 14 | `organizations`, `partners`, `users` |
| `app/api/admin/ui-settings/route.ts` | 10 | `available_fonts`, `settings`, `users` |
| `app/api/analytics/insights/organizations/[orgId]/route.ts` | 14 | `partners`, `projects`, `users` |
| `app/api/analytics/insights/partners/[partnerId]/route.ts` | 14 | `partners`, `projects`, `users` |
| `app/api/analytics/insights/route.ts` | 14 | `partners`, `projects`, `users` |
| `app/api/api-football/enrich-partners/route.ts` | 10 | `api_football_enrichment_log`, `partners`, `users` |
| `app/api/bitly/links/[linkId]/route.ts` | 11 | `bitly_links`, `projects`, `users` |
| `app/api/bitly/partners/associate/route.ts` | 9 | `bitly_links`, `partners`, `users` |
| `app/api/bitly/project-metrics/[projectId]/route.ts` | 6 | `bitly_links`, `bitly_project_links`, `projects` |
| `app/api/bitly/sync/route.ts` | 13 | `bitly_links`, `bitly_sync_logs`, `users` |
| `app/api/filter-slug/route.ts` | 5 | `filter_slugs`, `partners`, `projects` |
| `app/api/projects/[id]/route.ts` | 14 | `notifications`, `projects`, `users` |
| `app/api/projects/edit/[slug]/route.ts` | 6 | `filter_slugs`, `partners`, `projects` |
| `app/api/projects/stats/[slug]/route.ts` | 6 | `filter_slugs`, `partners`, `projects` |
| `app/api/public/events/[id]/route.ts` | 11 | `partners`, `projects`, `users` |
| `app/api/public/partners/[id]/events/route.ts` | 11 | `partners`, `projects`, `users` |
| `app/api/reports/resolve/route.ts` | 6 | `partners`, `projects`, `reports` |
| `app/dashboard/filter/[filterSlug]/page.tsx` | 46 | `partners`, `projects`, `reports` |
| `app/dashboard/partner/[partnerId]/page.tsx` | 42 | `partners`, `projects`, `reports` |
| `app/organization-report/[id]/page.tsx` | 43 | `partners`, `projects`, `reports` |
| `app/partner-report/[slug]/page.tsx` | 46 | `partners`, `projects`, `reports` |
| `app/report/[slug]/page.tsx` | 42 | `partners`, `projects`, `reports` |
| `app/admin/events/page.tsx` | 42 | `page_passwords`, `users` |
| `app/admin/organizations/[id]/reports/page.tsx` | 25 | `page_passwords`, `users` |
| `app/admin/partners/[id]/reports/page.tsx` | 25 | `page_passwords`, `users` |
| `app/admin/partners/page.tsx` | 45 | `page_passwords`, `users` |
| `app/api/admin/landing-projects/route.ts` | 10 | `projects`, `users` |
| `app/api/admin/landing-settings/route.ts` | 11 | `settings`, `users` |
| `app/api/admin/local-users/route.ts` | 11 | `page_passwords`, `users` |
| `app/api/admin/organizations/route.ts` | 10 | `organizations`, `users` |
| `app/api/admin/permissions/route.ts` | 5 | `audit_logs`, `project_permissions` |
| `app/api/admin/project-partners/auto-suggest/route.ts` | 5 | `partners`, `projects` |
| `app/api/admin/project-partners/route.ts` | 15 | `projects`, `users` |
| `app/api/admin/projects/[id]/route.ts` | 5 | `audit_logs`, `projects` |
| `app/api/analytics/aggregates/partners/route.ts` | 10 | `partner_analytics`, `users` |
| `app/api/analytics/aggregates/route.ts` | 10 | `analytics_aggregates`, `users` |
| `app/api/analytics/insights/summary/route.ts` | 14 | `analytics_aggregates`, `users` |
| `app/api/analytics/partner/[partnerId]/route.ts` | 6 | `analytics_aggregates`, `partners` |
| `app/api/auto-generate-chart-block/route.ts` | 6 | `chart_configurations`, `data_blocks` |
| `app/api/bitly/analytics/[linkId]/route.ts` | 14 | `bitly_links`, `users` |
| `app/api/bitly/associations/route.ts` | 9 | `bitly_project_links`, `users` |
| `app/api/bitly/pull/route.ts` | 13 | `bitly_links`, `users` |
| `app/api/chart-config/route.ts` | 10 | `chart_configurations`, `users` |
| `app/api/content-assets/route.ts` | 10 | `content_assets`, `users` |
| `app/api/cron/google-sheets-sync/route.ts` | 13 | `partners`, `projects` |
| `app/api/debug/notifications/route.ts` | 9 | `notifications`, `users` |
| `app/api/football-data/fixtures/route.ts` | 10 | `football_data_fixtures`, `users` |
| `app/api/hashtag-categories/route.ts` | 9 | `hashtag_categories`, `projects` |
| `app/api/hashtags/slugs/route.ts` | 6 | `hashtag_slugs`, `projects` |
| `app/api/notifications/mark-read/route.ts` | 9 | `notifications`, `users` |
| `app/api/notifications/route.ts` | 9 | `notifications`, `users` |
| `app/api/page-passwords/route.ts` | 11 | `page_passwords`, `users` |
| `app/api/partners/[id]/bitly-kyc/route.ts` | 9 | `projects`, `users` |
| `app/api/partners/[id]/events/route.ts` | 4 | `partners`, `projects` |
| `app/api/partners/[id]/google-sheet/connect/route.ts` | 13 | `partners`, `projects` |
| `app/api/partners/[id]/google-sheet/provision/route.ts` | 13 | `partners`, `projects` |
| `app/api/partners/[id]/google-sheet/pull/route.ts` | 13 | `partners`, `projects` |
| `app/api/partners/[id]/google-sheet/push/route.ts` | 12 | `partners`, `projects` |
| `app/api/partners/[id]/google-sheet/setup/route.ts` | 13 | `partners`, `projects` |
| `app/api/partners/link-football-data/route.ts` | 13 | `partners`, `users` |
| `app/api/public/partners/[id]/route.ts` | 11 | `partners`, `users` |
| `app/api/public/partners/route.ts` | 11 | `partners`, `users` |
| `app/api/report-templates/route.ts` | 16 | `report_templates`, `users` |
| `app/api/sports-db/fixtures/route.ts` | 9 | `sportsdb_fixtures`, `users` |
| `app/api/user-preferences/route.ts` | 9 | `user_preferences`, `users` |
| `app/api/v3/organizations/report/[id]/route.ts` | 18 | `reports`, `users` |
| `app/api/v3/reports/resolve/route.ts` | 16 | `reports`, `users` |
| `app/admin/analytics/executive/page.tsx` | 34 | `users` |
| `app/admin/analytics/insights/page.tsx` | 34 | `users` |
| `app/admin/analytics/marketing/page.tsx` | 34 | `users` |
| `app/admin/analytics/operations/page.tsx` | 34 | `users` |
| `app/admin/analytics/page.tsx` | 33 | `users` |
| `app/admin/bitly/page.tsx` | 19 | `users` |
| `app/admin/cache/page.tsx` | 13 | `users` |
| `app/admin/categories/page.tsx` | 48 | `users` |
| `app/admin/charts/page.tsx` | 29 | `users` |
| `app/admin/clicker-manager/page.tsx` | 23 | `users` |
| `app/admin/content-library/page.tsx` | 26 | `users` |
| `app/admin/events/[id]/kyc-data/page.tsx` | 11 | `users` |
| `app/admin/filter/page.tsx` | 18 | `page_passwords` |
| `app/admin/help/page.tsx` | 8 | `users` |
| `app/admin/kyc/page.tsx` | 23 | `users` |
| `app/admin/mainpage/page.tsx` | 13 | `users` |
| `app/admin/messages/page.tsx` | 13 | `users` |
| `app/admin/organizations/page.tsx` | 50 | `users` |
| `app/admin/page.tsx` | 17 | `users` |
| `app/admin/partners/[id]/analytics/page.tsx` | 10 | `users` |
| `app/admin/partners/[id]/kyc-data/page.tsx` | 11 | `users` |
| `app/admin/partners/[id]/page.tsx` | 17 | `users` |
| `app/admin/reports/page.tsx` | 17 | `users` |
| `app/admin/styles/page.tsx` | 20 | `users` |
| `app/admin/unauthorized/page.tsx` | 8 | `users` |
| `app/admin/users/page.tsx` | 50 | `users` |
| `app/admin/visualization/page.tsx` | 46 | `users` |
| `app/api/admin/auth/route.ts` | 9 | `users` |
| `app/api/admin/clear-cache/route.ts` | 9 | `users` |
| `app/api/admin/contact-inquiries/route.ts` | 11 | `users` |
| `app/api/admin/filter-style/route.ts` | 5 | `filter_slugs` |
| `app/api/admin/fix-mojibake-text/route.ts` | 10 | `users` |
| `app/api/admin/hashtag-style/route.ts` | 5 | `hashtag_slugs` |
| `app/api/admin/local-users/[id]/api-access/route.ts` | 9 | `users` |
| `app/api/admin/local-users/[id]/route.ts` | 9 | `users` |
| `app/api/admin/local-users/[id]/send-email/route.ts` | 10 | `users` |
| `app/api/admin/partners/route.ts` | 5 | `partners` |
| `app/api/admin/projects/route.ts` | 11 | `projects` |
| `app/api/admin/users/[id]/role/route.ts` | 9 | `users` |
| `app/api/analytics/benchmarks/route.ts` | 6 | `analytics_aggregates` |
| `app/api/analytics/compare/partners/route.ts` | 5 | `partner_analytics` |
| `app/api/analytics/compare/periods/route.ts` | 5 | `analytics_aggregates` |
| `app/api/analytics/compare/route.ts` | 6 | `analytics_aggregates` |
| `app/api/analytics/event/[projectId]/route.ts` | 8 | `analytics_aggregates` |
| `app/api/analytics/executive/insights/route.ts` | 11 | `analytics_aggregates` |
| `app/api/analytics/executive/metrics/route.ts` | 7 | `analytics_aggregates` |
| `app/api/analytics/executive/top-events/route.ts` | 7 | `analytics_aggregates` |
| `app/api/analytics/insights/[projectId]/route.ts` | 11 | `analytics_aggregates` |
| `app/api/analytics/trends/route.ts` | 6 | `analytics_aggregates` |
| `app/api/auth/check/route.ts` | 9 | `users` |
| `app/api/auth/sso/callback/route.ts` | 13 | `users` |
| `app/api/chart-config/public/route.ts` | 4 | `chart_configurations` |
| `app/api/chart-configs/route.ts` | 4 | `chart_configurations` |
| `app/api/chart-formatting-defaults/route.ts` | 5 | `chart_formatting_defaults` |
| `app/api/charts/route.ts` | 11 | `charts` |
| `app/api/cities/route.ts` | 4 | `cities` |
| `app/api/content-assets/usage/route.ts` | 5 | `chartConfigurations` |
| `app/api/countries/[code]/route.ts` | 5 | `countries` |
| `app/api/countries/route.ts` | 5 | `countries` |
| `app/api/data-blocks/route.ts` | 5 | `data_blocks` |
| `app/api/debug/categorized-hashtags/route.ts` | 3 | `projects` |
| `app/api/debug/overview-block/route.ts` | 4 | `data_blocks` |
| `app/api/grid-settings/route.ts` | 6 | `settings` |
| `app/api/hashtag-colors/route.ts` | 5 | `hashtag_colors` |
| `app/api/hashtags/filter/route.ts` | 6 | `projects` |
| `app/api/images/route.ts` | 5 | `projects` |
| `app/api/integrations/camera/partners/route.ts` | 15 | `partners` |
| `app/api/integrations/camera/sso-session/route.ts` | 13 | `users` |
| `app/api/landing-static/route.ts` | 6 | `settings` |
| `app/api/partners/[id]/google-sheet/disconnect/route.ts` | 5 | `partners` |
| `app/api/partners/[id]/google-sheet/rename/route.ts` | 9 | `partners` |
| `app/api/partners/[id]/google-sheet/status/route.ts` | 10 | `partners` |
| `app/api/partners/route.ts` | 12 | `partners` |
| `app/api/report-styles/route.ts` | 13 | `users` |
| `app/api/v3/activities/[id]/participants/[entityId]/route.ts` | 13 | `users` |
| `app/api/v3/activities/[id]/participants/route.ts` | 13 | `users` |
| `app/api/v3/activities/route.ts` | 13 | `users` |
| `app/api/v3/entities/[id]/route.ts` | 13 | `users` |
| `app/api/v3/entities/route.ts` | 13 | `users` |
| `app/api/v3/health/route.ts` | 10 | `users` |
| `app/api/v3/metrics/record/route.ts` | 14 | `users` |
| `app/api/v3/organizations/report/[id]/activities/route.ts` | 14 | `users` |
| `app/api/v3/reporting/dashboard/route.ts` | 15 | `users` |
| `app/api/v3/reporting/export/[entityId]/route.ts` | 13 | `users` |
| `app/edit/[slug]/page.tsx` | 46 | `page_passwords` |
| `app/examples/password-gate-demo/page.tsx` | 8 | `page_passwords` |
| `app/organization-edit/[id]/page.tsx` | 20 | `page_passwords` |
| `app/partner-edit/[slug]/page.tsx` | 29 | `page_passwords` |
| `app/admin/analytics/ai/[eventId]/page.tsx` | 5 | — |
| `app/admin/analytics/ai/page.tsx` | 5 | — |
| `app/admin/api-football-enrich/page.tsx` | 1 | — |
| `app/admin/clear-session/page.tsx` | 3 | — |
| `app/admin/cookie-test/page.tsx` | 2 | — |
| `app/admin/dashboard/page.tsx` | 1 | — |
| `app/admin/design/page.tsx` | 9 | — |
| `app/admin/hashtags/page.tsx` | 9 | — |
| `app/admin/help/guides/[slug]/page.tsx` | 2 | — |
| `app/admin/help/guides/page.tsx` | 2 | — |
| `app/admin/insights/page.tsx` | 1 | — |
| `app/admin/login/page.tsx` | 2 | — |
| `app/admin/project-partners/page.tsx` | 2 | — |
| `app/admin/projects/page.tsx` | 1 | — |
| `app/admin/quick-add/page.tsx` | 7 | — |
| `app/admin/register/page.tsx` | 1 | — |
| `app/admin/styles/[id]/page.tsx` | 11 | — |
| `app/api-docs/page.tsx` | 1 | — |
| `app/api/admin/clear-cookies/route.ts` | 4 | — |
| `app/api/admin/email-selftest/route.ts` | 5 | — |
| `app/api/admin/login/route.ts` | 5 | — |
| `app/api/admin/register/route.ts` | 1 | — |
| `app/api/admin/users/route.ts` | 5 | — |
| `app/api/auth/sso/config/route.ts` | 3 | — |
| `app/api/auth/sso/login/route.ts` | 6 | — |
| `app/api/available-fonts/route.ts` | 6 | — |
| `app/api/clicker-sets/route.ts` | 5 | — |
| `app/api/contact/route.ts` | 7 | — |
| `app/api/csrf-token/route.ts` | 2 | — |
| `app/api/google-sheets/template/route.ts` | 4 | — |
| `app/api/me/route.ts` | 1 | — |
| `app/api/partners/upload-logo/route.ts` | 2 | — |
| `app/api/report-styles/[id]/route.ts` | 8 | — |
| `app/api/sports-db/lookup/route.ts` | 3 | — |
| `app/api/sports-db/search/route.ts` | 3 | — |
| `app/api/stats/route.ts` | 1 | — |
| `app/api/variables-config/route.ts` | 6 | — |
| `app/api/variables-groups/route.ts` | 5 | — |
| `app/dashboard/hashtag/[hashtag]/page.tsx` | 1 | — |
| `app/debug/hashtag-categories/page.tsx` | 3 | — |
| `app/privacy/page.tsx` | 1 | — |
| `app/terms/page.tsx` | 1 | — |
| `app/test-csrf/page.tsx` | 1 | — |