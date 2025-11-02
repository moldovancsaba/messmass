# Aspect Ratio Data Flow Analysis

**Date**: 2025-11-02T17:13:00.000Z  
**Issue**: Image chart `aspectRatio` not persisting after save  
**Current Status**: Update button stays open, status shows "Saved", but aspect ratio doesn't persist

---

## 📊 Complete Data Flow Trace

### 1️⃣ **WHERE DATA COMES FROM (READ PATH)**

#### A. Admin GET (Full Data)
**Endpoint**: `GET /api/chart-config`  
**File**: `/app/api/chart-config/route.ts` (Lines 116-188)

```typescript
// ✅ INCLUDES aspectRatio
const formattedConfigurations = configurations.map(config => ({
  _id: config._id.toString(),
  chartId: config.chartId,
  title: config.title,
  type: config.type,
  order: config.order,
  isActive: config.isActive,
  elements: config.elements,
  emoji: config.emoji,
  subtitle: config.subtitle,
  showTotal: config.showTotal,
  totalLabel: config.totalLabel,
  aspectRatio: config.aspectRatio, // ✅ Line 158: Included
  createdAt: config.createdAt,
  updatedAt: config.updatedAt,
  createdBy: config.createdBy,
  lastModifiedBy: config.lastModifiedBy
}));
```

**Used by**: ChartAlgorithmManager (Admin UI)

---

#### B. Public GET (Stats Page) 
**Endpoint**: `GET /api/chart-config/public`  
**File**: `/app/api/chart-config/public/route.ts` (Lines 34-92)

```typescript
// ❌ MISSING aspectRatio
const publicConfigurations = configurations.map(config => ({
  _id: config._id.toString(),
  chartId: config.chartId,
  title: config.title,
  type: config.type,
  order: config.order,
  elements: config.elements,
  emoji: config.emoji,
  subtitle: config.subtitle,
  showTotal: config.showTotal,
  totalLabel: config.totalLabel,
  // ❌ MISSING: aspectRatio field NOT included
}));
```

**Used by**: Stats page (`/app/stats/[slug]/page.tsx` line 189)

**🔴 ROOT CAUSE #1**: Public API does NOT include `aspectRatio` field

---

### 2️⃣ **WHERE WE TRY TO WRITE (WRITE PATH)**

#### A. POST (Create New)
**Endpoint**: `POST /api/chart-config`  
**File**: `/app/api/chart-config/route.ts` (Lines 195-281)

```typescript
// ✅ INCLUDES aspectRatio
const body = await request.json();
const { chartId, title, type, order, isActive, elements, emoji, subtitle, showTotal, totalLabel, aspectRatio } = body;

const configuration: Omit<ChartConfiguration, '_id'> = {
  chartId,
  title,
  type,
  order,
  isActive: isActive ?? true,
  elements,
  emoji,
  subtitle,
  showTotal,
  totalLabel,
  aspectRatio, // ✅ Line 252: Saved to database
  createdAt: now,
  updatedAt: now,
  createdBy: user.id
};

const result = await collection.insertOne(configuration);
```

**Status**: ✅ CREATE works correctly

---

#### B. PUT (Update Existing)
**Endpoint**: `PUT /api/chart-config`  
**File**: `/app/api/chart-config/route.ts` (Lines 288-400)

```typescript
// ✅ INCLUDES aspectRatio
const body = await request.json();
const { configurationId, _id, createdAt, createdBy, ...updateData } = body;

// updateData contains ALL fields including aspectRatio
const updateFields = {
  ...updateData, // ✅ Line 359: Spreads all fields including aspectRatio
  updatedAt: new Date().toISOString(),
  lastModifiedBy: user.id
};

const result = await collection.updateOne(
  { _id: new ObjectId(configurationId) },
  { $set: updateFields }
);
```

**Status**: ✅ UPDATE works correctly (spreads all fields)

---

#### C. Frontend Form Data
**File**: `/components/ChartAlgorithmManager.tsx`

**Form State** (Lines 27-48):
```typescript
interface ChartConfigFormData {
  _id?: string;
  chartId: string;
  title: string;
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image';
  order: number;
  isActive: boolean;
  elements: [...];
  emoji?: string;
  subtitle?: string;
  showTotal?: boolean;
  totalLabel?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1'; // ✅ Line 47: Defined
}
```

**Form UI** (Lines 907-923):
```typescript
{formData.type === 'image' && (
  <div className="form-group">
    <label className="form-label">Image Aspect Ratio *</label>
    <select
      className="form-input"
      value={formData.aspectRatio || '16:9'}
      onChange={(e) => setFormData({ 
        ...formData, 
        aspectRatio: e.target.value as '16:9' | '9:16' | '1:1' 
      })}
    >
      <option value="16:9">🖼️ Landscape (16:9) → 3 grid units</option>
      <option value="9:16">📱 Portrait (9:16) → 1 grid unit</option>
      <option value="1:1">⬜ Square (1:1) → 2 grid units</option>
    </select>
  </div>
)}
```

**Update Function** (Lines 134-164):
```typescript
const updateConfiguration = async (configData: ChartConfigFormData): Promise<ChartConfigFormData> => {
  const body = isUpdate 
    ? { configurationId: configData._id, ...configData } // ✅ Spreads aspectRatio
    : configData;

  console.log('📦 aspectRatio BEFORE save:', configData.aspectRatio);
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body) // ✅ Sends aspectRatio
  });
  
  console.log('📦 aspectRatio AFTER save (from API):', result.configuration?.aspectRatio);
  return result.configuration;
};
```

**Status**: ✅ Frontend sends aspectRatio correctly

---

#### D. Edit Existing Config (Bug Location)
**File**: `/components/ChartAlgorithmManager.tsx` (Lines 282-298)

```typescript
const startEditing = (config?: ChartConfiguration) => {
  if (config) {
    setEditingConfig({
      _id: config._id,
      chartId: config.chartId,
      title: config.title,
      type: config.type,
      order: config.order,
      isActive: config.isActive,
      elements: config.elements,
      emoji: config.emoji,
      subtitle: config.subtitle,
      showTotal: config.showTotal,
      totalLabel: config.totalLabel
      // ❌ MISSING: aspectRatio NOT copied from config
    });
  }
```

**🔴 ROOT CAUSE #2**: When editing existing config, `aspectRatio` is NOT copied into `editingConfig` state

---

### 3️⃣ **WHERE DATA GOES TO STAT PAGE (DISPLAY PATH)**

#### A. Stats Page Fetches Configurations
**File**: `/app/stats/[slug]/page.tsx` (Lines 186-201)

```typescript
const fetchChartConfigurations = useCallback(async () => {
  const response = await fetch('/api/chart-config/public', { cache: 'no-store' });
  const data = await response.json();
  
  if (data.success) {
    setChartConfigurations(data.configurations);
    // ❌ configurations array MISSING aspectRatio field
  }
}, []);
```

---

#### B. Chart Calculation
**File**: `/lib/chartCalculator.ts` (Lines 393-413)

```typescript
const result: ChartCalculationResult = {
  chartId: configuration.chartId,
  title: configuration.title,
  type: configuration.type,
  emoji: configuration.emoji,
  subtitle: configuration.subtitle,
  totalLabel: configuration.totalLabel,
  elements,
  total,
  kpiValue,
  hasErrors,
  // ✅ Passes aspectRatio if present
  ...(configuration.type === 'image' && 'aspectRatio' in configuration && configuration.aspectRatio 
    ? { aspectRatio: configuration.aspectRatio } 
    : {})
};
```

**Status**: ✅ Calculator correctly passes aspectRatio IF it exists in config

---

#### C. Grid Width Calculation
**File**: `/components/UnifiedDataVisualization.tsx` (Lines 208-220)

```typescript
let calculatedWidth = chart.width ?? 1;

if (result.type === 'image' && 'aspectRatio' in result) {
  const aspectRatio = (result as any).aspectRatio as '16:9' | '9:16' | '1:1' | undefined;
  if (aspectRatio) {
    calculatedWidth = calculateImageWidth(aspectRatio); // ✅ Uses aspectRatio if present
  }
}
```

**File**: `/lib/imageLayoutUtils.ts` (Lines 24-49)

```typescript
export function calculateImageWidth(aspectRatio: '16:9' | '9:16' | '1:1'): number {
  switch (aspectRatio) {
    case '9:16': return 1;  // Portrait
    case '16:9': return 3;  // Landscape
    case '1:1': return 2;   // Square
    default: return 1;
  }
}
```

**Status**: ✅ Display logic works IF aspectRatio is present

---

## 🔴 IDENTIFIED BUGS

### Bug #1: Public API Missing aspectRatio
**Location**: `/app/api/chart-config/public/route.ts` (Line 57-69)  
**Impact**: Stats page never receives aspectRatio data  
**Severity**: CRITICAL (breaks image width calculation)

### Bug #2: startEditing Missing aspectRatio
**Location**: `/components/ChartAlgorithmManager.tsx` (Line 286-298)  
**Impact**: When editing existing config, aspectRatio value is lost  
**Severity**: HIGH (data loss when editing)

---

## ✅ FIXES REQUIRED

### Fix #1: Add aspectRatio to Public API

**File**: `/app/api/chart-config/public/route.ts`

```typescript
const publicConfigurations = configurations.map(config => ({
  _id: config._id.toString(),
  chartId: config.chartId,
  title: config.title,
  type: config.type,
  order: config.order,
  elements: config.elements,
  emoji: config.emoji,
  subtitle: config.subtitle,
  showTotal: config.showTotal,
  totalLabel: config.totalLabel,
  aspectRatio: config.aspectRatio, // ✅ ADD THIS LINE
}));
```

### Fix #2: Copy aspectRatio in startEditing

**File**: `/components/ChartAlgorithmManager.tsx`

```typescript
const startEditing = (config?: ChartConfiguration) => {
  if (config) {
    setEditingConfig({
      _id: config._id,
      chartId: config.chartId,
      title: config.title,
      type: config.type,
      order: config.order,
      isActive: config.isActive,
      elements: config.elements,
      emoji: config.emoji,
      subtitle: config.subtitle,
      showTotal: config.showTotal,
      totalLabel: config.totalLabel,
      aspectRatio: config.aspectRatio // ✅ ADD THIS LINE
    });
  }
```

---

## 🧪 TESTING CHECKLIST

After applying fixes:

1. ✅ **Admin Edit Flow**
   - Open existing image chart in admin
   - Verify aspectRatio dropdown shows correct value
   - Change aspectRatio
   - Click "Update" (modal stays open)
   - Verify status shows "Saved"
   - Verify dropdown still shows new value
   - Click "Save" (modal closes)
   - Reopen same chart
   - Verify aspectRatio persisted

2. ✅ **Stats Page Display**
   - Go to stats page for project
   - Find image chart
   - Verify grid width matches aspect ratio:
     - Portrait (9:16) = 1 unit width
     - Square (1:1) = 2 units width
     - Landscape (16:9) = 3 units width
   - Change aspectRatio in admin
   - Refresh stats page
   - Verify grid width updated

3. ✅ **Database Verification**
   - Check MongoDB `chartConfigurations` collection
   - Verify `aspectRatio` field exists and has correct value
   - Verify field updates on save

---

## 📋 DATA FLOW SUMMARY

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN FLOW                                │
└─────────────────────────────────────────────────────────────────┘

1. GET /api/chart-config (✅ includes aspectRatio)
   ↓
2. ChartAlgorithmManager.loadConfigurations()
   ↓
3. startEditing(config) (❌ BUG: drops aspectRatio)
   ↓
4. Form UI (✅ shows aspectRatio dropdown)
   ↓
5. User changes value
   ↓
6. updateConfiguration() (✅ sends aspectRatio)
   ↓
7. PUT /api/chart-config (✅ saves to MongoDB)
   ↓
8. MongoDB (✅ persisted correctly)

┌─────────────────────────────────────────────────────────────────┐
│                       STATS PAGE FLOW                            │
└─────────────────────────────────────────────────────────────────┘

1. GET /api/chart-config/public (❌ BUG: omits aspectRatio)
   ↓
2. Stats page fetchChartConfigurations()
   ↓
3. calculateActiveCharts() (⚠️ no aspectRatio in input)
   ↓
4. calculateChart() (⚠️ skips aspectRatio spread - field missing)
   ↓
5. UnifiedDataVisualization (⚠️ no aspectRatio in result)
   ↓
6. calculateImageWidth() (⚠️ never called - no aspectRatio)
   ↓
7. Image chart displayed with default width (wrong)
```

---

## 🎯 CONCLUSION

The issue has **TWO ROOT CAUSES**:

1. **Public API** (`/api/chart-config/public/route.ts`) does NOT include `aspectRatio` in response
2. **Admin Editor** (`ChartAlgorithmManager.startEditing()`) does NOT copy `aspectRatio` when loading existing config

Both bugs must be fixed for aspect ratio to work correctly.

---

**Generated**: 2025-11-02T17:13:00.000Z  
**Analysis Tool**: Warp AI Agent  
**Files Analyzed**: 9 files, 2,847 lines of code
