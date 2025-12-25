// WHAT: Unified report export hook for CSV and PDF exports
// WHY: Centralize export logic to avoid duplication across report pages
// HOW: Single hook providing CSV and PDF export handlers with comprehensive error handling

'use client';

import { useCallback } from 'react';
import { exportReportToCSV } from '@/lib/export/csv';
import { exportPageWithSmartPagination } from '@/lib/export/pdf';
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
      
      await exportReportToCSV(
        {
          eventName: entityName,
          eventDate: entity.eventDate || new Date().toISOString(),
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
          _id: entity._id
        },
        stats,
        chartResults
      );
      
      console.log('✅ CSV export completed successfully');
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export CSV: ${errorMessage}\n\nPlease check the browser console for details and try again.`);
    }
  }, [entity, stats, chartResults, reportType]);

  // WHAT: PDF export handler
  // WHY: Generate A4 portrait PDF with hero on every page and no block breaks
  // HOW: Call exportPageWithSmartPagination with hero and content IDs
  const handlePDFExport = useCallback(async () => {
    console.log(`🗔️ PDF Export clicked (${reportType})`);
    console.log('   Entity:', entity ? '✅' : '❌');
    
    if (!entity) {
      const message = 'Report data not ready. Entity information is missing. Please wait for the report to fully load.';
      console.warn('⚠️ Cannot export PDF:', message);
      alert(message);
      return;
    }
    
    // Verify DOM elements exist
    const heroElement = document.getElementById('report-hero');
    const contentElement = document.getElementById('report-content');
    
    if (!heroElement) {
      console.error('❌ Hero element not found (id: report-hero)');
      alert('Cannot export PDF: Report hero section not found. Please refresh the page and try again.');
      return;
    }
    
    if (!contentElement) {
      console.error('❌ Content element not found (id: report-content)');
      alert('Cannot export PDF: Report content section not found. Please refresh the page and try again.');
      return;
    }

    try {
      console.log('📝 Starting PDF export...');
      console.log('   Hero element:', '✅');
      console.log('   Content element:', '✅');
      
      // Extract name for filename
      const entityName = entity.name || entity.eventName || 'report';
      const filename = filenamePrefix 
        ? `${filenamePrefix}_${entityName.replace(/[^a-zA-Z0-9]/g, '_')}`
        : entityName.replace(/[^a-zA-Z0-9]/g, '_');
      
      await exportPageWithSmartPagination(
        'report-hero',
        'report-content',
        {
          filename,
          format: 'a4',
          orientation: 'portrait',
          quality: 0.95,
          margin: 10
        }
      );
      
      console.log('✅ PDF export completed successfully');
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export PDF: ${errorMessage}\n\nPlease check the browser console for details and try again.`);
    }
  }, [entity, filenamePrefix, reportType]);

  return {
    handleCSVExport,
    handlePDFExport,
    isExportReady
  };
}
