# Report Design System Plan

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Status:** Planning Phase

## Executive Summary

This document outlines a comprehensive design system for the MessMass report rendering system. Based on recent development experiences with text charts, font scaling, alignment, and markdown rendering, this plan establishes unified rules and patterns to ensure consistent, maintainable, and visually pleasing report layouts.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Recent Experiences & Lessons Learned](#recent-experiences--lessons-learned)
3. [Chart Layout System](#chart-layout-system)
4. [Typography System](#typography-system)
5. [Spacing & Alignment](#spacing--alignment)
6. [Responsive Behavior](#responsive-behavior)
7. [Implementation Strategy](#implementation-strategy)
8. [Migration Plan](#migration-plan)

---

## Core Principles

### 1. Consistency First
- All charts of the same type must behave identically
- Visual hierarchy must be consistent across all chart types
- Spacing, alignment, and sizing must follow unified rules

### 2. Vertical Alignment
- **CRITICAL RULE:** All chart elements must be vertically centered in their allocated space
- Title, content, legends, descriptions must align to the middle vertically
- Same-type elements (titles to titles, icons to icons) must align horizontally across charts in the same block

### 3. Responsive Scaling
- Font sizes must scale proportionally to available space
- Charts must maintain aspect ratios and readability at all sizes
- Container queries are the primary mechanism for responsive scaling

### 4. Content-First Design
- Content determines layout, not arbitrary rules
- Text should fill available space while maintaining readability
- Charts should adapt to content, not force content into fixed sizes

### 5. Unified Font Sizing
- All text charts in a block must use the same font-size
- Font-size is calculated to fit the largest content
- One chart fits maximally, all others use the same size

---

## Recent Experiences & Lessons Learned

### Text Chart Development Journey

#### Issue 1: Markdown Rendering
**Problem:** Markdown syntax (`**bold**`, `# heading`) was not rendering when HTML tags (`<br>`) were mixed in.

**Root Cause:** The `marked` parser treats content as HTML when HTML tags are present, skipping markdown parsing.

**Solution:** Pre-process input to temporarily replace HTML tags with placeholders, parse markdown, then restore HTML tags.

**Lesson:** Always handle mixed content types (markdown + HTML) explicitly.

#### Issue 2: Bold Text Not Rendering
**Problem:** `**text**` was displaying as literal asterisks instead of bold text.

**Root Cause:** 
- Double sanitization was removing parsed HTML
- `white-space: pre-wrap` was preventing HTML rendering

**Solution:** 
- Removed double sanitization (parseMarkdown already sanitizes)
- Changed `white-space` from `pre-wrap` to `normal`

**Lesson:** CSS whitespace handling can break HTML rendering. Sanitization should happen once, at the right place.

#### Issue 3: Headings Not Visible
**Problem:** Headings (`# text`) were parsed as `<h1>` but not displaying correctly.

**Root Cause:** CSS universal selector (`.textMarkdown > *`) was overriding h1 styles.

**Solution:** Added explicit `.textMarkdown h1` styles after universal selector with higher specificity.

**Lesson:** CSS specificity matters. Universal selectors need explicit overrides for specific elements.

#### Issue 4: Font Size Too Small
**Problem:** Text charts had plenty of space but font-size was capped at 1.5rem.

**Root Cause:** Conservative clamp values didn't utilize available space.

**Solution:** Increased max font-size to 2.5rem and improved container query scaling factors.

**Lesson:** Design system should maximize space utilization while maintaining readability.

#### Issue 5: Content Not Vertically Centered
**Problem:** Text content was top-aligned, not centered in the cell.

**Root Cause:** Block-level containers don't center by default.

**Solution:** Changed container to flexbox with `align-items: center` and `justify-content: center`.

**Lesson:** Vertical centering requires explicit flexbox or grid layout.

#### Issue 6: Unified Font-Size Calculation Not Working
**Problem:** Font-size calculation hook wasn't finding containers or calculating correctly.

**Root Cause:** 
- DOM not ready when calculation ran
- Container selectors too specific
- CSS custom property not applied correctly

**Solution:** 
- Added multiple fallback selector strategies
- Improved DOM readiness checks with retries
- Fixed CSS custom property syntax

**Lesson:** DOM measurement requires robust error handling and multiple fallback strategies.

#### Issue 7: Line Breaks Not Working
**Problem:** Enter key in markdown input wasn't creating line breaks.

**Root Cause:** Markdown parser needed `breaks: true` option, but paragraph renderer wasn't handling tokens correctly.

**Solution:** Fixed paragraph renderer signature to handle token objects correctly.

**Lesson:** Library APIs must be understood completely. Type mismatches cause silent failures.

### Key Takeaways

1. **CSS Specificity is Critical:** Universal selectors need explicit overrides
2. **DOM Timing Matters:** Measurement hooks need retry logic and fallbacks
3. **Mixed Content is Hard:** Markdown + HTML requires special handling
4. **Vertical Centering Needs Flexbox:** Block-level elements don't center by default
5. **Font Scaling Should Be Aggressive:** Use available space, don't be conservative
6. **One Sanitization Point:** Don't sanitize multiple times
7. **Container Queries Are Powerful:** Use them for responsive scaling

---

## Chart Layout System

### Universal Chart Structure

Every chart follows this structure:

```
.chart (base container)
├── .chartHeader (optional, fixed height)
│   ├── .chartTitle
│   ├── .chartIcon (optional)
│   └── .chartSubtitle (optional)
└── .chartBody (flexible, fills remaining space)
    └── [chart-specific content]
```

### Layout Rules

#### 1. Base Container (`.chart`)
```css
.chart {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--chartBackground);
  border-radius: var(--mm-radius-lg);
  box-shadow: var(--mm-shadow-sm);
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
  container-type: size; /* Enable container queries */
}
```

#### 2. Chart Header (`.chartHeader`)
- **Height:** Fixed, based on content (typically 30% max)
- **Alignment:** Vertically centered content
- **Padding:** `var(--mm-space-4) var(--mm-space-5)`
- **Border:** Bottom border for separation

#### 3. Chart Body (`.chartBody`)
- **Height:** Flexible, fills remaining space (`flex: 1`)
- **Alignment:** Vertically and horizontally centered
- **Padding:** `var(--mm-space-2)`
- **Min-height:** `0` to allow flex shrinking

### Chart-Specific Layouts

#### Text Chart
```
.text
├── .textTitleWrapper (30% max height)
│   └── .textTitleText
└── .textContentWrapper (70% min height, flexbox centered)
    └── .textContent (auto height, max 100%)
        └── .textMarkdown
```

**Key Rules:**
- Title wrapper: `max-height: 30%`
- Content wrapper: `display: flex`, `align-items: center`, `justify-content: center`
- Content: `height: auto`, `max-height: 100%`

#### KPI Chart
```
.kpi
├── .chartHeader
│   └── .chartTitle (vertically centered)
└── .chartBody
    └── .kpiValue (vertically and horizontally centered)
```

**Key Rules:**
- Title must be vertically centered in header
- Value must be vertically and horizontally centered in body

#### Pie Chart
```
.pie
├── .pieGrid (flex column)
│   ├── .pieTitleRow (30% flex basis)
│   ├── .pieChartContainer (40% flex basis, min-height: 100px)
│   └── .pieLegend (30% flex basis, min-height: 60px)
```

**Key Rules:**
- 3:4:3 ratio (title:chart:legend)
- Minimum heights prevent collapse
- Legend must be scrollable if content overflows

#### Bar Chart
```
.bar
├── .chartHeader
│   └── .barTitle
└── .chartBody
    └── .barElements (flex column, space-evenly)
        └── .barRow (flex: 1, grid layout)
```

**Key Rules:**
- Bars distributed evenly with `space-evenly`
- Each bar row gets equal vertical space

---

## Typography System

### Font Size Hierarchy

#### 1. Unified Text Chart Font-Size
**Rule:** All text charts in a block use the same font-size.

**Calculation:**
1. Measure all text chart containers in the block
2. Calculate optimal font-size for each (largest that fits)
3. Use minimum of all optimal sizes
4. Apply via CSS custom property: `--unified-text-font-size`

**Implementation:**
- Hook: `useUnifiedTextFontSize`
- Calculator: `calculateUnifiedFontSize`
- CSS: `font-size: var(--unified-text-font-size, fallback)`

#### 2. Responsive Font Scaling

**Base Formula:**
```css
font-size: clamp(min, responsive-value, max);
```

**Text Charts:**
- Min: `0.75rem` (12px)
- Responsive: `min(12cqh, 10cqw)`
- Max: `2.5rem` (40px)

**Titles:**
- Min: `0.9rem` (14.4px)
- Responsive: `2.6cqw`
- Max: `1.25rem` (20px)

**KPI Values:**
- Min: `1.5rem` (24px)
- Responsive: `min(15cqh, 12cqw)`
- Max: `3rem` (48px)

### Font Weight

- **Titles:** `var(--mm-font-weight-semibold)` (600)
- **Content:** `var(--mm-font-weight-semibold)` (600)
- **Bold Text:** `700`
- **Headings:** `700`

### Line Height

- **Titles:** `1.25`
- **Content:** `1.3`
- **Headings:** `1.2`

### Font Size Consistency Rules

1. **Same Type, Same Size:** All text charts in a block use the same font-size
2. **Inherit from Container:** Markdown elements inherit from `.textContent`
3. **No Size Variations:** h1, p, strong, em all use `1em` (same size)
4. **Only Weight/Style Differ:** Bold uses `font-weight: 700`, italic uses `font-style: italic`

---

## Spacing & Alignment

### Vertical Alignment Rules

#### CRITICAL: All Elements Must Be Vertically Centered

1. **Chart Body Content:**
   - Use flexbox: `display: flex`, `align-items: center`, `justify-content: center`
   - Content height: `auto` with `max-height: 100%`

2. **Chart Titles:**
   - Vertically centered in header
   - Use flexbox or line-height matching container height

3. **KPI Values:**
   - Vertically and horizontally centered
   - Use flexbox centering

4. **Pie Chart Elements:**
   - Title row: Vertically centered
   - Chart container: Vertically centered
   - Legend: Vertically centered with scroll if needed

### Horizontal Alignment Rules

1. **Same-Type Elements Align:**
   - All titles in a block align horizontally
   - All icons in a block align horizontally
   - All content areas align horizontally

2. **Text Alignment:**
   - Titles: Center
   - Content: Center
   - Lists: Left (for readability)

### Spacing Rules

1. **Title-Content Ratio:**
   - Text charts: 30% title, 70% content (fixed)
   - Other charts: Flexible based on content

2. **Element Margins:**
   - Headings: `0.5em` top and bottom
   - Paragraphs: `0.5em` bottom (last child: `0`)
   - Lists: `0.5em` top and bottom

3. **Container Padding:**
   - Header: `var(--mm-space-4) var(--mm-space-5)`
   - Body: `var(--mm-space-2)`
   - Content wrapper: `var(--mm-space-2)`

---

## Responsive Behavior

### Container Queries

**Primary Mechanism:** Use container queries (`cqh`, `cqw`) for responsive scaling.

**Benefits:**
- Scales based on actual container size, not viewport
- Works correctly in grid layouts
- More predictable than viewport units

### Mobile Considerations

1. **Minimum Heights:**
   - Chart containers: `250px` minimum
   - Pie chart container: `100px` minimum
   - Pie legend: `60px` minimum

2. **Scaling:**
   - Font sizes scale down proportionally
   - Charts maintain aspect ratios
   - Layouts flatten to single column

3. **Overflow:**
   - Content scrolls if it exceeds container
   - Legends scroll if they exceed space
   - No horizontal overflow

### Breakpoints

- **Desktop:** Default (no media query)
- **Mobile:** `@media (max-width: 768px)`

---

## Implementation Strategy

### Phase 1: Foundation (Current)
- ✅ Text chart markdown rendering
- ✅ Unified font-size calculation
- ✅ Vertical centering for text charts
- ✅ Responsive font scaling

### Phase 2: Standardization
- [ ] Apply vertical centering to all chart types
- [ ] Standardize title-content ratios
- [ ] Unify spacing system
- [ ] Create chart layout components

### Phase 3: Consistency
- [ ] Align same-type elements across charts
- [ ] Standardize font sizes across chart types
- [ ] Unify responsive behavior
- [ ] Create design tokens

### Phase 4: Documentation
- [ ] Create component library documentation
- [ ] Document all chart types
- [ ] Create style guide
- [ ] Add usage examples

---

## Migration Plan

### Step 1: Audit Current State
1. List all chart types
2. Document current layout patterns
3. Identify inconsistencies
4. Create migration checklist

### Step 2: Create Base System
1. Define CSS custom properties for design tokens
2. Create base chart layout classes
3. Implement unified font-size system
4. Create vertical centering utilities

### Step 3: Migrate Chart Types
1. Start with most-used charts
2. Apply new layout system
3. Test responsive behavior
4. Verify alignment

### Step 4: Validate & Refine
1. Test all chart combinations
2. Verify mobile responsiveness
3. Check alignment across blocks
4. Refine based on feedback

---

## Design Tokens

### Colors
```css
--chartBackground: var(--mm-white);
--chartTitleColor: var(--mm-gray-900);
--chartValueColor: var(--mm-gray-900);
--chartBorder: var(--mm-gray-200);
```

### Spacing
```css
--chartHeaderPadding: var(--mm-space-4) var(--mm-space-5);
--chartBodyPadding: var(--mm-space-2);
--chartContentPadding: var(--mm-space-2);
```

### Typography
```css
--chartTitleFontSize: clamp(0.9rem, 2.6cqw, 1.25rem);
--chartContentFontSize: var(--unified-text-font-size, clamp(0.75rem, min(12cqh, 10cqw), 2.5rem));
--chartKPIFontSize: clamp(1.5rem, min(15cqh, 12cqw), 3rem);
```

### Layout
```css
--chartBorderRadius: var(--mm-radius-lg);
--chartShadow: var(--mm-shadow-sm);
--chartTitleMaxHeight: 30%;
--chartContentMinHeight: 70%;
```

---

## Best Practices

### DO ✅

1. **Use Container Queries:** For responsive font sizing
2. **Center Vertically:** All content in chart bodies
3. **Unify Font Sizes:** Same type charts in same block
4. **Use Design Tokens:** CSS custom properties for consistency
5. **Test Responsively:** Check all viewport sizes
6. **Maintain Ratios:** Title-content ratios should be consistent
7. **Handle Overflow:** Scroll, don't hide content

### DON'T ❌

1. **Don't Use Fixed Pixels:** Use rem, em, or container queries
2. **Don't Hardcode Colors:** Use design tokens
3. **Don't Skip Alignment:** Everything must be centered
4. **Don't Mix Layout Systems:** Use flexbox consistently
5. **Don't Ignore Mobile:** Always test mobile view
6. **Don't Break Ratios:** Maintain consistent proportions
7. **Don't Override Globally:** Use specific selectors

---

## Testing Checklist

### Visual Consistency
- [ ] All charts of same type look identical
- [ ] Titles align horizontally across charts
- [ ] Content aligns horizontally across charts
- [ ] Icons align horizontally across charts
- [ ] Spacing is consistent

### Responsive Behavior
- [ ] Font sizes scale correctly
- [ ] Charts maintain aspect ratios
- [ ] No horizontal overflow
- [ ] Content scrolls when needed
- [ ] Mobile layout works correctly

### Alignment
- [ ] All content vertically centered
- [ ] Titles vertically centered in headers
- [ ] Values vertically centered in bodies
- [ ] Legends vertically centered

### Functionality
- [ ] Markdown renders correctly
- [ ] Line breaks work
- [ ] Bold/italic/headings work
- [ ] Unified font-size calculates correctly
- [ ] CSS custom properties apply correctly

---

## Future Enhancements

1. **Design Token System:** Centralized design tokens file
2. **Component Library:** Reusable chart components
3. **Style Guide:** Visual documentation
4. **Automated Testing:** Visual regression tests
5. **Theme Support:** Dark mode, custom themes
6. **Accessibility:** ARIA labels, keyboard navigation
7. **Performance:** Optimize font-size calculations

---

## Conclusion

This design system plan establishes a foundation for consistent, maintainable, and visually pleasing report layouts. By following these principles and learning from recent experiences, we can create a unified system that scales well and provides excellent user experience.

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 2 implementation
3. Create design token system
4. Migrate existing charts to new system
5. Document and test thoroughly

---

**Document Maintained By:** Development Team  
**Last Review:** 2025-01-XX  
**Next Review:** After Phase 2 completion

