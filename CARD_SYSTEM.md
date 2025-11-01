# Card System — ColoredCard Component

**Version**: 8.24.0  
**Last Updated**: 2025-11-01T15:00:00.000Z  
**Component**: `components/ColoredCard.tsx`

---

## 🔒 MANDATORY: Use ColoredCard - Do NOT Create Custom Cards

**Reference Implementation:** `components/ColoredCard.tsx` (lines 1-89)

### Rule: ColoredCard is THE Standard

**ALL cards MUST use ColoredCard. Custom card components or CSS classes are PROHIBITED.**

**Real Examples in Codebase:**
- ✅ `app/admin/filter/page.tsx` line 195: `<ColoredCard accentColor="#3b82f6" hoverable={false}>`
- ✅ `app/admin/projects/ProjectsPageClient.tsx` lines 205-220: Project cards
- ✅ `app/admin/partners/page.tsx` lines 148-163: Partner cards
- ✅ `app/admin/categories/page.tsx` lines 112-128: Category cards

### Exact Pattern to Copy

```tsx
// ✅ CORRECT: From filter/page.tsx line 195
import ColoredCard from '@/components/ColoredCard';

<ColoredCard accentColor="#3b82f6" hoverable={false} className="p-4">
  <h2 className="font-semibold text-lg mb-2">Card Title</h2>
  <p>Card content goes here</p>
</ColoredCard>
```

### Accent Colors (Use Design Tokens)

```tsx
// ✅ CORRECT: Design tokens
<ColoredCard accentColor="var(--mm-chart-purple)">  {/* #8b5cf6 */}
<ColoredCard accentColor="var(--mm-chart-blue)">    {/* #3b82f6 */}
<ColoredCard accentColor="var(--mm-chart-green)">   {/* #10b981 */}
```

### ❌ FORBIDDEN Patterns

```tsx
// ❌ Creating custom card components
export function MyCustomCard() { ... }

// ❌ Using removed CSS classes
<div className="admin-card">...</div>
<div className="glass-card">...</div>
```

### Consequences

| Violation | Result |
|-----------|--------|
| Custom card component | ❌ Rejection |
| CSS card classes | ❌ Rejection |
| Not using ColoredCard | ❌ Rejection |

---

## 📍 Single Source of Truth

All admin cards MUST use the `ColoredCard` component for consistent colored accent borders.

**Location**: `/components/ColoredCard.tsx` + `/components/ColoredCard.module.css`

---

## 🎯 Component API

```typescript
interface ColoredCardProps {
  accentColor: string;      // Hex color for 4px left border
  className?: string;        // Optional additional classes
  children: React.ReactNode; // Card content
  onClick?: () => void;      // Optional click handler
  hoverable?: boolean;       // Enable hover effects (default: true)
}
```

### Usage

```tsx
import ColoredCard from '@/components/ColoredCard';

<ColoredCard accentColor="#3b82f6">
  <h3>Card Title</h3>
  <p>Card content</p>
</ColoredCard>
```

---

## 🎨 Color Semantics

Standard accent colors used across the admin interface:

- **Purple** `#8b5cf6` — Projects, success indicators
- **Pink** `#f5576c` — Images
- **Blue** `#3b82f6` — Fans, merchandise
- **Green** `#10b981` — Attendees, engagement

Use design tokens when possible:
```tsx
<ColoredCard accentColor="var(--mm-chart-purple)">
```

---

## 🔧 States

### Default State
- Background: `var(--mm-white)`
- Border: 1px solid + 4px left accent
- Border radius: `var(--mm-radius-lg)` (12px)
- Shadow: `var(--mm-shadow-sm)`
- Padding: `var(--mm-space-4)` (16px)

### Hover State (when `hoverable=true`)
- Shadow: `var(--mm-shadow-md)`
- Transform: `translateY(-2px)`
- Border: `var(--mm-border-color-default)`
- Cursor: `pointer`

### Non-hoverable (when `hoverable=false`)
- No hover effects
- No cursor change
- Use for static metric cards

---

## 📐 Layout Rules

### Card Sizing
- **Width**: Set by parent grid container (never set per-card)
- **Height**: Auto (content-driven)
- **Min-height**: Set via additional className if needed

### Responsive Padding
- **Desktop/Tablet**: `var(--mm-space-4)` (16px)
- **Mobile**: `var(--mm-space-3)` (12px)

---

## ♿ Accessibility

- **Contrast**: Accent color should meet 3:1 ratio with white background
- **Focus**: Keyboard focus visible when card has `onClick`
- **Touch Targets**: Minimum 44x44px for interactive cards

---

## 🔄 ALL CSS Card Classes REMOVED

**These classes have been COMPLETELY REMOVED from the codebase:**

### NO CSS Classes - Use ColoredCard Component ONLY

**REMOVED Classes**:
- `.glass-card` → Use `<ColoredCard>`
- `.content-surface` → Use `<ColoredCard>`
- `.section-card` → Use `<ColoredCard>`
- `.admin-card` → Use `<ColoredCard>`

**Correct Usage**:
```tsx
// ✅ Component-based (CORRECT)
import ColoredCard from '@/components/ColoredCard';

<ColoredCard>
  Your content here
</ColoredCard>

// With accent color
<ColoredCard accentColor="#3b82f6">
  Your content here
</ColoredCard>
```

**❌ NO CSS Classes**:
```tsx
// ❌ These NO LONGER WORK - classes removed
<div className="admin-card">...</div>
<div className="glass-card">...</div>
<div className="content-surface">...</div>
<div className="section-card">...</div>
```

**Refactor Status**: CSS removed ✅ | Code migration in progress (see REFACTOR_TODO_ADMIN_CARD.md)

---

## 📝 Examples

### Dashboard Metric Card
```tsx
<ColoredCard accentColor="#8b5cf6" hoverable={false}>
  <div className="metric-value">{count}</div>
  <div className="metric-label">Total Projects</div>
</ColoredCard>
```

### Category Card (Interactive)
```tsx
<ColoredCard 
  accentColor={category.color}
  onClick={() => handleEdit(category)}
>
  <h3>{category.name}</h3>
  <p>{category.count} items</p>
</ColoredCard>
```

### Hashtag Card
```tsx
<ColoredCard accentColor={hashtagColor}>
  <span className="hashtag-bubble">#{hashtag}</span>
  <span>{projectCount} projects</span>
</ColoredCard>
```

---

## ⚠️ Anti-Patterns

### ❌ Don't
- Set card width individually (use grid container)
- Override core card styles (padding, border-radius)
- Use deprecated classes alongside ColoredCard
- Set inline styles for colors/spacing

### ✅ Do
- Let grid container control width
- Use design tokens for accent colors
- Add className for specific positioning only
- Keep card content semantic

---

## 📊 Current Usage

| Page | Using ColoredCard? | Status |
|------|-------------------|--------|
| Dashboard | ✅ YES | Complete |
| Categories | ✅ YES | Complete |
| Hashtags | ✅ YES | Complete |
| Filter | ✅ YES | Complete |
| Variables | ✅ YES | Complete |

---

## 🎨 Interactive Reference

**See ColoredCard in action**: Visit `/admin/design` (Components Tab) for:
- Live ColoredCard examples with different accent colors
- Interactive hover states
- Copy-to-clipboard code snippets
- Visual comparison of card variants

---

## 📖 Related Docs

- **[/admin/design](./app/admin/design/page.tsx)** — Interactive Design System Manager with live ColoredCard showcase
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Complete design system
- [ADMIN_LAYOUT_SYSTEM.md](./ADMIN_LAYOUT_SYSTEM.md) — Admin layout
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture

---

*Version: 6.39.2 | Last Updated: 2025-10-22T17:35:32.000Z (UTC)*
