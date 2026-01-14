// WHAT: Single Chart Renderer (v12.0.0)
// WHY: Atomic component for rendering individual chart types in reports
// HOW: Receives ChartResult from ReportCalculator and renders based on type

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import type { ChartResult } from '@/lib/report-calculator';
import { preventPhraseBreaks } from '@/lib/chartLabelUtils';
import MaterialIcon from '@/components/MaterialIcon';
import CellWrapper from '@/components/CellWrapper';
import { ChartErrorBoundary } from '@/components/ChartErrorBoundary';
import styles from './ReportChart.module.css';
import { parseMarkdown } from '@/lib/markdownUtils';
import { parseTableMarkdown } from '@/lib/tableMarkdownUtils';
import { sanitizeHTML } from '@/lib/sanitize';
import { validateCriticalCSSVariable, CRITICAL_CSS_VARIABLES } from '@/lib/layoutGrammarRuntimeEnforcement';
import { getUserFriendlyErrorMessage } from '@/lib/chartErrorTypes';
import { validateChartData, formatValidationIssue } from '@/lib/export/chartValidation';
import type { Chart } from '@/lib/report-calculator';

// Register Chart.js components for pie charts
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Helper function to format values with prefix/suffix and decimals
 * WHAT: Formats numeric values with proper decimal places based on rounded flag
 * WHY: Support both rounded (whole numbers) and decimal (2 places) formatting
 * HOW: Uses rounded flag from formatting object, converts to decimals
 */
function formatValue(
  value: number | string | undefined, 
  formatting?: { rounded?: boolean; prefix?: string; suffix?: string; decimals?: number }
): string {
  if (value === undefined || value === 'NA') return 'NA';
  if (typeof value === 'string') return value;
  
  // WHAT: Determine decimal places from rounded flag or legacy decimals field
  // WHY: Support both new formatting.rounded and legacy decimals format
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
  
  const { prefix = '', suffix = '' } = formatting || {};
  const formattedNumber = value.toFixed(decimals);
  return `${prefix}${formattedNumber}${suffix}`;
}

/**
 * Helper function to get decimal places from formatting
 * WHAT: Extracts decimal count from formatting object
 * WHY: Reusable logic for percentage calculations
 */
function getDecimalsFromFormatting(formatting?: { rounded?: boolean; decimals?: number }): number {
  if (!formatting) return 0;
  if (formatting.rounded !== undefined) {
    return formatting.rounded ? 0 : 2;
  }
  return formatting.decimals ?? 0;
}


/**
 * Props for ReportChart component
 */
interface ReportChartProps {
  /** Chart result from ReportCalculator */
  result: ChartResult;
  
  /** Optional chart configuration (for type matching validation) */
  chart?: Chart | null;
  
  /** Optional width override (grid units) */
  width?: number;
  
  /** Block height from layout calculator (Report Layout Spec v2.0) */
  blockHeight?: number;
  
  // WHAT: P1 1.5 Phase 3 - Removed titleFontSize and subtitleFontSize props
  // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
  
  /** Unified font-size for text charts in block (rem) */
  unifiedTextFontSize?: number | null;
  
  /** Optional CSS class for container */
  className?: string;
}

/**
 * ReportChart
 * 
 * WHAT: Renders a single chart based on its type and result data
 * WHY: Single atomic component for all chart types - clean and maintainable
 * 
 * Supported Chart Types:
 * - KPI: Large metric display with icon
 * - PIE: Two-element circular chart with percentages
 * - BAR: Five-element horizontal bar chart
 * - TEXT: Formatted text display
 * - IMAGE: Aspect ratio-aware image display
 * - VALUE: Composite (KPI + BAR) - renders both components
 */
export default function ReportChart({ result, chart, width, blockHeight, unifiedTextFontSize, className }: ReportChartProps) {
  // WHAT: A-R-11 - Check for calculation errors first
  // WHY: Display error messages to users instead of hiding charts
  // HOW: Show error placeholder if chartError or error exists
  const hasError = !!(result.chartError || result.error);
  
  if (hasError) {
    return (
      <CellWrapper className={className}>
        <div className={`${styles.chart} ${styles.chartError}`}>
          <MaterialIcon name="error_outline" className={styles.chartErrorIcon} />
          <div className={styles.chartErrorTitle}>{result.title || 'Chart Error'}</div>
          <div className={styles.chartErrorMessage}>
            {result.chartError
              ? getUserFriendlyErrorMessage(result.chartError)
              : result.error || 'Chart calculation failed'}
          </div>
        </div>
      </CellWrapper>
    );
  }

  // A-R-13: Validate chart data structure and values
  const dataValidation = validateChartData(result, chart || null);
  if (!dataValidation.valid) {
    const errorIssues = dataValidation.issues.filter(i => i.severity === 'error');
    if (errorIssues.length > 0) {
      // Display first error issue
      return (
        <CellWrapper className={className}>
          <div className={`${styles.chart} ${styles.chartError}`}>
            <MaterialIcon name="error_outline" className={styles.chartErrorIcon} />
            <div className={styles.chartErrorTitle}>{result.title || 'Chart Error'}</div>
            <div className={styles.chartErrorMessage}>
              {formatValidationIssue(errorIssues[0])}
            </div>
          </div>
        </CellWrapper>
      );
    }
  }

  // WHAT: Check if chart has valid displayable data
  // WHY: Don't render placeholders for empty/NA values
  // HOW: Type-specific validation matching ReportCalculator.hasValidData()
  const hasData = (() => {
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
  })();

  // WHAT: Hide cells with no data (v11.48.0)
  // WHY: Clean reports - only show charts with actual data
  // HOW: Return null instead of placeholder when no data
  // NOTE: A-R-11 - Errors are shown above, empty data is still hidden
  if (!hasData) {
    return null;
  }

  // A-R-13: Wrap chart rendering in error boundary to catch rendering errors
  const ChartContent = () => {
  // Render based on chart type
    // WHAT: blockHeight prop removed - now centrally managed via --block-height CSS custom property on row
    // WHY: Eliminates per-chart inline styles, better maintainability
  switch (result.type) {
    case 'kpi':
        return <KPIChart result={result} className={className} />;
    
    case 'pie':
        return <PieChart result={result} className={className} />;
    
    case 'bar':
        return <BarChart result={result} className={className} />;
    
    case 'text':
        return <TextChart result={result} unifiedTextFontSize={unifiedTextFontSize} className={className} />;
    
    case 'image':
        return <ImageChart result={result} className={className} />;
    
    case 'table':
        return <TableChart result={result} className={className} />;
    
    case 'value':
      // VALUE charts render KPI + BAR together
      return (
        <div className={`${styles.valueComposite} ${className || ''}`}>
            <KPIChart result={result} className={className} />
            <BarChart result={result} />
        </div>
      );
    
    default:
      return (
        <div className={`${styles.chart} ${styles.unknown} ${className || ''}`}>
          <span>Unknown chart type: {result.type}</span>
        </div>
      );
  }
  };

  // Wrap in error boundary for graceful degradation
  return (
    <ChartErrorBoundary
      chartId={result.chartId}
      chartTitle={result.title}
      fallback={
        <CellWrapper className={className}>
          <div className={`${styles.chart} ${styles.chartError}`}>
            <MaterialIcon name="error_outline" className={styles.chartErrorIcon} />
            <div className={styles.chartErrorTitle}>{result.title || 'Chart Error'}</div>
            <div className={styles.chartErrorMessage}>
              Chart rendering failed. Please refresh the page or contact support if the issue persists.
            </div>
          </div>
        </CellWrapper>
      }
    >
      <ChartContent />
    </ChartErrorBoundary>
  );
}


/**
 * KPI Chart - 3-row grid layout with CSS-only auto-sizing
 * Icon (30%) → Value (40%) → Label (30%, CSS clamp + text wrap)
 * UPDATED: Uses CellWrapper for Report Layout Spec v2.0
 * A-03.2: Enhanced height calculation to prevent value/label clipping
 */
function KPIChart({ result, className }: { result: ChartResult; className?: string }) {
  const formattedValue = formatValue(result.kpiValue, result.formatting);
  const protectedTitle = preventPhraseBreaks(result.title);
  
  // WHAT: Use Material Icon with variant from chart config
  // WHY: Match admin UI and support all 2000+ Material Icons
  // HOW: Pass icon name and variant (default: outlined) to MaterialIcon component
  const iconVariant = result.iconVariant || 'outlined';
  
  // WHAT: Check if title should be shown in KPI grid (default: true)
  // WHY: Some charts may want to hide titles per Spec v2.0
  const showTitle = result.showTitle !== false;
  
  // WHAT: A-03.2 - Refs for height calculation to prevent clipping
  // WHY: Need to measure actual content height in value and title rows
  // HOW: Use refs to access DOM elements for measurement
  const kpiChartRef = useRef<HTMLDivElement>(null);
  const kpiValueRowRef = useRef<HTMLDivElement>(null);
  const kpiTitleRef = useRef<HTMLDivElement>(null);
  
  // WHAT: A-03.2 - Measure and validate KPI row heights to prevent clipping
  // WHY: Value and title rows must accommodate their content without clipping
  // HOW: Measure actual content height and verify it fits within allocated row height
  useEffect(() => {
    if (kpiChartRef.current && typeof window !== 'undefined') {
      const measureAndValidate = () => {
        const containerHeight = kpiChartRef.current?.offsetHeight || 0;
        if (containerHeight <= 0) return;
        
        // WHAT: Calculate allocated row heights based on grid proportions (4fr:3fr:3fr)
        // WHY: Grid rows are allocated: Icon 40% (4fr/10fr), Value 30% (3fr/10fr), Title 30% (3fr/10fr)
        // HOW: Calculate based on grid template rows: 4fr 3fr 3fr = 10fr total
        const iconRowHeight = containerHeight * 0.4; // 4fr / 10fr = 40%
        const valueRowHeight = containerHeight * 0.3; // 3fr / 10fr = 30%
        const titleRowHeight = containerHeight * 0.3; // 3fr / 10fr = 30%
        
        // WHAT: A-03.2 - Measure actual content height in value row
        // WHY: Value might wrap to multiple lines and exceed allocated height
        // HOW: Use offsetHeight (actual rendered height) to check if wrapped content fits
        if (kpiValueRowRef.current) {
          const valueElement = kpiValueRowRef.current;
          // WHAT: Use offsetHeight instead of scrollHeight for values
          // WHY: offsetHeight shows the actual rendered height after wrapping, scrollHeight includes all content
          // HOW: If content wraps properly, offsetHeight should match available height
          const actualValueHeight = valueElement.offsetHeight;
          
          // WHAT: Account for padding in value row (if any)
          // WHY: Padding reduces available space for content
          const computedStyle = window.getComputedStyle(valueElement);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
          const availableValueHeight = valueRowHeight - paddingTop - paddingBottom;
          
          // WHAT: If actual rendered height exceeds available space, log warning
          // WHY: Content should wrap to fit, but we need to verify it does
          // HOW: Check if wrapped content fits, log warning if it doesn't
          // NOTE: Use small tolerance (2px) to account for rounding and sub-pixel rendering differences
          const tolerance = 2; // 2px tolerance for rounding and sub-pixel rendering
          if (actualValueHeight > availableValueHeight + tolerance && availableValueHeight > 0) {
            console.warn(
              `[KPIChart A-03.2] Value rendered height (${actualValueHeight}px) exceeds available space (${availableValueHeight}px). ` +
              `Container: ${containerHeight}px, Value row allocated: ${valueRowHeight}px. ` +
              `Content should wrap to fit. Chart ID: ${result.chartId}`
            );
          }
        }
        
        // WHAT: A-03.2 - Measure actual content height in title row
        // WHY: Title might wrap to multiple lines and exceed allocated height
        // HOW: Use offsetHeight (actual rendered height) since title is clamped to 2 lines with -webkit-line-clamp
        if (showTitle && kpiTitleRef.current) {
          const titleElement = kpiTitleRef.current;
          const titleSpan = titleElement.querySelector('span');
          if (titleSpan) {
            // WHAT: Use offsetHeight instead of scrollHeight for titles
            // WHY: Titles use -webkit-line-clamp: 2, so offsetHeight shows the actual clamped height
            // HOW: scrollHeight includes all content, but offsetHeight shows what's actually rendered
            const actualTitleHeight = titleSpan.offsetHeight;
            
            // WHAT: Account for padding in title row
            // WHY: Padding reduces available space for content
            const computedStyle = window.getComputedStyle(titleElement);
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
            const availableTitleHeight = titleRowHeight - paddingTop - paddingBottom;
            
            // WHAT: If actual rendered height exceeds available space, reduce font size to fit
            // WHY: Title is clamped to 2 lines per Layout Grammar, but must fit within allocated space
            // HOW: If title exceeds space, dynamically reduce font size to ensure 2 lines fit
            // NOTE: Use small tolerance (2px) to account for rounding and sub-pixel rendering
            const tolerance = 2; // 2px tolerance for rounding and sub-pixel rendering
            if (actualTitleHeight > availableTitleHeight + tolerance && availableTitleHeight > 0) {
              // WHAT: Calculate required font size to fit 2 lines in available space
              // WHY: Title must fit within allocated space, so we need to reduce font size
              // HOW: availableHeight = 2 lines × fontSize × lineHeight, so fontSize = availableHeight / (2 × lineHeight)
              const lineHeight = 1.1; // From CSS: .kpi .kpiTitle { line-height: 1.1; }
              const padding = 16; // 2 × var(--mm-space-2)
              const availableForText = availableTitleHeight - padding;
              const maxFontSizeForTwoLines = availableForText / (2 * lineHeight);
              
              // WHAT: Get current font size and reduce if needed
              // WHY: Need to ensure title fits within allocated space
              // HOW: Apply reduced font size via inline style if current size is too large
              const computedStyle = window.getComputedStyle(titleSpan);
              const currentFontSize = parseFloat(computedStyle.fontSize) || 16;
              
              if (currentFontSize > maxFontSizeForTwoLines && maxFontSizeForTwoLines > 0) {
                // WHAT: Apply reduced font size to ensure title fits
                // WHY: Title must fit within allocated space
                // HOW: Set inline style with reduced font size
                titleSpan.style.fontSize = `${maxFontSizeForTwoLines}px`;
                console.warn(
                  `[KPIChart A-03.2] Title rendered height (${actualTitleHeight}px) exceeds available space (${availableTitleHeight}px). ` +
                  `Reduced font size from ${currentFontSize}px to ${maxFontSizeForTwoLines}px to fit. ` +
                  `Container: ${containerHeight}px, Title row allocated: ${titleRowHeight}px. Chart ID: ${result.chartId}`
                );
              } else {
                console.warn(
                  `[KPIChart A-03.2] Title rendered height (${actualTitleHeight}px) exceeds available space (${availableTitleHeight}px). ` +
                  `Container: ${containerHeight}px, Title row allocated: ${titleRowHeight}px. ` +
                  `Title should clamp to 2 lines. Chart ID: ${result.chartId}`
                );
              }
            }
          }
        }
      };
      
      // WHAT: Measure after initial render and on resize
      // WHY: Heights may change on resize or content changes
      // A-03.2: Also measure after content changes
      measureAndValidate();
      
      // WHAT: Use requestAnimationFrame to ensure DOM is fully rendered before measuring
      // WHY: Content might not be fully rendered on initial mount
      // HOW: Delay measurement slightly to allow content to render
      const timeoutId = setTimeout(measureAndValidate, 0);
      
      const resizeObserver = new ResizeObserver(() => {
        // WHAT: Debounce resize measurements to avoid excessive calculations
        // WHY: Resize events can fire rapidly
        // HOW: Use requestAnimationFrame to batch measurements
        requestAnimationFrame(measureAndValidate);
      });
      
      if (kpiChartRef.current) {
        resizeObserver.observe(kpiChartRef.current);
      }
      
      // WHAT: Observe content changes to remeasure when content updates
      // WHY: Content height changes when value or title changes
      // HOW: Use MutationObserver to detect content changes
      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(measureAndValidate);
      });
      
      if (kpiChartRef.current) {
        mutationObserver.observe(kpiChartRef.current, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [showTitle, result.kpiValue, result.title, result.chartId]);
  
  // WHAT: KPI uses 3fr-4fr-3fr grid (Icon:Value:Title = 30%:40%:30%)
  // WHY: Maintains proportional distribution with full blockHeight
  // HOW: CellWrapper unnecessary - grid handles all layout
  return (
    <div 
      ref={kpiChartRef}
      className={`${styles.chart} ${styles.kpi} report-chart ${className || ''}`}
      // WHAT: blockHeight now centrally managed at row level via --block-height CSS custom property
      // WHY: Eliminated per-chart inline style - height comes from parent row container
    >
      <div className={styles.kpiIconRow}>
        {result.icon && (
          <MaterialIcon 
            name={result.icon} 
            variant={iconVariant}
            className={styles.kpiIcon}
          />
        )}
      </div>
      <div ref={kpiValueRowRef} className={styles.kpiValueRow}>{formattedValue}</div>
      {/* WHAT: Title is 3rd grid row directly in KPI grid */}
      {/* WHY: Maintains exact 3fr-4fr-3fr proportions across full cell height */}
      {showTitle && (
        <div ref={kpiTitleRef} className={styles.kpiTitle}>
          <span>{protectedTitle}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Pie Chart - Circular visualization using Chart.js
 * UPDATED: Uses CellWrapper for Report Layout Spec v2.0
 */
function PieChart({ result, className }: { result: ChartResult; className?: string }) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  if (!result.elements || result.elements.length === 0) {
    return <div className={styles.chart}>No pie data</div>;
  }

  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // WHAT: Check if percentages should be shown (default: true for backward compatibility)
  // WHY: v11.38.0 - Allow hiding percentages in pie chart legends
  const showPercentages = result.showPercentages !== false;
  
  const total = result.elements.reduce((sum, el) => sum + (typeof el.value === 'number' ? el.value : 0), 0);
  
  // WHAT: Read individual pie slice colors from CSS variables
  // WHY: Use custom style colors for each pie slice (granular control)
  // HOW: getComputedStyle reads --pieColor1/--pieColor2 from Style editor, fallback to design tokens only
  const getPieColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    // WHAT: No hardcoded colors - only CSS variables from Style editor or design tokens
    // WHY: All colors must come from Style editor or design system, no hardcoded fallbacks
    const primary = cs.getPropertyValue('--pieColor1').trim() || 
                    cs.getPropertyValue('--primary').trim() || 
                    cs.getPropertyValue('--mm-color-primary-500').trim() || 
                    ''; // WHAT: Empty string if no color available - will be handled by CSS fallback
    const secondary = cs.getPropertyValue('--pieColor2').trim() || 
                      cs.getPropertyValue('--secondary').trim() || 
                      cs.getPropertyValue('--mm-color-secondary-500').trim() || 
                      ''; // WHAT: Empty string if no color available - will be handled by CSS fallback
    // WHAT: Return design token fallback if colors are empty
    // WHY: Ensure we always have valid colors from design system
    return [
      primary || cs.getPropertyValue('--mm-color-primary-500').trim(),
      secondary || cs.getPropertyValue('--mm-color-secondary-500').trim(),
      primary || cs.getPropertyValue('--mm-color-primary-500').trim(),
      secondary || cs.getPropertyValue('--mm-color-secondary-500').trim(),
      primary || cs.getPropertyValue('--mm-color-primary-500').trim()
    ];
  };
  
  const pieColors = getPieColors();
  
  // WHAT: Read pie border color from Style Editor
  // WHY: Border color should be editable in Style Editor
  const getPieBorderColor = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    return cs.getPropertyValue('--pieBorderColor').trim() || pieColors[0];
  };
  const pieBorderColor = getPieBorderColor();
  
  // Prepare Chart.js data
  // WHAT: Force theme colors to override any element.color
  // WHY: Style must overwrite each and every color (user requirement)
  const chartData = {
    labels: result.elements.map(el => el.label),
    datasets: [{
      label: result.title,
      data: result.elements.map(el => typeof el.value === 'number' ? el.value : 0),
      backgroundColor: result.elements.map((el, idx) => 
        pieColors[idx % pieColors.length]
      ),
      // WHAT: Use pieBorderColor from Style Editor, fallback to first pie color
      // WHY: Border color should be editable in Style Editor
      borderColor: pieBorderColor,
      borderWidth: 2,
      hoverOffset: 6 // WHAT: Reduced from 8 to prevent overflow
    }]
  };
  
  // WHAT: Read tooltip colors from CSS variables
  // WHY: Respect custom style tooltip colors
  const getTooltipColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    return {
      bg: cs.getPropertyValue('--chartTooltipBackground').trim() || 'rgba(31, 41, 55, 0.95)',
      text: cs.getPropertyValue('--chartTooltipText').trim() || '#ffffff'
    };
  };
  const tooltipColors = getTooltipColors();

  // Chart.js options
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    layout: {
      padding: 10 // WHAT: Padding to prevent hover overflow
    },
    plugins: {
      legend: {
        display: false // WHAT: Hide Chart.js legend, use custom HTML legend
      },
      tooltip: {
        enabled: true,
        backgroundColor: tooltipColors.bg,
        titleColor: tooltipColors.text,
        bodyColor: tooltipColors.text,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed as number;
            // WHAT: Format percentage based on rounded setting
            // WHY: Respect formatting.rounded flag for decimal places
            const decimals = getDecimalsFromFormatting(result.formatting);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(decimals) : '0';
            // WHAT: Conditionally show percentage in tooltip based on showPercentages flag
            // WHY: Respect chart configuration setting (v11.38.0)
            return showPercentages 
              ? `${label}: ${value.toLocaleString()} (${percentage}%)`
              : `${label}: ${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  return (
    <div 
      className={`${styles.chart} ${styles.pie} report-chart ${className || ''}`}
      // WHAT: blockHeight now centrally managed at row level via --block-height CSS custom property
      // WHY: Eliminated per-chart inline style - height comes from parent row container
    >
      <div className={styles.pieGrid}>
        {/* WHAT: Title at top */}
        {/* WHY: User requirement - title should be first section */}
        {showTitle && (
          <div className={styles.pieTitleRow}>
            <h3 className={styles.pieTitleText}>{result.title}</h3>
          </div>
        )}
        {/* WHAT: Pie chart in middle */}
        {/* WHY: User requirement - pie chart should be middle section */}
        <div className={styles.pieChartContainer}>
          <Doughnut ref={chartRef} data={chartData} options={options} />
        </div>
        {/* WHAT: Legends at bottom center */}
        {/* WHY: User requirement - legends should be bottom section, centered */}
        <div className={styles.pieLegend}>
          {result.elements.map((element, idx) => {
            const numValue = typeof element.value === 'number' ? element.value : 0;
            // WHAT: Format percentage based on rounded setting
            // WHY: Respect formatting.rounded flag for decimal places
            const decimals = getDecimalsFromFormatting(result.formatting);
            const percentage = total > 0 ? ((numValue / total) * 100).toFixed(decimals) : '0';
            const color = pieColors[idx % pieColors.length];
            const protectedLabel = preventPhraseBreaks(element.label);
            return (
              <div 
                key={idx} 
                className={styles.pieLegendItem}
                // WHAT: Dynamic pie legend dot color from chart data
                // WHY: Colors come from chart calculation, cannot use static CSS classes
                // HOW: Set CSS custom properties on parent, consumed by .pieLegendDot
                // eslint-disable-next-line react/forbid-dom-props
                  style={{ 
                  '--dot-color': color,
                  '--dot-border-color': pieColors[0]
                } as React.CSSProperties}
              >
                <div className={styles.pieLegendDot} />
                <div className={styles.pieLegendText}>
                  {showPercentages ? `${protectedLabel}: ${percentage}%` : protectedLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Bar Chart - Five-element horizontal bars
 * UPDATED: Uses CellWrapper for Report Layout Spec v2.0
 */
function BarChart({ result, className }: { result: ChartResult; className?: string }) {
  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // WHAT: Ref for chart body to calculate body zone height (P1 1.4 Phase 2)
  // WHY: Calculate body zone height explicitly: containerHeight - titleHeight - subtitleHeight
  // HOW: Measure actual heights and set CSS custom property on chart container
  const chartBodyRef = useRef<HTMLDivElement>(null);
  
  // WHAT: Calculate and set body zone height explicitly (P1 1.4 Phase 2)
  // WHY: Replace flex: 1 with explicit height for deterministic behavior
  // HOW: Measure container and header heights, calculate body height, set CSS custom property
  useEffect(() => {
    if (!result.elements || result.elements.length === 0) return;
    if (chartBodyRef.current && typeof window !== 'undefined') {
      // WHAT: Find parent CellWrapper container (chart container)
      // WHY: CSS variable must be set on chart container per solution document
      const chartContainer = chartBodyRef.current.closest('[class*="cellWrapper"]') as HTMLElement;
      if (!chartContainer) return;
      
      const measureAndSetHeight = () => {
        // WHAT: Get container height from offsetHeight (actual rendered height)
        // WHY: Container height is set via --block-height from row
        const containerHeight = chartContainer.offsetHeight;
        
        // WHAT: Find title and subtitle zones within CellWrapper
        // WHY: Subtract header heights from container to get body height
        const titleZone = chartContainer.querySelector('[class*="titleZone"]') as HTMLElement;
        const subtitleZone = chartContainer.querySelector('[class*="subtitleZone"]') as HTMLElement;
        
        let titleHeight = 0;
        let subtitleHeight = 0;
        
        if (titleZone) {
          titleHeight = titleZone.offsetHeight;
        }
        if (subtitleZone) {
          subtitleHeight = subtitleZone.offsetHeight;
        }
        
        // WHAT: Calculate body zone height: container - title - subtitle
        // WHY: Explicit height calculation instead of flex growth
        const bodyHeight = containerHeight - titleHeight - subtitleHeight;
        
        // WHAT: Set CSS custom property for body zone height on chart container
        // WHY: P1 1.4 Phase 2 - explicit height cascade
        if (bodyHeight > 0) {
          chartContainer.style.setProperty('--chart-body-height', `${bodyHeight}px`);
        }
      };
      
      // WHAT: Measure after initial render and on resize
      // WHY: Heights may change on resize or content changes
      measureAndSetHeight();
      
      const resizeObserver = new ResizeObserver(measureAndSetHeight);
      resizeObserver.observe(chartContainer);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [showTitle, result.title, result.elements]);
  
  // WHAT: A-03.3 - Measure and validate BAR chart label heights to prevent clipping
  // WHY: Replace fixed label height assumptions with measured layout logic based on real rendered content
  // HOW: Measure actual label heights after rendering and validate they fit within allocated row height
  useEffect(() => {
    if (!result.elements || result.elements.length === 0) return;
    if (chartBodyRef.current && typeof window !== 'undefined') {
      const chartContainer = chartBodyRef.current.closest('[class*="cellWrapper"]') as HTMLElement;
      if (!chartContainer) return;
      
      const measureAndValidateLabels = () => {
        try {
          // WHAT: Get chart body height from CSS variable or actual height
          // WHY: Need body height to calculate available row height
          // HOW: Read --chart-body-height or use actual body height
          const bodyHeight = chartBodyRef.current?.offsetHeight || 0;
          if (bodyHeight <= 0) return;
          
          // WHAT: Get chart body padding (var(--mm-space-2) = 8px × 2 = 16px)
          // WHY: Padding reduces available space for rows
          const chartBodyPadding = 16; // 2 × var(--mm-space-2)
          
          // WHAT: Get row spacing (border-spacing: 0 var(--mm-space-2) = 8px)
          // WHY: Spacing between rows reduces available space
          const rowSpacing = 8; // var(--mm-space-2)
          
          // WHAT: Calculate available height per row
          // WHY: Each row needs space for label + bar track + spacing
          // HOW: (bodyHeight - padding) / barCount - spacing per gap
          const barCount = result.elements?.length || 0;
          if (barCount === 0) return; // Early return if no bars
          const availableHeightPerRow = (bodyHeight - chartBodyPadding) / barCount - rowSpacing;
          
          // WHAT: A-03.3 - Measure actual label heights for each row
          // WHY: Replace fixed assumptions with measured layout logic
          // HOW: Measure scrollHeight of each label cell to get actual rendered height
          const labelCells = chartBodyRef.current?.querySelectorAll('[class*="barLabel"]') as NodeListOf<HTMLElement>;
          if (!labelCells || labelCells.length === 0) return;
          
          labelCells.forEach((labelCell, idx) => {
            // WHAT: Measure actual label height (scrollHeight includes all wrapped lines)
            // WHY: scrollHeight gives actual content height including wrapped lines
            // HOW: Use scrollHeight to get full label height
            const actualLabelHeight = labelCell.scrollHeight;
            
            // WHAT: Get computed styles to account for padding
            // WHY: Padding reduces available space for content
            // HOW: Read padding from computed styles
            const computedStyle = window.getComputedStyle(labelCell);
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
            const availableLabelHeight = availableHeightPerRow - paddingTop - paddingBottom;
            
            // WHAT: Validate label fits within allocated row height
            // WHY: Labels must fit to prevent clipping (Layout Grammar)
            // HOW: Check if actual height exceeds available space
            if (actualLabelHeight > availableLabelHeight && availableLabelHeight > 0) {
              const labelText = result.elements?.[idx]?.label || 'unknown';
              console.warn(
                `[BarChart A-03.3] Label ${idx + 1} height (${actualLabelHeight}px) exceeds available space (${availableLabelHeight}px). ` +
                `Body: ${bodyHeight}px, Available per row: ${availableHeightPerRow}px. ` +
                `Label should wrap to fit. Chart ID: ${result.chartId}, Label: "${labelText}"`
              );
            }
            
            // WHAT: Validate row height (max of label height and bar track height)
            // WHY: Row height is determined by tallest element (label or bar track)
            // HOW: Bar track has minimum 20px height (Layout Grammar), row height = max(labelHeight, 20px)
            const minBarTrackHeight = 20; // Layout Grammar minimum
            const requiredRowHeight = Math.max(actualLabelHeight + paddingTop + paddingBottom, minBarTrackHeight);
            
            if (requiredRowHeight > availableHeightPerRow && availableHeightPerRow > 0) {
              console.warn(
                `[BarChart A-03.3] Row ${idx + 1} requires ${requiredRowHeight}px but only ${availableHeightPerRow}px available. ` +
                `Label height: ${actualLabelHeight}px, Bar track min: ${minBarTrackHeight}px. ` +
                `Chart ID: ${result.chartId}`
              );
            }
          });
        } catch (error) {
          console.error('[BarChart A-03.3] Unexpected error during label height measurement:', error);
        }
      };
      
      // WHAT: Measure after initial render and on resize
      // WHY: Heights may change on resize or content changes
      // A-03.3: Also measure after content changes
      measureAndValidateLabels();
      
      // WHAT: Use requestAnimationFrame to ensure DOM is fully rendered before measuring
      // WHY: Labels might not be fully rendered on initial mount
      // HOW: Delay measurement slightly to allow labels to render
      const timeoutId = setTimeout(measureAndValidateLabels, 0);
      
      const resizeObserver = new ResizeObserver(() => {
        // WHAT: Debounce resize measurements to avoid excessive calculations
        // WHY: Resize events can fire rapidly
        // HOW: Use requestAnimationFrame to batch measurements
        requestAnimationFrame(measureAndValidateLabels);
      });
      
      if (chartBodyRef.current) {
        resizeObserver.observe(chartBodyRef.current);
      }
      
      // WHAT: Observe content changes to remeasure when labels update
      // WHY: Label heights change when content or font size changes
      // HOW: Use MutationObserver to detect content changes
      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(measureAndValidateLabels);
      });
      
      if (chartBodyRef.current) {
        mutationObserver.observe(chartBodyRef.current, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [result.chartId, result.elements]);
  
  // WHAT: Runtime validation for CSS variables (P1 1.4 Phase 5 + A-05: Runtime Enforcement)
  // WHY: Ensure all height values are explicit and traceable, enforce in production
  // HOW: Check computed styles after CSS variables are applied, enforce in production
  useEffect(() => {
    if (!result.elements || result.elements.length === 0) return;
    if (chartBodyRef.current && typeof window !== 'undefined') {
      const chartContainer = chartBodyRef.current.closest('[class*="cellWrapper"]') as HTMLElement;
      if (!chartContainer) return;
      
      const validateHeight = () => {
        try {
          // WHAT: Validate critical CSS variables with runtime enforcement (A-05)
          // WHY: Fail-fast in production for critical violations
          // HOW: Use validateCriticalCSSVariable which throws in production, warns in dev
          // NOTE: Wrapped in try-catch to prevent validation errors from crashing component rendering
          try {
            validateCriticalCSSVariable(
              chartContainer,
              CRITICAL_CSS_VARIABLES.CHART_BODY_HEIGHT,
              { chartId: result.chartId, chartType: 'bar', containerHeight: chartContainer.offsetHeight }
            );
          } catch (error) {
            console.error('[BarChart] CSS variable validation error:', error);
          }
          
          try {
            validateCriticalCSSVariable(
              chartContainer,
              CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
              { chartId: result.chartId, chartType: 'bar' }
            );
          } catch (error) {
            console.error('[BarChart] CSS variable validation error:', error);
          }
        } catch (error) {
          console.error('[BarChart] Unexpected error during height validation:', error);
        }
      };
      
      // WHAT: Validate after initial render and on resize
      // WHY: Heights may change on resize or content changes
      validateHeight();
      
      const resizeObserver = new ResizeObserver(validateHeight);
      resizeObserver.observe(chartContainer);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [result.chartId, showTitle, result.title, result.elements]);
  
  // WHAT: Early return if no data (after hooks)
  if (!result.elements || result.elements.length === 0) {
    return <div className={styles.chart}>No bar data</div>;
  }
  
  // WHAT: Read individual bar colors from CSS variables
  // WHY: Use custom style colors for each bar (granular control)
  // HOW: getComputedStyle reads --barColor1-5 from Style editor, fallback to design tokens only
  const getBarColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    // WHAT: No hardcoded colors - only CSS variables from Style editor or design tokens
    // WHY: All colors must come from Style editor or design system, no hardcoded fallbacks
    const primary = cs.getPropertyValue('--mm-color-primary-500').trim();
    const secondary = cs.getPropertyValue('--mm-color-secondary-500').trim();
    const success = cs.getPropertyValue('--mm-success').trim() || cs.getPropertyValue('--mm-color-secondary-500').trim();
    const warning = cs.getPropertyValue('--mm-warning').trim();
    const error = cs.getPropertyValue('--mm-error').trim();
    return [
      cs.getPropertyValue('--barColor1').trim() || primary,
      cs.getPropertyValue('--barColor2').trim() || secondary,
      cs.getPropertyValue('--barColor3').trim() || success,
      cs.getPropertyValue('--barColor4').trim() || warning,
      cs.getPropertyValue('--barColor5').trim() || error,
    ];
  };
  
  const barColors = getBarColors();
  const maxValue = Math.max(...result.elements.map(el => typeof el.value === 'number' ? el.value : 0));

  return (
    <CellWrapper
      title={showTitle ? result.title : undefined}
      // WHAT: P1 1.5 Phase 3 - Removed titleFontSize and subtitleFontSize props
      // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
      className={`${styles.chart} ${styles.bar} report-chart ${className || ''}`}
    >
      {/* WHAT: Chart body ref for height calculation (P1 1.4 Phase 2) */}
      <div ref={chartBodyRef} className={styles.chartBody}>
        <table className={styles.barTable}>
          <tbody className={styles.barElements}>
        {result.elements.map((element, idx) => {
          const numValue = typeof element.value === 'number' ? element.value : 0;
          const widthPercent = maxValue > 0 ? (numValue / maxValue) * 100 : 0;
          const protectedLabel = preventPhraseBreaks(element.label);
          
          return (
              <tr key={idx} className={styles.barRow}>
                <td className={styles.barLabel}>{protectedLabel}</td>
                <td className={styles.barTrackCell}>
                  <div 
                    className={styles.barTrack}
                    // WHAT: Dynamic bar fill width and color from chart calculation
                    // WHY: Width is computed percentage, color from chart theme - cannot use static CSS
                    // HOW: Set CSS custom properties on parent, consumed by .barFill
                    // eslint-disable-next-line react/forbid-dom-props
                  style={{ 
                      '--bar-width': `${widthPercent}%`,
                      '--bar-color': barColors[idx % barColors.length]
                    } as React.CSSProperties}
                  >
                    <div className={styles.barFill} />
              </div>
                </td>
                <td className={styles.barValue}>{formatValue(element.value, result.formatting)}</td>
              </tr>
          );
        })}
          </tbody>
        </table>
      </div>
    </CellWrapper>
  );
}

/**
 * Text Chart - Formatted text display
 * REBUILT: Simple table structure to guarantee title above content
 * P1 1.4 Phase 4: Explicit text content height calculation
 */
function TextChart({ result, unifiedTextFontSize, className }: { result: ChartResult; unifiedTextFontSize?: number | null; className?: string }) {
  // WHAT: Render markdown content on report pages only
  // WHY: User requirement: text boxes render markdown only on report pages
  // HOW: Use parseMarkdown to convert supported markdown to HTML (title, bold, italic, lists, links)
  const raw = typeof result.kpiValue === 'string' ? result.kpiValue : '';
  const html = raw ? parseMarkdown(raw) : '';
  
  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // WHAT: Refs for height calculation (P1 1.4 Phase 4)
  // WHY: Calculate text content height explicitly: containerHeight - titleHeight
  // HOW: Measure actual heights and set CSS custom property
  const textChartRef = useRef<HTMLDivElement>(null);
  const textContentWrapperRef = useRef<HTMLDivElement>(null);
  
  // WHAT: Calculate and set text content height explicitly (P1 1.4 Phase 4)
  // WHY: Replace implicit height behavior with explicit height for deterministic behavior
  // HOW: Measure container and title heights, calculate content height, set CSS custom property
  // A-03.1: Enhanced to measure actual content height and ensure no clipping
  useEffect(() => {
    if (textChartRef.current && textContentWrapperRef.current && typeof window !== 'undefined') {
      const measureAndSetHeight = () => {
        // WHAT: Get chart container height from offsetHeight (actual rendered height)
        // WHY: Container height is set via --block-height from row
        const containerHeight = textChartRef.current?.offsetHeight || 0;
        
        // WHAT: Find title wrapper within chart container
        // WHY: Subtract title height from container to get content height
        const titleWrapper = textChartRef.current?.querySelector('[class*="textTitleWrapper"]') as HTMLElement;
        
        let titleHeight = 0;
        if (titleWrapper) {
          titleHeight = titleWrapper.offsetHeight;
        }
        
        // WHAT: Calculate text content height: container - title
        // WHY: Explicit height calculation instead of flex growth
        let contentHeight = containerHeight - titleHeight;
        
        // WHAT: A-03.1 - Measure actual rendered content height to prevent clipping
        // WHY: Multi-line text might exceed calculated height, causing clipping
        // HOW: Measure the actual scrollHeight of content wrapper and ensure container accommodates it
        const contentElement = textContentWrapperRef.current?.querySelector('[class*="textContent"]') as HTMLElement;
        if (contentElement) {
          // WHAT: Get actual content height (including all lines)
          // WHY: scrollHeight includes all content even if it overflows
          const actualContentHeight = contentElement.scrollHeight;
          
          // WHAT: Account for padding in content wrapper (var(--mm-space-2) = 8px top + 8px bottom = 16px)
          // WHY: Padding reduces available space for content
          const contentWrapperPadding = 16; // 2 × var(--mm-space-2)
          const availableContentHeight = contentHeight - contentWrapperPadding;
          
          // WHAT: If actual content exceeds available space, reduce font size to fit
          // WHY: Layout Grammar: content must fit without scrolling or clipping
          // HOW: Calculate maximum font size that fits the content and apply it dynamically
          if (actualContentHeight > availableContentHeight && availableContentHeight > 0) {
            // WHAT: Calculate required font size to fit content in available space
            // WHY: Content must fit within allocated space per Layout Grammar
            // HOW: Scale font size proportionally: newFontSize = currentFontSize × (availableHeight / actualHeight)
            const computedStyle = window.getComputedStyle(contentElement);
            const currentFontSize = parseFloat(computedStyle.fontSize) || 16;
            const lineHeight = parseFloat(computedStyle.lineHeight) || 1.3;
            
            // WHAT: Calculate scale factor based on available vs actual height
            // WHY: Need to reduce font size proportionally to fit content
            // HOW: Scale factor = availableHeight / actualHeight (with safety margin)
            const safetyMargin = 0.95; // 5% safety margin to ensure content fits
            const scaleFactor = (availableContentHeight / actualContentHeight) * safetyMargin;
            const newFontSize = currentFontSize * scaleFactor;
            
            // WHAT: Apply reduced font size if it's significantly different
            // WHY: Only apply if reduction is meaningful (more than 5% difference)
            // HOW: Set inline style with reduced font size
            if (scaleFactor < 0.95 && newFontSize > 8) { // Minimum font size of 8px for readability
              contentElement.style.fontSize = `${newFontSize}px`;
              console.warn(
                `[TextChart A-03.1] Content height (${actualContentHeight}px) exceeds available space (${availableContentHeight}px). ` +
                `Reduced font size from ${currentFontSize}px to ${newFontSize.toFixed(2)}px to fit. ` +
                `Container: ${containerHeight}px, Title: ${titleHeight}px, Content wrapper: ${contentHeight}px. Chart ID: ${result.chartId}`
              );
            } else if (scaleFactor < 0.95) {
              // WHAT: Font size would be too small, log warning
              // WHY: Content can't fit even with minimum readable font size
              // HOW: Log warning for investigation
              console.warn(
                `[TextChart A-03.1] Content height (${actualContentHeight}px) exceeds available space (${availableContentHeight}px). ` +
                `Cannot reduce font size further (would be ${newFontSize.toFixed(2)}px, minimum is 8px). ` +
                `Container: ${containerHeight}px, Title: ${titleHeight}px, Content wrapper: ${contentHeight}px. Chart ID: ${result.chartId}`
              );
            }
          }
        }
        
        // WHAT: Set CSS custom property for text content height on chart container
        // WHY: P1 1.4 Phase 4 - explicit height cascade
        if (contentHeight > 0 && textChartRef.current) {
          textChartRef.current.style.setProperty('--text-content-height', `${contentHeight}px`);
        }
      };
      
      // WHAT: Measure after initial render and on resize
      // WHY: Heights may change on resize or content changes
      // A-03.1: Also measure after content changes (useMutationObserver or delay)
      measureAndSetHeight();
      
      // WHAT: Use requestAnimationFrame to ensure DOM is fully rendered before measuring
      // WHY: Content might not be fully rendered on initial mount
      // HOW: Delay measurement slightly to allow content to render
      const timeoutId = setTimeout(measureAndSetHeight, 0);
      
      const resizeObserver = new ResizeObserver(() => {
        // WHAT: Debounce resize measurements to avoid excessive calculations
        // WHY: Resize events can fire rapidly
        // HOW: Use requestAnimationFrame to batch measurements
        requestAnimationFrame(measureAndSetHeight);
      });
      
      if (textChartRef.current) {
        resizeObserver.observe(textChartRef.current);
      }
      
      // WHAT: Observe content changes to remeasure when content updates
      // WHY: Content height changes when markdown content changes
      // HOW: Use MutationObserver to detect content changes
      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(measureAndSetHeight);
      });
      
      if (textContentWrapperRef.current) {
        mutationObserver.observe(textContentWrapperRef.current, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [showTitle, result.title, result.kpiValue, result.chartId]);
  
  // WHAT: Runtime validation for CSS variables (P1 1.4 Phase 5)
  // WHY: Ensure all height values are explicit and traceable
  // HOW: Check computed styles after CSS variables are applied
  useEffect(() => {
    if (textChartRef.current && typeof window !== 'undefined') {
      const validateHeight = () => {
        try {
          // WHAT: Find parent row element that sets --block-height
          // WHY: --block-height is set on the row, not the chart element
          // HOW: Traverse up the DOM tree to find the row element
          let rowElement: HTMLElement | null = textChartRef.current?.parentElement || null;
          while (rowElement && !rowElement.classList.contains('report-content')) {
            rowElement = rowElement.parentElement;
          }
          
          // WHAT: Validate critical CSS variables with runtime enforcement (A-05)
          // WHY: Fail-fast in production for critical violations
          // HOW: Use validateCriticalCSSVariable which throws in production, warns in dev
          // NOTE: Wrapped in try-catch to prevent validation errors from crashing component rendering
          try {
            validateCriticalCSSVariable(
              textChartRef.current,
              CRITICAL_CSS_VARIABLES.TEXT_CONTENT_HEIGHT,
              { chartId: result.chartId, chartType: 'text', containerHeight: textChartRef.current?.offsetHeight || 0 }
            );
          } catch (error) {
            // WHAT: Log validation error but don't crash component
            // WHY: Validation failures should be logged but not break user experience
            console.error('[TextChart] CSS variable validation error:', error);
          }
          
          // WHAT: Check --block-height on row element (where it's set) instead of chart element
          // WHY: CSS variable is set on row, chart inherits it but getComputedStyle may not return inherited value
          // HOW: Validate on row element if found, otherwise fall back to chart element
          const blockHeightElement = rowElement || textChartRef.current;
          try {
            validateCriticalCSSVariable(
              blockHeightElement,
              CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
              { chartId: result.chartId, chartType: 'text', checkedOnRow: !!rowElement }
            );
          } catch (error) {
            // WHAT: Log validation error but don't crash component
            // WHY: Validation failures should be logged but not break user experience
            console.error('[TextChart] CSS variable validation error:', error);
          }
        } catch (error) {
          // WHAT: Catch any unexpected errors during validation
          // WHY: Prevent validation logic from crashing component rendering
          console.error('[TextChart] Unexpected error during height validation:', error);
        }
      };
      
      // WHAT: Validate after initial render and on resize
      // WHY: Heights may change on resize or content changes
      validateHeight();
      
      const resizeObserver = new ResizeObserver(validateHeight);
      if (textChartRef.current) {
        resizeObserver.observe(textChartRef.current);
      }
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [result.chartId, showTitle, result.title]);
  
  return (
    <div 
      ref={textChartRef}
      className={`${styles.chart} ${styles.text} report-chart ${className || ''}`}
      data-chart-id={result.chartId}
      // WHAT: blockHeight removed - now centrally managed via --block-height CSS custom property on row
    >
      {showTitle && (
        <div className={styles.textTitleWrapper}>
          <h3 className={styles.textTitleText}>{result.title}</h3>
        </div>
      )}
      {/* WHAT: Text content wrapper ref for height calculation (P1 1.4 Phase 4) */}
      <div ref={textContentWrapperRef} className={styles.textContentWrapper}>
        {html ? (
          <div
            className={`${styles.textContent} ${styles.textMarkdown}`}
            // eslint-disable-next-line react/forbid-dom-props
            // SECURITY: parseMarkdown already sanitizes, but adding explicit sanitization for defense in depth
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }}
          />
        ) : (
          <div className={styles.textContent} />
        )}
      </div>
    </div>
  );
}

/**
 * Table Chart - Markdown table display with styling
 * UPDATED: Uses CellWrapper for Report Layout Spec v2.0
 * P1 1.4 Phase 4: Explicit table content height calculation
 */
function TableChart({ result, className }: { result: ChartResult; className?: string }) {
  // WHAT: Render markdown table content on report pages
  // WHY: User requirement: table charts render markdown tables with styling
  // HOW: Use parseTableMarkdown to convert markdown table to HTML
  const raw = typeof result.kpiValue === 'string' ? result.kpiValue : '';
  const html = raw ? parseTableMarkdown(raw) : '';
  
  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // WHAT: Ref for table content to calculate height (P1 1.4 Phase 2 + Phase 4)
  // WHY: Need to calculate body zone height and table content height explicitly
  // HOW: Measure container and header heights, calculate body height, set CSS custom properties
  const tableContentRef = useRef<HTMLDivElement>(null);
  
  // WHAT: Calculate and set body zone height explicitly (P1 1.4 Phase 2)
  // WHY: Replace flex: 1 with explicit height for deterministic behavior
  // HOW: Measure container and header heights, calculate body height, set CSS custom property
  useEffect(() => {
    if (tableContentRef.current && typeof window !== 'undefined') {
      // WHAT: Find parent CellWrapper container (chart container)
      // WHY: CSS variable must be set on chart container per solution document
      const chartContainer = tableContentRef.current.closest('[class*="cellWrapper"]') as HTMLElement;
      if (!chartContainer) return;
      
      const measureAndSetHeight = () => {
        // WHAT: Get container height from offsetHeight (actual rendered height)
        // WHY: Container height is set via --block-height from row
        const containerHeight = chartContainer.offsetHeight;
        
        // WHAT: Find title and subtitle zones within CellWrapper
        // WHY: Subtract header heights from container to get body height
        const titleZone = chartContainer.querySelector('[class*="titleZone"]') as HTMLElement;
        const subtitleZone = chartContainer.querySelector('[class*="subtitleZone"]') as HTMLElement;
        
        let titleHeight = 0;
        let subtitleHeight = 0;
        
        if (titleZone) {
          titleHeight = titleZone.offsetHeight;
        }
        if (subtitleZone) {
          subtitleHeight = subtitleZone.offsetHeight;
        }
        
        // WHAT: Calculate body zone height: container - title - subtitle
        // WHY: Explicit height calculation instead of flex growth
        const bodyHeight = containerHeight - titleHeight - subtitleHeight;
        
        // WHAT: Set CSS custom property for body zone height on chart container
        // WHY: P1 1.4 Phase 2 - explicit height cascade
        if (bodyHeight > 0) {
          chartContainer.style.setProperty('--chart-body-height', `${bodyHeight}px`);
        }
      };
      
      // WHAT: Measure after initial render and on resize
      // WHY: Heights may change on resize or content changes
      measureAndSetHeight();
      
      const resizeObserver = new ResizeObserver(measureAndSetHeight);
      resizeObserver.observe(chartContainer);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [showTitle, result.title]);
  
  // WHAT: Calculate and set table content height explicitly (P1 1.4 Phase 4)
  // WHY: Replace implicit height behavior with explicit height for deterministic behavior
  // HOW: Use --chart-body-height from chart container (set in Phase 2 above)
  useEffect(() => {
    if (tableContentRef.current && typeof window !== 'undefined') {
      const measureAndSetHeight = () => {
        // WHAT: Find parent CellWrapper container (chart container)
        // WHY: CSS variable --chart-body-height is set on chart container from Phase 2
        const chartContainer = tableContentRef.current?.closest('[class*="cellWrapper"]') as HTMLElement;
        if (!chartContainer) return;
        
        // WHAT: Get body zone height from CSS custom property (set in Phase 2)
        // WHY: Table content is inside body zone, so use body zone height directly
        const computedStyle = getComputedStyle(chartContainer);
        const bodyHeightValue = computedStyle.getPropertyValue('--chart-body-height').trim();
        
        // WHAT: If --chart-body-height is set, use it for table content height
        // WHY: Table content fills the body zone, so height should match body zone height
        if (bodyHeightValue && tableContentRef.current) {
          tableContentRef.current.style.setProperty('--text-content-height', bodyHeightValue);
        } else if (tableContentRef.current) {
          // WHAT: Fallback: calculate from actual container height if CSS variable not set yet
          // WHY: CSS variable might not be set on initial render
          // HOW: Use actual container height minus title/subtitle
          const containerHeight = chartContainer.offsetHeight;
          const titleZone = chartContainer.querySelector('[class*="titleZone"]') as HTMLElement;
          const subtitleZone = chartContainer.querySelector('[class*="subtitleZone"]') as HTMLElement;
          
          let titleHeight = 0;
          let subtitleHeight = 0;
          
          if (titleZone) {
            titleHeight = titleZone.offsetHeight;
          }
          if (subtitleZone) {
            subtitleHeight = subtitleZone.offsetHeight;
          }
          
          const bodyHeight = containerHeight - titleHeight - subtitleHeight;
          if (bodyHeight > 0) {
            tableContentRef.current.style.setProperty('--text-content-height', `${bodyHeight}px`);
          }
        }
      };
      
      // WHAT: Measure after initial render and on resize
      // WHY: Heights may change on resize or content changes
      measureAndSetHeight();
      
      // WHAT: Use requestAnimationFrame to ensure DOM is fully rendered before measuring
      // WHY: Heights might not be fully calculated on initial mount
      // HOW: Delay measurement slightly to allow heights to be set
      const timeoutId = setTimeout(measureAndSetHeight, 0);
      
      const resizeObserver = new ResizeObserver(() => {
        // WHAT: Debounce resize measurements to avoid excessive calculations
        // WHY: Resize events can fire rapidly
        // HOW: Use requestAnimationFrame to batch measurements
        requestAnimationFrame(measureAndSetHeight);
      });
      
      if (tableContentRef.current) {
        resizeObserver.observe(tableContentRef.current);
      }
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
      };
    }
  }, [showTitle, result.title]);
  
  // WHAT: Runtime validation for CSS variables (P1 1.4 Phase 5)
  // WHY: Ensure all height values are explicit and traceable
  // HOW: Check computed styles after CSS variables are applied
  useEffect(() => {
    if (tableContentRef.current && typeof window !== 'undefined') {
      const chartContainer = tableContentRef.current.closest('[class*="cellWrapper"]') as HTMLElement;
      if (!chartContainer) return;
      
      const validateHeight = () => {
        try {
          // WHAT: Find parent row element that sets --block-height
          // WHY: --block-height is set on the row, not the chart element
          // HOW: Traverse up the DOM tree to find the row element
          let rowElement: HTMLElement | null = chartContainer.parentElement;
          while (rowElement && !rowElement.classList.contains('report-content')) {
            // Check if this element has --block-height or --row-height set
            const computedStyle = getComputedStyle(rowElement);
            const blockHeight = computedStyle.getPropertyValue('--block-height').trim();
            const rowHeight = computedStyle.getPropertyValue('--row-height').trim();
            if (blockHeight || rowHeight) {
              break; // Found the row element
            }
            rowElement = rowElement.parentElement;
          }
          
          // WHAT: Validate critical CSS variables with runtime enforcement (A-05)
          // WHY: Fail-fast in production for critical violations
          // HOW: Use validateCriticalCSSVariable which throws in production, warns in dev
          // NOTE: Wrapped in try-catch to prevent validation errors from crashing component rendering
          // NOTE: Delay validation slightly to ensure height calculation has completed
          try {
            validateCriticalCSSVariable(
              tableContentRef.current,
              CRITICAL_CSS_VARIABLES.TEXT_CONTENT_HEIGHT,
              { chartId: result.chartId, chartType: 'table' }
            );
          } catch (error) {
            console.error('[TableChart] CSS variable validation error:', error);
          }
          
          try {
            validateCriticalCSSVariable(
              chartContainer,
              CRITICAL_CSS_VARIABLES.CHART_BODY_HEIGHT,
              { chartId: result.chartId, chartType: 'table' }
            );
          } catch (error) {
            console.error('[TableChart] CSS variable validation error:', error);
          }
          
          // WHAT: Check --block-height on row element (where it's set) instead of chart element
          // WHY: CSS variable is set on row, chart inherits it but getComputedStyle may not return inherited value
          // HOW: Validate on row element if found, otherwise fall back to chart container
          const blockHeightElement = rowElement || chartContainer;
          try {
            validateCriticalCSSVariable(
              blockHeightElement,
              CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
              { chartId: result.chartId, chartType: 'table', checkedOnRow: !!rowElement }
            );
          } catch (error) {
            console.error('[TableChart] CSS variable validation error:', error);
          }
        } catch (error) {
          console.error('[TableChart] Unexpected error during height validation:', error);
        }
      };
      
      // WHAT: Validate after initial render and on resize
      // WHY: Heights may change on resize or content changes
      // NOTE: Delay validation to ensure height calculation has completed first
      const timeoutId = setTimeout(validateHeight, 100); // Delay 100ms to allow height calculation to complete
      
      const resizeObserver = new ResizeObserver(() => {
        // WHAT: Debounce resize validation to avoid excessive checks
        // WHY: Resize events can fire rapidly
        // HOW: Use requestAnimationFrame to batch validation
        requestAnimationFrame(validateHeight);
      });
      
      if (tableContentRef.current) {
        resizeObserver.observe(tableContentRef.current);
      }
      if (chartContainer) {
        resizeObserver.observe(chartContainer);
      }
      
      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
      };
    }
  }, [result.chartId, showTitle, result.title]);
  
  return (
    <CellWrapper
      title={showTitle ? result.title : undefined}
      // WHAT: P1 1.5 Phase 3 - Removed titleFontSize and subtitleFontSize props
      // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
      className={`${styles.chart} ${styles.table} report-chart ${className || ''}`}
    >
      {/* WHAT: Table content ref for height calculation (P1 1.4 Phase 4) */}
      {html ? (
        <div
          ref={tableContentRef}
          className={`${styles.tableContent} ${styles.tableMarkdown}`}
          // eslint-disable-next-line react/forbid-dom-props
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }}
        />
      ) : (
        <div ref={tableContentRef} className={styles.tableContent} />
      )}
    </CellWrapper>
  );
}

/**
 * Image Chart - Uses actual image aspect ratio
 * UPDATED: Detects real image dimensions and uses them for aspect ratio
 */
function ImageChart({ result, className }: { result: ChartResult; className?: string }) {
  const formattedValue = formatValue(result.kpiValue, result.formatting);
  const [actualAspectRatio, setActualAspectRatio] = React.useState<string | null>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  
  // WHAT: Detect actual image aspect ratio when image loads
  // WHY: Use real image dimensions instead of configured aspect ratio
  // HOW: Calculate from naturalWidth/naturalHeight and apply dynamically
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setActualAspectRatio(`${img.naturalWidth}:${img.naturalHeight}`);
      console.log('[ImageChart] Actual aspect ratio detected:', {
        title: result.title,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        ratio: ratio.toFixed(4),
        aspectRatio: `${img.naturalWidth}:${img.naturalHeight}`
      });
    }
  };
  
  // DEBUG: Log image rendering
  console.log('[ImageChart] Rendering:', {
    title: result.title,
    kpiValue: result.kpiValue,
    formattedValue,
    configuredAspectRatio: result.aspectRatio || '16:9',
    actualAspectRatio,
    hasValue: !!formattedValue
  });
  
  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // WHAT: Use actual aspect ratio if available, otherwise fallback to configured
  // WHY: Prefer real image dimensions, but have fallback for initial render
  const aspectRatio = actualAspectRatio || result.aspectRatio || '16:9';
  
  // WHAT: Calculate aspect ratio value for CSS
  // WHY: CSS aspect-ratio property needs numeric ratio (width/height)
  const aspectRatioValue = React.useMemo(() => {
    if (actualAspectRatio) {
      const [w, h] = actualAspectRatio.split(':').map(Number);
      if (w && h) return w / h;
    }
    // Fallback to configured aspect ratio
    const configured = result.aspectRatio || '16:9';
    const map: Record<string, number> = {
      '16:9': 16 / 9,
      '9:16': 9 / 16,
      '1:1': 1
    };
    return map[configured] || 16 / 9;
  }, [actualAspectRatio, result.aspectRatio]);

  return (
    <CellWrapper
      title={showTitle ? result.title : undefined}
      // WHAT: P1 1.5 Phase 3 - Removed titleFontSize and subtitleFontSize props
      // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
      className={`${styles.chart} ${styles.image} report-chart ${className || ''}`}
    >
      {/* WHAT: Image container with dynamic aspect ratio from actual image dimensions */}
      {/* WHY: Use real image dimensions instead of configured aspect ratio */}
      <div 
        className={styles.imageContainer}
        // eslint-disable-next-line react/forbid-dom-props
        style={{
          '--image-aspect-ratio': aspectRatioValue.toString()
        } as React.CSSProperties}
      >
        {/* WHAT: Use actual <img> tag and detect real dimensions */}
        {/* WHY: Browser provides naturalWidth/naturalHeight for actual aspect ratio */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          ref={imgRef}
        className={styles.imageContent}
        src={formattedValue}
        alt={result.title}
          onLoad={handleImageLoad}
        onError={(e) => console.error('[ImageChart] Image failed to load:', result.title, e)}
      />
      </div>
    </CellWrapper>
  );
}
