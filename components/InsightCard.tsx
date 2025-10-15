/**
 * InsightCard Component
 * 
 * WHAT: Reusable card for displaying individual insights
 * WHY: Consistent presentation of insights across dashboard and detail views
 */

import React from 'react';
import styles from './InsightCard.module.css';

// WHAT: Insight interface matching backend
// WHY: Type-safe props for insight display
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

interface InsightCardProps {
  insight: Insight;
  compact?: boolean; // Compact mode for dashboard overview
  onClick?: () => void;
}

/**
 * WHAT: Get icon for insight type
 * WHY: Visual distinction between insight types
 */
function getTypeIcon(type: Insight['type']): string {
  const icons = {
    anomaly: '⚠️',
    trend: '📈',
    benchmark: '🏆',
    prediction: '🔮',
    recommendation: '💡',
  };
  return icons[type];
}

/**
 * WHAT: Get CSS class for severity
 * WHY: Visual priority indication
 */
function getSeverityClass(severity: Insight['severity']): string {
  return styles[severity] || styles.info;
}

/**
 * WHAT: Format confidence score
 * WHY: Human-readable confidence display
 */
function formatConfidence(confidence: number): string {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 75) return 'High';
  if (confidence >= 60) return 'Moderate';
  return 'Low';
}

/**
 * WHAT: Format metric name for display
 * WHY: Convert technical names to user-friendly labels
 */
function formatMetric(metric: string): string {
  const names: Record<string, string> = {
    attendance: 'Attendance',
    eventAttendees: 'Attendance',
    allImages: 'Total Images',
    totalFans: 'Total Fans',
    merched: 'Merchandised Fans',
    engagement: 'Engagement',
    overall: 'Overall',
  };
  return names[metric] || metric;
}

export default function InsightCard({ insight, compact = false, onClick }: InsightCardProps) {
  return (
    <div
      className={`${styles.card} ${getSeverityClass(insight.severity)} ${
        compact ? styles.compact : ''
      } ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      {/* WHAT: Header with type icon and severity badge */}
      {/* WHY: Quick visual identification of insight importance */}
      <div className={styles.header}>
        <div className={styles.typeIcon}>
          <span>{getTypeIcon(insight.type)}</span>
          <span className={styles.typeLabel}>{insight.type}</span>
        </div>
        <div className={styles.badges}>
          <span className={`${styles.severityBadge} ${styles[insight.severity]}`}>
            {insight.severity}
          </span>
          {insight.actionable && (
            <span className={styles.actionableBadge}>Actionable</span>
          )}
        </div>
      </div>

      {/* WHAT: Main content area */}
      {/* WHY: Primary insight information */}
      <div className={styles.content}>
        <h3 className={styles.title}>{insight.title}</h3>
        
        {/* WHAT: Metric and value display */}
        {/* WHY: Show what metric this insight relates to */}
        <div className={styles.metricRow}>
          <span className={styles.metric}>{formatMetric(insight.metric)}</span>
          {insight.value !== undefined && (
            <span className={styles.value}>
              {insight.value.toLocaleString()}
              {insight.change !== undefined && (
                <span className={`${styles.change} ${insight.change > 0 ? styles.positive : styles.negative}`}>
                  {insight.change > 0 ? '+' : ''}
                  {insight.change.toFixed(1)}%
                </span>
              )}
            </span>
          )}
        </div>

        {/* WHAT: Full description (hidden in compact mode) */}
        {/* WHY: Detailed explanation of the insight */}
        {!compact && (
          <p className={styles.description}>{insight.description}</p>
        )}

        {/* WHAT: Confidence indicator */}
        {/* WHY: Show reliability of the insight */}
        <div className={styles.confidence}>
          <span className={styles.confidenceLabel}>Confidence:</span>
          <span className={styles.confidenceValue}>
            {formatConfidence(insight.confidence)} ({insight.confidence}%)
          </span>
          <div className={styles.confidenceBar}>
            <div
              className={styles.confidenceProgress}
              style={{ width: `${insight.confidence}%` }}
            />
          </div>
        </div>

        {/* WHAT: Recommendation display (if actionable) */}
        {/* WHY: Show suggested next steps */}
        {!compact && insight.recommendation && (
          <div className={styles.recommendation}>
            <strong>💡 Recommendation:</strong>
            <p>{insight.recommendation}</p>
          </div>
        )}

        {/* WHAT: Related events indicator */}
        {/* WHY: Show if there are similar events to compare */}
        {!compact && insight.relatedEvents && insight.relatedEvents.length > 0 && (
          <div className={styles.relatedEvents}>
            <span>🔗 {insight.relatedEvents.length} similar event{insight.relatedEvents.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* WHAT: Footer with timestamp */}
      {/* WHY: Show when insight was generated */}
      {!compact && (
        <div className={styles.footer}>
          <span className={styles.timestamp}>
            Generated: {new Date(insight.createdAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
