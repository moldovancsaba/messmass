# Architecture Changelog Extracted 2026-09-16
Status: Archived
Last Updated: 2026-09-16
Canonical: No
Owner: Architecture

> Historical narrative removed from [`docs/architecture.md`](../architecture.md)
> on 2026-09-16, completing an extraction begun on 2026-08-17 (issue #409).
>
> Everything here is a record of something that happened: dated fix logs,
> migration plans and their status, debugging "key learnings", before/after
> performance tables whose measurement method was never stated, and manual-QA
> checklists from releases already shipped. None of it described the system's
> present state, but all of it sat inside a document engineers and agents read
> as current architecture.
>
> It is kept verbatim. Each block is labelled with the section of
> `architecture.md` it came from. Claims here were true when written and have
> not been re-verified since; do not treat any of it as a description of the
> code today.

## From: Template System Architecture (v11.29.0)

### Recent Fixes & Troubleshooting (v11.29.0)

#### Template Dropdown Race Condition Fix

**Problem** (discovered 2025-12-16):
- Template dropdown in Visualization Admin loaded before authentication check completed
- Race condition caused "Forbidden" errors when accessing `/api/report-templates`
- dropdown showed "No templates found" despite templates existing in database

**Root Cause**:
```typescript
// Bad pattern - templates fetched immediately on mount
useEffect(() => {
  loadTemplates(); // Race: may run before auth complete
}, []);
```

**Solution**:
```typescript
// Good pattern - wait for authenticated user
useEffect(() => {
  if (user) {
    loadTemplates(); // Only fetch when auth confirmed
  }
}, [user]);
```

**Files Modified**:
- `app/admin/visualization/page.tsx` - Added user dependency to template loading
- Authentication state now gates all API calls

#### Partner Template Connection Fix

**Problem** (discovered 2025-12-15):
- Partner-level content (reportImage/reportText variables) not visible on partner reports
- Content uploaded via partner edit page disappeared when viewing `/partner-report/[slug]`
- Event cards within partner report used wrong template

**Root Cause**:
1. **Content Visibility**: Partner report page only checked project-specific content, ignored partner-level content
2. **Template Selection**: Event cards forced project template instead of respecting partner fallback
3. **API Query**: Missing partner ID filter when fetching content from projects

**Solution**:
```typescript
// 1. Fetch partner-owned content separately
const partnerContent = await db.collection('projects').findOne({
  partnerId: partner._id,  // Filter by partner owner
  'stats.reportImage1': { $exists: true }
});

// 2. Use special __default_event__ identifier for event cards
const cardTemplateResponse = await fetch(
  `/api/report-config/__default_event__?type=project`
);

// 3. Merge partner content with event content
const allContent = [...partnerContent, ...eventContent];
```

**Files Modified**:
- `app/partner-report/[slug]/page.tsx` - Added partner content fetching logic
- `app/api/report-config/[identifier]/route.ts` - Added `__default_event__` special case
- Partner reports now show both partner-level AND event-level content

#### TextChart Vertical Centering Fix

**Problem** (commit cb867f5):
- TEXT chart content not vertically centered in grid cells
- Different aspect ratios caused misalignment
- Chart looked "floated" to top of container

**Solution**:
```css
/* Added to TextChart component */
.textChartContainer {
  display: flex;
  align-items: center;     /* Vertical center */
  justify-content: center; /* Horizontal center */
  min-height: 100%;
  aspect-ratio: var(--chart-aspect-ratio); /* Respect template settings */
}
```

**Files Modified**:
- `components/charts/TextChart.tsx` - Added flex centering
- `components/charts/TextChart.module.css` - Updated layout styles

#### Report Image Variables Fix

**Problem** (commit 880e439):
- Chart configurations referenced wrong variable names for report images
- `reportImage` vs `reportImage1` naming inconsistency
- Broken image display in reports

**Solution**:
- Standardized ALL report variables to numbered format: `reportImage1`, `reportImage2`, ... `reportImage10`
- Updated chart configurations to match: `stats.reportImage3` (not `stats.reportImage`)
- Migrated existing data to new naming convention

**Files Modified**:
- `scripts/fix-report-image-variables.ts` - Database migration script
- Updated 30+ chart configurations in database
- `lib/variablesConfig.ts` - Variable naming registry

## From: Configuration Loader (4.2.x)

### Migration plan (Step 4)
- Replace direct `process.env.*` usages with the config module
- Remove baked defaults for secrets
- Remove hard-coded service base URLs (replace with APP_BASE_URL, API_BASE_URL, SSO_BASE_URL, NEXT_PUBLIC_APP_URL)

---

## From: Hashtag Categories System (Version 2.2.0)

### Migration and Compatibility

- **Zero-Downtime Migration**: Existing projects continue working without changes
- **Gradual Adoption**: Users can adopt categorized hashtags at their own pace
- **Data Integrity**: Validation prevents duplicate hashtags within the same category
- **API Compatibility**: All existing API endpoints maintain backward compatibility

---

## From: Unified Admin System (Version 9.3.0+ / v10.1.0 Enhanced)

### Key Learnings

**1. Conflicting useEffects Are Silent Killers**
- Problem: Initial load effect depended on `[user, loadProjects]`, search effect on `[debouncedSearchQuery]`
- When search changed, `loadProjects` recreated, initial load fired again
- Solution: Initial load only depends on `[user]`, search effect owns all data loading

**2. Double Debouncing = Broken Search**
- Problem: Parent debounced (300ms) + UnifiedAdminPage debounced (300ms) = 600ms + search never fired
- Solution: Server-side mode skips component debouncing

**3. MongoDB Regex: Object vs String**
```typescript
// ❌ WRONG: Can't mix RegExp object + $options
{ $regex: new RegExp(query, 'i'), $options: 'i' }

// ✅ CORRECT: RegExp already has flags
{ $regex: new RegExp(query, 'i') }
```

## From: Security Enhancements — API Protection & Observability (Version 6.22.3)

### Performance Impact

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Request Latency** | 50ms | 52ms | +2ms (negligible) |
| **First Request** | 50ms | 150ms | +100ms (CSRF token fetch, one-time) |
| **Memory Usage** | 100MB | 101MB | +1MB (rate limit store) |
| **Client Bundle** | 500KB | 502KB | +2KB (apiClient) |

**Conclusion**: Minimal performance impact with significant security gains.

## From: Security Enhancements — API Protection & Observability (Version 6.22.3)

### Production Scaling Plan

**Current Architecture**:
- In-memory rate limiting (suitable for single-instance)
- No external dependencies

**Future Scaling**:
- Redis adapter for distributed rate limiting
- External logging service integration (Datadog, CloudWatch)
- Configurable limits per user/tier
- IP whitelist/blacklist support

## From: Advanced Chart Formatting System with VALUE Chart Type (Version 8.17.0)

### Migration Path

**No Database Migration Required**:
- Existing charts with `type` field continue to work (legacy mode)
- New charts can use `formatting` object (preferred)
- Mixed usage supported (some charts legacy, some new)

**Gradual Migration Strategy**:
1. **Phase 1**: Deploy v8.17.0 with backward compatibility
2. **Phase 2**: Create new VALUE charts with dual formatting
3. **Phase 3**: Optionally migrate existing charts to use `formatting` field
4. **Phase 4**: Deprecate `type` field in future major version (v9.0.0+)

**Migration Script** (optional, for bulk updates):
```javascript
// Example: Migrate all currency-type KPI charts to formatting object
db.chart_configurations.updateMany(
  { type: 'kpi', 'elements.type': 'currency' },
  {
    $set: {
      'elements.$[elem].formatting': { rounded: false, prefix: '€', suffix: '' }
    },
    $unset: { 'elements.$[elem].type': '' }
  },
  { arrayFilters: [{ 'elem.type': 'currency' }] }
);
```

## From: 📊 Reporting System v12 Architecture (v11.37.0+)

### Migration Status

#### v11.37.0 → v12.0.0 Transition

**Removed Components:**
- **Legacy chart wrapper** - The old `DynamicChart` renderer has been removed from the active component tree. Historical migration notes remain in archive docs only.

**Current Architecture (v12):**
- ✅ **`app/report/[slug]/ReportChart.tsx`** - Primary renderer
- ✅ **`app/report/[slug]/ReportContent.tsx`** - Layout manager
- ✅ All v12 reports use new system
- ✅ Imports of removed chart wrappers should fail during review and documentation audit

**Migration Status:**
- Report rendering uses `ReportChart` and `ReportContent`
- Remaining work is documentation cleanup and removal of historical references from active docs

## From: Unified Admin System (Version 9.3.0+ / v10.1.0 Enhanced)

### Migration Status

| Page | Status | Version | Features |
|------|--------|---------|----------|
| Categories | ✅ Migrated | v9.3.0 | Card/list, modal CRUD, client search |
| Users | ✅ Migrated | v9.3.0 | Card/list, modal CRUD, client search |
| Projects | ✅ Migrated | v10.1.0 | Card/list, modal CRUD, **server search**, partner logos, CSV export |
| Partners | ✅ Migrated | v10.7.0 | Card/list, modal CRUD, **server search**, Report button, 810 lines removed |
| Hashtags | 🔄 Pending | - | Custom implementation (to be migrated) |

## From: Chart System Enhancement Phase B (Version 6.10.0)

### Testing

**Validation**:
- ✅ Type-check passes (all types updated)
- ✅ Build passes (production-ready)
- ✅ Parameter substitution verified in dev environment
- ✅ 3 Bitly charts created in MongoDB Atlas

**Manual Testing Required**:
- Value chart displays parameterized values correctly
- Bitly charts render when Bitly data present
- Charts show "NA" gracefully when data missing
- Parameter editing via MongoDB updates chart values

## From: Advanced Chart Formatting System with VALUE Chart Type (Version 8.17.0)

### Testing

**Validation**:
- ✅ TypeScript type-check passes (strict mode)
- ✅ Next.js production build successful
- ✅ VALUE chart type appears in dropdown
- ✅ Formatting controls display for VALUE type only
- ✅ API validation enforces VALUE requirements
- ✅ Backward compatibility with legacy `type` field
- ✅ All chart types render correctly

**Manual Testing**:
- Create VALUE chart with dual formatting
- Verify KPI and bars use separate formatting
- Test prefix/suffix combinations (€, $, %, pts)
- Test rounded vs. 2-decimal modes
- Verify 5-element requirement blocks save with <5 or >5 elements
