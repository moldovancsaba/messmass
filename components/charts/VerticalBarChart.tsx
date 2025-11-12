'use client';

import React, { useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import ChartBase from './ChartBase';
import styles from './ChartShared.module.css';

/* What: Register Chart.js components
   Why: Chart.js requires explicit registration of components to reduce bundle size */
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/* What: Vertical bar chart component with modern styling
   Why: Display categorical data with clean, professional appearance
   
   Features:
   - Rounded top corners on bars
   - Tooltips with value and percentage
   - Responsive sizing
   - TailAdmin V2 color scheme
   - Export to PNG via ChartBase */

export interface VerticalBarChartData {
  label: string;
  value: number;
  color?: string; // Optional custom color
}

interface VerticalBarChartProps {
  title: string;
  subtitle?: string;
  data: VerticalBarChartData[];
  filename?: string;
  showLegend?: boolean;
  showValues?: boolean; // Show values on top of bars
  height?: number;
  className?: string;
}

export default function VerticalBarChart({
  title,
  subtitle,
  data,
  filename = 'bar-chart',
  showLegend = false,
  showValues = true,
  height = 400,
  className,
}: VerticalBarChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  /* WHAT: Validate data before rendering
     WHY: Prevent crashes from empty, null, or invalid data
     HOW: Check if data exists and has valid numeric values */
  const isDataValid = data && Array.isArray(data) && data.length > 0;
  const hasValidValues = isDataValid && data.some(item => 
    typeof item.value === 'number' && !isNaN(item.value) && item.value > 0
  );

  /* WHAT: Filter out zero or invalid values to avoid clutter
     WHY: Hide entries with value 0 from bars and legend */
  const filtered = isDataValid ? data.filter(item => typeof item.value === 'number' && !isNaN(item.value) && item.value > 0) : [];

  /* WHAT: Calculate total for percentage display
     Why: Show relative proportions in tooltips */
  const total = filtered.length > 0 ? filtered.reduce((sum, item) => sum + (item.value as number), 0) : 0;

  /* WHAT: Show "Insufficient Data" state if data is invalid
     WHY: Provide clear feedback instead of rendering broken chart */
  if (!isDataValid || !hasValidValues || filtered.length === 0) {
    return (
      <ChartBase
        title={title}
        subtitle={subtitle || 'No data available'}
        chartRef={chartRef}
        filename={filename}
        className={className}
        height={height}
        showExport={false}
      >
        <div className={styles.insufficientData}>
          <div className={styles.insufficientDataIcon}>📊</div>
          <div className={styles.insufficientDataTitle}>Insufficient Data</div>
          <div className={styles.insufficientDataDescription}>Chart requires at least one valid data point</div>
        </div>
      </ChartBase>
    );
  }

  /* What: Prepare chart data in Chart.js format
     Why: Chart.js requires specific data structure */
  const chartData = {
    labels: filtered.map(item => item.label),
    datasets: [
      {
        label: title,
        data: filtered.map(item => item.value),
        backgroundColor: filtered.map((item, index) => {
          /* What: Use custom color or fall back to theme colors
             Why: Allow chart-specific colors while maintaining consistency */
          // WHAT: Validate item.color before using
          // WHY: Prevent undefined from being returned to Chart.js
          if (item.color && typeof item.color === 'string' && item.color.trim()) return item.color;
          
          // Cycle through theme chart colors
          const colors = [
            'rgba(59, 130, 246, 0.8)',   // --mm-chart-blue
            'rgba(16, 185, 129, 0.8)',   // --mm-chart-green
            'rgba(139, 92, 246, 0.8)',   // --mm-chart-purple
            'rgba(249, 115, 22, 0.8)',   // --mm-chart-orange
            'rgba(236, 72, 153, 0.8)',   // --mm-chart-pink
            'rgba(6, 182, 212, 0.8)',    // --mm-chart-cyan
            'rgba(234, 179, 8, 0.8)',    // --mm-chart-yellow
            'rgba(239, 68, 68, 0.8)',    // --mm-chart-red
            'rgba(99, 102, 241, 0.8)',   // --mm-chart-indigo
            'rgba(20, 184, 166, 0.8)',   // --mm-chart-teal
          ];
          return colors[index % colors.length];
        }),
        borderColor: filtered.map((item, index) => {
          // WHAT: Validate item.color before using
          // WHY: Prevent undefined from being returned to Chart.js
          if (item.color && typeof item.color === 'string' && item.color.trim()) return item.color;
          
          const colors = [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(139, 92, 246)',
            'rgb(249, 115, 22)',
            'rgb(236, 72, 153)',
            'rgb(6, 182, 212)',
            'rgb(234, 179, 8)',
            'rgb(239, 68, 68)',
            'rgb(99, 102, 241)',
            'rgb(20, 184, 166)',
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 2,
        borderRadius: 8, // Rounded top corners
        borderSkipped: false,
      },
    ],
  };

  /* What: Chart configuration options
     Why: Control appearance and behavior */
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          color: 'rgb(75, 85, 99)', // --mm-gray-600
          font: {
            size: 12,
            family: 'inherit',
            weight: 500,
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(31, 41, 55, 0.95)', // --mm-gray-800 with opacity
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
        borderColor: 'rgb(209, 213, 219)', // --mm-gray-300
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          /* What: Custom tooltip with value and percentage
             Why: More informative than just raw numbers */
          label: (context) => {
            const value = context.parsed.y;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Clean look without vertical grid lines
        },
        ticks: {
          color: 'rgb(107, 114, 128)', // --mm-gray-500
          font: {
            size: 12,
            family: 'inherit',
          },
          maxRotation: 45,
          minRotation: 0,
        },
        border: {
          display: true,
          color: 'rgb(229, 231, 235)', // --mm-gray-200
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)', // --mm-gray-200 with opacity
          lineWidth: 1,
        },
        ticks: {
          color: 'rgb(107, 114, 128)', // --mm-gray-500
          font: {
            size: 12,
            family: 'inherit',
          },
          callback: (value) => {
            /* What: Format large numbers with K/M suffixes
               Why: Better readability for large values */
            const num = typeof value === 'number' ? value : parseFloat(value as string);
            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
            return num.toString();
          },
        },
        border: {
          display: true,
          color: 'rgb(229, 231, 235)', // --mm-gray-200
        },
      },
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    },
  };

  /* What: Show empty state if no data
     Why: Better UX than blank chart */
  if (!data || data.length === 0) {
    return (
      <div className={`${className} ${styles.emptyState}`}>
        <p className={styles.emptyStateMessage}>No data available for chart</p>
      </div>
    );
  }

  return (
    <ChartBase
      title={title}
      subtitle={subtitle}
      chartRef={chartRef}
      filename={filename}
      className={className}
    >
      <div className={styles.barChartContainer} style={{ height: `${height}px` }}>
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>
    </ChartBase>
  );
}
