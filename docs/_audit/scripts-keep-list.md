# scripts/ keep-list (messmass#352)
Status: Active
Last Updated: 2026-09-08T00:00:00.000Z
Canonical: Yes
Owner: Engineering

Records how the 2026-09-08 prune of `scripts/` decided what stays. The
register entry is in `drift-register.md` §7. This file carries no version
stamp on purpose (see `README.md` in this directory).

## Derivation rules

A script is kept when, and only when, something runnable or currently
operational points at it. Sources were scanned in this order:

1. **hard keep** — referenced from `package.json` (`scripts` block),
   `.github/**` (workflows and issue templates), `vercel.json`, the jest /
   tsconfig / next config files, code under `lib/`, `app/`, `tests/`,
   `hooks/`, `components/`, or from `README.md`, `READMEDEV.md`,
   `docs/HANDOVER.md`, `AGENTS.md`.
2. **operational-doc keep** — referenced by path from a current
   (non-archive, non-audit) doc under `docs/`.
3. **transitive keep** — any relative import of a kept script is kept too.
4. Everything else is deleted. Mentions in historical records —
   `docs/operations/operations-release-notes.md`,
   `docs/operations/operations-learnings.md`, `docs/_audit/`, `docs/audits/`,
   `docs/_meta/`, `docs/archive/` — do **not** keep a script alive. Those
   documents describe what was done at the time and are expected to keep
   naming scripts that no longer exist; that is intentional and is not drift.

The derivation was spot-checked with `grep` on a random sample of 10
delete candidates (excluding the historical directories above). One
candidate was promoted to the keep set as a result:
`scripts/sync-bitly-to-project-stats.ts`, because the kept
`scripts/audit-kyc-data-completeness.ts` prints "Run
scripts/sync-bitly-to-project-stats.ts --apply" as an operator action.

## Counts

| | files |
|---|---|
| tracked under `scripts/` before | 421 |
| deleted | 315 |
| kept | 106 |

Directories remaining: `scripts/`, `scripts/lib/`, `scripts/migrations/`,
`scripts/v3/`. Every directory emptied by the prune was removed.

## Kept scripts by reason

### package.json script (90)

| script | npm run |
|---|---|
| scripts/addReportContentGroup.ts | groups:add-report-content |
| scripts/addViewSlugToPartners.ts | migrate:partner-viewslug |
| scripts/addVisitorKYCVariables.js | seed:visitor-kyc |
| scripts/aggregateAnalytics.ts | analytics:aggregate |
| scripts/alignClickerManagerToKyc.ts | align:clicker |
| scripts/assignDefaultPartnerToOrphanedEvents.ts | migrate:assign-default-partner |
| scripts/audit-chart-variables.ts | chart:audit-variables |
| scripts/audit-report-variant-periods.ts | audit:report-variant-periods |
| scripts/audit-styles.js | style:audit |
| scripts/auditDatabaseCollections.ts | audit:database |
| scripts/auditPartnerReportLogs.mjs | ops:partner-report:logs, ops:partner-report:logs:fail |
| scripts/backfillClickerSets.ts | backfill:clicker-sets |
| scripts/backfillPartnerAnalytics.ts | analytics:backfill-partners |
| scripts/backupDatabase.ts | db:backup |
| scripts/check-design-violations.js | style:check |
| scripts/check-google-sheets-schema.ts | check:google-sheets-schema |
| scripts/check-users-password-hash.ts | security:check-users-password-hash |
| scripts/checkChartIcons.ts | chart:check-icons |
| scripts/cleanup-report-kyc-variables.ts | content:cleanup-kyc |
| scripts/cleanupEmptyCollections.ts | db:cleanup-empty |
| scripts/cleanupOldStyleSystem.ts | cleanup:old-styles |
| scripts/consolidateBitlyJunctions.ts | db:consolidate-bitly |
| scripts/consolidateVariablesConfig.ts | db:consolidate-variables |
| scripts/createMissingIndexes.ts | db:create-indexes |
| scripts/createPartnerSheets.ts | sheets:create-partner-sheets |
| scripts/diagnose-clicker.ts | diagnose:clicker |
| scripts/diagnose-report-templates.ts | diagnose:reports |
| scripts/docs-consistency-audit.js | docs:audit |
| scripts/docs_link_check.py | docs:audit |
| scripts/enableManualModeForAllVariables.ts | fix:enable-manual-mode |
| scripts/enrich-partners-daily.ts | api-football:enrich-daily |
| scripts/enrich-project-bitly-metrics.ts | bitly:enrich-projects |
| scripts/ensureSuperadmin.ts | seed:superadmin |
| scripts/exportPartners.ts | export:partners |
| scripts/fix-chart-formulas.ts | fix:chart-formulas |
| scripts/fix-clicker-groups-prefix.ts | fix:clicker-groups |
| scripts/fix-report-config-warnings.ts | fix:report-warnings |
| scripts/fixInvalidIcons.ts | chart:fix-icons |
| scripts/fixOrphanedStyleReferences.ts | db:fix-orphaned-styles |
| scripts/fleet-audit-inventory.py | inventory:check |
| scripts/gds-sync-packages.sh | gds:sync |
| scripts/generate-variables-inventory.ts | variables:inventory |
| scripts/generatePartnerReportPasswords.ts | generate:partner-passwords |
| scripts/importPartners.ts | import:partners |
| scripts/migrate-chart-formulas.js | migrate:chart-formulas |
| scripts/migrate-layout-grammar.ts | migrate:layout-grammar |
| scripts/migrate-notifications-schema.ts | migrate:notifications |
| scripts/migrate-stats-v2.13.0.js | migrate-stats-v2.13.0 |
| scripts/migrate-to-remoteFans.js | migrate:remoteFans |
| scripts/migrate-users-to-password-hash.ts | security:migrate-users-to-password-hash |
| scripts/migrateChartFormattingCleanup.ts | migrate:chart-formatting-cleanup |
| scripts/migrateChartFormulasToLowercase.ts | migrate:chart-lowercase |
| scripts/migrateChartsToNewFormatting.ts | migrate:charts-formatting |
| scripts/migrateEmojiToIcon.ts | migrate:emoji-to-icon |
| scripts/migrateExistingChartsFormatting.ts | migrate:existing-charts-formatting |
| scripts/migrateGlobalVisualizationToWUKF.ts | migrate:viz-to-wukf |
| scripts/migratePartnerSlugsToUUID.ts | migrate:partner-slugs |
| scripts/migrateShowTitleField.ts | migrate:show-title |
| scripts/migrateStyleIdToEnhanced.ts | migrate:style-fields |
| scripts/migrateToAbsoluteDbPaths.ts | migrate:absolute-paths |
| scripts/migrateToReportTemplates.ts | migrate:report-templates |
| scripts/migrateUserRoles.ts | migrate:user-roles |
| scripts/migrations/addApiFieldsToUsers.ts | migrate:api-fields |
| scripts/renameCollections.ts | db:rename-collections |
| scripts/restore-missing-blocks.ts | fix:missing-blocks |
| scripts/restoreDatabase.ts | db:restore |
| scripts/search-partner-in-api-football.ts | api-football:search |
| scripts/seed-additional-report-variables.ts | content:seed-additional |
| scripts/seed-default-charts.js | seed:charts |
| scripts/seed-legacy-report-variables.ts | content:seed-legacy |
| scripts/seed-messmass-landing.ts | seed:messmass-landing |
| scripts/seedChartFormattingDefaults.ts | seed:formatting-defaults |
| scripts/seedFanmassStatusVariable.ts | seed:fanmass-status |
| scripts/seedPageStyles.ts | seed:page-styles |
| scripts/seedValueChartTemplates.ts | seed:value-charts |
| scripts/seedVariableGroups.ts | seed:groups |
| scripts/setup-content-assets-indexes.ts | content:setup-indexes |
| scripts/setupAnalyticsIndexes.ts | analytics:setup-indexes |
| scripts/setupFootballDataIndexes.ts | football-data:setup-indexes |
| scripts/setupSzerencsejatek.ts | sheets:setup-szerencsejatok |
| scripts/sync-content-assets-to-kyc.ts | content:sync-to-kyc |
| scripts/syncFootballDataFixtures.ts | football-data:sync |
| scripts/test-api-football.ts | api-football:test |
| scripts/test-email-notifications.ts | test:email |
| scripts/test-google-sheets.ts | test:google-sheets |
| scripts/update-version.js | version:update, version:verify |
| scripts/validate-input-patterns.sh | validate:inputs |
| scripts/validateDataQuality.ts | data:audit, data:audit:verbose, data:fix, data:fix:verbose |
| scripts/verify-fanmass-integration-contracts.ts | test:fanmass |
| scripts/verify-production-flags.ts | security:verify-production-flags |

Four `package.json` entries point at scripts that were already missing
before this prune and were not touched by it: `analytics:backfill`
(`scripts/backfillAnalytics.ts`), `migrate-hashtags`
(`scripts/migrate-hashtags.js`), `migrate:reports-v12`
(`scripts/migrate-to-reports-v12.ts`), `seed:variables`
(`scripts/seedVariablesFromRegistry.ts`).

### CI and issue templates (2)

| script | referenced from |
|---|---|
| scripts/check-dependency-guardrail.ts | .github/workflows/ci.yml |
| scripts/check-layout-grammar-guardrail.ts | .github/workflows/ci.yml |

`scripts/fleet-audit-inventory.py` is also cited by
`.github/ISSUE_TEMPLATE/fleet-reaudit.md`; it is listed above under its
`inventory:check` npm alias.

### Code import (1)

| script | referenced from |
|---|---|
| scripts/lib/docs-version-check.js | scripts/docs-consistency-audit.js, tests/docs-version-check.test.ts |

### Root-level docs (3)

| script | referenced from |
|---|---|
| scripts/v3/bootstrap-org.ts | AGENTS.md |
| scripts/v3/test-permissions.ts | AGENTS.md |
| scripts/verify-v3-middleware.ts | AGENTS.md |

### Operational doc path (9)

| script | referenced from |
|---|---|
| scripts/audit-kyc-data-completeness.ts | docs/root-structure.md |
| scripts/config.js | docs/root-structure.md |
| scripts/docs_inventory.py | docs/documentation-governance.md |
| scripts/docs_canonical_map.py | docs/documentation-governance.md |
| scripts/docs_triage.py | docs/documentation-governance.md |
| scripts/seed-available-fonts.ts | docs/design/design-font-management-system.md |
| scripts/v3/migrate-v2-v3.ts | docs/V3/messmass_v3_migration_playbook.md |
| scripts/simulate-partner-chart-calc.js | docs/operations/sec-02-code-injection-audit.md |
| scripts/test-full-partner-report.js | docs/operations/sec-02-code-injection-audit.md |

### Promoted during the spot-check (1)

| script | referenced from |
|---|---|
| scripts/sync-bitly-to-project-stats.ts | operator action printed by scripts/audit-kyc-data-completeness.ts |

## Adding a script later

Wire it into `package.json` or cite it by path from a current doc in the
same change. A script that only appears in release notes or an audit is,
by this rule, a delete candidate at the next prune.
