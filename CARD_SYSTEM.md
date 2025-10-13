# Card System — ColoredCard Component

**Version**: 5.53.0  
**Last Updated**: 2025-10-13T11:23:00.000Z  
**Component**: `components/ColoredCard.tsx`

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

## 📖 Related Docs

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Complete design system
- [ADMIN_LAYOUT_SYSTEM.md](./ADMIN_LAYOUT_SYSTEM.md) — Admin layout
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture

---

*Version: 5.53.0 | Last Updated: 2025-10-13T11:23:00.000Z*
