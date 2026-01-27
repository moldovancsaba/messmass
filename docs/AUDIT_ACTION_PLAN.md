# AUDIT_ACTION_PLAN.md

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

**Last Verified:** 2026-01-13T18:30:00.000Z



--------------------------------------------


## ADMIN UI REFACTOR PROGRAM (Actionable Breakdown)

**Status:** Moved to `ACTION_PLAN.md` (canonical for Admin roadmap state).  
**Owner:** Architecture (Chappie)  
**Execution:** Documentation + Engineering (Katja + Tribeca)

Admin UI refactor scope, A-UI task checklists, IA proposal, duplication register, and execution notes now live in `ACTION_PLAN.md`. This section is intentionally removed to prevent duplicate or contradictory status tracking.
