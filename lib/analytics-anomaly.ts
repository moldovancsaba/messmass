/**
 * Analytics Anomaly Detection Module
 * 
 * WHAT: Statistical algorithms to detect unusual patterns in time-series metrics
 * WHY: Automatically flag outliers and unusual behavior for immediate attention
 * 
 * Algorithms:
 * - Z-Score Method: Standard deviation based outlier detection
 * - IQR Method: Interquartile range based outlier detection
 * - Moving Average Method: Deviation from rolling average
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TimeSeriesDataPoint {
  date: string; // ISO 8601
  value: number;
  label?: string; // Optional metric label
}

export interface Anomaly {
  date: string;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number; // Percentage
  severity: 'low' | 'medium' | 'high';
  method: 'z-score' | 'iqr' | 'moving-avg';
  confidence: number; // 0-100
  description?: string;
}

export interface AnomalyDetectionOptions {
  zScoreThreshold?: number; // Default: 2.0
  iqrMultiplier?: number; // Default: 1.5
  movingAvgWindow?: number; // Default: 7 days
  movingAvgThreshold?: number; // Default: 0.25 (25%)
  minDataPoints?: number; // Default: 5
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  totalDataPoints: number;
  anomalyCount: number;
  anomalyRate: number; // Percentage
  methods: {
    zScore: number;
    iqr: number;
    movingAvg: number;
  };
}

// ============================================================================
// CORE ANOMALY DETECTION
// ============================================================================

/**
 * WHAT: Detect anomalies in time-series data using multiple statistical methods
 * WHY: Multi-method approach increases confidence in anomaly detection
 * 
 * @param metric - Name of the metric being analyzed
 * @param data - Time-series data points
 * @param options - Detection configuration
 * @returns Detected anomalies with metadata
 */
export async function detectAnomalies(
  metric: string,
  data: TimeSeriesDataPoint[],
  options: AnomalyDetectionOptions = {}
): Promise<AnomalyDetectionResult> {
  // WHAT: Set default options
  // WHY: Ensure consistent behavior across all anomaly detection calls
  const opts = {
    zScoreThreshold: options.zScoreThreshold || 2.0,
    iqrMultiplier: options.iqrMultiplier || 1.5,
    movingAvgWindow: options.movingAvgWindow || 7,
    movingAvgThreshold: options.movingAvgThreshold || 0.25,
    minDataPoints: options.minDataPoints || 5,
  };

  // WHAT: Validate input data
  // WHY: Cannot perform statistical analysis with insufficient data
  if (data.length < opts.minDataPoints) {
    return {
      anomalies: [],
      totalDataPoints: data.length,
      anomalyCount: 0,
      anomalyRate: 0,
      methods: { zScore: 0, iqr: 0, movingAvg: 0 },
    };
  }

  const anomalies: Anomaly[] = [];
  const methodCounts = { zScore: 0, iqr: 0, movingAvg: 0 };

  // WHAT: Run all three anomaly detection methods
  // WHY: Each method catches different types of anomalies
  const zScoreAnomalies = detectZScoreAnomalies(metric, data, opts);
  const iqrAnomalies = detectIQRAnomalies(metric, data, opts);
  const movingAvgAnomalies = detectMovingAvgAnomalies(metric, data, opts);

  // WHAT: Combine results and deduplicate by date
  // WHY: Same date may be flagged by multiple methods - keep highest confidence
  const anomalyMap = new Map<string, Anomaly>();

  [...zScoreAnomalies, ...iqrAnomalies, ...movingAvgAnomalies].forEach((anomaly) => {
    const existing = anomalyMap.get(anomaly.date);
    if (!existing || anomaly.confidence > existing.confidence) {
      anomalyMap.set(anomaly.date, anomaly);
    }
    methodCounts[anomaly.method === 'z-score' ? 'zScore' : anomaly.method === 'iqr' ? 'iqr' : 'movingAvg']++;
  });

  anomalies.push(...anomalyMap.values());

  return {
    anomalies: anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    totalDataPoints: data.length,
    anomalyCount: anomalies.length,
    anomalyRate: (anomalies.length / data.length) * 100,
    methods: methodCounts,
  };
}

// ============================================================================
// METHOD 1: Z-SCORE (STANDARD DEVIATION)
// ============================================================================

/**
 * WHAT: Detect outliers using Z-score (standard deviations from mean)
 * WHY: Identifies points that are statistically unusual in normal distributions
 * 
 * Algorithm: z = (x - μ) / σ
 * - z > threshold → anomaly
 */
function detectZScoreAnomalies(
  metric: string,
  data: TimeSeriesDataPoint[],
  options: AnomalyDetectionOptions
): Anomaly[] {
  const values = data.map((d) => d.value);
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values, mean);

  // WHAT: Handle edge case where all values are identical
  // WHY: Standard deviation of 0 causes division by zero
  if (stdDev === 0) return [];

  const anomalies: Anomaly[] = [];

  data.forEach((point) => {
    const zScore = (point.value - mean) / stdDev;
    const absZScore = Math.abs(zScore);

    // WHAT: Check if Z-score exceeds threshold
    // WHY: Values > 2σ are considered statistically unusual (95% confidence)
    if (absZScore > options.zScoreThreshold!) {
      const deviation = ((point.value - mean) / mean) * 100;
      const severity = getSeverity(absZScore, options.zScoreThreshold!);
      const confidence = Math.min(95, 50 + absZScore * 15); // Cap at 95%

      anomalies.push({
        date: point.date,
        metric,
        value: point.value,
        expectedValue: mean,
        deviation,
        severity,
        method: 'z-score',
        confidence,
        description: `Value is ${absZScore.toFixed(1)} standard deviations from mean`,
      });
    }
  });

  return anomalies;
}

// ============================================================================
// METHOD 2: IQR (INTERQUARTILE RANGE)
// ============================================================================

/**
 * WHAT: Detect outliers using IQR method (resistant to extreme values)
 * WHY: More robust than Z-score for non-normal distributions
 * 
 * Algorithm:
 * - Q1 = 25th percentile, Q3 = 75th percentile
 * - IQR = Q3 - Q1
 * - Outliers: value < Q1 - 1.5*IQR OR value > Q3 + 1.5*IQR
 */
function detectIQRAnomalies(
  metric: string,
  data: TimeSeriesDataPoint[],
  options: AnomalyDetectionOptions
): Anomaly[] {
  const values = data.map((d) => d.value).sort((a, b) => a - b);
  const q1 = calculatePercentile(values, 25);
  const q3 = calculatePercentile(values, 75);
  const iqr = q3 - q1;

  // WHAT: Handle edge case where IQR is 0
  // WHY: All values in middle 50% are identical
  if (iqr === 0) return [];

  const lowerBound = q1 - options.iqrMultiplier! * iqr;
  const upperBound = q3 + options.iqrMultiplier! * iqr;
  const median = calculatePercentile(values, 50);

  const anomalies: Anomaly[] = [];

  data.forEach((point) => {
    // WHAT: Check if value is outside IQR bounds
    // WHY: Values beyond 1.5*IQR are considered outliers
    if (point.value < lowerBound || point.value > upperBound) {
      const expectedValue = point.value < lowerBound ? q1 : q3;
      const deviation = ((point.value - median) / median) * 100;
      const distance = point.value < lowerBound ? lowerBound - point.value : point.value - upperBound;
      const severity = getSeverityByDistance(distance, iqr);
      const confidence = Math.min(90, 60 + (distance / iqr) * 10); // Cap at 90%

      anomalies.push({
        date: point.date,
        metric,
        value: point.value,
        expectedValue,
        deviation,
        severity,
        method: 'iqr',
        confidence,
        description: `Value is ${(distance / iqr).toFixed(1)}x IQR beyond bounds`,
      });
    }
  });

  return anomalies;
}

// ============================================================================
// METHOD 3: MOVING AVERAGE
// ============================================================================

/**
 * WHAT: Detect anomalies by comparing to rolling window average
 * WHY: Catches sudden spikes/drops that deviate from recent trend
 * 
 * Algorithm:
 * - Calculate N-day moving average
 * - Flag if deviation > threshold (default 25%)
 */
function detectMovingAvgAnomalies(
  metric: string,
  data: TimeSeriesDataPoint[],
  options: AnomalyDetectionOptions
): Anomaly[] {
  const window = options.movingAvgWindow!;
  const threshold = options.movingAvgThreshold!;

  // WHAT: Need enough data for moving average window
  // WHY: Cannot calculate N-day average with < N data points
  if (data.length < window) return [];

  const anomalies: Anomaly[] = [];

  // WHAT: Calculate moving average for each point (excluding first window-1 points)
  // WHY: Need full window of historical data to calculate average
  for (let i = window - 1; i < data.length; i++) {
    const windowData = data.slice(i - window + 1, i + 1);
    const windowValues = windowData.map((d) => d.value);
    const movingAvg = calculateMean(windowValues);

    const currentPoint = data[i];
    const deviation = (currentPoint.value - movingAvg) / movingAvg;
    const absDeviation = Math.abs(deviation);

    // WHAT: Check if deviation exceeds threshold
    // WHY: Large deviation indicates unusual behavior compared to recent trend
    if (absDeviation > threshold) {
      const deviationPercent = deviation * 100;
      const severity = getSeverityByPercent(absDeviation);
      const confidence = Math.min(85, 50 + absDeviation * 100); // Cap at 85%

      anomalies.push({
        date: currentPoint.date,
        metric,
        value: currentPoint.value,
        expectedValue: movingAvg,
        deviation: deviationPercent,
        severity,
        method: 'moving-avg',
        confidence,
        description: `${Math.abs(deviationPercent).toFixed(0)}% deviation from ${window}-day average`,
      });
    }
  }

  return anomalies;
}

// ============================================================================
// STATISTICAL HELPER FUNCTIONS
// ============================================================================

/**
 * WHAT: Calculate arithmetic mean of values
 * WHY: Central tendency measure for Z-score and moving average
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * WHAT: Calculate standard deviation
 * WHY: Measure of spread for Z-score method
 */
function calculateStdDev(values: number[], mean?: number): number {
  if (values.length === 0) return 0;
  const avg = mean ?? calculateMean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * WHAT: Calculate percentile of sorted values
 * WHY: Required for IQR method (Q1, Q3, median)
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

// ============================================================================
// SEVERITY CLASSIFICATION
// ============================================================================

/**
 * WHAT: Classify anomaly severity based on Z-score magnitude
 * WHY: Prioritize attention on most extreme outliers
 */
function getSeverity(absZScore: number, threshold: number): 'low' | 'medium' | 'high' {
  if (absZScore > threshold * 2) return 'high'; // > 4σ
  if (absZScore > threshold * 1.5) return 'medium'; // > 3σ
  return 'low'; // > 2σ
}

/**
 * WHAT: Classify severity based on IQR distance
 * WHY: Larger distance from bounds = more severe outlier
 */
function getSeverityByDistance(distance: number, iqr: number): 'low' | 'medium' | 'high' {
  const ratio = distance / iqr;
  if (ratio > 3) return 'high';
  if (ratio > 2) return 'medium';
  return 'low';
}

/**
 * WHAT: Classify severity based on percentage deviation
 * WHY: Moving average uses percent deviation rather than standard deviations
 */
function getSeverityByPercent(absDeviation: number): 'low' | 'medium' | 'high' {
  if (absDeviation > 0.5) return 'high'; // > 50%
  if (absDeviation > 0.35) return 'medium'; // > 35%
  return 'low'; // > 25%
}

// ============================================================================
// SEASONAL ANOMALY DETECTION
// ============================================================================

/**
 * WHAT: Detect anomalies accounting for seasonal patterns
 * WHY: Weekend vs weekday, summer vs winter have different baselines
 * 
 * NOTE: Placeholder for future enhancement
 * Implementation would segment data by season before applying detection methods
 */
export async function detectSeasonalAnomalies(
  metric: string,
  data: TimeSeriesDataPoint[],
  seasonality: 'weekly' | 'monthly' | 'quarterly',
  options: AnomalyDetectionOptions = {}
): Promise<AnomalyDetectionResult> {
  // WHAT: For now, delegate to standard anomaly detection
  // WHY: Full seasonal decomposition requires more complex time-series analysis
  // TODO: Implement seasonal decomposition (STL decomposition or moving averages)
  return detectAnomalies(metric, data, options);
}
