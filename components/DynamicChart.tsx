'use client';

import React, { useRef } from 'react';
import { ChartCalculationResult } from '@/lib/chartConfigTypes';
import { formatChartValue } from '@/lib/chartCalculator';

interface DynamicChartProps {
  result: ChartCalculationResult;
  className?: string;
}

/**
 * Dynamic Chart Component
 * Renders charts based on ChartCalculationResult from the chart configuration system
 * Supports both pie charts and horizontal bar charts with consistent styling
 */
export const DynamicChart: React.FC<DynamicChartProps> = ({ result, className = '' }) => {
  // Handle empty or error cases
  if (!result || !result.elements || result.elements.length === 0) {
    return (
      <div className={`no-data-message ${className}`}>
        <p>No data available for {result?.title || 'this chart'}</p>
      </div>
    );
  }

  // Filter out NA values and calculate totals
  const validElements = result.elements.filter(element => typeof element.value === 'number');
  const totalValue = validElements.reduce((sum, element) => sum + (element.value as number), 0);

  // If all values are NA or zero, show no data message
  if (validElements.length === 0 || totalValue === 0) {
    return (
      <div className={`no-data-message ${className}`}>
        <p>No data available for {result.title}</p>
      </div>
    );
  }

  if (result.type === 'pie') {
    return <PieChart result={result} validElements={validElements as ValidPieElement[]} totalValue={totalValue} className={className} />;
  } else if (result.type === 'bar') {
    return <BarChart result={result} className={className} />;
  }

  return (
    <div className={`chart-error ${className}`}>
      <p>Unsupported chart type: {result.type}</p>
    </div>
  );
};

interface ValidPieElement {
  id: string;
  label: string;
  value: number;
  color: string;
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
}> = ({ result, validElements, totalValue, className }) => {
  let currentAngle = 0;
  
  const segments = validElements.map((element) => {
    const percentage = (element.value / totalValue) * 100;
    const angle = (element.value / totalValue) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;
    
    const radius = 80;
    const centerX = 90;
    const centerY = 90;
    
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
          <title>{`${element.label}: ${formatChartValue(element.value)} (${percentage.toFixed(1)}%)`}</title>
        </path>
      </g>
    );
  });

  const legend = validElements.map((element) => {
    const percentage = ((element.value / totalValue) * 100).toFixed(1);
    return (
      <div key={element.id} className="legend-item">
        <div className="legend-color" style={{ backgroundColor: element.color }}></div>
        <span>{element.label}: {formatChartValue(element.value)} ({percentage}%)</span>
      </div>
    );
  });

  return (
    <div className={className}>
      <div className="pie-chart-container">
        <svg width="180" height="180" className="pie-chart">
          {segments}
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
      <div className="chart-legend">
        {legend}
      </div>
      {result.total !== undefined && (
        <div className="chart-total">
          <strong>Total: {formatChartValue(result.total)}</strong>
        </div>
      )}
    </div>
  );
};

/**
 * Horizontal Bar Chart Component
 * Renders horizontal bar charts with consistent styling
 */
const BarChart: React.FC<{
  result: ChartCalculationResult;
  className?: string;
}> = ({ result, className }) => {
  // Find the maximum value for scaling
  const validElements = result.elements.filter(element => typeof element.value === 'number');
  const maxValue = Math.max(...validElements.map(element => element.value as number));

  // If no valid data, show message
  if (validElements.length === 0 || maxValue === 0) {
    return (
      <div className={`no-data-message ${className}`}>
        <p>No data available for {result.title}</p>
      </div>
    );
  }

  // Create separate legends and bars
  const legends = result.elements.map((element) => {
    const value = element.value;
    const isValid = typeof value === 'number';
    return (
      <div key={element.id} className="legend-text-row">
        <span>{element.label}: {isValid ? formatChartValue(value as number) : 'N/A'}</span>
      </div>
    );
  });

  const bars = result.elements.map((element) => {
    const value = element.value;
    const isValid = typeof value === 'number';
    const barWidth = isValid ? ((value as number) / maxValue) * 100 : 0;
    
    return (
      <div key={element.id} className="bar-only-row">
        <div className="bar-container">
          <div 
            className="bar-fill" 
            style={{ 
              width: `${barWidth}%`, 
              '--bar-color': element.color
            } as React.CSSProperties}
          />
        </div>
      </div>
    );
  });

  // Format total value based on chart type and total label
  const formatTotal = (total: number | 'NA') => {
    if (total === 'NA') return 'N/A';
    
    // Check if this is a currency value based on totalLabel
    const isCurrencyValue = result.totalLabel && (
      result.totalLabel.toLowerCase().includes('sales') ||
      result.totalLabel.toLowerCase().includes('value') ||
      result.totalLabel.toLowerCase().includes('euro') ||
      result.totalLabel.toLowerCase().includes('eur') ||
      result.totalLabel.toLowerCase().includes('€')
    );
    
    // Check if this is the engagement chart specifically (Core Fan Team)
    const isEngagementChart = result.chartId === 'engagement' || 
      (result.totalLabel && result.totalLabel.toLowerCase().includes('core fan team'));
    
    // Format as currency only if it's explicitly a currency value
    if (isCurrencyValue && !isEngagementChart) {
      return `€${total.toLocaleString()}`;
    }
    
    // For engagement chart and other person counts, just show the number
    return total.toLocaleString();
  };

  return (
    <div className={className}>
      {result.total !== undefined && (
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '1rem',
          border: '2px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: '#667eea',
            marginBottom: '0.5rem',
            lineHeight: 1
          }}>
            {formatTotal(result.total)}
          </div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#4a5568',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            {result.totalLabel || 'Total'}
          </div>
        </div>
      )}
      <div className="bar-chart-two-columns">
        <div className="legends-column">
          {legends}
        </div>
        <div className="bars-column">
          {bars}
        </div>
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
}> = ({ title, subtitle, emoji, children, className = '' }) => {
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
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Download button positioned outside the container */}
      <button 
        className="btn btn-sm btn-primary chart-download-btn"
        onClick={exportChartAsPNG}
        title="Download chart as PNG"
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          color: '#4f46e5'
        }}
      >
        📥 Download PNG
      </button>
      
      {/* Beautiful rounded container that will be captured */}
      <div className={`chart-container ${className}`} ref={chartRef} style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '0.75rem',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        width: '100%',
        minWidth: '400px',
        maxWidth: '550px',
        margin: '0 auto'
      }}>
        <div className="chart-title-for-export" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '600', color: '#1f2937' }}>
            {title}
          </h3>
          {subtitle && <p style={{ margin: '0 0 0', fontSize: '0.9rem', color: '#6b7280' }}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
};

export default DynamicChart;
