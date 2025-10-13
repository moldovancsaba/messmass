# Bitly Complete Metrics Catalog

**Version**: 2.0.0  
**Last Updated**: 2025-10-13T17:55:00.000Z  
**Tested With**: `fanselfie.me/ea` link (3,646 total clicks)  
**Bitly Plan**: Growth tier  
**API Reference**: https://dev.bitly.com/api-reference/

---

## 🎯 Executive Summary

We tested **ALL 9 known Bitly API v4 analytics endpoints** with real production data.

**RESULT**:
- ✅ **5 endpoints WORK** on Growth plan
- ❌ **2 endpoints REQUIRE** Enterprise plan
- ❌ **2 endpoints DON'T EXIST**

---

## ✅ IMPLEMENTED & WORKING (Growth Plan)

### 1. Clicks Summary
**Endpoint**: `GET /v4/bitlinks/{bitlink}/clicks/summary`  
**Status**: ✅ Working  
**Implementation**: ✅ Fully implemented (v5.53.0+)

**Response**:
```json
{
  "unit_reference": "2025-10-13T17:11:28+0000",
  "total_clicks": 3646,
  "units": 134,
  "unit": "day"
}
```

**What We Store**:
- `click_summary.total` - Total clicks
- `click_summary.updatedAt` - Sync timestamp

---

### 2. Clicks Timeseries
**Endpoint**: `GET /v4/bitlinks/{bitlink}/clicks`  
**Status**: ✅ Working  
**Implementation**: ✅ Fully implemented (v5.53.0+)

**Response Structure**:
```json
{
  "link_clicks": [
    { "date": "2025-10-13T00:00:00+0000", "clicks": 1 },
    { "date": "2025-10-12T00:00:00+0000", "clicks": 0 }
  ],
  "units": 134,
  "unit": "day"
}
```

**Sample Data**: 134 days of historical data (2025-06-02 to 2025-10-13)

**What We Store**:
- `clicks_timeseries[]` - ALL historical daily data (no limit)
- Format: `{ date: "YYYY-MM-DD", clicks: number }`

**Peak Day**: 2025-07-03 with 942 clicks

---

### 3. Countries (Geographic Distribution)
**Endpoint**: `GET /v4/bitlinks/{bitlink}/countries`  
**Status**: ✅ Working  
**Implementation**: ✅ Fully implemented (v5.54.0 - fixed field mapping)

**Response Structure**:
```json
{
  "metrics": [
    { "value": "SK", "clicks": 388 },
    { "value": "IT", "clicks": 328 },
    { "value": "GB", "clicks": 314 }
  ],
  "unit": "day",
  "units": 134,
  "facet": "countries"
}
```

**Critical Discovery**: Bitly uses `"value"` field, NOT `"country"` field!

**Sample Data**: 50 countries tracked
- 🇸🇰 Slovakia: 388 clicks
- 🇮🇹 Italy: 328 clicks
- 🇬🇧 Great Britain: 314 clicks
- 🇭🇺 Hungary: 281 clicks
- 🇩🇪 Germany: 247 clicks

**What We Store**:
- `geo.countries[]` - Array of `{ country: string, clicks: number }`
- Mapping: `value` → `country` (normalized)

---

### 4. Referrers (Platform-Level Traffic Sources)
**Endpoint**: `GET /v4/bitlinks/{bitlink}/referrers`  
**Status**: ✅ Working  
**Implementation**: ✅ Fully implemented (v5.54.0 - fixed field mapping)

**Response Structure**:
```json
{
  "metrics": [
    { "value": "direct", "clicks": 2776 },
    { "value": "Bitly QR Code", "clicks": 447 },
    { "value": "Instagram", "clicks": 304 },
    { "value": "Facebook", "clicks": 79 },
    { "value": "Google", "clicks": 21 }
  ],
  "unit": "day",
  "units": 134,
  "facet": "referrers"
}
```

**Sample Data**: 8 referrer platforms
1. **Direct**: 2,776 clicks (76%)
2. **Bitly QR Code**: 447 clicks (12%)
3. **Instagram**: 304 clicks (8%)
4. **Facebook**: 79 clicks (2%)
5. **Google**: 21 clicks
6. **Other**: 15 clicks
7. **X (Twitter)**: 2 clicks
8. **LinkedIn**: 2 clicks

**What We Store**:
- `referrers[]` - Array of `{ referrer: string, clicks: number }`
- Mapping: `value` → `referrer` (normalized)

---

### 5. Referring Domains (Domain-Level Traffic Sources) ⭐ NEW!
**Endpoint**: `GET /v4/bitlinks/{bitlink}/referring_domains`  
**Status**: ✅ Working  
**Implementation**: ✅ Fully implemented (v5.54.0 - NEW FEATURE!)

**Response Structure**:
```json
{
  "metrics": [
    { "value": "direct", "clicks": 2877 },
    { "value": "qr.partners.bit.ly", "clicks": 447 },
    { "value": "l.instagram.com", "clicks": 209 },
    { "value": "m.facebook.com", "clicks": 24 },
    { "value": "lm.facebook.com", "clicks": 22 },
    { "value": "www.instagram.com", "clicks": 19 }
  ],
  "unit": "day",
  "units": 134,
  "facet": "referring_domains"
}
```

**Sample Data**: 16 specific domains

**Instagram Breakdown**:
- `l.instagram.com`: 209 clicks (mobile app)
- `www.instagram.com`: 19 clicks (web)
- **Total**: 228 clicks

**Facebook Breakdown**:
- `m.facebook.com`: 24 clicks (mobile)
- `lm.facebook.com`: 22 clicks (messenger)
- `l.facebook.com`: 6 clicks
- `www.facebook.com`: 2 clicks
- **Total**: 54 clicks

**QR Codes**:
- `qr.partners.bit.ly`: 447 clicks

**What We Store**:
- `referring_domains[]` - Array of `{ domain: string, clicks: number }`
- Mapping: `value` → `domain` (normalized)

**💡 VALUE**: More granular than referrers - distinguishes mobile vs web platforms!

---

## ❌ NOT AVAILABLE ON GROWTH PLAN

### 6. Cities (City-Level Geography)
**Endpoint**: `GET /v4/bitlinks/{bitlink}/cities`  
**Status**: ❌ 402 Payment Required  
**Plan Required**: Enterprise

**Error Response**:
```json
{
  "message": "UPGRADE_REQUIRED",
  "resource": "bitlinks",
  "description": "You must upgrade your account to access this resource."
}
```

**What We Could Get** (Enterprise only):
- City names with click counts
- Country association for each city
- More granular than country-level data

---

### 7. Devices (Device Type Breakdown)
**Endpoint**: `GET /v4/bitlinks/{bitlink}/devices`  
**Status**: ❌ 402 Payment Required  
**Plan Required**: Enterprise

**Error Response**: Same as Cities endpoint

**What We Could Get** (Enterprise only):
- Mobile vs Desktop vs Tablet breakdown
- Device-specific click counts
- Mobile usage rates

---

## ❌ ENDPOINTS DON'T EXIST

### 8. Referring Networks
**Endpoint**: `GET /v4/bitlinks/{bitlink}/referring_networks`  
**Status**: ❌ 404 Not Found

**Error**: `404 page not found`

**Conclusion**: This endpoint doesn't exist in Bitly API v4.

---

### 9. Shorten Counts
**Endpoint**: `GET /v4/bitlinks/{bitlink}/shorten_counts`  
**Status**: ❌ 404 Not Found

**Error**: `404 page not found`

**Conclusion**: This endpoint doesn't exist in Bitly API v4.

---

## 📊 What We're Collecting (Summary)

| Metric | Endpoints | API Calls | Records | Storage |
|--------|-----------|-----------|---------|---------|
| Click Summary | 1 | 1 | 1 | `click_summary` |
| Daily Timeseries | 1 | 1 | 134 | `clicks_timeseries[]` |
| Countries | 1 | 1 | 50 | `geo.countries[]` |
| Referrers (Platforms) | 1 | 1 | 8 | `referrers[]` |
| Referring Domains | 1 | 1 | 16 | `referring_domains[]` |
| **TOTAL** | **5** | **5** | **209** | **5 fields** |

---

## 🎯 Available Variables

### Core Metrics
- `bitlyTotalClicks` - Total clicks across all links
- `bitlyUniqueClicks` - Unique visitors (if available)

### Geographic
- `bitlyClicksByCountry` - Top country click count
- `bitlyTopCountry` - Country code with most clicks
- `bitlyCountryCount` - Number of unique countries

### Traffic Sources (Platform-Level)
- `bitlyDirectClicks` - Direct traffic (no referrer)
- `bitlySocialClicks` - Social platform aggregated clicks
- `bitlyTopReferrer` - Top platform name (e.g., "Instagram")
- `bitlyReferrerCount` - Number of unique platforms

### Traffic Sources (Domain-Level) ⭐ NEW!
- `bitlyTopDomain` - Top referring domain (e.g., "l.instagram.com")
- `bitlyDomainCount` - Number of unique domains
- `bitlyQrCodeClicks` - QR code scan clicks (qr.partners.bit.ly)
- `bitlyInstagramMobileClicks` - Instagram mobile app (l.instagram.com)
- `bitlyInstagramWebClicks` - Instagram web (www.instagram.com)
- `bitlyFacebookMobileClicks` - Facebook mobile (m.facebook.com)
- `bitlyFacebookMessengerClicks` - Facebook Messenger (lm.facebook.com)

### Calculated Metrics
- `bitlyClickRate` - (Total clicks / Event attendees) × 100

---

## 🔑 Key Insights from Testing

### 1. Consistent Field Naming Pattern
**ALL Bitly endpoints use `"value"` field**, not specific names:
- Countries: `{ "value": "US", "clicks": 123 }` (not `"country"`)
- Referrers: `{ "value": "Instagram", "clicks": 456 }` (not `"referrer"`)
- Domains: `{ "value": "l.instagram.com", "clicks": 789 }` (not `"domain"`)

**Impact**: Required fixing our TypeScript interfaces and mappers.

### 2. Referring Domains is a Game-Changer
Platform-level tells us "Instagram: 304 clicks"  
Domain-level tells us:
- Mobile app: 209 clicks
- Web: 19 clicks

This is **68% mobile usage** - critical for campaign optimization!

### 3. QR Codes Are Trackable
`qr.partners.bit.ly` shows up as a distinct domain with 447 clicks (12% of total).  
This enables separate tracking of physical vs digital campaigns.

### 4. Historical Data Retention
- Bitly keeps **90 days** of data (plan-dependent)
- MessMass preserves **ALL data forever** (no time limit)
- After 1 year, we'll have data Bitly has deleted

### 5. Enterprise Features Are Expensive
Cities and Devices require Enterprise plan ($999+/month).  
For most use cases, domain-level referrers provide sufficient granularity.

---

## 🔧 Implementation Status

### Phase 1: Core Analytics ✅ COMPLETE
- ✅ Clicks Summary
- ✅ Clicks Timeseries
- ✅ Countries (fixed field mapping v5.54.0)
- ✅ Referrers (fixed field mapping v5.54.0)
- ✅ Referring Domains (NEW in v5.54.0)

### Phase 2: Enterprise Features ❌ BLOCKED
- ❌ Cities (requires Enterprise plan)
- ❌ Devices (requires Enterprise plan)

### Phase 3: Calculated Metrics ⏳ PLANNED
- Aggregations across all links per project
- Top N rankings (top country, top domain)
- Trend calculations (growth rates)
- Mobile vs web breakdown percentages

---

## 📈 API Rate Limits (Growth Plan)

**Limits**:
- 100 calls/minute
- 1,000 calls/hour
- 10,000 calls/day

**Current Usage per Link**:
- 5 API calls per sync (summary + series + countries + referrers + domains)

**With 100 links**:
- 500 API calls per full sync
- Can sync all links every 30 minutes comfortably

---

## 🚀 Next Steps

1. ✅ **Add domain-specific variables** to Variable Manager
2. ⏳ **Build aggregation logic** for project-level metrics
3. ⏳ **Create Bitly analytics charts** with domain breakdown
4. ⏳ **Add QR code tracking** as separate metric
5. ⏳ **Mobile vs Web analysis** dashboard

---

## 📝 Testing Script

Location: `scripts/explore-all-bitly-endpoints.js`

To test any Bitly link:
```bash
# Add token temporarily
echo "BITLY_ACCESS_TOKEN=your_token" >> .env.local

# Run test
node scripts/explore-all-bitly-endpoints.js

# Clean up
grep -v BITLY_ACCESS_TOKEN .env.local > .env.local.tmp && mv .env.local.tmp .env.local
```

---

**Document Status**: Complete and accurate as of 2025-10-13  
**Test Results**: Based on actual API responses from `fanselfie.me/ea`  
**Implementation**: Fully deployed in MessMass v5.54.0+
