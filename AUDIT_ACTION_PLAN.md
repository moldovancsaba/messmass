# AUDIT_ACTION_PLAN.md

**Version:** 1.0.0  
**Created:** 2026-01-12T00:09:33.679Z  
**Last Reviewed:** 2026-01-12T00:09:33.679Z  
**Last Updated:** 2026-01-12T00:09:33.679Z  
**Status:** ACTIVE  
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
**Status:** PLANNED

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

---

### A-02: Layout Grammar Migration Tooling

**Title:** Layout Grammar Migration Tooling  
**Origin:** P1 1.5 (Explicit Non-Goals), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Medium  
**Status:** PLANNED

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

---

### A-03: Height Calculation Accuracy Improvements

**Title:** Height Calculation Accuracy Improvements  
**Origin:** P1 1.4 (Residual Risks), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Medium  
**Status:** PLANNED

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

---

### A-04: Typography Scaling Edge Cases

**Title:** Typography Scaling Edge Cases  
**Origin:** P1 1.5 (Residual Risks), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Low  
**Status:** PLANNED

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

---

### A-05: Layout Grammar Runtime Enforcement

**Title:** Layout Grammar Runtime Enforcement  
**Origin:** P1 1.4 (Residual Risks), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Medium  
**Status:** PLANNED

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

---

### A-06: Performance Optimization Pass

**Title:** Performance Optimization Pass  
**Origin:** P1 1.5 (Explicit Non-Goals), ROADMAP.md (Hardening & Follow-ups)  
**Priority:** Low  
**Status:** PLANNED

**Description:**
No performance optimizations were applied beyond what was necessary for correctness during the audit. Render performance improvements for large reports may be needed. Memory optimization for chart rendering may be beneficial.

**Technical Intent:**
- Performance optimizations beyond correctness requirements
- Render performance improvements for large reports
- Memory optimization for chart rendering
- Performance profiling and optimization pass

**Non-Goals:**
- Correctness was prioritized over performance in audit
- This is optimization, not correctness
- No changes to Layout Grammar compliance or typography unification

**Dependency / Trigger:**
- None (can be done independently)
- Performance profiling or user-reported performance issues
- Business need for performance improvements

**Owner:** Engineering

**Closure Evidence Required:**
- Performance profiling completed
- Optimization changes implemented
- Performance metrics documented
- Commit with performance optimizations

---

## Summary

**Total Action Items:** 6

**Status Breakdown:**
- PLANNED: 6
- BLOCKED: 0
- IN PROGRESS: 0
- DONE: 0
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

**Last Verified:** 2026-01-12T00:09:33.679Z
