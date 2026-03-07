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
  /** Show title in uppercase (e.g. for problem section KPI cards) */
  titleUppercase?: boolean;
}

export default function LandingKPIChart({
  title,
  value,
  icon,
  accentColor = 'var(--mm-color-primary-500)',
  titleUppercase = false,
}: LandingKPIChartProps) {
  const hasIcon = !!icon;
  const chartClass = hasIcon
    ? `${reportChartStyles.chart} ${reportChartStyles.kpi}`
    : `${reportChartStyles.chart} ${reportChartStyles.kpi} ${reportChartStyles.kpiNoIcon}`;
  const accentClass = getAccentClass(accentColor);

  return (
    <div className={`${styles.wrapper} ${accentClass}`}>
      <div className={chartClass}>
        {hasIcon && (
          <div className={reportChartStyles.kpiIconRow}>
            <MaterialIcon name={icon} variant="outlined" className={reportChartStyles.kpiIcon} />
          </div>
        )}
        <div className={reportChartStyles.kpiValueRow}>{value}</div>
        <div className={`${reportChartStyles.kpiTitle} ${titleUppercase ? styles.titleUppercase : ''}`}>
          <span>{title}</span>
        </div>
      </div>
    </div>
  );
}

function getAccentClass(accentColor: string): string {
  switch (accentColor) {
    case 'var(--mm-color-secondary-500)':
      return styles.accentSecondary;
    case 'var(--mm-success)':
      return styles.accentSuccess;
    case 'var(--mm-warning)':
      return styles.accentWarning;
    case 'var(--mm-info)':
      return styles.accentInfo;
    case 'var(--mm-color-primary-500)':
    default:
      return styles.accentPrimary;
  }
}
