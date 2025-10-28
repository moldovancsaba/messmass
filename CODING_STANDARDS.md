# MessMass Coding Standards

**Version:** 8.0.0  
**Last Updated:** 2025-10-20T13:49:00.000Z

---

## 🚫 Prohibited Patterns

### Inline Styles Are Forbidden

**Rule:** The `style` prop is **PROHIBITED** on all DOM nodes in this codebase.

**Why:** 
- Inline styles violate separation of concerns
- They cannot be overridden by CSS cascade
- They make theming and design system changes difficult
- They bloat component code and reduce readability
- They bypass our centralized design system

**ESLint Rule:** `react/forbid-dom-props` with `style` forbidden

---

## ✅ Correct Styling Approaches

### 1. CSS Modules (Preferred)

For component-specific styles, use CSS Modules:

```tsx
// MyComponent.tsx
import styles from './MyComponent.module.css';

export default function MyComponent() {
  return <div className={styles.container}>Content</div>;
}
```

```css
/* MyComponent.module.css */
.container {
  padding: 1rem;
  background: var(--mm-white);
  border-radius: var(--mm-radius-lg);
}
```

### 2. CSS Variables for Dynamic Values

For values that change based on props or state:

```tsx
// Component with dynamic color
<div 
  className={styles.box}
  style={{ 
    ['--box-color' as string]: dynamicColor 
  } as React.CSSProperties}
/>
```

```css
/* CSS Module */
.box {
  background: var(--box-color, #667eea);
  /* Fallback value provided */
}
```

### 3. Conditional Classes

For state-based styling:

```tsx
<button 
  className={`${styles.btn} ${isActive ? styles.active : ''}`}
>
  Click me
</button>
```

### 4. Global Utility Classes

For common patterns, use utilities from `app/styles/utilities.css`:

```tsx
<div className="flex gap-4 p-4">
  <span className="text-primary font-semibold">Label</span>
</div>
```

---

## 📐 Design System Integration

### CSS Variable Naming Convention

All CSS variables follow the `--mm-*` prefix:

- **Colors:** `--mm-color-primary-500`, `--mm-gray-900`
- **Spacing:** `--mm-space-4`, `--mm-space-8`
- **Typography:** `--mm-font-size-lg`, `--mm-font-weight-bold`
- **Effects:** `--mm-shadow-md`, `--mm-radius-lg`

Defined in: `app/styles/theme.css`

### Component Styling Checklist

- [ ] Create a `.module.css` file alongside your component
- [ ] Import and use the CSS module in your component
- [ ] Use CSS variables for theme values
- [ ] Use dynamic CSS variables for prop-based values
- [ ] Add comments explaining "WHAT" and "WHY" for complex styles
- [ ] Never use the `style` prop on DOM elements

---

## 🔧 Migration Guide

### Converting Inline Styles to CSS Modules

**Before (❌ Forbidden):**
```tsx
<div style={{
  padding: '1rem',
  background: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}}>
  Content
</div>
```

**After (✅ Correct):**
```tsx
// Component.tsx
import styles from './Component.module.css';

<div className={styles.card}>
  Content
</div>
```

```css
/* Component.module.css */
.card {
  padding: var(--mm-space-4);
  background: var(--mm-white);
  border-radius: var(--mm-radius-md);
  box-shadow: var(--mm-shadow-sm);
}
```

### Dynamic Values Example

**Before (❌ Forbidden):**
```tsx
<div style={{ 
  width: `${percentage}%`,
  background: itemColor 
}}>
```

**After (✅ Correct):**
```tsx
<div 
  className={styles.progressBar}
  style={{
    ['--bar-width' as string]: `${percentage}%`,
    ['--bar-color' as string]: itemColor
  } as React.CSSProperties}
>
```

```css
.progressBar {
  width: var(--bar-width, 0%);
  background: var(--bar-color, var(--mm-color-primary-500));
}
```

---

## 🎯 Common Patterns

### Hover States

**Forbidden:** Using `onMouseEnter`/`onMouseLeave` to set inline styles

**Correct:** CSS hover pseudo-classes

```css
.button {
  transition: all 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: var(--mm-shadow-lg);
}
```

### Conditional Styling

**Forbidden:** Ternary operators in style objects

**Correct:** Conditional classes

```tsx
<div className={`${styles.card} ${isActive ? styles.active : ''}`}>
```

### Responsive Design

**Forbidden:** JavaScript-based responsive styles

**Correct:** CSS media queries in modules

```css
.container {
  padding: var(--mm-space-4);
}

@media (max-width: 768px) {
  .container {
    padding: var(--mm-space-2);
  }
}
```

---

## 🛠️ Tooling

### ESLint Configuration

```json
{
  "rules": {
    "react/forbid-dom-props": ["warn", {
      "forbid": [{
        "propName": "style",
        "message": "Inline styles are prohibited. Use CSS modules or utility classes instead. See CODING_STANDARDS.md"
      }]
    }]
  }
}
```

### Auto-Fix Not Available

The `style` prop rule **cannot be auto-fixed** by ESLint. Manual migration required.

---

## 📚 Related Documentation

- **Design System:** `app/styles/theme.css`
- **Utilities:** `app/styles/utilities.css`
- **Components:** `app/styles/components.css`
- **Architecture:** `ARCHITECTURE.md`
- **WARP Guide:** `WARP.md`

---

## ✋ Exceptions

**There are NO exceptions** to the inline style prohibition in this codebase.

If you encounter a legitimate need for inline styles:
1. Refactor to use CSS variables
2. Create a new CSS module
3. Extend the design system with new utilities

**Never** add inline styles as a "quick fix."

---

## 🚨 Enforcement

- **CI/CD:** Lint checks run on every commit
- **Code Review:** Inline styles will be rejected
- **AI Development:** WARP is configured to enforce this rule
- **Documentation:** This file is the authoritative source

**Non-compliance:** Pull requests with inline styles will not be merged.

---

*This document is part of the MessMass technical standards and must be followed by all contributors, including AI development tools.*
