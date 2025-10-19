'use client';

/**
 * InsightCard Component
 * 
 * WHAT: Card for displaying AI-generated insights from Phase 2
 * WHY: Present actionable intelligence in a scannable format
 * HOW: Structured card with priority, category, message, and recommendations
 * 
 * Features:
 * - Priority-based visual styling (critical, high, medium, low)
 * - Category icons (anomaly, trend, benchmark, opportunity)
 * - Expandable recommendations section
 * - Confidence indicators
 * - Interactive actions (mark as actioned, dismiss)
 * 
 * Version: 6.28.0 (Phase 3 - Dashboards)
 * Created: 2025-10-19T13:20:00.000Z
 */

import React, { useState } from 'react';
import type { Insight } from '@/lib/insightsEngine';
import styles from './InsightCard.module.css';

interface InsightCardProps {
  insight: Insight;
  onAction?: (insightId: string) => void;
  onDismiss?: (insightId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

/**
 * WHAT: Get icon emoji for insight category
 * WHY: Visual distinction between different types of insights
 */
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    anomaly: '🚨',
    trend: '📈',
    benchmark: '⭐',
    opportunity: '💡',
  };
  return icons[category] || '📊';
}

/**
 * WHAT: Get impact emoji for visual indication
 * WHY: Quick recognition of positive/negative insights
 */
function getImpactEmoji(impact: string): string {
  const emojis: Record<string, string> = {
    positive: '✅',
    negative: '⚠️',
    neutral: 'ℹ️',
  };
  return emojis[impact] || '';
}

export default function InsightCard({
  insight,
  onAction,
  onDismiss,
  showActions = true,
  compact = false,
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const priorityClass = styles[`priority--${insight.priority}`] || '';
  const categoryIcon = getCategoryIcon(insight.category);
  const impactEmoji = getImpactEmoji(insight.impact);

  return (
    <div className={`${styles.insightCard} ${priorityClass} ${compact ? styles.compact : ''}`}>
      {/* WHAT: Header with priority, category, and confidence */}
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.categoryIcon}>{categoryIcon}</span>
          <span className={styles.category}>{insight.category}</span>
          <span className={styles.dot}>•</span>
          <span className={styles.priority}>{insight.priority}</span>
          {insight.confidence > 0.7 && (
            <>
              <span className={styles.dot}>•</span>
              <span className={styles.confidence}>
                {Math.round(insight.confidence * 100)}% confidence
              </span>
            </>
          )}
        </div>
        {showActions && (
          <div className={styles.actions}>
            {onAction && (
              <button
                onClick={() => onAction(insight.id)}
                className={styles.actionButton}
                title="Mark as actioned"
                aria-label="Mark insight as actioned"
              >
                ✓
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(insight.id)}
                className={styles.dismissButton}
                title="Dismiss"
                aria-label="Dismiss insight"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* WHAT: Main insight content */}
      <div className={styles.content}>
        <h3 className={styles.title}>
          {impactEmoji} {insight.title}
        </h3>
        <p className={styles.message}>{insight.message}</p>

        {/* WHAT: Metrics affected */}
        {insight.metrics && insight.metrics.length > 0 && (
          <div className={styles.metrics}>
            <span className={styles.metricsLabel}>Metrics:</span>
            {insight.metrics.map((metric, index) => (
              <span key={index} className={styles.metricTag}>
                {metric}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* WHAT: Expandable recommendation section */}
      {insight.recommendation && (
        <div className={styles.recommendation}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.recommendationToggle}
            aria-expanded={isExpanded}
          >
            <span className={styles.recommendationLabel}>
              💡 Recommendation
            </span>
            <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
          </button>
          {isExpanded && (
            <div className={styles.recommendationContent}>
              {insight.recommendation}
            </div>
          )}
        </div>
      )}

      {/* WHAT: Context data (if available) */}
      {insight.context && Object.keys(insight.context).length > 0 && isExpanded && (
        <div className={styles.context}>
          {Object.entries(insight.context).map(([key, value]) => (
            <div key={key} className={styles.contextItem}>
              <span className={styles.contextKey}>{key}:</span>
              <span className={styles.contextValue}>
                {typeof value === 'number' ? value.toLocaleString() : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
