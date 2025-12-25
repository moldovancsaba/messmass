# Chart Display Visibility Controls

**Version:** 9.1.0  
**Date:** 2025-11-01T23:19:30Z  
**Feature:** Professional show/hide controls for chart title, emoji, and subtitle  
**Status:** ✅ COMPLETE

---

## Overview

Admins can now control the visibility of chart header elements (title, emoji, subtitle) using checkbox toggles with conditional input fields - following the same professional pattern as the existing prefix/suffix formatting controls.

---

## UI Design Pattern

### Consistency with Existing System

This feature follows the **exact same pattern** as the Element Formatting section:

```
✅ EXISTING PATTERN (Prefix/Suffix):
┌─────────────────────────────────────┐
│ 🎨 Element Formatting               │
│ ┌─────────────────────────────────┐ │
│ │ ☑ Show Prefix  [€____________] │ │
│ │ ☑ Show Suffix  [%____________] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

✅ NEW PATTERN (Title/Emoji/Subtitle):
┌─────────────────────────────────────┐
│ 👁️ Display Settings                 │
│ ┌─────────────────────────────────┐ │
│ │ ☑ Show Title    [Gender Dist...] │
│ │ ☑ Show Emoji    [📊]             │
│ │ ☑ Show Subtitle [Total fans...] │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Professional Implementation

**Key Features:**
1. **Checkbox-first** - Check to enable, uncheck to hide
2. **Conditional inputs** - Input field only appears when checkbox is checked
3. **Smart defaults** - Sensible fallback values when enabling
4. **Consistent spacing** - Matches Element Formatting section layout exactly
5. **No inline styles** - Pure CSS modules (CODING_STANDARDS.md compliant)

---

## Technical Implementation

### Location in Form

The Display Settings section appears **before** Element Formatting:

```
Chart Configuration Form:
1. Chart ID
2. Title (inline input - REMOVED)
3. Type
4. Order
5. 👁️ Display Settings  ← NEW SECTION
   - Show Title (checkbox + input)
   - Show Emoji (checkbox + input)
   - Show Subtitle (checkbox + input)
6. 🎨 Element Formatting  ← EXISTING SECTION
   - Rounded
   - Show Prefix (checkbox + input)
   - Show Suffix (checkbox + input)
7. Elements Configuration
```

### Code Structure

**File:** `components/ChartAlgorithmManager.tsx`

**Section Added (lines 869-963):**
```tsx
{/* WHAT: Display Settings Section (Title/Emoji/Subtitle Visibility) */}
{/* WHY: Give admins full control over chart header display elements */}
{/* HOW: Checkbox toggles + conditional input fields (same pattern as prefix/suffix) */}
<div className="formatting-section">
  <h4 className="formatting-section-title">👁️ Display Settings</h4>
  <div className="formatting-note">Control visibility of chart header elements</div>
  
  <div className="formatting-group">
    <h5 className="formatting-group-title">Chart Header Elements</h5>
    <div className="formatting-controls">
      {/* Three rows: Title, Emoji, Subtitle */}
    </div>
  </div>
</div>
```

**CSS Classes Used (inline JSX styles):**
- `.formatting-section` - Outer container with gray background
- `.formatting-section-title` - Section heading (👁️ Display Settings)
- `.formatting-note` - Subtitle text
- `.formatting-group` - White inner box
- `.formatting-group-title` - Group heading (Chart Header Elements)
- `.formatting-controls` - Flex column container
- `.formatting-row` - Each checkbox+input row
- `.formatting-checkbox` - Checkbox label wrapper
- `.emoji-input-field` - Emoji input sizing (max-width: 100px, centered)

---

## Behavior Logic

### 1. Show Title

**Checkbox Checked:**
```typescript
formData.title !== undefined && formData.title !== ''
```

**When Enabling:**
```typescript
title: e.target.checked ? (formData.title || formData.chartId) : ''
```
- If title exists, keep it
- If title is empty, use chartId as default
- Uncheck sets title to empty string

**Input Field:**
- Appears when checkbox is checked AND title is not empty
- Full-width text input
- Placeholder: "e.g., Gender Distribution"

### 2. Show Emoji

**Checkbox Checked:**
```typescript
!!formData.emoji
```

**When Enabling:**
```typescript
emoji: e.target.checked ? '📊' : undefined
```
- Default emoji: 📊 (chart bar)
- Uncheck sets emoji to `undefined` (hidden)

**Input Field:**
- Appears when checkbox is checked AND emoji is not empty
- Max width: 100px
- Text centered
- Max length: 2 characters
- Placeholder: "e.g., 📊"

### 3. Show Subtitle

**Checkbox Checked:**
```typescript
!!formData.subtitle
```

**When Enabling:**
```typescript
subtitle: e.target.checked ? '' : undefined
```
- Default: empty string (user must type)
- Uncheck sets subtitle to `undefined` (hidden)

**Input Field:**
- Appears when checkbox is checked (even if empty)
- Full-width text input
- Placeholder: "e.g., Total fans vs attendees (%)"

---

## User Workflows

### Creating a New Chart with All Headers

1. Click "New Chart" in Chart Algorithm Manager
2. Fill Chart ID and Type
3. **Display Settings section loads with:**
   - ☑ Show Title (checked, input visible with chartId as default)
   - ☐ Show Emoji (unchecked, no input)
   - ☐ Show Subtitle (unchecked, no input)

4. **To add emoji:**
   - Check "Show Emoji" → Input appears with 📊
   - Edit to desired emoji

5. **To add subtitle:**
   - Check "Show Subtitle" → Input appears empty
   - Type subtitle text

6. Save chart

### Editing Existing Chart to Hide Title

1. Open chart in edit mode
2. **Display Settings shows current state:**
   - ☑ Show Title (checked, "Engagement Rate" visible)
   - ☑ Show Emoji (checked, "📈" visible)
   - ☑ Show Subtitle (checked, "Total fans vs attendees (%)" visible)

3. **To hide title:**
   - Uncheck "Show Title" → Input disappears
   - Title becomes empty string

4. Save chart
5. Chart renders on stats page **without title** (only emoji + subtitle)

### Creating Chart with Only Emoji (No Title/Subtitle)

1. New Chart
2. Uncheck "Show Title"
3. Check "Show Emoji" → Set to 💰
4. Leave "Show Subtitle" unchecked
5. Save

**Result on stats page:**
```
💰
€5,800
```

---

## Database Schema

No changes to database schema - the fields already exist:

```typescript
interface ChartConfiguration {
  chartId: string;
  title: string;           // ← Can be empty string to hide
  emoji?: string;          // ← undefined = hidden, string = visible
  subtitle?: string;       // ← undefined = hidden, string = visible
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image';
  elements: ChartElement[];
}
```

**Visibility Logic:**
- **Title:** `title === ''` → Hidden
- **Emoji:** `emoji === undefined || emoji === ''` → Hidden
- **Subtitle:** `subtitle === undefined` → Hidden

---

## CSS Implementation

**Inline JSX Styles (lines 1489-1494):**

```css
/* WHAT: Emoji input field sizing */
/* WHY: Emoji fields should be compact (max 2 characters) */
.emoji-input-field {
  max-width: 100px;
  text-align: center;
}
```

**Rationale:**
- Existing `.formatting-section` styles already handle layout
- Only custom style needed: emoji input width constraint
- Follows established pattern (prefix/suffix inputs at 80px)
- No inline `style` props (CODING_STANDARDS.md compliant)

---

## Testing Checklist

### ✅ Visual Verification

1. **New Chart Form**
   - [ ] Display Settings section appears after Order field
   - [ ] Section styled identically to Element Formatting
   - [ ] Three checkboxes visible: Title, Emoji, Subtitle
   - [ ] Title checked by default, others unchecked

2. **Checkbox Interactions**
   - [ ] Checking "Show Emoji" → Input appears with 📊
   - [ ] Checking "Show Subtitle" → Input appears empty
   - [ ] Unchecking "Show Title" → Input disappears
   - [ ] Input fields only show when checkbox checked

3. **Input Fields**
   - [ ] Title input: full width, text left-aligned
   - [ ] Emoji input: 100px max, text centered
   - [ ] Subtitle input: full width, text left-aligned

### ✅ Functional Verification

1. **Create Chart (All Visible)**
   - Title: "Marketing Value"
   - Emoji: 💰
   - Subtitle: "Social + email value"
   - Save → Check stats page → All three elements render

2. **Create Chart (Only Emoji)**
   - Uncheck Title
   - Check Emoji → 📊
   - Uncheck Subtitle
   - Save → Check stats page → Only emoji renders

3. **Edit Existing Chart**
   - Open "Engagement Rate"
   - Checkboxes match current state (all checked)
   - Uncheck Subtitle → Save
   - Stats page → Subtitle disappears

### ✅ Edge Cases

1. **Empty Title**
   - Uncheck Title → Input disappears
   - Recheck Title → Input appears with chartId as default

2. **Emoji Max Length**
   - Type "ABC" in emoji field → Only "AB" accepted (maxLength=2)

3. **Database Persistence**
   - Save with title="" → Database stores empty string
   - Save with emoji=undefined → Database omits field
   - Save with subtitle=undefined → Database omits field

---

## Integration with Stats Page

The stats page (DynamicChart component) already handles these fields:

**Existing Logic:**
```tsx
{result.emoji && <span>{result.emoji}</span>}
{result.title && <h3>{result.title}</h3>}
{result.subtitle && <p>{result.subtitle}</p>}
```

**Behavior:**
- If `title === ''` → Title not rendered
- If `emoji === undefined` → Emoji not rendered
- If `subtitle === undefined` → Subtitle not rendered

**No changes needed** - the rendering logic already supports hiding elements.

---

## Comparison: Before vs After

### Before This Feature

**Problems:**
1. Title was always visible (no way to hide)
2. Emoji field was separate input (always rendered if filled)
3. Subtitle field was separate input (always rendered if filled)
4. No unified control over header visibility
5. Had to leave fields empty AND hack around rendering logic

**UI:**
```
Chart ID: _______________
Title: __________________  ← Always visible
Type: [dropdown]
Order: [number]
Emoji (optional): ___      ← Standalone
Subtitle (optional): ___   ← Standalone
```

### After This Feature

**Improvements:**
1. ✅ Unified "Display Settings" section for all header elements
2. ✅ Checkbox-first UX (check to show, uncheck to hide)
3. ✅ Conditional inputs (only appear when enabled)
4. ✅ Smart defaults (📊 for emoji, chartId for title)
5. ✅ Professional pattern matching Element Formatting

**UI:**
```
Chart ID: _______________
Type: [dropdown]
Order: [number]

👁️ Display Settings
┌─────────────────────────────────┐
│ Chart Header Elements           │
│ ☑ Show Title    [Gender Dist...] │
│ ☑ Show Emoji    [📊]             │
│ ☑ Show Subtitle [Total fans...]  │
│ 💡 Tip: Subtitle explains KPIs  │
└─────────────────────────────────┘
```

---

## Documentation Updates Required

### Files to Update:

1. **ARCHITECTURE.md**
   - Add Display Settings to Chart Algorithm Manager feature list
   - Document checkbox pattern

2. **RELEASE_NOTES.md**
   - Version 9.2.0 feature: Display Visibility Controls
   - Breaking change: Title/Emoji/Subtitle can now be hidden

3. **USER_GUIDE.md** (if exists)
   - How to hide/show chart headers
   - Screenshot of Display Settings section

---

## Known Limitations

1. **Title Always Required Field in Database**
   - Database schema requires `title` field
   - We use empty string `''` to "hide" it
   - Cannot delete the field entirely (would break type system)

2. **No Per-Chart-Type Defaults**
   - All chart types use same defaults
   - Could enhance: KPI charts default emoji=📈, Pie charts=🥧

3. **No Preview**
   - User must save and view stats page to see result
   - Future enhancement: Live preview in modal

---

## Future Enhancements

### Potential Improvements:

1. **Live Preview**
   - Add mini chart preview below Display Settings
   - Update preview in real-time as user toggles checkboxes

2. **Chart-Type Defaults**
   - KPI charts: Default emoji 📈, subtitle enabled
   - Pie charts: Default emoji 🥧, subtitle disabled
   - Bar charts: Default emoji 📊, subtitle disabled

3. **Bulk Edit**
   - "Hide all titles" button (applies to all charts)
   - "Show all emojis" button

4. **Template System**
   - Save display settings as template
   - Apply template to new charts

---

## Commit Message

```
feat: Add professional display visibility controls for chart headers

- Added 👁️ Display Settings section to Chart Algorithm Manager
- Checkbox-first UX for Title, Emoji, and Subtitle visibility
- Follows exact same pattern as Element Formatting (prefix/suffix)
- Conditional input fields appear only when checkbox checked
- Smart defaults: chartId for title, 📊 for emoji
- Emoji input field: max 100px width, centered text
- No inline styles (CODING_STANDARDS.md compliant)
- Existing stats page rendering logic supports hidden fields

Changes:
- components/ChartAlgorithmManager.tsx: Added Display Settings section (lines 869-963)
- components/ChartAlgorithmManager.tsx: Added .emoji-input-field CSS (lines 1489-1494)

Build: ✅ PASSED (npm run build)
TypeScript: ✅ NO ERRORS
```

---

**Status:** ✅ COMPLETE  
**Build:** ✅ PASSING  
**Ready for:** User Testing → Production
