# Report Layout V2 Renderer Contract

**Status:** Active  
**Version:** 1.1.0  
**Created:** 2026-01-15T12:45:00.000Z  
**Last Updated:** 2026-01-15T14:18:00.000Z  
**Canonical:** Yes  
**Owner:** Architecture (Chappie)  
**Audience:** Engineering (Reporting + Admin)

---

## Purpose

This document defines the **contract** between Admin (template configuration) and Reporting (renderer) for LayoutV2. It specifies deterministic rules that guarantee the same input always produces the same layout output.

**Key Principle:** No ambiguity. Same input => same layout.

---

## Block Structure

### Block Aspect Ratio
- **Default:** 4:1 (width:height) - `blockHeight = blockWidth / 4`
- **Variable Override (R-LAYOUT-02.1):** Optional aspect ratio override for TEXT-AREA/TABLE blocks
  - **Supported Range:** 4:1 to 4:10 (e.g., 4:6, 4:10)
  - **Override Allowed Only For:** Blocks containing TEXT or TABLE chart types exclusively
  - **Validation:** Rejects mixed types (e.g., TEXT + KPI) with fallback to default 4:1
  - **Formula:** `blockHeight = blockWidth × (aspectHeight / aspectWidth)`
- **Example:** If block width is 1200px, default height is 300px (4:1), or 1800px with 4:6 override

### Block Capacity
- **Fixed:** 4 units maximum per block
- **Rule:** Sum of all item units in a block must be ≤ 4
- **Validation:** Admin must reject configurations where `sum(itemUnits) > 4`

### Block Dimensions
- **Width:** Determined by viewport (desktop: 1200px, tablet: 768px, mobile: 375px)
- **Height:** Calculated from aspect ratio: `height = width / 4`
- **All cells in a block share the same height** (Layout Grammar requirement)

---

## Item Unit Rules

### Image Items

| Aspect Ratio | Units | Description |
|--------------|-------|-------------|
| 16:9 (landscape) | 2 units | Wide landscape images |
| 1:1 (square) | 1 unit | Square images |
| 9:16 (portrait) | 1 unit | Tall portrait images |

**Rules:**
- Image aspect ratio is determined by actual image dimensions (`naturalWidth`/`naturalHeight`) detected on load
- Fallback to configured aspect ratio if image not loaded yet
- Image must fit within allocated unit slot without overflow

### Text/Chart Items

| Aspect Ratio | Units | Description |
|--------------|-------|-------------|
| 1:1 (square) | 1 unit | Compact/square charts and text |
| 2:1 (landscape) | 2 units | Wide/landscape charts and text |

**Chart Types:**
- **KPI:** Always 1 unit (1:1)
- **PIE:** Always 1 unit (1:1)
- **BAR:** 1 unit (1:1) or 2 units (2:1) - configurable
- **TEXT:** 1 unit (1:1) or 2 units (2:1) - configurable
- **TABLE:** 1 unit (1:1) or 2 units (2:1) - configurable
- **IMAGE:** 1 unit (1:1 or 9:16) or 2 units (16:9) - based on aspect ratio

**Rules:**
- Text/charts must never overflow inside their allocated unit slot
- Content scales to fit available space (Layout Grammar requirement)
- Font sizes dynamically adjusted to prevent overflow

---

## Deterministic Packing Rules

### Rule 1: Left-to-Right Packing
- Items are packed from left to right in order of appearance
- No gaps between items
- Items fill available width proportionally based on unit allocation

### Rule 2: Unit-Based Width Allocation
- Each item's width is calculated as: `itemWidth = (itemUnits / totalUnits) × blockWidth`
- **Example:** Block width 1200px, items [2 units, 1 unit, 1 unit]
  - Item 1: `(2/4) × 1200 = 600px`
  - Item 2: `(1/4) × 1200 = 300px`
  - Item 3: `(1/4) × 1200 = 300px`
  - Total: 600 + 300 + 300 = 1200px ✓

### Rule 3: Same Input => Same Layout
- Given identical input (same items, same units, same block width), output layout is identical
- No random placement, no heuristic-based positioning
- Deterministic grid calculation: `grid-template-columns: repeat(totalUnits, 1fr)`

### Rule 4: Block Never Breaks
- All items in a block are rendered in a single horizontal row
- Block never wraps to multiple rows
- If `sum(itemUnits) > 4`, Admin must reject configuration (validation error)

### Rule 5: Height Uniformity
- All items in a block share the same height: `blockHeight = blockWidth / 4`
- No item can have a different height than other items in the same block
- Image aspect ratios are preserved within the shared height constraint

---

## Fit Policies

### Policy 1: Text/Charts Never Overflow
- **Requirement:** Text and chart content must fit within allocated unit slot
- **Mechanism:** Dynamic font size reduction
- **Pattern:** Measure container → Calculate allocated space → Measure actual content → Reduce font size if needed
- **Override:** Use `!important` to override CSS clamp() rules
- **Validation:** Runtime validation ensures `actualHeight ≤ availableHeight`

### Policy 2: Images Preserve Aspect Ratio
- **Requirement:** Images must preserve aspect ratio while fitting within allocated space
- **Mechanism:** `object-fit: contain` ensures full image visible without cropping
- **Calculation:** Image dimensions scaled to fit within cell frame while maintaining aspect ratio
- **Validation:** Image never exceeds cell boundaries

### Policy 3: Content Scaling
- **Requirement:** All content scales to fit allocated space
- **Mechanism:** CSS container queries, dynamic font sizing, measured height calculations
- **Result:** Content fills available space without overflow, truncation, or clipping
- **Layout Grammar Compliance:** No scrolling, no truncation, no clipping

### Policy 4: Minimum Readability
- **Requirement:** Font sizes must maintain minimum readability (8px minimum)
- **Mechanism:** Font size reduction stops at 8px threshold
- **Fallback:** If content cannot fit even at 8px, log warning (Layout Grammar violation)

---

## Renderer Input Shape Expectations

### Input from Admin: Report Template

```typescript
interface ReportTemplate {
  _id?: ObjectId | string;
  name: string;
  type: 'event' | 'partner' | 'global';
  isDefault: boolean;
  
  // Layout Configuration
  layout: {
    blocks: ReportBlock[];
    gridColumns: {
      desktop: number;  // Max columns (default: 6)
      tablet: number;   // Max columns (default: 3)
      mobile: number;   // Max columns (default: 2)
    };
  };
  
  // Style Configuration
  styleId?: ObjectId | string;
  
  // Layout Mode
  blockLayoutMode?: 'legacy' | 'deterministic';  // 'deterministic' = LayoutV2
}

interface ReportBlock {
  id: string;
  order: number;  // Determines vertical order in report
  charts: ReportBlockChart[];
}

interface ReportBlockChart {
  chartId: string;
  order: number;  // Determines horizontal order within block
  width: 1 | 2;   // Unit allocation (1 or 2 units)
  // Note: width > 2 auto-clamped to 2 by Admin validation
}
```

### Input Validation (Admin Responsibility)

**Pre-Render Validation:**
1. **Block Capacity Check:** `sum(chart.width for all charts in block) ≤ 4`
2. **Unit Range Check:** `chart.width ∈ {1, 2}` (values > 2 auto-clamped to 2)
3. **Order Uniqueness:** Chart orders within block must be unique
4. **Block Order Uniqueness:** Block orders within report must be unique

**Validation Errors:**
- If `sum(chart.width) > 4`: "Block capacity exceeded: sum of chart widths (N) exceeds maximum (4 units)"
- If `chart.width > 2`: Auto-clamp to 2, log warning
- If duplicate orders: "Duplicate order detected in block/blockId"

### Renderer Consumption (Reporting Responsibility)

**Renderer receives:**
- `ReportTemplate` with `layout.blocks[]`
- Each block contains `charts[]` with `width` (1 or 2 units)
- Renderer calculates: `totalUnits = sum(chart.width for all charts in block)`
- Renderer creates: `grid-template-columns: repeat(totalUnits, 1fr)`
- Renderer calculates: `blockHeight = blockWidth / 4`

**Renderer guarantees:**
- Same input produces same layout (deterministic)
- All items fit within allocated space (no overflow)
- All items share same height (block height uniformity)
- Layout Grammar compliance (no scrolling, truncation, clipping)

---

## Examples

### Example 1: Simple Block (4 units total)

**Input:**
- Block width: 1200px
- Items: [IMAGE 16:9 (2 units), KPI (1 unit), PIE (1 unit)]

**Calculation:**
- Total units: 2 + 1 + 1 = 4 units
- Block height: 1200 / 4 = 300px
- Grid: `grid-template-columns: 2fr 1fr 1fr`
- Item widths:
  - IMAGE: `(2/4) × 1200 = 600px`
  - KPI: `(1/4) × 1200 = 300px`
  - PIE: `(1/4) × 1200 = 300px`
- All items height: 300px

**Result:** Deterministic layout, all items fit, no overflow.

### Example 2: Mixed Block (3 units total)

**Input:**
- Block width: 1200px
- Items: [BAR 2:1 (2 units), TEXT 1:1 (1 unit)]

**Calculation:**
- Total units: 2 + 1 = 3 units
- Block height: 1200 / 4 = 300px
- Grid: `grid-template-columns: 2fr 1fr`
- Item widths:
  - BAR: `(2/3) × 1200 = 800px`
  - TEXT: `(1/3) × 1200 = 400px`
- All items height: 300px

**Result:** Deterministic layout, all items fit, no overflow.

### Example 3: Invalid Block (5 units total)

**Input:**
- Items: [IMAGE 16:9 (2 units), BAR 2:1 (2 units), KPI (1 unit), PIE (1 unit)]
- Total units: 2 + 2 + 1 + 1 = 6 units > 4

**Validation Error:**
- Admin rejects: "Block capacity exceeded: sum of chart widths (6) exceeds maximum (4 units)"
- Renderer never receives invalid configuration

---

## Layout Grammar Compliance

### Requirements
- ✅ **No Scrolling:** `overflow: hidden` on content layers
- ✅ **No Truncation:** No `text-overflow: ellipsis` or `line-clamp` on content
- ✅ **No Clipping:** Content never visually cut off
- ✅ **Deterministic Height:** Block height calculated from aspect ratio (4:1)
- ✅ **Content Fits:** All content scales to fit allocated space

### Enforcement
- **Runtime Validation:** CSS variable validation ensures critical variables present
- **Font Size Reduction:** Dynamic font sizing prevents overflow
- **Measured Heights:** JavaScript measures actual vs. allocated space
- **Fit Policies:** Content never exceeds allocated unit slot

---

## Migration Notes

### From Legacy System
- **Legacy:** Charts could use widths 1-10, arbitrary unit counts
- **LayoutV2:** Charts use widths 1-2 only, fixed 4-unit block capacity
- **Migration:** Existing charts with width > 2 auto-clamped to 2
- **Feature Flag:** `blockLayoutMode: 'deterministic'` enables LayoutV2

### Backward Compatibility
- **Legacy Templates:** Continue working with `blockLayoutMode: 'legacy'`
- **New Templates:** Default to `blockLayoutMode: 'deterministic'` (LayoutV2)
- **Gradual Rollout:** Templates can opt-in to LayoutV2 per template

---

## Implementation Files

### Admin (Template Configuration)
- `lib/reportTemplateTypes.ts` - ReportTemplate interface
- `app/admin/visualization/page.tsx` - Template editor UI
- Validation: Block capacity check, unit range check

### Reporting (Renderer)
- `app/report/[slug]/ReportContent.tsx` - Main grid renderer
- `app/report/[slug]/ReportChart.tsx` - Individual chart renderer
- `lib/blockHeightCalculator.ts` - Block height calculation
- `components/CellWrapper.tsx` - 3-zone cell wrapper

---

## Summary

**Block Rules:**
- Aspect ratio: 4:1 (fixed)
- Capacity: 4 units (fixed)
- Height: `blockWidth / 4`

**Item Rules:**
- Images: 16:9 = 2 units, 1:1 = 1 unit, 9:16 = 1 unit
- Texts/charts: 1:1 = 1 unit, 2:1 = 2 units

**Packing Rules:**
- Left-to-right packing
- Unit-based width allocation
- Same input => same layout
- Block never breaks
- Height uniformity

**Fit Policies:**
- Text/charts never overflow
- Images preserve aspect ratio
- Content scales to fit
- Minimum readability (8px)

**Input Shape:**
- Admin provides `ReportTemplate` with `layout.blocks[]`
- Each block contains `charts[]` with `width` (1 or 2 units)
- Renderer validates and renders deterministically

---

*Report Layout V2 Renderer Contract*  
*Version 1.0.0 | 2026-01-15 | LayoutV2*
