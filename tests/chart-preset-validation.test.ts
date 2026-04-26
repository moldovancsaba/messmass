// tests/chart-preset-validation.test.ts
// WHAT: Unit tests for Markdown Presets (Issue #48)
// WHY: Ensure preset field is correctly handled in Chart and ChartResult
// HOW: Test calculator logic and data structures

import { ReportCalculator } from '@/lib/report-calculator';
import type { Chart, ProjectStats } from '@/lib/report-calculator';

describe('Issue #48: Markdown Presets Validation', () => {
  const mockStats: ProjectStats = {
    fans: 1000,
    males: 600,
    females: 400
  };

  const textChart: Chart = {
    chartId: 'text-1',
    title: 'Executive Summary',
    type: 'text',
    formula: '"This is a **standard** summary."',
    isActive: true,
    order: 1,
    preset: 'hero' // Testing preset field
  };

  it('should include preset field in Chart configuration', () => {
    expect(textChart.preset).toBe('hero');
  });

  it('should pass preset from Chart to ChartResult via ReportCalculator', () => {
    const calculator = new ReportCalculator([textChart], mockStats);
    const results = calculator.calculateAll(['text-1']);
    
    expect(results).toHaveLength(1);
    expect(results[0].chartId).toBe('text-1');
    expect(results[0].type).toBe('text');
    expect(results[0].preset).toBe('hero');
  });

  it('should default to undefined preset if not specified', () => {
    const noPresetChart: Chart = {
      ...textChart,
      chartId: 'text-2',
      preset: undefined
    };
    
    const calculator = new ReportCalculator([noPresetChart], mockStats);
    const results = calculator.calculateAll(['text-2']);
    
    expect(results).toHaveLength(1);
    expect(results[0].preset).toBeUndefined();
  });

  it('should support all preset types', () => {
    const presets: Array<'standard' | 'compact' | 'hero' | 'callout'> = ['standard', 'compact', 'hero', 'callout'];
    
    presets.forEach(p => {
      const chart: Chart = {
        ...textChart,
        chartId: `text-${p}`,
        preset: p
      };
      
      const calculator = new ReportCalculator([chart], mockStats);
      const results = calculator.calculateAll([`text-${p}`]);
      
      expect(results[0].preset).toBe(p);
    });
  });
});
