'use client';

import React, { useRef } from 'react';
import { ChartCalculationResult } from '@/lib/chartConfigTypes';
import { formatChartValue } from '@/lib/chartCalculator';
import TextChart from './charts/TextChart';
import ImageChart from './charts/ImageChart';
import styles from './DynamicChart.module.css';

interface DynamicChartProps {
  result: ChartCalculationResult;
  className?: string;
  chartWidth?: number; // 1 = portrait, 2+ = landscape
  showTitleInCard?: boolean; // WHAT: Whether to show title/subtitle inside the chart card
}

/**
 * Dynamic Chart Component
 * WHAT: Renders charts with consistent card structure: title area, graphic area, legend area
 * WHY: Ensures all chart types (KPI, PIE, BAR) have aligned heights and proper spacing
 * HOW: Fixed-height sections prevent overlap and content clipping
 */
export const DynamicChart: React.FC<DynamicChartProps> = ({ result, className = '', chartWidth = 1, showTitleInCard = true }) => {
  // Handle empty or error cases
  if (!result || !result.elements || result.elements.length === 0) {
    return (
      <div className={`${styles.noDataMessage} ${className}`}>
        <p>No data available for {result?.title || 'this chart'}</p>
      </div>
    );
  }

  // Filter out NA values and zero/empty entries, then calculate totals
  const validElements = result.elements.filter(
    element => typeof element.value === 'number' && (element.value as number) > 0
  );
  const totalValue = validElements.reduce((sum, element) => sum + (element.value as number), 0);

  // If all values are NA or zero, show no data message
  if (validElements.length === 0 || totalValue === 0) {
    return (
      <div className={`${styles.noDataMessage} ${className}`}>
        <p>No data available for {result.title}</p>
      </div>
    );
  }

  // WHAT: Unified card structure wrapper for all chart types
  // WHY: Ensures consistent layout with title, graphic, and legend areas
  const ChartCard = ({ children }: { children: React.ReactNode }) => (
    <div className={`${styles.chartCard} ${className}`}>
      {/* WHAT: Title area with fixed height
          WHY: Prevents overlap with graphic area below */}
      {showTitleInCard && (result.title || result.subtitle) && (
        <div className={styles.chartTitleArea}>
          {result.title && <h3 className={styles.chartTitle}>{result.title}</h3>}
          {result.subtitle && <p className={styles.chartSubtitle}>{result.subtitle}</p>}
        </div>
      )}
      {/* WHAT: Graphic area with fixed height
          WHY: All chart types render in same vertical space for alignment */}
      <div className={styles.chartGraphicArea}>
        {children}
      </div>
    </div>
  );

  // WHAT: Handle text and image charts (no data validation needed)
  // WHY: Text/image charts display content, not numeric calculations
  // HOW: Render directly without ChartCard wrapper (they have their own styling)
  if (result.type === 'text') {
    const textContent = typeof result.kpiValue === 'string' 
      ? result.kpiValue 
      : (result.elements[0]?.value as string || '');
    return (
      <TextChart
        title={result.title}
        content={textContent}
        subtitle={result.subtitle}
        className={className}
      />
    );
  }
  
  if (result.type === 'image') {
    const imageUrl = typeof result.kpiValue === 'string'
      ? result.kpiValue
      : (result.elements[0]?.value as string || '');
    return (
      <ImageChart
        title={result.title}
        imageUrl={imageUrl}
        subtitle={result.subtitle}
        className={className}
      />
    );
  }

  if (result.type === 'pie') {
    return (
      <ChartCard>
        <PieChart result={result} validElements={validElements as ValidPieElement[]} totalValue={totalValue} chartWidth={chartWidth} />
      </ChartCard>
    );
  } else if (result.type === 'bar') {
    return (
      <ChartCard>
        <BarChart result={result} chartWidth={chartWidth} />
      </ChartCard>
    );
  } else if (result.type === 'kpi') {
    return (
      <ChartCard>
        <KPIChart result={result} chartWidth={chartWidth} />
      </ChartCard>
    );
  }

  return (
    <div className={`${styles.chartError} ${className}`}>
      <p>Unsupported chart type: {result.type}</p>
    </div>
  );
};

interface ValidPieElement {
  id: string;
  label: string;
  value: number;
  color: string;
  type?: 'currency' | 'percentage' | 'number'; // WHAT: Value type for proper formatting
}

/**
 * Pie Chart Component
 * Renders circular pie charts with SVG, matching the existing design
 */
const PieChart: React.FC<{
  result: ChartCalculationResult;
  validElements: ValidPieElement[];
  totalValue: number;
  className?: string;
  chartWidth?: number;
}> = ({ result, validElements, totalValue, className, chartWidth = 1 }) => {
  const isLandscape = chartWidth >= 2;
  
  // Create segments for both portrait and landscape layouts
  const createSegments = (radius: number, centerX: number, centerY: number) => {
    let currentAngle = 0;
    
    return validElements.map((element) => {
      const percentage = (element.value / totalValue) * 100;
      const angle = (element.value / totalValue) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;
      
      // Calculate arc coordinates using trigonometry
      const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      // SVG path for the pie segment
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      return (
        <g key={element.id}>
          <path
            d={pathData}
            fill={element.color}
            stroke="white"
            strokeWidth="2"
          >
            <title>{`${element.label}: ${formatChartValue(element.value, { type: element.type })} (${percentage.toFixed(1)}%)`}</title>
          </path>
        </g>
      );
    });
  };
  
  // Get appropriate segments based on layout
  const portraitSegments = createSegments(80, 90, 90);
  const landscapeSegments = createSegments(100, 110, 110);

  const legend = validElements.map((element) => {
    const percentage = ((element.value / totalValue) * 100).toFixed(1);
    return (
      <div key={element.id} className={styles.legendItem}>
        <div className={styles.legendColor} style={{ ['--legend-color' as string]: element.color, backgroundColor: element.color } as React.CSSProperties}></div>
        <span>{element.label}: {formatChartValue(element.value, { type: element.type })} ({percentage}%)</span>
      </div>
    );
  });

  if (isLandscape) {
    // Landscape layout: chart on left, legend on right - COMPLETELY FILLS 2 units width
    return (
      <div className={`${className} ${styles.landscapeLayout}`}>
        <div className={styles.pieChartSide}>
          <div className={styles.pieChartWrapper}>
            <svg viewBox="0 0 220 220" className={`pie-chart ${styles.pieChartSvg}`}>
              {landscapeSegments}
              <circle
                cx="110"
                cy="110"
                r="50"
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <text
                x="110"
                y="120"
                textAnchor="middle"
                className="chart-emoji"
                fontSize="42"
                fill="#1a202c"
              >
                {result.emoji || '📊'}
              </text>
            </svg>
          </div>
          {result.total !== undefined && (
            <div className={styles.chartTotal}>
              <strong>Total: {formatChartValue(result.total, { type: result.elements[0]?.type })}</strong>
            </div>
          )}
        </div>
        <div className={styles.legendSide}>
          <div className={styles.chartLegend}>
            {legend}
          </div>
        </div>
      </div>
    );
  } else {
    // Portrait layout: traditional stacked layout - COMPLETELY FILLS 1 unit width
    return (
      <div className={`${className} ${styles.portraitLayout}`}>
        <div className={styles.pieChartContainerPortrait}>
          <div className={styles.pieChartInnerPortrait}>
            <svg viewBox="0 0 180 180" className={`pie-chart ${styles.pieChartSvgPortrait}`}>
              {portraitSegments}
              <circle
                cx="90"
                cy="90"
                r="35"
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <text
                x="90"
                y="98"
                textAnchor="middle"
                className="chart-emoji"
                fontSize="36"
                fill="#1a202c"
              >
                {result.emoji || '📊'}
              </text>
            </svg>
          </div>
        </div>
        <div className={styles.chartLegendPortrait}>
          {legend}
        </div>
        {result.total !== undefined && (
          <div className={styles.chartTotalPortrait}>
            <strong>Total: {formatChartValue(result.total, { type: result.elements[0]?.type })}</strong>
          </div>
        )}
      </div>
    );
  }
};

/**
 * Horizontal Bar Chart Component
 * Renders horizontal bar charts with consistent styling
 */
const BarChart: React.FC<{
  result: ChartCalculationResult;
  className?: string;
  chartWidth?: number;
}> = ({ result, className, chartWidth = 1 }) => {
  // Find the maximum value for scaling
  const validElements = result.elements.filter(element => typeof element.value === 'number');
  const maxValue = Math.max(...validElements.map(element => element.value as number));
  
  // Determine if this is a landscape layout
  const isLandscape = chartWidth === 2;

  // If no valid data, show message
  if (validElements.length === 0 || maxValue === 0) {
    return (
      <div className={`${styles.noDataMessage} ${className}`}>
        <p>No data available for {result.title}</p>
      </div>
    );
  }

  // Create separate legends and bars (hide zero or NA values)
  const legends = validElements.map((element) => {
    const value = element.value as number;
    return (
      <div key={element.id} className={styles.legendTextRow}>
        <span>{element.label}: {formatChartValue(value, { type: element.type })}</span>
      </div>
    );
  });

  const bars = validElements.map((element) => {
    const value = element.value as number;
    const barWidth = ((value) / maxValue) * 100;
    
    return (
      <div key={element.id} className={styles.barOnlyRow}>
        <div className={styles.barContainer}>
          <div 
            className={styles.barFill} 
            style={{ 
              ['--bar-width' as string]: `${barWidth}%`, 
              ['--bar-color' as string]: element.color
            } as React.CSSProperties}
          />
        </div>
      </div>
    );
  });

  // WHAT: Format total value using type from first element
  // WHY: Use database-driven type field instead of hardcoded string matching
  // HOW: Check first element's type since bar chart elements should all be same type
  const formatTotal = (total: number | 'NA') => {
    if (total === 'NA') return 'N/A';
    
    // WHAT: Use type from first element to determine formatting
    // WHY: Type is set in database, no hardcoding needed
    const firstElementType = result.elements[0]?.type;
    
    if (firstElementType === 'currency') {
      return `€${total.toLocaleString()}`;
    }
    
    // For other types, just show the number
    return total.toLocaleString();
  };

  if (isLandscape) {
    // Landscape layout: total on left, chart on right - FILLS 2 units width
    return (
      <div className={`${className} ${styles.landscapeLayout}`}>
        {/* Total value display on the left */}
        {result.total !== undefined && (
          <div className={styles.totalBoxLandscape}>
            <div className={styles.totalValue}>
              {formatTotal(result.total)}
            </div>
            <div className={styles.totalLabel}>
              {result.totalLabel || 'Total'}
            </div>
          </div>
        )}
        
        {/* Bar chart on the right */}
        <div className={styles.barChartSide}>
          <div className={styles.barChartTwoColumns}>
            <div className={styles.legendsColumn}>
              {legends}
            </div>
            <div className={styles.barsColumn}>
              {bars}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // Portrait layout: traditional stacked layout - FILLS 1 unit width
    return (
      <div className={`${className} ${styles.portraitLayout}`}>
        {result.total !== undefined && (
          <div className={styles.totalBoxPortrait}>
            <div className={styles.totalValuePortrait}>
              {formatTotal(result.total)}
            </div>
            <div className={styles.totalLabel}>
              {result.totalLabel || 'Total'}
            </div>
          </div>
        )}
        <div className={styles.barChartTwoColumns}>
          <div className={styles.legendsColumn}>
            {legends}
          </div>
          <div className={styles.barsColumn}>
            {bars}
          </div>
        </div>
      </div>
    );
  }
};

/**
 * KPI Chart Component
 * Renders a single metric tile with large value display and subtitle
 */
const KPIChart: React.FC<{
  result: ChartCalculationResult;
  className?: string;
  chartWidth?: number;
}> = ({ result, className, chartWidth = 1 }) => {
  // WHAT: Get the KPI value - support number, string, or 'NA'
  // WHY: Text/image charts may have string values
  // HOW: Keep as union type and handle formatting accordingly
  let kpiValue: number | string | 'NA' = 'NA';
  
  if (result.kpiValue !== undefined) {
    kpiValue = result.kpiValue;
  } else if (result.elements.length > 0 && result.elements[0].value !== 'NA') {
    kpiValue = result.elements[0].value;
  }
  
  // Determine if this is a landscape layout
  const isLandscape = chartWidth === 2;
  
  // WHAT: Format KPI value - handle number, string, or NA
  // WHY: Text/image charts have string values, numeric charts have numbers
  // HOW: Check type and format accordingly
  const formatKPIValue = (value: number | string | 'NA') => {
    if (value === 'NA') return 'N/A';
    if (typeof value === 'string') return value;
    
    // Format numbers to 2 decimal places
    return value.toFixed(2);
  };
  
  // Get the color from the first element or use default
  const kpiColor = result.elements[0]?.color || '#10b981';
  
  // Convert hex to RGB for dynamic color usage
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 16, g: 185, b: 129 }; // fallback to green
  };
  
  const rgb = hexToRgb(kpiColor);
  
  // Responsive sizing based on layout
  const emojiSize = isLandscape ? '4.5rem' : '3.5rem';
  const valueSize = isLandscape ? '5rem' : '4rem';
  const labelSize = isLandscape ? '1.25rem' : '1.1rem';
  const padding = isLandscape ? '3rem' : '2rem';
  
  return (
    <div className={`${className} ${styles.kpiContainer}`}>
      <div 
        className={styles.kpiBox}
        style={{
          ['--kpi-padding' as string]: padding,
          ['--kpi-bg' as string]: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) 100%)`,
          ['--kpi-border' as string]: `2px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
        } as React.CSSProperties}
      >
        {/* Large emoji at the top */}
        {result.emoji && (
          <div 
            className={styles.kpiEmoji}
            style={{ ['--kpi-emoji-size' as string]: emojiSize } as React.CSSProperties}
          >
            {result.emoji}
          </div>
        )}
        
        {/* Large KPI value */}
        <div 
          className={styles.kpiValue}
          style={{
            ['--kpi-value-size' as string]: valueSize,
            ['--kpi-color' as string]: kpiColor,
            ['--kpi-shadow' as string]: `0 2px 4px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`
          } as React.CSSProperties}
        >
          {formatKPIValue(kpiValue)}
        </div>
        
        {/* Label with description */}
        {result.elements[0]?.label && (
          <div 
            className={styles.kpiLabel}
            style={{ ['--kpi-label-size' as string]: labelSize } as React.CSSProperties}
          >
            {result.elements[0].label}
          </div>
        )}
        
      </div>
    </div>
  );
};

/**
 * Chart Container Component
 * Wraps charts with consistent styling and title
 */
export const ChartContainer: React.FC<{
  title: string;
  subtitle?: string;
  emoji?: string;
  children: React.ReactNode;
  className?: string;
  chartWidth?: number;
}> = ({ title, subtitle, emoji, children, className = '', chartWidth = 1 }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  
  const exportChartAsPNG = async () => {
    if (!chartRef.current) return;
    
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Wait a moment for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(chartRef.current, {
        logging: false,
        useCORS: true
      });
      
      // Create download link
      const link = document.createElement('a');
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `chart_${sanitizedTitle}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      console.log('Chart downloaded successfully!');
    } catch (error) {
      console.error('Failed to export chart as PNG:', error);
      alert('Failed to export chart. Please try again.');
    }
  };
  
  return (
    <div className={styles.chartWrapper}>
      {/* Download button positioned outside the container */}
      <button 
        className={`btn btn-small btn-primary chart-download-btn ${styles.downloadBtn}`}
        onClick={exportChartAsPNG}
        title="Download chart as PNG"
      >
        📥 Download PNG
      </button>
      
      {/* Beautiful rounded container that will be captured */}
      <div className={`chart-container ${className} ${styles.chartContainerExport}`} ref={chartRef}>
        <div className={styles.chartTitleExport}>
          <h3 className={styles.chartTitleExportH3}>
            {title}
          </h3>
          {subtitle && <p className={styles.chartSubtitleExport}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default DynamicChart;
