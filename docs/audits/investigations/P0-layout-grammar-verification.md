# Layout Grammar & Code Quality Verification

**Date:** 2026-01-02  
**Reporter:** Sultan  
**Investigator:** Tribeca  
**Status:** ⚠️ PARTIAL - ISSUES IDENTIFIED

---

## Verification Summary

### ✅ Layout Grammar Alignment

**Current Implementation:**
- ✅ Blocks never break into multiple rows (all charts in one row)
- ✅ Grid based on sum of units (`1fr 2fr 1fr` pattern)
- ✅ Dynamic height calculation using `solveBlockHeightWithImages()`
- ✅ Font synchronization using `calculateSyncedFontSizes()`
- ✅ Image aspect ratios preserved
- ✅ CellWrapper 3-zone structure enforced

**Documentation Discrepancy:**
- ⚠️ Docs mention CSS variables (`--mm-title-size`, `--mm-subtitle-size`) but code uses inline styles with dynamic `fontSize` props
- **Action Required:** Update `docs/design/LAYOUT_SYSTEM.md` line 176 to reflect actual implementation (inline styles, not CSS variables)

---

## Hardcoded Values Analysis

### ✅ Acceptable Hardcoded Values (Fallbacks/Constraints)

**`lib/blockHeightCalculator.ts`:**
- `minHeight = 150` - Constraint to prevent extreme values (acceptable)
- `maxHeight = 800` - Constraint to prevent extreme values (acceptable)
- `fallback = 360` - Fallback when calculation fails (acceptable)
- `TEXT width = 300` - Default TEXT allocation per spec (acceptable, documented)

**`app/report/[slug]/ReportContent.tsx`:**
- `default rowWidth = 1200` - Fallback for initial render (acceptable)
- `default rowHeight = 400` - Fallback for initial render (acceptable)
- `default titleFontSize = 18` - Fallback for initial render (acceptable)
- `default subtitleFontSize = 14` - Fallback for initial render (acceptable)

**`app/report/[slug]/ReportChart.tsx`:**
- `default aspectRatio = '16:9'` - Fallback when not specified (acceptable)
- Default colors (`#3b82f6`, `#10b981`) - Fallbacks when CSS variables not available (acceptable)

### ⚠️ Potential Issues

**None identified** - All hardcoded values are either:
1. Fallbacks for initial render (replaced by calculated values)
2. Constraints to prevent edge cases (min/max bounds)
3. Defaults per Layout Grammar spec (TEXT width)

---

## Inline Styles Analysis

### ✅ All Inline Styles Are Dynamic Values

**Found 6 inline style usages (all with eslint-disable comments):**

1. **`app/report/[slug]/ReportContent.tsx` (line 262):**
   ```typescript
   style={{ 
     '--row-height': `${rowHeight}px`,
     gridTemplateColumns: gridColumns
   }}
   ```
   - ✅ Dynamic: `rowHeight` calculated from `solveBlockHeightWithImages()`
   - ✅ Dynamic: `gridColumns` calculated from `calculateGridColumns()`

2. **`app/report/[slug]/ReportContent.tsx` (line 408):**
   ```typescript
   style={unifiedTextFontSize ? {
     ['--unified-text-font-size' as string]: `${unifiedTextFontSize}rem`
   } : undefined}
   ```
   - ✅ Dynamic: `unifiedTextFontSize` calculated from `useUnifiedTextFontSize()` hook

3. **`app/report/[slug]/ReportChart.tsx` (line 218):**
   ```typescript
   style={blockHeight ? { height: `${blockHeight}px` } : undefined}
   ```
   - ✅ Dynamic: `blockHeight` passed from `ReportContent` (calculated)

4. **`app/report/[slug]/ReportChart.tsx` (line 348):**
   ```typescript
   style={blockHeight ? { height: `${blockHeight}px` } : undefined}
   ```
   - ✅ Dynamic: `blockHeight` passed from `ReportContent` (calculated)

5. **`components/CellWrapper.tsx` (line 42):**
   ```typescript
   style={blockHeight ? { height: `${blockHeight}px` } : undefined}
   ```
   - ✅ Dynamic: `blockHeight` passed from chart components (calculated)

6. **`components/CellWrapper.tsx` (line 51-54):**
   ```typescript
   style={{
     fontSize: titleFontSize ? `${titleFontSize}px` : undefined,
     height: titleHeight ? `${titleHeight}px` : undefined
   }}
   ```
   - ✅ Dynamic: `titleFontSize` calculated from `calculateSyncedFontSizes()`
   - ✅ Dynamic: `titleHeight` (optional, not currently used)

**Conclusion:** ✅ All inline styles are for dynamic values calculated at runtime. No hardcoded inline styles.

---

## KYC Variables Analysis

### ✅ No Hardcoded Variables

**Implementation:**
- ✅ All variables fetched dynamically from MongoDB `variables_metadata` collection
- ✅ Variables loaded via `/api/variables-config` endpoint
- ✅ 5-minute cache for performance (acceptable)
- ✅ No hardcoded variable lists in code

**Evidence:**
- `lib/formulaEngine.ts`: Uses `fetchAvailableVariables()` - dynamic fetch
- `lib/chartConfigTypes.ts`: Comment states "Removed hardcoded AVAILABLE_VARIABLES array"
- `components/ChartAlgorithmManager.tsx`: Validates against dynamically fetched variables

**Conclusion:** ✅ KYC system is fully dynamic, no hardcoded variables.

---

## Chart Calculations Analysis

### ✅ No Hardcoded Chart Logic

**Implementation:**
- ✅ All chart calculations use `ReportCalculator` class
- ✅ Formulas evaluated dynamically via `evaluateFormula()`
- ✅ Chart configurations loaded from MongoDB `chart_configurations` collection
- ✅ No hardcoded chart types or calculations

**Evidence:**
- `lib/report-calculator.ts`: Generic calculator that works with any chart configuration
- `app/report/[slug]/page.tsx`: Charts loaded from API, not hardcoded

**Conclusion:** ✅ Chart system is fully dynamic, no hardcoded chart logic.

---

## Required Actions

### 1. Documentation Update
- [ ] Update `docs/design/LAYOUT_SYSTEM.md` line 176 to reflect actual implementation:
  - Change: "CSS variables injected (`--mm-title-size`, `--mm-subtitle-size`, `--mm-kpi-size`)"
  - To: "Inline styles with dynamic `fontSize` props passed from `calculateSyncedFontSizes()`"

### 2. Design Token Migration (Optional Future Enhancement)
- Consider moving hardcoded constraints to design tokens:
  - `minHeight = 150` → `--mm-block-min-height`
  - `maxHeight = 800` → `--mm-block-max-height`
  - `TEXT width = 300` → `--mm-text-cell-width`
- **Note:** This is optional, current values are acceptable as constraints

---

## Final Verification

### ✅ Layout Grammar Compliance
- ✅ Blocks never break
- ✅ Grid based on sum of units
- ✅ Dynamic height calculation
- ✅ Font synchronization
- ✅ Image aspect ratios preserved

### ✅ No Hardcoded Elements
- ✅ No hardcoded variables (KYC is dynamic)
- ✅ No hardcoded chart logic (all from database)
- ✅ Hardcoded values are only fallbacks/constraints (acceptable)

### ✅ No Hardcoded Inline Styles
- ✅ All inline styles are for dynamic calculated values
- ✅ All inline styles have proper eslint-disable comments with WHAT/WHY explanations

---

**Status:** ✅ VERIFIED - Code follows Layout Grammar and has no problematic hardcoded elements or inline styles.

**Outstanding:** Documentation update needed to match actual implementation.

