/**
 * Analytics Insights Dashboard
 * 
 * WHAT: Admin page for viewing and filtering all generated insights
 * WHY: Centralized insights management and monitoring
 */

'use client';

import React, { useState, useEffect } from 'react';
import AdminHero from '@/components/AdminHero';
import InsightCard from '@/components/InsightCard';
import styles from './page.module.css';

// WHAT: Insight interface matching API response
// WHY: Type-safe insight handling
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
  metadata?: Record<string, any>;
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

export default function InsightsDashboard() {
  // WHAT: State management
  // WHY: Track insights, filters, and loading state
  const [insights, setInsights] = useState<Insight[]>([]);
  const [metadata, setMetadata] = useState<InsightsMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [limit, setLimit] = useState(10);

  /**
   * WHAT: Fetch insights from API
   * WHY: Load latest insights with applied filters
   */
  const fetchInsights = async () => {
    setLoading(true);
    setError('');

    try {
      // WHAT: Build query parameters
      // WHY: Apply selected filters
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (severityFilter) params.append('severity', severityFilter);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/analytics/insights?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      setInsights(data.insights || []);
      setMetadata(data.metadata || null);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  // WHAT: Fetch insights on mount and filter changes
  // WHY: Keep insights up to date with filters
  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, severityFilter, limit]);

  return (
    <div className={styles.container}>
      <AdminHero
        title="📊 Analytics Insights"
        subtitle="AI-powered insights and anomaly detection across your events"
        actionButtons={[
          {
            label: '🔄 Refresh',
            onClick: fetchInsights,
          },
        ]}
      />

      {/* WHAT: Filters section */}
      {/* WHY: Allow users to filter insights by type and severity */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="typeFilter">Type:</label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">All Types</option>
            <option value="anomaly">⚠️ Anomalies</option>
            <option value="trend">📈 Trends</option>
            <option value="benchmark">🏆 Benchmarks</option>
            <option value="prediction">🔮 Predictions</option>
            <option value="recommendation">💡 Recommendations</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="severityFilter">Severity:</label>
          <select
            id="severityFilter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">All Severities</option>
            <option value="critical">🔴 Critical</option>
            <option value="warning">🟡 Warning</option>
            <option value="info">🔵 Info</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="limitFilter">Events:</label>
          <select
            id="limitFilter"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className={styles.select}
          >
            <option value="5">5 Recent</option>
            <option value="10">10 Recent</option>
            <option value="20">20 Recent</option>
            <option value="50">50 Recent</option>
          </select>
        </div>
      </div>

      {/* WHAT: Summary statistics */}
      {/* WHY: Quick overview of insights distribution */}
      {metadata && (
        <div className={styles.summary}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{metadata.totalInsights}</span>
            <span className={styles.statLabel}>Total Insights</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{metadata.anomalies}</span>
            <span className={styles.statLabel}>⚠️ Anomalies</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{metadata.trends}</span>
            <span className={styles.statLabel}>📈 Trends</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{metadata.benchmarks}</span>
            <span className={styles.statLabel}>🏆 Benchmarks</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{metadata.predictions}</span>
            <span className={styles.statLabel}>🔮 Predictions</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{metadata.recommendations}</span>
            <span className={styles.statLabel}>💡 Recommendations</span>
          </div>
        </div>
      )}

      {/* WHAT: Loading state */}
      {/* WHY: User feedback during data fetch */}
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading insights...</p>
        </div>
      )}

      {/* WHAT: Error state */}
      {/* WHY: Display errors to user */}
      {error && (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
          <button onClick={fetchInsights} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {/* WHAT: Insights grid */}
      {/* WHY: Display all insights in card format */}
      {!loading && !error && insights.length > 0 && (
        <div className={styles.insights}>
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* WHAT: Empty state */}
      {/* WHY: Handle no insights case */}
      {!loading && !error && insights.length === 0 && (
        <div className={styles.empty}>
          <p>📭 No insights found with current filters.</p>
          <p>Try adjusting your filters or check back after the next aggregation run.</p>
        </div>
      )}
    </div>
  );
}
