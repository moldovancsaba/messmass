# Bitly Many-to-Many Testing Guide

**Version**: 5.54.1  
**Date**: 2025-10-14  
**Status**: Ready for Testing

---

## Overview

This document provides step-by-step testing procedures to verify the Bitly many-to-many link system implementation.

---

## Pre-Migration Checklist

### ✅ **Before Running Migration**

1. **Backup Database**
   ```bash
   # MongoDB Atlas: Create manual backup via UI
   # Or use mongodump for local backup
   mongodump --uri="$MONGODB_URI" --out=./backup-$(date +%Y%m%d)
   ```

2. **Verify Environment Variables**
   ```bash
   echo $MONGODB_URI
   echo $MONGODB_DB
   ```

3. **Test Connection**
   ```bash
   node -e "require('dotenv').config({path:'.env.local'}); console.log('URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET')"
   ```

---

## Migration Testing

### Phase 1: Dry Run

```bash
cd /Users/moldovancsaba/Projects/messmass
node scripts/migrate-bitly-many-to-many.js --dry-run
```

**Expected Output:**
- ✅ Scans all `bitly_links` with `projectId`
- ✅ Shows migration statistics (unique links, associations)
- ✅ Calculates date ranges for each link
- ✅ **No database changes made**

**Verify:**
- [ ] Script runs without errors
- [ ] Statistics match expected number of links
- [ ] Date range calculations look reasonable

### Phase 2: Migration with Backup

```bash
node scripts/migrate-bitly-many-to-many.js --backup
```

**When prompted, type:** `yes`

**Expected Process:**
1. Creates backup collection: `bitly_links_backup_[timestamp]`
2. Migrates each link to junction table
3. Calculates and stores date ranges
4. Removes deprecated `projectId` field
5. Validates migration success

**Verify:**
- [ ] Backup collection created
- [ ] Junction table (`bitly_project_links`) populated
- [ ] Date ranges calculated correctly
- [ ] No links still have `projectId` field

### Phase 3: Validation Queries

**Run in MongoDB Shell or Compass:**

```javascript
// 1. Count junction table entries
db.bitly_project_links.countDocuments()

// 2. Check for orphaned projectId fields
db.bitly_links.countDocuments({ projectId: { $exists: true } })
// Expected: 0

// 3. Sample junction entry structure
db.bitly_project_links.findOne()

// 4. Verify date ranges are set
db.bitly_project_links.find({
  $or: [
    { startDate: { $exists: false } },
    { endDate: { $exists: false } }
  ]
}).count()
// Expected: 0

// 5. Check for cached metrics
db.bitly_project_links.find({
  'cachedMetrics': { $exists: true }
}).count()
```

---

## Functional Testing Scenarios

### Test 1: Single Event with Bitly Link

**Setup:**
1. Create event: "Test Event A" on 2025-12-01
2. Associate Bitly link: `bit.ly/test-a`

**Verify:**
```bash
# Check junction table entry
db.bitly_project_links.find({ 
  bitlyLinkId: ObjectId("...") 
})
```

**Expected:**
- `startDate: null` (from beginning)
- `endDate: null` (to infinity)
- `autoCalculated: true`

---

### Test 2: Overlapping Events (< 3 days apart)

**Setup:**
1. Event A: 2025-12-01
2. Event B: 2025-12-02 (1 day later)
3. Same Bitly link for both

**Expected Date Ranges:**
- Event A: `null` to `2025-12-01` (no buffer, too close)
- Event B: `2025-12-02` to `null` (ongoing)

**Test Procedure:**
```bash
# 1. Create first event
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Overlap Test A",
    "eventDate": "2025-12-01",
    "stats": {...}
  }'

# 2. Create second event
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Overlap Test B",
    "eventDate": "2025-12-02",
    "stats": {...}
  }'

# 3. Associate same Bitly link via Admin UI
```

**Verify in Database:**
```javascript
db.bitly_project_links.find({ bitlyLinkId: ObjectId("...") })
  .sort({ 'startDate': 1 })
```

---

### Test 3: Normal Spacing (> 3 days apart)

**Setup:**
1. Event A: 2025-12-01
2. Event B: 2025-12-10 (9 days later)
3. Same Bitly link

**Expected Date Ranges:**
- Event A: `null` to `2025-12-03` (event + 2 days buffer)
- Event B: `2025-12-03` to `null`

---

### Test 4: Three Events in Sequence

**Setup:**
1. Event A: 2025-11-01
2. Event B: 2025-12-01 (1 month later)
3. Event C: 2026-01-01 (1 month later)
4. Same Bitly link for all

**Expected Date Ranges:**
- Event A: `null` to `2025-11-03`
- Event B: `2025-11-03` to `2025-12-03`
- Event C: `2025-12-03` to `null`

**Verify:**
- [ ] First event gets all history
- [ ] Middle event has bounded range
- [ ] Last event gets ongoing data
- [ ] No gaps between date ranges

---

### Test 5: Event Date Change Recalculation

**Setup:**
1. Create 3 events with shared link (as above)
2. Change Event B date from 2025-12-01 to 2025-12-15

**Expected Behavior:**
- Automatic recalculation triggered
- Event B range shifts: `2025-11-03` to `2025-12-17`
- Event C range shifts: `2025-12-17` to `null`

**Test Procedure:**
```bash
# 1. Update event date via API
curl -X PUT http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "eventDate": "2025-12-15",
    ...
  }'

# 2. Check console logs for recalculation trigger
# Expected: "📅 Event date changed, triggering Bitly recalculation..."

# 3. Verify junction table updated
db.bitly_project_links.find({ bitlyLinkId: ObjectId("...") })
```

---

### Test 6: Event Deletion Redistribution

**Setup:**
1. Start with 3 events sharing a link
2. Delete middle event (Event B)

**Expected:**
- Junction entry for Event B deleted
- Event A and C ranges recalculated
- Event A: `null` to new boundary
- Event C: seamless continuation to `null`

**Test Procedure:**
```bash
# 1. Delete event
curl -X DELETE "http://localhost:3000/api/projects?projectId=..."

# 2. Check logs
# Expected: "🔗 Handling Bitly link redistribution..."

# 3. Verify junction table
db.bitly_project_links.find({ projectId: ObjectId("[deleted]") })
// Expected: 0 results
```

---

### Test 7: Manual Metric Refresh

**Test via Admin UI:**
1. Go to `/admin/bitly`
2. Click "Refresh Metrics" button
3. Confirm dialog

**Expected:**
- Success message: "✓ Refreshed N event-link associations!"
- `lastSyncedAt` timestamps updated in junction table
- Cached metrics reflect latest Bitly data

---

### Test 8: Project-Specific Metrics API

**Test:**
```bash
curl http://localhost:3000/api/bitly/project-metrics/[projectId]
```

**Expected Response:**
```json
{
  "projectId": "...",
  "links": [
    {
      "bitlyLinkId": "...",
      "bitlink": "bit.ly/example",
      "title": "Example Link",
      "longUrl": "https://example.com",
      "dateRange": {
        "startDate": "2025-11-03",
        "endDate": "2025-12-03",
        "autoCalculated": true
      },
      "metrics": {
        "clicks": 1234,
        "uniqueClicks": 567,
        "topCountries": [...],
        "topReferrers": [...],
        ...
      },
      "lastSyncedAt": "2025-10-14T09:00:00.000Z"
    }
  ],
  "totalClicks": 1234,
  "totalUniqueClicks": 567
}
```

---

### Test 9: Manual Recalculation API

**Test Link Recalculation:**
```bash
curl -X POST http://localhost:3000/api/bitly/recalculate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "bitlink",
    "bitlyLinkId": "..."
  }'
```

**Test Project Recalculation:**
```bash
curl -X POST http://localhost:3000/api/bitly/recalculate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "project",
    "projectId": "..."
  }'
```

**Test Full Refresh:**
```bash
curl -X POST http://localhost:3000/api/bitly/recalculate \
  -H "Content-Type: application/json" \
  -d '{ "mode": "all" }'
```

---

### Test 10: Cron Job (Daily Refresh)

**Manual Test:**
```bash
curl http://localhost:3000/api/cron/bitly-refresh
```

**With Authorization (if CRON_SECRET set):**
```bash
curl http://localhost:3000/api/cron/bitly-refresh \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Expected:**
```json
{
  "success": true,
  "associationsRefreshed": 42,
  "timestamp": "2025-10-14T09:00:00.000Z",
  "duration": 2345
}
```

---

## Data Integrity Checks

### Check 1: No Missing Date Ranges

```javascript
// All junction entries must have startDate and endDate fields
db.bitly_project_links.find({
  $or: [
    { startDate: { $exists: false } },
    { endDate: { $exists: false } }
  ]
})
// Expected: 0 results
```

### Check 2: No Orphaned Associations

```javascript
// All junction entries must reference existing projects
const junctions = db.bitly_project_links.find().toArray();
const projectIds = db.projects.distinct('_id');

junctions.filter(j => !projectIds.includes(j.projectId.toString()))
// Expected: []
```

### Check 3: Date Range Continuity

For each bitlink with multiple events, verify:
- First event: `startDate === null`
- Last event: `endDate === null`
- No gaps between ranges (previous `endDate` === next `startDate`)

---

## Performance Testing

### Test 1: Large Dataset Migration

**Setup:**
- 1000+ events
- 500+ Bitly links
- Various association patterns

**Measure:**
- Migration execution time
- Memory usage
- Database query performance

### Test 2: Recalculation Performance

**Test:**
```bash
time curl -X POST http://localhost:3000/api/bitly/recalculate \
  -H "Content-Type: application/json" \
  -d '{ "mode": "all" }'
```

**Expected:**
- < 60 seconds for 1000 associations
- No memory leaks
- Successful completion

---

## Rollback Procedure

**If Migration Fails:**

```bash
# 1. Connect to MongoDB
mongo "$MONGODB_URI"

# 2. Find backup collection
use messmass
show collections
# Look for: bitly_links_backup_[timestamp]

# 3. Restore from backup
db.bitly_links.drop()
db.bitly_links_backup_[timestamp].renameCollection('bitly_links')

# 4. Delete junction table
db.bitly_project_links.drop()
```

---

## Success Criteria

### ✅ Migration Complete When:
- [ ] All existing `projectId` associations migrated to junction table
- [ ] No links retain deprecated `projectId` field
- [ ] All date ranges calculated and stored
- [ ] Cached metrics initialized for all associations
- [ ] Backup collection exists for rollback

### ✅ System Functional When:
- [ ] Event date changes trigger automatic recalculation
- [ ] Event deletion redistributes date ranges correctly
- [ ] Manual refresh updates cached metrics
- [ ] APIs return accurate date-filtered data
- [ ] Admin UI shows date ranges and refresh controls
- [ ] No data loss or gaps in analytics

---

## Troubleshooting

### Issue: Migration Script Errors

**Check:**
1. Environment variables set correctly
2. Database connection successful
3. Node.js version >= 18

**Solutions:**
```bash
# Verify connection
node -e "require('dotenv').config({path:'.env.local'}); const {MongoClient} = require('mongodb'); MongoClient.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

### Issue: Date Ranges Look Wrong

**Debug:**
```javascript
// Check event sorting
db.projects.find({ _id: { $in: [...] } })
  .sort({ eventDate: 1, createdAt: 1 })

// Check junction entries
db.bitly_project_links.find({ bitlyLinkId: ObjectId("...") })
  .sort({ startDate: 1 })
```

### Issue: Metrics Not Updating

**Check:**
1. Bitly sync completed successfully
2. Refresh metrics triggered
3. `lastSyncedAt` timestamp recent

**Fix:**
```bash
curl -X POST http://localhost:3000/api/bitly/recalculate \
  -d '{ "mode": "all" }'
```

---

## Monitoring

### Key Metrics to Track:
- Junction table size growth
- Recalculation execution time
- API response times
- Cache hit rate
- Failed sync attempts

### Logs to Monitor:
- `[Bitly Cron]` - Daily refresh job
- `[Recalculate API]` - Manual triggers
- `📅 Event date changed` - Auto recalculation
- `🔗 Handling Bitly link redistribution` - Deletion handling

---

**End of Testing Guide**
