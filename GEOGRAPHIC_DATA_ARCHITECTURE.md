# Geographic Data Architecture

## Overview

**WHAT**: Centralized geographic reference system in MongoDB  
**WHY**: Eliminate hardcoded country/city mappings, enable proper relational data modeling  
**HOW**: Hierarchical collections with referential integrity

---

## Database Schema

### 1. `countries` Collection

**Purpose**: Single source of truth for all country data

```typescript
{
  _id: ObjectId,
  code: string,           // ISO 3166-1 alpha-2 (e.g., "US", "HU", "ES")
  name: string,           // Official name (e.g., "United States", "Hungary")
  flag: string,           // Unicode flag emoji (e.g., "🇺🇸", "🇭🇺")
  aliases: string[],      // Alternative names (e.g., ["USA", "America"])
  region: string,         // Continent (e.g., "Europe", "Asia", "Americas")
  subregion: string,      // Geographic subregion (e.g., "Central Europe")
  
  // Metadata
  active: boolean,        // Is this country active in our system?
  createdAt: string,      // ISO 8601 timestamp
  updatedAt: string       // ISO 8601 timestamp
}
```

**Indexes**:
- `code` (unique) - Fast ISO code lookups from Bitly
- `name` (text) - Search by country name
- `aliases` (multikey) - Search by alternative names

---

### 2. `cities` Collection

**Purpose**: Cities associated with partners/teams/venues

```typescript
{
  _id: ObjectId,
  name: string,           // City name (e.g., "Barcelona", "Budapest")
  countryId: ObjectId,    // Reference to countries collection
  
  // Geographic coordinates (for future map features)
  coordinates: {
    latitude: number,
    longitude: number
  },
  
  // Timezone (for event scheduling)
  timezone: string,       // IANA timezone (e.g., "Europe/Budapest")
  
  // Metadata
  active: boolean,
  createdAt: string,
  updatedAt: string
}
```

**Indexes**:
- `countryId` - Join with countries
- `name` + `countryId` (compound, unique) - Prevent duplicate cities per country

---

### 3. Update `partners` Collection

**Add geographic references**:

```typescript
{
  _id: ObjectId,
  name: string,
  sport: string,
  league: string,
  
  // GEOGRAPHIC REFERENCES
  countryId: ObjectId,    // Reference to countries collection
  cityId: ObjectId,       // Reference to cities collection
  
  // ... existing fields (logoUrl, primaryColor, etc.)
}
```

**Indexes**:
- `countryId` - Filter partners by country
- `cityId` - Filter partners by city

---

### 4. Update `projects` Collection

**Add geographic enrichment from Bitly**:

```typescript
{
  _id: ObjectId,
  eventName: string,
  eventDate: string,
  
  // GEOGRAPHIC DATA (enriched from Bitly links)
  stats: {
    // ... existing stats
    
    // Top 5 countries by clicks (from Bitly analytics)
    bitlyTopCountries: Array<{
      countryId: ObjectId,  // Reference to countries collection
      clicks: number
    }>,
    
    // Geographic summary
    bitlyCountryCount: number,        // Unique countries reached
    bitlyTopCountryClicks: number     // Clicks from top country
  }
}
```

---

## Migration Strategy

### Phase 1: Seed Core Data ✅

**Script**: `scripts/seed-countries.js`

1. Create `countries` collection with 200+ countries
2. Include ISO codes, names, flags, aliases, regions
3. Create indexes for performance

### Phase 2: Seed Cities 📍

**Script**: `scripts/seed-cities.js`

1. Extract unique cities from existing partners
2. Match to countries via TheSportsDB country field
3. Create `cities` collection with references

### Phase 3: Migrate Partners 🔗

**Script**: `scripts/migrate-partners-geography.js`

1. For each partner:
   - Find matching country (via TheSportsDB country field)
   - Find/create matching city
   - Add `countryId` and `cityId` references
2. Create indexes

### Phase 4: Enrich Projects 🌍

**Script**: `scripts/enrich-projects-countries.js`

1. For each project with Bitly links:
   - Fetch Bitly country analytics (ISO codes)
   - Convert ISO codes to `countryId` references
   - Store as `bitlyTopCountries: [{ countryId, clicks }]`
2. Update existing enrichment logic to use references

### Phase 5: Refactor Code 🔧

**Update these files**:

1. **`lib/isoCountryToName.ts`** → `lib/countryService.ts`
   - Replace hardcoded mapping with MongoDB queries
   - Cache results in memory for performance

2. **`lib/countryToFlag.ts`** → **DELETE** (logic moves to `countryService.ts`)

3. **`scripts/sync-30-links-standalone.js`**
   - Query `countries` collection instead of hardcoded map
   - Store `countryId` references instead of names

4. **Frontend components**
   - `components/CountryCharts.tsx` - Fetch country details via API
   - `app/api/countries/route.ts` - New API endpoint

---

## API Endpoints

### GET `/api/countries`
**Purpose**: List all countries (for dropdowns, filters)

**Response**:
```json
{
  "countries": [
    {
      "_id": "...",
      "code": "HU",
      "name": "Hungary",
      "flag": "🇭🇺",
      "region": "Europe"
    }
  ]
}
```

### GET `/api/countries/[code]`
**Purpose**: Get country by ISO code

**Response**:
```json
{
  "_id": "...",
  "code": "HU",
  "name": "Hungary",
  "flag": "🇭🇺",
  "aliases": [],
  "region": "Europe",
  "subregion": "Central Europe"
}
```

### GET `/api/cities?countryId=...`
**Purpose**: List cities for a country

**Response**:
```json
{
  "cities": [
    {
      "_id": "...",
      "name": "Budapest",
      "countryId": "...",
      "country": { "name": "Hungary", "flag": "🇭🇺" }
    }
  ]
}
```

---

## Benefits

### 1. **Single Source of Truth**
- No more duplicate country mappings in 3+ files
- Update once, applies everywhere

### 2. **Relational Integrity**
- Partners → Cities → Countries (proper foreign keys)
- Projects → Countries (via Bitly enrichment)

### 3. **Scalability**
- Add new countries/cities without code changes
- Support city-level analytics (future feature)

### 4. **Performance**
- Indexed lookups faster than hardcoded loops
- In-memory caching for frequently accessed data

### 5. **Data Quality**
- Prevent typos (e.g., "Hungry" vs "Hungary")
- Normalize alternative spellings via aliases

### 6. **Future Features Enabled**
- **Map visualizations**: Use coordinates from cities
- **Time zone handling**: Accurate event times
- **Regional analytics**: Group by region/subregion
- **Multi-language support**: Store translations

---

## Implementation Checklist

- [ ] Create `scripts/seed-countries.js` (200+ countries)
- [ ] Run seed script and verify `countries` collection
- [ ] Create `scripts/seed-cities.js` (extract from partners)
- [ ] Run city seed and verify `cities` collection
- [ ] Create `scripts/migrate-partners-geography.js`
- [ ] Run partner migration and verify references
- [ ] Create `lib/countryService.ts` with caching
- [ ] Create `app/api/countries/route.ts`
- [ ] Create `app/api/cities/route.ts`
- [ ] Update Bitly sync to use `countryId` references
- [ ] Update project enrichment to use references
- [ ] Update frontend charts to fetch via API
- [ ] Delete old hardcoded files (`isoCountryToName.ts`, `countryToFlag.ts`)
- [ ] Update `ARCHITECTURE.md` with new schema
- [ ] Test end-to-end: Bitly sync → enrichment → charts display

---

## Example Query Patterns

### Get partner with full geographic context
```javascript
const partner = await db.collection('partners').aggregate([
  { $match: { _id: partnerId } },
  {
    $lookup: {
      from: 'cities',
      localField: 'cityId',
      foreignField: '_id',
      as: 'city'
    }
  },
  { $unwind: '$city' },
  {
    $lookup: {
      from: 'countries',
      localField: 'city.countryId',
      foreignField: '_id',
      as: 'country'
    }
  },
  { $unwind: '$country' }
]).toArray();

// Result: partner with nested city.name and country.name + country.flag
```

### Get project with country details
```javascript
const project = await db.collection('projects').aggregate([
  { $match: { _id: projectId } },
  {
    $lookup: {
      from: 'countries',
      localField: 'stats.bitlyTopCountries.countryId',
      foreignField: '_id',
      as: 'countryDetails'
    }
  }
]).toArray();

// Result: project with full country names + flags for chart display
```

---

*Version: 6.45.0 | Status: Design Phase | Next: Implementation*
