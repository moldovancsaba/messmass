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
import styles from './ReportChart.module.css';
import { parseMarkdown } from '@/lib/markdownUtils';

// Register Chart.js components for pie charts
ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Helper function to format values with prefix/suffix and decimals
 */
function formatValue(
  value: number | string | undefined, 
  formatting?: { prefix?: string; suffix?: string; decimals?: number }
): string {
  if (value === undefined || value === 'NA') return 'NA';
  if (typeof value === 'string') return value;
  
  const { prefix = '', suffix = '', decimals = 0 } = formatting || {};
  const formattedNumber = value.toFixed(decimals);
  return `${prefix}${formattedNumber}${suffix}`;
}


/**
 * Props for ReportChart component
 */
interface ReportChartProps {
  /** Chart result from ReportCalculator */
  result: ChartResult;
  
  /** Optional width override (grid units) */
  width?: number;
  
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
export default function ReportChart({ result, width, className }: ReportChartProps) {
  // WHAT: Check if chart has valid displayable data
  // WHY: Don't render placeholders for empty/NA values
  // HOW: Type-specific validation matching ReportCalculator.hasValidData()
  const hasData = !result.error && (() => {
    switch (result.type) {
      case 'text':
        return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
      
      case 'image':
        return typeof result.kpiValue === 'string' && result.kpiValue.length > 0 && result.kpiValue !== 'NA';
      
      case 'kpi':
        return result.kpiValue !== undefined && result.kpiValue !== 'NA';
      
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

  // No data available - show placeholder
  if (!hasData) {
    return (
      <div className={`${styles.chart} ${styles.noData} report-chart ${className || ''}`} data-report-section="content">
        <div className={styles.noDataContent}>
          <span className={styles.noDataIcon}>📊</span>
          <span className={styles.noDataText}>{result.title}</span>
          <span className={styles.noDataLabel}>No Data</span>
        </div>
      </div>
    );
  }

  // Render based on chart type
  switch (result.type) {
    case 'kpi':
      return <KPIChart result={result} className={className} />;
    
    case 'pie':
      return <PieChart result={result} className={className} />;
    
    case 'bar':
      return <BarChart result={result} className={className} />;
    
    case 'text':
      return <TextChart result={result} className={className} />;
    
    case 'image':
      return <ImageChart result={result} className={className} />;
    
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
}


/**
 * KPI Chart - 3-row grid layout with CSS-only auto-sizing
 * Icon (30%) → Value (40%) → Label (30%, CSS clamp + text wrap)
 */
function KPIChart({ result, className }: { result: ChartResult; className?: string }) {
  const formattedValue = formatValue(result.kpiValue, result.formatting);
  const protectedTitle = preventPhraseBreaks(result.title);
  
  // WHAT: Use Material Icon with variant from chart config
  // WHY: Match admin UI and support all 2000+ Material Icons
  // HOW: Pass icon name and variant (default: outlined) to MaterialIcon component
  const iconVariant = result.iconVariant || 'outlined';
  
  return (
    <div className={`${styles.chart} ${styles.kpi} report-chart ${className || ''}`} data-report-section="content">
      <div className={styles.chartBody}>
        <div className={styles.kpiContent}>
          <div className={styles.kpiIconRow}>
            {result.icon && (
              <MaterialIcon 
                name={result.icon} 
                variant={iconVariant}
                className={styles.kpiIcon}
              />
            )}
          </div>
          <div className={styles.kpiValue}>{formattedValue}</div>
          <div className={styles.kpiTitle}>{protectedTitle}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pie Chart - Circular visualization using Chart.js
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
  // HOW: getComputedStyle reads --pie-color-N variables injected by useReportStyle
  const getPieColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const primary = cs.getPropertyValue('--primary').trim() || '#3b82f6';
    const secondary = cs.getPropertyValue('--secondary').trim() || '#10b981';
    const c1 = cs.getPropertyValue('--pieColor1').trim() || primary;
    const c2 = cs.getPropertyValue('--pieColor2').trim() || secondary;
    return [c1, c2, c1, c2, c1];
  };
  
  const pieColors = getPieColors();
  
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
      // WHAT: Use first pie color as border for all slices
      // WHY: Creates visual separation with consistent branding
      borderColor: pieColors[0],
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
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
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
    <div ref={containerRef} className={`${styles.chart} ${styles.pie} report-chart ${className || ''}`} data-report-section="content">
      {showTitle && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>{result.title}</div>
        </div>
      )}
      <div className={styles.chartBody}>
        {/* Pie chart takes 70% of body */}
        <div className={styles.pieChartContainer}>
          <Doughnut ref={chartRef} data={chartData} options={options} />
        </div>
        {/* Custom legend takes 30% of body */}
        <div className={styles.pieLegend}>
          {result.elements.map((element, idx) => {
            const numValue = typeof element.value === 'number' ? element.value : 0;
            const percentage = total > 0 ? ((numValue / total) * 100).toFixed(1) : '0.0';
            const color = pieColors[idx % pieColors.length];
            const protectedLabel = preventPhraseBreaks(element.label);
            
            return (
              <div key={idx} className={styles.pieLegendItem}>
                {/* WHAT: Dynamic pie legend dot color from theme
                    WHY: Color comes from CSS variables/theme (legitimate dynamic)
                    eslint-disable-next-line react/forbid-dom-props */}
                <div className={styles.pieLegendDot} style={{ backgroundColor: color }} />
                <div className={styles.pieLegendText}>
                  {/* WHAT: Conditionally show percentage based on showPercentages flag (v11.38.0)
                      WHY: Respect chart configuration - some charts want clean labels without % */}
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
 */
function BarChart({ result, className }: { result: ChartResult; className?: string }) {
  if (!result.elements || result.elements.length === 0) {
    return <div className={styles.chart}>No bar data</div>;
  }

  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // WHAT: Read individual bar colors from CSS variables
  // WHY: Use custom style colors for each bar (granular control)
  // HOW: getComputedStyle reads --bar-color-N variables injected by useReportStyle
  const getBarColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const primary = cs.getPropertyValue('--primary').trim() || '#3b82f6';
    const secondary = cs.getPropertyValue('--secondary').trim() || '#10b981';
    const success = cs.getPropertyValue('--success').trim() || '#10b981';
    const warning = cs.getPropertyValue('--warning').trim() || '#f59e0b';
    const error = cs.getPropertyValue('--error').trim() || '#ef4444';
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
    <div className={`${styles.chart} ${styles.bar} report-chart ${className || ''}`} data-report-section="content">
      {showTitle && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>{result.title}</div>
        </div>
      )}
      <div className={styles.chartBody}>
        <div className={styles.barElements}>
        {result.elements.map((element, idx) => {
          const numValue = typeof element.value === 'number' ? element.value : 0;
          const widthPercent = maxValue > 0 ? (numValue / maxValue) * 100 : 0;
          const protectedLabel = preventPhraseBreaks(element.label);
          
          return (
            <div key={idx} className={styles.barRow}>
              <div className={styles.barLabel}>{protectedLabel}</div>
              <div className={styles.barTrack}>
                {/* WHAT: Dynamic bar fill width and color from calculated data + theme
                    WHY: Width is computed percentage, color from CSS variables
                    eslint-disable-next-line react/forbid-dom-props */}
                <div 
                  className={styles.barFill}
                  style={{ 
                    width: `${widthPercent}%`,
                    // WHAT: Use individual bar color from CSS variables
                    // WHY: Allow custom color for each bar element
                    backgroundColor: barColors[idx % barColors.length]
                  }}
                />
              </div>
              <div className={styles.barValue}>{formatValue(element.value, result.formatting)}</div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

/**
 * Text Chart - Formatted text display
 */
function TextChart({ result, className }: { result: ChartResult; className?: string }) {
  // WHAT: Render markdown content on report pages only
  // WHY: User requirement: text boxes render markdown only on report pages
  // HOW: Use parseMarkdown to convert supported markdown to HTML (title, bold, italic, lists, links)
  const raw = typeof result.kpiValue === 'string' ? result.kpiValue : '';
  const html = raw ? parseMarkdown(raw) : '';
  
  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  return (
    <div className={`${styles.chart} ${styles.text} report-chart ${className || ''}`} data-report-section="content">
      {showTitle && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>{result.title}</div>
        </div>
      )}
      <div className={styles.chartBody}>
        {html ? (
          <div
            className={`${styles.textContent} ${styles.textMarkdown}`}
            // eslint-disable-next-line react/forbid-dom-props
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className={styles.textContent} />
        )}
      </div>
    </div>
  );
}

/**
 * Image Chart - Aspect ratio-aware image display
 */
function ImageChart({ result, className }: { result: ChartResult; className?: string }) {
  const formattedValue = formatValue(result.kpiValue, result.formatting);
  const aspectRatio = result.aspectRatio || '16:9';
  
  // DEBUG: Log image rendering
  console.log('[ImageChart] Rendering:', {
    title: result.title,
    kpiValue: result.kpiValue,
    formattedValue,
    aspectRatio,
    hasValue: !!formattedValue
  });
  
  // WHAT: Check if title should be shown (default: true for backward compatibility)
  const showTitle = result.showTitle !== false;
  
  // Map aspect ratio to CSS class
  const aspectClass = {
    '16:9': styles.aspect169,
    '9:16': styles.aspect916,
    '1:1': styles.aspect11
  }[aspectRatio] || styles.aspect169;

  return (
    <div className={`${styles.chart} ${styles.image} ${aspectClass} report-chart ${className || ''}`} data-report-section="content">
      {showTitle && (
        <div className={styles.chartHeader}>
          <div className={styles.chartTitle}>{result.title}</div>
        </div>
      )}
      {/* WHAT: Use actual <img> tag for reliable aspect ratio */}
      {/* WHY: Browser automatically maintains aspect ratio, no CSS tricks needed */}
      <img 
        className={styles.imageContent}
        src={formattedValue}
        alt={result.title}
        onLoad={() => console.log('[ImageChart] Image loaded:', result.title)}
        onError={(e) => console.error('[ImageChart] Image failed to load:', result.title, e)}
      />
    </div>
  );
}
