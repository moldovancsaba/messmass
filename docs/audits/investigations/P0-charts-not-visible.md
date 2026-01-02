# Investigation: Charts Not Visible on Report Pages (P0)

**Date:** 2026-01-02T21:05:00+01:00  
**Issue:** Bar, pie, and API-driven charts not visible on report pages  
**Priority:** P0 (CRITICAL - User-facing regression)

## Investigation Notes

### What Failed
- Bar charts not visible on report pages
- Pie charts not visible on report pages
- API-driven charts not visible on report pages
- Affects `/report/[slug]` pages (event reports)

### Why It Failed
**Root Cause Analysis:**

1. **Chart Rendering System:**
   - Charts use `ReportChart.tsx` component (v12.0.0)
   - Bar charts: CSS-based horizontal bars (no canvas)
   - Pie charts: Chart.js `Doughnut` component (uses canvas)
   - API charts: Fetched from `/api/chart-config/public` endpoint

2. **Data Flow:**
   - `page.tsx` fetches chart configurations via `/api/chart-config/public`
   - `ReportCalculator` calculates chart results from stats
   - `ReportContent` renders charts via `ReportChart` component
   - Charts filtered by `hasValidChartData()` - empty charts return `null`

3. **Potential Issues:**
   - **CSP blocking canvas:** Chart.js pie charts use `<canvas>` element, CSP may block canvas rendering
   - **Data fetch failure:** `/api/chart-config/public` may be failing (4xx/5xx)
   - **CSS visibility:** Charts may be hidden via `display: none`, `height: 0`, or `overflow: hidden`
   - **Component filtering:** `hasValidChartData()` may be incorrectly filtering valid charts
   - **Chart.js import issue:** Tree-shaking or dynamic import may be breaking Chart.js

4. **CSP Configuration:**
   - Current CSP in `middleware.ts`:
     - `script-src 'self' 'unsafe-inline'` - allows scripts
     - `img-src 'self' data: https:` - allows images
     - **Missing:** No explicit `canvas` or `svg` directive (may default to `default-src 'self'`)
   - Chart.js pie charts require canvas rendering
   - Canvas elements may be blocked by CSP if not explicitly allowed

### Why It Wasn't Caught Earlier
- **Local cache:** Development may have cached chart data, masking fetch failures
- **No visual regression tests:** No automated checks for chart visibility
- **CSP recently changed:** Material Icons CSP fix may have inadvertently restricted canvas
- **Preview not tested:** Changes may have been tested only locally

### Classification
- **Type:** CSP restriction (most likely) + Potential data fetch failure
- **Root Cause:** 
  - **Primary:** CSP `default-src 'self'` may be blocking Chart.js canvas operations (though canvas itself doesn't need CSP, Chart.js may use features that require permissions)
  - **Secondary:** Data fetch from `/api/chart-config/public` may be failing silently
  - **Tertiary:** Chart calculation may be returning empty results, causing `hasValidChartData()` to filter out charts

### Scope
- **Environments:** Preview + Production (likely), Local (may work due to cache)
- **Impact:** All chart types on report pages (bar, pie, API-driven)
- **Files Affected:**
  - `app/report/[slug]/page.tsx` (chart data fetching)
  - `app/report/[slug]/ReportChart.tsx` (chart rendering)
  - `app/report/[slug]/ReportContent.tsx` (chart display)
  - `middleware.ts` (CSP configuration)

### Required Actions
1. ✅ **Fix applied:** Enhanced error handling in chart fetch (added cache: 'no-store', better error messages)
2. ⚠️ **CSP verification:** Chart.js doesn't require `unsafe-eval` (v3+), canvas doesn't need CSP permission
3. ⚠️ **Preview verification required:** Test chart rendering on Vercel Preview
4. ⚠️ **Browser console check:** Verify no CSP violations or fetch errors
5. ⚠️ **Data validation:** Verify `hasValidChartData()` is not incorrectly filtering valid charts

### Fix Applied
**Commit:** TBD (will add after commit)

**Changes:**
1. Enhanced error handling in `app/report/[slug]/page.tsx`:
   - Added `cache: 'no-store'` to chart fetch to ensure fresh data
   - Added explicit error messages with HTTP status codes
   - Better error handling for failed API responses

2. CSP documentation:
   - Added comment clarifying Chart.js doesn't need `unsafe-eval`
   - Canvas elements don't require explicit CSP permission

**Rationale:**
- Minimal fix at correct boundary (data fetching layer)
- Better error messages help diagnose issues
- No CSP changes needed (Chart.js v3+ doesn't use eval)

### Constraints
- Must not break existing security (CSP must remain strict)
- Must maintain backward compatibility
- Must work in Preview + Production

