# OPS-SEC-02: Code injection hardening – audit

**Status:** Active  
**Last updated:** 2026-02-06  
**Owner:** Security / Reporting

## 1. Dynamic evaluation audit

### 1.1 Production runtime

| Location | Pattern | Risk | Mitigation / notes |
|----------|---------|------|--------------------|
| `lib/formulaEngine.ts` | `require('expr-eval')` + `parser.parse()` / `expr.evaluate({})` | Low – expr-eval evaluates only math expressions with restricted operators (add, subtract, multiply, divide, power; mod disabled). No arbitrary code. | Primary path; CSP blocks Function() in browser. |
| `lib/formulaEngine.ts` | `new Function('return ' + cleanExpression)` | High – code injection if expression is attacker-controlled. | Fallback when expr-eval parse fails. **Blocked by CSP** (unsafe-eval) in production; fallback will throw. Should be removed once all formulas validated with safe parser. |
| `components/ChartAlgorithmManager.tsx` | `evaluateFormula(testFormula, {})` then fallback `Function('"use strict"; return (' + testFormula + ')')()` | Medium – same as above for fallback. | Uses formulaEngine first; fallback only when that fails. CSP blocks Function() in browser. TODO: remove fallback. |

### 1.2 Scripts / dev only (not production runtime)

| Location | Pattern | Risk | Notes |
|----------|---------|------|--------|
| `scripts/test-full-partner-report.js` | `eval(result)` | Dev only | Test script; not in app bundle. |
| `scripts/simulate-partner-chart-calc.js` | `eval(formula)` | Dev only | Simulation script; not in app bundle. |

### 1.3 False positives

| Location | Pattern | Notes |
|----------|---------|--------|
| `lib/performanceUtils.ts` | `function executedFunction(...)` | Variable name only; no dynamic code execution. |
| `middleware.ts` | Comment re Chart.js and eval | Comment only; no eval. |

## 2. Recommendations

1. **Remove Function() fallbacks** in `formulaEngine.ts` and `ChartAlgorithmManager.tsx` once all formulas are validated against expr-eval (or a future internal safe evaluator). Until then, CSP ensures the fallback does not run in the browser.
2. **Keep expr-eval** as the approved formula parser until replaced; guardrail already lists it as approved with restricted usage. If replacing: implement an internal safe evaluator (e.g. tokenize + interpret only numbers and whitelisted operators), then remove expr-eval and update guardrail.
3. **Scripts:** Prefer a small safe-eval helper or formulaEngine for any script that needs to evaluate formulas; avoid raw `eval` in new scripts.

## 3. Formula evaluator tests

- **Existing:** `__tests__/formula-error-handling.test.ts` – ReportCalculator error handling (chart errors, missing config, user-facing messages).
- **Added (OPS-SEC-02):** `__tests__/formula-engine-production-like.test.ts` – Direct `evaluateFormula()` calls with production-like stats (many fields, zeros, division by zero, missing vars); captures NA and failure cases for regression.

## 4. Dependency allowlist / guardrail

- **Script:** `scripts/check-dependency-guardrail.ts`
- **expr-eval:** Listed in `APPROVED_RUNTIME_DEPS` with comment: used in formulaEngine with restricted operators only. Removal would require an internal safe evaluator and removal of Function() fallbacks; then remove expr-eval from package.json and from the allowlist (and add to FORBIDDEN_PACKAGES if desired).
