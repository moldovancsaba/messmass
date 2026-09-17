'use client';

// app/admin/analytics/combined-insights/page.tsx
// WHAT: Merged view of both insight pipelines -- the Executive Dashboard's
//     per-event insights and the partner/org Analytics Insights -- via
//     GET /api/analytics/insights/combined.
// WHY: messmass#414 follow-up. Neither existing dashboard is touched; this is
//     a new, additive surface for whoever wants both feeds in one place,
//     using lib/combinedInsight.ts's lossless merge.

import React, { useEffect, useState } from 'react';
import AnalyticsWorkspaceNav from '@/components/AnalyticsWorkspaceNav';
import { AnalyticsSectionCard, AnalyticsStatePanel, MetricCard } from '@/components/analytics';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import ColoredCard from '@/components/ColoredCard';
import styles from './CombinedInsights.module.css';
import type { CombinedInsight } from '@/lib/combinedInsight';

interface CombinedInsightsSummary {
  total: number;
  fromExecutive: number;
  fromAnalytics: number;
}

interface CombinedInsightsResponse {
  success: boolean;
  data?: {
    insights: CombinedInsight[];
    summary: CombinedInsightsSummary;
  };
  error?: string;
}

function badgeLabel(insight: CombinedInsight): string {
  if (insight.executive) return insight.executive.priority;
  if (insight.analytics) return insight.analytics.severity;
  return '';
}

export default function CombinedInsightsPage() {
  const [insights, setInsights] = useState<CombinedInsight[]>([]);
  const [summary, setSummary] = useState<CombinedInsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCombined = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/analytics/insights/combined?limit=20');
      const result: CombinedInsightsResponse = await response.json();
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch combined insights');
      }
      setInsights(result.data.insights);
      setSummary(result.data.summary);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load combined insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombined();
  }, []);

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="🔀 Combined Insights"
        subtitle="Both insight pipelines -- Executive Dashboard and partner/org Analytics Insights -- merged into one feed."
        backLink="/admin/analytics"
        showSearch={false}
        actionButtons={[{ label: 'Refresh', icon: 'refresh', onClick: fetchCombined, variant: 'secondary' }]}
      />

      <div className={styles.page}>
        <AnalyticsWorkspaceNav />

        <AnalyticsSectionCard
          accentColor="var(--mm-color-primary-500)"
          title="Merged Feed"
          subtitle="Each insight keeps its own source's priority/severity vocabulary -- the two pipelines use different scales, shown here rather than collapsed into one."
        >
          <p className={styles.introMeta}>
            Executive insights use priority (critical/high/medium/low); Analytics insights use severity (critical/warning/info). Sorted by urgency within each, mixed together by recency and confidence.
          </p>
        </AnalyticsSectionCard>

        {summary && !loading && !error && (
          <div className={styles.metricGrid}>
            <MetricCard title="Total Insights" value={summary.total} format="number" icon="🔀" />
            <MetricCard title="From Executive" value={summary.fromExecutive} format="number" icon="📈" />
            <MetricCard title="From Analytics" value={summary.fromAnalytics} format="number" icon="🧠" />
          </div>
        )}

        {loading && <AnalyticsStatePanel variant="loading" title="Loading combined insights" description="Generating insights from both pipelines across recent events." />}
        {error && !loading && <AnalyticsStatePanel variant="error" title="Failed to load" description={error} action={<button onClick={fetchCombined}>Retry</button>} />}
        {!loading && !error && insights.length === 0 && (
          <AnalyticsStatePanel variant="empty" title="No insights yet" description="No anomalies, trends, or benchmarks were found in the recent event window." />
        )}

        {!loading && !error && insights.length > 0 && (
          <div className={styles.list}>
            {insights.map((insight) => (
              <ColoredCard
                key={`${insight.source}-${insight.id}`}
                accentColor={insight.source === 'executive' ? 'var(--mm-color-primary-500)' : 'var(--mm-chart-orange)'}
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.title}>{insight.title}</h3>
                  <div className={styles.badges}>
                    <span className={insight.source === 'executive' ? styles.sourceExecutive : styles.sourceAnalytics} data-testid="source-badge">
                      <span className={styles.badge}>{insight.source === 'executive' ? 'Executive' : 'Analytics'}</span>
                    </span>
                    <span className={styles.badge}>{badgeLabel(insight)}</span>
                  </div>
                </div>
                <p className={styles.message}>{insight.message}</p>
                <div className={styles.metaRow}>
                  <span>Confidence: {insight.confidence}%</span>
                  <span>{new Date(insight.createdAt).toLocaleString()}</span>
                  {insight.executive?.recommendation && <span>Recommendation: {insight.executive.recommendation}</span>}
                  {insight.analytics?.recommendation && <span>Recommendation: {insight.analytics.recommendation}</span>}
                </div>
              </ColoredCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
