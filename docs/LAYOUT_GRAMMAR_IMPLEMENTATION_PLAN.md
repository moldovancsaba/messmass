# Layout Grammar Implementation Plan
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Operations

**Version:** 1.0.1  
**Created:** 2025-01-XX  
**Status:** Ready for Execution  
**Authority:** Based on DESIGN_SYSTEM_PLAN.md Section 0 (Structural Fit & Typography Enforcement Policy)

**⚠️ SECURITY & AUDIT COMPLIANCE:** This plan incorporates findings from:
- COMPREHENSIVE_CRITICAL_AUDIT.md (412+ vulnerabilities)
- SECURITY_TEAM_REVIEW.md (10 critical security issues)
- CTO_REMEDIATION_PLAN.md (zero-downtime migration strategy)
- SYSTEM_AUDIT_2025.md (architectural issues)

---

## Executive Summary

This document provides a detailed, actionable plan to refactor/rebuild the MessMass report layout system into a proper "layout grammar" that enforces the Structural Fit & Typography Policy. The plan is broken down into phases, tasks, dependencies, and acceptance criteria.

**Goal:** Transform the current ad-hoc layout system into a deterministic, predictable layout grammar where:
- No scrolling or truncation is allowed
- Block height is elastic and resolves deterministically
- Unified typography (`--block-base-font-size`) applies to all elements except KPI values
- Content always fits through structural change or height increase
- **Security hardened** (XSS prevention, input validation, CSP)
- **Future-proof** (design tokens, type safety, test coverage)
- **Maintainable** (no inline styles, no hardcoded values, no deprecated code)

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Audit Findings Integration](#audit-findings-integration) ⚠️ **CRITICAL**
3. [Security Requirements](#security-requirements) ⚠️ **CRITICAL**
4. [Implementation Phases](#implementation-phases)
5. [Phase 0: Security Hardening Prerequisites](#phase-0-security-hardening-prerequisites) ⚠️ **MUST COMPLETE FIRST**
6. [Phase 1: Foundation & Core Infrastructure](#phase-1-foundation--core-infrastructure)
7. [Phase 2: Height Resolution System](#phase-2-height-resolution-system)
8. [Phase 3: Unified Typography System](#phase-3-unified-typography-system)
9. [Phase 4: Element-Specific Enforcement](#phase-4-element-specific-enforcement)
10. [Phase 5: Editor Integration](#phase-5-editor-integration)
11. [Phase 6: Migration & Validation](#phase-6-migration--validation)
12. [Testing Strategy](#testing-strategy)
13. [Security Validation](#security-validation) ⚠️ **CRITICAL**
14. [Rollout Plan](#rollout-plan)

---

## Current State Analysis

### Existing Systems to Preserve

1. **Report Layout Spec v2.0** (`docs/design/LAYOUT_SYSTEM.md`)
   - Block-based layout system
   - Cell width model (1-unit, 2-unit)
   - Cell structure (Title/Subtitle/Body zones)
   - Height calculation (`blockHeightCalculator.ts`)

2. **Font Sync Calculator** (`lib/fontSyncCalculator.ts`)
   - Synchronized title/subtitle font sizes
   - Binary search for optimal sizes

3. **Unified Text Font Size** (`hooks/useUnifiedTextFontSize.ts`)
   - Block-level font-size calculation for text charts
   - Container measurement and optimization

4. **Chart Rendering** (`app/report/[slug]/ReportChart.tsx`)
   - Type-specific chart components
   - CellWrapper integration

### Issues to Fix

#### Layout Grammar Issues

1. **Scrolling/Truncation Violations:**
   - Text charts: `overflow-y: auto` ❌
   - Pie legends: Potential overflow ❌
   - Tables: No row limit enforcement ❌

2. **Height Resolution:**
   - No explicit priority chain
   - No intrinsic media authority
   - No readability enforcement

3. **Typography:**
   - No unified `--block-base-font-size`
   - KPI values scale independently (correct)
   - Other elements don't participate in unified system

4. **Editor Validation:**
   - No height resolution validation
   - No "content doesn't fit" warnings
   - No Block split suggestions

#### Security Issues (From Audits) ⚠️ **CRITICAL**

5. **XSS Vulnerabilities:**
   - 6 instances of `dangerouslySetInnerHTML` without proper sanitization
   - No Content Security Policy (CSP) headers
   - Markdown rendering may allow script injection

6. **Input Validation:**
   - No validation on height resolution inputs
   - No validation on typography calculations
   - No validation on block configurations

7. **Code Injection Risks:**
   - Formula evaluation may use unsafe patterns
   - Dynamic content rendering without validation

#### Architectural Issues (From Audits)

8. **Design System Bypassed:**
   - 87+ files with inline styles ❌
   - 200+ files with hardcoded values ❌
   - Design tokens ignored

9. **Deprecated Code:**
   - DynamicChart.tsx still imported in 3+ files
   - Dual chart systems causing confusion

10. **Type Safety:**
    - 56+ instances of TypeScript `any` types
    - No proper interfaces for layout grammar types

#### Testing & Quality Issues

11. **Zero Test Coverage:**
    - No unit tests for layout grammar
    - No integration tests
    - No visual regression tests

12. **Code Quality:**
    - ESLint disabled during builds
    - Console.log statements in production code

---

## Implementation Phases

### Overview

```
Phase 1: Foundation & Core Infrastructure (Week 1-2)
  ↓
Phase 2: Height Resolution System (Week 2-3)
  ↓
Phase 3: Unified Typography System (Week 3-4)
  ↓
Phase 4: Element-Specific Enforcement (Week 4-5)
  ↓
Phase 5: Editor Integration (Week 5-6)
  ↓
Phase 6: Migration & Validation (Week 6-7)
```

**Total Timeline:** 6-7 weeks  
**Critical Path:** Phases 1 → 2 → 3 (must be sequential)

---

## Phase 1: Foundation & Core Infrastructure

**Duration:** 1-2 weeks  
**Dependencies:** None  
**Goal:** Create core infrastructure for layout grammar

### Task 1.1: Create Layout Grammar Core Module

**File:** `lib/layoutGrammar.ts`

**What:**
- Core types and interfaces for layout grammar
- Block height resolution types
- Element fit validation types
- **SECURITY:** All types must be type-safe (no `any`)

**Code Structure:**
```typescript
// Block height resolution priorities
export enum HeightResolutionPriority {
  INTRINSIC_MEDIA = 1,
  BLOCK_ASPECT_RATIO = 2,
  READABILITY_ENFORCEMENT = 3,
  STRUCTURAL_FAILURE = 4
}

// Block height resolution result
export interface BlockHeightResolution {
  height: number; // Must be positive, validated
  priority: HeightResolutionPriority;
  reason: string; // Sanitized, no user input
  canIncrease: boolean;
  requiresSplit: boolean;
  securityFlags?: SecurityFlags; // NEW: Security validation
}

// Element fit validation
export interface ElementFitValidation {
  fits: boolean;
  requiredHeight?: number; // Must be positive, validated
  minFontSize?: number; // Must be positive, validated
  currentFontSize?: number; // Must be positive, validated
  violations: string[]; // Sanitized error messages
  securityWarnings?: string[]; // NEW: Security warnings
}

// Block typography contract
export interface BlockTypography {
  baseFontSize: number; // --block-base-font-size, validated range
  kpiValueFontSize?: number; // Independent scaling, validated range
}

// NEW: Security flags for validation
export interface SecurityFlags {
  inputValidated: boolean;
  sanitizationApplied: boolean;
  cspCompliant: boolean;
}
```

**Security Requirements:**
- All numeric inputs validated (positive, within ranges)
- All string inputs sanitized
- No `any` types allowed
- Runtime validation where needed

**Acceptance Criteria:**
- [ ] All types defined and exported
- [ ] TypeScript compilation passes with strict mode
- [ ] Types match policy requirements
- [ ] No `any` types
- [ ] Input validation interfaces included
- [ ] Security flags included

---

### Task 1.2: Create Height Resolution Engine

**File:** `lib/heightResolutionEngine.ts`

**What:**
- Implements 4-priority height resolution algorithm
- Handles intrinsic media authority
- Handles block aspect ratio
- Handles readability enforcement
- Handles structural failure

**Functions:**
```typescript
export function resolveBlockHeight(
  block: BlockConfiguration,
  cells: CellConfiguration[],
  availableWidth: number,
  constraints?: HeightConstraints
): BlockHeightResolution

export function checkIntrinsicMedia(cells: CellConfiguration[]): ImageIntrinsic | null

export function calculateFromAspectRatio(
  width: number,
  aspectRatio?: string
): number

export function enforceReadability(
  cells: CellConfiguration[],
  currentHeight: number,
  minFontSizes: Record<string, number>
): number | null
```

**Acceptance Criteria:**
- [ ] Priority 1 (Intrinsic Media) works correctly
- [ ] Priority 2 (Aspect Ratio) works correctly
- [ ] Priority 3 (Readability) works correctly
- [ ] Priority 4 (Structural Failure) returns appropriate errors
- [ ] Unit tests for each priority
- [ ] Edge cases handled (no media, no ratio, etc.)

---

### Task 1.3: Create Element Fit Validator

**File:** `lib/elementFitValidator.ts`

**What:**
- Validates if element content fits in allocated space
- Checks against minimum font sizes
- Returns required height if doesn't fit

**Functions:**
```typescript
export function validateTextElementFit(
  content: string,
  containerWidth: number,
  containerHeight: number,
  minFontSize: number,
  currentFontSize: number
): ElementFitValidation

export function validateTableElementFit(
  rows: number,
  containerWidth: number,
  containerHeight: number,
  minRowHeight: number
): ElementFitValidation

export function validatePieElementFit(
  legendItems: number,
  containerWidth: number,
  containerHeight: number,
  minPieRadius: number
): ElementFitValidation

export function validateBarElementFit(
  bars: number,
  containerWidth: number,
  containerHeight: number,
  orientation: 'vertical' | 'horizontal'
): ElementFitValidation
```

**Acceptance Criteria:**
- [ ] All element types validated
- [ ] Returns accurate required heights
- [ ] Handles edge cases (empty content, etc.)
- [ ] Unit tests for each element type

---

### Task 1.4: Remove All Scrolling/Truncation Code

**Files to Update:**
- `app/report/[slug]/ReportChart.module.css`
- `app/report/[slug]/ReportChart.tsx`
- All chart-specific CSS files

**What:**
- Remove `overflow: auto`, `overflow: scroll`
- Remove `overflow-y: auto`
- Remove `text-overflow: ellipsis`
- Remove `line-clamp` (except for titles with max 2 lines)
- Remove `overflow: hidden` that hides content
- **SECURITY:** Ensure no hidden content that could contain XSS payloads

**Search Patterns:**
```bash
# Find all overflow usage
grep -r "overflow" app/report
grep -r "text-overflow" app/report
grep -r "line-clamp" app/report
```

**Security Considerations:**
- Hidden overflow can mask XSS attacks
- Ensure all content is visible or properly sanitized
- No content hidden that could bypass validation

**Acceptance Criteria:**
- [ ] No `overflow: auto` or `overflow: scroll` in chart CSS
- [ ] No `text-overflow: ellipsis` except in allowed cases
- [ ] No `line-clamp` except for title max 2 lines
- [ ] No hidden content that could contain XSS
- [ ] All changes documented
- [ ] Security review passed

---

## Phase 2: Height Resolution System

**Duration:** 1 week  
**Dependencies:** Phase 1 complete  
**Goal:** Implement deterministic block height resolution

### Task 2.1: Integrate Height Resolution into Block Calculator

**File:** `lib/blockHeightCalculator.ts`

**What:**
- Replace current height calculation with new resolution engine
- Implement priority chain
- Handle intrinsic media authority
- Handle aspect ratio
- Handle readability enforcement

**Changes:**
```typescript
// Current function signature
export function solveBlockHeightWithImages(
  cells: CellConfiguration[],
  width: number
): number

// New implementation
export function solveBlockHeightWithImages(
  cells: CellConfiguration[],
  width: number,
  blockAspectRatio?: string,
  constraints?: HeightConstraints
): BlockHeightResolution
```

**Acceptance Criteria:**
- [ ] Priority 1 (Intrinsic Media) takes precedence
- [ ] Priority 2 (Aspect Ratio) works when no intrinsic media
- [ ] Priority 3 (Readability) increases height when needed
- [ ] Priority 4 (Structural Failure) returns appropriate errors
- [ ] Backward compatible (returns number for existing code)
- [ ] New API available for editor

---

### Task 2.2: Update ReportContent to Use New Resolution

**File:** `app/report/[slug]/ReportContent.tsx`

**What:**
- Use new height resolution engine
- Handle resolution results (height increase, split required)
- Apply resolved heights to blocks

**Changes:**
```typescript
// In ReportBlock component
const heightResolution = resolveBlockHeight(
  block,
  validCharts.map(c => ({
    chartId: c.chartId,
    cellWidth: c.width,
    bodyType: chartResults.get(c.chartId)?.type,
    // ... other config
  })),
  rowWidth,
  {
    maxHeight: block.maxHeight,
    minHeight: block.minHeight
  }
);

if (heightResolution.requiresSplit) {
  // Show split suggestion or error
}

// Apply resolved height
const blockHeight = heightResolution.height;
```

**Acceptance Criteria:**
- [ ] Blocks use resolved heights
- [ ] Height increases when content doesn't fit
- [ ] Split suggestions shown when needed
- [ ] No visual regressions

---

### Task 2.3: Implement Intrinsic Media Authority

**File:** `lib/heightResolutionEngine.ts` (extend)

**What:**
- Detect image elements with `setIntrinsic` mode
- Calculate height from image aspect ratio
- Apply to entire block
- Handle multiple images (use largest)

**Logic:**
```typescript
function checkIntrinsicMedia(cells: CellConfiguration[]): ImageIntrinsic | null {
  const intrinsicImages = cells
    .filter(c => c.bodyType === 'image' && c.imageMode === 'setIntrinsic')
    .map(c => ({
      aspectRatio: c.aspectRatio,
      width: c.cellWidth,
      // Calculate height from aspect ratio
    }))
    .sort((a, b) => b.height - a.height); // Largest first
  
  return intrinsicImages[0] || null;
}
```

**Acceptance Criteria:**
- [ ] Intrinsic images govern block height
- [ ] All cells stretch to match
- [ ] Typography scales within that height
- [ ] Height increases if typography doesn't fit at minimum

---

## Phase 3: Unified Typography System

**Duration:** 1 week  
**Dependencies:** Phase 2 complete  
**Goal:** Implement `--block-base-font-size` for all elements except KPI values

### Task 3.1: Create Block Typography Calculator

**File:** `lib/blockTypographyCalculator.ts`

**What:**
- Calculate `--block-base-font-size` for a block
- Consider all elements (text, labels, legends, tables)
- Exclude KPI values
- Ensure all content fits at calculated size

**Functions:**
```typescript
export function calculateBlockBaseFontSize(
  block: BlockConfiguration,
  cells: CellConfiguration[],
  blockHeight: number,
  blockWidth: number,
  chartResults: Map<string, ChartResult>
): BlockTypography

export function calculateOptimalFontSizeForElement(
  element: ElementConfiguration,
  containerWidth: number,
  containerHeight: number,
  minFontSize: number,
  maxFontSize: number
): number
```

**Algorithm:**
1. For each cell in block:
   - Calculate optimal font-size for each element type
   - Text: Use existing unified text font-size logic
   - Labels: Calculate based on label length and container
   - Legends: Calculate based on legend items and container
   - Tables: Calculate based on cell content and container
2. Find minimum of all optimal sizes
3. Apply as `--block-base-font-size`

**Acceptance Criteria:**
- [ ] Single font-size calculated per block
- [ ] All elements (except KPI values) use this size
- [ ] Content fits at calculated size
- [ ] Minimum font-size enforced
- [ ] Unit tests

---

### Task 3.2: Apply Unified Typography via CSS Custom Property

**File:** `app/report/[slug]/ReportContent.tsx`

**What:**
- Calculate block typography
- Apply `--block-base-font-size` CSS custom property
- Ensure all elements inherit/use this value

**Changes:**
```typescript
// In ReportBlock component
const blockTypography = calculateBlockBaseFontSize(
  block,
  validCharts.map(/* ... */),
  blockHeight,
  rowWidth,
  chartResults
);

// Apply to block container
<div
  style={{
    '--block-base-font-size': `${blockTypography.baseFontSize}rem`,
    // ... other styles
  }}
>
```

**Acceptance Criteria:**
- [ ] CSS custom property applied to block
- [ ] All elements (except KPI values) use this size
- [ ] KPI values scale independently
- [ ] Visual consistency across block

---

### Task 3.3: Update CSS to Use Unified Typography

**File:** `app/report/[slug]/ReportChart.module.css`

**What:**
- Update all font-size declarations to use `--block-base-font-size`
- Remove individual font-size calculations
- Ensure KPI values remain independent

**Changes:**
```css
/* Text charts */
.textContent {
  font-size: var(--block-base-font-size, 1rem) !important;
}

/* Chart labels */
.barLabel {
  font-size: var(--block-base-font-size, 1rem) !important;
}

/* Pie legends */
.pieLegendText {
  font-size: var(--block-base-font-size, 1rem) !important;
}

/* Table cells */
.tableMarkdown td {
  font-size: var(--block-base-font-size, 1rem) !important;
}

/* KPI value (EXEMPT) */
.kpiValue {
  font-size: var(--kpi-value-font-size, clamp(...)) !important;
  /* Independent scaling */
}
```

**Acceptance Criteria:**
- [ ] All elements use `--block-base-font-size`
- [ ] KPI values remain independent
- [ ] Fallback values provided
- [ ] No visual regressions

---

## Phase 4: Element-Specific Enforcement

**Duration:** 1 week  
**Dependencies:** Phase 3 complete  
**Goal:** Ensure each element type fits without scrolling/truncation

### Task 4.1: Text Element Enforcement

**Files:**
- `lib/elementFitValidator.ts`
- `app/report/[slug]/ReportChart.tsx`

**What:**
- Validate text fits at current font-size
- If not, increase block height
- If height can't increase, require block split

**Implementation:**
```typescript
// In height resolution
const textValidation = validateTextElementFit(
  textContent,
  cellWidth,
  cellHeight,
  MIN_FONT_SIZE,
  blockTypography.baseFontSize
);

if (!textValidation.fits) {
  // Increase block height
  if (textValidation.requiredHeight) {
    blockHeight = Math.max(blockHeight, textValidation.requiredHeight);
  }
}
```

**Acceptance Criteria:**
- [ ] Text always fits
- [ ] Block height increases when needed
- [ ] Split required when height can't increase
- [ ] No truncation or scrolling

---

### Task 4.2: Table Element Enforcement

**Files:**
- `lib/elementFitValidator.ts`
- `app/report/[slug]/ReportChart.tsx`

**What:**
- Validate table fits with all required rows
- If not, increase block height
- If height can't increase, require block split
- Enforce row count limits

**Implementation:**
```typescript
// Calculate max rows that fit
const maxRows = Math.floor(
  (containerHeight - headerHeight) / minRowHeight
);

if (requiredRows > maxRows) {
  // Increase block height or split
  const requiredHeight = headerHeight + (requiredRows * minRowHeight);
  // ...
}
```

**Acceptance Criteria:**
- [ ] Tables always fit fully
- [ ] Row count bounded by available height
- [ ] Block height increases when needed
- [ ] Split required when height can't increase
- [ ] No scrolling

---

### Task 4.3: Pie Element Enforcement

**Files:**
- `lib/elementFitValidator.ts`
- `app/report/[slug]/ReportChart.tsx`

**What:**
- Validate pie chart and legend fit
- Minimum pie radius enforced
- Legend must fit without scroll
- Reflow legend position if needed
- Aggregate to Top-N if needed

**Implementation:**
```typescript
// Check if legend fits
const legendValidation = validatePieLegendFit(
  legendItems,
  containerWidth,
  containerHeight,
  minPieRadius
);

if (!legendValidation.fits) {
  // Try reflow (horizontal to vertical)
  // Or aggregate to Top-N + Other
  // Or increase block height
}
```

**Acceptance Criteria:**
- [ ] Pie radius has minimum
- [ ] Legends fit without scroll
- [ ] Reflow works when needed
- [ ] Aggregation works when needed
- [ ] Block height increases when needed

---

### Task 4.4: Bar Element Enforcement

**Files:**
- `lib/elementFitValidator.ts`
- `app/report/[slug]/ReportChart.tsx`

**What:**
- Validate bars fit in orientation
- Change orientation if needed (vertical ↔ horizontal)
- Reduce label density if needed
- Increase block height if needed

**Acceptance Criteria:**
- [ ] Bars always fit
- [ ] Orientation changes when needed
- [ ] Label density reduces when needed
- [ ] Block height increases when needed
- [ ] No scrolling or truncation

---

## Phase 5: Editor Integration

**Duration:** 1 week  
**Dependencies:** Phase 4 complete  
**Goal:** Editor validates and enforces layout grammar

### Task 5.1: Create Editor Validation API

**File:** `lib/editorValidation.ts`

**What:**
- Validate block configurations
- Check if content fits
- Return clear error messages
- Suggest fixes (height increase, split)

**Functions:**
```typescript
export function validateBlockConfiguration(
  block: BlockConfiguration,
  cells: CellConfiguration[],
  chartResults: Map<string, ChartResult>,
  constraints: HeightConstraints
): ValidationResult

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: Suggestion[];
}

export interface ValidationError {
  type: 'content_doesnt_fit' | 'height_constraint_violated' | 'conflicting_intrinsic';
  message: string;
  element?: string;
  requiredAction: 'increase_height' | 'split_block' | 'reduce_content';
}
```

**Acceptance Criteria:**
- [ ] All validation rules implemented
- [ ] Clear error messages
- [ ] Actionable suggestions
- [ ] Unit tests

---

### Task 5.2: Integrate Validation into Chart Builder

**Files:**
- `components/ChartAlgorithmManager.tsx`
- `components/BuilderMode.tsx`

**What:**
- Validate blocks on save
- Show errors in UI
- Prevent saving invalid configurations
- Show height resolution preview

**UI Changes:**
- Add validation error display
- Add height resolution preview
- Add "Split Block" button when needed
- Add "Increase Height" button when possible

**Acceptance Criteria:**
- [ ] Validation runs on save
- [ ] Errors displayed clearly
- [ ] Invalid blocks can't be saved
- [ ] Height preview shows actual resolved height
- [ ] Split/increase actions available

---

### Task 5.3: Add Block Configuration Controls

**Files:**
- `components/BlockEditor.tsx` (new or existing)

**What:**
- Block aspect ratio selector
- Maximum block height constraint
- Image mode selector (cover / setIntrinsic)
- Height resolution preview

**UI Elements:**
- Aspect ratio dropdown (optional)
- Max height input (optional)
- Image mode toggle per cell
- Live height preview

**Acceptance Criteria:**
- [ ] All controls available
- [ ] Changes reflected in preview
- [ ] Validation runs on change
- [ ] Clear labels and help text

---

## Phase 6: Migration & Validation

**Duration:** 1 week  
**Dependencies:** All phases complete  
**Goal:** Migrate existing reports and validate system

### Task 6.1: Create Migration Script

**File:** `scripts/migrate-reports-to-layout-grammar.ts`

**What:**
- Validate all existing report configurations
- Fix violations (remove scrolling, adjust heights)
- Update font-size calculations
- Generate migration report

**Process:**
1. Load all report configurations
2. Validate each block
3. Fix violations:
   - Remove overflow properties
   - Recalculate heights
   - Update typography
4. Generate report of changes

**Acceptance Criteria:**
- [ ] All reports validated
- [ ] Violations fixed
- [ ] Migration report generated
- [ ] No data loss

---

### Task 6.2: Create Validation Test Suite

**File:** `tests/layout-grammar.test.ts`

**What:**
- Test height resolution priorities
- Test element fit validation
- Test unified typography
- Test editor validation
- Test edge cases

**Test Cases:**
- Intrinsic media authority
- Aspect ratio calculation
- Readability enforcement
- Structural failure handling
- Text element fitting
- Table element fitting
- Pie element fitting
- Bar element fitting
- Unified typography calculation
- Editor validation

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Edge cases covered
- [ ] Performance acceptable
- [ ] Coverage > 80%

---

### Task 6.3: Update Documentation

**Files:**
- `DESIGN_SYSTEM_PLAN.md` (update)
- `docs/design/LAYOUT_SYSTEM.md` (update)
- Create `docs/LAYOUT_GRAMMAR.md` (new)

**What:**
- Document layout grammar rules
- Document height resolution algorithm
- Document unified typography
- Document element-specific rules
- Document editor validation
- Provide examples

**Acceptance Criteria:**
- [ ] All rules documented
- [ ] Examples provided
- [ ] API documented
- [ ] Migration guide included

---

## Testing Strategy

### Unit Tests

**Coverage Required:**
- Height resolution engine: 100%
- Element fit validator: 100%
- Block typography calculator: 100%
- Editor validation: 100%

**Test Files:**
- `tests/heightResolutionEngine.test.ts`
- `tests/elementFitValidator.test.ts`
- `tests/blockTypographyCalculator.test.ts`
- `tests/editorValidation.test.ts`

### Integration Tests

**Test Scenarios:**
1. Block with intrinsic image
2. Block with aspect ratio
3. Block with text that doesn't fit
4. Block with table that doesn't fit
5. Block with pie chart and legend
6. Block with multiple chart types
7. Editor validation flow
8. Height increase flow
9. Block split flow

### Visual Regression Tests

**Tools:**
- Playwright or Cypress
- Screenshot comparison

**Test Cases:**
- All chart types render correctly
- Heights resolve correctly
- Typography is unified
- No scrolling/truncation
- Mobile responsiveness

---

## Rollout Plan

### Stage 1: Internal Testing (Week 7)

- Deploy to staging environment
- Test with sample reports
- Fix any issues
- Validate all test cases pass

### Stage 2: Beta Testing (Week 8)

- Enable for select users
- Monitor for issues
- Collect feedback
- Iterate on fixes

### Stage 3: Gradual Rollout (Week 9-10)

- 10% of reports → 50% → 100%
- Monitor error rates
- Monitor performance
- Rollback plan ready

### Stage 4: Full Production (Week 11)

- All reports migrated
- All features enabled
- Documentation complete
- Team trained

---

## Success Criteria

### Functional

- [ ] No scrolling in any chart type
- [ ] No truncation in any chart type
- [ ] Block height resolves deterministically
- [ ] Unified typography works correctly
- [ ] All elements fit without violations
- [ ] Editor validates correctly
- [ ] Height increases when needed
- [ ] Block splits when needed

### Security ⚠️ **NEW - CRITICAL**

- [ ] All markdown rendering sanitized
- [ ] All inputs validated
- [ ] No XSS vulnerabilities
- [ ] No code injection risks
- [ ] CSP headers configured
- [ ] No `any` types in layout grammar code
- [ ] All security tests pass
- [ ] Security audit passed

### Performance

- [ ] Height resolution < 50ms per block
- [ ] Typography calculation < 100ms per block
- [ ] Editor validation < 200ms
- [ ] No performance regressions
- [ ] Security validation < 10ms overhead

### Quality

- [ ] Test coverage > 80%
- [ ] Security test coverage > 90% ⚠️ **NEW**
- [ ] No TypeScript errors (strict mode)
- [ ] No linting errors
- [ ] ESLint enabled in builds ⚠️ **NEW**
- [ ] No console.log statements ⚠️ **NEW**
- [ ] All documentation complete
- [ ] Design tokens used exclusively ⚠️ **NEW**
- [ ] No inline styles ⚠️ **NEW**
- [ ] No hardcoded values ⚠️ **NEW**

---

## Risk Mitigation

### Risk 1: Breaking Existing Reports

**Mitigation:**
- Migration script validates and fixes
- Backward compatibility maintained
- Gradual rollout with rollback plan

### Risk 2: Performance Impact

**Mitigation:**
- Optimize height resolution algorithm
- Cache typography calculations
- Monitor performance metrics
- Load testing before rollout

### Risk 3: Editor Complexity

**Mitigation:**
- Clear UI/UX for validation
- Helpful error messages
- Actionable suggestions
- User training

---

## Dependencies

### External

- None (all work is internal)

### Internal

- `blockHeightCalculator.ts` (existing)
- `fontSyncCalculator.ts` (existing)
- `useUnifiedTextFontSize.ts` (existing)
- Chart rendering components (existing)

---

## Next Steps

1. **Review and Approve Plan**
   - Stakeholder review
   - Technical review
   - Timeline confirmation

2. **Set Up Development Environment**
   - Create feature branch
   - Set up test infrastructure
   - Prepare migration scripts

3. **Begin Phase 1**
   - Start with Task 1.1 (Core Module)
   - Set up CI/CD for tests
   - Daily standups to track progress

---

---

## Security Validation ⚠️ **CRITICAL SECTION**

### Pre-Implementation Security Checklist

Before starting Phase 1, ensure:

- [ ] All markdown rendering uses sanitization (Phase 0 Task 0.1)
- [ ] Input validation framework created (Phase 0 Task 0.2)
- [ ] Deprecated code removed (Phase 0 Task 0.3)
- [ ] Design tokens foundation ready (Phase 0 Task 0.4)
- [ ] Type safety foundation ready (Phase 0 Task 0.5)
- [ ] Testing infrastructure ready (Phase 0 Task 0.6)

### Security Review Gates

**Gate 1: After Phase 0**
- Security review of foundation
- XSS prevention verified
- Input validation verified
- Type safety verified

**Gate 2: After Phase 1**
- Security review of core module
- No `any` types introduced
- All inputs validated
- All outputs sanitized

**Gate 3: After Phase 3**
- Security review of typography system
- Markdown rendering secure
- CSP compliance verified

**Gate 4: Before Production**
- Full security audit
- Penetration testing
- All security tests pass
- Security documentation complete

### Security Testing Requirements

**Mandatory Tests:**
1. **XSS Prevention:**
   - Test script injection in markdown
   - Test script injection in text content
   - Test script injection in table content
   - Verify CSP blocks inline scripts

2. **Input Validation:**
   - Test negative heights
   - Test invalid font sizes
   - Test malicious block configurations
   - Test SQL injection attempts (if applicable)
   - Test command injection attempts

3. **Type Safety:**
   - Verify no `any` types
   - Verify runtime validation
   - Verify type coercion safety

4. **Code Injection:**
   - Test formula evaluation safety
   - Test dynamic content rendering
   - Verify no `Function()` constructor usage

### Security Documentation

**Required Documents:**
- Security architecture diagram
- Threat model for layout grammar
- Security test results
- Penetration test report
- Security review sign-off

---

## Future-Proofing Requirements

### Design Token Enforcement

**Automated Checks:**
```bash
# CI/CD checks
npm run check:design-tokens  # Fail if hardcoded values found
npm run check:inline-styles  # Fail if inline styles found
npm run check:types          # Fail if any types found
```

**ESLint Rules:**
- Enforce design token usage
- Block inline styles
- Block hardcoded values
- Block `any` types

### Type Safety Enforcement

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Runtime Validation:**
- Zod schemas for all inputs
- Runtime type checking where needed
- Type guards for all user inputs

### Code Quality Enforcement

**Build Requirements:**
- ESLint must pass (no `ignoreDuringBuilds`)
- TypeScript must pass (strict mode)
- All tests must pass
- Security tests must pass
- Design token checks must pass

**Pre-commit Hooks:**
- Lint-staged for changed files
- Type checking
- Security scanning
- Design token validation

---

**Document Maintained By:** Development Team  
**Last Updated: 2026-01-11T22:28:38.000Z
**Next Review:** Weekly during implementation  
**Security Review:** Before each phase gate

