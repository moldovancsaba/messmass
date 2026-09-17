// lib/combinedInsight.ts
// WHAT: A lossless union type for the two DISPLAY-level insight shapes --
//     lib/insightsEngine.ts's Insight (Executive Dashboard) and
//     lib/analytics-insights.ts's Insight (partner/org Analytics Insights).
// WHY: messmass#414 follow-up, corrected. lib/anomalySignal.ts merges the two
//     RAW detector outputs (AnomalyResult, Anomaly) -- but neither dashboard
//     actually renders those directly. Both wrap their detector's output into
//     their OWN "Insight" type first (title, recommendation, category/type),
//     and those two "Insight" interfaces -- same name, different shape --
//     are what /admin/analytics/combined-insights actually needs to merge.
//     They use three DIFFERENT severity vocabularies between them and the raw
//     detectors: insightsEngine.ts's Insight uses `priority`
//     (critical/high/medium/low, 4 levels), analytics-insights.ts's Insight
//     uses `severity` (info/warning/critical, 3 levels, different words from
//     either raw detector's severity scale). Nesting by source preserves all
//     three vocabularies with their real field names, the same principle
//     lib/anomalySignal.ts uses one layer down.
// HOW: fromExecutiveInsight/fromAnalyticsInsight are pure, total conversions.

import type { Insight as ExecutiveInsight } from './insightsEngine';
import type { Insight as AnalyticsInsight } from './analytics-insights';

export interface CombinedInsight {
  id: string;
  source: 'executive' | 'analytics';
  title: string;
  message: string;
  confidence: number; // Normalized to 0-100 here for sorting; each source's own raw scale is preserved below.
  createdAt: string;

  /** Present only when source === 'executive'. Every field from insightsEngine.ts's Insight. */
  executive?: {
    category: ExecutiveInsight['category'];
    priority: ExecutiveInsight['priority'];
    metrics: string[];
    /** Raw 0-1 confidence, as insightsEngine.ts computes it. */
    confidence: number;
    impact: ExecutiveInsight['impact'];
    recommendation?: string;
    context: ExecutiveInsight['context'];
  };

  /** Present only when source === 'analytics'. Every field from analytics-insights.ts's Insight. */
  analytics?: {
    type: AnalyticsInsight['type'];
    severity: AnalyticsInsight['severity'];
    metric: string;
    value?: number;
    change?: number;
    /** Raw 0-100 confidence, as analytics-insights.ts computes it. */
    confidence: number;
    actionable: boolean;
    recommendation?: string;
    relatedEvents?: string[];
    metadata?: Record<string, unknown>;
  };
}

export function fromExecutiveInsight(insight: ExecutiveInsight, createdAt: string): CombinedInsight {
  return {
    id: insight.id,
    source: 'executive',
    title: insight.title,
    message: insight.message,
    confidence: Math.round(insight.confidence * 100), // 0-1 -> 0-100, for cross-source sorting only.
    createdAt,
    executive: {
      category: insight.category,
      priority: insight.priority,
      metrics: insight.metrics,
      confidence: insight.confidence,
      impact: insight.impact,
      recommendation: insight.recommendation,
      context: insight.context,
    },
  };
}

export function fromAnalyticsInsight(insight: AnalyticsInsight): CombinedInsight {
  return {
    id: insight.id,
    source: 'analytics',
    title: insight.title,
    message: insight.description,
    confidence: insight.confidence, // Already 0-100.
    createdAt: insight.createdAt,
    analytics: {
      type: insight.type,
      severity: insight.severity,
      metric: insight.metric,
      value: insight.value,
      change: insight.change,
      confidence: insight.confidence,
      actionable: insight.actionable,
      recommendation: insight.recommendation,
      relatedEvents: insight.relatedEvents,
      metadata: insight.metadata,
    },
  };
}

/**
 * WHAT: A single, best-effort "how urgent is this" rank for cross-source sorting only.
 * WHY: The two priority/severity vocabularies aren't the same scale (4 levels vs 3,
 *     different words) and are NOT collapsed into one field on CombinedInsight itself
 *     (see the module comment) -- this exists only to order a mixed list, and reads
 *     each source's own field rather than inventing a shared one.
 */
export function combinedInsightRank(insight: CombinedInsight): number {
  if (insight.executive) {
    const order: Record<ExecutiveInsight['priority'], number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return order[insight.executive.priority];
  }
  if (insight.analytics) {
    const order: Record<AnalyticsInsight['severity'], number> = { critical: 4, warning: 2, info: 1 };
    return order[insight.analytics.severity];
  }
  return 0;
}
