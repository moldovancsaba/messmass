'use client';

import React, { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  LegendItem,
} from 'chart.js';
import ChartBase from './ChartBase';
import styles from './ChartShared.module.css';

/* What: Register Chart.js components for pie/donut charts
   Why: Chart.js requires explicit registration of components to reduce bundle size */
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

/* What: Pie/Donut chart component with modern styling
   Why: Display proportional data with clean, professional appearance
   
   Features:
   - Configurable as pie (0% cutout) or donut (50%+ cutout)
   - Interactive legend with click-to-hide segments
   - Tooltips with value and percentage
   - Responsive sizing
   - TailAdmin V2 color scheme
   - Export to PNG via ChartBase */

export interface PieChartData {
  label: string;
  value: number;
  color?: string; // Optional custom color
}

interface PieChartProps {
  title: string;
  subtitle?: string;
  data: PieChartData[];
  filename?: string;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  cutout?: string; // e.g., '0%' for pie, '60%' for donut
  height?: number;
  className?: string;
  showPercentageInTooltip?: boolean;
}

export default function PieChart({
  title,
  subtitle,
  data,
  filename = 'pie-chart',
  showLegend = true,
  legendPosition = 'right',
  cutout = '50%', // Default to donut style
  height = 400,
  className,
  showPercentageInTooltip = true,
}: PieChartProps) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);

  /* WHAT: Validate data before rendering
     WHY: Prevent crashes from empty, null, or invalid data
     HOW: Check if data exists and has valid numeric values */
  const isDataValid = data && Array.isArray(data) && data.length > 0;
  const hasValidValues = isDataValid && data.some(item => 
    typeof item.value === 'number' && !isNaN(item.value) && item.value > 0
  );

  /* WHAT: Filter out zero or invalid values to avoid cluttered legends
     WHY: Hide entries like "Remote: 0 (0.0%)" */
  const filtered = isDataValid ? data.filter(item => typeof item.value === 'number' && !isNaN(item.value) && item.value > 0) : [];

  /* WHAT: Calculate total for percentage display using filtered data
     WHY: Show relative proportions in tooltips and legend */
  const total = filtered.length > 0 ? filtered.reduce((sum, item) => sum + (item.value as number), 0) : 0;

  /* WHAT: Show "Insufficient Data" state if data is invalid
     WHY: Provide clear feedback instead of rendering broken chart */
  if (!isDataValid || !hasValidValues || total === 0) {
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
     Why: Chart.js requires specific data structure for pie/donut charts */
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
          
          // Cycle through theme chart colors with full opacity for pie charts
          const colors = [
            'rgba(59, 130, 246, 0.9)',   // --mm-chart-blue
            'rgba(16, 185, 129, 0.9)',   // --mm-chart-green
            'rgba(139, 92, 246, 0.9)',   // --mm-chart-purple
            'rgba(249, 115, 22, 0.9)',   // --mm-chart-orange
            'rgba(236, 72, 153, 0.9)',   // --mm-chart-pink
            'rgba(6, 182, 212, 0.9)',    // --mm-chart-cyan
            'rgba(234, 179, 8, 0.9)',    // --mm-chart-yellow
            'rgba(239, 68, 68, 0.9)',    // --mm-chart-red
            'rgba(99, 102, 241, 0.9)',   // --mm-chart-indigo
            'rgba(20, 184, 166, 0.9)',   // --mm-chart-teal
          ];
          return colors[index % colors.length];
        }),
        borderColor: 'rgba(255, 255, 255, 1)', // White borders for clean separation
        borderWidth: 2,
        hoverOffset: 8, // Slight pop-out effect on hover
      },
    ],
  };

  /* What: Chart configuration options
     Why: Control appearance and behavior */
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout, // Controls pie vs donut style
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        labels: {
          color: 'rgb(75, 85, 99)', // --mm-gray-600
          font: {
            size: 13,
            family: 'inherit',
            weight: 500,
          },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: (chart) => {
            /* What: Custom legend labels with percentages
               Why: Show both label and percentage in legend for better readability */
            const datasets = chart.data.datasets;
            const labels = chart.data.labels || [];
            
            if (!datasets.length || !datasets[0].data.length) {
              return [];
            }

            return labels.map((label, index) => {
              const value = datasets[0].data[index] as number;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              const backgroundColor = datasets[0].backgroundColor as string[];
              
              return {
                text: `${label}: ${percentage}%`,
                fillStyle: backgroundColor[index],
                strokeStyle: backgroundColor[index],
                lineWidth: 0,
                hidden: false,
                index,
                pointStyle: 'circle' as const,
              } as LegendItem;
            });
          },
        },
        onClick: (e, legendItem, legend) => {
          /* What: Toggle segment visibility on legend click
             Why: Allow users to hide/show specific segments for better analysis */
          const index = legendItem.index;
          const chart = legend.chart;
          
          if (index !== undefined) {
            chart.toggleDataVisibility(index);
            chart.update();
          }
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
            const label = context.label || '';
            const value = context.parsed as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            
            if (showPercentageInTooltip) {
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            } else {
              return `${label}: ${value.toLocaleString()}`;
            }
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 750,
      easing: 'easeInOutQuart',
    },
    /* What: Interaction modes
       Why: Highlight the segment being hovered for better UX */
    interaction: {
      mode: 'nearest',
      intersect: true,
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
      <div className={styles.pieChartContainer} style={{ height: `${height}px` }}>
        <Doughnut ref={chartRef} data={chartData} options={options} />
      </div>
    </ChartBase>
  );
}
