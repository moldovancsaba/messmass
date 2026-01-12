# A-04: Typography Scaling Edge Cases

**Date:** 2026-01-12T07:28:00.000Z  
**Status:** Implementation Complete  
**Investigator:** Tribeca  
**Reference:** `AUDIT_ACTION_PLAN.md` A-04

---

## Objective

Handle edge cases in typography scaling:
- Very long titles (200+ characters)
- Extreme aspect ratios (very narrow < 400px, very wide > 2000px)
- Improve BAR chart font size algorithm accuracy (reduce mismatch between estimated and rendered width)

---

## Implementation Summary

### 1. Enhanced `calculateSyncedFontSizes()` Edge Case Handling

**File:** `lib/fontSyncCalculator.ts`

**Changes:**

1. **Improved Character Width Estimation:**
   - Variable character width multiplier based on font size
   - Small fonts (<12px): 0.5em per character (tighter)
   - Normal fonts (12-20px): 0.6em per character
   - Large fonts (>20px): 0.65em per character (looser)
   - Accounts for word boundaries and spacing

2. **Very Long Title Handling:**
   - Adjusted minimum font size for titles >200 characters
   - Allows font size down to 8px (instead of 10px) for extremely long titles
   - Prevents font size collapse while maintaining readability

3. **Extreme Aspect Ratio Handling:**
   - **Very Narrow Blocks (< 400px):**
     - Uses full width minus padding (minimum 200px) for font calculation
     - Prevents font size collapse in narrow viewports
   - **Very Wide Blocks (> 2000px):**
     - Caps container width at 1000px per cell
     - Prevents excessive font sizes in ultra-wide viewports

4. **Improved Container Width Calculation:**
   - Adaptive calculation based on block width
   - Bounds checking to prevent edge case failures
   - Minimum container width of 200px enforced

**Code Changes:**
```typescript
// Before: Fixed character width estimate
const charsPerLine = Math.max(1, Math.floor((containerWidthPx / (fontPx * 0.55))));

// After: Variable character width based on font size
const charWidthMultiplier = fontPx < 12 ? 0.5 : fontPx > 20 ? 0.65 : 0.6;
const charsPerLine = Math.max(1, Math.floor(containerWidthPx / (fontPx * charWidthMultiplier)));
```

### 2. Improved BAR Chart Font Size Algorithm Accuracy

**File:** `lib/barChartFontSizeCalculator.ts`

**Changes:**

1. **Improved Character Width Estimation:**
   - Variable character width multiplier (same as font sync calculator)
   - Accounts for word boundaries and longest word checking
   - More accurate line count estimation

2. **Improved Label Width Calculation:**
   - Accounts for table cell padding (left: 8px, right: 16px = 24px total)
   - More accurate actual text width calculation
   - Reduces mismatch between estimated and rendered width

**Code Changes:**
```typescript
// Before: Simple 40% calculation
const labelWidth = tableWidth * 0.4;

// After: Account for cell padding
const labelCellPadding = 24; // 8px (left) + 16px (right)
const labelWidth = (tableWidth * 0.4) - labelCellPadding;
```

---

## Regression Harness

**File:** `__tests__/typography-edge-cases.test.ts`

**Test Cases:**

1. **Edge Case 1: Very Long Title (200+ characters)**
   - Verifies font size doesn't collapse below 8px
   - Tests with 250-character title

2. **Edge Case 2: Very Narrow Block (200px)**
   - Verifies font size calculation with minimum container width (200px)
   - Tests narrow viewport handling

3. **Edge Case 3: Very Wide Block (3000px)**
   - Verifies container width capping at 1000px
   - Tests ultra-wide viewport handling

4. **Edge Case 4: BAR Chart - Very Long Label with Narrow Width**
   - Verifies BAR chart font size calculation with long labels
   - Tests wrapping behavior

5. **Edge Case 5: Mixed Edge Cases**
   - Tests combination of long title, narrow block, and BAR charts
   - Verifies all edge case handlers work together

6. **Edge Case 6: Extreme Aspect Ratio - Very Tall Block**
   - Tests very tall blocks (narrow width)
   - Verifies width-based calculation still works

7. **Edge Case 7: BAR Chart - Character Width Estimation Accuracy**
   - Tests improved character width estimation
   - Verifies variable multiplier works correctly

**Test Results:**
- ✅ All 7 test cases pass
- ✅ No regressions introduced
- ✅ Edge cases handled correctly

---

## Verification

### Before vs After Behavior

**Before:**
- Fixed character width estimate (0.55em) didn't account for font size variations
- Very long titles could cause font size collapse
- Extreme aspect ratios (very narrow/wide) not handled
- BAR chart label width calculation didn't account for padding

**After:**
- Variable character width estimate based on font size
- Very long titles handled with adjusted minimum (8px)
- Extreme aspect ratios handled with adaptive container width
- BAR chart label width calculation accounts for cell padding

### Expected Outcomes

1. **Very Long Titles:**
   - Font size: 8-28px (adjusted minimum for very long titles)
   - No font size collapse
   - Maintains readability

2. **Very Narrow Blocks (< 400px):**
   - Uses minimum container width (200px) for calculation
   - Font size: 10-28px
   - No font size collapse

3. **Very Wide Blocks (> 2000px):**
   - Caps container width at 1000px per cell
   - Font size: 10-28px
   - No excessive font sizes

4. **BAR Chart Labels:**
   - More accurate width estimation (accounts for padding)
   - Better character width estimation (variable multiplier)
   - Reduced mismatch between estimated and rendered width

---

## Files Modified

1. `lib/fontSyncCalculator.ts`
   - Enhanced `estimateFits()` with variable character width multiplier
   - Enhanced `binarySearchFont()` with edge case handling
   - Enhanced `calculateSyncedFontSizes()` with adaptive container width

2. `lib/barChartFontSizeCalculator.ts`
   - Enhanced `estimateLines()` with variable character width multiplier
   - Enhanced `calculateBlockFontSizeForBarCharts()` with improved label width calculation

3. `__tests__/typography-edge-cases.test.ts` (new)
   - Regression harness with 7 test cases
   - Covers all identified edge cases

---

## Commits

- Implementation: Edge case handling improvements
- Documentation: A-04 edge case fixes and verification
- Tests: Regression harness with 7 test cases

---

## Status

✅ **DONE** - All edge cases handled, regression harness created, tests passing

---

## Notes

- Edge case handling is conservative (maintains readability)
- Character width estimation is still heuristic-based (not pixel-perfect)
- Further improvements could use actual DOM measurement for perfect accuracy (future optimization)
