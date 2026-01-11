# Image Layout & Aspect Ratio Management Specification
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 1.0.0  
**Date:** 2025-11-02  
**Status:** PROPOSAL - Requires Implementation Review

---

## Executive Summary

This document defines the requirements and implementation strategy for consistent image handling in MessMass reporting system, with mandatory support for three fixed aspect ratios and "what you see is what you get" (WYSIWYG) PDF export.

---

## Core Requirements

### 1. Fixed Aspect Ratio System

**Mandatory Aspect Ratios:**

| Ratio | Type | Dimensions | Use Case |
|-------|------|------------|----------|
| **16:9** | Landscape | 1920×1080 | Horizontal content, wide shots |
| **9:16** | Portrait | 1080×1920 | Vertical content, mobile-first |
| **1:1** | Square | 1080×1080 | Social media, balanced composition |

**Critical Rule:** All images MUST maintain their original aspect ratio. Stretching or squashing is **PROHIBITED**.

### 2. Grid Unit Calculation

**Concept:** Images consume grid units based on aspect ratio to maintain consistent row heights.

#### Portrait Image (9:16) = **1 unit**
- **Width**: 1 grid unit
- **Height**: Baseline (tallest possible)
- **Aspect ratio preserved**: Height = Width × (16/9)

#### Landscape Image (16:9) ≈ **3 units**
- **Width**: ~3 grid units  
- **Height**: Same as 1 portrait unit
- **Calculation**: To match portrait height with 16:9 ratio requires ~2.8× width
- **Rounded**: 3 units for clean grid math

#### Square Image (1:1) ≈ **1.8 units**
- **Width**: ~1.8 grid units
- **Height**: Same as 1 portrait unit
- **Calculation**: To match portrait height with 1:1 ratio requires ~1.78× width
- **Rounded**: 2 units for clean grid math (alternative: 1.8 for precision)

### 3. Row Height Consistency

**Mandatory Rules:**

1. **Same Row = Same Height**  
   All items in a single row MUST have identical heights regardless of content type (image, chart, text).

2. **Height Varies Between Rows**  
   Different rows CAN have different heights based on their content.

3. **Tallest Element Determines Row Height**  
   The row height is set by the tallest element, all others stretch to match.

---

## Layout Scenarios

### Scenario 1: Image-Only Rows

**System Behavior:** Automatic calculation based on aspect ratios.

#### Example A: 2 Portrait Images
```
Grid: [1 unit Portrait] [1 unit Portrait]
Total: 2 units width
Height: Tallest possible (portrait reference height)
```

#### Example B: 1 Portrait + 1 Landscape
```
Grid: [1 unit Portrait] [3 units Landscape]
Total: 4 units width
Height: Same for both (portrait reference height)
Result: Landscape is 3× wider but same height
```

#### Example C: 3 Landscape Images
```
Grid: [3 units Landscape] [3 units Landscape] [3 units Landscape]
Total: 9 units width
Height: Shorter than portrait rows (landscape reference height)
```

#### Example D: Mixed Ratios
```
Grid: [2 units Square] [1 unit Portrait] [3 units Landscape]
Total: 6 units width
Height: All match tallest (portrait)
```

### Scenario 2: Hybrid Rows (Charts + Images)

**System Behavior:** Charts flex to fill available space and match image height.

#### Example E: KPI Chart + Landscape Image
```
Grid: [1 unit KPI] [3 units Landscape]
Total: 4 units width
Height: Landscape reference height
Result: KPI stretches to match image height
```

#### Example F: Portrait Image + Bar Chart + Pie Chart
```
Grid: [1 unit Portrait] [2 units Bar] [2 units Pie]
Total: 5 units width
Height: Portrait reference height (tallest)
Result: Both charts stretch to match portrait height
```

---

## Technical Implementation Strategy

### 1. Image Rendering Method

**Proposal:** Use CSS `background-image` with `background-size: cover` for ALL images.

**Why:**
- ✅ **PDF Export Compatible**: html2canvas correctly captures background images with `cover` cropping
- ✅ **Aspect Ratio Preservation**: `cover` maintains ratio, crops overflow (never stretches)
- ✅ **Consistent Heights**: Easier to enforce equal row heights with background containers
- ✅ **Grid-Friendly**: Background containers naturally fill grid cells

**Current Issue:** `<img>` tags with `object-fit: cover` cause distortion in PDF exports (see `lib/export/pdf.ts` workaround).

**Proposed Change:**
```tsx
// ❌ CURRENT: <img> with object-fit
<img src={imageUrl} className={styles.image} />

// ✅ PROPOSED: div with background-image
<div 
  className={styles.imageContainer}
  style={{ 
    ['--image-url' as string]: `url("${imageUrl}")` 
  } as React.CSSProperties}
/>
```

```css
/* CSS Module */
.imageContainer {
  width: 100%;
  height: 100%;
  background-image: var(--image-url);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
```

### 2. Grid Unit Width Calculation

**Database Schema Addition** (chart_configurations):
```typescript
interface ImageChartConfig {
  type: 'image';
  aspectRatio: '16:9' | '9:16' | '1:1'; // NEW FIELD
  autoWidth?: boolean; // Auto-calculate width from aspect ratio (default: true)
  // ... existing fields
}
```

**Width Calculation Logic:**
```typescript
function calculateImageWidth(aspectRatio: string, rowHeight: number): number {
  const basePortraitWidth = 1; // 1 unit for portrait (9:16)
  
  switch (aspectRatio) {
    case '9:16': // Portrait
      return 1;
      
    case '16:9': // Landscape
      // To match portrait height: width = height × (16/9) ÷ (9/16) = height × 2.78
      return 3; // Rounded for clean grid
      
    case '1:1': // Square
      // To match portrait height: width = height × (1/1) ÷ (9/16) = height × 1.78
      return 2; // Rounded for clean grid (or 1.8 for precision)
      
    default:
      return 1;
  }
}
```

### 3. Row Height Management

**Current System** (`UnifiedDataVisualization.tsx`):
```css
.udv-grid {
  grid-auto-rows: 1fr; /* All rows equal height */
  align-items: stretch; /* Items fill row height */
}
```

**Proposed Enhancement:**
```css
.udv-grid {
  grid-auto-rows: auto; /* Let content determine row height */
  align-items: stretch; /* Items fill row height */
}

/* Each row's height determined by tallest item */
.chart-item,
.image-item {
  height: 100%; /* Fill row height */
  min-height: 0; /* Allow flexbox to control height */
}
```

### 4. Admin UI for Aspect Ratio Selection

**Chart Algorithm Manager Addition:**
```tsx
{chartType === 'image' && (
  <div className="form-group">
    <label className="form-label-block">Image Aspect Ratio *</label>
    <select 
      className="form-input"
      value={formData.aspectRatio || '16:9'}
      onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
    >
      <option value="16:9">🖼️ Landscape (16:9)</option>
      <option value="9:16">📱 Portrait (9:16)</option>
      <option value="1:1">⬜ Square (1:1)</option>
    </select>
    <small className="form-help">
      Determines grid width: Portrait (1 unit), Square (2 units), Landscape (3 units)
    </small>
  </div>
)}
```

---

## PDF Export Compatibility

### Current Implementation

**File:** `lib/export/pdf.ts`

**Workaround for `object-fit: cover`:**
```typescript
// Lines 355-365: Convert <img> to background-image before capture
const coverImages = element.querySelectorAll('img');
coverImages.forEach((img) => {
  if (getComputedStyle(img).objectFit === 'cover') {
    const placeholder = document.createElement('div');
    placeholder.style.backgroundImage = `url("${img.src}")`;
    placeholder.style.backgroundSize = 'cover';
    // ... replace img with div
  }
});
```

### Proposed Simplification

If ALL images use `background-image` approach, this workaround is **no longer needed**.

**Benefits:**
- ✅ Simpler PDF export code
- ✅ No runtime DOM manipulation
- ✅ Consistent rendering web vs. PDF
- ✅ Eliminates `object-fit` distortion risk

---

## Image Metadata Requirements

### Chart Configuration Schema

```typescript
interface ImageChartConfiguration {
  chartId: string;
  type: 'image';
  title: string;
  subtitle?: string;
  emoji?: string;
  
  // NEW FIELDS
  aspectRatio: '16:9' | '9:16' | '1:1'; // MANDATORY
  
  elements: [{
    id: string;
    label: string;
    formula: string; // e.g., "stats.reportImage1"
    value?: string; // Resolved image URL
  }];
  
  // Layout settings (inherited from chart config)
  width?: number; // Grid units (auto-calculated from aspectRatio if not specified)
  order: number;
}
```

### Validation Rules

```typescript
// API validation (app/api/chart-config/route.ts)
if (chartData.type === 'image') {
  if (!chartData.aspectRatio) {
    return NextResponse.json(
      { error: 'Image charts must specify aspectRatio (16:9, 9:16, or 1:1)' },
      { status: 400 }
    );
  }
  
  if (!['16:9', '9:16', '1:1'].includes(chartData.aspectRatio)) {
    return NextResponse.json(
      { error: 'Invalid aspectRatio. Must be 16:9, 9:16, or 1:1' },
      { status: 400 }
    );
  }
}
```

---

## Migration Strategy

### Phase 1: Add Aspect Ratio Field
- [ ] Update `lib/chartConfigTypes.ts` with `aspectRatio` field
- [ ] Add database migration script to add `aspectRatio` to existing image charts (default: `'16:9'`)
- [ ] Update Chart Algorithm Manager UI with aspect ratio selector

### Phase 2: Implement Width Calculation
- [ ] Create utility function `calculateImageWidth(aspectRatio)`
- [ ] Update `UnifiedDataVisualization.tsx` to use calculated widths
- [ ] Add automatic width assignment when `aspectRatio` is set

### Phase 3: Convert to Background-Image Rendering
- [ ] Update `components/charts/ImageChart.tsx` to use `background-image`
- [ ] Update `components/charts/ImageChart.module.css` with background styles
- [ ] Remove `object-fit: cover` workaround from `lib/export/pdf.ts`
- [ ] Test PDF export with new rendering method

### Phase 4: Documentation & Testing
- [ ] Update `ARCHITECTURE.md` with image layout system
- [ ] Add examples to `USER_GUIDE.md`
- [ ] Test all aspect ratio combinations in reports
- [ ] Verify PDF export matches screen rendering

---

## Open Questions & Decisions Needed

### 1. Square Image Width: 1.8 vs 2 units?
**Options:**
- **1.8 units**: Mathematically precise (1.78× rounded)
- **2 units**: Cleaner grid math, easier to work with

**Recommendation:** Use **2 units** for simplicity unless visual precision requires 1.8.

### 2. Should aspect ratio be auto-detected from image URL?
**Consideration:** Could fetch image metadata to auto-set aspect ratio.

**Recommendation:** **Manual selection** ensures admin control and avoids async overhead.

### 3. What happens if admin sets wrong aspect ratio?
**Example:** Portrait image marked as landscape.

**Options:**
- **Respect admin choice**: Image crops to fit aspect ratio (may lose content)
- **Auto-correct**: Detect actual ratio and override

**Recommendation:** **Respect admin choice** with visual preview in Chart Manager.

### 4. Default aspect ratio for new image charts?
**Recommendation:** **16:9 (Landscape)** as most common use case.

---

## Success Criteria

### Definition of Done

1. ✅ **Aspect Ratio System Implemented**
   - Admin can select 16:9, 9:16, or 1:1 for any image chart
   - Grid widths auto-calculate: Portrait (1), Square (2), Landscape (3)

2. ✅ **Consistent Row Heights**
   - All items in same row have identical heights
   - Tallest element determines row height
   - Charts flex to match image heights

3. ✅ **WYSIWYG PDF Export**
   - PDF output matches screen rendering exactly
   - No image distortion or aspect ratio changes
   - Background-image method works flawlessly

4. ✅ **Clean Implementation**
   - No hardcoded aspect ratio calculations
   - Design tokens used for all spacing/sizing
   - Strategic comments explain WHAT/WHY/HOW

5. ✅ **Documentation Complete**
   - ARCHITECTURE.md updated with image system
   - USER_GUIDE.md includes aspect ratio examples
   - RELEASE_NOTES.md documents changes

---

## References

### Related Files
- `components/charts/ImageChart.tsx` - Image chart component
- `components/UnifiedDataVisualization.tsx` - Grid layout system
- `lib/export/pdf.ts` - PDF export with image handling
- `lib/chartConfigTypes.ts` - Chart configuration types
- `app/api/chart-config/route.ts` - Chart validation API

### Related Documentation
- `ARCHITECTURE.md` - Visualization grid system (lines 867-875)
- `CODING_STANDARDS.md` - Image distortion prohibition (lines 103-121)
- `WARP.md` - Chart system overview

---

*Document Status: DRAFT - Awaiting technical review and approval*
