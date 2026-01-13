# Reporting Release Candidate

**Release Candidate ID:** RC-2026-01-13  
**Based on:** A-R-07 through A-R-16  
**Status:** READY FOR RELEASE  
**Created:** 2026-01-13T15:30:30.000Z  
**Created By:** Tribeca

---

## Included Features and Fixes

### A-R-07: Export Correctness & Validation
**What's Included:**
- Pre-export validation for CSV and PDF exports
- Deterministic error handling for export failures
- Non-blocking warnings for export readiness issues
- Chart coverage validation

**Files Changed:**
- `lib/export/exportValidator.ts` (new)
- `hooks/useReportExport.ts`
- `__tests__/export-validation.test.ts` (new)

**Commit:** `03ae7a80a`

---

### A-R-08: Render Determinism Guarantees
**What's Included:**
- Investigation confirmed render determinism (no changes needed)
- Documentation of render order stability

**Files Changed:**
- `docs/audits/investigations/A-R-08-render-determinism.md` (new)

**Commit:** `4350215b5`

---

### A-R-10: Export Format Consistency (CSV/PDF Parity)
**What's Included:**
- CSV export filtering matches rendered report (`hasValidChartData()`)
- CSV export ordering matches rendered report (sorted by `order` field)
- Documented VALUE type skip rule

**Files Changed:**
- `lib/export/chartValidation.ts` (new - extracted shared validation)
- `lib/export/csv.ts`
- `hooks/useReportExport.ts`
- `__tests__/export-parity.test.ts` (new)

**Commits:** Phase 1 and Phase 2 completion commits

---

### A-R-11: Formula Calculation Error Handling & Recovery
**What's Included:**
- Structured error reporting (`ChartErrorType`, `ChartError`)
- Chart calculations return errors instead of `null`
- User-visible error placeholders in report UI
- Graceful degradation (one chart error doesn't break entire report)

**Files Changed:**
- `lib/chartErrorTypes.ts` (new)
- `lib/report-calculator.ts`
- `app/report/[slug]/ReportChart.tsx`
- `app/report/[slug]/ReportContent.tsx`
- `__tests__/formula-error-handling.test.ts` (new)

**Commit:** `a4c11e36c`

---

### A-R-12: Report Template Compatibility Validation
**What's Included:**
- Template compatibility validator
- Runtime validation of template compatibility with available data
- User-visible compatibility warnings in report UI

**Files Changed:**
- `lib/templateCompatibilityValidator.ts` (new)
- `app/report/[slug]/page.tsx`
- `__tests__/template-compatibility.test.ts` (new)

**Commit:** `8662f0bbf`

---

### A-R-13: Chart Data Validation & Error Boundaries
**What's Included:**
- Comprehensive chart data validation (structure, values, elements)
- React error boundaries around chart rendering
- Enhanced ReportChart to validate data before rendering

**Files Changed:**
- `lib/export/chartValidation.ts` (enhanced)
- `components/ChartErrorBoundary.tsx` (new)
- `app/report/[slug]/ReportChart.tsx`
- `app/report/[slug]/ReportContent.tsx`
- `__tests__/chart-data-validation.test.ts` (new)

**Commit:** `adcea2138`

---

### A-R-14: Reporting Docs Truth Sync
**What's Included:**
- ACTION_PLAN.md consistency fixes
- ROADMAP.md alignment with completed work

**Files Changed:**
- `ACTION_PLAN.md`
- `ROADMAP.md`

**Commit:** `7e58521fe`

---

### A-R-15: CSV Export Formatting Alignment
**What's Included:**
- CSV export applies formatting to chart values (prefix, suffix, decimals)
- Formatting matches rendered report (except thousands separators)
- Raw values preserved in Clicker Data, Metadata, Report Content sections

**Files Changed:**
- `lib/export/csv.ts`
- `__tests__/export-csv-formatting.test.ts` (new)

**Commit:** `def750c40`

---

### A-R-16: Reporting Release Verification Pack
**What's Included:**
- Verification pack documentation
- Manual smoke checklist (7 checklists)
- Evidence links to all investigation docs and test files

**Files Changed:**
- `docs/audits/investigations/A-R-16-reporting-release-verification-pack.md` (new)
- `ACTION_PLAN.md`

**Commits:** `8b0568a99`, `053cd04a3`, `09792a912`, `3a020628e`

---

## Preconditions

### Environment Requirements
- **Node.js:** Version 18+ (Next.js requirement)
- **Database:** MongoDB with Reporting collections (reports, templates, charts)
- **API:** All Reporting API routes functional (`/api/reports/**`)
- **Authentication:** Session-based auth for report access

### Data Assumptions
- **Report Templates:** Valid template configurations exist in database
- **Chart Configurations:** Chart configs exist and reference valid variables
- **Project/Partner Stats:** Stats data available for formula calculations
- **Event Data:** Event data available for report generation

### Dependencies
- **Layout Grammar:** Layout Grammar system must be functional (A-01 through A-06)
- **Formula Engine:** Formula evaluation engine must be functional
- **Export Infrastructure:** CSV/PDF export infrastructure must be functional

---

## Known Limitations

### Explicit Non-Goals
1. **PDF Export Formatting:** PDF export formatting unchanged (not in scope for A-R-15)
2. **Thousands Separators in CSV:** CSV does not include thousands separators (for compatibility with analysis tools)
3. **Error Recovery:** No automatic error recovery mechanism (errors require user/configurator intervention)
4. **Template Auto-Fix:** Template compatibility validation only warns, does not auto-fix incompatible templates
5. **Admin UI:** No Admin UI changes (Reporting system only)

### Behavioral Limitations
1. **VALUE Chart Type:** VALUE charts are skipped in CSV export (documented skip rule)
2. **Raw Values in Clicker Data:** Clicker Data section preserves raw values (intentional, for analysis)
3. **Validation Warnings:** Template compatibility warnings are non-blocking (warnings only)
4. **Error Boundaries:** Error boundaries catch rendering errors but do not recover automatically

### Test Coverage
- **Unit Tests:** 80+ test cases covering all areas
- **Manual Verification:** 7 smoke checklists in verification pack
- **Integration Tests:** Not included (manual verification required)

---

## Rollback Signals

### Critical Failures (STOP RELEASE)
1. **Report Rendering Crashes:**
   - White screen or error page when loading reports
   - Entire report fails to render (not just individual charts)
   - Browser console shows uncaught React errors

2. **Export Failures:**
   - CSV/PDF export button doesn't work
   - Export crashes application
   - Export produces corrupted files

3. **Data Loss:**
   - Reports fail to save
   - Chart configurations lost
   - Template data corrupted

4. **Authentication Issues:**
   - Reports inaccessible due to auth failures
   - Session management broken
   - Unauthorized access to reports

### Warning Signals (INVESTIGATE BEFORE RELEASE)
1. **Chart Calculation Errors:**
   - Multiple charts showing error placeholders (expected for invalid data, but investigate if widespread)
   - Error messages unclear or unhelpful

2. **Template Compatibility Warnings:**
   - Widespread template incompatibility warnings (may indicate data quality issues)

3. **CSV Formatting Mismatches:**
   - CSV values don't match rendered report (should be rare after A-R-15)

4. **Performance Degradation:**
   - Report rendering significantly slower than baseline
   - Memory leaks during report viewing
   - Export takes significantly longer than baseline

### Non-Blocking Issues (MONITOR POST-RELEASE)
1. **Individual Chart Errors:**
   - Single chart showing error placeholder (expected for invalid data)
   - Error boundaries catching rendering errors (expected behavior)

2. **Template Compatibility Warnings:**
   - Single template showing compatibility warning (expected for incompatible templates)

3. **CSV Formatting Edge Cases:**
   - Edge cases in CSV formatting (documented limitations)

---

## Release Checklist

### Pre-Release
- [ ] All unit tests pass (`npm test`)
- [ ] Manual smoke checklist completed (7 checklists from A-R-16)
- [ ] Verification pack reviewed
- [ ] All commits from A-R-07 through A-R-16 included
- [ ] No uncommitted changes in Reporting system files

### Release
- [ ] Deploy to staging environment
- [ ] Run manual smoke checklist on staging
- [ ] Verify no critical failures (see Rollback Signals)
- [ ] Verify no warning signals (investigate if present)
- [ ] Deploy to production

### Post-Release
- [ ] Monitor error logs for uncaught errors
- [ ] Monitor user feedback for issues
- [ ] Monitor export success rates
- [ ] Monitor report rendering performance

---

## Evidence Links

### Investigation Documents
- A-R-07: `docs/audits/investigations/A-R-07-export-correctness.md`
- A-R-08: `docs/audits/investigations/A-R-08-render-determinism.md`
- A-R-10: `docs/audits/investigations/A-R-10-export-parity-investigation.md`
- A-R-11: `docs/audits/investigations/A-R-11-formula-error-handling.md`
- A-R-12: `docs/audits/investigations/A-R-12-template-compatibility.md`
- A-R-13: `docs/audits/investigations/A-R-13-chart-data-validation.md`
- A-R-15: `docs/audits/investigations/A-R-15-csv-formatting-alignment.md`
- A-R-16: `docs/audits/investigations/A-R-16-reporting-release-verification-pack.md`

### Test Files
- `__tests__/export-validation.test.ts`
- `__tests__/export-parity.test.ts`
- `__tests__/formula-error-handling.test.ts`
- `__tests__/template-compatibility.test.ts`
- `__tests__/chart-data-validation.test.ts`
- `__tests__/export-csv-formatting.test.ts`

### Code Files
- `lib/export/exportValidator.ts`
- `lib/export/chartValidation.ts`
- `lib/chartErrorTypes.ts`
- `lib/templateCompatibilityValidator.ts`
- `components/ChartErrorBoundary.tsx`
- `lib/export/csv.ts`
- `lib/report-calculator.ts`
- `app/report/[slug]/ReportChart.tsx`
- `app/report/[slug]/ReportContent.tsx`
- `app/report/[slug]/page.tsx`

---

## Release Decision

**Status:** ✅ **READY FOR RELEASE**

**Rationale:**
- All A-R-07 through A-R-16 items completed
- Comprehensive test coverage (80+ test cases)
- Manual verification checklists available
- Known limitations documented
- Rollback signals defined

**Recommendation:**
Proceed with release after completing pre-release checklist and staging verification.

---

**Created By:** Tribeca  
**Date:** 2026-01-13T15:30:30.000Z  
**Status:** READY FOR RELEASE
