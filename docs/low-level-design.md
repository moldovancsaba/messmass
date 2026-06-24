# {messmass} Low-Level Design
Status: Active
Last Updated: 2026-06-24T13:15:00.000Z
Canonical: No
Owner: Architecture

Version: 12.1.13

This document captures implementation-level contracts for recently changed high-risk flows. It complements `docs/architecture.md`; it does not replace feature specs or API references.

## Report Variant Period Selector

### Scope
- Organization report variants: `app/admin/organizations/[id]/reports/page.tsx`
- Partner report variants: `app/admin/partners/[id]/reports/page.tsx`
- API routes:
  - `app/api/report-variants/route.ts`
  - `app/api/report-variants/[id]/route.ts`
- Domain logic:
  - `lib/reportPeriodValidation.ts`
  - `lib/reportVariantFormValidation.ts`
  - `lib/reportVariantPeriodAudit.ts`
  - `lib/reportVariants.ts`

### Runtime Flow
1. User opens a report variant create modal.
2. The modal renders shared `UnifiedInputField` and `UnifiedSelectField` controls.
3. Time Period selects inside the modal pass `withinPortal={false}` so dropdown options remain inside the modal interaction tree.
4. Client-side form validation blocks submit for empty names, unsupported presets, missing custom dates, or reversed custom ranges.
5. API create/update routes call the report variant domain functions.
6. Domain functions normalize the period payload before writing.
7. Invalid period writes throw `ReportPeriodValidationError`.
8. API routes convert validation errors to HTTP 400 responses with stable `code` values.

### Data Contract

Allowed `periodPreset` values:
- `all_time`
- `this_month`
- `last_30_days`
- `this_year`
- `last_year`
- `custom`

Custom period shape:

```ts
{
  periodPreset: 'custom',
  customDateRange: {
    startDate: 'YYYY-MM-DD',
    endDate: 'YYYY-MM-DD'
  }
}
```

Non-custom period shape:

```ts
{
  periodPreset: 'this_year',
  customDateRange: null
}
```

### Validation Rules
- Missing preset defaults to `all_time`.
- Unsupported presets are rejected.
- Non-custom presets always clear `customDateRange`.
- Custom presets require both dates.
- Dates must round-trip as strict `YYYY-MM-DD`.
- `endDate` must be equal to or after `startDate`.
- Partial updates distinguish omitted fields from explicit `null`.

### Error Codes
- `PERIOD_PRESET_INVALID`
- `CUSTOM_PERIOD_DATES_REQUIRED`
- `CUSTOM_PERIOD_DATE_FORMAT_INVALID`
- `CUSTOM_PERIOD_RANGE_INVALID`

### Accessibility And UX States
- Field labels remain visible through shared field wrappers.
- Invalid fields expose Mantine error states.
- Submit is disabled while create-form validation errors exist.
- Date inputs use native date controls through `UnifiedInputField`.
- Modal select dropdowns must not trigger modal outside-click behavior.

### Operational Behavior
- Dry-run audit:

```bash
npm run audit:report-variant-periods
```

- Repair invalid custom records:

```bash
npx tsx -r dotenv/config scripts/audit-report-variant-periods.ts dotenv_config_path=.env.local --repair --strategy convert-to-all-time
```

Repair behavior:
- scans `report_variants` where `periodPreset` is `custom`
- converts invalid records to `periodPreset: all_time`
- sets `customDateRange: null`
- updates `updatedAt`
- does not delete variants

### Testing Contract
- `tests/report-period-validation.test.ts`
- `tests/report-variant-period-audit.test.ts`
- `tests/unified-select-field-contract.test.tsx`

Required validation commands before release:

```bash
npm run lint
npm run type-check
npm test -- --runInBand
npm run style:check
npm run gds:sync
npm run audit:report-variant-periods
MONGODB_URI='mongodb://127.0.0.1:27017/messmass-build-check' npm run build
```

### Rollback
- Revert the delivery commit to restore previous UI/API behavior.
- If repair mode was run, restore affected `report_variants` from backup or from dry-run evidence.
- No environment variable or schema migration is required.

## Mobile Admin Actions

### Contract
- Unified list/card surfaces should use `AdminActionRail`.
- Actions must expose labels, `ariaLabel` where needed, priority, disabled states, and safe mobile labels.
- Mobile portrait actions must remain visible and at least 44px tall.

### Current Coverage
- `components/admin/AdminActionRail.tsx`
- `components/UnifiedCardView.tsx`
- `components/UnifiedListView.tsx`
- `lib/adminDataAdapters.ts`
- `lib/adminEntitySystem.ts`

### Regression Tests
- `tests/admin-action-rail.test.tsx`
- `tests/mobile-admin-action-contract.test.ts`

## Comment Maintenance

Low-level code comments should describe invariants and edge cases that are not obvious from code structure. Do not add mechanical `WHAT` / `WHY` blocks for simple assignments, imports, or JSX.
