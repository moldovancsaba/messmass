# Partner SportsDB Bulk Enrichment Script

## Overview

This script automates the process of linking existing partners with TheSportsDB data, enriching them with sports club metadata including stadium capacity, league information, team badges, and venue details.

## Features

✅ **Intelligent Matching** - Uses Levenshtein distance algorithm with confidence scoring  
✅ **Rate Limiting** - Respects TheSportsDB API limits (1 second between calls)  
✅ **Dry Run Mode** - Preview changes before applying to database  
✅ **Confidence Thresholds** - Auto-links high-confidence matches (>90%), flags medium matches (70-90%) for manual review  
✅ **Error Handling** - Automatic retries with exponential backoff  
✅ **Progress Tracking** - Real-time console output with detailed statistics  
✅ **Filtering Support** - Process specific partners by name pattern  

## Prerequisites

1. **Environment Variables**
   ```bash
   MONGODB_URI=mongodb+srv://...
   MONGODB_DB=messmass
   SPORTSDB_API_KEY=3  # Free tier key (default)
   ```

2. **Node.js Fetch API**
   - Requires Node.js 18+ (native fetch support)
   - Or install `node-fetch` for older versions

## Usage

### Basic Usage (Dry Run - Recommended First)

```bash
node scripts/enrich-partners-sportsdb.js --dry-run
```

This will:
- Search TheSportsDB for all partners without `sportsDb` data
- Display matching results and confidence scores
- **NOT** modify the database
- Show what would happen in a live run

### Live Run (Apply Changes)

```bash
node scripts/enrich-partners-sportsdb.js
```

⚠️ **WARNING**: This will update the database. Always run `--dry-run` first!

### Advanced Options

#### Force Re-enrichment (Update Existing Links)

```bash
node scripts/enrich-partners-sportsdb.js --force
```

Use this to:
- Re-sync all partners (even those already linked)
- Update outdated capacity/league data
- Fix incorrect links

#### Filter by Partner Name

```bash
node scripts/enrich-partners-sportsdb.js --filter="Barcelona"
```

Process only partners matching the filter (case-insensitive regex).

#### Combined Flags

```bash
node scripts/enrich-partners-sportsdb.js --dry-run --force --filter="Real Madrid"
```

## How It Works

### 1. **Partner Matching Algorithm**

The script calculates string similarity between partner names and TheSportsDB team names using:

- **Levenshtein Distance**: Measures edit distance between strings
- **Normalization**: Removes common abbreviations (FC, Club, CF, CD, SC, United, etc.)
- **Confidence Scoring**: 0-1 scale (0% to 100% match)

**Example Matches:**
- "FC Barcelona" ↔ "Barcelona" = 95% (normalized match)
- "Real Madrid CF" ↔ "Real Madrid" = 95% (normalized match)
- "Bayern Munich" ↔ "FC Bayern München" = 75% (medium confidence)

### 2. **Confidence Thresholds**

| Score | Action | Reason |
|-------|--------|--------|
| ≥90% | **Auto-link** | High confidence, obvious match |
| 70-89% | **Manual review** | Likely match but needs verification |
| <70% | **Skip** | Too low confidence, avoid false positives |

### 3. **Rate Limiting**

- **1 second delay** between API calls
- **3 retry attempts** with exponential backoff
- **Prevents API throttling** and respects free tier limits

### 4. **Data Enrichment**

For each matched partner, the script fetches and stores:

```javascript
{
  teamId: "133604",              // TheSportsDB team ID
  leagueId: "4335",              // League ID
  venueId: "66438",              // Venue ID
  venueCapacity: 99354,          // Stadium capacity (integer)
  venueName: "Camp Nou",         // Stadium name
  leagueName: "Spanish La Liga", // League name
  founded: "1899",               // Year founded
  country: "Spain",              // Country
  website: "www.fcbarcelona.com", // Official website
  badge: "https://...",          // Team badge URL
  lastSynced: "2025-01-16T..."   // ISO 8601 timestamp
}
```

## Output Examples

### Console Output (Dry Run)

```
🚀 MessMass Partner Enrichment Script
=====================================

Mode: 🧪 DRY RUN (no changes)
Force re-enrichment: NO

✅ Connected to MongoDB

📋 Found 12 partners to process

[1/12] Processing: ⚽ FC Barcelona
  🔍 Found 1 potential matches
  🎯 Best match: Barcelona (98.5% confidence)
  ✅ High confidence - auto-linking
  📊 League: Spanish La Liga
  🏟️  Venue: Camp Nou (99,354 capacity)
  🧪 DRY RUN - would save to database

[2/12] Processing: 🏟️ Emirates Stadium
  ❌ No matches found on TheSportsDB

[3/12] Processing: ⚽ Bayern Munich
  🔍 Found 3 potential matches
  🎯 Best match: FC Bayern München (76.2% confidence)
  ⚠️  Medium confidence - requires manual review

...

📊 Enrichment Summary
====================
Total partners processed: 12
✅ Successfully enriched: 8
⏭️  Skipped (already enriched): 0
❌ No matches found: 2
⚠️  Requires manual review: 2
🔴 Errors: 0


⚠️  Partners Requiring Manual Review
===================================

🤝 Bayern Munich
   Suggested matches:
   1. FC Bayern München (Spanish La Liga) - 76.2% match
   2. Bayern Munich (German Bundesliga) - 74.8% match
   3. Bayern 04 Leverkusen (German Bundesliga) - 45.1% match

💡 Use the Admin UI to manually link these partners.

✅ Enrichment complete!

🔌 Disconnected from MongoDB
```

## Best Practices

### 1. **Always Start with Dry Run**
```bash
node scripts/enrich-partners-sportsdb.js --dry-run
```
Review the output before making live changes.

### 2. **Test with Filters First**
```bash
node scripts/enrich-partners-sportsdb.js --dry-run --filter="Barcelona"
```
Validate the algorithm on a known partner.

### 3. **Manual Review for Medium Confidence**
- Don't blindly lower the confidence threshold
- Use the Admin UI to manually link medium-confidence partners
- This ensures data quality

### 4. **Periodic Re-sync**
```bash
node scripts/enrich-partners-sportsdb.js --force
```
Run quarterly to update capacity and league changes.

### 5. **Backup Database Before Live Run**
```bash
# MongoDB Atlas: Use automated backups or create on-demand snapshot
# Or export partners collection:
mongoexport --uri="$MONGODB_URI" --collection=partners --out=partners-backup.json
```

## Troubleshooting

### Error: "MONGODB_URI environment variable is required"

**Solution**: Set environment variables before running:
```bash
export MONGODB_URI="mongodb+srv://..."
node scripts/enrich-partners-sportsdb.js --dry-run
```

Or use `.env` file with `dotenv`:
```bash
npx dotenv -e .env node scripts/enrich-partners-sportsdb.js --dry-run
```

### Error: "API error (attempt 3/3)"

**Solution**: TheSportsDB API is unreachable or rate-limited.
- Wait 5-10 minutes before retrying
- Check API status: https://www.thesportsdb.com/
- Verify `SPORTSDB_API_KEY` is set (default: "3" for free tier)

### Low Match Rates

**Solution**: Partners may not be sports organizations.
- Use `--filter` to target only sports clubs
- Manual linking via Admin UI for non-standard names
- Add team name variations to partner hashtags for future reference

### Node.js Fetch Not Available

**Solution**: Upgrade to Node.js 18+ or install polyfill:
```bash
npm install node-fetch
```

Then modify script to import:
```javascript
const fetch = require('node-fetch');
```

## Integration with Admin UI

After running the bulk enrichment script:

1. **Review Manual Matches**
   - Navigate to `/admin/partners`
   - Edit partners flagged for manual review
   - Use the "Link to TheSportsDB" section to search and link

2. **Verify Auto-Linked Partners**
   - Check partner edit modals for enriched data
   - Verify stadium capacities and league names
   - Use "Re-sync" button if data seems outdated

3. **Monitor Chart System**
   - New enriched data will be available for chart calculations
   - Capacity-based benchmarks will use `venueCapacity` field
   - Team badges can be displayed in future UI enhancements

## Performance Considerations

- **Processing Time**: ~2 seconds per partner (API rate limiting)
- **12 partners**: ~24 seconds
- **100 partners**: ~3.5 minutes
- **1000 partners**: ~35 minutes

For large databases, consider:
- Running during off-peak hours
- Using `--filter` to batch by league/country
- Monitoring MongoDB connection timeout settings

## Script Maintenance

### Adjusting Confidence Thresholds

Edit these constants in the script:
```javascript
const HIGH_CONFIDENCE_THRESHOLD = 0.9;  // Currently 90%
const MEDIUM_CONFIDENCE_THRESHOLD = 0.7; // Currently 70%
```

**Recommendation**: Keep thresholds conservative to ensure data quality.

### Adding Team Name Aliases

Extend the `stringSimilarity` function's `cleanStr` helper:
```javascript
const cleanStr = (str) => str
  .replace(/\b(fc|club|cf|cd|sc|united|utd|real|sporting)\b/gi, '')
  .replace(/\s+/g, ' ')
  .trim();
```

## Security Notes

- ✅ Uses read-only TheSportsDB API (no API key security concerns)
- ✅ MongoDB connection via secure connection string
- ✅ No secrets logged to console
- ✅ Dry-run mode prevents accidental data modification

## Future Enhancements

Potential improvements for future versions:

1. **Fuzzy Matching Improvements**
   - Phonetic matching (Soundex, Metaphone)
   - Multi-language team name support
   - Country/league context scoring

2. **Bulk Operations**
   - Parallel API calls (with rate limit pooling)
   - Batch MongoDB updates
   - Progress persistence (resume interrupted runs)

3. **Interactive Mode**
   - CLI prompts for medium-confidence matches
   - Real-time approval/rejection
   - Save decisions for future runs

4. **Reporting**
   - JSON output for CI/CD integration
   - Email notifications for manual review list
   - Slack/Discord webhooks

---

**Version**: 6.10.2  
**Last Updated**: 2025-01-16T16:30:00.000Z  
**Status**: Production-Ready
