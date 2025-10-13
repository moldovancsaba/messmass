# Admin Variables & Metrics Management System

**Current Version:** 5.52.0  
**Last Updated:** 2025-01-31T14:30:00.000Z  
**Status:** Production-Ready

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Variable Types & Registry](#variable-types--registry)
4. [SEYU Reference Token System](#seyu-reference-token-system)
5. [Visibility & Editability Flags](#visibility--editability-flags)
6. [Variable Groups Manager](#variable-groups-manager)
7. [Custom Variables](#custom-variables)
8. [API Reference](#api-reference)
9. [UI Components](#ui-components)
10. [Integration with Editor](#integration-with-editor)
11. [Usage Patterns](#usage-patterns)
12. [Technical Decisions](#technical-decisions)

---

## Overview

The **Admin Variables System** is a centralized configuration layer that controls:
- Which metrics appear in the **Editor Clicker** (rapid counting interface)
- Which metrics can be **manually edited** in the Editor
- How variables are **grouped and ordered** in the Editor UI
- How variables are **referenced** in formulas and chart configurations
- Support for **custom user-defined variables** beyond the built-in registry

### Key Features

✅ **Organization-Prefixed References** — All variables use SEYU-prefixed tokens (e.g., `[SEYUTOTALIMAGES]`)  
✅ **Dynamic Visibility Control** — Admin toggles per-variable visibility in Clicker/Manual modes  
✅ **Custom Variables** — Create project-specific metrics that persist in `project.stats`  
✅ **Variable Groups** — Control Editor layout grouping and KPI display  
✅ **Drag-and-Drop Reordering** — Per-category clicker button ordering  
✅ **Derived Variables** — Auto-computed metrics with formula display

---

## System Architecture

### Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Variables Page                         │
│                  /app/admin/variables/page.tsx                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │   Variable   │  │    Groups    │  │  Reorder Clicker    │  │
│  │    Cards     │  │   Manager    │  │      Modal          │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└───────────────┬─────────────────────────────────────────────────┘
                │
        ┌───────▼────────┐
        │  /api/variables-config  │ ◄───── MongoDB: variablesConfig
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │  variablesRegistry.ts  │ ◄───── Source of truth for base variables
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │  variableRefs.ts  │ ◄───── SEYU token generation
        └────────────────┘
                │
                ▼
    ┌─────────────────────┐
    │  Editor Dashboard    │ ◄───── Consumes flags and groups
    │  /app/edit/[slug]    │
    └─────────────────────┘
```

### Data Flow

1. **Registry Definition** (`lib/variablesRegistry.ts`) defines base and derived variables
2. **API Layer** (`/api/variables-config`) merges registry with MongoDB overrides
3. **Admin UI** displays merged variables with CRUD operations
4. **Editor** fetches config and renders clicker/manual sections accordingly
5. **Project Stats** persists all variable values (including custom) in `project.stats`

---

## Variable Types & Registry

### Base Stats Variables

Stored in `lib/variablesRegistry.ts` as `BASE_STATS_VARIABLES`:

| Category | Variables | Description |
|----------|-----------|-------------|
| **Images** | `remoteImages`, `hostessImages`, `selfies` | Image source tracking |
| **Fans** | `remoteFans`, `stadium` | Location-based fan counts |
| **Demographics** | `female`, `male`, `genAlpha`, `genYZ`, `genX`, `boomer` | Age and gender distribution |
| **Merchandise** | `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other` | Merch adoption metrics |
| **Moderation** | `approvedImages`, `rejectedImages` | Content approval workflow |
| **Visits** | `visitQrCode`, `visitShortUrl`, `visitWeb`, `socialVisit`, `eventValuePropositionVisited`, `eventValuePropositionPurchases` | Traffic sources |
| **Event** | `eventAttendees`, `eventResultHome`, `eventResultVisitor` | Event metadata |

### Derived Variables

Auto-computed from base variables, defined in `DERIVED_VARIABLES`:

| Name | Label | Formula | Purpose |
|------|-------|---------|---------|
| `allImages` | Total Images | `remoteImages + hostessImages + selfies` | Aggregate image count |
| `totalFans` | Total Fans | `remoteFans + stadium` | Total fan count |
| `totalUnder40` | Total Under 40 | `genAlpha + genYZ` | Younger demographic sum |
| `totalOver40` | Total Over 40 | `genX + boomer` | Older demographic sum |
| `totalVisit` | Total Visit | `socialVisit + visitQrCode + visitShortUrl + visitWeb` | All visit sources |

**Note:** Derived variables are **not editable** — computed on-the-fly during data access.

### Text Variables

Dynamic text variables generated from hashtag categories:

- `hashtags` — General hashtags (plain list)
- `hashtagsCategory:country` — Hashtags in "country" category
- `hashtagsCategory:period` — Hashtags in "period" category
- *(Auto-generated per category)*

---

## SEYU Reference Token System

### Purpose

Organization-prefixed tokens ensure:
- **Multi-tenancy readiness** — Namespace variables by organization
- **Collision avoidance** — No conflicts with reserved words or other systems
- **Standardized naming** — Consistent conventions across all formulas and charts

### Token Format

**Pattern:** `[SEYUSUFFIX]`

Where `SUFFIX` follows normalization rules:
- `ALL` → `TOTAL` (e.g., `allImages` → `[SEYUTOTALIMAGES]`)
- `VISITED` → `VISIT` (e.g., `eventValuePropositionVisited` → `[SEYUPROPOSITIONVISIT]`)
- `VISIT*` → `*VISIT` (e.g., `visitShortUrl` → `[SEYUSHORTURLVISIT]`)
- `FANS` suffix for location metrics (e.g., `stadium` → `[SEYUSTADIUMFANS]`)
- `MERCH` prefix for merchandise (e.g., `jersey` → `[SEYUMERCHERSEY]`)

### Explicit Mappings

Defined in `lib/variableRefs.ts` as `EXPLICIT_SUFFIX_MAP`:

```typescript
{
  allImages: 'TOTALIMAGES',
  totalFans: 'TOTALFANS',
  merched: 'MERCHEDFANS',
  visitShortUrl: 'SHORTURLVISIT',
  visitQrCode: 'QRCODEVISIT',
  eventValuePropositionVisited: 'PROPOSITIONVISIT',
  // ... full list in source file
}
```

### Usage in Formulas

Chart formulas reference variables via SEYU tokens:

```javascript
// Chart formula example
"formula": "([SEYUMERCHEDFANS] / [SEYUTOTALFANS]) * [SEYUATTENDEES]"
```

**Why SEYU?** Future-proofs for multi-organization deployments where different orgs may use the same variable names with different meanings.

---

## Visibility & Editability Flags

### Flag Types

Each variable has two independent boolean flags:

| Flag | Purpose | Default Logic |
|------|---------|---------------|
| **`visibleInClicker`** | Show as clickable button in Editor Clicker UI | `true` for Images, Fans, Demographics, Merchandise; `false` otherwise |
| **`editableInManual`** | Allow numeric input in Editor Manual mode | `true` for all base variables except derived/text |

### Default Flags by Category

Defined in `/api/variables-config/route.ts` `defaultFlagsForVariable()`:

```typescript
// Images, Fans, Demographics, Merchandise
{ visibleInClicker: true, editableInManual: true }

// Moderation, Visits, Event (Success Manager metrics)
{ visibleInClicker: false, editableInManual: true }

// Derived and Text variables
{ visibleInClicker: false, editableInManual: false }
```

**Rationale:**
- **Clicker** is for live event capture → only high-frequency metrics needed
- **Manual** is for post-event data entry → all base stats editable
- **Derived/Text** are computed or non-numeric → not user-editable

### Persisting Flags

1. Admin toggles flag checkboxes in `/admin/variables`
2. UI calls `persistFlags()` which POSTs to `/api/variables-config`
3. MongoDB `variablesConfig` collection stores per-variable flags
4. Editor dashboard queries `/api/variables-config` on load to respect flags

---

## Variable Groups Manager

### Purpose

Groups control the **layout and ordering** of variables in the Editor dashboard. Instead of a flat list, variables are organized into themed groups with optional KPI displays.

### Group Structure

Each group has:
- **`groupOrder`** (number) — Display sequence (ascending)
- **`chartId`** (optional string) — KPI chart to display above variables
- **`titleOverride`** (optional string) — Custom section title (blank to hide)
- **`variables`** (array of variable names) — Ordered list of variables in this group

### Default Groups

Initialized via "Initialize default groups" button, creates:

1. **Images Group** (order 1)
   - Variables: `remoteImages`, `hostessImages`, `selfies`
   - Chart ID: `all-images-taken` (Total Images KPI)
   
2. **Location Group** (order 2)
   - Variables: `remoteFans`, `stadium`
   - Chart ID: `total-fans` (Total Fans KPI)
   
3. **Demographics Group** (order 3)
   - Variables: `female`, `male`, `genAlpha`, `genYZ`, `genX`, `boomer`
   
4. **Merchandise Group** (order 4)
   - Variables: `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`

### Usage

- **Add/Remove Variables:** Use dropdown to assign variables to groups
- **Reorder Variables:** Use ↑/↓ buttons within group
- **Set KPI Chart:** Enter `chartId` from Chart Algorithm Manager
- **Custom Title:** Override default category name with custom label
- **Replace Groups:** "Replace with default groups" deletes all and reinitializes

### API

Groups stored in MongoDB `variablesGroups` collection, accessed via:
- `GET /api/variables-groups` — Fetch all groups
- `POST /api/variables-groups` — Create/update group or seed defaults
- `DELETE /api/variables-groups` — Delete all groups

---

## Custom Variables

### Purpose

Allows admins to define project-specific metrics not present in the base registry (e.g., `vipGuests`, `backstagePasses`, `pressAttendees`).

### Creating Custom Variables

1. Click **"New Variable"** button in Admin Variables page
2. Fill modal:
   - **Name:** camelCase identifier (e.g., `vipGuests`)
   - **Label:** Display name (e.g., "VIP Guests")
   - **Type:** `count`, `numeric`, `currency`, or `percentage`
   - **Category:** Grouping (e.g., "Event")
   - **Description:** Optional notes
   - **Flags:** visibleInClicker / editableInManual
3. Click **"Create Variable"**
4. Variable persisted to MongoDB with `isCustom: true`

### Data Storage

Custom variable values stored in `project.stats` alongside base variables:

```json
{
  "stats": {
    "remoteImages": 150,
    "hostessImages": 80,
    "vipGuests": 12  // ← custom variable
  }
}
```

### Deletion

Custom variables can be deleted via **"🗑️ Delete"** button. Built-in registry variables can also be deleted by admin (full CRUD control).

---

## API Reference

### `GET /api/variables-config`

**Purpose:** Fetch all variables with merged registry + MongoDB overrides

**Response:**
```json
{
  "success": true,
  "variables": [
    {
      "name": "remoteImages",
      "label": "Remote Images",
      "type": "count",
      "category": "Images",
      "description": "Images taken remotely",
      "flags": {
        "visibleInClicker": true,
        "editableInManual": true
      },
      "clickerOrder": 0,
      "isCustom": false
    },
    // ... more variables
  ]
}
```

### `POST /api/variables-config`

**Purpose:** Create/update variable metadata and flags

**Body (Flags Only):**
```json
{
  "name": "remoteImages",
  "flags": {
    "visibleInClicker": false,
    "editableInManual": true
  }
}
```

**Body (Custom Variable):**
```json
{
  "name": "vipGuests",
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

**Response:**
```json
{
  "success": true,
  "variable": { /* saved doc */ }
}
```

### `DELETE /api/variables-config?name=vipGuests`

**Purpose:** Delete custom or overridden variable config

**Response:**
```json
{
  "success": true
}
```

---

## UI Components

### Admin Variables Page (`/app/admin/variables/page.tsx`)

**Layout:**
```
┌─────────────────────────────────────────────┐
│  🔢 Variable Manager                       │
│  [Search] [Reorder Clicker] [New Variable]│
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Groups Manager                             │
│  [Initialize] [Replace] [Add Group]        │
│  ┌───────────────────────────────────┐     │
│  │ Group 1: Images (order 1)         │     │
│  │ Chart: all-images-taken           │     │
│  │ Variables: [remoteImages] [+]     │     │
│  └───────────────────────────────────┘     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Images (3 variables)                       │
│  ┌───────┐ ┌───────┐ ┌───────┐            │
│  │ Card  │ │ Card  │ │ Card  │            │
│  └───────┘ └───────┘ └───────┘            │
└─────────────────────────────────────────────┘
```

### Variable Card Structure

Each card displays:
1. **Label** — Variable display name
2. **Reference Token** — SEYU-prefixed code block (e.g., `[SEYUREMOTEIMAGES]`)
3. **Flags** — Two checkboxes:
   - ☑ Visible in Clicker
   - ☑ Editable in Manual
4. **Type Badge** — COUNT / NUMERIC / CURRENCY / PERCENTAGE
5. **Action Buttons** — ✏️ Edit | 🗑️ Delete

**Styling:**
- Equal card widths enforced via grid: `1fr` (mobile) → `repeat(2, 1fr)` (tablet) → `repeat(3, 1fr)` (desktop)
- Design tokens: `--mm-space-*`, `--mm-radius-*`, `--mm-gray-*`
- Horizontal layout with content left, actions right

### Reorder Clicker Modal

Drag-and-drop interface for per-category clicker button ordering:

```
┌─────────────────────────────────────────────┐
│  ⇕️ Reorder Clicker Buttons                │
│  Drag items to change order                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Images  │ │  Fans   │ │ Demogr. │       │
│  │ ⇕Remote │ │ ⇕Remote │ │ ⇕Female │       │
│  │ ⇕Hostess│ │ ⇕Stadium│ │ ⇕Male   │       │
│  │ ⇕Selfies│ │         │ │ ⇕GenYZ  │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│           [Cancel] [Save order]             │
└─────────────────────────────────────────────┘
```

**Persistence:** Saves `clickerOrder` field per variable to MongoDB.

---

## Integration with Editor

### Editor Dashboard Consumption

The Editor (`/app/edit/[slug]/page.tsx`) queries `/api/variables-config` on mount and:

1. **Filters for Clicker:** Variables where `visibleInClicker === true`
2. **Orders by clickerOrder:** Ascending sort within each category
3. **Renders Buttons:** Grouped by category with KPI charts if group has `chartId`

### Manual Mode Integration

Manual editing form checks `editableInManual` flag:
- **True:** Renders numeric input field
- **False:** Hides or disables field

### Groups Display

If groups exist in MongoDB:
- Editor renders sections per group with `titleOverride` (if set)
- Displays KPI chart above variables (if `chartId` set)
- Orders variables within group by `variables` array sequence

---

## Usage Patterns

### Pattern 1: Adding a New Base Variable

1. Add to `BASE_STATS_VARIABLES` in `lib/variablesRegistry.ts`
2. Add explicit mapping to `EXPLICIT_SUFFIX_MAP` in `lib/variableRefs.ts` (if needed)
3. Default flags auto-assigned based on category
4. Variable appears in Admin UI immediately

### Pattern 2: Creating a Custom Variable

1. Go to `/admin/variables`
2. Click "New Variable"
3. Fill form, set flags
4. Variable available in Editor and persists in `project.stats`

### Pattern 3: Customizing Clicker Layout

1. Go to `/admin/variables`
2. Use "Groups Manager" to create/edit groups
3. Assign variables to groups
4. Set `chartId` for KPI display
5. Use "Reorder Clicker" modal for fine-grained button ordering

### Pattern 4: Hiding a Variable from Clicker

1. Go to `/admin/variables`
2. Find variable card
3. Uncheck "Visible in Clicker"
4. Variable disappears from Editor clicker UI

---

## Technical Decisions

### Decision 1: MongoDB for Config Storage

**Why:** Allows runtime configuration changes without code deploys. Admin can toggle flags and groups instantly.

**Alternative Considered:** JSON config files  
**Rejected Because:** Requires git commits and deployments for every config change.

### Decision 2: SEYU Prefix

**Why:** Future-proofs for multi-organization support. Avoids variable name collisions across tenants.

**Alternative Considered:** Plain variable names  
**Rejected Because:** Would require major refactor when multi-tenancy is added.

### Decision 3: Default Flags by Category

**Why:** Sensible defaults reduce admin configuration burden. High-frequency metrics (Images, Fans) auto-enabled in Clicker.

**Alternative Considered:** All flags `false` by default  
**Rejected Because:** Requires manual enabling of every variable, poor UX.

### Decision 4: Derived Variables Non-Editable

**Why:** Prevents data inconsistency. Derived values must always match their formulas.

**Alternative Considered:** Allow overriding derived values  
**Rejected Because:** Creates data integrity issues and confusion.

### Decision 5: Groups Optional

**Why:** Simple projects may not need grouping. Groups provide advanced layout control when needed.

**Alternative Considered:** Force all variables into groups  
**Rejected Because:** Adds complexity for simple use cases.

---

## Roadmap Compliance

### ✅ Milestone: Admin Variables — Org-Prefixed References & Card Layout

- **SEYU-prefixed reference tokens** with normalization ✅
- **Card layout** enforces exact line order and equal heights ✅
- **Derived label** standardized to "Total Images" ✅

### ✅ Milestone: Variable Visibility & Editability Flags + Edit Integration

- **Flags persist** across sessions via MongoDB ✅
- **Custom variables** supported with modal creation ✅
- **Editor integration** respects flags in clicker/manual sections ✅
- **No UI drift** — centralized button/style system ✅

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.52.0 | 2025-01-31T14:30:00.000Z | Documentation release for Admin Variables system |
| 5.21.0 | 2025-09-27T19:00:46.000Z | SEYU token system implemented |
| 5.20.0 | 2025-09-27T18:31:47.000Z | Card layout standardized, derived labels updated |
| 5.19.0 | 2025-09-26T17:00:00.000Z | Flags and custom variables MVP |

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System-wide architecture overview
- [WARP.md](./WARP.md) — Development quick reference
- [HASHTAG_SYSTEM.md](./HASHTAG_SYSTEM.md) — Related hashtag/category management
- [MULTI_USER_NOTIFICATIONS.md](./MULTI_USER_NOTIFICATIONS.md) — Notification system (reference format)

---

**Status:** Production-Ready | **Owner:** AI Developer | **Last Review:** 2025-01-31T14:30:00.000Z
