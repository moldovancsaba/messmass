# KPI Chart Cell Layout Analysis (v12.0.0)
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

## Cell Dimensions: 435px width × 445px height

### Grid Layout Structure

The KPI Chart uses a **3-row grid layout** with CSS proportions:

```css
.kpiContent {
  display: grid;
  grid-template-rows: 3fr 4fr 3fr;  /* Icon:Value:Title = 30%:40%:30% */
  height: 100%;
  width: 100%;
  gap: 0;
}
```

---

## EXACT PIXEL CALCULATIONS FOR 435×445px CELL

### Row Heights (3fr:4fr:3fr ratio)

The grid divides 445px by total fractions (3+4+3=10):

1. **Icon Row (3fr)**: `445 × (3/10) = 133.5px` → **133px**
2. **Value Row (4fr)**: `445 × (4/10) = 178px` → **178px**
3. **Title Row (3fr)**: `445 × (3/10) = 133.5px` → **133px**

**Total**: 133 + 178 + 133 = 444px (1px rounding tolerance)

---

## LAYOUT ZONES WITH EXACT PIXEL POSITIONS

### 1. ICON ROW (Position: Y=0 to Y=133)

| Property | Value | Notes |
|----------|-------|-------|
| **Y Position** | 0px | Top of cell |
| **Height** | 133px | 30% of cell height |
| **Width** | 435px | Full cell width |
| **X Offset** | 0px | Spans full width |

#### Icon Rendering Inside Icon Row:

The `.kpiIconRow` container is **133px tall** and uses:

```css
.kpiIconRow {
  display: flex;
  align-items: center;      /* Vertical center */
  justify-content: center;  /* Horizontal center */
  container-type: size;     /* Enable container queries */
}

.kpiIcon {
  font-size: clamp(2rem, 90cqh, 6rem);  /* 90% of icon row height */
  /* ... other styles ... */
}
```

**Icon Font Size Calculation:**
- **Container query height**: 133px (the icon row)
- **90% of 133px**: 119.7px container query height
- **clamp()** function: min=2rem(32px), preferred=90cqh(119.7px), max=6rem(96px)
- **Result**: Font-size = **96px** (capped at max because 119.7px > 96px)

**Icon Position Inside Row:**
- **X (Horizontal)**: Center at 217.5px (435px ÷ 2)
- **Y (Vertical)**: Center at 66.5px (133px ÷ 2) **relative to row**
- **Y (Absolute)**: 66.5px **relative to cell**
- **Size**: 96px × 96px (Material Icon)
- **Boundaries**: X range [170px to 265px], Y range [19px to 114px]

---

### 2. VALUE ROW (Position: Y=133 to Y=311)

| Property | Value | Notes |
|----------|-------|-------|
| **Y Position** | 133px | Below icon row |
| **Height** | 178px | 40% of cell height |
| **Width** | 435px | Full cell width |
| **X Offset** | 0px | Spans full width |

#### Value Display Inside Value Row:

The `.kpiValue` container is **178px tall** and uses:

```css
.kpi .kpiValue {
  display: flex;
  align-items: center;      /* Vertical center */
  justify-content: center;  /* Horizontal center */
  width: 100%;
  height: 100%;
  font-size: clamp(1.5rem, min(20cqh, 25cqw), 6rem);
  font-weight: bold;
  line-height: 0.85;        /* Tighter for impact */
  white-space: nowrap;      /* Single line */
  text-overflow: ellipsis;  /* Truncate if needed */
}
```

**Value Font Size Calculation:**
- **Container query height**: 178px (value row)
- **20% of 178px**: 35.6px (20cqh)
- **Container query width**: 435px
- **25% of 435px**: 108.75px (25cqw)
- **min(35.6px, 108.75px)**: 35.6px
- **clamp()** function: min=1.5rem(24px), preferred=35.6px, max=6rem(96px)
- **Result**: Font-size = **35.6px** ≈ **36px**

**Value Position Inside Row:**
- **X (Horizontal)**: Center at 217.5px (435px ÷ 2)
- **Y (Vertical)**: Center at 89px (178px ÷ 2) **relative to row**
- **Y (Absolute)**: 133px + 89px = **222px** **relative to cell**
- **Width**: 435px (minus ellipsis truncation)
- **Boundaries**: X range [0px to 435px], Y range [133px to 311px]

**Text Rendering:**
- **Font Size**: 36px
- **Line Height**: 0.85 × 36px = **30.6px** → **30px**
- **Baseline Y**: 222px + (36px × 0.42 baseline ratio) = **237px**

---

### 3. TITLE ROW (Position: Y=311 to Y=444)

| Property | Value | Notes |
|----------|-------|---|
| **Y Position** | 311px | Below value row |
| **Height** | 133px | 30% of cell height |
| **Width** | 435px | Full cell width |
| **X Offset** | 0px | Spans full width |
| **Padding** | var(--mm-space-2) = 8px | Side padding |
| **Content Width** | 419px | 435px - 16px (8px × 2) |

#### Title Display Inside Title Row:

The `.kpiTitle` container is **133px tall** and uses:

```css
.kpi .kpiTitle {
  display: -webkit-box;
  -webkit-line-clamp: 2;              /* Max 2 lines */
  -webkit-box-orient: vertical;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
  font-size: clamp(0.75rem, 9cqh, 1.125rem);
  font-weight: medium;
  color: var(--chartLabelColor);      /* #4b5563 */
  line-height: 1.1;
  padding: var(--mm-space-2);         /* 8px */
}
```

**Title Font Size Calculation:**
- **Container query height**: 133px (title row)
- **9% of 133px**: 11.97px (9cqh)
- **clamp()** function: min=0.75rem(12px), preferred=11.97px, max=1.125rem(18px)
- **Result**: Font-size = **12px** (min is used because 11.97px < 12px)

**Title Position Inside Row:**
- **X (Horizontal)**: Center at 217.5px (435px ÷ 2)
- **Y (Vertical)**: Center at 66.5px (133px ÷ 2) **relative to row**
- **Y (Absolute)**: 311px + 66.5px = **377.5px** **relative to cell**
- **Width**: 419px (435px - 16px padding)
- **Boundaries**: X range [8px to 427px], Y range [311px to 444px]

**Text Rendering (2 lines max):**
- **Font Size**: 12px
- **Line Height**: 1.1 × 12px = **13.2px** → **13px per line**
- **Max Text Height**: 13px × 2 = 26px (within 133px row)
- **Vertical Center**: Text baseline approximately at 377.5px

---

## ALIGNMENT GUARANTEES

### How the System Secures VALUE Alignment Across Cells in a Block

**Problem**: Different values have different widths (e.g., "100" vs "1,234,567"), but they must align within their cells.

**Solution: Flex-Based Centering**

```css
.kpi .kpiValue {
  display: flex;
  align-items: center;      /* ← Vertical center (always) */
  justify-content: center;  /* ← Horizontal center (always) */
  width: 100%;              /* ← Fill full cell width */
  height: 100%;             /* ← Fill full cell height */
  text-align: center;       /* ← Backup center alignment */
}
```

**Result**:
- ✅ Values are **always centered** horizontally within the 435px width
- ✅ Values are **always centered** vertically within the 178px height
- ✅ Flex container properties guarantee alignment regardless of text width
- ✅ `white-space: nowrap` + `text-overflow: ellipsis` prevent wrapping
- ✅ All cells in the block have **identical row heights** (178px for values)

### How the System Secures ICON Alignment Across Cells in a Block

**Problem**: Icons need to be visually centered and vertically aligned across different cells.

**Solution: Icon Row Container Queries**

```css
.kpiIconRow {
  display: flex;
  align-items: center;      /* ← Vertical center (always) */
  justify-content: center;  /* ← Horizontal center (always) */
  height: 100%;             /* ← Fill full row (133px) */
  width: 100%;              /* ← Fill full cell width (435px) */
  container-type: size;     /* ← Enable container queries */
}

.kpiIcon {
  font-size: clamp(2rem, 90cqh, 6rem);  /* ← 90% of row height = 119.7px → capped at 96px */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Result**:
- ✅ Icons are **always centered** horizontally within the 435px width
- ✅ Icons are **always centered** vertically within the 133px icon row
- ✅ Container queries ensure icon scales with **row height**, not cell width
- ✅ 90cqh (container query height) = 90% of 133px = responsive scaling
- ✅ All cells in the block have **identical icon rows** (133px)
- ✅ Material Icon `display: flex` + `align-items/justify-content: center` ensures perfect centering

---

## ABSOLUTE POSITIONING TABLE FOR 435×445px CELL

| Zone | Component | Y Position | Height | X Position | Width | Font Size | Notes |
|------|-----------|-----------|--------|-----------|-------|-----------|-------|
| **Icon Row** | `.kpiIconRow` | 0px | 133px | 0px | 435px | — | Flex centered |
| **Icon Row** | Icon (Material) | 19px | 96px | 170px | 96px | **96px** | Centered |
| **Value Row** | `.kpiValue` | 133px | 178px | 0px | 435px | **36px** | Centered |
| **Value Text** | Number/Value | ~222px | ~30px | 0px | 435px | **36px** | Line height: 30px |
| **Title Row** | `.kpiTitle` | 311px | 133px | 8px | 419px | **12px** | Max 2 lines |
| **Title Text** | Title | ~377px | ~26px | 8px | 419px | **12px** | Line height: 13px/line |

---

## PRACTICAL EXAMPLE: Rendering "Total Fans" = 1,254

For a cell 435×445px with title "Total Fans" and value 1,254:

```
┌─────────────────────────────────────────────┐  Y=0
│                                             │
│                 📊 (Icon)                   │  Y=66px (centered in icon row)
│            Font-size: 96px                  │  Icon Row (Y=0 to Y=133)
│                                             │
├─────────────────────────────────────────────┤  Y=133
│                                             │
│                   1,254                     │  Y=222px (centered in value row)
│              Font-size: 36px                │  Value Row (Y=133 to Y=311)
│                                             │
├─────────────────────────────────────────────┤  Y=311
│                                             │
│              Total Fans                     │  Y=377px (centered in title row)
│              Font-size: 12px                │  Title Row (Y=311 to Y=444)
│              (max 2 lines)                  │
│                                             │
└─────────────────────────────────────────────┘  Y=445
  0px                                        435px
```

---

## RESPONSIVE SCALING

When the cell size changes (e.g., 600px width or different row height):

### Icon Scaling Example: 600×445px cell (same height)
- Icon row: 600 × (3/10) = 180px
- Icon font-size: `clamp(2rem, 90cqh, 6rem)` = clamp(32px, 162px, 96px) = **96px** (still capped)

### Value Scaling Example: 600×445px cell
- Value row: 600 × (4/10) = 178px (height unchanged)
- Value font-size: `clamp(1.5rem, min(20cqh, 25cqw), 6rem)` = clamp(24px, min(35.6px, 150px), 96px) = **35.6px** (unchanged)

### Title Scaling Example: 600×445px cell
- Title row: 600 × (3/10) = 180px (height unchanged)
- Title font-size: `clamp(0.75rem, 9cqh, 1.125rem)` = clamp(12px, 16.2px, 18px) = **16.2px** (grows)

---

## DESIGN TOKEN REFERENCES

All colors and spacing use CSS variables:

```css
/* Icon Color */
--kpiIconColor: var(--mm-color-primary-600) = #2563eb (Blue)

/* Title/Label Color */
--chartLabelColor: var(--mm-gray-600) = #4b5563 (Dark Gray)

/* Value Color */
--chartValueColor: var(--mm-gray-900) = #111827 (Near Black)

/* Spacing (padding in title row) */
--mm-space-2: 8px (0.5rem)
```

---

## KEY ALIGNMENT PRINCIPLES

### ✅ Value Alignment (Horizontal + Vertical)
- Uses `display: flex` + `align-items: center` + `justify-content: center`
- Works for ANY value width (100 vs 1,234,567)
- All cells in block share identical **row heights** (178px)
- Flex container ensures **perfect centering** within row

### ✅ Icon Alignment (Horizontal + Vertical)
- Uses `display: flex` + `align-items: center` + `justify-content: center`
- Uses **container queries** (90cqh) for responsive scaling
- All cells in block share identical **icon row heights** (133px)
- Icon sizing is **proportional to row height**, not cell width

### ✅ Title Alignment (Horizontal + Vertical)
- Uses `text-align: center` + flex centering
- Max 2 lines with `-webkit-line-clamp: 2`
- All cells in block share identical **title row heights** (133px)
- Padding provides breathing room (8px sides)

---

## SECURITY MECHANISMS

| Mechanism | Purpose | Implementation |
|-----------|---------|-----------------|
| **Flex Centering** | Align values regardless of width | `justify-content: center` |
| **Container Queries** | Scale icons with row height | `font-size: clamp(2rem, 90cqh, 6rem)` |
| **Row Height Determinism** | Guarantee consistent spacing | CSS Grid `3fr 4fr 3fr` |
| **Line Clamping** | Limit text overflow | `-webkit-line-clamp: 2` |
| **Overflow Handling** | Truncate long values/titles | `text-overflow: ellipsis` |
| **100% Fill** | Ensure cells use full available space | `width: 100%; height: 100%` |

---

## SUMMARY

For a **435×445px KPI cell**:

- **Icon Zone**: Y=[0-133px], X=[0-435px], Icon Size=96×96px, centered
- **Value Zone**: Y=[133-311px], X=[0-435px], Font-size=36px, centered
- **Title Zone**: Y=[311-445px], X=[8-427px], Font-size=12px, centered
- **All alignment** uses flex-based centering + container queries
- **All cells in a block** have identical dimensions = perfectly aligned rows

