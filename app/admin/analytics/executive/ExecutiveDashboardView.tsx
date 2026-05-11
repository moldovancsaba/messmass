'use client';

/**
 * Shared analytics dashboard view (Executive / Marketing / Operations)
 * WHAT: Reusable KPI dashboard with metrics, trends, top events, insights
 * WHY: Phase 3 requires 4+ dashboard templates; shared view keeps UX consistent
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, MetricCard, InsightCard } from '@/components/analytics';
import type { LineChartDataset } from '@/components/analytics';
import type { Insight } from '@/lib/insightsEngine';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import styles from './ExecutiveDashboard.module.css';

export interface ExecutiveDashboardViewProps {
  title?: string;
  subtitle?: string;
  defaultPeriod?: '30d' | '90d';
}

interface ExecutiveMetrics {
  totalFans: number;
  totalRevenue: number;
  totalROI: number;
  avgEngagement: number;
  eventCount: number;
  growth: number;
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

export function ExecutiveDashboardView({
  title = '📊 Executive Dashboard',
  subtitle = 'Real-time analytics across all events',
  defaultPeriod = '30d',
}: ExecutiveDashboardViewProps) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30d' | '90d'>(defaultPeriod);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (period === '30d' ? 30 : 90));

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
        const labels = points.map((p: { date?: string }) => p.date);
        const fans = points.map((p: { fans?: number; adValue?: number }) => (typeof p.fans === 'number' ? p.fans : 0));
        const revenue = points.map((p: { adValue?: number }) => (typeof p.adValue === 'number' ? p.adValue : 0));
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

  const trendDatasets: LineChartDataset[] = trends && trends.labels?.length
    ? [
        {
          label: 'Total Fans',
          data: trends.labels.map((label, i) => ({ label, value: trends.fans[i] ?? 0 })),
          color: '#3b82f6',
          fill: true,
        },
      ]
    : [];

  const revenueDatasets: LineChartDataset[] = trends && trends.labels?.length
    ? [
        {
          label: 'Revenue',
          data: trends.labels.map((label, i) => ({ label, value: trends.revenue[i] ?? 0 })),
          color: '#10b981',
          fill: true,
        },
      ]
    : [];

  return (
    <div className={styles.executiveDashboard}>
      <UnifiedAdminHeroWithSearch
        title={title}
        subtitle={subtitle}
        backLink="/admin/analytics"
        showSearch={false}
        actionButtons={[
          {
            label: period === '30d' ? 'Last 30 Days' : 'Last 90 Days',
            icon: 'date_range',
            onClick: () => setPeriod(period === '30d' ? '90d' : '30d'),
            variant: 'secondary',
          },
          {
            label: 'Open Insights',
            icon: 'lightbulb',
            onClick: () => router.push('/admin/analytics/insights'),
            variant: 'secondary',
          },
        ]}
      />

      <div className={styles.metricsGrid}>
        <MetricCard
          title="Total Fans"
          value={metrics?.totalFans || 0}
          previousValue={metrics?.previousPeriod?.totalFans}
          format="number"
          icon="👥"
          loading={loading}
        />
        <MetricCard
          title="Total Revenue"
          value={metrics?.totalRevenue || 0}
          previousValue={metrics?.previousPeriod?.totalRevenue}
          format="currency"
          icon="💰"
          loading={loading}
        />
        <MetricCard
          title="Total ROI"
          value={metrics?.totalROI || 0}
          previousValue={metrics?.previousPeriod?.totalROI}
          format="currency"
          icon="📈"
          loading={loading}
        />
        <MetricCard
          title="Avg Engagement"
          value={metrics?.avgEngagement || 0}
          previousValue={metrics?.previousPeriod?.avgEngagement}
          format="percentage"
          icon="🎯"
          loading={loading}
        />
        <MetricCard
          title="Events Tracked"
          value={metrics?.eventCount || 0}
          previousValue={metrics?.previousPeriod?.eventCount}
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

      <div className={styles.twoColumnGrid}>
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
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🧠 Critical Insights</h2>
          {loading ? (
            <div className={styles.loadingState}>Loading insights...</div>
          ) : (
            <div className={styles.insightsFeed}>
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} compact showActions={false} />
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
