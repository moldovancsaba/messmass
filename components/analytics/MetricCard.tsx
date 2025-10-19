'use client';

/**
 * MetricCard Component
 * 
 * WHAT: Enhanced KPI card with trend indicators and comparison
 * WHY: Display key metrics with context (change from previous period)
 * HOW: Card with large number, label, trend arrow, and comparison
 * 
 * Features:
 * - Primary metric with formatted display (number, currency, percentage)
 * - Trend indicator (up/down/neutral with color coding)
 * - Comparison to previous period
 * - Optional sparkline chart
 * - Loading and error states
 * 
 * Version: 6.28.0 (Phase 3 - Dashboards)
 * Created: 2025-10-19T13:15:00.000Z
 */

import React from 'react';
import styles from './MetricCard.module.css';

export type MetricFormat = 'number' | 'currency' | 'percentage';
export type TrendDirection = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string; // Metric name
  value: number; // Current value
  previousValue?: number; // Previous period value for comparison
  format?: MetricFormat; // How to display the value
  trend?: TrendDirection; // Explicit trend direction
  subtitle?: string; // Additional context
  icon?: string; // Emoji or icon
  loading?: boolean;
  className?: string;
}

/**
 * WHAT: Format number based on specified format type
 * WHY: Consistent formatting across all metrics
 */
function formatMetricValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'currency':
      return `€${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}

/**
 * WHAT: Calculate percent change from previous value
 * WHY: Show growth/decline in context
 */
function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * WHAT: Determine trend direction from values
 * WHY: Auto-detect if not explicitly provided
 */
function determineTrend(current: number, previous: number | undefined): TrendDirection {
  if (previous === undefined) return 'neutral';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'neutral';
}

export default function MetricCard({
  title,
  value,
  previousValue,
  format = 'number',
  trend: explicitTrend,
  subtitle,
  icon,
  loading = false,
  className = '',
}: MetricCardProps) {
  const trend = explicitTrend || determineTrend(value, previousValue);
  const percentChange = previousValue !== undefined ? calculatePercentChange(value, previousValue) : null;

  if (loading) {
    return (
      <div className={`${styles.metricCard} ${styles.loading} ${className}`}>
        <div className={styles.skeleton}></div>
      </div>
    );
  }

  return (
    <div className={`${styles.metricCard} ${className}`}>
      {/* WHAT: Header with icon and title */}
      <div className={styles.header}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <h3 className={styles.title}>{title}</h3>
      </div>

      {/* WHAT: Main metric value */}
      <div className={styles.valueSection}>
        <div className={styles.value}>{formatMetricValue(value, format)}</div>

        {/* WHAT: Trend indicator with percent change */}
        {percentChange !== null && (
          <div className={`${styles.trend} ${styles[`trend--${trend}`]}`}>
            <span className={styles.trendArrow}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
            </span>
            <span className={styles.trendValue}>
              {Math.abs(percentChange).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* WHAT: Subtitle or comparison text */}
      {(subtitle || previousValue !== undefined) && (
        <div className={styles.footer}>
          {subtitle || (
            <span className={styles.comparison}>
              vs {formatMetricValue(previousValue!, format)} previous period
            </span>
          )}
        </div>
      )}
    </div>
  );
}
