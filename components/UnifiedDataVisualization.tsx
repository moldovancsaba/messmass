import React from 'react';
import { DynamicChart, ChartContainer } from './DynamicChart';
import { ChartCalculationResult } from '@/lib/chartConfigTypes';
import { DataVisualizationBlock, BlockChart } from '@/lib/pageStyleTypes';

interface UnifiedDataVisualizationProps {
  blocks: DataVisualizationBlock[];
  chartResults: ChartCalculationResult[];
  loading?: boolean;
}

export default function UnifiedDataVisualization({
  blocks,
  chartResults,
  loading = false
}: UnifiedDataVisualizationProps) {
  
  // Get chart result by ID
  const getChartResult = (chartId: string): ChartCalculationResult | null => {
    return chartResults.find(result => result.chartId === chartId) || null;
  };

  // Check if chart has valid data to display
  const hasValidData = (result: ChartCalculationResult): boolean => {
    const validElements = result.elements.filter(element => 
      typeof element.value === 'number'
    );
    const totalValue = validElements.reduce((sum, element) => sum + (element.value as number), 0);
    
    return validElements.length > 0 && (result.type === 'bar' || totalValue > 0);
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
      {blocks
        .filter(block => block.isActive)
        .sort((a, b) => a.order - b.order)
        .map((block) => (
          <div key={block._id} style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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

            {/* Responsive Charts Grid */}
            <div 
              className={`charts-grid charts-grid-${block._id}`}
              style={{
                display: 'grid',
                gap: '1.5rem',
                width: '100%'
              }}
            >
              {block.charts
                .sort((a, b) => a.order - b.order)
                .map((chart: BlockChart) => {
                  const result = getChartResult(chart.chartId);
                  
                  if (!result || !hasValidData(result)) {
                    return null;
                  }

                  return (
                    <div
                      key={`${block._id}-${chart.chartId}`}
                      className={`chart-item chart-width-${chart.width}`}
                      style={{
                        minHeight: '300px'
                      }}
                    >
                      <ChartContainer
                        title={result.title}
                        subtitle={result.subtitle}
                        emoji={result.emoji}
                        className="unified-chart-item"
                        chartWidth={chart.width}
                      >
                        <DynamicChart result={result} chartWidth={chart.width} />
                      </ChartContainer>
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
        ))}

      <style jsx>{`
        /* Responsive Grid System */
        .charts-grid {
          /* Mobile: 1 chart per row (can be 1 or 2 units wide) */
          grid-template-columns: 1fr;
        }
        
        @media (min-width: 768px) {
          .charts-grid {
            /* Tablet: 2 units per row - one 2-unit chart OR two 1-unit charts */
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1024px) {
          .charts-grid {
            /* Desktop: 4 units per row - various combinations */
            grid-template-columns: repeat(4, 1fr);
          }
        }
        
        /* Chart width spans - determines actual grid space occupied */
        .chart-width-1 {
          grid-column: span 1;
        }
        
        .chart-width-2 {
          grid-column: span 2;
        }
        
        /* Responsive width adjustments */
        @media (max-width: 767px) {
          /* Mobile: 1 chart per row - both 1-unit and 2-unit charts fill full width */
          .chart-width-1 {
            grid-column: span 1;
          }
          .chart-width-2 {
            grid-column: span 1;
          }
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          /* Tablet: 2 units per row - respect original widths */
          .chart-width-1 {
            grid-column: span 1;
          }
          .chart-width-2 {
            grid-column: span 2;
          }
        }
        
        @media (min-width: 1024px) {
          /* Desktop: 4 units per row - respect original widths */
          .chart-width-1 {
            grid-column: span 1;
          }
          .chart-width-2 {
            grid-column: span 2;
          }
        }
        
        .unified-chart-item {
          background: rgba(248, 250, 252, 0.8);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(226, 232, 240, 0.8);
          transition: all 0.2s ease;
          height: 100%;
        }
        
        .unified-chart-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
        }
        
        .chart-item {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 350px;
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
