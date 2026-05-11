'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ColoredCard from '@/components/ColoredCard';
import InsightCard from '@/components/InsightCard';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import styles from './InsightsDashboard.module.css';

interface Insight {
  id: string;
  type: 'anomaly' | 'trend' | 'benchmark' | 'prediction' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  title: string;
  description: string;
  value?: number;
  change?: number;
  confidence: number;
  actionable: boolean;
  recommendation?: string;
  relatedEvents?: string[];
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface InsightsMetadata {
  totalInsights: number;
  anomalies: number;
  trends: number;
  benchmarks: number;
  predictions: number;
  recommendations: number;
  generatedAt: string;
}

type InsightTypeFilter = '' | 'anomaly' | 'trend' | 'benchmark' | 'prediction' | 'recommendation';
type SeverityFilter = '' | 'info' | 'warning' | 'critical';
type SortBy = 'severity' | 'confidence' | 'date';

function severityRank(severity: Insight['severity']) {
  return severity === 'critical' ? 3 : severity === 'warning' ? 2 : 1;
}

export default function AnalyticsInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [metadata, setMetadata] = useState<InsightsMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<InsightTypeFilter>('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('');
  const [sortBy, setSortBy] = useState<SortBy>('severity');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventWindow, setEventWindow] = useState(10);

  const fetchInsights = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (severityFilter) params.set('severity', severityFilter);
      params.set('limit', String(eventWindow));

      const response = await fetch(`/api/analytics/insights?${params.toString()}`);
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Failed to fetch insights');
      }

      const result = await response.json();
      setInsights(result.insights || []);
      setMetadata(result.metadata || null);
    } catch (fetchError) {
      console.error('Failed to fetch analytics insights:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, severityFilter, eventWindow]);

  const filteredInsights = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const searched = term
      ? insights.filter((insight) =>
          [
            insight.title,
            insight.description,
            insight.metric,
            insight.recommendation || '',
            ...(insight.relatedEvents || []),
          ]
            .join(' ')
            .toLowerCase()
            .includes(term)
        )
      : insights;

    return [...searched].sort((left, right) => {
      if (sortBy === 'confidence') {
        return right.confidence - left.confidence;
      }
      if (sortBy === 'date') {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
      const severityDelta = severityRank(right.severity) - severityRank(left.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }
      return right.confidence - left.confidence;
    });
  }, [insights, searchTerm, sortBy]);

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="🧠 Insights"
        subtitle="Review anomalies, trends, benchmarks, predictions, and recommendations from one canonical analytics surface."
        backLink="/admin/analytics"
        showSearch={false}
        actionButtons={[
          {
            label: 'Refresh',
            icon: 'refresh',
            onClick: fetchInsights,
            variant: 'secondary',
          },
        ]}
      />

      <div className={styles.insightsDashboard}>
        <ColoredCard accentColor="#3b82f6" hoverable={false}>
          <div className={styles.header}>
            <h2 className={styles.title}>Insights Queue</h2>
            <p className={styles.subtitle}>
              This surface uses the maintained global insights endpoint and replaces the old duplicate `/admin/insights` experience.
            </p>
          </div>
        </ColoredCard>

        {metadata && !loading && !error && (
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{metadata.totalInsights}</span>
              <span className={styles.statLabel}>Total Insights</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{metadata.anomalies}</span>
              <span className={styles.statLabel}>Anomalies</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{metadata.trends}</span>
              <span className={styles.statLabel}>Trends</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{metadata.benchmarks}</span>
              <span className={styles.statLabel}>Benchmarks</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{metadata.predictions}</span>
              <span className={styles.statLabel}>Predictions</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{metadata.recommendations}</span>
              <span className={styles.statLabel}>Recommendations</span>
            </div>
          </div>
        )}

        <ColoredCard accentColor="#14b8a6" hoverable={false}>
          <div className={styles.controls}>
            <div className={styles.filters}>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as InsightTypeFilter)}
                className={styles.select}
                aria-label="Filter by insight type"
              >
                <option value="">All Types</option>
                <option value="anomaly">Anomalies</option>
                <option value="trend">Trends</option>
                <option value="benchmark">Benchmarks</option>
                <option value="prediction">Predictions</option>
                <option value="recommendation">Recommendations</option>
              </select>

              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value as SeverityFilter)}
                className={styles.select}
                aria-label="Filter by severity"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortBy)}
                className={styles.select}
                aria-label="Sort insights"
              >
                <option value="severity">Sort by Severity</option>
                <option value="confidence">Sort by Confidence</option>
                <option value="date">Sort by Date</option>
              </select>

              <select
                value={eventWindow}
                onChange={(event) => setEventWindow(Number(event.target.value))}
                className={styles.select}
                aria-label="Recent events window"
              >
                <option value={5}>Recent 5 Events</option>
                <option value={10}>Recent 10 Events</option>
                <option value={20}>Recent 20 Events</option>
                <option value={50}>Recent 50 Events</option>
              </select>

              <input
                type="text"
                placeholder="Search insights..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className={styles.searchInput}
                aria-label="Search insights"
              />
            </div>
          </div>
        </ColoredCard>

        <div className={styles.resultsBar}>
          <span className={styles.resultsText}>
            Showing {filteredInsights.length} of {insights.length} insights
            {metadata?.generatedAt ? ` • generated ${new Date(metadata.generatedAt).toLocaleString()}` : ''}
          </span>
        </div>

        {error ? (
          <ColoredCard accentColor="var(--mm-error)" hoverable={false}>
            <div className={styles.emptyState}>
              <h3>Insights unavailable</h3>
              <p>{error}</p>
            </div>
          </ColoredCard>
        ) : (
          <div className={styles.insightsFeed}>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading insights...</p>
              </div>
            ) : filteredInsights.length > 0 ? (
              filteredInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))
            ) : (
              <div className={styles.emptyState}>
                <h3>No insights found</h3>
                <p>Adjust the filters or expand the recent event window.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
