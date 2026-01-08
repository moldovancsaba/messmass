# Report Design System

**Version:** 1.0.0  
**Last Updated:** 2024-12-19  
**Status:** Active

## Overview

This document defines the unified design system for MessMass report charts, ensuring consistent, professional, and maintainable visual presentation across all chart types and layouts.

## Core Principles

### 1. Vertical Centering (MANDATORY)

**Rule:** All chart elements MUST be vertically centered within their allocated space.

**Applies to:**
- Titles
- Subtitles
- Chart graphics (pie, bar, KPI values)
- Legends
- Icons
- Descriptions
- Any other content element

**Implementation:**
```css
.elementContainer {
  display: flex;
  align-items: center; /* Vertical centering */
  justify-content: center; /* Horizontal centering (if needed) */
  height: 100%;
  width: 100%;
}
```

### 2. Horizontal Alignment (MANDATORY)

**Rule:** Same-type elements MUST align horizontally across all charts in the same block.

**Applies to:**
- All titles align to the same baseline
- All icons align to the same vertical position
- All chart graphics align to the same vertical position
- All legends align to the same vertical position
- All subtitles align to the same baseline

**Implementation:**
- Use `CellWrapper` for consistent title/subtitle zones
- Use synchronized `titleFontSize` and `subtitleFontSize` at block level
- Use fixed-height zones for titles/subtitles
- Use flexbox with consistent proportions for body zones

## Architecture

### CellWrapper Structure

All charts (except KPI which uses its own grid) MUST use `CellWrapper`:

```
CellWrapper
├── titleZone (fixed height, vertically centered)
│   └── title (max 2 lines, synced font size)
├── subtitleZone (fixed height, vertically centered, optional)
│   └── subtitle (max 2 lines, synced font size)
└── bodyZone (flex: 1, vertically centered)
    └── chart content (vertically centered)
```

### Chart-Specific Layouts

#### KPI Chart
- **Structure:** 3-row CSS Grid (4fr:3fr:3fr = Icon:Value:Title)
- **Icon Row:** 40% height, vertically centered
- **Value Row:** 30% height, vertically centered
- **Title Row:** 30% height, vertically centered
- **Note:** KPI does NOT use CellWrapper (has its own grid)

#### Pie Chart
- **Structure:** CellWrapper + flex column (30:50:20 = Title:Pie:Legend)
- **Title:** 30% height, vertically centered (via CellWrapper)
- **Pie Container:** 50% height, vertically centered
- **Legend:** 20% height, vertically centered, scrollable if overflow

#### Bar Chart
- **Structure:** CellWrapper + flex column
- **Title:** Via CellWrapper (synced)
- **Body:** Flex column with bar rows, vertically centered

#### Text Chart
- **Structure:** CellWrapper + flex container
- **Title:** Via CellWrapper (synced)
- **Content:** Flex container, vertically and horizontally centered

#### Table Chart
- **Structure:** CellWrapper + flex container
- **Title:** Via CellWrapper (synced)
- **Content:** Flex container, vertically centered

#### Image Chart
- **Structure:** CellWrapper + aspect-ratio container
- **Title:** Via CellWrapper (synced)
- **Image:** Aspect-ratio maintained, vertically centered

## CSS Patterns

### Pattern 1: Vertical Centering Container

```css
.centeredContainer {
  display: flex;
  align-items: center; /* CRITICAL: Vertical centering */
  justify-content: center; /* Optional: Horizontal centering */
  height: 100%;
  width: 100%;
}
```

### Pattern 2: Text with Line Clamp in Flex Container

```css
.flexContainer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flexContainer > * {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-align: center;
  width: 100%;
}
```

**Why:** The flex container handles centering, while the inner element handles text truncation.

### Pattern 3: Scrollable Content in Fixed Container

```css
.scrollableContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60px; /* Prevent collapse */
  max-height: 100%; /* Prevent overflow */
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}
```

### Pattern 4: Responsive Sizing with Container Queries

```css
.responsiveElement {
  container-type: size;
  font-size: clamp(0.75rem, 8cqh, 1.125rem);
  /* Use cqh (container query height) for vertical scaling */
  /* Use cqw (container query width) for horizontal scaling */
}
```

## Implementation Checklist

When creating or modifying a chart component:

### ✅ Vertical Centering
- [ ] All elements use `display: flex` with `align-items: center`
- [ ] Containers have `height: 100%` to fill available space
- [ ] No `display: block` for content that should be centered
- [ ] Text truncation uses inner wrapper pattern (Pattern 2)

### ✅ Horizontal Alignment
- [ ] Chart uses `CellWrapper` (except KPI)
- [ ] Title uses `CellWrapper.titleZone` (synced font size)
- [ ] Subtitle uses `CellWrapper.subtitleZone` (synced font size)
- [ ] Body content uses `CellWrapper.bodyZone` (flex: 1)

### ✅ Responsive Behavior
- [ ] Uses container queries (`cqh`, `cqw`) for scaling
- [ ] Uses `clamp()` for font sizes
- [ ] Mobile viewports maintain same alignment rules
- [ ] No hardcoded pixel values (use design tokens)

### ✅ Overflow Handling
- [ ] Scrollable containers have `max-height: 100%`
- [ ] Scrollable containers have `overflow-y: auto`
- [ ] Containers have `min-height` to prevent collapse
- [ ] `box-sizing: border-box` for proper sizing

### ✅ Documentation
- [ ] CSS comments explain WHAT, WHY, and HOW
- [ ] Component comments explain layout structure
- [ ] Design decisions documented in this file

## Design Tokens

Use CSS variables from the theme system:

```css
/* Spacing */
var(--mm-space-1)   /* 0.25rem */
var(--mm-space-2)   /* 0.5rem */
var(--mm-space-3)   /* 0.75rem */
var(--mm-space-4)   /* 1rem */

/* Colors */
var(--chartTitleColor)
var(--chartValueColor)
var(--chartLabelColor)
var(--chartBackground)
var(--chartBorder)

/* Typography */
var(--mm-font-weight-medium)
var(--mm-font-weight-semibold)
var(--mm-font-weight-bold)
var(--mm-font-size-sm)
var(--mm-font-size-xs)

/* Radius */
var(--mm-radius-lg)
var(--mm-radius-full)
```

## Common Pitfalls

### ❌ DON'T: Use `display: block` for centered content
```css
/* BAD */
.textContent {
  display: block;
  text-align: center; /* Only centers text, not container */
}
```

### ✅ DO: Use flexbox for centering
```css
/* GOOD */
.textContent {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
```

### ❌ DON'T: Mix flex centering with `-webkit-box` on same element
```css
/* BAD */
.kpiTitle {
  display: flex;
  align-items: center;
  display: -webkit-box; /* Conflicts with flex */
  -webkit-line-clamp: 2;
}
```

### ✅ DO: Use inner wrapper for line clamp
```css
/* GOOD */
.kpiTitle {
  display: flex;
  align-items: center;
}
.kpiTitle > * {
  display: -webkit-box;
  -webkit-line-clamp: 2;
}
```

### ❌ DON'T: Forget `max-height` on scrollable containers
```css
/* BAD */
.pieLegend {
  overflow-y: auto; /* Will overflow parent */
}
```

### ✅ DO: Constrain height properly
```css
/* GOOD */
.pieLegend {
  max-height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}
```

## Testing Checklist

Before deploying chart changes:

1. **Desktop View:**
   - [ ] All elements vertically centered
   - [ ] Titles align horizontally across block
   - [ ] Icons align horizontally (if multiple KPIs)
   - [ ] Charts align horizontally
   - [ ] No overflow or clipping

2. **Mobile View:**
   - [ ] Same alignment rules apply
   - [ ] Content scales appropriately
   - [ ] No horizontal overflow
   - [ ] Scrollable areas work correctly

3. **Edge Cases:**
   - [ ] 1 unit in 5-unit block (small containers)
   - [ ] Long titles (2-line truncation)
   - [ ] Many legend items (scrollable)
   - [ ] Empty content (graceful handling)

## Version History

- **1.0.0** (2024-12-19): Initial design system documentation
  - Core principles defined
  - CSS patterns documented
  - Implementation checklist created
  - Common pitfalls identified

## References

- `components/CellWrapper.tsx` - 3-zone cell structure
- `app/report/[slug]/ReportChart.tsx` - Chart component implementations
- `app/report/[slug]/ReportChart.module.css` - Chart styles
- `components/CellWrapper.module.css` - CellWrapper styles

## Maintenance

This document MUST be updated when:
- New chart types are added
- Layout patterns change
- New alignment rules are established
- Common pitfalls are discovered

**Rule:** If it's not documented here, it's not part of the design system.

