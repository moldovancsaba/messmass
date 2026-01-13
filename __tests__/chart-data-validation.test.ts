// __tests__/chart-data-validation.test.ts
// WHAT: Regression tests for A-R-13 - Chart data validation and error boundaries
// WHY: Ensure chart data is validated and rendering errors are handled gracefully
// HOW: Test all validation scenarios identified in investigation

import { validateChartData, formatValidationIssue } from '@/lib/export/chartValidation';
import type { ChartResult } from '@/lib/report-calculator';
import type { Chart } from '@/lib/report-calculator';

describe('A-R-13: Chart Data Validation', () => {
  const mockChart: Chart = {
    chartId: 'chart-1',
    title: 'Test Chart',
    type: 'kpi',
    formula: '[female]',
    isActive: true,
    order: 1
  };

  describe('Structure Validation', () => {
    it('should detect missing chartId', () => {
      const result: ChartResult = {
        chartId: '', // Empty string
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: 100
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'MISSING_FIELD' && i.context?.field === 'chartId')).toBe(true);
    });

    it('should detect missing type', () => {
      const result: any = {
        chartId: 'chart-1',
        // type missing
        title: 'Test Chart',
        kpiValue: 100
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'MISSING_FIELD' && i.context?.field === 'type')).toBe(true);
    });

    it('should detect missing title', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'kpi',
        title: '', // Empty string
        kpiValue: 100
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'MISSING_FIELD' && i.context?.field === 'title')).toBe(true);
    });

    it('should detect missing kpiValue for KPI chart', () => {
      const result: any = {
        chartId: 'chart-1',
        type: 'kpi',
        title: 'Test Chart'
        // kpiValue missing
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'MISSING_FIELD' && i.context?.field === 'kpiValue')).toBe(true);
    });

    it('should detect missing elements for PIE chart', () => {
      const result: any = {
        chartId: 'chart-1',
        type: 'pie',
        title: 'Test Chart'
        // elements missing
      };

      const pieChart: Chart = {
        ...mockChart,
        type: 'pie'
      };

      const validation = validateChartData(result, pieChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'MISSING_FIELD' && i.context?.field === 'elements')).toBe(true);
    });

    it('should pass when all required fields exist', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: 100
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.issues.filter(i => i.type === 'MISSING_FIELD').length).toBe(0);
    });
  });

  describe('Value Type Validation', () => {
    it('should detect NaN in KPI value', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: NaN
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'INVALID_VALUE' && i.context?.value === NaN)).toBe(true);
    });

    it('should detect Infinity in KPI value', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: Infinity
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'INVALID_VALUE' && i.context?.value === Infinity)).toBe(true);
    });

    it('should detect NaN in element value', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'pie',
        title: 'Test Chart',
        elements: [
          { label: 'Element 1', value: NaN }
        ]
      };

      const pieChart: Chart = {
        ...mockChart,
        type: 'pie'
      };

      const validation = validateChartData(result, pieChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'INVALID_VALUE' && i.context?.elementIndex === 0)).toBe(true);
    });

    it('should detect Infinity in element value', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'pie',
        title: 'Test Chart',
        elements: [
          { label: 'Element 1', value: Infinity }
        ]
      };

      const pieChart: Chart = {
        ...mockChart,
        type: 'pie'
      };

      const validation = validateChartData(result, pieChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'INVALID_VALUE' && i.context?.elementIndex === 0)).toBe(true);
    });

    it('should warn about negative values in PIE chart', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'pie',
        title: 'Test Chart',
        elements: [
          { label: 'Element 1', value: -10 }
        ]
      };

      const pieChart: Chart = {
        ...mockChart,
        type: 'pie'
      };

      const validation = validateChartData(result, pieChart);
      expect(validation.issues.some(i => i.type === 'INVALID_VALUE' && i.severity === 'warning')).toBe(true);
    });

    it('should pass when values are valid', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: 100
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.issues.filter(i => i.type === 'INVALID_VALUE').length).toBe(0);
    });
  });

  describe('Element Structure Validation', () => {
    it('should detect missing label in element', () => {
      const result: any = {
        chartId: 'chart-1',
        type: 'pie',
        title: 'Test Chart',
        elements: [
          { value: 100 } // label missing
        ]
      };

      const pieChart: Chart = {
        ...mockChart,
        type: 'pie'
      };

      const validation = validateChartData(result, pieChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(i => i.type === 'INVALID_ELEMENT' && i.context?.elementIndex === 0)).toBe(true);
    });

    it('should pass when elements have required fields', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'pie',
        title: 'Test Chart',
        elements: [
          { label: 'Element 1', value: 100 }
        ]
      };

      const pieChart: Chart = {
        ...mockChart,
        type: 'pie'
      };

      const validation = validateChartData(result, pieChart);
      expect(validation.issues.filter(i => i.type === 'INVALID_ELEMENT').length).toBe(0);
    });
  });

  describe('Type Matching Validation', () => {
    it('should warn when result type does not match config type', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'pie', // Result is PIE
        title: 'Test Chart',
        elements: [{ label: 'Element 1', value: 100 }]
      };

      const kpiChart: Chart = {
        ...mockChart,
        type: 'kpi' // Config is KPI
      };

      const validation = validateChartData(result, kpiChart);
      expect(validation.issues.some(i => i.type === 'TYPE_MISMATCH')).toBe(true);
      expect(validation.issues.some(i => i.severity === 'warning')).toBe(true);
    });

    it('should pass when result type matches config type', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: 100
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.issues.filter(i => i.type === 'TYPE_MISMATCH').length).toBe(0);
    });
  });

  describe('Error Message Formatting', () => {
    it('should format MISSING_FIELD error', () => {
      const issue = {
        type: 'MISSING_FIELD' as const,
        severity: 'error' as const,
        message: 'Missing required field',
        context: { field: 'chartId' }
      };

      const message = formatValidationIssue(issue);
      expect(message).toContain('chartId');
    });

    it('should format INVALID_VALUE error', () => {
      const issue = {
        type: 'INVALID_VALUE' as const,
        severity: 'error' as const,
        message: 'Invalid value',
        context: { chartId: 'chart-1', value: NaN }
      };

      const message = formatValidationIssue(issue);
      expect(message).toContain('chart-1');
      expect(message).toContain('invalid value');
    });

    it('should format INVALID_ELEMENT error', () => {
      const issue = {
        type: 'INVALID_ELEMENT' as const,
        severity: 'error' as const,
        message: 'Invalid element',
        context: { elementIndex: 0 }
      };

      const message = formatValidationIssue(issue);
      expect(message).toContain('Element 0');
    });
  });

  describe('Validation Status', () => {
    it('should return valid=true when no errors (warnings OK)', () => {
      const result: ChartResult = {
        chartId: 'chart-1',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: 100
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.valid).toBe(true);
      expect(validation.issues.filter(i => i.severity === 'error').length).toBe(0);
    });

    it('should return valid=false when errors exist', () => {
      const result: any = {
        chartId: 'chart-1',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: NaN // Invalid value (error)
      };

      const validation = validateChartData(result, mockChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.filter(i => i.severity === 'error').length).toBeGreaterThan(0);
    });

    it('should handle undefined result', () => {
      const validation = validateChartData(undefined, mockChart);
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });
});
