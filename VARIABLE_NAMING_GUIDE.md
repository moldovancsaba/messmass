# Variable Naming Guide

**Version:** 1.0.0  
**Last Updated:** 2025-11-13T16:45:00.000Z (UTC)  
**Status:** Official Standard

This document defines the **single source of truth** for all variable naming in MessMass. All variables must follow these conventions across:
- MongoDB Atlas Database (`projects.stats` fields)
- KYC System (`variables_metadata` collection)
- Chart Algorithms (formula references)
- Code (TypeScript/JavaScript)

**NO EXCEPTIONS. NO MAPPING. NO DEPRECATED NAMES.**

---

## Core Principles

1. **camelCase** - All variable names use camelCase (first letter lowercase)
2. **Descriptive** - Names clearly indicate what they measure
3. **Consistent Prefixes** - Use standard prefixes to group related variables
4. **Consistent Suffixes** - Use standard suffixes for data types
5. **No Abbreviations** - Unless universally recognized (e.g., "url", "id")
6. **Professional** - Names suitable for client-facing reports

---

## Naming Structure

```
[prefix][descriptor][suffix]
```

**Examples:**
- `totalImages` - Total count of images
- `bitlyClicksFromUs` - Bitly clicks from United States
- `eventAttendees` - Number of event attendees
- `reportImage3` - Third report image slot

---

## Standard Prefixes

### `total` - Aggregated Counts
Used for cumulative totals or sums.

**Examples:**
- `totalImages` (NOT `allImages`)
- `totalFans`
- `totalVisits`
- `totalBitlyClicks`

### `bitly` - Bitly-Sourced Data
All data from Bitly API integration.

**Examples:**
- `bitlyTotalClicks`
- `bitlyUniqueClicks`
- `bitlyClicksFromUs`
- `bitlyClicksFromGb`
- `bitlyClicksFromCountry` (generic field)

**Country Code Format:** Lowercase 2-letter ISO codes (e.g., `us`, `gb`, `de`, `hu`)

### `event` - Event Metadata
Event-specific data (attendance, results, ticket sales).

**Examples:**
- `eventAttendees`
- `eventResultHome`
- `eventResultVisitor`
- `eventTicketPurchases`
- `eventVenueName`
- `eventDate` (ISO 8601 string)

### `report` - Report Content Slots
User-uploaded images and text for reports.

**Examples:**
- `reportImage1` through `reportImage15`
- `reportText1` through `reportText15`

**Format:** `report[Type][Number]` where Type is `Image` or `Text`, Number is 1-15

### `visit` - Visit Tracking
Social media, QR code, and link visit tracking.

**Examples:**
- `visitQrCode`
- `visitShortUrl`
- `visitWeb`
- `visitFacebook`
- `visitInstagram`
- `visitYoutube`
- `visitTiktok`
- `visitX` (formerly Twitter)

---

## Standard Suffixes

### Counts
- No suffix needed for simple counts (e.g., `totalImages`)
- Use descriptive noun (e.g., `eventAttendees` not `eventAttendeeCount`)

### Rates/Percentages
- `Rate` - For percentage values (e.g., `engagementRate`)
- `Percentage` - Explicit percentage (e.g., `malePercentage`)

### Values/Amounts
- `Value` - For calculated values (e.g., `adValue`)
- `Amount` - For monetary amounts (e.g., `totalAmount`)

### URLs/Links
- `Url` - For URLs (e.g., `reportImageUrl`, `websiteUrl`)
- `Link` - For Bitly links (e.g., `bitlink`)

### Dates/Times
- `Date` - ISO 8601 date strings (e.g., `eventDate`, `createdAt`)
- `At` - Timestamp fields (e.g., `lastSyncedAt`, `updatedAt`)

---

## Data Categories

### Clicker Data (Manual Input)
Core statistics entered via Clicker UI.

**Images:**
- `remoteImages` - Remote/fan-submitted images
- `hostessImages` - Hostess/staff images
- `selfies` - Selfie images
- `totalImages` - Sum of all image types

**Fans:**
- `remoteFans` - Remote/online fans
- `stadium` - Stadium/in-person fans
- `totalFans` - Sum of all fan types

**Demographics:**
- `female` - Female count
- `male` - Male count
- `genAlpha` - Generation Alpha (born 2010+)
- `genYZ` - Generation Y/Z (Millennials/Gen Z)
- `genX` - Generation X
- `boomer` - Baby Boomers

**Merchandise:**
- `merched` - Fans with any merchandise
- `jersey` - Jersey count
- `scarf` - Scarf count
- `flags` - Flag count
- `baseballCap` - Baseball cap count
- `other` - Other merchandise

**Location:**
- `indoor` - Indoor fans
- `outdoor` - Outdoor fans
- `stadium` - Stadium fans (also in Fans category)

### Bitly Data (API-Sourced)
Data from Bitly API integration.

**Core Metrics:**
- `bitlyTotalClicks` - Total clicks across all links
- `bitlyUniqueClicks` - Unique clicks (deduplicated)

**Geographic:**
- `bitlyClicksFrom[Cc]` - Clicks from country (lowercase 2-letter code)
  - Examples: `bitlyClicksFromUs`, `bitlyClicksFromGb`, `bitlyClicksFromDe`

**Referrers:**
- `bitlyClicksFromFacebook`
- `bitlyClicksFromInstagram`
- `bitlyClicksFromDirect`
- (Pattern: `bitlyClicksFrom[Source]`)

**Devices:**
- `bitlyClicksFromMobile`
- `bitlyClicksFromDesktop`
- `bitlyClicksFromTablet`

### TheSportDB / Football-Data (API-Sourced)
Sports match data from external APIs.

**Match Results:**
- `eventResultHome` - Home team score
- `eventResultVisitor` - Visitor team score
- `eventAttendees` - Verified attendance

**Partner Metadata (stored in `partners` collection):**
- `partner.sportsDb.teamId`
- `partner.sportsDb.strLeague`
- `partner.sportsDb.strStadium`
- `partner.sportsDb.intStadiumCapacity`
- `partner.footballData.teamId`

---

## Deprecated Patterns (DO NOT USE)

| ❌ Deprecated | ✅ Use Instead | Reason |
|--------------|---------------|--------|
| `allImages` | `totalImages` | Consistent "total" prefix |
| `bitlyClicksByCountryUS` | `bitlyClicksFromUs` | Lowercase country codes |
| `stats.` prefix in DB | None | `stats` is collection path, not field name |
| `visitX` | `visitX` | ✅ Already correct (X is brand name) |

---

## Migration Rules

When renaming variables, ALL of these must be updated simultaneously:

1. ✅ **MongoDB Database** - Rename field in `projects.stats`
2. ✅ **KYC System** - Update `variables_metadata.name` field
3. ✅ **Chart Formulas** - Update all chart `elements.formula` references
4. ✅ **Code References** - Update TypeScript/JavaScript code
5. ✅ **Documentation** - Update all technical docs

**Use migration scripts - NEVER manual edits.**

---

## Validation Rules

Variables must pass ALL validation checks:

### Format
- ✅ Starts with lowercase letter
- ✅ Contains only letters and numbers (no underscores, hyphens, spaces)
- ✅ Uses camelCase
- ✅ 3-50 characters long

### Naming
- ✅ Uses approved prefix (total, bitly, event, report, visit) if applicable
- ✅ Descriptive and unambiguous
- ✅ Not in deprecated list
- ✅ No abbreviations (unless standard: url, id, qr)

### Registration
- ✅ Registered in `variables_metadata` collection
- ✅ Has professional `alias` for UI display
- ✅ Has correct `type` (number, text, textarea, textmedia, texthyper)
- ✅ Has `category` for grouping
- ✅ Has visibility flags (`visibleInClicker`, `editableInManual`)

---

## Examples

### ✅ GOOD Examples

```typescript
// Clicker data
const images = {
  remote: project.stats.remoteImages,
  hostess: project.stats.hostessImages,
  selfies: project.stats.selfies,
  total: project.stats.totalImages
};

// Bitly data
const bitly = {
  total: project.stats.bitlyTotalClicks,
  unique: project.stats.bitlyUniqueClicks,
  fromUs: project.stats.bitlyClicksFromUs,
  fromGb: project.stats.bitlyClicksFromGb
};

// Event data
const event = {
  attendees: project.stats.eventAttendees,
  resultHome: project.stats.eventResultHome,
  resultVisitor: project.stats.eventResultVisitor
};

// Chart formula
const formula = 'stats.totalImages / stats.totalFans';
```

### ❌ BAD Examples (DO NOT USE)

```typescript
// ❌ Wrong: deprecated "all" prefix
const total = project.stats.allImages; // Use totalImages

// ❌ Wrong: uppercase country code
const clicks = project.stats.bitlyClicksByCountryUS; // Use bitlyClicksFromUs

// ❌ Wrong: missing prefix
const images = project.stats.images; // Use totalImages or remoteImages

// ❌ Wrong: abbreviation
const atnd = project.stats.eventAtnd; // Use eventAttendees

// ❌ Wrong: underscores
const img_count = project.stats.remote_images; // Use remoteImages
```

---

## Enforcement

### API Validation
The variable creation API (`POST /api/variables-config`) enforces naming rules:
- Rejects non-conforming names
- Returns error with suggested corrections
- Prevents creation of deprecated patterns

### Migration Scripts
All variable renames must use official migration scripts:
- `scripts/migrate-variable-names.ts` - Rename variables
- `scripts/sync-variable-names.ts` - Verify consistency
- `scripts/audit-variable-naming-consistency.ts` - Check compliance

### Code Reviews
Pull requests must pass naming consistency checks:
- No hardcoded deprecated names
- All variables registered in KYC
- Chart formulas use correct names

---

## Quick Reference

**Clicker Variables:**
```
remoteImages, hostessImages, selfies, totalImages
remoteFans, stadium, totalFans
female, male, genAlpha, genYZ, genX, boomer
merched, jersey, scarf, flags, baseballCap, other
indoor, outdoor
```

**Bitly Variables:**
```
bitlyTotalClicks, bitlyUniqueClicks
bitlyClicksFrom[Cc] (lowercase 2-letter country code)
bitlyClicksFrom[Source] (e.g., Facebook, Instagram)
bitlyClicksFrom[Device] (e.g., Mobile, Desktop)
```

**Event Variables:**
```
eventAttendees, eventResultHome, eventResultVisitor
eventTicketPurchases, eventDate
```

**Visit Variables:**
```
visitQrCode, visitShortUrl, visitWeb
visitFacebook, visitInstagram, visitYoutube, visitTiktok, visitX
```

**Report Variables:**
```
reportImage[1-15], reportText[1-15]
```

---

**For implementation details, see:**
- `scripts/audit-variable-naming-consistency.ts` - Audit current state
- `scripts/register-missing-kyc-variables.ts` - Register MongoDB fields in KYC
- `scripts/migrate-deprecated-variable-names.ts` - Rename deprecated fields
- `ADMIN_VARIABLES_SYSTEM.md` - KYC system documentation

---

**MessMass Variable Naming Guide v1.0.0**  
**Last Updated: 2025-11-13T16:45:00.000Z (UTC)**  
**© 2025 MessMass Platform**
