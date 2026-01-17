/**
 * Layout Grammar Runtime Enforcement
 * 
 * WHAT: Production-only fail-fast behavior for critical Layout Grammar violations
 * WHY: Prevent Layout Grammar violations from reaching production
 * HOW: Environment-aware enforcement (warnings in dev, errors in prod)
 * 
 * @module layoutGrammarRuntimeEnforcement
 */

/**
 * WHAT: Check if we're in production environment
 * WHY: Enforcement behavior differs between dev (warnings) and prod (errors)
 * HOW: Check NODE_ENV or VERCEL_ENV
 */
function isProduction(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check NODE_ENV
    return process.env.NODE_ENV === 'production';
  }
  
  // Client-side: check VERCEL_ENV or NODE_ENV
  // VERCEL_ENV is set by Vercel: 'production', 'preview', 'development'
  const vercelEnv = (window as any).process?.env?.VERCEL_ENV;
  if (vercelEnv) {
    return vercelEnv === 'production';
  }
  
  // Fallback: check if we're not in development
  return process.env.NODE_ENV === 'production';
}

/**
 * WHAT: Critical CSS variable names that must be present
 * WHY: These variables are required for Layout Grammar compliance
 * HOW: Used to validate that height cascade is explicit
 */
export const CRITICAL_CSS_VARIABLES = {
  ROW_HEIGHT: '--row-height',
  BLOCK_HEIGHT: '--block-height',
  CHART_BODY_HEIGHT: '--chart-body-height',
  TEXT_CONTENT_HEIGHT: '--text-content-height'
} as const;

/**
 * WHAT: Runtime enforcement result
 * WHY: Track whether violation is critical and should block rendering
 */
export interface EnforcementResult {
  isCritical: boolean;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * WHAT: Validate critical CSS variable is present
 * WHY: Layout Grammar requires explicit height cascade, no implicit fallbacks
 * HOW: Check computed style, enforce in production, warn in development
 * 
 * @param element - DOM element to check
 * @param variableName - CSS variable name to validate
 * @param context - Additional context for error message
 * @returns Enforcement result with isCritical flag
 */
export function validateCriticalCSSVariable(
  element: HTMLElement | null,
  variableName: string,
  context?: Record<string, unknown>
): EnforcementResult {
  if (!element) {
    return {
      isCritical: false,
      message: `Cannot validate CSS variable ${variableName}: element is null`
    };
  }

  const computedStyle = getComputedStyle(element);
  const value = computedStyle.getPropertyValue(variableName).trim();

  if (!value) {
    const message = `Layout Grammar violation: Critical CSS variable ${variableName} is missing`;
    const fullContext = {
      variableName,
      element: element.tagName,
      className: element.className,
      ...context
    };

    // WHAT: A-05 - Log error in all environments, never throw (prevent production crashes)
    // WHY: Graceful degradation - log violations for monitoring but don't crash the report
    // HOW: Use console.error for visibility, return isCritical flag for monitoring
    console.error(`[Layout Grammar Runtime] ${message}`, fullContext);
    return {
      isCritical: true, // Mark as critical for monitoring/alerting
      message,
      context: fullContext
    };
  }

  return {
    isCritical: false,
    message: `CSS variable ${variableName} is present`,
    context: { variableName, value }
  };
}

/**
 * WHAT: Validate height resolution result
 * WHY: Height calculation failures indicate Layout Grammar violations
 * HOW: Check for structural failures or split requirements, enforce in production
 * 
 * @param heightResolution - Height resolution result from blockHeightCalculator
 * @param context - Additional context for error message
 * @returns Enforcement result with isCritical flag
 */
export function validateHeightResolution(
  heightResolution: {
    heightPx: number;
    priority?: number;
    requiresSplit?: boolean;
    reason?: string;
  },
  context?: Record<string, unknown>
): EnforcementResult {
  // WHAT: Check for structural failures (Priority 4) or split requirements
  // WHY: These indicate Layout Grammar violations that cannot be resolved
  // HOW: Priority 4 = structural failure, requiresSplit = content too large
  const isStructuralFailure = heightResolution.priority === 4;
  const requiresSplit = heightResolution.requiresSplit === true;

  if (isStructuralFailure || requiresSplit) {
    const message = `Layout Grammar violation: Height resolution failed. ${heightResolution.reason || 'Structural failure or content too large'}`;
    const fullContext = {
      heightPx: heightResolution.heightPx,
      priority: heightResolution.priority,
      requiresSplit: heightResolution.requiresSplit,
      reason: heightResolution.reason,
      ...context
    };

    // WHAT: A-05 - Log error in all environments, never throw (prevent production crashes)
    // WHY: Graceful degradation - log violations for monitoring but don't crash the report
    // HOW: Use console.error for visibility, return isCritical flag for monitoring
    console.error(`[Layout Grammar Runtime] ${message}`, fullContext);
    return {
      isCritical: true, // Mark as critical for monitoring/alerting
      message,
      context: fullContext
    };
  }

  return {
    isCritical: false,
    message: 'Height resolution successful',
    context: { heightPx: heightResolution.heightPx }
  };
}

/**
 * WHAT: Validate element fit result
 * WHY: Elements that don't fit indicate Layout Grammar violations
 * HOW: Check for fit failures, enforce in production
 * 
 * @param fitValidation - Element fit validation result
 * @param context - Additional context for error message
 * @returns Enforcement result with isCritical flag
 */
export function validateElementFit(
  fitValidation: {
    fits: boolean;
    violations?: string[];
    requiredActions?: string[];
  },
  context?: Record<string, unknown>
): EnforcementResult {
  if (!fitValidation.fits) {
    const violations = fitValidation.violations || [];
    const requiredActions = fitValidation.requiredActions || [];
    const message = `Layout Grammar violation: Element does not fit. Violations: ${violations.join(', ')}. Required actions: ${requiredActions.join(', ')}`;
    const fullContext = {
      violations,
      requiredActions,
      ...context
    };

    // WHAT: A-05 - Log error in all environments, never throw (prevent production crashes)
    // WHY: Graceful degradation - log violations for monitoring but don't crash the report
    // HOW: Use console.error for visibility, return isCritical flag for monitoring
    console.error(`[Layout Grammar Runtime] ${message}`, fullContext);
    return {
      isCritical: true, // Mark as critical for monitoring/alerting
      message,
      context: fullContext
    };
  }

  return {
    isCritical: false,
    message: 'Element fits correctly',
    context
  };
}

/**
 * WHAT: Safely validate with error boundary
 * WHY: Prevent enforcement errors from crashing entire application
 * HOW: Wrap validation in try-catch, log error but don't throw
 * 
 * @param validationFn - Function that performs validation
 * @param fallbackMessage - Message to log if validation throws
 * @returns Enforcement result (always non-critical if validation throws)
 */
export function safeValidate(
  validationFn: () => EnforcementResult,
  fallbackMessage: string
): EnforcementResult {
  try {
    return validationFn();
  } catch (error) {
    // WHAT: Log error but don't throw (error boundary will handle)
    // WHY: Prevent enforcement from crashing application
    // HOW: Log error with context
    console.error(`[Layout Grammar Runtime] Validation error: ${fallbackMessage}`, error);
    return {
      isCritical: false,
      message: `${fallbackMessage}: ${error instanceof Error ? error.message : String(error)}`,
      context: { error: error instanceof Error ? error.stack : String(error) }
    };
  }
}
