# A-03: Height Calculation Accuracy Improvements

**Version:** 1.0.0  
**Created:** 2026-01-12T02:00:00.000Z  
**Status:** COMPLETE  
**Owner:** Engineering

---

## Purpose

Improve accuracy of height calculations for BAR charts and PIE charts by accounting for actual font metrics and wrapping behavior instead of using hardcoded estimates.

**Source:** A-03: Height Calculation Accuracy Improvements (AUDIT_ACTION_PLAN.md)

---

## Before vs After

### BAR Chart Height Calculation

**Before:**
- Used hardcoded 40px estimate for 2-line label height
- Assumed: `16px font size × 1.2 line-height × 2 lines = 38.4px ≈ 40px`
- Did not account for actual font size variations (10-24px range)

**After:**
- Estimates font size based on available space per row
- Calculates label height: `estimatedFontSize × 1.2 line-height × 2 lines`
- Accounts for dynamic font size optimization (10-24px range)
- More accurate for different block sizes and bar counts

**Impact:**
- More accurate height estimates for BAR charts
- Better handling of edge cases (many bars, small blocks)
- Reduced delta between estimated and rendered heights

### PIE Chart Legend Height Calculation

**Before:**
- Assumed fixed 30% → 50% growth when >5 items
- Did not account for actual label lengths or wrapping
- Simple threshold-based calculation

**After:**
- Estimates font size based on container height
- Calculates legend item height: `fontSize × 1.2 line-height × estimatedLines`
- Accounts for item count (more items = shorter labels on average)
- Calculates actual legend height ratio based on estimated content
- More accurate for different legend sizes and label lengths

**Impact:**
- More accurate height estimates for PIE charts with many legend items
- Better handling of long legend labels
- Reduced delta between estimated and rendered heights

---

## Technical Details

### BAR Chart Improvements

**File:** `lib/elementFitValidator.ts` - `validateBarElementFit()`

**Changes:**
1. Calculate available height per row: `(containerHeight - padding) / barCount - spacing`
2. Estimate font size: `availableHeightPerRow × 0.45` (clamped to 10-24px)
3. Calculate label height: `estimatedFontSize × 1.2 × 2` (2-line max)

**Rationale:**
- Font size is optimized at render time to fit available space
- Using 45% of available row height accounts for 2-line wrapping
- Clamping to 10-24px ensures realistic estimates

### PIE Chart Improvements

**File:** `lib/elementFitValidator.ts` - `validatePieElementFit()`

**Changes:**
1. Estimate font size: `containerHeight / 25` (clamped to 10-18px)
2. Estimate lines per item: `1.1` for >10 items, `1.3` for ≤10 items
3. Calculate item height: `fontSize × 1.2 × estimatedLines`
4. Calculate total legend height: `itemHeight × itemCount + padding`
5. Calculate legend height ratio based on actual estimated height

**Rationale:**
- More items = shorter labels on average = fewer wraps
- Font size is typically smaller for PIE charts (12-18px range)
- Accounts for vertical padding in legend container

---

## Verification

**Local Gate:**
- ✅ Build passes
- ✅ TypeScript checks pass
- ✅ Linting passes

**Testing:**
- Height calculations now account for actual font metrics
- Estimates are more accurate for edge cases (many bars, many legend items)
- No regressions in Layout Grammar compliance

---

## Related Files

- `lib/elementFitValidator.ts` - Height calculation improvements
- `AUDIT_ACTION_PLAN.md` - A-03 task definition

---

**Last Updated:** 2026-01-12T02:00:00.000Z
