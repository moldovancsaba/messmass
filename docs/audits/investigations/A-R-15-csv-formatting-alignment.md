# A-R-15: CSV Export Formatting Alignment (Rendered vs Exported Values)

**Status:** INVESTIGATION COMPLETE  
**Priority:** Low  
**Category:** Reporting Correctness  
**Created:** 2026-01-13T15:14:00.000Z  
**Investigator:** Tribeca  
**Reference:** [ACTION_PLAN.md](../../ACTION_PLAN.md)

---

## Problem Statement

CSV exports currently output raw numeric values while the rendered report applies formatting (prefixes, suffixes, decimal places, thousands separators). This causes:
- **Client confusion** when CSV values don't match what they see in the report
- **Downstream analysis issues** when formatted values are expected
- **Inconsistent user experience** between rendered report and exported data

**Example:**
- Rendered report: "€1,234.56" or "50%"
- CSV export: "1234.56" or "50"

**Impact:**
- Medium - Affects user trust and downstream analysis workflows
- Low - Raw values may be preferred for some analysis scenarios

---

## Investigation Scope

**Focus Areas:**
1. Current CSV export formatting behavior
2. Rendered report formatting behavior
3. Value types that need formatting alignment
4. Exceptions where raw values should be preserved

**Excluded:**
- PDF export (out of scope)
- Admin UI changes
- Changes to formatting logic itself (only application to CSV)

---

## Current State Analysis

### CSV Export Formatting

**File:** `lib/export/csv.ts`

**Current Behavior:**
- KPI charts: Raw `kpiValue` exported (line 146)
- BAR/PIE charts: Raw `element.value` exported (line 155)
- No formatting applied (prefix, suffix, decimals, thousands separators)

**Code:**
```typescript
case 'kpi':
  rows.push(`${esc('Algorithm Results')},${esc(result.title)},${esc(result.kpiValue ?? 'N/A')}`);
  break;

case 'bar':
case 'pie':
  for (const element of result.elements) {
    rows.push(`${esc('Algorithm Results')},${esc(label)},${esc(element.value)}`);
  }
  break;
```

---

### Rendered Report Formatting

**File:** `app/report/[slug]/ReportChart.tsx`

**Formatting Function:**
```typescript
function formatValue(
  value: number | string | undefined, 
  formatting?: { rounded?: boolean; prefix?: string; suffix?: string; decimals?: number }
): string {
  if (value === undefined || value === 'NA') return 'NA';
  if (typeof value === 'string') return value;
  
  let decimals = 0;
  if (formatting) {
    if (formatting.rounded !== undefined) {
      decimals = formatting.rounded ? 0 : 2;
    } else if (formatting.decimals !== undefined) {
      decimals = formatting.decimals;
    }
  }
  
  const { prefix = '', suffix = '' } = formatting || {};
  const formattedNumber = value.toFixed(decimals);
  return `${prefix}${formattedNumber}${suffix}`;
}
```

**Applied To:**
- KPI charts: `formatValue(result.kpiValue, result.formatting)`
- BAR charts: Element values formatted in display
- PIE charts: Percentages formatted in legend

**Formatting Properties:**
- `rounded`: true = 0 decimals, false = 2 decimals
- `prefix`: e.g., "€", "$", "£"
- `suffix`: e.g., "%", " pts"
- `decimals`: Legacy support (deprecated)

---

### ChartResult Structure

**File:** `lib/report-calculator.ts`

**Interface:**
```typescript
export interface ChartResult {
  chartId: string;
  type: Chart['type'];
  title: string;
  kpiValue?: number | string;
  elements?: Array<{
    label: string;
    value: number | string;
    color?: string;
  }>;
  formatting?: Chart['formatting'];
  // ...
}
```

**Formatting Available:**
- `result.formatting` contains `{ rounded?: boolean; prefix?: string; suffix?: string; decimals?: number }`
- Available for both KPI and element values

---

## Formatting Alignment Requirements

### Value Types to Format

**1. KPI Chart Values**
- **Current:** Raw numeric value
- **Target:** Formatted with prefix/suffix/decimals matching rendered report
- **Example:** `1234.56` → `€1,234.56` or `50` → `50%`

**2. BAR Chart Element Values**
- **Current:** Raw numeric value
- **Target:** Formatted with prefix/suffix/decimals matching rendered report
- **Example:** `100` → `100%` or `1234.56` → `€1,234.56`

**3. PIE Chart Element Values**
- **Current:** Raw numeric value
- **Target:** Formatted with prefix/suffix/decimals matching rendered report
- **Note:** Percentages in legend are calculated separately, but raw values should match formatting

---

### Exceptions (Raw Values Preserved)

**1. Raw Stats Section**
- **Rationale:** Raw clicker data should remain unformatted for analysis
- **Location:** "Clicker Data" section in CSV
- **Action:** No change (already raw)

**2. Report Content Section**
- **Rationale:** Text and image URLs should remain as-is
- **Location:** "Report Content" section in CSV
- **Action:** No change (already strings/URLs)

**3. Metadata Section**
- **Rationale:** Event name, date, IDs should remain as-is
- **Location:** "Metadata" section in CSV
- **Action:** No change (already strings/dates)

---

## Implementation Plan

### Phase 1: Extract Formatting Utility

**Approach:** Create shared formatting function for CSV export

**Implementation:**
- Extract `formatValue` logic to shared utility or reuse from ReportChart
- Handle NA values, string values, and numeric formatting
- Support both new (`rounded`) and legacy (`decimals`) formatting

**File:** `lib/export/csv.ts` (add formatting function)

---

### Phase 2: Apply Formatting to CSV Export

**Approach:** Apply formatting to chart result values in CSV export

**Changes:**
1. KPI charts: Format `result.kpiValue` using `result.formatting`
2. BAR charts: Format `element.value` using `result.formatting`
3. PIE charts: Format `element.value` using `result.formatting`

**File:** `lib/export/csv.ts` (modify export logic)

---

### Phase 3: Testing

**Approach:** Add regression tests for CSV formatting

**Test Cases:**
1. KPI chart with currency formatting (€ prefix, 2 decimals)
2. KPI chart with percentage formatting (% suffix, 0 decimals)
3. BAR chart with rounded values (0 decimals)
4. BAR chart with decimal values (2 decimals)
5. PIE chart with percentage formatting
6. Charts with NA values (should remain "NA")
7. Charts without formatting (should use defaults)

**File:** `__tests__/export-csv-formatting.test.ts` (new)

---

## Decision: Thousands Separators

**Question:** Should CSV include thousands separators (e.g., "1,234.56")?

**Analysis:**
- Rendered report: Uses `toLocaleString()` for thousands separators in some contexts
- CSV format: Thousands separators can cause parsing issues in Excel/Google Sheets
- Current `formatValue()`: Uses `toFixed()` (no thousands separators)

**Decision:** **NO thousands separators in CSV**
- **Rationale:** CSV should be easily parseable by analysis tools
- **Trade-off:** Slightly less readable, but more compatible
- **Note:** This matches current `formatValue()` behavior (uses `toFixed()`, not `toLocaleString()`)

---

## Conclusion

**Investigation Complete:** CSV export formatting gap identified. Rendered reports apply formatting (prefix, suffix, decimals) but CSV exports raw values.

**Key Findings:**
- ✅ Formatting information available in `ChartResult.formatting`
- ✅ Formatting function exists in `ReportChart.tsx`
- ❌ CSV export doesn't apply formatting
- ❌ No shared formatting utility for CSV

**Recommendation:** ✅ **GO for Implementation** - Apply formatting to chart values in CSV export, preserve raw values for stats/metadata sections.

**Priority:**
1. **High:** KPI chart values (most visible)
2. **Medium:** BAR/PIE element values
3. **Low:** Thousands separators (deferred, not needed)

---

**Investigated By:** Tribeca  
**Date:** 2026-01-13T15:14:00.000Z  
**Status:** INVESTIGATION COMPLETE

---

## Phase 2: Implementation (2026-01-13T15:14:00.000Z)

**Status:** COMPLETE  
**Implemented By:** Tribeca

### Implementation Summary

**Implemented Improvements:**
1. ✅ **CSV Formatting Function** - Created `formatValueForCSV()` to apply formatting
2. ✅ **KPI Chart Formatting** - Applied formatting to KPI values in CSV export
3. ✅ **BAR/PIE Chart Formatting** - Applied formatting to element values in CSV export
4. ✅ **Raw Values Preserved** - Clicker data, metadata, and report content remain unformatted

### Code Changes

**1. CSV Formatting Function**
- **File:** `lib/export/csv.ts`
- **Function:** `formatValueForCSV()`
- **Purpose:** Format chart values for CSV export matching rendered report
- **Features:**
  - Supports `rounded` flag (0 or 2 decimals)
  - Supports `prefix` and `suffix` (€, $, %, etc.)
  - Supports legacy `decimals` field
  - Preserves NA and string values
  - Uses `toFixed()` (no thousands separators for CSV compatibility)

**2. KPI Chart Formatting**
- **File:** `lib/export/csv.ts`
- **Changes:**
  - Apply `formatValueForCSV()` to `result.kpiValue` before export
  - Format includes prefix, suffix, and decimal places from `result.formatting`

**3. BAR/PIE Chart Formatting**
- **File:** `lib/export/csv.ts`
- **Changes:**
  - Apply `formatValueForCSV()` to `element.value` before export
  - Format includes prefix, suffix, and decimal places from `result.formatting`

**4. Raw Values Preserved**
- **Sections Unchanged:**
  - Clicker Data: Raw numeric values (for analysis)
  - Metadata: Event name, date, IDs (as-is)
  - Report Content: Text and image URLs (as-is)

**5. Test Coverage**
- **File:** `__tests__/export-csv-formatting.test.ts` (new)
- **Coverage:**
  - KPI formatting (currency, percentage, rounded, legacy decimals, NA, defaults)
  - BAR formatting (percentage, currency, NA values)
  - PIE formatting (percentage, decimals)
  - Raw values preserved (Clicker Data, Metadata)
  - String values preserved

### Verification

**Before Implementation:**
- CSV KPI values: Raw numbers (e.g., "1234.56")
- CSV BAR/PIE values: Raw numbers (e.g., "50")
- Rendered report: Formatted values (e.g., "€1,234.56", "50%")
- **Mismatch:** CSV didn't match rendered report

**After Implementation:**
- ✅ CSV KPI values: Formatted (e.g., "€1234.56", "50%")
- ✅ CSV BAR/PIE values: Formatted (e.g., "50%", "€1234.56")
- ✅ Rendered report: Formatted values (e.g., "€1,234.56", "50%")
- ✅ **Alignment:** CSV matches rendered report formatting (except thousands separators)

### Formatting Decisions

**1. Thousands Separators**
- **Decision:** NO thousands separators in CSV
- **Rationale:** CSV should be easily parseable by analysis tools (Excel, Google Sheets)
- **Implementation:** Uses `toFixed()` instead of `toLocaleString()`
- **Note:** Rendered report may use thousands separators, but CSV uses plain numbers for compatibility

**2. Raw Values Exceptions**
- **Clicker Data:** Preserved as raw numbers (for analysis)
- **Metadata:** Preserved as strings/dates (no formatting needed)
- **Report Content:** Preserved as strings/URLs (no formatting needed)

**3. NA Values**
- **Decision:** Preserve "NA" as-is, don't apply formatting
- **Rationale:** NA indicates missing data, not a numeric value
- **Implementation:** Early return for "NA" values

**4. String Values**
- **Decision:** Preserve strings as-is, don't apply numeric formatting
- **Rationale:** Text/image URLs should not be formatted
- **Implementation:** Early return for string values

### Closure Evidence

**Commits:**
- `[commit hash]` - A-R-15: CSV Export Formatting Alignment - COMPLETE
- `[commit hash]` - ACTION_PLAN.md: Update STATE MEMORY - Tribeca A-R-15 DONE

**Files Modified:**
- `lib/export/csv.ts` (added formatting function and applied to chart values)
- `__tests__/export-csv-formatting.test.ts` (new - 15 test cases)
- `docs/audits/investigations/A-R-15-csv-formatting-alignment.md` (this file)
- `ACTION_PLAN.md`

**Status:** ✅ **IMPLEMENTATION COMPLETE**

**Implemented By:** Tribeca  
**Date:** 2026-01-13T15:14:00.000Z
