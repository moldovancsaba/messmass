// lib/chartErrorTypes.ts
// WHAT: Error type definitions for chart calculation errors (A-R-11)
// WHY: Categorize errors for better user feedback and debugging
// HOW: Define error types and helper functions

/**
 * WHAT: Error types for chart calculation failures
 * WHY: Categorize errors to provide specific, actionable error messages
 */
export type ChartErrorType =
  | 'MISSING_VARIABLE'
  | 'SYNTAX_ERROR'
  | 'DIVISION_BY_ZERO'
  | 'INVALID_RESULT'
  | 'MISSING_CHART_CONFIG'
  | 'INVALID_CHART_TYPE'
  | 'CALCULATION_ERROR'
  | 'EMPTY_DATA';

/**
 * WHAT: Chart error with type and message
 * WHY: Structured error information for display and debugging
 */
export interface ChartError {
  type: ChartErrorType;
  message: string;
  context?: {
    formula?: string;
    variableName?: string;
    chartId?: string;
    chartType?: string;
  };
}

/**
 * WHAT: Create error object from error type and context
 * WHY: Standardize error creation across codebase
 */
export function createChartError(
  type: ChartErrorType,
  message: string,
  context?: ChartError['context']
): ChartError {
  return {
    type,
    message,
    context
  };
}

/**
 * WHAT: Format error message for user display
 * WHY: Provide clear, actionable error messages
 */
export function formatErrorForDisplay(error: ChartError): string {
  const { type, message, context } = error;
  
  // Add context to message if available
  if (context?.formula) {
    return `${message}\nFormula: ${context.formula}`;
  }
  
  if (context?.variableName) {
    return `${message}\nVariable: ${context.variableName}`;
  }
  
  return message;
}

/**
 * WHAT: Get user-friendly error message based on error type
 * WHY: Provide consistent, clear error messages
 */
export function getUserFriendlyErrorMessage(error: ChartError): string {
  const { type, context } = error;
  
  switch (type) {
    case 'MISSING_VARIABLE':
      return context?.variableName
        ? `Variable '${context.variableName}' not found in data`
        : 'Required variable not found in data';
    
    case 'SYNTAX_ERROR':
      return context?.formula
        ? `Formula syntax error: ${context.formula}`
        : 'Formula syntax error';
    
    case 'DIVISION_BY_ZERO':
      return 'Division by zero in formula';
    
    case 'INVALID_RESULT':
      return 'Calculation produced invalid result (NaN or Infinity)';
    
    case 'MISSING_CHART_CONFIG':
      return context?.chartId
        ? `Chart configuration not found: ${context.chartId}`
        : 'Chart configuration not found';
    
    case 'INVALID_CHART_TYPE':
      return context?.chartType
        ? `Unknown chart type: ${context.chartType}`
        : 'Unknown chart type';
    
    case 'EMPTY_DATA':
      return 'Chart has no data to display';
    
    case 'CALCULATION_ERROR':
    default:
      return error.message || 'Chart calculation failed';
  }
}
