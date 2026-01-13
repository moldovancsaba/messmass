# A-R-07: Export Correctness & Validation

**Status:** EXECUTION-READY  
**Priority:** Medium  
**Category:** Reporting Correctness  
**Created:** 2026-01-12T10:50:00.000Z  
**Reference:** [A-R-ROADMAP-PROPOSAL-2026-01-12.md](../reporting-roadmap/A-R-ROADMAP-PROPOSAL-2026-01-12.md)

---

## Problem Statement

Export functionality (CSV, PDF) exists but has known issues:
- **Silent failures:** Export may fail silently when data isn't ready (no clear user feedback)
- **Missing validation:** No comprehensive validation for export readiness
- **Format inconsistencies:** Export output may not match rendered report
- **Data completeness:** No verification that exported data is complete and accurate

**Impact:**
- Users may receive incomplete or incorrect exports
- Export failures are not clearly communicated
- Export output may not match what users see in rendered report
- User trust in export functionality is reduced

---

## Current State Analysis

### Export Implementation

**CSV Export:**
- **File:** `lib/export/csv.ts`
- **Function:** `exportReportToCSV()`
- **Data Sources:**
  - Project metadata (event name, date, IDs)
  - Stats (raw clicker data)
  - Chart results (calculated chart values)
- **Current Validation:** Basic existence checks in `useReportExport.ts` hook

**PDF Export:**
- **File:** `lib/export/pdf.ts`
- **Function:** `exportReportToPDF()`
- **Data Sources:**
  - DOM elements (requires specific IDs)
  - Project metadata
  - Stats and chart results
- **Current Validation:** Basic existence checks in `useReportExport.ts` hook

**Export Hook:**
- **File:** `hooks/useReportExport.ts`
- **Current Validation:**
  - Checks entity, stats, chartResults existence
  - Shows alert if data missing
  - Logs to console

**Known Issues:**
1. **Silent Failures:** Export may fail if DOM elements aren't ready (PDF) or data structure is invalid
2. **Missing Data Validation:** No verification that chart results match rendered charts
3. **Format Inconsistencies:** CSV may include data not visible in rendered report
4. **No Completeness Checks:** No verification that all charts/data blocks are included in export

---

## Technical Design

### Phase 1: Export Validation Infrastructure

**New File:** `lib/export/exportValidator.ts`

**Functions:**
```typescript
/**
 * Validates export readiness for CSV export
 */
export function validateCSVExportReadiness(
  entity: ProjectMetadata | null,
  stats: ProjectStats | null,
  chartResults: Map<string, ChartResult> | null
): ExportValidationResult

/**
 * Validates export readiness for PDF export
 */
export function validatePDFExportReadiness(
  entity: ProjectMetadata | null,
  stats: ProjectStats | null,
  chartResults: Map<string, ChartResult> | null,
  domElements: { [key: string]: HTMLElement | null }
): ExportValidationResult

/**
 * Validates that exported data matches rendered report
 */
export function validateExportConsistency(
  renderedCharts: Set<string>,
  exportedCharts: Set<string>,
  renderedData: Map<string, any>,
  exportedData: Map<string, any>
): ExportConsistencyResult
```

**Validation Rules:**
1. **Data Readiness:**
   - Entity must exist and have required fields (name, date)
   - Stats must exist (can be empty object)
   - Chart results must exist (can be empty map)

2. **Data Completeness:**
   - All rendered charts must have corresponding chart results
   - All chart results must have valid data structure
   - All required metadata fields must be present

3. **Export Consistency:**
   - CSV must include all rendered charts
   - PDF must include all rendered charts
   - Export data must match rendered data (values, labels, structure)

4. **DOM Readiness (PDF only):**
   - Required DOM elements must exist
   - DOM elements must be visible (not hidden)
   - DOM elements must have content

### Phase 2: Enhanced Export Hook

**File:** `hooks/useReportExport.ts`

**Changes:**
- Import `validateCSVExportReadiness`, `validatePDFExportReadiness` from `lib/export/exportValidator.ts`
- Add validation before export execution
- Provide clear error messages for each validation failure
- Log validation results for debugging

**Error Messages:**
- "Export cannot proceed: [specific validation failure]"
- "Export data incomplete: [missing data details]"
- "Export format mismatch: [inconsistency details]"

### Phase 3: Export Consistency Verification

**New File:** `lib/export/exportConsistencyChecker.ts`

**Functions:**
```typescript
/**
 * Verifies CSV export matches rendered report
 */
export function verifyCSVConsistency(
  csvData: CSVData,
  renderedCharts: Set<string>,
  chartResults: Map<string, ChartResult>
): ConsistencyReport

/**
 * Verifies PDF export matches rendered report
 */
export function verifyPDFConsistency(
  pdfData: PDFData,
  renderedCharts: Set<string>,
  chartResults: Map<string, ChartResult>
): ConsistencyReport
```

**Verification Rules:**
1. **Chart Coverage:**
   - All rendered charts must be in export
   - Export must not include charts not in rendered report

2. **Data Accuracy:**
   - Export values must match rendered values
   - Export labels must match rendered labels
   - Export structure must match rendered structure

3. **Metadata Accuracy:**
   - Export metadata must match rendered metadata
   - Export timestamps must match rendered timestamps

### Phase 4: Export Error Handling

**Files:**
- `lib/export/csv.ts`
- `lib/export/pdf.ts`
- `hooks/useReportExport.ts`

**Changes:**
- Wrap export execution in try-catch
- Provide specific error messages for each failure mode
- Log detailed error context for debugging
- Show user-friendly error messages

**Error Categories:**
1. **Validation Errors:** Data not ready, validation failed
2. **Execution Errors:** Export function threw error
3. **Consistency Errors:** Export doesn't match rendered report
4. **DOM Errors (PDF):** Required DOM elements not found

---

## Execution Plan

### Step 1: Investigation & Documentation
- [ ] Document current export behavior
- [ ] Identify all failure modes
- [ ] Create test cases for export scenarios
- [ ] Document export validation requirements

### Step 2: Export Validation Infrastructure
- [ ] Create `lib/export/exportValidator.ts`
- [ ] Implement `validateCSVExportReadiness()`
- [ ] Implement `validatePDFExportReadiness()`
- [ ] Implement `validateExportConsistency()`
- [ ] Add unit tests for validation functions

### Step 3: Enhanced Export Hook
- [ ] Update `hooks/useReportExport.ts` with validation
- [ ] Add clear error messages
- [ ] Add validation logging
- [ ] Test export hook with various data states

### Step 4: Export Consistency Verification
- [ ] Create `lib/export/exportConsistencyChecker.ts`
- [ ] Implement `verifyCSVConsistency()`
- [ ] Implement `verifyPDFConsistency()`
- [ ] Add consistency checks to export flow

### Step 5: Error Handling & User Feedback
- [ ] Enhance error handling in `lib/export/csv.ts`
- [ ] Enhance error handling in `lib/export/pdf.ts`
- [ ] Add user-friendly error messages
- [ ] Add error logging for debugging

### Step 6: Testing & Verification
- [ ] Test export with missing data
- [ ] Test export with incomplete data
- [ ] Test export consistency verification
- [ ] Test error handling and user feedback
- [ ] Verify no regressions in existing export functionality

### Step 7: Documentation
- [ ] Document export validation rules
- [ ] Document export failure modes
- [ ] Document export consistency guarantees
- [ ] Update export usage documentation

---

## Done Criteria

- ✅ Export handlers validate data readiness before export
- ✅ Clear error messages when export cannot proceed
- ✅ Export output verified to match rendered report (CSV data matches chart results, PDF layout matches rendered layout)
- ✅ Export completeness checks (all charts, all data blocks included)
- ✅ Documentation of export validation rules and failure modes
- ✅ Test cases for export failure scenarios
- ✅ No regressions in existing export functionality

---

## Risk Assessment

**Low Risk:**
- Export validation is additive, doesn't change existing behavior
- Validation can be added incrementally
- Error handling improvements are non-breaking

**Medium Risk:**
- Export format changes may affect downstream consumers (if any)
- Consistency verification may reveal existing inconsistencies
- Validation may block exports that previously "worked" (but were incorrect)

**Mitigation:**
- Validation-only changes first, format consistency as separate phase
- Consistency verification is optional (can be disabled if needed)
- Clear error messages explain why export is blocked

---

## Files to Modify

**New Files:**
- `lib/export/exportValidator.ts` - Export validation utilities
- `lib/export/exportConsistencyChecker.ts` - Export consistency verification
- `docs/audits/investigations/A-R-07-export-correctness.md` - This document
- `__tests__/export-validation.test.ts` - Export validation test suite

**Modified Files:**
- `hooks/useReportExport.ts` - Add comprehensive validation
- `lib/export/csv.ts` - Enhance error handling
- `lib/export/pdf.ts` - Enhance error handling
- `app/report/[slug]/page.tsx` - Export readiness checks (if needed)

---

## References

- [Export Buttons Fix Documentation](../../fixes/EXPORT_BUTTONS_FIX.md)
- [useReportExport Hook](../../hooks/useReportExport.ts)
- [CSV Export Implementation](../../lib/export/csv.ts)
- [PDF Export Implementation](../../lib/export/pdf.ts)
- [A-R-ROADMAP-PROPOSAL-2026-01-12.md](../reporting-roadmap/A-R-ROADMAP-PROPOSAL-2026-01-12.md)

---

**Prepared By:** Tribeca  
**Date:** 2026-01-12T10:50:00.000Z  
**Status:** EXECUTION-READY
