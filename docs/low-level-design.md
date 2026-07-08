# {messmass} Low-Level Design
Status: Active
Last Updated: 2026-06-25T00:00:00.000Z
Canonical: No
Owner: Architecture

Version: 12.1.26

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
3. Time Period selects inside the modal render through a portal with a modal-safe z-index so dropdown options appear above the modal overlay and do not trigger close behavior.
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
- Modal select dropdowns must not render behind the dialog or trigger modal outside-click behavior.

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

## Unified Admin Entity Forms

### Scope
- Contract: `lib/adminEntitySystem.ts`
- Renderer: `components/admin/EntityFormModal.tsx`
- First migrated surface: `app/admin/organizations/page.tsx`
- Entity config: `lib/adapters/organizationsAdapter.tsx`

### Runtime Flow
1. Entity config declares a `forms` schema with field keys, labels, types, options, and submit copy.
2. Page state owns the current form values and mutation lifecycle.
3. `EntityFormModal` renders the schema through Mantine controls inside the shared `FormModal`.
4. Submit delegates to the page-owned API call.
5. Success closes the modal and reloads the entity list.
6. Errors remain page-owned so each entity can recover with domain-specific messaging.

### Supported Fields
- `text`: Mantine `TextInput`
- `select`: Mantine `Select` with portal/z-index contract
- `checkbox`: Mantine `Checkbox`
- `readonly`: disabled/read-only Mantine `TextInput`

### Rollback
- Revert the delivery commit to return organization create/edit to page-local JSX.
- No database migration is required.

## Public Report Shell

### Scope
- `components/reports/PublicReportShell.tsx`
- `app/partner-report/PartnerReportView.tsx`
- `app/organization-report/OrganizationReportView.tsx`

### Runtime Flow
1. Public report route resolves partner/organization id and optional `variant`.
2. Existing data hooks and report runtime calculations remain unchanged.
3. Loading, empty, and error states render through `PublicReportState`.
4. Successful reports render inside `PublicReportShell`, then delegate unchanged hero/content/list rendering to the existing report runtime.

### Compatibility Rules
- Do not change `/partner-report/[slug]`, `/organization-report/[id]`, or `?variant=` semantics.
- Do not replace chart/export engines as part of shell migration.
- Keep report hero/content runtime compatible with existing templates.

### Enforcement
- `npm run style:check` blocks `styles.page`, `styles.container`, `styles.loading`, and `styles.error` reintroduction in migrated public report views.
