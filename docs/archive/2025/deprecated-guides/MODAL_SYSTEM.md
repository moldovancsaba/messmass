# Modal System Documentation
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version**: 8.24.2+  
**Date**: 2025-11-01  
**Status**: ✅ PRODUCTION

---

## 🔒 MANDATORY: Use FormModal - Do NOT Create Custom Modals

**Reference Implementation:** `components/modals/FormModal.tsx` (lines 1-148)

### Rule: FormModal is THE Standard

**ALL modals MUST use FormModal or BaseModal. Custom modal implementations are PROHIBITED.**

**Real Examples in Codebase:**
- ✅ `app/admin/projects/ProjectsPageClient.tsx` lines 907-967 (Create Project modal)
- ✅ `app/admin/projects/ProjectsPageClient.tsx` lines 971-1038 (Edit Project modal)
- ✅ `app/admin/partners/page.tsx` lines 298-387 (Partner modal)
- ✅ `components/SharePopup.tsx` lines 110-231 (Share dialog with BaseModal)
- ✅ `components/PageStyleEditor.tsx` lines 105-536 (Page style form)

### Exact Pattern to Copy

```tsx
// ✅ CORRECT: From ProjectsPageClient.tsx line 907
import FormModal from '@/components/modals/FormModal';

<FormModal
  isOpen={showNewProjectForm}
  onClose={() => setShowNewProjectForm(false)}
  onSubmit={createNewProject}
  title="➕ Create New Project"
  submitText="Create Project"
  isSubmitting={isCreatingProject}
  size="lg"
>
  <div className="form-group mb-4">
    <label className="form-label-block">Event Name *</label>
    <input
      type="text"
      className="form-input"
      value={newProjectData.eventName}
      onChange={(e) => setNewProjectData(prev => ({ ...prev, eventName: e.target.value }))}
      placeholder="Enter event name..."
    />
  </div>
</FormModal>
```

### CSS Pattern (If Custom Content Styling Needed)

**Reference:** `components/modals/FormModal.module.css` lines 1-152

```css
/* Header section - MUST match FormModal */
.header {
  padding: 2rem;
  padding-right: 3.5rem;
  border-bottom: 1px solid var(--mm-gray-200);
}

/* Body section - MUST match FormModal */
.body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

/* Mobile responsive - MUST include */
@media (max-width: 640px) {
  .header { padding: 1.5rem; padding-right: 3rem; }
  .body { padding: 1.5rem; }
}
```

**Real Example:** `components/SharePopup.module.css` lines 1-230 (100% design tokens)

### Consequences

| Violation | Result |
|-----------|--------|
| Creating custom modal component | ❌ Rejection |
| Not using FormModal/BaseModal | ❌ Rejection |
| Hardcoded padding/spacing | ❌ Rejection |
| Missing mobile responsive | ❌ Rejection |

---

## Overview

The MessMass unified modal system provides professional, accessible, and consistent modal dialogs throughout the application. Built with React, TypeScript, and CSS Modules, it replaces 640+ lines of duplicated modal code with a clean component-based architecture.

### Key Benefits

- **640+ lines of code eliminated** - Replaces hardcoded modals across 8+ admin pages
- **Consistent UX** - Same behavior, styling, and animations everywhere
- **Full accessibility** - WCAG AA compliant with ARIA attributes and focus management
- **Type-safe** - Full TypeScript support with documented props
- **Easy to maintain** - Single source of truth for modal logic

---

## Quick Start

### Installation

The modal system is included in MessMass v8.24.0+. No additional installation required.

### Basic Usage

```tsx
import { FormModal, ConfirmDialog, BaseModal } from '@/components/modals';

// Form modal
<FormModal
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  onSubmit={handleSubmit}
  title="Create Project"
  submitText="Create"
>
  <div className="form-group">
    <label>Project Name</label>
    <input value={name} onChange={(e) => setName(e.target.value)} />
  </div>
</FormModal>

// Confirmation dialog
<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete User"
  message="This action cannot be undone."
  variant="danger"
/>
```

---

## Components

### 1. BaseModal

**Purpose**: Foundation component for all modals with core functionality.

**When to use**: Building custom modals that don't fit the specialized components.

#### Props

```typescript
interface BaseModalProps {
  isOpen: boolean;              // Whether modal is visible
  onClose: () => void;          // Close handler
  children: React.ReactNode;    // Modal content
  
  // Optional customization
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';  // Default: 'md'
  showCloseButton?: boolean;    // Show × button (default: true)
  closeOnClickOutside?: boolean; // Close on overlay click (default: true)
  closeOnEscape?: boolean;      // Close on Escape key (default: true)
  className?: string;           // Additional CSS classes
  
  // Accessibility
  ariaLabel?: string;           // Screen reader label
  ariaDescribedBy?: string;     // ID of description element
  zIndex?: number;              // Custom z-index (default: CSS variable)
}
```

#### Size Reference

| Size | Width | Use Case |
|------|-------|----------|
| `sm` | 400px | Small confirmations, alerts |
| `md` | 600px | Standard forms, content |
| `lg` | 800px | Large forms, multi-section content |
| `xl` | 1200px | Complex forms, data tables |
| `full` | 90vw | Full-width content, dashboards |

#### Example

```tsx
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  size="lg"
  ariaLabel="Custom Modal"
>
  <div style={{ padding: '2rem' }}>
    <h2>Custom Modal Content</h2>
    <p>Build any modal structure you need.</p>
  </div>
</BaseModal>
```

---

### 2. FormModal

**Purpose**: Forms with header, scrollable body, and action buttons.

**When to use**: Create/edit modals, settings forms, multi-field input.

#### Props

```typescript
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;  // Async submit handler
  title: string;                          // Modal header title
  
  // Optional
  submitText?: string;                    // Default: 'Save'
  cancelText?: string;                    // Default: 'Cancel'
  isSubmitting?: boolean;                 // Show loading state
  size?: 'md' | 'lg' | 'xl';             // Default: 'lg'
  subtitle?: string;                      // Text below title
  disableSubmit?: boolean;                // Disable submit button
  customFooter?: React.ReactNode;         // Replace default buttons
  
  children: React.ReactNode;              // Form fields
}
```

#### Features

- **Loading states** - Automatic spinner on submit
- **Disabled controls** - Prevents double-submit
- **Scrollable body** - Long forms stay accessible
- **Standard layout** - Header, body, footer structure

#### Example

```tsx
<FormModal
  isOpen={showCreateProject}
  onClose={() => setShowCreateProject(false)}
  onSubmit={async () => {
    await createProject({ name, date });
  }}
  title="➕ Create New Project"
  subtitle="Enter project details"
  submitText="Create Project"
  isSubmitting={isCreating}
  disableSubmit={!name || !date}
  size="lg"
>
  <div className="form-group">
    <label>Event Name *</label>
    <input
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Summer Festival 2025"
    />
  </div>
  
  <div className="form-group">
    <label>Event Date *</label>
    <input
      type="date"
      value={date}
      onChange={(e) => setDate(e.target.value)}
    />
  </div>
</FormModal>
```

---

### 3. ConfirmDialog

**Purpose**: Confirmation dialogs for dangerous or important actions.

**When to use**: Delete confirmations, regenerate actions, irreversible operations.

#### Props

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;                  // Action to confirm
  title: string;                          // Dialog title
  message: string;                        // Explanation text
  
  // Optional
  confirmText?: string;                   // Default: 'Confirm'
  cancelText?: string;                    // Default: 'Cancel'
  variant?: 'danger' | 'warning' | 'info'; // Default: 'info'
  icon?: React.ReactNode;                 // Custom icon
}
```

#### Variants

| Variant | Icon | Button Color | Use Case |
|---------|------|--------------|----------|
| `danger` | ⚠️ | Red | Deletions, destructive actions |
| `warning` | ⚠️ | Yellow | Potentially risky actions |
| `info` | ❓ | Blue | Important confirmations |

#### Example

```tsx
<ConfirmDialog
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={() => {
    deleteUser(userId);
    setShowDeleteConfirm(false);
  }}
  title="Delete User"
  message="This will permanently delete the user account and all associated data. This action cannot be undone."
  confirmText="Delete User"
  variant="danger"
/>
```

---

## Migration Guide

### From Hardcoded Modal to FormModal

**Before** (Hardcoded):
```tsx
{showCreateForm && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2 className="modal-title">Create Category</h2>
        <button onClick={() => setShowCreateForm(false)} className="modal-close">
          ×
        </button>
      </div>
      <div className="modal-body">
        {/* Form fields */}
      </div>
      <div className="modal-footer">
        <button onClick={() => setShowCreateForm(false)}>Cancel</button>
        <button onClick={handleCreate}>Create</button>
      </div>
    </div>
  </div>
)}
```

**After** (FormModal):
```tsx
<FormModal
  isOpen={showCreateForm}
  onClose={() => setShowCreateForm(false)}
  onSubmit={handleCreate}
  title="Create Category"
  submitText="Create"
>
  {/* Form fields - no wrapper needed */}
</FormModal>
```

**Lines saved**: ~40-50 lines per modal

---

### From window.confirm() to ConfirmDialog

**Before**:
```tsx
const handleDelete = () => {
  if (window.confirm('Are you sure?')) {
    deleteItem();
  }
};
```

**After**:
```tsx
// State
const [showConfirm, setShowConfirm] = useState(false);

// Trigger
<button onClick={() => setShowConfirm(true)}>Delete</button>

// Modal
<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={() => {
    deleteItem();
    setShowConfirm(false);
  }}
  title="Confirm Deletion"
  message="Are you sure you want to delete this item?"
  variant="danger"
/>
```

---

## Accessibility

All modal components follow WCAG AA guidelines:

### Keyboard Navigation

- **Escape** - Close modal (if `closeOnEscape` enabled)
- **Tab** - Navigate within modal (focus trapped)
- **Enter** - Submit form (FormModal only)

### Screen Readers

- `role="dialog"` - Identifies modal to assistive tech
- `aria-modal="true"` - Announces modal context
- `aria-label` - Describes modal purpose
- `aria-describedby` - Links to description element

### Focus Management

- **On open** - Saves current focused element
- **While open** - Traps focus within modal
- **On close** - Restores focus to trigger element

---

## Styling

### CSS Variables

Modals use design system tokens from `app/styles/theme.css`:

```css
/* Z-index */
--mm-z-modal: 1050;
--mm-z-modal-overlay: 1040;

/* Colors */
--mm-gray-50: #f9fafb;
--mm-gray-900: #111827;
--mm-color-primary-500: #3b82f6;
--mm-error: #ef4444;

/* Spacing */
--mm-space-4: 1rem;
--mm-space-6: 1.5rem;

/* Border Radius */
--mm-radius-lg: 0.75rem;
--mm-radius-xl: 1rem;
```

### Customization

#### Custom Modal Width

```tsx
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  className="custom-width"
>
  {/* content */}
</BaseModal>
```

```css
/* CustomModal.module.css */
.custom-width {
  max-width: 900px;
}
```

#### Custom Button Styles

```tsx
<FormModal
  isOpen={isOpen}
  onClose={onClose}
  onSubmit={handleSubmit}
  title="Custom Form"
  customFooter={
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
      <button className="btn btn-secondary" onClick={onClose}>
        Cancel
      </button>
      <button className="btn btn-success" onClick={handleSubmit}>
        Save & Publish
      </button>
    </div>
  }
>
  {/* form fields */}
</FormModal>
```

---

## Best Practices

### DO ✅

- **Use specialized components** - FormModal for forms, ConfirmDialog for confirmations
- **Provide clear titles** - Describe modal purpose in title
- **Use danger variant** - For deletions and destructive actions
- **Handle loading states** - Show spinner during async operations
- **Validate before submit** - Use `disableSubmit` prop
- **Restore focus** - BaseModal handles this automatically
- **Use aria labels** - Improve screen reader experience

### DON'T ❌

- **Create inline modals** - Use components instead of `<div className="modal-overlay">`
- **Use window.confirm()** - Use ConfirmDialog instead
- **Forget to handle close** - Always provide onClose handler
- **Nest modals** - Avoid modal-within-modal patterns
- **Use inline styles** - Use CSS Modules or design tokens
- **Block escape key** - Only disable for critical actions

---

## Examples

### Complex Form with Validation

```tsx
const [form, setForm] = useState({ name: '', email: '', role: 'admin' });
const [errors, setErrors] = useState<Record<string, string>>({});
const [submitting, setSubmitting] = useState(false);

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!form.name) newErrors.name = 'Name is required';
  if (!form.email) newErrors.email = 'Email is required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  setSubmitting(true);
  try {
    await createUser(form);
    setShowModal(false);
  } catch (error) {
    setErrors({ submit: 'Failed to create user' });
  } finally {
    setSubmitting(false);
  }
};

<FormModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleSubmit}
  title="Create User"
  isSubmitting={submitting}
  disableSubmit={!form.name || !form.email}
>
  <div className="form-group">
    <label>Name *</label>
    <input
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
    />
    {errors.name && <span className="error">{errors.name}</span>}
  </div>
  
  <div className="form-group">
    <label>Email *</label>
    <input
      type="email"
      value={form.email}
      onChange={(e) => setForm({ ...form, email: e.target.value })}
    />
    {errors.email && <span className="error">{errors.email}</span>}
  </div>
  
  {errors.submit && <div className="error">{errors.submit}</div>}
</FormModal>
```

### Chained Confirmations

```tsx
const handleCriticalAction = async () => {
  setConfirmModal({
    isOpen: true,
    title: 'Are you absolutely sure?',
    message: 'This will affect 1,000+ users.',
    onConfirm: () => {
      setConfirmModal({
        isOpen: true,
        title: 'Final Confirmation',
        message: 'Type DELETE to confirm',
        onConfirm: performCriticalAction,
      });
    },
  });
};
```

---

## Troubleshooting

### Modal doesn't close on Escape

**Issue**: Escape key not working  
**Solution**: Check `closeOnEscape` prop (default: true)

```tsx
<BaseModal closeOnEscape={true} {...props}>
```

### Focus not restoring after close

**Issue**: Focus lost when modal closes  
**Solution**: Ensure modal is unmounted cleanly (BaseModal handles automatically)

### Modal content cut off

**Issue**: Content scrolling issues  
**Solution**: Use FormModal for long content (has built-in scroll)

### Z-index conflicts

**Issue**: Modal behind other elements  
**Solution**: Use `zIndex` prop or adjust CSS variables

```tsx
<BaseModal zIndex={2000} {...props}>
```

---

## Technical Details

### Dependencies

- `react` - Component framework
- `focus-trap-react` - Focus management library (installed v8.24.0+)

### File Structure

```
components/modals/
├── index.ts                   # Barrel export
├── BaseModal.tsx              # Core modal component
├── BaseModal.module.css       # Base modal styles
├── FormModal.tsx              # Form modal wrapper
├── FormModal.module.css       # Form-specific styles
├── ConfirmDialog.tsx          # Confirmation dialog
└── ConfirmDialog.module.css   # Confirm dialog styles
```

### Bundle Size

- **BaseModal**: ~3KB (gzipped)
- **FormModal**: ~2KB (gzipped)
- **ConfirmDialog**: ~1.5KB (gzipped)
- **Total**: ~6.5KB (gzipped)

---

## Migration Status

| Page | Status | Modals Migrated | Lines Saved |
|------|--------|-----------------|-------------|
| `/admin/kyc` | ✅ Complete | 2 | ~80 |
| `/admin/categories` | ✅ Complete | 2 | ~180 |
| `/admin/users` | ✅ Complete | 1 (ConfirmDialog) | ~40 |
| `/admin/projects` | 🔜 Planned | 2 | ~150 |
| `/admin/partners` | 🔜 Planned | 2 | ~160 |
| `/admin/bitly` | 🔜 Planned | 1 | ~70 |
| `/admin/filter` | 🔜 Planned | 1 | ~60 |
| `/admin/visualization` | 🔜 Planned | 1 | ~50 |

**Total Estimated Savings**: 790+ lines of code

---

## Support

### Questions?

- Check this documentation first
- Review component prop types
- See examples in migrated pages
- Refer to `MODAL_AUDIT_AND_REFACTOR.md` for design decisions

### Issues?

1. Verify TypeScript types (`npm run type-check`)
2. Check build output (`npm run build`)
3. Review browser console for errors
4. Test accessibility with screen reader

---

**Last Updated**: 2026-01-11T22:28:38.000Z  
**Maintained by**: MessMass Development Team
