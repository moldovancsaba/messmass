/**
 * Analytics Insights Engine
 * 
 * WHAT: Orchestrator that generates actionable insights from all analytics modules
 * WHY: Transform raw analytics into human-readable, prioritized recommendations
 * 
 * Integrates:
 * - Anomaly Detection: Flag unusual patterns
 * - Trend Analysis: Identify increasing/decreasing metrics
 * - Benchmarking: Compare to peers and history
 * - Predictions: Forecast future performance
 */

import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import config from './config';
import { detectAnomalies, TimeSeriesDataPoint, Anomaly } from './analytics-anomaly';
import { analyzeTrend, TrendAnalysis } from './analytics-trends';
import {
  generateComprehensiveBenchmark,
  Benchmark,
  PercentileRanking,
} from './analytics-benchmarking';
import {
  predictAttendance,
  predictEngagement,
  Prediction,
  EventPredictionInput,
} from './analytics-predictions';

// ============================================================================
// TYPES
// ============================================================================

export interface Insight {
  id: string;
  type: 'anomaly' | 'trend' | 'benchmark' | 'prediction' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  metric: string; // e.g., 'attendance', 'engagement'
  title: string; // "Attendance 23% below average"
  description: string; // Full explanation
  value?: number;
  change?: number; // Percentage change
  confidence: number; // 0-100
  actionable: boolean; // Can user act on this?
  recommendation?: string; // Suggested action
  relatedEvents?: string[]; // Similar events
  createdAt: string;
  metadata?: Record<string, any>; // Additional context
}

export interface InsightsReport {
  eventId: string;
  eventName: string;
  insights: Insight[];
  summary: {
    totalInsights: number;
    critical: number;
    warnings: number;
    info: number;
    overallScore: number; // 0-100
    keyFindings: string[]; // Top 3 insights
  };
  generatedAt: string;
}

// ============================================================================
// CORE INSIGHT GENERATION
// ============================================================================

/**
 * WHAT: Validate event has minimum required metrics for insights
 * WHY: Prevent errors by checking data completeness before processing
 */
function hasMinimumMetrics(event: any): boolean {
  if (!event || !event.stats) return false;
  
  const s = event.stats;
  
  // Required base metrics for insights generation
  const hasEventAttendees = typeof s.eventAttendees === 'number' && s.eventAttendees > 0;
  const hasImages = typeof s.remoteImages === 'number' || typeof s.hostessImages === 'number' || typeof s.selfies === 'number';
  const hasFans = typeof s.stadium === 'number' || typeof s.remoteFans === 'number' || typeof s.indoor === 'number' || typeof s.outdoor === 'number';
  
  return hasEventAttendees && hasImages && hasFans;
}

/**
 * WHAT: Generate all insights for a specific event
 * WHY: Single function to get complete analytics picture
 * 
 * FAIL-PROOF: Returns null if event has insufficient data instead of throwing errors
 * 
 * @param eventId - Event to analyze
 * @returns Complete insights report or null if data insufficient
 */
export async function generateInsights(eventId: string): Promise<InsightsReport | null> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  // WHAT: Fetch event data
  // WHY: Need context for insights
  const event = await db.collection('projects').findOne({ _id: new ObjectId(eventId) });

  if (!event) {
    console.warn(`Event ${eventId} not found - skipping insights`);
    return null;
  }
  
  // WHAT: Validate event has minimum required metrics
  // WHY: Fail-proof - skip events with incomplete data instead of throwing errors
  if (!hasMinimumMetrics(event)) {
    console.warn(`Event ${eventId} (${event.eventName}) lacks minimum metrics - skipping insights`);
    return null;
  }

  const insights: Insight[] = [];

  // WHAT: Run all insight generators in parallel with error handling
  // WHY: Fail-proof - if one insight type fails, others still work
  const [anomalyInsights, trendInsights, benchmarkInsights, predictionInsights] =
    await Promise.all([
      generateAnomalyInsights(event).catch((err) => {
        console.warn(`Anomaly insights failed for ${eventId}:`, err.message);
        return [];
      }),
      generateTrendInsights(event).catch((err) => {
        console.warn(`Trend insights failed for ${eventId}:`, err.message);
        return [];
      }),
      generateBenchmarkInsights(event).catch((err) => {
        console.warn(`Benchmark insights failed for ${eventId}:`, err.message);
        return [];
      }),
      generatePredictionInsights(event).catch((err) => {
        console.warn(`Prediction insights failed for ${eventId}:`, err.message);
        return [];
      }),
    ]);

  // WHAT: Combine all insights
  // WHY: Single unified list
  insights.push(...anomalyInsights, ...trendInsights, ...benchmarkInsights, ...predictionInsights);

  // WHAT: Generate recommendations based on insights
  // WHY: Make insights actionable
  const recommendations = generateRecommendations(insights, event);
  insights.push(...recommendations);

  // WHAT: Sort by severity and confidence
  // WHY: Most important insights first
  insights.sort((a, b) => {
    const severityOrder = { critical: 3, warning: 2, info: 1 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    return b.confidence - a.confidence;
  });

  // WHAT: Calculate summary statistics
  // WHY: Quick overview of insights
  const summary = {
    totalInsights: insights.length,
    critical: insights.filter((i) => i.severity === 'critical').length,
    warnings: insights.filter((i) => i.severity === 'warning').length,
    info: insights.filter((i) => i.severity === 'info').length,
    overallScore: calculateOverallScore(insights),
    keyFindings: insights
      .filter((i) => i.severity !== 'info')
      .slice(0, 3)
      .map((i) => i.title),
  };

  return {
    eventId: eventId,
    eventName: event.eventName,
    insights,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// ANOMALY INSIGHTS
// ============================================================================

/**
 * WHAT: Generate insights from anomaly detection
 * WHY: Flag unusual patterns that need attention
 */
async function generateAnomalyInsights(event: any): Promise<Insight[]> {
  const insights: Insight[] = [];

  // WHAT: Get historical data for this event's metrics
  // WHY: Need time-series data to detect anomalies
  const client = await clientPromise;
  const db = client.db(config.dbName);

  const historicalData = await db
    .collection('projects')
    .find({ 'stats.eventAttendees': { $exists: true } })
    .limit(100)
    .sort({ eventDate: -1 })
    .toArray();

  if (historicalData.length < 10) return insights; // Not enough data

  // WHAT: Check attendance anomaly
  // WHY: Unusual attendance is critical insight
  if (event.stats?.eventAttendees) {
    const attendanceData: TimeSeriesDataPoint[] = historicalData.map((e) => ({
      date: e.eventDate,
      value: e.stats?.eventAttendees || 0,
    }));

    const anomalyResult = await detectAnomalies('attendance', attendanceData, {
      minDataPoints: 10,
    });

    // WHAT: Check if current event is anomalous
    // WHY: This event's attendance might be outlier
    const currentAnomaly = anomalyResult.anomalies.find((a) => a.date === event.eventDate);

    if (currentAnomaly) {
      const isPositive = currentAnomaly.deviation > 0;

      insights.push({
        id: `anomaly-attendance-${event._id}`,
        type: 'anomaly',
        severity: currentAnomaly.severity === 'high' ? 'critical' : 'warning',
        metric: 'attendance',
        title: isPositive
          ? `Attendance ${Math.abs(currentAnomaly.deviation).toFixed(0)}% above average`
          : `Attendance ${Math.abs(currentAnomaly.deviation).toFixed(0)}% below average`,
        description: currentAnomaly.description || 'Unusual attendance pattern detected',
        value: currentAnomaly.value,
        change: currentAnomaly.deviation,
        confidence: currentAnomaly.confidence,
        actionable: !isPositive, // Only actionable if negative
        recommendation: !isPositive
          ? 'Investigate factors causing low attendance. Review marketing, timing, or external factors.'
          : undefined,
        createdAt: new Date().toISOString(),
        metadata: {
          expectedValue: currentAnomaly.expectedValue,
          method: currentAnomaly.method,
        },
      });
    }
  }

  return insights;
}

// ============================================================================
// TREND INSIGHTS
// ============================================================================

/**
 * WHAT: Generate insights from trend analysis
 * WHY: Identify improving or declining metrics
 */
async function generateTrendInsights(event: any): Promise<Insight[]> {
  const insights: Insight[] = [];
  const client = await clientPromise;
  const db = client.db(config.dbName);

  // WHAT: Fetch partner's historical events
  // WHY: Trend analysis requires time-series data
  if (!event.partnerId) return insights;

  const partnerEvents = await db
    .collection('projects')
    .find({
      partnerId: event.partnerId,
      'stats.eventAttendees': { $exists: true },
    })
    .sort({ eventDate: 1 })
    .limit(20)
    .toArray();

  if (partnerEvents.length < 5) return insights; // Need minimum data

  // WHAT: Analyze attendance trend
  // WHY: Is partner's attendance improving or declining?
  const attendanceData: TimeSeriesDataPoint[] = partnerEvents.map((e) => ({
    date: e.eventDate,
    value: e.stats?.eventAttendees || 0,
  }));

  const trend = await analyzeTrend(attendanceData);

  if (trend.direction !== 'stable' && trend.strength !== 'weak') {
    const isIncreasing = trend.direction === 'increasing';

    insights.push({
      id: `trend-attendance-${event._id}`,
      type: 'trend',
      severity: !isIncreasing && trend.strength === 'strong' ? 'warning' : 'info',
      metric: 'attendance',
      title: `Attendance trend: ${trend.direction} (${trend.strength})`,
      description: `Over the last ${trend.dataPoints} events, attendance has been ${trend.direction} by ${Math.abs(trend.changePercent).toFixed(1)}%. Projected 30-day value: ${Math.round(trend.projection.value30days)}`,
      value: trend.endValue,
      change: trend.changePercent,
      confidence: trend.projection.confidence,
      actionable: !isIncreasing,
      recommendation: !isIncreasing
        ? 'Address declining attendance trend with targeted marketing or scheduling adjustments.'
        : undefined,
      createdAt: new Date().toISOString(),
      metadata: {
        slope: trend.slope,
        rSquared: trend.rSquared,
        projection30: trend.projection.value30days,
        projection90: trend.projection.value90days,
      },
    });
  }

  return insights;
}

// ============================================================================
// BENCHMARK INSIGHTS
// ============================================================================

/**
 * WHAT: Generate insights from benchmarking
 * WHY: Show how event compares to peers and history
 */
async function generateBenchmarkInsights(event: any): Promise<Insight[]> {
  const insights: Insight[] = [];

  // WHAT: Run comprehensive benchmark
  // WHY: Get percentile rankings and similar events
  const benchmark = await generateComprehensiveBenchmark(
    event._id.toString(),
    event.partnerId?.toString(),
    ['eventAttendees', 'allImages', 'totalFans', 'merched']
  );

  // WHAT: Create insights for top/bottom performers
  // WHY: Highlight exceptional or concerning performance
  benchmark.rankings.forEach((ranking) => {
    if (ranking.category === 'top_10') {
      insights.push({
        id: `benchmark-${ranking.metric}-${event._id}`,
        type: 'benchmark',
        severity: 'info',
        metric: ranking.metric,
        title: `Top 10% for ${formatMetricName(ranking.metric)}`,
        description: `This event ranked ${ranking.rank} out of ${ranking.total} events (${ranking.percentile.toFixed(1)}th percentile). ${ranking.differencePercent > 0 ? `${ranking.differencePercent.toFixed(0)}% above` : `${Math.abs(ranking.differencePercent).toFixed(0)}% below`} average.`,
        value: ranking.value,
        change: ranking.differencePercent,
        confidence: 95,
        actionable: false,
        createdAt: new Date().toISOString(),
        metadata: {
          percentile: ranking.percentile,
          rank: ranking.rank,
          benchmarkValue: ranking.benchmarkValue,
        },
      });
    } else if (ranking.category === 'below_average') {
      insights.push({
        id: `benchmark-${ranking.metric}-${event._id}`,
        type: 'benchmark',
        severity: 'warning',
        metric: ranking.metric,
        title: `Below average for ${formatMetricName(ranking.metric)}`,
        description: `This event ranked ${ranking.rank} out of ${ranking.total} events (${ranking.percentile.toFixed(1)}th percentile). ${Math.abs(ranking.differencePercent).toFixed(0)}% below average.`,
        value: ranking.value,
        change: ranking.differencePercent,
        confidence: 90,
        actionable: true,
        recommendation: `Review similar events to identify improvement opportunities for ${formatMetricName(ranking.metric)}.`,
        relatedEvents: benchmark.similarEvents.slice(0, 3).map((e) => e._id),
        createdAt: new Date().toISOString(),
        metadata: {
          percentile: ranking.percentile,
          rank: ranking.rank,
          benchmarkValue: ranking.benchmarkValue,
        },
      });
    }
  });

  // WHAT: Partner comparison insight
  // WHY: Show if event is above/below partner's average
  if (benchmark.partnerComparison) {
    const isAbove = benchmark.partnerComparison.isAboveAverage;
    insights.push({
      id: `benchmark-partner-${event._id}`,
      type: 'benchmark',
      severity: isAbove ? 'info' : 'warning',
      metric: 'attendance',
      title: isAbove
        ? `${Math.abs(benchmark.partnerComparison.differencePercent).toFixed(0)}% above partner average`
        : `${Math.abs(benchmark.partnerComparison.differencePercent).toFixed(0)}% below partner average`,
      description: `Partner's historical average: ${Math.round(benchmark.partnerComparison.partnerAverage)}. This event: ${Math.round(benchmark.partnerComparison.eventValue)}.`,
      value: benchmark.partnerComparison.eventValue,
      change: benchmark.partnerComparison.differencePercent,
      confidence: 85,
      actionable: !isAbove,
      recommendation: !isAbove
        ? 'This event underperformed compared to partner\'s typical results. Analyze successful past events.'
        : undefined,
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

// ============================================================================
// PREDICTION INSIGHTS
// ============================================================================

/**
 * WHAT: Generate insights from predictive models
 * WHY: Forecast future performance
 */
async function generatePredictionInsights(event: any): Promise<Insight[]> {
  const insights: Insight[] = [];

  // WHAT: Only generate predictions for future or recent events
  // WHY: Predictions are only relevant for upcoming events
  const eventDate = new Date(event.eventDate);
  const now = new Date();
  const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceEvent > 30) return insights; // Too old for meaningful prediction insights

  // WHAT: Generate prediction (if event hasn't happened yet)
  // WHY: Help with planning
  if (daysSinceEvent < 0) {
    const input: EventPredictionInput = {
      eventId: event._id.toString(),
      eventDate: event.eventDate,
      partnerId: event.partnerId?.toString(),
      dayOfWeek: eventDate.getDay(),
      month: eventDate.getMonth() + 1,
    };

    const prediction = await predictAttendance(input);

    insights.push({
      id: `prediction-attendance-${event._id}`,
      type: 'prediction',
      severity: 'info',
      metric: 'attendance',
      title: `Predicted attendance: ${prediction.predictedValue.toLocaleString()}`,
      description: `Based on historical patterns, expected attendance is ${prediction.predictedValue.toLocaleString()} (range: ${prediction.confidenceInterval.lower.toLocaleString()}-${prediction.confidenceInterval.upper.toLocaleString()}). Key factors: ${prediction.factors.slice(0, 2).map((f) => f.name).join(', ')}.`,
      value: prediction.predictedValue,
      confidence: prediction.confidence,
      actionable: true,
      recommendation: 'Use this forecast for staffing, resource allocation, and marketing planning.',
      createdAt: new Date().toISOString(),
      metadata: {
        confidenceInterval: prediction.confidenceInterval,
        factors: prediction.factors,
        modelAccuracy: prediction.modelAccuracy,
      },
    });
  }

  return insights;
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * WHAT: Generate actionable recommendations based on insights
 * WHY: Transform insights into next steps
 */
function generateRecommendations(insights: Insight[], event: any): Insight[] {
  const recommendations: Insight[] = [];

  // WHAT: Count critical issues
  // WHY: Multiple problems need coordinated response
  const criticalCount = insights.filter((i) => i.severity === 'critical').length;

  if (criticalCount >= 2) {
    recommendations.push({
      id: `recommendation-critical-${event._id}`,
      type: 'recommendation',
      severity: 'critical',
      metric: 'overall',
      title: 'Multiple critical issues detected',
      description: `${criticalCount} critical issues require immediate attention. Prioritize addressing anomalies and declining trends.`,
      confidence: 90,
      actionable: true,
      recommendation: 'Schedule a review meeting to address all critical issues systematically.',
      createdAt: new Date().toISOString(),
    });
  }

  // WHAT: Check for consistently below-average performance
  // WHY: Systemic issue needs strategic response
  const belowAverageCount = insights.filter(
    (i) => i.type === 'benchmark' && i.change && i.change < -10
  ).length;

  if (belowAverageCount >= 2) {
    recommendations.push({
      id: `recommendation-performance-${event._id}`,
      type: 'recommendation',
      severity: 'warning',
      metric: 'overall',
      title: 'Below-average performance across metrics',
      description: 'Multiple metrics are underperforming. Consider comprehensive strategy review.',
      confidence: 80,
      actionable: true,
      recommendation:
        'Analyze top-performing similar events to identify best practices and success factors.',
      createdAt: new Date().toISOString(),
    });
  }

  return recommendations;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * WHAT: Calculate overall event score from insights
 * WHY: Single number summary of performance
 */
function calculateOverallScore(insights: Insight[]): number {
  let score = 100;

  // WHAT: Deduct points for negative insights
  // WHY: Critical issues reduce score more than warnings
  insights.forEach((insight) => {
    if (insight.severity === 'critical') score -= 15;
    else if (insight.severity === 'warning') score -= 7;
  });

  // WHAT: Add points for positive insights
  // WHY: Top performers get bonus
  const topPerformance = insights.filter(
    (i) => i.type === 'benchmark' && i.change && i.change > 20
  ).length;
  score += topPerformance * 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * WHAT: Format metric name for display
 * WHY: Technical names need human-readable versions
 */
function formatMetricName(metric: string): string {
  const names: Record<string, string> = {
    eventAttendees: 'Attendance',
    allImages: 'Total Images',
    totalFans: 'Total Fans',
    merched: 'Merchandised Fans',
    engagement: 'Engagement Rate',
  };
  return names[metric] || metric;
}

// ============================================================================
// PARTNER INSIGHTS
// ============================================================================

/**
 * WHAT: Generate partner-level insights across all events
 * WHY: Strategic overview for partners
 * 
 * FAIL-PROOF: Returns null if no valid events or insufficient data
 */
export async function generatePartnerInsights(partnerId: string): Promise<InsightsReport | null> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  // WHAT: Fetch all partner events
  // WHY: Need complete dataset for partner analysis
  const partnerEvents = await db
    .collection('projects')
    .find({ partnerId: new ObjectId(partnerId) })
    .sort({ eventDate: -1 })
    .toArray();

  if (partnerEvents.length === 0) {
    console.warn(`No events found for partner ${partnerId}`);
    return null;
  }

  // WHAT: Generate insights for most recent event
  // WHY: Representative sample of partner performance
  const latestEvent = partnerEvents[0];
  const insights = await generateInsights(latestEvent._id.toString());
  
  // WHAT: Return null if latest event has insufficient data
  // WHY: Fail-proof - don't throw errors for incomplete data
  if (!insights) {
    console.warn(`Partner ${partnerId} latest event has insufficient data for insights`);
    return null;
  }
  
  return insights;
}
