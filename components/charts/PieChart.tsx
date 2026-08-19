'use client';

import React, { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import ChartBase from './ChartBase';
import styles from './ChartShared.module.css';
import { CHART_THEME, createTopCenterTooltipHandler } from '@/lib/chartTheme';

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

  /* WHAT: Indices of segments the user hid via the HTML legend.
     WHY: The legend is real DOM now (long labels wrap instead of truncating
     at the canvas edge), so hide/show state lives in React and is applied
     to the chart with toggleDataVisibility - same behavior the canvas
     legend's onClick used to provide. */
  const [hiddenSegments, setHiddenSegments] = React.useState<ReadonlySet<number>>(new Set());

  const toggleSegment = (index: number) => {
    const chart = chartRef.current;
    if (chart) {
      chart.toggleDataVisibility(index);
      chart.update();
    }
    setHiddenSegments(previous => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

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

  /* WHAT: Measured Height Font Scaling (Layout Grammar Priority 5.1)
     WHY: Ensure legend and titles fit container without overflow
     HOW: measure container and adjust font scaling via CSS variable */
  const [fontSizeScale, setFontSizeScale] = React.useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const calculateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const { offsetHeight } = container;
      // Pie chart legend scaling: targets approx 20-30% of height for legend
      const targetHeight = offsetHeight;
      const baseExpectedHeight = height || 400;
      
      if (targetHeight < baseExpectedHeight) {
        setFontSizeScale(Math.max(0.7, targetHeight / baseExpectedHeight));
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

  /* WHAT: Resolve a segment's color the same way for the chart and the legend.
     WHY: The HTML legend below must show exactly the slice colors. */
  const segmentColor = (item: PieChartData, index: number) =>
    item.color && typeof item.color === 'string' && item.color.trim()
      ? item.color
      : CHART_THEME.fillPalette(index, 0.9);

  /* What: Prepare chart data in Chart.js format
     Why: Chart.js requires specific data structure for pie/donut charts */
  const chartData = {
    labels: filtered.map(item => item.label),
    datasets: [
      {
        label: title,
        data: filtered.map(item => item.value),
        backgroundColor: filtered.map((item, index) => segmentColor(item, index)),
        borderColor: CHART_THEME.tooltipText,
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
        /* What: The canvas-drawn legend is fully replaced by an HTML legend
           rendered next to the canvas (see the list below in JSX).
           Why: Chart.js paints legend text on the canvas, so long labels
           ("Refused Images (unw…") truncate at the canvas edge - the same
           physical constraint that clipped tooltips (fixed in v12.1.94).
           Real DOM wraps via CSS, stays clickable, and is readable by
           screen readers, which the canvas legend never was. */
        display: false,
      },
      tooltip: {
        /* What: Overlay info rendered into a fixed top-center HTML bubble
           (createTopCenterTooltipHandler) instead of the canvas-drawn box.
           Why: Canvas tooltips physically clip at the canvas edge - long
           labels ("Refused Images (unwanted content detected)") got cut
           mid-word twice in production. The HTML bubble wraps via CSS up to
           the full container width, so no label can ever be clipped. */
        enabled: false,
        external: createTopCenterTooltipHandler(styles.chartTooltipBubble),
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (context) => {
            const value = context.parsed as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

            if (showPercentageInTooltip) {
              return `${value.toLocaleString()} (${percentage}%)`;
            } else {
              return value.toLocaleString();
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
      <div
        ref={containerRef}
        className={`${styles.pieChartContainer} ${
          legendPosition === 'top' || legendPosition === 'bottom'
            ? styles.legendBottom
            : styles.legendRight
        }`}
        // WHAT: Dynamic height from height prop
        // WHY: Chart height must be configurable per instance
        // eslint-disable-next-line react/forbid-dom-props
        style={{
          height: `${height}px`,
          ['--chart-font-scale' as string]: fontSizeScale.toString()
        } as React.CSSProperties}
      >
        {/* WHAT: The canvas gets its own positioned wrapper.
            WHY: The top-center tooltip bubble anchors to the canvas's parent
            element, which must stay the chart area (not chart+legend). */}
        <div className={styles.pieCanvasWrap}>
          <Doughnut ref={chartRef} data={chartData} options={options} />
        </div>
        {showLegend && (
          /* WHAT: HTML legend replacing the canvas-drawn one.
             WHY: Canvas legend text truncates at the canvas edge
             ("Refused Images (unw…") - real DOM wraps via CSS, keeps
             click-to-hide, and is readable by assistive tech. */
          <ul className={styles.chartLegend}>
            {filtered.map((item, index) => {
              const percentage = total > 0 ? (((item.value as number) / total) * 100).toFixed(1) : '0.0';
              const isHidden = hiddenSegments.has(index);
              return (
                <li key={`${item.label}-${index}`}>
                  <button
                    type="button"
                    className={styles.chartLegendItem}
                    data-hidden={isHidden ? 'true' : 'false'}
                    aria-pressed={!isHidden}
                    onClick={() => toggleSegment(index)}
                  >
                    <i
                      aria-hidden="true"
                      // WHAT: Swatch color is per-segment data, not design.
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{ backgroundColor: segmentColor(item, index) }}
                    />
                    <span>{`${item.label}: ${percentage}%`}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ChartBase>
  );
}
