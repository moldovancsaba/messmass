'use client';

/**
 * Landing KPI Chart — uses the same layout and design as reporting KPI (ReportChart KPIChart).
 * WHAT: 3-row grid (icon 40% → value 30% → title 30%) with ReportChart.module.css
 * WHY: Landing cards must match reporting KPI Chart layout and design per layout grammar
 */
import React from 'react';
import MaterialIcon from '@/components/MaterialIcon';
import reportChartStyles from '@/app/report/[slug]/ReportChart.module.css';
import styles from './LandingKPIChart.module.css';

export interface LandingKPIChartProps {
  title: string;
  value: string;
  icon?: string;
  /** CSS color for icon and optional left accent (e.g. var(--mm-color-primary-500)) */
  accentColor?: string;
}

export default function LandingKPIChart({
  title,
  value,
  icon,
  accentColor = 'var(--mm-color-primary-500)',
}: LandingKPIChartProps) {
  const hasIcon = !!icon;
  const chartClass = hasIcon
    ? `${reportChartStyles.chart} ${reportChartStyles.kpi}`
    : `${reportChartStyles.chart} ${reportChartStyles.kpi} ${reportChartStyles.kpiNoIcon}`;

  return (
    <div
      className={styles.wrapper}
      style={
        {
          '--block-height': '200px',
          '--chartBackground': 'var(--mm-white)',
          '--chartValueColor': 'var(--mm-gray-900)',
          '--chartLabelColor': 'var(--mm-gray-600)',
          '--kpiIconColor': accentColor,
          '--block-base-font-size': 'var(--mm-font-size-sm)',
          borderLeftColor: accentColor,
        } as React.CSSProperties
      }
    >
      <div className={chartClass}>
        {hasIcon && (
          <div className={reportChartStyles.kpiIconRow}>
            <MaterialIcon name={icon} variant="outlined" className={reportChartStyles.kpiIcon} />
          </div>
        )}
        <div className={reportChartStyles.kpiValueRow}>{value}</div>
        <div className={reportChartStyles.kpiTitle}>
          <span>{title}</span>
        </div>
      </div>
    </div>
  );
}
