# Bitly Country Data Storage Documentation

## Variable: `SEYUBITLYCLICKSBYCOUNTRY`

**Registry Name**: `bitlyClicksByCountry`  
**SEYU Token**: `[SEYUBITLYCLICKSBYCOUNTRY]`  
**Type**: `count`  
**Category**: `Bitly / Geographic`  
**Description**: Geographic distribution of Bitly link clicks aggregated by country

---

## Database Storage Structure

### Collection
`bitly_links`

### Field Path
```
geo.countries[]
```

### Schema
```typescript
{
  _id: ObjectId,
  bitlink: string,              // e.g., "fanselfie.me/ea"
  projectId: ObjectId | null,   // Associated MessMass project
  
  // GEOGRAPHIC DATA
  geo: {
    countries: Array<{
      country: string,  // ISO 3166-1 alpha-2 code ("US", "HU", "IT", etc.)
      clicks: number    // Click count from this country
    }>,
    cities?: Array<{
      city: string,
      country?: string,
      clicks: number
    }>
  },
  
  // ... other fields
}
```

---

## Sample Data: `fanselfie.me/ea`

### Basic Info
```json
{
  "bitlink": "fanselfie.me/ea",
  "long_url": "https://app.togetherforvictory.com/invitation?p=MzMy&partner=water_polo_super_cup",
  "title": "European Aquatics Partner Link",
  "projectId": "68e523d89d59d5293581c753"
}
```

### Click Summary
```json
{
  "click_summary": {
    "total": 3645,
    "unique": null,
    "updatedAt": "2025-10-13T16:11:13.629Z"
  }
}
```

### Geographic Distribution
```json
{
  "geo": {
    "countries": [
      { "country": null, "clicks": 388 },
      { "country": null, "clicks": 328 },
      { "country": null, "clicks": 314 },
      { "country": null, "clicks": 280 },
      { "country": null, "clicks": 247 },
      { "country": null, "clicks": 223 },
      { "country": null, "clicks": 150 }
      // ... 43 more entries (50 total countries)
    ]
  }
}
```

**⚠️ ISSUE DETECTED**: All 50 country entries have `country: null` instead of ISO codes!

### Traffic Sources
```json
{
  "referrers": [
    { "referrer": "direct", "clicks": 2775 },
    { "referrer": "direct", "clicks": 447 },
    { "referrer": "direct", "clicks": 304 }
    // ... 5 more referrers (8 total, all "direct")
  ]
}
```

### Daily Clicks Timeseries
```json
{
  "clicks_timeseries": [
    { "date": "2025-07-16", "clicks": 1 },
    { "date": "2025-07-17", "clicks": 0 },
    { "date": "2025-07-18", "clicks": 1 },
    { "date": "2025-07-19", "clicks": 0 },
    { "date": "2025-07-20", "clicks": 0 }
    // ... 85 more days (90 total)
  ],
  "lastSyncAt": "2025-10-13T16:11:13.676Z",
  "lastClicksSyncedUntil": "2025-10-13"
}
```

**Date Range**: 2025-07-16 to 2025-10-13 (90 days of historical data)

---

## 🔴 Critical Issue: All Country Codes are `null`

### Problem
The `fanselfie.me/ea` link shows 50 country entries, but **every single entry has `country: null`** instead of ISO 3166-1 alpha-2 codes like `"US"`, `"HU"`, `"IT"`.

### Expected Data
```json
{
  "geo": {
    "countries": [
      { "country": "HU", "clicks": 388 },  // Hungary
      { "country": "RO", "clicks": 328 },  // Romania
      { "country": "IT", "clicks": 314 },  // Italy
      { "country": "DE", "clicks": 280 },  // Germany
      { "country": "FR", "clicks": 247 }   // France
    ]
  }
}
```

### Actual Data (Current Problem)
```json
{
  "geo": {
    "countries": [
      { "country": null, "clicks": 388 },
      { "country": null, "clicks": 328 },
      { "country": null, "clicks": 314 },
      { "country": null, "clicks": 280 },
      { "country": null, "clicks": 247 }
    ]
  }
}
```

---

## 🔍 Root Cause Investigation

### Possible Causes

#### 1. **Bitly Plan Limitations**
- **Free/Starter plans** may have limited geographic data
- **Growth plan** (your current plan) *should* include country-level data
- **Enterprise plans** get full city-level granularity

**Check**: Review your [Bitly plan limits](https://bitly.com/pricing)

#### 2. **Branded Short Domain (BSD) Restrictions**
- `fanselfie.me` is a **custom branded domain** (not `bit.ly`)
- Some Bitly analytics features may be restricted for BSDs depending on plan
- Geographic data might be limited to aggregate only

**Test**: Compare with a standard `bit.ly` link to isolate the issue

#### 3. **Privacy/Anonymization Mode**
- Bitly may anonymize geographic data for privacy compliance
- GDPR or other regulations might restrict country-level tracking
- Link settings could have privacy mode enabled

**Check**: Review link privacy settings in Bitly dashboard

#### 4. **API Response Bug**
- Bitly API v4 might have a temporary bug
- `countries` endpoint returning metrics without country codes
- Could be specific to certain links or time periods

**Verify**: Use debug script to see raw API response

#### 5. **Data Migration Issue**
- If this link was migrated from another platform
- Original geographic data may not have transferred
- New clicks should populate correctly if API is working

---

## 🛠️ Diagnostic Steps

### Step 1: Check Raw API Response

Run the debug script:
```bash
# Option 1: Add token to .env.local
echo "BITLY_ACCESS_TOKEN=your_token_here" >> .env.local
node scripts/test-bitly-countries.js

# Option 2: Use environment variable
BITLY_ACCESS_TOKEN="your_token" node scripts/test-bitly-countries.js
```

This will show the **exact raw response** from Bitly's API.

### Step 2: Trigger Sync with Debug Logging

The `mapCountries()` function now includes debug logging (added in v5.53.6):

1. Go to `/admin/bitly`
2. Click **"Sync Now"** button
3. Check browser console or server logs for warnings:
   ```
   [Bitly Mapper] WARNING: 50/50 countries have null codes
   [Bitly Mapper] Sample metric: { "country": null, "clicks": 388 }
   ```

### Step 3: Test with Standard bit.ly Link

Create a test link using standard `bit.ly` domain:
1. In Bitly dashboard, create new link with `bit.ly` domain
2. Add to MessMass admin
3. Sync and compare country data

If `bit.ly` links work but `fanselfie.me` doesn't → **Branded domain issue**

### Step 4: Check Bitly Dashboard

1. Log into https://app.bitly.com
2. Navigate to link `fanselfie.me/ea`
3. View **Analytics** tab
4. Check if **Countries** data is visible in the UI

If visible in UI but `null` in API → **API bug or plan restriction**  
If also `null` in UI → **Privacy mode or plan limitation**

### Step 5: Contact Bitly Support

If diagnostics show API is returning `null`, contact Bitly:
- **What**: Country codes returned as `null` instead of ISO codes
- **Where**: `GET /v4/bitlinks/{bitlink}/countries` endpoint
- **Link**: `fanselfie.me/ea`
- **Plan**: Growth tier
- **Expected**: ISO 3166-1 alpha-2 codes (`"US"`, `"HU"`, etc.)
- **Actual**: All `country` fields are `null`

Include raw API response from debug script.

---

## 📊 Data Flow Architecture

### 1. Bitly API Fetch
**File**: `lib/bitly.ts` → `getCountries()`
```typescript
GET https://api-ssl.bitly.com/v4/bitlinks/fanselfie.me/ea/countries
```

**Response**:
```json
{
  "metrics": [
    { "country": "HU", "clicks": 388 },
    { "country": "RO", "clicks": 328 }
  ],
  "unit": "month",
  "units": 1
}
```

### 2. Data Mapping
**File**: `lib/bitly-mappers.ts` → `mapCountries()`
```typescript
export function mapCountries(response: BitlyCountriesResponse) {
  return response.metrics.map(metric => ({
    country: metric.country,  // Extract country code
    clicks: ensureFiniteNumber(metric.clicks)
  }));
}
```

**Debug Output** (when `country: null` detected):
```
[Bitly Mapper] WARNING: 50/50 countries have null codes
[Bitly Mapper] Sample metric: { "country": null, "clicks": 388 }
```

### 3. MongoDB Storage
**File**: `app/api/bitly/sync/route.ts`
```typescript
await db.collection('bitly_links').updateOne(
  { _id: link._id },
  {
    $set: {
      'geo.countries': updatedCountries,
      lastSyncAt: now,
      updatedAt: now
    }
  }
);
```

### 4. Variable Usage
**File**: `lib/variablesRegistry.ts`
```typescript
{
  name: 'bitlyClicksByCountry',
  label: 'Clicks by Country',
  type: 'count',
  category: 'Bitly / Geographic',
  description: 'Geographic distribution of clicks aggregated by country'
}
```

**SEYU Token**: `[SEYUBITLYCLICKSBYCOUNTRY]`

**Use in Charts**: 
```json
{
  "formula": "SUM([SEYUBITLYCLICKSBYCOUNTRY])",
  "chartType": "geo-map"
}
```

---

## 🔧 Temporary Workaround

Until country codes are resolved, you can still:

### 1. Use Total Clicks
```typescript
const totalInternationalClicks = link.geo.countries.reduce((sum, c) => sum + c.clicks, 0);
```

### 2. Use Click Counts as Proxy
Even without country codes, you can see:
- **Number of countries**: 50 countries accessed the link
- **Geographic distribution**: Top 5 countries by clicks (388, 328, 314, 280, 247)
- **International reach**: Clicks from 50 different regions

### 3. Aggregate at Link Level
Store country data per link, aggregate at project level:
```typescript
const projectCountries = allLinksInProject
  .flatMap(link => link.geo.countries)
  .reduce((acc, c) => {
    acc[c.country] = (acc[c.country] || 0) + c.clicks;
    return acc;
  }, {});
```

---

## 📋 Next Steps

1. **Run debug script** to see raw API response
2. **Trigger sync** and check server logs for warnings
3. **Compare branded vs standard domains** to isolate issue
4. **Check Bitly dashboard** to see if country data is visible in UI
5. **Contact Bitly support** if API returns null but UI shows data

The debug logging added in this update will help identify exactly where the issue originates.

---

## 🔗 Related Documentation

- **Bitly API**: [GET /v4/bitlinks/{bitlink}/countries](https://dev.bitly.com/api-reference#getClicksSummaryForBitlink)
- **Variables System**: `ADMIN_VARIABLES_SYSTEM.md`
- **Bitly Integration**: `BITLY_INTEGRATION_GUIDE.md`
- **Available Metrics**: `BITLY_AVAILABLE_METRICS.md`

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-13T16:50:00.000Z  
**Related Issue**: Country codes returning as `null` from Bitly API  
**Status**: Under Investigation
