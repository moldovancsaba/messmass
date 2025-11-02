import React from 'react';
import ColoredCard from './ColoredCard';
import { DynamicChart, ChartContainer } from './DynamicChart';
import { ChartCalculationResult } from '@/lib/chartConfigTypes';
import { DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';
import styles from './UnifiedDataVisualization.module.css';

interface UnifiedDataVisualizationProps {
  blocks: DataVisualizationBlock[];
  chartResults: ChartCalculationResult[];
  loading?: boolean;
  gridUnits?: { desktop: number; tablet: number; mobile: number };
  useChartContainer?: boolean; // when false, render charts directly without the extra container/header
}

export default function UnifiedDataVisualization({
  blocks,
  chartResults,
  loading = false,
  gridUnits = { desktop: 4, tablet: 2, mobile: 1 },
  useChartContainer = true
}: UnifiedDataVisualizationProps) {
  
  console.log('📊 [UnifiedViz] Rendering with:', {
    blocksCount: blocks.length,
    chartResultsCount: chartResults.length,
    loading
  });
  
  // Determine visible blocks once and keep a stable order
  // Why: We need a consistent ordering to generate matching dynamic CSS and class names
  const visibleBlocks = blocks
    .filter(block => block.isActive)
    .sort((a, b) => a.order - b.order);
  
  console.log('📊 [UnifiedViz] Visible blocks:', visibleBlocks.map(b => ({
    name: b.name,
    isActive: b.isActive,
    chartsCount: b.charts?.length,
    chartIds: b.charts?.map(c => c.chartId)
  })));

  // WHAT: Build dynamic CSS using fr units based on chart width ratios
  // WHY: Auto-calculate grid from chart widths (e.g., 2+2+3 = "2fr 2fr 3fr"), no manual grid columns needed
  // HOW: Sum chart widths, generate explicit fr values, auto-wrap with min-width on tablet/mobile
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
      
      // WHAT: Build fr unit string from chart widths (e.g., [2, 2, 3] → "2fr 2fr 3fr")
      // WHY: Creates proportional columns - 2/7, 2/7, 3/7 of row width
      const chartWidths = blockCharts.map(c => Math.max(1, c.width || 1));
      const frColumns = chartWidths.map(w => `${w}fr`).join(' ');
      
      console.log(`📐 [Grid ${idSuffix}]`, { chartWidths, frColumns });
      
      return `
        /* Desktop: Auto-calculated fr units from chart widths */
        .udv-grid-${idSuffix} { 
          justify-items: stretch !important; 
          align-items: start; 
          grid-auto-flow: row !important; 
          grid-template-columns: ${frColumns || '1fr'} !important; 
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
      return !!(textContent && textContent.trim().length > 0);
    }
    
    // WHAT: Image charts valid only if kpiValue has a URL
    // WHY: Hide "No image available" placeholders
    if (result.type === 'image') {
      const imageUrl = typeof result.kpiValue === 'string'
        ? result.kpiValue
        : (result.elements[0]?.value as string || '');
      return !!(imageUrl && imageUrl.trim().length > 0);
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
              <div 
                className={`udv-grid udv-grid-${idSuffix} ${styles.gridBase}`}
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
                    
                    // Debug logging for image charts
                    if (result.type === 'image') {
                      console.log('🖼️ [IMAGE CHART]', {
                        chartId: chart.chartId,
                        width: chart.width,
                        aspectRatio: (result as any).aspectRatio,
                        note: 'Width handled by fr units, aspect ratio controls height'
                      });
                    }

                    // No width classes needed - fr units handle proportions
                    return (
                      <div
                        key={`${idSuffix}-${chart.chartId}`}
                        className={`chart-item unified-chart-item`}
                      >
                        <DynamicChart 
                          result={result} 
                          chartWidth={chart.width}
                          showTitleInCard={true}
                        />
                      </div>
                    );
                  })
                  .filter(Boolean)
                }
              </div>

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
        /* Responsive Grid System per block (base desktop, overrides below) */
        .udv-grid {
          /* Base: leave to per-block CSS; do not set columns here to avoid collisions */
          justify-items: stretch !important;
          align-items: stretch !important; /* WHAT: Stretch items to fill row height; WHY: Removes bottom space */
          grid-auto-flow: row !important;
          grid-auto-rows: 1fr; /* WHAT: Make all rows equal height; WHY: Consistent chart heights */
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
        /* Crop long titles and subtitles to keep fixed height */
        .udv-grid :global(.chart-title-for-export h3) {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .udv-grid :global(.chart-title-for-export p) {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
         * HOW: Zero padding and transparent border when containing image/text chart containers */
        .unified-chart-item:has(.image-chart-container),
        .unified-chart-item:has(.text-chart-container) {
          padding: 0;
          border: none;
        }
        /* Prevent flex children from expanding beyond container height */
        .unified-chart-item > * { min-height: 0; }
        
        .unified-chart-item:hover {
          box-shadow: var(--mm-shadow-md);
          border-color: var(--mm-color-primary-300);
        }
        
        /* WHAT: Chart item container that fills available grid cell height
         * WHY: Charts should fill their grid cell without extra bottom space
         * HOW: Use height: 100% to fill parent, let grid control sizing */
        .chart-item {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 380px;
          max-width: none;
          justify-self: stretch;
          min-width: 0;
          position: relative;
          overflow: hidden;
        }
        
        /* Ensure all chart content fills the available space */
        .chart-item > * {
          width: 100%;
          height: 100%;
          flex: 1;
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
