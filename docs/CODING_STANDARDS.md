# MessMass Coding Standards
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 11.40.1  
**Last Updated:** 2026-01-11T22:28:38.000Z (UTC)

---

## 🏗️ Centralized Module Management Strategy

### Critical Principle: Single Source of Truth

**ALL reusable components, utilities, and styling systems in MessMass are centrally managed.**

**What This Means:**
- We maintain ONE canonical implementation of each component/utility
- Updates happen in ONE place and propagate system-wide
- No duplication, no divergence, no fragmentation
- Security patches and improvements are centralized

**Why This Matters:**
- **Security**: Vulnerabilities fixed once, everywhere
- **Consistency**: UI/UX changes apply uniformly
- **Maintainability**: Single update point reduces technical debt
- **Scalability**: New features built on stable foundation

### Module Inventory

**Complete Catalog**: See **`REUSABLE_COMPONENTS_INVENTORY.md`** for full list of:
- 🧩 **60+ Reusable Components** (modals, cards, forms, charts, selectors)
- 🎨 **200+ Design Tokens** (colors, typography, spacing, shadows)
- 🛠️ **50+ Utility Functions** (API helpers, analytics, data processing)
- 📐 **100+ Utility CSS Classes** (layout, typography, spacing)

### Centralized Update Protocol

**When updating ANY centralized module:**

1. **Document Impact**: List ALL affected pages/components
2. **Update Once**: Modify only the canonical implementation
3. **Test Propagation**: Verify changes across ALL usages
4. **Version Bump**: Follow semantic versioning (PATCH for fixes, MINOR for features)
5. **Document Changes**: Update RELEASE_NOTES.md with module impact

**Example - Updating FormModal:**
```
Module: components/modals/FormModal.tsx
Affected: 12 admin pages (partners, variables, kyc, categories, etc.)
Change Type: MINOR (added new prop `footerAlign`)
Test Coverage: All 12 pages verified
Version: 9.1.1 → 9.2.0
```

### Module Usage Rules

**MANDATORY for ALL development:**

1. **Search Inventory First**: Check `REUSABLE_COMPONENTS_INVENTORY.md` before creating ANYTHING
2. **Use Centralized Modules**: Never duplicate or create custom versions
3. **Report Issues**: If module doesn't fit need, report → improve central module
4. **Track Dependencies**: Document which modules your feature uses

**Verification Command:**
```bash
# Before starting any task, review module inventory
cat REUSABLE_COMPONENTS_INVENTORY.md

# Check if module exists
grep -r "FormModal\|ColoredCard\|UnifiedHashtagInput" REUSABLE_COMPONENTS_INVENTORY.md
```

### Prohibited Actions

❌ **DO NOT**:
- Copy-paste module code into your feature
- Create "slightly modified" versions of central modules
- Bypass centralized components for "special cases"
- Update modules without documenting impact
- Fork modules into feature-specific variants

✅ **MUST DO**:
- Import from canonical location (e.g., `@/components/modals/FormModal`)
- Use modules exactly as documented in inventory
- Propose improvements to central modules (not workarounds)
- Document module dependencies in task planning

---

## 🚫 Prohibited Patterns

### Avoid .trim() Unless Absolutely Necessary

**Rule:** Do NOT use `.trim()` on strings unless there is a specific, documented reason.

**Why:**
- String trimming can cause unexpected data loss or comparison failures
- Users may intentionally include leading/trailing whitespace
- Trim operations mask underlying data quality issues
- Can break exact-match comparisons and database lookups
- Makes debugging harder by hiding the actual data state

**When .trim() IS Allowed:**
- ✅ Sanitizing user input from form fields (with comment explaining why)
- ✅ Parsing external data sources with inconsistent formatting
- ✅ Normalizing search queries (with explicit documentation)

**When .trim() Is PROHIBITED:**
- ❌ Default string processing without justification
- ❌ "Just in case" defensive programming
- ❌ Processing data already in the database
- ❌ Comparing strings without understanding data source
- ❌ API responses or internal data flow

**Examples:**

```typescript
// ❌ WRONG: Unnecessary trim that can hide issues
const name = formData.name.trim();
const email = user.email.trim();
const slug = project.slug.trim();

// ✅ CORRECT: Only trim when truly needed with explanation
// WHAT: Trim user input from search box
// WHY: Users may accidentally add spaces while typing
const searchQuery = userInput.trim();

// ✅ CORRECT: No trim, preserve data as-is
const name = formData.name;
const email = user.email;
const slug = project.slug;
```

**If You Need .trim():**
1. **Ask why** - Is there a data quality issue upstream?
2. **Document it** - Add comment explaining the specific reason
3. **Fix the source** - Better to prevent bad data than clean it everywhere
4. **Test without it** - Verify trim is actually necessary

**Pattern:** Preserve data fidelity by default. Only transform when required.

### Inline Styles Are Forbidden

**Rule:** The `style` prop is **PROHIBITED** on all DOM nodes in this codebase.

**Why:** 
- Inline styles violate separation of concerns
- They cannot be overridden by CSS cascade
- They make theming and design system changes difficult
- They bloat component code and reduce readability
- They bypass our centralized design system

**ESLint Rule:** `react/forbid-dom-props` with `style` forbidden

### Image Distortion (Stretching/Squashing) Is Prohibited

**Rule:** Images MUST preserve their original aspect ratio. Stretching or squashing images is **PROHIBITED**.

**Allowed:** `object-fit: cover` (crops image, preserves aspect ratio)  
**Prohibited:** Stretching/squashing to force fit (distorts aspect ratio)

**Why:**
- Maintains image quality and professional appearance
- Cropping is acceptable, distortion is not
- PDF exports must preserve aspect ratios
- Respects original content proportions

**Global Standard:** 
- Web: `object-fit: cover` in `app/styles/components.css`
- PDF Export: Aspect ratio preservation in `lib/export/pdf.ts`

**Key Principle:** Crop if needed, never distort.

---

## 🔍 MANDATORY: Search Before Implementation

### Rule: Never Create Without Searching First

**Before writing ANY new component, modal, form, or styling:**

1. **Search for existing implementations** in the codebase
2. **Use the existing pattern exactly** - do not deviate
3. **Copy the structure, class names, and tokens** verbatim
4. **Verify with reference files** listed below

**This is NOT optional. Failure to follow existing patterns will result in rejected code.**

### Reference Implementations (MUST USE)

#### Modals - Use FormModal Pattern

**Reference Files:**
- `components/modals/FormModal.tsx` - Structure reference
- `components/modals/FormModal.module.css` - Styling reference
- `components/modals/BaseModal.tsx` - Base container

**Required Structure:**
```tsx
// ✅ CORRECT: Using FormModal
import FormModal from '@/components/modals/FormModal';

export default function MyModal({ isOpen, onClose }) {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={async () => { /* handler */ }}
      title="My Modal Title"
      submitText="Save"
      size="lg"
    >
      {/* Modal content */}
    </FormModal>
  );
}
```

**CSS Structure (if custom content styling needed):**
```css
/* MyModal.module.css - EXACT MATCH to FormModal pattern */

/* Header section */
.header {
  padding: 2rem;
  padding-right: 3.5rem; /* Space for close button */
  border-bottom: 1px solid var(--mm-gray-200);
}

/* Body section */
.body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

/* Mobile responsive */
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

**Real Example from Codebase:**
- `components/SharePopup.tsx` - See lines 110-127 for header/body structure
- `components/SharePopup.module.css` - See lines 1-42 for exact CSS pattern

#### Cards - Use ColoredCard Pattern

**Reference File:** `components/ColoredCard.tsx`

**Required Usage:**
```tsx
// ✅ CORRECT: Using ColoredCard
import ColoredCard from '@/components/ColoredCard';

<ColoredCard 
  accentColor="#3b82f6"
  hoverable={true}
  className="p-4"
>
  {/* Content */}
</ColoredCard>
```

**Real Examples:**
- `app/admin/projects/ProjectsPageClient.tsx` - Lines 205-220
- `app/admin/filter/page.tsx` - Lines 195-210

#### Forms - Use Unified Patterns

**Reference Files:**
- `components/UnifiedHashtagInput.tsx` - Hashtag inputs
- `app/admin/projects/ProjectsPageClient.tsx` - Form structure (lines 916-960)

**Required Structure:**
```tsx
// ✅ CORRECT: Form with CSS modules
<div className="form-group mb-4">
  <label className="form-label-block">Event Name *</label>
  <input
    type="text"
    className="form-input"
    value={formData.eventName}
    onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
    placeholder="Enter event name..."
  />
</div>
```

**CSS Classes to Use:**
- `.form-group` - Form field wrapper
- `.form-label-block` - Field labels
- `.form-input` - Text inputs, selects, textareas
- `.btn` + `.btn-primary` / `.btn-secondary` - Buttons

### Design System Tokens (MANDATORY)

**ALL styling MUST use design tokens. Hardcoded values are PROHIBITED.**

**Token Categories:**

```css
/* ✅ CORRECT: Using design tokens */
.myComponent {
  /* Colors */
  color: var(--mm-gray-900);
  background: var(--mm-white);
  border: 1px solid var(--mm-gray-200);
  
  /* Spacing */
  padding: var(--mm-space-4);  /* 1rem */
  margin: var(--mm-space-2);   /* 0.5rem */
  gap: var(--mm-space-3);      /* 0.75rem */
  
  /* Typography */
  font-size: var(--mm-font-size-sm);        /* 0.875rem */
  font-weight: var(--mm-font-weight-medium); /* 500 */
  line-height: var(--mm-line-height-md);    /* 1.5 */
  
  /* Effects */
  border-radius: var(--mm-radius-lg);  /* 0.5rem */
  box-shadow: var(--mm-shadow-sm);
  transition: all var(--transition-fast); /* 0.15s */
}

/* ❌ FORBIDDEN: Hardcoded values */
.badComponent {
  color: #1f2937;           /* ❌ Use var(--mm-gray-900) */
  padding: 16px;            /* ❌ Use var(--mm-space-4) */
  font-size: 14px;          /* ❌ Use var(--mm-font-size-sm) */
  border-radius: 8px;       /* ❌ Use var(--mm-radius-lg) */
  background: #ffffff;      /* ❌ Use var(--mm-white) */
}
```

**Token Reference:** See `app/styles/theme.css` for all available tokens

**Real Example from Codebase:**
- `components/SharePopup.module.css` - Lines 1-230 (100% design tokens)
- `components/modals/FormModal.module.css` - Lines 1-152 (100% design tokens)

### Pattern Matching Checklist

Before submitting any code, verify:

- [ ] **Searched** for existing similar components
- [ ] **Identified** reference file to copy from
- [ ] **Matched** exact class name structure (`.header`, `.body`, etc.)
- [ ] **Used** design tokens for ALL colors, spacing, typography
- [ ] **Copied** responsive breakpoints from reference
- [ ] **Verified** no hardcoded values (run: `grep -r "#[0-9a-f]\{6\}\|[0-9]\+px" *.css`)
- [ ] **Tested** mobile responsiveness matches reference

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

### PageStyle Dynamic Gradients (Exception)

**The ONLY exception** to the inline style prohibition is for dynamic page style gradients that come from the database.

**Why:** Page styles are stored in MongoDB and loaded at runtime. These custom gradients cannot be predefined in CSS modules.

**Allowed Pattern:**
```tsx
// ✅ EXCEPTION: Dynamic page style gradients from database
<div 
  className={styles.pageContainer}
  style={pageStyle?.backgroundGradient ? {
    background: `linear-gradient(${pageStyle.backgroundGradient})`
  } : undefined}
>
```

**Important:** 
- Only apply to top-level page containers
- Only use for `background` property from `pageStyle` object
- Always check for existence with optional chaining
- Always provide `undefined` fallback for when no style is set

**Forbidden:** Using inline styles for any other purpose, even with dynamic values.

If you encounter any other legitimate need for inline styles:
1. Refactor to use CSS variables
2. Create a new CSS module
3. Extend the design system with new utilities

**Never** add inline styles as a "quick fix."

---

## 🚨 Enforcement

### CI/CD Checks

- **Lint checks** run on every commit
- **Build failures** for TypeScript errors
- **Grep checks** for hardcoded values in CSS

### Code Review Standards

**The following will be REJECTED:**

1. **Inline styles** on DOM elements (except PageStyle gradients)
2. **Hardcoded colors** instead of design tokens
3. **Hardcoded spacing** (px values) instead of tokens
4. **Custom modal implementations** instead of FormModal/BaseModal
5. **Custom card components** instead of ColoredCard
6. **Deviation from reference implementations** without justification
7. **Unnecessary .trim()** calls without documented justification

### Consequences of Non-Compliance

| Violation | Consequence |
|-----------|-------------|
| Inline styles | **Immediate rejection** - rewrite required |
| Hardcoded colors/spacing | **Rejection** - convert to design tokens |
| Not using existing components | **Rejection** - use reference implementation |
| Not searching codebase first | **Rejection** - demonstrate research |
| Creating duplicate patterns | **Rejection** - consolidate with existing |
| Unnecessary .trim() calls | **Rejection** - remove or justify with comment |

### Verification Commands

**Before submitting code, run these checks:**

```bash
# Check for hardcoded hex colors in CSS
grep -r "#[0-9a-f]\{6\}" --include="*.css" --include="*.module.css" components/ app/

# Check for hardcoded px values (excluding 0px, 1px, 2px borders)
grep -r "[3-9][0-9]*px\|[0-9]\{3,\}px" --include="*.css" --include="*.module.css" components/ app/

# Check for inline style props in JSX
grep -r 'style={{' --include="*.tsx" --include="*.jsx" components/ app/

# Check for .trim() usage (review each for justification)
grep -r "\.trim()" --include="*.ts" --include="*.tsx" app/ components/ lib/

# Run build
npm run build

# Run type check
npm run type-check
```

**If any of these return results (except allowed exceptions), your code will be rejected.**

### AI Development Rules

**For WARP and other AI tools:**

1. **MUST search** existing implementations before writing code
2. **MUST reference** specific files and line numbers when copying patterns
3. **MUST use** design tokens exclusively (no hardcoded values)
4. **MUST match** existing component structure exactly
5. **MUST verify** mobile responsiveness matches reference

**Failure to follow these rules = code rejection**

### Documentation as Contract

This document is the **authoritative source** for coding standards.

**All code must comply:**
- Human developers
- AI development tools (WARP, Copilot, etc.)
- External contributors
- Code generators

**No exceptions** without explicit approval and documentation update.

---

## 📚 Reference Quick Links

### Essential Files to Study

**Modals:**
- `components/modals/FormModal.tsx` + `.module.css`
- `components/modals/BaseModal.tsx` + `.module.css`
- `components/modals/ConfirmDialog.tsx`
- `components/SharePopup.tsx` + `.module.css`

**Forms:**
- `app/admin/projects/ProjectsPageClient.tsx` (lines 905-1038)
- `components/UnifiedHashtagInput.tsx`

**Cards:**
- `components/ColoredCard.tsx`
- `app/admin/filter/page.tsx` (ColoredCard usage)

**Design Tokens:**
- `app/styles/theme.css` (all CSS variables)
- `app/styles/utilities.css` (utility classes)
- `app/styles/components.css` (global components)

### Command Reference

```bash
# Search for modal implementations
grep -r "FormModal" --include="*.tsx" components/ app/

# Find ColoredCard usage
grep -r "ColoredCard" --include="*.tsx" app/

# List all CSS modules
find components/ app/ -name "*.module.css"

# Check design token usage
grep -r "var(--mm-" --include="*.css" components/
```

---

*This document is part of the MessMass technical standards and must be followed by all contributors, including AI development tools. Version 11.5.0 - Last Updated: 2025-11-12T16:34:00.000Z*
