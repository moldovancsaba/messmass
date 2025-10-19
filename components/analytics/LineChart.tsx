'use client';

/**
 * LineChart Component
 * 
 * WHAT: Time-series line chart for trend visualization
 * WHY: Display analytics metrics over time (fans, revenue, engagement)
 * HOW: Chart.js Line chart with gradient fills and trend lines
 * 
 * Features:
 * - Multiple datasets support
 * - Gradient area fills
 * - Interactive tooltips with formatting
 * - Responsive sizing
 * - Export to PNG
 * 
 * Version: 6.28.0 (Phase 3 - Dashboards)
 * Created: 2025-10-19T13:10:00.000Z
 */

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartBase from '../charts/ChartBase';

// WHAT: Register Chart.js components for line charts
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface LineChartDataPoint {
  label: string; // X-axis label (date, event name, etc.)
  value: number; // Y-axis value
}

export interface LineChartDataset {
  label: string; // Dataset name
  data: LineChartDataPoint[];
  color?: string; // Line color (defaults to blue)
  fill?: boolean; // Fill area under line
  dashed?: boolean; // Dashed line style
}

interface LineChartProps {
  title: string;
  subtitle?: string;
  datasets: LineChartDataset[];
  filename?: string;
  height?: number;
  showLegend?: boolean;
  yAxisLabel?: string;
  formatValue?: (value: number) => string; // Custom value formatter
}

/**
 * WHAT: Create gradient fill for area under line
 * WHY: Professional look with subtle color gradients
 */
function createGradient(ctx: CanvasRenderingContext2D, color: string): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, `${color}00`); // Transparent
  return gradient;
}

export default function LineChart({
  title,
  subtitle,
  datasets,
  filename = 'line-chart',
  height = 400,
  showLegend = true,
  yAxisLabel,
  formatValue = (v) => v.toLocaleString(),
}: LineChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  /* WHAT: Validate datasets before rendering
     WHY: Prevent crashes from empty, null, or invalid data
     HOW: Check if datasets exist and have valid data points */
  const isDatasetsValid = datasets && Array.isArray(datasets) && datasets.length > 0;
  const hasValidData = isDatasetsValid && datasets.some(dataset => 
    dataset.data && 
    Array.isArray(dataset.data) && 
    dataset.data.length > 0 &&
    dataset.data.some(point => typeof point.value === 'number' && !isNaN(point.value))
  );

  /* WHAT: Show "Insufficient Data" state if data is invalid
     WHY: Provide clear feedback instead of rendering broken chart */
  if (!isDatasetsValid || !hasValidData) {
    return (
      <ChartBase
        title={title}
        subtitle={subtitle || 'No data available'}
        chartRef={chartRef}
        filename={filename}
        height={height}
        showExport={false}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--mm-gray-500)',
          gap: 'var(--mm-space-3)'
        }}>
          <div style={{ fontSize: '48px', opacity: 0.5 }}>📈</div>
          <div style={{ fontSize: '16px', fontWeight: 500 }}>Insufficient Data</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>Chart requires at least one dataset with valid data points</div>
        </div>
      </ChartBase>
    );
  }

  // WHAT: Extract labels from first dataset (all datasets share same x-axis)
  const labels = datasets[0]?.data.map(d => d.label) || [];

  // WHAT: Transform datasets into Chart.js format
  const chartData = {
    labels,
    datasets: datasets.map((dataset, index) => {
      const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const color = dataset.color || defaultColors[index % defaultColors.length];

      return {
        label: dataset.label,
        data: dataset.data.map(d => d.value),
        borderColor: color,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx } = chart;
          return dataset.fill ? createGradient(ctx, color) : 'transparent';
        },
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4, // Smooth curves
        fill: dataset.fill !== false, // Fill by default
        borderDash: dataset.dashed ? [5, 5] : [],
      };
    }),
  };

  // WHAT: Chart configuration options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatValue(context.parsed.y);
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: (value) => formatValue(Number(value)),
        },
        title: yAxisLabel
          ? {
              display: true,
              text: yAxisLabel,
              font: {
                size: 12,
                weight: 'bold',
              },
            }
          : undefined,
      },
    },
  };

  return (
    <ChartBase
      title={title}
      subtitle={subtitle}
      chartRef={chartRef}
      filename={filename}
    >
      <div style={{ height: `${height}px` }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </ChartBase>
  );
}
