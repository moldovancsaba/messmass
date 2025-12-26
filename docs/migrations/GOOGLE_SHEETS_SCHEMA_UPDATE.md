# Google Sheets Integration - MongoDB Schema Updates (v12.0.0)

**WHAT**: Schema changes required for Google Sheets sync feature  
**WHY**: Enable bidirectional sync between Google Sheets and MessMass projects  
**WHEN**: Phase 1 implementation (v12.0.0)

## Overview

This document outlines MongoDB schema changes needed for the Google Sheets integration. Changes are **backward compatible** — existing documents will work unchanged.

---

## 1. Partners Collection

### New Fields

```typescript
// Add to existing Partner document
{
  // ... existing fields ...
  
  // Google Sheets integration configuration
  googleSheetConfig?: {
    enabled: boolean,                    // Is sync active?
    sheetId: string,                     // Google Sheet ID (from URL)
    sheetName: string,                   // Tab name (e.g., "Events")
    serviceAccountEmail: string,         // Service account email
    uuidColumn: string,                  // UUID column (default: "A")
    headerRow: number,                   // Header row number (default: 1)
    dataStartRow: number,                // First data row (default: 2)
    lastSyncAt?: string,                 // ISO 8601 timestamp
    lastSyncStatus?: 'success' | 'error' | 'pending',
    lastSyncError?: string,              // Error message if failed
    syncMode: 'manual' | 'auto',         // Trigger mode
    columnMap: Record<string, unknown>   // Column mappings
  },
  
  // Google Sheets sync statistics
  googleSheetStats?: {
    totalEvents: number,                 // Total events in sheet
    lastPullAt?: string,                 // Last pull timestamp
    lastPushAt?: string,                 // Last push timestamp
    pullCount: number,                   // Total pulls
    pushCount: number,                   // Total pushes
    eventsCreated: number,               // Events created via sync
    eventsUpdated: number                // Events updated via sync
  }
}
```

### TypeScript Updates

✅ **Already Updated**: `lib/partner.types.ts` (Partner interface)

---

## 2. Projects Collection

### New Fields

```typescript
// Add to existing Project document
{
  // ... existing fields ...
  
  // Google Sheets sync tracking
  googleSheetUuid?: string,              // UUID stored in sheet (column A)
  googleSheetSyncedAt?: string,          // ISO 8601 timestamp of last sync
  googleSheetModifiedAt?: string,        // ISO 8601 timestamp of last modification
  googleSheetSource?: 'messmass' | 'sheet' | 'both', // Last modification source
  isSyncedFromSheet: boolean,            // Is this event synced from sheet?
  
  // Partner association (if synced from sheet)
  partnerId?: ObjectId | string          // Reference to partners collection
}
```

### TypeScript Updates Required

**Files to update**:

1. **`lib/hashtagCategoryTypes.ts`** (ProjectWithCategories interface)
   - Add Google Sheet fields after `updatedAt`

2. **`lib/types/api.ts`** (ProjectDTO interface)
   - Add Google Sheet fields after `updatedAt`

3. **`lib/dataValidator.ts`** (Project interface if exists)
   - Add Google Sheet fields

**Example Update** (for ProjectDTO):
```typescript
export interface ProjectDTO {
  // ... existing fields ...
  createdAt: string;
  updatedAt: string;
  
  // Google Sheets sync fields (v12.0.0)
  googleSheetUuid?: string;
  googleSheetSyncedAt?: string;
  googleSheetModifiedAt?: string;
  googleSheetSource?: 'messmass' | 'sheet' | 'both';
  isSyncedFromSheet: boolean;
  partnerId?: string;
}
```

---

## 3. MongoDB Indexes (Optional)

For optimal query performance, add these indexes:

```javascript
// Partners collection
db.partners.createIndex({ "googleSheetConfig.enabled": 1 });
db.partners.createIndex({ "googleSheetConfig.sheetId": 1 }, { sparse: true });

// Projects collection
db.projects.createIndex({ googleSheetUuid: 1 }, { sparse: true });
db.projects.createIndex({ isSyncedFromSheet: 1 });
db.projects.createIndex({ partnerId: 1 }, { sparse: true });
db.projects.createIndex({ googleSheetModifiedAt: 1 }, { sparse: true });
```

**When to run**: After Phase 1 completion, before production deployment

---

## 4. Migration Strategy

### Step 1: Add Fields to TypeScript Types
- ✅ Partner types updated in `lib/partner.types.ts`
- ⏳ Update Project types (3 files listed above)

### Step 2: Update API Endpoints
No migration needed! New fields are optional, so:
- Existing projects work unchanged
- New synced projects include Google Sheet fields
- API endpoints handle both cases

### Step 3: Default Values
For projects created via Google Sheets sync:
```typescript
{
  googleSheetUuid: generateUuid(),      // Generated UUID
  isSyncedFromSheet: true,              // Mark as synced
  googleSheetSyncedAt: new Date().toISOString(),
  googleSheetSource: 'sheet',           // Initial source
  partnerId: partnerId                  // Link to partner
}
```

For existing/manual projects:
```typescript
{
  isSyncedFromSheet: false              // Default: not synced
  // Other fields: undefined
}
```

---

## 5. Backward Compatibility

**All changes are backward compatible**:
- ✅ Existing partners work without `googleSheetConfig`
- ✅ Existing projects work without Google Sheet fields
- ✅ No data migration script needed
- ✅ Queries handle undefined fields gracefully

**How queries handle missing fields**:
```javascript
// Find synced events (safe with undefined)
{ isSyncedFromSheet: true }             // Only matches true, not undefined

// Find by UUID (sparse index handles nulls)
{ googleSheetUuid: "abc-123" }          // Only matches if field exists
```

---

## 6. Validation Rules

### Partner googleSheetConfig
- `sheetId`: Required if enabled (40-44 chars, alphanumeric + underscores)
- `sheetName`: Required if enabled (1-100 chars)
- `syncMode`: Must be 'manual' or 'auto'
- `uuidColumn`: Single uppercase letter (A-Z, AA-AZ)

### Project googleSheetUuid
- Format: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
- Unique across all projects
- Immutable once set

---

## 7. Testing Checklist

Before deploying to production:

- [ ] Partner creation works without googleSheetConfig
- [ ] Partner update adds googleSheetConfig successfully
- [ ] Project creation works without Google Sheet fields
- [ ] Synced project includes all required fields
- [ ] UUID uniqueness enforced (duplicate detection)
- [ ] Existing projects load correctly (no breaking changes)
- [ ] API endpoints return both old and new projects
- [ ] Queries with googleSheetUuid work (sparse index)

---

## 8. Rollback Plan

If issues arise after deployment:

**Step 1**: Disable Google Sheets sync
```javascript
db.partners.updateMany(
  { "googleSheetConfig.enabled": true },
  { $set: { "googleSheetConfig.enabled": false } }
);
```

**Step 2**: Projects remain intact (no data loss)
- Synced events continue working as regular events
- No need to delete Google Sheet fields

**Step 3**: Re-enable after fix
```javascript
db.partners.updateMany(
  { "googleSheetConfig.sheetId": { $exists: true } },
  { $set: { "googleSheetConfig.enabled": true } }
);
```

---

## Status

**Phase 1 Progress**:
- ✅ Partner types updated (`lib/partner.types.ts`)
- ⏳ Project types updates (3 files pending)
- ⏳ MongoDB indexes (optional, post-Phase 1)
- ⏳ Validation rules implementation

**Next Steps**:
1. Update ProjectDTO in `lib/types/api.ts`
2. Update ProjectWithCategories in `lib/hashtagCategoryTypes.ts`
3. Update Project interface in `lib/dataValidator.ts` (if exists)
4. Continue with Phase 1 implementation

---

**Version**: 12.0.0  
**Last Updated**: 2025-12-26T17:30:00.000Z  
**Status**: In Progress (Phase 1)
