'use client';

/**
 * MetricCard Component
 * 
 * WHAT: Enhanced KPI card leveraging @doneisbetter/gds-core
 * WHY: centralize design tokens, theme integration, and primitive patterns using GDS packages
 * HOW: wraps @doneisbetter/gds-core's MetricCard and maps messmass props for stable backwards compatibility
 * 
 * Version: 12.2.0 (Phase 3 - GDS Integration)
 * Created: 2026-05-24T13:49:00.000Z
 */

import React from 'react';
import { MetricCard as GdsMetricCard } from '@doneisbetter/gds-core';
import { Skeleton, Text } from '@mantine/core';

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
  periodLabel?: string;
  comparisonLabel?: string;
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
  periodLabel,
  comparisonLabel,
}: MetricCardProps) {
  const trend = explicitTrend || determineTrend(value, previousValue);
  const percentChange = previousValue !== undefined ? calculatePercentChange(value, previousValue) : null;

  if (loading) {
    return (
      <div className={className}>
        <Skeleton height={140} radius="lg" />
      </div>
    );
  }

  const formattedValue = formatMetricValue(value, format);
  const descriptionText = subtitle || (previousValue !== undefined ? (
    comparisonLabel || `vs ${formatMetricValue(previousValue, format)} previous period`
  ) : undefined);

  const gdsTrend = percentChange !== null ? {
    label: `${trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} ${Math.abs(percentChange).toFixed(1)}%`,
    tone: (trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral'
  } : undefined;

  return (
    <div className={className}>
      <GdsMetricCard
        label={title}
        value={formattedValue}
        description={descriptionText}
        trend={gdsTrend}
        icon={icon ? <span>{icon}</span> : undefined}
        footer={periodLabel ? <Text size="xs" c="dimmed">{periodLabel}</Text> : undefined}
      />
    </div>
  );
}
