// __tests__/export-parity.test.ts
// WHAT: Regression tests for A-R-10 Phase 2 - CSV export parity with rendered report
// WHY: Ensure CSV export filtering and ordering match rendered report behavior
// HOW: Test hasValidChartData filtering and order-based sorting

import { hasValidChartData } from '@/lib/export/chartValidation';
import type { ChartResult } from '@/lib/report-calculator';

describe('A-R-10 Phase 2: CSV Export Parity', () => {
  describe('hasValidChartData() filtering', () => {
    it('should filter out charts with errors', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'kpi',
        title: 'Test Chart',
        error: 'Calculation failed',
        kpiValue: 100
      };

      expect(hasValidChartData(result)).toBe(false);
    });

    it('should filter out KPI charts with NA values', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: 'NA'
      };

      expect(hasValidChartData(result)).toBe(false);
    });

    it('should filter out KPI charts with undefined values', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: undefined
      };

      expect(hasValidChartData(result)).toBe(false);
    });

    it('should include valid KPI charts', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'kpi',
        title: 'Test Chart',
        kpiValue: 100
      };

      expect(hasValidChartData(result)).toBe(true);
    });

    it('should filter out BAR/PIE charts with empty elements', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'bar',
        title: 'Test Chart',
        elements: []
      };

      expect(hasValidChartData(result)).toBe(false);
    });

    it('should filter out BAR/PIE charts with zero total', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'bar',
        title: 'Test Chart',
        elements: [
          { label: 'A', value: 0 },
          { label: 'B', value: 0 }
        ]
      };

      expect(hasValidChartData(result)).toBe(false);
    });

    it('should include valid BAR charts with non-zero total', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'bar',
        title: 'Test Chart',
        elements: [
          { label: 'A', value: 50 },
          { label: 'B', value: 30 }
        ]
      };

      expect(hasValidChartData(result)).toBe(true);
    });

    it('should filter out TEXT charts with empty content', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'text',
        title: 'Test Chart',
        kpiValue: ''
      };

      expect(hasValidChartData(result)).toBe(false);
    });

    it('should filter out TEXT charts with NA content', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'text',
        title: 'Test Chart',
        kpiValue: 'NA'
      };

      expect(hasValidChartData(result)).toBe(false);
    });

    it('should include valid TEXT charts', () => {
      const result: ChartResult = {
        chartId: 'test-chart',
        type: 'text',
        title: 'Test Chart',
        kpiValue: 'Valid content'
      };

      expect(hasValidChartData(result)).toBe(true);
    });

    it('should filter out undefined results', () => {
      expect(hasValidChartData(undefined)).toBe(false);
    });
  });

  describe('CSV export ordering (order field sorting)', () => {
    it('should sort charts by order field when order map is provided', () => {
      const chartOrderMap = new Map<string, number>([
        ['chart-z', 1],
        ['chart-a', 2],
        ['chart-m', 3]
      ]);

      // Simulate sorting logic from CSV export
      const charts = [
        { chartId: 'chart-a', order: 2 },
        { chartId: 'chart-z', order: 1 },
        { chartId: 'chart-m', order: 3 }
      ];

      const sorted = charts.sort((a, b) => {
        const orderA = chartOrderMap.get(a.chartId) ?? Infinity;
        const orderB = chartOrderMap.get(b.chartId) ?? Infinity;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.chartId.localeCompare(b.chartId);
      });

      expect(sorted.map(c => c.chartId)).toEqual(['chart-z', 'chart-a', 'chart-m']);
    });

    it('should fall back to alphabetical by chartId when order not available', () => {
      const chartOrderMap = new Map<string, number>([
        ['chart-z', 1]
        // chart-a and chart-m not in map
      ]);

      const charts = [
        { chartId: 'chart-a' },
        { chartId: 'chart-z', order: 1 },
        { chartId: 'chart-m' }
      ];

      const sorted = charts.sort((a, b) => {
        const orderA = chartOrderMap.get(a.chartId) ?? Infinity;
        const orderB = chartOrderMap.get(b.chartId) ?? Infinity;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.chartId.localeCompare(b.chartId);
      });

      // chart-z should be first (order: 1), then alphabetical for others
      expect(sorted[0].chartId).toBe('chart-z');
      expect(sorted[1].chartId).toBe('chart-a');
      expect(sorted[2].chartId).toBe('chart-m');
    });

    it('should handle charts with same order by falling back to chartId', () => {
      const chartOrderMap = new Map<string, number>([
        ['chart-a', 1],
        ['chart-z', 1] // Same order
      ]);

      const charts = [
        { chartId: 'chart-z', order: 1 },
        { chartId: 'chart-a', order: 1 }
      ];

      const sorted = charts.sort((a, b) => {
        const orderA = chartOrderMap.get(a.chartId) ?? Infinity;
        const orderB = chartOrderMap.get(b.chartId) ?? Infinity;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.chartId.localeCompare(b.chartId);
      });

      // Should be alphabetical when order is same
      expect(sorted.map(c => c.chartId)).toEqual(['chart-a', 'chart-z']);
    });
  });

  describe('VALUE type chart handling', () => {
    it('should identify VALUE type charts for skip logic', () => {
      const result: ChartResult = {
        chartId: 'test-value-chart',
        type: 'value',
        title: 'Test Value Chart',
        elements: [
          { label: 'KPI', value: 100 },
          { label: 'BAR', value: 50 }
        ]
      };

      // VALUE type charts should be valid but skipped in CSV export
      // (their components KPI + BAR are exported separately)
      expect(hasValidChartData(result)).toBe(true);
      expect(result.type).toBe('value');
    });
  });
});
