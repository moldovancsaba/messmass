# Country Charts Setup - Complete Guide

## Current Status

✅ **Charts Configured**
- `bitly-top-countries` (Bar chart - Top 5 countries)
- `bitly-top-country` (KPI - #1 country name)  
- `bitly-countries-reached` (KPI - Total countries count)

✅ **Charts in Data Blocks**
- All 3 charts are in the "Overview" block (positions 15, 16, 17)

✅ **Variables Defined**
- 13 Bitly country variables registered in `variables_metadata`

✅ **Partners Have Bitly Links**
- 19 partners have Bitly links assigned

✅ **Projects Connected to Partners**
- Fixed! 7/10 projects now have Bitly links associated via junction table

❌ **Bitly Analytics Not Cached**
- Bitly links don't have `cachedMetrics.topCountries` data yet
- Need to run Bitly sync to fetch analytics from Bitly API

---

## What Was Fixed

### 1. Partner-Event Connections (✅ DONE)

**Script**: `scripts/fix-partner-event-connections.ts`

**What it did**:
- Found 10 projects with partner references
- Associated Partner 1's Bitly links with 7 projects
- Created entries in `bitly_link_project_junction` table

**Results**:
```
✅ Újpest FC x Ferencvárosi TC - 3 Bitly links
✅ MTK x Nyíregyháza FC - 2 Bitly links
✅ European Karate Championships - 9 Bitly links
✅ CS Dinamo București x Industria Kielce - 1 Bitly link
✅ One Veszprém HC x Füchse Berlin - 1 Bitly link
✅ Orlen Wisla Plock x Barça - 1 Bitly link
✅ DVTK x Paksi FC - 5 Bitly links
```

---

## What Still Needs to Be Done

### 2. Fetch Bitly Analytics (❌ TODO)

The Bitly links need to fetch their analytics data from the Bitly API.

**Option A: Via Admin UI** (Recommended)
1. Go to `/admin/bitly` or `/admin/partners`
2. Find the Bitly sync button
3. Click "Sync Bitly Analytics"
4. Wait for analytics to be fetched

**Option B: Via API Call**
```bash
curl -X POST http://localhost:3000/api/bitly/sync \
  -H "Content-Type: application/json"
```

**Option C: Via Script** (if sync API exists)
```bash
# Check if this file exists:
# scripts/sync-bitly-analytics.ts or similar
```

**What this does**:
- Fetches click data from Bitly API for each link
- Populates `cachedMetrics.topCountries` with country data
- Example data structure:
  ```json
  {
    "cachedMetrics": {
      "topCountries": [
        { "country": "United States", "clicks": 1523 },
        { "country": "Hungary", "clicks": 892 },
        { "country": "Germany", "clicks": 456 }
      ]
    }
  }
  ```

### 3. Re-run Enrichment (❌ TODO)

After Bitly analytics are cached, re-run the enrichment:

```bash
npx ts-node scripts/fix-partner-event-connections.ts
```

This will:
- Read the now-populated `cachedMetrics.topCountries` from Bitly links
- Aggregate country data across all links per project
- Write to `project.stats.bitlyCountry1`, `bitlyCountry1Clicks`, etc.

---

## How Quick Add Will Work Going Forward

The Quick Add Partner Event creation already has the correct logic (as of the initial fix):

**File**: `app/api/projects/route.ts` (lines 550-586)

```typescript
// WHAT: Auto-associate Partner 1's Bitly links with new project
// WHY: Quick Add shows partner Bitly links in preview, must connect them automatically
if (partner1Id && ObjectId.isValid(partner1Id)) {
  const partner = await partnersCollection.findOne({ _id: new ObjectId(partner1Id) });
  
  if (partner && partner.bitlyLinkIds && Array.isArray(partner.bitlyLinkIds)) {
    // Create junction table entries for each Bitly link
    for (const bitlyLinkId of partner.bitlyLinkIds) {
      await createLinkAssociation({
        bitlyLinkId: new ObjectId(bitlyLinkId),
        projectId: result.insertedId,
        autoCalculated: true
      });
    }
  }
}
```

**This means**:
- ✅ New events created via Quick Add will automatically have Partner 1's Bitly links associated
- ✅ Junction table entries are created automatically
- ⚠️ Still need Bitly analytics to be synced for country charts to show data

---

## Verification Checklist

To verify country charts are working:

1. **Check Bitly Links Have Analytics**:
   ```bash
   npx ts-node scripts/check-bitly-country-data.ts
   ```
   - Should show `bitlyCountry1: United States` (not MISSING)
   - Should show `bitlyCountry1Clicks: 1523` (not MISSING)

2. **Check Project Has Bitly Links**:
   - Should show `🔗 Bitly Links Associated: 3` (or more)

3. **View Stats Page**:
   - Go to `/stats/{viewSlug}`
   - Scroll to charts section
   - Should see "Top Countries" bar chart with 5 countries
   - Should see "Top Country" KPI with country name
   - Should see "Countries Reached" KPI with count

---

## Troubleshooting

### Charts Still Not Showing

**Problem**: Country charts don't appear on stats page

**Check**:
1. Are charts in data blocks? ✅ (they are)
2. Does project have Bitly links? Run check script
3. Do Bitly links have analytics? Check `cachedMetrics.topCountries`
4. Does project have country data? Check `project.stats.bitlyCountry1`

**Common Issues**:
- **No Bitly links associated**: Run `fix-partner-event-connections.ts`
- **No analytics cached**: Run Bitly sync via admin or API
- **No enrichment**: Re-run fix script after sync

### Charts Show "No Data"

**Problem**: Charts appear but show "No data available"

**Reason**: `hasValidData()` returns false when:
- All country click values are 0
- Country names are empty/null
- `bitlyCountryCount` is 0

**Solution**: Ensure Bitly analytics have been fetched and are recent

---

## Summary

**Current State**:
- ✅ All infrastructure is in place
- ✅ Partner-event connections are fixed
- ❌ Need to sync Bitly analytics

**Next Steps**:
1. Run Bitly sync (via admin UI or API)
2. Re-run enrichment script
3. View stats pages to see country charts

**For New Events**:
- Quick Add automatically handles everything
- Just need Bitly analytics to be synced periodically (daily/weekly)
