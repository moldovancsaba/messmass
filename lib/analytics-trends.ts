/**
 * Analytics Trend Analysis Module
 * 
 * WHAT: Detect and quantify trends in time-series data using statistical methods
 * WHY: Identify increasing/decreasing patterns and forecast future performance
 * 
 * Algorithms:
 * - Simple Linear Regression: y = mx + b (line of best fit)
 * - R² (Coefficient of Determination): Goodness of fit
 * - Trend change detection: Identify inflection points
 */

import { TimeSeriesDataPoint } from './analytics-anomaly';

// ============================================================================
// TYPES
// ============================================================================

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  slope: number; // Rate of change per data point
  rSquared: number; // Goodness of fit (0-1)
  changePercent: number; // % change from start to end
  projection: {
    value30days: number;
    value90days: number;
    confidence: number; // 0-100
  };
  startValue: number;
  endValue: number;
  dataPoints: number;
}

export interface TrendChangePoint {
  index: number;
  date: string;
  value: number;
  previousTrend: 'increasing' | 'decreasing' | 'stable';
  newTrend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  predictions: number[];
}

// ============================================================================
// CORE TREND ANALYSIS
// ============================================================================

/**
 * WHAT: Analyze trend direction and strength in time-series data
 * WHY: Understand if metrics are improving, declining, or stable over time
 * 
 * @param data - Time-series data points (must be chronologically sorted)
 * @returns Complete trend analysis with projections
 */
export async function analyzeTrend(
  data: TimeSeriesDataPoint[]
): Promise<TrendAnalysis> {
  // WHAT: Validate minimum data points
  // WHY: Cannot calculate meaningful trend with < 3 points
  if (data.length < 3) {
    return {
      direction: 'stable',
      strength: 'weak',
      slope: 0,
      rSquared: 0,
      changePercent: 0,
      projection: {
        value30days: data[data.length - 1]?.value || 0,
        value90days: data[data.length - 1]?.value || 0,
        confidence: 0,
      },
      startValue: data[0]?.value || 0,
      endValue: data[data.length - 1]?.value || 0,
      dataPoints: data.length,
    };
  }

  // WHAT: Perform linear regression on data
  // WHY: Find line of best fit (y = mx + b) to quantify trend
  const regression = linearRegression(data);

  // WHAT: Determine trend direction based on slope
  // WHY: Positive slope = increasing, negative = decreasing, near-zero = stable
  const direction = getTrendDirection(regression.slope, regression.rSquared);

  // WHAT: Determine trend strength based on R² value
  // WHY: R² close to 1 = strong fit, close to 0 = weak/noisy
  const strength = getTrendStrength(regression.rSquared);

  // WHAT: Calculate percentage change from start to end
  // WHY: Intuitive measure of overall movement
  const startValue = data[0].value;
  const endValue = data[data.length - 1].value;
  const changePercent = startValue !== 0 ? ((endValue - startValue) / startValue) * 100 : 0;

  // WHAT: Project future values based on trend
  // WHY: Forecast 30 and 90 day performance for planning
  const projection = projectFutureValues(
    data,
    regression,
    direction,
    regression.rSquared
  );

  return {
    direction,
    strength,
    slope: regression.slope,
    rSquared: regression.rSquared,
    changePercent,
    projection,
    startValue,
    endValue,
    dataPoints: data.length,
  };
}

// ============================================================================
// LINEAR REGRESSION
// ============================================================================

/**
 * WHAT: Calculate simple linear regression (y = mx + b)
 * WHY: Find best-fit line through data points
 * 
 * Algorithm:
 * - m (slope) = Σ(x - x̄)(y - ȳ) / Σ(x - x̄)²
 * - b (intercept) = ȳ - m·x̄
 * - R² = 1 - (SSres / SStot)
 * 
 * @param data - Time-series data points
 * @returns Slope, intercept, R², and predicted values
 */
export function linearRegression(
  data: TimeSeriesDataPoint[]
): LinearRegressionResult {
  const n = data.length;

  // WHAT: Create numerical x-axis (0, 1, 2, ...)
  // WHY: Time index for regression calculation
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = data.map((d) => d.value);

  // WHAT: Calculate means
  // WHY: Required for regression formula
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

  // WHAT: Calculate slope (m)
  // WHY: Rate of change in the trend
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = yValues[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // WHAT: Calculate intercept (b)
  // WHY: Y-value when x = 0
  const intercept = yMean - slope * xMean;

  // WHAT: Calculate R² (coefficient of determination)
  // WHY: Measure how well the line fits the data (0 = no fit, 1 = perfect fit)
  const predictions = xValues.map((x) => slope * x + intercept);

  // Sum of squared residuals (actual - predicted)²
  const ssRes = yValues.reduce(
    (sum, y, i) => sum + Math.pow(y - predictions[i], 2),
    0
  );

  // Total sum of squares (actual - mean)²
  const ssTot = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);

  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return {
    slope,
    intercept,
    rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp between 0 and 1
    predictions,
  };
}

// ============================================================================
// TREND CLASSIFICATION
// ============================================================================

/**
 * WHAT: Determine trend direction from slope and R²
 * WHY: Classify trend as increasing, decreasing, or stable
 * 
 * Rules:
 * - If R² < 0.3 → stable (line doesn't fit well = no clear trend)
 * - If slope > 0.01 → increasing
 * - If slope < -0.01 → decreasing
 * - Otherwise → stable
 */
function getTrendDirection(
  slope: number,
  rSquared: number
): 'increasing' | 'decreasing' | 'stable' {
  // WHAT: Low R² indicates no clear trend
  // WHY: Data is too noisy for reliable trend detection
  if (rSquared < 0.3) return 'stable';

  // WHAT: Check slope magnitude
  // WHY: Positive = increasing, negative = decreasing
  const SLOPE_THRESHOLD = 0.01;
  if (slope > SLOPE_THRESHOLD) return 'increasing';
  if (slope < -SLOPE_THRESHOLD) return 'decreasing';
  return 'stable';
}

/**
 * WHAT: Determine trend strength from R²
 * WHY: Quantify confidence in the trend
 * 
 * Thresholds:
 * - R² > 0.7 → strong (70%+ of variance explained)
 * - R² > 0.4 → moderate
 * - R² ≤ 0.4 → weak
 */
function getTrendStrength(rSquared: number): 'weak' | 'moderate' | 'strong' {
  if (rSquared > 0.7) return 'strong';
  if (rSquared > 0.4) return 'moderate';
  return 'weak';
}

// ============================================================================
// FUTURE PROJECTIONS
// ============================================================================

/**
 * WHAT: Project future values based on current trend
 * WHY: Forecast 30-day and 90-day performance for planning
 * 
 * @param data - Historical data
 * @param regression - Regression results
 * @param direction - Trend direction
 * @param rSquared - Goodness of fit
 * @returns Projected values with confidence
 */
function projectFutureValues(
  data: TimeSeriesDataPoint[],
  regression: LinearRegressionResult,
  direction: 'increasing' | 'decreasing' | 'stable',
  rSquared: number
): { value30days: number; value90days: number; confidence: number } {
  const lastIndex = data.length - 1;
  const lastValue = data[lastIndex].value;

  // WHAT: For stable trends, project current value
  // WHY: No clear trend means best estimate is current value
  if (direction === 'stable') {
    return {
      value30days: lastValue,
      value90days: lastValue,
      confidence: 30,
    };
  }

  // WHAT: Calculate 30-day and 90-day projections
  // WHY: Extend the regression line into the future
  // Note: Assuming 1 data point = 1 day (adjust if using weekly/monthly data)
  const value30days = regression.slope * (lastIndex + 30) + regression.intercept;
  const value90days = regression.slope * (lastIndex + 90) + regression.intercept;

  // WHAT: Calculate confidence based on R² and projection distance
  // WHY: Further projections are less reliable, lower R² = less confidence
  const baseConfidence = rSquared * 100;
  const confidence30 = Math.max(20, baseConfidence * 0.8); // 80% of base for 30 days
  const confidence90 = Math.max(10, baseConfidence * 0.6); // 60% of base for 90 days

  return {
    value30days: Math.max(0, value30days), // Don't project negative values
    value90days: Math.max(0, value90days),
    confidence: confidence30, // Use 30-day confidence as representative
  };
}

// ============================================================================
// TREND CHANGE DETECTION
// ============================================================================

/**
 * WHAT: Identify points where trend changes direction
 * WHY: Detect inflection points that signal strategy shifts or external factors
 * 
 * Algorithm:
 * - Use sliding window to calculate local trends
 * - Compare consecutive window trends to find changes
 * 
 * @param data - Time-series data points
 * @param windowSize - Size of sliding window (default: 7)
 * @returns Array of detected trend change points
 */
export async function detectTrendChange(
  data: TimeSeriesDataPoint[],
  windowSize: number = 7
): Promise<TrendChangePoint[]> {
  // WHAT: Need enough data for at least 2 windows
  // WHY: Cannot detect change without comparing two periods
  if (data.length < windowSize * 2) {
    return [];
  }

  const changePoints: TrendChangePoint[] = [];
  const step = Math.max(1, Math.floor(windowSize / 2)); // 50% overlap

  // WHAT: Calculate trends for sliding windows
  // WHY: Detect local trend changes
  for (let i = 0; i <= data.length - windowSize * 2; i += step) {
    const window1 = data.slice(i, i + windowSize);
    const window2 = data.slice(i + windowSize, i + windowSize * 2);

    const trend1 = await analyzeTrend(window1);
    const trend2 = await analyzeTrend(window2);

    // WHAT: Check if trend direction changed
    // WHY: Significant change indicates inflection point
    if (trend1.direction !== trend2.direction && trend1.direction !== 'stable') {
      const changeIndex = i + windowSize;
      const confidence = Math.min(trend1.rSquared, trend2.rSquared) * 100;

      // WHAT: Only report high-confidence changes
      // WHY: Avoid false positives from noisy data
      if (confidence > 40) {
        changePoints.push({
          index: changeIndex,
          date: data[changeIndex].date,
          value: data[changeIndex].value,
          previousTrend: trend1.direction,
          newTrend: trend2.direction,
          confidence,
        });
      }
    }
  }

  return changePoints;
}

// ============================================================================
// MOVING AVERAGE TREND
// ============================================================================

/**
 * WHAT: Calculate simple moving average for smoothing noisy data
 * WHY: Reduce noise to reveal underlying trend
 * 
 * @param data - Time-series data
 * @param window - Moving average window size
 * @returns Smoothed data points
 */
export function calculateMovingAverage(
  data: TimeSeriesDataPoint[],
  window: number
): TimeSeriesDataPoint[] {
  if (data.length < window) return data;

  const smoothed: TimeSeriesDataPoint[] = [];

  for (let i = 0; i <= data.length - window; i++) {
    const windowData = data.slice(i, i + window);
    const avg = windowData.reduce((sum, d) => sum + d.value, 0) / window;

    // WHAT: Use the last date in the window
    // WHY: Moving average represents the trend up to that point
    smoothed.push({
      date: windowData[window - 1].date,
      value: avg,
    });
  }

  return smoothed;
}

// ============================================================================
// TREND COMPARISON
// ============================================================================

/**
 * WHAT: Compare trends of two time-series datasets
 * WHY: Benchmark performance against historical periods or peers
 * 
 * @param data1 - First dataset
 * @param data2 - Second dataset
 * @returns Comparison results
 */
export async function compareTrends(
  data1: TimeSeriesDataPoint[],
  data2: TimeSeriesDataPoint[]
): Promise<{
  trend1: TrendAnalysis;
  trend2: TrendAnalysis;
  comparison: {
    slopeDifference: number;
    directionMatch: boolean;
    strengthDifference: string;
  };
}> {
  const trend1 = await analyzeTrend(data1);
  const trend2 = await analyzeTrend(data2);

  const slopeDifference = trend1.slope - trend2.slope;
  const directionMatch = trend1.direction === trend2.direction;

  // WHAT: Compare strength levels
  // WHY: Understand relative trend confidence
  const strengthLevels = { weak: 0, moderate: 1, strong: 2 };
  const strengthDiff = strengthLevels[trend1.strength] - strengthLevels[trend2.strength];
  let strengthDifference = 'equal';
  if (strengthDiff > 0) strengthDifference = 'stronger';
  if (strengthDiff < 0) strengthDifference = 'weaker';

  return {
    trend1,
    trend2,
    comparison: {
      slopeDifference,
      directionMatch,
      strengthDifference,
    },
  };
}
