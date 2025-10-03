# DESIGN_SYSTEM.md

**Version**: 5.20.1 (Phase 1 Complete - TailAdmin V2 Foundation)  
**Last Updated**: 2025-10-02T14:30:00.000Z  
**Status**: Flat Design System - Glass-morphism Removed

---

## Overview

MessMass uses a **modern, flat design system** inspired by TailAdmin V2 with professional 2025-2026 aesthetics. This document outlines the design tokens, usage guidelines, and migration from the previous glass-morphism style.

### Design Philosophy

- **Flat, Clean, Professional**: No glass-morphism or heavy blur effects
- **Subtle Elevations**: Light shadows for depth, not dramatic 3D effects
- **Accessible Colors**: Minimum 4.5:1 contrast ratios for text
- **Consistent Spacing**: 4px/8px grid system for predictable rhythm
- **Modern Typography**: Clean, readable type scale with semantic weights

### File Structure

- **app/styles/theme.css** — Design tokens (colors, spacing, typography, borders, shadows)
- **app/styles/components.css** — UI components (buttons, forms, cards)
- **app/styles/layout.css** — Layout utilities, grids, containers
- **app/globals.css** — Global styles, imports, component-level overrides

---

## Color System

### Primary Colors (Blue Palette)

Professional blue for trust and authority:

```css
--mm-color-primary-50:  #eff6ff;  /* Lightest tint */
--mm-color-primary-100: #dbeafe;
--mm-color-primary-500: #3b82f6;  /* Base primary */
--mm-color-primary-600: #2563eb;  /* Default buttons */
--mm-color-primary-700: #1d4ed8;  /* Hover states */
--mm-color-primary-900: #1e3a8a;  /* Darkest shade */
```

**Usage**: `--mm-color-primary-600` for buttons, `--mm-color-primary-500` for focus rings.

### Secondary Colors (Green Palette)

```css
--mm-color-secondary-500: #22c55e;  /* Base secondary */
--mm-color-secondary-600: #16a34a;  /* Success states */
```

### Grayscale (Neutral Palette)

```css
--mm-gray-50:  #f9fafb;  /* Page backgrounds */
--mm-gray-200: #e5e7eb;  /* Borders */
--mm-gray-600: #4b5563;  /* Body text (7.0:1 contrast) */
--mm-gray-900: #111827;  /* Headings (16.1:1 contrast) */
--mm-white: #ffffff;
```

### Semantic Colors

```css
--mm-success: #10b981;  /* Green - success states */
--mm-warning: #f59e0b;  /* Amber - warnings */
--mm-error:   #ef4444;  /* Red - errors, delete actions */
--mm-info:    #3b82f6;  /* Blue - informational */
```

### Chart Colors (10 distinct colors)

```css
--mm-chart-blue:   #3b82f6;
--mm-chart-green:  #10b981;
--mm-chart-purple: #8b5cf6;
--mm-chart-orange: #f97316;
--mm-chart-pink:   #ec4899;
/* ... 5 more colors for multi-series charts */
```

---

## Typography

### Font Sizes (Modern Type Scale)

```css
--mm-font-size-xs:   0.75rem;   /* 12px - Tiny labels */
--mm-font-size-sm:   0.875rem;  /* 14px - Small UI text */
--mm-font-size-base: 1rem;      /* 16px - Body text */
--mm-font-size-2xl:  1.5rem;    /* 24px - Section headings */
--mm-font-size-3xl:  1.875rem;  /* 30px - Page headings */
```

### Font Weights

```css
--mm-font-weight-normal:    400;  /* Body text */
--mm-font-weight-medium:    500;  /* Subtle emphasis */
--mm-font-weight-semibold:  600;  /* Headings */
--mm-font-weight-bold:      700;  /* Strong emphasis */
```

---

## Spacing (4px/8px Grid System)

```css
--mm-space-1:  0.25rem;  /* 4px - Tight spacing */
--mm-space-2:  0.5rem;   /* 8px - Base grid unit */
--mm-space-4:  1rem;     /* 16px - Standard spacing */
--mm-space-6:  1.5rem;   /* 24px - Large spacing */
--mm-space-12: 3rem;     /* 48px - Section spacing */
```

**Usage**: Component padding uses `--mm-space-4` or `--mm-space-6`; gaps use `--mm-space-3` or `--mm-space-4`.

---

## Borders & Radius

### Border Widths & Colors

```css
--mm-border-width-sm: 1px;  /* Default borders */
--mm-border-color-default: var(--mm-gray-200);
--mm-border-color-hover:   var(--mm-gray-300);
--mm-border-color-focus:   var(--mm-color-primary-500);
```

### Border Radius (Flatter Design)

```css
--mm-radius-sm: 0.25rem;  /* 4px - Subtle rounding */
--mm-radius-md: 0.5rem;   /* 8px - Standard cards (was 20px) */
--mm-radius-lg: 0.75rem;  /* 12px - Large components (was 25px) */
--mm-radius-xl: 1rem;     /* 16px - Modals, panels */
```

**Key Change**: Standard cards now use 8px radius instead of 20px for a flatter aesthetic.

---

## Shadows (Subtle Elevations)

```css
--mm-shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.05);   /* Default cards */
--mm-shadow-md: 0 2px 6px -1px rgba(0, 0, 0, 0.08); /* Hover state */
--mm-shadow-lg: 0 4px 12px -2px rgba(0, 0, 0, 0.08); /* Modals */
```

**Usage**: Resting cards use `--mm-shadow-sm`, hover uses `--mm-shadow-md`.

**⚠️ Deprecated**: `--blur-*` tokens are deprecated. The design system has removed all `backdrop-filter: blur()` effects.

---

## Migration Guide

### From Glass-Morphism to Flat Design

**Previous (Glass-Morphism)**:
```css
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

**Now (Flat Design)**:
```css
.card {
  background: var(--mm-white);
  border: 1px solid var(--mm-border-color-default);
  border-radius: var(--mm-radius-md); /* 8px */
  box-shadow: var(--mm-shadow-sm);
}
```

### Key Changes

1. **Backgrounds**: Solid white (`var(--mm-white)`) instead of transparent rgba()
2. **No backdrop-filter**: All blur effects removed
3. **Flatter radius**: 8px instead of 20px for standard cards
4. **Lighter shadows**: Subtle depth instead of dramatic elevation
5. **Neutral page backgrounds**: `var(--mm-gray-50)` instead of gradients

---

## Component Patterns

### 1) Buttons (.btn)

**Base Structure**:
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--mm-space-2);
  padding: var(--mm-space-3) var(--mm-space-6);
  min-height: 40px;
  border-radius: var(--mm-radius-md);
  font-weight: var(--mm-font-weight-medium);
  transition: all 0.2s ease;
  cursor: pointer;
}
```

**Variants**: `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`
**Sizes**: `.btn-small`, `.btn-large`

**Primary Button Example**:
```css
.btn-primary {
  background: var(--mm-color-primary-600);
  color: var(--mm-white);
  border: none;
}

.btn-primary:hover {
  background: var(--mm-color-primary-700);
  transform: translateY(-1px);
  box-shadow: var(--mm-shadow-md);
}
```

2) Forms (labels, inputs)
- Labels: .form-label — medium weight, sm size
- Inputs: .form-input — padding, min-height 40px, radius var(--radius-xl)
  - Focus ring: outline disabled, border-color primary + subtle box shadow
  - Disabled: neutral colors and cursor not-allowed
- Validation: .form-input-error, .form-input-success

3) Dropdowns (select)
- Class: .form-select (and generic select) styled to match .form-input
- Padding: var(--space-3 var(--space-4)), min-height 40px
- Radius: var(--radius-xl), font-size: var(--text-base)
- Appearance: none (custom caret using two backgrounds)
- Focus: same ring as inputs

4) Cards & Stats
- .glass-card — glassmorphism container
- .stat-card / .stat-card-admin — stat blocks with hover elevation and typography

Board Card Width Consistency (Rule)
- All cards displayed within any board/grid must have equal width within that board.
- Why: Ensures visual rhythm, predictable scan patterns, and prevents layout jitter when content length varies.
- How (do):
  - Use grid containers that define uniform columns, e.g., grid-template-columns: repeat(N, 1fr).
  - Prefer existing grid utilities (see Layout section: .stats-grid, .stats-grid-admin, .counter-grid, .dynamic-charts-grid, .charts-grid) that already establish equal-width columns.
  - When adding a new board, mirror an existing grid utility or extend layout.css with a named grid class that uses repeat(N, 1fr).
- How (don’t):
  - Don’t set per-card inline widths or percentage widths on individual cards.
  - Don’t mix cards with custom width utilities inside the same board; keep column definitions at the container.
- Notes:
  - Equal width does not imply equal height; use min-height utilities or flex helpers if equal height is also desired for a given board.
  - On responsive breakpoints, maintain equal-width behavior by adapting the column count (e.g., desktop 4, tablet 2, mobile 1) rather than card-level widths.

5) Layout
- Containers: .app-container, .admin-container, .page-container
- Grids: .stats-grid, .stats-grid-admin, .counter-grid, .dynamic-charts-grid, .charts-grid
- Utilities: spacing (.m-*, .p-*, .mt-*, .mb-*), flex/grid helpers

6) Editor Dashboard Utilities (v5.7.0)
- Stat card accent bar: .stat-card-accent (pseudo-element top gradient)
- Card modifiers: .stat-card-clickable, .stat-card-readonly; anchored decrement button: .stat-decrement
- Input card wrapper: .input-card for numeric inputs + labels
- Calculated rows: .calc-row with .value-pill for totals
- Content grids: .age-grid for age section; .content-grid for content areas
- Utilities: .btn-full (full-width button), .w-120 (fixed width), .flex-1 (flex grow)

Recent Refinements (v3.11.0)
- Buttons: Ensured consistent min-height (40px), added small margin so buttons never stick to container edges in dense stacks, unified focus and disabled states.
- Inputs & Dropdowns: Enforced min-height 40px for inputs and selects; added unified .form-select and generic select styling so dropdowns match input sizing; added caret with background image for cross-browser consistency.
- Edge Spacing: Added small default margin to .btn, .form-input, and .form-select to avoid edge collisions.

Dos & Don’ts
- Do: Apply .btn classes (variant + size) instead of inline styles.
- Do: Use .form-input for text inputs and .form-select for selects for consistent sizing.
- Do: Use spacing utilities (.m-*, .p-*, .gap via container) to control layout spacing.
- Don’t: Hardcode inline styles for shared properties (padding, border, radius, colors). Prefer classes.
- Don’t: Apply fixed pixel heights to buttons/selects — the system standardizes minimum 40px height via classes.

Refactor Targets (Hardcoded Styles to Replace)
- Inline-styled buttons in auth and shareable components (e.g., lib/shareables/auth/LoginForm.tsx, components/SharePopup.tsx)
  - Replace inline background/hover/spacing with .btn + variant classes and remove redundant inline styles.
- Inline-styled inputs and dropdowns in admin pages
  - Replace with .form-input / .form-select to inherit consistent height, padding, and focus rings.

Migration Guidelines
- Replace inline button styles with: className="btn btn-primary" (or other variants) + optional .btn-small/.btn-large.
- Replace inline input styles with: className="form-input".
- Replace native <select> with: className="form-select" (preferred) or rely on global select styling if class application is not trivial.
- If additional special states are needed, extend variants in components.css, not inlined per-component.

Accessibility & Interaction
- Keyboard: :focus-visible outlines for buttons and form controls
- Touch target: Min 40px height ensures accessible targets
- Contrast: Text colors default to dark on light backgrounds; global rules enforce black text in glass cards

Open Improvements
- Consolidate inline-styled legacy components to class-based approach in a follow-up sweep
- Add a small design tokens doc table (per token category) with examples
- Add a standard dropdown menu component (beyond <select>) if requirements emerge


