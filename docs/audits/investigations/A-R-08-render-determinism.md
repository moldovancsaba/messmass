# A-R-08: Render Determinism Guarantees

**Status:** INVESTIGATION COMPLETE  
**Priority:** Medium  
**Category:** Reporting Correctness  
**Created:** 2026-01-12T12:20:00.000Z  
**Investigator:** Tribeca  
**Reference:** [A-R-ROADMAP-PROPOSAL-2026-01-12.md](../reporting-roadmap/A-R-ROADMAP-PROPOSAL-2026-01-12.md)

---

## Problem Statement

Layout Grammar ensures deterministic layout (no scrolling, truncation, clipping), but other sources of non-determinism may exist:
- **Render order stability:** Are blocks/charts rendered in a consistent order across re-renders?
- **Data calculation timing:** Are calculations dependent on async operations that could complete in different orders?
- **Non-deterministic effects:** Random numbers, timestamps, race conditions, conditional rendering based on timing

**Impact:**
- Same input may produce different output across renders
- Report exports may differ from rendered view
- User trust in report consistency is reduced

---

## Investigation Scope

**Focus Areas:**
1. Render order stability (block/chart ordering)
2. Data calculation timing dependencies (async operations, race conditions)
3. Non-deterministic effects (random numbers, timestamps, conditional rendering)

**Excluded:**
- Layout Grammar compliance (already deterministic)
- Admin UI (out of scope)
- Visual styling variations (CSS, fonts, images)

---

## Investigation Findings

### 1. Render Order Stability

**Finding:** ✅ **DETERMINISTIC**

**Evidence:**
- **Block Ordering:** `app/report/[slug]/page.tsx` line 118: `blocks.map((block) => ...)` - Blocks are rendered in array order from `useReportLayout` hook
- **Chart Ordering:** `app/report/[slug]/ReportContent.tsx` line 387: `const sortedCharts = [...block.charts].sort((a, b) => a.order - b.order)` - Charts are sorted by `order` field before rendering
- **Row Ordering:** `app/report/[slug]/ReportContent.tsx` line 149-156: `groupChartsIntoRows()` returns charts in a single row (no multi-row breaks), order preserved

**Code Paths:**
- `app/report/[slug]/page.tsx:118` - Block rendering order
- `app/report/[slug]/ReportContent.tsx:387` - Chart sorting by order
- `app/report/[slug]/ReportContent.tsx:149-156` - Row grouping (single row, order preserved)

**Conclusion:** Render order is deterministic. Blocks and charts are rendered in a stable order based on database `order` fields.

---

### 2. Data Calculation Timing Dependencies

**Finding:** ⚠️ **POTENTIAL RISKS IDENTIFIED**

#### 2.1 Chart Calculation Order

**Finding:** ✅ **DETERMINISTIC**

**Evidence:**
- `app/report/[slug]/page.tsx` line 161-266: `chartResults` calculated via `useMemo` with deterministic inputs (`stats`, `charts`)
- `lib/report-calculator.ts` line 210: Charts calculated in array iteration order: `for (const chart of charts)`
- Chart array order is deterministic (sorted by `order` field in database)

**Code Paths:**
- `app/report/[slug]/page.tsx:210` - Chart iteration order
- `lib/report-calculator.ts:210` - Calculation order

**Conclusion:** Chart calculation order is deterministic. Charts are calculated in the same order as they appear in the `charts` array.

#### 2.2 Async Data Fetching Race Conditions

**Finding:** ⚠️ **POTENTIAL RISK - LOW SEVERITY**

**Evidence:**
- `app/report/[slug]/page.tsx` lines 48-72: Three parallel data fetches:
  - `useReportData(slug)` - Project data + stats
  - `useReportLayoutForProject(slug)` - Report layout
  - `useReportStyle({ styleId, enabled })` - Style colors
- `app/report/[slug]/page.tsx` line 76-158: Chart configurations fetched in `useEffect` after `blocks` loaded
- All fetches use `cache: 'no-store'` which could cause timing variations

**Potential Issues:**
1. **Style Loading:** Style CSS variables injected asynchronously. If style loads after initial render, report may render with default colors first, then re-render with custom colors.
2. **Chart Fetching:** Chart configurations fetched after blocks load. If fetch completes in different order, chart calculation may use different chart array order (unlikely but possible).

**Code Paths:**
- `app/report/[slug]/page.tsx:48-72` - Parallel data fetches
- `app/report/[slug]/page.tsx:76-158` - Chart configuration fetch
- `hooks/useReportStyle.ts` - Style CSS variable injection

**Risk Assessment:**
- **Severity:** Low
- **Likelihood:** Low (React state updates are batched, order is stable)
- **Impact:** Visual styling may vary on first render, but final render is deterministic

**Conclusion:** Async data fetching has low risk of non-determinism. React state batching ensures final render is deterministic, but initial render may show default styles before custom styles load.

#### 2.3 Formula Engine Caching

**Finding:** ⚠️ **POTENTIAL RISK - VERY LOW SEVERITY**

**Evidence:**
- `lib/formulaEngine.ts` lines 29-39: Variables cache with `Date.now()` timestamp
- `lib/formulaEngine.ts` lines 112-122: Content assets cache with `Date.now()` timestamp
- Cache TTL: 5 minutes (`CACHE_TTL_MS = 5 * 60 * 1000`)

**Potential Issues:**
1. **Cache Invalidation Timing:** Cache validity checked via `Date.now() - timestamp < TTL`. If cache expires mid-render, formula evaluation may use stale or fresh data depending on timing.
2. **Cache Hit/Miss Order:** If multiple formula evaluations happen during cache expiration window, some may use cached data while others fetch fresh data.

**Code Paths:**
- `lib/formulaEngine.ts:36-39` - Cache validity check
- `lib/formulaEngine.ts:48-82` - Variables fetch with cache
- `lib/formulaEngine.ts:131-150` - Content assets fetch with cache

**Risk Assessment:**
- **Severity:** Very Low
- **Likelihood:** Very Low (5-minute TTL is long, cache expiration mid-render is rare)
- **Impact:** Formula results may differ if cache expires during calculation, but this is extremely rare

**Conclusion:** Formula engine caching has very low risk of non-determinism. Cache TTL is long (5 minutes), and expiration mid-render is extremely rare.

---

### 3. Non-Deterministic Effects

**Finding:** ✅ **NO CRITICAL RISKS IDENTIFIED**

#### 3.1 Random Numbers

**Evidence:**
- Searched codebase: No `Math.random()` calls in report rendering code
- No random number generation in chart calculations
- No random IDs or keys generated during render

**Conclusion:** No random number usage in report rendering.

#### 3.2 Timestamps

**Finding:** ⚠️ **MINOR RISK - DISPLAY ONLY**

**Evidence:**
- `app/report/[slug]/ReportHero.tsx` line 172: `const date = new Date(isoDate)` - Date formatting for display
- `lib/formulaEngine.ts` lines 32, 72, 115, 150: `Date.now()` used only for cache timestamps (not in calculations)
- No timestamps used in chart calculations or render order

**Potential Issues:**
1. **Date Display:** Event date formatted for display. If date parsing fails or timezone differs, display may vary (display-only, not calculation).

**Code Paths:**
- `app/report/[slug]/ReportHero.tsx:172` - Date formatting
- `lib/formulaEngine.ts:32, 72, 115, 150` - Cache timestamps (not in calculations)

**Risk Assessment:**
- **Severity:** Very Low
- **Likelihood:** Very Low (date parsing is deterministic)
- **Impact:** Display-only, does not affect calculations or render order

**Conclusion:** Timestamps used only for display and cache management. No impact on calculation determinism.

#### 3.3 Conditional Rendering Based on Timing

**Finding:** ⚠️ **POTENTIAL RISK - LOW SEVERITY**

**Evidence:**
- `app/report/[slug]/page.tsx` lines 288-324: Conditional rendering based on `loading` and `error` states
- `app/report/[slug]/ReportContent.tsx` lines 104-114: Conditional rendering for empty blocks
- `app/report/[slug]/ReportContent.tsx` lines 392-423: Charts filtered based on `hasValidChartData()` result

**Potential Issues:**
1. **Loading State:** If async fetches complete in different order, loading state may show different intermediate states (loading spinner vs content).
2. **Empty State:** If chart calculation fails or returns empty data, charts are filtered out. If calculation timing varies, different charts may be filtered on different renders.

**Code Paths:**
- `app/report/[slug]/page.tsx:288-324` - Loading/error conditional rendering
- `app/report/[slug]/ReportContent.tsx:392-423` - Chart filtering based on data validity

**Risk Assessment:**
- **Severity:** Low
- **Likelihood:** Low (React state updates are batched, final state is deterministic)
- **Impact:** Intermediate render states may vary, but final render is deterministic

**Conclusion:** Conditional rendering based on timing has low risk. React state batching ensures final render is deterministic, but intermediate states may vary.

#### 3.4 ResizeObserver Timing

**Finding:** ⚠️ **POTENTIAL RISK - LOW SEVERITY**

**Evidence:**
- `app/report/[slug]/ReportContent.tsx` lines 209-261: `ResizeObserver` used to measure row width
- `app/report/[slug]/ReportContent.tsx` lines 300-337: Height calculation triggered by width changes
- `app/report/[slug]/ReportChart.tsx` lines 439-493: Multiple `useEffect` hooks with ResizeObserver for chart measurements

**Potential Issues:**
1. **ResizeObserver Callback Timing:** ResizeObserver callbacks may fire at different times depending on browser rendering schedule. If width measurement happens at different times, height calculations may differ.
2. **Race Conditions:** Multiple ResizeObserver callbacks may fire in different order, causing height calculations to use different width values.

**Code Paths:**
- `app/report/[slug]/ReportContent.tsx:209-261` - Row width measurement
- `app/report/[slug]/ReportContent.tsx:300-337` - Height calculation on width change
- `app/report/[slug]/ReportChart.tsx:439-493` - Chart measurements

**Risk Assessment:**
- **Severity:** Low
- **Likelihood:** Low (ResizeObserver callbacks are batched by browser, final measurements are stable)
- **Impact:** Height calculations may vary slightly during initial render, but final render is stable

**Conclusion:** ResizeObserver timing has low risk. Browser batching ensures final measurements are stable, but initial render may show intermediate heights.

---

## Summary of Determinism Risks

| Risk Category | Severity | Likelihood | Impact | Status |
|--------------|----------|------------|--------|--------|
| Render Order Stability | None | N/A | None | ✅ Deterministic |
| Chart Calculation Order | None | N/A | None | ✅ Deterministic |
| Async Data Fetching Race Conditions | Low | Low | Visual styling may vary on first render | ⚠️ Low Risk |
| Formula Engine Caching | Very Low | Very Low | Formula results may differ if cache expires mid-render | ⚠️ Very Low Risk |
| Random Numbers | None | N/A | None | ✅ No Usage |
| Timestamps | Very Low | Very Low | Display-only, no calculation impact | ⚠️ Very Low Risk |
| Conditional Rendering Based on Timing | Low | Low | Intermediate render states may vary | ⚠️ Low Risk |
| ResizeObserver Timing | Low | Low | Height calculations may vary during initial render | ⚠️ Low Risk |

---

## Go / No-Go Recommendation

**Recommendation:** ✅ **NO-GO for Remediation (Low Priority)**

**Rationale:**
1. **No Critical Risks:** All identified risks are low or very low severity. No risks that cause calculation errors or render order instability.
2. **React Guarantees:** React state batching and component lifecycle ensure final render is deterministic, even if intermediate states vary.
3. **Layout Grammar Compliance:** Layout Grammar already ensures deterministic layout (no scrolling, truncation, clipping). Additional determinism guarantees are not required for correctness.
4. **Cost vs Benefit:** Remediation would require significant architectural changes (e.g., synchronous data fetching, deterministic ResizeObserver handling) with minimal benefit.

**Exceptions (If Remediation Needed):**
- If user reports show actual non-determinism in calculations or render order (not just visual styling)
- If export consistency requires stricter determinism guarantees (A-R-10 scope)
- If performance profiling reveals timing-dependent bottlenecks

---

## Remediation Options (If Needed)

### Option 1: Synchronous Data Fetching
**Approach:** Fetch all data synchronously before render
**Cost:** High (architectural change, performance impact)
**Benefit:** Eliminates async race conditions
**Recommendation:** Not recommended (performance impact outweighs benefit)

### Option 2: Deterministic ResizeObserver Handling
**Approach:** Use fixed measurements or debounce ResizeObserver callbacks
**Cost:** Medium (code changes, potential layout issues)
**Benefit:** Eliminates ResizeObserver timing variations
**Recommendation:** Not recommended (current behavior is stable)

### Option 3: Formula Engine Cache Synchronization
**Approach:** Pre-fetch and cache all variables/assets before calculation
**Cost:** Low (code changes, minimal performance impact)
**Benefit:** Eliminates cache expiration timing issues
**Recommendation:** Optional (very low risk, minimal benefit)

---

## Conclusion

**Investigation Complete:** Render determinism risks are **low to very low severity**. No critical risks identified that require immediate remediation.

**Key Findings:**
- ✅ Render order is deterministic (blocks/charts sorted by `order` field)
- ✅ Chart calculation order is deterministic (array iteration order)
- ⚠️ Async data fetching has low risk of visual styling variations on first render
- ⚠️ ResizeObserver timing has low risk of height calculation variations during initial render
- ✅ No random numbers, timestamps in calculations, or critical timing dependencies

**Recommendation:** **NO-GO for remediation** unless user reports show actual non-determinism or export consistency requires stricter guarantees (A-R-10 scope).

---

**Investigated By:** Tribeca  
**Date:** 2026-01-12T12:20:00.000Z  
**Status:** INVESTIGATION COMPLETE
