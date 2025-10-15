# Analytics Platform MongoDB Indexes

**Version**: 6.1.0  
**Created**: 2025-01-21T17:00:00.000Z (UTC)  
**Purpose**: Performance optimization for analytics queries - target < 500ms response time

---

## Overview

The Analytics Platform uses pre-aggregated data stored in MongoDB collections. To achieve the < 500ms query response target, proper indexes must be created on these collections.

---

## Collection: `analytics_aggregates`

Time-bucketed aggregated metrics for fast time-series queries.

### Required Indexes

#### 1. **Primary Query Index** (Compound)
```javascript
db.analytics_aggregates.createIndex(
  { 
    bucket: 1,
    periodStart: -1,
    partnerId: 1,
    hashtag: 1
  },
  { 
    name: "idx_bucket_period_partner_hashtag",
    background: true
  }
)
```

**Purpose**: Primary query pattern - filter by bucket/date range and optional dimensions  
**Used By**: Most API queries in `/api/analytics/aggregates`  
**Query Pattern**: `{ bucket: 'monthly', periodStart: { $gte: '2024-01-01', $lte: '2024-12-31' }, partnerId: 'xyz' }`

---

#### 2. **Time Range Query Index**
```javascript
db.analytics_aggregates.createIndex(
  { 
    periodStart: -1,
    periodEnd: -1
  },
  { 
    name: "idx_period_range",
    background: true
  }
)
```

**Purpose**: Efficient date range queries across all buckets  
**Used By**: Dashboard time-series charts  
**Query Pattern**: `{ periodStart: { $gte: date }, periodEnd: { $lte: date } }`

---

#### 3. **Year/Month Query Index**
```javascript
db.analytics_aggregates.createIndex(
  { 
    year: 1,
    month: 1,
    bucket: 1
  },
  { 
    name: "idx_year_month_bucket",
    background: true
  }
)
```

**Purpose**: Fast filtering by specific year/month  
**Used By**: Monthly/yearly report generation  
**Query Pattern**: `{ year: 2024, month: 6, bucket: 'daily' }`

---

#### 4. **Partner Dimension Index**
```javascript
db.analytics_aggregates.createIndex(
  { 
    partnerId: 1,
    periodStart: -1
  },
  { 
    name: "idx_partner_period",
    background: true
  }
)
```

**Purpose**: Partner-specific time-series queries  
**Used By**: Partner dashboard analytics  
**Query Pattern**: `{ partnerId: 'xyz' }` sorted by `periodStart`

---

#### 5. **Hashtag Dimension Index**
```javascript
db.analytics_aggregates.createIndex(
  { 
    hashtag: 1,
    periodStart: -1
  },
  { 
    name: "idx_hashtag_period",
    background: true
  }
)
```

**Purpose**: Hashtag-specific analytics  
**Used By**: Hashtag performance reports  
**Query Pattern**: `{ hashtag: 'champions' }` sorted by `periodStart`

---

#### 6. **Sorting Optimization Index** (Compound)
```javascript
db.analytics_aggregates.createIndex(
  { 
    bucket: 1,
    totalAttendees: -1,
    avgEngagementRate: -1
  },
  { 
    name: "idx_bucket_metrics",
    background: true
  }
)
```

**Purpose**: Fast sorting by metrics  
**Used By**: "Top performing periods" queries  
**Query Pattern**: Sort by attendance or engagement within a bucket

---

#### 7. **Last Aggregation Timestamp Index**
```javascript
db.analytics_aggregates.createIndex(
  { 
    lastAggregatedAt: -1
  },
  { 
    name: "idx_last_aggregated",
    background: true
  }
)
```

**Purpose**: Find latest aggregation timestamp for metadata  
**Used By**: API response metadata  
**Query Pattern**: `{}` sorted by `lastAggregatedAt`

---

## Collection: `partner_analytics`

Partner-level aggregated metrics.

### Required Indexes

#### 1. **Partner Lookup Index**
```javascript
db.partner_analytics.createIndex(
  { 
    partnerId: 1
  },
  { 
    name: "idx_partner_id",
    unique: true,
    background: true
  }
)
```

**Purpose**: Fast partner lookup (unique constraint)  
**Used By**: Partner dashboard, upsert operations  
**Query Pattern**: `{ partnerId: 'xyz' }`

---

#### 2. **Partner Name Search Index**
```javascript
db.partner_analytics.createIndex(
  { 
    partnerName: 1
  },
  { 
    name: "idx_partner_name",
    background: true
  }
)
```

**Purpose**: Search/filter by partner name  
**Used By**: Partner selector, search functionality  
**Query Pattern**: `{ partnerName: /regex/ }`

---

#### 3. **Performance Sorting Index**
```javascript
db.partner_analytics.createIndex(
  { 
    totalEvents: -1,
    totalAttendees: -1,
    avgAttendeesPerEvent: -1
  },
  { 
    name: "idx_partner_performance",
    background: true
  }
)
```

**Purpose**: Sort partners by performance metrics  
**Used By**: "Top partners" leaderboards  
**Query Pattern**: Sort by total events, attendance, etc.

---

#### 4. **Trend Analysis Index**
```javascript
db.partner_analytics.createIndex(
  { 
    attendanceTrend: 1,
    engagementTrend: 1,
    lastAggregatedAt: -1
  },
  { 
    name: "idx_partner_trends",
    background: true
  }
)
```

**Purpose**: Filter partners by trend direction  
**Used By**: "Growing partners" or "Declining partners" reports  
**Query Pattern**: `{ attendanceTrend: 'increasing' }`

---

## Collection: `event_comparisons`

Event-to-event comparison data (Phase 2).

### Required Indexes

#### 1. **Event Lookup Index**
```javascript
db.event_comparisons.createIndex(
  { 
    eventId: 1
  },
  { 
    name: "idx_event_id",
    unique: true,
    background: true
  }
)
```

**Purpose**: Fast event lookup  
**Used By**: Event detail pages with benchmarking  
**Query Pattern**: `{ eventId: 'xyz' }`

---

#### 2. **Percentile Ranking Index**
```javascript
db.event_comparisons.createIndex(
  { 
    attendeePercentile: -1,
    engagementPercentile: -1,
    merchandisePercentile: -1
  },
  { 
    name: "idx_event_percentiles",
    background: true
  }
)
```

**Purpose**: Find top-performing events  
**Used By**: Leaderboards, best event reports  
**Query Pattern**: Sort by percentile rankings

---

#### 3. **Partner Comparison Index**
```javascript
db.event_comparisons.createIndex(
  { 
    partnerId: 1,
    partnerAttendeePercentile: -1
  },
  { 
    name: "idx_partner_event_comparison",
    background: true
  }
)
```

**Purpose**: Compare events within same partner  
**Used By**: Partner-specific benchmarking  
**Query Pattern**: `{ partnerId: 'xyz' }` sorted by partner percentile

---

## Collection: `aggregation_jobs`

Job metadata for monitoring and debugging.

### Required Indexes

#### 1. **Job Status Index**
```javascript
db.aggregation_jobs.createIndex(
  { 
    status: 1,
    startedAt: -1
  },
  { 
    name: "idx_job_status",
    background: true
  }
)
```

**Purpose**: Monitor running/failed jobs  
**Used By**: Admin monitoring dashboard  
**Query Pattern**: `{ status: 'running' }` or `{ status: 'failed' }`

---

#### 2. **Job History Index**
```javascript
db.aggregation_jobs.createIndex(
  { 
    jobType: 1,
    startedAt: -1
  },
  { 
    name: "idx_job_history",
    background: true
  }
)
```

**Purpose**: View historical job runs by type  
**Used By**: Job history and performance analysis  
**Query Pattern**: `{ jobType: 'daily' }` sorted by start time

---

## Index Creation Script

Run this script in MongoDB shell or via application:

```javascript
// Connect to MessMass database
use messmass;

// Analytics Aggregates Indexes
db.analytics_aggregates.createIndex(
  { bucket: 1, periodStart: -1, partnerId: 1, hashtag: 1 },
  { name: "idx_bucket_period_partner_hashtag", background: true }
);

db.analytics_aggregates.createIndex(
  { periodStart: -1, periodEnd: -1 },
  { name: "idx_period_range", background: true }
);

db.analytics_aggregates.createIndex(
  { year: 1, month: 1, bucket: 1 },
  { name: "idx_year_month_bucket", background: true }
);

db.analytics_aggregates.createIndex(
  { partnerId: 1, periodStart: -1 },
  { name: "idx_partner_period", background: true }
);

db.analytics_aggregates.createIndex(
  { hashtag: 1, periodStart: -1 },
  { name: "idx_hashtag_period", background: true }
);

db.analytics_aggregates.createIndex(
  { bucket: 1, totalAttendees: -1, avgEngagementRate: -1 },
  { name: "idx_bucket_metrics", background: true }
);

db.analytics_aggregates.createIndex(
  { lastAggregatedAt: -1 },
  { name: "idx_last_aggregated", background: true }
);

// Partner Analytics Indexes
db.partner_analytics.createIndex(
  { partnerId: 1 },
  { name: "idx_partner_id", unique: true, background: true }
);

db.partner_analytics.createIndex(
  { partnerName: 1 },
  { name: "idx_partner_name", background: true }
);

db.partner_analytics.createIndex(
  { totalEvents: -1, totalAttendees: -1, avgAttendeesPerEvent: -1 },
  { name: "idx_partner_performance", background: true }
);

db.partner_analytics.createIndex(
  { attendanceTrend: 1, engagementTrend: 1, lastAggregatedAt: -1 },
  { name: "idx_partner_trends", background: true }
);

// Event Comparisons Indexes (Phase 2)
db.event_comparisons.createIndex(
  { eventId: 1 },
  { name: "idx_event_id", unique: true, background: true }
);

db.event_comparisons.createIndex(
  { attendeePercentile: -1, engagementPercentile: -1, merchandisePercentile: -1 },
  { name: "idx_event_percentiles", background: true }
);

db.event_comparisons.createIndex(
  { partnerId: 1, partnerAttendeePercentile: -1 },
  { name: "idx_partner_event_comparison", background: true }
);

// Aggregation Jobs Indexes
db.aggregation_jobs.createIndex(
  { status: 1, startedAt: -1 },
  { name: "idx_job_status", background: true }
);

db.aggregation_jobs.createIndex(
  { jobType: 1, startedAt: -1 },
  { name: "idx_job_history", background: true }
);

// Verify indexes created
print("Analytics Aggregates Indexes:");
printjson(db.analytics_aggregates.getIndexes());

print("\nPartner Analytics Indexes:");
printjson(db.partner_analytics.getIndexes());

print("\nEvent Comparisons Indexes:");
printjson(db.event_comparisons.getIndexes());

print("\nAggregation Jobs Indexes:");
printjson(db.aggregation_jobs.getIndexes());

print("\n✅ All indexes created successfully!");
```

---

## Performance Targets

With these indexes in place:

| Query Type | Target | Actual (Expected) |
|------------|--------|-------------------|
| Time-bucketed metrics (< 1 year) | < 500ms | ~100-200ms |
| Partner analytics lookup | < 100ms | ~20-50ms |
| Event comparison | < 200ms | ~50-100ms |
| Aggregation job status | < 50ms | ~10-20ms |

---

## Index Maintenance

### Monitoring Index Usage

```javascript
// Check index usage statistics
db.analytics_aggregates.aggregate([
  { $indexStats: {} }
])
```

### Rebuilding Indexes

If performance degrades over time:

```javascript
// Rebuild all indexes
db.analytics_aggregates.reIndex();
db.partner_analytics.reIndex();
db.event_comparisons.reIndex();
db.aggregation_jobs.reIndex();
```

### Dropping Unused Indexes

```javascript
// Drop specific index if not used
db.analytics_aggregates.dropIndex("idx_name_here");
```

---

## Production Deployment Checklist

- [ ] Run index creation script in production MongoDB Atlas
- [ ] Verify all indexes created successfully
- [ ] Test query performance with production data
- [ ] Monitor index usage via MongoDB Atlas Performance Advisor
- [ ] Set up alerts for slow queries (> 500ms)
- [ ] Schedule periodic index maintenance (monthly reIndex if needed)

---

*Analytics Platform — MongoDB Indexes Documentation*  
*Version: 6.1.0 | Last Updated: 2025-01-21T17:00:00.000Z (UTC)*
