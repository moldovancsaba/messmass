# TheSportsDB Partner Enrichment & Auto-Hashtag Generation

**Version**: 6.22.3  
**Last Updated**: 2025-01-17T17:01:00.000Z  
**Status**: Production-Ready

## Overview

MessMass now captures **ALL available TheSportsDB team data** when linking partners and automatically generates categorized hashtags based on team metadata. This provides comprehensive KYC (Know Your Customer) data and enhanced filtering capabilities.

---

## Features

### 1. **Comprehensive Team Data Capture**

When linking a partner to TheSportsDB, the system now stores all 20+ available fields:

#### Core Identifiers
- `teamId` - TheSportsDB team ID
- `strTeam` - Full team name
- `strTeamShort` - Short name
- `strAlternate` - Alternative names

#### Sport & League
- `strSport` - Sport type (e.g., "Soccer", "Handball")
- `strLeague` - League name (e.g., "La Liga")
- `leagueId` - League ID

#### Venue/Stadium
- `strStadium` - Stadium name
- `venueId` - Venue ID
- `intStadiumCapacity` - Stadium capacity (number)
- `strStadiumThumb` - Stadium image URL
- `strStadiumDescription` - Stadium description
- `strStadiumLocation` - City/location (e.g., "Barcelona, Catalonia")

#### Team Details
- `intFormedYear` - Year founded
- `strCountry` - Country
- `strDescriptionEN` - English description

#### Visual Assets
- `strTeamBadge` - Main logo URL
- `strTeamLogo` - Alternative logo URL
- `strTeamJersey` - Jersey/kit image URL
- `strTeamBanner` - Banner image URL
- `strTeamFanart1-4` - Fan art images (4 slots)

#### Social Media & Web
- `strWebsite` - Official website
- `strFacebook` - Facebook page URL
- `strTwitter` - Twitter handle
- `strInstagram` - Instagram handle

### 2. **Automatic Hashtag Generation**

The system automatically generates categorized hashtags from team data:

#### Sport Category
- **Source**: `strSport`
- **Example**: `sport:soccer`, `sport:handball`, `sport:basketball`

#### League Category
- **Source**: `strLeague`
- **Example**: `league:laliga`, `league:premierleague`, `league:bundesliga`

#### Location Category
- **Sources**: `strStadiumLocation`, `strCountry`
- **Parsing**: Splits locations by comma/hyphen/slash
- **Example**: "Barcelona, Catalonia" + "Spain" → `location:barcelona`, `location:catalonia`, `location:spain`

---

## How It Works

### Linking Workflow

```
1. Admin searches for team in TheSportsDB
   ↓
2. Selects team from search results
   ↓
3. System fetches complete team profile (20+ fields)
   ↓
4. Auto-generates hashtags from:
   - Sport type → sport:*
   - League name → league:*
   - Stadium location → location:*
   - Country → location:*
   ↓
5. Merges with existing partner hashtags
   ↓
6. Stores comprehensive data + enriched hashtags
   ↓
7. Uploads logo to ImgBB for permanent hosting
```

### Hashtag Normalization

All generated hashtags are normalized:
- Lowercase conversion
- Removal of non-alphanumeric characters
- Trimming whitespace

**Examples**:
- "La Liga" → `laliga`
- "New York, NY" → `newyork`, `ny`
- "Premier League" → `premierleague`

---

## Usage Examples

### Example 1: FC Barcelona

**TheSportsDB Data Retrieved**:
```json
{
  "idTeam": "133604",
  "strTeam": "FC Barcelona",
  "strSport": "Soccer",
  "strLeague": "La Liga",
  "strStadium": "Camp Nou",
  "strStadiumLocation": "Barcelona, Catalonia",
  "intStadiumCapacity": "99354",
  "strCountry": "Spain",
  "strWebsite": "http://www.fcbarcelona.com",
  "strTeamBadge": "https://..."
}
```

**Auto-Generated Hashtags**:
```json
{
  "sport": ["soccer"],
  "league": ["laliga"],
  "location": ["barcelona", "catalonia", "spain"]
}
```

**Result**:
- Partner can be filtered by `sport:soccer`
- Partner can be filtered by `league:laliga`
- Partner can be filtered by `location:barcelona`, `location:spain`, etc.

### Example 2: Aalborg Håndbold

**TheSportsDB Data Retrieved**:
```json
{
  "idTeam": "141401",
  "strTeam": "Aalborg Håndbold",
  "strSport": "Handball",
  "strLeague": "Danish Mens Handball League",
  "strStadium": "Jutlander Bank Arena",
  "strStadiumLocation": "Aalborg",
  "intStadiumCapacity": "5000",
  "strCountry": "Denmark"
}
```

**Auto-Generated Hashtags**:
```json
{
  "sport": ["handball"],
  "league": ["danishmenshandballleague"],
  "location": ["aalborg", "denmark"]
}
```

---

## Technical Implementation

### Key Files

| File | Purpose |
|------|---------|
| `lib/partner.types.ts` | Expanded SportsDB schema with all fields |
| `lib/sportsDbHashtagEnricher.ts` | Hashtag generation & merging logic |
| `app/admin/partners/page.tsx` | Partner linking UI with auto-enrichment |
| `app/api/partners/route.ts` | Partner CRUD API (handles expanded schema) |

### Core Functions

#### `generateSportsDbHashtags(team: SportsDbTeam)`

Generates categorized hashtags from team data.

```typescript
import { generateSportsDbHashtags } from '@/lib/sportsDbHashtagEnricher';

const team = { /* TheSportsDB team object */ };
const hashtags = generateSportsDbHashtags(team);
// Returns: { sport: [...], league: [...], location: [...] }
```

#### `mergeSportsDbHashtags(existing, generated)`

Merges auto-generated hashtags with existing partner hashtags without duplication.

```typescript
import { mergeSportsDbHashtags } from '@/lib/sportsDbHashtagEnricher';

const existing = { category: ['club'], location: ['europe'] };
const generated = { sport: ['soccer'], location: ['spain'] };

const merged = mergeSportsDbHashtags(existing, generated);
// Returns: {
//   category: ['club'],
//   location: ['europe', 'spain'],
//   sport: ['soccer']
// }
```

---

## Database Schema

### Partner Document (MongoDB)

```typescript
{
  _id: ObjectId,
  name: string,
  emoji: string,
  
  // Categorized hashtags (including auto-generated ones)
  categorizedHashtags: {
    sport: ['soccer'],
    league: ['laliga'],
    location: ['barcelona', 'catalonia', 'spain'],
    category: ['club'] // Manually added
  },
  
  // Comprehensive TheSportsDB data
  sportsDb: {
    // Core
    teamId: '133604',
    strTeam: 'FC Barcelona',
    strTeamShort: 'Barcelona',
    strAlternate: '...',
    
    // Sport & League
    strSport: 'Soccer',
    strLeague: 'La Liga',
    leagueId: '4335',
    
    // Venue
    strStadium: 'Camp Nou',
    venueId: '...',
    intStadiumCapacity: 99354,
    strStadiumThumb: 'https://...',
    strStadiumDescription: '...',
    strStadiumLocation: 'Barcelona, Catalonia',
    
    // Details
    intFormedYear: '1899',
    strCountry: 'Spain',
    strDescriptionEN: '...',
    
    // Visual Assets
    strTeamBadge: 'https://...',
    strTeamLogo: 'https://...',
    strTeamJersey: 'https://...',
    strTeamBanner: 'https://...',
    strTeamFanart1: 'https://...',
    strTeamFanart2: 'https://...',
    strTeamFanart3: 'https://...',
    strTeamFanart4: 'https://...',
    
    // Social & Web
    strWebsite: 'http://www.fcbarcelona.com',
    strFacebook: 'https://...',
    strTwitter: '@FCBarcelona',
    strInstagram: 'fcbarcelona',
    
    // Metadata
    lastSynced: '2025-01-17T17:01:00.000Z',
    
    // Legacy fields (backward compatibility)
    leagueName: 'La Liga',
    venueName: 'Camp Nou',
    venueCapacity: 99354,
    founded: '1899',
    country: 'Spain',
    website: 'http://www.fcbarcelona.com',
    badge: 'https://...'
  },
  
  logoUrl: 'https://i.ibb.co/...',  // ImgBB hosted logo
  bitlyLinkIds: [...],
  createdAt: '2025-01-17T17:00:00.000Z',
  updatedAt: '2025-01-17T17:01:00.000Z'
}
```

---

## Filtering & Search

Partners can now be filtered by auto-generated hashtags:

### Filter by Sport
```typescript
// Find all soccer partners
const soccerPartners = await db.collection('partners')
  .find({ 'categorizedHashtags.sport': 'soccer' })
  .toArray();
```

### Filter by League
```typescript
// Find all La Liga partners
const laLigaPartners = await db.collection('partners')
  .find({ 'categorizedHashtags.league': 'laliga' })
  .toArray();
```

### Filter by Location
```typescript
// Find all Spanish partners
const spanishPartners = await db.collection('partners')
  .find({ 'categorizedHashtags.location': 'spain' })
  .toArray();
```

### Combined Filters
```typescript
// Find all soccer clubs in Spain
const query = {
  'categorizedHashtags.sport': 'soccer',
  'categorizedHashtags.location': 'spain'
};
```

---

## Admin UI

### Linking Process

1. Navigate to **Admin > Partners**
2. Click **Edit** on a partner
3. Scroll to "Link to TheSportsDB" section
4. Search for team by name
5. Click **🔗 Link** button
6. System automatically:
   - Fetches all 20+ team fields
   - Uploads logo to ImgBB
   - Generates hashtags (sport, league, location)
   - Merges with existing hashtags
   - Saves to database

### Re-Syncing Data

1. Open partner edit form
2. If already linked, click **🔄 Re-sync from TheSportsDB**
3. System:
   - Fetches latest team data
   - Updates all fields
   - Regenerates hashtags (in case league/location changed)
   - Updates logo if badge URL changed

---

## Benefits

### 1. **Comprehensive KYC**
- Full team profile for legal/compliance purposes
- Social media links for marketing integration
- Visual assets for branding

### 2. **Enhanced Filtering**
- Filter partners by sport type
- Find all teams in specific league
- Group by geographic location

### 3. **Automatic Categorization**
- No manual hashtag entry for standard metadata
- Consistent hashtag formatting
- Reduces human error

### 4. **Future-Proof**
- All TheSportsDB fields captured for future features
- Social media integration ready
- Multi-image assets available

---

## Best Practices

### 1. **Always Link via Search**
Use the search interface rather than manual entry:
- More accurate data
- Includes all 20+ fields
- Auto-generates hashtags

### 2. **Re-Sync Periodically**
Teams may change leagues, venues, or capacities:
- Click **🔄 Re-sync** button
- Updates all fields and hashtags
- Recommended: quarterly or after major team changes

### 3. **Preserve Manual Hashtags**
The system merges auto-generated hashtags with existing ones:
- Manual hashtags in other categories are preserved
- Location hashtags are merged (e.g., `location:europe` + auto-generated `location:spain`)
- No data loss

### 4. **Use Hashtag Filters**
Leverage auto-generated hashtags for:
- Event planning (find local clubs)
- Sport-specific campaigns
- League-wide analytics

---

## Limitations & Considerations

### TheSportsDB API Limitations
- **Coverage**: Not all teams/leagues available
- **Quality**: Some fields may be empty or outdated
- **Rate Limits**: 3 requests per minute (free tier)

### Manual Entry Fallback
When team not in API:
- Use "🖊️ Enter manually" button
- Provide essential fields only
- System won't auto-generate hashtags (no source data)

### Hashtag Conflicts
If partner already has hashtags in auto-generated categories:
- System merges arrays and removes duplicates
- Both manual and auto hashtags coexist
- To override, manually edit after linking

---

## Troubleshooting

### Hashtags Not Appearing
**Problem**: Auto-generated hashtags not visible after linking

**Solutions**:
1. Verify team has sport/league/location data in TheSportsDB
2. Check browser console for hashtag generation logs
3. Re-sync partner to regenerate hashtags
4. Ensure API call completed successfully

### Wrong Location Hashtags
**Problem**: Location parsing creates unexpected hashtags

**Example**: "New York, NY, USA" → 3 separate hashtags

**Solutions**:
- This is expected behavior (enables filtering by city, state, country)
- To remove unwanted hashtags, edit partner manually
- Location parsing handles comma/hyphen/slash separators

### Legacy Data Migration
**Problem**: Existing partners have old sportsDb format

**Solutions**:
- Re-sync partners to upgrade to new schema
- Old fields still work (backward compatibility)
- New fields will populate on next sync

---

## API Reference

### Expanded Partner API

**PUT /api/partners**

```typescript
{
  partnerId: string,
  sportsDb: {
    // All 20+ fields from TheSportsDB
    teamId, strTeam, strSport, strLeague, ...
  },
  categorizedHashtags: {
    sport: string[],
    league: string[],
    location: string[],
    // + any manually added categories
  },
  logoUrl: string
}
```

---

## Version History

### v6.22.3 (2025-01-17)
- ✅ Expanded Partner sportsDb schema to store all TheSportsDB fields
- ✅ Created sportsDbHashtagEnricher utility for auto-generation
- ✅ Updated linking workflow to capture comprehensive data
- ✅ Updated re-sync workflow to refresh all fields
- ✅ Added backward compatibility for legacy fields

---

**Status**: Production-Ready — Enterprise Partner Management Platform
