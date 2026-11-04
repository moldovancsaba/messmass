# Concept Brief: Unification & Hardening of KYC, Algorithms, and Charts

**Date:** 2026-11-04  
**Author:** Moldovan Csaba Zoltan  
**Status:** In Review (EGM Goldfish Swarm)  
**Related Issues:** #125 (Report Content Slots Management), #126 (Variables System Enhancements), #389 (Formula Parser Rollback), #414 (Dual Engine Consolidation)  

---

## 1. Problem Statement & Operational Breakdowns

Messmass currently suffers from systemic fragility across the pipeline connecting data collection (KYC), calculation (Algorithms/Formulas), and presentation (Charts/Reports):

1. **Tokenizer Crash on String Tokens:** In `lib/formulaEngine.ts`, `tokenizeExpression` throws an unhandled `Error: Unsupported token: "` whenever text charts, image variables, or Content Library tokens (`[TEXT:slug]`, `[MEDIA:slug]`) with string literals are passed through the evaluation path.
2. **Dual Divergent Calculation Engines:** Two parallel chart calculation engines exist in production:
   - `lib/chartCalculator.ts` (used by `ChartAlgorithmManager.tsx` in `/admin/charts` for previews).
   - `lib/report-calculator.ts` (`ReportCalculator`, used by public report pages `/report/[slug]`, `/partner-report/`, etc.).
   Because logic, fallbacks, and parameter substitutions have drifted between the two, charts that preview cleanly in admin can break or disappear on live public reports.
3. **Silent Chart & Block Vanishing Act:** In `app/report/[slug]/ReportContent.tsx` (`hasValidChartData`), bar and pie charts with a sum of 0, or KPIs evaluating to `NA`, are treated as invalid and silently omitted from the DOM. This causes desktop grid collapse and empty layout gaps without an explanation to operators or viewers.
4. **Rigid Schema Constraints:** The API (`app/api/chart-config/route.ts`) hardcodes element counts: Bar charts MUST have *exactly 5 elements* and Pie charts MUST have *exactly 2 elements*, preventing 3-bar comparisons or multi-slice pies.
5. **KYC Token Inconsistencies:** The variable catalog in `/admin/kyc` uses bare camelCase names (`[female]`), while legacy charts and MongoDB records contain `[stats.female]`, `stats.reportImage1`, and unbracketed identifiers, forcing `ChartAlgorithmManager.tsx` to maintain fragile regex bypasses.

---

## 2. Proposed Architectural Solution

1. **Consolidate on a Single Calculation Engine:**
   - Deprecate and remove `lib/chartCalculator.ts`.
   - Make `lib/report-calculator.ts` (powered by `lib/formulaEngine.ts`) the single canonical calculator across both admin preview and live public reports.
2. **Harden Formula Parser for Non-Numeric Tokens:**
   - Update `tokenizeExpression` and `evaluateFormula` in `lib/formulaEngine.ts` to properly handle string literals, URLs, markdown text, and content asset tokens without crashing.
   - Standardize token substitution so `[var]`, `[stats.var]`, and legacy content slots resolve through a single unified resolver.
3. **Explicit Zero-Data States (No Silent Hiding):**
   - Replace the silent DOM omission in `ReportContent.tsx` (`hasValidChartData`) with an explicit zero/empty display state (e.g. empty bar outlines or a clean placeholder) so grid geometry and block containers remain stable.
4. **Dynamic Element Counts:**
   - Relax `app/api/chart-config/route.ts` validation to permit Bar charts with $1..N$ elements and Pie charts with $2..N$ elements, while preserving backward compatibility for existing 5-bar and 2-slice charts.
5. **KYC Catalog & Content Slot Alignment:**
   - Formally register `reportImage1..N` and `reportText1..N` as recognized system slots or first-class catalog types, eliminating ad-hoc regex exemptions in UI editors.

---

## 3. Scope & Boundaries

### In Scope
- Refactoring `lib/formulaEngine.ts` to support safe string evaluation alongside arithmetic.
- Consolidating `lib/chartCalculator.ts` into `lib/report-calculator.ts`.
- Updating `ReportContent.tsx` to preserve grid stability on zero-sum or empty charts.
- Updating `app/api/chart-config/route.ts` to allow flexible element counts.
- Automated regression suite covering existing 164 chart configurations.

### Out of Scope
- Redesigning the entire report layout grid or replacing Next.js CSS Modules.
- Modifying underlying MongoDB collection schemas for historical event stats.
- Adding new external third-party chart libraries.

---

## 4. Verification & Non-Negotiable Invariants

- **Zero Downtime / Zero Corruption:** All 164 existing active `chart_configurations` must evaluate without regressions.
- **CI Gates Passing:** `npm run type-check`, `npm run lint`, `npm run test`, and `python3 scripts/fleet-audit-inventory.py --check`.
