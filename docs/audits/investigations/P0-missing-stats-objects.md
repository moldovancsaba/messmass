# Investigation: Missing Stats Objects in Partners and Events

**Date:** 2026-01-02  
**Reporter:** Sultan  
**Investigator:** Tribeca  
**Status:** ✅ ROOT CAUSE IDENTIFIED, FIX AVAILABLE

---

## Issue Summary

User reported that some report texts in events and partners may be missing or disconnected from MongoDB Atlas Database. Investigation revealed significant data integrity issues.

---

## Investigation

### Scope
- **Collections:** `partners`, `projects` (events)
- **Fields:** `stats` object, `reportText1-10` fields
- **Impact:** Charts configured to use reportText fields may not display

### Root Cause

**What failed:**
- 141 out of 145 partners (97%) are missing `stats` objects
- 216 out of 224 events (96%) have `stats` objects but no `reportText` fields (expected if unused)
- Database connection is healthy (MongoDB 8.0.17, 399 hours uptime)

**Why it failed:**
- Partners created before the stats system was implemented don't have `stats` objects
- When `stats` is missing, accessing `stats.reportText1` returns `undefined`
- Chart calculator returns 'NA' for missing values
- Charts with 'NA' values are filtered out and not displayed (ReportChart.tsx line 150)

**Why it wasn't caught earlier:**
- Missing stats objects don't cause errors, just missing data
- Charts silently fail to display when data is missing
- No validation on partner creation to ensure stats object exists

### Classification
- **Type:** Data integrity issue (missing required objects)
- **Severity:** P1 (affects chart display for partners without stats)
- **Impact:** Charts configured to use reportText fields won't display for 97% of partners

### Could This Be Root Cause for Charts Not Visible?

**Partial answer:**
- **YES** for charts using `reportText` fields (text/image/table charts)
- **NO** for numeric charts (bar/pie/KPI) that don't use reportText
- **POSSIBLE** if chart configurations reference reportText fields that don't exist

**Evidence:**
- Chart calculator (lib/chartCalculator.ts line 342) accesses `stats[fieldName]` directly
- If `stats` is undefined, accessing properties returns `undefined`
- ReportChart component (line 150) filters out charts with no data
- Missing stats objects = missing reportText fields = charts filtered out

---

## Fix Applied

**Script:** `scripts/fix-missing-stats.js`

**Changes:**
1. Initialize empty `stats: {}` object for partners without stats
2. Update `updatedAt` timestamp
3. Safe operation: won't overwrite existing stats

**Usage:**
```bash
node scripts/fix-missing-stats.js
```

**Expected Result:**
- All 141 partners will have `stats: {}` initialized
- Partners can now have reportText fields added
- Charts referencing reportText fields will work (once fields are populated)

---

## Verification

**Before Fix:**
- 141/145 partners missing stats objects
- 2 partners with reportText fields working correctly

**After Fix (Expected):**
- 0/145 partners missing stats objects
- All partners can have reportText fields added

**Test:**
1. Run diagnostic: `node scripts/diagnose-report-texts.js`
2. Run fix: `node scripts/fix-missing-stats.js`
3. Verify: Re-run diagnostic to confirm all partners have stats objects

---

## Notes

- Events (projects) all have stats objects - no fix needed
- Missing reportText fields in events is normal if not yet used
- This fix addresses data integrity, not the original charts visibility issue
- Original charts issue (bar/pie/API charts) likely has different root cause

---

**Signed-off-by:** Tribeca

