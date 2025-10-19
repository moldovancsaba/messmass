'use client';

import React, { ReactNode } from 'react';
import { useChartExport } from '@/hooks/useChartExport';
import type { Chart as ChartJS } from 'chart.js';
import styles from './ChartBase.module.css';

/* What: Base wrapper component for all charts
   Why: Consistent layout, title area, and export functionality
   
   Usage:
   <ChartBase
     title="Revenue Over Time"
     subtitle="Last 12 months"
     chartRef={chartRef}
     filename="revenue-chart"
   >
     <Bar ref={chartRef} data={data} options={options} />
   </ChartBase>
*/

interface ChartBaseProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  chartRef: React.RefObject<ChartJS>;
  filename?: string;
  showExport?: boolean;
  className?: string;
  height?: number; // WHAT: Optional chart container height in pixels; WHY: Allow custom chart heights for different layouts
}

export default function ChartBase({
  title,
  subtitle,
  children,
  chartRef,
  filename = 'chart',
  showExport = true,
  className = '',
  height,
}: ChartBaseProps) {
  const { exportChartAsPNG, copyChartToClipboard } = useChartExport();

  /* What: Handle PNG export
     Why: Download chart as image file */
  const handleExport = () => {
    if (chartRef.current) {
      exportChartAsPNG(chartRef.current, filename);
    }
  };

  /* What: Handle clipboard copy
     Why: Quick sharing without file download */
  const handleCopy = () => {
    if (chartRef.current) {
      copyChartToClipboard(chartRef.current);
    }
  };

  return (
    <div className={`${styles.chartBase} ${className}`}>
      {/* What: Chart header with title and export actions
         Why: Clear labeling and export functionality */}
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleSection}>
          <h3 className={styles.chartTitle}>{title}</h3>
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>

        {/* What: Export buttons
           Why: Allow users to save or copy chart */}
        {showExport && (
          <div className={styles.chartActions}>
            <button
              onClick={handleCopy}
              className={styles.actionButton}
              title="Copy to clipboard"
              aria-label="Copy chart to clipboard"
            >
              📋
            </button>
            <button
              onClick={handleExport}
              className={styles.actionButton}
              title="Download as PNG"
              aria-label="Download chart as PNG"
            >
              💾
            </button>
          </div>
        )}
      </div>

      {/* What: Chart content area
         Why: Render the actual chart component */}
      <div 
        className={styles.chartContent}
        style={height ? { height: `${height}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
