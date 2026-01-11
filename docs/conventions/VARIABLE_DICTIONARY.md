# Variable Dictionary

**Version:** 1.0.0  
**Created:** 2026-01-09T10:21:28.300Z  
**Status:** Canonical (Single Source of Truth)  
**Maintained By:** Chappie (Architect)

---

## Purpose

This document is the **single source of truth** for all variables in the MessMass system. It defines:
- Variable naming standards
- Variable categories and organization
- Formula syntax and mathematical rules
- Usage guidelines for creating and refactoring variables
- Product-specific terminology and reference tokens

**This dictionary blocks and enables:**
- P0 2.2: Variable Naming Consistency Audit (requires this dictionary)
- All formula-related work (chart calculations, derived metrics)
- Variable creation and refactoring procedures

---

## Variable System Architecture

### Database Storage

**Collection:** `variables_metadata` (MongoDB)  
**Total Variables:** 92 (system variables) + custom variables  
**API Endpoint:** `/api/variables-config`  
**Cache:** 5-minute TTL (in-memory)

### Variable Metadata Structure

```typescript
interface VariableMetadata {
  _id: ObjectId;                    // MongoDB auto-generated ID
  name: string;                      // Database field name (camelCase, no "stats." prefix)
  label: string;                     // Display name (e.g., "Female", "Remote Images")
  type: 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date';
  category: string;                  // Organization category (e.g., "Images", "Demographics")
  description?: string;              // Human-readable description
  unit?: string;                     // Display unit (e.g., "€", "%", "clicks")
  derived: boolean;                  // true = computed variable
  formula?: string;                  // Formula for derived variables
  flags: {
    visibleInClicker: boolean;      // Show in Editor clicker buttons
    editableInManual: boolean;       // Allow manual editing in UI
  };
  isSystem: boolean;                 // true = cannot delete (schema fields)
  order: number;                     // Sort order within category (0-based)
  alias?: string;                    // User-defined display alias (white-labeling)
  createdAt: string;                 // ISO 8601 with milliseconds (UTC)
  updatedAt: string;                 // ISO 8601 with milliseconds (UTC)
  createdBy?: string;               // "system" or user ID
  updatedBy?: string;                // User ID
}
```

### System vs Custom Variables

- **System Variables** (`isSystem: true`):
  - Schema fields, cannot be deleted
  - Can edit metadata (label, alias, description, flags)
  - Seeded from code registry via `npm run seed:variables`
  - Total: 92 system variables

- **Custom Variables** (`isSystem: false`):
  - User-created via KYC Management interface
  - Full CRUD control (create, edit, delete)
  - Stored in `project.stats` just like system variables
  - Examples: `vipGuests`, `pressCount`, `sponsorBoothVisits`

---

## Variable Naming Standards

### Database Field Names

**Rule:** Use camelCase matching MongoDB schema

```typescript
// ✅ CORRECT: camelCase in MongoDB
{
  stats: {
    remoteImages: 150,
    hostessImages: 75,
    selfies: 50,
    totalFans: 2500,
    eventAttendees: 3000,
    female: 120,
    male: 160
  }
}
```

### Formula Syntax

**Rule:** Use `[fieldName]` syntax (no `stats.` prefix in formulas)

```typescript
// ✅ CORRECT: Formula syntax
"[remoteImages] + [hostessImages] + [selfies]"  // allImages
"[remoteFans] + [stadium]"                       // totalFans
"[female] / ([female] + [male]) * 100"          // Female percentage
```

**Important Notes:**
- Formulas use field names **without** `stats.` prefix
- Database stores values at `project.stats.fieldName`
- Formula engine automatically resolves `[fieldName]` to `stats.fieldName`

### Variable Names in Code

```typescript
// ✅ CORRECT: Direct field access
const remoteImages = project.stats.remoteImages;
const totalFans = project.stats.totalFans;

// ✅ CORRECT: Variable metadata access
const variable = await fetchAvailableVariables();
const remoteImagesVar = variable.find(v => v.name === 'remoteImages');
```

---

## Variable Categories

### 1. Core Metrics

**Purpose:** Fundamental event statistics

| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `uniqueUsers` | Unique Users | count | Total unique users tracked |
| `eventAttendees` | Event Attendees | count | Total event attendees |
| `eventTicketPurchases` | Ticket Purchases | count | Number of tickets purchased |

**Flags:** `{ visibleInClicker: true, editableInManual: true }`

---

### 2. Image Metrics

**Purpose:** Image source and moderation tracking

| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `remoteImages` | Remote Images | count | Images uploaded remotely |
| `hostessImages` | Hostess Images | count | Images captured by hostess |
| `selfies` | Selfies | count | Selfie images |
| `allImages` | Total Images | count | **Derived:** `remoteImages + hostessImages + selfies` |
| `approvedImages` | Approved Images | count | Images approved for moderation |
| `rejectedImages` | Rejected Images | count | Images rejected in moderation |

**Flags:** `{ visibleInClicker: true, editableInManual: true }`

**Derived Variable:**
- `allImages`: Formula `[remoteImages] + [hostessImages] + [selfies]`

---

### 3. Fan Metrics

**Purpose:** Fan count by location

| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `remoteFans` | Remote Fans | count | Fans watching remotely (indoor + outdoor) |
| `indoor` | Indoor Fans | count | Indoor remote fans |
| `outdoor` | Outdoor Fans | count | Outdoor remote fans |
| `stadium` | Stadium Fans | count | Fans at stadium location |
| `totalFans` | Total Fans | count | **Derived:** `remoteFans + stadium` |

**Flags:** `{ visibleInClicker: true, editableInManual: true }`

**Derived Variable:**
- `totalFans`: Formula `[remoteFans] + [stadium]`
- `remoteFans`: Computed as `indoor + outdoor` if not directly stored

---

### 4. Demographics

**Purpose:** Age and gender demographics

| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `female` | Female | count | Female attendees |
| `male` | Male | count | Male attendees |
| `genAlpha` | Gen Alpha | count | Generation Alpha (born 2010+) |
| `genYZ` | Gen Y/Z | count | Generation Y/Z (born 1980-2009) |
| `genX` | Gen X | count | Generation X (born 1965-1979) |
| `boomer` | Boomer | count | Baby Boomers (born 1946-1964) |
| `totalUnder40` | Total Under 40 | count | **Derived:** `genAlpha + genYZ` |
| `totalOver40` | Total Over 40 | count | **Derived:** `genX + boomer` |

**Flags:** `{ visibleInClicker: true, editableInManual: true }`

**Derived Variables:**
- `totalUnder40`: Formula `[genAlpha] + [genYZ]`
- `totalOver40`: Formula `[genX] + [boomer]`

---

### 5. Merchandise

**Purpose:** Merchandise sales tracking

| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `merched` | Merched Fans | count | Fans who purchased merchandise |
| `jersey` | Jerseys | count | Jersey sales |
| `scarf` | Scarves | count | Scarf sales |
| `flags` | Flags | count | Flag sales |
| `baseballCap` | Baseball Caps | count | Baseball cap sales |
| `other` | Other Merchandise | count | Other merchandise sales |

**Flags:** `{ visibleInClicker: true, editableInManual: true }`

---

### 6. Visits

**Purpose:** Visit source tracking

| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `visitQrCode` | QR Code Visits | count | Visits via QR code |
| `visitShortUrl` | Short URL Visits | count | Visits via short URL |
| `visitWeb` | Web Visits | count | Visits via web |
| `socialVisit` | Social Visits | count | Visits via social media |
| `totalVisit` | Total Visits | count | **Derived:** Sum of all visit sources |

**Flags:** `{ visibleInClicker: false, editableInManual: true }`

**Derived Variable:**
- `totalVisit`: Formula `[visitQrCode] + [visitShortUrl] + [visitWeb] + [socialVisit]`

---

### 7. Event Data

**Purpose:** Event-specific information

| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `eventResultHome` | Home Result | text | Home team score/result |
| `eventResultVisitor` | Visitor Result | text | Visitor team score/result |
| `eventValuePropositionVisited` | Value Prop Visited | count | Value proposition page visits |

**Flags:** `{ visibleInClicker: false, editableInManual: true }`

---

### 8. Bitly Metrics

**Purpose:** Bitly link analytics (69+ variables)

**Categories:**
- **Aggregate:** `totalBitlyClicks`, `uniqueBitlyClicks`
- **By Country:** `bitlyClicksByCountryUS`, `bitlyClicksByCountryGB`, etc.
- **By Referrer:** `bitlyClicksByReferrerDirect`, `bitlyClicksByReferrerGoogle`, etc.
- **By Device:** `bitlyClicksByDeviceMobile`, `bitlyClicksByDeviceDesktop`, etc.

**Flags:** `{ visibleInClicker: false, editableInManual: false }` (computed from Bitly API)

**Note:** Bitly variables are automatically calculated from Bitly integration data.

---

### 9. Report Content

**Purpose:** Report text and image placeholders

| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `reportText1` - `reportText15` | Report Text 1-15 | text | Report text placeholders |
| `reportImage1` - `reportImage25` | Report Image 1-25 | text | Report image URL placeholders |

**Flags:** `{ visibleInClicker: false, editableInManual: true }`

---

### 10. Partner-Specific Variables

**Purpose:** Partner-specific custom fields

**Pattern:** `szerencsejatek*` (e.g., `szerencsejatekHostessAllRegistered`)

**Flags:** `{ visibleInClicker: true, editableInManual: true }`

**Note:** Partner-specific variables are created via KYC Management interface.

---

## Mathematical Excellence

### Formula Syntax

**Operators:**
- Addition: `+`
- Subtraction: `-`
- Multiplication: `*`
- Division: `/`
- Parentheses: `()` for grouping

**Functions:**
- `MAX(a, b, ...)` - Maximum value
- `MIN(a, b, ...)` - Minimum value
- `SUM(a, b, ...)` - Sum of values
- `AVG(a, b, ...)` - Average of values
- `ROUND(value)` - Round to nearest integer
- `FLOOR(value)` - Round down
- `CEIL(value)` - Round up

### Operator Precedence

1. Parentheses `()`
2. Functions `MAX()`, `MIN()`, etc.
3. Multiplication `*`, Division `/`
4. Addition `+`, Subtraction `-`

### Division by Zero Handling

**Rule:** Division by zero returns `'NA'` (not a number)

```typescript
// Example: [female] / ([female] + [male]) * 100
// If female + male = 0, result is 'NA'
```

### Missing Field Handling

**Rule:** Missing fields return `0` (not `'NA'`)

```typescript
// If [unknownField] doesn't exist in stats, it evaluates to 0
// Formula: [remoteImages] + [unknownField] → [remoteImages] + 0
```

### Formula Examples

```typescript
// Percentage calculation
"[female] / ([female] + [male]) * 100"                    // Female percentage
"[genYZ] / ([genAlpha] + [genYZ] + [genX] + [boomer]) * 100"  // Gen Y/Z percentage

// Aggregate calculations
"[remoteImages] + [hostessImages] + [selfies]"            // Total images
"[remoteFans] + [stadium]"                                  // Total fans

// Rate calculations
"[merched] / [totalFans] * 100"                            // Merchandise conversion rate
"[approvedImages] / [allImages] * 100"                     // Image approval rate

// Complex calculations
"([jersey] * [jerseyPrice]) + ([scarf] * [scarfPrice])"   // Total merchandise revenue
"MAX([remoteImages], [hostessImages], [selfies])"          // Maximum image source
```

---

## Product-Specific Terminology

### SEYU Reference Tokens

**Purpose:** Backward compatibility tokens for legacy systems

**Pattern:** `[SEYU*]` (uppercase with organization prefix)

| Variable Name | SEYU Token | Normalization Rule |
|---------------|------------|-------------------|
| `allImages` | `[SEYUTOTALIMAGES]` | ALL → TOTAL |
| `totalFans` | `[SEYUTOTALFANS]` | Direct mapping |
| `visitShortUrl` | `[SEYUSHORTURLVISIT]` | VISIT* → *VISIT |
| `eventValuePropositionVisited` | `[SEYUPROPOSITIONVISIT]` | VISITED → VISIT |
| `stadium` | `[SEYUSTADIUMFANS]` | Add FANS suffix |

**Note:** SEYU tokens are automatically resolved to variable names by the formula engine.

---

## Usage Guidelines

### Creating New Variables

**Process:**
1. Access KYC Management interface (`/admin/variables`)
2. Click "Create Variable"
3. Fill required fields:
   - **Name:** camelCase, no `stats.` prefix (e.g., `vipGuests`)
   - **Label:** Display name (e.g., "VIP Guests")
   - **Type:** Select appropriate type (count, percentage, currency, etc.)
   - **Category:** Select or create category
   - **Flags:** Set `visibleInClicker` and `editableInManual`
4. Save variable
5. Variable is immediately available in formulas and chart configurator

**Validation:**
- Name must be unique
- Name must be camelCase
- Name cannot start with `stats.` (added automatically by system)

### Refactoring Existing Variables

**Process:**
1. **Rename Variable:**
   - Update `name` field in `variables_metadata` collection
   - Update all formulas using old variable name
   - Update all chart configurations
   - Update all report templates

2. **Change Variable Type:**
   - Update `type` field
   - Verify formulas still work with new type
   - Update display logic if needed

3. **Change Variable Category:**
   - Update `category` field
   - Update `order` if needed for new category

**Migration Checklist:**
- [ ] Update variable metadata in MongoDB
- [ ] Update all formulas in chart configurations
- [ ] Update all report templates
- [ ] Verify chart calculations still work
- [ ] Update documentation

### Deprecation Process

**Process:**
1. Mark variable as deprecated in metadata (add `deprecated: true`)
2. Create migration guide for users
3. Provide alternative variable if applicable
4. Set deprecation date
5. Remove variable after deprecation period (minimum 6 months)

---

## Variable Visibility & Editability Flags

### Default Flags by Category

| Category | visibleInClicker | editableInManual | Rationale |
|----------|----------------|------------------|-----------|
| **Images, Fans, Demographics, Merchandise** | `true` | `true` | High-frequency live event metrics |
| **Visits, Event** | `false` | `true` | Post-event data entry |
| **Derived, Text** | `false` | `false` | Computed or non-numeric |
| **Bitly** | `false` | `false` | Auto-calculated from Bitly API |

### Flag Meanings

- **`visibleInClicker: true`**: Variable appears in Editor Dashboard clicker buttons for rapid data entry during live events
- **`editableInManual: true`**: Variable can be manually edited in Manual Entry mode
- **`visibleInClicker: false`**: Variable not shown in clicker (too infrequent or computed)
- **`editableInManual: false`**: Variable cannot be manually edited (computed or auto-calculated)

---

## Formula Engine Integration

### Variable Resolution

**Process:**
1. Formula engine receives formula string (e.g., `"[remoteImages] + [hostessImages]"`)
2. Engine fetches available variables from `/api/variables-config`
3. Engine substitutes `[fieldName]` with actual values from `project.stats.fieldName`
4. Engine evaluates mathematical expression
5. Engine returns result (number or `'NA'`)

### Variable Substitution

```typescript
// Formula: "[remoteImages] + [hostessImages]"
// Stats: { remoteImages: 150, hostessImages: 75 }
// Substituted: "150 + 75"
// Result: 225
```

### Special Variables

**Derived Variables (computed on-the-fly):**
- `totalFans`: `remoteFans + stadium`
- `allImages`: `remoteImages + hostessImages + selfies`
- `totalUnder40`: `genAlpha + genYZ`
- `totalOver40`: `genX + boomer`
- `totalVisit`: `visitQrCode + visitShortUrl + visitWeb + socialVisit`

**Note:** Derived variables are computed during formula evaluation, not stored in database.

---

## Examples

### Example 1: Simple Variable Reference

```typescript
// Formula
"[remoteImages]"

// Result
150  // Direct value from project.stats.remoteImages
```

### Example 2: Derived Variable

```typescript
// Variable: allImages
// Formula: "[remoteImages] + [hostessImages] + [selfies]"
// Stats: { remoteImages: 150, hostessImages: 75, selfies: 50 }
// Result: 275
```

### Example 3: Percentage Calculation

```typescript
// Formula
"[female] / ([female] + [male]) * 100"

// Stats: { female: 120, male: 160 }
// Calculation: 120 / (120 + 160) * 100
// Result: 42.857...
```

### Example 4: Complex Calculation

```typescript
// Formula
"([jersey] * [jerseyPrice]) + ([scarf] * [scarfPrice])"

// Stats: { jersey: 15, jerseyPrice: 85, scarf: 8, scarfPrice: 25 }
// Calculation: (15 * 85) + (8 * 25)
// Result: 1475
```

### Example 5: Function Usage

```typescript
// Formula
"MAX([remoteImages], [hostessImages], [selfies])"

// Stats: { remoteImages: 150, hostessImages: 75, selfies: 50 }
// Result: 150
```

---

## Related Documentation

- **Variable Naming Conventions:** `docs/conventions/NAMING_CONVENTIONS.md`
- **Variable Management Guide:** `docs/conventions/VARIABLE_MANAGEMENT_GUIDE.md` (to be created)
- **Formula Engine:** `lib/formulaEngine.ts`
- **Variables API:** `app/api/variables-config/route.ts`
- **Architecture:** `ARCHITECTURE.md` (Variable System section)

---

## Maintenance

**Last Updated:** 2026-01-09T10:21:28.300Z  
**Next Review:** After P0 2.2 Variable Naming Consistency Audit  
**Version History:** See git history for `docs/conventions/VARIABLE_DICTIONARY.md`

---

**This dictionary is the canonical reference for all variable-related work. All new variables, formulas, and refactoring must align with the standards defined here.**
