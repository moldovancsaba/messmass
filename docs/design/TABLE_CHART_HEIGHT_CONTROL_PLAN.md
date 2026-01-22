# Table Chart Height Control - Implementation Plan

**Status:** Planning  
**Version:** 1.0.0  
**Created:** 2026-01-16T16:30:00.000Z  
**Last Updated:** 2026-01-16T16:30:00.000Z  
**Canonical:** Yes  
**Owner:** Architecture (Chappie)  
**Audience:** Engineering (Reporting + Admin)

---

## Problem Statement

**Current State:**
- Table charts use block-level aspect ratio (4:1 to 4:10) via `blockAspectRatio`
- This affects the **entire block height**, not just the table chart
- No granular control over individual table chart height within a block

**User Requirement:**
- Set Table Chart height in FR (fractional) units relative to block width
- Example: "Table height = blockWidth × 1.5" or "Table height = blockWidth × 0.8"
- Need per-chart control, not just per-block control

**Use Cases:**
1. **Tall tables with many rows**: Need height = blockWidth × 2.0 (taller than default)
2. **Compact tables**: Need height = blockWidth × 0.5 (shorter than default)
3. **Mixed blocks**: Table + KPI in same block, but table needs different height than KPI
4. **Responsive tables**: Different height multipliers for desktop vs mobile

---

## Current Architecture

### Block-Level Height Control (R-LAYOUT-02.1)
- **Location**: `blockAspectRatio` on `ReportBlock`
- **Scope**: Entire block (affects all charts in block)
- **Format**: `"4:6"` (width:height ratio)
- **Range**: 4:1 to 4:10
- **Validation**: Only allowed for TEXT/TABLE-only blocks

### Table Chart Rendering
- **Component**: `TableChart` in `app/report/[slug]/ReportChart.tsx`
- **Height Source**: `--chart-body-height` CSS variable (calculated from block height)
- **Current Behavior**: Table fills available body zone height
- **CSS**: Uses `height: var(--chart-body-height)` or flex growth

---

## Implementation Options

### Option 1: Chart-Level Height Multiplier (RECOMMENDED)

**Concept**: Add `tableHeightMultiplier` property to individual table charts

**Schema Change:**
```typescript
interface ReportBlockChart {
  chartId: string;
  order: number;
  width: 1 | 2;
  tableHeightMultiplier?: number; // NEW: Height = blockWidth × multiplier
}
```

**Example:**
```json
{
  "charts": [
    {
      "chartId": "my-table",
      "order": 0,
      "width": 2,
      "tableHeightMultiplier": 1.5  // Height = blockWidth × 1.5
    }
  ]
}
```

**Pros:**
- ✅ Per-chart control (most flexible)
- ✅ Works in mixed blocks (table + other charts)
- ✅ Simple to understand (multiplier × width = height)
- ✅ Backward compatible (optional field)
- ✅ Easy to validate (0.1 to 5.0 range)

**Cons:**
- ⚠️ Breaks block height uniformity (all charts in block must share height)
- ⚠️ Requires Layout Grammar exception for table charts
- ⚠️ Complex CSS to handle different heights in same block

**Implementation Complexity:** Medium-High  
**Breaking Changes:** Yes (Layout Grammar rule: "all cells share same height")

---

### Option 2: Block-Level Table Height Override

**Concept**: Extend `blockAspectRatio` to support FR-based height specification

**Schema Change:**
```typescript
interface ReportBlock {
  id: string;
  order: number;
  charts: ReportBlockChart[];
  blockAspectRatio?: string; // Existing: "4:6"
  tableHeightFR?: number;    // NEW: Height in FR units (e.g., 1.5 = 1.5fr)
}
```

**Example:**
```json
{
  "id": "block-1",
  "order": 0,
  "charts": [{"chartId": "my-table", "order": 0, "width": 2}],
  "tableHeightFR": 1.5  // Table height = blockWidth × 1.5
}
```

**Pros:**
- ✅ Maintains block height uniformity (all charts share height)
- ✅ Simple to implement (extends existing `blockAspectRatio` system)
- ✅ No Layout Grammar violations
- ✅ Works with existing validation

**Cons:**
- ❌ Only works for TABLE-only blocks (same limitation as `blockAspectRatio`)
- ❌ Less flexible than per-chart control
- ❌ Confusing to have both `blockAspectRatio` and `tableHeightFR`

**Implementation Complexity:** Low  
**Breaking Changes:** No

---

### Option 3: CSS Grid Row Height Override

**Concept**: Use CSS Grid `grid-template-rows` to set table-specific row height

**Schema Change:**
```typescript
interface ReportBlockChart {
  chartId: string;
  order: number;
  width: 1 | 2;
  heightFR?: number; // NEW: Height in FR units for this chart's grid row
}
```

**Implementation:**
- Block uses CSS Grid with `grid-template-rows: auto` or `grid-template-rows: 1fr 1.5fr` (if mixed)
- Table chart gets its own grid row with specified FR height
- Other charts in block use default row height

**Example:**
```json
{
  "charts": [
    {"chartId": "kpi-1", "order": 0, "width": 1, "heightFR": 1},
    {"chartId": "my-table", "order": 1, "width": 2, "heightFR": 1.5}
  ]
}
```

**CSS:**
```css
.block-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;  /* Width allocation */
  grid-template-rows: 1fr 1.5fr;    /* Height allocation */
}
```

**Pros:**
- ✅ True FR-based control (native CSS Grid)
- ✅ Works in mixed blocks (each chart can have different height)
- ✅ Flexible and powerful
- ✅ Aligns with CSS Grid best practices

**Cons:**
- ⚠️ Breaks block height uniformity (Layout Grammar violation)
- ⚠️ Complex grid calculation (need to handle multiple row heights)
- ⚠️ Requires 2D grid (columns + rows) instead of 1D row

**Implementation Complexity:** High  
**Breaking Changes:** Yes (requires 2D grid layout)

---

### Option 4: Table-Specific Block Height (Hybrid)

**Concept**: When block contains only TABLE charts, allow FR-based height specification

**Schema Change:**
```typescript
interface ReportBlock {
  id: string;
  order: number;
  charts: ReportBlockChart[];
  blockAspectRatio?: string;     // Existing: "4:6" (aspect ratio)
  tableHeightMultiplier?: number; // NEW: Height = blockWidth × multiplier (for TABLE-only blocks)
}
```

**Validation:**
- `tableHeightMultiplier` only allowed when ALL charts in block are TABLE type
- Cannot use both `blockAspectRatio` and `tableHeightMultiplier` together
- If `tableHeightMultiplier` is set, calculate: `blockHeight = blockWidth × tableHeightMultiplier`

**Example:**
```json
{
  "id": "table-block",
  "order": 0,
  "charts": [
    {"chartId": "table-1", "order": 0, "width": 2},
    {"chartId": "table-2", "order": 1, "width": 2}
  ],
  "tableHeightMultiplier": 1.5  // Both tables get height = blockWidth × 1.5
}
```

**Pros:**
- ✅ Maintains block height uniformity
- ✅ Simple multiplier-based calculation
- ✅ No Layout Grammar violations
- ✅ Clear separation from `blockAspectRatio` (different use case)

**Cons:**
- ❌ Only works for TABLE-only blocks
- ❌ Less flexible than per-chart control
- ❌ Requires validation to ensure TABLE-only

**Implementation Complexity:** Low-Medium  
**Breaking Changes:** No

---

## Recommendation Matrix

| Option | Flexibility | Complexity | Layout Grammar | Mixed Blocks | Recommendation |
|--------|-------------|------------|----------------|--------------|----------------|
| **Option 1** | ⭐⭐⭐⭐⭐ | Medium-High | ❌ Violates | ✅ Yes | ⚠️ Powerful but breaks rules |
| **Option 2** | ⭐⭐⭐ | Low | ✅ Compliant | ❌ No | ✅ Good for TABLE-only blocks |
| **Option 3** | ⭐⭐⭐⭐⭐ | High | ❌ Violates | ✅ Yes | ⚠️ Most flexible but complex |
| **Option 4** | ⭐⭐⭐⭐ | Low-Medium | ✅ Compliant | ❌ No | ✅ **BEST FIT** |

---

## Recommended Solution: Option 4 (Table-Specific Block Height)

### Rationale

1. **Maintains Layout Grammar Compliance**: All charts in block share same height ✅
2. **Simple Implementation**: Extends existing `blockAspectRatio` pattern ✅
3. **Clear Use Case**: TABLE-only blocks with custom height ✅
4. **Backward Compatible**: Optional field, defaults to 4:1 ✅
5. **Easy to Validate**: Multiplier range (0.1 to 5.0) ✅

### Implementation Details

#### 1. Schema Extension

**File**: `lib/reportTemplateTypes.ts`

```typescript
interface ReportBlock {
  id: string;
  order: number;
  charts: ReportBlockChart[];
  blockAspectRatio?: string;        // Existing: "4:6" (aspect ratio format)
  tableHeightMultiplier?: number;    // NEW: Height = blockWidth × multiplier
}
```

**Validation Rules:**
- `tableHeightMultiplier` only allowed when ALL charts in block are `type: 'table'`
- Cannot use both `blockAspectRatio` and `tableHeightMultiplier` together
- Range: 0.1 to 5.0 (prevents extreme values)
- Default: If not specified, use default 4:1 aspect ratio

#### 2. Calculator Update

**File**: `lib/layoutV2BlockCalculator.ts`

```typescript
export function calculateLayoutV2BlockHeight(
  blockWidth: number,
  blockAspectRatio?: string,
  tableHeightMultiplier?: number  // NEW parameter
): number {
  // Priority 1: tableHeightMultiplier (if block is TABLE-only)
  if (tableHeightMultiplier !== undefined) {
    const multiplier = Math.max(0.1, Math.min(5.0, tableHeightMultiplier));
    return blockWidth * multiplier;
  }
  
  // Priority 2: blockAspectRatio (existing behavior)
  if (blockAspectRatio) {
    // ... existing aspect ratio calculation
  }
  
  // Default: 4:1
  return blockWidth / 4;
}
```

#### 3. Admin UI

**File**: `app/admin/visualization/page.tsx`

Add input field in block editor:
```tsx
{block.charts.every(c => c.type === 'table') && (
  <div className="form-group">
    <label>Table Height Multiplier</label>
    <input
      type="number"
      min="0.1"
      max="5.0"
      step="0.1"
      value={block.tableHeightMultiplier || 0.25}  // 0.25 = 4:1 default
      onChange={(e) => {
        const multiplier = parseFloat(e.target.value);
        updateBlock({ ...block, tableHeightMultiplier: multiplier });
      }}
    />
    <small>
      Height = Block Width × {block.tableHeightMultiplier || 0.25}
      <br />
      Example: 1200px width × 1.5 = 1800px height
    </small>
  </div>
)}
```

#### 4. Renderer Integration

**File**: `app/report/[slug]/ReportContent.tsx`

```typescript
function ResponsiveRow({ rowCharts, chartResults, charts, rowIndex, unifiedTextFontSize, blockAspectRatio, tableHeightMultiplier }: ResponsiveRowProps) {
  // Calculate block height
  const blockHeight = calculateLayoutV2BlockHeight(
    blockWidth,
    blockAspectRatio,
    tableHeightMultiplier  // NEW parameter
  );
  
  // ... rest of rendering
}
```

#### 5. Validation

**File**: `lib/layoutV2BlockCalculator.ts`

```typescript
export function validateTableHeightMultiplier(
  block: { charts: Array<{ type?: string }>; tableHeightMultiplier?: number; blockAspectRatio?: string }
): { valid: boolean; error?: string } {
  // Rule 1: Only allowed for TABLE-only blocks
  const allTables = block.charts.every(c => c.type?.toLowerCase() === 'table');
  if (block.tableHeightMultiplier !== undefined && !allTables) {
    return {
      valid: false,
      error: 'tableHeightMultiplier only allowed for TABLE-only blocks'
    };
  }
  
  // Rule 2: Cannot use both blockAspectRatio and tableHeightMultiplier
  if (block.tableHeightMultiplier !== undefined && block.blockAspectRatio) {
    return {
      valid: false,
      error: 'Cannot use both blockAspectRatio and tableHeightMultiplier'
    };
  }
  
  // Rule 3: Range validation
  if (block.tableHeightMultiplier !== undefined) {
    const multiplier = block.tableHeightMultiplier;
    if (multiplier < 0.1 || multiplier > 5.0) {
      return {
        valid: false,
        error: `tableHeightMultiplier must be between 0.1 and 5.0. Got: ${multiplier}`
      };
    }
  }
  
  return { valid: true };
}
```

---

## Alternative: Option 1 (Per-Chart Control) - If Flexibility is Critical

If you need per-chart height control (e.g., table + KPI in same block with different heights), we can implement Option 1, but it requires:

1. **Layout Grammar Exception**: Allow table charts to have different height than other charts in same block
2. **2D Grid Layout**: Use CSS Grid with both column and row templates
3. **Complex Height Calculation**: Each chart gets its own row height

**Trade-off**: More flexibility but breaks Layout Grammar rule of "all cells share same height"

---

## Decision Points

### Question 1: Do you need per-chart height control?
- **Yes** → Option 1 or Option 3 (breaks Layout Grammar)
- **No** → Option 4 (maintains Layout Grammar) ✅ **RECOMMENDED**

### Question 2: Do you need mixed blocks (table + other charts) with different heights?
- **Yes** → Option 1 or Option 3 (requires 2D grid)
- **No** → Option 4 (simpler, maintains rules) ✅ **RECOMMENDED**

### Question 3: Is Layout Grammar compliance critical?
- **Yes** → Option 2 or Option 4 ✅
- **No** → Option 1 or Option 3 (more flexible)

---

## Implementation Steps (Option 4)

1. **Schema Update** (15 min)
   - Add `tableHeightMultiplier?: number` to `ReportBlock` interface
   - Update TypeScript types

2. **Calculator Update** (30 min)
   - Extend `calculateLayoutV2BlockHeight()` to accept `tableHeightMultiplier`
   - Add validation function `validateTableHeightMultiplier()`
   - Update `calculateLayoutV2BlockDimensions()` to use multiplier

3. **Admin UI** (45 min)
   - Add input field in block editor for TABLE-only blocks
   - Show preview: "Height = Block Width × {multiplier}"
   - Add validation feedback

4. **Renderer Integration** (30 min)
   - Update `ReportContent.tsx` to pass `tableHeightMultiplier` to calculator
   - Update `useReportLayout.ts` to extract `tableHeightMultiplier` from template

5. **Tests** (30 min)
   - Unit tests for calculator with multiplier
   - Validation tests for edge cases
   - Integration tests for rendering

6. **Documentation** (15 min)
   - Update `REPORT_LAYOUT_V2_CONTRACT.md`
   - Update `LAYOUT_SYSTEM.md`
   - Add examples

**Total Estimated Time:** ~3 hours

---

## Examples

### Example 1: Tall Table (Height = Width × 2.0)

```json
{
  "id": "tall-table-block",
  "order": 0,
  "charts": [
    {"chartId": "data-table", "order": 0, "width": 4}
  ],
  "tableHeightMultiplier": 2.0
}
```

**Result:**
- Block width: 1200px
- Block height: 1200px × 2.0 = 2400px
- Table fills full 2400px height

### Example 2: Compact Table (Height = Width × 0.5)

```json
{
  "id": "compact-table-block",
  "order": 0,
  "charts": [
    {"chartId": "summary-table", "order": 0, "width": 2}
  ],
  "tableHeightMultiplier": 0.5
}
```

**Result:**
- Block width: 1200px
- Block height: 1200px × 0.5 = 600px
- Table fills full 600px height

### Example 3: Default (No Multiplier)

```json
{
  "id": "default-table-block",
  "order": 0,
  "charts": [
    {"chartId": "standard-table", "order": 0, "width": 2}
  ]
}
```

**Result:**
- Block width: 1200px
- Block height: 1200px / 4 = 300px (default 4:1)
- Table fills full 300px height

---

## Migration Path

**Backward Compatibility:**
- Existing templates without `tableHeightMultiplier` continue working (default 4:1)
- No breaking changes to existing reports
- Gradual adoption (opt-in feature)

**Migration Script (if needed):**
```typescript
// Convert blockAspectRatio "4:6" to tableHeightMultiplier 1.5
if (block.blockAspectRatio && block.charts.every(c => c.type === 'table')) {
  const [width, height] = block.blockAspectRatio.split(':').map(Number);
  block.tableHeightMultiplier = height / width; // 6/4 = 1.5
  delete block.blockAspectRatio;
}
```

---

## Questions for Decision

1. **Do you need per-chart height control, or is block-level sufficient?**
   - Block-level (Option 4) is simpler and maintains Layout Grammar
   - Per-chart (Option 1) is more flexible but breaks rules

2. **Do you need mixed blocks (table + other charts) with different heights?**
   - If yes, we need Option 1 or Option 3 (more complex)
   - If no, Option 4 is perfect

3. **What is the expected range of multipliers?**
   - Recommended: 0.1 to 5.0
   - Can adjust based on your needs

4. **Should this apply to TEXT charts as well, or only TABLE?**
   - Current plan: TABLE only (matches your requirement)
   - Can extend to TEXT if needed

---

*Table Chart Height Control Plan*  
*Version 1.0.0 | 2026-01-16 | Planning Phase*
