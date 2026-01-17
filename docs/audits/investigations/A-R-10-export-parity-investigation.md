# A-R-10: Export Format Consistency (CSV/PDF Parity vs Rendered Report)

**Status:** INVESTIGATION COMPLETE  
**Priority:** Low  
**Category:** Reporting Correctness  
**Created:** 2026-01-13T10:58:00.000Z  
**Investigator:** Tribeca  
**Reference:** [A-R-ROADMAP-PROPOSAL-2026-01-12.md](../reporting-roadmap/A-R-ROADMAP-PROPOSAL-2026-01-12.md)

---

## Problem Statement

Export formats (CSV, PDF) may not match the rendered report that users see:
- **Missing charts:** Exports may include/exclude charts differently than rendered report
- **Ordering mismatches:** Chart order may differ between exports and rendered report
- **Formatting/value rounding:** Export values may be formatted differently than rendered display
- **Hidden/conditional content:** Exports may include content not visible in rendered report
- **Pagination artifacts:** PDF pagination may split content differently than on-screen layout

**Impact:**
- Users may receive exports that don't match what they see on screen
- Export data may be incomplete or include unexpected content
- User trust in export accuracy is reduced

---

## Parity Contract Definition

### 1. Rendered Report (What User Sees)

**Source:** `app/report/[slug]/page.tsx`, `app/report/[slug]/ReportContent.tsx`

**Chart Selection:**
- Charts are filtered by `hasValidChartData()` (line 392-423 in `ReportContent.tsx`)
- Only charts with valid, displayable data are rendered
- Charts are sorted by `order` field from database (line 387: `sort((a, b) => a.order - b.order)`)

**Chart Ordering:**
- Blocks rendered in array order from `useReportLayout` hook
- Charts within blocks sorted by `order` field
- Rows within blocks: single row (all charts in one horizontal row)

**Content Visibility:**
- Empty charts (no data, errors) are filtered out and not rendered
- Charts with `error` property are not rendered
- Charts with empty values (`kpiValue === 'NA'`, `elements.length === 0`, `total === 0`) are not rendered

**Code Paths:**
- `app/report/[slug]/ReportContent.tsx:387` - Chart sorting by order
- `app/report/[slug]/ReportContent.tsx:392-423` - Chart filtering by `hasValidChartData()`
- `app/report/[slug]/ReportContent.tsx:24-52` - `hasValidChartData()` validation logic

---

### 2. CSV Export

**Source:** `lib/export/csv.ts`

**Chart Selection:**
- Uses `chartResults` Map directly (line 114: `chartResults.size > 0`)
- Includes ALL charts in `chartResults`, regardless of validity
- No filtering by `hasValidChartData()` - includes empty/error charts

**Chart Ordering:**
- Sorted by `chartId.localeCompare()` (line 116: `sort((a, b) => a.chartId.localeCompare(b.chartId))`)
- NOT sorted by `order` field - alphabetical by chartId instead

**Content Inclusion:**
- Includes metadata (event name, date, IDs)
- Includes all stats variables (raw clicker data)
- Includes all chart results (even invalid/empty ones)
- Includes report content (reportTextN, reportImageN variables)
- Skips VALUE type charts (line 147-150: composite type, rendered separately)

**Code Paths:**
- `lib/export/csv.ts:114-156` - Chart results export
- `lib/export/csv.ts:115-116` - Chart sorting (alphabetical by chartId)
- `lib/export/csv.ts:147-150` - VALUE type skip logic

---

### 3. PDF Export

**Source:** `lib/export/pdf.ts`

**Chart Selection:**
- Captures DOM elements with `data-pdf-block="true"` attribute (line 197)
- Only captures blocks that are rendered and visible in DOM
- Filters by DOM presence, not by `hasValidChartData()` logic

**Chart Ordering:**
- Preserves DOM order (blocks captured in querySelectorAll order)
- DOM order matches rendered order (blocks sorted by order field)

**Content Visibility:**
- Captures what's visible in DOM at export time
- Hides export buttons, status badges (lines 164-185)
- Forces 1200px width for capture (line 211) - may show different layout than rendered
- May capture hidden/conditional content if visible in DOM

**Code Paths:**
- `lib/export/pdf.ts:197` - Block selection via `data-pdf-block="true"`
- `lib/export/pdf.ts:211` - Width forcing (1200px)
- `lib/export/pdf.ts:164-185` - Element hiding (buttons, badges)

---

## Mismatch Classes Identified

### Mismatch Class 1: Missing Charts in Export vs Rendered

**Severity:** Medium  
**Impact:** CSV export includes charts not visible in rendered report

**Evidence:**
- **Rendered Report:** Filters charts by `hasValidChartData()` - excludes empty/error charts
- **CSV Export:** Includes ALL charts from `chartResults` Map - no filtering
- **PDF Export:** Captures only rendered DOM elements - matches rendered report

**Code References:**
- Rendered: `app/report/[slug]/ReportContent.tsx:392-423` - `hasValidChartData()` filtering
- CSV: `lib/export/csv.ts:114-156` - No filtering, includes all chartResults
- PDF: `lib/export/pdf.ts:197` - DOM-based capture (matches rendered)

**Example Scenario:**
- Chart with `error` property exists in `chartResults` Map
- Rendered report: Chart is filtered out (not displayed)
- CSV export: Chart is included with error value
- PDF export: Chart is not included (not in DOM)

**Impact:** CSV export may include charts that users don't see in rendered report, causing confusion.

---

### Mismatch Class 2: Ordering Mismatches

**Severity:** Medium  
**Impact:** CSV export uses different ordering than rendered report

**Evidence:**
- **Rendered Report:** Charts sorted by `order` field (line 387: `sort((a, b) => a.order - b.order)`)
- **CSV Export:** Charts sorted by `chartId.localeCompare()` (line 116: alphabetical)
- **PDF Export:** Preserves DOM order (matches rendered report)

**Code References:**
- Rendered: `app/report/[slug]/ReportContent.tsx:387` - Sort by order field
- CSV: `lib/export/csv.ts:115-116` - Sort by chartId (alphabetical)
- PDF: `lib/export/pdf.ts:197` - DOM order (matches rendered)

**Example Scenario:**
- Chart A: `chartId: "chart-z"`, `order: 1`
- Chart B: `chartId: "chart-a"`, `order: 2`
- Rendered report: Chart A first (order: 1), Chart B second (order: 2)
- CSV export: Chart B first (alphabetical: "chart-a"), Chart A second (alphabetical: "chart-z")
- PDF export: Chart A first, Chart B second (matches rendered)

**Impact:** CSV export order differs from rendered report, making it harder to correlate exported data with on-screen content.

---

### Mismatch Class 3: Formatting/Value Rounding Mismatches

**Severity:** Low  
**Impact:** Export values may be formatted differently than rendered display

**Evidence:**
- **Rendered Report:** Uses `formatValue()` function with `formatting.rounded` flag (line 35-60 in `ReportChart.tsx`)
- **CSV Export:** Uses `esc()` function - simple string conversion, no formatting (line 64-67 in `csv.ts`)
- **PDF Export:** Captures rendered display (matches rendered report)

**Code References:**
- Rendered: `app/report/[slug]/ReportChart.tsx:35-60` - `formatValue()` with rounding
- CSV: `lib/export/csv.ts:64-67` - `esc()` - simple string conversion
- PDF: Captures rendered display (matches rendered)

**Example Scenario:**
- Chart value: `123.456`
- Formatting: `rounded: false` (2 decimals)
- Rendered report: `"123.46"` (formatted with 2 decimals)
- CSV export: `"123.456"` (raw value, no formatting)
- PDF export: `"123.46"` (matches rendered)

**Impact:** CSV export may show raw values instead of formatted display values, causing minor confusion.

---

### Mismatch Class 4: Hidden/Conditional Content Mismatches

**Severity:** Low  
**Impact:** CSV export includes data not visible in rendered report

**Evidence:**
- **Rendered Report:** Only displays charts with valid data (filtered by `hasValidChartData()`)
- **CSV Export:** Includes all stats variables (raw clicker data) - may include data not used in charts
- **PDF Export:** Captures only visible DOM content (matches rendered report)

**Code References:**
- Rendered: `app/report/[slug]/ReportContent.tsx:392-423` - Chart filtering
- CSV: `lib/export/csv.ts:94-109` - All stats variables included
- PDF: `lib/export/pdf.ts:197` - DOM-based capture

**Example Scenario:**
- Stats variable `customMetric` exists in stats object
- No chart uses `customMetric` in rendered report
- CSV export: `customMetric` included in "Clicker Data" section
- PDF export: `customMetric` not included (not in rendered DOM)

**Impact:** CSV export may include raw data not visible in rendered report, which may be intentional (comprehensive export) or confusing (unexpected data).

---

### Mismatch Class 5: Pagination Artifacts (PDF)

**Severity:** Low  
**Impact:** PDF pagination may split content differently than on-screen layout

**Evidence:**
- **Rendered Report:** Responsive layout, blocks flow naturally
- **PDF Export:** Forces 1200px width (line 211), paginates blocks across pages (lines 329-444)
- **PDF Export:** Hero repeated on every page (lines 189-192, 323-325)

**Code References:**
- Rendered: `app/report/[slug]/ReportContent.tsx` - Responsive layout
- PDF: `lib/export/pdf.ts:211` - Width forcing (1200px)
- PDF: `lib/export/pdf.ts:329-444` - Pagination logic

**Example Scenario:**
- Block A and Block B fit on one screen in rendered report
- PDF export: Block A on page 1, Block B on page 2 (due to pagination)
- PDF export: Hero appears on both pages (repeated)

**Impact:** PDF pagination may split content across pages differently than on-screen layout, but this is expected behavior for PDF format.

---

### Mismatch Class 6: VALUE Type Chart Handling

**Severity:** Low  
**Impact:** CSV export skips VALUE type charts, rendered report shows them

**Evidence:**
- **Rendered Report:** VALUE type charts render their components separately (KPI + BAR)
- **CSV Export:** Skips VALUE type charts (line 147-150: "VALUE type is composite, skip to avoid duplication")
- **PDF Export:** Captures rendered components (matches rendered report)

**Code References:**
- Rendered: VALUE type renders as separate KPI + BAR components
- CSV: `lib/export/csv.ts:147-150` - VALUE type skip logic
- PDF: Captures rendered components (matches rendered)

**Example Scenario:**
- VALUE type chart exists in `chartResults`
- Rendered report: Shows KPI + BAR components separately
- CSV export: Chart skipped (not included)
- PDF export: Shows KPI + BAR components (matches rendered)

**Impact:** CSV export may miss VALUE type charts entirely, but this may be intentional (to avoid duplication).

---

## Summary of Mismatch Classes

| Mismatch Class | Severity | CSV Mismatch | PDF Mismatch | Impact |
|----------------|----------|--------------|--------------|--------|
| Missing Charts | Medium | ✅ Yes (includes invalid charts) | ❌ No (matches rendered) | CSV includes charts not visible |
| Ordering | Medium | ✅ Yes (alphabetical vs order field) | ❌ No (matches rendered) | CSV order differs from rendered |
| Formatting/Rounding | Low | ✅ Yes (raw values vs formatted) | ❌ No (matches rendered) | CSV shows raw values |
| Hidden/Conditional Content | Low | ✅ Yes (all stats vs visible only) | ❌ No (matches rendered) | CSV includes extra data |
| Pagination Artifacts | Low | N/A | ⚠️ Expected (PDF format) | PDF pagination differs |
| VALUE Type Handling | Low | ✅ Yes (skipped vs rendered) | ❌ No (matches rendered) | CSV skips VALUE charts |

---

## GO / NO-GO Recommendation

**Recommendation:** ✅ **GO for Remediation (Medium Priority)**

**Rationale:**
1. **Medium Severity Issues:** Two medium-severity mismatches (missing charts, ordering) affect CSV export accuracy
2. **User Impact:** CSV export order and content don't match rendered report, causing confusion
3. **Foundation Exists:** A-R-07 provides `validateChartResultCoverage()` as starting hook
4. **Scope is Clear:** Remediation can focus on CSV export alignment (PDF already matches rendered)

**Remediation Scope (Recommended):**
1. **CSV Chart Filtering:** Filter charts by `hasValidChartData()` before export (align with rendered report)
2. **CSV Chart Ordering:** Sort charts by `order` field instead of `chartId` (align with rendered report)
3. **CSV VALUE Type Handling:** Include VALUE type charts or document skip reason (clarify intent)
4. **CSV Formatting:** Apply `formatValue()` formatting to exported values (align with rendered display)

**Out of Scope (Not Recommended):**
- PDF pagination changes (expected PDF format behavior)
- CSV stats inclusion changes (comprehensive export may be intentional)
- PDF layout forcing changes (1200px width is intentional for desktop layout)

---

## Remediation Options

### Option 1: CSV Chart Filtering Alignment
**Approach:** Filter CSV export charts by `hasValidChartData()` before export
**Cost:** Low (code changes in `lib/export/csv.ts`)
**Benefit:** CSV export matches rendered report (excludes invalid charts)
**Recommendation:** ✅ Recommended

### Option 2: CSV Chart Ordering Alignment
**Approach:** Sort CSV export charts by `order` field instead of `chartId`
**Cost:** Low (code changes in `lib/export/csv.ts`)
**Benefit:** CSV export order matches rendered report
**Recommendation:** ✅ Recommended

### Option 3: CSV Formatting Alignment
**Approach:** Apply `formatValue()` formatting to CSV exported values
**Cost:** Medium (requires formatting logic in CSV export)
**Benefit:** CSV export values match rendered display
**Recommendation:** ⚠️ Optional (raw values may be preferred for CSV analysis)

### Option 4: CSV VALUE Type Handling
**Approach:** Include VALUE type charts in CSV export or document skip reason
**Cost:** Low (code changes or documentation)
**Benefit:** Clarifies VALUE type handling intent
**Recommendation:** ⚠️ Optional (skip may be intentional to avoid duplication)

---

## Conclusion

**Investigation Complete:** Export parity mismatches identified. CSV export has medium-severity mismatches (chart filtering, ordering) that should be remediated. PDF export already matches rendered report (DOM-based capture).

**Key Findings:**
- ✅ CSV export includes invalid charts not visible in rendered report
- ✅ CSV export uses alphabetical ordering instead of `order` field
- ⚠️ CSV export shows raw values instead of formatted display values
- ⚠️ CSV export includes all stats variables (may be intentional)
- ✅ PDF export matches rendered report (DOM-based capture)

**Recommendation:** ✅ **GO for Remediation** - Focus on CSV export alignment (chart filtering, ordering). PDF export is already aligned.

---

**Investigated By:** Tribeca  
**Date:** 2026-01-13T10:58:00.000Z  
**Status:** INVESTIGATION COMPLETE

---

## Phase 2: Remediation (2026-01-13T10:12:00.000Z)

**Status:** COMPLETE  
**Remediated By:** Tribeca

### Implementation Summary

**Remediated Mismatches:**
1. ✅ **CSV Chart Filtering Alignment** - Filter charts by `hasValidChartData()` before export
2. ✅ **CSV Chart Ordering Alignment** - Sort charts by `order` field instead of `chartId`
3. ✅ **VALUE Type Handling Documentation** - Documented skip rule in code comments

**Out of Scope (Not Remediated):**
- CSV Formatting Alignment (raw values preferred for CSV analysis)
- PDF export changes (already matches rendered report)

### Code Changes

**1. Shared Chart Validation Utility**
- **File:** `lib/export/chartValidation.ts` (new)
- **Purpose:** Extract `hasValidChartData()` from `ReportContent.tsx` for reuse
- **Impact:** Ensures CSV export uses same filtering logic as rendered report

**2. CSV Export Filtering**
- **File:** `lib/export/csv.ts`
- **Changes:**
  - Import `hasValidChartData` from `chartValidation.ts`
  - Filter `chartResults` by `hasValidChartData()` before processing
  - Only valid charts are included in CSV export (matches rendered report)

**3. CSV Export Ordering**
- **File:** `lib/export/csv.ts`
- **Changes:**
  - Add `chartOrderMap` parameter to `CSVExportOptions`
  - Sort charts by `order` field when `chartOrderMap` is provided
  - Fall back to alphabetical by `chartId` if order not available

**4. Export Hook Updates**
- **File:** `hooks/useReportExport.ts`
- **Changes:**
  - Add optional `charts` parameter to `UseReportExportOptions`
  - Build `chartOrderMap` from charts array if available
  - Pass `chartOrderMap` to `exportReportToCSV()`

**5. Page Component Updates**
- **Files:** `app/report/[slug]/page.tsx`, `app/partner-report/[slug]/page.tsx`
- **Changes:**
  - Pass `charts` array to `useReportExport()` hook
  - Extract `chartId` and `order` fields for order mapping

**6. VALUE Type Skip Documentation**
- **File:** `lib/export/csv.ts`
- **Changes:**
  - Enhanced code comments explaining VALUE type skip logic
  - Documents that VALUE charts are composite (KPI + BAR) and components are exported separately

### Test Coverage

**File:** `__tests__/export-parity.test.ts` (new)

**Test Suites:**
1. **hasValidChartData() filtering** - 11 test cases covering:
   - Error charts filtering
   - KPI charts with NA/undefined values
   - BAR/PIE charts with empty/zero elements
   - TEXT charts with empty/NA content
   - Valid chart inclusion

2. **CSV export ordering** - 3 test cases covering:
   - Order field sorting when order map provided
   - Fallback to alphabetical when order not available
   - Handling charts with same order

3. **VALUE type chart handling** - 1 test case confirming skip logic

### Verification

**Before Remediation:**
- CSV export included ALL charts from `chartResults` (including invalid/empty)
- CSV export sorted charts alphabetically by `chartId`
- No filtering logic aligned with rendered report

**After Remediation:**
- ✅ CSV export filters charts by `hasValidChartData()` (matches rendered report)
- ✅ CSV export sorts charts by `order` field (matches rendered report)
- ✅ VALUE type skip rule documented in code
- ✅ Regression tests added for filtering and ordering

### Closure Evidence

**Commits:**
- `1d70ce3e8` - A-R-10 Phase 2: CSV Export Parity Remediation - COMPLETE

**Files Modified:**
- `lib/export/chartValidation.ts` (new)
- `lib/export/csv.ts`
- `hooks/useReportExport.ts`
- `app/report/[slug]/page.tsx`
- `app/partner-report/[slug]/page.tsx`
- `__tests__/export-parity.test.ts` (new)
- `docs/audits/investigations/A-R-10-export-parity-investigation.md` (this file)
- `ACTION_PLAN.md`

**Status:** ✅ **REMEDIATION COMPLETE**

**Remediated By:** Tribeca  
**Date:** 2026-01-13T10:12:00.000Z
