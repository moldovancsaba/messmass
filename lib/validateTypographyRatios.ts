/**
 * WHAT: Typography ratio validation for report visualizations
 * WHY: Enforce 1.5x maximum size ratio for same element types across cells
 * HOW: Parse clamp() formulas and calculate min/max ratios
 * 
 * @example
 * // ✅ Valid - 1.5x ratio
 * validateClampRatio('clamp(1rem, 8cqh, 1.5rem)') // returns { valid: true, ratio: 1.5 }
 * 
 * // ❌ Invalid - 8x ratio
 * validateClampRatio('clamp(1rem, 8cqh, 8rem)') // returns { valid: false, ratio: 8, ... }
 */

export interface ValidationResult {
  valid: boolean;
  ratio: number | null;
  min: number | null;
  max: number | null;
  message: string;
}

/**
 * Validates that a clamp() CSS formula maintains ≤1.5x ratio
 * 
 * @param clampString - CSS clamp() formula (e.g., "clamp(1rem, 8cqh, 1.5rem)")
 * @param maxRatio - Maximum allowed ratio (default: 1.5)
 * @returns Validation result with ratio details
 */
export function validateClampRatio(
  clampString: string,
  maxRatio: number = 1.5
): ValidationResult {
  // Extract min and max values from clamp(min, preferred, max)
  const clampRegex = /clamp\(\s*([\d.]+)(rem|px|em).*?,\s*([\d.]+)(rem|px|em)\s*\)/;
  const match = clampString.match(clampRegex);
  
  if (!match) {
    return {
      valid: true, // Not a clamp or different format - skip validation
      ratio: null,
      min: null,
      max: null,
      message: 'Not a valid clamp() formula with rem/px/em units',
    };
  }
  
  const min = parseFloat(match[1]);
  const minUnit = match[2];
  const max = parseFloat(match[3]);
  const maxUnit = match[4];
  
  // Ensure units match
  if (minUnit !== maxUnit) {
    return {
      valid: false,
      ratio: null,
      min,
      max,
      message: `Unit mismatch: min uses ${minUnit}, max uses ${maxUnit}`,
    };
  }
  
  const ratio = max / min;
  const valid = ratio <= maxRatio;
  
  return {
    valid,
    ratio,
    min,
    max,
    message: valid
      ? `✓ Valid ratio: ${ratio.toFixed(2)}x (≤${maxRatio}x)`
      : `✗ Invalid ratio: ${ratio.toFixed(2)}x (exceeds ${maxRatio}x limit)`,
  };
}

/**
 * Scans CSS content for clamp() violations
 * 
 * @param cssContent - Raw CSS file content
 * @param maxRatio - Maximum allowed ratio (default: 1.5)
 * @returns Array of violations with line numbers
 */
export function scanCSSForViolations(
  cssContent: string,
  maxRatio: number = 1.5
): Array<{
  line: number;
  formula: string;
  result: ValidationResult;
}> {
  const lines = cssContent.split('\n');
  const violations: Array<{
    line: number;
    formula: string;
    result: ValidationResult;
  }> = [];
  
  lines.forEach((line, index) => {
    const clampMatch = line.match(/clamp\([^)]+\)/);
    if (clampMatch) {
      const formula = clampMatch[0];
      const result = validateClampRatio(formula, maxRatio);
      
      if (!result.valid && result.ratio !== null) {
        violations.push({
          line: index + 1,
          formula,
          result,
        });
      }
    }
  });
  
  return violations;
}

/**
 * Generates a constrained clamp() formula from an existing one
 * 
 * @param clampString - Original clamp() formula
 * @param maxRatio - Desired maximum ratio (default: 1.5)
 * @returns Constrained clamp() formula
 * 
 * @example
 * constrainClampFormula('clamp(1rem, 8cqh, 8rem)', 1.5)
 * // returns 'clamp(1rem, 8cqh, 1.5rem)'
 */
export function constrainClampFormula(
  clampString: string,
  maxRatio: number = 1.5
): string | null {
  const fullClampRegex = /clamp\(\s*([\d.]+)(rem|px|em),\s*([^,]+),\s*([\d.]+)(rem|px|em)\s*\)/;
  const match = clampString.match(fullClampRegex);
  
  if (!match) {
    return null; // Can't parse
  }
  
  const min = parseFloat(match[1]);
  const minUnit = match[2];
  const preferred = match[3];
  const maxUnit = match[5];
  
  if (minUnit !== maxUnit) {
    return null; // Can't constrain mixed units
  }
  
  const newMax = (min * maxRatio).toFixed(3);
  
  return `clamp(${min}${minUnit}, ${preferred}, ${newMax}${maxUnit})`;
}

/**
 * Console logger for validation results (development use)
 * WHAT: Logs typography validation results to console
 * WHY: Intended for development/debugging - helps identify ratio violations
 */
export function logValidationResults(results: ValidationResult[]): void {
  // eslint-disable-next-line no-console
  console.group('🎨 Typography Ratio Validation');
  
  const violations = results.filter(r => !r.valid && r.ratio !== null);
  const valid = results.filter(r => r.valid && r.ratio !== null);
  
  if (violations.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`❌ ${violations.length} violation(s) found:`);
    violations.forEach(r => {
      // eslint-disable-next-line no-console
      console.log(`   ${r.message} (${r.min} → ${r.max})`);
    });
  }
  
  if (valid.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`✅ ${valid.length} valid clamp() formula(s)`);
  }
  
  // eslint-disable-next-line no-console
  console.groupEnd();
}
