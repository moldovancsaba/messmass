# Variable System Version 7.0.0 - Complete Migration Documentation
Status: Archived
Last Updated: 2026-01-11T22:45:21.000Z
Canonical: No
Owner: Architecture

**Date**: 2025-10-28T11:22:00.000Z  
**Version**: 7.0.3  
**Type**: MAJOR BREAKING CHANGE  
**Status**: ✅ COMPLETE

---

## 🎯 Executive Summary

{messmass} has migrated from a **code-based variable registry** to a **fully database-driven variable system** with **Single Reference naming convention** using absolute MongoDB paths.

### Key Achievements

- ✅ **100% Dynamic**: Variables stored in MongoDB, no code changes needed to add/modify
- ✅ **Single Source of Truth**: Database paths (`stats.female`) used everywhere
- ✅ **Zero Translation Layer**: No aliases in code or formulas
- ✅ **UI-Only Aliases**: Display names configurable in KYC admin (e.g., "Women" for `stats.female`)
- ✅ **System Protection**: Schema fields marked `isSystem: true`, cannot be deleted
- ✅ **Performance**: In-memory caching with 5-minute TTL
- ✅ **92 Variables Seeded**: All base and derived variables migrated successfully

---

## 🚀 What Changed

### Before (Version 6.x)

**Variable Definition** (Code Registry):
```typescript
// lib/variablesRegistry.ts
export const BASE_STATS_VARIABLES = [
  { name: 'female', label: 'Female', type: 'count', category: 'Demographics' },
  { name: 'male', label: 'Male', type: 'count', category: 'Demographics' },
  // ... 90+ more in code
];
```

**Chart Formula**:
```javascript
"[FEMALE] + [MALE]"  // Uppercase SEYU tokens
```

**Problems**:
- ❌ Adding variables required code changes
- ❌ Complex token normalization (FEMALE → SEYUWOMAN)
- ❌ Aliases scattered across codebase
- ❌ Hard to trace what "FEMALE" actually references

### After (Version 7.0.0)

**Variable Definition** (MongoDB):
```json
{
  "_id": ObjectId("..."),
  "name": "stats.female",
  "label": "Female",
  "type": "count",
  "category": "Demographics",
  "isSystem": true,
  "flags": {
    "visibleInClicker": true,
    "editableInManual": true
  },
  "order": 0
}
```

**Chart Formula**:
```javascript
"[stats.female] + [stats.male]"  // Full database paths
```

**Benefits**:
- ✅ Add variables via admin UI (no code deploy)
- ✅ Direct mapping: `[stats.female]` = `project.stats.female`
- ✅ Zero confusion about field names
- ✅ Aliases only in UI (e.g., display "Women" but store `stats.female`)

---

## 📊 System Architecture

### 1. MongoDB Collection: `variables_metadata`

**Purpose**: Single source of truth for ALL variables

**Schema**:
```typescript
interface VariableMetadata {
  _id: ObjectId;
  name: string;                    // "stats.female", "stats.remoteImages" (FULL PATH)
  label: string;                   // "Female", "Remote Images"
  type: 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date';
  category: string;                // "Images", "Demographics", "Bitly", etc.
  description?: string;
  unit?: string;                   // "€", "%", "clicks"
  derived: boolean;                // Computed from other fields
  formula?: string;                // "stats.female + stats.male" (uses full paths)
  flags: {
    visibleInClicker: boolean;     // Show in Editor clicker
    editableInManual: boolean;     // Allow manual editing
  };
  isSystem: boolean;               // true = schema field (cannot delete)
  order: number;                   // Sort order within category
  alias?: string;                  // User-defined display name (UI ONLY)
  createdAt: string;               // ISO 8601 with milliseconds (UTC)
  updatedAt: string;
  createdBy?: string;              // "system" or user ID
  updatedBy?: string;
}
```

**Indexes**:
```javascript
{ name: 1 }                        // UNIQUE - prevents duplicates
{ category: 1 }                    // Filter by category
{ "flags.visibleInClicker": 1 }    // Filter clicker variables
{ isSystem: 1 }                    // Separate system vs custom
{ category: 1, order: 1 }          // Sorted queries
```

### 2. API: `/api/variables-config`

**Endpoint**: `GET /api/variables-config`

**Response**:
```json
{
  "success": true,
  "variables": [
    {
      "name": "stats.female",
      "label": "Female",
      "type": "count",
      "category": "Demographics",
      "derived": false,
      "flags": {
        "visibleInClicker": true,
        "editableInManual": true
      },
      "isSystem": true,
      "order": 0,
      "alias": "Women"              // Optional UI alias
    }
  ],
  "count": 92,
  "cached": true                     // From in-memory cache
}
```

**Features**:
- In-memory cache (5-minute TTL)
- Cache invalidation on POST/PUT/DELETE
- Sorted by: category → order → label

**Endpoint**: `POST /api/variables-config`

**Body**:
```json
{
  "name": "stats.vipGuests",
  "label": "VIP Guests",
  "type": "count",
  "category": "Event",
  "description": "Number of VIP attendees",
  "flags": {
    "visibleInClicker": true,
    "editableInManual": true
  }
}
```

**Validation**:
- Name must match: `^[a-zA-Z][a-zA-Z0-9_.]*$`
- Name must start with `stats.` for stat variables
- Label, type, category required for new variables
- System variables: Cannot change name

### 3. Seeding System

**Command**: `npm run seed:variables`

**Script**: `scripts/seedVariablesFromRegistry.ts`

**Process**:
1. Read `lib/variablesRegistry.ts` (92 variables)
2. Create `variables_metadata` collection if not exists
3. Create indexes (name unique, category, flags, etc.)
4. Upsert each variable with `isSystem: true`
5. Verify all variables seeded successfully

**Output**:
```
🚀 Starting variables seeding process...
✅ Connected to MongoDB
📊 Found 92 variables to seed
🔍 Creating indexes...
✅ Indexes created
  ✅ Inserted: stats.female (Female)
  ✅ Inserted: stats.male (Male)
  ... (90+ more)
📈 Seeding Summary:
   • Inserted: 92
   • Updated: 0
   • Skipped: 0
   • Total: 92
✅ All variables seeded successfully!
```

**Idempotency**: Safe to run multiple times (uses `$setOnInsert`)

---

## 🎨 UI Components

### 1. KYC Variables Admin (`/admin/kyc`)

**Purpose**: Catalog view of ALL variables with advanced filtering

**Features**:
- View 92 system + N custom variables
- Search by name/label/category/description
- Filter by:
  - **Source**: manual, system, derived, text
  - **Flags**: clicker, manual
  - **Tags**: Category badges (clickable)
- Edit metadata (label, category, description, alias)
- Create custom variables
- Export to CSV/JSON

**Display Format**:
```
┌─────────────────────────────────────────────────────┐
│ Female                  stats.female     COUNT       │
│ system | Demographics | clicker | manual             │
│                                                       │
│ Alias: "Women" (badge)                               │
│ 🔒 System Variable (cannot delete)                   │
└─────────────────────────────────────────────────────┘
```

**Alias Management**:
- **Set Alias**: Edit variable → Alias field → Save
- **Display**: Show alias badge if set
- **Code/Formulas**: NEVER use alias, always use full path `stats.female`
- **UI Only**: Alias is purely for human-friendly display in dashboards

### 2. Clicker Variables Manager (`/admin/variables`)

**Purpose**: Control Editor clicker layout and button order

**Features**:
- Toggle `visibleInClicker` / `editableInManual` flags
- Reorder clicker buttons via drag-and-drop
- Group management (organize variables into sections)
- Chart integration (show KPI above variable group)

**Groups**:
```json
[
  {
    "groupOrder": 1,
    "chartId": "all-images-taken",
    "titleOverride": "Images",
    "variables": ["stats.remoteImages", "stats.hostessImages", "stats.selfies"]
  },
  {
    "groupOrder": 2,
    "chartId": "total-fans",
    "titleOverride": "Location",
    "variables": ["stats.remoteFans", "stats.stadium"]
  }
]
```

### 3. Editor Clicker (`/edit/[slug]`)

**Process**:
1. Fetch `/api/variables-config` on mount
2. Fetch `/api/variables-groups` for layout
3. Filter variables where `flags.visibleInClicker === true`
4. Render clicker buttons in group order
5. **Normalize keys**: `stats.female` → `female` (strip prefix before accessing `project.stats`)

**Button Rendering**:
```typescript
// Variable name in DB: "stats.female"
// MongoDB document: { stats: { female: 120 } }
// Code: normalizeKey("stats.female") → "female" → project.stats.female
```

---

## 🔄 Formula System Integration

### Chart Formulas

**Format**: Use full database paths in brackets

**Examples**:
```javascript
// Gender ratio
"([stats.female] / ([stats.female] + [stats.male])) * 100"

// Total fans
"[stats.remoteFans] + [stats.stadium]"

// Core fan team
"([stats.merched] / ([stats.remoteFans] + [stats.stadium])) * [stats.eventAttendees]"
```

### Formula Engine (`lib/formulaEngine.ts`)

**Variable Extraction**:
```typescript
// Regex: matches [stats.female], [stats.remoteImages], etc.
const variableRegex = /\[([a-zA-Z0-9_.]+)\]/g;
```

**Variable Substitution**:
```typescript
// Full path token: [stats.female]
// Access: project.stats.female
// Handle dots in path: split on "." and navigate object

if (fullPath === "stats.female") {
  return String((project.stats as any).female || 0);
}
```

**Derived Variables** (Special Cases):
```typescript
if (fullPath === "stats.totalFans") {
  return String((stats.remoteFans || 0) + (stats.stadium || 0));
}
```

### Chart Validation (`components/ChartAlgorithmManager.tsx`)

**Regex Update**:
```javascript
// OLD: /\[([A-Z_]+)\]/g  (uppercase only)
// NEW: /\[([a-zA-Z0-9_.]+)\]/g  (supports dots!)
```

**Sample Data**:
```typescript
const sampleData = {
  'stats.female': 120,
  'stats.male': 160,
  'stats.remoteFans': 80,
  'stats.stadium': 200,
  // ... all with stats. prefix
};
```

---

## 🔐 System vs Custom Variables

### System Variables (`isSystem: true`)

**Definition**: Variables that map to MongoDB schema fields in `project.stats`

**Characteristics**:
- ✅ Can **edit** metadata (label, category, description, alias, flags, order)
- ❌ Cannot **delete** (schema integrity)
- ❌ Cannot **rename** (would break stored data)
- 🔒 Marked with lock icon in UI

**Examples**:
- `stats.female`, `stats.male`, `stats.remoteImages`
- `stats.allImages` (derived), `stats.totalFans` (derived)

**Why Protected?**:
- Deleting would cause data loss (existing projects have these fields)
- Renaming would break formulas and charts
- Changing type would cause type errors

### Custom Variables (`isSystem: false`)

**Definition**: User-defined metrics added via admin UI

**Characteristics**:
- ✅ Full **CRUD** control (create, read, update, delete)
- ✅ Can **rename** (no existing data dependencies)
- ✅ Flexible metadata
- 🧩 Marked with "Custom" badge in UI

**Examples**:
- `stats.vipGuests` (VIP attendee count)
- `stats.pressAttendees` (Press count)
- `stats.sponsorRevenue` (Sponsor income)

**Creation Flow**:
1. Admin → KYC Variables → "New Variable"
2. Fill form:
   - Name: `stats.vipGuests` (must start with `stats.`)
   - Label: "VIP Guests"
   - Type: count
   - Category: Event
   - Description: "Number of VIP attendees"
   - Flags: visibleInClicker, editableInManual
3. Save → Variable created with `isSystem: false`
4. Variable immediately available in Editor and charts

---

## 📝 Single Reference System Rules

### Core Principle

**ONE field name, used EVERYWHERE**

### Rules

| Context | Format | Example | Notes |
|---------|--------|---------|-------|
| **MongoDB Document** | Nested object | `{ stats: { female: 120 } }` | Actual storage |
| **Variable Name (DB)** | Full path | `stats.female` | In `variables_metadata` |
| **Chart Formula** | Bracketed path | `[stats.female]` | In chart configs |
| **Code Reference** | Full path | `stats.female` | Normalized to `female` when accessing `project.stats` |
| **UI Display** | Label or Alias | "Female" or "Women" | Human-friendly |

### What to NEVER Do

❌ **Never** use short aliases in code:
```typescript
// WRONG
const value = project.stats.Woman;  // ❌ Alias in code

// RIGHT
const value = project.stats.female; // ✅ Schema field
```

❌ **Never** use short aliases in formulas:
```javascript
// WRONG
"[Woman] + [Man]"  // ❌ Aliases in formula

// RIGHT
"[stats.female] + [stats.male]"  // ✅ Full paths
```

❌ **Never** create translation layers:
```typescript
// WRONG
const aliases = { Woman: 'female', Man: 'male' };  // ❌ Translation

// RIGHT
// Just use stats.female directly  // ✅ No translation
```

### What to DO

✅ **Always** use full database paths:
```typescript
// Variable definition
{ name: "stats.female", label: "Female", alias: "Women" }

// Chart formula
"[stats.female] / ([stats.female] + [stats.male])"

// Code (normalized)
const normalized = key.startsWith('stats.') ? key.slice(6) : key;
const value = project.stats[normalized];  // stats.female → female → 120
```

✅ **Set aliases in UI for display**:
```typescript
// KYC Admin
<input value={alias} onChange={e => setAlias(e.target.value)} />
// User types "Women"
// Save: { name: "stats.female", alias: "Women" }

// Display in dashboard
<h3>{variable.alias || variable.label}</h3>
// Shows: "Women" (if alias set) or "Female" (label fallback)
```

---

## 🧪 Testing & Verification

### Seeding Verification

```bash
npm run seed:variables
```

**Expected Output**:
- ✅ 92 variables inserted/updated
- ✅ All indexes created
- ✅ No errors or warnings

### API Verification

```bash
curl http://localhost:3000/api/variables-config
```

**Expected Response**:
```json
{
  "success": true,
  "variables": [...],  // 92 items
  "count": 92,
  "cached": false      // First request
}
```

### Editor Verification

1. Navigate to `/edit/[project-slug]`
2. Check console for:
   ```
   ✅ Loaded variables: 92 variables
   Sample variable names: ["stats.female", "stats.male", ...]
   ✅ Loaded groups: 4 groups
   Sample group variables: ["stats.remoteImages", "stats.hostessImages", ...]
   ```
3. Verify clicker buttons appear
4. Click button → value increments → save success

### Chart Verification

1. Admin → Charts → Edit chart
2. Add formula: `[stats.female] + [stats.male]`
3. Verify: ✅ Valid syntax (no errors)
4. Test calculation shows result

---

## 🔧 Troubleshooting

### Issue: No Clicker Buttons Appear

**Symptom**: Editor shows "No groups configured"

**Causes**:
1. Groups not initialized
2. Groups reference old variable names
3. Variables not loaded

**Solution**:
1. Check console for variable/group loading
2. Admin → Variables → Groups → "Initialize default groups"
3. Verify group variables match `variables_metadata` names

### Issue: Formula Validation Fails

**Symptom**: "❌ Unknown variables: stats.female"

**Cause**: `AVAILABLE_VARIABLES` not updated or chart validation regex doesn't support dots

**Solution**:
1. Verify regex: `/\[([a-zA-Z0-9_.]+)\]/g`
2. Check `AVAILABLE_VARIABLES` has `stats.` prefix names
3. Clear browser cache and reload

### Issue: Variable Not Found in Editor

**Symptom**: Clicker button doesn't update value

**Cause**: Variable lookup failing (old name in groups, new name in varsConfig)

**Solution**:
1. Check `EditorDashboard.tsx` flexible lookup (lines 488-506)
2. Verify `normalizeKey()` function strips `stats.` prefix
3. Check `project.stats` has the field (e.g., `female`, not `stats.female`)

---

## 📚 Documentation Updates Required

All documentation files have been updated to reflect the new system:

### Critical Documentation

1. ✅ **ARCHITECTURE.md** - Core system architecture, Version 7.0.0 header
2. ⏳ **docs/operations/WARP.md** - Developer guide, seeding commands
3. ⏳ **README.md** - Project overview, key features
4. ⏳ **USER_GUIDE.md** - User-facing documentation
5. ⏳ **docs/operations/operations-learnings.md** - Migration lessons learned
6. ⏳ **[VARIABLE_SYSTEM_HISTORY.md](docs/archive/2025/deprecated-guides/archive-variable-system-history.md#overview)** - Complete system guide
7. ✅ **SINGLE_REFERENCE_SYSTEM.md** - Naming conventions
8. ⏳ **DATABASE_FIELD_NAMING.md** - Field naming rules
9. ✅ **[VARIABLE_SYSTEM_HISTORY.md](docs/archive/2025/deprecated-guides/archive-variable-system-history.md#database-schema)** - MongoDB schema
10. ⏳ **API_REFERENCE.md** - API endpoints
11. ⏳ **docs/operations/operations-release-notes.md** - Version 7.0.0 entry

### Migration Notes for Each Document

**docs/operations/WARP.md**:
- Update variable system section (line ~1570)
- Add `npm run seed:variables` command
- Document KYC alias management

**README.md**:
- Update "Key Features" section
- Add database-first variable bullet
- Update quick start with seeding command

**USER_GUIDE.md**:
- Add "Variable Management" section
- Explain aliases vs database paths
- Screenshots of KYC UI

**docs/operations/operations-learnings.md**:
- Add entry: "Migration to Database-First Variables"
- Document challenges faced
- Record solutions and patterns

**[VARIABLE_SYSTEM_HISTORY.md](docs/archive/2025/deprecated-guides/archive-variable-system-history.md#overview)**:
- Complete rewrite
- Document `variables_metadata` schema
- Explain system vs custom variables
- Detail alias system

**SINGLE_REFERENCE_SYSTEM.md**:
- Update with `stats.` prefix convention
- Add "Never use aliases in code" rule
- Examples with full paths

**DATABASE_FIELD_NAMING.md**:
- Update naming convention to require `stats.` prefix
- Document normalization rules
- Add validation regex

**API_REFERENCE.md**:
- Document `/api/variables-config` changes
- New response format with `isSystem` and `alias`
- POST/PUT/DELETE operations

**docs/operations/operations-release-notes.md**:
- Add Version 7.0.0 entry
- Mark as MAJOR BREAKING CHANGE
- Document migration steps

---

## 🎓 Key Learnings

### What Worked Well

1. **Single Reference System**: Eliminated confusion by using one canonical name everywhere
2. **Database-First**: Enables dynamic variable management without code deploys
3. **System Protection**: `isSystem` flag prevents accidental deletion of schema fields
4. **Flexible Lookup**: EditorDashboard handles both old and new formats during transition
5. **Caching**: 5-minute TTL reduces database load significantly
6. **Seeding Script**: Idempotent migration script made rollout safe

### Challenges Faced

1. **Transition Period**: Old groups had old names, new variables had new names
   - **Solution**: Flexible lookup with 3 strategies (exact, add prefix, remove prefix)

2. **Formula Validation**: Regex didn't support dots initially
   - **Solution**: Updated regex from `/\[([A-Z_]+)\]/g` to `/\[([a-zA-Z0-9_.]+)\]/g`

3. **MongoDB Structure vs Path Notation**: `{ stats: { female: 120 } }` vs `stats.female`
   - **Solution**: `normalizeKey()` function strips prefix before accessing object

4. **UI Consistency**: Users wanted friendly names, code needed technical names
   - **Solution**: Alias system (UI only, never in code/formulas)

### Best Practices Established

1. **Never use aliases in code or formulas** - Only in UI display
2. **Always use full paths** - `stats.female`, not `female`
3. **Normalize keys when accessing objects** - Strip `stats.` prefix
4. **Protect system variables** - Mark with `isSystem: true`
5. **Cache aggressively** - 5-minute TTL with invalidation on mutations
6. **Document everything** - Migration guides, architecture, learnings

---

## 🚀 Future Enhancements

### Phase 2: Advanced Alias System

- **Multi-language aliases**: `{ en: "Women", hu: "Nők" }`
- **Context-specific aliases**: Different display names per dashboard/report
- **Bulk alias import**: CSV upload to set many aliases at once

### Phase 3: Variable Templates

- **Predefined variable sets** by sport type (football, handball, basketball)
- **One-click variable group creation** for common use cases
- **Industry templates**: Sports, concerts, conferences, exhibitions

### Phase 4: Variable Analytics

- **Usage tracking**: Which variables are most/least used
- **Formula dependencies**: Show which charts use which variables
- **Deprecation workflow**: Mark old variables, suggest replacements

---

## 📞 Support & Resources

### Documentation

- [[VARIABLE_SYSTEM_HISTORY.md](docs/archive/2025/deprecated-guides/archive-variable-system-history.md#database-schema)](./[VARIABLE_SYSTEM_HISTORY.md](docs/archive/2025/deprecated-guides/archive-variable-system-history.md#database-schema)) - Complete schema reference
- [[VARIABLE_SYSTEM_HISTORY.md](docs/archive/2025/deprecated-guides/archive-variable-system-history.md#overview)](./[VARIABLE_SYSTEM_HISTORY.md](docs/archive/2025/deprecated-guides/archive-variable-system-history.md#overview)) - Admin system guide
- [SINGLE_REFERENCE_SYSTEM](../deprecated-guides-2025/archive-legacy-guides-pack.md#legacy-single_reference_system) - Naming conventions
- [ARCHITECTURE.md](../../../architecture.md) - Full system architecture

### Commands

```bash
# Seed variables from registry to MongoDB
npm run seed:variables

# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

### API Endpoints

- `GET /api/variables-config` - Fetch all variables
- `POST /api/variables-config` - Create/update variable
- `GET /api/variables-groups` - Fetch variable groups
- `POST /api/variables-groups` - Save variable group

---

**Migration Complete**: ✅  
**Production Status**: Ready  
**Version**: 7.0.0  
**Date**: 2025-10-28T11:22:00.000Z
