# Layout Grammar Implementation Progress Tracker

**Version:** 1.0.0  
**Created:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Status:** Phase 0 In Progress

---

## Progress Overview

| Phase | Status | Progress | Started | Completed |
|-------|--------|----------|---------|-----------|
| Phase 0: Security Hardening Prerequisites | 🟡 In Progress | 2/6 tasks | 2025-01-XX | - |
| Phase 1: Foundation & Core Infrastructure | ⚪ Not Started | 0/4 tasks | - | - |
| Phase 2: Height Resolution System | ⚪ Not Started | 0/3 tasks | - | - |
| Phase 3: Unified Typography System | ⚪ Not Started | 0/3 tasks | - | - |
| Phase 4: Element-Specific Enforcement | ⚪ Not Started | 0/4 tasks | - | - |
| Phase 5: Editor Integration | ⚪ Not Started | 0/3 tasks | - | - |
| Phase 6: Migration & Validation | ⚪ Not Started | 0/3 tasks | - | - |

**Overall Progress:** 2/26 tasks (7.7%)

---

## Phase 0: Security Hardening Prerequisites ⚠️ **MUST COMPLETE FIRST**

**Duration:** 1 week  
**Dependencies:** None  
**Priority:** 🔴 **CRITICAL**  
**Status:** 🟡 In Progress (2/6 tasks)

### Task 0.1: Secure Markdown Rendering
- [x] Verify all `dangerouslySetInnerHTML` uses sanitization
- [x] Add CSP headers to middleware
- [x] Ensure DOMPurify is applied to all HTML output
- [x] Remove any unsafe `dangerouslySetInnerHTML` usage
- [x] Test XSS prevention
- **Status:** ✅ **COMPLETE** (2025-01-XX)
- **Commit:** `dc9a3ed` - feat(phase0): Secure markdown rendering - Task 0.1 complete

### Task 0.2: Input Validation Framework
- [x] Create `lib/layoutGrammarValidation.ts`
- [x] Implement `validateBlockConfiguration()`
- [x] Implement `validateHeightResolution()`
- [x] Implement `validateTypographyInput()`
- [x] Implement `validateElementContent()`
- [x] Implement `validateCellConfiguration()`
- [x] Implement `validateBlockCells()`
- [x] Add security validation (XSS pattern detection)
- **Status:** ✅ **COMPLETE** (2025-01-XX)
- **Commit:** `2c7d289` - feat(phase0): Input validation framework - Task 0.2 complete

### Task 0.3: Remove Deprecated Code
- [ ] Find all imports of `DynamicChart.tsx`
- [ ] Update all imports to use `ReportChart.tsx`
- [ ] Remove `components/DynamicChart.tsx`
- [ ] Verify no legacy code references remain
- [ ] Test build passes
- **Status:** ⚪ **PENDING**

### Task 0.4: Design Token Migration Foundation
- [ ] Audit all hardcoded values in layout grammar code
- [ ] Create CSS custom properties for layout grammar
- [ ] Replace hardcoded values with design tokens
- [ ] Remove inline styles from layout grammar code
- [ ] Test theme changes work correctly
- **Status:** ⚪ **PENDING**

### Task 0.5: Type Safety Foundation
- [ ] Create `lib/layoutGrammarTypes.ts`
- [ ] Define all TypeScript interfaces (no `any` types)
- [ ] Add runtime type validation where needed
- [ ] Export all types for use across codebase
- [ ] Verify TypeScript strict mode passes
- **Status:** ⚪ **PENDING**

### Task 0.6: Testing Infrastructure
- [ ] Set up testing framework (Jest/Vitest)
- [ ] Create test utilities (`createMockBlock`, etc.)
- [ ] Add security test helpers
- [ ] Add visual regression test setup
- [ ] Configure CI/CD integration
- **Status:** ⚪ **PENDING**

---

## Phase 1: Foundation & Core Infrastructure

**Duration:** 1-2 weeks  
**Dependencies:** Phase 0 complete  
**Status:** ⚪ Not Started (0/4 tasks)

### Task 1.1: Create Layout Grammar Core Module
- [ ] Create `lib/layoutGrammar.ts`
- [ ] Define `HeightResolutionPriority` enum
- [ ] Define `BlockHeightResolution` interface
- [ ] Define `ElementFitValidation` interface
- [ ] Define `BlockTypography` interface
- [ ] Define `SecurityFlags` interface
- [ ] Ensure no `any` types
- [ ] Export all types
- **Status:** ⚪ **PENDING**

### Task 1.2: Create Height Resolution Engine
- [ ] Create `lib/heightResolutionEngine.ts`
- [ ] Implement `resolveBlockHeight()` function
- [ ] Implement `checkIntrinsicMedia()` function
- [ ] Implement `calculateFromAspectRatio()` function
- [ ] Implement `enforceReadability()` function
- [ ] Add unit tests for each priority
- [ ] Handle edge cases
- **Status:** ⚪ **PENDING**

### Task 1.3: Create Element Fit Validator
- [ ] Create `lib/elementFitValidator.ts`
- [ ] Implement `validateTextElementFit()`
- [ ] Implement `validateTableElementFit()`
- [ ] Implement `validatePieElementFit()`
- [ ] Implement `validateBarElementFit()`
- [ ] Add unit tests for each element type
- [ ] Handle edge cases
- **Status:** ⚪ **PENDING**

### Task 1.4: Remove All Scrolling/Truncation Code
- [ ] Find all `overflow: auto` or `overflow: scroll` in chart CSS
- [ ] Find all `text-overflow: ellipsis` (except allowed cases)
- [ ] Find all `line-clamp` (except title max 2 lines)
- [ ] Remove all scrolling/truncation code
- [ ] Update CSS to remove overflow properties
- [ ] Test no scrolling occurs
- [ ] Document all changes
- **Status:** ⚪ **PENDING**

---

## Phase 2: Height Resolution System

**Duration:** 1 week  
**Dependencies:** Phase 1 complete  
**Status:** ⚪ Not Started (0/3 tasks)

### Task 2.1: Integrate Height Resolution into Block Calculator
- [ ] Update `lib/blockHeightCalculator.ts`
- [ ] Replace current height calculation with new resolution engine
- [ ] Implement priority chain (1-4)
- [ ] Handle intrinsic media authority
- [ ] Handle aspect ratio
- [ ] Handle readability enforcement
- [ ] Maintain backward compatibility
- [ ] Add new API for editor
- **Status:** ⚪ **PENDING**

### Task 2.2: Update ReportContent to Use New Resolution
- [ ] Update `app/report/[slug]/ReportContent.tsx`
- [ ] Use new height resolution engine
- [ ] Handle resolution results (height increase, split required)
- [ ] Apply resolved heights to blocks
- [ ] Show split suggestions when needed
- [ ] Test no visual regressions
- **Status:** ⚪ **PENDING**

### Task 2.3: Implement Intrinsic Media Authority
- [ ] Extend `lib/heightResolutionEngine.ts`
- [ ] Detect image elements with `setIntrinsic` mode
- [ ] Calculate height from image aspect ratio
- [ ] Apply to entire block
- [ ] Handle multiple images (use largest)
- [ ] Test intrinsic images govern block height
- [ ] Test typography scales within that height
- **Status:** ⚪ **PENDING**

---

## Phase 3: Unified Typography System

**Duration:** 1 week  
**Dependencies:** Phase 2 complete  
**Status:** ⚪ Not Started (0/3 tasks)

### Task 3.1: Create Block Typography Calculator
- [ ] Create `lib/blockTypographyCalculator.ts`
- [ ] Implement `calculateBlockBaseFontSize()`
- [ ] Implement `calculateOptimalFontSizeForElement()`
- [ ] Calculate for all element types (text, labels, legends, tables)
- [ ] Find minimum of all optimal sizes
- [ ] Apply as `--block-base-font-size`
- [ ] Add unit tests
- **Status:** ⚪ **PENDING**

### Task 3.2: Apply Unified Typography via CSS Custom Property
- [ ] Update `app/report/[slug]/ReportContent.tsx`
- [ ] Calculate block typography
- [ ] Apply `--block-base-font-size` CSS custom property
- [ ] Ensure all elements inherit/use this value
- [ ] Test visual consistency across block
- **Status:** ⚪ **PENDING**

### Task 3.3: Update CSS to Use Unified Typography
- [ ] Update `app/report/[slug]/ReportChart.module.css`
- [ ] Update all font-size declarations to use `--block-base-font-size`
- [ ] Remove individual font-size calculations
- [ ] Ensure KPI values remain independent
- [ ] Add fallback values
- [ ] Test no visual regressions
- **Status:** ⚪ **PENDING**

---

## Phase 4: Element-Specific Enforcement

**Duration:** 1 week  
**Dependencies:** Phase 3 complete  
**Status:** ⚪ Not Started (0/4 tasks)

### Task 4.1: Text Element Enforcement
- [ ] Update `lib/elementFitValidator.ts`
- [ ] Update `app/report/[slug]/ReportChart.tsx`
- [ ] Validate text fits at current font-size
- [ ] Increase block height if not fitting
- [ ] Require block split if height can't increase
- [ ] Test text always fits
- [ ] Test no truncation or scrolling
- **Status:** ⚪ **PENDING**

### Task 4.2: Table Element Enforcement
- [ ] Update `lib/elementFitValidator.ts`
- [ ] Update `app/report/[slug]/ReportChart.tsx`
- [ ] Validate table fits with all required rows
- [ ] Enforce row count limits
- [ ] Increase block height if needed
- [ ] Require block split if height can't increase
- [ ] Test tables always fit fully
- [ ] Test no scrolling
- **Status:** ⚪ **PENDING**

### Task 4.3: Pie Element Enforcement
- [ ] Update `lib/elementFitValidator.ts`
- [ ] Update `app/report/[slug]/ReportChart.tsx`
- [ ] Validate pie chart and legend fit
- [ ] Enforce minimum pie radius
- [ ] Ensure legend fits without scroll
- [ ] Implement reflow (horizontal to vertical)
- [ ] Implement aggregation (Top-N + Other)
- [ ] Test pie radius has minimum
- [ ] Test legends fit without scroll
- **Status:** ⚪ **PENDING**

### Task 4.4: Bar Element Enforcement
- [ ] Update `lib/elementFitValidator.ts`
- [ ] Update `app/report/[slug]/ReportChart.tsx`
- [ ] Validate bars fit in orientation
- [ ] Change orientation if needed (vertical ↔ horizontal)
- [ ] Reduce label density if needed
- [ ] Increase block height if needed
- [ ] Test bars always fit
- [ ] Test no scrolling or truncation
- **Status:** ⚪ **PENDING**

---

## Phase 5: Editor Integration

**Duration:** 1 week  
**Dependencies:** Phase 4 complete  
**Status:** ⚪ Not Started (0/3 tasks)

### Task 5.1: Create Editor Validation API
- [ ] Create `lib/editorValidation.ts`
- [ ] Implement `validateBlockConfiguration()`
- [ ] Check if content fits
- [ ] Return clear error messages
- [ ] Suggest fixes (height increase, split)
- [ ] Add unit tests
- **Status:** ⚪ **PENDING**

### Task 5.2: Integrate Validation into Chart Builder
- [ ] Update `components/ChartAlgorithmManager.tsx`
- [ ] Update `components/BuilderMode.tsx`
- [ ] Validate blocks on save
- [ ] Show errors in UI
- [ ] Prevent saving invalid configurations
- [ ] Show height resolution preview
- [ ] Add "Split Block" button when needed
- [ ] Add "Increase Height" button when possible
- **Status:** ⚪ **PENDING**

### Task 5.3: Add Block Configuration Controls
- [ ] Create or update `components/BlockEditor.tsx`
- [ ] Add block aspect ratio selector
- [ ] Add maximum block height constraint
- [ ] Add image mode selector (cover / setIntrinsic)
- [ ] Add height resolution preview
- [ ] Test all controls available
- [ ] Test changes reflected in preview
- [ ] Test validation runs on change
- **Status:** ⚪ **PENDING**

---

## Phase 6: Migration & Validation

**Duration:** 1 week  
**Dependencies:** All phases complete  
**Status:** ⚪ Not Started (0/3 tasks)

### Task 6.1: Create Migration Script
- [ ] Create `scripts/migrate-reports-to-layout-grammar.ts`
- [ ] Load all report configurations
- [ ] Validate each block
- [ ] Fix violations (remove scrolling, adjust heights)
- [ ] Update font-size calculations
- [ ] Generate migration report
- [ ] Test no data loss
- **Status:** ⚪ **PENDING**

### Task 6.2: Create Validation Test Suite
- [ ] Create `tests/layout-grammar.test.ts`
- [ ] Test height resolution priorities
- [ ] Test element fit validation
- [ ] Test unified typography
- [ ] Test editor validation
- [ ] Test edge cases
- [ ] Achieve >80% coverage
- **Status:** ⚪ **PENDING**

### Task 6.3: Update Documentation
- [ ] Update `DESIGN_SYSTEM_PLAN.md`
- [ ] Update `docs/design/LAYOUT_SYSTEM.md`
- [ ] Create `docs/LAYOUT_GRAMMAR.md`
- [ ] Document layout grammar rules
- [ ] Document height resolution algorithm
- [ ] Document unified typography
- [ ] Document element-specific rules
- [ ] Document editor validation
- [ ] Provide examples
- **Status:** ⚪ **PENDING**

---

## Testing & Validation

### Unit Tests
- [ ] Height resolution engine: 100% coverage
- [ ] Element fit validator: 100% coverage
- [ ] Block typography calculator: 100% coverage
- [ ] Editor validation: 100% coverage
- [ ] Security validation: 100% coverage

### Integration Tests
- [ ] Block with intrinsic image
- [ ] Block with aspect ratio
- [ ] Block with text that doesn't fit
- [ ] Block with table that doesn't fit
- [ ] Block with pie chart and legend
- [ ] Block with multiple chart types
- [ ] Editor validation flow
- [ ] Height increase flow
- [ ] Block split flow

### Visual Regression Tests
- [ ] All chart types render correctly
- [ ] Heights resolve correctly
- [ ] Typography is unified
- [ ] No scrolling/truncation
- [ ] Mobile responsiveness

---

## Security Validation

### Pre-Implementation Security Checklist
- [x] All markdown rendering uses sanitization (Phase 0 Task 0.1)
- [x] Input validation framework created (Phase 0 Task 0.2)
- [ ] Deprecated code removed (Phase 0 Task 0.3)
- [ ] Design tokens foundation ready (Phase 0 Task 0.4)
- [ ] Type safety foundation ready (Phase 0 Task 0.5)
- [ ] Testing infrastructure ready (Phase 0 Task 0.6)

### Security Review Gates
- [ ] Gate 1: After Phase 0 - Security review of foundation
- [ ] Gate 2: After Phase 1 - Security review of core module
- [ ] Gate 3: After Phase 3 - Security review of typography system
- [ ] Gate 4: Before Production - Full security audit

### Security Tests
- [ ] XSS prevention in markdown rendering
- [ ] Input validation for all inputs
- [ ] Type safety (no `any` types)
- [ ] CSP compliance
- [ ] Code injection prevention

---

## Success Criteria

### Functional (Layout Grammar Compliance)
- [ ] No scrolling in any chart type
- [ ] No truncation in any chart type
- [ ] No line clamping (except title max 2 lines)
- [ ] No ellipsis (except title max 2 lines)
- [ ] No hidden overflow
- [ ] Block height resolves deterministically (4-priority algorithm)
- [ ] Unified typography works correctly (`--block-base-font-size`)
- [ ] KPI values scale independently (explicit exemption)
- [ ] All elements fit without violations
- [ ] Editor validates correctly
- [ ] Height increases when content doesn't fit
- [ ] Block splits when height cannot increase
- [ ] Publishing blocked when split not possible
- [ ] Allowed fit mechanisms work in correct order
- [ ] Reflow works (legend position, chart orientation)
- [ ] Semantic density reduction works (Top-N, aggregation — no data loss)
- [ ] Intrinsic media authority works (Priority 1)
- [ ] Block aspect ratio works (Priority 2)
- [ ] Readability enforcement works (Priority 3)
- [ ] Structural failure handled correctly (Priority 4)
- [ ] All element-specific rules enforced (Text, KPI, Pie, Bar, Table, Image)
- [ ] Editor prevents invalid states
- [ ] Editor provides deterministic controls
- [ ] Preview shows actual resolved height (not optimistic)

### Security ⚠️ **CRITICAL**
- [x] All markdown rendering sanitized
- [x] All inputs validated
- [ ] No XSS vulnerabilities
- [ ] No code injection risks
- [x] CSP headers configured
- [ ] No `any` types in layout grammar code
- [ ] All security tests pass
- [ ] Security audit passed

### Quality
- [ ] Test coverage > 80%
- [ ] Security test coverage > 90%
- [ ] No TypeScript errors (strict mode)
- [ ] No linting errors
- [ ] ESLint enabled in builds
- [ ] No console.log statements
- [ ] Design tokens used exclusively
- [ ] No inline styles
- [ ] No hardcoded values

---

## Notes & Issues

### Completed Tasks
- **Task 0.1** (2025-01-XX): Secure markdown rendering complete. All `dangerouslySetInnerHTML` uses sanitized, CSP headers added.
- **Task 0.2** (2025-01-XX): Input validation framework complete. Comprehensive validation functions created.

### Current Issues
- None

### Blockers
- None

### Decisions Made
- CSP headers allow `unsafe-inline` for styles (required for CSS custom properties/design tokens)
- CSP headers allow `unsafe-inline` for scripts (required for Next.js)
- Input validation uses machine-readable error codes for programmatic handling

---

**Last Updated:** 2025-01-XX  
**Next Review:** After each task completion

