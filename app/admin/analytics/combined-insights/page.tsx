'use client';

// app/admin/analytics/combined-insights/page.tsx
// WHAT: Merged view of both insight pipelines -- the Executive Dashboard's
//     per-event insights and the partner/org Analytics Insights -- via
//     GET /api/analytics/insights/combined.
// WHY: messmass#414. This is the successor to /admin/analytics/insights,
//     which showed only the analytics-insights.ts pipeline: that page's
//     entire content was the filtered insight feed, no other unique section,
//     so once this page matched its filter/sort/search capability there was
//     nothing left it did that this doesn't -- see the redirect at
//     app/admin/analytics/insights/page.tsx. Neither the Executive Dashboard
//     nor its own KPI/trend/leaderboard content is touched; only its "View
//     All Insights" link now points here.
// HOW: Filters/sort/search mirror the retired page's UX exactly, adapted for
//     two vocabularies instead of one: kind uses the union of both sources'
//     category/type values (lib/combinedInsight.ts's combinedInsightKind);
//     minimum urgency uses combinedInsightRank rather than either source's
//     own priority/severity scale, since those aren't the same scale.

import React, { useEffect, useMemo, useState } from 'react';
import AnalyticsWorkspaceNav from '@/components/AnalyticsWorkspaceNav';
import { AnalyticsSectionCard, AnalyticsStatePanel, AnalyticsToolbar, MetricCard } from '@/components/analytics';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import ColoredCard from '@/components/ColoredCard';
import styles from './CombinedInsights.module.css';
import {
  combinedInsightRank,
  combinedInsightKind,
  COMBINED_INSIGHT_KINDS,
  type CombinedInsight,
  type CombinedInsightKind,
} from '@/lib/combinedInsight';

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

type SourceFilter = '' | 'executive' | 'analytics';
type KindFilter = '' | CombinedInsightKind;
type UrgencyFilter = '' | 'critical' | 'warning-plus';
type SortBy = 'urgency' | 'confidence' | 'date';

function badgeLabel(insight: CombinedInsight): string {
  if (insight.executive) return insight.executive.priority;
  if (insight.analytics) return insight.analytics.severity;
  return '';
}

const EVENT_WINDOW_OPTIONS = [10, 20, 50] as const;

export default function CombinedInsightsPage() {
  const [insights, setInsights] = useState<CombinedInsight[]>([]);
  const [summary, setSummary] = useState<CombinedInsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('');
  const [sortBy, setSortBy] = useState<SortBy>('urgency');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventWindow, setEventWindow] = useState<(typeof EVENT_WINDOW_OPTIONS)[number]>(20);

  const fetchCombined = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/analytics/insights/combined?limit=${eventWindow}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventWindow]);

  const filteredInsights = useMemo(() => {
    let result = insights;

    if (sourceFilter) {
      result = result.filter((insight) => insight.source === sourceFilter);
    }
    if (kindFilter) {
      result = result.filter((insight) => combinedInsightKind(insight) === kindFilter);
    }
    if (urgencyFilter === 'critical') {
      result = result.filter((insight) => combinedInsightRank(insight) >= 4);
    } else if (urgencyFilter === 'warning-plus') {
      result = result.filter((insight) => combinedInsightRank(insight) >= 2);
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((insight) =>
        [
          insight.title,
          insight.message,
          insight.executive?.recommendation || '',
          insight.analytics?.recommendation || '',
          insight.analytics?.metric || '',
          ...(insight.executive?.metrics || []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }

    return [...result].sort((left, right) => {
      if (sortBy === 'confidence') return right.confidence - left.confidence;
      if (sortBy === 'date') return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      const rankDelta = combinedInsightRank(right) - combinedInsightRank(left);
      return rankDelta !== 0 ? rankDelta : right.confidence - left.confidence;
    });
  }, [insights, sourceFilter, kindFilter, urgencyFilter, searchTerm, sortBy]);

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="🔀 Combined Insights"
        subtitle="Both insight pipelines -- Executive Dashboard and Analytics Insights -- merged into one feed."
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
            Executive insights use priority (critical/high/medium/low); Analytics insights use severity (critical/warning/info). The urgency filter and sort below rank both onto one scale for convenience; each card still shows its own real label.
          </p>
        </AnalyticsSectionCard>

        {summary && !loading && !error && (
          <div className={styles.metricGrid}>
            <MetricCard title="Total Insights" value={summary.total} format="number" icon="🔀" />
            <MetricCard title="From Executive" value={summary.fromExecutive} format="number" icon="📈" />
            <MetricCard title="From Analytics" value={summary.fromAnalytics} format="number" icon="🧠" />
          </div>
        )}

        <AnalyticsToolbar
          title="Filters"
          subtitle="Narrow the merged feed by source, kind, urgency, and recent event window."
          accentColor="var(--mm-chart-teal)"
          summary={<span className={styles.resultsText}>Showing {filteredInsights.length} of {insights.length} insights</span>}
        >
          <div className={styles.filters}>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as SourceFilter)} className={styles.select} aria-label="Filter by source">
              <option value="">All Sources</option>
              <option value="executive">Executive</option>
              <option value="analytics">Analytics</option>
            </select>

            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as KindFilter)} className={styles.select} aria-label="Filter by kind">
              <option value="">All Kinds</option>
              {COMBINED_INSIGHT_KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>

            <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value as UrgencyFilter)} className={styles.select} aria-label="Filter by urgency">
              <option value="">All Urgency</option>
              <option value="critical">Critical only</option>
              <option value="warning-plus">Warning and above</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className={styles.select} aria-label="Sort insights">
              <option value="urgency">Sort by Urgency</option>
              <option value="confidence">Sort by Confidence</option>
              <option value="date">Sort by Date</option>
            </select>

            <select value={eventWindow} onChange={(e) => setEventWindow(Number(e.target.value) as (typeof EVENT_WINDOW_OPTIONS)[number])} className={styles.select} aria-label="Recent events window">
              {EVENT_WINDOW_OPTIONS.map((n) => (
                <option key={n} value={n}>Recent {n} Events</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              aria-label="Search insights"
            />
          </div>
        </AnalyticsToolbar>

        {loading && <AnalyticsStatePanel variant="loading" title="Loading combined insights" description="Generating insights from both pipelines across recent events." />}
        {error && !loading && <AnalyticsStatePanel variant="error" title="Failed to load" description={error} action={<button onClick={fetchCombined}>Retry</button>} />}
        {!loading && !error && filteredInsights.length === 0 && (
          <AnalyticsStatePanel variant="empty" title="No insights match the current filters" description="Try broadening the event window or removing one of the active filters." />
        )}

        {!loading && !error && filteredInsights.length > 0 && (
          <div className={styles.list}>
            {filteredInsights.map((insight) => (
              <ColoredCard
                key={`${insight.source}-${insight.id}`}
                accentColor={insight.source === 'executive' ? 'var(--mm-color-primary-500)' : 'var(--mm-chart-orange)'}
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.title}>{insight.title}</h3>
                  <div className={styles.badges}>
                    <span className={insight.source === 'executive' ? styles.sourceExecutive : styles.sourceAnalytics}>
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
