// WHAT: Report Content Grid Renderer (v12.0.0)
// WHY: Renders report blocks with charts in responsive grid layout
// HOW: Uses ReportChart components with CSS Grid for layout

'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { ReportBlock, GridSettings } from '@/hooks/useReportLayout';
import type { ChartResult } from '@/lib/report-calculator';
import ReportChart from './ReportChart';
import styles from './ReportContent.module.css';
import { resolveBlockHeightWithDetails } from '@/lib/blockHeightCalculator';
import { calculateSyncedFontSizes } from '@/lib/fontSyncCalculator';
import type { CellConfiguration } from '@/lib/layoutGrammar';
import { useUnifiedTextFontSize } from '@/hooks/useUnifiedTextFontSize';
import { calculateBlockFontSizeForBarCharts } from '@/lib/barChartFontSizeCalculator';
import { validateCriticalCSSVariable, validateHeightResolution, CRITICAL_CSS_VARIABLES } from '@/lib/layoutGrammarRuntimeEnforcement';

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
  
  // WHAT: Debug logging for chartResults
  // WHY: Need to verify chartResults Map has data when component renders
  console.log('[ReportContent] Rendering with:', {
    blocksCount: blocks.length,
    chartResultsSize: chartResults.size,
    chartResultIds: Array.from(chartResults.keys()).slice(0, 10),
    sampleResult: chartResults.size > 0 ? {
      chartId: Array.from(chartResults.keys())[0],
      type: chartResults.get(Array.from(chartResults.keys())[0])?.type,
      kpiValue: chartResults.get(Array.from(chartResults.keys())[0])?.kpiValue,
      hasElements: !!chartResults.get(Array.from(chartResults.keys())[0])?.elements
    } : null
  });
  
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
 * WHAT: Group charts into rows - blocks NEVER break into multiple lines
 * WHY: Layout Grammar rule - a block is a single horizontal container
 * HOW: Put ALL charts in a single row, grid is based on sum of units
 * 
 * Layout Grammar Rules:
 * - Charts have width: 1 or 2 units
 * - Block grid = sum of all chart units (e.g., [1,2,1] → "1fr 2fr 1fr")
 * - Block NEVER breaks into multiple rows
 */
function groupChartsIntoRows(
  charts: Array<{ chartId: string; width: number; order: number }>,
  maxColumns: number // WHAT: Unused parameter kept for backward compatibility
): Array<Array<{ chartId: string; width: number; order: number }>> {
  // WHAT: Return all charts as a single row
  // WHY: Blocks never break - all charts in one horizontal row
  // HOW: Grid columns are calculated from sum of units
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
  unifiedTextFontSize?: number | null;
  // WHAT: P1 1.5 Phase 3 - Removed blockTitleFontSize and blockSubtitleFontSize props
  // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
}

function ResponsiveRow({ rowCharts, chartResults, rowIndex, unifiedTextFontSize }: ResponsiveRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  // WHAT: Initialize state with design tokens instead of hardcoded values
  // WHY: No hardcoded sizes - all values must come from design system
  // HOW: Read from CSS custom properties on mount
  const getDefaultValue = (cssVar: string, fallback: number): number => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const cs = getComputedStyle(root);
      const value = cs.getPropertyValue(cssVar).trim();
      if (value) {
        return parseInt(value, 10);
      }
    }
    return fallback; // WHAT: Server-side fallback (only used during SSR)
  };
  
  const [rowWidth, setRowWidth] = useState(() => getDefaultValue('--mm-row-width-default', 1200));
  const [rowHeight, setRowHeight] = useState(() => getDefaultValue('--mm-row-height-default', 400));
  // WHAT: P1 1.5 Phase 3 - Removed titleFontSize and subtitleFontSize state
  // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
  
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
        // WHAT: Include contentMetadata for BAR charts to ensure accurate height calculation
        const cells: CellConfiguration[] = rowCharts
          .flatMap(chart => {
            const result = chartResults.get(chart.chartId);
            // WHAT: Skip cells with no valid data in height calculation
            // WHY: Empty cells should not affect row height
            if (!hasValidChartData(result) || !result) return [];
            
            // WHAT: Build contentMetadata for BAR charts (row count) and PIE charts (legend item count)
            // WHY: Layout Grammar requires accurate height calculation based on actual content requirements
            const contentMetadata: Record<string, unknown> = {};
            if (result.type === 'bar' && result.elements) {
              contentMetadata.barCount = result.elements.length;
            }
            if (result.type === 'pie' && result.elements) {
              // WHAT: P1 1.7 - Include legend item count for PIE chart height calculation
              // WHY: Legend growth (30% → 50%) may compress pie chart below minimum readable size
              // HOW: Pass legend item count to height calculator to account for legend growth
              contentMetadata.legendItemCount = result.elements.length;
            }
            
            return [{
              chartId: chart.chartId,
              cellWidth: (chart.width || 1) as 1 | 2,
              bodyType: result.type as any,
              aspectRatio: result.aspectRatio,
              title: result.title,
              subtitle: undefined,
              contentMetadata: Object.keys(contentMetadata).length > 0 ? contentMetadata : undefined
            }];
          });
        
        // WHAT: Use resolveBlockHeightWithDetails to account for BAR chart row requirements
        // WHY: Layout Grammar requires accurate height calculation that accounts for actual content
        // HOW: Pass cells with contentMetadata to enhanced height resolver
        const heightResolution = resolveBlockHeightWithDetails({
          blockId: `row-${rowIndex}`,
          cells,
          blockWidth: width,
          blockAspectRatio: undefined,
          maxAllowedHeight: undefined
        });
        const height = heightResolution.heightPx;
        console.log(`[ResponsiveRow ${rowIndex}] Height recalculated:`, height, 'from width:', width);
        
        // WHAT: Validate height resolution with runtime enforcement (A-05)
        // WHY: Fail-fast in production if height resolution fails
        // HOW: Use validateHeightResolution which throws in production, warns in dev
        validateHeightResolution(heightResolution, {
          rowIndex,
          blockWidth: width,
          cellsCount: cells.length
        });
        
        setRowHeight(height);
        
        // WHAT: P1 1.5 Phase 3 - Removed font size state update logic
        // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
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
  
  // WHAT: Runtime validation for CSS variables (P1 1.4 Phase 1 + A-05: Runtime Enforcement)
  // WHY: Warn if height CSS variables are not set, enforce in production
  // HOW: Check computed styles after CSS variables are applied, enforce in production
  useEffect(() => {
    if (rowRef.current && typeof window !== 'undefined') {
      // WHAT: Validate critical CSS variables with runtime enforcement
      // WHY: A-05 requires fail-fast behavior in production for critical violations
      // HOW: Use validateCriticalCSSVariable which throws in production, warns in dev
      validateCriticalCSSVariable(
        rowRef.current,
        CRITICAL_CSS_VARIABLES.ROW_HEIGHT,
        { rowIndex, calculatedHeight: rowHeight, type: 'row' }
      );
      validateCriticalCSSVariable(
        rowRef.current,
        CRITICAL_CSS_VARIABLES.BLOCK_HEIGHT,
        { rowIndex, calculatedHeight: rowHeight, type: 'row' }
      );
    }
  }, [rowHeight, rowIndex]);
  
  // WHAT: Calculate grid columns from chart widths (sum of units)
  // WHY: Layout Grammar - grid = sum of units (e.g., [1,2,1] → "1fr 2fr 1fr")
  const gridColumns = calculateGridColumns(rowCharts);
  
  return (
    <div 
      ref={rowRef}
      key={`row-${rowIndex}`}
      className={`${styles.row} report-content`}
      data-report-section="content"
      // WHAT: Set CSS custom properties for dynamic values (centrally managed)
      // WHY: CSS variables are meant to be set dynamically, eliminates direct property inline styles
      // HOW: CSS modules reference these custom properties - block-height is centrally managed at row level
      // P1 1.4 Phase 1: Explicit height cascade - CSS variables must be set, no implicit fallbacks
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        '--row-height': `${rowHeight}px`,
        '--block-height': `${rowHeight}px`, // WHAT: Centrally managed block height for all charts in row
        '--grid-columns': gridColumns
      } as React.CSSProperties}
    >
      {rowCharts.map(chart => {
        const result = chartResults.get(chart.chartId);
        // WHAT: Skip charts with no valid data (v11.48.0)
        // WHY: ReportChart returns null for empty data, don't render container
        if (!hasValidChartData(result) || !result) {
          console.log(`[ResponsiveRow ${rowIndex}] Filtering out chart ${chart.chartId}:`, {
            hasResult: !!result,
            isValid: result ? hasValidChartData(result) : false,
            type: result?.type,
            kpiValue: result?.kpiValue,
            elementsCount: result?.elements?.length
          });
          return null;
        }
        
        // WHAT: Force remount when dimensions change significantly
        // WHY: Container queries cache container size, need remount for single full-width charts
        const dimensionKey = `${chart.chartId}-${Math.round(rowWidth / 100)}-${Math.round(rowHeight / 100)}`;
        
        return (
          <div 
            key={dimensionKey}
            className={styles.rowItem}
          >
            <ReportChart 
              result={result} 
              width={chart.width}
              // WHAT: blockHeight prop removed - now centrally managed via --block-height CSS custom property on row
              // WHY: Eliminates per-chart inline styles, better maintainability
              // WHAT: P1 1.5 Phase 3 - Removed titleFontSize and subtitleFontSize props
              // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
              unifiedTextFontSize={unifiedTextFontSize}
            />
          </div>
        );
      })}
    </div>
  );
}

function ReportBlock({ block, chartResults, gridSettings }: ReportBlockProps) {
  // WHAT: Calculate unified font-size for all text charts in this block
  // WHY: All text charts should use the same font-size, fitting the largest content
  // HOW: Use hook to measure containers and calculate optimal size
  // IMPORTANT: Hooks must be called before any early returns (React Rules of Hooks)
  const blockRef = useRef<HTMLDivElement>(null);
  
  // Sort charts by order
  const sortedCharts = [...block.charts].sort((a, b) => a.order - b.order);
  
  // WHAT: Filter out charts with no data (v11.48.0)
  // WHY: Hide empty cells and exclude from grid calculations
  // HOW: Check both existence and valid data using hasValidChartData
  const validCharts = sortedCharts.filter(chart => {
    const result = chartResults.get(chart.chartId);
    const isValid = hasValidChartData(result);
    if (!isValid && result) {
      // WHAT: Detailed logging for invalid chart data
      // WHY: Need to see full chart result to diagnose why charts are filtered
      const details: any = {
        chartId: chart.chartId,
        type: result.type,
        hasError: !!result.error,
        error: result.error,
        kpiValue: result.kpiValue,
        elementsCount: result.elements?.length || 0,
        elementsTotal: result.elements?.reduce((sum, el) => sum + (typeof el.value === 'number' ? el.value : 0), 0) || 0
      };
      
      // Add element details for pie/bar charts
      if (result.elements && result.elements.length > 0) {
        details.elements = result.elements.map((el: any) => ({
          label: el.label,
          value: el.value,
          valueType: typeof el.value,
          isNA: el.value === 'NA' || el.value === undefined
        }));
      }
      
      console.warn(`[ReportBlock] Invalid chart data for ${chart.chartId}:`, details);
    } else if (!result) {
      console.warn(`[ReportBlock] Missing chart result for ${chart.chartId} in block "${block.title || 'Untitled'}"`);
    }
    return isValid;
  });
  
  // Calculate chartIds for hook (before early return)
  const chartIds = validCharts.map(c => c.chartId);
  const unifiedTextFontSize = useUnifiedTextFontSize(chartResults, chartIds, blockRef);
  
  // WHAT: Block-level typography calculation (P1 1.5 Phase 1)
  // WHY: All typography elements in a block should use unified font size
  // HOW: Collect all cells from all rows, calculate once per block, set CSS custom property
  const [blockBaseFontSize, setBlockBaseFontSize] = useState<number | null>(null);
  const [blockSubtitleFontSize, setBlockSubtitleFontSize] = useState<number | null>(null);
  
  // WHAT: Calculate block-level typography when block width is known
  // WHY: Font size calculation needs block width (not row width)
  // HOW: Use ResizeObserver to measure block width, then calculate unified font sizes
  useEffect(() => {
    if (!blockRef.current || typeof window === 'undefined') return;
    
    const measureAndCalculate = () => {
      if (!blockRef.current) return;
      
      const blockWidth = blockRef.current.offsetWidth;
      if (blockWidth === 0) return; // Not yet rendered
      
      // WHAT: Collect all cells from all rows in the block
      // WHY: Need all titles and subtitles to calculate unified font size
      // HOW: Iterate through validCharts and create CellConfiguration for each
      const allCells: CellConfiguration[] = validCharts
        .map(chart => {
          const result = chartResults.get(chart.chartId);
          if (!result || !hasValidChartData(result)) return null;
          
          return {
            chartId: chart.chartId,
            cellWidth: (chart.width || 1) as 1 | 2,
            bodyType: result.type as any,
            aspectRatio: result.aspectRatio,
            title: result.title,
            subtitle: undefined // WHAT: ChartResult doesn't have subtitle property, use undefined
          } as CellConfiguration;
        })
        .filter((cell): cell is CellConfiguration => cell !== null);
      
      if (allCells.length === 0) return;
      
      // WHAT: Calculate unified font sizes for entire block
      // WHY: P1 1.5 Phase 1 - block-level typography unification
      // HOW: Use fontSyncCalculator with block width (not row width)
      const syncedFonts = calculateSyncedFontSizes(allCells, blockWidth, {
        maxTitleLines: 2,
        maxSubtitleLines: 2,
        enableKPISync: false // KPI values are exempt
      });
      
      // WHAT: Calculate font size for BAR charts considering 2-line label wrapping
      // WHY: Layout Grammar requires content to fit - font size must account for label wrapping
      // HOW: Calculate max font size where 2-line labels fit in available row height
      const barCharts = validCharts
        .map(chart => {
          const result = chartResults.get(chart.chartId);
          if (!result || result.type !== 'bar' || !result.elements) return null;
          return {
            chartId: chart.chartId,
            labels: result.elements.map(el => el.label)
          };
        })
        .filter((chart): chart is { chartId: string; labels: string[] } => chart !== null);
      
      // WHAT: Get block height from first row (all rows in block share same height)
      // WHY: Need block height to calculate available row height for BAR charts
      // HOW: Find first row element and get its calculated height from CSS variable or actual height
      // NOTE: Row height is calculated in ResponsiveRow, so we need to wait for it to be set
      let blockHeight = 400; // Default fallback
      const firstRow = blockRef.current?.querySelector('[class*="row"]') as HTMLElement;
      if (firstRow) {
        const computedStyle = getComputedStyle(firstRow);
        const rowHeightValue = computedStyle.getPropertyValue('--row-height').trim();
        if (rowHeightValue) {
          blockHeight = parseInt(rowHeightValue, 10);
        } else if (firstRow.offsetHeight > 0) {
          // WHAT: Use actual rendered height if CSS variable not set yet
          // WHY: Row might be rendered but CSS variable not yet applied
          blockHeight = firstRow.offsetHeight;
        }
      }
      
      // WHAT: If no row found or height is 0, skip BAR chart font calculation
      // WHY: Need valid block height to calculate font size
      // HOW: Only calculate if we have a valid height
      if (blockHeight <= 0 || !firstRow) {
        console.warn(`[ReportBlock] Cannot calculate BAR chart font size: blockHeight=${blockHeight}, firstRow=${!!firstRow}`);
      }
      
      // WHAT: Calculate BAR chart font size if BAR charts exist
      // WHY: BAR chart labels can wrap to 2 lines - need to ensure they fit
      // HOW: Use calculateBlockFontSizeForBarCharts with block dimensions
      let barChartFontSize: number | null = null;
      if (barCharts.length > 0) {
        barChartFontSize = calculateBlockFontSizeForBarCharts(
          barCharts,
          blockHeight,
          blockWidth
        );
      }
      
      // WHAT: Use minimum of title font size and BAR chart font size
      // WHY: Block-level typography must work for all elements (titles and BAR labels)
      // HOW: Take minimum to ensure all content fits
      const finalFontSize = barChartFontSize !== null
        ? Math.min(syncedFonts.titlePx, barChartFontSize)
        : syncedFonts.titlePx;
      
      console.log(`[ReportBlock] Block-level typography calculated:`, {
        blockTitle: block.title || 'Untitled',
        blockWidth,
        blockHeight,
        titlePx: syncedFonts.titlePx,
        barChartFontSize,
        finalFontSize,
        subtitlePx: syncedFonts.subtitlePx,
        cellsCount: allCells.length,
        barChartsCount: barCharts.length
      });
      
      setBlockBaseFontSize(finalFontSize);
      setBlockSubtitleFontSize(syncedFonts.subtitlePx);
    };
    
    measureAndCalculate(); // Initial calculation
    
    const resizeObserver = new ResizeObserver(measureAndCalculate);
    if (blockRef.current) {
      resizeObserver.observe(blockRef.current);
    }
    
    // WHAT: Also listen to window resize as fallback
    // WHY: Block width may change on window resize
    window.addEventListener('resize', measureAndCalculate);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureAndCalculate);
    };
  }, [validCharts, chartResults, block.title]);
  
  // DEBUG: Log filtering
  if (sortedCharts.length !== validCharts.length) {
    console.log(`⚠️ [ReportBlock] Block "${block.title || 'Untitled'}":`, {
      totalCharts: sortedCharts.length,
      validCharts: validCharts.length,
      missingCharts: sortedCharts
        .filter(c => !chartResults.has(c.chartId))
        .map(c => c.chartId),
      invalidCharts: sortedCharts
        .filter(c => {
          const result = chartResults.get(c.chartId);
          return result && !hasValidChartData(result);
        })
        .map(c => {
          const result = chartResults.get(c.chartId);
          return {
            chartId: c.chartId,
            type: result?.type,
            error: result?.error,
            hasData: result ? hasValidChartData(result) : false
          };
        })
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
    <div 
      ref={blockRef}
      className={styles.block} 
      data-pdf-block="true"
      // WHAT: Apply unified typography as CSS custom properties (P1 1.5 Phase 1)
      // WHY: Block-level typography unification - all elements inherit from block
      // HOW: CSS custom properties are acceptable inline styles (standard pattern)
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        ...(unifiedTextFontSize ? { '--unified-text-font-size': `${unifiedTextFontSize}rem` } : {}),
        ...(blockBaseFontSize ? { '--block-base-font-size': `${blockBaseFontSize}px` } : {}),
        ...(blockSubtitleFontSize ? { '--block-subtitle-font-size': `${blockSubtitleFontSize}px` } : {})
      } as React.CSSProperties}
    >
      {block.showTitle && block.title && (
        <h2 className={styles.blockTitle}>{block.title}</h2>
      )}
      
      {/* Render each row with responsive height calculation */}
      {/* WHAT: P1 1.5 Phase 3 - Removed blockTitleFontSize and blockSubtitleFontSize props */}
      {/* WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2) */}
      {rows.map((rowCharts, rowIndex) => (
        <ResponsiveRow
          key={`row-${rowIndex}`}
          rowCharts={rowCharts}
          chartResults={chartResults}
          rowIndex={rowIndex}
          unifiedTextFontSize={unifiedTextFontSize}
        />
      ))}
    </div>
  );
}
