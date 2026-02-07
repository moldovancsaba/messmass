# Unified Input System
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version**: 11.54.4  
**Last Updated**: 2026-01-11T22:28:38.000Z  
**Status**: Production-Ready

## 📋 Overview

MessMass uses a **unified input system** where ALL input fields across the application share the same blur-based auto-save behavior. This ensures a consistent, smooth user experience without aggressive keystroke-by-keystroke saving.

## 🎯 Core Principle

**Save on BLUR, not on CHANGE**

- Users can type freely without interruption
- Values can be completely deleted (including "0")
- Save happens automatically when clicking out of field or pressing Tab/Enter
- No aggressive parsing that resets values during typing

## 🧩 Unified Components

### 1. UnifiedTextInput

**Purpose**: Single-line text inputs for strings, URLs, emails, etc.

**Location**: `components/UnifiedTextInput.tsx`

**Features**:
- Blur-based saving (no keystroke saves)
- Allows empty state during editing
- Optional character count display
- Type variants: text, email, url, tel, password
- Optional max length enforcement
- Enter key triggers blur (optional submit)

**Usage**:
```tsx
import UnifiedTextInput from '@/components/UnifiedTextInput';

<UnifiedTextInput
  label="Event Name"
  value={eventName}
  onSave={(newValue) => updateField('eventName', newValue)}
  placeholder="Enter event name"
  type="text"
  required={false}
  maxLength={100}
  showCharCount={true}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string?` | - | Field label (optional) |
| `value` | `string` | **required** | Current value |
| `onSave` | `(value: string) => void` | **required** | Save callback |
| `placeholder` | `string?` | - | Placeholder text |
| `disabled` | `boolean` | `false` | Disable input |
| `type` | `'text' \| 'email' \| 'url' \| 'tel' \| 'password'` | `'text'` | Input type |
| `className` | `string` | `'form-input'` | CSS class |
| `required` | `boolean` | `false` | Required field |
| `maxLength` | `number?` | - | Maximum length |
| `autoComplete` | `string?` | - | Autocomplete attribute |
| `showCharCount` | `boolean` | `false` | Show character count |

---

### 2. UnifiedNumberInput

**Purpose**: Numeric inputs for integers and decimals with validation

**Location**: `components/UnifiedNumberInput.tsx`

**Features**:
- Blur-based saving (no keystroke saves)
- Allows complete deletion without immediate reset
- Optional min/max validation
- Decimal and negative number support
- Parse and validate only on blur
- Enter key triggers blur

**Usage**:
```tsx
import UnifiedNumberInput from '@/components/UnifiedNumberInput';

<UnifiedNumberInput
  label="Remote Images"
  value={stats.remoteImages}
  onSave={(newValue) => updateStat('remoteImages', newValue)}
  min={0}
  max={9999}
  step={1}
  allowNegative={false}
  allowDecimal={false}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string?` | - | Field label (optional) |
| `value` | `number` | **required** | Current value |
| `onSave` | `(value: number) => void` | **required** | Save callback |
| `placeholder` | `string?` | - | Placeholder text |
| `disabled` | `boolean` | `false` | Disable input |
| `min` | `number` | `0` | Minimum value |
| `max` | `number?` | - | Maximum value |
| `step` | `number` | `1` | Step increment |
| `className` | `string` | `'form-input'` | CSS class |
| `required` | `boolean` | `false` | Required field |
| `allowNegative` | `boolean` | `false` | Allow negative numbers |
| `allowDecimal` | `boolean` | `false` | Allow decimal numbers |
| `showValueDisplay` | `boolean` | `false` | Show current value info |

---

### 3. TextareaField

**Purpose**: Multi-line text inputs with auto-save

**Location**: `components/TextareaField.tsx`

**Features**:
- Blur-based saving (existing component, already correct)
- Character count display
- Configurable rows
- Auto-resize option

**Usage**:
```tsx
import TextareaField from '@/components/TextareaField';

<TextareaField
  label="Report Notes"
  value={reportText}
  onSave={(newValue) => saveTextField('reportText1', newValue)}
  rows={4}
  placeholder="Enter text..."
/>
```

---

## 🔧 Implementation in EditorDashboard

The `EditorDashboard.tsx` component has been refactored to use these unified components:

### Before (❌ Aggressive Parsing)
```tsx
// OLD: Parsed on every keystroke
const [tempValue, setTempValue] = useState<number>(value);

<input
  type="number"
  value={tempValue}
  onChange={(e) => {
    const newValue = Math.max(0, parseInt(e.target.value) || 0); // ❌ Aggressive
    setTempValue(newValue);
  }}
  onBlur={handleBlur}
/>
```

### After (✅ Blur-Based)
```tsx
// NEW: Uses UnifiedNumberInput
<UnifiedNumberInput
  value={value}
  onSave={(newValue) => updateManualField(statKey, newValue)}
  className="form-input w-120"
  min={0}
/>
```

---

## 📊 Chart Builder Components

All ChartBuilder components have been updated to use the same pattern:

### ChartBuilderKPI

**File**: `components/ChartBuilderKPI.tsx`

**Changes**:
- Stores temp value as `string` (not `number`)
- Only parses on blur
- Allows deletion of "0" without immediate reset

### ChartBuilderBar

**File**: `components/ChartBuilderBar.tsx`

**Changes**:
- `tempValues` stored as `Record<string, string>`
- Only parses on blur for each field
- Smooth multi-field editing experience

### ChartBuilderPie

**File**: `components/ChartBuilderPie.tsx`

**Changes**:
- `tempValues` stored as `Record<string, string>`
- Percentage calculation parses strings on render
- Only saves on blur

---

## 🎨 Pattern: String-Based Temp State

**Core Pattern Used Everywhere**:

```tsx
// WHAT: Store input value as string to allow empty state during editing
// WHY: Prevents aggressive parsing that resets empty string to 0 immediately
// HOW: Only parse and validate on blur, not on every keystroke

const [tempValue, setTempValue] = useState<string>(value.toString());

useEffect(() => {
  setTempValue(value.toString());
}, [value]);

const handleBlur = () => {
  const newValue = Math.max(0, parseInt(tempValue) || 0);
  if (newValue !== value) {
    onSave(newValue);
  }
};

<input
  type="number"
  value={tempValue}
  onChange={(e) => setTempValue(e.target.value)} // ✅ No parsing
  onBlur={handleBlur}
  min="0"
/>
```

---

## ✅ Benefits

1. **Consistent UX**: All inputs behave the same way
2. **Smooth Editing**: No interruptions while typing
3. **Deletable Zeros**: Users can delete "0" to enter new values
4. **Single Source of Truth**: Two unified components handle all cases
5. **Maintainable**: Changes apply everywhere automatically
6. **Type-Safe**: TypeScript enforces proper usage

---

## 🚀 Usage Guidelines

### When to Use UnifiedTextInput

- Single-line text fields
- Event names, titles, descriptions
- URLs, emails, phone numbers
- Any string-based input

### When to Use UnifiedNumberInput

- Numeric stats (images, fans, attendees)
- Count fields (jersey, scarf, flags)
- Currency amounts
- Percentages or decimals (with `allowDecimal={true}`)

### When to Use TextareaField

- Multi-line text content
- Report notes
- Long descriptions
- Comments or feedback

---

## 🔍 Migration Checklist

To convert an old input to the unified system:

1. **Identify the input type** (text or number)
2. **Replace with unified component**
   - Text → `UnifiedTextInput`
   - Number → `UnifiedNumberInput`
   - Textarea → `TextareaField` (already correct)
3. **Convert onChange to onSave callback**
4. **Remove any inline parsing logic**
5. **Test blur behavior** (click out of field)

### Example Migration

**Before**:
```tsx
<input
  type="number"
  value={tempValue}
  onChange={(e) => {
    const val = Math.max(0, parseInt(e.target.value) || 0);
    setTempValue(val);
    saveStat(val); // ❌ Saves on every keystroke
  }}
/>
```

**After**:
```tsx
<UnifiedNumberInput
  value={stat}
  onSave={(newValue) => saveStat(newValue)} // ✅ Saves on blur
  min={0}
/>
```

---

## 📝 Examples Across Codebase

### EditorDashboard Manual Mode

**File**: `components/EditorDashboard.tsx`

```tsx
const ManualInputCard = ({ label, value, statKey }: { 
  label: string; 
  value: number; 
  statKey: keyof typeof project.stats;
}) => (
  <div className="input-card flex-row gap-4">
    <UnifiedNumberInput
      value={value}
      onSave={(newValue) => updateManualField(statKey, newValue)}
      className="form-input w-120"
      min={0}
    />
    <div className="form-label flex-1">{label}</div>
  </div>
);
```

### Text Field for Report Content

**File**: `components/EditorDashboard.tsx`

```tsx
if (v.type === 'text') {
  return (
    <UnifiedTextInput
      key={v.name}
      label={v.label}
      value={getTextField(v.name)}
      onSave={(text) => saveTextField(v.name, text)}
    />
  );
}
```

---

## 🛡️ Validation

### Number Input Validation

`UnifiedNumberInput` automatically handles:
- **Min/Max enforcement**: Values clamped on blur
- **Non-negative enforcement**: `allowNegative={false}` (default)
- **Integer enforcement**: `allowDecimal={false}` (default)
- **Empty state handling**: Empty field → `min` or `0` on blur

### Text Input Validation

`UnifiedTextInput` supports:
- **Max length**: `maxLength={100}` enforced by browser
- **Required fields**: `required={true}` with visual indicator
- **Type validation**: Browser-native validation for `email`, `url`, `tel`

---

## 🧪 Testing

### Manual Testing Checklist

For each input field:

1. ✅ Type normally - no interruptions
2. ✅ Delete value completely - allows empty state
3. ✅ Click out of field - triggers save
4. ✅ Press Tab - moves to next field and saves
5. ✅ Press Enter - triggers save (for single-line inputs)
6. ✅ Type invalid value (e.g., negative) - corrected on blur
7. ✅ Save indicator appears briefly after save

---

## 🔧 Customization

### Custom Save Behavior

You can wrap the unified components for custom logic:

```tsx
const CustomNumberInput = ({ stat, onUpdate }: Props) => {
  const handleSave = (newValue: number) => {
    // Custom validation
    if (newValue > 1000) {
      alert('Value too large!');
      return;
    }
    
    // Custom transformation
    const rounded = Math.round(newValue / 10) * 10;
    onUpdate(rounded);
  };
  
  return (
    <UnifiedNumberInput
      value={stat}
      onSave={handleSave}
      min={0}
      max={1000}
    />
  );
};
```

---

## 📖 Related Documentation

- **Coding Standards**: See `CODING_STANDARDS.md` for input field conventions
- **Component Library**: See `docs/components/` for other reusable components
- **Editor Architecture**: See `ARCHITECTURE.md` for Editor system overview

---

## 🚫 Anti-Patterns (DO NOT DO)

### ❌ Parsing on onChange

```tsx
// WRONG: Aggressive parsing
onChange={(e) => {
  const val = Math.max(0, parseInt(e.target.value) || 0);
  setTempValue(val);
}}
```

### ❌ Saving on Every Keystroke

```tsx
// WRONG: Saves constantly
onChange={(e) => {
  setTempValue(e.target.value);
  saveToDatabase(e.target.value); // ❌ Too aggressive
}}
```

### ❌ Using Number Type for Temp State

```tsx
// WRONG: Can't delete "0"
const [tempValue, setTempValue] = useState<number>(value);
```

### ❌ Multiple Custom Input Implementations

```tsx
// WRONG: Don't create custom input components
// Use UnifiedTextInput or UnifiedNumberInput instead
const MyCustomInput = ({ ... }) => { ... }
```

---

## ✅ Best Practices

1. **Always use unified components** for new inputs
2. **Store temp values as strings** (even for numbers)
3. **Parse and validate only on blur**
4. **Provide immediate visual feedback** (saving indicator)
5. **Allow empty state during editing**
6. **Use Enter key to trigger blur** (convenience feature)
7. **Test deletion behavior** (especially for "0" values)

---

## 🔄 Version History

### v11.54.2 (2025-12-25)
- **Created unified input system**
- Added `UnifiedTextInput` component
- Added `UnifiedNumberInput` component
- Refactored `EditorDashboard` to use unified components
- Updated all ChartBuilder components (KPI, Bar, Pie)
- Fixed aggressive parsing issues in Manual mode

### v11.54.1 (2025-12-25)
- Initial fix for Manual mode aggressive save behavior
- Identified need for systematic unified approach

---

**Maintenance Note**: When adding new input fields to the application, always use `UnifiedTextInput` or `UnifiedNumberInput`. Do not create custom implementations or use raw `<input>` elements with custom onChange handlers.
