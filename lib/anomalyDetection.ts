/**
 * Anomaly Detection Library
 * 
 * WHAT: Statistical methods for identifying outliers and unusual patterns in event metrics
 * WHY: Enable automatic detection of exceptional performance or problems requiring attention
 * HOW: Z-Score, IQR, and percent change methods for multi-dimensional anomaly detection
 * 
 * Version: 6.27.0 (Phase 2 - Insights Engine)
 * Created: 2025-10-19T12:43:10.000Z
 */

export type AnomalyType = 'positive' | 'negative' | 'neutral';
export type AnomalyMethod = 'z-score' | 'iqr' | 'percent-change';
export type AnomalySeverity = 'critical' | 'warning' | 'info';

export interface AnomalyResult {
  isAnomaly: boolean;
  value: number;
  method: AnomalyMethod;
  type: AnomalyType;
  severity: AnomalySeverity;
  deviation: number; // How far from normal (in std devs or %)
  context: {
    mean?: number;
    median?: number;
    stdDev?: number;
    q1?: number;
    q3?: number;
    iqr?: number;
    baseline?: number;
  };
  message: string;
}

/**
 * WHAT: Calculate mean of an array
 * WHY: Required for Z-Score calculation
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * WHAT: Calculate standard deviation
 * WHY: Required for Z-Score calculation
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * WHAT: Calculate median of an array
 * WHY: Required for IQR calculation (more robust than mean)
 */
function calculateMedian(sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;
  const mid = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  }
  return sortedValues[mid];
}

/**
 * WHAT: Calculate quartiles (Q1, Q3) and IQR
 * WHY: Required for IQR anomaly detection method
 */
function calculateIQR(sortedValues: number[]): { q1: number; q3: number; iqr: number } {
  if (sortedValues.length < 4) {
    return { q1: sortedValues[0] || 0, q3: sortedValues[sortedValues.length - 1] || 0, iqr: 0 };
  }
  
  const mid = Math.floor(sortedValues.length / 2);
  const lowerHalf = sortedValues.slice(0, mid);
  const upperHalf = sortedValues.length % 2 === 0 
    ? sortedValues.slice(mid) 
    : sortedValues.slice(mid + 1);
  
  const q1 = calculateMedian(lowerHalf);
  const q3 = calculateMedian(upperHalf);
  const iqr = q3 - q1;
  
  return { q1, q3, iqr };
}

/**
 * WHAT: Determine anomaly severity based on deviation magnitude
 * WHY: Categorize anomalies for prioritization (critical/warning/info)
 */
function determineSeverity(deviation: number, method: AnomalyMethod): AnomalySeverity {
  if (method === 'z-score') {
    // Z-Score: >3 is critical, >2 is warning, else info
    if (Math.abs(deviation) > 3) return 'critical';
    if (Math.abs(deviation) > 2) return 'warning';
    return 'info';
  } else if (method === 'iqr') {
    // IQR: Beyond 3×IQR is critical, beyond 1.5×IQR is warning
    if (Math.abs(deviation) > 3) return 'critical';
    if (Math.abs(deviation) > 1.5) return 'warning';
    return 'info';
  } else if (method === 'percent-change') {
    // Percent change: >50% is critical, >30% is warning
    if (Math.abs(deviation) > 50) return 'critical';
    if (Math.abs(deviation) > 30) return 'warning';
    return 'info';
  }
  return 'info';
}

/**
 * WHAT: Determine if anomaly is positive, negative, or neutral
 * WHY: Context matters - high fans is good, low engagement is bad
 */
function determineAnomalyType(
  value: number,
  baseline: number,
  metric: string
): AnomalyType {
  // WHAT: Metrics where higher is better
  const positiveMetrics = [
    'fans', 'merch', 'adValue', 'engagement', 'penetration',
    'coreFanTeam', 'selfieRate', 'emailConversion', 'viralCoefficient'
  ];
  
  // WHAT: Metrics where lower is better
  const negativeMetrics = ['costPerEngagement'];
  
  const isHigher = value > baseline;
  
  if (positiveMetrics.some(m => metric.toLowerCase().includes(m.toLowerCase()))) {
    return isHigher ? 'positive' : 'negative';
  } else if (negativeMetrics.some(m => metric.toLowerCase().includes(m.toLowerCase()))) {
    return isHigher ? 'negative' : 'positive';
  }
  
  return 'neutral';
}

/**
 * WHAT: Z-Score anomaly detection
 * WHY: Identify values that deviate significantly from mean (>2 standard deviations)
 * HOW: Calculate Z-Score = (value - mean) / stdDev
 * 
 * @param value - The value to test
 * @param historicalValues - Historical data for comparison
 * @param metric - Metric name for context
 * @param threshold - Z-Score threshold (default: 2 standard deviations)
 * @returns AnomalyResult with detection details
 */
export function detectZScoreAnomaly(
  value: number,
  historicalValues: number[],
  metric: string = 'metric',
  threshold: number = 2
): AnomalyResult {
  if (historicalValues.length < 3) {
    // WHAT: Need at least 3 data points for meaningful statistics
    return {
      isAnomaly: false,
      value,
      method: 'z-score',
      type: 'neutral',
      severity: 'info',
      deviation: 0,
      context: {},
      message: `Insufficient historical data for ${metric} (need 3+ events)`,
    };
  }
  
  const mean = calculateMean(historicalValues);
  const stdDev = calculateStdDev(historicalValues, mean);
  
  // WHAT: Can't detect anomaly if no variation exists
  if (stdDev === 0) {
    return {
      isAnomaly: false,
      value,
      method: 'z-score',
      type: 'neutral',
      severity: 'info',
      deviation: 0,
      context: { mean, stdDev },
      message: `No variation in historical ${metric} data`,
    };
  }
  
  const zScore = (value - mean) / stdDev;
  const isAnomaly = Math.abs(zScore) >= threshold;
  const type = determineAnomalyType(value, mean, metric);
  const severity = determineSeverity(zScore, 'z-score');
  
  const percentDiff = ((value - mean) / mean) * 100;
  const direction = value > mean ? 'above' : 'below';
  
  return {
    isAnomaly,
    value,
    method: 'z-score',
    type,
    severity,
    deviation: zScore,
    context: { mean, stdDev },
    message: isAnomaly
      ? `${metric}: ${value.toFixed(0)} is ${Math.abs(percentDiff).toFixed(1)}% ${direction} average (${mean.toFixed(0)}) — ${Math.abs(zScore).toFixed(1)} std devs`
      : `${metric} within normal range`,
  };
}

/**
 * WHAT: IQR (Interquartile Range) anomaly detection
 * WHY: More robust to extreme outliers than Z-Score, uses median instead of mean
 * HOW: Values beyond Q1 - 1.5×IQR or Q3 + 1.5×IQR are outliers
 * 
 * @param value - The value to test
 * @param historicalValues - Historical data for comparison
 * @param metric - Metric name for context
 * @param multiplier - IQR multiplier (default: 1.5 for outliers, 3 for extreme outliers)
 * @returns AnomalyResult with detection details
 */
export function detectIQRAnomaly(
  value: number,
  historicalValues: number[],
  metric: string = 'metric',
  multiplier: number = 1.5
): AnomalyResult {
  if (historicalValues.length < 4) {
    return {
      isAnomaly: false,
      value,
      method: 'iqr',
      type: 'neutral',
      severity: 'info',
      deviation: 0,
      context: {},
      message: `Insufficient historical data for ${metric} (need 4+ events)`,
    };
  }
  
  const sortedValues = [...historicalValues].sort((a, b) => a - b);
  const { q1, q3, iqr } = calculateIQR(sortedValues);
  const median = calculateMedian(sortedValues);
  
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;
  
  const isAnomaly = value < lowerBound || value > upperBound;
  const type = determineAnomalyType(value, median, metric);
  
  // WHAT: Calculate deviation as multiples of IQR
  let deviation = 0;
  if (value < lowerBound) {
    deviation = (q1 - value) / iqr;
  } else if (value > upperBound) {
    deviation = (value - q3) / iqr;
  }
  
  const severity = determineSeverity(deviation, 'iqr');
  const percentDiff = ((value - median) / median) * 100;
  const direction = value > median ? 'above' : 'below';
  
  return {
    isAnomaly,
    value,
    method: 'iqr',
    type,
    severity,
    deviation,
    context: { median, q1, q3, iqr },
    message: isAnomaly
      ? `${metric}: ${value.toFixed(0)} is ${Math.abs(percentDiff).toFixed(1)}% ${direction} median (${median.toFixed(0)}) — ${deviation.toFixed(1)}× IQR beyond normal range`
      : `${metric} within normal range (IQR)`,
  };
}

/**
 * WHAT: Percent change anomaly detection
 * WHY: Detect significant changes from a baseline (e.g., last event, same event last year)
 * HOW: Calculate percent change and flag if beyond threshold
 * 
 * @param value - Current value
 * @param baseline - Baseline value for comparison
 * @param metric - Metric name for context
 * @param threshold - Percent change threshold (default: 30%)
 * @returns AnomalyResult with detection details
 */
export function detectPercentChangeAnomaly(
  value: number,
  baseline: number,
  metric: string = 'metric',
  threshold: number = 30
): AnomalyResult {
  if (baseline === 0) {
    return {
      isAnomaly: false,
      value,
      method: 'percent-change',
      type: 'neutral',
      severity: 'info',
      deviation: 0,
      context: { baseline },
      message: `Cannot calculate percent change for ${metric} (baseline is zero)`,
    };
  }
  
  const percentChange = ((value - baseline) / baseline) * 100;
  const isAnomaly = Math.abs(percentChange) >= threshold;
  const type = determineAnomalyType(value, baseline, metric);
  const severity = determineSeverity(percentChange, 'percent-change');
  
  const direction = percentChange > 0 ? 'increase' : 'decrease';
  
  return {
    isAnomaly,
    value,
    method: 'percent-change',
    type,
    severity,
    deviation: percentChange,
    context: { baseline },
    message: isAnomaly
      ? `${metric}: ${Math.abs(percentChange).toFixed(1)}% ${direction} vs. baseline (${baseline.toFixed(0)} → ${value.toFixed(0)})`
      : `${metric} changed by ${Math.abs(percentChange).toFixed(1)}% (within normal range)`,
  };
}

/**
 * WHAT: Multi-method anomaly detection
 * WHY: Combine multiple methods for more reliable detection (consensus approach)
 * HOW: Run all methods and return combined results with consensus flag
 * 
 * @param value - Current value
 * @param historicalValues - Historical data for Z-Score and IQR
 * @param baseline - Baseline for percent change (optional, uses mean if not provided)
 * @param metric - Metric name
 * @returns Array of anomaly results with consensus indicator
 */
export function detectMultiMethodAnomalies(
  value: number,
  historicalValues: number[],
  baseline: number | null,
  metric: string = 'metric'
): {
  results: AnomalyResult[];
  consensus: boolean;
  highestSeverity: AnomalySeverity;
  primaryResult: AnomalyResult;
} {
  const results: AnomalyResult[] = [];
  
  // WHAT: Run Z-Score method
  const zScoreResult = detectZScoreAnomaly(value, historicalValues, metric);
  results.push(zScoreResult);
  
  // WHAT: Run IQR method
  const iqrResult = detectIQRAnomaly(value, historicalValues, metric);
  results.push(iqrResult);
  
  // WHAT: Run percent change method if baseline provided
  if (baseline !== null) {
    const percentResult = detectPercentChangeAnomaly(value, baseline, metric);
    results.push(percentResult);
  }
  
  // WHAT: Determine consensus (2+ methods agree it's an anomaly)
  const anomalyCount = results.filter((r) => r.isAnomaly).length;
  const consensus = anomalyCount >= 2;
  
  // WHAT: Find highest severity across all methods
  const severityOrder = { critical: 3, warning: 2, info: 1 };
  const highestSeverity = results.reduce((max, r) => {
    return severityOrder[r.severity] > severityOrder[max] ? r.severity : max;
  }, 'info' as AnomalySeverity);
  
  // WHAT: Primary result is the one with highest severity
  const primaryResult = results.reduce((best, r) => {
    return severityOrder[r.severity] > severityOrder[best.severity] ? r : best;
  });
  
  return {
    results,
    consensus,
    highestSeverity,
    primaryResult,
  };
}
