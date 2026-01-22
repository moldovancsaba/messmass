# A-R-13: Chart Data Validation & Error Boundaries

**Status:** INVESTIGATION COMPLETE  
**Priority:** Low  
**Category:** Reporting Correctness  
**Created:** 2026-01-13T14:12:00.000Z  
**Investigator:** Tribeca  
**Reference:** [ACTION_PLAN.md](../../ACTION_PLAN.md)

---

## Problem Statement

Chart rendering may fail or display incorrectly when:
- **Chart result data is malformed** (missing required fields, type mismatches)
- **Chart result type doesn't match chart configuration type** (e.g., KPI config but PIE result)
- **Chart result has invalid values** (NaN, Infinity, negative values where not expected)
- **Chart result elements are missing or empty when required** (PIE/BAR charts need elements)
- **Rendering errors occur** (component crashes, undefined property access)

Current validation may not catch all cases, leading to:
- Charts rendering with incorrect data
- Charts failing silently without error indication
- Inconsistent error handling across chart types
- No validation that chart results match chart configuration
- React rendering errors breaking entire report

**Impact:**
- Users may see incorrect or broken charts
- Report rendering may crash due to unhandled errors
- Inconsistent error handling reduces user trust
- No validation that chart results match chart configuration

---

## Investigation Scope

**Focus Areas:**
1. Chart result structure validation (required fields, type correctness)
2. Chart result type vs configuration type validation
3. Value validation (NaN, Infinity, negative values)
4. Element structure validation (PIE/BAR charts)
5. React error boundaries for rendering failures

**Excluded:**
- Admin UI changes
- Changes to chart calculation logic (only validation)
- Template validation (A-R-12 covers this)

---

## Current Validation State

### 1. hasValidChartData() Validation

**Files:** `lib/export/chartValidation.ts`, `app/report/[slug]/ReportContent.tsx`

**Current Implementation:**
- Checks if result exists
- Checks for errors (`result.error` or `result.chartError`)
- Type-specific validation:
  - TEXT/IMAGE/TABLE: Non-empty string, not 'NA'
  - KPI: Not undefined, null, or 'NA'
  - PIE/BAR/VALUE: Elements exist and total > 0

**Code:**
```typescript
export function hasValidChartData(result: ChartResult | undefined): boolean {
  if (!result || result.error) return false;
  
  switch (result.type) {
    case 'text':
      return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
    // ... other types
  }
}
```

**Issues:**
- ✅ Basic validation exists
- ❌ Doesn't validate result structure (missing fields)
- ❌ Doesn't validate result type matches config type
- ❌ Doesn't validate value types (NaN, Infinity)
- ❌ Doesn't validate element structure (missing label, invalid value types)

---

### 2. ReportChart Error Handling

**File:** `app/report/[slug]/ReportChart.tsx`

**Current Implementation:**
- Checks for `result.chartError` or `result.error` (A-R-11)
- Displays error placeholder if error exists
- Validates `hasData` before rendering
- Returns `null` if no data (chart hidden)

**Code:**
```typescript
const hasError = !!(result.chartError || result.error);
if (hasError) {
  return <ErrorPlaceholder />;
}

const hasData = (() => {
  // Type-specific validation
})();

if (!hasData) {
  return null; // Chart hidden
}
```

**Issues:**
- ✅ Error handling exists (A-R-11)
- ❌ No React error boundary (rendering errors crash report)
- ❌ No validation of result structure
- ❌ No validation of value types (NaN, Infinity)

---

### 3. ReportCalculator.hasValidData()

**File:** `lib/report-calculator.ts`

**Current Implementation:**
- Static method to validate chart results
- Type-specific validation similar to `hasValidChartData()`
- Checks for errors before validation

**Issues:**
- ✅ Validation exists
- ❌ Doesn't validate result structure
- ❌ Doesn't validate value types

---

## Validation Rules Needed

### Rule 1: Chart Result Structure Validation

**Description:** Validate that chart result has all required fields for its type.

**Required Fields by Type:**
- **All types:** `chartId`, `type`, `title`
- **KPI/TEXT/IMAGE/TABLE:** `kpiValue`
- **PIE/BAR/VALUE:** `elements` (array)

**Invalid Cases:**
- Missing `chartId` or `type` or `title`
- KPI chart without `kpiValue`
- PIE/BAR chart without `elements` array

**Current Handling:**
- No explicit structure validation
- Missing fields may cause rendering errors

---

### Rule 2: Chart Result Type vs Configuration Type Validation

**Description:** Validate that chart result type matches chart configuration type.

**Invalid Cases:**
- Chart config type: `'kpi'`, result type: `'pie'`
- Chart config type: `'bar'`, result type: `'kpi'`

**Current Handling:**
- No type matching validation
- Type mismatch may cause rendering errors

**Impact:** Medium - Type mismatches are rare but can break rendering

---

### Rule 3: Value Type Validation

**Description:** Validate that values are valid (not NaN, Infinity, or unexpected types).

**Invalid Cases:**
- KPI `kpiValue` is `NaN` or `Infinity`
- Element `value` is `NaN` or `Infinity`
- Element `value` is negative when not expected (PIE charts should be >= 0)

**Current Handling:**
- No explicit NaN/Infinity validation
- Negative values allowed (may be intentional for some charts)

**Impact:** Low - NaN/Infinity are rare, but can break rendering

---

### Rule 4: Element Structure Validation

**Description:** Validate that PIE/BAR chart elements have required fields and valid values.

**Required Fields:**
- `label` (string)
- `value` (number or string, not NaN/Infinity)

**Invalid Cases:**
- Element missing `label`
- Element `value` is `NaN` or `Infinity`
- Element `value` is negative (for PIE charts)

**Current Handling:**
- Basic validation in `hasValidChartData()` (checks total > 0)
- No structure validation (missing label, invalid value types)

---

### Rule 5: React Error Boundaries

**Description:** Catch rendering errors to prevent entire report from crashing.

**Error Scenarios:**
- Undefined property access in chart component
- Type coercion errors
- Component render errors

**Current Handling:**
- No React error boundaries
- Rendering errors crash entire report

**Impact:** High - One chart error can break entire report

---

## Validation Gaps

### Gap 1: No Structure Validation

**Current State:**
- No validation that chart result has required fields
- Missing fields may cause rendering errors

**Impact:** Medium - Rendering errors from missing fields

**Recommendation:** Validate result structure before rendering

---

### Gap 2: No Type Matching Validation

**Current State:**
- No validation that result type matches config type
- Type mismatches may cause rendering errors

**Impact:** Low - Type mismatches are rare

**Recommendation:** Validate type match (optional, low priority)

---

### Gap 3: No Value Type Validation

**Current State:**
- No validation for NaN, Infinity, or invalid value types
- Invalid values may cause rendering errors

**Impact:** Low - Invalid values are rare

**Recommendation:** Validate value types (NaN, Infinity)

---

### Gap 4: No React Error Boundaries

**Current State:**
- No error boundaries around chart rendering
- Rendering errors crash entire report

**Impact:** High - One chart error breaks entire report

**Recommendation:** Add React error boundaries around chart components

---

## Recommended Validation Improvements

### Improvement 1: Comprehensive Chart Data Validator

**Approach:** Create validator that checks chart result structure, types, and values.

**Validation Functions:**
- `validateChartResultStructure()` - Check required fields exist
- `validateChartResultType()` - Check result type matches config type
- `validateChartResultValues()` - Check values are valid (not NaN/Infinity)
- `validateChartResultElements()` - Check element structure for PIE/BAR charts

**Implementation:**
- Enhance `lib/export/chartValidation.ts` or create new validator
- Reuse existing `hasValidChartData()` logic
- Add structure and value validation

---

### Improvement 2: React Error Boundaries

**Approach:** Add error boundaries around chart rendering to catch rendering errors.

**Implementation:**
- Create `ChartErrorBoundary` component
- Wrap `ReportChart` component with error boundary
- Display error placeholder on rendering errors
- Log errors for debugging

**UI Design:**
- Error boundary shows same error placeholder as calculation errors
- Error message: "Chart rendering failed"
- Prevents report crash, allows other charts to render

---

### Improvement 3: Enhanced ReportChart Validation

**Approach:** Validate chart result before rendering in `ReportChart` component.

**Implementation:**
- Validate result structure before rendering
- Validate value types (NaN, Infinity)
- Validate element structure for PIE/BAR charts
- Display validation errors in error placeholder

---

### Improvement 4: Value Type Validation

**Approach:** Validate that values are valid numbers (not NaN, Infinity).

**Implementation:**
- Check `kpiValue` is valid number (if number type)
- Check element `value` is valid number (if number type)
- Display error if invalid values found

---

## Implementation Plan

### Phase 1: Chart Data Validator

1. Enhance `lib/export/chartValidation.ts` with structure validation
2. Add `validateChartResultStructure()` function
3. Add `validateChartResultValues()` function
4. Add `validateChartResultElements()` function
5. Return structured validation result with issues list

### Phase 2: React Error Boundaries

1. Create `ChartErrorBoundary` component
2. Wrap `ReportChart` with error boundary
3. Display error placeholder on rendering errors
4. Log errors for debugging

### Phase 3: Enhanced ReportChart Validation

1. Validate result structure in `ReportChart` before rendering
2. Validate value types
3. Display validation errors in error placeholder
4. Ensure graceful degradation (other charts still render)

### Phase 4: Testing

1. Add test cases for invalid data scenarios
2. Test structure validation
3. Test value type validation
4. Test error boundary behavior
5. Test graceful degradation

---

## Conclusion

**Investigation Complete:** Chart data validation gaps identified. Current system has basic validation but lacks structure validation, value type validation, and React error boundaries. Rendering errors can crash entire report.

**Key Findings:**
- ✅ Basic validation exists (`hasValidChartData()`)
- ✅ Error handling exists (A-R-11)
- ❌ No structure validation (missing fields)
- ❌ No value type validation (NaN, Infinity)
- ❌ No React error boundaries (rendering errors crash report)
- ❌ No type matching validation (result type vs config type)

**Recommendation:** ✅ **GO for Implementation** - Implement comprehensive validation and React error boundaries with graceful degradation.

**Priority:**
1. **High:** React error boundaries (prevents report crashes)
2. **Medium:** Structure validation (prevents rendering errors)
3. **Low:** Value type validation (NaN, Infinity are rare)

---

**Investigated By:** Tribeca  
**Date:** 2026-01-13T14:12:00.000Z  
**Status:** INVESTIGATION COMPLETE

---

## Phase 2: Implementation (2026-01-13T14:12:00.000Z)

**Status:** COMPLETE  
**Implemented By:** Tribeca

### Implementation Summary

**Implemented Improvements:**
1. ✅ **Comprehensive Chart Data Validator** - Validates structure, values, elements, and type matching
2. ✅ **React Error Boundaries** - Prevents chart rendering errors from crashing entire report
3. ✅ **Enhanced ReportChart Validation** - Validates data before rendering with graceful degradation
4. ✅ **Value Type Validation** - Validates NaN, Infinity, and negative values

### Code Changes

**1. Chart Data Validator**
- **File:** `lib/export/chartValidation.ts` (enhanced)
- **Purpose:** Comprehensive validation of chart result structure and values
- **Functions:**
  - `validateChartData()` - Main validation function
  - `validateChartResultStructure()` - Check required fields exist
  - `validateChartResultValues()` - Check values are valid (not NaN/Infinity)
  - `validateChartResultElements()` - Check element structure for PIE/BAR charts
  - `validateChartResultType()` - Check result type matches config type
  - `formatValidationIssue()` - Format errors for display

**2. React Error Boundaries**
- **File:** `components/ChartErrorBoundary.tsx` (new)
- **Purpose:** Catch rendering errors to prevent report crashes
- **Implementation:**
  - Wraps `ReportChart` component
  - Displays error placeholder on rendering errors
  - Logs errors for debugging
  - Prevents entire report from crashing

**3. Enhanced ReportChart Validation**
- **File:** `app/report/[slug]/ReportChart.tsx`
- **Changes:**
  - Validates chart data before rendering using `validateChartData()`
  - Displays validation errors in error placeholder
  - Wraps chart rendering in `ChartErrorBoundary`
  - Ensures graceful degradation (other charts still render)

**4. Chart Configuration Passing**
- **Files:** `app/report/[slug]/ReportContent.tsx`, `app/report/[slug]/page.tsx`
- **Changes:**
  - Pass chart configurations to `ReportChart` for type matching validation
  - Added `charts` prop to `ReportContent`, `ReportBlock`, and `ResponsiveRow`

**5. Test Coverage**
- **File:** `__tests__/chart-data-validation.test.ts` (new)
- **Coverage:**
  - Structure validation (6 test cases)
  - Value type validation (6 test cases)
  - Element structure validation (2 test cases)
  - Type matching validation (2 test cases)
  - Error message formatting (3 test cases)
  - Validation status (2 test cases)

### Verification

**Before Implementation:**
- No structure validation (missing fields)
- No value type validation (NaN, Infinity)
- No React error boundaries (rendering errors crash report)
- No type matching validation

**After Implementation:**
- ✅ Chart result structure validated (required fields)
- ✅ Value types validated (NaN, Infinity, negative values)
- ✅ Element structure validated (PIE/BAR charts)
- ✅ Type matching validated (result type vs config type)
- ✅ React error boundaries prevent report crashes
- ✅ Graceful degradation (one chart error doesn't break report)

### Closure Evidence

**Commits:**
- `adcea2138` - A-R-13: Chart Data Validation & Error Boundaries - COMPLETE
- `e67303b75` - ACTION_PLAN.md: Update STATE MEMORY - Tribeca A-R-13 DONE

**Files Modified:**
- `lib/export/chartValidation.ts` (enhanced)
- `components/ChartErrorBoundary.tsx` (new)
- `app/report/[slug]/ReportChart.tsx`
- `app/report/[slug]/ReportContent.tsx`
- `app/report/[slug]/page.tsx`
- `__tests__/chart-data-validation.test.ts` (new)
- `docs/audits/investigations/A-R-13-chart-data-validation.md` (this file)
- `ACTION_PLAN.md`

**Status:** ✅ **IMPLEMENTATION COMPLETE**

**Implemented By:** Tribeca  
**Date:** 2026-01-13T14:12:00.000Z
