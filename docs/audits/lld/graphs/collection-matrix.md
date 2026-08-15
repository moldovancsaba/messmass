# Collection Read/Write Matrix

Status: Active
Last Updated: 2026-08-15T08:52:48.556Z
Canonical: No (generated)
Owner: Architecture

**Generated** by `scripts/lld-audit/build-inventory.ts`. Do not hand-edit.

Access is classified from the AST: the method called on the collection handle.
`unknown` means the handle was stored in a variable first, so the call site does
not reveal intent — those need manual disposition in Phase 3.

| Collection | Refs | App/lib refs | Script refs | Writers | Readers | Unknown |
|---|---:|---:|---:|---:|---:|---:|
| `admin_users` | 1 | 0 | 1 | 0 | 1 | 0 |
| `aggregation_jobs` | 2 | 2 | 0 | 2 | 0 | 0 |
| `aggregation_logs` | 2 | 0 | 2 | 2 | 0 | 0 |
| `ai_analysis_summaries` | 2 | 2 | 0 | 1 | 1 | 0 |
| `analytics_aggregates` | 26 | 19 | 7 | 3 | 23 | 0 |
| `api_audit_logs` | 3 | 3 | 0 | 3 | 0 | 0 |
| `api_football_enrichment_log` | 3 | 3 | 0 | 1 | 2 | 0 |
| `audit_logs` | 2 | 2 | 0 | 2 | 0 | 0 |
| `available_fonts` | 2 | 2 | 0 | 0 | 2 | 0 |
| `bitly_link_project_junction` | 12 | 0 | 12 | 2 | 10 | 0 |
| `bitly_links` | 47 | 16 | 31 | 12 | 35 | 0 |
| `bitly_project_links` | 29 | 14 | 15 | 10 | 19 | 0 |
| `bitly_sync_logs` | 2 | 2 | 0 | 2 | 0 | 0 |
| `chartConfigurations` | 10 | 0 | 10 | 10 | 0 | 0 |
| `chart_algorithms` | 3 | 0 | 3 | 1 | 2 | 0 |
| `chart_algorithms_backup` | 2 | 0 | 2 | 2 | 0 | 0 |
| `chart_configs` | 2 | 0 | 2 | 0 | 2 | 0 |
| `chart_configurations` | 143 | 11 | 132 | 66 | 77 | 0 |
| `chart_formatting_defaults` | 4 | 2 | 2 | 3 | 1 | 0 |
| `chartconfigurations` | 1 | 0 | 1 | 1 | 0 | 0 |
| `charts` | 5 | 3 | 2 | 5 | 0 | 0 |
| `cities` | 8 | 1 | 7 | 5 | 3 | 0 |
| `clickerSets` | 2 | 0 | 2 | 2 | 0 | 0 |
| `content_assets` | 8 | 4 | 4 | 7 | 1 | 0 |
| `countries` | 8 | 3 | 5 | 1 | 7 | 0 |
| `country_mappings` | 1 | 0 | 1 | 1 | 0 | 0 |
| `data_blocks` | 53 | 10 | 43 | 17 | 36 | 0 |
| `data_visualization_blocks` | 1 | 0 | 1 | 1 | 0 | 0 |
| `drive_folder_links` | 11 | 11 | 0 | 5 | 6 | 0 |
| `event_comparisons` | 1 | 0 | 1 | 1 | 0 | 0 |
| `fanmass_event_links` | 8 | 8 | 0 | 6 | 2 | 0 |
| `filter_slugs` | 4 | 4 | 0 | 4 | 0 | 0 |
| `football_data_fixtures` | 6 | 5 | 1 | 5 | 1 | 0 |
| `grid_settings` | 2 | 0 | 2 | 0 | 2 | 0 |
| `hashtag_categories` | 12 | 10 | 2 | 4 | 8 | 0 |
| `hashtag_colors` | 8 | 8 | 0 | 4 | 4 | 0 |
| `hashtag_slugs` | 7 | 7 | 0 | 6 | 1 | 0 |
| `hashtags` | 5 | 5 | 0 | 5 | 0 | 0 |
| `local_users` | 13 | 0 | 13 | 6 | 7 | 0 |
| `notifications` | 5 | 4 | 1 | 3 | 2 | 0 |
| `organizations` | 17 | 17 | 0 | 5 | 12 | 0 |
| `pageStyles` | 2 | 1 | 1 | 0 | 2 | 0 |
| `page_passwords` | 10 | 5 | 5 | 8 | 2 | 0 |
| `page_styles_enhanced` | 16 | 0 | 16 | 3 | 13 | 0 |
| `partner_analytics` | 4 | 3 | 1 | 2 | 2 | 0 |
| `partners` | 193 | 85 | 108 | 59 | 133 | 1 |
| `project_permissions` | 3 | 3 | 0 | 3 | 0 | 0 |
| `projects` | 240 | 105 | 135 | 61 | 179 | 0 |
| `report_styles` | 4 | 3 | 1 | 1 | 3 | 0 |
| `report_templates` | 82 | 9 | 73 | 19 | 63 | 0 |
| `report_variants` | 5 | 4 | 1 | 4 | 1 | 0 |
| `reports` | 14 | 8 | 6 | 2 | 12 | 0 |
| `reports_v12` | 1 | 0 | 1 | 0 | 1 | 0 |
| `settings` | 9 | 8 | 1 | 5 | 4 | 0 |
| `sportsdb_fixtures` | 4 | 4 | 0 | 3 | 1 | 0 |
| `styles` | 1 | 0 | 1 | 0 | 1 | 0 |
| `system_settings` | 2 | 0 | 2 | 2 | 0 | 0 |
| `user_preferences` | 2 | 2 | 0 | 2 | 0 | 0 |
| `users` | 12 | 4 | 8 | 7 | 5 | 0 |
| `v3_activities` | 1 | 0 | 1 | 0 | 1 | 0 |
| `v3_metric_definitions` | 2 | 0 | 2 | 1 | 1 | 0 |
| `v3_metric_values` | 3 | 0 | 3 | 1 | 2 | 0 |
| `variablesConfig` | 7 | 0 | 7 | 3 | 4 | 0 |
| `variablesGroups` | 6 | 0 | 6 | 5 | 1 | 0 |
| `variables_groups` | 2 | 0 | 2 | 0 | 2 | 0 |
| `variables_metadata` | 48 | 4 | 44 | 23 | 25 | 0 |
| `visualizationBlocks` | 2 | 0 | 2 | 1 | 1 | 0 |
| `webhook_delivery_logs` | 2 | 2 | 0 | 2 | 0 | 0 |
| `webhooks` | 7 | 7 | 0 | 7 | 0 | 0 |

## Every reference, by collection

### `admin_users`

- `scripts/test-mongodb-connection.js:50` — read (`.find()`)

### `aggregation_jobs`

- `app/api/cron/analytics-aggregation/route.ts:69` — write (`.insertOne/updateOne()`)
- `app/api/cron/analytics-aggregation/route.ts:198` — write (`.insertOne/updateOne()`)

### `aggregation_logs`

- `scripts/aggregateAnalytics.ts:157` — write (`.insertOne()`)
- `scripts/setupAnalyticsIndexes.ts:136` — write (`.createIndex()`)

### `ai_analysis_summaries`

- `lib/aiAnalysisSummary.ts:87` — write (`.updateOne()`)
- `lib/aiAnalysisSummary.ts:109` — read (`.findOne()`)

### `analytics_aggregates`

- `app/api/analytics/aggregates/route.ts:79` — read (`.countDocuments/find/findOne()`)
- `app/api/analytics/benchmarks/route.ts:66` — read (`.find()`)
- `app/api/analytics/compare/periods/route.ts:67` — read (`.find()`)
- `app/api/analytics/compare/route.ts:97` — read (`.find()`)
- `app/api/analytics/event/[projectId]/route.ts:74` — read (`.findOne()`)
- `app/api/analytics/executive/insights/route.ts:70` — read (`.find()`)
- `app/api/analytics/executive/insights/route.ts:102` — read (`.find()`)
- `app/api/analytics/executive/metrics/route.ts:89` — read (`.find()`)
- `app/api/analytics/executive/metrics/route.ts:101` — read (`.find()`)
- `app/api/analytics/executive/top-events/route.ts:85` — read (`.find()`)
- `app/api/analytics/insights/[projectId]/route.ts:105` — read (`.findOne()`)
- `app/api/analytics/insights/[projectId]/route.ts:130` — read (`.find()`)
- `app/api/analytics/insights/[projectId]/route.ts:146` — read (`.find()`)
- `app/api/analytics/insights/summary/route.ts:58` — read (`.find()`)
- `app/api/analytics/insights/summary/route.ts:70` — read (`.find()`)
- `app/api/analytics/partner/[partnerId]/route.ts:64` — read (`.find()`)
- `app/api/analytics/trends/route.ts:100` — read (`.find()`)
- `lib/analytics-aggregator.ts:135` — write (`.deleteOne/updateOne()`)
- `lib/sponsorshipHub.ts:598` — read (`.find()`)
- `scripts/aggregateAnalytics.ts:118` — write (`.bulkWrite()`)
- `scripts/check-aggregate.js:22` — read (`.findOne()`)
- `scripts/check-aggregate.js:26` — read (`.countDocuments()`)
- `scripts/check-aggregate.js:30` — read (`.findOne()`)
- `scripts/inspect-aggregate.js:11` — read (`.findOne()`)
- `scripts/setupAnalyticsIndexes.ts:41` — write (`.createIndex()`)
- `scripts/test-insights-api.js:10` — read (`.findOne()`)

### `api_audit_logs`

- `lib/auditLog.ts:90` — write (`.createIndex/insertOne()`)
- `lib/auditLog.ts:120` — write (`.createIndex/insertOne()`)
- `lib/auditLog.ts:170` — write (`.createIndex/insertOne()`)

### `api_football_enrichment_log`

- `app/api/api-football/enrich-partners/route.ts:74` — read (`.findOne()`)
- `app/api/api-football/enrich-partners/route.ts:157` — write (`.insertOne()`)
- `app/api/api-football/enrich-partners/route.ts:204` — read (`.findOne()`)

### `audit_logs`

- `app/api/admin/permissions/route.ts:314` — write (`.insertOne()`)
- `app/api/admin/projects/[id]/route.ts:120` — write (`.insertOne()`)

### `available_fonts`

- `app/api/admin/ui-settings/route.ts:94` — read (`.find()`)
- `app/layout.tsx:85` — read (`.find()`)

### `bitly_link_project_junction`

- `scripts/check-bitly-country-data.ts:56` — read (`.countDocuments()`)
- `scripts/check-project-country-data.js:24` — read (`.find()`)
- `scripts/consolidateBitlyJunctions.ts:77` — write (`.drop()`)
- `scripts/enrich-all-projects-bitly-countries.ts:9` — read (`.find()`)
- `scripts/enrich-all-projects-bitly-countries.ts:92` — read (`.aggregate()`)
- `scripts/enrich-all-projects-countries.js:35` — read (`.find()`)
- `scripts/fix-partner-event-connections.ts:8` — read (`.find()`)
- `scripts/fix-partner-event-connections.ts:114` — read (`.countDocuments()`)
- `scripts/fix-partner-event-connections.ts:131` — write (`.insertMany()`)
- `scripts/fix-partner-event-connections.ts:179` — read (`.countDocuments()`)
- `scripts/investigateDuplicateCollections.ts:23` — read (`.find()`)
- `scripts/sync-30-links-standalone.js:94` — read (`.find()`)

### `bitly_links`

- `app/api/bitly/analytics/[linkId]/route.ts:73` — read (`.findOne()`)
- `app/api/bitly/analytics/[linkId]/route.ts:110` — write (`.findOneAndUpdate()`)
- `app/api/bitly/links/[linkId]/route.ts:106` — write (`.findOneAndUpdate()`)
- `app/api/bitly/links/[linkId]/route.ts:185` — write (`.deleteOne()`)
- `app/api/bitly/links/[linkId]/route.ts:201` — write (`.findOneAndUpdate()`)
- `app/api/bitly/links/route.ts:102` — read (`.findOne()`)
- `app/api/bitly/links/route.ts:147` — write (`.insertOne()`)
- `app/api/bitly/links/route.ts:171` — read (`.findOne()`)
- `app/api/bitly/links/route.ts:302` — read (`.find()`)
- `app/api/bitly/links/route.ts:311` — read (`.countDocuments()`)
- `app/api/bitly/partners/associate/route.ts:61` — read (`.findOne()`)
- `app/api/bitly/project-metrics/[projectId]/route.ts:114` — read (`.find()`)
- `app/api/bitly/pull/route.ts:71` — write (`.insertMany()`)
- `app/api/bitly/sync/route.ts:77` — write (`.updateOne()`)
- `app/api/bitly/sync/route.ts:216` — read (`.find()`)
- `lib/bitly-aggregator.ts:51` — read (`.findOne()`)
- `scripts/aggregate-partner-bitly-kyc.ts:27` — read (`.find()`)
- `scripts/aggregate-partner-bitly-kyc.ts:66` — read (`.findOne()`)
- `scripts/audit-bitly-thesportdb-kyc.ts:48` — read (`.countDocuments()`)
- `scripts/auditDatabaseCollections.ts:225` — read (`.countDocuments()`)
- `scripts/check-bitly-cache-status.ts:15` — read (`.countDocuments()`)
- `scripts/check-bitly-cache-status.ts:16` — read (`.countDocuments()`)
- `scripts/check-bitly-cache-status.ts:19` — read (`.countDocuments()`)
- `scripts/check-bitly-cache-status.ts:28` — read (`.find()`)
- `scripts/check-bitly-link.js:15` — read (`.findOne()`)
- `scripts/check-bitly-link.js:26` — read (`.find()`)
- `scripts/check-project-country-data.js:32` — read (`.find()`)
- `scripts/count-bitly-links.js:13` — read (`.countDocuments()`)
- `scripts/enrich-all-projects-bitly-countries.ts:25` — read (`.find()`)
- `scripts/enrich-all-projects-countries.js:42` — read (`.find()`)
- `scripts/fix-bitly-kyc-data.ts:55` — read (`.find()`)
- `scripts/fix-bitly-kyc-data.ts:68` — write (`.updateOne()`)
- `scripts/fix-bitly-kyc-data.ts:117` — read (`.findOne()`)
- `scripts/fix-partner-event-connections.ts:22` — read (`.find()`)
- `scripts/import-all-bitly-links.js:111` — write (`.insertMany()`)
- `scripts/migrate-bitly-many-to-many.js:82` — read (`.find()`)
- `scripts/migrate-bitly-many-to-many.js:207` — write (`.updateMany()`)
- `scripts/populate-kyc-from-existing-bitly.ts:45` — read (`.findOne()`)
- `scripts/sync-30-links-standalone.js:73` — write (`.updateOne()`)
- `scripts/sync-30-links-standalone.js:101` — read (`.find()`)
- `scripts/sync-30-links-standalone.js:162` — read (`.find()`)
- `scripts/sync-last-30-bitly-links.ts:25` — read (`.find()`)
- `scripts/sync-last-30-bitly-links.ts:62` — write (`.updateOne()`)
- `scripts/sync-last-30-via-api.ts:16` — read (`.find()`)
- `scripts/test-bitly-api.js:19` — read (`.countDocuments/find()`)
- `scripts/test-mongodb-connection.js:79` — read (`.countDocuments()`)
- `scripts/test-mongodb-connection.js:82` — read (`.find()`)

### `bitly_project_links`

- `app/api/bitly/associations/route.ts:58` — write (`.deleteOne()`)
- `app/api/bitly/links/route.ts:317` — read (`.aggregate()`)
- `app/api/bitly/project-metrics/[projectId]/route.ts:96` — read (`.find()`)
- `lib/analytics-aggregator.ts:245` — read (`.find()`)
- `lib/bitly-recalculator.ts:57` — write (`.bulkWrite/deleteMany/insertOne()`)
- `lib/bitly-recalculator.ts:166` — write (`.bulkWrite/deleteMany/insertOne()`)
- `lib/bitly-recalculator.ts:209` — write (`.bulkWrite/deleteMany/insertOne()`)
- `lib/bitly-recalculator.ts:255` — write (`.bulkWrite/deleteMany/insertOne()`)
- `lib/bitly-recalculator.ts:323` — write (`.bulkWrite/deleteMany/insertOne()`)
- `lib/bitly-recalculator.ts:376` — write (`.bulkWrite/deleteMany/insertOne()`)
- `lib/bitlyChartAggregator.ts:95` — read (`.find()`)
- `lib/bitlyChartAggregator.ts:187` — read (`.find()`)
- `lib/bitlyChartAggregator.ts:225` — read (`.countDocuments()`)
- `lib/sponsorshipHub.ts:599` — read (`.find()`)
- `scripts/aggregate-partner-bitly-kyc.ts:50` — read (`.find()`)
- `scripts/audit-bitly-thesportdb-kyc.ts:49` — read (`.countDocuments()`)
- `scripts/audit-kyc-data-completeness.ts:170` — read (`.find()`)
- `scripts/auditDatabaseCollections.ts:223` — read (`.countDocuments/find()`)
- `scripts/consolidateBitlyJunctions.ts:78` — write (`.insertMany()`)
- `scripts/enrich-project-bitly-metrics.ts:33` — read (`.find()`)
- `scripts/fix-bitly-kyc-data.ts:111` — read (`.find()`)
- `scripts/fix-bitly-kyc-data.ts:156` — write (`.updateOne()`)
- `scripts/fix-bitly-kyc-data.ts:184` — read (`.find()`)
- `scripts/investigateDuplicateCollections.ts:22` — read (`.find()`)
- `scripts/migrate-bitly-many-to-many.js:208` — write (`.updateOne()`)
- `scripts/populate-kyc-from-existing-bitly.ts:27` — read (`.find()`)
- `scripts/sync-bitly-to-project-stats.ts:43` — read (`.find()`)
- `scripts/sync-roma-bitly.ts:51` — read (`.find()`)
- `scripts/test-bitly-api.js:48` — read (`.countDocuments()`)

### `bitly_sync_logs`

- `app/api/bitly/sync/route.ts:269` — write (`.insertOne()`)
- `app/api/bitly/sync/route.ts:300` — write (`.insertOne()`)

### `chartConfigurations`

- `scripts/add-image-density 3.js:29` — write (`.insertOne()`)
- `scripts/add-image-density 4.js:29` — write (`.insertOne()`)
- `scripts/add-kpi-chart 3.js:29` — write (`.insertOne()`)
- `scripts/add-kpi-chart 4.js:29` — write (`.insertOne()`)
- `scripts/migrateEmojiToIcon.ts:27` — write (`.updateOne()`)
- `scripts/migrateExistingChartsFormatting.ts:58` — write (`.updateOne()`)
- `scripts/migrateImageAspectRatio.ts:39` — write (`.updateMany()`)
- `scripts/migrateToAbsoluteDbPaths.ts:115` — write (`.updateOne()`)
- `scripts/update-kpi-chart 3.js:29` — write (`.updateOne()`)
- `scripts/update-kpi-chart 4.js:29` — write (`.updateOne()`)

### `chart_algorithms`

- `scripts/consolidate-chart-collections.ts:24` — read (`.find()`)
- `scripts/consolidate-chart-collections.ts:58` — read (`.find()`)
- `scripts/consolidate-chart-collections.ts:67` — write (`.drop()`)

### `chart_algorithms_backup`

- `scripts/consolidate-chart-collections.ts:59` — write (`.deleteMany()`)
- `scripts/consolidate-chart-collections.ts:61` — write (`.insertMany()`)

### `chart_configs`

- `scripts/migrate-layout-grammar.ts:391` — read (`.find()`)
- `scripts/migrate-reports-to-layout-grammar.ts:312` — read (`.find()`)

### `chart_configurations`

- `app/api/admin/landing-static-generate/route.ts:146` — read (`.find()`)
- `app/api/auto-generate-chart-block/route.ts:41` — write (`.insertOne/updateOne()`)
- `app/api/chart-config/public/route.ts:40` — read (`.estimatedDocumentCount/find()`)
- `app/api/chart-config/route.ts:268` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/chart-config/route.ts:404` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/chart-config/route.ts:519` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/chart-config/route.ts:638` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/chart-configs/route.ts:23` — read (`.find()`)
- `app/api/content-assets/route.ts:461` — read (`.countDocuments()`)
- `app/api/content-assets/usage/route.ts:56` — read (`.find()`)
- `app/api/landing-report/route.ts:24` — read (`.find()`)
- `scripts/add-bar-charts.js:22` — write (`.insertMany()`)
- `scripts/add-currency-type-to-charts.js:100` — write (`.updateOne()`)
- `scripts/add-kpi-charts.js:26` — write (`.insertMany()`)
- `scripts/add-pie-charts.js:23` — write (`.insertMany()`)
- `scripts/add-vent-variables-and-charts.js:23` — write (`.insertOne()`)
- `scripts/apply-p0-fix-faces.js:18` — write (`.updateOne()`)
- `scripts/audit-chart-variables.ts:49` — read (`.find()`)
- `scripts/audit-variable-naming-consistency.ts:129` — read (`.find()`)
- `scripts/audit-variable-naming.ts:88` — read (`.find()`)
- `scripts/backup-all-charts.js:17` — read (`.find()`)
- `scripts/check_aspectratio.js:13` — read (`.find()`)
- `scripts/check-asroma-partner-template.ts:63` — read (`.findOne()`)
- `scripts/check-asroma-partner-template.ts:76` — read (`.findOne()`)
- `scripts/check-block-storage.ts:23` — read (`.find()`)
- `scripts/check-chart-formulas.js:9` — read (`.find()`)
- `scripts/check-chart-structure.js:17` — read (`.findOne()`)
- `scripts/check-chart-structure.js:18` — read (`.findOne()`)
- `scripts/check-chart-structure.js:19` — read (`.findOne()`)
- `scripts/check-chart-structure.js:32` — read (`.find()`)
- `scripts/check-chart-titles.ts:27` — read (`.find()`)
- `scripts/check-content-slots.ts:16` — read (`.find()`)
- `scripts/check-content-slots.ts:27` — read (`.find()`)
- `scripts/check-country-charts-in-blocks.ts:14` — read (`.find()`)
- `scripts/check-country-charts.ts:22` — read (`.findOne()`)
- `scripts/check-default-template.js:41` — read (`.findOne()`)
- `scripts/check-default-template.js:59` — read (`.find()`)
- `scripts/check-image-charts.js:9` — read (`.find()`)
- `scripts/check-marketing-chart.js:13` — read (`.findOne()`)
- `scripts/check-one-chart.js:9` — read (`.findOne()`)
- `scripts/check-report-image-charts.js:14` — read (`.find()`)
- `scripts/check-sihf-blocks.js:41` — read (`.findOne()`)
- `scripts/check-sihf-chart-formulas.js:50` — read (`.findOne()`)
- `scripts/check-sihf-chart-formulas.js:84` — read (`.find()`)
- `scripts/check-sihf-charts.js:22` — read (`.findOne()`)
- `scripts/checkChartIcons.ts:26` — read (`.find()`)
- `scripts/cleanup-stats-report-references.js:30` — write (`.updateOne()`)
- `scripts/compare-hashtag-vs-partner.js:172` — read (`.find()`)
- `scripts/consolidate-chart-collections.ts:25` — read (`.find()`)
- `scripts/consolidate-chart-collections.ts:49` — write (`.insertOne()`)
- `scripts/consolidate-chart-collections.ts:71` — read (`.countDocuments()`)
- `scripts/create-bitly-countries-kpi.js:51` — write (`.insertOne()`)
- `scripts/create-bitly-countries-reached-kpi.ts:45` — write (`.insertOne/updateOne()`)
- `scripts/create-bitly-device-chart.js:56` — write (`.insertOne()`)
- `scripts/create-bitly-geo-chart.js:49` — write (`.insertOne()`)
- `scripts/create-bitly-referrer-chart.js:77` — write (`.insertOne()`)
- `scripts/create-bitly-top-countries-bar.ts:69` — write (`.insertOne/updateOne()`)
- `scripts/create-bitly-top-countries-clicks-chart.js:81` — write (`.insertOne()`)
- `scripts/create-bitly-top-country-kpi.ts:45` — write (`.insertOne/updateOne()`)
- `scripts/debug-chart-configs.js:17` — read (`.find()`)
- `scripts/debug-chart-configs.js:33` — read (`.find()`)
- `scripts/debug-chart-configs.js:43` — read (`.countDocuments()`)
- `scripts/debug-chart-configs.js:44` — read (`.countDocuments()`)
- `scripts/debug-chart-configs.js:45` — read (`.countDocuments()`)
- `scripts/debug-partner-charts.js:102` — read (`.find()`)
- `scripts/debug-partner-report.js:103` — read (`.findOne()`)
- `scripts/debug-partner-report.js:115` — read (`.find()`)
- `scripts/delete-all-charts.js:18` — write (`.deleteMany()`)
- `scripts/delete-bitly-geo-charts.js:9` — write (`.deleteMany()`)
- `scripts/diagnose-builder-charts.ts:14` — read (`.find()`)
- `scripts/diagnose-charts-system.js:22` — read (`.find()`)
- `scripts/diagnose-overview-block.js:41` — read (`.find()`)
- `scripts/diagnose-sihf-partner.js:84` — read (`.findOne()`)
- `scripts/diagnose-sihf-specific.js:96` — read (`.findOne()`)
- `scripts/diagnosticCompleteFlow.js:65` — read (`.countDocuments/find/findOne()`)
- `scripts/ensure-kpi-all-images-taken.js:13` — write (`.updateOne()`)
- `scripts/fix-broken-charts.js:21` — write (`.updateOne()`)
- `scripts/fix-chart-active-status.js:13` — read (`.find()`)
- `scripts/fix-chart-active-status.js:21` — write (`.updateMany()`)
- `scripts/fix-chart-active-status.js:34` — read (`.findOne()`)
- `scripts/fix-chart-active-status.js:39` — write (`.updateOne()`)
- `scripts/fix-chart-formulas-brackets.ts:22` — write (`.updateOne()`)
- `scripts/fix-chart-formulas.ts:15` — read (`.findOne()`)
- `scripts/fix-chart-labels.js:25` — write (`.updateOne()`)
- `scripts/fix-data-block-chart-refs.ts:24` — read (`.find()`)
- `scripts/fix-formulas-and-variables.ts:101` — write (`.updateOne()`)
- `scripts/fix-formulas-to-correct-format.ts:44` — write (`.updateOne()`)
- `scripts/fix-formulas-use-only-standard-fields.ts:78` — write (`.updateOne()`)
- `scripts/fix-image-chart-aspect-ratios.ts:56` — write (`.updateOne()`)
- `scripts/fix-invalid-field-names.ts:65` — write (`.updateOne()`)
- `scripts/fix-p1-2.2-variable-naming-violations.ts:73` — write (`.updateOne()`)
- `scripts/fix-remaining-issues.ts:31` — write (`.insertOne/updateOne()`)
- `scripts/fix-report-image-3.js:14` — write (`.updateOne()`)
- `scripts/fix-report-image-3.js:27` — read (`.findOne()`)
- `scripts/fix-sihf-chart-formulas.js:13` — write (`.updateOne()`)
- `scripts/fix-sihf-chart-formulas.js:26` — write (`.updateOne()`)
- `scripts/fix-sihf-chart-formulas.js:39` — write (`.updateOne()`)
- `scripts/fix-sihf-chart-formulas.js:52` — write (`.updateOne()`)
- `scripts/fix-sihf-chart-formulas.js:65` — write (`.updateOne()`)
- `scripts/fix-sihf-chart-formulas.js:84` — read (`.findOne()`)
- `scripts/fix-visitor-sources-chart.ts:22` — read (`.findOne()`)
- `scripts/fix-visitor-sources-chart.ts:41` — write (`.updateOne()`)
- `scripts/fixInvalidIcons.ts:41` — write (`.updateOne()`)
- `scripts/inspect-target-charts.js:9` — read (`.find/findOne()`)
- `scripts/investigateDuplicateCollections.ts:45` — read (`.countDocuments/findOne()`)
- `scripts/investigateDuplicateCollections.ts:46` — read (`.countDocuments()`)
- `scripts/list-all-charts.js:13` — read (`.find()`)
- `scripts/list-charts.js:9` — read (`.find()`)
- `scripts/migrate-chart-formulas-to-seyu.js:115` — write (`.updateOne()`)
- `scripts/migrate-chart-formulas.js:30` — write (`.updateOne()`)
- `scripts/migrate-chart-formulas.ts:61` — write (`.updateOne()`)
- `scripts/migrate-hero-settings.js:24` — write (`.updateMany()`)
- `scripts/migrate-text-chart-aspect-ratios.js:30` — write (`.updateOne()`)
- `scripts/migrateChartFormattingCleanup.ts:82` — write (`.updateOne()`)
- `scripts/migrateChartFormulasToLowercase.ts:149` — write (`.updateOne()`)
- `scripts/migrateChartsToNewFormatting.ts:88` — write (`.updateOne()`)
- `scripts/remove-invalid-formulas.ts:52` — write (`.updateOne()`)
- `scripts/remove-obsolete-visit-vars.js:51` — write (`.deleteMany()`)
- `scripts/remove-stats-prefix-everywhere.ts:116` — write (`.updateOne()`)
- `scripts/remove-value-charts.js:19` — write (`.deleteMany()`)
- `scripts/remove-value-charts.js:26` — write (`.deleteMany()`)
- `scripts/restore-missing-blocks.ts:111` — read (`.find()`)
- `scripts/revert-sihf-charts.js:13` — write (`.updateOne()`)
- `scripts/revert-sihf-charts.js:26` — write (`.updateOne()`)
- `scripts/revert-sihf-charts.js:39` — write (`.updateOne()`)
- `scripts/seed-content-slots.ts:14` — write (`.insertOne()`)
- `scripts/seed-default-charts.js:198` — write (`.insertOne()`)
- `scripts/seed-messmass-landing.ts:124` — write (`.insertOne/updateOne()`)
- `scripts/seedValueChartTemplates.ts:442` — write (`.insertOne()`)
- `scripts/simulate-partner-chart-calc.js:147` — read (`.find()`)
- `scripts/simulate-partner-frontend.js:214` — read (`.find()`)
- `scripts/test-chart-calculation.js:111` — read (`.findOne()`)
- `scripts/test-partner-chart-calculation.js:101` — read (`.find()`)
- `scripts/test-partner-fix.js:48` — read (`.findOne()`)
- `scripts/test-partner-fix.js:125` — read (`.findOne()`)
- `scripts/test-partner-fix.js:138` — read (`.findOne()`)
- `scripts/update-kpi-chart.js:25` — write (`.updateOne()`)
- `scripts/validate-and-fix-all-formulas.ts:37` — write (`.updateOne()`)
- `scripts/validate-chart-configs.ts:17` — read (`.find()`)
- `scripts/verify-and-fix-formulas.ts:40` — read (`.find()`)
- `scripts/verify-asroma-charts.ts:43` — read (`.findOne()`)
- `scripts/verify-chart-labels.js:24` — read (`.find()`)
- `scripts/verify-complete-system.ts:105` — read (`.find()`)

### `chart_formatting_defaults`

- `app/api/chart-formatting-defaults/route.ts:35` — write (`.updateOne()`)
- `app/api/chart-formatting-defaults/route.ts:84` — write (`.updateOne()`)
- `scripts/migrateChartsToNewFormatting.ts:76` — read (`.findOne()`)
- `scripts/seedChartFormattingDefaults.ts:71` — write (`.insertOne()`)

### `chartconfigurations`

- `scripts/drop-lowercase.js:9` — write (`.drop()`)

### `charts`

- `app/api/charts/route.ts:35` — write (`.deleteOne/updateOne()`)
- `app/api/charts/route.ts:111` — write (`.deleteOne/updateOne()`)
- `app/api/charts/route.ts:177` — write (`.deleteOne/updateOne()`)
- `scripts/delete-wrong-bitly-charts.js:9` — write (`.deleteMany()`)
- `scripts/fix-chart-formulas.ts:14` — write (`.updateOne()`)

### `cities`

- `app/api/cities/route.ts:40` — read (`.aggregate()`)
- `scripts/migrate-partners-geography.js:21` — read (`.find()`)
- `scripts/seed-cities.js:99` — write (`.deleteMany()`)
- `scripts/seed-cities.js:123` — write (`.insertMany()`)
- `scripts/seed-cities.js:127` — write (`.createIndex()`)
- `scripts/seed-cities.js:128` — write (`.createIndex()`)
- `scripts/seed-cities.js:129` — write (`.createIndex()`)
- `scripts/seed-cities.js:134` — read (`.aggregate()`)

### `clickerSets`

- `scripts/backfillClickerSets.ts:23` — write (`.insertOne()`)
- `scripts/seed-messmass-landing.ts:34` — write (`.insertOne()`)

### `content_assets`

- `app/api/content-assets/route.ts:64` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/content-assets/route.ts:216` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/content-assets/route.ts:308` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/content-assets/route.ts:434` — write (`.deleteOne/insertOne/updateOne()`)
- `scripts/seed-additional-report-variables.ts:56` — write (`.insertOne()`)
- `scripts/seed-legacy-report-variables.ts:56` — write (`.insertOne()`)
- `scripts/setup-content-assets-indexes.ts:28` — write (`.createIndex()`)
- `scripts/sync-content-assets-to-kyc.ts:27` — read (`.find()`)

### `countries`

- `lib/countryService.ts:39` — read (`.find()`)
- `lib/countryService.ts:128` — read (`.findOne()`)
- `lib/countryService.ts:189` — read (`.find()`)
- `scripts/enrich-all-projects-countries.js:16` — read (`.find()`)
- `scripts/migrate-partners-geography.js:20` — read (`.find()`)
- `scripts/seed-cities.js:30` — read (`.find()`)
- `scripts/seed-countries.js:235` — write (`.createIndex/deleteMany/insertMany()`)
- `scripts/sync-30-links-standalone.js:15` — read (`.find()`)

### `country_mappings`

- `scripts/seed-country-mappings.js:233` — write (`.createIndex/deleteMany/insertMany()`)

### `data_blocks`

- `app/api/admin/landing-static-generate/route.ts:91` — read (`.find()`)
- `app/api/auto-generate-chart-block/route.ts:42` — write (`.insertOne()`)
- `app/api/data-blocks/route.ts:36` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/data-blocks/route.ts:79` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/data-blocks/route.ts:133` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/data-blocks/route.ts:204` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/debug/overview-block/route.ts:12` — read (`.findOne()`)
- `app/api/landing-report/route.ts:23` — read (`.find()`)
- `app/api/report-config/[identifier]/route.ts:40` — read (`.find()`)
- `lib/reportRuntime.ts:54` — read (`.find()`)
- `scripts/check-block-storage.ts:13` — read (`.findOne()`)
- `scripts/check-country-charts-in-blocks.ts:24` — read (`.find()`)
- `scripts/check-country-charts-in-blocks.ts:41` — read (`.find()`)
- `scripts/check-default-template.js:33` — read (`.findOne()`)
- `scripts/check-marketing-chart.js:29` — read (`.findOne()`)
- `scripts/check-overview-block.js:13` — read (`.findOne()`)
- `scripts/check-sihf-blocks.js:29` — read (`.findOne()`)
- `scripts/check-template-blocks.ts:18` — read (`.findOne()`)
- `scripts/debug-partner-charts.js:156` — read (`.findOne()`)
- `scripts/deep-inspect-asroma-template.ts:32` — read (`.find()`)
- `scripts/deep-inspect-asroma-template.ts:46` — read (`.find()`)
- `scripts/diagnose-builder-charts.ts:30` — read (`.find()`)
- `scripts/diagnose-builder-charts.ts:60` — read (`.find()`)
- `scripts/diagnose-charts-system.js:58` — read (`.find()`)
- `scripts/diagnose-partner-templates.js:74` — read (`.find()`)
- `scripts/diagnose-report-templates.ts:293` — read (`.find()`)
- `scripts/diagnose-report-templates.ts:323` — read (`.find()`)
- `scripts/diagnose-sihf-partner.js:66` — read (`.findOne()`)
- `scripts/diagnose-sihf-specific.js:78` — read (`.findOne()`)
- `scripts/diagnosticCompleteFlow.js:105` — read (`.countDocuments/find()`)
- `scripts/fix-data-block-chart-refs.ts:31` — read (`.find()`)
- `scripts/fix-data-blocks-chart-ids.ts:41` — write (`.updateOne()`)
- `scripts/fix-template-copies.ts:66` — write (`.insertOne()`)
- `scripts/migrate-layout-grammar.ts:167` — write (`.deleteMany/insertMany()`)
- `scripts/migrate-layout-grammar.ts:277` — write (`.deleteMany/insertMany()`)
- `scripts/migrate-layout-grammar.ts:299` — write (`.deleteMany/insertMany()`)
- `scripts/migrate-layout-grammar.ts:328` — write (`.deleteMany/insertMany()`)
- `scripts/migrate-reports-to-layout-grammar.ts:311` — read (`.find()`)
- `scripts/migrateGlobalVisualizationToWUKF.ts:23` — read (`.find()`)
- `scripts/migrateToReportTemplates.ts:47` — read (`.find()`)
- `scripts/remove-value-charts.js:33` — read (`.find()`)
- `scripts/remove-value-charts.js:44` — write (`.updateOne()`)
- `scripts/restore-missing-blocks.ts:44` — write (`.updateOne()`)
- `scripts/restore-missing-blocks.ts:110` — write (`.updateOne()`)
- `scripts/restore-missing-blocks.ts:224` — write (`.updateOne()`)
- `scripts/restore-missing-blocks.ts:265` — write (`.updateOne()`)
- `scripts/root-cause-analysis.ts:27` — read (`.findOne()`)
- `scripts/root-cause-analysis.ts:98` — read (`.findOne()`)
- `scripts/seed-messmass-landing.ts:170` — write (`.insertOne/updateOne()`)
- `scripts/simulate-partner-frontend.js:279` — read (`.findOne()`)
- `scripts/test-partner-fix.js:43` — read (`.findOne()`)
- `scripts/verify-asroma-charts.ts:30` — read (`.find()`)
- `scripts/verify-complete-system.ts:164` — read (`.find()`)

### `data_visualization_blocks`

- `scripts/migrateShowTitleField.ts:13` — write (`.updateMany()`)

### `drive_folder_links`

- `lib/aiAnalytics.ts:115` — read (`.find()`)
- `lib/aiAnalytics.ts:130` — read (`.aggregate()`)
- `lib/driveFolders.ts:75` — write (`.createIndex()`)
- `lib/driveFolders.ts:76` — write (`.createIndex()`)
- `lib/driveFolders.ts:107` — read (`.findOne()`)
- `lib/driveFolders.ts:126` — write (`.insertOne()`)
- `lib/driveFolders.ts:136` — read (`.find()`)
- `lib/driveFolders.ts:148` — write (`.deleteOne()`)
- `lib/driveFolders.ts:179` — write (`.findOneAndUpdate()`)
- `lib/driveFolders.ts:230` — read (`.find()`)
- `lib/fanmassIntegration.ts:138` — read (`.find()`)

### `event_comparisons`

- `scripts/setupAnalyticsIndexes.ts:111` — write (`.createIndex()`)

### `fanmass_event_links`

- `lib/fanmassIntegration.ts:176` — write (`.createIndex()`)
- `lib/fanmassIntegration.ts:177` — write (`.createIndex()`)
- `lib/fanmassIntegration.ts:178` — write (`.createIndex()`)
- `lib/fanmassIntegration.ts:214` — write (`.updateOne()`)
- `lib/fanmassIntegration.ts:234` — read (`.findOne()`)
- `lib/fanmassIntegration.ts:247` — read (`.findOne()`)
- `lib/fanmassIntegration.ts:387` — write (`.updateOne()`)
- `lib/fanmassIntegration.ts:418` — write (`.updateOne()`)

### `filter_slugs`

- `app/api/admin/filter-style/route.ts:52` — write (`.insertOne/updateOne()`)
- `app/api/admin/filter-style/route.ts:134` — write (`.insertOne/updateOne()`)
- `lib/slugUtils.ts:393` — write (`.insertOne/updateOne()`)
- `lib/slugUtils.ts:497` — write (`.insertOne/updateOne()`)

### `football_data_fixtures`

- `app/api/football-data/fixtures/route.ts:34` — read (`.countDocuments/find()`)
- `lib/fixtureImporter.ts:33` — write (`.updateOne()`)
- `lib/fixtureImporter.ts:72` — write (`.updateOne()`)
- `lib/fixtureImporter.ts:154` — write (`.updateOne()`)
- `lib/fixtureImporter.ts:243` — write (`.updateOne()`)
- `scripts/setupFootballDataIndexes.ts:12` — write (`.createIndex()`)

### `grid_settings`

- `scripts/migrateGlobalVisualizationToWUKF.ts:33` — read (`.findOne()`)
- `scripts/migrateToReportTemplates.ts:49` — read (`.findOne()`)

### `hashtag_categories`

- `app/api/hashtag-categories/route.ts:107` — read (`.countDocuments()`)
- `app/api/hashtag-categories/route.ts:112` — read (`.find()`)
- `app/api/hashtag-categories/route.ts:210` — read (`.findOne()`)
- `app/api/hashtag-categories/route.ts:221` — read (`.find()`)
- `app/api/hashtag-categories/route.ts:249` — write (`.insertOne()`)
- `app/api/hashtag-categories/route.ts:318` — read (`.findOne()`)
- `app/api/hashtag-categories/route.ts:330` — read (`.findOne()`)
- `app/api/hashtag-categories/route.ts:345` — write (`.updateOne()`)
- `app/api/hashtag-categories/route.ts:419` — read (`.findOne()`)
- `app/api/hashtag-categories/route.ts:447` — write (`.deleteOne()`)
- `scripts/remove-home-visitor-categories.js:45` — write (`.deleteMany()`)
- `scripts/remove-home-visitor-categories.js:74` — read (`.countDocuments()`)

### `hashtag_colors`

- `app/api/hashtag-colors/route.ts:21` — read (`.find()`)
- `app/api/hashtag-colors/route.ts:62` — read (`.findOne()`)
- `app/api/hashtag-colors/route.ts:81` — write (`.insertOne()`)
- `app/api/hashtag-colors/route.ts:126` — read (`.findOne()`)
- `app/api/hashtag-colors/route.ts:164` — write (`.updateOne()`)
- `app/api/hashtag-colors/route.ts:176` — read (`.findOne()`)
- `app/api/hashtag-colors/route.ts:215` — write (`.deleteOne()`)
- `app/api/hashtags/route.ts:332` — write (`.deleteOne()`)

### `hashtag_slugs`

- `app/api/admin/hashtag-style/route.ts:31` — write (`.updateOne()`)
- `app/api/admin/hashtag-style/route.ts:70` — write (`.updateOne()`)
- `app/api/hashtags/[hashtag]/route.ts:21` — read (`.findOne()`)
- `app/api/hashtags/route.ts:344` — write (`.deleteMany()`)
- `app/api/hashtags/slugs/route.ts:56` — write (`.insertOne()`)
- `lib/hashtagUtils.ts:21` — write (`.insertOne()`)
- `lib/hashtagUtils.ts:56` — write (`.insertOne()`)

### `hashtags`

- `app/api/hashtags/route.ts:336` — write (`.deleteMany()`)
- `app/api/projects/route.ts:37` — write (`.deleteMany/updateOne()`)
- `app/api/projects/route.ts:623` — write (`.deleteMany/updateOne()`)
- `app/api/projects/route.ts:917` — write (`.deleteMany/updateOne()`)
- `app/api/projects/route.ts:1080` — write (`.deleteMany/updateOne()`)

### `local_users`

- `scripts/check-atlas-users.js:15` — read (`.find()`)
- `scripts/cleanupLocalUsers.ts:9` — read (`.countDocuments()`)
- `scripts/cleanupLocalUsers.ts:12` — write (`.drop()`)
- `scripts/create-admin-user.js:22` — write (`.insertOne()`)
- `scripts/create-local-admin.js:31` — write (`.insertOne()`)
- `scripts/fixUsersCollection.ts:41` — write (`.drop()`)
- `scripts/fixUsersCollection.ts:46` — write (`.rename()`)
- `scripts/investigateDuplicateCollections.ts:96` — read (`.countDocuments/findOne()`)
- `scripts/investigateDuplicateCollections.ts:97` — read (`.countDocuments()`)
- `scripts/list-users.js:21` — read (`.find()`)
- `scripts/reset-password-simple.js:28` — write (`.updateOne()`)
- `scripts/show-user-password.js:8` — read (`.findOne()`)
- `scripts/verify-production-db.js:27` — read (`.countDocuments/find/findOne()`)

### `notifications`

- `app/api/debug/notifications/route.ts:33` — read (`.countDocuments/find()`)
- `app/api/notifications/mark-read/route.ts:27` — write (`.updateMany()`)
- `app/api/notifications/route.ts:35` — read (`.countDocuments/find()`)
- `lib/notificationUtils.ts:84` — write (`.updateOne()`)
- `scripts/migrate-notifications-schema.ts:40` — write (`.updateMany/updateOne()`)

### `organizations`

- `app/api/admin/organizations/[id]/members/route.ts:52` — read (`.findOne()`)
- `app/api/admin/organizations/[id]/members/route.ts:55` — read (`.find()`)
- `app/api/admin/organizations/[id]/members/route.ts:142` — read (`.findOne()`)
- `app/api/admin/organizations/[id]/route.ts:73` — read (`.findOne()`)
- `app/api/admin/organizations/[id]/route.ts:128` — write (`.deleteOne/updateOne()`)
- `app/api/admin/organizations/[id]/route.ts:229` — write (`.deleteOne/updateOne()`)
- `app/api/admin/organizations/route.ts:55` — read (`.find()`)
- `app/api/admin/organizations/route.ts:101` — write (`.insertOne()`)
- `app/api/organizations/edit/[id]/route.ts:113` — read (`.findOne()`)
- `app/api/organizations/edit/[id]/route.ts:203` — write (`.updateOne()`)
- `app/api/organizations/report/[id]/activities/route.ts:32` — read (`.findOne()`)
- `app/api/organizations/report/[id]/route.ts:76` — read (`.findOne()`)
- `lib/cameraProvision.ts:11` — read (`.findOne()`)
- `lib/cameraProvision.ts:15` — write (`.updateOne()`)
- `lib/fanmassIntegration.ts:135` — read (`.findOne()`)
- `lib/reportVariants.ts:157` — read (`.findOne()`)
- `lib/sponsorshipHub.ts:597` — read (`.findOne()`)

### `pageStyles`

- `app/admin/layout.tsx:17` — read (`.findOne()`)
- `scripts/checkPageStyles.ts:31` — read (`.find()`)

### `page_passwords`

- `lib/pageAccess.ts:107` — read (`.findOne()`)
- `lib/pagePassword.ts:137` — write (`.deleteMany/updateOne()`)
- `lib/pagePassword.ts:225` — write (`.deleteMany/updateOne()`)
- `lib/pagePassword.ts:376` — write (`.deleteMany/updateOne()`)
- `lib/pagePassword.ts:402` — write (`.deleteMany/updateOne()`)
- `scripts/canonicalizePartnerPagePasswords.ts:36` — write (`.updateOne()`)
- `scripts/generatePartnerReportPasswords.ts:25` — read (`.findOne()`)
- `scripts/generatePartnerReportPasswords.ts:39` — write (`.insertOne()`)
- `scripts/migratePartnerSlugsToUUID.ts:53` — write (`.updateOne()`)
- `scripts/rotate-page-passwords.ts:33` — write (`.updateOne()`)

### `page_styles_enhanced`

- `scripts/assign-report-styles.ts:17` — read (`.find()`)
- `scripts/auditDatabaseCollections.ts:255` — read (`.countDocuments()`)
- `scripts/check-partner-by-slug.ts:55` — read (`.findOne()`)
- `scripts/check-sihf-report.js:54` — read (`.findOne()`)
- `scripts/checkPageStyles.ts:20` — read (`.find()`)
- `scripts/checkPageStyles.ts:46` — write (`.updateOne()`)
- `scripts/cleanupOldStyleSystem.ts:65` — read (`.find()`)
- `scripts/debug-report-style.ts:46` — read (`.find()`)
- `scripts/diagnose-report-templates.ts:196` — read (`.find()`)
- `scripts/diagnose-report-templates.ts:238` — read (`.findOne()`)
- `scripts/diagnose-report-templates.ts:271` — read (`.findOne()`)
- `scripts/find-swiss-ice-hockey-style.js:26` — read (`.find()`)
- `scripts/fix-report-config-warnings.ts:39` — read (`.findOne()`)
- `scripts/fix-report-config-warnings.ts:45` — read (`.findOne()`)
- `scripts/fix-sihf-heading-color.js:22` — write (`.updateOne()`)
- `scripts/seedPageStyles.ts:207` — write (`.insertMany()`)

### `partner_analytics`

- `app/api/analytics/aggregates/partners/route.ts:55` — read (`.countDocuments/find/findOne()`)
- `app/api/analytics/compare/partners/route.ts:62` — read (`.find()`)
- `lib/analytics-aggregator.ts:414` — write (`.deleteOne/updateOne()`)
- `scripts/setupAnalyticsIndexes.ts:79` — write (`.createIndex()`)

### `partners`

- `app/api/admin/landing-static-generate/route.ts:101` — read (`.findOne()`)
- `app/api/admin/organizations/[id]/members/route.ts:58` — read (`.find()`)
- `app/api/admin/organizations/[id]/members/route.ts:145` — write (`.updateMany()`)
- `app/api/admin/organizations/[id]/members/route.ts:151` — write (`.updateMany()`)
- `app/api/admin/organizations/[id]/route.ts:233` — read (`.countDocuments()`)
- `app/api/admin/partners/route.ts:17` — read (`.find()`)
- `app/api/admin/project-partners/auto-suggest/route.ts:85` — read (`.find()`)
- `app/api/admin/sync-partners-to-camera/route.ts:43` — read (`.countDocuments()`)
- `app/api/admin/sync-partners-to-camera/route.ts:44` — read (`.find()`)
- `app/api/analytics/partner/[partnerId]/route.ts:65` — read (`.findOne()`)
- `app/api/api-football/enrich-partners/route.ts:95` — read (`.find()`)
- `app/api/api-football/enrich-partners/route.ts:140` — write (`.updateOne()`)
- `app/api/api-football/enrich-partners/route.ts:165` — read (`.countDocuments()`)
- `app/api/api-football/enrich-partners/route.ts:206` — read (`.countDocuments()`)
- `app/api/bitly/links/route.ts:350` — read (`.find()`)
- `app/api/bitly/partners/associate/route.ts:69` — read (`.findOne()`)
- `app/api/bitly/partners/associate/route.ts:79` — write (`.updateOne()`)
- `app/api/bitly/partners/associate/route.ts:157` — write (`.updateOne()`)
- `app/api/cron/google-sheets-sync/route.ts:52` — write (`.updateOne()`)
- `app/api/hashtags/route.ts:199` — read (`.countDocuments()`)
- `app/api/hashtags/route.ts:200` — read (`.countDocuments()`)
- `app/api/hashtags/route.ts:283` — write (`.updateMany()`)
- `app/api/hashtags/route.ts:288` — write (`.updateMany()`)
- `app/api/landing-report/route.ts:42` — read (`.findOne()`)
- `app/api/organizations/report/[id]/activities/route.ts:35` — read (`.find()`)
- `app/api/organizations/report/[id]/route.ts:77` — read (`.find()`)
- `app/api/partners/[id]/events/route.ts:50` — read (`.findOne()`)
- `app/api/partners/[id]/google-sheet/disconnect/route.ts:40` — write (`.updateOne()`)
- `app/api/partners/[id]/google-sheet/pull/route.ts:55` — write (`.updateOne()`)
- `app/api/partners/[id]/google-sheet/push/route.ts:55` — write (`.updateOne()`)
- `app/api/partners/[id]/google-sheet/rename/route.ts:36` — write (`.updateOne()`)
- `app/api/partners/[id]/google-sheet/setup/route.ts:41` — read (`.findOne()`)
- `app/api/partners/[id]/google-sheet/status/route.ts:52` — read (`.findOne()`)
- `app/api/partners/link-football-data/route.ts:30` — write (`.updateOne()`)
- `app/api/partners/route.ts:42` — read (`.countDocuments()`)
- `app/api/partners/route.ts:45` — read (`.find()`)
- `app/api/partners/route.ts:135` — write (`.updateOne()`)
- `app/api/partners/route.ts:152` — read (`.findOne()`)
- `app/api/partners/route.ts:211` — write (`.insertOne()`)
- `app/api/partners/route.ts:255` — write (`.deleteOne()`)
- `app/api/projects/route.ts:306` — read (`.find/findOne()`)
- `app/api/projects/route.ts:412` — read (`.find/findOne()`)
- `app/api/projects/route.ts:662` — read (`.find/findOne()`)
- `app/api/public/events/[id]/route.ts:94` — read (`.findOne()`)
- `app/api/public/partners/[id]/events/route.ts:78` — read (`.findOne()`)
- `app/api/public/partners/[id]/route.ts:67` — read (`.findOne()`)
- `app/api/public/partners/route.ts:93` — read (`.find()`)
- `app/api/public/partners/route.ts:102` — read (`.countDocuments()`)
- `app/api/report-config/[identifier]/route.ts:26` — read (`.findOne()`)
- `app/api/report-templates/assign/route.ts:98` — write (`.updateMany()`)
- `app/api/report-templates/assign/route.ts:185` — write (`.updateMany()`)
- `lib/analytics-aggregator.ts:275` — read (`.find/findOne()`)
- `lib/analytics-aggregator.ts:413` — read (`.find/findOne()`)
- `lib/analytics-aggregator.ts:726` — read (`.find/findOne()`)
- `lib/analytics-insights.ts:625` — read (`.find()`)
- `lib/cameraPartnerSync.ts:29` — write (`.createIndex()`)
- `lib/cameraPartnerSync.ts:45` — read (`.findOne()`)
- `lib/cameraPartnerSync.ts:46` — read (`.findOne()`)
- `lib/cameraPartnerSync.ts:60` — write (`.updateOne()`)
- `lib/cameraPartnerSync.ts:77` — write (`.insertOne()`)
- `lib/cameraProvision.ts:20` — read (`.findOne()`)
- `lib/cameraProvision.ts:33` — write (`.updateOne()`)
- `lib/cameraProvision.ts:64` — read (`.find()`)
- `lib/cameraProvision.ts:71` — write (`.updateOne()`)
- `lib/driveFolders.ts:251` — read (`.find()`)
- `lib/fanmassIntegration.ts:129` — read (`.find()`)
- `lib/fanmassMapping.ts:56` — read (`.find()`)
- `lib/fanmassMapping.ts:57` — read (`.countDocuments()`)
- `lib/fanmassMapping.ts:78` — write (`.insertOne()`)
- `lib/fixtureImporter.ts:73` — write (`.insertOne()`)
- `lib/fixtureImporter.ts:106` — write (`.insertOne()`)
- `lib/fixtureImporter.ts:155` — write (`.insertOne()`)
- `lib/googleSheets/partnerSheetOps.ts:43` — write (`.updateOne()`)
- `lib/googleSheets/partnerSheetOps.ts:240` — write (`.updateOne()`)
- `lib/googleSheets/partnerSheetOps.ts:264` — write (`.updateOne()`)
- `lib/report-resolver.ts:110` — read (`.findOne()`)
- `lib/report-resolver.ts:182` — read (`.findOne()`)
- `lib/reportVariants.ts:192` — unknown
- `lib/slugUtils.ts:217` — read (`.find()`)
- `lib/slugUtils.ts:316` — read (`.find()`)
- `lib/sponsorshipHub.ts:596` — read (`.find/findOne()`)
- `lib/sportsdbFixtureImporter.ts:80` — write (`.insertOne()`)
- `lib/sportsdbFixtureImporter.ts:109` — write (`.insertOne()`)
- `lib/sportsdbFixtureImporter.ts:163` — write (`.insertOne()`)
- `lib/sportsdbFixtureImporter.ts:233` — write (`.insertOne()`)
- `scripts/addViewSlugToPartners.ts:16` — write (`.updateOne()`)
- `scripts/aggregate-partner-bitly-kyc.ts:31` — read (`.findOne()`)
- `scripts/analyze-partner-mapping.ts:16` — read (`.find()`)
- `scripts/assignDefaultPartnerToOrphanedEvents.ts:27` — write (`.insertOne()`)
- `scripts/audit-bitly-thesportdb-kyc.ts:47` — read (`.countDocuments/findOne()`)
- `scripts/audit-kyc-data-completeness.ts:289` — read (`.countDocuments()`)
- `scripts/auditDatabaseCollections.ts:279` — read (`.countDocuments()`)
- `scripts/auditLegacyPartnerViewSlugs.ts:29` — read (`.find()`)
- `scripts/auto-map-project-partners.ts:91` — read (`.find()`)
- `scripts/backfillClickerSets.ts:60` — write (`.updateMany()`)
- `scripts/backfillPartnerAnalytics.ts:41` — read (`.find()`)
- `scripts/check-asroma-partner-template.ts:16` — read (`.findOne()`)
- `scripts/check-google-sheets-schema.ts:17` — read (`.countDocuments()`)
- `scripts/check-google-sheets-schema.ts:20` — read (`.countDocuments()`)
- `scripts/check-google-sheets-schema.ts:23` — read (`.countDocuments()`)
- `scripts/check-partner-by-slug.ts:23` — read (`.findOne()`)
- `scripts/check-partner-connection.ts:40` — read (`.findOne()`)
- `scripts/check-partner-connection.ts:55` — read (`.findOne()`)
- `scripts/check-partner-schema.js:13` — read (`.findOne()`)
- `scripts/check-partner-template-assignment.js:17` — read (`.findOne()`)
- `scripts/check-partners-with-bitly.ts:15` — read (`.find()`)
- `scripts/check-project-template.ts:16` — read (`.findOne()`)
- `scripts/check-report-image-charts.js:30` — read (`.findOne()`)
- `scripts/check-roma-data.ts:21` — read (`.findOne()`)
- `scripts/check-sihf-charts.js:51` — read (`.findOne()`)
- `scripts/check-sihf-event-fields.js:12` — read (`.findOne()`)
- `scripts/check-sihf-hashtags.js:16` — read (`.findOne()`)
- `scripts/check-sihf-report.js:26` — read (`.findOne()`)
- `scripts/check-sihf.js:10` — read (`.findOne()`)
- `scripts/checkPartner.js:16` — read (`.findOne()`)
- `scripts/compare-hashtag-vs-partner.js:75` — read (`.findOne()`)
- `scripts/createPartnerSheets.ts:234` — read (`.findOne()`)
- `scripts/createPartnerSheets.ts:254` — write (`.updateOne()`)
- `scripts/debug-partner-charts.js:20` — read (`.findOne()`)
- `scripts/debug-partner-events.js:15` — read (`.findOne()`)
- `scripts/debug-pull-endpoint.ts:24` — read (`.findOne()`)
- `scripts/debugProjectsForPartner.ts:11` — read (`.findOne()`)
- `scripts/diagnose-partner-templates.js:44` — read (`.find()`)
- `scripts/diagnose-partner-templates.js:89` — read (`.findOne()`)
- `scripts/diagnose-pull-push-sync.ts:30` — read (`.findOne()`)
- `scripts/diagnose-report-templates.ts:34` — read (`.find()`)
- `scripts/diagnose-report-templates.ts:88` — read (`.findOne()`)
- `scripts/diagnose-report-templates.ts:155` — read (`.find()`)
- `scripts/diagnose-report-templates.ts:255` — read (`.find()`)
- `scripts/diagnose-report-texts.js:28` — read (`.countDocuments/find()`)
- `scripts/diagnose-sihf-partner.js:28` — read (`.findOne()`)
- `scripts/diagnose-sihf-specific.js:34` — read (`.findOne()`)
- `scripts/enrich-partners-daily.ts:183` — write (`.updateOne()`)
- `scripts/enrich-partners-daily.ts:226` — read (`.find()`)
- `scripts/enrich-partners-daily.ts:271` — read (`.countDocuments()`)
- `scripts/enrich-partners-sportsdb.js:302` — write (`.updateOne()`)
- `scripts/exportPartners.ts:28` — read (`.find()`)
- `scripts/find-sihf-events.js:12` — read (`.find()`)
- `scripts/fix-as-roma-template.ts:21` — read (`.countDocuments()`)
- `scripts/fix-asroma-partner-template.ts:16` — read (`.findOne()`)
- `scripts/fix-asroma-partner-template.ts:29` — write (`.updateOne()`)
- `scripts/fix-missing-partners.ts:39` — read (`.findOne()`)
- `scripts/fix-missing-partners.ts:43` — write (`.insertOne()`)
- `scripts/fix-missing-partners.ts:50` — read (`.findOne()`)
- `scripts/fix-missing-partners.ts:55` — read (`.findOne()`)
- `scripts/fix-missing-stats.js:22` — write (`.updateOne()`)
- `scripts/fix-partner-event-connections.ts:106` — read (`.findOne()`)
- `scripts/fix-partner-templates.js:41` — read (`.find()`)
- `scripts/fix-partner-templates.js:49` — write (`.updateOne()`)
- `scripts/fix-partner-templates.js:57` — read (`.findOne()`)
- `scripts/fix-report-config-warnings.ts:100` — write (`.updateOne()`)
- `scripts/fix-report-config-warnings.ts:194` — write (`.updateOne()`)
- `scripts/fix-report-config-warnings.ts:269` — read (`.countDocuments()`)
- `scripts/fix-report-config-warnings.ts:285` — read (`.countDocuments()`)
- `scripts/generatePartnerReportPasswords.ts:13` — read (`.find()`)
- `scripts/importPartners.ts:38` — write (`.insertMany()`)
- `scripts/list-partners.ts:15` — read (`.find()`)
- `scripts/migrate-partners-geography.js:44` — read (`.find()`)
- `scripts/migrate-partners-geography.js:95` — write (`.updateOne()`)
- `scripts/migrate-partners-geography.js:109` — write (`.createIndex()`)
- `scripts/migrate-partners-geography.js:110` — write (`.createIndex()`)
- `scripts/migratePartnerSlugsToUUID.ts:101` — write (`.createIndex/updateOne()`)
- `scripts/migrateToReportTemplates.ts:48` — write (`.updateOne()`)
- `scripts/populateSzerencsejatek.ts:131` — read (`.findOne()`)
- `scripts/populateSzerencsejatek.ts:182` — write (`.updateOne()`)
- `scripts/seed-cities.js:20` — read (`.find()`)
- `scripts/seed-messmass-landing.ts:51` — write (`.insertOne/updateOne()`)
- `scripts/setupPartnerSheet.ts:265` — read (`.findOne()`)
- `scripts/setupPartnerSheet.ts:330` — write (`.updateOne()`)
- `scripts/setupPartnerSheets.ts:267` — read (`.findOne()`)
- `scripts/setupPartnerSheets.ts:329` — write (`.updateOne()`)
- `scripts/setupSzerencsejatek.ts:198` — read (`.findOne()`)
- `scripts/setupSzerencsejatek.ts:237` — write (`.updateOne()`)
- `scripts/simulate-partner-chart-calc.js:84` — read (`.findOne()`)
- `scripts/simulate-partner-frontend.js:130` — read (`.findOne()`)
- `scripts/sync-roma-bitly.ts:27` — read (`.findOne()`)
- `scripts/test-chart-calculation.js:15` — read (`.findOne()`)
- `scripts/test-full-partner-report.js:75` — read (`.findOne()`)
- `scripts/test-partner-chart-calculation.js:17` — read (`.findOne()`)
- `scripts/test-partner-content-merge.js:16` — read (`.findOne()`)
- `scripts/test-partner-content-merge.js:36` — write (`.updateOne()`)
- `scripts/test-partner-fix.js:71` — read (`.findOne()`)
- `scripts/test-partner-report-system.js:17` — read (`.findOne()`)
- `scripts/test-template-resolution.js:15` — read (`.findOne()`)
- `scripts/test-universal-partner-styles.js:17` — read (`.find()`)
- `scripts/upload-partner-logos.js:103` — write (`.updateOne()`)
- `scripts/v3/migrate-partners.ts:17` — read (`.find()`)
- `scripts/v3/migrate-qualitative-metadata.ts:23` — read (`.find()`)
- `scripts/v3/migrate-v2-v3.ts:33` — read (`.find()`)
- `scripts/v3/verify-migration.ts:20` — read (`.countDocuments()`)
- `scripts/verify-buildermode-setup.ts:45` — read (`.findOne()`)
- `scripts/verifyViewSlug.ts:10` — read (`.find()`)
- `scripts/verifyViewSlug.ts:22` — read (`.countDocuments()`)

### `project_permissions`

- `app/api/admin/permissions/route.ts:81` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/admin/permissions/route.ts:181` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/admin/permissions/route.ts:296` — write (`.deleteOne/insertOne/updateOne()`)

### `projects`

- `app/api/admin/landing-projects/route.ts:18` — read (`.find()`)
- `app/api/admin/project-partners/auto-suggest/route.ts:84` — write (`.updateOne()`)
- `app/api/admin/project-partners/route.ts:21` — write (`.updateOne()`)
- `app/api/admin/project-partners/route.ts:87` — write (`.updateOne()`)
- `app/api/admin/projects/[id]/route.ts:95` — write (`.deleteOne()`)
- `app/api/admin/projects/route.ts:71` — write (`.insertOne()`)
- `app/api/admin/projects/route.ts:157` — write (`.insertOne()`)
- `app/api/admin/sync-events-to-camera/route.ts:49` — read (`.countDocuments()`)
- `app/api/admin/sync-events-to-camera/route.ts:50` — read (`.find()`)
- `app/api/analytics/insights/route.ts:81` — read (`.find()`)
- `app/api/bitly/links/[linkId]/route.ts:82` — read (`.findOne()`)
- `app/api/bitly/links/route.ts:68` — read (`.findOne()`)
- `app/api/bitly/project-metrics/[projectId]/route.ts:86` — read (`.findOne()`)
- `app/api/cron/google-sheets-sync/route.ts:53` — write (`.insertMany/updateOne()`)
- `app/api/debug/categorized-hashtags/route.ts:36` — read (`.find()`)
- `app/api/debug/categorized-hashtags/route.ts:50` — read (`.find()`)
- `app/api/debug/categorized-hashtags/route.ts:68` — read (`.countDocuments()`)
- `app/api/debug/categorized-hashtags/route.ts:72` — read (`.countDocuments()`)
- `app/api/hashtag-categories/route.ts:431` — read (`.countDocuments()`)
- `app/api/hashtags/[hashtag]/route.ts:20` — read (`.find()`)
- `app/api/hashtags/filter-by-slug/[slug]/route.ts:48` — read (`.find()`)
- `app/api/hashtags/filter/route.ts:39` — read (`.find()`)
- `app/api/hashtags/route.ts:53` — read (`.aggregate()`)
- `app/api/hashtags/route.ts:60` — read (`.aggregate()`)
- `app/api/hashtags/route.ts:169` — read (`.countDocuments()`)
- `app/api/hashtags/route.ts:173` — read (`.countDocuments()`)
- `app/api/hashtags/route.ts:231` — write (`.updateMany()`)
- `app/api/hashtags/route.ts:253` — write (`.updateMany()`)
- `app/api/hashtags/slugs/route.ts:18` — read (`.find()`)
- `app/api/images/route.ts:73` — read (`.findOne()`)
- `app/api/landing-report/route.ts:21` — read (`.findOne()`)
- `app/api/organizations/report/[id]/activities/route.ts:45` — read (`.find()`)
- `app/api/organizations/report/[id]/route.ts:78` — read (`.find()`)
- `app/api/partners/[id]/bitly-kyc/route.ts:30` — read (`.find()`)
- `app/api/partners/[id]/events/route.ts:71` — read (`.find()`)
- `app/api/partners/[id]/google-sheet/pull/route.ts:56` — write (`.insertMany/updateOne()`)
- `app/api/partners/[id]/google-sheet/push/route.ts:56` — write (`.updateOne()`)
- `app/api/partners/report/[slug]/route.ts:83` — read (`.find()`)
- `app/api/projects/[id]/route.ts:22` — write (`.deleteOne/updateOne()`)
- `app/api/projects/[id]/route.ts:64` — write (`.deleteOne/updateOne()`)
- `app/api/projects/[id]/route.ts:155` — write (`.deleteOne/updateOne()`)
- `app/api/projects/route.ts:36` — read (`.find()`)
- `app/api/projects/route.ts:118` — read (`.findOne()`)
- `app/api/projects/route.ts:146` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/projects/route.ts:571` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/projects/route.ts:800` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/projects/route.ts:1045` — write (`.deleteOne/insertOne/updateOne()`)
- `app/api/public/events/[id]/route.ts:73` — read (`.findOne()`)
- `app/api/public/partners/[id]/events/route.ts:97` — read (`.find()`)
- `app/api/public/partners/[id]/events/route.ts:105` — read (`.countDocuments()`)
- `app/api/report-config/[identifier]/route.ts:25` — read (`.findOne()`)
- `app/api/report-templates/assign/route.ts:81` — write (`.updateMany()`)
- `app/api/report-templates/assign/route.ts:170` — write (`.updateMany()`)
- `lib/aiAnalysisSummary.ts:76` — read (`.findOne()`)
- `lib/aiAnalytics.ts:144` — read (`.find()`)
- `lib/aiAnalytics.ts:185` — read (`.countDocuments()`)
- `lib/aiAnalytics.ts:201` — read (`.aggregate()`)
- `lib/analytics-aggregator.ts:134` — read (`.find/findOne()`)
- `lib/analytics-aggregator.ts:412` — read (`.find/findOne()`)
- `lib/analytics-aggregator.ts:661` — read (`.find/findOne()`)
- `lib/analytics-benchmarking.ts:101` — read (`.find()`)
- `lib/analytics-benchmarking.ts:109` — read (`.findOne()`)
- `lib/analytics-benchmarking.ts:237` — read (`.findOne()`)
- `lib/analytics-benchmarking.ts:247` — read (`.find()`)
- `lib/analytics-benchmarking.ts:405` — read (`.findOne()`)
- `lib/analytics-benchmarking.ts:415` — read (`.find()`)
- `lib/analytics-benchmarking.ts:522` — read (`.find()`)
- `lib/analytics-insights.ts:103` — read (`.findOne()`)
- `lib/analytics-insights.ts:199` — read (`.find()`)
- `lib/analytics-insights.ts:272` — read (`.find()`)
- `lib/analytics-insights.ts:584` — read (`.find()`)
- `lib/analytics-insights.ts:639` — read (`.find()`)
- `lib/analytics-predictions.ts:75` — read (`.find()`)
- `lib/analytics-predictions.ts:244` — read (`.find()`)
- `lib/analytics-predictions.ts:466` — read (`.findOne()`)
- `lib/apiGuards.ts:52` — read (`.findOne()`)
- `lib/bitly-recalculator.ts:58` — read (`.find()`)
- `lib/bitlyStatsEnricher.ts:231` — write (`.bulkWrite()`)
- `lib/cameraProvision.ts:54` — write (`.updateOne()`)
- `lib/cameraProvision.ts:84` — read (`.find()`)
- `lib/driveFolders.ts:102` — read (`.findOne()`)
- `lib/driveFolders.ts:235` — read (`.find()`)
- `lib/fanmassIntegration.ts:119` — read (`.findOne()`)
- `lib/fanmassIntegration.ts:202` — read (`.findOne()`)
- `lib/fanmassIntegration.ts:372` — read (`.findOne()`)
- `lib/fanmassIntegration.ts:375` — write (`.updateOne()`)
- `lib/fanmassMapping.ts:117` — read (`.find()`)
- `lib/fanmassMapping.ts:146` — write (`.insertOne()`)
- `lib/fanmassMapping.ts:153` — read (`.findOne()`)
- `lib/fanmassMapping.ts:245` — read (`.findOne()`)
- `lib/fanmassMapping.ts:270` — write (`.updateOne()`)
- `lib/fixtureImporter.ts:156` — write (`.insertOne()`)
- `lib/googleSheets/partnerSheetOps.ts:125` — read (`.find()`)
- `lib/googleSheets/partnerSheetOps.ts:161` — write (`.updateOne()`)
- `lib/googleSheets/pullEvents.ts:293` — write (`.updateOne()`)
- `lib/googleSheets/pushEvents.ts:237` — write (`.updateOne()`)
- `lib/googleSheets/pushEvents.ts:366` — write (`.updateOne()`)
- `lib/hashtagUtils.ts:80` — read (`.find()`)
- `lib/hashtagUtils.ts:127` — read (`.find()`)
- `lib/report-resolver.ts:109` — read (`.findOne()`)
- `lib/slugUtils.ts:111` — write (`.insertOne/updateOne()`)
- `lib/slugUtils.ts:198` — write (`.insertOne/updateOne()`)
- `lib/slugUtils.ts:297` — write (`.insertOne/updateOne()`)
- `lib/sponsorshipHub.ts:595` — read (`.find/findOne()`)
- `lib/sportsdbFixtureImporter.ts:164` — write (`.insertOne()`)
- `scripts/aggregate-partner-bitly-kyc.ts:35` — read (`.find()`)
- `scripts/aggregateAnalytics.ts:92` — read (`.find()`)
- `scripts/analyze-partner-mapping.ts:20` — read (`.find()`)
- `scripts/assignDefaultPartnerToOrphanedEvents.ts:28` — write (`.updateMany()`)
- `scripts/audit-bitly-thesportdb-kyc.ts:46` — read (`.countDocuments/findOne()`)
- `scripts/audit-kyc-data-completeness.ts:71` — read (`.find()`)
- `scripts/audit-kyc-data-completeness.ts:122` — read (`.find()`)
- `scripts/audit-kyc-data-completeness.ts:167` — read (`.find()`)
- `scripts/audit-kyc-data-completeness.ts:288` — read (`.countDocuments()`)
- `scripts/audit-variable-naming-consistency.ts:57` — read (`.find()`)
- `scripts/auditDatabaseCollections.ts:162` — read (`.countDocuments/find()`)
- `scripts/auditDatabaseCollections.ts:224` — read (`.countDocuments/find()`)
- `scripts/auditDatabaseCollections.ts:278` — read (`.countDocuments/find()`)
- `scripts/auto-map-project-partners.ts:90` — write (`.updateOne()`)
- `scripts/backfillDerivedMetrics.ts:23` — write (`.updateOne()`)
- `scripts/check_db_field.js:14` — read (`.findOne()`)
- `scripts/check-aggregate.js:12` — read (`.findOne()`)
- `scripts/check-bitly-country-data.ts:14` — read (`.findOne()`)
- `scripts/check-google-sheets-schema.ts:32` — read (`.countDocuments()`)
- `scripts/check-partner-connection.ts:16` — read (`.findOne()`)
- `scripts/check-project-country-data.js:12` — read (`.findOne()`)
- `scripts/check-project-template.ts:9` — read (`.findOne()`)
- `scripts/check-roma-data.ts:26` — read (`.find()`)
- `scripts/check-sihf-charts.js:55` — read (`.find()`)
- `scripts/check-sihf-event-fields.js:16` — read (`.find()`)
- `scripts/check-sihf-hashtags.js:31` — read (`.find()`)
- `scripts/check-sihf-hashtags.js:57` — read (`.findOne()`)
- `scripts/check-sihf-hashtags.js:65` — read (`.find()`)
- `scripts/checkDatabaseFields.ts:16` — read (`.findOne()`)
- `scripts/checkPartner.js:59` — read (`.find()`)
- `scripts/checkPartner.js:64` — read (`.find()`)
- `scripts/checkPartner.js:69` — read (`.find()`)
- `scripts/checkPartner.js:74` — read (`.find()`)
- `scripts/compare-hashtag-vs-partner.js:21` — read (`.find()`)
- `scripts/compare-hashtag-vs-partner.js:86` — read (`.find()`)
- `scripts/compareFields.js:49` — read (`.find()`)
- `scripts/compareVariables.js:12` — read (`.findOne()`)
- `scripts/createPartnerSheets.ts:133` — read (`.find()`)
- `scripts/debug-partner-charts.js:32` — read (`.find()`)
- `scripts/debug-partner-events.js:28` — read (`.find()`)
- `scripts/debug-partner-events.js:37` — read (`.find()`)
- `scripts/debug-partner-events.js:46` — read (`.find()`)
- `scripts/debug-partner-events.js:55` — read (`.find()`)
- `scripts/debug-partner-events.js:66` — read (`.find()`)
- `scripts/debug-pull-endpoint.ts:25` — read (`.countDocuments/findOne()`)
- `scripts/debugFindEvent.ts:12` — read (`.findOne()`)
- `scripts/debugProjectsForPartner.ts:25` — read (`.find()`)
- `scripts/diagnose-pull-push-sync.ts:31` — read (`.countDocuments/find()`)
- `scripts/diagnose-report-templates.ts:33` — read (`.find()`)
- `scripts/diagnose-report-texts.js:80` — read (`.countDocuments/find()`)
- `scripts/diagnose-sihf-partner.js:124` — read (`.find()`)
- `scripts/diagnose-sihf-specific.js:151` — read (`.find()`)
- `scripts/diagnosticCompleteFlow.js:134` — read (`.findOne()`)
- `scripts/enrich-all-projects-bitly-countries.ts:115` — read (`.findOne()`)
- `scripts/enrich-all-projects-bitly-countries.ts:131` — write (`.updateOne()`)
- `scripts/enrich-all-projects-bitly-countries.ts:146` — read (`.findOne()`)
- `scripts/enrich-all-projects-countries.js:106` — read (`.find()`)
- `scripts/enrich-all-projects-countries.js:122` — write (`.updateOne()`)
- `scripts/enrich-project-bitly-metrics.ts:25` — read (`.find()`)
- `scripts/enrich-project-bitly-metrics.ts:85` — write (`.updateOne()`)
- `scripts/find-sihf-events.js:25` — read (`.find()`)
- `scripts/find-sihf-events.js:48` — read (`.find()`)
- `scripts/fix-as-roma-template.ts:20` — read (`.countDocuments()`)
- `scripts/fix-asroma-template.ts:11` — write (`.updateOne()`)
- `scripts/fix-bitly-kyc-data.ts:120` — read (`.findOne()`)
- `scripts/fix-bitly-kyc-data.ts:177` — read (`.find()`)
- `scripts/fix-bitly-kyc-data.ts:265` — write (`.updateOne()`)
- `scripts/fix-country-chart-labels.js:12` — read (`.find()`)
- `scripts/fix-country-chart-labels.js:45` — write (`.updateOne()`)
- `scripts/fix-formulas-and-variables.ts:50` — read (`.find()`)
- `scripts/fix-formulas-use-only-standard-fields.ts:56` — read (`.find()`)
- `scripts/fix-invalid-field-names.ts:54` — read (`.find()`)
- `scripts/fix-missing-partners.ts:24` — read (`.find()`)
- `scripts/fix-missing-partners.ts:79` — write (`.updateOne()`)
- `scripts/fix-partner-event-connections.ts:86` — read (`.find()`)
- `scripts/fix-partner-event-connections.ts:153` — write (`.updateOne()`)
- `scripts/fix-partner-event-connections.ts:178` — read (`.findOne()`)
- `scripts/fix-remaining-issues.ts:130` — read (`.find()`)
- `scripts/fix-report-config-warnings.ts:59` — write (`.updateOne()`)
- `scripts/fix-report-config-warnings.ts:261` — read (`.countDocuments()`)
- `scripts/fixOrphanedStyleReferences.ts:57` — write (`.updateMany()`)
- `scripts/initialize-mandatory-fields.ts:67` — write (`.updateOne()`)
- `scripts/investigateDuplicateCollections.ts:115` — read (`.find()`)
- `scripts/list-mongodb-fields.ts:22` — read (`.find()`)
- `scripts/list-projects-partners.ts:15` — read (`.find()`)
- `scripts/migrate-bitly-many-to-many.js:209` — read (`.find()`)
- `scripts/migrate-stats-v2.13.0.js:18` — write (`.updateOne()`)
- `scripts/migrate-to-remoteFans.js:45` — write (`.updateOne()`)
- `scripts/migrateStyleIdToEnhanced.ts:42` — write (`.updateOne()`)
- `scripts/migrateStyleIdToEnhanced.ts:149` — write (`.updateOne()`)
- `scripts/populate-kyc-from-existing-bitly.ts:95` — write (`.updateOne()`)
- `scripts/populateSzerencsejatek.ts:146` — read (`.find()`)
- `scripts/queryEvents.js:46` — read (`.find()`)
- `scripts/querySzerencsejatekEvents.ts:21` — read (`.find()`)
- `scripts/register-missing-kyc-variables.ts:192` — read (`.find()`)
- `scripts/remove-home-visitor-categories.js:32` — read (`.countDocuments()`)
- `scripts/remove-home-visitor-categories.js:36` — read (`.countDocuments()`)
- `scripts/remove-home-visitor-categories.js:52` — write (`.updateMany()`)
- `scripts/remove-home-visitor-categories.js:66` — read (`.countDocuments()`)
- `scripts/remove-home-visitor-categories.js:70` — read (`.countDocuments()`)
- `scripts/remove-invalid-formulas.ts:41` — read (`.find()`)
- `scripts/remove-obsolete-visit-vars.js:73` — write (`.updateMany()`)
- `scripts/seed-messmass-landing.ts:279` — write (`.insertOne/updateOne()`)
- `scripts/setupPartnerSheet.ts:276` — read (`.find()`)
- `scripts/setupPartnerSheets.ts:277` — read (`.find()`)
- `scripts/setupSzerencsejatek.ts:206` — read (`.find()`)
- `scripts/simulate-partner-chart-calc.js:89` — read (`.find()`)
- `scripts/simulate-partner-frontend.js:140` — read (`.find()`)
- `scripts/sync-30-links-standalone.js:184` — read (`.find()`)
- `scripts/sync-30-links-standalone.js:197` — write (`.updateOne()`)
- `scripts/sync-bitly-field-names.ts:25` — read (`.find()`)
- `scripts/sync-bitly-field-names.ts:46` — write (`.updateOne()`)
- `scripts/sync-bitly-to-project-stats.ts:42` — write (`.updateOne()`)
- `scripts/sync-roma-bitly.ts:39` — read (`.find()`)
- `scripts/test-chart-calculation.js:16` — read (`.find()`)
- `scripts/test-full-partner-report.js:76` — read (`.find()`)
- `scripts/test-mongo-connection.js:49` — read (`.countDocuments()`)
- `scripts/test-mongodb-connection.js:63` — read (`.countDocuments()`)
- `scripts/test-mongodb-connection.js:66` — read (`.find()`)
- `scripts/test-partner-chart-calculation.js:22` — read (`.find()`)
- `scripts/test-partner-fix.js:81` — read (`.find()`)
- `scripts/test-partner-report-system.js:32` — read (`.find()`)
- `scripts/v3/migrate-projects-to-activities.ts:32` — read (`.find()`)
- `scripts/v3/migrate-projects.ts:15` — read (`.find()`)
- `scripts/v3/migrate-qualitative-metadata.ts:24` — read (`.find()`)
- `scripts/v3/migrate-stats-to-metrics.ts:24` — read (`.find()`)
- `scripts/v3/migrate-stats.ts:14` — read (`.find()`)
- `scripts/v3/verify-migration.ts:25` — read (`.countDocuments()`)
- `scripts/validate-and-fix-all-formulas.ts:24` — read (`.find()`)
- `scripts/validateDataQuality.ts:202` — write (`.updateOne()`)
- `scripts/validateDataQuality.ts:335` — write (`.updateOne()`)
- `scripts/verify-and-fix-formulas.ts:26` — read (`.find()`)
- `scripts/verify-buildermode-setup.ts:24` — read (`.findOne()`)
- `scripts/verify-complete-system.ts:76` — read (`.find()`)
- `scripts/verify-kyc-integration.ts:158` — read (`.countDocuments/findOne()`)

### `report_styles`

- `app/api/landing-report/route.ts:25` — read (`.findOne()`)
- `app/api/projects/route.ts:560` — read (`.findOne()`)
- `app/api/projects/route.ts:805` — read (`.findOne()`)
- `scripts/seed-messmass-landing.ts:77` — write (`.insertOne()`)

### `report_templates`

- `app/api/admin/landing-static-generate/route.ts:90` — read (`.findOne()`)
- `app/api/landing-report/route.ts:22` — read (`.findOne()`)
- `app/api/report-config/[identifier]/route.ts:24` — read (`.findOne()`)
- `app/api/report-templates/assign/route.ts:63` — read (`.findOne()`)
- `app/api/report-templates/route.ts:29` — write (`.deleteOne/insertOne/updateMany/updateOne()`)
- `app/api/report-templates/route.ts:118` — write (`.deleteOne/insertOne/updateMany/updateOne()`)
- `app/api/report-templates/route.ts:162` — write (`.deleteOne/insertOne/updateMany/updateOne()`)
- `app/api/report-templates/route.ts:206` — write (`.deleteOne/insertOne/updateMany/updateOne()`)
- `lib/reportRuntime.ts:128` — read (`.findOne()`)
- `scripts/check-asroma-partner-template.ts:37` — read (`.findOne()`)
- `scripts/check-default-template.js:16` — read (`.findOne()`)
- `scripts/check-old-template-styles.ts:15` — read (`.find()`)
- `scripts/check-partner-template-assignment.js:39` — read (`.findOne()`)
- `scripts/check-partner-template-assignment.js:62` — read (`.find()`)
- `scripts/check-project-template.ts:21` — read (`.findOne()`)
- `scripts/check-sihf-blocks.js:11` — read (`.findOne()`)
- `scripts/check-sihf-blocks.js:61` — read (`.findOne()`)
- `scripts/check-sihf.js:20` — read (`.findOne()`)
- `scripts/check-template-blocks.ts:10` — read (`.findOne()`)
- `scripts/check-templates.js:13` — read (`.find()`)
- `scripts/copy-default-to-asroma-template.ts:16` — read (`.findOne()`)
- `scripts/copy-default-to-asroma-template.ts:37` — read (`.findOne()`)
- `scripts/copy-default-to-asroma-template.ts:53` — write (`.updateOne()`)
- `scripts/copy-default-to-asroma-template.ts:69` — read (`.findOne()`)
- `scripts/debug-partner-charts.js:137` — read (`.findOne()`)
- `scripts/debug-partner-charts.js:143` — read (`.findOne()`)
- `scripts/debug-partner-charts.js:150` — read (`.findOne()`)
- `scripts/deep-inspect-asroma-template.ts:16` — read (`.findOne()`)
- `scripts/diagnose-builder-charts.ts:21` — read (`.findOne()`)
- `scripts/diagnose-builder-charts.ts:51` — read (`.find()`)
- `scripts/diagnose-partner-templates.js:28` — read (`.find()`)
- `scripts/diagnose-partner-templates.js:54` — read (`.findOne()`)
- `scripts/diagnose-partner-templates.js:64` — read (`.find()`)
- `scripts/diagnose-partner-templates.js:100` — read (`.findOne()`)
- `scripts/diagnose-partner-templates.js:107` — read (`.findOne()`)
- `scripts/diagnose-report-templates.ts:35` — read (`.find()`)
- `scripts/diagnose-report-templates.ts:52` — read (`.findOne()`)
- `scripts/diagnose-report-templates.ts:105` — read (`.findOne()`)
- `scripts/diagnose-report-templates.ts:134` — read (`.findOne()`)
- `scripts/diagnose-report-templates.ts:172` — read (`.findOne()`)
- `scripts/diagnose-report-templates.ts:222` — read (`.find()`)
- `scripts/diagnose-report-templates.ts:292` — read (`.find()`)
- `scripts/diagnose-sihf-partner.js:46` — read (`.findOne()`)
- `scripts/diagnose-sihf-specific.js:55` — read (`.findOne()`)
- `scripts/diagnose-sihf-specific.js:138` — read (`.findOne()`)
- `scripts/enable-export-buttons.js:20` — write (`.updateMany()`)
- `scripts/fix-as-roma-template.ts:9` — read (`.findOne()`)
- `scripts/fix-as-roma-template.ts:29` — write (`.deleteOne()`)
- `scripts/fix-as-roma-template.ts:35` — read (`.findOne()`)
- `scripts/fix-as-roma-template.ts:38` — write (`.updateOne()`)
- `scripts/fix-last-warning.ts:13` — write (`.updateOne()`)
- `scripts/fix-partner-templates.js:28` — write (`.updateOne()`)
- `scripts/fix-partner-templates.js:67` — read (`.findOne()`)
- `scripts/fix-partner-templates.js:74` — read (`.findOne()`)
- `scripts/fix-report-config-warnings.ts:25` — read (`.findOne()`)
- `scripts/fix-report-config-warnings.ts:103` — read (`.findOne()`)
- `scripts/fix-report-config-warnings.ts:151` — write (`.updateOne()`)
- `scripts/fix-report-config-warnings.ts:277` — read (`.countDocuments()`)
- `scripts/fix-template-copies.ts:65` — write (`.updateOne()`)
- `scripts/list-all-templates.ts:15` — read (`.find()`)
- `scripts/list-partners.ts:32` — read (`.find()`)
- `scripts/migrate-layout-grammar.ts:166` — write (`.deleteMany/insertMany()`)
- `scripts/migrate-layout-grammar.ts:298` — write (`.deleteMany/insertMany()`)
- `scripts/migrate-layout-grammar.ts:327` — write (`.deleteMany/insertMany()`)
- `scripts/migrate-reports-to-layout-grammar.ts:310` — read (`.find()`)
- `scripts/migrate-templates-to-datablocks.ts:14` — write (`.updateOne()`)
- `scripts/migrateGlobalVisualizationToWUKF.ts:47` — read (`.findOne()`)
- `scripts/migrateGlobalVisualizationToWUKF.ts:55` — read (`.find()`)
- `scripts/migrateGlobalVisualizationToWUKF.ts:80` — write (`.updateOne()`)
- `scripts/migrateGlobalVisualizationToWUKF.ts:99` — read (`.findOne()`)
- `scripts/migrateToReportTemplates.ts:46` — write (`.createIndex/insertOne()`)
- `scripts/root-cause-analysis.ts:16` — read (`.findOne()`)
- `scripts/seed-messmass-landing.ts:235` — write (`.insertOne/updateOne()`)
- `scripts/simulate-partner-frontend.js:265` — read (`.findOne()`)
- `scripts/simulate-partner-frontend.js:272` — read (`.findOne()`)
- `scripts/test-partner-fix.js:20` — read (`.findOne()`)
- `scripts/test-template-resolution.js:29` — read (`.findOne()`)
- `scripts/test-template-resolution.js:36` — read (`.findOne()`)
- `scripts/test-template-resolution.js:53` — read (`.findOne()`)
- `scripts/verify-asroma-charts.ts:16` — read (`.findOne()`)
- `scripts/verify-buildermode-setup.ts:55` — read (`.findOne()`)
- `scripts/verify-buildermode-setup.ts:57` — read (`.findOne()`)

### `report_variants`

- `app/api/report-variants/[id]/route.ts:24` — read (`.findOne()`)
- `lib/reportVariants.ts:277` — write (`.insertOne/updateMany/updateOne()`)
- `lib/reportVariants.ts:348` — write (`.insertOne/updateMany/updateOne()`)
- `lib/reportVariants.ts:402` — write (`.insertOne/updateMany/updateOne()`)
- `scripts/audit-report-variant-periods.ts:27` — write (`.updateOne()`)

### `reports`

- `lib/report-resolver.ts:108` — read (`.find/findOne()`)
- `lib/report-resolver.ts:181` — read (`.find/findOne()`)
- `lib/report-resolver.ts:227` — read (`.find/findOne()`)
- `lib/report-resolver.ts:254` — read (`.find/findOne()`)
- `lib/report-resolver.ts:271` — read (`.find/findOne()`)
- `lib/reportRuntime.ts:127` — read (`.findOne()`)
- `lib/v3/reporting/reportResolver.ts:111` — read (`.findOne()`)
- `lib/v3/reporting/reportResolver.ts:118` — read (`.findOne()`)
- `scripts/assign-report-styles.ts:26` — read (`.find()`)
- `scripts/assign-report-styles.ts:53` — write (`.updateOne()`)
- `scripts/check-partner-by-slug.ts:41` — read (`.findOne()`)
- `scripts/debug-report-style.ts:16` — read (`.find()`)
- `scripts/debug-report-style.ts:31` — read (`.find()`)
- `scripts/fix-report-template-chart-ids.ts:41` — write (`.updateOne()`)

### `reports_v12`

- `scripts/check-sihf-report.js:40` — read (`.findOne()`)

### `settings`

- `app/admin/layout.tsx:16` — read (`.findOne()`)
- `app/api/admin/ui-settings/route.ts:38` — read (`.findOne()`)
- `app/api/admin/ui-settings/route.ts:125` — write (`.updateOne()`)
- `app/api/grid-settings/route.ts:33` — write (`.updateOne()`)
- `lib/gridSettings.ts:46` — read (`.findOne()`)
- `lib/landingSettings.ts:38` — read (`.findOne()`)
- `lib/landingSettings.ts:49` — write (`.updateOne()`)
- `lib/landingSettings.ts:63` — write (`.updateOne()`)
- `scripts/cleanupOldStyleSystem.ts:49` — write (`.deleteOne()`)

### `sportsdb_fixtures`

- `app/api/sports-db/fixtures/route.ts:53` — read (`.countDocuments/find()`)
- `lib/sportsdbFixtureImporter.ts:44` — write (`.updateOne()`)
- `lib/sportsdbFixtureImporter.ts:79` — write (`.updateOne()`)
- `lib/sportsdbFixtureImporter.ts:162` — write (`.updateOne()`)

### `styles`

- `scripts/fixOrphanedStyleReferences.ts:58` — read (`.find()`)

### `system_settings`

- `scripts/aggregateAnalytics.ts:51` — write (`.updateOne()`)
- `scripts/aggregateAnalytics.ts:69` — write (`.updateOne()`)

### `user_preferences`

- `app/api/user-preferences/route.ts:31` — write (`.updateOne()`)
- `app/api/user-preferences/route.ts:66` — write (`.updateOne()`)

### `users`

- `app/api/admin/local-users/[id]/route.ts:53` — write (`.deleteOne/updateOne()`)
- `app/api/admin/local-users/[id]/route.ts:128` — write (`.deleteOne/updateOne()`)
- `app/api/admin/local-users/[id]/send-email/route.ts:52` — read (`.findOne()`)
- `lib/users.ts:59` — write (`.createIndex/deleteOne/insertOne/updateOne()`)
- `scripts/check-users-password-hash.ts:22` — read (`.countDocuments()`)
- `scripts/checkUsers.ts:10` — read (`.countDocuments()`)
- `scripts/checkUsers.ts:14` — read (`.find()`)
- `scripts/ensureSuperadmin.ts:14` — read (`.findOne()`)
- `scripts/migrate-users-to-password-hash.ts:31` — write (`.updateOne()`)
- `scripts/migrateUserRoles.ts:26` — write (`.updateOne()`)
- `scripts/migrations/add-api-write-fields.ts:19` — write (`.updateMany()`)
- `scripts/restoreUsers.ts:24` — write (`.deleteMany/insertMany()`)

### `v3_activities`

- `scripts/v3/migrate-stats-to-metrics.ts:34` — read (`.findOne()`)

### `v3_metric_definitions`

- `scripts/v3/audit-data.ts:19` — read (`.countDocuments()`)
- `scripts/v3/migrate-stats-to-metrics.ts:50` — write (`.updateOne()`)

### `v3_metric_values`

- `scripts/v3/audit-data.ts:16` — read (`.countDocuments()`)
- `scripts/v3/audit-data.ts:23` — read (`.findOne()`)
- `scripts/v3/migrate-stats-to-metrics.ts:66` — write (`.insertOne()`)

### `variablesConfig`

- `scripts/compareVariables.ts:10` — read (`.find()`)
- `scripts/compareVariables.ts:18` — read (`.findOne()`)
- `scripts/consolidateVariablesConfig.ts:81` — write (`.drop()`)
- `scripts/dropLegacyVariablesConfig.ts:45` — read (`.countDocuments()`)
- `scripts/dropLegacyVariablesConfig.ts:58` — write (`.drop()`)
- `scripts/investigateDuplicateCollections.ts:77` — read (`.countDocuments/findOne()`)
- `scripts/remove-obsolete-visit-vars.js:61` — write (`.deleteMany()`)

### `variablesGroups`

- `scripts/addReportContentGroup.ts:19` — write (`.insertOne()`)
- `scripts/alignClickerManagerToKyc.ts:37` — write (`.updateMany()`)
- `scripts/backfillClickerSets.ts:43` — write (`.updateMany()`)
- `scripts/diagnose-clicker.ts:30` — read (`.find()`)
- `scripts/fix-clicker-groups-prefix.ts:27` — write (`.updateOne()`)
- `scripts/seedVariableGroups.ts:37` — write (`.insertMany()`)

### `variables_groups`

- `scripts/investigateDuplicateCollections.ts:64` — read (`.countDocuments()`)
- `scripts/investigateDuplicateCollections.ts:65` — read (`.countDocuments()`)

### `variables_metadata`

- `lib/aiAnalytics.ts:212` — read (`.find()`)
- `lib/fanmassMapping.ts:189` — read (`.find()`)
- `lib/fanmassMapping.ts:199` — write (`.insertOne/updateOne()`)
- `lib/fanmassMapping.ts:250` — read (`.find()`)
- `scripts/add-mandatory-kyc-variables.ts:67` — write (`.insertOne/updateOne()`)
- `scripts/add-partner-report-variables.js:22` — write (`.updateOne()`)
- `scripts/add-report-image-variables.js:24` — write (`.insertMany()`)
- `scripts/add-vent-variables-and-charts.js:22` — write (`.updateOne()`)
- `scripts/addGameVariables.ts:43` — write (`.updateOne()`)
- `scripts/addNewVariables.ts:42` — write (`.updateOne()`)
- `scripts/addVisitorKYCVariables.js:23` — write (`.insertOne()`)
- `scripts/alignClickerManagerToKyc.ts:38` — write (`.updateOne()`)
- `scripts/audit-bitly-thesportdb-kyc.ts:45` — read (`.find()`)
- `scripts/audit-chart-variables.ts:42` — read (`.find()`)
- `scripts/audit-kyc-data-completeness.ts:290` — read (`.countDocuments()`)
- `scripts/audit-variable-naming-consistency.ts:113` — read (`.find()`)
- `scripts/audit-variable-naming.ts:43` — read (`.find()`)
- `scripts/check-country-charts.ts:35` — read (`.find()`)
- `scripts/check-var-structure.ts:10` — read (`.findOne()`)
- `scripts/check-vars.ts:10` — read (`.find()`)
- `scripts/cleanup-report-kyc-variables.ts:27` — write (`.deleteMany()`)
- `scripts/compareVariables.ts:14` — read (`.find()`)
- `scripts/compareVariables.ts:19` — read (`.findOne()`)
- `scripts/consolidateVariablesConfig.ts:82` — read (`.countDocuments/find()`)
- `scripts/delete-temp-var.ts:10` — write (`.deleteOne()`)
- `scripts/delete-variables.ts:18` — write (`.deleteOne()`)
- `scripts/diagnose-clicker.ts:49` — read (`.find()`)
- `scripts/diagnosticCompleteFlow.js:34` — read (`.countDocuments/find/findOne()`)
- `scripts/dropLegacyVariablesConfig.ts:46` — read (`.countDocuments()`)
- `scripts/enableManualModeForAllVariables.ts:26` — write (`.updateMany()`)
- `scripts/fix-bitly-variables-for-growth-tier.ts:190` — write (`.deleteMany()`)
- `scripts/fix-bitly-variables-for-growth-tier.ts:211` — read (`.findOne()`)
- `scripts/fix-bitly-variables-for-growth-tier.ts:219` — write (`.insertOne()`)
- `scripts/fix-formulas-and-variables.ts:69` — read (`.find()`)
- `scripts/fix-kyc-variable-names.ts:28` — read (`.find()`)
- `scripts/fix-kyc-variable-names.ts:41` — write (`.deleteMany()`)
- `scripts/fix-missing-labels.ts:10` — write (`.updateOne()`)
- `scripts/fix-p1-2.2-variable-naming-violations.ts:36` — write (`.deleteOne/updateOne()`)
- `scripts/fix-remaining-issues.ts:141` — write (`.deleteOne/insertOne()`)
- `scripts/investigateDuplicateCollections.ts:78` — read (`.countDocuments()`)
- `scripts/register-missing-kyc-variables.ts:193` — write (`.insertMany()`)
- `scripts/remove-stats-prefix-everywhere.ts:66` — write (`.deleteOne/updateOne()`)
- `scripts/seedFanmassStatusVariable.ts:58` — write (`.insertOne/updateOne()`)
- `scripts/sync-content-assets-to-kyc.ts:28` — write (`.insertOne()`)
- `scripts/temp-check-schema.ts:11` — read (`.find()`)
- `scripts/verify-complete-system.ts:59` — read (`.find()`)
- `scripts/verify-kyc-integration.ts:96` — read (`.countDocuments/findOne()`)
- `scripts/verify-report-variables.js:22` — read (`.find()`)

### `visualizationBlocks`

- `scripts/diagnose-overview-block.js:17` — read (`.findOne()`)
- `scripts/diagnose-overview-block.js:131` — write (`.updateOne()`)

### `webhook_delivery_logs`

- `lib/webhooks.ts:285` — write (`.insertOne()`)
- `lib/webhooks.ts:469` — write (`.createIndex/deleteOne/findOneAndUpdate/insertOne()`)

### `webhooks`

- `lib/webhooks.ts:85` — write (`.createIndex/deleteOne/findOneAndUpdate/insertOne()`)
- `lib/webhooks.ts:123` — write (`.createIndex/deleteOne/findOneAndUpdate/insertOne()`)
- `lib/webhooks.ts:152` — write (`.createIndex/deleteOne/findOneAndUpdate/insertOne()`)
- `lib/webhooks.ts:185` — write (`.createIndex/deleteOne/findOneAndUpdate/insertOne()`)
- `lib/webhooks.ts:215` — write (`.createIndex/deleteOne/findOneAndUpdate/insertOne()`)
- `lib/webhooks.ts:258` — write (`.createIndex/deleteOne/findOneAndUpdate/insertOne()`)
- `lib/webhooks.ts:284` — write (`.updateOne()`)
