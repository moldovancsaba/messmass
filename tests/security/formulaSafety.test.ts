/**
 * Security Regression Tests: Formula Safety
 * 
 * Chart formulas are evaluated using expr-eval. These tests ensure that
 * malicious payloads cannot escape the sandboxed formula environment.
 */
import { Parser } from 'expr-eval';

const parser = new Parser();

describe('Security: Formula Safety', () => {
  it('should evaluate a valid arithmetic formula safely', () => {
    const result = parser.parse('(a + b) * c').evaluate({ a: 2, b: 3, c: 4 });
    expect(result).toBe(20);
  });

  it('should not allow access to process object via formula', () => {
    expect(() => {
      parser.parse('process.exit(1)').evaluate({});
    }).toThrow();
  });

  it('should not allow eval-style function calls via formula', () => {
    expect(() => {
      parser.parse('eval("alert(1)")').evaluate({});
    }).toThrow();
  });

  it('should not allow constructor access via formula', () => {
    expect(() => {
      parser.parse('constructor.constructor("return process")()').evaluate({});
    }).toThrow();
  });

  it('should handle gracefully division by zero', () => {
    const result = parser.parse('a / b').evaluate({ a: 10, b: 0 });
    expect(result).toBe(Infinity);
  });
});
