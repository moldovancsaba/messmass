/* WHAT: Live Report Style Preview Component
 * WHY: Show real-time visual feedback of style changes
 * HOW: Mini report with all chart types using injected CSS variables */

'use client';

import React, { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { ReportStyle } from '@/lib/reportStyleTypes';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './ReportStylePreview.module.css';

// Register Chart.js components for pie charts
ChartJS.register(ArcElement, Tooltip, Legend);

interface ReportStylePreviewProps {
  style: ReportStyle;
}

/**
 * PieChartPreview - Matches real report pie chart implementation
 */
function PieChartPreview() {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);
  
  // WHAT: Read pie colors from CSS variables (same as real report)
  const getPieColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const c1 = cs.getPropertyValue('--pieColor1').trim() || '#3b82f6';
    const c2 = cs.getPropertyValue('--pieColor2').trim() || '#10b981';
    return [c1, c2];
  };
  
  // WHAT: Read pie border color from CSS variables
  const getPieBorderColor = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const pieColors = getPieColors();
    return cs.getPropertyValue('--pieBorderColor').trim() || pieColors[0];
  };
  
  const pieColors = getPieColors();
  const pieBorderColor = getPieBorderColor();
  const sampleData = [
    { label: 'Remote', value: 1274 },
    { label: 'Stadium', value: 1273 }
  ];
  const total = sampleData.reduce((sum, d) => sum + d.value, 0);
  
  // Prepare Chart.js data (same structure as ReportChart.tsx)
  const chartData = {
    labels: sampleData.map(d => d.label),
    datasets: [{
      label: 'Fan Distribution',
      data: sampleData.map(d => d.value),
      backgroundColor: pieColors,
      borderColor: pieBorderColor,
      borderWidth: 2,
      hoverOffset: 6
    }]
  };
  
  // WHAT: Read tooltip colors from CSS variables
  const getTooltipColors = () => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    return {
      bg: cs.getPropertyValue('--chartTooltipBackground').trim() || 'rgba(31, 41, 55, 0.95)',
      text: cs.getPropertyValue('--chartTooltipText').trim() || '#ffffff'
    };
  };
  const tooltipColors = getTooltipColors();
  
  // Chart.js options (same as ReportChart.tsx)
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    layout: {
      padding: 10
    },
    plugins: {
      legend: {
        display: false // Use custom HTML legend
      },
      tooltip: {
        enabled: true,
        backgroundColor: tooltipColors.bg,
        titleColor: tooltipColors.text,
        bodyColor: tooltipColors.text,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };
  
  return (
    <div className={styles.chart}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>Fan Distribution</div>
      </div>
      <div className={styles.chartBody}>
        <div className={styles.pieContent}>
          {/* Pie chart container - 70% of body */}
          <div className={styles.pieChartContainer}>
            <Doughnut ref={chartRef} data={chartData} options={options} />
          </div>
          {/* Custom legend - 30% of body */}
          <div className={styles.pieLegend}>
            {sampleData.map((item, idx) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
              const color = pieColors[idx % pieColors.length];
              
              return (
                <div key={idx} className={styles.pieLegendItem}>
                  <div 
                    className={styles.pieLegendDot}
                    // eslint-disable-next-line react/forbid-dom-props
                    style={{ 
                      backgroundColor: color,
                      border: `2px solid ${pieColors[0]}` // WHAT: Use first pie color as border (matches real chart)
                    }}
                  />
                  <span>{item.label}: {percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ReportStylePreview
 * 
 * WHAT: Miniature report showing all chart types with current style
 * WHY: User needs visual feedback while editing colors
 * HOW: Sample hero + KPI + Bar + Pie charts using CSS variables
 */
export default function ReportStylePreview({ style }: ReportStylePreviewProps) {
  return (
    <div className={styles.preview}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroInfo}>
            <span className={styles.heroEmoji}>⚽</span>
            <div>
              <h1 className={styles.heroTitle}>Sample Event</h1>
              <p className={styles.heroDate}>December 22, 2025</p>
            </div>
          </div>
          <button className={styles.exportButton}>
            📄 Export
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* KPI Chart */}
        <div className={styles.chart}>
          <div className={styles.chartBody}>
            <div className={styles.kpiContent}>
              <MaterialIcon name="people" variant="outlined" className={styles.kpiIcon} />
              <div className={styles.kpiValue}>2,547</div>
              <div className={styles.kpiLabel}>Total Fans</div>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className={styles.chart}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Demographics</div>
          </div>
          <div className={styles.chartBody}>
            <div className={styles.barElements}>
              {[
                { label: 'Gen Z', value: 85, color: 'var(--barColor1)' },
                { label: 'Gen Alpha', value: 70, color: 'var(--barColor2)' },
                { label: 'Millennials', value: 65, color: 'var(--barColor3)' },
                { label: 'Gen X', value: 45, color: 'var(--barColor4)' },
                { label: 'Boomers', value: 30, color: 'var(--barColor5)' },
              ].map((item, idx) => (
                <div key={idx} className={styles.barRow}>
                  <div className={styles.barLabel}>{item.label}</div>
                  <div className={styles.barTrack}>
                    <div 
                      className={styles.barFill}
                      // eslint-disable-next-line react/forbid-dom-props
                      style={{ 
                        width: `${item.value}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                  <div className={styles.barValue}>{item.value}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie Chart - Using actual Chart.js Doughnut component */}
        <PieChartPreview />

        {/* TEXT Chart */}
        <div className={styles.chart}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Event Summary</div>
          </div>
          <div className={styles.chartBody}>
            <p className={styles.textContent}>
              This is a sample text block showing how report text appears with the current style settings. Text charts use chartValueColor for body text.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
