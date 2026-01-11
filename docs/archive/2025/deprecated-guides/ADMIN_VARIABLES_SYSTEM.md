# Database-First Variables & Metrics Management System
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 8.24.0  
**Last Updated:** 2026-01-11T22:28:38.000Z (UTC)  
**Status:** Production  
**Breaking Change:** Migrated from code-based registry to database-first system

---

## 🔒 MANDATORY: Reference Implementations for Variable UI

**Before implementing variable management UI:**

### Rule: Use Existing Variable Management Patterns

**Reference Files:**
- **KYC Management**: `app/admin/kyc/page.tsx` (lines 1-850) - Complete variable management UI
- **Variable Config API**: `app/api/variables-config/route.ts` (lines 1-234) - CRUD operations
- **Editor Clicker**: `app/edit/[slug]/page.tsx` (lines 1-1200) - Variable display and editing
- **Variable Groups**: `app/api/variables-groups/route.ts` (lines 1-189) - Grouping system

### Real Examples

**Creating Variable Card UI:**
```tsx
// ✅ CORRECT: From app/admin/kyc/page.tsx line 248
<ColoredCard 
  accentColor={getCategoryColor(variable.category)}
  hoverable={false}
  className="p-4"
>
  <div className="variable-card-header">
    <h3 className="font-semibold">{variable.alias}</h3>
    <span className="text-sm text-gray-500">{variable.name}</span>
  </div>
  <div className="variable-metadata">
    <span className="badge">{variable.type}</span>
    <span className="badge">{variable.category}</span>
  </div>
</ColoredCard>
```

**Using Variables API:**
```typescript
// ✅ CORRECT: Fetching all variables
const response = await fetch('/api/variables-config');
const { success, variables } = await response.json();

// ✅ CORRECT: Creating custom variable
await fetch('/api/variables-config', {
  method: 'POST',
  body: JSON.stringify({
    name: 'customMetric',
    alias: 'Custom Metric',
    type: 'number',
    category: 'custom',
    visibleInClicker: true,
    editableInManual: true
  })
});
```

**Variable Group Pattern:**
```typescript
// ✅ CORRECT: From app/api/variables-groups/route.ts
interface VariableGroup {
  id: string;
  title: string;
  chartId?: string;
  variables: string[];
  order: number;
}
```

### Consequences

| Violation | Result |
|-----------|--------|
| Custom variable UI without checking KYC page | ❌ Rejection |
| Not using variables-config API | ❌ Rejection |
| Custom variable CRUD implementation | ❌ Rejection |

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database-First Design](#database-first-design)
4. [Variable Types](#variable-types)
5. [Single Reference System](#single-reference-system)
6. [Alias-Based UI System](#alias-based-ui-system)
7. [KYC Management Interface](#kyc-management-interface)
8. [Seeding System Variables](#seeding-system-variables)
9. [Custom Variables](#custom-variables)
10. [Visibility & Editability Flags](#visibility--editability-flags)
11. [Variable Groups](#variable-groups)
12. [SEYU Reference Tokens](#seyu-reference-tokens)
13. [API Reference](#api-reference)
14. [Migration from v6.x](#migration-from-v6x)
15. [Technical Decisions](#technical-decisions)

---

## Overview

The **Database-First Variables System** (v7.0.0) is a centralized configuration layer that:
- Stores **all variable metadata in MongoDB** (`variables_metadata` collection)
- Seeds **96 system variables** from `lib/variablesConfig.ts` on server initialization
- Enforces the **Single Reference System** with `stats.` prefix for all code and formulas
- Provides **alias-based UI customization** without affecting database fields or code references
- Supports **custom user-defined variables** that persist alongside system variables

### Key Features

✅ **Database-First Architecture** — All variables stored in MongoDB, no code-based registry  
✅ **Single Reference System** — All code MUST use `stats.variableName` pattern  
✅ **Alias-Based UI** — Display labels editable in KYC Management without affecting database fields  
✅ **96 System Variables** — Seeded from `lib/variablesConfig.ts` with full Bitly integration  
✅ **Custom Variables** — User-created variables stored alongside system variables  
✅ **Visibility Control** — Per-variable flags for Clicker and Manual modes  
✅ **KYC Management** — Admin interface for variable configuration at `/admin/kyc`

---

## System Architecture

### Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     KYC Management Page                          │
│                    /app/admin/kyc/page.tsx                       │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │   Variable   │  │    Search    │  │   Add Variable      │  │
│  │    Cards     │  │    Filter    │  │      Modal          │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└───────────────┬─────────────────────────────────────────────────┘
                │
        ┌───────▼────────┐
        │  /api/variables-config  │ ◄───── MongoDB: variables_metadata
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │  variablesConfig.ts  │ ◄───── Seed data (96 variables)
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │  seedVariables.ts  │ ◄───── Seeding script
        └────────────────┘
                │
                ▼
    ┌─────────────────────┐
    │  Editor Dashboard    │ ◄───── Consumes flags and variables
    │  /app/edit/[slug]    │
    └─────────────────────┘
```

### Data Flow

1. **Seeding** — Run `npm run seed:variables` to populate `variables_metadata` collection from `lib/variablesConfig.ts`
2. **API Layer** — `/api/variables-config` fetches all variables from MongoDB
3. **KYC Management** — Admin edits aliases, flags, and custom variables
4. **Editor** — Fetches config and renders clicker/manual sections using `alias` for labels
5. **Project Stats** — All variable values persisted in `project.stats` using `name` field (Single Reference System)

---

## Database-First Design

### MongoDB Collection: `variables_metadata`

**Schema:**
```typescript
{
  _id: ObjectId,
  name: string,               // Database field name (camelCase, immutable for system vars)
  alias: string,              // UI display label (editable by admin)
  type: 'number' | 'text' | 'derived',
  category: string,           // e.g., 'images', 'demographics', 'bitly'
  visibleInClicker: boolean,  // Show in Editor Clicker UI
  editableInManual: boolean,  // Allow manual editing
  isSystemVariable: boolean,  // true for seeded variables, false for custom
  clickerOrder?: number,      // Button display order within category
  createdAt: Date,
  updatedAt: Date
}
```

### System Variables Source

All 96 system variables defined in `lib/variablesConfig.ts`:

```typescript
export const VARIABLES_CONFIG: VariableConfig[] = [
  // Images (3)
  { name: 'remoteImages', alias: 'Remote Images', type: 'number', category: 'images', ... },
  { name: 'hostessImages', alias: 'Hostess Images', type: 'number', category: 'images', ... },
  { name: 'selfies', alias: 'Selfies', type: 'number', category: 'images', ... },
  
  // Bitly metrics (80+)
  { name: 'totalBitlyClicks', alias: 'Total Bitly Clicks', type: 'number', category: 'bitly', ... },
  // ... full list in source file
];
```

### Why Database-First?

**Benefits:**
- ✅ **Centralized control** — Single source of truth in MongoDB
- ✅ **Runtime seeding** — Variables initialized on server start without code changes
- ✅ **Flexible aliases** — UI labels editable without code deploys
- ✅ **Custom variables** — User-created variables stored alongside system variables
- ✅ **Query performance** — Variables fetched via single MongoDB query

**Alternatives Rejected:**
- ❌ Code-based registry (`lib/variablesRegistry.ts`) — Requires code changes and deployments
- ❌ JSON config files — No runtime mutability, requires file system access

---

## Variable Types

### System Variables (96 total)

Pre-configured variables seeded from `lib/variablesConfig.ts`. All have `isSystemVariable: true`.

**Categories:**

| Category | Count | Examples |
|----------|-------|----------|
| **Images** | 3 | `remoteImages`, `hostessImages`, `selfies` |
| **Fans** | 2 | `remoteFans`, `stadium` |
| **Demographics** | 6 | `female`, `male`, `genAlpha`, `genYZ`, `genX`, `boomer` |
| **Merchandise** | 6 | `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other` |
| **Visits** | 4 | `visitQrCode`, `visitShortUrl`, `visitWeb`, `socialVisit` |
| **Event** | 6 | `eventAttendees`, `eventResultHome`, `eventResultVisitor`, etc. |
| **Bitly** | 69 | `totalBitlyClicks`, `uniqueBitlyClicks`, `bitlyClicksByCountryUS`, etc. |

**Full List:** See `lib/variablesConfig.ts` for complete variable definitions.

### Derived Variables

Auto-calculated from other variables. Marked with `type: 'derived'` and `editableInManual: false`.

| Name | Alias | Formula | Purpose |
|------|-------|---------|---------|
| `allImages` | Total Images | `remoteImages + hostessImages + selfies` | Aggregate image count |
| `totalFans` | Total Fans | `remoteFans + stadium` | Total fan count |
| `totalVisit` | Total Visit | `visitQrCode + visitShortUrl + visitWeb + socialVisit` | All visit sources |

**Note:** Derived variables are computed on-the-fly; users cannot edit them directly.

### Custom Variables

User-created variables via KYC Management. Characteristics:
- `isSystemVariable: false`
- Stored in `project.stats` just like system variables
- Full control over `name`, `alias`, `type`, `category`, and flags

**Examples:**
- `vipGuests` → "VIP Guests"
- `pressCount` → "Media Representatives"
- `sponsorBoothVisits` → "Sponsor Booth Visits"

---

## Single Reference System

### Concept

All code and formulas MUST reference variables using the `stats.` prefix. This ensures a **single source of truth** in the database.

### Correct Pattern

```typescript
// ✅ CORRECT: Single Reference System
const value = project.stats.remoteImages;
const formula = 'stats.remoteImages + stats.hostessImages';
const total = project.stats.remoteImages + project.stats.hostessImages;
```

### Incorrect Pattern

```typescript
// ❌ WRONG: Direct field access
const value = project.remoteImages;
const formula = 'remoteImages + hostessImages';
```

### Why?

**Problem Solved:** Before v7.0.0, variables could be accessed via multiple paths:
- `project.stats.remoteImages` (correct)
- `project.remoteImages` (incorrect, bypasses single source)

**Solution:** v7.0.0 enforces the `stats.` prefix everywhere:
- Database schema: `project.stats.variableName`
- Code access: `project.stats.variableName`
- Formulas: `stats.variableName` or SEYU tokens

**Documentation:** See `SINGLE_REFERENCE_SYSTEM.md` for full enforcement rules.

---

## Alias-Based UI System

### Concept

The `alias` field is **ONLY a UI display label**. It does NOT affect:
- Database field names (always use `name` field)
- Code references (always use `stats.name`)
- Formula syntax (always use `stats.name` or SEYU tokens)
- API payloads (always use `name` field)

### What Alias Controls

**UI Elements:**
- Button labels in Clicker Mode
- Field labels in Manual Input Mode
- Chart legends and axis labels
- Admin UI display text
- Export file column headers

### Example

| Field | Value | Usage |
|-------|-------|-------|
| **name** | `remoteImages` | Database: `project.stats.remoteImages`<br>Code: `project.stats.remoteImages`<br>Formula: `stats.remoteImages` |
| **alias** | "Remote Photos" | UI Button: "Remote Photos"<br>Manual Field: "Remote Photos"<br>Chart Label: "Remote Photos" |

### Editing Aliases

Admins can change aliases in KYC Management without affecting:
- Existing code
- Database queries
- Chart formulas
- API integrations
- Historical data

**Use Case:** White-label deployments can customize all UI labels without code changes.

---

## KYC Management Interface

### Accessing KYC Management

Navigate to `/admin/kyc` from the admin dashboard.

### Interface Layout

```
┌─────────────────────────────────────────────┐
│  🔢 KYC Management                         │
│  [Search] [Add Variable]                   │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Images (3 variables) [System]             │
│  ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ Card  │ │ Card  │ │ Card  │            │
│  └───────┘ └───────┘ └───────┘            │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Bitly (69 variables) [System]             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ...        │
│  └───────┘ └───────┘ └───────┘            │
└─────────────────────────────────────────────┘
```

### Variable Card Structure

Each card displays:
1. **Name** — Database field name (immutable for system variables)
2. **Alias** — Editable UI display label (click to edit)
3. **Type Badge** — `number`, `text`, or `derived`
4. **System Badge** — Green "System" badge if `isSystemVariable: true`
5. **Category** — Grouping label
6. **Flags** — Two checkboxes:
   - ☑ Visible in Clicker
   - ☑ Editable in Manual
7. **Action Buttons** — 🗑️ Delete (custom variables only)

### Editing an Alias

1. Find the variable card
2. Click into the **"Alias"** field
3. Type new display name (e.g., "Remote Photos")
4. Press Enter or click outside
5. Changes save automatically

**Result:** UI labels update immediately; database field name unchanged.

### Creating a Custom Variable

1. Click **"Add Variable"** button
2. Fill modal:
   - **Name:** camelCase (e.g., `vipGuests`)
   - **Alias:** Display label (e.g., "VIP Guests")
   - **Type:** `number` or `text`
   - **Category:** Select or type new
   - **Flags:** visibleInClicker / editableInManual
3. Click **"Create Variable"**

**Result:** Variable stored in `variables_metadata` with `isSystemVariable: false`.

### Searching Variables

Use the search bar to filter by:
- Variable name
- Alias (display label)
- Category

---

## Seeding System Variables

### Purpose

System variables must be seeded into the `variables_metadata` collection before the application can function.

### Seeding Command

```bash
npm run seed:variables
```

**When to Run:**
- First-time setup (new installation)
- After updating `lib/variablesConfig.ts` with new variables
- When resetting variable metadata (re-seed overwrites existing variables)

### What Happens During Seeding

1. Script reads `VARIABLES_CONFIG` from `lib/variablesConfig.ts`
2. Connects to MongoDB
3. For each variable:
   - Checks if variable with same `name` exists
   - If exists: Updates metadata (preserves custom aliases and flags)
   - If not exists: Inserts new variable
4. Marks all seeded variables with `isSystemVariable: true`

**Safe to Re-Run:** Seeding is idempotent; existing custom variables are not affected.

### Script Location

`scripts/seedVariables.ts`

---

## Custom Variables

### Purpose

Allows admins to define project-specific metrics not in the system variables (e.g., `vipGuests`, `backstagePasses`).

### Creating Custom Variables

See [KYC Management Interface](#kyc-management-interface) → "Creating a Custom Variable".

### Data Storage

Custom variable values stored in `project.stats` alongside system variables:

```json
{
  "stats": {
    "remoteImages": 150,
    "hostessImages": 80,
    "vipGuests": 12,  // ← custom variable
    "pressCount": 5   // ← custom variable
  }
}
```

### Deleting Custom Variables

**Restriction:** Only custom variables (`isSystemVariable: false`) can be deleted.

1. Find custom variable card in KYC Management
2. Click **"Delete"** button
3. Confirm deletion

**⚠️ Warning:** Deleting a variable removes it from `variables_metadata` but does NOT delete existing data in `project.stats`. Historical data remains but is no longer visible/editable in the UI.

---

## Visibility & Editability Flags

### Flag Types

Each variable has two independent boolean flags:

| Flag | Purpose | Default Logic |
|------|---------|---------------|
| **`visibleInClicker`** | Show as clickable button in Editor Clicker UI | `true` for Images, Fans, Demographics, Merchandise; `false` otherwise |
| **`editableInManual`** | Allow numeric input in Editor Manual mode | `true` for all variables except derived |

### Default Flags by Category

Defined in `lib/variablesConfig.ts` per variable:

```typescript
// Images, Fans, Demographics, Merchandise
{ visibleInClicker: true, editableInManual: true }

// Visits, Event, Bitly (Success Manager metrics)
{ visibleInClicker: false, editableInManual: true }

// Derived variables
{ visibleInClicker: false, editableInManual: false }
```

**Rationale:**
- **Clicker** is for live event capture → only high-frequency metrics needed
- **Manual** is for post-event data entry → all base stats editable
- **Derived** are computed → not user-editable

### Editing Flags

1. Find variable card in KYC Management
2. Toggle checkboxes
3. Changes save automatically

**Effect:** Editor immediately respects new flag values on next page load.

---

## Variable Groups

### Purpose

Groups control the **layout and ordering** of variables in the Editor dashboard.

### Group Structure

Each group stored in MongoDB `variablesGroups` collection:

```typescript
{
  groupOrder: number,        // Display sequence (ascending)
  chartId?: string,          // Optional KPI chart above variables
  titleOverride?: string,    // Custom section title
  variables: string[]        // Ordered array of variable names
}
```

### Default Groups

Initialized via seeding:

1. **Images Group** (order 1)
   - Variables: `remoteImages`, `hostessImages`, `selfies`
   - Chart ID: `all-images-taken`
   
2. **Location Group** (order 2)
   - Variables: `remoteFans`, `stadium`
   - Chart ID: `total-fans`
   
3. **Demographics Group** (order 3)
   - Variables: `female`, `male`, `genAlpha`, `genYZ`, `genX`, `boomer`
   
4. **Merchandise Group** (order 4)
   - Variables: `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`

### API

Groups managed via:
- `GET /api/variables-groups` — Fetch all groups
- `POST /api/variables-groups` — Create/update group or seed defaults
- `DELETE /api/variables-groups` — Delete all groups

**Note:** Groups are currently seeded separately from variables. Future integration planned.

---

## SEYU Reference Tokens

### Purpose

Organization-prefixed tokens for legacy chart formulas.

### Token Format

**Pattern:** `[SEYUSUFFIX]`

**Examples:**
- `remoteImages` → `[SEYUREMOTEIMAGES]`
- `allImages` → `[SEYUTOTALIMAGES]` (normalized: `ALL` → `TOTAL`)
- `merched` → `[SEYUMERCHEDFANS]` (adds `FANS` suffix)

### Normalization Rules

Defined in `lib/variableRefs.ts`:
- `ALL` → `TOTAL` (e.g., `allImages` → `TOTALIMAGES`)
- `VISITED` → `VISIT` (e.g., `eventValuePropositionVisited` → `PROPOSITIONVISIT`)
- `VISIT*` → `*VISIT` (e.g., `visitShortUrl` → `SHORTURLVISIT`)
- Location vars → Add `FANS` suffix (e.g., `stadium` → `STADIUMFANS`)
- Merch vars → Add `MERCH` prefix (e.g., `jersey` → `MERCHERSEY`)

### Usage in Formulas

```javascript
// Chart formula example
"formula": "([SEYUMERCHEDFANS] / [SEYUTOTALFANS]) * [SEYUATTENDEES]"
```

**Important:** SEYU tokens use the variable **name** field, NOT the alias.

**Future Direction:** New formulas should use `stats.variableName` syntax instead of SEYU tokens.

---

## API Reference

### `GET /api/variables-config`

**Purpose:** Fetch all variables from `variables_metadata` collection

**Response:**
```json
{
  "success": true,
  "variables": [
    {
      "name": "remoteImages",
      "alias": "Remote Images",
      "type": "number",
      "category": "images",
      "visibleInClicker": true,
      "editableInManual": true,
      "isSystemVariable": true,
      "clickerOrder": 0,
      "createdAt": "2025-01-31T16:00:00.000Z",
      "updatedAt": "2025-01-31T16:00:00.000Z"
    }
    // ... 95 more variables
  ]
}
```

### `POST /api/variables-config`

**Purpose:** Create/update variable metadata

**Body (Update Alias & Flags):**
```json
{
  "name": "remoteImages",
  "alias": "Remote Photos",
  "flags": {
    "visibleInClicker": false,
    "editableInManual": true
  }
}
```

**Body (Create Custom Variable):**
```json
{
  "name": "vipGuests",
  "alias": "VIP Guests",
  "type": "number",
  "category": "event",
  "flags": {
    "visibleInClicker": true,
    "editableInManual": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "variable": { /* saved doc */ }
}
```

### `DELETE /api/variables-config?name=vipGuests`

**Purpose:** Delete custom variable

**Response:**
```json
{
  "success": true
}
```

---

## Migration from v6.x

### Breaking Changes

1. **Deprecated:** `lib/variablesRegistry.ts` (code-based registry)
2. **Required:** Run `npm run seed:variables` before starting app
3. **Enforced:** All code must use `stats.` prefix
4. **New:** KYC Management interface at `/admin/kyc` (replaces `/admin/variables`)

### Migration Steps

1. **Seed Variables:**
   ```bash
   npm run seed:variables
   ```

2. **Update Code:**
   - Replace all `project.variableName` with `project.stats.variableName`
   - Replace all formula references with `stats.` prefix

3. **Test Editor:**
   - Verify Clicker buttons display correctly
   - Verify Manual Input fields show correct aliases
   - Verify derived variables are not editable

4. **Customize Aliases (Optional):**
   - Go to `/admin/kyc`
   - Edit aliases for white-label customization

### Rollback Plan

If migration fails:
1. Restore MongoDB `variables_metadata` collection from backup
2. Revert code to v6.x branch
3. Re-deploy

**⚠️ Warning:** v7.0.0 is not backward-compatible with v6.x database schemas.

---

## Technical Decisions

### Decision 1: Database-First vs. Code-Based Registry

**Why Database-First:**
- ✅ Runtime seeding without code changes
- ✅ Alias editing without deployments
- ✅ Centralized source of truth
- ✅ Easier multi-tenancy support

**Rejected Alternative:** Code-based registry in `lib/variablesRegistry.ts`  
**Reason:** Required code changes and deployments for every variable update.

### Decision 2: Single Reference System

**Why `stats.` Prefix Everywhere:**
- ✅ Prevents data inconsistency
- ✅ Single source of truth in MongoDB
- ✅ Clear intent in code

**Rejected Alternative:** Allow multiple access paths  
**Reason:** Creates confusion and potential for data integrity issues.

### Decision 3: Alias-Only UI Customization

**Why Alias ≠ Name:**
- ✅ UI labels editable without breaking code
- ✅ Database field names remain stable
- ✅ Formula syntax unchanged
- ✅ Supports white-label deployments

**Rejected Alternative:** Allow renaming `name` field  
**Reason:** Would break all existing code and formulas.

### Decision 4: Seeding Script vs. Auto-Seeding

**Why Manual Seeding:**
- ✅ Explicit control over when seeding happens
- ✅ Avoids unexpected database changes on server start
- ✅ Clear documentation step

**Rejected Alternative:** Auto-seed on server initialization  
**Reason:** Unexpected behavior in production environments.

### Decision 5: isSystemVariable Flag

**Why Distinguish System vs. Custom:**
- ✅ Prevents accidental deletion of system variables
- ✅ UI shows "System" badge for clarity
- ✅ Seeding script can update system variables safely

**Rejected Alternative:** No distinction  
**Reason:** Admins might accidentally delete critical system variables.

---

## Roadmap Compliance

### ✅ v7.0.0 Milestone: Database-First Variables

- **Database-first architecture** with `variables_metadata` collection ✅
- **Seeding system** from `lib/variablesConfig.ts` ✅
- **Single Reference System** with `stats.` prefix enforcement ✅
- **Alias-based UI** for white-label customization ✅
- **KYC Management** interface at `/admin/kyc` ✅
- **96 system variables** including full Bitly integration ✅

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 7.0.0 | 2025-01-31T16:00:00.000Z | **BREAKING:** Database-first system, Single Reference System, alias-based UI, KYC Management |
| 6.0.0 | 2025-01-21T11:14:00.000Z | Code-based registry with MongoDB overrides |
| 5.52.0 | 2025-01-31T14:30:00.000Z | Initial Admin Variables documentation |

---

## Related Documentation

- [VARIABLE_SYSTEM_V7_MIGRATION.md](./VARIABLE_SYSTEM_V7_MIGRATION.md) — Complete migration guide
- [SINGLE_REFERENCE_SYSTEM.md](./SINGLE_REFERENCE_SYSTEM.md) — Single source of truth with `stats.` prefix
- [VARIABLES_DATABASE_SCHEMA.md](./VARIABLES_DATABASE_SCHEMA.md) — MongoDB schema for `variables_metadata`
- [DATABASE_FIELD_NAMING.md](./DATABASE_FIELD_NAMING.md) — Naming conventions
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System-wide architecture overview
- [WARP.md](./WARP.md) — Development quick reference

---

**Status:** Production-Ready | **Owner:** AI Developer | **Last Review:** 2025-01-31T16:00:00.000Z
