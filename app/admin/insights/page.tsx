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
  
  // WHAT: Help section visibility state
  // WHY: Allow users to show/hide comprehensive usage guide
  const [showHelp, setShowHelp] = useState(false);

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
            label: showHelp ? '✕ Close Help' : '❓ Help',
            onClick: () => setShowHelp(!showHelp),
          },
          {
            label: '🔄 Refresh',
            onClick: fetchInsights,
          },
        ]}
      />

      {/* WHAT: Collapsible help section */}
      {/* WHY: Comprehensive guide on using insights dashboard */}
      {showHelp && (
        <div className={styles.helpSection}>
          <div className={styles.helpContent}>
            <h2 className={styles.helpTitle}>📖 How to Use This Dashboard</h2>
            
            {/* WHAT: Filter instructions */}
            {/* WHY: Help users understand filtering capabilities */}
            <section className={styles.helpBlock}>
              <h3>🎛️ Filter Controls</h3>
              <ul>
                <li><strong>Type Filter:</strong> Select specific insight types to focus on (Anomalies, Trends, Benchmarks, Predictions, or Recommendations)</li>
                <li><strong>Severity Filter:</strong> Filter by urgency level (Critical, Warning, or Info)</li>
                <li><strong>Events Filter:</strong> Choose how many recent events to analyze (5, 10, 20, or 50)</li>
              </ul>
            </section>

            {/* WHAT: Insight types explanation */}
            {/* WHY: Educate users on what each insight type means */}
            <section className={styles.helpBlock}>
              <h3>🔍 Insight Types</h3>
              <div className={styles.insightTypeGrid}>
                <div className={styles.insightTypeCard}>
                  <div className={styles.insightTypeHeader}>
                    <span className={styles.insightTypeIcon}>⚠️</span>
                    <strong>Anomalies</strong>
                  </div>
                  <p>Unusual patterns detected in your data that deviate significantly from normal behavior.</p>
<p className={styles.example}><em>Example:</em> Attendance 23% below average for similar events</p>
                </div>
                
                <div className={styles.insightTypeCard}>
                  <div className={styles.insightTypeHeader}>
                    <span className={styles.insightTypeIcon}>📈</span>
                    <strong>Trends</strong>
                  </div>
                  <p>Increasing or decreasing metrics over time, showing directional changes in performance.</p>
<p className={styles.example}><em>Example:</em> Engagement consistently growing over last 5 events</p>
                </div>
                
                <div className={styles.insightTypeCard}>
                  <div className={styles.insightTypeHeader}>
                    <span className={styles.insightTypeIcon}>🏆</span>
                    <strong>Benchmarks</strong>
                  </div>
                  <p>Comparisons against similar events or historical averages to provide performance context.</p>
<p className={styles.example}><em>Example:</em> Your event outperformed 78% of similar events</p>
                </div>
                
                <div className={styles.insightTypeCard}>
                  <div className={styles.insightTypeHeader}>
                    <span className={styles.insightTypeIcon}>🔮</span>
                    <strong>Predictions</strong>
                  </div>
                  <p>AI-powered forecasts for future performance based on historical data and patterns.</p>
<p className={styles.example}><em>Example:</em> Expected attendance: 850-950 based on historical data</p>
                </div>
                
                <div className={styles.insightTypeCard}>
                  <div className={styles.insightTypeHeader}>
                    <span className={styles.insightTypeIcon}>💡</span>
                    <strong>Recommendations</strong>
                  </div>
                  <p>Actionable suggestions to improve performance with specific steps to optimize results.</p>
<p className={styles.example}><em>Example:</em> Increase social media promotion 2 weeks before event</p>
                </div>
              </div>
            </section>

            {/* WHAT: Severity levels explanation */}
            {/* WHY: Help users prioritize based on urgency */}
            <section className={styles.helpBlock}>
              <h3>🚦 Severity Levels</h3>
              <div className={styles.severityLevels}>
                <div className={styles.severityRow}>
                  <span className={`${styles.severityBadge} ${styles.critical}`}>🔴 Critical</span>
                  <div>
                    <strong>Requires immediate attention</strong>
                    <p>Major anomalies requiring intervention. Significant issues impacting event success. Action needed within 24-48 hours.</p>
                  </div>
                </div>
                
                <div className={styles.severityRow}>
                  <span className={`${styles.severityBadge} ${styles.warning}`}>🟡 Warning</span>
                  <div>
                    <strong>Important to review</strong>
                    <p>Moderate deviations from expected performance. Areas for improvement or optimization. Review within 1 week recommended.</p>
                  </div>
                </div>
                
                <div className={styles.severityRow}>
                  <span className={`${styles.severityBadge} ${styles.info}`}>🔵 Info</span>
                  <div>
                    <strong>Informational insights</strong>
                    <p>Positive trends and confirmations. General performance indicators. No immediate action required.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* WHAT: Understanding insights features */}
            {/* WHY: Explain key metrics and badges */}
            <section className={styles.helpBlock}>
              <h3>📊 Understanding Insights</h3>
              <ul>
                <li><strong>Confidence Score:</strong> 0-100% indicating AI prediction reliability. Higher scores mean more confident predictions based on sufficient historical data.</li>
                <li><strong>Actionable Badge:</strong> Insights marked with this badge include specific recommendations you can act on immediately.</li>
                <li><strong>Related Events:</strong> Number of similar events used for comparison and context.</li>
                <li><strong>Timestamp:</strong> When the insight was generated. Daily aggregation runs automatically at midnight UTC.</li>
              </ul>
            </section>

            {/* WHAT: Action steps guidance */}
            {/* WHY: Guide users on next steps */}
            <section className={styles.helpBlock}>
              <h3>✅ Taking Action</h3>
              <ul>
                <li>Start by filtering for <strong>Critical</strong> severity insights first</li>
                <li>Review insights marked as <strong>Actionable</strong> for specific recommendations</li>
                <li>Use the <strong>Confidence Score</strong> to prioritize insights with higher reliability</li>
                <li>Click on individual insight cards to see full details and context</li>
                <li>Monitor <strong>Trends</strong> over time to track progress and improvements</li>
                <li>Use <strong>Benchmarks</strong> to understand your performance relative to peers</li>
              </ul>
            </section>
          </div>
        </div>
      )}

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
