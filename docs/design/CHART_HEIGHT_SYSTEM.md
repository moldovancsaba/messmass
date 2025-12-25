# Chart Block Height System

## Overview

Chart blocks consist of **three independent layers** that stack vertically:

```
┌─────────────────────────┐
│  Title (4rem fixed)     │ ← Alignment layer (optional)
├─────────────────────────┤
│  Subtitle (2rem fixed)  │ ← Alignment layer (optional)
├─────────────────────────┤
│  Chart Graphic Area     │ ← Calculated height (our system)
│  (calculated dynamically)│
└─────────────────────────┘
```

## Chart Graphic Area Height Calculation

### Rules (Desktop)

The **chart graphic area** height is calculated based on the total grid units in a block:

| Total Units | Height Multiplier | Formula | Example Result |
|-------------|-------------------|---------|----------------|
| 1 unit      | 0.5×             | `unitWidth × 0.5` | 2:1 aspect ratio |
| 2 units     | 1×               | `unitWidth × 1` | 2:1 aspect ratio |
| 3 units     | 1×               | `unitWidth × 1` | 3:1 aspect ratio |
| 4 units     | 1.5×             | `unitWidth × 1.5` | Individual 1-unit elements: 2:3 |
| 5+ units    | 1.5×             | `unitWidth × 1.5` | Individual 1-unit elements: 2:3 |

### Calculation Steps

1. **Calculate unit width**: `unitWidth = blockWidth / totalUnits`
2. **Get multiplier**: Based on total units (see table above)
3. **Calculate height**: `chartHeight = unitWidth × multiplier`
4. **Apply caps**: 
   - Minimum: 200px
   - Maximum: 800px or 80vh (whichever is smaller)

### Example

**Scenario**: Block with 4 units, container width = 1200px

```javascript
unitWidth = 1200 / 4 = 300px
heightMultiplier = 1.5 (for 4 units)
chartHeight = 300 × 1.5 = 450px
```

**Result**: Each chart graphic area = 450px tall

## Title & Subtitle Heights (Alignment)

When alignment is enabled (`alignTitles` or `alignDescriptions`):

- **Title area**: `4rem` (or `minElementHeight` if specified)
- **Subtitle area**: `2rem` (or `0.5 × minElementHeight`)
- **Gap between sections**: `0.75rem`

### Total Block Height

```
Total = titleHeight + subtitleHeight + chartHeight + (2 × gap)
```

Example with alignment enabled:
```
Total = 4rem + 2rem + 450px + (2 × 0.75rem)
Total = 6rem + 450px + 1.5rem
Total = 7.5rem + 450px ≈ 570px (assuming 1rem = 16px)
```

## Implementation Files

### Core Utility
- **`lib/chartHeightCalculator.ts`** - Height calculation logic
  - `getHeightMultiplier(totalUnits)` - Returns multiplier for unit count
  - `calculateBlockHeight(blockWidth, totalUnits, maxHeight)` - Full calculation
  - `getHeightCalculationDebug()` - Debug info

### Application
- **`components/UnifiedDataVisualization.tsx`** - Applies height to blocks
  - Uses `calculateBlockHeight()` in ResizeObserver
  - Sets `--block-chart-height` CSS variable
  - Grid layout with three distinct rows: title, subtitle, chart

### CSS Structure

```css
.chart-item {
  display: grid;
  grid-template-rows: 
    4rem                          /* Title */
    2rem                          /* Subtitle */
    var(--block-chart-height)     /* Chart graphic - CALCULATED */
  ;
  gap: 0.75rem;
  height: auto; /* Sum of all three sections */
}

/* Chart graphic containers use exact calculated height */
.chartGraphicArea,
.pieChartSide,
.barChartSide,
.kpiContainer {
  height: var(--block-chart-height) !important;
  min-height: 200px;
  max-height: 80vh;
}
```

## Debug Console Output

When charts load, the console shows detailed calculation info:

```javascript
📊 Block height calc: {
  blockWidth: 1200,
  totalUnits: 4,
  unitWidth: 300,
  heightMultiplier: 1.5,
  targetHeight: 450,
  aspectRatio: "4:1.5",
  finalHeight: "450px",
  capped: false
}
```

## Chart Types

### Standard Charts (use calculated height)
- **KPI**: Single metric display
- **PIE**: Circular segments
- **BAR**: Horizontal bars

All standard charts share the same calculated height within a block.

### Aspect Ratio Charts (use native ratio)
- **IMAGE**: Uses `aspectRatio` from configuration (16:9, 9:16, 1:1)
- **TEXT**: Uses natural text flow

These charts maintain their aspect ratio and don't use the calculated height.

## Responsive Behavior

### Tablet (< 1024px)
- Grid auto-wraps at 300px minimum width
- Height calculation continues to work per-row

### Mobile (< 768px)
- Single column layout (all charts full width)
- Height calculation adjusts to mobile width
- Each chart still maintains proper aspect ratio

## Best Practices

1. **Consistent unit widths**: Use similar unit patterns across blocks for visual harmony
2. **Alignment on**: Enable title/subtitle alignment for professional reports
3. **Mixed layouts**: Combine different unit counts (1, 2, 3, 4+) for variety
4. **Monitor debug**: Check console logs to verify height calculations

## Migration Notes

- ✅ **Backward compatible**: Existing charts work unchanged
- ✅ **Opt-in alignment**: Title/subtitle alignment is optional
- ✅ **Auto-calculation**: Heights update automatically on resize
- ✅ **No manual CSS**: All height logic is centralized

---

**Version**: 11.35.1  
**Last Updated**: 2025-12-18  
**Status**: Production Ready
