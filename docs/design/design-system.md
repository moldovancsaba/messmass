# MessMass Design System
Status: Active
Last Updated: 2026-01-11T22:45:21.000Z
Canonical: Yes
Owner: Architecture

**Version**: 11.55.1  
**Last Updated**: 2026-02-21T00:00:00.000Z (UTC)  
**Status**: Production-Ready — TailAdmin V2 Flat Design

---

## 🏛️ Centralized Design Token Management

### Single Source of Truth: `app/styles/theme.css`

**ALL design tokens are centrally managed in ONE file.**

**Location**: `app/styles/theme.css` (lines 1-450)  
**Tokens**: 200+ CSS variables (`--mm-*` prefix)  
**Scope**: Global (`:root` selector)

### Why Centralized Tokens Matter

**Security**: 
- One file to audit for CSS injection vulnerabilities
- Centralized sanitization of dynamic values
- Controlled token namespace (`--mm-*` prefix prevents conflicts)

**Consistency**:
- Change blue primary once → updates 60+ components
- Spacing adjustments propagate system-wide
- Typography scales apply uniformly

**Maintainability**:
- Find any token instantly (single file, 450 lines)
- No scattered hardcoded values
- Clear token naming convention

### Token Update Protocol

**When modifying design tokens:**

1. **Identify Impact**: Search codebase for token usage
   ```bash
   # Example: Find all uses of --mm-space-4
   grep -r "--mm-space-4" app/ components/ --include="*.css"
   ```

2. **Document Change**: Log in RELEASE_NOTES.md
   ```
   Design Token Update:
   - Changed: --mm-space-4 (1rem → 1.25rem)
   - Reason: Improve touch target sizes on mobile
   - Affected: 45 components, 12 pages
   - Tested: Mobile viewport 375px-768px
   ```

3. **Test Propagation**: Verify visual consistency
   - Run `npm run dev`
   - Check all admin pages
   - Check public pages (stats, edit, filter)
   - Verify mobile responsiveness

4. **Version Bump**: 
   - PATCH: Token value adjustment (e.g., spacing increase)
   - MINOR: New token addition
   - MAJOR: Token removal or breaking rename

### Centralized Component Library

**Complete Catalog**: See **`REUSABLE_COMPONENTS_INVENTORY.md`**

**Module Categories**:
1. **Modal System** (3 components) - FormModal, BaseModal, ConfirmDialog
2. **Card System** (1 component) - ColoredCard (mandatory)
3. **Hashtag System** (2 components) - UnifiedHashtagInput, ColoredHashtagBubble
4. **Admin UI** (10+ components) - AdminHero, AdminLayout, Sidebar, etc.
5. **Selectors** (2 components) - PartnerSelector, ProjectSelector
6. **Charts** (7 components) - KPICard, PieChart, VerticalBarChart, etc.
7. **Forms** (10+ components) - ImageUploadField, TextareaField, etc.
8. **Analytics** (3 components) - MetricCard, InsightCard, LineChart

**Critical Rule**: Never create custom versions. Use centralized modules exclusively.

### Token Audit Commands

**Before any styling work:**

```bash
# 1. Check if token exists
grep "--mm-space-" app/styles/theme.css

# 2. Find token usage
grep -r "var(--mm-space-4)" app/ components/

# 3. Verify no hardcoded values
grep -r "padding: [0-9]" --include="*.css" components/ | grep -v "var(--"

# 4. Count token usage
grep -r "var(--mm-" --include="*.css" . | wc -l
```

### Module Dependency Tracking

**Every component MUST document its token dependencies:**

```css
/* components/MyComponent.module.css */

/**
 * WHAT: My component styling
 * WHY: Implements feature X with design system tokens
 * 
 * TOKEN DEPENDENCIES:
 * - Colors: --mm-gray-900, --mm-white, --mm-primary
 * - Spacing: --mm-space-4, --mm-space-6
 * - Typography: --mm-font-size-sm, --mm-font-weight-medium
 * - Effects: --mm-radius-lg, --mm-shadow-sm
 * 
 * AFFECTED BY: Changes to primary color palette or spacing scale
 */
```

---

## 🔒 MANDATORY USAGE RULES

### Rule 1: Design Tokens Are NOT Optional

**ALL styling MUST use design tokens. Hardcoded values = immediate rejection.**

**Reference:** `app/styles/theme.css` (lines 1-450) - Complete token catalog

```css
/* ✅ CORRECT: Design tokens */
.component {
  color: var(--mm-gray-900);
  background: var(--mm-white);
  padding: var(--mm-space-4);
  font-size: var(--mm-font-size-sm);
  font-weight: var(--mm-font-weight-medium);
  border-radius: var(--mm-radius-lg);
  box-shadow: var(--mm-shadow-sm);
  transition: all var(--transition-fast);
}

/* ❌ FORBIDDEN: Hardcoded values */
.badComponent {
  color: #1f2937;           /* ❌ Use var(--mm-gray-900) */
  background: #ffffff;      /* ❌ Use var(--mm-white) */
  padding: 16px;            /* ❌ Use var(--mm-space-4) */
  font-size: 14px;          /* ❌ Use var(--mm-font-size-sm) */
  font-weight: 500;         /* ❌ Use var(--mm-font-weight-medium) */
  border-radius: 8px;       /* ❌ Use var(--mm-radius-lg) */
}
```

**Real Examples:**
- ✅ `components/SharePopup.module.css` (lines 1-230) - 100% tokens
- ✅ `components/modals/FormModal.module.css` (lines 1-152) - 100% tokens
- ✅ `components/ColoredCard.module.css` (lines 1-95) - 100% tokens

### Rule 2: Use Component Library (Don't Recreate)

**Reference Implementations:**

| Component | Reference File | Usage |
|-----------|---------------|-------|
| Modals | `components/modals/FormModal.tsx` | MUST use FormModal/BaseModal |
| Cards | `components/ColoredCard.tsx` | MUST use ColoredCard |
| Hashtags | `components/UnifiedHashtagInput.tsx` | MUST use UnifiedHashtagInput |
| Partners | `components/PartnerSelector.tsx` | MUST use PartnerSelector |
| Admin Layout | `components/AdminHero.tsx` | MUST use AdminHero |

**Real Example - ColoredCard Usage:**
```tsx
// ✅ CORRECT: From app/admin/filter/page.tsx (line 195)
import ColoredCard from '@/components/ColoredCard';

<ColoredCard accentColor="#3b82f6" hoverable={false} className="p-4">
  <h2>Card Title</h2>
  {/* Content */}
</ColoredCard>
```

**❌ FORBIDDEN: Creating custom card components or CSS classes**

### Rule 3: Verification Before Submission

**Run these checks:**
```bash
# Check for hardcoded hex colors
grep -r "#[0-9a-f]\{6\}" --include="*.css" --include="*.module.css" components/ app/

# Check for hardcoded px values (excluding borders)
grep -r "[3-9][0-9]*px\|[0-9]\{3,\}px" --include="*.css" components/

# Check design token usage
grep -r "var(--mm-" --include="*.css" components/ | wc -l
```

**If hardcoded values found = Code rejected**

### Rule 4: Mobile Responsiveness Required

**ALL components must include mobile breakpoints matching reference patterns:**

```css
/* Reference: components/modals/FormModal.module.css lines 132-152 */
@media (max-width: 640px) {
  .header {
    padding: 1.5rem;
    padding-right: 3rem;
  }
  
  .body {
    padding: 1.5rem;
  }
}
```

**Real Examples:**
- `components/SharePopup.module.css` (lines 221-230)
- `components/PageStyleEditor.module.css` (lines 229-267)

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

**ONLY USE ColoredCard Component** (see [CARD_SYSTEM (archived)](../archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-card_system)):
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

See [ADMIN_LAYOUT_SYSTEM (archived)](../archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-admin_layout_system)

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

- **[/admin/design](../../app/admin/design/page.tsx)** — Interactive Design System Manager (NEW)
- [CARD_SYSTEM (archived)](../archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-card_system) — ColoredCard component
- [ADMIN_LAYOUT_SYSTEM (archived)](../archive/_archive/deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-admin_layout_system) — Admin layout
- [ADMIN_VARIABLES_SYSTEM.md (archived)](../archive/_archive/legacy-variable-system/archive-admin-variables-system.md) — Variables system
- [ARCHITECTURE.md](../architecture.md) — System architecture

---

*Version: 11.55.1 | Last Updated: 2026-02-21T00:00:00.000Z (UTC)*
