import React from 'react';
import ColoredCard from './ColoredCard';
import { DynamicChart } from './DynamicChart';
import { ChartCalculationResult, BlockAlignmentSettings } from '@/lib/chartConfigTypes';
import { DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';
import { PageStyleEnhanced } from '@/lib/pageStyleTypesEnhanced';
import styles from './UnifiedDataVisualization.module.css';
import { useEffect, useMemo, useRef } from 'react';

interface UnifiedDataVisualizationProps {
  blocks: DataVisualizationBlock[];
  chartResults: ChartCalculationResult[];
  loading?: boolean;
  gridUnits?: { desktop: number; tablet: number; mobile: number };
  useChartContainer?: boolean; // when false, render charts directly without the extra container/header
  pageStyle?: PageStyleEnhanced; // WHAT: Optional pageStyle to apply colors to charts
  alignmentSettings?: BlockAlignmentSettings; // WHAT: Optional alignment settings from template
}

export default function UnifiedDataVisualization({
  blocks,
  chartResults,
  loading = false,
  gridUnits = { desktop: 4, tablet: 2, mobile: 1 },
  useChartContainer = true,
  pageStyle,
  alignmentSettings
}: UnifiedDataVisualizationProps) {
  
  // WHAT: Default alignment settings if not provided
  // WHY: Maintain backward compatibility with existing reports
  const alignment = alignmentSettings || {
    alignTitles: true,
    alignDescriptions: true,
    alignCharts: true,
    minElementHeight: undefined
  };
  

  
  // Determine visible blocks once and keep a stable order
  // Why: We need a consistent ordering to generate matching dynamic CSS and class names
  const visibleBlocks = blocks
    .filter(block => block.isActive)
    .sort((a, b) => a.order - b.order);
  

  
  // WHAT: Helper functions must be defined BEFORE usage in CSS generation
  // WHY: Prevents ReferenceError when filtering charts for grid CSS
  
  // Get chart result by ID
  const getChartResult = (chartId: string): ChartCalculationResult | null => {
    return chartResults.find(result => result.chartId === chartId) || null;
  };

  // Check if chart has valid data to display
  const hasValidData = (result: ChartCalculationResult): boolean => {
    // WHAT: Check if chart has calculable data (not 'NA')
    // WHY: Different chart types have different validation rules
    // HOW: Text/image hide if empty, KPI valid if not NA, pie/bar need sum > 0
    
    // WHAT: Text charts valid only if kpiValue has content
    // WHY: Hide "No content available" placeholders
    if (result.type === 'text') {
      const textContent = typeof result.kpiValue === 'string' 
        ? result.kpiValue 
        : (result.elements[0]?.value as string || '');
      // WHAT: Check length after converting to string (no .trim() needed)
      // WHY: String(textContent) handles null/undefined safely
      return String(textContent || '').length > 0;
    }
    
    // WHAT: Image charts valid only if kpiValue has a URL
    // WHY: Hide "No image available" placeholders
    if (result.type === 'image') {
      const imageUrl = typeof result.kpiValue === 'string'
        ? result.kpiValue
        : (result.elements[0]?.value as string || '');
      // WHAT: Check length after converting to string (no .trim() needed)
      // WHY: String(imageUrl) handles null/undefined safely
      return String(imageUrl || '').length > 0;
    }
    
    if (result.type === 'kpi') {
      // KPI charts: valid if kpiValue is a number (even 0 is valid)
      return result.kpiValue !== 'NA' && result.kpiValue !== undefined;
    }
    
    // Pie/Bar charts: valid only if they have numeric elements with sum > 0
    const validElements = result.elements.filter(element => 
      typeof element.value === 'number'
    );
    const totalValue = validElements.reduce((sum, element) => sum + (element.value as number), 0);
    return validElements.length > 0 && totalValue > 0;
  };

  // WHAT: Natural aspect ratio system using CSS Grid
  // WHY: Let CSS Grid handle widths with fr units, aspect-ratio handles heights
  // HOW: Equal fr units + same aspect ratio = automatically equal heights
  const dynamicGridCSS = visibleBlocks
    .map((block, idx) => {
      const idSuffix = block._id || `i${idx}`;
      
      // WHAT: Get visible charts with valid data for this block
      const blockCharts = block.charts
        .filter(chart => {
          const result = getChartResult(chart.chartId);
          return result && hasValidData(result);
        })
        .sort((a, b) => a.order - b.order);
      
      // WHAT: Use database chart widths for fr units
      const chartWidths = blockCharts.map(c => Math.max(1, c.width || 1));
      const frColumns = chartWidths.map(w => `${w}fr`).join(' ');
      

      

      

      
      return `
        /* CSS Grid with natural aspect ratios */
        .udv-grid-${idSuffix} { 
          justify-items: stretch !important; 
          align-items: start; 
          grid-auto-flow: row !important; 
          grid-template-columns: ${frColumns || '1fr'} !important;
          grid-auto-rows: auto !important;
        }
        
        /* Force aspect ratio for text and image charts */
        .udv-grid-${idSuffix} .chart-item.chart-item-text,
        .udv-grid-${idSuffix} .chart-item.chart-item-image {
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          flex: none !important;
        }
        
        /* Override any height constraints on text chart elements */
        .udv-grid-${idSuffix} .chart-item.chart-item-text *,
        .udv-grid-${idSuffix} .unified-chart-item.chart-item-text *,
        .udv-grid-${idSuffix} .text-chart-container {
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          flex: none !important;
        }
        
        /* Use block display for text charts */
        .udv-grid-${idSuffix} .chart-item.chart-item-text {
          display: block !important;
          grid-template-rows: none !important;
        }
        
        /* Tablet: Auto-wrap with 300px minimum width per chart */
        @media (max-width: 1023px) {
          .udv-grid-${idSuffix} { 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; 
          }
        }
        /* Mobile: Force single column */
        @media (max-width: 767px) {
          .udv-grid-${idSuffix} { 
            grid-template-columns: 1fr !important; 
          }
        }
        /* Per-block container overrides */
        .udv-grid-${idSuffix} :global(.chart-container) { min-width: 0 !important; max-width: none !important; width: 100% !important; }
        .udv-grid-${idSuffix} :global(.chart-legend) { min-width: 0 !important; width: 100% !important; max-width: 100% !important; overflow: hidden; }
      `;
    })
    .join('\n');

  // NO LONGER NEEDED: Chart widths handled by fr units in grid-template-columns

  if (loading) {
    return (
      <ColoredCard className={styles.loadingCard}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading charts...</p>
        </div>
      </ColoredCard>
    );
  }

  if (blocks.length === 0 || chartResults.length === 0) {
    return (
      <ColoredCard className={styles.emptyCard}>
        <h2 className={styles.emptyHeading}>
          📊 Data Visualization
        </h2>
        <p className={styles.emptyText}>No data visualization blocks configured</p>
      </ColoredCard>
    );
  }

  // Responsive per-block height calculation based on unit width (pie baseline 4:6)
  // WHAT: For each block grid, compute a shared chart height H = unitWidth * 1.5 (4:6 width:height)
  // WHY: Make all chart figure areas (pie/bar/KPI/text) the same responsive height without fixed caps
  const blockIds = useMemo(() => blocks
    .filter(b => b.isActive)
    .sort((a,b)=>a.order-b.order)
    .map((b, idx) => b._id || `i${idx}`), [blocks]);

  const gridRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observers: ResizeObserver[] = [];

    const computeAndSetHeight = (grid: HTMLDivElement) => {
      if (!grid) return;
      // Skip responsive height when block is text-image only
      const isBaseline = grid.getAttribute('data-pie-baseline') === 'true';
      if (!isBaseline) {
        grid.style.removeProperty('--block-chart-height');
        return;
      }
      // Find child chart items with width units
      const items = Array.from(grid.querySelectorAll<HTMLElement>('.chart-item[data-width-units]'));
      const unitCandidates: number[] = [];
      items.forEach((el) => {
        const unitsAttr = el.getAttribute('data-width-units');
        const units = Math.max(1, Number(unitsAttr) || 1);
        const w = el.clientWidth;
        if (w > 0 && units > 0) unitCandidates.push(w / units);
      });
      // Fallback: use grid width if no candidates
      const fallback = grid.clientWidth > 0 ? grid.clientWidth : 0;
      const unitWidth = unitCandidates.length > 0 ? Math.min(...unitCandidates) : fallback;
      if (unitWidth > 0) {
        const targetHeight = Math.round(unitWidth * 1.5); // 4:6 width:height → H = 1.5 * W
        grid.style.setProperty('--block-chart-height', `${targetHeight}px`);
      }
    };

    blockIds.forEach((id) => {
      const grid = gridRefs.current[id];
      if (!grid) return;

      // Initial compute after layout
      // Use rAF to ensure layout is up-to-date
      requestAnimationFrame(() => computeAndSetHeight(grid));

      const ro = new ResizeObserver(() => computeAndSetHeight(grid));
      ro.observe(grid);
      observers.push(ro);
    });

    const onWindowResize = () => {
      blockIds.forEach((id) => {
        const grid = gridRefs.current[id];
        if (grid) computeAndSetHeight(grid);
      });
    };
    window.addEventListener('resize', onWindowResize);

    return () => {
      observers.forEach(o => o.disconnect());
      window.removeEventListener('resize', onWindowResize);
    };
  }, [blockIds]);

  return (
    <div className={styles.container}>
      {visibleBlocks
        .map((block, blockIndex) => {
          // WHAT: Check if block has any visible charts before rendering
          // WHY: Hide blocks with no valid data
          const visibleCharts = block.charts.filter(chart => {
            const result = getChartResult(chart.chartId);
            return result && hasValidData(result);
          });
          
          // WHAT: Skip rendering block if no charts have valid data
          // WHY: Clean UI without empty blocks
          if (visibleCharts.length === 0) {
            return null;
          }
          
          // Stable class suffix for CSS and keys: prefer _id, fall back to index
          const idSuffix = block._id || `i${blockIndex}`;
          return (
            <ColoredCard 
              key={block._id || `block-${blockIndex}`} 
              className={styles.blockCard}
              data-pdf-block="true"
            >
              {/* Block Title - Conditional rendering based on showTitle field */}
              {block.showTitle !== false && (
                <h2 className={styles.blockTitle}>
                  {block.name}
                </h2>
              )}

              {/* Responsive Charts Grid (per-block columns) */}
              {(() => {
                // WHAT: Compute baseline flag inline to determine responsive height application
                // WHY: Some blocks (pie/bar/kpi) need shared responsive height; others (images/text) need native aspect ratio
                const blockChartResults = block.charts
                  .map(c => getChartResult(c.chartId))
                  .filter((r): r is ChartCalculationResult => !!r && hasValidData(r));
                const hasBaseline = blockChartResults.some(r => r.type === 'pie' || r.type === 'bar' || r.type === 'kpi');
                
                return (
                  <div 
                    className={`udv-grid udv-grid-${idSuffix} ${styles.gridBase}`}
                    ref={(el) => { gridRefs.current[idSuffix] = el; }}
                    data-block-id={idSuffix}
                    data-pie-baseline={hasBaseline ? 'true' : 'false'}
                    style={{ ['--block-chart-height' as string]: '0px' } as React.CSSProperties}
                  >
                    {block.charts
                      .sort((a, b) => a.order - b.order)
                      .map((chart: BlockChart) => {
                        const result = getChartResult(chart.chartId);
                        
                        if (!result || !hasValidData(result)) {
                          return null;
                        }

                        // WHAT: No width calculations needed - fr units in grid-template-columns handle proportions
                        // WHY: Chart width ratio already baked into CSS (e.g., "2fr 2fr 3fr")
                        // HOW: Just render chart in grid cell, CSS does the rest
                        


                        // No width classes needed - fr units handle proportions
                        // WHAT: Add specific classes for image and text charts to remove padding/borders
                        // WHY: Image and text charts should fill the entire container edge-to-edge
                        const chartTypeClass = result.type === 'image' ? 'chart-item-image' : 
                                              result.type === 'text' ? 'chart-item-text' : 
                                              'chart-item-standard';
                        
                        return (
                          <div
                            key={`${idSuffix}-${chart.chartId}`}
                            className={`chart-item unified-chart-item ${chartTypeClass}`}
                            data-chart-id={chart.chartId}
                            data-width-units={Math.max(1, chart.width || 1)}
                          >
                            <DynamicChart 
                              result={result} 
                              chartWidth={chart.width}
                              showTitleInCard={(result as any).showTitle !== false}
                              pageStyle={pageStyle}
                            />
                          </div>
                        );
                      })
                      .filter(Boolean)
                    }
                  </div>
                );
              })()}

              {/* Show message if no charts are visible */}
              {block.charts.filter(chart => {
                const result = getChartResult(chart.chartId);
                return result && hasValidData(result);
              }).length === 0 && (
                <div className={styles.noChartsMessage}>
                  <p>No charts with valid data in this block</p>
                </div>
              )}
            </ColoredCard>
          );
        })}

      <style jsx>{`
        /* WHAT: Enhanced CSS alignment system for report blocks */
        /* WHY: Ensure consistent element heights within individual report blocks */
        /* HOW: CSS Grid with defined rows for title, description, and chart areas */
        .udv-grid {
          /* Base: leave to per-block CSS; do not set columns here to avoid collisions */
          justify-items: stretch !important;
          align-items: start !important; /* WHAT: Allow items to size naturally; WHY: Let aspect ratio control height */
          grid-auto-flow: row !important;
          grid-auto-rows: auto; /* WHAT: Let rows size naturally; WHY: Allow aspect ratio to control height */
        }
        
        /* WHAT: Chart item alignment system */
        /* WHY: Ensure titles, descriptions, and charts align at consistent heights */
        .udv-grid .chart-item {
          display: ${alignment.alignTitles || alignment.alignDescriptions || alignment.alignCharts ? 'grid' : 'flex'} !important;
          ${alignment.alignTitles || alignment.alignDescriptions || alignment.alignCharts 
            ? `grid-template-rows: ${alignment.alignTitles ? `${alignment.minElementHeight || 4}rem` : 'auto'} ${alignment.alignDescriptions ? `${(alignment.minElementHeight || 4) * 0.5}rem` : 'auto'} auto !important;` 
            : 'flex-direction: column !important;'
          }
          gap: 0.75rem !important;
          height: 100% !important;
          align-content: start !important;
        }
        
        /* WHAT: Text and image charts use aspect ratio within forced block height
         * WHY: Charts use aspect ratio BUT all have exactly same height in block
         * HOW: Block height calculated from aspect ratios, all charts forced to that height */
        .udv-grid .chart-item.chart-item-image,
        .udv-grid .chart-item.chart-item-text {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          grid-template-rows: none !important;
          gap: 0 !important;
          /* Height controlled by per-block CSS rules above */
        }
        
        /* WHAT: Chart title area alignment */
        /* WHY: All title areas within a row should align at the same height */
        .udv-grid :global(.chartTitleArea) {
          ${alignment.alignTitles ? `height: ${alignment.minElementHeight || 4}rem !important;` : ''}
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          align-items: center !important;
          text-align: center !important;
          overflow: hidden !important;
        }
        
        /* WHAT: Chart title text alignment */
        .udv-grid :global(.chartTitle) {
          margin: 0 0 0.25rem 0 !important;
          line-height: 1.25 !important;
          text-align: center !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
          word-break: break-word !important;
          flex-shrink: 0 !important;
        }
        
        /* WHAT: Chart subtitle alignment */
        /* WHY: All subtitles within a row should align at the same height */
        .udv-grid :global(.chartSubtitle) {
          ${alignment.alignDescriptions ? `height: ${(alignment.minElementHeight || 4) * 0.5}rem !important;` : ''}
          margin: 0 !important;
          line-height: 1.4 !important;
          text-align: center !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
          word-break: break-word !important;
          flex-shrink: 0 !important;
        }
        
        /* WHAT: Chart graphic area alignment - only for standard charts */
        /* WHY: Text and image charts don't use chartGraphicArea */
        .udv-grid[data-pie-baseline="true"] .chart-item-standard :global(.chartGraphicArea) {
          flex: 0 1 auto !important; /* avoid stretching the grid row */
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          height: clamp(200px, var(--block-chart-height), 80vh) !important; /* responsive with viewport cap */
          min-height: 0 !important;
          max-height: none !important;
          overflow: hidden !important;
        }

        /* Responsive figure height for all chart types in this block */
        .udv-grid [data-block-id] { /* no-op, placeholder for clarity */ }

        /* Pie chart containers use shared height */
        .udv-grid[data-pie-baseline="true"] :global(.pieChartSide),
        .udv-grid[data-pie-baseline="true"] :global(.pieChartContainerPortrait) {
          max-height: none !important;
          height: clamp(200px, var(--block-chart-height), 80vh) !important;
        }
        .udv-grid[data-pie-baseline="true"] :global(.pieChartWrapper),
        .udv-grid[data-pie-baseline="true"] :global(.pieChartInnerPortrait) {
          max-width: none !important;
          width: auto !important;
          height: 100% !important;
          aspect-ratio: 1 / 1 !important; /* keep circle */
        }
        .udv-grid[data-pie-baseline="true"] :global(.pieChartSvg),
        .udv-grid[data-pie-baseline="true"] :global(.pieChartSvgPortrait) {
          width: 100% !important;
          height: 100% !important;
        }

        /* Bar chart containers use shared height */
        .udv-grid[data-pie-baseline="true"] :global(.barChartSide) {
          max-height: none !important;
          height: clamp(200px, var(--block-chart-height), 80vh) !important;
        }
        .udv-grid[data-pie-baseline="true"] :global(.barChartRows) {
          height: 100% !important;
        }

        /* KPI containers use shared height and responsive typography */
        .udv-grid[data-pie-baseline="true"] :global(.kpiContainer) {
          max-height: none !important;
          height: clamp(200px, var(--block-chart-height), 80vh) !important;
        }
        .udv-grid[data-pie-baseline="true"] :global(.kpiValue) {
          font-size: clamp(1.75rem, calc(var(--block-chart-height) * 0.18), 6rem) !important;
        }
        .udv-grid[data-pie-baseline="true"] :global(.kpiEmoji) {
          font-size: clamp(1.5rem, calc(var(--block-chart-height) * 0.14), 4.5rem) !important;
        }
        .udv-grid[data-pie-baseline="true"] :global(.kpiLabel) {
          font-size: clamp(0.8rem, calc(var(--block-chart-height) * 0.05), 1.25rem) !important;
          min-height: auto !important;
          height: auto !important; /* allow auto but within container */
        }

        /* WHAT: Image and text charts KEEP native aspect ratio when in baseline blocks
         * WHY: User requirement - only pie/bar/kpi share responsive height
         * HOW: Remove forced height overrides, let aspect-ratio work naturally */
        
        /* Text charts: NO forced height - use natural text flow */
        .udv-grid[data-pie-baseline="true"] :global(.text-chart-content) {
          height: auto !important;
          min-height: 0 !important;
        }
        
        /* Image charts: NO forced height - use native aspect ratio */
        .udv-grid[data-pie-baseline="true"] :global(.image-chart-container) {
          height: auto !important;
          aspect-ratio: var(--chart-aspect-ratio, auto) !important; /* Keep original aspect ratio */
        }
        .udv-grid[data-pie-baseline="true"] :global(.image-chart-container .imageWrapper) {
          height: auto !important;
          aspect-ratio: var(--chart-aspect-ratio, auto) !important; /* Keep original aspect ratio */
        }
        .udv-grid[data-pie-baseline="true"] :global(.image-chart-container .image) {
          height: 100% !important;
          background-size: cover !important;
          background-position: center !important;
        }

        /* Inject per-block column definitions (fr units auto-calculate from widths) */
        ${dynamicGridCSS}

        /* Override global chart container min/max width so units control size, not pixels */
        .udv-grid :global(.chart-container) {
          min-width: 0 !important;
          max-width: none !important;
          width: 100% !important;
          height: 100% !important;
          display: flex;
          flex-direction: column;
          overflow: hidden !important; /* prevent content from overflowing tile */
        }
        /* Override global legend min-width to allow wrapping inside unit */
        .udv-grid :global(.chart-legend) {
          min-width: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          overflow: hidden;
        }
        /* WHAT: Text overflow handling for consistent layout */
        /* WHY: Prevent long titles/subtitles from breaking alignment */
        .udv-grid :global(.chartTitle) {
          /* Already handled above with -webkit-line-clamp */
        }
        .udv-grid :global(.chartSubtitle) {
          /* Already handled above with -webkit-line-clamp */
        }
        /* Prevent legend text from overflowing */
        .udv-grid :global(.legend-text-row),
        .udv-grid :global(.legend-item span) {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* Ensure columns clip their contents */
        .udv-grid :global(.legends-column),
        .udv-grid :global(.bars-column) {
          overflow: hidden;
        }

        /* NO SPAN CLASSES NEEDED - fr units handle proportions automatically */

        /* WHAT: Unified chart item with improved spacing and height
         * WHY: Single clean card container without double-boxing
         * HOW: Flex layout with proper padding and overflow handling */
        .unified-chart-item {
          background: var(--mm-white);
          border-radius: var(--mm-radius-lg);
          padding: var(--mm-space-6);
          border: 1px solid var(--mm-border-color-light);
          transition: all 0.2s ease;
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: var(--mm-shadow-sm);
        }
        /* WHAT: Remove padding and border for image/text charts
         * WHY: Images and text should fill the entire card edge-to-edge vertically and horizontally
         * HOW: Zero padding and transparent border using specific chart type classes */
        .unified-chart-item.chart-item-image,
        .unified-chart-item.chart-item-text {
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        
        /* WHAT: Make image and text chart content fill the entire container
         * WHY: Remove any extra spacing or constraints */
        .unified-chart-item.chart-item-image > * {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* WHAT: Text chart content fills the exact same height as other charts
         * WHY: User requirement - EXACTLY the same height for all charts in block
         * HOW: Force text charts to fill 100% of available height */
        .unified-chart-item.chart-item-text > * {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Prevent flex children from expanding beyond container height */
        .unified-chart-item > * { min-height: 0; }
        
        .unified-chart-item:hover:not(.chart-item-image):not(.chart-item-text) {
          box-shadow: var(--mm-shadow-md);
          border-color: var(--mm-color-primary-300);
        }
        
        /* WHAT: Chart item container - text and image charts use aspect ratio
         * WHY: STRICT RULE - text and image charts ALWAYS keep their aspect ratio
         * HOW: No min-height for text/image, standard charts get default height */
        .chart-item {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: none;
          justify-self: stretch;
          min-width: 0;
          position: relative;
          overflow: hidden;
        }
        
        /* WHAT: Standard charts (KPI, pie, bar) get default height */
        .chart-item.chart-item-standard {
          height: 100%;
          min-height: 380px;
        }
        
        /* WHAT: Base chart item - height controlled by per-block CSS
         * WHY: Each block calculates exact height from aspect ratios
         * HOW: Per-block CSS forces all charts to calculated height */
        
        /* WHAT: Base chart item styling - specific block rules will override for aspect ratio control
         * WHY: Per-block CSS handles strict aspect ratio rules based on chart types */
        
        /* Ensure all chart content fills the available space */
        .chart-item:not(.chart-item-image):not(.chart-item-text) > * {
          width: 100%;
          height: 100%;
          flex: 1;
        }
        
        /* WHAT: Base content sizing - specific block rules will override
         * WHY: Per-block CSS handles strict aspect ratio rules */
        .chart-item.chart-item-image > *,
        .chart-item.chart-item-text > * {
          width: 100% !important;
          /* height and flex controlled by specific block rules */
        }
        
        /* Bar chart specific styles to fill width */
        .bar-chart-two-columns {
          display: flex;
          gap: 1rem;
          width: 100%;
          height: 100%;
        }
        
        .legends-column {
          flex: 1 1 50%;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          min-width: 0;
        }
        
        .bars-column {
          flex: 1 1 50%;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
        }
        
        .bar-container {
          height: 20px;
          background: rgba(229, 231, 235, 0.3);
          border-radius: 10px;
          overflow: hidden;
          margin: 0.25rem 0;
          width: 100%;
        }
        
        .bar-fill {
          height: 100%;
          background: var(--bar-color, #6366f1);
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        
        /* Legend styles */
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.25rem 0;
          font-size: 0.875rem;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        
        .legend-text-row {
          padding: 0.25rem 0;
          font-size: 0.875rem;
        }
        
        /* WHAT: Mobile responsive - force 1 column layout
         * WHY: Each chart should take full width on mobile
         * HOW: Override grid columns to single column below 768px */
        @media (max-width: 768px) {
          .udv-grid {
            grid-template-columns: 1fr !important;
          }
          
          /* WHAT: Force all chart widths to span 1 on mobile
           * WHY: Prevent charts from trying to span multiple columns */
          .chart-width-1,
          .chart-width-2,
          .chart-width-3,
          .chart-width-4,
          .chart-width-5,
          .chart-width-6 {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
