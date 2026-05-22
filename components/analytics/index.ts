/**
 * Analytics Components Barrel Export
 * 
 * WHAT: Centralized export for all Phase 3 analytics/dashboard components
 * WHY: Simplify imports across the application
 * 
 * Usage:
 *   import { LineChart, MetricCard, InsightCard } from '@/components/analytics';
 * 
 * Version: 6.28.0 (Phase 3 - Dashboards)
 */

export { default as LineChart } from './LineChart';
export { default as MetricCard } from './MetricCard';
export { default as InsightCard } from './InsightCard';
export { default as AnalyticsSectionCard } from './AnalyticsSectionCard';
export { default as AnalyticsStatePanel } from './AnalyticsStatePanel';
export { default as AnalyticsToolbar } from './AnalyticsToolbar';
export { default as AnalyticsChartTablePanel } from './AnalyticsChartTablePanel';

// Export types for TypeScript consumers
export type { LineChartDataPoint, LineChartDataset } from './LineChart';
export type { MetricFormat, TrendDirection } from './MetricCard';
