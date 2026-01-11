# Form Input Migration Guide
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Product

**Version**: 11.54.5  
**Last Updated**: 2026-01-11T22:28:38.000Z  
**Purpose**: Prevent aggressive parsing anti-patterns in future forms

## 🎯 Quick Reference

### ❌ Anti-Pattern (DON'T DO THIS)
```tsx
<input
  type="number"
  value={formData.age}
  onChange={(e) => setFormData({ 
    ...formData, 
    age: parseInt(e.target.value) || 0  // ❌ WRONG
  })}
/>
```

### ✅ Correct Pattern
```tsx
<input
  type="number"
  value={formData.age}
  onChange={(e) => setFormData({ 
    ...formData, 
    age: e.target.value as any  // ✅ Store raw value
  })}
  onBlur={() => setFormData({ 
    ...formData, 
    age: Math.max(0, parseInt(String(formData.age)) || 0)  // ✅ Parse on blur
  })}
/>
```

### ✅ Best: Use Unified Component
```tsx
import UnifiedNumberInput from '@/components/UnifiedNumberInput';

<UnifiedNumberInput
  label="Age"
  value={formData.age}
  onSave={(newValue) => setFormData({ ...formData, age: newValue })}
  min={0}
/>
```

---

## 📋 Migration Checklist

When creating or modifying forms, follow this checklist:

### Step 1: Identify Input Type

| Data Type | Component to Use | Example |
|-----------|-----------------|---------|
| **String** (short) | `UnifiedTextInput` | Name, email, URL |
| **String** (multi-line) | `TextareaField` | Description, notes |
| **Number** (integer) | `UnifiedNumberInput` | Count, order, ID |
| **Number** (decimal) | `UnifiedNumberInput` with `allowDecimal={true}` | Price, percentage |
| **Boolean** | `<input type="checkbox">` | Active, enabled |
| **Enum/Options** | `<select>` | Status, category |
| **Color** | `<input type="color">` | Theme colors |
| **Date** | `<input type="date">` | Event date |

### Step 2: Import Unified Component

```tsx
// At top of file
import UnifiedTextInput from '@/components/UnifiedTextInput';
import UnifiedNumberInput from '@/components/UnifiedNumberInput';
import TextareaField from '@/components/TextareaField';
```

### Step 3: Replace Raw Input

**Before (❌ Raw HTML input)**:
```tsx
<div className="form-group">
  <label>Project Name</label>
  <input
    type="text"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  />
</div>
```

**After (✅ Unified component)**:
```tsx
<UnifiedTextInput
  label="Project Name"
  value={formData.name}
  onSave={(newValue) => setFormData({ ...formData, name: newValue })}
  placeholder="Enter project name"
/>
```

### Step 4: Test Editing Behavior

- [ ] Click on input field
- [ ] Type normally - no interruptions?
- [ ] Delete all text/numbers - allows empty?
- [ ] Tab or click out - value saved?
- [ ] Invalid value entered - clamped correctly?
- [ ] Try edge cases (negative, huge numbers, special chars)

---

## 🔧 Common Migration Patterns

### Pattern 1: Simple Text Input

**Before**:
```tsx
<input
  type="text"
  className="form-input"
  value={formData.title}
  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
  placeholder="Enter title"
/>
```

**After**:
```tsx
<UnifiedTextInput
  value={formData.title}
  onSave={(newValue) => setFormData({ ...formData, title: newValue })}
  placeholder="Enter title"
  className="form-input"
/>
```

---

### Pattern 2: Numeric Input with Validation

**Before**:
```tsx
<input
  type="number"
  value={formData.quantity}
  onChange={(e) => setFormData({ 
    ...formData, 
    quantity: Math.max(1, parseInt(e.target.value) || 1)  // ❌ Aggressive
  })}
  min={1}
  max={999}
/>
```

**After**:
```tsx
<UnifiedNumberInput
  value={formData.quantity}
  onSave={(newValue) => setFormData({ ...formData, quantity: newValue })}
  min={1}
  max={999}
/>
```

---

### Pattern 3: Decimal/Float Input

**Before**:
```tsx
<input
  type="number"
  step="0.1"
  value={formData.price}
  onChange={(e) => setFormData({ 
    ...formData, 
    price: parseFloat(e.target.value) || 0  // ❌ Aggressive
  })}
/>
```

**After**:
```tsx
<UnifiedNumberInput
  value={formData.price}
  onSave={(newValue) => setFormData({ ...formData, price: newValue })}
  min={0}
  step={0.1}
  allowDecimal={true}
/>
```

---

### Pattern 4: Multi-line Text

**Before**:
```tsx
<textarea
  className="form-input"
  value={formData.description}
  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
  rows={4}
/>
```

**After**:
```tsx
<TextareaField
  label="Description"
  value={formData.description}
  onSave={(newValue) => setFormData({ ...formData, description: newValue })}
  rows={4}
/>
```

---

### Pattern 5: Modal Form (Full Example)

**Before**:
```tsx
<FormModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleSubmit}
  title="Create Item"
>
  <div className="form-group">
    <label>Name *</label>
    <input
      type="text"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    />
  </div>
  
  <div className="form-group">
    <label>Order</label>
    <input
      type="number"
      value={formData.order}
      onChange={(e) => setFormData({ 
        ...formData, 
        order: parseInt(e.target.value) || 0  // ❌ Aggressive
      })}
    />
  </div>
</FormModal>
```

**After**:
```tsx
<FormModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleSubmit}
  title="Create Item"
>
  <UnifiedTextInput
    label="Name *"
    value={formData.name}
    onSave={(newValue) => setFormData({ ...formData, name: newValue })}
    required={true}
  />
  
  <UnifiedNumberInput
    label="Order"
    value={formData.order}
    onSave={(newValue) => setFormData({ ...formData, order: newValue })}
    min={0}
  />
</FormModal>
```

---

## 🚫 Anti-Patterns to Avoid

### 1. Parsing in onChange

```tsx
// ❌ WRONG: Parsing on every keystroke
onChange={(e) => setValue(parseInt(e.target.value) || 0)}
onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
onChange={(e) => setValue(Math.max(0, parseInt(e.target.value)))}
```

**Why wrong?** User can't delete the value to type a new one.

---

### 2. Validation in onChange

```tsx
// ❌ WRONG: Clamping on every keystroke
onChange={(e) => {
  const val = parseInt(e.target.value) || 0;
  setValue(Math.max(1, Math.min(100, val)));  // Prevents typing
}}
```

**Why wrong?** User can't type "150" to later clamp it to 100.

---

### 3. Mixing Number and String State

```tsx
// ❌ WRONG: Inconsistent types
const [value, setValue] = useState<number>(0);
onChange={(e) => setValue(e.target.value)}  // Type error
```

**Why wrong?** TypeScript error, inconsistent behavior.

**Fix**: Use `number | string` type or use unified component.

---

### 4. Using Raw HTML with Manual Save Button

```tsx
// ❌ WRONG: Manual save button for simple form
<input
  type="text"
  value={tempValue}
  onChange={(e) => setTempValue(e.target.value)}
/>
<button onClick={() => save(tempValue)}>Save</button>
```

**Why wrong?** Extra click required, inconsistent UX.

**Fix**: Use unified component with auto-save on blur.

---

### 5. Ignoring Empty State

```tsx
// ❌ WRONG: Empty string becomes NaN or 0 immediately
onChange={(e) => {
  const val = parseInt(e.target.value);  // NaN on empty
  setValue(isNaN(val) ? 0 : val);  // Immediate 0
}}
```

**Why wrong?** User can't clear the field to start fresh.

---

## ✅ Best Practices

### 1. Default to Unified Components

```tsx
// ✅ GOOD: Always use unified components first
import UnifiedTextInput from '@/components/UnifiedTextInput';
import UnifiedNumberInput from '@/components/UnifiedNumberInput';
import TextareaField from '@/components/TextareaField';
```

---

### 2. Only Parse on Blur

```tsx
// ✅ GOOD: Parse only when user finishes editing
onBlur={() => {
  const parsed = parseInt(tempValue) || 0;
  setValue(parsed);
}}
```

---

### 3. Allow Empty During Typing

```tsx
// ✅ GOOD: Allow empty string temporarily
onChange={(e) => {
  const val = e.target.value;
  setValue(val === '' ? '' as any : val as any);
}}
```

---

### 4. Validate on Blur, Not onChange

```tsx
// ✅ GOOD: Validate when editing complete
onBlur={() => {
  const parsed = Math.max(min, Math.min(max, parseInt(value) || min));
  setValue(parsed);
}}
```

---

### 5. Provide Visual Feedback

```tsx
// ✅ GOOD: Show when value is being saved
const [isSaving, setIsSaving] = useState(false);

onBlur={async () => {
  setIsSaving(true);
  await save(value);
  setIsSaving(false);
}}

// In render:
{isSaving && <span>💾 Saving...</span>}
```

---

## 📖 Component API Reference

### UnifiedTextInput

```tsx
interface UnifiedTextInputProps {
  label?: string;           // Field label
  value: string;            // Current value
  onSave: (value: string) => void;  // Save callback (on blur)
  placeholder?: string;     // Placeholder text
  disabled?: boolean;       // Disable input
  type?: 'text' | 'email' | 'url' | 'tel' | 'password';
  className?: string;       // CSS class
  required?: boolean;       // Required field
  maxLength?: number;       // Max character length
  showCharCount?: boolean;  // Show character counter
}
```

### UnifiedNumberInput

```tsx
interface UnifiedNumberInputProps {
  label?: string;           // Field label
  value: number;            // Current value
  onSave: (value: number) => void;  // Save callback (on blur)
  placeholder?: string;     // Placeholder text
  disabled?: boolean;       // Disable input
  min?: number;             // Minimum value (default: 0)
  max?: number;             // Maximum value
  step?: number;            // Step increment (default: 1)
  className?: string;       // CSS class
  required?: boolean;       // Required field
  allowNegative?: boolean;  // Allow negative numbers
  allowDecimal?: boolean;   // Allow decimal numbers
  showValueDisplay?: boolean; // Show value info
}
```

### TextareaField

```tsx
interface TextareaFieldProps {
  label: string;            // Field label
  value: string;            // Current value
  onSave: (value: string) => void;  // Save callback (on blur)
  disabled?: boolean;       // Disable input
  placeholder?: string;     // Placeholder text
  rows?: number;            // Number of rows (default: 4)
}
```

---

## 🔍 Search and Replace Patterns

Use these grep patterns to find problematic inputs:

### Find Aggressive parseInt
```bash
grep -rn "parseInt.*onChange" app/ components/
```

### Find Aggressive parseFloat
```bash
grep -rn "parseFloat.*onChange" app/ components/
```

### Find Math Operations in onChange
```bash
grep -rn "Math\\..*onChange" app/ components/
```

### Find All Number Inputs
```bash
grep -rn 'type="number"' app/ components/
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

For every numeric input:

1. **Basic Typing**
   - [ ] Click on input
   - [ ] Type digits normally
   - [ ] No interruptions or resets

2. **Deletion Test**
   - [ ] Select all (Cmd+A)
   - [ ] Press Delete
   - [ ] Field shows empty (not "0")
   - [ ] Type new value
   - [ ] Works correctly

3. **Edge Cases**
   - [ ] Type "0" - can delete it
   - [ ] Type negative (if not allowed) - rejected on blur
   - [ ] Type decimal (if not allowed) - truncated on blur
   - [ ] Type very large number - clamped on blur
   - [ ] Tab out without typing - no change

4. **Validation**
   - [ ] Enter value < min - clamped to min on blur
   - [ ] Enter value > max - clamped to max on blur
   - [ ] Enter invalid chars - parsed correctly on blur

---

## 🚀 Future Enhancements

### Custom Hook (Future)
```tsx
// Potential custom hook for numeric inputs
function useNumericInput(
  initialValue: number,
  options: { min?: number; max?: number } = {}
) {
  const [tempValue, setTempValue] = useState<string>(initialValue.toString());
  const [finalValue, setFinalValue] = useState<number>(initialValue);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };
  
  const handleBlur = () => {
    const parsed = parseInt(tempValue) || options.min || 0;
    const clamped = Math.max(
      options.min || 0,
      Math.min(options.max || Infinity, parsed)
    );
    setFinalValue(clamped);
    setTempValue(clamped.toString());
  };
  
  return {
    value: tempValue,
    onChange: handleChange,
    onBlur: handleBlur,
    finalValue
  };
}
```

---

## 📚 Related Documentation

- **`docs/components/UNIFIED_INPUT_SYSTEM.md`** - Complete unified system guide
- **`docs/fixes/NUMERIC_INPUT_CONSISTENCY_FIX.md`** - Fix documentation
- **`LEARNINGS.md`** - Historical context and lessons learned
- **`CODING_STANDARDS.md`** - General coding standards

---

## ✅ Summary

**Remember**: 
1. **Always use unified components** (`UnifiedTextInput`, `UnifiedNumberInput`, `TextareaField`)
2. **Never parse in onChange** - parse in onBlur only
3. **Allow empty state** during typing
4. **Validate on blur**, not on every keystroke
5. **Test deletion behavior** - critical for good UX

**Quick Decision Tree**:
```
Need an input field?
├─ Is it text? → Use UnifiedTextInput
├─ Is it multi-line text? → Use TextareaField
├─ Is it a number? → Use UnifiedNumberInput
├─ Is it a boolean? → Use <input type="checkbox">
├─ Is it a selection? → Use <select>
└─ Custom? → Follow blur-based pattern
```

---

**Last Updated**: 2025-12-25T20:50:00.000Z  
**Maintained By**: Development Team  
**Status**: ✅ Active - Reference for all new forms
