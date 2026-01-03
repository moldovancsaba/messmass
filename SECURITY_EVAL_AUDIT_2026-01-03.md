# Security Audit: dynamic-eval usage (2026-01-03)

Summary
-------
- Purpose: Catalog and prioritize all uses of `eval`, `new Function`, and `Function()` in the codebase and provide immediate mitigations.
- Severity: High — dynamic evaluation of expressions in production code risks RCE and privilege escalation.

Findings
--------
- lib/formulaEngine.ts (production formula engine)
  - Location: lib/formulaEngine.ts around line ~716
  - Pattern: `new Function('return ' + cleanExpression)` — legacy fallback
  - Risk: High — used to evaluate user-editable formulas.

- components/ChartAlgorithmManager.tsx (UI fallback)
  - Location: components/ChartAlgorithmManager.tsx around line ~1071
  - Pattern: `Function('\"use strict\"; return (' + testFormula + ')')()` — fallback when safe parse fails
  - Risk: High — formula evaluation in client-side logic used to create charts.

- scripts/simulate-partner-chart-calc.js (dev script)
  - Location: scripts/simulate-partner-chart-calc.js line ~41
  - Pattern: `eval(formula)`
  - Risk: Medium (script only) — still should be removed.

- scripts/test-full-partner-report.js (dev/test script)
  - Location: scripts/test-full-partner-report.js line ~134
  - Pattern: `eval(result)`
  - Risk: Medium (script only)

- lib/featureFlags.ts
  - Location: lib/featureFlags.ts (feature flag controls safe parser; default allows legacy fallback)

Immediate Actions Taken
-----------------------
- Created this audit document listing exact locations and guidance.
- Added a CI guard (GitHub Actions + script) that fails CI when `eval|new Function|Function(` patterns are present in the repository (excluding common build/third-party dirs).

Recommended Remediation (priority order)
----------------------------------------
1. Production code first (must-fix):
   - Replace `new Function` / `Function()` in `lib/formulaEngine.ts` and `components/ChartAlgorithmManager.tsx` with a safe expression evaluator (examples: `expr-eval`, `jsep` + interpreter, or a server-side sandboxed evaluator).
   - Enable the safe-parser feature flag by default once tests cover all formula behavior.

2. Scripts and tests:
   - Remove `eval` from dev scripts and tests; port logic to use the chosen safe parser.

3. CI and developer guardrails:
   - Keep the CI guard enabled. Add a pre-commit or Danger check to stop reintroducing dynamic-eval.
   - Add unit tests that verify grammar equivalence between legacy and safe parser outputs for a migration window.

4. Long-term hardening:
   - Remove legacy token formats and ensure server-side verification for WebSocket connections.
   - Rotate secrets if any were found referencing dynamic-eval inputs or untrusted sources.

Appendix — Quick remediation plan per file
----------------------------------------
- `lib/formulaEngine.ts`: Implement safe parser integration; add automated comparison tests; remove fallback `new Function` once parity is proven.
- `components/ChartAlgorithmManager.tsx`: Use centralized safe-eval API (client-side safe parser if strictly necessary) or avoid client eval by delegating evaluation to server-side service.
- `scripts/*`: Replace `eval` with the safe parser or rewrite scripts to avoid runtime-eval.

Contact
-------
If you want, I can produce a follow-up PR that:
- Replaces one production occurrence with `expr-eval` and corresponding unit tests, and
- Updates `lib/featureFlags.ts` to enable the safe parser with migration notes.
