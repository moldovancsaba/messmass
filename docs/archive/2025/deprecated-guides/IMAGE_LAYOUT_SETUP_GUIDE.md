# MessMass Image Layout Setup Guide
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 9.3.2  
**Date:** 2025-11-02  
**Purpose:** Step-by-step guide for configuring image aspect ratio layouts

---

## 📐 Grid Unit System

**Key Concept:** Images automatically consume grid units based on aspect ratio to maintain consistent row heights.

| Aspect Ratio | Type | Grid Units | Use Case |
|--------------|------|------------|----------|
| **9:16** | Portrait | **1 unit** | Vertical images, mobile-first |
| **1:1** | Square | **2 units** | Social media, balanced |
| **16:9** | Landscape | **3 units** | Horizontal, wide shots |

**Critical:** Aspect ratio determines width automatically. You do NOT manually set width in Visualization.

---

## 🎯 6 Layout Scenarios - Complete Setup

### **Scenario 1: Three Portrait Images (1+1+1)**

**Result:** 3 narrow portraits side-by-side (3 units total width)

#### Step 1: Charts Configuration (`/admin/charts`)
Create 3 separate image charts:

**Chart 1:**
- Chart ID: `reportImage1`
- Title: `Image 1` (or leave empty)
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `📱 Portrait (9:16) → 1 grid unit`
- Order: 1
- Active: ✅

**Chart 2:**
- Chart ID: `reportImage2`
- Title: `Image 2`
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `📱 Portrait (9:16) → 1 grid unit`
- Order: 2
- Active: ✅

**Chart 3:**
- Chart ID: `reportImage3`
- Title: `Image 3`
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `📱 Portrait (9:16) → 1 grid unit`
- Order: 3
- Active: ✅

#### Step 2: Visualization Block (`/admin/visualization`)
Create a data block:

**Block Settings:**
- Block Name: `Images - Three Portraits`
- **Grid Columns (Desktop)**: `3` ✅ **CRITICAL**
- Grid Columns (Tablet): `2`
- Grid Columns (Mobile): `1`
- Order: 1
- Active: ✅

**Add Charts to Block:**
- Chart 1: `reportImage1`, Order: 1, Width: `1` (ignored - auto from aspect ratio)
- Chart 2: `reportImage2`, Order: 2, Width: `1` (ignored)
- Chart 3: `reportImage3`, Order: 3, Width: `1` (ignored)

**Why Grid Columns = 3?** Because 1 + 1 + 1 = 3 total units

---

### **Scenario 2: Text (1 unit) + Square Image (2 units)**

**Result:** Left 1/3 text, right 2/3 square image (3 units total)

#### Step 1: Charts Configuration
**Text Chart:**
- Chart ID: `reportText1`
- Title: `Description`
- Type: `📝 Text Chart (1 element)`
- Element Formula: `[stats.reportText1]` (or custom text)
- Order: 1
- Active: ✅

**Image Chart:**
- Chart ID: `reportImage4`
- Title: `Square Image`
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `⬜ Square (1:1) → 2 grid units`
- Order: 2
- Active: ✅

#### Step 2: Visualization Block
**Block Settings:**
- Block Name: `Text + Square Image`
- **Grid Columns (Desktop)**: `3` ✅ **CRITICAL**
- Order: 2
- Active: ✅

**Add Charts:**
- Chart 1: `reportText1`, Order: 1, Width: `1`
- Chart 2: `reportImage4`, Order: 2, Width: `2` (ignored - auto from aspect ratio)

**Why Grid Columns = 3?** Because 1 + 2 = 3 total units

---

### **Scenario 3: Two Portrait Images (1+1)**

**Result:** 2 narrow portraits side-by-side (2 units total)

#### Step 1: Charts Configuration
- Use existing `reportImage1` and `reportImage2` from Scenario 1
- Both MUST have **Portrait (9:16)** aspect ratio

#### Step 2: Visualization Block
**Block Settings:**
- Block Name: `Two Portraits`
- **Grid Columns (Desktop)**: `2` ✅ **CRITICAL**
- Order: 3
- Active: ✅

**Add Charts:**
- Chart 1: `reportImage1`, Order: 1, Width: `1` (ignored)
- Chart 2: `reportImage2`, Order: 2, Width: `1` (ignored)

**Why Grid Columns = 2?** Because 1 + 1 = 2 total units

---

### **Scenario 4: Two Landscape Images (3+3)**

**Result:** 2 wide landscapes side-by-side (6 units total)

#### Step 1: Charts Configuration
Create 2 landscape image charts:

**Chart 1:**
- Chart ID: `reportImage5`
- Title: `Landscape 1`
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `🖼️ Landscape (16:9) → 3 grid units`
- Order: 1
- Active: ✅

**Chart 2:**
- Chart ID: `reportImage6`
- Title: `Landscape 2`
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `🖼️ Landscape (16:9) → 3 grid units`
- Order: 2
- Active: ✅

#### Step 2: Visualization Block
**Block Settings:**
- Block Name: `Two Landscapes`
- **Grid Columns (Desktop)**: `6` ✅ **CRITICAL**
- Order: 4
- Active: ✅

**Add Charts:**
- Chart 1: `reportImage5`, Order: 1, Width: `3` (ignored)
- Chart 2: `reportImage6`, Order: 2, Width: `3` (ignored)

**Why Grid Columns = 6?** Because 3 + 3 = 6 total units

---

### **Scenario 5: Three Square Images (2+2+2)**

**Result:** 3 squares side-by-side (6 units total)

#### Step 1: Charts Configuration
Create 3 square image charts:

**Chart 1:**
- Chart ID: `reportImage7`
- Title: `Square 1`
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `⬜ Square (1:1) → 2 grid units`
- Order: 1
- Active: ✅

**Chart 2:**
- Chart ID: `reportImage8`
- Title: `Square 2`
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `⬜ Square (1:1) → 2 grid units`
- Order: 2
- Active: ✅

**Chart 3:**
- Chart ID: `reportImage9`
- Title: `Square 3`
- Type: `🖼️ Image Chart (1 element)`
- **Image Aspect Ratio**: `⬜ Square (1:1) → 2 grid units`
- Order: 3
- Active: ✅

#### Step 2: Visualization Block
**Block Settings:**
- Block Name: `Three Squares`
- **Grid Columns (Desktop)**: `6` ✅ **CRITICAL**
- Order: 5
- Active: ✅

**Add Charts:**
- Chart 1: `reportImage7`, Order: 1, Width: `2` (ignored)
- Chart 2: `reportImage8`, Order: 2, Width: `2` (ignored)
- Chart 3: `reportImage9`, Order: 3, Width: `2` (ignored)

**Why Grid Columns = 6?** Because 2 + 2 + 2 = 6 total units

---

### **Scenario 6: Landscape (3) + Portrait (1)**

**Result:** Wide landscape left, narrow portrait right (4 units total)

#### Step 1: Charts Configuration
- Use existing `reportImage5` (Landscape 16:9)
- Use existing `reportImage1` (Portrait 9:16)

#### Step 2: Visualization Block
**Block Settings:**
- Block Name: `Landscape + Portrait`
- **Grid Columns (Desktop)**: `4` ✅ **CRITICAL**
- Order: 6
- Active: ✅

**Add Charts:**
- Chart 1: `reportImage5`, Order: 1, Width: `3` (ignored)
- Chart 2: `reportImage1`, Order: 2, Width: `1` (ignored)

**Why Grid Columns = 4?** Because 3 + 1 = 4 total units

---

## ⚠️ CRITICAL RULES

### 1. Grid Columns MUST Match Total Units
**Formula:** `Grid Columns = Sum of all chart units in the row`

**Examples:**
- 3 Portraits (1+1+1) → Grid Columns = **3**
- 2 Squares (2+2) → Grid Columns = **4**
- Landscape + Portrait (3+1) → Grid Columns = **4**

### 2. Aspect Ratio Auto-Calculates Width
**You do NOT manually set width in Visualization.**
- Portrait (9:16) → Automatically 1 unit
- Square (1:1) → Automatically 2 units
- Landscape (16:9) → Automatically 3 units

### 3. Chart Width Field is IGNORED
The "Width" field in Visualization block is **ignored** for image charts. Width comes from aspect ratio.

### 4. Maximum Grid Columns
**Desktop:** Up to 6 units recommended (fits 2 landscapes or 3 squares)
**Tablet:** Auto-clamps to 2 units
**Mobile:** Auto-clamps to 1 unit

---

## 🐛 Troubleshooting

### Problem: Images appear square when they should be portrait
**Solution:**
1. Go to `/admin/charts`
2. Edit the image chart
3. Verify **Image Aspect Ratio** is set to `📱 Portrait (9:16) → 1 grid unit`
4. Click **Update** (modal stays open to verify)
5. Click **Save** (modal closes)
6. Go to `/admin/visualization`
7. Verify Grid Columns = sum of units
8. Refresh stats page with **Cmd+Shift+R** (hard refresh)

### Problem: Charts don't fit in row / overflow
**Solution:**
1. Calculate total units: Count each chart's aspect ratio units
   - Portrait = 1
   - Square = 2
   - Landscape = 3
2. Set Grid Columns to match total
3. Example: 1 Landscape + 2 Portraits = 3 + 1 + 1 = **5 Grid Columns**

### Problem: Aspect ratio saves but doesn't display
**Solution:**
1. Check browser console for logs:
   - `🖼️ [IMAGE CHART DEBUG]` - Shows aspect ratio value
   - `✅ [ASPECT RATIO APPLIED]` - Confirms calculation
2. If aspect ratio is missing, re-save chart in `/admin/charts`
3. Hard refresh stats page (Cmd+Shift+R)

---

## 📊 Quick Reference Table

| Layout | Charts | Aspect Ratios | Grid Columns |
|--------|--------|---------------|--------------|
| 3 Portraits | 3 images | 9:16, 9:16, 9:16 | **3** |
| Text + Square | 1 text, 1 image | -, 1:1 | **3** |
| 2 Portraits | 2 images | 9:16, 9:16 | **2** |
| 2 Landscapes | 2 images | 16:9, 16:9 | **6** |
| 3 Squares | 3 images | 1:1, 1:1, 1:1 | **6** |
| Landscape + Portrait | 2 images | 16:9, 9:16 | **4** |

---

## 🔧 Current Known Issues

1. **Title/Emoji Toggle Bug**: Unchecking "Show Title" deletes title text instead of hiding it (Issue #TBD)
2. **Validation Error**: "Please fill in Chart ID and Title" appears when trying to hide title (Issue #TBD)

**Workaround:** Keep titles/emojis enabled for now until fixes are deployed.

---

**Last Updated:** 2026-01-11T22:28:38.000Z  
**Version:** 9.3.1  
**Author:** Warp AI Assistant
