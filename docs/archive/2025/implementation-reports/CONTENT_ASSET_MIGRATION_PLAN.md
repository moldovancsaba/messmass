# Content Asset Migration Plan

**Version:** 10.4.1  
**Date:** 2025-11-03  
**Status:** Ready for Execution

## Overview

This document outlines the **safe, incremental migration strategy** from legacy `stats.reportImage*` and `stats.reportText*` fields to the new **Content Asset CMS** system.

---

## Current State Analysis

### Legacy Variables Count

**Image Variables (9 total):**
- `reportImage1` through `reportImage9`
- Stored in: `variables_metadata` collection
- Usage: Direct URL storage in `project.stats`

**Text Variables (9 total):**
- `reportText1` through `reportText9`
- Stored in: `variables_metadata` collection
- Usage: Direct text content storage in `project.stats`

**Total Legacy Variables: 18**

### Current Chart References

Charts using legacy variables:
- IMAGE type charts: `[stats.reportImage1]` ... `[stats.reportImage9]`
- TEXT type charts: `[stats.reportText1]` ... `[stats.reportText9]`

---

## Migration Strategy: 4-Phase Approach

### ✅ Phase 1: Content Asset CMS Creation (COMPLETE)

**Status:** ✅ Done (v10.4.1)

- ✅ Content Asset CMS implemented
- ✅ `/admin/content-library` page created
- ✅ `[MEDIA:slug]` and `[TEXT:slug]` token support added
- ✅ Formula engine integration complete
- ✅ Chart calculator support ready
- ✅ Backward compatibility maintained

---

### 🔄 Phase 2: Incremental Content Migration (YOU)

**Timeline:** 1-2 weeks (depending on usage volume)  
**Owner:** You (manual process)  
**Goal:** Move existing content to CMS without breaking charts

#### Step-by-Step Process

**2.1. Inventory Existing Content**

Create a spreadsheet to track migration:

| Legacy Field | Current Usage | CMS Slug | Status |
|--------------|---------------|----------|--------|
| reportImage1 | 5 projects | partner-logo-abc | ✅ Migrated |
| reportImage2 | 3 projects | event-banner-2024 | 🔄 In Progress |
| reportText1 | 8 projects | executive-summary | ⏳ Pending |

**2.2. Upload Content to CMS**

For each legacy field in use:

1. **Navigate to:** `/admin/content-library`
2. **Click:** "🖼️ New Image" or "📝 New Text"
3. **Fill Form:**
   - **Title:** Descriptive name (e.g., "Partner ABC Logo")
   - **Slug:** Lowercase with hyphens (e.g., `partner-abc-logo`)
   - **Category:** Group assets (e.g., "Partners", "Event Banners")
   - **Tags:** Add searchable tags (e.g., "logo", "2024", "sponsor")
   - **Content:** Upload image or paste text

**Slug Naming Convention:**
```
✅ GOOD: partner-abc-logo, event-2024-banner, executive-summary
❌ BAD: Partner_ABC_Logo, event banner, Executive Summary
```

**2.3. Update Chart Formulas (Gradual)**

For each chart using legacy fields:

1. **Open:** Chart Algorithm Manager (`/admin/chart-algorithms`)
2. **Find Chart:** Search for charts using `reportImage*` or `reportText*`
3. **Edit Formula:**
   ```diff
   - [stats.reportImage1]
   + [MEDIA:partner-abc-logo]
   ```
4. **Test:** Verify chart displays correctly
5. **Save:** Update chart configuration

**Example Transformations:**

| Before (Legacy) | After (CMS) | Notes |
|-----------------|-------------|-------|
| `[stats.reportImage1]` | `[MEDIA:partner-logo]` | Partner logo asset |
| `[stats.reportText1]` | `[TEXT:event-summary]` | Event summary text |
| `[stats.reportImage5]` | `[MEDIA:banner-16-9]` | 16:9 event banner |

**2.4. Verify & Document**

After updating each chart:

- ✅ Check chart renders correctly in Editor (`/edit/[slug]`)
- ✅ Check chart appears in Reports (if enabled)
- ✅ Update migration tracking spreadsheet
- ✅ Mark legacy field as "no longer needed" once fully migrated

---

### 🧹 Phase 3: Legacy Cleanup (ME - AI Agent)

**Timeline:** 1 hour  
**Owner:** AI Agent (automated)  
**Trigger:** After you confirm all charts are migrated

Once you confirm **all 18 legacy variables** are no longer referenced by any charts, I will:

#### 3.1. Code Cleanup

**Remove Legacy Fallback Code:**
- `lib/chartCalculator.ts` (lines 244-260, 293-309) - Remove stats field fallback logic
- Update comments to remove references to legacy patterns

**Files to Update:**
```
lib/chartCalculator.ts        - Remove legacy fallback code
docs/ARCHITECTURE.md          - Remove reportImage/reportText mentions
docs/WARP.md                  - Remove legacy pattern examples
LEARNINGS.md                  - Archive legacy system notes
```

#### 3.2. Database Cleanup

**Remove Variables from MongoDB:**

Script to delete legacy variables:
```javascript
// scripts/remove-legacy-report-variables.js
const legacyVariables = [
  'reportImage1', 'reportImage2', 'reportImage3', 'reportImage4', 'reportImage5',
  'reportImage6', 'reportImage7', 'reportImage8', 'reportImage9',
  'reportText1', 'reportText2', 'reportText3', 'reportText4', 'reportText5',
  'reportText6', 'reportText7', 'reportText8', 'reportText9'
];

await db.collection('variables_metadata').deleteMany({
  name: { $in: legacyVariables }
});
```

**Remove Stats Fields from Projects:**

Optional cleanup (not required due to Single Reference System):
```javascript
// Remove unused stats fields (optional - won't break anything if left)
await db.collection('projects').updateMany(
  {},
  { $unset: {
    'stats.reportImage1': '', 'stats.reportImage2': '', // ... all 18
  }}
);
```

#### 3.3. Documentation Updates

**Archive Legacy System:**
- Move legacy documentation to `docs/archive/LEGACY_REPORT_VARIABLES.md`
- Update `CONTENT_ASSET_FORMULA_INTEGRATION.md` to remove legacy references
- Update `README.md` to reflect CMS-only approach

---

### 🚀 Phase 4: Optimization & Enhancement (FUTURE)

**Timeline:** Ongoing  
**Owner:** Both

#### 4.1. Content Asset Enhancements

- [ ] Asset versioning (track changes over time)
- [ ] Asset usage analytics (which charts use which assets)
- [ ] Asset previews in Chart Algorithm Manager
- [ ] Bulk asset upload tool
- [ ] Asset templates (pre-configured assets)

#### 4.2. Workflow Improvements

- [ ] Asset approval workflow (review before publish)
- [ ] Asset expiration dates (seasonal content)
- [ ] Multi-language asset support
- [ ] Asset folders/collections (organize large libraries)

---

## Migration Checklist (YOU)

Use this checklist to track your progress:

### Pre-Migration

- [ ] Read this migration plan completely
- [ ] Create migration tracking spreadsheet
- [ ] Back up database (already done: `messmass_backup_2025-11-02`)
- [ ] Test Content Asset CMS at `/admin/content-library`
- [ ] Upload 1-2 test assets to familiarize with workflow

### Per-Asset Migration

For each of the 18 legacy variables:

- [ ] **Identify Usage:** Check which projects/charts use this variable
- [ ] **Upload to CMS:** Create content asset with descriptive slug
- [ ] **Update Charts:** Change formulas from `[stats.*]` to `[MEDIA:*]` or `[TEXT:*]`
- [ ] **Verify Rendering:** Check charts in Editor and Reports
- [ ] **Document:** Mark as migrated in tracking spreadsheet

### Post-Migration Verification

- [ ] Confirm all 18 legacy variables are unused
- [ ] Test all charts that were updated
- [ ] Verify no `[stats.reportImage*]` or `[stats.reportText*]` in active charts
- [ ] Notify AI Agent to proceed with Phase 3 cleanup

---

## Migration Tools & Commands

### Find Charts Using Legacy Variables

```bash
# Search for charts using reportImage*
grep -r "reportImage[0-9]" /path/to/project --include="*.json" --include="*.tsx"

# Search for charts using reportText*
grep -r "reportText[0-9]" /path/to/project --include="*.json" --include="*.tsx"
```

### Database Query: Find Projects with Legacy Data

```javascript
// MongoDB query to find projects with legacy fields
db.projects.find({
  $or: [
    { 'stats.reportImage1': { $exists: true } },
    { 'stats.reportImage2': { $exists: true } },
    // ... repeat for all 18 variables
  ]
}).count();
```

### Verify CMS Asset Exists

```bash
# Check if slug is already taken
curl http://localhost:3000/api/content-assets | jq '.assets[] | select(.slug == "partner-logo")'
```

---

## Risk Mitigation

### Backup Strategy

**Before Migration:**
- ✅ Full database backup created: `messmass_backup_2025-11-02`

**During Migration:**
- Keep legacy fields in database until Phase 3
- Charts with `[stats.*]` continue to work (backward compatibility)

**Rollback Plan:**
If issues arise, simply revert chart formulas:
```diff
- [MEDIA:partner-logo]
+ [stats.reportImage1]
```
No data loss possible - legacy fields remain intact until Phase 3.

### Testing Protocol

**Per Chart Update:**
1. Update formula in Chart Algorithm Manager
2. Test in Editor: `/edit/[project-slug]`
3. Check chart renders correctly
4. If broken: immediately revert to `[stats.*]` pattern

**Final Verification:**
1. Generate full report PDF for 1-2 sample projects
2. Verify all images/text display correctly
3. Check no "N/A" or broken images

---

## Timeline Estimate

| Phase | Duration | Owner | Status |
|-------|----------|-------|--------|
| Phase 1: CMS Implementation | Complete | AI | ✅ Done |
| Phase 2: Content Migration | 1-2 weeks | You | 🔄 Ready to Start |
| Phase 3: Legacy Cleanup | 1 hour | AI | ⏳ Waiting |
| Phase 4: Optimization | Ongoing | Both | ⏳ Future |

**Critical Path:** Phase 2 is the bottleneck (manual migration)

---

## Success Criteria

### Phase 2 Complete When:
- ✅ All 18 legacy variables uploaded to CMS
- ✅ All charts updated to use `[MEDIA:*]` or `[TEXT:*]` tokens
- ✅ All projects render correctly with new CMS assets
- ✅ No active charts reference `[stats.reportImage*]` or `[stats.reportText*]`

### Phase 3 Complete When:
- ✅ Legacy fallback code removed from codebase
- ✅ Legacy variables deleted from `variables_metadata`
- ✅ Documentation updated to remove legacy references
- ✅ Build passes with no warnings about removed variables

### Phase 4 Success Metrics:
- 📊 Asset reuse rate >30% (same asset used in multiple charts)
- 📊 Asset upload time <2 minutes per asset
- 📊 Zero reports of "N/A" in image/text charts
- 📊 Positive user feedback on CMS usability

---

## Communication Plan

### When to Notify AI Agent

**Ready for Phase 3 Cleanup:**
Message: *"All 18 legacy variables migrated to CMS. Ready for Phase 3 cleanup."*

Include:
- Confirmation that all charts tested
- List of any charts that couldn't be migrated (if any)
- Database backup timestamp

**Phase 3 Approval:**
I will provide:
- Cleanup script for review
- List of files to be modified
- Estimated downtime (if any)

Wait for your approval before executing.

---

## Frequently Asked Questions

### Q: Can I migrate gradually or must I do all 18 at once?
**A:** Gradual is **recommended**! Migrate 2-3 variables per day, test thoroughly, then continue. The backward compatibility ensures old charts keep working.

### Q: What if I forget which charts use a legacy variable?
**A:** Use the Chart Algorithm Manager search feature or run the grep commands above. Each asset also tracks usage count in the CMS.

### Q: Can I reuse CMS assets across multiple projects?
**A:** Yes! That's a key benefit. Upload once, reference from any chart in any project using the same slug.

### Q: What happens if I delete a CMS asset that's in use?
**A:** The CMS will warn you and show which charts use it. If you force delete, affected charts will show "N/A" (same as missing legacy field).

### Q: Can I change a slug after creating an asset?
**A:** Yes, but CMS will warn you that it will break chart references. Better to create a new asset with the correct slug.

### Q: Do I need to delete the legacy stats fields after migration?
**A:** No! They can remain in the database harmlessly. Only the `variables_metadata` entries need cleanup (Phase 3).

---

## Next Steps

1. **You:**
   - Create migration tracking spreadsheet
   - Start with 1-2 low-risk assets (least used variables)
   - Test workflow end-to-end
   - Continue incrementally until all 18 migrated

2. **AI Agent (Me):**
   - Monitor for questions/issues
   - Provide migration support as needed
   - Execute Phase 3 cleanup upon your approval
   - Update documentation

---

## Contact & Support

**Questions During Migration:**
- Ask AI Agent for help with specific charts
- Request migration scripts if needed
- Report any bugs in CMS or formula system

**Emergency Rollback:**
If critical issues arise, immediately:
1. Revert chart formulas to `[stats.*]` pattern
2. Notify AI Agent with error details
3. Continue using legacy system until issue resolved

---

**Last Updated:** 2025-11-03T10:01:00.000Z (UTC)  
**Document Owner:** AI Development Agent  
**Migration Status:** Phase 2 Ready to Start 🚀
