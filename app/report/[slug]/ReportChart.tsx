// WHAT: Single Chart Renderer (v12.0.0)
// WHY: Atomic component for rendering individual chart types in reports
// HOW: Receives ChartResult from ReportCalculator and renders based on type

'use client';

import { formatChartValue, decimalsFor } from '@/lib/formatChartValue';
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
import { replaceEmDashes } from '@/lib/contentFormat';
import MaterialIcon from '@/components/MaterialIcon';
import CellWrapper from '@/components/CellWrapper';
import ImageLightboxModal from '@/components/report/ImageLightboxModal';
import { ChartErrorBoundary } from '@/components/ChartErrorBoundary';
import styles from './ReportChart.module.css';
import { parseMarkdown } from '@/lib/markdownUtils';
import { parseTableMarkdown } from '@/lib/tableMarkdownUtils';
import { sanitizeHTML } from '@/lib/sanitize';
import { safeValidate, validateCriticalCSSVariable, CRITICAL_CSS_VARIABLES } from '@/lib/layoutGrammarRuntimeEnforcement';
import { getUserFriendlyErrorMessage } from '@/lib/chartErrorTypes';
import { validateChartData, formatValidationIssue } from '@/lib/export/chartValidation';
import type { Chart } from '@/lib/report-calculator';
import { CHART_COLOR, CHART_THEME_COLORS } from '@/lib/theme/chartPalette';

// Register Chart.js components for pie charts
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Helper function to format values with prefix/suffix and decimals
 * WHAT: Formats numeric values with proper decimal places based on rounded flag
 * WHY: Support both rounded (whole numbers) and decimal (2 places) formatting
 * HOW: Uses rounded flag from formatting object, converts to decimals
 */
// WHAT: Display formatting is delegated to the shared implementation.
// WHY: This file previously had its own `toFixed` version while the admin builder
//     used `toLocaleString`, so the same value rendered differently to the author
//     and to the partner. One implementation, one result.
const formatValue = formatChartValue;
const getDecimalsFromFormatting = decimalsFor;

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

  /** When true (e.g. static landing), KPI value row gets 40% height so description copy doesn't truncate */
  allowNA?: boolean;
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
export default function ReportChart({ result, chart, width, blockHeight, unifiedTextFontSize, className, allowNA = false }: ReportChartProps) {
  // WHAT: A-R-11 - Check for calculation errors first
  // WHY: Display error messages to users instead of hiding charts
  // HOW: Show error placeholder if chartError or error exists
  const hasError = !!result.chartError;
  
  if (hasError) {
    return (
      <CellWrapper className={className}>
        <div className={`${styles.chart} ${styles.chartError}`}>
          <MaterialIcon name="error_outline" className={styles.chartErrorIcon} />
          <div className={styles.chartErrorTitle}>{result.title || 'Chart Error'}</div>
          <div className={styles.chartErrorMessage}>
            {result.chartError
              ? getUserFriendlyErrorMessage(result.chartError)
              : 'Chart calculation failed'}
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
        return (
          typeof result.kpiValue === 'string' &&
          result.kpiValue.length > 0 &&
          result.kpiValue !== 'NA' &&
          !result.kpiValue.includes('/placeholders/image-missing.svg')
        );
      
      case 'table':
        return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
      
      case 'kpi':
        return result.kpiValue !== undefined && result.kpiValue !== null && result.kpiValue !== 'NA';
      
      case 'pie':
      case 'bar':
      case 'value':
        return (
          Array.isArray(result.elements) &&
          result.elements.length > 0 &&
          (allowNA || result.elements.some((el) => typeof el.value === 'number' && el.value > 0))
        );
      
      case 'valuechain':
        // Always show valuechain when it has icon + 2 elements (title + description); content can be empty
        return !!(result.elements && result.elements.length >= 2);
      
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
        return <KPIChart result={result} className={className} allowNA={allowNA} />;
    
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
            <KPIChart result={result} className={className} allowNA={allowNA} />
            <BarChart result={result} />
        </div>
      );
    
    case 'valuechain':
      return <ValueChainChart result={result} className={className} />;
    
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
function KPIChart({ result, className, allowNA = false }: { result: ChartResult; className?: string; allowNA?: boolean }) {
  const formattedValue = replaceEmDashes(formatValue(result.kpiValue, result.formatting));
  const protectedTitle = preventPhraseBreaks(replaceEmDashes(result.title || ''));
  const iconVariant = result.iconVariant || 'outlined';
  const showTitle = result.showTitle !== false;
  const hasIcon = !!result.icon;
  const kpiChartRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={kpiChartRef}
      className={`${styles.chart} ${styles.kpi} ${!hasIcon ? (showTitle ? styles.kpiNoIcon : styles.kpiOnlyValue) : (!showTitle ? styles.kpiNoTitle : '')} report-chart ${className || ''}`}
      data-allow-na={allowNA ? 'true' : undefined}
    >
      <div className={styles.kpiHeaderRow}>
        {showTitle && (
          <div className={styles.kpiTitle}>
            <span>{protectedTitle}</span>
          </div>
        )}
        {hasIcon && (
          <div className={styles.kpiIconBadge}>
            <MaterialIcon 
              name={result.icon as string} 
              variant={iconVariant}
              className={styles.kpiIcon}
            />
          </div>
        )}
      </div>
      <div className={styles.kpiValueRow}>{formattedValue}</div>
    </div>
  );
}

/**
 * ValueChain Chart - Executive Summary Card with subtle icon badge, title & description
 */
function ValueChainChart({ result, className }: { result: ChartResult; className?: string }) {
  const textA = replaceEmDashes((result.elements?.[0]?.value != null ? String(result.elements[0].value) : '').trim());
  const textB = replaceEmDashes((result.elements?.[1]?.value != null ? String(result.elements[1].value) : '').trim());
  const iconVariant = result.iconVariant || 'outlined';
  const hasIcon = !!result.icon;

  const containerRef = useRef<HTMLDivElement>(null);
  const gridClass = !hasIcon ? (textB ? styles.valuechainNoIcon : styles.valuechainOnlyTitle) : (!textB ? styles.valuechainNoDesc : '');
  return (
    <div
      ref={containerRef}
      className={`${styles.chart} ${styles.valuechain} ${gridClass} report-chart ${className || ''}`}
    >
      <div className={styles.valuechainHeaderRow}>
        <div className={styles.valuechainTitleRow}>{textA || '\u00A0'}</div>
        {hasIcon && (
          <div className={styles.kpiIconBadge}>
            <MaterialIcon
              name={result.icon as string}
              variant={iconVariant}
              className={styles.valuechainIcon}
            />
          </div>
        )}
      </div>
      {textB ? (
        <div className={styles.valuechainDescRow}>
          <span>{preventPhraseBreaks(textB)}</span>
        </div>
      ) : null}
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
  const pieLegendRef = useRef<HTMLDivElement>(null);
  const pieTitleRowRef = useRef<HTMLDivElement>(null);
  const pieGridRef = useRef<HTMLDivElement>(null);
  const pieChartContainerRef = useRef<HTMLDivElement>(null);
  
  const hasElements = Array.isArray(result.elements) && result.elements.length > 0;

  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // WHAT: Check if percentages should be shown (default: true for backward compatibility)
  // WHY: v11.38.0 - Allow hiding percentages in pie chart legends
  const showPercentages = result.showPercentages !== false;
  
  // ponytail: removed the measure→mutate→measure body-height effect. The pie container now
  // derives its height from its own width (aspect-ratio, see .pieChartContainer in
  // ReportChart.module.css), so it no longer needs a JS-measured --chart-body-height. This
  // also kills the ResizeObserver+MutationObserver loop that watched the same subtree it
  // mutated — the main aggravator of the mobile tiny-donut flicker.



  if (!hasElements) {
    return <div className={styles.chart}>No pie data</div>;
  }
  
  const elements = result.elements ?? [];
  const total = elements.reduce((sum, el) => sum + (typeof el.value === 'number' ? el.value : 0), 0);
  
  // WHAT: Read pie slice colors with accessible multi-slice palette support
  // WHY: Granular style control for 2 to 6 slices, preventing color collision
  const getPieColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    
    // Check if custom slice colors --pieColor1 through --pieColor6 are provided
    const customColors: string[] = [];
    for (let i = 1; i <= 6; i++) {
      const c = cs.getPropertyValue(`--pieColor${i}`).trim();
      if (c) customColors.push(c);
    }
    if (customColors.length >= 2) {
      return customColors;
    }

    const primary = cs.getPropertyValue('--pieColor1').trim() || 
                    cs.getPropertyValue('--primary').trim() || 
                    cs.getPropertyValue('--mm-color-primary-500').trim() || 
                    CHART_COLOR.blue;
    const secondary = cs.getPropertyValue('--pieColor2').trim() || 
                      cs.getPropertyValue('--secondary').trim() || 
                      cs.getPropertyValue('--mm-color-secondary-500').trim() || 
                      CHART_COLOR.pink;

    // 8-color accessible categorical palette
    return [
      primary,
      secondary,
      CHART_COLOR.green,
      CHART_COLOR.amber,
      CHART_COLOR.purple,
      CHART_COLOR.cyan,
      CHART_COLOR.red,
      CHART_COLOR.grayMuted,
    ];
  };
  
  const pieColors = getPieColors();
  
  // WHAT: Read pie border color from card surface so slices have clean white/surface separation
  const getPieBorderColor = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    return (
      cs.getPropertyValue('--chartBackground').trim() ||
      cs.getPropertyValue('--pieBorderColor').trim() ||
      CHART_THEME_COLORS.zeroSeriesBorder
    );
  };
  const pieBorderColor = getPieBorderColor();
  
  // Prepare Chart.js data
  const isZeroTotal = total === 0;
  const chartData = {
    labels: elements.map(el => el.label),
    datasets: [{
      label: result.title,
      data: isZeroTotal ? elements.map(() => 1) : elements.map(el => typeof el.value === 'number' ? el.value : 0),
      backgroundColor: isZeroTotal
        ? elements.map((_, i) => (
            i % 2 === 0
              ? CHART_THEME_COLORS.zeroSeriesBackgroundA
              : CHART_THEME_COLORS.zeroSeriesBackgroundB
          ))
        : elements.map((_, idx) => pieColors[idx % pieColors.length]),
      borderColor: isZeroTotal ? CHART_THEME_COLORS.zeroSeriesBorder : pieBorderColor,
      borderWidth: 2,
      hoverOffset: 6
    }]
  };
  
  // WHAT: Read tooltip colors from CSS variables
  // WHY: Respect custom style tooltip colors
  const getTooltipColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    return {
      bg: cs.getPropertyValue('--chartTooltipBackground').trim() || CHART_THEME_COLORS.tooltipBackground,
      text: cs.getPropertyValue('--chartTooltipText').trim() || CHART_THEME_COLORS.tooltipText
    };
  };
  const tooltipColors = getTooltipColors();

  // Chart.js options
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    animation: false,
    events: [],
    layout: {
      padding: 6
    },
    plugins: {
      legend: {
        display: false
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
            const decimals = getDecimalsFromFormatting(result.formatting);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(decimals) : '0';
            return showPercentages 
              ? `${label}: ${value.toLocaleString()} (${percentage}%)`
              : `${label}: ${value.toLocaleString()}`;
          }
        }
      }
    }
  };

  // Dominant slice for center callout
  const dominantElement = elements.reduce(
    (best, el) => ((typeof el.value === 'number' ? el.value : 0) > (typeof best?.value === 'number' ? best.value : 0) ? el : best),
    elements[0]
  );
  const dominantVal = typeof dominantElement?.value === 'number' ? dominantElement.value : 0;
  const dominantPct = total > 0 ? Math.round((dominantVal / total) * 100) : 0;

  return (
    <CellWrapper
      title={showTitle ? result.title : undefined}
      subtitle={result.subtitle}
      className={`${styles.chart} ${styles.pie} report-chart ${className || ''}`}
    >
      <div
        ref={pieGridRef}
        className={styles.pieBodyLayout}
      >
        <div ref={pieChartContainerRef} className={styles.pieChartContainer}>
          <Doughnut ref={chartRef} data={chartData} options={options} />
          {total > 0 && (
            <div className={styles.pieCenterLabel} aria-hidden="true">
              <span className={styles.pieCenterValue}>{dominantPct}%</span>
              <span className={styles.pieCenterCaption}>{dominantElement?.label}</span>
            </div>
          )}
        </div>
        <div ref={pieLegendRef} className={styles.pieLegend}>
          {elements.map((element, idx) => {
            const numValue = typeof element.value === 'number' ? element.value : 0;
            const decimals = getDecimalsFromFormatting(element.formatting || result.formatting);
            const percentage = total > 0 ? ((numValue / total) * 100).toFixed(decimals) : '0';
            const protectedLabel = preventPhraseBreaks(element.label);
            const pieColorVar = pieColors[idx % pieColors.length];
            return (
              <div 
                key={idx} 
                className={styles.pieLegendItem}
                // eslint-disable-next-line react/forbid-dom-props
                style={{
                  '--dot-color': pieColorVar,
                  '--dot-border-color': pieBorderColor
                } as React.CSSProperties}
              >
                <div className={styles.pieLegendLeft}>
                  <div className={styles.pieLegendDot} />
                  <span className={styles.pieLegendText}>{protectedLabel}</span>
                </div>
                <span className={styles.pieLegendMetric}>
                  {showPercentages ? `${percentage}%` : formatValue(numValue, element.formatting || result.formatting)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </CellWrapper>
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
          // WHAT: Skip validation if container height is 0 (not yet rendered)
          // WHY: Validation should only run after container is properly rendered
          // HOW: Check containerHeight before validating
          const containerHeight = chartContainer.offsetHeight;
          if (containerHeight === 0) {
            // WHAT: Container not yet rendered, skip validation
            // WHY: CSS variables won't be set until container has height
            // HOW: Return early, validation will retry on next resize
            return;
          }
          
          // WHAT: Check if --chart-body-height is set before validating
          // WHY: Height calculation useEffect must complete before validation
          // HOW: Read CSS variable and skip if not set yet
          const computedStyle = window.getComputedStyle(chartContainer);
          const chartBodyHeight = computedStyle.getPropertyValue('--chart-body-height').trim();
          if (!chartBodyHeight || chartBodyHeight === '') {
            // WHAT: CSS variable not set yet, skip validation
            // WHY: Height calculation hasn't completed
            // HOW: Return early, validation will retry on next resize
            return;
          }
          
          // WHAT: Validate critical CSS variables with runtime enforcement (A-05)
          // WHY: Log violations for monitoring without crashing the report
          // HOW: Use safeValidate wrapper to ensure errors are caught and logged
          safeValidate(
            () => validateCriticalCSSVariable(
              chartContainer,
              CRITICAL_CSS_VARIABLES.CHART_BODY_HEIGHT,
              { chartId: result.chartId, chartType: 'bar', containerHeight }
            ),
            `[BarChart ${result.chartId}] CSS variable validation failed for --chart-body-height`
            );
          
          safeValidate(
            () => validateCriticalCSSVariable(
              chartContainer,
              CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
              { chartId: result.chartId, chartType: 'bar' }
            ),
            `[BarChart ${result.chartId}] CSS variable validation failed for --block-height`
            );
        } catch (error) {
          console.error('[BarChart] Unexpected error during height validation:', error);
        }
      };
      
      // WHAT: Validate after initial render and on resize
      // WHY: Heights may change on resize or content changes
      // HOW: Delay validation to ensure height calculation has completed
      // NOTE: Use setTimeout to delay validation after height calculation useEffect
      // Multiple attempts to handle timing variations
      let timeoutIds: NodeJS.Timeout[] = [];
      
      const attemptValidation = (attempt = 0) => {
        if (attempt < 5) { // Try up to 5 times with increasing delays
          const delay = 50 + (attempt * 50); // 50ms, 100ms, 150ms, 200ms, 250ms
          const timeoutId = setTimeout(() => {
            requestAnimationFrame(() => {
              const containerHeight = chartContainer.offsetHeight;
              const computedStyle = window.getComputedStyle(chartContainer);
              const chartBodyHeight = computedStyle.getPropertyValue('--chart-body-height').trim();
              
              if (containerHeight > 0 && chartBodyHeight) {
                // WHAT: Container is ready and CSS variable is set, validate
      validateHeight();
              } else {
                // WHAT: Not ready yet, try again
                attemptValidation(attempt + 1);
              }
            });
          }, delay);
          
          timeoutIds.push(timeoutId);
        } else {
          // WHAT: Final attempt - validate even if not perfect (for error reporting)
          validateHeight();
        }
      };
      
      attemptValidation(0);
      
      const resizeObserver = new ResizeObserver(() => {
        // WHAT: Debounce resize validation to avoid excessive checks
        // WHY: Resize events can fire rapidly
        // HOW: Use requestAnimationFrame to batch validation
        requestAnimationFrame(validateHeight);
      });
      resizeObserver.observe(chartContainer);
      
      return () => {
        timeoutIds.forEach(id => clearTimeout(id));
        resizeObserver.disconnect();
      };
    }
  }, [result.chartId, showTitle, result.title, result.elements]);
  
  // WHAT: Early return if no data (after hooks)
  if (!result.elements || result.elements.length === 0) {
    return <div className={styles.chart}>No bar data</div>;
  }
  
  // WHAT: Use CSS variable references so bar colors always reflect the current report style
  // WHY: Style is injected asynchronously; passing var(--barColor1) etc. lets the browser resolve when style loads
  const maxValue = Math.max(...result.elements.map(el => typeof el.value === 'number' ? el.value : 0));
  const totalValue = result.elements.reduce((sum, el) => sum + (typeof el.value === 'number' ? el.value : 0), 0);
  const barColorVar = (idx: number) => `var(--barColor${(idx % 5) + 1})`;

  return (
    <CellWrapper
      title={showTitle ? result.title : undefined}
      subtitle={result.subtitle}
      className={`${styles.chart} ${styles.bar} report-chart ${className || ''}`}
    >
      {/* WHAT: Chart body ref for height calculation (P1 1.4 Phase 2) */}
      <div ref={chartBodyRef} className={styles.chartBody}>
        <div className={styles.barStackList}>
          {result.elements.map((element, idx) => {
            const numValue = typeof element.value === 'number' ? element.value : 0;
            const widthPercent = maxValue > 0 ? (numValue / maxValue) * 100 : 0;
            const sharePercent = totalValue > 0 ? Math.round((numValue / totalValue) * 100) : 0;
            const protectedLabel = preventPhraseBreaks(element.label);
            const effectiveFormatting = element.formatting || result.formatting;
            const formattedVal = formatValue(element.value, effectiveFormatting);
            const showShare = totalValue > 0 && effectiveFormatting?.suffix !== '%';

            return (
              <div key={idx} className={styles.barStackRow}>
                <div className={styles.barStackMeta}>
                  <span className={styles.barLabel}>{protectedLabel}</span>
                  <span className={styles.barValue}>
                    {formattedVal}
                    {showShare && <span className={styles.barShare}> ({sharePercent}%)</span>}
                  </span>
                </div>
                <div
                  className={styles.barTrack}
                  // eslint-disable-next-line react/forbid-dom-props
                  style={{
                    '--bar-width': `${widthPercent}%`,
                    '--bar-color': barColorVar(idx)
                  } as React.CSSProperties}
                >
                  <div className={styles.barFill} />
                </div>
              </div>
            );
          })}
        </div>
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
  const textTitleWrapperRef = useRef<HTMLDivElement>(null);
  
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
          // WHY: Log violations for monitoring without crashing the report
          // HOW: Use safeValidate wrapper to ensure errors are caught and logged
          safeValidate(
            () => validateCriticalCSSVariable(
              textChartRef.current,
              CRITICAL_CSS_VARIABLES.TEXT_CONTENT_HEIGHT,
              { chartId: result.chartId, chartType: 'text', containerHeight: textChartRef.current?.offsetHeight || 0 }
            ),
            `[TextChart ${result.chartId}] CSS variable validation failed for --text-content-height`
          );
          
          // WHAT: Check --block-height on row element (where it's set) instead of chart element
          // WHY: CSS variable is set on row, chart inherits it but getComputedStyle may not return inherited value
          // HOW: Validate on row element if found, otherwise fall back to chart element
          const blockHeightElement = rowElement || textChartRef.current;
          safeValidate(
            () => validateCriticalCSSVariable(
              blockHeightElement,
              CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
              { chartId: result.chartId, chartType: 'text', checkedOnRow: !!rowElement }
            ),
            `[TextChart ${result.chartId}] CSS variable validation failed for --block-height`
          );
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
        <div ref={textTitleWrapperRef} className={styles.textTitleWrapper}>
          <h3 className={styles.textTitleText}>{result.title}</h3>
        </div>
      )}
      {/* WHAT: Text content wrapper ref for height calculation (P1 1.4 Phase 4) */}
      <div ref={textContentWrapperRef} className={styles.textContentWrapper}>
        {html ? (
          <div
            className={`${styles.textContent} ${styles.textMarkdown} ${result.preset ? styles[`preset${result.preset.charAt(0).toUpperCase()}${result.preset.slice(1)}`] : ''}`}
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

  // WHAT: Insert break opportunities after - # @ _ / | \ so words don't break mid-token but can break at these chars
  // WHY: User requirement: allow wrapping at separators (e.g. "AV19#H", "event_name") without breaking normal words
  // HOW: After table HTML is set, walk td/th text nodes and insert U+200B (zero-width space) after each allowed char
  useEffect(() => {
    if (!tableContentRef.current || !html) return;
    const table = tableContentRef.current.querySelector('table');
    if (!table) return;
    const breakAfterChars = /([-#@_/|\\])/g;
    const zeroWidthSpace = '\u200B';
    const process = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        node.textContent = node.textContent.replace(breakAfterChars, `$1${zeroWidthSpace}`);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.childNodes.forEach(process);
      }
    };
    table.querySelectorAll('th, td').forEach((cell) => cell.childNodes.forEach(process));
  }, [html]);

  // WHAT: Content-driven row height - measure table content and set row height so card fits table
  // WHY: User requirement: see all rows (e.g. 10); card height should fit table, not clip it
  // HOW: Measure table scrollHeight + title/subtitle, find row element, set --block-height and --row-height
  useEffect(() => {
    if (!tableContentRef.current || typeof window === 'undefined' || !html) return;
    const chartContainer = tableContentRef.current.closest('[class*="cellWrapper"]') as HTMLElement;
    if (!chartContainer) return;

    const applyContentDrivenHeight = () => {
      const tableEl = tableContentRef.current?.querySelector('table');
      if (!tableEl) return;
      const titleZone = chartContainer.querySelector('[class*="titleZone"]') as HTMLElement;
      const subtitleZone = chartContainer.querySelector('[class*="subtitleZone"]') as HTMLElement;
      const titleHeight = titleZone?.offsetHeight ?? 0;
      const subtitleHeight = subtitleZone?.offsetHeight ?? 0;
      const tableFullHeight = tableEl.scrollHeight;
      const tableContentPadding = 0;
      const requiredHeight = titleHeight + subtitleHeight + tableFullHeight + tableContentPadding;
      const minHeight = 200;
      const heightPx = Math.max(minHeight, Math.ceil(requiredHeight));

      let rowEl: HTMLElement | null = chartContainer.parentElement;
      while (rowEl) {
        const blockHeight = rowEl.style.getPropertyValue('--block-height');
        if (blockHeight) break;
        rowEl = rowEl.parentElement;
      }
      if (rowEl) {
        rowEl.style.setProperty('--block-height', `${heightPx}px`);
        rowEl.style.setProperty('--row-height', `${heightPx}px`);
      }
    };

    applyContentDrivenHeight();
    const t1 = setTimeout(applyContentDrivenHeight, 0);
    const t2 = setTimeout(applyContentDrivenHeight, 100);
    const ro = new ResizeObserver(() => requestAnimationFrame(applyContentDrivenHeight));
    ro.observe(chartContainer);
    if (tableContentRef.current) ro.observe(tableContentRef.current);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
    };
  }, [html, showTitle, result.title]);

  // WHAT: Set body zone height from container (after row height may have been updated by content-driven effect)
  useEffect(() => {
    if (tableContentRef.current && typeof window !== 'undefined') {
      const chartContainer = tableContentRef.current.closest('[class*="cellWrapper"]') as HTMLElement;
      if (!chartContainer) return;

      const measureAndSetHeight = () => {
        const containerHeight = chartContainer.offsetHeight;
        const titleZone = chartContainer.querySelector('[class*="titleZone"]') as HTMLElement;
        const subtitleZone = chartContainer.querySelector('[class*="subtitleZone"]') as HTMLElement;
        let titleHeight = 0, subtitleHeight = 0;
        if (titleZone) titleHeight = titleZone.offsetHeight;
        if (subtitleZone) subtitleHeight = subtitleZone.offsetHeight;
        const bodyHeight = containerHeight - titleHeight - subtitleHeight;
        if (bodyHeight > 0) {
          chartContainer.style.setProperty('--chart-body-height', `${bodyHeight}px`);
        }
      };

      measureAndSetHeight();
      const resizeObserver = new ResizeObserver(measureAndSetHeight);
      resizeObserver.observe(chartContainer);
      return () => resizeObserver.disconnect();
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
  
  // WHAT: Reduce table font size when any cell has horizontal overflow (e.g. header overlap)
  // WHY: Many columns or long headers can overlap; no overflow accepted
  // HOW: Clear font-size, then stepwise reduce until no th/td has scrollWidth > clientWidth, min 8px
  useEffect(() => {
    if (!tableContentRef.current || !html || typeof window === 'undefined') return;
    const table = tableContentRef.current.querySelector('table');
    if (!table) return;

    const MIN_FONT_PX = 8;
    const STEP = 0.9;

    const runReduceFontIfHorizontalOverflow = () => {
      table.style.removeProperty('font-size');
      requestAnimationFrame(() => {
        const checkOverflow = (): boolean => {
          const cells = table.querySelectorAll('th, td');
          for (let i = 0; i < cells.length; i++) {
            const el = cells[i] as HTMLElement;
            if (el.scrollWidth > el.clientWidth) return true;
          }
          return false;
        };

        const step = () => {
          const current = parseFloat(getComputedStyle(table).fontSize) || 16;
          if (!checkOverflow()) return;
          if (current <= MIN_FONT_PX) return;
          const next = Math.max(MIN_FONT_PX, current * STEP);
          table.style.setProperty('font-size', `${next}px`, 'important');
          requestAnimationFrame(step);
        };

        step();
      });
    };

    runReduceFontIfHorizontalOverflow();
    const t = setTimeout(runReduceFontIfHorizontalOverflow, 150);
    const ro = new ResizeObserver(() => runReduceFontIfHorizontalOverflow);
    ro.observe(table);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [html]);

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
          // WHY: Log violations for monitoring without crashing the report
          // HOW: Use safeValidate wrapper to ensure errors are caught and logged
          safeValidate(
            () => validateCriticalCSSVariable(
              tableContentRef.current,
              CRITICAL_CSS_VARIABLES.TEXT_CONTENT_HEIGHT,
              { chartId: result.chartId, chartType: 'table' }
            ),
            `[TableChart ${result.chartId}] CSS variable validation failed for --text-content-height`
            );
          
          safeValidate(
            () => validateCriticalCSSVariable(
              chartContainer,
              CRITICAL_CSS_VARIABLES.CHART_BODY_HEIGHT,
              { chartId: result.chartId, chartType: 'table' }
            ),
            `[TableChart ${result.chartId}] CSS variable validation failed for --chart-body-height`
          );
          
          // WHAT: Check --block-height on row element (where it's set) instead of chart element
          // WHY: CSS variable is set on row, chart inherits it but getComputedStyle may not return inherited value
          // HOW: Validate on row element if found, otherwise fall back to chart container
          const blockHeightElement = rowElement || chartContainer;
          safeValidate(
            () => validateCriticalCSSVariable(
              blockHeightElement,
              CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
              { chartId: result.chartId, chartType: 'table', checkedOnRow: !!rowElement }
            ),
            `[TableChart ${result.chartId}] CSS variable validation failed for --block-height`
            );
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
 * Image Chart - Standardized Presentation Engine (Phase 2)
 * WHAT: Full-bleed cover for showcase photos, ambient blur backdrop for screenshots/QR codes
 * WHY: Eliminate letterboxing dead space, redundant inner boxes, and layout shift
 * HOW: Immediate deterministic aspect-ratio, fit-mode switching, and interactive Lightbox modal
 */
function ImageChart({ result, className }: { result: ChartResult; className?: string }) {
  const FALLBACK_PLACEHOLDER = 'https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev/reports/placeholders/image-missing.svg';
  const formattedValue = formatValue(result.kpiValue, result.formatting);
  const [hasError, setHasError] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  const showTitle = result.showTitle !== false;
  const imageSrc = hasError || !formattedValue ? FALLBACK_PLACEHOLDER : formattedValue;

  // Detect whether image is portrait screenshot / QR code vs atmospheric photo
  const isPortrait = (result.aspectRatio as string) === '9:16' || (result.aspectRatio as string) === '3:4';
  const isQrOrEvidence =
    result.chartId?.toLowerCase().includes('qr') ||
    result.title?.toLowerCase().includes('qr') ||
    isPortrait;

  if (hasError || !formattedValue || formattedValue === 'NA' || formattedValue.includes('/placeholders/image-missing.svg')) {
    return null;
  }

  const handleOpenLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLightboxOpen(true);
  };

  return (
    <>
      <CellWrapper
        title={showTitle ? result.title : undefined}
        className={`${styles.chart} ${styles.image} report-chart ${className || ''}`}
      >
        <div
          className={styles.imageContainer}
          onClick={handleOpenLightbox}
          title="Click to view full image"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
        >
          {isQrOrEvidence ? (
            <div className={styles.imageContainWithBackdrop}>
              <div
                className={styles.ambientBackdrop}
                // WHAT: Dynamic background image for frosted ambient blur effect
                // WHY: Image URL is dynamic and loaded per report chart
                // eslint-disable-next-line react/forbid-dom-props
                style={{ backgroundImage: `url(${imageSrc})` }}
                aria-hidden="true"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.imageContain}
                src={imageSrc}
                alt={result.title}
                onError={() => {
                  if (!hasError) setHasError(true);
                }}
              />
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className={styles.imageCover}
              src={imageSrc}
              alt={result.title}
              onError={() => {
                if (!hasError) setHasError(true);
              }}
            />
          )}

          <div className={styles.imageZoomBadge}>
            <span>🔍</span>
            <span>Zoom</span>
          </div>
        </div>
      </CellWrapper>

      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={imageSrc}
        altText={result.title}
        title={result.title}
      />
    </>
  );
}
