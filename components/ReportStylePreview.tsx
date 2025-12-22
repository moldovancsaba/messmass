/* WHAT: Live Report Style Preview Component
 * WHY: Show real-time visual feedback of style changes
 * HOW: Mini report with all chart types using injected CSS variables */

'use client';

import React from 'react';
import { ReportStyle } from '@/lib/reportStyleTypes';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './ReportStylePreview.module.css';

interface ReportStylePreviewProps {
  style: ReportStyle;
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

        {/* Pie Chart */}
        <div className={styles.chart}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>Fan Distribution</div>
          </div>
          <div className={styles.chartBody}>
            <div className={styles.pieContent}>
              <svg className={styles.pieSvg} viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="var(--pieColor1)"
                  stroke="var(--pieBorderColor)"
                  strokeWidth="2"
                  strokeDasharray="110 220"
                  transform="rotate(-90 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="var(--pieColor2)"
                  stroke="var(--pieBorderColor)"
                  strokeWidth="2"
                  strokeDasharray="110 220"
                  strokeDashoffset="-110"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className={styles.pieLegend}>
                <div className={styles.pieLegendItem}>
                  <div 
                    className={styles.pieLegendDot} 
                    style={{ 
                      backgroundColor: 'var(--pieColor1)',
                      border: '2px solid var(--pieBorderColor)'
                    }}
                  />
                  <span>Remote: 50%</span>
                </div>
                <div className={styles.pieLegendItem}>
                  <div 
                    className={styles.pieLegendDot} 
                    style={{ 
                      backgroundColor: 'var(--pieColor2)',
                      border: '2px solid var(--pieBorderColor)'
                    }}
                  />
                  <span>Stadium: 50%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
