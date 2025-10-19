/**
 * Insights Engine
 * 
 * WHAT: Rule-based intelligence layer that generates actionable insights from event analytics
 * WHY: Transform raw metrics into business intelligence with natural language explanations
 * HOW: Combines anomaly detection, trend analysis, and benchmarking to auto-generate 5-10 insights per event
 * 
 * Version: 6.27.0 (Phase 2 - Insights Engine)
 * Created: 2025-10-19T12:43:10.000Z
 */

import { detectMultiMethodAnomalies, type AnomalyResult, type AnomalySeverity } from './anomalyDetection';
import { analyzeTrend, detectConsecutiveTrend, type DataPoint, type TrendAnalysis } from './trendAnalysis';
import { benchmarkMetric, type BenchmarkResult, type PerformanceRating } from './benchmarkEngine';
import type { AnalyticsAggregate } from './analytics.types';

export type InsightCategory = 
  | 'performance' // Overall performance assessment
  | 'anomaly' // Unusual patterns detected
  | 'trend' // Growth/decline patterns
  | 'benchmark' // Comparative analysis
  | 'opportunity' // Potential improvements
  | 'risk' // Concerning patterns requiring attention
  | 'prediction'; // Forecasts

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Insight {
  id: string;
  category: InsightCategory;
  priority: InsightPriority;
  title: string; // Short headline
  message: string; // Detailed explanation
  metrics: string[]; // Metrics involved
  confidence: number; // 0-1, how reliable is this insight
  impact: 'positive' | 'negative' | 'neutral';
  recommendation?: string; // Action to take
  context: {
    current?: number;
    baseline?: number;
    percentile?: number;
    deviation?: number;
    trend?: string;
  };
}

export interface InsightsReport {
  projectId: string;
  eventDate: string;
  generatedAt: string;
  insights: Insight[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    overallScore: number; // 0-100
    overallRating: PerformanceRating;
    topStrengths: string[];
    topWeaknesses: string[];
  };
}

/**
 * WHAT: Generate unique insight ID
 * WHY: Track and deduplicate insights
 */
function generateInsightId(category: InsightCategory, metric: string): string {
  return `${category}-${metric}-${Date.now()}`;
}

/**
 * WHAT: Map anomaly severity to insight priority
 * WHY: Align statistical significance with business priority
 */
function anomalySeverityToPriority(severity: AnomalySeverity): InsightPriority {
  const mapping: Record<AnomalySeverity, InsightPriority> = {
    critical: 'critical',
    warning: 'high',
    info: 'medium',
  };
  return mapping[severity];
}

/**
 * WHAT: Generate anomaly insights
 * WHY: Alert to unusual performance patterns that need attention
 */
function generateAnomalyInsights(
  metric: string,
  currentValue: number,
  historicalValues: number[],
  baseline: number | null
): Insight[] {
  const insights: Insight[] = [];
  
  const anomalyResult = detectMultiMethodAnomalies(
    currentValue,
    historicalValues,
    baseline,
    metric
  );
  
  if (anomalyResult.consensus && anomalyResult.primaryResult.isAnomaly) {
    const result = anomalyResult.primaryResult;
    
    insights.push({
      id: generateInsightId('anomaly', metric),
      category: 'anomaly',
      priority: anomalySeverityToPriority(result.severity),
      title: `${metric} shows ${result.type} anomaly`,
      message: result.message,
      metrics: [metric],
      confidence: anomalyResult.results.filter(r => r.isAnomaly).length / anomalyResult.results.length,
      impact: result.type,
      recommendation: result.type === 'negative'
        ? `Investigate why ${metric} is significantly ${result.deviation > 0 ? 'above' : 'below'} normal levels`
        : `Analyze what drove exceptional ${metric} performance for replication`,
      context: {
        current: currentValue,
        baseline: result.context.mean || result.context.median,
        deviation: result.deviation,
      },
    });
  }
  
  return insights;
}

/**
 * WHAT: Generate trend insights
 * WHY: Understand growth/decline patterns and predict future performance
 */
function generateTrendInsights(
  metric: string,
  dataPoints: DataPoint[]
): Insight[] {
  const insights: Insight[] = [];
  
  const trendAnalysis = analyzeTrend(dataPoints);
  
  // WHAT: Significant trend detected
  if (trendAnalysis.confidence > 0.6 && trendAnalysis.direction !== 'insufficient_data') {
    const priority: InsightPriority = 
      trendAnalysis.direction === 'declining' && trendAnalysis.confidence > 0.7 ? 'high' :
      trendAnalysis.direction === 'increasing' && trendAnalysis.confidence > 0.7 ? 'medium' : 'low';
    
    insights.push({
      id: generateInsightId('trend', metric),
      category: 'trend',
      priority,
      title: `${metric} shows ${trendAnalysis.direction} trend`,
      message: trendAnalysis.message,
      metrics: [metric],
      confidence: trendAnalysis.confidence,
      impact: trendAnalysis.direction === 'increasing' ? 'positive' : 
              trendAnalysis.direction === 'declining' ? 'negative' : 'neutral',
      recommendation: trendAnalysis.direction === 'declining'
        ? `Address declining ${metric} — predicted next value: ${trendAnalysis.prediction.nextValue.toFixed(0)} (±${trendAnalysis.prediction.margin.toFixed(0)})`
        : trendAnalysis.direction === 'increasing'
        ? `Maintain positive ${metric} momentum — forecasted growth continues`
        : `Monitor ${metric} for changes`,
      context: {
        trend: trendAnalysis.direction,
        current: dataPoints[dataPoints.length - 1].value,
        deviation: trendAnalysis.slope,
      },
    });
  }
  
  // WHAT: Consecutive decline warning
  const values = dataPoints.map(dp => dp.value);
  const consecutiveTrend = detectConsecutiveTrend(values);
  
  if (consecutiveTrend.type === 'decreasing' && consecutiveTrend.count >= 3) {
    insights.push({
      id: generateInsightId('risk', `${metric}-consecutive`),
      category: 'risk',
      priority: 'critical',
      title: `⚠️ ${metric} declining ${consecutiveTrend.count} events in a row`,
      message: consecutiveTrend.message,
      metrics: [metric],
      confidence: 0.9, // High confidence for consecutive declines
      impact: 'negative',
      recommendation: `Immediate action required — investigate root cause of sustained ${metric} decline`,
      context: {
        current: values[values.length - 1],
        trend: 'consecutive_decline',
      },
    });
  }
  
  return insights;
}

/**
 * WHAT: Generate benchmark insights
 * WHY: Provide competitive context - how do we compare?
 */
function generateBenchmarkInsights(
  metric: string,
  currentValue: number,
  competitorValues: number[]
): Insight[] {
  const insights: Insight[] = [];
  
  const benchmarkResult = benchmarkMetric(
    currentValue,
    competitorValues,
    metric,
    { type: 'league' }
  );
  
  // WHAT: Top/bottom performer insight
  if (benchmarkResult.rating === 'excellent') {
    insights.push({
      id: generateInsightId('performance', `${metric}-benchmark`),
      category: 'performance',
      priority: 'medium',
      title: `🌟 ${metric} ranks in top 10% (${benchmarkResult.percentile}th percentile)`,
      message: benchmarkResult.message,
      metrics: [metric],
      confidence: 0.8,
      impact: 'positive',
      recommendation: `Document best practices for ${metric} — share learnings across organization`,
      context: {
        current: currentValue,
        baseline: benchmarkResult.benchmark,
        percentile: benchmarkResult.percentile,
      },
    });
  } else if (benchmarkResult.rating === 'poor') {
    insights.push({
      id: generateInsightId('risk', `${metric}-benchmark`),
      category: 'risk',
      priority: 'high',
      title: `🔴 ${metric} ranks in bottom 10% (${benchmarkResult.percentile}th percentile)`,
      message: benchmarkResult.message,
      metrics: [metric],
      confidence: 0.8,
      impact: 'negative',
      recommendation: `Priority improvement area — ${metric} significantly underperforms league average`,
      context: {
        current: currentValue,
        baseline: benchmarkResult.benchmark,
        percentile: benchmarkResult.percentile,
      },
    });
  }
  
  // WHAT: Significant deviation from average
  if (Math.abs(benchmarkResult.relativePerformance) > 30) {
    const direction = benchmarkResult.relativePerformance > 0 ? 'above' : 'below';
    
    insights.push({
      id: generateInsightId('benchmark', metric),
      category: 'benchmark',
      priority: benchmarkResult.relativePerformance < 0 ? 'high' : 'medium',
      title: `${metric} is ${Math.abs(benchmarkResult.relativePerformance).toFixed(0)}% ${direction} league average`,
      message: benchmarkResult.message,
      metrics: [metric],
      confidence: 0.75,
      impact: benchmarkResult.relativePerformance > 0 ? 'positive' : 'negative',
      recommendation: benchmarkResult.relativePerformance < 0
        ? `Study top performers to identify ${metric} improvement strategies`
        : `Leverage high ${metric} performance in marketing materials`,
      context: {
        current: currentValue,
        baseline: benchmarkResult.benchmark,
        percentile: benchmarkResult.percentile,
      },
    });
  }
  
  return insights;
}

/**
 * WHAT: Generate opportunity insights
 * WHY: Identify untapped potential and improvement areas
 */
function generateOpportunityInsights(aggregate: AnalyticsAggregate): Insight[] {
  const insights: Insight[] = [];
  
  // WHAT: Low merchandise penetration opportunity
  const merchPenetration = aggregate.merchMetrics?.penetrationRate || 0;
  if (merchPenetration < 40 && aggregate.fanMetrics.totalFans > 500) {
    insights.push({
      id: generateInsightId('opportunity', 'merch-penetration'),
      category: 'opportunity',
      priority: 'medium',
      title: `Merchandise penetration at ${merchPenetration.toFixed(0)}% — growth potential`,
      message: `Only ${merchPenetration.toFixed(0)}% of ${aggregate.fanMetrics.totalFans} fans purchased merchandise. Industry average is 50-60%.`,
      metrics: ['merchandisePenetration', 'totalFans'],
      confidence: 0.7,
      impact: 'neutral',
      recommendation: `Improve merchandise visibility and variety. Potential revenue uplift: €${((aggregate.fanMetrics.totalFans * 0.2 * 30)).toFixed(0)} (20% increase at €30/fan)`,
      context: {
        current: merchPenetration,
        baseline: 50, // Industry average
      },
    });
  }
  
  // WHAT: High engagement but low ad value
  if (aggregate.fanMetrics.engagementRate > 5 && aggregate.adMetrics.totalROI < 50000) {
    insights.push({
      id: generateInsightId('opportunity', 'ad-monetization'),
      category: 'opportunity',
      priority: 'medium',
      title: `High engagement (${aggregate.fanMetrics.engagementRate.toFixed(1)}%) but low ad value — monetization gap`,
      message: `Strong fan engagement not fully monetized. Ad value of €${aggregate.adMetrics.totalROI.toFixed(0)} is below potential.`,
      metrics: ['engagementRate', 'adValue'],
      confidence: 0.6,
      impact: 'neutral',
      recommendation: `Optimize ad placements and sponsor visibility. Leverage high engagement for premium partnerships.`,
      context: {
        current: aggregate.adMetrics.totalROI,
      },
    });
  }
  
  return insights;
}

/**
 * WHAT: Generate insights for a single event
 * WHY: Provide comprehensive intelligence about event performance
 * HOW: Run all insight generators and prioritize top 10
 * 
 * @param currentAggregate - Current event analytics
 * @param historicalAggregates - Previous events for comparison
 * @returns Complete insights report with 5-10 prioritized insights
 */
export function generateEventInsights(
  currentAggregate: AnalyticsAggregate,
  historicalAggregates: AnalyticsAggregate[]
): InsightsReport {
  const allInsights: Insight[] = [];
  
  // WHAT: Extract historical data for trend/anomaly analysis
  const fanDataPoints: DataPoint[] = historicalAggregates.map(agg => ({
    date: agg.eventDate,
    value: agg.fanMetrics?.totalFans || 0,
  }));
  fanDataPoints.push({
    date: currentAggregate.eventDate,
    value: currentAggregate.fanMetrics?.totalFans || 0,
  });
  
  const merchDataPoints: DataPoint[] = historicalAggregates.map(agg => ({
    date: agg.eventDate,
    value: agg.merchMetrics?.totalMerched || 0,
  }));
  merchDataPoints.push({
    date: currentAggregate.eventDate,
    value: currentAggregate.merchMetrics?.totalMerched || 0,
  });
  
  const historicalFans = historicalAggregates.map(agg => agg.fanMetrics?.totalFans || 0);
  const historicalMerch = historicalAggregates.map(agg => agg.merchMetrics?.totalMerched || 0);
  const historicalAdValue = historicalAggregates.map(agg => agg.adMetrics?.totalROI || 0);
  
  // WHAT: Generate insights from all sources
  
  // 1. Anomaly insights
  allInsights.push(...generateAnomalyInsights(
    'Total Fans',
    currentAggregate.fanMetrics.totalFans,
    historicalFans,
    historicalFans[historicalFans.length - 1] || null
  ));
  
  allInsights.push(...generateAnomalyInsights(
    'Merchandise Sales',
    currentAggregate.merchMetrics?.totalMerched || 0,
    historicalMerch,
    historicalMerch[historicalMerch.length - 1] || null
  ));
  
  // 2. Trend insights
  allInsights.push(...generateTrendInsights('Total Fans', fanDataPoints));
  allInsights.push(...generateTrendInsights('Merchandise Sales', merchDataPoints));
  
  // 3. Benchmark insights
  allInsights.push(...generateBenchmarkInsights(
    'Total Fans',
    currentAggregate.fanMetrics.totalFans,
    historicalFans
  ));
  
  allInsights.push(...generateBenchmarkInsights(
    'Ad Value',
    currentAggregate.adMetrics.totalROI,
    historicalAdValue
  ));
  
  // 4. Opportunity insights
  allInsights.push(...generateOpportunityInsights(currentAggregate));
  
  // WHAT: Prioritize insights (top 10, sorted by priority and confidence)
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedInsights = allInsights
    .sort((a, b) => {
      // Sort by priority first, then confidence
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    })
    .slice(0, 10); // Top 10 insights
  
  // WHAT: Generate summary
  const summary = {
    critical: sortedInsights.filter(i => i.priority === 'critical').length,
    high: sortedInsights.filter(i => i.priority === 'high').length,
    medium: sortedInsights.filter(i => i.priority === 'medium').length,
    low: sortedInsights.filter(i => i.priority === 'low').length,
    overallScore: 70, // TODO: Calculate from benchmarks
    overallRating: 'average' as PerformanceRating,
    topStrengths: sortedInsights
      .filter(i => i.impact === 'positive')
      .slice(0, 3)
      .map(i => i.title),
    topWeaknesses: sortedInsights
      .filter(i => i.impact === 'negative')
      .slice(0, 3)
      .map(i => i.title),
  };
  
  return {
    projectId: currentAggregate.projectId.toString(),
    eventDate: currentAggregate.eventDate,
    generatedAt: new Date().toISOString(),
    insights: sortedInsights,
    summary,
  };
}
