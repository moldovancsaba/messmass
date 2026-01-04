# Report Layout System (Spec v2.0)

**Version:** 11.46.1  
**Last Updated:** 2026-01-02  
**Status:** Complete (Phase 1: 2025-12-19, Phase 2: 2025-12-25, Phase 3: 2025-12-25, Phase 4: 2026-01-02)

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
- **Layout Structure:** 3 vertical sections (30:40:30 ratio)
  - **Top (30%):** Title zone (centered, max 2 lines)
  - **Middle (40%):** Pie chart (Chart.js Doughnut)
  - **Bottom (30%):** Legends (centered horizontally, vertically centered in space)
- **Legend Alignment:** Centered horizontally (not left-aligned)
- **Legend Items:** Centered within legend container, auto-width (not full-width)

### BAR
- Body: Legends and chart side-by-side (horizontal)

### KPI
- Body: Icon + value + description (stacked vertically)

### TEXT
- **Body:** Text content with full markdown support
- **Markdown Support:** All CommonMark features (headings h1-h6, lists, bold, italic, links, blockquotes, code blocks, strikethrough, horizontal rules, GFM)
- **Dynamic Font Sizing:** Largest possible font size (max 4rem) that fills available space without overflow
- **Algorithm:** "Fill space" algorithm maximizes vertical fill, allows 5% overflow tolerance for better fill, then clamps
- **Alignment:** Center-aligned by design (except code blocks for readability)
- **Overflow:** `overflow: hidden` (no scrolling per Layout Grammar)

### IMAGE
- **Body:** Image content with preserved aspect ratio
- **Aspect Ratio Detection:** Uses actual image dimensions (`naturalWidth`/`naturalHeight`) detected on load
- **Dynamic Aspect Ratio:** CSS custom property `--image-aspect-ratio` set from actual image dimensions
- **Fallback:** If image not loaded, uses configured aspect ratio (16:9, 9:16, or 1:1)
- **Rendering:** `object-fit: contain` ensures full image visible without cropping

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
- `lib/blockHeightCalculator.ts` - Solves height H from image constraints (uses design tokens)
- `lib/fontSyncCalculator.ts` - Binary search for optimal font sizes
- `lib/textFontSizeCalculator.ts` - Calculates optimal font size for text charts (max 4rem)

**Renderer:**
- `app/report/[slug]/ReportContent.tsx` - Main grid renderer with deterministic sizing
- `app/report/[slug]/ReportChart.tsx` - Individual chart renderer (KPI, PIE, BAR, TEXT, IMAGE, TABLE)
- `components/CellWrapper.tsx` - 3-zone cell wrapper (title, subtitle, body)

### How It Works

1. **Block Configuration:** `groupChartsIntoRows()` ensures all charts in a block are in one row (blocks never break)
2. **Grid Calculation:** `calculateGridColumns()` creates dynamic `grid-template-columns` from sum of chart widths (e.g., `1fr 2fr 1fr`)
3. **Height Solver:** `solveBlockHeightWithImages()` calculates H from image aspect ratios and cell distribution (uses design tokens: `--mm-block-height-min`, `--mm-block-height-max`, `--mm-block-height-default`)
4. **Font Calculator:** `calculateSyncedFontSizes()` finds optimal sizes for titles/subtitles using binary search
5. **Font Application:** Font sizes passed as props (`titleFontSize`, `subtitleFontSize`) to chart components → `CellWrapper` (inline styles, not CSS variables)
6. **Image Aspect Ratio:** Images detect actual dimensions on load, set `--image-aspect-ratio` CSS custom property
7. **Text Sizing:** `calculateOptimalFontSize()` maximizes font size to fill available space (max 4rem)
8. **Result:** Deterministic, overflow-free layout with no scrolling, no truncation, no clipping (Layout Grammar compliant)

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

## Phase 4 Completion (v11.46.1 - 2026-01-02)

### Blocks Never Break ✅
**WHAT**: All charts in a block are rendered in a single horizontal row  
**WHY**: Layout Grammar requirement - blocks are horizontal containers that never break into multiple lines  
**HOW**: `groupChartsIntoRows()` returns all charts as a single row array

**Implementation**:
- **ReportContent.tsx**: `groupChartsIntoRows()` always returns `[charts]` (single row)
- **Grid System**: Dynamic `grid-template-columns` based on sum of chart widths (e.g., `1fr 2fr 1fr`)
- **No 12-Column Grid**: Removed fixed 12-column grid system, uses dynamic fr units

### PIE Chart Layout Reordering ✅
**WHAT**: PIE chart sections reordered: Title (top) → Pie (middle) → Legends (bottom, centered)  
**WHY**: User requirement for better visual hierarchy  
**HOW**: 3-zone vertical layout (30:40:30 ratio) with centered legends

**Implementation**:
- **ReportChart.tsx**: PIE chart uses `pieGrid` with 3 sections:
  - `pieTitleRow` (30%): Title at top
  - `pieChartContainer` (40%): Pie chart in middle
  - `pieLegend` (30%): Legends at bottom, centered horizontally
- **Legend Alignment**: Changed from `justify-content: flex-start` to `justify-content: center`
- **Legend Width**: Changed from `width: 100%` to `width: auto` for proper centering

### Image Aspect Ratio Detection ✅
**WHAT**: Images detect actual dimensions on load and use real aspect ratio  
**WHY**: Use actual image aspect ratio instead of configured one  
**HOW**: `onLoad` handler reads `naturalWidth`/`naturalHeight`, sets `--image-aspect-ratio` CSS custom property

**Implementation**:
- **ReportChart.tsx**: `ImageChart` component detects image dimensions on load
- **CSS Custom Property**: `--image-aspect-ratio` set from actual dimensions
- **Fallback**: Uses configured aspect ratio if image not loaded yet
- **Rendering**: `object-fit: contain` ensures full image visible without cropping

### Text Chart Markdown Support ✅
**WHAT**: Full CommonMark markdown support for text charts  
**WHY**: Allow rich text formatting in report texts  
**HOW**: `marked` library with GFM support, sanitized HTML output

**Implementation**:
- **lib/markdownUtils.ts**: Full CommonMark support (h1-h6, lists, bold, italic, links, blockquotes, code blocks, strikethrough, horizontal rules)
- **lib/sanitize.ts**: HTML sanitization with all markdown tags allowed
- **ReportChart.module.css**: Styles for all markdown elements, center-aligned (except code blocks)
- **Dynamic Font Sizing**: `calculateOptimalFontSize()` maximizes font size (max 4rem) to fill available space
- **Layout Grammar**: `overflow: hidden` (no scrolling), no truncation

### Design Token Integration ✅
**WHAT**: Block height calculation uses design tokens instead of hardcoded values  
**WHY**: No hardcoded sizes - all values must come from design system  
**HOW**: `getCSSVariableValue()` reads from `theme.css` CSS custom properties

**Implementation**:
- **lib/blockHeightCalculator.ts**: Uses `--mm-block-height-min`, `--mm-block-height-max`, `--mm-block-height-default`
- **app/report/[slug]/ReportContent.tsx**: Uses `--mm-row-width-default`, `--mm-row-height-default`, `--mm-title-font-size-default`, `--mm-subtitle-font-size-default`
- **app/styles/theme.css**: Design tokens defined for all default values
- **Fallbacks**: Server-side fallbacks only (SSR), client-side always uses design tokens

### Layout Grammar Compliance ✅
**WHAT**: All recent changes comply with Layout Grammar requirements  
**WHY**: Ensure no scrolling, no truncation, no clipping  
**HOW**: Verified against Layout Grammar specification

**Compliance Checklist**:
- ✅ **No Scrolling**: `overflow: hidden` on text charts, no `overflow: auto/scroll` on content layers
- ✅ **No Truncation**: No `text-overflow: ellipsis` or `line-clamp` on content (only on titles/subtitles with 2-line max)
- ✅ **No Clipping**: No `overflow: hidden` on content layers (only on decorative containers)
- ✅ **Deterministic Height**: `solveBlockHeightWithImages()` calculates height from image constraints
- ✅ **Unified Typography**: `calculateSyncedFontSizes()` ensures all titles/subtitles share same font size
- ✅ **Blocks Never Break**: All charts in block rendered in single row

## Future Enhancements

- Conditional CellWrapper rendering based on `blockLayoutMode` flag
- KPI value synchronization (`enableKPISync: true`)
- Title/subtitle height constraints (`titleHeight`, `subtitleHeight` props)
- Migration script for bulk template updates
- Admin preview with font size and height calculations visualized

---

*MessMass Layout System Documentation*  
*Version 11.46.1 | 2026-01-02 | Spec v2.0*
