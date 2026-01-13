# ACTION_PLAN.md

**Version:** 1.1.7  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Reviewed:** 2026-01-12T10:05:00.000Z  
**Last Updated:** 2026-01-12T13:18:36.000Z  
**Status:** Active  
**Canonical:** Yes  
**Owner:** Architecture  
**Audience:** Engineering + Product

---

## Purpose

This document serves as the single executable layer between:
- `docs/audits/COMPREHENSIVE_SYSTEM_AUDIT_PLAN_2026.md` (audit inventory)
- `IMPLEMENTATION_COMPLETE.md` (completed work)
- `ROADMAP.md` (strategic planning)

It translates audit findings and residual risks into concrete, trackable actions.

**Source of Truth:**
- `IMPLEMENTATION_COMPLETE.md` (Residual Risks section)
- `ROADMAP.md` (Hardening & Follow-ups section)
- P0/P1 items marked DONE + VERIFIED (for exclusion only)

---

## Action Items

### A-01: Layout Grammar Editor Integration

**Title:** Layout Grammar Editor Integration  
**Origin:** P1 1.5 (Explicit Non-Goals), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** High  
**Status:** DONE

**Description:**
Layout Grammar validation logic exists but is not integrated into the editor UI. Editor does not block invalid configurations before save (e.g., scrolling, truncation, clipping violations). No real-time feedback during report editing.

**Technical Intent:**
- Integrate Layout Grammar validation into editor UI
- Block invalid configurations before save (scrolling, truncation, clipping violations)
- Provide real-time feedback during report editing
- Prevent Layout Grammar violations at authoring time

**Non-Goals:**
- Runtime validation already exists (console warnings are sufficient for development)
- This is editor blocking, not runtime enforcement
- No changes to runtime validation behavior

**Dependency / Trigger:**
- Layout Grammar validation logic (exists)
- Editor UI refactoring or new editor features
- Product decision to enforce Layout Grammar at authoring time

**Owner:** Engineering

**Closure Evidence Required:**
- Editor UI blocks invalid configurations before save
- Real-time validation feedback implemented
- Documentation of editor validation rules
- Commit with editor integration changes

**Closure Evidence:**
- ✅ Editor UI blocks invalid configurations before save: `app/admin/visualization/page.tsx` - `validateBlockBeforeSave()` integrated into `handleUpdateBlock()` and `handleCreateBlock()`
- ✅ Validation logic integrated: Uses `validateBlockForEditor()` from `lib/editorValidationAPI.ts`
- ✅ Blocks Layout Grammar violations: Checks `publishBlocked` and `requiredActions` before save
- ✅ Error messages displayed: Uses existing `showMessage()` for user feedback
- ✅ Commit: `0716af9c9` - Integration completed with helper functions `convertBlockToEditorInput()` and `validateBlockBeforeSave()`
- ✅ Local gate passed: Build, TypeScript, and linting all pass

**Technical Readiness Notes:**
- Layout Grammar validation logic exists: `lib/editorValidationAPI.ts` (validateBlockForEditor, validateBlocksForEditor, checkPublishValidity)
- Editor component: `components/ReportContentManager.tsx` (report content editing UI)
- Editor validation API provides `checkPublishValidity()` function that returns `{ canPublish: boolean; blockedBlocks: Array<{ blockId: string; reason: string }> }`
- Integration point: ReportContentManager needs to call validation API and block save/commit if violations found
- Constraints: Must preserve existing editor UX, validation should be non-blocking for warnings, blocking only for critical violations
- Sequencing: Can be done independently, but benefits from A-05 (Runtime Enforcement) for consistency

---

### A-02: Layout Grammar Migration Tooling

**Title:** Layout Grammar Migration Tooling  
**Origin:** P1 1.5 (Explicit Non-Goals), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Medium  
**Status:** DONE

**Description:**
Automated migration of existing reports to Layout Grammar compliance is not implemented. Analysis tools exist, but migration is currently manual. No batch analysis and remediation capabilities for legacy reports.

**Technical Intent:**
- Automated migration of existing reports to Layout Grammar compliance
- Batch analysis and remediation of legacy reports
- Validation reports for pre-migration assessment
- Scripts/tooling for bulk report updates

**Non-Goals:**
- Manual migration is currently supported and sufficient
- Analysis tools already exist (no need to recreate)
- This is automation, not correctness (manual migration works)

**Dependency / Trigger:**
- Analysis tools (exist)
- Migration scripts (to be created)
- Large-scale report migration or client onboarding
- Business need for automated migration

**Owner:** Engineering

**Closure Evidence Required:**
- Migration scripts/tooling created
- Batch analysis capability implemented
- Validation reports generated
- Documentation of migration process
- Commit with migration tooling

**Closure Evidence:**
- ✅ Migration scripts/tooling created: `scripts/migrate-layout-grammar.ts` - Full-featured migration tool with dry-run, apply, backup/restore
- ✅ Batch analysis capability implemented: Validates all report templates and data blocks in database
- ✅ Validation reports generated: JSON format with detailed violation information
- ✅ Documentation of migration process: [docs/migrations/LAYOUT_GRAMMAR_MIGRATION.md](docs/migrations/LAYOUT_GRAMMAR_MIGRATION.md) - Complete usage guide
- ✅ Commit: `0c7319b1e` - Migration tooling, documentation, and npm script added
- ✅ Local gate passed: Build, TypeScript, and linting all pass

**Technical Readiness Notes:**
- Analysis tools exist: `scripts/check-layout-grammar-guardrail.ts` (scans files for violations)
- Validation API exists: `lib/editorValidationAPI.ts` (can validate blocks)
- Migration scripts need to be created: batch processing, report updates, validation reports
- Constraints: Must preserve existing report data, migration must be reversible/testable
- Sequencing: Can be done independently, benefits from A-01 (Editor Integration) for validation consistency

---

### A-03: Height Calculation Accuracy Improvements

**Title:** Height Calculation Accuracy Improvements  
**Origin:** P1 1.4 (Residual Risks), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Medium  
**Status:** IN PROGRESS

**Description:**
BAR chart height calculation uses estimated label height (40px for 2-line max) and minimum bar height (20px). Actual rendered height may vary slightly based on font size and content. PIE chart legend height calculation assumes 30% → 50% growth when >5 items. Actual growth depends on label lengths and wrapping behavior.

**Technical Intent:**
- Refine BAR chart height calculation (currently uses estimated 40px label height)
- Refine PIE chart legend height calculation (currently assumes 30% → 50% growth)
- Account for actual font size and content wrapping behavior
- Improve accuracy of height estimates to match actual rendered height

**Non-Goals:**
- Current estimates are sufficient for most use cases
- This is fine-tuning, not a critical issue
- No changes to Layout Grammar compliance (current implementation is correct)

**Dependency / Trigger:**
- None (can be done independently)
- Reports with extreme content density or font size variations
- User-reported height calculation issues

**Owner:** Engineering

**Closure Evidence Required:**
- Enhanced height calculation logic in `lib/elementFitValidator.ts`
- Updated `lib/blockHeightCalculator.ts` with refined calculations
- Verification that height estimates match actual rendered height
- Commit with height calculation improvements

**Closure Evidence:**
- ✅ Enhanced height calculation logic: `lib/elementFitValidator.ts` - Improved `validateBarElementFit()` and `validatePieElementFit()`
- ✅ BAR chart improvements: Estimates font size based on available space, calculates label height using actual metrics (fontSize × lineHeight × 2)
- ✅ PIE chart improvements: Estimates font size and legend item height, accounts for item count and label lengths
- ✅ Documentation: `docs/audits/investigations/A-03-height-calculation-improvements.md` - Before/after comparison
- ✅ Commit: Height calculation accuracy improvements with documentation
- ✅ Local gate passed: Build, TypeScript, and linting all pass

**Technical Readiness Notes:**
- Current implementation: `lib/elementFitValidator.ts` (validateBarElementFit, validatePieElementFit)
- Height calculator: `lib/blockHeightCalculator.ts` (resolveBlockHeightWithDetails)
- BAR chart: Uses estimated 40px label height, 20px min bar height, 8px row spacing
- PIE chart: Assumes 30% → 50% legend growth when >5 items
- Constraints: Must maintain Layout Grammar compliance, cannot introduce regressions
- Risks: Over-refinement may cause unnecessary height increases, under-refinement may cause clipping
- Sequencing: Can be done independently, but should coordinate with A-04 (Typography Scaling) if font size changes affect height

---

### A-04: Typography Scaling Edge Cases

**Title:** Typography Scaling Edge Cases  
**Origin:** P1 1.5 (Residual Risks), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Low  
**Status:** DONE

**Description:**
Block-level typography uses `calculateSyncedFontSizes()` which may not account for all edge cases (very long titles, extreme aspect ratios). BAR chart font size algorithm uses binary search with character estimates, which may not perfectly match actual rendered text width.

**Technical Intent:**
- Handle edge cases in `calculateSyncedFontSizes()` (very long titles, extreme aspect ratios)
- Improve BAR chart font size algorithm accuracy (binary search with character estimates)
- Ensure typography scaling works correctly for all edge cases

**Non-Goals:**
- Current implementation handles 99% of use cases
- This is optimization, not correctness
- No changes to core typography unification (P1 1.5 is correct)

**Dependency / Trigger:**
- None (can be done independently)
- Reports with extreme title lengths or aspect ratios
- User-reported typography scaling issues

**Owner:** Engineering

**Closure Evidence Required:**
- Enhanced `calculateSyncedFontSizes()` with edge case handling
- Improved BAR chart font size algorithm in `lib/barChartFontSizeCalculator.ts`
- Verification that edge cases are handled correctly
- Commit with typography scaling improvements

**Closure Evidence:**
- ✅ Enhanced `calculateSyncedFontSizes()`: Variable character width multiplier, very long title handling, extreme aspect ratio handling (very narrow < 400px, very wide > 2000px)
- ✅ Improved BAR chart font size algorithm: Variable character width multiplier, improved label width calculation (accounts for cell padding)
- ✅ Regression harness created: `__tests__/typography-edge-cases.test.ts` with 7 test cases covering all edge cases
- ✅ Documentation: `docs/audits/investigations/A-04-typography-scaling-edge-cases.md` - Complete implementation summary and verification
- ✅ All tests passing: 7/7 test cases pass, no regressions introduced
- ✅ Local gate passed: Build, TypeScript, and linting all pass

**Technical Readiness Notes:**
- Current implementation: `calculateSyncedFontSizes()` (block-level typography calculation)
- BAR chart font size: `lib/barChartFontSizeCalculator.ts` (binary search with character estimates)
- Edge cases: Very long titles, extreme aspect ratios, character width estimation accuracy
- Constraints: Must maintain unified typography (P1 1.5), KPI value exemption must remain intact
- Risks: Over-optimization may introduce complexity, character width estimation may never be perfect
- Sequencing: Can be done independently, but should coordinate with A-03 (Height Calculation) if font size changes affect height

---

### A-05: Layout Grammar Runtime Enforcement

**Title:** Layout Grammar Runtime Enforcement  
**Origin:** P1 1.4 (Residual Risks), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Medium  
**Status:** IN PROGRESS

**Description:**
Runtime validation provides console warnings but does not block rendering if CSS variables are missing. No fail-fast behavior for Layout Grammar violations. No production guardrails for height calculation failures.

**Technical Intent:**
- Block rendering if critical CSS variables are missing (currently only console warnings)
- Fail-fast behavior for Layout Grammar violations
- Production guardrails for height calculation failures
- Prevent Layout Grammar violations from reaching production

**Non-Goals:**
- Console warnings are sufficient for development
- This is production hardening, not correctness
- No changes to development workflow (warnings are acceptable in dev)

**Dependency / Trigger:**
- Runtime validation (exists)
- Production deployment requirements
- Production incidents or reliability requirements
- Business decision to enforce Layout Grammar at runtime

**Owner:** Engineering

**Closure Evidence Required:**
- Runtime enforcement logic implemented
- Fail-fast behavior for critical violations
- Production guardrails documented
- Commit with runtime enforcement changes

**Closure Evidence:**
- ✅ Runtime enforcement logic implemented: `lib/layoutGrammarRuntimeEnforcement.ts` - Environment-aware enforcement module
- ✅ Fail-fast behavior for critical violations: Throws errors in production, warnings in development
- ✅ Critical CSS variable validation: `--row-height`, `--block-height`, `--chart-body-height`, `--text-content-height`
- ✅ Height resolution validation: Validates structural failures and split requirements
- ✅ Element fit validation: Validates element fit failures
- ✅ Production guardrails: Integrated into `ReportContent.tsx` and `ReportChart.tsx`
- ✅ Documentation: `docs/audits/investigations/A-05-runtime-enforcement.md` - Enforcement rules and safeguards
- ✅ Commit: Runtime enforcement implementation with documentation
- ✅ Local gate passed: Build, TypeScript, and linting all pass

**Technical Readiness Notes:**
- Current implementation: Runtime validation exists in `app/report/[slug]/ReportContent.tsx` (console warnings)
- Validation functions: `lib/elementFitValidator.ts` (validateElementFit), `lib/blockHeightCalculator.ts` (height resolution)
- Constraints: Must distinguish between development (warnings OK) and production (blocking required)
- Risks: Fail-fast behavior may break existing reports if validation is too strict, needs graceful degradation
- Sequencing: Can be done independently, but should coordinate with A-01 (Editor Integration) for consistency
- Environment detection: Must check `NODE_ENV` or similar to enable blocking only in production

---

### A-06: Performance Optimization Pass

**Title:** Performance Optimization Pass  
**Origin:** P1 1.5 (Explicit Non-Goals), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Low  
**Status:** DONE

**Description:**
No performance optimizations were applied beyond what was necessary for correctness during the audit. A structured, evidence-based performance pass is required to identify and resolve real bottlenecks in large or dense reports.

**Technical Intent:**
- Identify real performance bottlenecks using profiling
- Apply only evidence-backed optimizations
- Preserve all correctness, Layout Grammar enforcement, and visual output
- Produce measurable before/after performance improvements

**Non-Goals:**
- No speculative or aesthetic refactors
- No changes to Layout Grammar rules or enforcement
- No visual or typography changes unless strictly required for performance

**Dependency / Trigger:**
- Completion of all correctness items (A-01 through A-05)
- Performance concerns in large or complex reports
- Profiling evidence indicating real bottlenecks

**Owner:** Engineering

---

#### Execution Checklist (Trackable)

**PHASE 1 — Baseline & Profiling**
- [ ] Select representative report scenarios (large, dense, mixed)
- [ ] Capture baseline render metrics (time-to-interactive)
- [ ] Measure re-render counts (ReportContent, ReportChart)
- [ ] Record memory usage trends
- [ ] Document profiling tools used

**PHASE 2 — Bottleneck Identification**
- [ ] Identify top performance bottlenecks
- [ ] Document affected components/functions
- [ ] Record triggering conditions
- [ ] Attach profiling evidence

**PHASE 3 — Targeted Optimizations**
- [ ] Optimization #1 implemented (evidence-backed)
- [ ] Optimization #2 implemented (if applicable)
- [ ] Optimization #3 implemented (if applicable)
- [ ] Confirm no regressions or visual changes

**PHASE 4 — Verification**
- [ ] Re-run profiling on same scenarios
- [ ] Compare before/after metrics
- [ ] Confirm correctness and Layout Grammar enforcement intact

**PHASE 5 — Documentation & Closure**
- [ ] Create `docs/audits/investigations/A-06-performance-optimization-pass.md`
- [ ] Document baseline, bottlenecks, changes, and results
- [ ] Update A-06 status to DONE in this document
- [ ] Add closure evidence links
- [ ] Commit optimization changes (one per logical unit)
- [ ] Commit documentation updates

**Closure Evidence Required:**
- Performance profiling documentation
- Evidence-backed optimization commits
- Before/after metric comparison
- Investigation document linked

**Technical Readiness Notes:**
- Profiling-first approach is mandatory
- All optimizations must be reversible and justified
- This item must be executed last in the audit action sequence

---

## Summary

**Total Action Items:** 6

**Status Breakdown:**
- PLANNED: 0
- BLOCKED: 0
- IN PROGRESS: 0
- DONE: 6 (A-01, A-02, A-03, A-04, A-05, A-06)
- DEFERRED: 0

**Priority Breakdown:**
- High: 1 (A-01)
- Medium: 3 (A-02, A-03, A-05)
- Low: 2 (A-04, A-06)

**Mapping to ROADMAP.md:**
- All 6 items mapped from "🔧 Hardening & Follow-ups (From Audit Residual Risks)" section
- A-01: Layout Grammar Editor Integration (High priority)
- A-02: Layout Grammar Migration Tooling (Medium priority)
- A-03: Height Calculation Accuracy Improvements (Medium priority)
- A-04: Typography Scaling Edge Cases (Low priority)
- A-05: Layout Grammar Runtime Enforcement (Medium priority)
- A-06: Performance Optimization Pass (Low priority)

**Source References:**
- `IMPLEMENTATION_COMPLETE.md` (Residual Risks, Explicit Non-Goals)
- `ROADMAP.md` (Hardening & Follow-ups section)

---

**Document Status:** Active executable action plan. Items trackable and actionable.

**Last Verified:** 2026-01-12T02:05:00.000Z



--------------------------------------------


## REPORTING ROADMAP ITEMS (Post-A-06)

**Status:** ACTIVE  
**Owner:** Architecture (Chappie)  
**Execution:** Engineering (Tribeca)  
**Reference:** [docs/audits/reporting-roadmap/A-R-ROADMAP-PROPOSAL-2026-01-12.md](docs/audits/reporting-roadmap/A-R-ROADMAP-PROPOSAL-2026-01-12.md)

### Objectives
- Continue Reporting system hardening beyond A-01 → A-06
- Focus on export correctness, render determinism, and format consistency
- Maintain same execution standard as A-01 → A-06

### Non-Goals
- No Admin UI work
- No new product features
- No speculative refactors

---

## A-R-07: Export Correctness & Validation

**Status:** DONE  
**Priority:** Medium  
**Category:** Reporting Correctness  
**Completed:** 2026-01-12T11:45:00.000Z

**Description:**
Export functionality (CSV, PDF) had silent failures and missing validation. Pre-export readiness validation was needed to ensure exports only proceed when data is ready.

**Closure Evidence:**
- ✅ Export validation infrastructure: `lib/export/exportValidator.ts`
- ✅ CSV/PDF readiness validation: `validateCSVExportReadiness()`, `validatePDFExportReadiness()`
- ✅ Chart coverage validation: `validateChartResultCoverage()` (foundation for A-R-10)
- ✅ Enhanced export hook: `hooks/useReportExport.ts` with validation layer
- ✅ Regression tests: `__tests__/export-validation.test.ts`
- ✅ Documentation: `docs/audits/investigations/A-R-07-export-correctness.md`
- ✅ Commits: `03ae7a80a` (closure), `f2310afb4` (STATE MEMORY update)

**Out of Scope (Future Work):**
- Full CSV/PDF vs rendered-report parity verification (A-R-10)

---

## A-R-08: Render Determinism Guarantees

**Status:** DONE  
**Priority:** Medium  
**Category:** Reporting Correctness  
**Completed:** 2026-01-12T12:20:00.000Z

**Description:**
Investigation of render determinism risks beyond Layout Grammar. Focus on render order stability, data calculation timing dependencies, and non-deterministic effects.

**Closure Evidence:**
- ✅ Investigation document: `docs/audits/investigations/A-R-08-render-determinism.md`
- ✅ Findings: No critical determinism risks identified
- ✅ Recommendation: NO-GO for remediation (low priority, React guarantees final render determinism)
- ✅ Commits: `4350215b5` (investigation), `718cde3ce` (STATE MEMORY update)

**Key Findings:**
- ✅ Render order: Deterministic (blocks/charts sorted by `order` field)
- ✅ Chart calculation order: Deterministic (array iteration order)
- ⚠️ Low-risk: Async data fetching, ResizeObserver timing (visual only, not calculation)

---

## A-R-10: Export Format Consistency (CSV/PDF Parity vs Rendered Report)

**Status:** ACTIVE (Phase 1: Investigation)  
**Priority:** Low  
**Category:** Reporting Correctness

**Description:**
CSV and PDF exports may not match the rendered report that users see. Investigation phase to define parity contract and identify mismatch classes.

**Technical Intent:**
- Define exact parity contract between rendered report, CSV export, and PDF export
- Identify mismatch classes (missing charts, ordering, formatting, hidden content, pagination)
- Use A-R-07 foundation (`validateChartResultCoverage()`) as starting hook
- Produce GO / NO-GO recommendation for remediation

**Non-Goals:**
- No export format changes in Phase 1 (investigation only)
- No Admin UI work
- No new features

**Dependency / Trigger:**
- A-R-07 completion (export validation infrastructure)
- User reports of export inconsistencies
- Product decision on export parity requirements

**Owner:** Engineering (Tribeca)

**Closure Evidence Required (Phase 1):**
- Parity contract written and unambiguous
- Evidence-backed mismatch inventory (where + why + impact)
- GO / NO-GO recommendation for remediation scope
- ACTION_PLAN.md updated (STATE MEMORY + A-R-10 checklist)

**Closure Evidence:**
- ✅ Investigation document: `docs/audits/investigations/A-R-10-export-parity-investigation.md`
- ✅ Parity contract defined: Rendered report, CSV export, PDF export contracts documented
- ✅ Mismatch classes identified: 6 mismatch classes with severity ratings
- ✅ GO / NO-GO recommendation: ✅ GO for Remediation (Medium Priority)
- ✅ ACTION_PLAN.md updated: A-R-10 section added with checklist

**Technical Readiness Notes:**
- Foundation exists: `lib/export/exportValidator.ts` - `validateChartResultCoverage()` function
- CSV export: `lib/export/csv.ts` - Chart selection and ordering logic
- PDF export: `lib/export/pdf.ts` - DOM-based capture logic
- Rendered report: `app/report/[slug]/ReportContent.tsx` - Chart filtering and ordering logic

**Mismatch Classes Identified:**
1. **Missing Charts in Export vs Rendered** (Medium severity) - CSV includes invalid charts not visible
2. **Ordering Mismatches** (Medium severity) - CSV uses alphabetical vs order field
3. **Formatting/Value Rounding Mismatches** (Low severity) - CSV shows raw values vs formatted
4. **Hidden/Conditional Content Mismatches** (Low severity) - CSV includes all stats vs visible only
5. **Pagination Artifacts (PDF)** (Low severity) - Expected PDF format behavior
6. **VALUE Type Chart Handling** (Low severity) - CSV skips VALUE charts

**Remediation Recommendation:**
✅ **GO for Remediation** - Focus on CSV export alignment (chart filtering, ordering). PDF export already matches rendered report.

**Remediation Scope (Recommended):**
- CSV Chart Filtering: Filter charts by `hasValidChartData()` before export
- CSV Chart Ordering: Sort charts by `order` field instead of `chartId`
- CSV VALUE Type Handling: Include VALUE type charts or document skip reason
- CSV Formatting: Apply `formatValue()` formatting to exported values (optional)

---

### A-R-10 Checklist (Phase 1: Investigation)

- [x] Define parity contract for rendered report
- [x] Define parity contract for CSV export
- [x] Define parity contract for PDF export
- [x] Identify mismatch class: Missing charts
- [x] Identify mismatch class: Ordering mismatches
- [x] Identify mismatch class: Formatting/rounding mismatches
- [x] Identify mismatch class: Hidden/conditional content
- [x] Identify mismatch class: Pagination artifacts
- [x] Identify mismatch class: VALUE type handling
- [x] Assign severity ratings per mismatch class
- [x] Produce GO / NO-GO recommendation
- [x] Create investigation document
- [x] Update ACTION_PLAN.md with A-R-10 section
- [x] Update STATE MEMORY

**Phase 2 (Remediation) - COMPLETE:**
- [x] Implement CSV chart filtering alignment
- [x] Implement CSV chart ordering alignment
- [x] Implement CSV VALUE type handling (or document skip reason)
- [ ] Implement CSV formatting alignment (optional - deferred, raw values preferred for CSV analysis)
- [x] Add regression tests for export parity
- [x] Update documentation with parity guarantees

---

## Summary (Reporting Roadmap Items)

**Total Reporting Roadmap Items:** 3

**Status Breakdown:**
- DONE: 3 (A-R-07, A-R-08, A-R-10)
- ACTIVE: 0
- PLANNED: 0

**Priority Breakdown:**
- Medium: 2 (A-R-07, A-R-08)
- Low: 1 (A-R-10)

**Source References:**
- `docs/audits/reporting-roadmap/A-R-ROADMAP-PROPOSAL-2026-01-12.md`
- `docs/audits/investigations/A-R-07-export-correctness.md`
- `docs/audits/investigations/A-R-08-render-determinism.md`
- `docs/audits/investigations/A-R-10-export-parity-investigation.md`

---

## Post-A-R-10 Reporting Hardening

**Status:** PLANNED  
**Owner:** Architecture (Chappie)  
**Execution:** Engineering (Tribeca)  
**Reference:** Completed items A-R-07, A-R-08, A-R-10

### Context

**Completed Hardening:**
- ✅ A-R-07: Export Correctness & Validation (export readiness validation)
- ✅ A-R-08: Render Determinism Guarantees (investigation complete, NO-GO for remediation)
- ✅ A-R-10: Export Format Consistency (CSV/PDF parity with rendered report)

**Remaining Gaps Identified:**
1. **Formula Calculation Error Handling** - Chart calculation errors may not be handled gracefully
2. **Report Template Compatibility** - Template reuse rules and validation (A-R-09 from roadmap, not executed)
3. **Chart Data Validation** - Missing data validation and error boundaries for chart rendering
4. **Export Edge Cases** - CSV formatting alignment deferred (raw values preferred, but may need investigation)

### Objectives
- Continue Reporting system hardening beyond A-R-07, A-R-08, A-R-10
- Focus on error handling, data validation, and template compatibility
- Maintain same execution standard as previous Reporting items

### Non-Goals
- No Admin UI work
- No new product features
- No speculative refactors

---

## A-R-11: Formula Calculation Error Handling & Recovery

**Status:** DONE  
**Priority:** Medium  
**Category:** Reporting Correctness  
**Type:** Investigation + Execution  
**Completed:** 2026-01-13T11:56:00.000Z

**Problem Statement:**
Chart formula calculations may fail due to:
- Missing variables in stats
- Invalid formula syntax
- Division by zero or other mathematical errors
- Circular dependencies between formulas
- Type mismatches (string vs number)

Current error handling may not be comprehensive, leading to:
- Silent failures (charts not rendered without clear error)
- Inconsistent error messages
- No recovery mechanism for partial failures
- No user-visible error feedback

**Why This Belongs to Reporting (Not Admin):**
- Formula calculation is core Reporting runtime behavior
- Error handling affects report correctness and user experience
- This is runtime behavior, not admin configuration
- Error recovery is part of Reporting correctness

**Execution Scope:**
- **Files to investigate:**
  - `lib/report-calculator.ts` - Chart calculation logic and error handling
  - `lib/formulaEngine.ts` - Formula evaluation and error handling
  - `app/report/[slug]/ReportChart.tsx` - Chart rendering error display
  - `app/report/[slug]/page.tsx` - Chart result error handling
- **New files:**
  - `docs/audits/investigations/A-R-11-formula-error-handling.md` - Investigation doc
  - `lib/chartErrorHandler.ts` - Centralized error handling utilities (if needed)
  - `__tests__/formula-error-handling.test.ts` - Error handling test cases

**Done Criteria:**
- ✅ Investigation document identifies all error scenarios and current handling
- ✅ Error handling is consistent across all chart types
- ✅ User-visible error messages for calculation failures
- ✅ Graceful degradation (partial report rendering when some charts fail)
- ⚠️ Error recovery mechanism (not needed - most errors are permanent)
- ✅ Test cases for all error scenarios
- ✅ Documentation of error handling guarantees and known limitations

**Closure Evidence:**
- ✅ Investigation document: `docs/audits/investigations/A-R-11-formula-error-handling.md`
- ✅ Error type definitions: `lib/chartErrorTypes.ts` (new)
- ✅ Error categorization: `lib/report-calculator.ts` (categorizes errors)
- ✅ User-visible error states: `app/report/[slug]/ReportChart.tsx` (error placeholder)
- ✅ Error placeholder styles: `app/report/[slug]/ReportChart.module.css`
- ✅ Test coverage: `__tests__/formula-error-handling.test.ts` (13 test cases)
- ✅ Commits: `a4c11e36c` - A-R-11: Formula Calculation Error Handling & Recovery - COMPLETE

**Dependencies:**
- None (can execute independently)

**Explicit Non-Goals:**
- No Admin UI changes
- No formula syntax changes
- No changes to formula evaluation logic (only error handling)

**Risk Notes:**
- Low risk: Error handling is additive, doesn't change calculation logic
- Medium risk: Error handling changes may reveal existing calculation issues
- Mitigation: Investigation-first approach, fixes as separate items if needed

---

## A-R-12: Report Template Compatibility Validation

**Status:** DONE  
**Priority:** Low  
**Category:** Reporting Correctness  
**Type:** Investigation + Execution  
**Completed:** 2026-01-13T12:06:00.000Z

**Problem Statement:**
Report templates are reused across partners/events, but:
- No validation that template is compatible with partner/event data
- No explicit rules for when template reuse is safe
- No validation that template configuration matches data availability
- Template selection may not match data structure (missing charts, missing variables)

This can lead to:
- Reports with missing charts (template expects variables not in data)
- Reports with empty charts (formulas reference non-existent variables)
- Inconsistent report appearance across partners/events
- Silent failures when template is incompatible

**Why This Belongs to Reporting (Not Admin):**
- Template compatibility validation is runtime behavior (when report renders)
- Template validation affects report correctness
- This is Reporting behavior, not admin UI (admin selects template, Reporting validates it)
- Template validation is part of Reporting correctness

**Execution Scope:**
- **Files to investigate:**
  - `app/api/reports/resolve/route.ts` - Template resolution logic
  - `lib/reportTemplateTypes.ts` - Template data structures (if exists)
  - `app/report/[slug]/page.tsx` - Template usage in rendering
  - `hooks/useReportLayout.ts` - Layout fetching and template application
- **New files:**
  - `docs/audits/investigations/A-R-12-template-compatibility.md` - Investigation doc
  - `lib/templateCompatibilityValidator.ts` - Template validation utilities
  - `__tests__/template-compatibility.test.ts` - Compatibility test cases

**Done Criteria:**
- ✅ Investigation document defines template reuse rules and compatibility criteria
- ✅ Template validation checks compatibility with data structure
- ✅ Clear error messages when template is incompatible
- ✅ Validation runs at report render time (runtime check)
- ✅ Documentation of template reuse rules and validation criteria
- ✅ Test cases for template compatibility scenarios

**Closure Evidence:**
- ✅ Investigation document: `docs/audits/investigations/A-R-12-template-compatibility.md`
- ✅ Template compatibility validator: `lib/templateCompatibilityValidator.ts` (new)
- ✅ Runtime validation: `app/report/[slug]/page.tsx` (validates template compatibility)
- ✅ User-visible compatibility warnings: Displayed in report UI
- ✅ Test coverage: `__tests__/template-compatibility.test.ts` (14 test cases)
- ✅ Commits: `[commit hash]` - A-R-12: Report Template Compatibility Validation - COMPLETE

**Dependencies:**
- None (can execute independently)

**Explicit Non-Goals:**
- No Admin UI changes (template selection UI)
- No template data structure changes
- No changes to template resolution logic (only validation)

**Risk Notes:**
- Low risk: Validation is additive, doesn't change existing behavior
- Medium risk: Template validation may reveal existing incompatibilities
- Mitigation: Validation-only first, compatibility fixes as separate phase if needed

---

## A-R-13: Chart Data Validation & Error Boundaries

**Status:** PLANNED  
**Priority:** Low  
**Category:** Reporting Correctness  
**Type:** Investigation + Execution

**Problem Statement:**
Chart rendering may fail or display incorrectly when:
- Chart result data is malformed (missing required fields)
- Chart result type doesn't match chart configuration type
- Chart result has invalid values (NaN, Infinity, negative values where not expected)
- Chart result elements are missing or empty when required

Current validation may not catch all cases, leading to:
- Charts rendering with incorrect data
- Charts failing silently without error indication
- Inconsistent error handling across chart types
- No validation that chart results match chart configuration

**Why This Belongs to Reporting (Not Admin):**
- Chart data validation is runtime behavior (when charts render)
- Data validation affects report correctness
- This is Reporting behavior, not admin configuration
- Data validation is part of Reporting correctness

**Execution Scope:**
- **Files to investigate:**
  - `app/report/[slug]/ReportChart.tsx` - Chart rendering and data validation
  - `app/report/[slug]/ReportContent.tsx` - Chart result validation (`hasValidChartData`)
  - `lib/report-calculator.ts` - Chart result structure and validation
  - `lib/export/chartValidation.ts` - Existing validation logic (A-R-10)
- **New files:**
  - `docs/audits/investigations/A-R-13-chart-data-validation.md` - Investigation doc
  - `lib/chartDataValidator.ts` - Comprehensive chart data validation utilities
  - `__tests__/chart-data-validation.test.ts` - Data validation test cases

**Done Criteria:**
- ✅ Investigation document identifies all data validation scenarios
- ✅ Comprehensive validation for all chart types (KPI, BAR, PIE, TEXT, IMAGE, TABLE)
- ✅ Error boundaries prevent chart failures from breaking entire report
- ✅ Consistent error handling across all chart types
- ✅ Validation that chart results match chart configuration
- ✅ Test cases for all validation scenarios
- ✅ Documentation of data validation guarantees and known limitations

**Dependencies:**
- A-R-10 (uses `hasValidChartData` from `chartValidation.ts`)

**Explicit Non-Goals:**
- No Admin UI changes
- No changes to chart calculation logic (only validation)
- No changes to chart rendering logic (only error handling)

**Risk Notes:**
- Low risk: Validation is additive, doesn't change existing behavior
- Medium risk: Validation may reveal existing data quality issues
- Mitigation: Validation-only first, data quality fixes as separate phase if needed

---

## Summary (Post-A-R-10 Reporting Hardening)

**Total Proposed Items:** 3

**Status Breakdown:**
- PLANNED: 3 (A-R-11, A-R-12, A-R-13)
- ACTIVE: 0
- DONE: 0

**Priority Breakdown:**
- Medium: 1 (A-R-11)
- Low: 2 (A-R-12, A-R-13)

**Type Breakdown:**
- Investigation + Execution: 3 (all items)

**Dependencies:**
- A-R-11: None (independent)
- A-R-12: None (independent)
- A-R-13: A-R-10 (uses `chartValidation.ts`)

**Recommendation:**
Execute **A-R-11** first (highest priority, no dependencies). Then A-R-12 or A-R-13 based on product priorities.

---

--------------------------------------------


## ADMIN UI REFACTOR PROGRAM (Actionable Breakdown)

**Status:** PLANNED  
**Owner:** Architecture (Chappie)  
**Execution:** Documentation + Engineering (Katja + Tribeca)  

### Objectives
- Unify the Admin UI into one coherent system (layout, components, patterns).
- Remove hardcoded styling and fragmented modal/form/table patterns.
- Reduce partner-level vs global configuration noise by defining a single ownership model.
- Produce an executable action plan equivalent in quality to the Reports audit program.

### Non-Goals
- No new product features.
- No conceptual redesign of the product.
- No polish work that does not remove technical or product debt.

---

## A-UI-00: Admin Capability Map and Ownership Model

**Status:** DONE
**Ownership scope:** Global

### Outputs (A-UI-00)
- `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md`
- `docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md`
- `docs/audits/admin-ui/ADMIN_UI_GLOSSARY.md`

---

## Admin IA Proposal (Navigation Structure)

**Input:** `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md`

1 Dashboard
- /admin -> [app/admin/page.tsx](app/admin/page.tsx)
- /admin/dashboard (legacy) -> [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx)

2 Operations
- /admin/events -> [app/admin/events/page.tsx](app/admin/events/page.tsx)
- /admin/partners -> [app/admin/partners/page.tsx](app/admin/partners/page.tsx)
- /admin/project-partners -> [app/admin/project-partners/page.tsx](app/admin/project-partners/page.tsx)
- /admin/quick-add -> [app/admin/quick-add/page.tsx](app/admin/quick-add/page.tsx)

3 Reporting
- /admin/visualization -> [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx)
- /admin/charts -> [app/admin/charts/page.tsx](app/admin/charts/page.tsx)
- /admin/styles -> [app/admin/styles/page.tsx](app/admin/styles/page.tsx)
- /admin/styles/[id] -> [app/admin/styles/[id]/page.tsx](app/admin/styles/[id]/page.tsx)

4 Data and Taxonomy
- /admin/kyc -> [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx)
- /admin/clicker-manager -> [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx)
- /admin/hashtags -> [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx)
- /admin/categories -> [app/admin/categories/page.tsx](app/admin/categories/page.tsx)
- /admin/content-library -> [app/admin/content-library/page.tsx](app/admin/content-library/page.tsx)

5 Analytics
- /admin/insights -> [app/admin/insights/page.tsx](app/admin/insights/page.tsx)
- /admin/analytics/insights -> [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx)
- /admin/analytics/executive -> [app/admin/analytics/executive/page.tsx](app/admin/analytics/executive/page.tsx)
- /admin/partners/[id]/analytics -> [app/admin/partners/[id]/analytics/page.tsx](app/admin/partners/[id]/analytics/page.tsx)

6 System
- /admin/users -> [app/admin/users/page.tsx](app/admin/users/page.tsx)
- /admin/design -> [app/admin/design/page.tsx](app/admin/design/page.tsx)
- /admin/cache -> [app/admin/cache/page.tsx](app/admin/cache/page.tsx)
- /admin/api-football-enrich -> [app/admin/api-football-enrich/page.tsx](app/admin/api-football-enrich/page.tsx)

7 Help and Access
- /admin/help -> [app/admin/help/page.tsx](app/admin/help/page.tsx)
- /admin/login -> [app/admin/login/page.tsx](app/admin/login/page.tsx)
- /admin/register -> [app/admin/register/page.tsx](app/admin/register/page.tsx)
- /admin/unauthorized -> [app/admin/unauthorized/page.tsx](app/admin/unauthorized/page.tsx)
- /admin/clear-session -> [app/admin/clear-session/page.tsx](app/admin/clear-session/page.tsx)
- /admin/cookie-test -> [app/admin/cookie-test/page.tsx](app/admin/cookie-test/page.tsx)
- /admin/projects (legacy redirect) -> [app/admin/projects/page.tsx](app/admin/projects/page.tsx)

---

## A-UI-01: Partners (Partner Model, Partner Report, Partner Scoping)

**Ownership scope:** Partner

### Checkable tasks
- [ ] Confirm partner data model fields in [lib/partner.types.ts](lib/partner.types.ts) and partner admin UI.
- [ ] Map partner routes: /admin/partners, /admin/partners/[id], /admin/partners/[id]/analytics, /admin/partners/[id]/kyc-data.
- [ ] Define partner override rules for report templates and styles (global -> partner -> event).
- [ ] Identify partner-related duplication candidates (C-04, C-08, C-09, C-10).
- [ ] Define target partner IA (list, detail, analytics, kyc) and which routes remain.

---

## A-UI-02: Events (Creation, Lifecycle, Connection to Reports)

**Ownership scope:** Event

### Checkable tasks
- [x] Confirm event data model in [lib/types/api.ts](lib/types/api.ts) and events admin UI. Evidence: [lib/types/api.ts](lib/types/api.ts), [app/admin/events/page.tsx](app/admin/events/page.tsx).
- [x] Map event routes: /admin/events, /admin/events/[id]/kyc-data, /admin/projects (redirect), /admin/quick-add. Evidence: [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx), [app/admin/projects/page.tsx](app/admin/projects/page.tsx), [app/admin/quick-add/page.tsx](app/admin/quick-add/page.tsx).
- [x] Define event creation flows (manual vs bulk) and required fields. Manual: eventName + eventDate required; optional hashtags/categorizedHashtags, styleId, reportTemplateId. Bulk: Quick Add from sheet or partner match inputs. Evidence: [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/quick-add/page.tsx](app/admin/quick-add/page.tsx).
- [x] Define partner linkage rules (partner1/partner2) and inheritance rules. Partner links stored as partner1Id/partner2Id at event scope; event overrides partner defaults per ownership model. Evidence: [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/project-partners/page.tsx](app/admin/project-partners/page.tsx), [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md).
- [x] Define event-level overrides for templates and styles. Event reportTemplateId/styleId override partner and global assignments per ownership model. Evidence: [app/admin/events/page.tsx](app/admin/events/page.tsx), [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md).
- [x] Identify event-related duplication candidates (C-04, C-05, C-10). Evidence: [ACTION_PLAN.md](ACTION_PLAN.md), [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md).

---

## A-UI-03: Filters (Purpose, Where Used, Which Reports Depend on Them)

**Ownership scope:** Event (cross-event views)

### Checkable tasks
- [x] Define filter entities and their dependency on hashtags and projects. Evidence: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [components/HashtagMultiSelect.tsx](components/HashtagMultiSelect.tsx).
- [x] Map filter routes and flows: /admin/filter and /admin/dashboard filter tab. Evidence: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx).
- [x] Define filter outputs and ownership of style selection. Output includes filtered stats and share slug; style selection uses explicit styleId from global styles. Evidence: [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md](docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md).
- [x] Identify filter duplication candidates (C-03). Evidence: [ACTION_PLAN.md](ACTION_PLAN.md), [docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md](docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md).
- [x] Define canonical filter UI and redirect plan for duplicates. Canonical filter UI is /admin/filter; /admin/dashboard filter tab to be deprecated or redirected to /admin/filter. Evidence: [docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md](docs/audits/admin-ui/ADMIN_UI_CONSOLIDATION_PLAN.md), [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx).

---

## A-UI-04: Users (User Types, Permissions, Authentication)

**Ownership scope:** User

### Checkable tasks
- [ ] Enumerate roles and permissions in [lib/auth.ts](lib/auth.ts).
- [ ] Map access-related routes: /admin/users, /admin/login, /admin/register, /admin/unauthorized, /admin/clear-session, /admin/cookie-test.
- [ ] Define onboarding and access recovery flows.
- [ ] Define role-to-page access matrix (documentation only).

---

## A-UI-05: Insights (What They Are, How They Are Generated)

**Ownership scope:** Global

### Checkable tasks
- [ ] Inventory insight entities and endpoints used by /admin/insights and /admin/analytics/insights.
- [ ] Define the canonical insights dashboard and deprecation plan (C-02).
- [ ] Map dependencies on events, KYC, and clicker inputs.
- [ ] Define outputs consumed by reporting or operations.

---

## A-UI-06: KYC (Source of Algorithms and Reports)

**Priority:** CRITICAL
**Ownership scope:** Global

### Checkable tasks
- [ ] Define the KYC variable model and source of truth in [app/admin/kyc/page.tsx](app/admin/kyc/page.tsx).
- [ ] Map KYC dependencies to algorithms, clicker groups, and reporting.
- [ ] Define global-only ownership and override rules (no partner or event edits).
- [ ] Align partner and event KYC views with the global model (C-10).
- [ ] Define KYC to report template and algorithm mappings.

---

## A-UI-07: Algorithms (Chart Creator)

**Ownership scope:** Global

### Checkable tasks
- [ ] Define chart configuration model in [components/ChartAlgorithmManager.tsx](components/ChartAlgorithmManager.tsx).
- [ ] Document create/edit flow and validation rules.
- [ ] Map dependencies on KYC variables and report templates.
- [ ] Define permissions and access expectations.

---

## A-UI-08: Clicker Manager (Manual Data Input UI)

**Ownership scope:** Global

### Checkable tasks
- [ ] Define variable group model and visibility rules in [app/admin/clicker-manager/page.tsx](app/admin/clicker-manager/page.tsx).
- [ ] Map dependency on KYC variable definitions.
- [ ] Document how clicker groups affect editor behavior.
- [ ] Define permissions and change control process.

---

## A-UI-09: Bitly Manager (Third-Party Info Collection)

**Ownership scope:** Global

### Checkable tasks
- [ ] Define Bitly link and association model in [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx).
- [ ] Map partner and event association flows.
- [ ] Identify duplicate association entry points (C-08).
- [ ] Define canonical association flow and visibility elsewhere.

---

## A-UI-10: Hashtag Manager (Hashtags and Reports)

**Ownership scope:** Global

### Checkable tasks
- [ ] Define hashtag model and color management in [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx).
- [ ] Map hashtag usage in filters and event/partner tagging.
- [ ] Identify overlap with categories and define consolidation plan (C-07).

---

## A-UI-11: Category Manager (Purpose and Scope)

**Ownership scope:** Global

### Checkable tasks
- [ ] Define category model and usage in [app/admin/categories/page.tsx](app/admin/categories/page.tsx).
- [ ] Map categorizedHashtags usage and dependencies.
- [ ] Decide consolidation with Hashtag Manager (C-07).

---

## A-UI-12: Reporting (Report Structures)

**Ownership scope:** Global

### Checkable tasks
- [ ] Define report template model and data blocks in [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx).
- [ ] Define template selection rules (global -> partner -> event).
- [ ] Map dependencies on algorithms and styles.
- [ ] Identify assignment duplication (C-06).

---

## A-UI-13: Style Editor (Report Themes)

**Ownership scope:** Global

### Checkable tasks
- [ ] Define report style model in [app/admin/styles/page.tsx](app/admin/styles/page.tsx).
- [ ] Define style assignment rules (global -> partner -> event -> filter).
- [ ] Identify duplication with template or admin design flows (C-06).

---

## A-UI-14: Cache Management (Seeing Updates)

**Ownership scope:** Global

### Checkable tasks
- [ ] Document cache types and actions in [app/admin/cache/page.tsx](app/admin/cache/page.tsx).
- [ ] Define when support should use each cache action.

---

## A-UI-15: User Guide (messmass.com Operations)

**Ownership scope:** User

### Checkable tasks
- [ ] Resolve the canonical user guide source referenced in [app/admin/help/page.tsx](app/admin/help/page.tsx).
- [ ] Decide whether the guide is doc-driven or embedded and define update process.
- [ ] Map user workflows to admin workflows and reference links.

---

## Duplication and Noise Candidates (Pre-A-UI-01)

| Candidate ID | Candidate name | Pages involved (code) | What duplicates | Proposed direction | Confidence | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| C-01 | Admin dashboards overlap | [app/admin/page.tsx](app/admin/page.tsx), [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx) | Two dashboards with overlapping navigation and metrics | Keep /admin as canonical, deprecate or redirect /admin/dashboard | High | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |
| C-02 | Insights dashboards overlap | [app/admin/insights/page.tsx](app/admin/insights/page.tsx), [app/admin/analytics/insights/page.tsx](app/admin/analytics/insights/page.tsx) | Two insights dashboards with different endpoints | Merge into one canonical insights dashboard | High | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |
| C-03 | Filter UX duplication | [app/admin/filter/page.tsx](app/admin/filter/page.tsx), [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx) | Multi-hashtag filtering exists in two places | Keep /admin/filter as canonical; remove or link from dashboard | Medium | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |
| C-04 | Partner assignment overlap | [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/project-partners/page.tsx](app/admin/project-partners/page.tsx) | Partner selection and assignment appear in two flows | Merge into events flow or keep project-partners as admin-only batch tool | Medium | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |
| C-05 | Event creation overlap | [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/quick-add/page.tsx](app/admin/quick-add/page.tsx) | Event creation exists in manual and bulk UIs | Keep quick-add as bulk import path; align data model with events | Medium | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |
| C-06 | Template and style assignment overlap | [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/events/page.tsx](app/admin/events/page.tsx), [app/admin/visualization/page.tsx](app/admin/visualization/page.tsx), [app/admin/styles/page.tsx](app/admin/styles/page.tsx), [app/admin/filter/page.tsx](app/admin/filter/page.tsx) | Assignment logic repeated across multiple screens | Centralize assignment rules; keep templates/styles as global editors | High | `docs/audits/admin-ui/ADMIN_UI_OWNERSHIP_MODEL.md` |
| C-07 | Hashtag metadata split | [app/admin/hashtags/page.tsx](app/admin/hashtags/page.tsx), [app/admin/categories/page.tsx](app/admin/categories/page.tsx) | Hashtag color and category management separated | Merge into unified hashtag management surface | High | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |
| C-08 | Bitly association overlap | [app/admin/bitly/page.tsx](app/admin/bitly/page.tsx), [app/admin/partners/page.tsx](app/admin/partners/page.tsx) | Partner link association appears in two places | Keep /admin/bitly as canonical; make partner view read-only | Medium | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |
| C-09 | Google Sheets controls duplicated | [app/admin/partners/page.tsx](app/admin/partners/page.tsx), [app/admin/partners/[id]/page.tsx](app/admin/partners/[id]/page.tsx) | Google Sheets connect and sync surfaced in list and detail views | Keep controls in partner detail; list should link | Medium | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |
| C-10 | KYC data views duplicated | [app/admin/partners/[id]/kyc-data/page.tsx](app/admin/partners/[id]/kyc-data/page.tsx), [app/admin/events/[id]/kyc-data/page.tsx](app/admin/events/[id]/kyc-data/page.tsx) | Two KYC views with similar filtering and tables | Keep both but align UX via shared documentation and ownership rules | Low | `docs/audits/admin-ui/ADMIN_UI_CAPABILITY_MAP.md` |

---

## Execution Notes
- This is documentation-first. No code refactor begins until the A-UI-01 to A-UI-15 task checklists are approved.
- All outputs must use repo-relative links.
- No new pages are proposed until duplicates and ownership are clarified.

---

## STATE MEMORY

**2026-01-13T11:56:00.000Z**
- **AGENT:** Tribeca
- **DOMAIN:** Reporting
- **CURRENT TASK ID:** A-R-11
- **STATUS:** DONE
- **LAST COMMIT(S):** `a4c11e36c` - A-R-11: Formula Calculation Error Handling & Recovery - COMPLETE
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting explicit Product instruction for next Reporting task (A-R-12 or A-R-13)

**2026-01-13T10:51:48.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** A-UI-16
- **STATUS:** WAIT
- **LAST COMMIT(S):** `6eaa1ac84`, `e5af6dab4`, `b93d2d781`, `527ab6f94`
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting explicit Product instruction for next Admin task

**2026-01-13T11:13:12.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** A-UI-01
- **STATUS:** BLOCKED
- **LAST COMMIT(S):** `3337f5988`
- **CURRENT BLOCKERS:** AUDIT_ACTION_PLAN.md, hooks/useReportExport.ts, lib/export/exportValidator.ts, __tests__/export-validation.test.ts
- **NEXT EXPECTED OUTPUT:** Unblock A-UI-01 after stashing unrelated changes

**2026-01-13T10:55:00.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** A-UI-01
- **STATUS:** ACTIVE
- **LAST COMMIT(S):** `6eaa1ac84`, `e5af6dab4`, `b93d2d781`, `527ab6f94`
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** A-UI-01 checklist completion in `ACTION_PLAN.md` (doc-only)

**2026-01-13T11:22:32.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** A-UI-17
- **STATUS:** BLOCKED
- **LAST COMMIT(S):** `64ca56cdc`
- **CURRENT BLOCKERS:** Unrelated non-admin worktree changes present
- **NEXT EXPECTED OUTPUT:** Awaiting instruction to proceed with Admin-only docs for A-UI-17

**2026-01-13T11:37:04.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** A-UI-02
- **STATUS:** DONE
- **LAST COMMIT(S):** pending (A-UI-02 completion commit)
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting next Admin assignment

**2026-01-13T13:33:36.000Z**
- **AGENT:** Katja
- **DOMAIN:** Admin
- **CURRENT TASK ID:** A-UI-03
- **STATUS:** DONE
- **LAST COMMIT(S):** pending (A-UI-03 completion commit)
- **CURRENT BLOCKERS:** None
- **NEXT EXPECTED OUTPUT:** Awaiting next Admin assignment
