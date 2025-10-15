/**
 * Analytics Benchmarking Module
 * 
 * WHAT: Compare events against historical averages, peers, and best performers
 * WHY: Provide context for performance evaluation and identify opportunities
 * 
 * Features:
 * - Percentile rankings across all events
 * - Similar event matching using Euclidean distance
 * - Partner historical benchmarking
 */

import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import config from './config';

// ============================================================================
// TYPES
// ============================================================================

export interface PercentileRanking {
  metric: string;
  value: number;
  percentile: number; // 0-100 (higher = better)
  rank: number; // 1-indexed rank
  total: number; // Total events compared
  category: 'top_10' | 'top_25' | 'average' | 'below_average';
  benchmarkValue: number; // Average value across all events
  difference: number; // Difference from average (absolute)
  differencePercent: number; // Difference from average (percentage)
}

export interface SimilarEvent {
  _id: string;
  eventName: string;
  eventDate: string;
  similarity: number; // 0-1 (1 = identical)
  attendees: number;
  engagement: number; // images per attendee
  merchandise: number; // merched fans percentage
  stats: {
    allImages?: number;
    totalFans?: number;
    merched?: number;
    eventAttendees?: number;
  };
}

export interface Benchmark {
  eventId: string;
  partnerId?: string;
  overallScore: number; // 0-100
  rankings: PercentileRanking[];
  similarEvents: SimilarEvent[];
  partnerComparison?: {
    eventValue: number;
    partnerAverage: number;
    difference: number;
    differencePercent: number;
    isAboveAverage: boolean;
  };
}

// ============================================================================
// PERCENTILE RANKINGS
// ============================================================================

/**
 * WHAT: Calculate where an event ranks among all events for a specific metric
 * WHY: Understand relative performance - "top 10%" is more intuitive than raw numbers
 * 
 * @param eventId - Event to rank
 * @param metric - Metric to compare (e.g., 'eventAttendees', 'allImages')
 * @returns Percentile ranking with category
 */
export async function calculatePercentiles(
  eventId: string,
  metric: string
): Promise<PercentileRanking> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  // WHAT: Fetch all events with this metric
  // WHY: Need complete dataset to calculate percentile position
  const allEvents = await db
    .collection('projects')
    .find({ [`stats.${metric}`]: { $exists: true, $ne: null } })
    .project({ _id: 1, [`stats.${metric}`]: 1 })
    .toArray();

  // WHAT: Get current event's value
  // WHY: This is the value we're ranking
  const currentEvent = await db
    .collection('projects')
    .findOne(
      { _id: new ObjectId(eventId) },
      { projection: { [`stats.${metric}`]: 1 } }
    );

  if (!currentEvent || !currentEvent.stats || currentEvent.stats[metric] === undefined) {
    throw new Error(`Metric ${metric} not found for event ${eventId}`);
  }

  const value = currentEvent.stats[metric];

  // WHAT: Sort events by metric value (ascending)
  // WHY: Ranking requires ordered list
  const sortedEvents = allEvents
    .map((e) => e.stats?.[metric] || 0)
    .filter((v) => v !== null && v !== undefined)
    .sort((a, b) => a - b);

  const total = sortedEvents.length;

  // WHAT: Find position of current value in sorted list
  // WHY: Position determines percentile
  const rank = sortedEvents.filter((v) => v < value).length + 1;

  // WHAT: Calculate percentile (higher = better)
  // WHY: Percentile is intuitive - "you're in top 15%"
  const percentile = (rank / total) * 100;

  // WHAT: Calculate benchmark average
  // WHY: Show how current value compares to average
  const benchmarkValue = sortedEvents.reduce((sum, v) => sum + v, 0) / total;
  const difference = value - benchmarkValue;
  const differencePercent = benchmarkValue !== 0 ? (difference / benchmarkValue) * 100 : 0;

  // WHAT: Categorize percentile into bucket
  // WHY: Quick visual understanding of performance level
  let category: 'top_10' | 'top_25' | 'average' | 'below_average' = 'average';
  if (percentile >= 90) category = 'top_10';
  else if (percentile >= 75) category = 'top_25';
  else if (percentile < 50) category = 'below_average';

  return {
    metric,
    value,
    percentile,
    rank,
    total,
    category,
    benchmarkValue,
    difference,
    differencePercent,
  };
}

/**
 * WHAT: Calculate percentile rankings for multiple metrics at once
 * WHY: More efficient than calling calculatePercentiles() repeatedly
 * 
 * @param eventId - Event to rank
 * @param metrics - Array of metrics to rank
 * @returns Array of percentile rankings
 */
export async function calculateMultiplePercentiles(
  eventId: string,
  metrics: string[]
): Promise<PercentileRanking[]> {
  const rankings = await Promise.all(
    metrics.map((metric) => calculatePercentiles(eventId, metric))
  );
  return rankings;
}

// ============================================================================
// SIMILAR EVENTS MATCHING
// ============================================================================

/**
 * WHAT: Find events with similar characteristics using Euclidean distance
 * WHY: Benchmark against comparable events, not just global averages
 * 
 * Algorithm:
 * - Normalize features (attendance, engagement, merchandise rate)
 * - Calculate weighted Euclidean distance
 * - Weights: 0.4 attendance, 0.3 engagement, 0.2 merch, 0.1 date proximity
 * - Return top N most similar
 * 
 * @param eventId - Event to match
 * @param limit - Number of similar events to return (default: 5)
 * @returns Array of similar events with similarity scores
 */
export async function findSimilarEvents(
  eventId: string,
  limit: number = 5
): Promise<SimilarEvent[]> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  // WHAT: Fetch current event with full stats
  // WHY: Need to compare features against other events
  const currentEvent = await db
    .collection('projects')
    .findOne({ _id: new ObjectId(eventId) });

  if (!currentEvent) {
    throw new Error(`Event ${eventId} not found`);
  }

  // WHAT: Fetch all other events
  // WHY: Need to calculate similarity to each
  const allEvents = await db
    .collection('projects')
    .find({ _id: { $ne: new ObjectId(eventId) } })
    .toArray();

  // WHAT: Extract features from current event
  // WHY: These are the dimensions for similarity calculation
  const currentFeatures = extractFeatures(currentEvent);

  // WHAT: Calculate similarity score for each event
  // WHY: Euclidean distance in normalized feature space
  const similarities = allEvents
    .map((event) => {
      const eventFeatures = extractFeatures(event);
      const similarity = calculateSimilarity(currentFeatures, eventFeatures);

      return {
        _id: event._id.toString(),
        eventName: event.eventName,
        eventDate: event.eventDate,
        similarity,
        attendees: event.stats?.eventAttendees || 0,
        engagement:
          event.stats?.eventAttendees && event.stats?.allImages
            ? event.stats.allImages / event.stats.eventAttendees
            : 0,
        merchandise:
          event.stats?.totalFans && event.stats?.merched
            ? (event.stats.merched / event.stats.totalFans) * 100
            : 0,
        stats: {
          allImages: event.stats?.allImages || 0,
          totalFans: event.stats?.totalFans || 0,
          merched: event.stats?.merched || 0,
          eventAttendees: event.stats?.eventAttendees || 0,
        },
      };
    })
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (high to low)
    .slice(0, limit); // Take top N

  return similarities;
}

/**
 * WHAT: Extract normalized features for similarity calculation
 * WHY: Features must be on same scale for fair comparison
 */
function extractFeatures(event: any): {
  attendance: number;
  engagement: number;
  merchandise: number;
  dateProximity: number;
} {
  // WHAT: Calculate core metrics
  // WHY: These define event characteristics
  const attendance = event.stats?.eventAttendees || 0;
  const allImages = event.stats?.allImages || 0;
  const totalFans = event.stats?.totalFans || 0;
  const merched = event.stats?.merched || 0;

  const engagement = attendance > 0 ? allImages / attendance : 0;
  const merchandise = totalFans > 0 ? (merched / totalFans) * 100 : 0;

  // WHAT: Calculate date proximity (days since event)
  // WHY: Recent events are more relevant for comparison
  const eventDate = new Date(event.eventDate);
  const now = new Date();
  const daysSince = Math.abs((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
  const dateProximity = Math.max(0, 365 - daysSince) / 365; // Normalize to 0-1

  return {
    attendance,
    engagement,
    merchandise,
    dateProximity,
  };
}

/**
 * WHAT: Calculate similarity using weighted Euclidean distance
 * WHY: Different features have different importance
 * 
 * Formula: similarity = 1 - (distance / maxDistance)
 * Distance = √(Σ weight_i * (feature1_i - feature2_i)²)
 */
function calculateSimilarity(
  features1: ReturnType<typeof extractFeatures>,
  features2: ReturnType<typeof extractFeatures>
): number {
  // WHAT: Feature weights (must sum to 1.0)
  // WHY: Attendance and engagement are most important for similarity
  const weights = {
    attendance: 0.4,
    engagement: 0.3,
    merchandise: 0.2,
    dateProximity: 0.1,
  };

  // WHAT: Normalize features to 0-1 scale
  // WHY: Prevent large-scale features from dominating distance
  const normalize = (val: number, max: number) => Math.min(val / max, 1);

  const norm1 = {
    attendance: normalize(features1.attendance, 50000), // Max typical attendance
    engagement: normalize(features1.engagement, 2), // Max typical engagement
    merchandise: normalize(features1.merchandise, 100), // Max percentage
    dateProximity: features1.dateProximity, // Already 0-1
  };

  const norm2 = {
    attendance: normalize(features2.attendance, 50000),
    engagement: normalize(features2.engagement, 2),
    merchandise: normalize(features2.merchandise, 100),
    dateProximity: features2.dateProximity,
  };

  // WHAT: Calculate weighted Euclidean distance
  // WHY: Measures how "far apart" the events are in feature space
  const distance = Math.sqrt(
    weights.attendance * Math.pow(norm1.attendance - norm2.attendance, 2) +
      weights.engagement * Math.pow(norm1.engagement - norm2.engagement, 2) +
      weights.merchandise * Math.pow(norm1.merchandise - norm2.merchandise, 2) +
      weights.dateProximity * Math.pow(norm1.dateProximity - norm2.dateProximity, 2)
  );

  // WHAT: Convert distance to similarity (0-1 scale, higher = more similar)
  // WHY: Similarity is more intuitive than distance
  const maxDistance = Math.sqrt(
    weights.attendance + weights.engagement + weights.merchandise + weights.dateProximity
  );

  const similarity = 1 - distance / maxDistance;

  return Math.max(0, Math.min(1, similarity)); // Clamp to 0-1
}

// ============================================================================
// PARTNER BENCHMARKING
// ============================================================================

/**
 * WHAT: Compare event performance to partner's historical average
 * WHY: "Better than usual for this partner" is key insight
 * 
 * @param eventId - Event to benchmark
 * @param partnerId - Partner to compare against
 * @returns Comparison results
 */
export async function benchmarkAgainstPartner(
  eventId: string,
  partnerId: string
): Promise<Benchmark['partnerComparison']> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  // WHAT: Fetch current event
  // WHY: Need its metrics for comparison
  const currentEvent = await db
    .collection('projects')
    .findOne({ _id: new ObjectId(eventId) });

  if (!currentEvent) {
    throw new Error(`Event ${eventId} not found`);
  }

  // WHAT: Fetch all partner events (excluding current)
  // WHY: Calculate partner's historical average
  const partnerEvents = await db
    .collection('projects')
    .find({
      partnerId: new ObjectId(partnerId),
      _id: { $ne: new ObjectId(eventId) },
      'stats.eventAttendees': { $exists: true, $ne: null },
    })
    .toArray();

  if (partnerEvents.length === 0) {
    // WHAT: Not enough data for comparison
    // WHY: Need at least 1 other event to calculate average
    return undefined;
  }

  // WHAT: Calculate partner average attendance
  // WHY: This is the benchmark for comparison
  const partnerAverage =
    partnerEvents.reduce((sum, e) => sum + (e.stats?.eventAttendees || 0), 0) /
    partnerEvents.length;

  const eventValue = currentEvent.stats?.eventAttendees || 0;
  const difference = eventValue - partnerAverage;
  const differencePercent = partnerAverage !== 0 ? (difference / partnerAverage) * 100 : 0;

  return {
    eventValue,
    partnerAverage,
    difference,
    differencePercent,
    isAboveAverage: difference > 0,
  };
}

// ============================================================================
// COMPREHENSIVE BENCHMARK
// ============================================================================

/**
 * WHAT: Generate complete benchmark report for an event
 * WHY: Single function call for all benchmarking data
 * 
 * @param eventId - Event to benchmark
 * @param partnerId - Optional partner for comparison
 * @param metrics - Metrics to rank (default: key metrics)
 * @returns Complete benchmark report
 */
export async function generateComprehensiveBenchmark(
  eventId: string,
  partnerId?: string,
  metrics: string[] = ['eventAttendees', 'allImages', 'totalFans', 'merched']
): Promise<Benchmark> {
  // WHAT: Run all benchmarking functions in parallel
  // WHY: Efficient - don't wait for each sequentially
  const [rankings, similarEvents, partnerComparison] = await Promise.all([
    calculateMultiplePercentiles(eventId, metrics),
    findSimilarEvents(eventId, 5),
    partnerId ? benchmarkAgainstPartner(eventId, partnerId) : Promise.resolve(undefined),
  ]);

  // WHAT: Calculate overall score (average percentile)
  // WHY: Single number summary of event performance
  const overallScore =
    rankings.reduce((sum, r) => sum + r.percentile, 0) / rankings.length;

  return {
    eventId,
    partnerId,
    overallScore,
    rankings,
    similarEvents,
    partnerComparison,
  };
}

// ============================================================================
// BENCHMARKING UTILITIES
// ============================================================================

/**
 * WHAT: Get global benchmark statistics for a metric
 * WHY: Provide context for all events
 * 
 * @param metric - Metric to analyze
 * @returns Statistics across all events
 */
export async function getGlobalBenchmark(metric: string): Promise<{
  metric: string;
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}> {
  const client = await clientPromise;
  const db = client.db(config.dbName);

  // WHAT: Fetch all values for this metric
  // WHY: Need full dataset for statistical analysis
  const events = await db
    .collection('projects')
    .find({ [`stats.${metric}`]: { $exists: true, $ne: null } })
    .project({ [`stats.${metric}`]: 1 })
    .toArray();

  const values = events
    .map((e) => e.stats?.[metric])
    .filter((v): v is number => v !== null && v !== undefined)
    .sort((a, b) => a - b);

  const count = values.length;

  if (count === 0) {
    throw new Error(`No data found for metric ${metric}`);
  }

  // WHAT: Calculate statistical measures
  // WHY: Comprehensive benchmark data
  const mean = values.reduce((sum, v) => sum + v, 0) / count;
  const median = values[Math.floor(count / 2)];
  const min = values[0];
  const max = values[count - 1];

  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  const getPercentile = (p: number) => {
    const index = Math.floor((p / 100) * (count - 1));
    return values[index];
  };

  return {
    metric,
    count,
    mean,
    median,
    min,
    max,
    stdDev,
    percentiles: {
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
    },
  };
}
