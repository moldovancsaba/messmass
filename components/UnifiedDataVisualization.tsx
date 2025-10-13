import React from 'react';
import { DynamicChart, ChartContainer } from './DynamicChart';
import { ChartCalculationResult } from '@/lib/chartConfigTypes';
import { DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';

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
  // Determine visible blocks once and keep a stable order
  // Why: We need a consistent ordering to generate matching dynamic CSS and class names
  const visibleBlocks = blocks
    .filter(block => block.isActive)
    .sort((a, b) => a.order - b.order);

  // Build dynamic CSS so each block's grid respects its configured gridColumns
  // Why: Requirements specify charts should fill their block's available units.
  // If a block has 3 columns, a width=2 chart spans 2/3; if a block has 2 columns, width=2 spans full width.
  // We keep mobile at 1 column for readability; on tablets we cap at 2 columns to avoid cramped layouts.
  // IMPORTANT: Use the exact same fallback as Admin Visualization for grid columns.
  // Functional: Prevents NaN in CSS when older blocks lack gridColumns; ensures identical layout.
  // Strategic: Keeps stats pages visually in lockstep with admin preview.
  const dynamicGridCSS = visibleBlocks
    .map((block, idx) => {
      const idSuffix = block._id || `i${idx}`;
      // Desktop uses per-block gridColumns, capped by global desktop units
      const desktopCols = Math.max(1, Math.min(Math.floor(block.gridColumns || 1), Math.floor(gridUnits.desktop)));
      // Tablet uses global units (kept consistent across blocks)
      const tabletCols = Math.max(1, Math.floor(gridUnits.tablet));
      // Mobile uses 1 column (or configured global if provided)
      const mobileCols = Math.max(1, Math.floor(gridUnits.mobile || 1));
      return `
        /* Ensure each block grid fills columns and aligns correctly */
        .udv-grid-${idSuffix} { justify-items: stretch !important; align-items: start; grid-auto-flow: row !important; grid-template-columns: repeat(${desktopCols}, minmax(0, 1fr)) !important; }
        /* Tablet overrides */
        @media (max-width: 1023px) {
          .udv-grid-${idSuffix} { grid-template-columns: repeat(${tabletCols}, minmax(0, 1fr)) !important; }
        }
        /* Mobile overrides */
        @media (max-width: 767px) {
          .udv-grid-${idSuffix} { grid-template-columns: repeat(${mobileCols}, minmax(0, 1fr)) !important; }
        }
        /* Per-block container overrides to avoid pixel constraints */
        .udv-grid-${idSuffix} :global(.chart-container) { min-width: 0 !important; max-width: none !important; width: 100% !important; }
        .udv-grid-${idSuffix} :global(.chart-legend) { min-width: 0 !important; width: 100% !important; max-width: 100% !important; overflow: hidden; }
      `;
    })
    .join('\n');

  // Clamp spans on tablet so any width > tablet units spans exactly tablet units
  const tabletSpan = Math.max(1, Math.floor(gridUnits.tablet));
  const mobileSpan = Math.max(1, Math.floor(gridUnits.mobile || 1));
  const extraClampCSS = `
    /* Tablet clamp: any width > tablet units spans exactly tablet units */
    @media (min-width: 768px) and (max-width: 1023px) {
      .chart-width-3 { grid-column: span ${tabletSpan} !important; }
      .chart-width-4 { grid-column: span ${tabletSpan} !important; }
      .chart-width-5 { grid-column: span ${tabletSpan} !important; }
      .chart-width-6 { grid-column: span ${tabletSpan} !important; }
    }
    /* Mobile clamp: any width > mobile units spans exactly mobile units */
    @media (max-width: 767px) {
      .chart-width-2 { grid-column: span ${mobileSpan} !important; }
      .chart-width-3 { grid-column: span ${mobileSpan} !important; }
      .chart-width-4 { grid-column: span ${mobileSpan} !important; }
      .chart-width-5 { grid-column: span ${mobileSpan} !important; }
      .chart-width-6 { grid-column: span ${mobileSpan} !important; }
    }
  `;
  
  // Get chart result by ID
  const getChartResult = (chartId: string): ChartCalculationResult | null => {
    return chartResults.find(result => result.chartId === chartId) || null;
  };

  // Check if chart has valid data to display
  const hasValidData = (result: ChartCalculationResult): boolean => {
    // Functional: A chart is considered valid only if it has numeric elements and their sum > 0.
    // Strategic: Ensures charts that would render "No data available" are hidden on stats pages.
    const validElements = result.elements.filter(element => 
      typeof element.value === 'number'
    );
    const totalValue = validElements.reduce((sum, element) => sum + (element.value as number), 0);
    return validElements.length > 0 && totalValue > 0;
  };

  if (loading) {
    return (
      <div REPLACE_WITH_COLORED_CARD style={{
        padding: '2rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(99, 102, 241, 0.3)',
            borderTop: '4px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Loading charts...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (blocks.length === 0 || chartResults.length === 0) {
    return (
      <div REPLACE_WITH_COLORED_CARD style={{
        padding: '2rem',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: '0 0 1rem 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          📊 Data Visualization
        </h2>
        <p style={{ color: '#6b7280', margin: 0 }}>No data visualization blocks configured</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      {visibleBlocks
        .map((block, blockIndex) => {
          // Stable class suffix for CSS and keys: prefer _id, fall back to index
          const idSuffix = block._id || `i${blockIndex}`;
          return (
            <div key={block._id || `block-${blockIndex}`} REPLACE_WITH_COLORED_CARD style={{
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Block Title */}
              <h2 style={{
                fontSize: '1.875rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 2rem 0',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                📊 {block.name}
              </h2>

              {/* Responsive Charts Grid (per-block columns) */}
              <div 
                className={`udv-grid udv-grid-${idSuffix}`}
                style={{
                  display: 'grid',
                  gap: '1.5rem',
                  width: '100%',
                  gridAutoFlow: 'row',
                  justifyItems: 'stretch'
                }}
              >
                {block.charts
                  .sort((a, b) => a.order - b.order)
                  .map((chart: BlockChart) => {
                    const result = getChartResult(chart.chartId);
                    
                    if (!result || !hasValidData(result)) {
                      return null;
                    }

                    // Clamp width to [1 .. desktop units], future-proof for >2
                    const maxDesktopUnits = Math.max(1, Math.min(Math.floor(block.gridColumns || 1), Math.floor(gridUnits.desktop)));
                    const safeWidth = Math.min(Math.max(chart.width ?? 1, 1), maxDesktopUnits);

                    return (
                      <div
                        key={`${idSuffix}-${chart.chartId}`}
                        className={`chart-item chart-width-${safeWidth}`}
                      >
                        {useChartContainer ? (
                          <ChartContainer
                            title={result.title}
                            subtitle={result.subtitle}
                            emoji={result.emoji}
                            className="unified-chart-item"
                            chartWidth={chart.width}
                          >
                            <DynamicChart result={result} chartWidth={chart.width} />
                          </ChartContainer>
                        ) : (
                          <div className="unified-chart-item" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                            <DynamicChart result={result} chartWidth={chart.width} />
                          </div>
                        )}
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
                <div style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  padding: '2rem'
                }}>
                  <p>No charts with valid data in this block</p>
                </div>
              )}
            </div>
          );
        })}

      <style jsx>{`
        /* Responsive Grid System per block (base desktop, overrides below) */
        .udv-grid {
          /* Base: leave to per-block CSS; do not set columns here to avoid collisions */
          justify-items: stretch !important;
          align-items: start;
          grid-auto-flow: row !important;
        }

        /* Chart width spans - determines actual grid space occupied */
        .chart-width-1 { grid-column: span 1 !important; }
        .chart-width-2 { grid-column: span 2 !important; }

        /* Mobile clamp is injected dynamically to respect configured mobile units */

        /* Inject per-block column definitions for tablet and desktop */
        ${dynamicGridCSS}

        /* Clamp spans at tablet: width > tabletCols -> span tabletCols */
        ${extraClampCSS}

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

        /* Support up to 6-unit spans for forward compatibility */
        .chart-width-3 { grid-column: span 3 !important; }
        .chart-width-4 { grid-column: span 4 !important; }
        .chart-width-5 { grid-column: span 5 !important; }
        .chart-width-6 { grid-column: span 6 !important; }

        .unified-chart-item {
          background: rgba(248, 250, 252, 0.8);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(226, 232, 240, 0.8);
          transition: all 0.2s ease;
          height: 100%;
          /* Strategic: include border-box so padding doesn't reduce usable width */
          box-sizing: border-box;
          /* Ensure inner content cannot overflow and overlap neighbors */
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          isolation: isolate; /* create stacking context to avoid overlay bleeding */
        }
        /* Prevent flex children from expanding beyond container height */
        .unified-chart-item > * { min-height: 0; }
        
        .unified-chart-item:hover {
          /* Remove translateY to prevent tiles from sliding and overlapping */
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
        }
        
        .chart-item {
          display: flex;
          flex-direction: column;
          width: 100%;
          /* Enforce a uniform chart tile height across all chart types and spans */
          height: var(--chart-tile-height, 360px);
          min-height: 0;
          /* Remove any global max-width and force items to fill their grid track */
          max-width: none;
          justify-self: stretch;
          min-width: 0;
          position: relative;
          overflow: hidden; /* final guard */
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
      `}</style>
    </div>
  );
}
