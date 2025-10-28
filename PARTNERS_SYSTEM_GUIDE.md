# 🤝 Partners System Technical Guide

**Version:** 8.0.0  
**Last Updated:** 2025-01-21T11:14:00.000Z (UTC)  
**Status:** Production

Complete technical documentation for the MessMass Partners Management System.

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [TypeScript Interfaces](#typescript-interfaces)
4. [API Reference](#api-reference)
5. [UI Components](#ui-components)
6. [Sports Match Builder Integration](#sports-match-builder-integration)
7. [Algorithms](#algorithms)
8. [Code Examples](#code-examples)
9. [Performance Considerations](#performance-considerations)
10. [Migration & Maintenance](#migration--maintenance)

---

## Overview

### Purpose

The Partners System enables management of organization entities (clubs, federations, venues, brands) that host or participate in events. Partners serve as metadata templates, allowing events to inherit hashtags, Bitly links, and emojis for consistency and efficiency.

### Key Features

- **Partner CRUD**: Full create, read, update, delete operations
- **Metadata Inheritance**: Events created from partners automatically inherit hashtags, Bitly links, and emojis
- **Sports Match Builder**: Intelligent event creation using two partners
- **Searchable UI**: Predictive search with debouncing
- **Many-to-Many Relationships**: Partners can have multiple Bitly links; links can belong to multiple partners

### Architecture

```
┌─────────────────┐
│  Admin UI       │
│  /admin/partners│
└────────┬────────┘
         │
    ┌────▼────┐
    │ API     │
    │ /api/   │
    │ partners│
    └────┬────┘
         │
    ┌────▼─────────┐
    │  MongoDB     │
    │  Collection: │
    │  partners    │
    └──────────────┘
```

---

## Database Schema

### MongoDB Collection: `partners`

Partners are stored in a dedicated MongoDB collection with the following structure:

```javascript path=null start=null
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  
  // Core Fields
  name: "FC Barcelona",
  emoji: "⚽",
  
  // Hashtags (Unified System)
  hashtags: ["fcb", "barcelona"],  // Traditional hashtags (no # prefix in DB)
  
  categorizedHashtags: {            // Category-based hashtags
    "country": ["spain"],
    "league": ["laliga"],
    "sport": ["football"]
  },
  
  // Bitly Links (Many-to-Many via IDs)
  bitlyLinkIds: [
    ObjectId("507f1f77bcf86cd799439022"),
    ObjectId("507f1f77bcf86cd799439033")
  ],
  
  // Metadata
  createdAt: "2025-01-21T10:00:00.000Z",  // ISO 8601 with milliseconds
  updatedAt: "2025-01-21T10:00:00.000Z"   // ISO 8601 with milliseconds
}
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB primary key |
| `name` | String | Yes | Partner name (e.g., "Manchester United") |
| `emoji` | String | No | Single emoji character (e.g., "⚽") |
| `hashtags` | String[] | No | Array of plain hashtags (no # prefix) |
| `categorizedHashtags` | Object | No | Map of category names to array of values |
| `bitlyLinkIds` | ObjectId[] | No | Array of Bitly link document IDs |
| `createdAt` | String | Auto | ISO 8601 timestamp with milliseconds |
| `updatedAt` | String | Auto | ISO 8601 timestamp with milliseconds |

### Indexes

```javascript path=null start=null
// Recommended indexes for performance
db.partners.createIndex({ name: 1 });              // Text search
db.partners.createIndex({ name: "text" });         // Full-text search
db.partners.createIndex({ updatedAt: -1 });        // Sorting
db.partners.createIndex({ bitlyLinkIds: 1 });      // Relationship queries
```

### Data Validation

MongoDB schema validation (optional but recommended):

```javascript path=null start=null
db.createCollection("partners", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "createdAt", "updatedAt"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200,
          description: "Partner name is required and must be 1-200 characters"
        },
        emoji: {
          bsonType: "string",
          maxLength: 10,
          description: "Optional emoji, max 10 characters"
        },
        hashtags: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Array of traditional hashtag strings"
        },
        categorizedHashtags: {
          bsonType: "object",
          description: "Map of category names to arrays of hashtag values"
        },
        bitlyLinkIds: {
          bsonType: "array",
          items: { bsonType: "objectId" },
          description: "Array of Bitly link ObjectIds"
        },
        createdAt: {
          bsonType: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
          description: "ISO 8601 timestamp with milliseconds"
        },
        updatedAt: {
          bsonType: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
          description: "ISO 8601 timestamp with milliseconds"
        }
      }
    }
  }
});
```

---

## TypeScript Interfaces

### Location: `lib/partner.types.ts`

```typescript path=/Users/moldovancsaba/Projects/messmass/lib/partner.types.ts start=1
import { ObjectId } from 'mongodb';

/**
 * Partner entity representing organizations that host or participate in events.
 * Partners provide metadata templates for event creation.
 */
export interface Partner {
  _id: ObjectId;                                    // MongoDB primary key
  name: string;                                     // Partner name (e.g., "FC Barcelona")
  emoji?: string;                                   // Optional single emoji (e.g., "⚽")
  hashtags?: string[];                              // Traditional hashtags (no # prefix)
  categorizedHashtags?: { [category: string]: string[] };  // Category-based hashtags
  bitlyLinkIds?: ObjectId[];                        // Array of Bitly link IDs
  createdAt: string;                                // ISO 8601 timestamp with milliseconds
  updatedAt: string;                                // ISO 8601 timestamp with milliseconds
}

/**
 * Partner with populated Bitly link details (used in API responses)
 */
export interface PartnerWithLinks extends Omit<Partner, 'bitlyLinkIds'> {
  bitlyLinks?: Array<{
    _id: ObjectId;
    bitlink: string;
    title?: string;
  }>;
}

/**
 * Input for creating a new partner
 */
export interface CreatePartnerInput {
  name: string;                                     // Required: Partner name
  emoji?: string;                                   // Optional: Single emoji
  hashtags?: string[];                              // Optional: Traditional hashtags
  categorizedHashtags?: { [category: string]: string[] };  // Optional: Categorized hashtags
  bitlyLinkIds?: string[];                          // Optional: Bitly link IDs (as strings for JSON)
}

/**
 * Input for updating an existing partner
 */
export interface UpdatePartnerInput {
  _id: string;                                      // Required: Partner ID to update
  name?: string;                                    // Optional: New partner name
  emoji?: string;                                   // Optional: New emoji
  hashtags?: string[];                              // Optional: New hashtags array
  categorizedHashtags?: { [category: string]: string[] };  // Optional: New categorized hashtags
  bitlyLinkIds?: string[];                          // Optional: New Bitly link IDs
}

/**
 * API response for list endpoints with pagination
 */
export interface PartnersListResponse {
  success: boolean;
  partners: PartnerWithLinks[];                     // Array of partners with populated links
  totalMatched: number;                             // Total partners matching filters
  nextOffset: number | null;                        // Offset for next page, null if no more
}

/**
 * API response for single partner operations
 */
export interface PartnerResponse {
  success: boolean;
  partner?: PartnerWithLinks;                       // Partner data on success
  error?: string;                                   // Error message on failure
}

/**
 * API response for delete operations
 */
export interface DeletePartnerResponse {
  success: boolean;
  deletedId?: string;                               // ID of deleted partner on success
  error?: string;                                   // Error message on failure
}
```

---

## API Reference

### Base URL

All partner endpoints are under:

```
/api/partners
```

### Authentication

All endpoints require admin session authentication via HTTP-only cookie. Unauthenticated requests return `401 Unauthorized`.

---

### GET /api/partners

**Description**: List partners with pagination, search, and sorting.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 20 | Number of partners to return |
| `offset` | number | No | 0 | Offset for pagination |
| `search` | string | No | - | Search term for name filtering |
| `sortField` | string | No | `updatedAt` | Field to sort by: `name`, `updatedAt` |
| `sortOrder` | string | No | `desc` | Sort direction: `asc`, `desc` |

**Response**:

```typescript path=null start=null
{
  success: true,
  partners: [
    {
      _id: "507f1f77bcf86cd799439011",
      name: "FC Barcelona",
      emoji: "⚽",
      hashtags: ["fcb", "barcelona"],
      categorizedHashtags: {
        "country": ["spain"],
        "league": ["laliga"]
      },
      bitlyLinks: [
        {
          _id: "507f1f77bcf86cd799439022",
          bitlink: "bit.ly/fcb-fanzone",
          title: "FC Barcelona Fan Zone"
        }
      ],
      createdAt: "2025-01-21T10:00:00.000Z",
      updatedAt: "2025-01-21T10:00:00.000Z"
    }
  ],
  totalMatched: 45,
  nextOffset: 20
}
```

**Example Request**:

```bash path=null start=null
curl -X GET \
  'https://messmass.com/api/partners?limit=20&search=barcelona&sortField=name&sortOrder=asc' \
  -H 'Cookie: session=...'
```

**Implementation Details**:

```typescript path=/Users/moldovancsaba/Projects/messmass/app/api/partners/route.ts start=18
// Build search filter
const filter: any = {};
if (searchQuery && searchQuery.trim()) {
  filter.name = { $regex: searchQuery.trim(), $options: 'i' };
}

// Execute count query for pagination
const totalMatched = await partnersCollection.countDocuments(filter);

// Build sort object
const sortObj: any = {};
if (sortField && ['name', 'updatedAt'].includes(sortField)) {
  sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;
} else {
  sortObj.updatedAt = -1;  // Default sort
}

// Fetch partners with pagination
const partners = await partnersCollection
  .find(filter)
  .sort(sortObj)
  .skip(offsetNum)
  .limit(limitNum)
  .toArray();

// Populate Bitly links using aggregation
// (See full implementation in actual file)
```

---

### POST /api/partners

**Description**: Create a new partner.

**Request Body**:

```typescript path=null start=null
{
  name: "Manchester United",
  emoji: "⚽",
  hashtags: ["mufc", "manchester"],
  categorizedHashtags: {
    "country": ["uk"],
    "league": ["premierleague"]
  },
  bitlyLinkIds: ["507f1f77bcf86cd799439022"]
}
```

**Response**:

```typescript path=null start=null
{
  success: true,
  partner: {
    _id: "507f1f77bcf86cd799439044",
    name: "Manchester United",
    emoji: "⚽",
    hashtags: ["mufc", "manchester"],
    categorizedHashtags: {
      "country": ["uk"],
      "league": ["premierleague"]
    },
    bitlyLinks: [
      {
        _id: "507f1f77bcf86cd799439022",
        bitlink: "bit.ly/mufc-fanzone",
        title: "Manchester United Fan Zone"
      }
    ],
    createdAt: "2025-01-21T11:00:00.000Z",
    updatedAt: "2025-01-21T11:00:00.000Z"
  }
}
```

**Example Request**:

```bash path=null start=null
curl -X POST \
  'https://messmass.com/api/partners' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: session=...' \
  -d '{
    "name": "Manchester United",
    "emoji": "⚽",
    "hashtags": ["mufc", "manchester"],
    "categorizedHashtags": {
      "country": ["uk"],
      "league": ["premierleague"]
    },
    "bitlyLinkIds": ["507f1f77bcf86cd799439022"]
  }'
```

**Validation**:

```typescript path=null start=null
// Name is required
if (!name || typeof name !== 'string' || name.trim() === '') {
  return NextResponse.json(
    { success: false, error: 'Partner name is required' },
    { status: 400 }
  );
}

// Emoji must be a single character if provided
if (emoji && emoji.length > 10) {
  return NextResponse.json(
    { success: false, error: 'Emoji must be a single character' },
    { status: 400 }
  );
}

// Convert bitlyLinkIds from string[] to ObjectId[]
const bitlyLinkObjectIds = bitlyLinkIds
  ? bitlyLinkIds.map(id => new ObjectId(id))
  : [];
```

---

### PUT /api/partners

**Description**: Update an existing partner.

**Request Body**:

```typescript path=null start=null
{
  _id: "507f1f77bcf86cd799439044",
  name: "Manchester United FC",  // Updated name
  emoji: "🔴",                    // Updated emoji
  hashtags: ["mufc", "reddevils"],  // Updated hashtags
  categorizedHashtags: {
    "country": ["uk"],
    "league": ["premierleague", "europaleague"]  // Added league
  },
  bitlyLinkIds: ["507f1f77bcf86cd799439022", "507f1f77bcf86cd799439055"]  // Added link
}
```

**Response**:

```typescript path=null start=null
{
  success: true,
  partner: {
    _id: "507f1f77bcf86cd799439044",
    name: "Manchester United FC",
    emoji: "🔴",
    hashtags: ["mufc", "reddevils"],
    categorizedHashtags: {
      "country": ["uk"],
      "league": ["premierleague", "europaleague"]
    },
    bitlyLinks: [...],
    createdAt: "2025-01-21T11:00:00.000Z",
    updatedAt: "2025-01-21T12:30:00.000Z"  // Updated timestamp
  }
}
```

**Example Request**:

```bash path=null start=null
curl -X PUT \
  'https://messmass.com/api/partners' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: session=...' \
  -d '{
    "_id": "507f1f77bcf86cd799439044",
    "name": "Manchester United FC"
  }'
```

**Implementation Notes**:

- Only provided fields are updated; omitted fields remain unchanged
- `updatedAt` timestamp is automatically refreshed
- Partner must exist; returns `404` if not found

---

### DELETE /api/partners

**Description**: Delete a partner by ID.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `partnerId` | string | Yes | ObjectId of partner to delete |

**Response**:

```typescript path=null start=null
{
  success: true,
  deletedId: "507f1f77bcf86cd799439044"
}
```

**Example Request**:

```bash path=null start=null
curl -X DELETE \
  'https://messmass.com/api/partners?partnerId=507f1f77bcf86cd799439044' \
  -H 'Cookie: session=...'
```

**Side Effects**:

- Partner is permanently removed from database
- **Events are NOT deleted** (no cascade)
- **Bitly links are NOT deleted** (many-to-many relationship)
- Events created from this partner retain their inherited metadata

---

## UI Components

### Partner Admin Page

**Location**: `app/admin/partners/page.tsx`

**Features**:
- Sortable table with columns: Name, Emoji, Hashtags, Bitly Links, Actions
- Search bar with debounced filtering
- Pagination (Load 20 more)
- Add/Edit modals with form validation
- Delete confirmation dialogs

**Component Architecture**:

```
PartnersPage (Client Component)
├── AdminHero (Header with search and action buttons)
├── Partners Table
│   ├── Table Header (sortable columns)
│   ├── Table Rows
│   │   ├── Partner Name
│   │   ├── Emoji Display
│   │   ├── Hashtag Chips (ColoredHashtagBubble)
│   │   ├── Bitly Links Chips
│   │   └── Action Buttons (Edit, Delete)
│   └── Load More Button
├── Add Partner Modal
│   ├── Name Input
│   ├── Emoji Input
│   ├── UnifiedHashtagInput (Traditional)
│   ├── UnifiedHashtagInput (Categorized)
│   └── BitlyLinksSelector
└── Edit Partner Modal (same structure as Add)
```

### PartnerSelector Component

**Location**: `components/PartnerSelector.tsx`

**Purpose**: Reusable predictive search component for selecting a single partner.

**Props**:

```typescript path=/Users/moldovancsaba/Projects/messmass/components/PartnerSelector.tsx start=8
interface PartnerSelectorProps {
  value: Partner | null;                // Currently selected partner
  onChange: (partner: Partner | null) => void;  // Callback when selection changes
  partners: Partner[];                  // Array of available partners
  placeholder?: string;                 // Placeholder text for input
  label?: string;                       // Label above the selector
}
```

**Features**:
- **Chip Display**: Selected partner shown as colored chip with emoji and name
- **Remove Action**: Click (×) to clear selection
- **Predictive Search**: Dropdown with filtered results as you type
- **Keyboard Navigation**: Arrow keys, Enter, Escape support
- **Accessibility**: ARIA labels, focus management

**Usage Example**:

```typescript path=null start=null
import PartnerSelector from '@/components/PartnerSelector';

function MyComponent() {
  const [homeTeam, setHomeTeam] = useState<Partner | null>(null);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  
  // Fetch partners on mount
  useEffect(() => {
    fetch('/api/partners?limit=1000')
      .then(res => res.json())
      .then(data => setAllPartners(data.partners));
  }, []);
  
  return (
    <PartnerSelector
      value={homeTeam}
      onChange={setHomeTeam}
      partners={allPartners}
      placeholder="Search for home team..."
      label="Home Team"
    />
  );
}
```

**Algorithm: Predictive Filtering**

```typescript path=null start=null
// Filter partners based on search term
const filteredPartners = partners.filter(partner => {
  const searchLower = searchTerm.toLowerCase();
  return partner.name.toLowerCase().includes(searchLower);
});

// Sort by relevance: Exact matches first, then starts-with, then contains
const sortedPartners = filteredPartners.sort((a, b) => {
  const aLower = a.name.toLowerCase();
  const bLower = b.name.toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  // Exact match
  if (aLower === searchLower) return -1;
  if (bLower === searchLower) return 1;
  
  // Starts with
  if (aLower.startsWith(searchLower) && !bLower.startsWith(searchLower)) return -1;
  if (bLower.startsWith(searchLower) && !aLower.startsWith(searchLower)) return 1;
  
  // Alphabetical
  return aLower.localeCompare(bLower);
});
```

---

## Sports Match Builder Integration

### Location: `app/admin/quick-add/page.tsx`

The Sports Match Builder uses partners to intelligently create event entries.

### User Flow

1. User selects Home Team (Partner 1) via PartnerSelector
2. User selects Away Team (Partner 2) via PartnerSelector
3. User picks event date via date picker
4. User clicks "Preview Match"
5. System displays generated event preview
6. User clicks "Create Event"
7. System creates event in database

### Event Generation Logic

```typescript path=/Users/moldovancsaba/Projects/messmass/app/admin/quick-add/page.tsx start=156
const handleMatchPreview = () => {
  if (!partner1 || !partner2 || !matchDate) {
    alert('Please select both teams and a date');
    return;
  }
  
  // Step 1: Generate event name
  // Format: [Partner1 Emoji] Partner1 Name x Partner2 Name
  const generatedName = partner1.emoji 
    ? `${partner1.emoji} ${partner1.name} x ${partner2.name}`
    : `${partner1.name} x ${partner2.name}`;
  
  // Step 2: Merge hashtags
  const mergedHashtags = mergeHashtags(partner1, partner2);
  
  // Step 3: Inherit Bitly links from Partner 1 only
  const bitlyLinkIds = partner1.bitlyLinkIds || [];
  
  // Step 4: Set preview state
  setPreviewMatch({
    eventName: generatedName,
    eventDate: matchDate,
    hashtags: mergedHashtags.traditional,
    categorizedHashtags: mergedHashtags.categorized,
    bitlyLinkIds: bitlyLinkIds.map(id => id.toString())
  });
};
```

### Hashtag Merging Algorithm

```typescript path=null start=null
/**
 * Merges hashtags from two partners for sports match event creation.
 * Rules:
 * 1. Take ALL hashtags from Partner 1 (home team)
 * 2. Take ONLY non-location hashtags from Partner 2 (away team)
 * 3. Remove duplicates
 * 
 * @param partner1 - Home team partner
 * @param partner2 - Away team partner
 * @returns Merged hashtags object
 */
function mergeHashtags(
  partner1: Partner,
  partner2: Partner
): {
  traditional: string[];
  categorized: { [category: string]: string[] };
} {
  // Step 1: Merge traditional hashtags
  const traditionalSet = new Set<string>();
  
  // Add all from Partner 1
  (partner1.hashtags || []).forEach(tag => traditionalSet.add(tag));
  
  // Add all from Partner 2
  (partner2.hashtags || []).forEach(tag => traditionalSet.add(tag));
  
  const traditional = Array.from(traditionalSet);
  
  // Step 2: Merge categorized hashtags
  const categorized: { [category: string]: string[] } = {};
  
  // Add all categories from Partner 1
  if (partner1.categorizedHashtags) {
    Object.entries(partner1.categorizedHashtags).forEach(([category, values]) => {
      categorized[category] = [...values];
    });
  }
  
  // Add non-location categories from Partner 2
  if (partner2.categorizedHashtags) {
    Object.entries(partner2.categorizedHashtags).forEach(([category, values]) => {
      // Skip location category from Partner 2
      if (category.toLowerCase() === 'location') return;
      
      if (!categorized[category]) {
        categorized[category] = [];
      }
      
      // Merge values, removing duplicates
      const mergedValues = new Set([...categorized[category], ...values]);
      categorized[category] = Array.from(mergedValues);
    });
  }
  
  return { traditional, categorized };
}
```

**Why Exclude Location from Partner 2?**

In a sports match, the home team (Partner 1) provides the event location. Including the away team's (Partner 2) location would create conflicting geographic metadata. For example:

- **Partner 1** (Manchester United): `location: manchester`
- **Partner 2** (Liverpool FC): `location: liverpool`

The match is played in Manchester, so only `location: manchester` should be included.

---

## Algorithms

### Algorithm 1: Partner Search with Debouncing (Centralized)

**Purpose**: Prevent excessive API calls during rapid typing.

**Standard Implementation** (shared across admin pages):

```typescript path=null start=null
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [searchTerm, setSearchTerm] = useState('');
const debouncedTerm = useDebouncedValue(searchTerm, 300);

// Fetch when debounced term changes
useEffect(() => {
  loadPartners();
}, [debouncedTerm]);
```

- Prevent Enter key submitting the form/search input via AdminHero:
```tsx path=null start=null
<AdminHero
  showSearch
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  onSearchKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
/>
```

- Avoid full-page loaders during search; use an `isSearching` boolean to show inline loading indicators only.
- Use `fetch(..., { cache: 'no-store' })` for search requests to avoid stale results.

**Benefits**:
- Reduces API load by 90%+ during typing
- Improves UI responsiveness
- Prevents rate limiting issues
- Ensures identical search UX across Projects, Partners, Bitly, and Hashtags

---

### Algorithm 2: Bitly Link Population

**Purpose**: Efficiently populate partner Bitly links without N+1 queries.

**Naive Approach (N+1 Problem)**:

```typescript path=null start=null
// DON'T DO THIS - Makes 1 + N queries
const partners = await partnersCollection.find().toArray();

for (const partner of partners) {
  const links = await bitlyLinksCollection
    .find({ _id: { $in: partner.bitlyLinkIds } })
    .toArray();
  partner.bitlyLinks = links;
}
```

**Optimized Approach (2 Queries)**:

```typescript path=/Users/moldovancsaba/Projects/messmass/app/api/partners/route.ts start=45
// Step 1: Fetch all partners
const partners = await partnersCollection
  .find(filter)
  .sort(sortObj)
  .skip(offsetNum)
  .limit(limitNum)
  .toArray();

// Step 2: Collect all unique Bitly link IDs
const allBitlyLinkIds = partners
  .flatMap(p => p.bitlyLinkIds || [])
  .filter((id, index, self) => self.findIndex(i => i.equals(id)) === index);  // Deduplicate

// Step 3: Fetch all Bitly links in one query
const bitlyLinks = await bitlyLinksCollection
  .find({ _id: { $in: allBitlyLinkIds } })
  .toArray();

// Step 4: Create lookup map
const bitlyLinksMap = new Map(
  bitlyLinks.map(link => [link._id.toString(), link])
);

// Step 5: Populate partners
const partnersWithLinks = partners.map(partner => ({
  ...partner,
  bitlyLinks: (partner.bitlyLinkIds || [])
    .map(id => bitlyLinksMap.get(id.toString()))
    .filter(Boolean)
}));
```

**Performance**:
- Naive: O(N) queries
- Optimized: O(1) queries (constant 2 queries)
- 100x faster for 100 partners

---

## Code Examples

### Example 1: Fetch All Partners (Client-Side)

```typescript path=null start=null
async function fetchAllPartners(): Promise<Partner[]> {
  try {
    const response = await fetch('/api/partners?limit=1000&sortField=name&sortOrder=asc');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: PartnersListResponse = await response.json();
    
    if (!data.success) {
      throw new Error('API returned success: false');
    }
    
    return data.partners;
  } catch (error) {
    console.error('Failed to fetch partners:', error);
    return [];
  }
}
```

### Example 2: Create Partner with Error Handling

```typescript path=null start=null
async function createPartner(input: CreatePartnerInput): Promise<Partner | null> {
  try {
    const response = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    
    const data: PartnerResponse = await response.json();
    
    if (!data.success) {
      alert(`Failed to create partner: ${data.error}`);
      return null;
    }
    
    alert('Partner created successfully!');
    return data.partner!;
  } catch (error) {
    console.error('Network error:', error);
    alert('Failed to create partner. Check your connection.');
    return null;
  }
}

// Usage
const newPartner = await createPartner({
  name: 'FC Barcelona',
  emoji: '⚽',
  hashtags: ['fcb', 'barcelona'],
  categorizedHashtags: {
    country: ['spain'],
    league: ['laliga']
  },
  bitlyLinkIds: ['507f1f77bcf86cd799439022']
});
```

### Example 3: Server-Side Partner Query with MongoDB

```typescript path=null start=null
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { Partner } from '@/lib/partner.types';

async function getPartnerById(partnerId: string): Promise<Partner | null> {
  const db = await getDb();
  const partnersCollection = db.collection<Partner>('partners');
  
  try {
    const partner = await partnersCollection.findOne({
      _id: new ObjectId(partnerId)
    });
    
    return partner;
  } catch (error) {
    console.error('Failed to fetch partner:', error);
    return null;
  }
}
```

### Example 4: Sports Match Event Creation

```typescript path=null start=null
async function createSportsMatchEvent(
  homeTeam: Partner,
  awayTeam: Partner,
  eventDate: string
): Promise<Project | null> {
  // Step 1: Generate event name
  const eventName = homeTeam.emoji
    ? `${homeTeam.emoji} ${homeTeam.name} x ${awayTeam.name}`
    : `${homeTeam.name} x ${awayTeam.name}`;
  
  // Step 2: Merge hashtags
  const mergedHashtags = mergeHashtags(homeTeam, awayTeam);
  
  // Step 3: Prepare project input
  const projectInput = {
    eventName,
    eventDate,
    hashtags: mergedHashtags.traditional,
    categorizedHashtags: mergedHashtags.categorized,
    stats: {
      remoteImages: 0,
      hostessImages: 0,
      // ... initialize all stats to 0
    }
  };
  
  // Step 4: Create project via API
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectInput)
  });
  
  const data = await response.json();
  return data.success ? data.project : null;
}
```

---

## Performance Considerations

### Database Query Optimization

**Indexes**: Ensure indexes exist on frequently queried fields:

```javascript path=null start=null
db.partners.createIndex({ name: 1 });
db.partners.createIndex({ name: "text" });  // Full-text search
db.partners.createIndex({ updatedAt: -1 });
```

**Pagination**: Always use `limit` and `skip` for large datasets:

```typescript path=null start=null
// Good: Paginated query
const partners = await partnersCollection
  .find(filter)
  .limit(20)
  .skip(offset)
  .toArray();

// Bad: Load all data
const allPartners = await partnersCollection.find().toArray();  // DON'T
```

### Client-Side Caching

Cache partner list on the client to avoid repeated API calls:

```typescript path=null start=null
const [partnersCache, setPartnersCache] = useState<Partner[]>([]);
const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);

async function getPartners(): Promise<Partner[]> {
  const now = Date.now();
  const CACHE_TTL = 5 * 60 * 1000;  // 5 minutes
  
  // Return cached data if fresh
  if (partnersCache.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    return partnersCache;
  }
  
  // Fetch fresh data
  const response = await fetch('/api/partners?limit=1000');
  const data = await response.json();
  
  // Update cache
  setPartnersCache(data.partners);
  setCacheTimestamp(now);
  
  return data.partners;
}
```

### Lazy Loading Bitly Links

Don't fetch Bitly links until the modal is opened:

```typescript path=null start=null
// In Partners page component
const [bitlyLinks, setBitlyLinks] = useState<BitlyLink[]>([]);
const [bitlyLinksLoaded, setBitlyLinksLoaded] = useState(false);

const handleOpenAddModal = async () => {
  setShowAddModal(true);
  
  // Lazy load Bitly links only when modal opens
  if (!bitlyLinksLoaded) {
    const response = await fetch('/api/bitly/links?limit=1000');
    const data = await response.json();
    setBitlyLinks(data.links);
    setBitlyLinksLoaded(true);
  }
};
```

---

## Migration & Maintenance

### Adding a New Partner Field

**Step 1**: Update TypeScript interface:

```typescript path=/Users/moldovancsaba/Projects/messmass/lib/partner.types.ts start=5
export interface Partner {
  // ... existing fields
  website?: string;  // New field
}
```

**Step 2**: Update API validation:

```typescript path=/Users/moldovancsaba/Projects/messmass/app/api/partners/route.ts start=100
// In POST /api/partners
const { name, emoji, hashtags, categorizedHashtags, bitlyLinkIds, website } = await req.json();

// Validate website if provided
if (website && !isValidUrl(website)) {
  return NextResponse.json(
    { success: false, error: 'Invalid website URL' },
    { status: 400 }
  );
}
```

**Step 3**: Update UI form:

```typescript path=null start=null
// In PartnersPage modal
<input
  type="url"
  placeholder="https://example.com"
  value={partnerForm.website || ''}
  onChange={(e) => setPartnerForm({ ...partnerForm, website: e.target.value })}
/>
```

**Step 4**: Run migration (optional for existing data):

```javascript path=null start=null
// scripts/add-website-field-to-partners.js
const { MongoClient } = require('mongodb');

async function migrate() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);
  
  const result = await db.collection('partners').updateMany(
    { website: { $exists: false } },
    { $set: { website: null } }
  );
  
  console.log(`Updated ${result.modifiedCount} partners`);
  await client.close();
}

migrate();
```

### Backup Strategy

**MongoDB Atlas**: Automatic daily backups with 7-day retention.

**Manual Backup**:

```bash path=null start=null
# Export partners collection
mongodump \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/messmass" \
  --collection=partners \
  --out=./backup-$(date +%Y%m%d)

# Restore from backup
mongorestore \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/messmass" \
  --dir=./backup-20250121/messmass/partners.bson
```

---

**MessMass Partners System Version 6.0.0**  
**Last Updated: 2025-01-21T11:14:00.000Z (UTC)**  
**© 2025 MessMass Platform**
