/**
 * Security Regression Tests: Formula Safety
 * 
 * Chart formulas are evaluated using the internal safe formula parser. These
 * tests ensure malicious payloads degrade safely instead of executing.
 */
import { evaluateFormula } from '@/lib/formulaEngine';

describe('Security: Formula Safety', () => {
  it('should evaluate a valid arithmetic formula safely', () => {
    const result = evaluateFormula('[a] + [b] * [c]', { a: 2, b: 3, c: 4 } as any);
    expect(result).toBe(14);
  });

  it('should not allow access to process object via formula', () => {
    const result = evaluateFormula('process.exit(1)', {} as any);
    expect(result).toBe('NA');
  });

  it('should not allow eval-style function calls via formula', () => {
    const result = evaluateFormula('eval("alert(1)")', {} as any);
    expect(result).toBe('NA');
  });

  it('should not allow constructor access via formula', () => {
    const result = evaluateFormula('constructor.constructor("return process")()', {} as any);
    expect(result).toBe('NA');
  });

  it('should handle gracefully division by zero', () => {
    const result = evaluateFormula('[a] / [b]', { a: 10, b: 0 } as any);
    expect(result).toBe('NA');
  });
});
