# Variables Database Schema
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version**: 1.0.2  
**Date**: 2025-10-28  
**Purpose**: Move ALL variable definitions from code to database for full dynamic configuration

---

## 📊 Collection: `variables_metadata`

### Purpose
Single source of truth for ALL variables in the system (base stats, derived, custom, text).

### Schema

```typescript
interface VariableMetadata {
  _id: ObjectId;                    // MongoDB auto-generated ID
  
  // Core Identity
  name: string;                      // REQUIRED. Full database path: "stats.female", "stats.remoteImages"
  label: string;                     // REQUIRED. Display name: "Female", "Remote Images"
  
  // Type & Category
  type: 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date';
  category: string;                  // REQUIRED. "Images", "Demographics", "Bitly", etc.
  
  // Optional Metadata
  description?: string;              // Human-readable description
  unit?: string;                     // For display: "€", "%", "clicks"
  
  // Derived Variable Support
  derived: boolean;                  // Default: false. True for computed variables
  formula?: string;                  // Formula for derived variables: "stats.female + stats.male"
  
  // UI Behavior Flags
  flags: {
    visibleInClicker: boolean;       // Show in EditorDashboard clicker buttons
    editableInManual: boolean;       // Allow manual editing in UI
  };
  
  // System Protection
  isSystem: boolean;                 // Default: false. True = cannot be deleted (schema fields)
  
  // Ordering & Display
  order: number;                     // Sort order within category (0-based)
  
  // Alias System (Future)
  alias?: string;                    // User-defined display alias: "Women" for "stats.female"
  
  // Audit Trail
  createdAt: string;                 // ISO 8601 with milliseconds (UTC)
  updatedAt: string;                 // ISO 8601 with milliseconds (UTC)
  createdBy?: string;                // User ID or "system" for seeded variables
  updatedBy?: string;                // User ID of last editor
}
```

---

## 🔐 System Variables (`isSystem: true`)

These variables map directly to MongoDB schema fields and **cannot be deleted**.

### Characteristics:
- ✅ Can be **edited** (label, description, flags, order)
- ❌ Cannot be **deleted**
- ❌ Cannot change **name** (database field path)
- 🔒 Marked with lock icon in UI

### Examples:
- `stats.female` (schema field)
- `stats.remoteImages` (schema field)
- `stats.allImages` (derived from schema fields)

---

## 🧩 Custom Variables (`isSystem: false`)

User-created variables that don't require code changes.

### Characteristics:
- ✅ Can be **created** via UI
- ✅ Can be **edited** (all fields)
- ✅ Can be **deleted**
- ✅ Full flexibility

### Examples:
- `stats.vipGuests` (custom count)
- `stats.pressAttendees` (custom count)
- `stats.sponsorRevenue` (custom currency)

---

## 📑 Indexes

```javascript
// Primary key
{ _id: 1 }

// Unique constraint on variable name
{ name: 1 } // UNIQUE

// Query by category
{ category: 1 }

// Query visible clicker variables
{ "flags.visibleInClicker": 1 }

// Query by system status
{ isSystem: 1 }

// Sort by order within category
{ category: 1, order: 1 }

// Audit queries
{ createdAt: -1 }
{ updatedAt: -1 }
```

---

## 🔄 Migration from Code Registry

### Current State (Code)
```typescript
// lib/variablesRegistry.ts
export const BASE_STATS_VARIABLES = [
  { name: 'stats.female', label: 'Female', type: 'count', category: 'Demographics' },
  // ... 100+ more
];
```

### Target State (Database)
```javascript
// MongoDB: variables_metadata collection
{
  _id: ObjectId("..."),
  name: "stats.female",
  label: "Female",
  type: "count",
  category: "Demographics",
  description: "Female attendees",
  derived: false,
  formula: null,
  flags: {
    visibleInClicker: true,
    editableInManual: true
  },
  isSystem: true,  // 🔒 Cannot delete
  order: 0,
  createdAt: "2025-10-28T09:50:00.000Z",
  updatedAt: "2025-10-28T09:50:00.000Z",
  createdBy: "system"
}
```

---

## 🚀 Seeding Script Logic

```typescript
// scripts/seedVariablesFromRegistry.ts

import { BASE_STATS_VARIABLES, DERIVED_VARIABLES } from './lib/variablesRegistry';

async function seedVariables() {
  const allRegistryVars = [
    ...BASE_STATS_VARIABLES,
    ...DERIVED_VARIABLES
  ];
  
  for (const [index, variable] of allRegistryVars.entries()) {
    await db.collection('variables_metadata').updateOne(
      { name: variable.name },
      {
        $setOnInsert: {
          _id: new ObjectId(),
          name: variable.name,
          label: variable.label,
          type: variable.type,
          category: variable.category,
          description: variable.description || '',
          derived: variable.derived || false,
          formula: variable.formula || null,
          flags: {
            visibleInClicker: getDefaultClickerFlag(variable),
            editableInManual: !variable.derived && variable.type !== 'text'
          },
          isSystem: true,  // 🔒 All registry variables are system
          order: index,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system'
        }
      },
      { upsert: true }
    );
  }
}
```

---

## 🎨 API Response Format

### GET `/api/variables-config`

```json
{
  "success": true,
  "variables": [
    {
      "name": "stats.female",
      "label": "Female",
      "type": "count",
      "category": "Demographics",
      "description": "Female attendees",
      "derived": false,
      "formula": null,
      "flags": {
        "visibleInClicker": true,
        "editableInManual": true
      },
      "isSystem": true,
      "order": 0
    }
  ],
  "count": 150
}
```

---

## ⚡ Performance Considerations

### Caching Strategy
- **Cache Layer**: Redis or in-memory LRU cache
- **Cache Key**: `variables:all`
- **TTL**: 5 minutes
- **Invalidation**: On any variable CRUD operation
- **Justification**: Variables queried on every page load (KYC, charts, clicker)

### Query Optimization
- Pre-fetch all variables on app startup
- Store in global singleton for SSR
- Client-side fetch + cache in React context

---

## 🔒 Security & Validation

### API Protection
- Admin-only for CRUD operations (`/api/admin/variables/*`)
- System variable deletion blocked at API level
- Name uniqueness enforced by MongoDB unique index

### Validation Rules
- `name`: Must match pattern `^[a-zA-Z][a-zA-Z0-9_.]*$`
- `name`: Must start with `stats.` for stat variables
- `label`: Required, max 100 chars
- `type`: Must be valid enum value
- `category`: Required, max 50 chars
- `formula`: Required if `derived: true`

---

## 📝 Migration Checklist

- [ ] Create `variables_metadata` collection
- [ ] Add indexes
- [ ] Create seeding script
- [ ] Run seeding script in development
- [ ] Verify all 150+ variables seeded correctly
- [ ] Update `/api/variables-config` to read from DB
- [ ] Add caching layer
- [ ] Update all consumers (KYC, charts, clicker)
- [ ] Remove `lib/variablesRegistry.ts`
- [ ] Test in development
- [ ] Run migration in staging
- [ ] Backup production database
- [ ] Run migration in production
- [ ] Verify production functionality
- [ ] Update documentation

---

**Status**: Design phase complete. Ready for implementation.
