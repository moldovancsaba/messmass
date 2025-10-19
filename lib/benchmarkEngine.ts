/**
 * Benchmarking Engine
 * 
 * WHAT: Compare event metrics against league, venue, and historical baselines
 * WHY: Provide context for performance evaluation - "Are we above/below average?"
 * HOW: Calculate percentile rankings, averages, and relative performance scores
 * 
 * Version: 6.27.0 (Phase 2 - Insights Engine)
 * Created: 2025-10-19T12:43:10.000Z
 */

export type BenchmarkType = 'league' | 'venue' | 'partner' | 'category';
export type PerformanceRating = 'excellent' | 'good' | 'average' | 'below_average' | 'poor';

export interface BenchmarkResult {
  value: number;
  benchmark: number;
  percentile: number; // 0-100, where this value ranks
  deviation: number; // How many std devs from mean
  relativePerformance: number; // -100 to +100, percent vs. benchmark
  rating: PerformanceRating;
  rank: number; // Actual rank (1 = best)
  totalInCategory: number;
  message: string;
}

export interface ComparisonContext {
  type: BenchmarkType;
  category?: string; // e.g., "football-league" or "stadium-venue"
  timeframe?: string; // e.g., "2024" or "Q1-2024"
}

/**
 * WHAT: Calculate percentile rank for a value in a dataset
 * WHY: Understand relative performance (e.g., "top 10% of events")
 * HOW: Count values below target / total values × 100
 */
export function calculatePercentile(value: number, dataset: number[]): number {
  if (dataset.length === 0) return 50; // Default to median if no data
  
  const sortedData = [...dataset].sort((a, b) => a - b);
  let countBelow = 0;
  
  for (const dataValue of sortedData) {
    if (dataValue < value) {
      countBelow++;
    } else {
      break; // Dataset is sorted, no need to continue
    }
  }
  
  // WHAT: Percentile formula
  const percentile = (countBelow / sortedData.length) * 100;
  return Math.round(percentile);
}

/**
 * WHAT: Calculate rank (ordinal position) for a value
 * WHY: Provide actual ranking (1st, 2nd, 3rd, etc.)
 * HOW: Sort descending (higher is better) and find position
 */
export function calculateRank(value: number, dataset: number[], ascending: boolean = false): number {
  const sortedData = [...dataset].sort((a, b) => ascending ? a - b : b - a);
  const rank = sortedData.indexOf(value) + 1;
  return rank > 0 ? rank : dataset.length + 1; // If not found, place at end
}

/**
 * WHAT: Determine performance rating based on percentile
 * WHY: Simple, intuitive categorization (excellent/good/average/etc.)
 */
export function determinePerformanceRating(percentile: number): PerformanceRating {
  if (percentile >= 90) return 'excellent'; // Top 10%
  if (percentile >= 75) return 'good'; // Top 25%
  if (percentile >= 40) return 'average'; // Middle 50%
  if (percentile >= 25) return 'below_average'; // Bottom 25%
  return 'poor'; // Bottom 10%
}

/**
 * WHAT: Benchmark a single metric against a dataset
 * WHY: Core benchmarking function - compare event to baseline
 * HOW: Calculate all comparative metrics (percentile, rank, deviation, etc.)
 * 
 * @param value - The value to benchmark
 * @param dataset - Historical/comparison dataset
 * @param metric - Metric name for context
 * @param context - Additional context about the comparison
 * @returns Complete benchmark result with all comparative metrics
 */
export function benchmarkMetric(
  value: number,
  dataset: number[],
  metric: string = 'metric',
  context: ComparisonContext = { type: 'league' }
): BenchmarkResult {
  if (dataset.length === 0) {
    return {
      value,
      benchmark: 0,
      percentile: 50,
      deviation: 0,
      relativePerformance: 0,
      rating: 'average',
      rank: 1,
      totalInCategory: 1,
      message: `Insufficient ${context.type} data for ${metric} comparison`,
    };
  }
  
  // WHAT: Calculate benchmark (mean of dataset)
  const benchmark = dataset.reduce((sum, v) => sum + v, 0) / dataset.length;
  
  // WHAT: Calculate standard deviation for z-score
  const variance = dataset.reduce((sum, v) => sum + Math.pow(v - benchmark, 2), 0) / dataset.length;
  const stdDev = Math.sqrt(variance);
  const deviation = stdDev === 0 ? 0 : (value - benchmark) / stdDev;
  
  // WHAT: Calculate percentile ranking
  const percentile = calculatePercentile(value, dataset);
  
  // WHAT: Calculate rank
  const rank = calculateRank(value, dataset);
  
  // WHAT: Calculate relative performance as percentage
  const relativePerformance = benchmark === 0 ? 0 : ((value - benchmark) / benchmark) * 100;
  
  // WHAT: Determine rating
  const rating = determinePerformanceRating(percentile);
  
  // WHAT: Generate natural language message
  const contextText = context.category ? `${context.type} (${context.category})` : context.type;
  const ratingEmoji = {
    excellent: '🌟',
    good: '✅',
    average: '➖',
    below_average: '⚠️',
    poor: '🔴',
  };
  
  let message = `${metric}: ${ratingEmoji[rating]} ${rating.replace('_', ' ')} — `;
  message += `ranked #${rank} of ${dataset.length} in ${contextText} `;
  message += `(${percentile}th percentile)`;
  
  if (Math.abs(relativePerformance) > 5) {
    const direction = relativePerformance > 0 ? 'above' : 'below';
    message += ` — ${Math.abs(relativePerformance).toFixed(0)}% ${direction} ${contextText} average`;
  }
  
  return {
    value,
    benchmark,
    percentile,
    deviation,
    relativePerformance,
    rating,
    rank,
    totalInCategory: dataset.length,
    message,
  };
}

/**
 * WHAT: Compare multiple metrics simultaneously
 * WHY: Get holistic view of performance across all KPIs
 * HOW: Run benchmarkMetric for each metric and aggregate results
 * 
 * @param eventMetrics - Current event's metrics
 * @param historicalData - Array of historical events with same metrics
 * @param metricNames - Which metrics to benchmark
 * @param context - Comparison context
 * @returns Object with benchmark results for each metric
 */
export function benchmarkMultipleMetrics(
  eventMetrics: Record<string, number>,
  historicalData: Array<Record<string, number>>,
  metricNames: string[],
  context: ComparisonContext = { type: 'league' }
): {
  results: Record<string, BenchmarkResult>;
  overallRating: PerformanceRating;
  strongMetrics: string[]; // Metrics in excellent/good
  weakMetrics: string[]; // Metrics in below_average/poor
  averagePercentile: number;
} {
  const results: Record<string, BenchmarkResult> = {};
  let totalPercentile = 0;
  let metricsCount = 0;
  
  for (const metric of metricNames) {
    const value = eventMetrics[metric] || 0;
    
    // WHAT: Extract this metric from all historical events
    const dataset = historicalData
      .map(event => event[metric])
      .filter(v => v !== undefined && v !== null) as number[];
    
    if (dataset.length > 0) {
      results[metric] = benchmarkMetric(value, dataset, metric, context);
      totalPercentile += results[metric].percentile;
      metricsCount++;
    }
  }
  
  // WHAT: Calculate overall performance
  const averagePercentile = metricsCount > 0 ? totalPercentile / metricsCount : 50;
  const overallRating = determinePerformanceRating(averagePercentile);
  
  // WHAT: Identify strong and weak metrics
  const strongMetrics = Object.keys(results).filter(
    m => results[m].rating === 'excellent' || results[m].rating === 'good'
  );
  const weakMetrics = Object.keys(results).filter(
    m => results[m].rating === 'below_average' || results[m].rating === 'poor'
  );
  
  return {
    results,
    overallRating,
    strongMetrics,
    weakMetrics,
    averagePercentile,
  };
}

/**
 * WHAT: Compare event to its own historical performance
 * WHY: Understand if partner/venue is improving or declining over time
 * HOW: Compare current event to partner's last N events
 * 
 * @param currentValue - Current event value
 * @param historicalValues - Partner's historical values (chronological)
 * @param metric - Metric name
 * @returns Benchmark result with trend context
 */
export function benchmarkAgainstHistory(
  currentValue: number,
  historicalValues: number[],
  metric: string = 'metric'
): BenchmarkResult & { trend: 'improving' | 'declining' | 'stable' } {
  const baseResult = benchmarkMetric(
    currentValue,
    historicalValues,
    metric,
    { type: 'partner', category: 'historical' }
  );
  
  // WHAT: Determine trend by comparing to last 3 events
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  
  if (historicalValues.length >= 3) {
    const recent3 = historicalValues.slice(-3);
    const recentAvg = recent3.reduce((sum, v) => sum + v, 0) / 3;
    
    if (currentValue > recentAvg * 1.1) {
      trend = 'improving';
    } else if (currentValue < recentAvg * 0.9) {
      trend = 'declining';
    }
  }
  
  return {
    ...baseResult,
    trend,
  };
}

/**
 * WHAT: Compare two events head-to-head
 * WHY: Understand which event performed better and by how much
 * HOW: Calculate deltas and determine winner for each metric
 * 
 * @param event1Metrics - First event metrics
 * @param event2Metrics - Second event metrics
 * @param metricNames - Metrics to compare
 * @returns Comparison results with winners and deltas
 */
export function compareEvents(
  event1Metrics: Record<string, number>,
  event2Metrics: Record<string, number>,
  metricNames: string[]
): {
  winners: Record<string, 'event1' | 'event2' | 'tie'>;
  deltas: Record<string, { absolute: number; percent: number }>;
  event1Score: number; // 0-100
  event2Score: number; // 0-100
  overallWinner: 'event1' | 'event2' | 'tie';
} {
  const winners: Record<string, 'event1' | 'event2' | 'tie'> = {};
  const deltas: Record<string, { absolute: number; percent: number }> = {};
  let event1Wins = 0;
  let event2Wins = 0;
  
  for (const metric of metricNames) {
    const val1 = event1Metrics[metric] || 0;
    const val2 = event2Metrics[metric] || 0;
    
    // WHAT: Determine winner (higher is better for most metrics)
    if (val1 > val2 * 1.05) {
      winners[metric] = 'event1';
      event1Wins++;
    } else if (val2 > val1 * 1.05) {
      winners[metric] = 'event2';
      event2Wins++;
    } else {
      winners[metric] = 'tie';
    }
    
    // WHAT: Calculate deltas
    const absolute = val1 - val2;
    const percent = val2 === 0 ? 0 : (absolute / val2) * 100;
    deltas[metric] = { absolute, percent };
  }
  
  // WHAT: Calculate scores (0-100 based on wins)
  const totalMetrics = metricNames.length;
  const event1Score = Math.round((event1Wins / totalMetrics) * 100);
  const event2Score = Math.round((event2Wins / totalMetrics) * 100);
  
  // WHAT: Overall winner
  let overallWinner: 'event1' | 'event2' | 'tie' = 'tie';
  if (event1Wins > event2Wins) {
    overallWinner = 'event1';
  } else if (event2Wins > event1Wins) {
    overallWinner = 'event2';
  }
  
  return {
    winners,
    deltas,
    event1Score,
    event2Score,
    overallWinner,
  };
}

/**
 * WHAT: Identify outlier performance (top/bottom performers)
 * WHY: Flag exceptional or concerning events for attention
 * HOW: Find events beyond percentile thresholds
 * 
 * @param dataset - All events with metrics
 * @param metric - Metric to analyze
 * @param topPercentile - Threshold for top performers (default: 90)
 * @param bottomPercentile - Threshold for bottom performers (default: 10)
 * @returns Lists of top and bottom performers
 */
export function identifyOutliers(
  dataset: Array<{ id: string; value: number; name?: string }>,
  metric: string,
  topPercentile: number = 90,
  bottomPercentile: number = 10
): {
  topPerformers: Array<{ id: string; value: number; name?: string; percentile: number }>;
  bottomPerformers: Array<{ id: string; value: number; name?: string; percentile: number }>;
  message: string;
} {
  const values = dataset.map(d => d.value);
  const sortedDataset = [...dataset].sort((a, b) => b.value - a.value);
  
  const topPerformers = sortedDataset
    .map(item => ({
      ...item,
      percentile: calculatePercentile(item.value, values),
    }))
    .filter(item => item.percentile >= topPercentile);
  
  const bottomPerformers = sortedDataset
    .map(item => ({
      ...item,
      percentile: calculatePercentile(item.value, values),
    }))
    .filter(item => item.percentile <= bottomPercentile)
    .reverse(); // Show worst first
  
  const message = `${metric}: ${topPerformers.length} top performers (≥${topPercentile}th percentile), ${bottomPerformers.length} bottom performers (≤${bottomPercentile}th percentile)`;
  
  return {
    topPerformers,
    bottomPerformers,
    message,
  };
}
