// lib/export/chartValidation.ts
// WHAT: Shared chart validation utilities for export parity
// WHY: Ensure CSV export matches rendered report filtering logic
// HOW: Extract hasValidChartData from ReportContent for reuse

import type { ChartResult } from '@/lib/report-calculator';

/**
 * WHAT: Validates if a chart result has displayable data
 * WHY: Used by rendered report to filter out empty/invalid charts
 * HOW: Type-specific validation matching ReportChart.hasData logic
 * 
 * NOTE: This function must match the logic in app/report/[slug]/ReportContent.tsx:hasValidChartData()
 * to ensure export parity with rendered report.
 */
export function hasValidChartData(result: ChartResult | undefined): boolean {
  if (!result || result.error) return false;
  
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
