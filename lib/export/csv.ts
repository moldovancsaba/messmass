'use client';

/* WHAT: CSV Export Utility for Event Reports
   WHY: Allow users to download complete report data including metadata, stats, chart results, and content
   HOW: Generate structured CSV with clear sections for each data type */

import type { ChartResult } from '@/lib/report-calculator';
import type { ProjectStats } from '@/lib/report-calculator';
import { hasValidChartData } from './chartValidation';

/**
 * WHAT: Format chart value for CSV export (A-R-15)
 * WHY: Align CSV formatting with rendered report formatting
 * HOW: Apply prefix, suffix, and decimal formatting from ChartResult.formatting
 * 
 * @param value - The value to format (number, string, or undefined)
 * @param formatting - Formatting options from chart configuration
 * @returns Formatted string matching rendered report
 */
function formatValueForCSV(
  value: number | string | undefined,
  formatting?: { rounded?: boolean; prefix?: string; suffix?: string; decimals?: number }
): string {
  // WHAT: Handle NA and undefined values
  // WHY: Preserve NA values as-is, don't format missing data
  if (value === undefined || value === 'NA') return 'NA';
  
  // WHAT: Preserve string values as-is
  // WHY: Text/image URLs should not be formatted
  if (typeof value === 'string') return value;
  
  // WHAT: Determine decimal places from formatting
  // WHY: Support both new (rounded) and legacy (decimals) formatting
  let decimals = 0;
  if (formatting) {
    if (formatting.rounded !== undefined) {
      // WHAT: New format - rounded flag determines decimals
      // WHY: rounded=true → whole numbers (0 decimals), rounded=false → 2 decimals
      decimals = formatting.rounded ? 0 : 2;
    } else if (formatting.decimals !== undefined) {
      // WHAT: Legacy format - use decimals field directly
      // WHY: Backward compatibility with old chart configurations
      decimals = formatting.decimals;
    }
  }
  
  // WHAT: Apply prefix and suffix
  // WHY: Match rendered report formatting (€, $, %, etc.)
  const { prefix = '', suffix = '' } = formatting || {};
  
  // WHAT: Format number with specified decimals (no thousands separators for CSV compatibility)
  // WHY: CSV should be easily parseable by analysis tools (Excel, Google Sheets)
  // NOTE: Rendered report may use toLocaleString() for thousands separators, but CSV uses toFixed()
  // for better compatibility with data analysis tools
  const formattedNumber = value.toFixed(decimals);
  
  return `${prefix}${formattedNumber}${suffix}`;
}

/**
 * WHAT: Project metadata for CSV export
 * WHY: Type-safe interface for event information
 */
export interface ProjectMetadata {
  eventName: string;
  eventDate: string;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

/**
 * WHAT: Options for CSV export customization
 * WHY: Allow control over filename and included sections
 */
export interface CSVExportOptions {
  filename?: string;
  includeMetadata?: boolean;
  includeStats?: boolean;
  includeChartResults?: boolean;
  includeReportContent?: boolean;
  /** Optional map of chartId -> order for sorting charts to match rendered report */
  chartOrderMap?: Map<string, number>;
}

/**
 * WHAT: Export complete report data to CSV file
 * WHY: Provide comprehensive data export for client analysis
 * HOW: Generate CSV with sections for metadata, stats, chart results, and report content
 * 
 * @param project - Project metadata (event name, date, etc.)
 * @param stats - Raw clicker data (all variables)
 * @param chartResults - Calculated chart values from algorithms
 * @param options - Export options and filename
 */
export async function exportReportToCSV(
  project: ProjectMetadata,
  stats: ProjectStats,
  chartResults: Map<string, ChartResult>,
  options: CSVExportOptions = {}
): Promise<void> {
  const {
    filename,
    includeMetadata = true,
    includeStats = true,
    includeChartResults = true,
    includeReportContent = true
  } = options;

  try {
    console.log('📄 Starting CSV export...');

    /* WHAT: Escape CSV values
       WHY: Handle quotes and commas safely
       HOW: Wrap in quotes and double internal quotes */
    const esc = (value: any): string => {
      const str = String(value ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows: string[] = [];

    // WHAT: CSV Header
    // WHY: Define column structure
    rows.push('Section,Variable,Value');

    // WHAT: Section 1 - Event Metadata
    // WHY: Basic event information for reference
    if (includeMetadata) {
      rows.push(`${esc('Metadata')},${esc('Event Name')},${esc(project.eventName)}`);
      rows.push(`${esc('Metadata')},${esc('Event Date')},${esc(project.eventDate)}`);
      if (project.createdAt) {
        rows.push(`${esc('Metadata')},${esc('Created At')},${esc(project.createdAt)}`);
      }
      if (project.updatedAt) {
        rows.push(`${esc('Metadata')},${esc('Updated At')},${esc(project.updatedAt)}`);
      }
      if (project._id) {
        rows.push(`${esc('Metadata')},${esc('Project ID')},${esc(project._id)}`);
      }
    }

    // WHAT: Section 2 - Raw Clicker Data (all stats variables)
    // WHY: Include all base data collected in clicker/manual modes
    // HOW: Iterate through stats object excluding report content variables
    if (includeStats && stats) {
      const statsEntries = Object.entries(stats)
        .filter(([key]) => {
          // WHAT: Exclude report content from this section (handled separately)
          return !key.startsWith('reportText') && !key.startsWith('reportImage');
        })
        .sort(([a], [b]) => a.localeCompare(b)); // Sort alphabetically

      for (const [key, value] of statsEntries) {
        // WHAT: Only include numbers and strings
        // WHY: Avoid complex objects in CSV
        if (typeof value === 'number' || typeof value === 'string') {
          rows.push(`${esc('Clicker Data')},${esc(key)},${esc(value)}`);
        }
      }
    }

    // WHAT: Section 3 - Chart Algorithm Results
    // WHY: Include all calculated chart values from formulas
    // HOW: Process each chart result based on type (KPI, BAR, PIE, etc.)
    // NOTE (A-R-10): Filter by hasValidChartData() to match rendered report, sort by order field
    if (includeChartResults && chartResults.size > 0) {
      // WHAT: Filter charts to match rendered report (A-R-10 Phase 2)
      // WHY: CSV export should only include charts that would be rendered
      // HOW: Use hasValidChartData() to filter out empty/invalid charts
      const validCharts = Array.from(chartResults.values())
        .filter(result => hasValidChartData(result));

      // WHAT: Sort charts by order field to match rendered report (A-R-10 Phase 2)
      // WHY: CSV export order should match rendered report order
      // HOW: Use chartOrderMap if available, fall back to chartId alphabetical
      const { chartOrderMap } = options;
      const sortedCharts = validCharts.sort((a, b) => {
        if (chartOrderMap) {
          const orderA = chartOrderMap.get(a.chartId) ?? Infinity;
          const orderB = chartOrderMap.get(b.chartId) ?? Infinity;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
        }
        // Fallback to alphabetical by chartId if order not available
        return a.chartId.localeCompare(b.chartId);
      });

      for (const result of sortedCharts) {
        // WHAT: Handle different chart types appropriately
        switch (result.type) {
          case 'kpi':
            // WHAT: Single value charts - apply formatting to match rendered report (A-R-15)
            // WHY: CSV values should match what users see in the report
            const formattedKPI = formatValueForCSV(result.kpiValue, result.formatting);
            rows.push(`${esc('Algorithm Results')},${esc(result.title)},${esc(formattedKPI)}`);
            break;

          case 'bar':
          case 'pie':
            // WHAT: Multi-element charts - export each element with formatting (A-R-15)
            // WHY: CSV values should match what users see in the report
            if (result.elements && result.elements.length > 0) {
              for (const element of result.elements) {
                const label = `${result.title} - ${element.label}`;
                // WHAT: Apply formatting to element value to match rendered report
                const formattedElementValue = formatValueForCSV(element.value, result.formatting);
                rows.push(`${esc('Algorithm Results')},${esc(label)},${esc(formattedElementValue)}`);
              }
            }
            break;

          case 'text':
            // WHAT: Text charts - export content
            rows.push(`${esc('Algorithm Results')},${esc(result.title)},${esc(result.kpiValue ?? '')}`);
            break;

          case 'image':
            // WHAT: Image charts - export URL
            rows.push(`${esc('Algorithm Results')},${esc(result.title)},${esc(result.kpiValue ?? '')}`);
            break;

          case 'value':
            // WHAT: VALUE type is composite (KPI + BAR), skip to avoid duplication
            // WHY: VALUE charts render their components separately (KPI + BAR are exported separately)
            // NOTE (A-R-10 Phase 2): This skip is intentional and documented. VALUE charts are composite
            // and their components (KPI and BAR) are already exported separately, so including the VALUE
            // chart itself would create duplicate entries in the CSV export.
            break;

          default:
            console.warn(`[CSV Export] Unknown chart type: ${result.type}`);
        }
      }
    }

    // WHAT: Section 4 - Report Content (text and images)
    // WHY: Explicitly export report text and image URLs for easy access
    // HOW: Search stats for reportTextN and reportImageN keys
    if (includeReportContent && stats) {
      const reportTexts: Array<[string, string]> = [];
      const reportImages: Array<[string, string]> = [];

      for (const [key, value] of Object.entries(stats)) {
        if (key.startsWith('reportText') && (typeof value === 'string' || typeof value === 'number')) {
          reportTexts.push([key, String(value)]);
        } else if (key.startsWith('reportImage') && (typeof value === 'string' || typeof value === 'number')) {
          reportImages.push([key, String(value)]);
        }
      }

      // WHAT: Sort by variable name (reportText1, reportText2, etc.)
      reportTexts.sort(([a], [b]) => a.localeCompare(b));
      reportImages.sort(([a], [b]) => a.localeCompare(b));

      // WHAT: Export report texts
      for (const [key, value] of reportTexts) {
        rows.push(`${esc('Report Content')},${esc(key)},${esc(value)}`);
      }

      // WHAT: Export report image URLs
      for (const [key, value] of reportImages) {
        rows.push(`${esc('Report Content')},${esc(key)},${esc(value)}`);
      }
    }

    // WHAT: Generate CSV content
    // WHY: Join all rows with newlines
    const csvContent = rows.join('\n');

    // WHAT: Create blob and download link
    // WHY: Trigger browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // WHAT: Generate filename with timestamp
    // WHY: Avoid filename conflicts
    const timestamp = new Date().toISOString().split('T')[0];
    const safeEventName = project.eventName.replace(/[^a-zA-Z0-9]/g, '_') || 'event';
    const fullFilename = filename || `${safeEventName}_report_${timestamp}.csv`;

    // WHAT: Set up download link
    link.setAttribute('href', url);
    link.setAttribute('download', fullFilename);
    link.style.visibility = 'hidden';

    // WHAT: Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // WHAT: Clean up blob URL
    URL.revokeObjectURL(url);

    console.log(`✅ CSV exported: ${fullFilename}`);
    console.log(`   - Rows: ${rows.length}`);
    console.log(`   - Metadata: ${includeMetadata ? 'Yes' : 'No'}`);
    console.log(`   - Stats: ${includeStats ? 'Yes' : 'No'}`);
    console.log(`   - Chart Results: ${includeChartResults ? 'Yes' : 'No'}`);
    console.log(`   - Report Content: ${includeReportContent ? 'Yes' : 'No'}`);
  } catch (error) {
    console.error('❌ Failed to export CSV:', error);
    throw error;
  }
}

/**
 * WHAT: Check if CSV export is ready
 * WHY: Validate required data before attempting export
 * HOW: Check for project, stats, and chart results
 */
export function isCSVExportReady(
  project?: ProjectMetadata | null,
  stats?: ProjectStats | null,
  chartResults?: Map<string, ChartResult> | null
): boolean {
  return !!(project && stats && chartResults);
}
