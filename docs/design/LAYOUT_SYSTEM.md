# Report Layout System (Spec v2.0)

**Version:** 11.54.5  
**Status:** Complete (Phase 1: 2025-12-19, Phase 2: 2025-12-25, Phase 3: 2025-12-25)

## Overview

MessMass reports use a **deterministic block-based layout system** that ensures:
- All cells in a row share the same height (no uneven rows)
- Titles, subtitles, and KPI values use synchronized font sizes within blocks
- Image aspect ratios are preserved while maintaining row height consistency
- No content overflow or clipping

## Vocabulary

### Report
A vertical sequence of **blocks**.

### Block
A single row in the report layout.
- Has a fixed available width (e.g., 1200px on desktop)
- Has a computed height H shared by all cells in the block
- All cells inside share the same height

### Cell
The visual representation of a chart/content.
- Occupies a rectangular frame within a block
- Contains structured content (title | subtitle | body)
- Arranged horizontally inside blocks

## Cell Width Model

**Only two unit options:**
- **1-unit:** Compact/portrait layout
- **2-unit:** Detailed/landscape layout

All other unit options removed. Units define **relative width** only, not aspect ratio.

## Cell Structure (3 Zones)

Each cell is divided vertically:

1. **Title Zone** - Fixed height, centered, max 2 lines
2. **Subtitle Zone** - Fixed height, centered, max 2 lines  
3. **Body Zone** - Chart/content fills remaining space

## Chart Types

### PIE
- Body: Chart + legends below chart

### BAR
- Body: Legends and chart side-by-side (horizontal)

### KPI
- Body: Icon + value + description (stacked vertically)

### TEXT
- Body: Text content (scales to fill available space)

### IMAGE
- Body: Image content with preserved aspect ratio

## Alignment Rules (Within Block)

Across all cells in the same block:
- **Titles:** Same vertical top alignment, centered horizontally, **same font size**
- **Subtitles:** Same vertical top alignment, centered horizontally, **same font size**
- **Body zones:** Same vertical top alignment, centered horizontally, **same height**

## Global Scaling Rule

Every piece of content **scales to fit** its allocated space both vertically and horizontally.  
**Overflow is never allowed.**

## Font Synchronization (Block-Level)

### Titles
- All titles in a block use the **same font size**
- Words cannot be broken
- Text may wrap once (max 2 lines)
- Font size determined by **longest title** in block
- Must not overflow title zone

### Subtitles
- All subtitles in a block use the **same font size**
- Words cannot be broken
- Text may wrap once (max 2 lines)
- Font size determined by **longest subtitle** in block
- Must not overflow subtitle zone

### KPI Values
- All KPI values in a block use the **same font size**
- No wrapping, no word breaking
- Must fit max 8 characters

## IMAGE Cell Rules

- Image content has a **fixed aspect ratio** (16:9, 9:16, or 1:1)
- Cell frame has the **same aspect ratio** as the image
- Image scaled to maximum possible size inside frame
- Image scaling preserves aspect ratio
- No overflow

**Block-level constraint:** Sum of all cell widths must maintain a single shared block height while respecting image aspect ratios.

## TEXT Cell Rules

- TEXT cells do **not** have preset aspect ratios
- TEXT uses the same cell sizing system as KPI/BAR/PIE
- Font size **maximized** to fill available space
- Wrapping allowed, word breaking **not allowed**
- Content must never overflow

## Deterministic Height Calculation

### Example: Mixed Image Block

**Given:**
- Block width: 1200px
- Cells: IMAGE (16:9), TEXT, IMAGE (9:16)

**All cells share height H.**

**Step 1:** Define image aspect ratios
- Left image (16:9): a₁ = 16/9 ≈ 1.7778
- Right image (9:16): a₃ = 9/16 = 0.5625

Image width formula: `width = aspect_ratio × H`

**Step 2:** Allocate width for TEXT
- Fixed width for TEXT: 300px

**Step 3:** Solve for block height H

Total width equation:
```
(a₁ × H) + w_text + (a₃ × H) = 1200
```

Solve:
```
H = (1200 - 300) / (1.7778 + 0.5625)
H ≈ 384.57px
```

**Step 4:** Final cell sizes
- IMAGE 16:9: 684 × 385px
- TEXT: 300 × 385px
- IMAGE 9:16: 216 × 385px

**Result:** All cells exactly 385px tall, images preserve aspect ratios.

## Implementation

### Core Files

**Types:**
- `lib/chartConfigTypes.ts` - CellWidth (1|2), AspectRatio types
- `lib/blockLayoutTypes.ts` - Block/cell configuration interfaces

**Calculators:**
- `lib/aspectRatioResolver.ts` - Aspect ratio → numeric conversion
- `lib/blockHeightCalculator.ts` - Solves height H from image constraints
- `lib/fontSyncCalculator.ts` - Binary search for optimal font sizes

**Renderer:**
- `components/UnifiedDataVisualization.tsx` - Main grid renderer with deterministic sizing
- `components/CellWrapper.tsx` - 3-zone cell wrapper (optional explicit control)

### How It Works

1. **Grid reads block configuration** (charts, widths, aspect ratios)
2. **Height solver calculates H** from image aspect ratios
3. **Font calculator finds optimal sizes** for titles/subtitles/KPIs
4. **CSS variables injected** (`--mm-title-size`, `--mm-subtitle-size`, `--mm-kpi-size`)
5. **Cells rendered** at calculated height with synchronized fonts
6. **Result:** Deterministic, overflow-free layout

### Admin UI

**Width Selector** (`/admin/visualization`):
- Only shows: "1 unit (compact)" and "2 units (detailed)"
- Values >2 auto-clamped to 2
- Migration transparent to users

## Browser Compatibility

- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Uses CSS Grid, CSS variables, aspect-ratio property
- Fallback: natural heights if aspect-ratio unsupported

## PDF Export

PDF export automatically matches screen layout:
- Captures rendered DOM with deterministic sizing applied
- No special handling needed
- 1200px capture width maintains desktop layout

## Troubleshooting

### Uneven row heights
- Check: Are all charts in block using width ≤ 2?
- Check: Do IMAGE charts have valid aspectRatio field?
- Verify: Block CSS variables injected (`--mm-title-size`, etc.)

### Content overflow
- Check: Is text very long (>100 chars in title)?
- Verify: 2-line clamp applied (`.chartTitle { -webkit-line-clamp: 2; }`)
- Check: Body zone has `overflow: hidden;`

### Font sizes too small/large
- Check: Longest text in block (determines minimum size)
- Verify: Binary search calculator working (console logs in fontSyncCalculator)
- Adjust: `maxTitleLines` or `maxSubtitleLines` in template settings

### Images distorted
- Check: aspectRatio field matches actual image ratio
- Verify: Images use `background-size: cover` (not `<img>` with object-fit)
- Check: Cell frame aspect ratio matches image aspect ratio

## Migration from Legacy System

**Before (v11.35 and earlier):**
- Charts could use widths 1-10
- Arbitrary unit counts led to inconsistent layouts
- Font sizes independent per chart
- Row heights varied based on content

**After (v11.36.2):**
- Charts use widths 1-2 only
- Deterministic row heights from aspect ratios
- Block-level synchronized font sizes
- No overflow, predictable layouts

**Migration:**
- Existing charts with width >2 auto-clamped to 2
- No database changes required
- Templates continue working unchanged
- Gradual rollout via `blockLayoutMode` flag (optional)

## Phase 2 Completion (v11.54.4 - 2025-12-25)

### CellWrapper Integration ✅
**WHAT**: All chart components now use `CellWrapper` to enforce 3-zone structure  
**WHY**: Ensures title/subtitle/body alignment across all cells in a block  
**HOW**: Wrapped KPI, PIE, BAR, TEXT, and IMAGE chart bodies with `CellWrapper`

**Implementation**:
- **ReportChart.tsx**: Passes `blockHeight` prop to all chart components
- **Chart Components**: Moved titles from chart body to `CellWrapper.title` prop
- **3-Zone Structure**: Title zone + subtitle zone + body zone (chart content)

### Block Height Threading ✅
**WHAT**: Calculated block heights now passed from `ReportContent` to individual charts  
**WHY**: Enables charts to size themselves according to row height constraints  
**HOW**: `rowHeight` from `solveBlockHeightWithImages()` → `ReportChart` → chart components

**Data Flow**:
1. `ReportContent.ResponsiveRow`: Calculates `rowHeight` using `solveBlockHeightWithImages()`
2. `ReportContent`: Passes `blockHeight={rowHeight}` to `<ReportChart>`
3. `ReportChart`: Threads `blockHeight` prop to `KPIChart`, `PieChart`, etc.
4. **Chart Components**: Accept `blockHeight` prop (future: use for dynamic sizing)

### Admin UI Validation ✅
**WHAT**: Updated admin UI labels to reflect Spec v2.0 width constraints  
**WHY**: Prevent confusion about grid unit limits (max 2 units)  
**HOW**: Updated aspect ratio labels in `ChartAlgorithmManager` and `Visualization` admin

**Changes**:
- Landscape (16:9): "3 grid units" → "2 grid units"
- Square (1:1): "2 grid units" (unchanged)
- Portrait (9:16): "1 grid unit" (unchanged)
- Width selector: Only shows "1 unit" and "2 units" options
- Auto-clamping: `Math.min(Math.max(newWidth, 1), 2)` enforces [1, 2] range

## Phase 3 Completion (v11.54.5 - 2025-12-25)

### Font Synchronization Calculator ✅
**WHAT**: Integrated `fontSyncCalculator` to calculate synchronized font sizes across all cells in a block  
**WHY**: Ensures all titles share the same font size, all subtitles share the same font size  
**HOW**: Binary search algorithm finds optimal font sizes that fit all text within 2-line constraints

**Implementation**:
- **ReportContent.ResponsiveRow**: Calculates synced fonts using `calculateSyncedFontSizes(cells, width, options)`
- **Font Calculation**: Binary search between 10-28px for titles, 10-22px for subtitles
- **Options**: `maxTitleLines: 2`, `maxSubtitleLines: 2`, `enableKPISync: false` (not used yet)
- **State Management**: `titleFontSize` and `subtitleFontSize` state updated on width changes
- **Threading**: Font sizes passed from ReportContent → ReportChart → chart components → CellWrapper

**Data Flow**:
1. `ResponsiveRow`: Measures row width with ResizeObserver
2. Builds `CellConfiguration[]` with titles/subtitles from chart results
3. Calls `calculateSyncedFontSizes(cells, width, { maxTitleLines: 2, maxSubtitleLines: 2 })`
4. Returns `{ titlePx: number, subtitlePx: number }`
5. Passes font sizes to `<ReportChart titleFontSize={...} subtitleFontSize={...}>`
6. Chart components pass to `<CellWrapper titleFontSize={...} subtitleFontSize={...}>`
7. CellWrapper applies via inline styles: `style={{ fontSize: '${titleFontSize}px' }}`

### Dynamic Height Utilization ✅
**WHAT**: CellWrapper now accepts `blockHeight` prop for explicit height control  
**WHY**: Replaces `height: 100%` inheritance with deterministic pixel height  
**HOW**: Inline style on CellWrapper root div: `style={{ height: '${blockHeight}px' }}`

**Implementation**:
- **CellWrapper.tsx**: Added `blockHeight?: number` prop
- **Explicit Height**: `<div style={blockHeight ? { height: \`\${blockHeight}px\` } : undefined}>`
- **Threading**: `blockHeight` passed from ReportContent → ReportChart → chart components → CellWrapper
- **Fallback**: If `blockHeight` undefined, uses `height: 100%` from CSS (backward compatible)

**Benefits**:
- Deterministic sizing independent of parent container
- Explicit height prevents layout shifts during loading
- Consistent height enforcement across all chart types

### Per-Template Feature Flag ✅
**WHAT**: Existing `blockLayoutMode` field in ReportTemplate serves as feature flag  
**WHY**: Allow legacy templates to opt out if needed (future use)  
**HOW**: `blockLayoutMode: 'deterministic'` enables Spec v2.0, `'legacy'` disables

**Implementation**:
- **Template Field**: `blockLayoutMode?: 'legacy' | 'deterministic'` (line 48 in `reportTemplateTypes.ts`)
- **Current Behavior**: CellWrapper always used (backward compatible, no breaking changes)
- **Future Use**: Can conditionally render based on flag if legacy issues arise
- **Migration Path**: All new templates default to 'deterministic' mode

## Future Enhancements

- Conditional CellWrapper rendering based on `blockLayoutMode` flag
- KPI value synchronization (`enableKPISync: true`)
- Title/subtitle height constraints (`titleHeight`, `subtitleHeight` props)
- Migration script for bulk template updates
- Admin preview with font size and height calculations visualized

---

*MessMass Layout System Documentation*  
*Version 11.36.2 | 2025-12-19 | Spec v2.0*
