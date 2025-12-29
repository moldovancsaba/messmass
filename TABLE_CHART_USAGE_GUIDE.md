# Table Chart Usage Guide

## Step-by-Step Setup

### 1. Create KYC Variable ✅

**Variable Type:** `textarea` (Multi-line text content)

**Why TEXTAREA?**
- TEXTAREA is designed for multi-line content (like markdown tables)
- TEXT is for single-line text only
- TEXTAREA variables appear in Manual mode editor

**Steps:**
1. Go to **Admin → KYC** (Variable Management)
2. Click **"Create Variable"**
3. Fill in:
   - **Name:** `szerencsejatekTop10` (camelCase, no `stats.` prefix)
   - **Label:** "Szerencsejáték Top 10" (display name)
   - **Type:** `textarea` ← **IMPORTANT: Must be TEXTAREA**
   - **Category:** Choose appropriate category
   - **Flags:**
     - ✅ `visibleInClicker`: false (tables are not clicker-friendly)
     - ✅ `editableInManual`: true ← **MUST BE TRUE**
4. Click **Save**

### 2. Edit Variable in Clicker/Manual Mode ✅

**Where to Edit:**
- Go to **Clicker/Editor Dashboard** (project edit page)
- Switch to **"Manual" mode** (not Clicker mode)
- Find your variable `szerencsejatekTop10` in the appropriate category
- You'll see a **TextareaField** (multi-line text input)

**How to Enter Table:**
1. Paste your markdown table into the textarea:

```markdown
| Rank | Name | Value |
|------|------|-------|
| 1    | Item 1 | 100 |
| 2    | Item 2 | 200 |
| 3    | Item 3 | 300 |
```

2. Click outside the field or press Enter to save
3. The value is saved to `project.stats.szerencsejatekTop10`

**Note:** Table charts are NOT visible in Builder Mode. They only appear on the final report page.

### 3. Create Table Chart ✅

**Steps:**
1. Go to **Admin → Charts** (Chart Algorithm Manager)
2. Click **"Create Chart"** or edit existing chart
3. Fill in:
   - **Chart ID:** `szerencse-top10` (kebab-case, unique identifier)
   - **Title:** "Szerencsejáték Top 10" (display title)
   - **Type:** `table` ← **Select "📋 Table Chart (1 element)"**
   - **Elements:** 
     - **Element 1:**
       - **Label:** "Table Content" (not used for tables)
       - **Formula:** `szerencsejatekTop10` OR `stats.szerencsejatekTop10`
         - Both formats work: `szerencsejatekTop10` or `stats.szerencsejatekTop10`
         - The system automatically strips `stats.` prefix if present
4. Click **Save**

**Formula Format:**
- ✅ `szerencsejatekTop10` (simple format - recommended)
- ✅ `stats.szerencsejatekTop10` (with prefix - also works)
- ❌ `[szerencsejatekTop10]` (brackets not needed for simple variables)
- ❌ `[stats.szerencsejatekTop10]` (brackets not needed)

### 4. Add Chart to Report Template ✅

**Steps:**
1. Go to **Admin → Report Templates** (or Report Config)
2. Find your report template (or create one)
3. Go to the **Data Blocks** section
4. Find or create a **Data Block** where you want the table
5. In the block's **Charts** array, add:
   ```json
   {
     "chartId": "szerencse-top10",
     "width": 2,
     "order": 0
   }
   ```
   - `chartId`: Must match the Chart ID from step 3
   - `width`: 2 (tables use 2 grid units like text charts)
   - `order`: Display order within the block

6. Save the template

### 5. View on Report ✅

**Steps:**
1. Go to the **Report page** for your project
2. The table should appear in the configured data block
3. If it doesn't appear, check the troubleshooting section below

## Troubleshooting

### Table Not Showing on Report

**Check 1: Variable has content**
- Go to Clicker/Editor Dashboard → Manual mode
- Find `szerencsejatekTop10`
- Verify it has markdown table content
- If empty, add content and save

**Check 2: Chart formula is correct**
- Go to Admin → Charts
- Edit chart `szerencse-top10`
- Verify Element 1 formula is: `szerencsejatekTop10` or `stats.szerencsejatekTop10`
- Save if changed

**Check 3: Chart is in report template**
- Go to Admin → Report Templates
- Edit your template
- Verify the chart `szerencse-top10` is in a data block's charts array
- Save if changed

**Check 4: Chart is active**
- Go to Admin → Charts
- Edit chart `szerencse-top10`
- Verify **"Is Active"** checkbox is checked
- Save if changed

**Check 5: Variable flags**
- Go to Admin → KYC
- Find variable `szerencsejatekTop10`
- Verify `editableInManual` is **true**
- If false, edit variable and enable it

**Check 6: Browser console**
- Open browser DevTools (F12)
- Go to Console tab
- Look for errors related to:
  - Chart calculation
  - Variable access
  - Table rendering

### Table Shows But Empty

**Cause:** Variable exists but has no content

**Fix:**
1. Go to Clicker/Editor Dashboard → Manual mode
2. Find `szerencsejatekTop10`
3. Add markdown table content
4. Save

### Table Shows But Not Formatted

**Cause:** Invalid markdown table syntax

**Fix:** Use correct markdown table syntax:
```markdown
| Header 1 | Header 2 | Header 3 |
|---------|---------|---------|
| Cell 1  | Cell 2  | Cell 3  |
| Cell 4  | Cell 5  | Cell 6  |
```

**Alignment:**
- Left: `|:---|`
- Center: `|:---:|`
- Right: `|---:|`

### Variable Not Visible in Manual Mode

**Cause:** `editableInManual` flag is false

**Fix:**
1. Go to Admin → KYC
2. Find variable `szerencsejatekTop10`
3. Click Edit
4. Check **"Editable in Manual"** checkbox
5. Save

## Markdown Table Syntax

### Basic Table
```markdown
| Header 1 | Header 2 | Header 3 |
|---------|---------|---------|
| Cell 1  | Cell 2  | Cell 3  |
| Cell 4  | Cell 5  | Cell 6  |
```

### With Alignment
```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| A    | B      | C     |
| D    | E      | F     |
```

### With Markdown in Cells
```markdown
| Name | Description |
|------|-------------|
| Item 1 | **Bold** text |
| Item 2 | *Italic* text |
| Item 3 | [Link](https://example.com) |
```

## Quick Reference

| Step | Location | Action |
|------|----------|--------|
| 1. Create Variable | Admin → KYC | Create `textarea` variable |
| 2. Edit Content | Clicker → Manual Mode | Paste markdown table |
| 3. Create Chart | Admin → Charts | Create `table` chart |
| 4. Add to Template | Admin → Report Templates | Add chart to data block |
| 5. View Report | Report Page | Table appears automatically |

## Common Mistakes

❌ **Using TEXT instead of TEXTAREA**
- TEXT is single-line only
- TEXTAREA is required for multi-line markdown tables

❌ **Using brackets in formula**
- Wrong: `[szerencsejatekTop10]`
- Correct: `szerencsejatekTop10`

❌ **Variable not editable in Manual**
- Must set `editableInManual: true` in KYC

❌ **Chart not in template**
- Chart must be added to a data block's charts array

❌ **Invalid markdown syntax**
- Must use pipes `|` and dashes `---`
- Header separator row is required

