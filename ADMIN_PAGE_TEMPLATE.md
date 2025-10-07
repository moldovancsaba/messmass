# ADMIN PAGE TEMPLATE

**Purpose**: SINGLE SOURCE OF TRUTH for admin page structure
**Status**: MANDATORY for all admin pages  
**Version**: 5.21.2

---

## 🏗️ Centralized Structure (MANDATORY)

ALL admin pages MUST follow this exact pattern:

```tsx
export default function AdminPageName() {
  return (
    <div className="page-container">
      {/* Header Card */}
      <div className="admin-card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="section-title m-0">📊 Page Title</h1>
          <a href="/admin" className="btn btn-secondary">← Back</a>
        </div>
        <p className="section-subtitle mb-0">
          Page description text
        </p>
      </div>

      {/* Content Card(s) */}
      <div className="admin-card mb-6">
        {/* Page content here */}
      </div>
    </div>
  );
}
```

---

## 📏 Spacing Rules

### Container
- **`.page-container`** - Outer wrapper
  - `max-width: 1200px`
  - `margin: 0 auto` (centered)
  - `padding: var(--space-6)` (24px)

### Cards
- **`.admin-card`** - Content cards
  - `padding: var(--mm-space-6)` (24px internal)
  - `margin-bottom: var(--mm-space-6)` via `.mb-6` utility (24px gap)

### Result
- **Total horizontal padding**: 24px (container) + 24px (card) = 48px from edge
- **Vertical gap between cards**: 24px
- **Consistent** across all admin pages

---

## ✅ Correct Classes

### Layout
- `.page-container` - page wrapper (NOT `.admin-container`)
- `.admin-card` - content cards (NOT `.glass-card`)

### Typography
- `.section-title` - main page heading
- `.section-subtitle` - page description

### Buttons
- `.btn .btn-primary` - primary actions
- `.btn .btn-secondary` - secondary actions
- `.btn .btn-success` - success actions
- `.btn .btn-danger` - destructive actions

### Forms
- `.form-group` - form field wrapper
- `.form-label` - field labels
- `.form-input` - text inputs
- `.form-select` - dropdowns

### Utilities
- `.mb-6`, `.mb-4`, `.mb-2` - margin bottom (24px, 16px, 8px)
- `.flex`, `.justify-between`, `.items-center` - flexbox
- `.m-0` - reset margins

---

## ❌ Prohibited

### NEVER Use These (Deprecated):
- `.glass-card` → Use `.admin-card`
- `.admin-container` → Use `.page-container`
- `.title`, `.subtitle` → Use `.section-title`, `.section-subtitle`

### NEVER Do These:
- Inline styles for spacing/colors/typography
- Custom CSS modules for standard admin pages
- Hardcoded pixel values
- Different padding per page

---

## 📝 Examples

### Good ✅
```tsx
<div className="page-container">
  <div className="admin-card mb-6">
    <h1 className="section-title">Title</h1>
  </div>
</div>
```

### Bad ❌
```tsx
<div className="admin-container">
  <div className="glass-card" style={{ padding: '2rem' }}>
    <h1 className="title">Title</h1>
  </div>
</div>
```

---

## 🔄 Migration Checklist

When updating an admin page:
1. [ ] Replace `.admin-container` with `.page-container`
2. [ ] Replace `.glass-card` with `.admin-card`
3. [ ] Add `.mb-6` between all cards
4. [ ] Replace `.title` with `.section-title`
5. [ ] Replace `.subtitle` with `.section-subtitle`
6. [ ] Remove all inline styles
7. [ ] Use utility classes for spacing
8. [ ] Verify consistent 48px edge padding

---

**Last Updated**: 2025-10-07T18:53:00.000Z  
**Enforced By**: Code review, design system compliance
