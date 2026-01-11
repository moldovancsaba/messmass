# MessMass System Audit - Complete Data Flow Analysis
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Audit

**Date:** 2025-11-01T22:51:00.000Z  
**Purpose:** Identify why newly created charts don't appear on stats pages

---

## 1. KYC Variables Page (`/admin/kyc`) - FULLY AUDITED ✅

### 1.1 GET Flow - Reading Variables

**Frontend**: `app/admin/kyc/page.tsx` (lines 54-76)
```typescript
const res = await fetch("/api/variables-config", { cache: "no-store" });
const data = await res.json();
// Maps API response to local Variable interface
const vars: Variable[] = (data.variables || []).map((v: any) => ({
  name: v.name,
  label: v.label,
  type: v.type || "count",
  category: v.category,
  description: v.derived && v.formula ? v.formula : v.description || undefined,
  derived: !!v.derived,
  formula: v.formula,
  flags: v.flags || { visibleInClicker: false, editableInManual: false },
  isCustom: !!v.isCustom,
}));
```

**API**: `app/api/variables-config/route.ts` (GET handler, lines 67-113)
```typescript
// Database query
const variables = await db
  .collection<VariableMetadata>(COLLECTION)
  .find({})
  .sort({ category: 1, order: 1, label: 1 })
  .toArray();
```

**Database**: MongoDB collection `variables_metadata`

**Properties Retrieved** (from VariableMetadata interface, lines 24-42):
- ✅ `_id` (MongoDB ObjectId)
- ✅ `name` (e.g., "stats.female")
- ✅ `label` (e.g., "Female")
- ✅ `type` (count | percentage | currency | numeric | text | boolean | date)
- ✅ `category` (e.g., "Demographics")
- ✅ `description` (optional)
- ✅ `unit` (optional, e.g., "€", "%")
- ✅ `derived` (boolean)
- ✅ `formula` (optional)
- ✅ `flags` { visibleInClicker, editableInManual }
- ✅ `isSystem` (true = cannot delete)
- ✅ `order` (sort order)
- ✅ `alias` (user-defined display name)
- ✅ `createdAt` (ISO 8601)
- ✅ `updatedAt` (ISO 8601)
- ✅ `createdBy` (optional)
- ✅ `updatedBy` (optional)

**Properties NOT Retrieved**: ❌ NONE - All properties are fetched

**Caching**: 5-minute in-memory cache (lines 47-61)

**Status**: ✅ **WORKING CORRECTLY**

---

### 1.2 POST Flow - Modify Existing Variable

**Frontend**: `app/admin/kyc/page.tsx` (lines 382-446, EditVariableMeta component)
```typescript
const data = await apiPost("/api/variables-config", {
  name: canRename ? name : variable.name,
  label,
  type: variable.type,
  category,
  description: variable.description,
  derived: !!variable.derived,
  formula: variable.formula,
});
```

**API**: `app/api/variables-config/route.ts` (POST handler, lines 123-232)
```typescript
// Validation
if (!name || typeof name !== 'string') return error;
if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(name)) return error;

// Check if exists
const existing = await col.findOne({ name });

// Block name changes for system variables
if (existing?.isSystem && label && existing.name !== name) return error;

// Upsert
await col.updateOne(
  { name },
  {
    $set: updateDoc,
    $setOnInsert: { /* defaults for new */ }
  },
  { upsert: true }
);
```

**Database Operation**: MongoDB `updateOne` with `upsert: true`

**Properties Modified**:
- ✅ `name` (if custom variable)
- ✅ `label`
- ✅ `type`
- ✅ `category`
- ✅ `description`
- ✅ `unit`
- ✅ `derived`
- ✅ `formula`
- ✅ `flags`
- ✅ `order`
- ✅ `alias`
- ✅ `updatedAt` (auto-set)

**Validation**:
- ✅ Name format: `/^[a-zA-Z][a-zA-Z0-9_.]*$/`
- ✅ Required fields for new variables: name, label, type, category
- ✅ System variables cannot be renamed
- ✅ Invalid values rejected with 400 error

**Cache Management**: ✅ Cache invalidated after mutation (line 215)

**Status**: ✅ **WORKING CORRECTLY**

---

### 1.3 POST Flow - Create New Variable

**Frontend**: `app/admin/kyc/page.tsx` (lines 299-380, CreateVariableForm component)
```typescript
const data = await apiPost('/api/variables-config', {
  name: form.name,
  label: form.label,
  type: form.type,
  category: form.category,
  description: form.description || undefined,
  flags: { 
    visibleInClicker: form.visibleInClicker, 
    editableInManual: form.editableInManual 
  },
});
```

**API**: Same POST handler as modify (upsert logic)

**Database Operation**: MongoDB `updateOne` with `upsert: true`

**Properties Set**:
- ✅ `name`
- ✅ `label`
- ✅ `type`
- ✅ `category`
- ✅ `description`
- ✅ `flags`
- ✅ `isSystem: false` (auto-set for new)
- ✅ `derived: false` (default)
- ✅ `order: 999` (default)
- ✅ `createdAt` (auto-set)
- ✅ `updatedAt` (auto-set)

**Validation**:
- ✅ Name: `/^[a-zA-Z][a-zA-Z0-9_]*$/` (frontend, line 358)
- ✅ Required: name, label, category
- ✅ Type dropdown prevents invalid values

**Status**: ✅ **WORKING CORRECTLY**

---

## 2. Chart Algorithm Manager (`/admin/charts`) - NEEDS AUDIT

**Status**: 🔍 **PENDING AUDIT**

Need to check:
1. GET flow - How charts are loaded
2. POST flow - How new charts are created
3. PUT flow - How charts are updated
4. Database schema and queries
5. Properties passed vs properties saved

---

## 3. Visualization Page (`/admin/visualization`) - NEEDS AUDIT

**Status**: 🔍 **PENDING AUDIT**

Need to check:
1. Data blocks creation/retrieval
2. Chart assignment to blocks
3. Database persistence
4. Properties validation

---

## 4. Stats Page (`/stats/[slug]`) - NEEDS AUDIT

**Status**: 🔍 **PENDING AUDIT**

Need to check:
1. How data blocks are fetched
2. How chart configurations are retrieved
3. Rendering logic for charts
4. Why new charts don't appear

---

## 5. Known Issues

### Issue #1: New Charts Not Visible on Stats Page
**Symptom**: Created chart "marketing-value" in UI, but not visible on stats page
**Database Check**: Chart configuration NOT FOUND in `chartConfigurations` collection
**Data Block Check**: Overview block NOT FOUND in `dataBlocks` collection
**Hypothesis**: Chart creation/save flow is broken - data not persisting to database

**Next Steps**:
1. Audit Chart Algorithm Manager save flow
2. Audit Visualization page save flow
3. Check if data is being sent to API
4. Check if API is writing to database
5. Check for errors in browser console/network tab

---

## 6. KYC Page - Summary & Recommendations

### What Works ✅
- Variable retrieval from database
- Variable modification (with validation)
- Variable creation (with validation)
- Cache invalidation
- Error handling
- System variable protection

### No Issues Found ❌
The KYC page data flow is **SOLID** - no bugs identified.

---

*Audit continues...*
