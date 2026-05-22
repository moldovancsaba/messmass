'use client';

import React from 'react';
import AnalyticsSectionCard from './AnalyticsSectionCard';
import styles from './AnalyticsChartTablePanel.module.css';

interface AnalyticsChartTablePanelProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  chart: React.ReactNode;
  table: React.ReactNode;
  actions?: React.ReactNode;
}

export default function AnalyticsChartTablePanel({
  title,
  subtitle,
  accentColor = 'var(--mm-color-primary-500)',
  chart,
  table,
  actions,
}: AnalyticsChartTablePanelProps) {
  return (
    <AnalyticsSectionCard title={title} subtitle={subtitle} accentColor={accentColor} actions={actions}>
      <div className={styles.panel}>
        <div className={styles.chart}>{chart}</div>
        <div className={styles.table}>{table}</div>
      </div>
    </AnalyticsSectionCard>
  );
}
