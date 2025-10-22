# MessMass Design System

**Version**: 6.0.0  
**Last Updated**: 2025-01-21T11:14:00.000Z (UTC)  
**Status**: Production-Ready — TailAdmin V2 Flat Design

---

## 📋 Overview

MessMass uses a **modern, flat design system** inspired by TailAdmin V2. This is the **single source of truth** for all design tokens, utility classes, component patterns, and migration guidelines.

### Design Philosophy

- ✅ Flat, clean, professional design
- ✅ Subtle elevations via light shadows
- ✅ Accessible colors (4.5:1 contrast minimum)
- ✅ 4px/8px grid system for spacing
- ✅ Modern typography with semantic weights
- ✅ Design tokens first (`--mm-*` prefixed CSS variables)

### Architecture

```
app/styles/
├── theme.css       — Design tokens
├── components.css  — Global UI components
├── utilities.css   — Utility classes
├── layout.css      — Layout systems
└── admin.css       — Admin-specific styles

components/
└── *.module.css  — 27 component-scoped CSS modules
```

---

## 🎨 Design Tokens

### Colors

**Primary (Blue)**: `--mm-color-primary-{50-900}`  
**Secondary (Green)**: `--mm-color-secondary-{50-900}`  
**Grayscale**: `--mm-gray-{50-900}`, `--mm-white`, `--mm-black`  
**Semantic**: `--mm-success`, `--mm-warning`, `--mm-error`, `--mm-info`  
**Charts**: `--mm-chart-{blue,green,yellow,purple,red,pink,cyan,orange,indigo,teal}`

### Typography

**Sizes**: `--mm-font-size-{xs,sm,base,lg,xl,2xl,3xl,4xl}` (12px - 36px)  
**Weights**: `--mm-font-weight-{normal,medium,semibold,bold}` (400-700)  
**Line Heights**: `--mm-line-height-{sm,md,lg}` (1.25-1.75)

### Spacing (4px/8px Grid)

`--mm-space-{0,1,2,3,4,5,6,8,10,12,16,20,24}` (0px - 96px)

### Borders & Shadows

**Radius**: `--mm-radius-{none,sm,md,lg,xl,2xl,full}` (0 - 24px, 9999px)  
**Shadows**: `--mm-shadow-{none,sm,md,lg,xl,2xl}`

---

## 🧩 Utility Classes

**Spacing**: `.p-*`, `.m-*`, `.gap-*`  
**Layout**: `.flex`, `.grid`, `.items-center`, `.justify-between`  
**Typography**: `.text-{xs-4xl}`, `.font-{normal-bold}`, `.text-{left,center,right}`  
**Colors**: `.text-gray-*`, `.text-primary`  
**Borders**: `.rounded-*`, `.shadow-*`

---

## 🎯 Component Patterns

### Buttons
```tsx
<button className="btn btn-primary">Primary</button>
```

Variants: `.btn-{primary,secondary,success,danger}`  
Sizes: `.btn-{small,large}`

### Forms
```tsx
<input className="form-input" />
<select className="form-select">...</select>
```

### Cards

**ONLY USE ColoredCard Component** (see [CARD_SYSTEM.md](./CARD_SYSTEM.md)):
```tsx
<ColoredCard>Content</ColoredCard>
```

**With Accent Color**:
```tsx
<ColoredCard accentColor="#3b82f6">Content</ColoredCard>
```

**❌ NO CSS CLASSES**: `.admin-card`, `.glass-card`, `.content-surface`, `.section-card` have been REMOVED

---

## 🏗️ Layout System

**AdminLayout + Sidebar + TopHeader** provide responsive admin structure:
- Desktop: 280px sidebar
- Tablet: 80px icon rail
- Mobile: Overlay drawer

See [ADMIN_LAYOUT_SYSTEM.md](./ADMIN_LAYOUT_SYSTEM.md)

---

## 🔄 Migration Patterns

### Inline Styles → Utilities
```tsx
// ❌ Before
<div style={{ display: 'flex', gap: '1rem', padding: '1.5rem' }}>

// ✅ After
<div className="flex gap-4 p-6">
```

### Hardcoded Values → Tokens
```css
/* ❌ Before */
.card { color: #6b7280; font-size: 0.875rem; }

/* ✅ After */
.card { color: var(--mm-gray-500); font-size: var(--mm-font-size-sm); }
```

---

## ⚠️ ALL CSS Card Classes REMOVED

**These classes have been COMPLETELY REMOVED** (no backward compatibility):
- `.glass-card` → REMOVED, use `<ColoredCard>`
- `.content-surface` → REMOVED, use `<ColoredCard>`
- `.section-card` → REMOVED, use `<ColoredCard>`
- `.admin-card` → REMOVED, use `<ColoredCard>`

**Component-based architecture ONLY**: All card UI must use `<ColoredCard>` component.
**Refactor status**: CSS classes removed, code migration in progress (see REFACTOR_TODO_ADMIN_CARD.md)

---

## ✅ Do's and Don'ts

### ✅ Do
- Use design tokens for colors, spacing, typography
- Use utility classes for layout
- Use CSS Modules for component-specific styles
- Follow 4px/8px grid system

### ❌ Don't
- Use inline styles for static values
- Use hardcoded pixel values
- Use glass-morphism effects
- Use deprecated classes
- Use breadcrumb navigation

---

## 📊 Status (v5.53.0)

| Metric | Status |
|--------|--------|
| Design Token Coverage | 80% → 100% target |
| Component Modules | 27 (Excellent) |
| Inline Styles | 397 remaining (migration in progress) |

---

## 🎨 Interactive Design System Manager

**NEW: `/admin/design` — Comprehensive Interactive Reference**

Navigate to `/admin/design` for a complete, interactive design system reference featuring:

### Features
- **🔤 Typography Tab** - Font selection (Inter, Roboto, Poppins) with live preview
- **🎨 Design Tokens Tab** - All CSS variables with color swatches and copy-to-clipboard
- **🧩 Components Tab** - Button variants, form elements, cards with live examples
- **⚡ Utilities Tab** - Complete utility class reference with interactive copy
- **📋 Standards Tab** - Coding standards, prohibited patterns, migration guides

### Benefits
- Visual catalog of all design tokens
- Copy-to-clipboard for tokens, code examples, utility classes
- Clear deprecation warnings for removed patterns
- Migration paths from old to new patterns
- Live component showcase

**Access**: Available to authenticated admin users at `/admin/design`

---

## 📖 Related Docs

- **[/admin/design](./app/admin/design/page.tsx)** — Interactive Design System Manager (NEW)
- [CARD_SYSTEM.md](./CARD_SYSTEM.md) — ColoredCard component
- [ADMIN_LAYOUT_SYSTEM.md](./ADMIN_LAYOUT_SYSTEM.md) — Admin layout
- [ADMIN_VARIABLES_SYSTEM.md](./ADMIN_VARIABLES_SYSTEM.md) — Variables system
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture

---

*Version: 6.39.2 | Last Updated: 2025-10-22T17:35:32.000Z (UTC)*
