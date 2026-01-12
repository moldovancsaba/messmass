# Layout Grammar Migration Tool

**Version:** 1.0.0  
**Created:** 2026-01-12T01:32:00.000Z  
**Status:** Active  
**Owner:** Engineering

---

## Purpose

The Layout Grammar Migration Tool provides automated analysis and migration capabilities for legacy reports to ensure Layout Grammar compliance. It validates all report templates and data blocks, generates detailed validation reports, and can apply automated fixes where possible.

**Source:** A-02: Layout Grammar Migration Tooling (AUDIT_ACTION_PLAN.md)

---

## Features

- **Batch Analysis:** Validates all report templates and data blocks in the database
- **Validation Reports:** Generates detailed JSON reports documenting all violations
- **Dry-Run Mode:** Analyze without applying changes
- **Apply Mode:** Apply automated fixes (where possible)
- **Backup/Restore:** Create backups before migration, restore if needed
- **Reversible:** All migrations can be reversed using backup files

---

## Usage

### Analysis Only (Dry-Run)

Analyze all templates and blocks without making changes:

```bash
npm run migrate:layout-grammar -- --dry-run
```

This will:
- Connect to MongoDB
- Load all report templates and data blocks
- Validate each block for Layout Grammar compliance
- Generate a validation report (`layout-grammar-migration-report.json`)
- Display summary statistics

### Generate Report Only

Generate a validation report without any migration:

```bash
npm run migrate:layout-grammar -- --analyze --output=my-report.json
```

### Apply Fixes

Apply automated fixes (after reviewing the report):

```bash
npm run migrate:layout-grammar -- --apply
```

**Note:** This will:
- Create a backup (`layout-grammar-migration-backup.json`) before applying changes
- Apply automated fixes where possible
- Most violations require manual intervention

### Restore from Backup

Restore the database to a previous state:

```bash
npm run migrate:layout-grammar -- --restore=layout-grammar-migration-backup.json
```

---

## Validation Report Format

The validation report is a JSON file with the following structure:

```json
{
  "timestamp": "2026-01-12T01:32:00.000Z",
  "mode": "dry-run",
  "summary": {
    "totalTemplates": 10,
    "totalBlocks": 45,
    "templatesWithViolations": 3,
    "blocksWithViolations": 7,
    "totalViolations": 12
  },
  "templates": [
    {
      "templateId": "...",
      "templateName": "Event Report Template",
      "templateType": "event",
      "isDefault": true,
      "violations": 5,
      "blocks": [
        {
          "blockId": "...",
          "blockName": "Main Dashboard",
          "violations": 2,
          "validationResult": {
            "blockId": "...",
            "heightResolution": { ... },
            "elementValidations": [ ... ],
            "publishBlocked": true,
            "publishBlockReason": "Structural failure",
            "requiredActions": ["increaseHeight", "splitBlock"]
          }
        }
      ]
    }
  ],
  "errors": []
}
```

---

## Validation Rules

The tool validates blocks against Layout Grammar rules:

- **No Scrolling:** Blocks must not require scrolling
- **No Truncation:** Content must not be truncated
- **No Clipping:** Content must not be clipped
- **Deterministic Height:** Block heights must be explicitly calculated
- **Element Fit:** All chart elements must fit within allocated space

---

## Automated Fixes

**Current Status:** Automated fixes are limited. Most violations require manual intervention.

The tool currently:
- ✅ Identifies violations
- ✅ Generates detailed reports
- ✅ Provides actionable recommendations
- ⚠️ Limited automated fixes (most require manual changes)

**Future Enhancements:**
- Automatic height adjustments
- Block splitting for oversized content
- Content reflow suggestions

---

## Backup and Restore

### Creating Backups

Backups are automatically created when running with `--apply`:

- **Location:** `layout-grammar-migration-backup.json`
- **Contents:** All report templates and data blocks
- **Format:** JSON with timestamp

### Restoring from Backup

To restore the database to a previous state:

```bash
npm run migrate:layout-grammar -- --restore=path/to/backup.json
```

**Warning:** This will replace all current templates and blocks with the backup data.

---

## Requirements

- Node.js 18+
- MongoDB connection (MONGODB_URI in `.env.local`)
- Database access to `report_templates` and `data_blocks` collections
- Chart configurations loaded in `chart_configs` collection

---

## Troubleshooting

### Connection Errors

If you see MongoDB connection errors:
1. Verify `MONGODB_URI` is set in `.env.local`
2. Check network connectivity
3. Verify database name matches `MONGODB_DB` or default `messmass`

### Validation Errors

If validation fails for specific blocks:
1. Check the validation report for detailed error messages
2. Verify chart configurations exist for all referenced charts
3. Review block structure (charts array, width values, etc.)

### Missing Chart Configurations

If blocks reference charts that don't exist:
- The tool will log errors for missing charts
- These blocks will be skipped in validation
- Fix by ensuring all chart configurations are loaded

---

## Related Documentation

- `AUDIT_ACTION_PLAN.md` - A-02: Layout Grammar Migration Tooling
- `lib/editorValidationAPI.ts` - Validation API used by the tool
- `scripts/check-layout-grammar-guardrail.ts` - CSS pattern checker

---

**Last Updated:** 2026-01-12T01:32:00.000Z
