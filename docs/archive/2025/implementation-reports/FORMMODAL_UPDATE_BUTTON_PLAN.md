# FormModal Update Button & Status Indicator Enhancement Plan
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Operations

**Version**: 9.3.3  
**Date**: 2025-11-02  
**Status**: Planning Phase

## 🎯 Objective

Enhance the centralized `FormModal` component to support:
1. **"Update" button** - Save without closing modal (between Cancel and Save)
2. **Status indicator** - Real-time visual feedback (Ready/Saving/Saved/Error)

## 📋 Current State Analysis

### Components Involved

**Primary Component**: `components/modals/FormModal.tsx`
- Centralized modal used across all admin forms
- Currently supports: `onSubmit`, `isSubmitting`, `customFooter`
- Button layout: `[Cancel] [Save]`

**Status Indicator**: `components/SaveStatusIndicator.tsx`
- Already exists and works perfectly
- Shows: 📝 Ready | 💾 Saving... | ✅ Saved | ❌ Save Error
- Used in: ChartAlgorithmManager, EditorDashboard, Filter pages

### Current Usage Pattern

```tsx
// ChartAlgorithmManager.tsx (lines 540-789)
const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

const handleSave = async () => {
  setSaveStatus('saving');
  try {
    await onSave(formData);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  } catch (error) {
    setSaveStatus('error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  }
};
```

## ✨ Proposed Solution

### 1. Extend FormModal Props

```typescript
// components/modals/FormModal.tsx
export interface FormModalProps {
  // ... existing props
  
  /** NEW: Optional update handler (save without closing) */
  onUpdate?: () => Promise<void> | void;
  
  /** NEW: Current save status (for status indicator) */
  saveStatus?: SaveStatus;
  
  /** NEW: Show status indicator in footer */
  showStatusIndicator?: boolean;
  
  /** NEW: Update button text */
  updateText?: string;
}
```

### 2. New Button Layout

```
┌────────────────────────────────────────┐
│ [Status: 📝 Ready]  [Cancel] [Update] [Save] │
└────────────────────────────────────────┘
```

**Layout Logic**:
- **No onUpdate prop**: `[Status] [Cancel] [Save]` (current behavior)
- **With onUpdate prop**: `[Status] [Cancel] [Update] [Save]`
- **Status hidden if**: `showStatusIndicator={false}` (default: true)

### 3. Button Behavior

| Button | Action | Modal State | Status Change |
|--------|--------|-------------|---------------|
| **Cancel** | Call `onClose()` | ✅ Closes | No change |
| **Update** | Call `onUpdate()` | ⏸️ Stays open | idle → saving → saved/error → idle |
| **Save** | Call `onSubmit()` | ✅ Closes | idle → saving → (closes) |

### 4. Status Flow

```
User clicks "Update" → saveStatus: 'saving'
                     ↓
           API call successful? 
                  ↙         ↘
               YES           NO
                ↓             ↓
     saveStatus: 'saved'   saveStatus: 'error'
                ↓             ↓
         (wait 2s)       (wait 3s)
                ↓             ↓
     saveStatus: 'idle'   saveStatus: 'idle'
```

## 🔧 Implementation Steps

### Phase 1: Extend FormModal Component

**File**: `components/modals/FormModal.tsx`

```typescript
// 1. Add new props to interface (lines 27-63)
export interface FormModalProps {
  // ... existing props ...
  onUpdate?: () => Promise<void> | void;
  saveStatus?: SaveStatus;
  showStatusIndicator?: boolean;
  updateText?: string;
}

// 2. Add props to component (lines 65-78)
export default function FormModal({
  // ... existing props ...
  onUpdate,
  saveStatus = 'idle',
  showStatusIndicator = true,
  updateText = 'Update',
}: FormModalProps) {

// 3. Add update handler (lines 80-95)
const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (onUpdate) {
    await onUpdate();
  }
};

// 4. Update footer JSX (lines 114-144)
<div className={styles.footer}>
  {customFooter ? (
    customFooter
  ) : (
    <>
      {/* Left: Status Indicator */}
      {showStatusIndicator && (
        <div className={styles.statusContainer}>
          <SaveStatusIndicator status={saveStatus} />
        </div>
      )}
      
      {/* Right: Action Buttons */}
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting || saveStatus === 'saving'}
          className={styles.cancelButton}
        >
          {cancelText}
        </button>
        
        {/* NEW: Update button (if onUpdate provided) */}
        {onUpdate && (
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isSubmitting || saveStatus === 'saving'}
            className={styles.updateButton}
          >
            {saveStatus === 'saving' ? (
              <>
                <span className={styles.spinner}></span>
                Updating...
              </>
            ) : (
              updateText
            )}
          </button>
        )}
        
        <button
          type="submit"
          disabled={submitDisabled || saveStatus === 'saving'}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <>
              <span className={styles.spinner}></span>
              Saving...
            </>
          ) : (
            submitText
          )}
        </button>
      </div>
    </>
  )}
</div>
```

### Phase 2: Update FormModal CSS

**File**: `components/modals/FormModal.module.css`

```css
/* Footer with flexbox layout */
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--mm-gray-200);
  background: var(--mm-gray-50);
}

/* Status indicator on left */
.statusContainer {
  flex: 0 0 auto;
}

/* Button group on right */
.buttonGroup {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
}

/* Update button styling (between Cancel and Save) */
.updateButton {
  padding: 0.75rem 1.5rem;
  background: var(--mm-primary-500);
  color: var(--mm-white);
  border: none;
  border-radius: var(--mm-radius-md);
  font-size: var(--mm-font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.8; /* Slightly dimmed to differentiate from Save */
}

.updateButton:hover:not(:disabled) {
  opacity: 1;
  background: var(--mm-primary-600);
}

.updateButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive: Stack on mobile */
@media (max-width: 640px) {
  .footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .statusContainer {
    order: -1; /* Status on top */
    margin-bottom: 1rem;
  }
  
  .buttonGroup {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .buttonGroup button {
    width: 100%;
  }
}
```

### Phase 3: Update ChartAlgorithmManager

**File**: `components/ChartAlgorithmManager.tsx`

```typescript
// 1. Add handleUpdate function (after handleSave)
const handleUpdate = async () => {
  // Same validation as handleSave
  if (!formData.chartId || !formData.title) {
    alert('Please fill in Chart ID and Title');
    return;
  }
  
  const requiredCount = getRequiredElementCount(formData.type);
  if (formData.elements.length !== requiredCount) {
    alert(`${formData.type.toUpperCase()} charts must have exactly ${requiredCount} element${requiredCount !== 1 ? 's' : ''}`);
    return;
  }
  
  const missingData = formData.elements.find((element, index) => !element.label.trim() || !element.formula.trim());
  if (missingData) {
    alert('Please fill in all element labels and formulas');
    return;
  }
  
  const invalidFormula = Object.entries(formulaValidation).find(([_, validation]) => !validation.isValid);
  if (invalidFormula) {
    alert('Please fix all formula errors before saving');
    return;
  }
  
  // WHAT: Update without closing modal
  // WHY: Allow rapid iterative editing
  setSaveStatus('saving');
  try {
    await onSave(formData);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    // NOTE: Modal stays open for continued editing
  } catch (error) {
    setSaveStatus('error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  }
};

// 2. Remove customFooter, use new FormModal props
return (
  <FormModal
    isOpen={true}
    onClose={onCancel}
    onSubmit={handleSave} // Save and close
    onUpdate={handleUpdate} // NEW: Update without closing
    saveStatus={saveStatus} // NEW: Pass status
    showStatusIndicator={true} // NEW: Show status
    title={config._id ? 'Edit Chart Configuration' : 'Create Chart Configuration'}
    submitText="Save"
    updateText="Update"
    size="xl"
  >
    {/* Form content unchanged */}
  </FormModal>
);
```

### Phase 4: Apply to Other Admin Pages

Apply the same pattern to all pages using FormModal:

1. **Projects** (`app/admin/projects/ProjectsPageClient.tsx`)
2. **Categories** (`app/admin/categories/page.tsx`)
3. **Partners** (`app/admin/partners/page.tsx`)
4. **Variables/KYC** (`app/admin/kyc/page.tsx`)
5. **Hashtags** (`app/admin/hashtags/page.tsx`)
6. **Users** (`app/admin/users/page.tsx`)

**Pattern**:
```typescript
// 1. Add saveStatus state
const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

// 2. Add handleUpdate function
const handleUpdate = async () => {
  setSaveStatus('saving');
  try {
    await saveData();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  } catch (error) {
    setSaveStatus('error');
    setTimeout(() => setSaveStatus('idle'), 3000);
  }
};

// 3. Use new FormModal props
<FormModal
  onSubmit={handleSaveAndClose}
  onUpdate={handleUpdate}
  saveStatus={saveStatus}
  showStatusIndicator={true}
  // ... other props
/>
```

## 🎨 Visual Design

### Desktop Layout
```
┌──────────────────────────────────────────────────┐
│ Edit Chart Configuration                      × │
├──────────────────────────────────────────────────┤
│                                                  │
│ [Form content here]                              │
│                                                  │
├──────────────────────────────────────────────────┤
│ 📝 Ready          [Cancel] [Update] [Save]       │
└──────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌────────────────────────┐
│ Edit Configuration   × │
├────────────────────────┤
│                        │
│ [Form content]         │
│                        │
├────────────────────────┤
│ 📝 Ready               │
│                        │
│ [Cancel - Full Width]  │
│ [Update - Full Width]  │
│ [Save - Full Width]    │
└────────────────────────┘
```

## ⚠️ Edge Cases & Considerations

### 1. Concurrent Save Operations
**Problem**: User clicks Update, then immediately clicks Save  
**Solution**: Disable all buttons while `saveStatus === 'saving'`

### 2. Error Handling
**Problem**: API fails, user doesn't know what went wrong  
**Solution**: Show error message below status indicator (optional enhancement)

### 3. Unsaved Changes Warning
**Problem**: User clicks Cancel with unsaved changes  
**Solution**: Show confirmation dialog (future enhancement, not in this phase)

### 4. Keyboard Shortcuts
**Enhancement**: Support Cmd+S for Update, Cmd+Enter for Save

## 📊 Success Metrics

1. **User can save without closing** - Update button works
2. **Status is always visible** - SaveStatusIndicator shows in footer
3. **No regressions** - Existing FormModal users work unchanged
4. **Consistent UX** - Same pattern across all admin pages
5. **Mobile friendly** - Stacked layout works on small screens

## 🔄 Rollout Strategy

### Phase 1: Core Infrastructure (Week 1)
- [ ] Update FormModal component with new props
- [ ] Update FormModal CSS with new layout
- [ ] Test in ChartAlgorithmManager
- [ ] Verify on desktop and mobile

### Phase 2: Admin Pages Migration (Week 2)
- [ ] Migrate ChartAlgorithmManager (reference implementation)
- [ ] Migrate Projects page
- [ ] Migrate Partners page
- [ ] Migrate Categories page

### Phase 3: Remaining Pages (Week 3)
- [ ] Migrate KYC/Variables page
- [ ] Migrate Hashtags page
- [ ] Migrate Users page
- [ ] Final testing and documentation

## 📝 Documentation Updates Required

- [ ] Update `ARCHITECTURE.md` - FormModal section
- [ ] Update `REUSABLE_COMPONENTS_INVENTORY.md` - FormModal entry
- [ ] Update `WARP.md` - Admin component patterns
- [ ] Create example code snippets for future use

## 🚀 Version Increment

**After completion**: Bump to v9.4.0 (MINOR - new feature)

---

**Author**: AI Assistant  
**Reviewed By**: [Pending]  
**Approved By**: [Pending]
