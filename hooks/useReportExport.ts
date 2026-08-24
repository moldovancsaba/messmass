// WHAT: Unified report export hook for CSV and PDF exports
// WHY: Centralize export logic to avoid duplication across report pages
// HOW: Single hook providing CSV and PDF export handlers with comprehensive error handling

'use client';

import { useCallback } from 'react';
import { exportReportToCSV } from '@/lib/export/csv';
import type { ProjectStats } from '@/lib/report-calculator';

/**
 * Report entity interface - minimal data needed for export
 */
export interface ReportEntity {
  _id: string;
  name?: string;        // Partner name or event name
  eventName?: string;   // Event name (for events)
  eventDate?: string;   // Event date (for events)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Hook options
 */
export interface UseReportExportOptions {
  /** Report entity (partner, event, filter, etc.) */
  entity: ReportEntity | null;
  
  /** Report stats data */
  stats: ProjectStats | null;
  
  /** Chart calculation results */
  chartResults: Map<string, any> | null;
  
  /** Optional: Chart configurations for ordering (A-R-10 Phase 2) */
  charts?: Array<{ chartId: string; order: number }>;
  
  /** Optional: Custom filename prefix (default: entity name) */
  filenamePrefix?: string;
  
  /** Optional: Report type for logging (default: 'report') */
  reportType?: string;
}

/**
 * Hook return value
 */
export interface UseReportExportReturn {
  /** CSV export handler - pass to ReportHero onExportCSV prop */
  handleCSVExport: () => Promise<void>;
  
  /** PDF export handler - pass to ReportHero onExportPDF prop */
  handlePDFExport: () => Promise<void>;
  
  /** Whether export is ready (all data available) */
  isExportReady: boolean;
}

/**
 * useReportExport()
 * 
 * WHAT: Unified export hook for all report pages
 * WHY: Eliminate code duplication across event/partner/filter/hashtag reports
 * HOW: Provides CSV and PDF export handlers with validation and error handling
 * 
 * @param options - Export configuration
 * @returns Export handlers and ready state
 * 
 * @example
 * ```tsx
 * const { handleCSVExport, handlePDFExport } = useReportExport({
 *   entity: project,
 *   stats: project?.stats,
 *   chartResults,
 *   reportType: 'Event Report'
 * });
 * 
 * <ReportHero 
 *   project={project}
 *   onExportCSV={handleCSVExport}
 *   onExportPDF={handlePDFExport}
 * />
 * ```
 */
export function useReportExport(options: UseReportExportOptions): UseReportExportReturn {
  const { 
    entity, 
    stats, 
    chartResults, 
    charts,
    filenamePrefix,
    reportType = 'Report'
  } = options;

  // Determine if export is ready
  const isExportReady = !!(entity && stats && chartResults);

  // WHAT: CSV export handler
  // WHY: Download complete report data including stats, chart results, and content
  // HOW: Call exportReportToCSV with entity data, stats, and chart results
  const handleCSVExport = useCallback(async () => {
    console.log(`🔵 CSV Export clicked (${reportType})`);
    console.log('   Entity:', entity ? '✅' : '❌');
    console.log('   Stats:', stats ? '✅' : '❌');
    console.log('   Chart Results:', chartResults ? `✅ (${chartResults.size} charts)` : '❌');
    
    if (!entity || !stats || !chartResults) {
      const missingData = [];
      if (!entity) missingData.push('entity');
      if (!stats) missingData.push('stats');
      if (!chartResults) missingData.push('chart results');
      
      const message = `Report data not ready. Missing: ${missingData.join(', ')}. Please wait for the report to fully load.`;
      console.warn('⚠️ Cannot export CSV:', message);
      alert(message);
      return;
    }

    try {
      console.log('📄 Starting CSV export...');
      
      // Extract name for export
      const entityName = entity.name || entity.eventName || 'Report';
      
      // Build chartOrderMap from charts array (A-R-10 Phase 2)
      const chartOrderMap = charts 
        ? new Map(charts.map(chart => [chart.chartId, chart.order]))
        : undefined;

      await exportReportToCSV(
        {
          eventName: entityName,
          eventDate: entity.eventDate || new Date().toISOString(),
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          _id: entity._id
        },
        stats,
        chartResults,
        { chartOrderMap }
      );
      
      console.log('✅ CSV export completed successfully');
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export CSV: ${errorMessage}\n\nPlease check the browser console for details and try again.`);
    }
  }, [entity, stats, chartResults, charts, reportType]);

  // WHAT: PDF export handler
  // WHY: Generate an A4 PDF with no chart/image split across a page break
  // HOW: Hand off to app/api/export/pdf/route.ts, which drives a real headless browser
  // to this same page and calls its native print pipeline. A GET to a URL that responds
  // with Content-Disposition: attachment is the download, no client-side rendering or
  // blob handling involved — this is deliberate: that's what makes it reliable on
  // mobile browsers, where generating and downloading a client-built PDF blob is a
  // known-flaky pattern. See app/api/export/pdf/route.ts's top-of-file comment for the
  // full reasoning.
  const handlePDFExport = useCallback(async () => {
    console.log(`🗔️ PDF Export clicked (${reportType})`);
    console.log('   Entity:', entity ? '✅' : '❌');

    if (!entity) {
      const message = 'Report data not ready. Entity information is missing. Please wait for the report to fully load.';
      console.warn('⚠️ Cannot export PDF:', message);
      alert(message);
      return;
    }

    const entityName = entity.name || entity.eventName || 'report';
    const filename = filenamePrefix
      ? `${filenamePrefix}_${entityName.replace(/[^a-zA-Z0-9]/g, '_')}`
      : entityName.replace(/[^a-zA-Z0-9]/g, '_');

    const exportUrl = `/api/export/pdf?path=${encodeURIComponent(window.location.pathname + window.location.search)}&filename=${encodeURIComponent(filename)}`;
    console.log('📝 Requesting PDF export:', exportUrl);
    window.location.href = exportUrl;
  }, [entity, filenamePrefix, reportType]);

  return {
    handleCSVExport,
    handlePDFExport,
    isExportReady
  };
}
