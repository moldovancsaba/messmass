// WHAT: Report Content Grid Renderer (v12.0.0)
// WHY: Renders report blocks with charts in responsive grid layout
// HOW: Uses ReportChart components with CSS Grid for layout

'use client';

import React, { useMemo } from 'react';
import ReportChart from './ReportChart';
import type { ChartResult } from '@/lib/report-calculator';
import type { ReportBlock, GridSettings } from '@/hooks/useReportLayout';
import { solveBlockHeightWithImages } from '@/lib/blockHeightCalculator';
import type { CellConfiguration } from '@/lib/blockLayoutTypes';
import styles from './ReportContent.module.css';

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

function ReportBlock({ block, chartResults, gridSettings }: ReportBlockProps) {
  // Sort charts by order
  const sortedCharts = [...block.charts].sort((a, b) => a.order - b.order);
  
  // Filter out charts that don't have results
  const validCharts = sortedCharts.filter(chart => 
    chartResults.has(chart.chartId)
  );
  
  // WHAT: Calculate deterministic block height from image aspect ratios
  // WHY: Spec requirement - all cells in block must share same height
  // HOW: Use solveBlockHeightWithImages utility
  const blockHeight = useMemo(() => {
    const blockWidthPx = 1200; // Standard desktop width
    
    // Convert chart results to cell configurations
    const cells: CellConfiguration[] = validCharts
      .flatMap(chart => {
        const result = chartResults.get(chart.chartId);
        if (!result) return [];
        
        return [{
          chartId: chart.chartId,
          cellWidth: (chart.width || 1) as 1 | 2,
          bodyType: result.type as any,
          aspectRatio: result.aspectRatio,
          title: result.title,
          subtitle: undefined
        }];
      });
    
    return solveBlockHeightWithImages(cells, blockWidthPx);
  }, [validCharts, chartResults]);
  
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
      
      {/* Render each row as independent grid */}
      {rows.map((rowCharts, rowIndex) => {
        const gridColumns = calculateGridColumns(rowCharts);
        
        return (
          <div 
            key={`row-${rowIndex}`}
            className={`${styles.row} report-content`}
            data-report-section="content"
            style={{
              gridTemplateColumns: gridColumns,
              height: `${blockHeight}px` // WHAT: Apply calculated deterministic height
            } as React.CSSProperties}
          >
            {rowCharts.map(chart => {
              const result = chartResults.get(chart.chartId);
              if (!result) return null;
              
              return (
                <div 
                  key={chart.chartId}
                  className={styles.rowItem}
                >
                  <ReportChart result={result} width={chart.width} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
