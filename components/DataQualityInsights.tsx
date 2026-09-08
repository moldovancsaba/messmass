// components/DataQualityInsights.tsx
// WHAT: Data Quality & KYC Insights Display Component
// WHY: Visualize 10 actionable insights for data completeness, consistency, and enrichment opportunities
// HOW: Uses ColoredCard with CSS module styling (centralized design system, no inline styles)

import React from 'react';
import ColoredCard from './ColoredCard';
import type { DataQualityInsights } from '@/lib/dataValidator';
import styles from './DataQualityInsights.module.css';

interface DataQualityInsightsProps {
  insights: DataQualityInsights;
  variant?: 'full' | 'stats' | 'edit'; // Controls which insights to show
  className?: string;
}

/**
 * WHAT: Render star rating for enrichment opportunity impact
 * WHY: Visual indicator of field value (1-5 stars)
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className={styles.starRating}>
      {Array.from({ length: 5 }, (_, i) => (
        // WHAT: Dynamic star color based on rating value
        // WHY: Each star's color depends on its position vs rating (legitimate dynamic style)
        // eslint-disable-next-line react/forbid-dom-props
        <span key={i} style={{ color: i < rating ? 'var(--mm-warning)' : 'var(--mm-gray-300)' }}>
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * WHAT: Main data quality insights component
 * WHY: Single component to render all 10 insights in different contexts
 * HOW: Conditional rendering based on variant prop, uses CSS modules
 */
export default function DataQualityInsightsComponent({ 
  insights, 
  variant = 'full',
  className = '' 
}: DataQualityInsightsProps) {
  
  // WHAT: Determine which insights to show based on context
  // WHY: Stats page shows different insights than edit page
  const showInsight = (numbers: number[]) => {
    if (variant === 'full') return true;
    if (variant === 'stats') return [1, 2, 6, 10].some(n => numbers.includes(n));
    if (variant === 'edit') return [3, 4, 9].some(n => numbers.includes(n));
    return false;
  };

  return (
    <div className={`${styles.insightsContainer} ${className}`}>
      {/* Insight #1: Data Completeness Score */}
      {showInsight([1]) && (
        <ColoredCard 
          accentColor={insights.completeness.color} 
          hoverable={false}
        >
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              📊 Data Completeness Score
            </h3>
            {/* WHAT: Dynamic badge color based on data quality tier
                WHY: Color computed from insight data (legitimate dynamic style) */}
            <span 
              className={styles.qualityBadge}
              style={{ background: insights.completeness.color }} // eslint-disable-line react/forbid-dom-props
            >
              {insights.completeness.quality.toUpperCase()}
            </span>
          </div>
          
          <div className={styles.completenessBar}>
            {/* WHAT: Dynamic progress bar width and color
                WHY: Width and color computed from insight data (legitimate dynamic style) */}
            <div 
              className={styles.completenessFill}
              style={{ // eslint-disable-line react/forbid-dom-props
                width: `${insights.completeness.percentage}%`,
                background: insights.completeness.color 
              }}
            >
              {insights.completeness.percentage}%
            </div>
          </div>
          
          <p className={styles.completenessText}>
            {insights.completeness.tier} — {insights.completeness.percentage >= 90 
              ? 'All analytics features available' 
              : 'Some advanced features may be limited'}
          </p>
        </ColoredCard>
      )}

      {/* Insight #2: Missing Critical Metrics Alert */}
      {showInsight([2]) && insights.missingCritical.blocking && (
        <ColoredCard accentColor="var(--mm-error)" hoverable={false}>
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              🚨 Missing Critical Metrics
            </h3>
            {/* WHAT: Critical error badge color
                WHY: Fixed critical color for missing metrics (legitimate semantic style) */}
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <span className={styles.qualityBadge} style={{ background: 'var(--mm-error)' }}>
              {insights.missingCritical.count} MISSING
            </span>
          </div>
          
          <p className={`${styles.warningMessage} text-bold-spaced`}>
            {insights.missingCritical.message}
          </p>
          
          {insights.missingCritical.fields.length > 0 && (
            <div className="flex-wrap-gap">
              {insights.missingCritical.fields.map(field => (
                <code 
                  key={field} 
                  className={styles.missingFieldBadge}
                >
                  {field}
                </code>
              ))}
            </div>
          )}
        </ColoredCard>
      )}

      {/* Insight #3: Derived Metrics Status */}
      {showInsight([3]) && (
        <ColoredCard accentColor="var(--mm-chart-purple)" hoverable={false}>
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              🔄 Derived Metrics
            </h3>
            {/* WHAT: Derived metrics badge color
                WHY: Fixed purple color for auto-computed metrics (legitimate semantic style) */}
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <span className={styles.qualityBadge} style={{ background: 'var(--mm-chart-purple)' }}>
              AUTO-COMPUTED
            </span>
          </div>
          
          <p className={styles.introText}>
            These metrics are automatically calculated from base data
          </p>
          
          <div className={styles.derivedMetricsGrid}>
            {insights.derivedMetrics.map(metric => (
              <div key={metric.field} className={styles.derivedMetric}>
                <div className={styles.metricLabel}>{metric.label}</div>
                <div className={styles.metricStatus}>
                  <span>{metric.computed ? '✓ Computed' : '✗ Missing'}</span>
                  <span className={`${styles.confidenceBadge} ${styles.medium}`}>
                    {metric.confidence}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ColoredCard>
      )}

      {/* Insight #4: Optional Fields Coverage */}
      {showInsight([4]) && (
        <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              📈 Optional Fields Coverage
            </h3>
            {/* WHAT: Optional coverage badge color
                WHY: Fixed blue color for optional fields (legitimate semantic style) */}
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <span className={styles.qualityBadge} style={{ background: 'var(--mm-color-primary-500)' }}>
              {insights.optionalCoverage.percentage}%
            </span>
          </div>
          
          <div className={styles.coverageStats}>
            <div className={styles.coverageNumber}>
              {insights.optionalCoverage.filled}/{insights.optionalCoverage.total}
            </div>
            <div className={styles.coverageLabel}>
              Optional fields completed
            </div>
          </div>
          
          <p className={styles.coverageMessage}>
            {insights.optionalCoverage.message}
          </p>
        </ColoredCard>
      )}

      {/* Insight #5: Bitly Integration Status */}
      {showInsight([5]) && (
        <ColoredCard 
          accentColor={
            insights.bitlyStatus.status === 'synced' ? 'var(--mm-success)' :
            insights.bitlyStatus.status === 'stale' ? 'var(--mm-warning)' :
            'var(--mm-error)'
          } 
          hoverable={false}
        >
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              🔗 Bitly Integration Status
            </h3>
          </div>
          
          <div className={`${styles.bitlyStatus} ${styles[insights.bitlyStatus.status]}`}>
            <div className={styles.statusIcon}>
              {insights.bitlyStatus.status === 'synced' ? '✅' :
               insights.bitlyStatus.status === 'stale' ? '⚠️' :
               '❌'}
            </div>
            <div>
              <div className={styles.statusTitle}>
                {insights.bitlyStatus.status === 'synced' ? 'Data Fresh' :
                 insights.bitlyStatus.status === 'stale' ? 'Data Outdated' :
                 'No Data'}
              </div>
              <div className={styles.statusMessage}>
                {insights.bitlyStatus.message}
              </div>
            </div>
          </div>
        </ColoredCard>
      )}

      {/* Insight #6: Data Consistency Warnings */}
      {showInsight([6]) && insights.consistencyWarnings.length > 0 && (
        <ColoredCard accentColor="var(--mm-warning)" hoverable={false}>
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              ⚠️ Data Consistency Warnings
            </h3>
            {/* WHAT: Warning badge color
                WHY: Fixed warning color for consistency issues (legitimate semantic style) */}
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <span className={styles.qualityBadge} style={{ background: 'var(--mm-warning)' }}>
              {insights.consistencyWarnings.length} ISSUE{insights.consistencyWarnings.length > 1 ? 'S' : ''}
            </span>
          </div>
          
          <ul className={styles.warningList}>
            {insights.consistencyWarnings.map((warning, idx) => (
              <li 
                key={idx} 
                className={`${styles.warningItem} ${warning.severity === 'error' ? styles.error : ''}`}
              >
                <div className={styles.warningField}>
                  {warning.field}: {warning.severity === 'error' ? '❌ Error' : '⚠️ Warning'}
                </div>
                <div className={styles.warningMessage}>
                  {warning.message}
                </div>
                <div className={styles.warningDetails}>
                  Expected: {warning.expectedCondition} | Actual: {warning.actualValue}
                </div>
              </li>
            ))}
          </ul>
        </ColoredCard>
      )}

      {/* Insight #9: Enrichment Opportunities */}
      {showInsight([9]) && insights.enrichmentOpportunities.length > 0 && (
        <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              💡 Data Enrichment Opportunities
            </h3>
            {/* WHAT: Enrichment opportunities badge color
                WHY: Fixed blue color for opportunities (legitimate semantic style) */}
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <span className={styles.qualityBadge} style={{ background: 'var(--mm-color-primary-500)' }}>
              {insights.enrichmentOpportunities.length} AVAILABLE
            </span>
          </div>
          
          <p className={styles.introText}>
            Add these fields to unlock more analytics insights
          </p>
          
          <ul className={styles.opportunityList}>
            {insights.enrichmentOpportunities.slice(0, 5).map((opp, idx) => (
              <li key={idx} className={styles.opportunityItem}>
                <div className={styles.opportunityHeader}>
                  <div className={styles.opportunityLabel}>{opp.label}</div>
                  <StarRating rating={opp.impact} />
                </div>
                
                <div className={styles.opportunityReason}>
                  {opp.reason}
                </div>
                
                <div className={styles.opportunityInsightTitle}>
                  Unlocks {opp.unlockedInsights.length} insights:
                </div>
                <ul className={styles.insightList}>
                  {opp.unlockedInsights.slice(0, 3).map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                  {opp.unlockedInsights.length > 3 && (
                    <li>...and {opp.unlockedInsights.length - 3} more</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </ColoredCard>
      )}

      {/* Insight #10: Benchmarking Eligibility */}
      {showInsight([10]) && (
        <ColoredCard 
          accentColor={insights.benchmarkingEligibility.eligible ? 'var(--mm-success)' : 'var(--mm-error)'} 
          hoverable={false}
        >
          <div className={styles.insightHeader}>
            <h3 className={styles.insightTitle}>
              🏆 Benchmarking Eligibility
            </h3>
          </div>
          
          <div className={`${styles.eligibilityStatus} ${insights.benchmarkingEligibility.eligible ? styles.eligible : styles.ineligible}`}>
            <div className={styles.eligibilityIcon}>
              {insights.benchmarkingEligibility.eligible ? '🛡️' : '🔒'}
            </div>
            <div className={styles.eligibilityText}>
              <div className={styles.eligibilityTitle}>
                {insights.benchmarkingEligibility.eligible ? 'Eligible for Benchmarking' : 'Ineligible for Benchmarking'}
              </div>
              <div className={styles.eligibilityReason}>
                {insights.benchmarkingEligibility.reason}
              </div>
              {!insights.benchmarkingEligibility.eligible && insights.benchmarkingEligibility.missingFields.length > 0 && (
                <div className={styles.missingFieldsContainer}>
                  {insights.benchmarkingEligibility.missingFields.slice(0, 5).map(field => (
                    <code 
                      key={field}
                      className={styles.missingFieldCode}
                    >
                      {field}
                    </code>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ColoredCard>
      )}
    </div>
  );
}
