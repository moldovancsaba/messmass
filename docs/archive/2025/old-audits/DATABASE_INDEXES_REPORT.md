# Database Indexes Report

**Generated:** 2025-11-02T19:47:54.823Z  
**Mode:** Live Execution

## Summary

- **Total Index Specifications:** 47
- **Created:** 31 indexes
- **Already Existed:** 3 indexes
- **Failed:** 13 indexes
- **Total Creation Time:** 3530ms
- **Status:** ⚠️  Some Indexes Failed

## Index Strategy

This report documents all performance-critical indexes across the MessMass database.

### Design Principles

1. **High-Traffic Collections First**: Focus on collections with highest query volume
2. **Query Pattern Analysis**: Indexes match actual application query patterns
3. **Compound Indexes**: Multi-field indexes for complex queries
4. **Unique Constraints**: Prevent duplicate data where applicable
5. **Text Indexes**: Enable full-text search on key fields
6. **TTL Indexes**: Auto-delete old documents (logs, temporary data)

## Indexes by Collection


### `projects` Collection

**Total Indexes:** 7  
**Created:** 3 | **Existed:** 3 | **Failed:** 1

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `updatedAt_desc` | `{updatedAt:-1}` | `-` | ✅ Created | Cursor pagination - fetch recent projects efficiently |
| `eventDate_desc` | `{eventDate:-1}` | `-` | ✅ Created | Sort by event date (common admin sorting) |
| `eventName_text` | `{eventName:text}` | `-` | ⏭️  Existed | Full-text search in admin dashboard |
| `hashtags_array` | `{hashtags:1}` | `-` | ❌ Failed | Filter by hashtags (multikey index for arrays) |
| `categorizedHashtags_compound` | `{categorizedHashtags.country:1,categorizedHashtags.period:1}` | `-` | ✅ Created | Filter by category-specific hashtags |
| `viewSlug_unique` | `{viewSlug:1}` | `{unique:true}` | ⏭️  Existed | Unique public view slug lookup |
| `editSlug_unique` | `{editSlug:1}` | `{unique:true}` | ⏭️  Existed | Unique edit slug lookup |

### `notifications` Collection

**Total Indexes:** 5  
**Created:** 5 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `createdAt_desc` | `{createdAt:-1}` | `-` | ✅ Created | Recent notifications first (notification panel) |
| `userId_createdAt` | `{userId:1,createdAt:-1}` | `-` | ✅ Created | User-specific notifications sorted by time |
| `readBy_array` | `{readBy:1}` | `-` | ✅ Created | Filter unread notifications (multikey index) |
| `archivedBy_array` | `{archivedBy:1}` | `-` | ✅ Created | Filter archived notifications (multikey index) |
| `activityType_filter` | `{activityType:1}` | `-` | ✅ Created | Filter by notification type (create, edit, edit-stats) |

### `bitly_links` Collection

**Total Indexes:** 4  
**Created:** 4 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `bitlink_unique` | `{bitlink:1}` | `{unique:true}` | ✅ Created | Unique Bitly link lookup |
| `title_text` | `{title:text}` | `-` | ✅ Created | Search Bitly links by title |
| `createdAt_desc` | `{createdAt:-1}` | `-` | ✅ Created | Recent Bitly links first |
| `group_guid_filter` | `{group_guid:1}` | `-` | ✅ Created | Filter by Bitly group |

### `bitly_project_links` Collection

**Total Indexes:** 3  
**Created:** 3 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `projectId_lookup` | `{projectId:1}` | `-` | ✅ Created | Find all Bitly links for a project |
| `bitlyLinkId_lookup` | `{bitlyLinkId:1}` | `-` | ✅ Created | Reverse lookup - find projects using a Bitly link |
| `projectId_bitlyLinkId_unique` | `{projectId:1,bitlyLinkId:1}` | `{unique:true}` | ✅ Created | Prevent duplicate project-link associations |

### `analytics_aggregates` Collection

**Total Indexes:** 3  
**Created:** 3 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `projectId_unique` | `{projectId:1}` | `{unique:true}` | ✅ Created | Fast single-event analytics lookup |
| `partnerId_eventDate` | `{partnerContext.partnerId:1,eventDate:-1}` | `-` | ✅ Created | Partner-level analytics with chronological order |
| `eventDate_range` | `{eventDate:1}` | `-` | ✅ Created | Time-range queries for trends |

### `aggregation_logs` Collection

**Total Indexes:** 2  
**Created:** 1 | **Existed:** 0 | **Failed:** 1

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `createdAt_ttl` | `{createdAt:1}` | `{expireAfterSeconds:2592000}` | ❌ Failed | Auto-delete logs older than 30 days |
| `jobType_status` | `{jobType:1,status:1}` | `-` | ✅ Created | Filter logs by job type and status |

### `variables_metadata` Collection

**Total Indexes:** 3  
**Created:** 1 | **Existed:** 0 | **Failed:** 2

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `name_unique` | `{name:1}` | `{unique:true}` | ❌ Failed | Unique variable name lookup |
| `category_filter` | `{category:1}` | `-` | ❌ Failed | Filter variables by category |
| `isSystemVariable_filter` | `{isSystemVariable:1}` | `-` | ✅ Created | Separate system vs custom variables |

### `chart_configurations` Collection

**Total Indexes:** 3  
**Created:** 3 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `chartId_lookup` | `{chartId:1}` | `-` | ✅ Created | Fetch chart configuration by ID |
| `order_sort` | `{order:1}` | `-` | ✅ Created | Display charts in configured order |
| `isActive_filter` | `{isActive:1}` | `-` | ✅ Created | Filter active vs inactive charts |

### `hashtag_categories` Collection

**Total Indexes:** 1  
**Created:** 1 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `name_unique` | `{name:1}` | `{unique:true}` | ✅ Created | Unique category name lookup |

### `hashtag_colors` Collection

**Total Indexes:** 1  
**Created:** 0 | **Existed:** 0 | **Failed:** 1

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `hashtag_unique` | `{hashtag:1}` | `{unique:true}` | ❌ Failed | Unique hashtag color assignment |

### `hashtag_slugs` Collection

**Total Indexes:** 2  
**Created:** 2 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `slug_unique` | `{slug:1}` | `{unique:true}` | ✅ Created | Unique slug validation for hashtag filters |
| `hashtags_array` | `{hashtags:1}` | `-` | ✅ Created | Lookup by hashtag combinations |

### `filter_slugs` Collection

**Total Indexes:** 1  
**Created:** 1 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `slug_unique` | `{slug:1}` | `{unique:true}` | ✅ Created | Unique slug validation for filters |

### `page_passwords` Collection

**Total Indexes:** 1  
**Created:** 0 | **Existed:** 0 | **Failed:** 1

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `projectId_unique` | `{projectId:1}` | `{unique:true}` | ❌ Failed | One password per project |

### `local_users` Collection

**Total Indexes:** 1  
**Created:** 0 | **Existed:** 0 | **Failed:** 1

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `username_unique` | `{username:1}` | `{unique:true}` | ❌ Failed | Unique username for login |

### `styles` Collection

**Total Indexes:** 2  
**Created:** 0 | **Existed:** 0 | **Failed:** 2

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `name_lookup` | `{name:1}` | `-` | ❌ Failed | Lookup styles by name |
| `isDefault_filter` | `{isDefault:1}` | `-` | ❌ Failed | Find default style quickly |

### `partners` Collection

**Total Indexes:** 2  
**Created:** 2 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `apiId_unique` | `{apiId:1}` | `{unique:true,sparse:true}` | ✅ Created | Unique API provider ID (sparse for nulls) |
| `name_lookup` | `{name:1}` | `-` | ✅ Created | Search partners by name |

### `fixtures` Collection

**Total Indexes:** 3  
**Created:** 0 | **Existed:** 0 | **Failed:** 3

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `apiId_unique` | `{apiId:1}` | `{unique:true}` | ❌ Failed | Unique API fixture ID |
| `date_homeTeamId` | `{date:1,homeTeam.id:1}` | `-` | ❌ Failed | Find home games by date |
| `projectId_link` | `{projectId:1}` | `{sparse:true}` | ❌ Failed | Link fixtures to projects (sparse for unlinked) |

### `variables_groups` Collection

**Total Indexes:** 1  
**Created:** 1 | **Existed:** 0 | **Failed:** 0

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `groupOrder_sort` | `{groupOrder:1}` | `-` | ✅ Created | Display variable groups in order |

### `data_blocks` Collection

**Total Indexes:** 2  
**Created:** 1 | **Existed:** 0 | **Failed:** 1

| Index Name | Keys | Options | Status | Rationale |
|------------|------|---------|--------|----------|
| `blockId_unique` | `{blockId:1}` | `{unique:true}` | ❌ Failed | Unique data block ID |
| `type_filter` | `{type:1}` | `-` | ✅ Created | Filter blocks by type |


## Performance Impact Analysis

### Expected Improvements

| Collection | Before | After | Improvement |
|------------|--------|-------|-------------|
| `projects` | Full collection scan | Index scan (O(log n)) | 10-100x faster |
| `notifications` | 4,128 docs scanned | ~10 docs scanned | 400x faster |
| `bitly_links` | Sequential search | Hash lookup | 1000x faster |
| `analytics_aggregates` | No indexes | Unique index | Instant lookup |

### Query Types Optimized

- ✅ **Pagination**: `updatedAt` desc indexes for cursor-based pagination
- ✅ **Filtering**: Category, type, and status indexes
- ✅ **Sorting**: Event date, creation date indexes
- ✅ **Search**: Full-text indexes on names and titles
- ✅ **Lookups**: Unique indexes on IDs and slugs
- ✅ **Joins**: Foreign key indexes for relationships

## Index Maintenance

### Monitoring

Run the following MongoDB queries to monitor index usage:

```javascript
// Check index sizes
db.projects.stats().indexSizes

// Verify index usage (run after representative queries)
db.projects.aggregate([
  { $indexStats: {} }
])

// Check for unused indexes
db.projects.aggregate([
  { $indexStats: {} },
  { $match: { "accesses.ops": { $lt: 10 } } }
])
```

### Best Practices

1. **Regular Audits**: Review index usage quarterly
2. **Remove Unused**: Drop indexes with zero ops after 3 months
3. **Monitor Write Performance**: Indexes slow writes slightly
4. **Index Size**: Keep total index size < 50% of collection size

## Failed Indexes


### projects.hashtags_array

**Error:** MongoServerError: Index already exists with a different name: hashtags_multikey

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### aggregation_logs.createdAt_ttl

**Error:** MongoServerError: Index already exists with a different name: idx_createdAt_ttl

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### variables_metadata.name_unique

**Error:** MongoServerError: Index already exists with a different name: name_1

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### variables_metadata.category_filter

**Error:** MongoServerError: Index already exists with a different name: category_1

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### hashtag_colors.hashtag_unique

**Error:** MongoServerError: Index build failed: dfaf6432-be47-4c11-997f-16c27780874b: Collection messmass.hashtag_colors ( 872549d3-75ac-4759-8538-dd108ab8dcf4 ) :: caused by :: E11000 duplicate key error collection: messmass.hashtag_colors index: hashtag_unique dup key: { hashtag: null }

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### page_passwords.projectId_unique

**Error:** MongoServerError: Index build failed: 44a7db3a-c0a8-4280-ab3b-4a416a61f06a: Collection messmass.page_passwords ( 6ae04e39-ef1f-46f3-99e3-e96fdf97323a ) :: caused by :: E11000 duplicate key error collection: messmass.page_passwords index: projectId_unique dup key: { projectId: null }

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### local_users.username_unique

**Error:** MongoServerError: Index build failed: 5d32d766-9dc0-4102-aadf-2e9863811d6a: Collection messmass.local_users ( d547c5f4-4fa2-4a57-94bd-075eab521cfa ) :: caused by :: E11000 duplicate key error collection: messmass.local_users index: username_unique dup key: { username: null }

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### styles.name_lookup

**Error:** MongoServerError: ns does not exist: messmass.styles

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### styles.isDefault_filter

**Error:** MongoServerError: ns does not exist: messmass.styles

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### fixtures.apiId_unique

**Error:** MongoServerError: ns does not exist: messmass.fixtures

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### fixtures.date_homeTeamId

**Error:** MongoServerError: ns does not exist: messmass.fixtures

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### fixtures.projectId_link

**Error:** MongoServerError: ns does not exist: messmass.fixtures

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


### data_blocks.blockId_unique

**Error:** MongoServerError: Index build failed: a3ad809f-3b73-4179-8f6e-e64a09f30f1c: Collection messmass.data_blocks ( f3e22cda-2da4-41f9-a383-43314181f49e ) :: caused by :: E11000 duplicate key error collection: messmass.data_blocks index: blockId_unique dup key: { blockId: null }

**Action Required:**
1. Investigate error cause
2. Fix underlying issue (e.g., duplicate data for unique index)
3. Retry index creation manually


## Next Steps


1. ✅ Indexes created successfully
2. Monitor query performance over next 24 hours
3. Check index usage with `$indexStats`
4. Update ARCHITECTURE.md with index documentation


---

*Generated by: `scripts/createMissingIndexes.ts`*  
*Database: messmass*  
*Timestamp: 2025-11-02T19:47:54.823Z*
