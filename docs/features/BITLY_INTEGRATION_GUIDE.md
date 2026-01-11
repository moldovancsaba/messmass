# 🔗 Bitly Integration Technical Guide
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Product

**Version:** 11.25.2  
**Last Updated:** 2026-01-11T22:28:38.000Z (UTC)  
**Status:** Production

Complete technical documentation for the MessMass Bitly integration system with many-to-many relationships, date range attribution, and analytics sync.

---

See [PARTNERS_SYSTEM_GUIDE.md](PARTNERS_SYSTEM_GUIDE.md) for partner-based Bitly link inheritance.  
See [QUICK_ADD_GUIDE.md (archived)](docs/archive/2025/deprecated-guides/QUICK_ADD_GUIDE.md) for Sports Match Builder Bitly integration.

---

## Overview

MessMass integrates with Bitly API v4 to provide comprehensive link analytics across events, supporting:

- **Many-to-Many Relationships**: One link → multiple events, one event → multiple links
- **Smart Date Attribution**: Automatic temporal data separation for shared links
- **Cached Metrics**: Pre-computed analytics per event for instant access
- **Partner Inheritance**: Automatic link association via Sports Match Builder
- **Real-Time Sync**: Daily automatic + manual refresh

---

## Key Features (v6.0.0)

✅ **Junction Table Architecture** - Flexible many-to-many link-project associations  
✅ **Auto-Calculated Date Ranges** - Smart temporal attribution with 2-day buffers  
✅ **Cached Analytics** - Per-event metrics stored for fast access  
✅ **Bulk Import** - Import 100+ links from Bitly organization  
✅ **Partner Integration** - Automatic association via Sports Match Builder  
✅ **Comprehensive Metrics** - Clicks, geography, referrers, devices, timeseries

---

## Database Schema

### bitly_links Collection

```javascript
{
  _id: ObjectId("..."),
  bitlink: "bit.ly/season-pass",
  long_url: "https://example.com/tickets",
  title: "Season Tickets 2025",
  total_clicks: 1547,
  unique_clicks: 892,
  countries: [{ country: "US", clicks: 654 }],
  referrers: [{ referrer: "facebook", clicks: 432 }],
  timeseries: [{ date: "2025-03-01", clicks: 45 }],
  lastSyncedAt: "2025-01-21T11:00:00.000Z"
}
```

### bitly_project_links Collection (Junction Table)

```javascript
{
  _id: ObjectId("..."),
  bitlyLinkId: ObjectId("..."),
  projectId: ObjectId("..."),
  startDate: "2025-03-01T00:00:00.000Z",
  endDate: "2025-03-17T23:59:59.999Z",
  autoCalculated: true,
  cachedMetrics: {
    totalClicks: 234,
    uniqueClicks: 156,
    countriesData: [{ country: "US", clicks: 89 }],
    referrersData: [{ referrer: "facebook", clicks: 134 }]
  }
}
```

---

## Date Range Attribution Algorithm

**Problem**: When `bit.ly/season-pass` serves multiple events, how do we attribute clicks?

**Solution**: Auto-calculated non-overlapping date ranges with 2-day post-event buffers.

**Example**:

Events using `bit.ly/season-pass`:
- Event A: 2025-03-01
- Event B: 2025-03-15
- Event C: 2025-04-05

**Calculated Ranges**:
- Event A: `[1970-01-01] → [2025-03-03]` (all historical + 2 days post-event)
- Event B: `[2025-03-03] → [2025-03-17]` (2 days post-event)
- Event C: `[2025-03-17] → [2099-12-31]` (all future clicks)

**Why +2 days?** Captures post-event engagement (photo sharing, discussion).

---

## API Endpoints

### GET /api/bitly/links
List links with pagination, search, sorting. Returns links with associated projects.

### POST /api/bitly/associations
Create link-project association. Triggers date range calculation and metric caching.

### DELETE /api/bitly/associations  
Remove association. Recalculates date ranges for remaining associations.

### GET /api/bitly/project-metrics/[projectId]
Get all Bitly metrics for a project, filtered by date ranges with cached data.

### POST /api/bitly/pull
Bulk import up to 100 links from Bitly organization.

### POST /api/bitly/recalculate
Manually trigger date range and cache refresh for a link.

---

## Sync System

**Automatic**: Daily at 3:00 AM UTC via Vercel Cron  
**Manual**: Admin "Refresh Analytics" button

**Process**:
1. Fetch analytics from Bitly API (rate-limited)
2. Update `bitly_links` collection with raw data
3. Recalculate date ranges for changed events
4. Refresh cached metrics in `bitly_project_links`

---

## Partner Integration

When creating events via Sports Match Builder, Bitly links from Partner 1 (home team) are automatically associated with the generated event.

**See**: [PARTNERS_SYSTEM_GUIDE.md](PARTNERS_SYSTEM_GUIDE.md) for detailed partner integration.

---

## Performance

**Before Caching**: 2-5 seconds per project metrics query  
**After Caching**: 50-100ms per query  
**Improvement**: 20-50x faster

Cached metrics eliminate expensive timeseries filtering on every request.

---

## Environment Variables

```bash
BITLY_ACCESS_TOKEN=your_bitly_api_token
BITLY_ORGANIZATION_GUID=your_org_guid
BITLY_GROUP_GUID=your_group_guid
```

**Finding GUIDs**: See `https://app.bitly.com/settings/organization/{ORG_GUID}/groups/{GROUP_GUID}`

---

## Code Example: Fetch Project Metrics

```typescript
async function getProjectBitlyMetrics(projectId: string) {
  const response = await fetch(`/api/bitly/project-metrics/${projectId}`);
  const data = await response.json();
  
  return data.aggregatedMetrics; // { totalClicks, uniqueClicks, linkCount }
}
```

---

## Troubleshooting

**"Not Found" during pull**: Check `BITLY_GROUP_GUID` environment variable  
**Links not syncing**: Check Vercel cron logs and `bitly_sync_logs` collection  
**Incorrect attribution**: Trigger `POST /api/bitly/recalculate` to fix date ranges  
**Slow performance**: Verify cached metrics exist in `bitly_project_links`

---

**For Complete Technical Details**:
- Database schemas: See code in `lib/bitly-types.ts`
- Date algorithm: See `lib/bitly-date-calculator.ts`  
- Aggregation: See `lib/bitly-aggregator.ts`
- Sync service: See `lib/bitly-sync.ts`

---

**MessMass Bitly Integration Version 6.0.0**  
**Last Updated: 2025-01-21T11:14:00.000Z (UTC)**  
**© 2025 MessMass Platform**
