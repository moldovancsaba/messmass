// WHAT: Report Content Grid Renderer (v12.0.0)
// WHY: Renders report blocks with charts in responsive grid layout
// HOW: Uses ReportChart components with CSS Grid for layout

'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { ReportBlock, GridSettings } from '@/hooks/useReportLayout';
import type { ChartResult } from '@/lib/report-calculator';
import ReportChart from './ReportChart';
import styles from './ReportContent.module.css';
import { solveBlockHeightWithImages } from '@/lib/blockHeightCalculator';
import type { CellConfiguration } from '@/lib/blockLayoutTypes';

/**
 * WHAT: Check if a chart result has valid displayable data (v11.48.0)
 * WHY: Filter out empty charts before grid calculations
 * HOW: Type-specific validation matching ReportChart.hasData logic
 */
function hasValidChartData(result: ChartResult | undefined): boolean {
  if (!result || result.error) return false;
  
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
}

/**
 * Props for ReportContent component
 */
interface ReportContentProps {
  /** Report blocks with chart references */
  blocks: ReportBlock[];
  
  /** Calculated chart results from ReportCalculator */
  chartResults: Map<string, ChartResult>;
  
  /** Grid settings for responsive layout */
  gridSettings: GridSettings;
  
  /** Optional CSS class for container */
  className?: string;
}

/**
 * ReportContent
 * 
 * WHAT: Renders report content as blocks containing charts
 * WHY: Clean separation of layout logic from chart rendering
 * 
 * Architecture:
 * - Each block contains multiple charts
 * - Charts are laid out in CSS Grid based on their width
 * - Grid adjusts responsively based on gridSettings
 * - Block titles are optional
 */
export default function ReportContent({ 
  blocks, 
  chartResults, 
  gridSettings,
  className 
}: ReportContentProps) {
  
  if (blocks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>📊</span>
        <h3 className={styles.emptyTitle}>No Report Content</h3>
        <p className={styles.emptyText}>
          This report template has no blocks configured.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.content} report-content ${className || ''}`} data-report-section="content">
      {blocks.map((block) => (
        <ReportBlock 
          key={block.id}
          block={block}
          chartResults={chartResults}
          gridSettings={gridSettings}
        />
      ))}
    </div>
  );
}

/**
 * Single Report Block with charts (row-based layout)
 */
interface ReportBlockProps {
  block: ReportBlock;
  chartResults: Map<string, ChartResult>;
  gridSettings: GridSettings;
}

/**
 * WHAT: Group charts into rows - unlimited width per row
 * WHY: Allow any number of charts per row without breaking
 * HOW: Put all charts in a single row (no width-based splitting)
 */
function groupChartsIntoRows(
  charts: Array<{ chartId: string; width: number; order: number }>,
  maxColumns: number // WHAT: Unused parameter kept for backward compatibility
): Array<Array<{ chartId: string; width: number; order: number }>> {
  // WHAT: Return all charts as a single row
  // WHY: User wants unlimited items per row
  // HOW: No splitting logic - just wrap all charts in array
  return charts.length > 0 ? [charts] : [];
}

/**
 * WHAT: Calculate grid-template-columns from chart widths
 * WHY: Rows must fill 100% width proportionally
 * HOW: Convert widths to fr units (e.g., [1,2,1] → "1fr 2fr 1fr")
 */
function calculateGridColumns(charts: Array<{ width: number }>): string {
  if (charts.length === 0) return '1fr';
  
  // Use chart widths as weights for fr units
  const weights = charts.map(c => c.width || 1);
  return weights.map(w => `${w}fr`).join(' ');
}

/**
 * WHAT: Responsive row with width measurement and height calculation
 * WHY: Each row must calculate its own height based on actual width
 */
interface ResponsiveRowProps {
  rowCharts: Array<{ chartId: string; width: number; order: number }>;
  chartResults: Map<string, ChartResult>;
  rowIndex: number;
}

function ResponsiveRow({ rowCharts, chartResults, rowIndex }: ResponsiveRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [rowWidth, setRowWidth] = useState(1200); // Default fallback
  const [rowHeight, setRowHeight] = useState(400); // Default fallback
  
  // WHAT: Measure actual row width and recalculate height on resize
  // WHY: Height calculation needs actual width for all cell types
  useEffect(() => {
    const measureAndCalculate = () => {
      if (rowRef.current) {
        const width = rowRef.current.offsetWidth;
        console.log(`[ResponsiveRow ${rowIndex}] Width changed:`, width, 'Charts:', rowCharts.length);
        setRowWidth(width || 1200);
        
        // WHAT: Immediately recalculate height based on new width
        // WHY: Only include cells with valid data (v11.48.0)
        const cells: CellConfiguration[] = rowCharts
          .flatMap(chart => {
            const result = chartResults.get(chart.chartId);
            // WHAT: Skip cells with no valid data in height calculation
            // WHY: Empty cells should not affect row height
            if (!hasValidChartData(result) || !result) return [];
            
            return [{
              chartId: chart.chartId,
              cellWidth: (chart.width || 1) as 1 | 2,
              bodyType: result.type as any,
              aspectRatio: result.aspectRatio,
              title: result.title,
              subtitle: undefined
            }];
          });
        
        const height = solveBlockHeightWithImages(cells, width);
        console.log(`[ResponsiveRow ${rowIndex}] Height recalculated:`, height, 'from width:', width);
        setRowHeight(height);
      }
    };
    
    measureAndCalculate(); // Initial measurement
    
    // WHAT: Use ResizeObserver for row dimension changes
    const resizeObserver = new ResizeObserver(measureAndCalculate);
    if (rowRef.current) {
      resizeObserver.observe(rowRef.current);
    }
    
    // WHAT: Also listen to window resize as fallback
    // WHY: Single full-width cells may not trigger ResizeObserver
    window.addEventListener('resize', measureAndCalculate);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureAndCalculate);
    };
  }, [rowCharts, chartResults, rowIndex]); // Re-run if charts change
  
  const gridColumns = calculateGridColumns(rowCharts);
  
  return (
    // WHAT: Dynamic grid layout with calculated columns and row height
    // WHY: Grid columns from chart widths, height from blockHeightCalculator
    // HOW: Responsive calculation based on actual container width measurement
    // eslint-disable-next-line react/forbid-dom-props
    <div 
      ref={rowRef}
      key={`row-${rowIndex}`}
      className={`${styles.row} report-content`}
      data-report-section="content"
      style={{
        gridTemplateColumns: gridColumns,
        height: `${rowHeight}px` // WHAT: Apply calculated height based on measured width
      } as React.CSSProperties}
    >
      {rowCharts.map(chart => {
        const result = chartResults.get(chart.chartId);
        // WHAT: Skip charts with no valid data (v11.48.0)
        // WHY: ReportChart returns null for empty data, don't render container
        if (!hasValidChartData(result) || !result) return null;
        
        // WHAT: Force remount when dimensions change significantly
        // WHY: Container queries cache container size, need remount for single full-width charts
        const dimensionKey = `${chart.chartId}-${Math.round(rowWidth / 100)}-${Math.round(rowHeight / 100)}`;
        
        return (
          <div 
            key={dimensionKey}
            className={styles.rowItem}
          >
            <ReportChart result={result} width={chart.width} />
          </div>
        );
      })}
    </div>
  );
}

function ReportBlock({ block, chartResults, gridSettings }: ReportBlockProps) {
  // Sort charts by order
  const sortedCharts = [...block.charts].sort((a, b) => a.order - b.order);
  
  // WHAT: Filter out charts with no data (v11.48.0)
  // WHY: Hide empty cells and exclude from grid calculations
  // HOW: Check both existence and valid data using hasValidChartData
  const validCharts = sortedCharts.filter(chart => {
    const result = chartResults.get(chart.chartId);
    return hasValidChartData(result);
  });
  
  // DEBUG: Log filtering
  if (sortedCharts.length !== validCharts.length) {
    console.log(`⚠️ [ReportBlock] Block "${block.title || 'Untitled'}":`, {
      totalCharts: sortedCharts.length,
      validCharts: validCharts.length,
      missingCharts: sortedCharts
        .filter(c => !chartResults.has(c.chartId))
        .map(c => c.chartId)
    });
  }

  if (validCharts.length === 0) {
    return null; // Skip empty blocks
  }

  // Group charts into rows based on desktop column count
  const rows = groupChartsIntoRows(validCharts, gridSettings.desktop);
  
  // DEBUG: Log rendering for specific blocks
  if (block.title && (block.title.includes('OVERVIEW') || block.title.includes('Overview'))) {
    console.log(`🔍 [ReportBlock] Rendering "${block.title}":`, {
      validCharts: validCharts.length,
      chartIds: validCharts.map(c => c.chartId),
      rows: rows.length,
      rowSizes: rows.map(r => r.length),
      gridColumns: rows.map(r => calculateGridColumns(r))
    });
  }

  return (
    <div className={styles.block} data-pdf-block="true">
      {block.showTitle && block.title && (
        <h2 className={styles.blockTitle}>{block.title}</h2>
      )}
      
      {/* Render each row with responsive height calculation */}
      {rows.map((rowCharts, rowIndex) => (
        <ResponsiveRow
          key={`row-${rowIndex}`}
          rowCharts={rowCharts}
          chartResults={chartResults}
          rowIndex={rowIndex}
        />
      ))}
    </div>
  );
}
