# Bitly Available Metrics & Data Points

**Last Updated**: 2025-10-13T16:20:00.000Z  
**Version**: 5.53.3  
**API Reference**: https://dev.bitly.com/api-reference/

---

## 📊 Currently Collected Metrics

These metrics are **already being collected** by MessMass from Bitly:

### 1. Click Summary
- **`total_clicks`** - Total number of clicks (all-time or within timeframe)
- **Source**: `GET /v4/bitlinks/{bitlink}/clicks/summary`

### 2. Click Timeseries (90 days)
- **Daily click counts** for trend visualization
- **Date range**: Last 90 days
- **Source**: `GET /v4/bitlinks/{bitlink}/clicks`

### 3. Geographic Data - Countries
- **Country-level click distribution**
- **Format**: ISO 3166-1 alpha-2 country codes (US, HU, etc.)
- **Data**: Click count per country
- **Source**: `GET /v4/bitlinks/{bitlink}/countries`

### 4. Traffic Sources - Referrers
- **Referrer domains** (facebook.com, twitter.com, etc.)
- **Direct traffic** (no referrer)
- **Data**: Click count per referrer
- **Source**: `GET /v4/bitlinks/{bitlink}/referrers`

### 5. Link Metadata
- **Bitlink ID** (e.g., bit.ly/abc123)
- **Long URL** (original destination)
- **Title** (custom or auto-generated)
- **Created date** (ISO 8601 timestamp)
- **Tags** (user-defined labels)
- **Custom branded links** (if applicable)
- **Archived status**
- **Source**: `GET /v4/bitlinks/{bitlink}`

---

## ✨ Additional Available Metrics (Not Yet Collected)

These are **available in the Bitly API** but not currently being pulled by MessMass:

### 6. City-Level Geography ⭐ NEW
- **Endpoint**: `GET /v4/bitlinks/{bitlink}/cities`
- **Data**: City name, country, click count
- **Use Case**: More granular geographic analytics than country-level
- **Note**: May be limited by Bitly plan tier

### 7. Referring Domains (Detailed) ⭐ NEW
- **Endpoint**: `GET /v4/bitlinks/{bitlink}/referring_domains`
- **Data**: Full domain breakdown with counts
- **Use Case**: More detailed than basic referrers

### 8. Devices & Platforms ⭐ NEW
- **Endpoint**: `GET /v4/bitlinks/{bitlink}/devices`
- **Data**: Device type breakdown (desktop, mobile, tablet)
- **Use Case**: Understand how users access your links
- **Example Data**:
  ```json
  {
    "metrics": [
      { "device": "desktop", "clicks": 450 },
      { "device": "mobile", "clicks": 1200 },
      { "device": "tablet", "clicks": 80 }
    ]
  }
  ```

### 9. Browsers ⭐ NEW  
- **Endpoint**: `GET /v4/bitlinks/{bitlink}/browsers`
- **Data**: Browser breakdown (Chrome, Safari, Firefox, etc.)
- **Use Case**: Browser compatibility insights
- **Example Data**:
  ```json
  {
    "metrics": [
      { "browser": "Chrome", "clicks": 850 },
      { "browser": "Safari", "clicks": 420 },
      { "browser": "Firefox", "clicks": 180 }
    ]
  }
  ```

### 10. Operating Systems ⭐ NEW
- **Endpoint**: `GET /v4/bitlinks/{bitlink}/os`
- **Data**: OS breakdown (Windows, macOS, iOS, Android, Linux)
- **Use Case**: Platform-specific campaign insights
- **Example Data**:
  ```json
  {
    "metrics": [
      { "os": "iOS", "clicks": 680 },
      { "os": "Android", "clicks": 520 },
      { "os": "Windows", "clicks": 340 },
      { "os": "macOS", "clicks": 210 }
    ]
  }
  ```

---

## 🎯 Recommended Variables for MessMass

Based on available Bitly data, here are the variables to add to the **Variable Manager** in a **"Bitly"** group:

### Core Click Metrics
| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `visitShortUrl` | Short URL Visits | number | Total clicks on Bitly short links (already exists) |
| `bitlyTotalClicks` | Total Bitly Clicks | number | Sum of all Bitly link clicks for event |
| `bitlyUniqueClicks` | Unique Bitly Clicks | number | Unique visitors (if available from API) |

### Geographic Metrics
| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `bitlyClicksByCountry` | Clicks by Country | number | Top country click count |
| `bitlyTopCountry` | Top Country | text | Country with most clicks |
| `bitlyCountryCount` | Countries Reached | number | Number of unique countries |

### Traffic Source Metrics
| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `bitlyDirectClicks` | Direct Clicks | number | Clicks with no referrer |
| `bitlySocialClicks` | Social Media Clicks | number | Clicks from social platforms |
| `bitlyTopReferrer` | Top Referrer | text | Domain with most clicks |
| `bitlyReferrerCount` | Referrer Count | number | Number of unique referrers |

### Device & Platform Metrics ⭐ NEW DATA
| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `bitlyMobileClicks` | Mobile Clicks | number | Clicks from mobile devices |
| `bitlyDesktopClicks` | Desktop Clicks | number | Clicks from desktop computers |
| `bitlyTabletClicks` | Tablet Clicks | number | Clicks from tablets |
| `bitlyiOSClicks` | iOS Clicks | number | Clicks from iOS devices |
| `bitlyAndroidClicks` | Android Clicks | number | Clicks from Android devices |

### Browser Metrics ⭐ NEW DATA
| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `bitlyChromeClicks` | Chrome Clicks | number | Clicks from Chrome browser |
| `bitlySafariClicks` | Safari Clicks | number | Clicks from Safari browser |
| `bitlyFirefoxClicks` | Firefox Clicks | number | Clicks from Firefox browser |

### Engagement Metrics (Calculated)
| Variable Name | Label | Type | Description |
|--------------|-------|------|-------------|
| `bitlyClickRate` | Click-Through Rate | number | (Bitly clicks / Event attendees) × 100 |
| `bitlyMobileRate` | Mobile Usage Rate | number | (Mobile clicks / Total clicks) × 100 |
| `bitlyInternationalRate` | International Rate | number | (Non-local clicks / Total clicks) × 100 |

---

## 🔧 Implementation Priority

### Phase 1: Already Implemented ✅
- Total clicks
- Click timeseries
- Countries
- Referrers
- Link metadata

### Phase 2: Quick Wins (Existing API Endpoints)
1. **Devices** - High value, easy to implement
2. **Operating Systems** - Complements devices data
3. **Browsers** - Useful for technical insights
4. **Cities** - More granular than countries (if available in tier)

### Phase 3: Calculated Metrics
1. Aggregations (sum clicks across all links)
2. Rates and percentages
3. Top N rankings (top country, top referrer)
4. Trend calculations (growth rates)

---

## 📝 Next Steps

1. **Add Bitly variables to Variable Manager** (this task)
2. **Update Bitly sync to fetch new metrics** (devices, OS, browsers)
3. **Create aggregation formulas** for project-level metrics
4. **Build Bitly analytics dashboard** or charts

---

## ⚠️ API Rate Limits

**Bitly Growth Tier** (typical for most users):
- **100 API calls per minute**
- **1,000 API calls per hour**
- **10,000 API calls per day**

**Current Usage per Link Sync**:
- 5 API calls (metadata + summary + series + countries + referrers)

**With New Endpoints**:
- 8 API calls per link (add devices + OS + browsers)

**Recommendation**: 
- Fetch new metrics only on manual sync or weekly intervals
- Cache data aggressively
- Use selective sync (only changed links)

---

## 🔗 API Documentation Links

- **Main API Reference**: https://dev.bitly.com/api-reference/
- **Analytics Endpoints**: https://dev.bitly.com/docs/getting-started/analytics-api/
- **Authentication**: https://dev.bitly.com/docs/getting-started/authentication/

---

*This document provides a complete overview of all Bitly metrics available for integration into MessMass analytics.*
