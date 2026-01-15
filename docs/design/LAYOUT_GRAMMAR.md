# Layout Grammar
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Version:** 1.0.1  
**Last Updated: 2026-01-11T22:28:38.000Z
**Status:** Active

---

## What Is Layout Grammar

Layout Grammar is a deterministic layout system for MessMass report rendering. It enforces structural fit rules that guarantee all content is visible without scrolling, truncation, or clipping.

**Core Principle:** Content must fit through structural change (reflow, aggregation, height increase, block split) or publishing is blocked. Scrolling and truncation are forbidden.

---

## What Layout Grammar Guarantees

### 1. No Scrolling
- All content is visible without vertical or horizontal scrolling
- No `overflow: scroll` or `overflow: auto` on content layers
- Content fits within allocated space or height increases

### 2. No Truncation
- No `text-overflow: ellipsis` or `line-clamp` on content
- No hidden text or data
- All content is fully readable

### 3. No Clipping
- No `overflow: hidden` on content layers
- Content is never visually cut off
- All elements are fully visible

### 4. Deterministic Height Resolution
Block height is resolved using a 4-priority algorithm:

**Priority 1: Intrinsic Media Authority**
- If a block contains image elements with `imageMode: 'setIntrinsic'`, block height is driven by the image's aspect ratio
- Formula: `height = blockWidth / aspectRatio`
- Multiple intrinsic images: use the maximum required height

**Priority 2: Block Aspect Ratio**
- If a block has a hard aspect ratio constraint (`isSoftConstraint: false`), height is calculated from the ratio
- Formula: `height = blockWidth / aspectRatio`

**Priority 3: Readability Enforcement**
- Default: height calculated from cell distribution and content requirements
- Ensures minimum readable font sizes and element spacing

**Priority 4: Structural Failure**
- Triggered when height cannot be resolved within constraints
- Requires block split or manual intervention
- Publishing is blocked

### 5. Unified Typography
- All elements in a block share the same base font size (`--block-base-font-size`)
- Exception: KPI values scale independently (explicit exemption)
- Typography scales proportionally to available space

### 5.1. Measured Height Standard (Text Safety)
**Standard Pattern for All Chart Types:**
All chart types must use measured height calculation to ensure text fits without overflow:

1. **Measure Container Height:** Use refs to measure actual rendered container height (`offsetHeight`)
2. **Calculate Allocated Space:** Based on fixed ratios (e.g., KPI: 4fr:3fr:3fr = 40%:30%:30%)
3. **Measure Actual Content Height:** Use `offsetHeight` to measure actual rendered content
4. **Reduce Font Size if Needed:** If `actualHeight > availableHeight`, calculate proportional font size reduction
5. **Apply with `!important`:** Use `style.setProperty('font-size', value, 'important')` to override CSS clamp() rules
6. **Dynamic Updates:** Use `ResizeObserver` + `MutationObserver` for responsive updates

**Why This Works:**
- Guaranteed height allocation (no competing flex containers)
- Measured actual vs. allocated space (deterministic)
- Font size reduction prevents overflow (Layout Grammar compliance)
- Works across all viewports (desktop + mobile)

**Anti-Pattern (Avoid):**
- ❌ Competing flex containers with `flex: 0 0 auto` on mobile
- ❌ Fixed flex percentages without measured heights
- ❌ CSS-only solutions that don't account for actual content height

### 6. Element-Specific Contracts

**Text Elements:**
- Always fit (scale to available space)
- No special constraints

**Table Elements:**
- Maximum 17 visible rows
- If >17 rows: requires Top-N + Other aggregation (no data loss)
- Aggregation must preserve totals

**Pie Elements:**
- Minimum pie radius: 50px (readable)
- Legend must fit (reflow allowed: side → bottom → multi-column)
- Small slices can be aggregated into "Other" (no data loss)

**Bar Elements:**
- Bars must fit (reflow allowed: vertical ↔ horizontal)
- Density reduction allowed (Top-N bars, no data loss)
- Minimum bar height: 20px per bar

**KPI Elements:**
- Always fit (compact)
- No special constraints

**Image Elements:**
- If `imageMode: 'setIntrinsic'`: drives block height (Priority 1)
- If `imageMode: 'cover'`: scales to fill container
- Aspect ratio preserved

### 7. Allowed Fit Mechanisms (In Order)

When content doesn't fit, the system applies mechanisms in this order:

1. **Reflow** (layout change)
   - Pie: legend position (side → bottom → multi-column)
   - Bar: orientation (vertical ↔ horizontal)

2. **Aggregation** (semantic density reduction)
   - Table: Top-N + Other (max 17 visible rows)
   - Pie: small slices → "Other"
   - Bar: Top-N bars only
   - **Rule:** No data loss; totals preserved

3. **Height Increase**
   - Block height increases to accommodate content
   - Subject to `maxAllowedHeight` constraint

4. **Block Split**
   - Block is split into multiple blocks
   - Required when height increase is not possible

5. **Publish Blocked**
   - If split is not possible or aggregation is semantically invalid
   - Editor prevents save/publish
   - Clear error message displayed

---

## What Layout Grammar Forbids

### 1. Scrolling
- ❌ `overflow: scroll`
- ❌ `overflow: auto`
- ❌ Any mechanism that requires scrolling to view content

### 2. Truncation
- ❌ `text-overflow: ellipsis`
- ❌ `line-clamp` (CSS)
- ❌ Any mechanism that hides text or data

### 3. Clipping
- ❌ `overflow: hidden` on content layers
- ❌ Any mechanism that visually cuts off content

### 4. Bypassing Validation
- ❌ Editor controls that bypass Layout Grammar validation
- ❌ Silent fallbacks that hide violations
- ❌ Optimistic layouts that don't match actual resolution

### 5. Data Loss
- ❌ Aggregation that loses data
- ❌ Truncation that hides rows/items
- ❌ Any mechanism that removes information

---

## Deterministic Failure Modes

### Priority 1 Failure: Intrinsic Media Constraint Violation
**Condition:** Intrinsic image height exceeds `maxAllowedHeight`  
**Result:**
- `priority: READABILITY_ENFORCEMENT`
- `canIncrease: false`
- `requiresSplit: true`
- Publishing blocked

**Required Action:** Split block or remove intrinsic media constraint

### Priority 2 Failure: Block Aspect Ratio Constraint Violation
**Condition:** Block aspect ratio height exceeds `maxAllowedHeight`  
**Result:**
- `priority: READABILITY_ENFORCEMENT`
- `canIncrease: false`
- `requiresSplit: true`
- Publishing blocked

**Required Action:** Split block or change aspect ratio to soft constraint

### Priority 3 Failure: Readability Constraint Violation
**Condition:** Calculated height exceeds `maxAllowedHeight`  
**Result:**
- `priority: READABILITY_ENFORCEMENT`
- `canIncrease: false`
- `requiresSplit: true`
- Publishing blocked

**Required Action:** Split block or increase `maxAllowedHeight`

### Priority 4 Failure: Structural Failure
**Condition:** Height cannot be resolved within constraints  
**Result:**
- `priority: STRUCTURAL_FAILURE`
- `canIncrease: false`
- `requiresSplit: true`
- Publishing blocked

**Required Action:** Manual intervention required (split block, remove constraints, or redesign layout)

### Element Fit Failures

**Table: Exceeds Max Rows**
- `fits: false`
- `requiredActions: ['aggregate']`
- Violation: `"Table has N rows, exceeds maximum of 17 visible rows"`
- **Action:** Apply Top-N + Other aggregation

**Pie: Insufficient Height**
- `fits: false`
- `requiredActions: ['increaseHeight']`
- Violation: `"Pie chart requires minimum height of 100px"`
- **Action:** Increase block height or reflow legend

**Bar: Insufficient Height**
- `fits: false`
- `requiredActions: ['reflow', 'increaseHeight']`
- Violation: `"Bar chart requires minimum height of Npx for M bars"`
- **Action:** Reflow orientation, reduce density, or increase height

**Invalid Aggregation**
- `publishBlocked: true`
- Reason: `"Table aggregation invalid for configuration"`
- **Action:** Split block or manually adjust table structure

---

## Implementation Modules

### Core Types
- **File:** `lib/layoutGrammar.ts`
- **Exports:** `HeightResolutionPriority`, `BlockHeightResolution`, `ElementFitValidation`, `CellConfiguration`, `HeightResolutionInput`

### Height Resolution Engine
- **File:** `lib/blockHeightCalculator.ts`
- **Function:** `resolveBlockHeightWithDetails(input: HeightResolutionInput): BlockHeightResolution`
- **Algorithm:** 4-priority height resolution (see above)

### Element Fit Validator
- **File:** `lib/elementFitValidator.ts`
- **Function:** `validateElementFit(cellConfig: CellConfiguration, containerHeight: number, containerWidth: number): ElementFitValidation`
- **Validates:** All element types (text, table, pie, bar, kpi, image)

### Editor Validation API
- **File:** `lib/editorValidationAPI.ts`
- **Functions:**
  - `validateBlockForEditor(block: EditorBlockInput, blockWidth: number): BlockValidationResult`
  - `validateBlocksForEditor(blocks: EditorBlockInput[], blockWidth: number): BlockValidationResult[]`
  - `checkPublishValidity(validationResults: BlockValidationResult[]): { canPublish: boolean; blockedBlocks: Array<{ blockId: string; reason: string }> }`

---

## Usage

### Validating a Block

```typescript
import { validateBlockForEditor } from '@/lib/editorValidationAPI';

const result = validateBlockForEditor({
  blockId: 'block1',
  cells: [
    {
      chartId: 'chart1',
      elementType: 'table',
      width: 2,
      contentMetadata: { rowCount: 25 }
    }
  ]
}, 1200);

if (result.publishBlocked) {
  console.error('Cannot publish:', result.publishBlockReason);
  console.log('Required actions:', result.requiredActions);
}
```

### Resolving Block Height

```typescript
import { resolveBlockHeightWithDetails } from '@/lib/blockHeightCalculator';
import { HeightResolutionPriority } from '@/lib/layoutGrammar';

const resolution = resolveBlockHeightWithDetails({
  blockId: 'block1',
  blockWidth: 1200,
  cells: [/* ... */]
});

console.log(`Height: ${resolution.heightPx}px`);
console.log(`Priority: ${HeightResolutionPriority[resolution.priority]}`);
console.log(`Reason: ${resolution.reason}`);
```

---

## CI Enforcement

Layout Grammar rules are enforced via CI guardrails:

- **Layout Grammar Guardrail:** Blocks `overflow`, `text-overflow`, `line-clamp` in report rendering files
- **Validation Test Suite:** Unit tests ensure deterministic behavior
- **Editor Integration:** Editor blocks save/publish when `publishBlocked: true`

---

## Migration

Existing reports can be analyzed for Layout Grammar compliance using:

```bash
npm run migrate:layout-grammar
```

This generates:
- `migration-report.json` (machine-readable)
- `migration-report.md` (human-readable)

The migration script identifies violations and required fixes without modifying data (read-only analysis).

---

## Summary

Layout Grammar ensures:
- ✅ All content is visible (no scroll, truncation, clipping)
- ✅ Height resolution is deterministic (4-priority algorithm)
- ✅ Typography is unified (shared base font size)
- ✅ Element contracts are enforced (table max 17 rows, pie min radius, etc.)
- ✅ Fit mechanisms are applied in order (reflow → aggregate → height increase → split → publish blocked)
- ✅ Publishing is blocked when structural failures cannot be resolved

Layout Grammar forbids:
- ❌ Scrolling (`overflow: scroll/auto`)
- ❌ Truncation (`text-overflow: ellipsis`, `line-clamp`)
- ❌ Clipping (`overflow: hidden` on content layers)
- ❌ Bypassing validation
- ❌ Data loss in aggregation

