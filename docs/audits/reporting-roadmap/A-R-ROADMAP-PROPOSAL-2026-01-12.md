# Next Reporting Roadmap Slice

**Date:** 2026-01-12T10:50:00.000Z  
**Status:** PROPOSAL  
**Owner:** Tribeca (Reporting)  
**Reference:** [AUDIT_ACTION_PLAN.md](../AUDIT_ACTION_PLAN.md), [A-BASELINE-VERIFICATION-2026-01-12.md](../investigations/A-BASELINE-VERIFICATION-2026-01-12.md)

---

## Context

A-01 through A-06 are complete and verified. The Reporting system now has:
- ✅ Layout Grammar compliance (P0 1.1-1.3)
- ✅ Deterministic height resolution (P1 1.4)
- ✅ Unified typography (P1 1.5)
- ✅ Editor integration (A-01)
- ✅ Migration tooling (A-02)
- ✅ Runtime enforcement (A-05)

**Next focus:** Reporting correctness, export fidelity, and behavior guarantees beyond Layout Grammar.

---

## Proposed Reporting Roadmap Items

### A-R-07: Export Correctness & Validation

**Priority:** Medium  
**Category:** Reporting Correctness

**Problem Statement:**
Export functionality (CSV, PDF) exists but has known issues:
- Silent failures when data isn't ready (no clear user feedback)
- Missing validation for export readiness
- Export output may not match rendered report (format inconsistencies)
- No verification that exported data is complete and accurate

**Why This Belongs to Reporting (Not Admin):**
- Export is a core Reporting feature (users export reports)
- Export correctness affects report fidelity and user trust
- Export validation is runtime behavior, not admin configuration
- Export format consistency is a Reporting correctness requirement

**Execution Scope:**
- **Files to modify:**
  - `hooks/useReportExport.ts` - Add comprehensive validation
  - `lib/export/csv.ts` - Verify data completeness
  - `lib/export/pdf.ts` - Verify layout consistency
  - `app/report/[slug]/page.tsx` - Export readiness checks
- **New files:**
  - `lib/export/exportValidator.ts` - Export validation utilities
  - `docs/audits/investigations/A-R-07-export-correctness.md` - Investigation doc

**Done Criteria:**
- ✅ Export handlers validate data readiness before export
- ✅ Clear error messages when export cannot proceed
- ✅ Export output verified to match rendered report (CSV data matches chart results, PDF layout matches rendered layout)
- ✅ Export completeness checks (all charts, all data blocks included)
- ✅ Documentation of export validation rules and failure modes
- ✅ Test cases for export failure scenarios

**Risk Notes:**
- Low risk: Export validation is additive, doesn't change existing behavior
- Medium risk: Export format changes may affect downstream consumers (if any)
- Mitigation: Validation-only changes first, format consistency as separate phase

---

### A-R-08: Render Determinism Guarantees

**Priority:** Medium  
**Category:** Reporting Correctness

**Problem Statement:**
Layout Grammar ensures deterministic layout, but other sources of non-determinism may exist:
- Chart data calculation order dependencies
- Font loading timing (if any)
- Image loading and aspect ratio calculation
- Conditional rendering based on data availability
- Race conditions in data fetching

**Why This Belongs to Reporting (Not Admin):**
- Render determinism is a core Reporting requirement (same input → same output)
- Non-deterministic rendering affects report reliability and user trust
- This is runtime behavior, not admin configuration
- Determinism guarantees are part of Reporting correctness

**Execution Scope:**
- **Files to investigate:**
  - `app/report/[slug]/ReportContent.tsx` - Render order dependencies
  - `app/report/[slug]/ReportChart.tsx` - Chart rendering determinism
  - `lib/chartDataCalculator.ts` - Data calculation order
  - `lib/fontSyncCalculator.ts` - Font calculation determinism
- **New files:**
  - `docs/audits/investigations/A-R-08-render-determinism.md` - Investigation doc
  - `__tests__/render-determinism.test.ts` - Determinism test harness

**Done Criteria:**
- ✅ Investigation document identifies all sources of non-determinism
- ✅ Determinism test harness verifies same input → same output
- ✅ All identified non-deterministic behaviors documented and prioritized
- ✅ Critical non-determinism sources fixed (if any)
- ✅ Documentation of determinism guarantees and known limitations

**Risk Notes:**
- Low risk: Investigation-only phase first, fixes applied only if critical issues found
- Medium risk: Fixing non-determinism may require architectural changes
- Mitigation: Investigation first, fixes as separate execution items if needed

---

### A-R-09: Report Template Reuse Rules & Validation

**Priority:** Low  
**Category:** Reporting Behavior

**Problem Statement:**
Report templates are reused across partners/events, but reuse rules are implicit:
- No validation that template is compatible with partner/event data
- No explicit rules for when template reuse is safe
- No validation that template configuration matches data availability
- Template selection may not match data structure (missing charts, missing data)

**Why This Belongs to Reporting (Not Admin):**
- Template reuse validation is runtime behavior (when report renders)
- Template compatibility affects report correctness
- This is Reporting behavior, not admin UI (admin selects template, Reporting validates it)
- Template validation is part of Reporting correctness

**Execution Scope:**
- **Files to investigate:**
  - `app/api/reports/resolve/route.ts` - Template resolution logic
  - `lib/reportTemplateTypes.ts` - Template data structures
  - `app/report/[slug]/page.tsx` - Template usage in rendering
- **New files:**
  - `lib/reportTemplateValidator.ts` - Template validation utilities
  - `docs/audits/investigations/A-R-09-template-reuse-rules.md` - Investigation doc

**Done Criteria:**
- ✅ Investigation document defines template reuse rules
- ✅ Template validation checks compatibility with data structure
- ✅ Clear error messages when template is incompatible
- ✅ Documentation of template reuse rules and validation criteria
- ✅ Test cases for template compatibility scenarios

**Risk Notes:**
- Low risk: Validation is additive, doesn't change existing behavior
- Medium risk: Template validation may reveal existing incompatibilities
- Mitigation: Validation-only first, compatibility fixes as separate phase if needed

---

### A-R-10: Export Format Consistency

**Priority:** Low  
**Category:** Reporting Correctness

**Problem Statement:**
CSV and PDF exports may not match rendered report:
- CSV may include data not visible in rendered report
- PDF layout may differ from rendered layout (page breaks, scaling)
- Export may use different data sources than rendered report
- Export may not respect Layout Grammar constraints (if applicable)

**Why This Belongs to Reporting (Not Admin):**
- Export format consistency is a Reporting correctness requirement
- Export fidelity affects user trust and report accuracy
- This is runtime behavior, not admin configuration
- Export consistency is part of Reporting correctness

**Execution Scope:**
- **Files to investigate:**
  - `lib/export/csv.ts` - CSV export data sources
  - `lib/export/pdf.ts` - PDF export layout and data sources
  - `app/report/[slug]/page.tsx` - Rendered report data sources
- **New files:**
  - `docs/audits/investigations/A-R-10-export-format-consistency.md` - Investigation doc
  - `__tests__/export-consistency.test.ts` - Export consistency test harness

**Done Criteria:**
- ✅ Investigation document identifies format inconsistencies
- ✅ Export consistency test harness verifies CSV/PDF match rendered report
- ✅ All identified inconsistencies documented and prioritized
- ✅ Critical inconsistencies fixed (if any)
- ✅ Documentation of export format guarantees and known limitations

**Risk Notes:**
- Low risk: Investigation-only phase first, fixes applied only if critical issues found
- Medium risk: Fixing format inconsistencies may require export logic changes
- Mitigation: Investigation first, fixes as separate execution items if needed

---

## Recommendation: Execute A-R-07 First

**Rationale:**
1. **Highest Impact:** Export correctness directly affects user experience and trust
2. **Clear Problem:** Known issues (silent failures, missing validation) with concrete fixes
3. **Low Risk:** Validation is additive, doesn't change existing behavior
4. **Evidence-Driven:** Can verify export correctness with test cases
5. **Completes Reporting Hardening:** Export is the final output of Reporting system

**Execution Plan:**
1. **Investigation Phase:** Document current export behavior, identify all failure modes
2. **Validation Phase:** Add comprehensive export readiness checks
3. **Consistency Phase:** Verify export output matches rendered report
4. **Documentation Phase:** Document export validation rules and guarantees

**Estimated Scope:**
- Investigation: 1-2 days
- Implementation: 2-3 days
- Testing: 1-2 days
- Documentation: 1 day
- **Total: 5-8 days**

---

## Alternative: Execute A-R-08 First

**Rationale:**
1. **Foundation for Correctness:** Render determinism is foundational for all Reporting guarantees
2. **Prevents Future Issues:** Identifying non-determinism early prevents hard-to-debug issues
3. **Investigation-Only:** Can be investigation-only first, fixes as separate items

**Execution Plan:**
1. **Investigation Phase:** Identify all sources of non-determinism
2. **Test Harness Phase:** Create determinism test harness
3. **Documentation Phase:** Document determinism guarantees and known limitations
4. **Fix Phase (if needed):** Fix critical non-determinism sources as separate items

**Estimated Scope:**
- Investigation: 2-3 days
- Test Harness: 1-2 days
- Documentation: 1 day
- **Total: 4-6 days (investigation-only)**

---

## Summary

**Proposed Items:**
1. **A-R-07:** Export Correctness & Validation (Medium priority, recommended first)
2. **A-R-08:** Render Determinism Guarantees (Medium priority, alternative first)
3. **A-R-09:** Report Template Reuse Rules & Validation (Low priority)
4. **A-R-10:** Export Format Consistency (Low priority)

**All items:**
- Belong to Reporting domain (runtime behavior, correctness)
- Are evidence-driven (investigation-first approach)
- Have clear problem statements and done criteria
- Follow same standard as A-01 → A-06

**Next Step:** Await instruction on which item to execute first (A-R-07 recommended).

---

**Prepared By:** Tribeca  
**Date:** 2026-01-12T10:50:00.000Z
