/**
 * Layout Grammar Runtime Enforcement Test Suite
 * 
 * WHAT: Tests for A-05 - Layout Grammar Runtime Enforcement
 * WHY: Ensure guardrails prevent production crashes while logging violations
 * HOW: Test all failure modes (missing CSS variables, height failures, fit failures)
 * 
 * DoD Profile: CRITICAL (Infrastructure & Operations / Validation)
 */

import {
  validateCriticalCSSVariable,
  validateHeightResolution,
  validateElementFit,
  safeValidate,
  CRITICAL_CSS_VARIABLES,
  type EnforcementResult
} from '@/lib/layoutGrammarRuntimeEnforcement';

// WHAT: Mock DOM for tests that need document.createElement
// WHY: Jest doesn't have DOM by default, but we can mock it for these tests
function createMockElement(cssVars: Record<string, string> = {}): HTMLElement {
  // Mock getComputedStyle globally for all tests
  if (!(global as any).getComputedStyle) {
    (global as any).getComputedStyle = jest.fn((element: any) => ({
      getPropertyValue: (varName: string) => {
        // Return CSS variable value if provided, otherwise empty string
        return cssVars[varName] || '';
      }
    }));
  }
  
  const element = {
    tagName: 'DIV',
    className: 'test-element',
    style: {
      setProperty: jest.fn(),
      getPropertyValue: jest.fn((varName: string) => cssVars[varName] || ''),
      removeProperty: jest.fn()
    },
    offsetHeight: 300,
    offsetWidth: 1200
  } as any;
  
  return element;
}

describe('A-05: Layout Grammar Runtime Enforcement', () => {
  describe('validateCriticalCSSVariable', () => {
    test('returns success when CSS variable is present', () => {
      // WHAT: Create a mock element with CSS variable set
      // WHY: Test successful validation path
      const element = createMockElement({ '--block-height': '300px' });
      
      const result = validateCriticalCSSVariable(
        element,
        CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
        { chartId: 'test-chart' }
      );
      
      expect(result.isCritical).toBe(false);
      expect(result.message).toContain('is present');
      expect(result.context?.value).toBe('300px');
    });

    test('logs error and returns isCritical=true when CSS variable is missing', () => {
      // WHAT: Create a mock element without CSS variable
      // WHY: Test violation detection and logging
      const element = createMockElement();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = validateCriticalCSSVariable(
        element,
        CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
        { chartId: 'test-chart', chartType: 'bar' }
      );
      
      expect(result.isCritical).toBe(true);
      expect(result.message).toContain('missing');
      expect(result.context?.variableName).toBe('--block-height');
      expect(result.context?.chartId).toBe('test-chart');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Layout Grammar Runtime]'),
        expect.objectContaining({
          variableName: '--block-height',
          chartId: 'test-chart'
        })
      );
      
      consoleErrorSpy.mockRestore();
    });

    test('returns non-critical result when element is null', () => {
      // WHAT: Test null element handling
      // WHY: Ensure graceful degradation when element doesn't exist
      const result = validateCriticalCSSVariable(
        null,
        CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
        { chartId: 'test-chart' }
      );
      
      expect(result.isCritical).toBe(false);
      expect(result.message).toContain('element is null');
    });

    test('validates all critical CSS variables', () => {
      // WHAT: Test all critical CSS variables
      // WHY: Ensure all variables are validated correctly
      const element = createMockElement({
        '--row-height': '400px',
        '--block-height': '300px',
        '--chart-body-height': '250px',
        '--text-content-height': '200px'
      });
      
      const variables = [
        CRITICAL_CSS_VARIABLES.ROW_HEIGHT,
        CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
        CRITICAL_CSS_VARIABLES.CHART_BODY_HEIGHT,
        CRITICAL_CSS_VARIABLES.TEXT_CONTENT_HEIGHT
      ];
      
      variables.forEach(variable => {
        const result = validateCriticalCSSVariable(element, variable);
        expect(result.isCritical).toBe(false);
        expect(result.message).toContain('is present');
      });
    });
  });

  describe('validateHeightResolution', () => {
    test('returns success when height resolution is valid', () => {
      // WHAT: Test successful height resolution
      // WHY: Ensure valid resolutions pass validation
      const heightResolution = {
        heightPx: 300,
        priority: 3, // Readability enforcement (not structural failure)
        requiresSplit: false
      };
      
      const result = validateHeightResolution(heightResolution, { blockId: 'test-block' });
      
      expect(result.isCritical).toBe(false);
      expect(result.message).toContain('successful');
    });

    test('logs error and returns isCritical=true for structural failure (Priority 4)', () => {
      // WHAT: Test structural failure detection
      // WHY: Ensure Priority 4 failures are logged and marked critical
      const heightResolution = {
        heightPx: 0,
        priority: 4, // Structural failure
        requiresSplit: false,
        reason: 'Cannot resolve height within constraints'
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = validateHeightResolution(heightResolution, { blockId: 'test-block' });
      
      expect(result.isCritical).toBe(true);
      expect(result.message).toContain('failed');
      expect(result.context?.priority).toBe(4);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Layout Grammar Runtime]'),
        expect.objectContaining({
          priority: 4,
          blockId: 'test-block'
        })
      );
      
      consoleErrorSpy.mockRestore();
    });

    test('logs error and returns isCritical=true when requiresSplit is true', () => {
      // WHAT: Test split requirement detection
      // WHY: Ensure split requirements are logged and marked critical
      const heightResolution = {
        heightPx: 500,
        priority: 3,
        requiresSplit: true,
        reason: 'Content too large for single block'
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = validateHeightResolution(heightResolution, { blockId: 'test-block' });
      
      expect(result.isCritical).toBe(true);
      expect(result.message).toContain('failed');
      expect(result.context?.requiresSplit).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('validateElementFit', () => {
    test('returns success when element fits', () => {
      // WHAT: Test successful element fit
      // WHY: Ensure valid fits pass validation
      const fitValidation = {
        fits: true
      };
      
      const result = validateElementFit(fitValidation, { chartId: 'test-chart' });
      
      expect(result.isCritical).toBe(false);
      expect(result.message).toContain('fits correctly');
    });

    test('logs error and returns isCritical=true when element does not fit', () => {
      // WHAT: Test fit failure detection
      // WHY: Ensure fit failures are logged and marked critical
      const fitValidation = {
        fits: false,
        violations: ['Content exceeds available height', 'Text overflow'],
        requiredActions: ['Reduce font size', 'Split block']
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = validateElementFit(fitValidation, { chartId: 'test-chart', chartType: 'text' });
      
      expect(result.isCritical).toBe(true);
      expect(result.message).toContain('does not fit');
      expect(result.context?.violations).toEqual(fitValidation.violations);
      expect(result.context?.requiredActions).toEqual(fitValidation.requiredActions);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Layout Grammar Runtime]'),
        expect.objectContaining({
          violations: fitValidation.violations,
          chartId: 'test-chart'
        })
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('safeValidate', () => {
    test('returns validation result when validation succeeds', () => {
      // WHAT: Test successful validation through safeValidate
      // WHY: Ensure safeValidate passes through successful results
      const validationFn = (): EnforcementResult => ({
        isCritical: false,
        message: 'Validation passed',
        context: { test: 'value' }
      });
      
      const result = safeValidate(validationFn, 'Fallback message');
      
      expect(result.isCritical).toBe(false);
      expect(result.message).toBe('Validation passed');
      expect(result.context?.test).toBe('value');
    });

    test('catches and logs errors without throwing', () => {
      // WHAT: Test error handling in safeValidate
      // WHY: Ensure validation errors don't crash the application
      const validationFn = (): EnforcementResult => {
        throw new Error('Validation error');
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // WHAT: Should not throw, should return non-critical result
      // WHY: safeValidate prevents crashes
      const result = safeValidate(validationFn, 'Validation failed');
      
      expect(result.isCritical).toBe(false);
      expect(result.message).toContain('Validation failed');
      expect(result.message).toContain('Validation error');
      expect(result.context?.error).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Layout Grammar Runtime]'),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    test('handles non-Error exceptions', () => {
      // WHAT: Test handling of non-Error exceptions
      // WHY: Ensure all exception types are handled gracefully
      const validationFn = (): EnforcementResult => {
        throw 'String error';
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = safeValidate(validationFn, 'Validation failed');
      
      expect(result.isCritical).toBe(false);
      expect(result.message).toContain('Validation failed');
      expect(result.message).toContain('String error');
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Failure Mode Integration Tests', () => {
    test('missing CSS variable does not crash when wrapped in safeValidate', () => {
      // WHAT: Test that missing CSS variables are logged but don't crash
      // WHY: A-05 requirement - prevent production crashes
      const element = createMockElement();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = safeValidate(
        () => validateCriticalCSSVariable(
          element,
          CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
          { chartId: 'test-chart' }
        ),
        'CSS variable validation failed'
      );
      
      // WHAT: Should log error but not throw
      // WHY: Graceful degradation
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.isCritical).toBe(true);
      expect(result.message).toContain('missing');
      
      consoleErrorSpy.mockRestore();
    });

    test('structural height failure does not crash when wrapped in safeValidate', () => {
      // WHAT: Test that height resolution failures are logged but don't crash
      // WHY: A-05 requirement - prevent production crashes
      const heightResolution = {
        heightPx: 0,
        priority: 4,
        requiresSplit: false,
        reason: 'Structural failure'
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = safeValidate(
        () => validateHeightResolution(heightResolution, { blockId: 'test-block' }),
        'Height resolution validation failed'
      );
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.isCritical).toBe(true);
      expect(result.message).toContain('failed');
      
      consoleErrorSpy.mockRestore();
    });

    test('element fit failure does not crash when wrapped in safeValidate', () => {
      // WHAT: Test that fit failures are logged but don't crash
      // WHY: A-05 requirement - prevent production crashes
      const fitValidation = {
        fits: false,
        violations: ['Overflow'],
        requiredActions: ['Reduce content']
      };
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = safeValidate(
        () => validateElementFit(fitValidation, { chartId: 'test-chart' }),
        'Element fit validation failed'
      );
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.isCritical).toBe(true);
      expect(result.message).toContain('does not fit');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Production vs Development Behavior', () => {
    test('all violations log errors (no environment-specific throwing)', () => {
      // WHAT: Test that violations always log errors, never throw
      // WHY: A-05 - prevent production crashes, log for monitoring
      const element = createMockElement();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // WHAT: Should not throw regardless of environment
      // WHY: Graceful degradation in all environments
      expect(() => {
        validateCriticalCSSVariable(
          element,
          CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
          { chartId: 'test-chart' }
        );
      }).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});
