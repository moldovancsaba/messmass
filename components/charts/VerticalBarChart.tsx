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
import { CHART_THEME } from '@/lib/chartTheme';

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

  /* WHAT: Measured Height Font Scaling (Layout Grammar Priority 5.1)
     WHY: Ensure axis labels and titles fit container without overflow
     HOW: measure container and adjust font scaling via CSS variable */
  const [fontSizeScale, setFontSizeScale] = React.useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const calculateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const { offsetHeight } = container;
      const targetHeight = offsetHeight;
      const baseExpectedHeight = height || 400;
      
      if (targetHeight < baseExpectedHeight) {
        setFontSizeScale(Math.max(0.6, targetHeight / baseExpectedHeight));
      } else {
        setFontSizeScale(1);
      }
    };

    const observer = new ResizeObserver(calculateScale);
    observer.observe(containerRef.current);
    calculateScale();

    return () => observer.disconnect();
  }, [height]);

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
          return CHART_THEME.fillPalette(index, 0.8);
        }),
        borderColor: filtered.map((item, index) => {
          // WHAT: Validate item.color before using
          // WHY: Prevent undefined from being returned to Chart.js
          if (item.color && typeof item.color === 'string' && item.color.trim()) return item.color;
          
          return CHART_THEME.linePalette(index);
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
          color: CHART_THEME.legendText,
          font: {
            size: 12,
            family: CHART_THEME.fontFamily,
            weight: 500,
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: CHART_THEME.tooltipBackground,
        titleColor: CHART_THEME.tooltipText,
        bodyColor: CHART_THEME.tooltipText,
        borderColor: CHART_THEME.tooltipBorder,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          /* What: Custom tooltip with value and percentage
             Why: More informative than just raw numbers */
          label: (context) => {
            const value = context.parsed.y ?? 0;
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
          color: CHART_THEME.axisText,
          font: {
            size: 12,
            family: CHART_THEME.fontFamily,
          },
          maxRotation: 45,
          minRotation: 0,
        },
        border: {
          display: true,
          color: CHART_THEME.axisBorder,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: CHART_THEME.gridLine,
          lineWidth: 1,
        },
        ticks: {
          color: CHART_THEME.axisText,
          font: {
            size: 12,
            family: CHART_THEME.fontFamily,
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
          color: CHART_THEME.axisBorder,
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


  const scaledOptions: ChartOptions<'bar'> = {
    ...options,
    scales: {
      ...options.scales,
      x: {
        ...options.scales?.x,
        ticks: {
          ...options.scales?.x?.ticks,
          font: {
            ...options.scales?.x?.ticks?.font,
            size: 12 * fontSizeScale
          }
        }
      },
      y: {
        ...options.scales?.y,
        ticks: {
          ...options.scales?.y?.ticks,
          font: {
            ...options.scales?.y?.ticks?.font,
            size: 12 * fontSizeScale
          }
        }
      }
    }
  };

  return (
    <ChartBase
      title={title}
      subtitle={subtitle}
      chartRef={chartRef}
      filename={filename}
      className={className}
    >
      <div 
        ref={containerRef}
        className={styles.barChartContainer} 
        // WHAT: Dynamic height from height prop
        // WHY: Chart height must be configurable per instance
        // eslint-disable-next-line react/forbid-dom-props
        style={{ 
          height: `${height}px`,
          ['--chart-font-scale' as string]: fontSizeScale.toString()
        } as React.CSSProperties}
      >
        <Bar ref={chartRef} data={chartData} options={scaledOptions} />
      </div>
    </ChartBase>
  );
}
