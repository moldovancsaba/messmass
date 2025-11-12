'use client';

/**
 * Executive Dashboard
 * 
 * WHAT: High-level analytics dashboard for executives and stakeholders
 * WHY: Provide at-a-glance view of key performance indicators across all events
 * HOW: Aggregated metrics with trends, top performers, and critical insights
 * 
 * Features:
 * - 6 key metric cards (fans, revenue, ROI, engagement, events, growth)
 * - 30/90-day trend visualizations
 * - Top 5 performing events table
 * - Critical AI insights feed
 * - Period-over-period comparisons
 * - Date range selector
 * 
 * Version: 6.28.0 (Phase 3 - Executive Dashboard)
 * Created: 2025-10-19T13:30:00.000Z
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, MetricCard, InsightCard } from '@/components/analytics';
import type { LineChartDataset } from '@/components/analytics';
import type { Insight } from '@/lib/insightsEngine';
import styles from './ExecutiveDashboard.module.css';

interface ExecutiveMetrics {
  totalFans: number;
  totalRevenue: number;
  totalROI: number;
  avgEngagement: number;
  eventCount: number;
  growth: number; // Percent growth vs previous period
  previousPeriod: {
    totalFans: number;
    totalRevenue: number;
    totalROI: number;
    avgEngagement: number;
    eventCount: number;
  };
}

interface TopEvent {
  id: string;
  name: string;
  date: string;
  fans: number;
  revenue: number;
  engagement: number;
}

interface TrendData {
  labels: string[];
  fans: number[];
  revenue: number[];
}

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30d' | '90d'>('30d');

  /**
   * WHAT: Fetch all dashboard data in parallel
   * WHY: Minimize loading time with concurrent requests
   */
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // WHAT: Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (period === '30d' ? 30 : 90));

      // WHAT: Fetch data from analytics APIs (Phase 1 & 2)
      const [metricsRes, trendsRes, topEventsRes, insightsRes] = await Promise.all([
        fetch(`/api/analytics/executive/metrics?period=${period}`),
        fetch(`/api/analytics/trends?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&groupBy=day`),
        fetch(`/api/analytics/executive/top-events?period=${period}&limit=5`),
        fetch(`/api/analytics/executive/insights?priority=critical,high&limit=5`),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.data);
      }

      if (trendsRes.ok) {
        const data = await trendsRes.json();
        const points = Array.isArray(data?.data?.dataPoints) ? data.data.dataPoints : [];
        const labels = points.map((p: any) => p.date);
        const fans = points.map((p: any) => (typeof p.fans === 'number' ? p.fans : 0));
        const revenue = points.map((p: any) => (typeof p.adValue === 'number' ? p.adValue : 0));
        setTrends({ labels, fans, revenue });
      }

      if (topEventsRes.ok) {
        const data = await topEventsRes.json();
        setTopEvents(data.data);
      }

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data.data.insights || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // WHAT: Prepare trend chart datasets
  const trendDatasets: LineChartDataset[] = trends && trends.labels?.length
    ? [
        {
          label: 'Total Fans',
          data: trends.labels.map((label, i) => ({
            label,
            value: trends.fans[i] ?? 0,
          })),
          color: '#3b82f6',
          fill: true,
        },
      ]
    : [];

  const revenueDatasets: LineChartDataset[] = trends && trends.labels?.length
    ? [
        {
          label: 'Revenue',
          data: trends.labels.map((label, i) => ({
            label,
            value: trends.revenue[i] ?? 0,
          })),
          color: '#10b981',
          fill: true,
        },
      ]
    : [];

  return (
    <div className={styles.executiveDashboard}>
      {/* WHAT: Dashboard header with title and period selector */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📊 Executive Dashboard</h1>
          <p className={styles.subtitle}>Real-time analytics across all events</p>
        </div>
        <div className={styles.periodSelector}>
          <button
            onClick={() => setPeriod('30d')}
            className={period === '30d' ? styles.periodActive : styles.periodButton}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setPeriod('90d')}
            className={period === '90d' ? styles.periodActive : styles.periodButton}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* WHAT: Key metrics grid (6 KPI cards) */}
      <div className={styles.metricsGrid}>
        <MetricCard
          title="Total Fans"
          value={metrics?.totalFans || 0}
          previousValue={metrics?.previousPeriod.totalFans}
          format="number"
          icon="👥"
          loading={loading}
        />
        <MetricCard
          title="Total Revenue"
          value={metrics?.totalRevenue || 0}
          previousValue={metrics?.previousPeriod.totalRevenue}
          format="currency"
          icon="💰"
          loading={loading}
        />
        <MetricCard
          title="Total ROI"
          value={metrics?.totalROI || 0}
          previousValue={metrics?.previousPeriod.totalROI}
          format="currency"
          icon="📈"
          loading={loading}
        />
        <MetricCard
          title="Avg Engagement"
          value={metrics?.avgEngagement || 0}
          previousValue={metrics?.previousPeriod.avgEngagement}
          format="percentage"
          icon="🎯"
          loading={loading}
        />
        <MetricCard
          title="Events Tracked"
          value={metrics?.eventCount || 0}
          previousValue={metrics?.previousPeriod.eventCount}
          format="number"
          icon="📅"
          loading={loading}
        />
        <MetricCard
          title="Period Growth"
          value={metrics?.growth || 0}
          format="percentage"
          trend={metrics ? (metrics.growth > 0 ? 'up' : metrics.growth < 0 ? 'down' : 'neutral') : undefined}
          icon="🚀"
          loading={loading}
        />
      </div>

      {/* WHAT: Trend charts section */}
      <div className={styles.chartsGrid}>
        {!loading && trends && (
          <>
            <div className={styles.chartCard}>
              <LineChart
                title="Fan Engagement Trend"
                subtitle={`Last ${period === '30d' ? '30' : '90'} days`}
                datasets={trendDatasets}
                filename="fan-trend"
                height={300}
                formatValue={(v) => v.toLocaleString()}
              />
            </div>
            <div className={styles.chartCard}>
              <LineChart
                title="Revenue Trend"
                subtitle={`Last ${period === '30d' ? '30' : '90'} days`}
                datasets={revenueDatasets}
                filename="revenue-trend"
                height={300}
                formatValue={(v) => `€${v.toLocaleString()}`}
              />
            </div>
          </>
        )}
      </div>

      {/* WHAT: Two-column layout for top events and insights */}
      <div className={styles.twoColumnGrid}>
        {/* WHAT: Top performing events table */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🏆 Top Performing Events</h2>
          {loading ? (
            <div className={styles.loadingState}>Loading events...</div>
          ) : (
            <div className={styles.eventsTable}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Fans</th>
                    <th>Revenue</th>
                    <th>Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {topEvents.map((event) => (
                    <tr key={event.id}>
                      <td className={styles.eventName}>{event.name}</td>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
                      <td>{event.fans.toLocaleString()}</td>
                      <td>€{event.revenue.toLocaleString()}</td>
                      <td>{event.engagement.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* WHAT: Critical insights feed */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🧠 Critical Insights</h2>
          {loading ? (
            <div className={styles.loadingState}>Loading insights...</div>
          ) : (
            <div className={styles.insightsFeed}>
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    compact
                    showActions={false}
                  />
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>✅ All systems performing well</p>
                  <p className={styles.emptySubtext}>No critical issues detected</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
