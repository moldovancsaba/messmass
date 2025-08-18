'use client';

import React from 'react';
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

  const barsWithLegend = result.elements.map((element) => {
    const value = element.value;
    const isValid = typeof value === 'number';
    const barWidth = isValid ? ((value as number) / maxValue) * 100 : 0;
    
    return (
      <div key={element.id} className="bar-row">
        <div className="bar-container">
          <div 
            className="bar-fill" 
            style={{ 
              width: `${barWidth}%`, 
              backgroundColor: element.color 
            }}
          />
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: element.color }}></div>
          <span>{element.label}: {isValid ? formatChartValue(value as number) : 'N/A'}</span>
        </div>
      </div>
    );
  });

  // Format total value with currency if it looks like money
  const formatTotal = (total: number | 'NA') => {
    if (total === 'NA') return 'N/A';
    // If it's a large number, format as currency
    if (total > 1000) {
      return `€${total.toLocaleString()}`;
    }
    return total.toString();
  };

  return (
    <div className={className}>
      {result.total !== undefined && (
        <div className="chart-total-top">
          <div className="chart-total-value">
            {formatTotal(result.total)}
          </div>
          <div className="chart-total-label">
            {result.totalLabel || 'Total'}
          </div>
        </div>
      )}
      <div className="bar-chart-large">
        {barsWithLegend}
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
  return (
    <div className={`chart-container ${className}`}>
      <div className="chart-header">
        <h3 className="chart-title">
          {title}
        </h3>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
};

export default DynamicChart;
