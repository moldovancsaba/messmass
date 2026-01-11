# Image Layout Guide - Common Patterns
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version**: 10.3.2  
**Last Updated**: 2026-01-11T22:28:38.000Z (UTC)

## Overview

This guide provides recommended width settings for common layout patterns when mixing images, text, and other chart types in the same row within Admin Visualization blocks.

## Important: Width Units System

MessMass uses **fractional (fr) units** for responsive grid layouts:
- Width values represent proportions, not absolute pixels
- Total row width is divided based on the sum of all widths
- Example: `3.16fr + 10fr = 13.16fr total` → Portrait gets 24%, Landscape gets 76%

---

## 📐 Aspect Ratio Height Calculation

**For IMAGE charts with CSS aspect-ratio**:

```
Box Height = Box Width × (Aspect Height / Aspect Width)

Portrait (9:16): Height = Width × (16/9) = Width × 1.778
Landscape (16:9): Height = Width × (9/16) = Width × 0.5625
Square (1:1): Height = Width × (1/1) = Width × 1.000
```

---

## 🖼️ Common Layout Patterns

### Pattern 1: Portrait + Landscape (Equal Heights)

**Use Case**: Side-by-side mixed aspect ratio images with matching heights

**Setup**:
- **Portrait (9:16)**: Width **3.16** units
- **Landscape (16:9)**: Width **10** units

**Result**:
- Portrait height: 3.16 × 1.778 = **5.618 units**
- Landscape height: 10 × 0.5625 = **5.625 units**
- Difference: **0.007 units (0.12%)** — visually perfect ✅

**Mathematical Basis**:
```
W₁ = W₂ × (9/16) × (9/16)
W₁ = 10 × 0.31640625 = 3.1640625 ≈ 3.16
```

**Visual Preview**:
```
┌─────────┐ ┌────────────────────────────┐
│         │ │                            │
│ 9:16    │ │         16:9               │
│ Portrait│ │       Landscape            │
│         │ │                            │
│         │ │                            │
└─────────┘ └────────────────────────────┘
  3.16 units       10 units
```

---

### Pattern 2: Landscape + Landscape (Equal Heights)

**Use Case**: Two landscape images side-by-side

**Setup**:
- **Landscape 1 (16:9)**: Width **5** units
- **Landscape 2 (16:9)**: Width **5** units

**Result**:
- Both heights: 5 × 0.5625 = **2.8125 units** — automatically equal ✅

**Visual Preview**:
```
┌─────────────────┐ ┌─────────────────┐
│                 │ │                 │
│    16:9         │ │    16:9         │
│   Landscape     │ │   Landscape     │
│                 │ │                 │
└─────────────────┘ └─────────────────┘
    5 units              5 units
```

---

### Pattern 3: Portrait + Portrait (Equal Heights)

**Use Case**: Two portrait images side-by-side

**Setup**:
- **Portrait 1 (9:16)**: Width **3** units
- **Portrait 2 (9:16)**: Width **3** units

**Result**:
- Both heights: 3 × 1.778 = **5.334 units** — automatically equal ✅

**Visual Preview**:
```
┌──────┐ ┌──────┐
│      │ │      │
│ 9:16 │ │ 9:16 │
│      │ │      │
│      │ │      │
│      │ │      │
│      │ │      │
└──────┘ └──────┘
3 units   3 units
```

---

### Pattern 4: Text + Portrait (Height Matching)

**Use Case**: Text chart next to portrait image

**Setup**:
- **Text Chart**: Width **6** units
- **Portrait (9:16)**: Width **3** units

**Result**:
- Text adapts to available height (no aspect-ratio constraint)
- Portrait height: 3 × 1.778 = **5.334 units**
- Text fills same row height automatically ✅

**Visual Preview**:
```
┌────────────────────┐ ┌──────┐
│                    │ │      │
│  Text Content      │ │ 9:16 │
│  Text adapts to    │ │      │
│  row height        │ │      │
│                    │ │      │
└────────────────────┘ └──────┘
      6 units          3 units
```

---

### Pattern 5: Landscape + Text (Height Matching)

**Use Case**: Landscape image with accompanying text

**Setup**:
- **Landscape (16:9)**: Width **6** units
- **Text Chart**: Width **4** units

**Result**:
- Landscape height: 6 × 0.5625 = **3.375 units**
- Text fills same row height automatically ✅

**Visual Preview**:
```
┌─────────────────────┐ ┌──────────┐
│                     │ │          │
│      16:9           │ │   Text   │
│    Landscape        │ │  Content │
│                     │ │          │
└─────────────────────┘ └──────────┘
      6 units              4 units
```

---

### Pattern 6: Text + Landscape + Text (Sandwich Layout)

**Use Case**: Landscape image with text on both sides

**Setup**:
- **Text Left**: Width **2** units
- **Landscape (16:9)**: Width **6** units
- **Text Right**: Width **2** units

**Result**:
- Landscape height: 6 × 0.5625 = **3.375 units**
- Both text blocks adapt to same height ✅

**Visual Preview**:
```
┌────┐ ┌─────────────────┐ ┌────┐
│    │ │                 │ │    │
│Text│ │      16:9       │ │Text│
│    │ │    Landscape    │ │    │
│    │ │                 │ │    │
└────┘ └─────────────────┘ └────┘
2 units     6 units        2 units
```

---

### Pattern 7: Three Portraits (Equal Heights)

**Use Case**: Three vertical portrait images in a row

**Setup**:
- **Portrait 1 (9:16)**: Width **2** units
- **Portrait 2 (9:16)**: Width **2** units
- **Portrait 3 (9:16)**: Width **2** units

**Result**:
- All heights: 2 × 1.778 = **3.556 units** — automatically equal ✅

**Visual Preview**:
```
┌────┐ ┌────┐ ┌────┐
│    │ │    │ │    │
│9:16│ │9:16│ │9:16│
│    │ │    │ │    │
│    │ │    │ │    │
└────┘ └────┘ └────┘
2 units 2 units 2 units
```

---

### Pattern 8: Single Full-Width Landscape

**Use Case**: Hero image spanning full width

**Setup**:
- **Landscape (16:9)**: Width **10** units (or any single value)

**Result**:
- Fills entire row width
- Height: 10 × 0.5625 = **5.625 units**

**Visual Preview**:
```
┌────────────────────────────────────┐
│                                    │
│            16:9 Landscape          │
│           Full Width Hero          │
│                                    │
└────────────────────────────────────┘
              10 units
```

---

### Pattern 9: KPI + Portrait + KPI (Dashboard Style)

**Use Case**: Portrait image with KPI metrics on sides

**Setup**:
- **KPI Left**: Width **2** units
- **Portrait (9:16)**: Width **3** units
- **KPI Right**: Width **2** units

**Result**:
- Portrait height: 3 × 1.778 = **5.334 units**
- KPIs adapt to same height (centered vertically) ✅

**Visual Preview**:
```
┌────┐ ┌──────┐ ┌────┐
│ 📊 │ │      │ │ 📈 │
│KPI │ │ 9:16 │ │KPI │
│850 │ │      │ │92% │
│    │ │      │ │    │
└────┘ └──────┘ └────┘
2 units  3 units 2 units
```

---

### Pattern 10: Portrait + Landscape + Portrait (Symmetrical)

**Use Case**: Landscape centered between two portraits

**Setup**:
- **Portrait Left (9:16)**: Width **3.16** units
- **Landscape (16:9)**: Width **10** units
- **Portrait Right (9:16)**: Width **3.16** units

**Result**:
- All heights approximately **5.62 units** — visually balanced ✅
- Total: 16.32 units (distributes proportionally)

**Visual Preview**:
```
┌──────┐ ┌────────────────────┐ ┌──────┐
│      │ │                    │ │      │
│ 9:16 │ │       16:9         │ │ 9:16 │
│      │ │     Landscape      │ │      │
│      │ │                    │ │      │
└──────┘ └────────────────────┘ └──────┘
  3.16        10 units           3.16
```

---

## 🎯 Quick Reference Table

| Layout Pattern | Chart 1 | Chart 2 | Chart 3 | Total Units |
|----------------|---------|---------|---------|-------------|
| **Portrait + Landscape** | 9:16, W=3.16 | 16:9, W=10 | — | 13.16 |
| **Landscape + Landscape** | 16:9, W=5 | 16:9, W=5 | — | 10 |
| **Portrait + Portrait** | 9:16, W=3 | 9:16, W=3 | — | 6 |
| **Text + Portrait** | Text, W=6 | 9:16, W=3 | — | 9 |
| **Landscape + Text** | 16:9, W=6 | Text, W=4 | — | 10 |
| **Text + Landscape + Text** | Text, W=2 | 16:9, W=6 | Text, W=2 | 10 |
| **Three Portraits** | 9:16, W=2 | 9:16, W=2 | 9:16, W=2 | 6 |
| **Full Width Landscape** | 16:9, W=10 | — | — | 10 |
| **KPI + Portrait + KPI** | KPI, W=2 | 9:16, W=3 | KPI, W=2 | 7 |
| **Portrait + Landscape + Portrait** | 9:16, W=3.16 | 16:9, W=10 | 9:16, W=3.16 | 16.32 |

---

## 🔧 Implementation Steps

### Step 1: Navigate to Admin Visualization
1. Go to `/admin/visualization`
2. Click "Show Settings" on the block you want to edit

### Step 2: Add Charts to Block
1. Click the chart button (e.g., "📊 Image - Portrait Event Photo")
2. Chart appears in preview and control list

### Step 3: Set Width Units
1. Find the chart in the controls list
2. Select width from dropdown (e.g., "Width: 3.16 units" for portrait)
3. Preview updates instantly

### Step 4: Reorder Charts (Optional)
1. Charts display in the order they were added
2. To reorder: remove and re-add in desired sequence
3. Or use drag handle (if available)

### Step 5: Configure Aspect Ratios
1. Go to `/admin/charts` (Chart Algorithm Manager)
2. Edit the IMAGE chart configuration
3. Set `aspectRatio` field to `9:16`, `16:9`, or `1:1`
4. Save changes

---

## 📱 Responsive Behavior

### Desktop (1024px+)
- Uses configured fr unit widths
- Grid columns: Auto-calculated from chart widths

### Tablet (768px - 1023px)
- Auto-wraps to `repeat(auto-fit, minmax(300px, 1fr))`
- Charts reflow to fit available space

### Mobile (< 768px)
- Single column: `grid-template-columns: 1fr`
- All charts stack vertically

---

## 💡 Pro Tips

### Tip 1: Consistent Totals
Keep total units consistent across rows for visual harmony:
- Portrait + Landscape: 3.16 + 10 = **13.16 units**
- Text + Portrait: 6 + 3 = **9 units** ❌ Different total
- **Solution**: Use 10 + 3.16 = **13.16 units** for all rows

### Tip 2: Text Chart Flexibility
TEXT and KPI charts have no aspect-ratio constraints:
- They fill available height automatically
- Perfect for pairing with images

### Tip 3: Preview Before Committing
- Admin Visualization shows live preview
- Test different widths before finalizing
- Use "Show Settings" to toggle editor on/off

### Tip 4: Aspect Ratio Accuracy
- Verify image files are actually 9:16 or 16:9
- Mismatched ratios break height calculations
- Use image editing tools to crop before upload

### Tip 5: Gap Awareness
- 1.5rem gap (typically 24px) exists between charts
- Gap does NOT affect height calculations
- Gap is excluded from fr unit distribution

---

## 🐛 Troubleshooting

### Problem: Heights Don't Match

**Possible Causes**:
1. **Wrong aspect ratio selected** → Go to `/admin/charts`, verify aspectRatio field
2. **Image file aspect ratio mismatch** → Verify actual image dimensions
3. **Browser zoom not 100%** → Reset browser zoom to 100%
4. **Subpixel rounding** → Try 3.15 or 3.17 if 3.16 doesn't look perfect

### Problem: Charts Stack Vertically on Desktop

**Possible Causes**:
1. **Container too narrow** → Check parent container width
2. **Total units too high** → Reduce individual widths
3. **Responsive breakpoint triggered** → Check screen width (should be >1024px)

### Problem: Images Appear Distorted

**Possible Causes**:
1. **Wrong aspect ratio configured** → Match chart config to actual image
2. **`background-size: cover` cropping** → This is expected behavior, crops to fit
3. **Container aspect ratio mismatch** → Double-check CSS aspect-ratio value

---

## 📚 Related Documentation

- **WARP.md** - Development rules and image layout system overview
- **ARCHITECTURE.md** - Complete system architecture
- **CODING_STANDARDS.md** - CSS and styling standards
- **IMAGE_LAYOUT_SPECIFICATION.md** - Technical specification for aspect ratios
- **ASPECT_RATIO_DATA_FLOW_ANALYSIS.md** - Data flow for aspect ratio system

---

*Version: 10.3.0 | Last Updated: 2025-11-03T00:15:00.000Z (UTC) | Category: User Guide*
