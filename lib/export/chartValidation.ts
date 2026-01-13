// lib/export/chartValidation.ts
// WHAT: Shared chart validation utilities for export parity and data validation (A-R-13)
// WHY: Ensure CSV export matches rendered report filtering logic and validate chart data structure
// HOW: Extract hasValidChartData from ReportContent for reuse, add comprehensive validation

import type { ChartResult } from '@/lib/report-calculator';
import type { Chart } from '@/lib/report-calculator';

/**
 * WHAT: Validation issue with type and details
 * WHY: Structured validation information for display and debugging
 */
export interface ChartDataValidationIssue {
  type: 'MISSING_FIELD' | 'INVALID_VALUE_TYPE' | 'INVALID_VALUE' | 'TYPE_MISMATCH' | 'INVALID_ELEMENT';
  severity: 'error' | 'warning';
  message: string;
  context?: {
    field?: string;
    expectedType?: string;
    actualType?: string;
    value?: unknown;
    chartId?: string;
    elementIndex?: number;
  };
}

/**
 * WHAT: Chart data validation result
 * WHY: Structured result with issues list and validation status
 */
export interface ChartDataValidationResult {
  valid: boolean;
  issues: ChartDataValidationIssue[];
}

/**
 * WHAT: Validates if a chart result has displayable data
 * WHY: Used by rendered report to filter out empty/invalid charts
 * HOW: Type-specific validation matching ReportChart.hasData logic
 * 
 * NOTE: This function must match the logic in app/report/[slug]/ReportContent.tsx:hasValidChartData()
 * to ensure export parity with rendered report.
 */
export function hasValidChartData(result: ChartResult | undefined): boolean {
  if (!result || result.error || result.chartError) return false;
  
  switch (result.type) {
    case 'text':
      return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
    
    case 'image':
      return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
    
    case 'table':
      return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
    
    case 'kpi':
      return result.kpiValue !== undefined && result.kpiValue !== null && result.kpiValue !== 'NA';
    
    case 'pie':
    case 'bar':
    case 'value':
      if (!result.elements || result.elements.length === 0) return false;
      const total = result.elements.reduce((sum, el) => 
        sum + (typeof el.value === 'number' ? el.value : 0), 0
      );
      return total > 0;
    
    default:
      return false;
  }
}

/**
 * WHAT: Validate chart result structure (required fields exist)
 * WHY: Ensure chart result has all required fields for its type
 * HOW: Check required fields based on chart type
 */
function validateChartResultStructure(result: ChartResult): ChartDataValidationIssue[] {
  const issues: ChartDataValidationIssue[] = [];

  // All types require chartId, type, title
  if (!result.chartId) {
    issues.push({
      type: 'MISSING_FIELD',
      severity: 'error',
      message: 'Chart result missing required field: chartId',
      context: { field: 'chartId' }
    });
  }

  if (!result.type) {
    issues.push({
      type: 'MISSING_FIELD',
      severity: 'error',
      message: 'Chart result missing required field: type',
      context: { field: 'type' }
    });
  }

  if (!result.title) {
    issues.push({
      type: 'MISSING_FIELD',
      severity: 'error',
      message: 'Chart result missing required field: title',
      context: { field: 'title' }
    });
  }

  // Type-specific required fields
  if (['kpi', 'text', 'image', 'table'].includes(result.type)) {
    if (result.kpiValue === undefined && result.kpiValue !== null) {
      // kpiValue can be null for some types, but undefined is invalid
      if (result.kpiValue === undefined) {
        issues.push({
          type: 'MISSING_FIELD',
          severity: 'error',
          message: `${result.type} chart result missing required field: kpiValue`,
          context: { field: 'kpiValue', chartId: result.chartId }
        });
      }
    }
  }

  if (['pie', 'bar', 'value'].includes(result.type)) {
    if (!result.elements || !Array.isArray(result.elements)) {
      issues.push({
        type: 'MISSING_FIELD',
        severity: 'error',
        message: `${result.type} chart result missing required field: elements`,
        context: { field: 'elements', chartId: result.chartId }
      });
    }
  }

  return issues;
}

/**
 * WHAT: Validate chart result values (not NaN, Infinity, invalid types)
 * WHY: Ensure values are valid for rendering
 * HOW: Check kpiValue and element values
 */
function validateChartResultValues(result: ChartResult): ChartDataValidationIssue[] {
  const issues: ChartDataValidationIssue[] = [];

  // Validate kpiValue for KPI charts
  if (result.type === 'kpi' && typeof result.kpiValue === 'number') {
    if (isNaN(result.kpiValue)) {
      issues.push({
        type: 'INVALID_VALUE',
        severity: 'error',
        message: `KPI chart has invalid value: NaN`,
        context: { chartId: result.chartId, value: result.kpiValue }
      });
    }
    if (!isFinite(result.kpiValue)) {
      issues.push({
        type: 'INVALID_VALUE',
        severity: 'error',
        message: `KPI chart has invalid value: Infinity`,
        context: { chartId: result.chartId, value: result.kpiValue }
      });
    }
  }

  // Validate element values for PIE/BAR charts
  if (result.elements) {
    for (let i = 0; i < result.elements.length; i++) {
      const element = result.elements[i];
      
      if (!element.label) {
        issues.push({
          type: 'INVALID_ELEMENT',
          severity: 'error',
          message: `Element ${i} missing required field: label`,
          context: { chartId: result.chartId, elementIndex: i }
        });
      }

      if (typeof element.value === 'number') {
        if (isNaN(element.value)) {
          issues.push({
            type: 'INVALID_VALUE',
            severity: 'error',
            message: `Element ${i} has invalid value: NaN`,
            context: { chartId: result.chartId, elementIndex: i, value: element.value }
          });
        }
        if (!isFinite(element.value)) {
          issues.push({
            type: 'INVALID_VALUE',
            severity: 'error',
            message: `Element ${i} has invalid value: Infinity`,
            context: { chartId: result.chartId, elementIndex: i, value: element.value }
          });
        }
        // PIE charts should not have negative values
        if (result.type === 'pie' && element.value < 0) {
          issues.push({
            type: 'INVALID_VALUE',
            severity: 'warning',
            message: `PIE chart element ${i} has negative value: ${element.value}`,
            context: { chartId: result.chartId, elementIndex: i, value: element.value }
          });
        }
      }
    }
  }

  return issues;
}

/**
 * WHAT: Validate chart result type matches chart configuration type
 * WHY: Ensure result type is compatible with chart configuration
 * HOW: Compare result.type with chart.type
 */
function validateChartResultType(
  result: ChartResult,
  chart: Chart | null
): ChartDataValidationIssue[] {
  const issues: ChartDataValidationIssue[] = [];

  if (chart && result.type !== chart.type) {
    issues.push({
      type: 'TYPE_MISMATCH',
      severity: 'warning',
      message: `Chart result type '${result.type}' does not match configuration type '${chart.type}'`,
      context: {
        chartId: result.chartId,
        expectedType: chart.type,
        actualType: result.type
      }
    });
  }

  return issues;
}

/**
 * WHAT: Comprehensive chart data validation
 * WHY: Ensure chart result is valid for rendering
 * HOW: Validate structure, values, and type matching
 * 
 * @param result - Chart result to validate
 * @param chart - Chart configuration (optional, for type matching)
 * @returns Validation result with issues list
 */
export function validateChartData(
  result: ChartResult | undefined,
  chart: Chart | null = null
): ChartDataValidationResult {
  if (!result) {
    return {
      valid: false,
      issues: [{
        type: 'MISSING_FIELD',
        severity: 'error',
        message: 'Chart result is undefined or null',
        context: {}
      }]
    };
  }

  const issues: ChartDataValidationIssue[] = [];

  // Validate structure
  issues.push(...validateChartResultStructure(result));

  // Validate values
  issues.push(...validateChartResultValues(result));

  // Validate type matching (if chart config provided)
  if (chart) {
    issues.push(...validateChartResultType(result, chart));
  }

  // Valid if no errors (warnings are OK)
  const valid = issues.filter(i => i.severity === 'error').length === 0;

  return {
    valid,
    issues
  };
}

/**
 * WHAT: Format validation issue for user display
 * WHY: Provide clear, actionable error messages
 */
export function formatValidationIssue(issue: ChartDataValidationIssue): string {
  const { type, message, context } = issue;

  switch (type) {
    case 'MISSING_FIELD':
      return context?.field
        ? `Missing required field: ${context.field}`
        : message;
    
    case 'INVALID_VALUE':
      return context?.chartId
        ? `Chart '${context.chartId}' has invalid value`
        : message;
    
    case 'INVALID_ELEMENT':
      return context?.elementIndex !== undefined
        ? `Element ${context.elementIndex} is invalid`
        : message;
    
    case 'TYPE_MISMATCH':
      return message;
    
    default:
      return message;
  }
}
