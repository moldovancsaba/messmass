'use client';

import React, { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartOptions,
} from 'chart.js';
import styles from './KPICard.module.css';

/* What: Register Chart.js components for sparkline
   Why: Chart.js requires explicit registration to reduce bundle size */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

/* What: KPI Card component for displaying key metrics
   Why: Provide a consistent, professional way to show important statistics
   
   Features:
   - Large, prominent number display
   - Trend indicator with arrow and percentage change
   - Optional mini sparkline chart
   - Color-coded trends (green=up, red=down, gray=neutral)
   - TailAdmin V2 flat design
   - Responsive sizing */

export interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number; // Percentage change (e.g., 12.5 for +12.5%)
    direction?: 'up' | 'down' | 'neutral';
  };
  sparklineData?: number[]; // Array of values for mini chart
  format?: 'number' | 'currency' | 'percentage' | 'custom';
  prefix?: string; // e.g., "$" for currency
  suffix?: string; // e.g., "%" for percentage
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  sparklineData,
  format = 'number',
  prefix,
  suffix,
  color = 'primary',
  size = 'md',
  className,
}: KPICardProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  /* WHAT: Validate value before rendering
     WHY: Handle missing, null, undefined, or 'NA' values gracefully
     HOW: Check for valid numeric or string value */
  const isValueValid = value !== null && value !== undefined && value !== 'NA' && value !== '';
  const isNumericValue = typeof value === 'number' && !isNaN(value);

  /* What: Format the value based on type
     Why: Different metrics need different formatting */
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    // WHAT: Handle invalid numeric values
    // WHY: Prevent NaN or Infinity from being displayed
    if (isNaN(val) || !isFinite(val)) return 'N/A';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  /* What: Determine trend direction if not explicitly set
     Why: Auto-detect positive/negative based on value */
  const getTrendDirection = (): 'up' | 'down' | 'neutral' => {
    if (!trend) return 'neutral';
    if (trend.direction) return trend.direction;
    if (trend.value > 0) return 'up';
    if (trend.value < 0) return 'down';
    return 'neutral';
  };

  const trendDirection = getTrendDirection();

  /* What: Get color for trend indicator
     Why: Visual feedback for positive/negative changes */
  const getTrendColor = (): string => {
    switch (trendDirection) {
      case 'up':
        return 'var(--mm-success)'; // Green
      case 'down':
        return 'var(--mm-error)'; // Red
      default:
        return 'var(--mm-gray-500)'; // Gray
    }
  };

  /* What: Get arrow icon for trend
     Why: Visual indicator of direction */
  const getTrendIcon = (): string => {
    switch (trendDirection) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  /* What: Prepare sparkline chart data
     Why: Chart.js requires specific data structure */
  const sparklineChartData = sparklineData
    ? {
        labels: sparklineData.map((_, i) => i.toString()),
        datasets: [
          {
            data: sparklineData,
            // WHAT: Validate color before using in CSS variable
            // WHY: Prevent undefined from creating invalid CSS variable names
            borderColor: (color && typeof color === 'string') ? `var(--mm-color-${color}-500)` : 'var(--mm-color-primary-500)',
            backgroundColor: (color && typeof color === 'string') ? `var(--mm-color-${color}-100)` : 'var(--mm-color-primary-100)',
            borderWidth: 2,
            fill: true,
            tension: 0.4, // Smooth curves
            pointRadius: 0, // No dots, just line
            pointHoverRadius: 0,
          },
        ],
      }
    : null;

  /* What: Sparkline chart options
     Why: Minimal, clean sparkline without axes or labels */
  const sparklineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
  };

  /* What: Determine card size classes
     Why: Responsive sizing options */
  const sizeClass = {
    sm: styles.sizeSmall,
    md: styles.sizeMedium,
    lg: styles.sizeLarge,
  }[size];

  /* What: Determine color accent class
     Why: Visual hierarchy for different metric types */
  const colorClass = {
    primary: styles.colorPrimary,
    secondary: styles.colorSecondary,
    success: styles.colorSuccess,
    warning: styles.colorWarning,
    error: styles.colorError,
    info: styles.colorInfo,
  }[color];

  /* WHAT: Handle invalid value display
     WHY: Show 'N/A' instead of empty or broken state */
  const formattedValue = isValueValid ? formatValue(value) : 'N/A';
  const displayValue = `${prefix || ''}${formattedValue}${suffix || ''}`;

  /* WHAT: Validate sparkline data if provided
     WHY: Prevent chart crashes from invalid sparkline arrays */
  const hasValidSparkline = sparklineData && 
    Array.isArray(sparklineData) && 
    sparklineData.length > 0 &&
    sparklineData.some(val => typeof val === 'number' && !isNaN(val));

  return (
    <div className={`${styles.kpiCard} ${sizeClass} ${colorClass} ${className || ''}`}>
      {/* What: Top section with title and optional subtitle
          Why: Context for the metric */}
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {/* What: Main content area with value and trend
          Why: Primary focus on the key metric */}
      <div className={styles.content}>
        <div className={styles.valueSection}>
          <p className={styles.value}>{displayValue}</p>
          
          {/* What: Trend indicator
              Why: Show change over time */}
          {trend && (
            <div className={styles.trend} style={{ ['--trend-color' as string]: getTrendColor() } as React.CSSProperties}>
              <span className={styles.trendIcon}>{getTrendIcon()}</span>
              <span className={styles.trendValue}>
                {Math.abs(trend.value).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* What: Optional sparkline chart
            Why: Visual representation of trend over time */}
        {hasValidSparkline && sparklineChartData && (
          <div className={styles.sparkline}>
            <Line
              ref={chartRef}
              data={sparklineChartData}
              options={sparklineOptions}
            />
          </div>
        )}
      </div>
    </div>
  );
}
