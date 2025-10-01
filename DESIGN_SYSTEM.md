# DESIGN_SYSTEM.md

Design System — MessMass (v5.14.0)
Last Updated: 2025-10-01T08:52:11.000Z

Overview
- Purpose: Provide a unified, reusable styling system for consistent UI across admin and public-facing pages.
- Location:
  - app/styles/theme.css — Design tokens (colors, spacing, typography, radii, shadows, transitions)
  - app/styles/components.css — UI elements (glass cards, buttons, forms, inputs, dropdowns)
  - app/styles/layout.css — Containers, grids, utilities, admin layout helpers
  - app/globals.css — Global resets and imports

Core Tokens
- Colors: --color-*, primary/secondary/neutral, semantic (success/warning/error/info)
- Gradients: --gradient-*
- Typography: --font-*, --text-*, --leading-*, weights
- Spacing: --space-* based on 4px grid
- Radii: --radius-*, MessMass card radii: --border-radius, --border-radius-lg
- Shadows: --shadow*, MessMass: --shadow, --shadow-lg
- Transitions: --transition-*
- Breakpoints: --breakpoint-*

Components
1) Buttons (.btn)
- Base: inline-flex, centered, gap, medium weight, sm font
- Size: padding var(--space-3 var(--space-6)); min-height 40px
- Corners: border-radius var(--radius-xl)
- Edges: margin var(--space-1) (prevents edge-sticking in dense layouts)
- States: :focus-visible outline, :disabled opacity+no-transform
- Variants: .btn-primary, .btn-secondary, .btn-success, .btn-info, .btn-danger
- Sizes: .btn-small, .btn-large

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


