/**
 * Trend Analysis Library
 * 
 * WHAT: Statistical methods for analyzing trends, detecting patterns, and predicting future metrics
 * WHY: Enable growth/decline detection, forecasting, and understanding seasonal patterns
 * HOW: Moving averages, linear regression, growth rates, seasonality detection
 * 
 * Version: 6.27.0 (Phase 2 - Insights Engine)
 * Created: 2025-10-19T12:43:10.000Z
 */

export type TrendDirection = 'increasing' | 'stable' | 'declining' | 'volatile' | 'insufficient_data';
export type TimeWindow = 'month' | 'quarter' | 'year';

export interface DataPoint {
  date: string; // ISO date
  value: number;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  slope: number; // Rate of change per time unit
  confidence: number; // 0-1, how reliable the trend is
  volatility: number; // Standard deviation / mean
  r2: number; // R-squared (goodness of fit for linear regression)
  prediction: {
    nextValue: number;
    margin: number; // ±margin for confidence interval
  };
  growth: {
    absolute: number; // Total change from first to last
    percent: number; // Percent change from first to last
    average: number; // Average per-period change
  };
  message: string;
}

export interface MovingAverageResult {
  values: number[];
  current: number;
  trend: 'above' | 'below' | 'at'; // Current value vs. MA
  crossover: boolean; // Recent crossover detected
}

export interface SeasonalityPattern {
  detected: boolean;
  period: number; // Number of data points in cycle
  strength: number; // 0-1, how strong the pattern is
  peaks: number[]; // Indices of peak values
  troughs: number[]; // Indices of trough values
}

/**
 * WHAT: Calculate simple moving average
 * WHY: Smooth out short-term fluctuations to reveal underlying trends
 * HOW: Average of last N values
 */
export function calculateMovingAverage(
  values: number[],
  window: number = 3
): MovingAverageResult {
  if (values.length < window) {
    return {
      values: [],
      current: values[values.length - 1] || 0,
      trend: 'at',
      crossover: false,
    };
  }
  
  const maValues: number[] = [];
  
  // WHAT: Calculate MA for each position where window fits
  for (let i = window - 1; i < values.length; i++) {
    const windowSlice = values.slice(i - window + 1, i + 1);
    const avg = windowSlice.reduce((sum, val) => sum + val, 0) / window;
    maValues.push(avg);
  }
  
  const currentValue = values[values.length - 1];
  const currentMA = maValues[maValues.length - 1];
  const previousMA = maValues[maValues.length - 2];
  
  // WHAT: Determine if current value is above/below MA
  let trend: 'above' | 'below' | 'at' = 'at';
  if (currentValue > currentMA * 1.05) trend = 'above';
  else if (currentValue < currentMA * 0.95) trend = 'below';
  
  // WHAT: Detect crossover (MA changed direction recently)
  const crossover = maValues.length >= 2 && 
    ((previousMA < currentMA && maValues[maValues.length - 3] >= previousMA) ||
     (previousMA > currentMA && maValues[maValues.length - 3] <= previousMA));
  
  return {
    values: maValues,
    current: currentMA,
    trend,
    crossover,
  };
}

/**
 * WHAT: Calculate exponential moving average
 * WHY: Give more weight to recent values for faster response to changes
 * HOW: EMA = value * α + EMA_previous * (1 - α), where α = 2/(window + 1)
 */
export function calculateExponentialMovingAverage(
  values: number[],
  window: number = 3
): MovingAverageResult {
  if (values.length === 0) {
    return {
      values: [],
      current: 0,
      trend: 'at',
      crossover: false,
    };
  }
  
  const alpha = 2 / (window + 1);
  const emaValues: number[] = [values[0]]; // Start with first value
  
  // WHAT: Calculate EMA for each subsequent value
  for (let i = 1; i < values.length; i++) {
    const ema = values[i] * alpha + emaValues[i - 1] * (1 - alpha);
    emaValues.push(ema);
  }
  
  const currentValue = values[values.length - 1];
  const currentEMA = emaValues[emaValues.length - 1];
  
  let trend: 'above' | 'below' | 'at' = 'at';
  if (currentValue > currentEMA * 1.05) trend = 'above';
  else if (currentValue < currentEMA * 0.95) trend = 'below';
  
  // WHAT: Detect crossover in recent EMA values
  const crossover = emaValues.length >= 3 &&
    ((emaValues[emaValues.length - 1] > emaValues[emaValues.length - 2] &&
      emaValues[emaValues.length - 2] <= emaValues[emaValues.length - 3]) ||
     (emaValues[emaValues.length - 1] < emaValues[emaValues.length - 2] &&
      emaValues[emaValues.length - 2] >= emaValues[emaValues.length - 3]));
  
  return {
    values: emaValues,
    current: currentEMA,
    trend,
    crossover,
  };
}

/**
 * WHAT: Linear regression for trend line and predictions
 * WHY: Fit a straight line to data points to identify overall trend and forecast
 * HOW: Least squares method: y = mx + b
 */
export function calculateLinearRegression(dataPoints: DataPoint[]): {
  slope: number;
  intercept: number;
  r2: number;
  prediction: (x: number) => number;
} {
  if (dataPoints.length < 2) {
    return { slope: 0, intercept: 0, r2: 0, prediction: () => 0 };
  }
  
  // WHAT: Convert dates to numeric indices for regression
  const n = dataPoints.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = dataPoints.map(dp => dp.value);
  
  // WHAT: Calculate means
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  // WHAT: Calculate slope (m) and intercept (b)
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // WHAT: Calculate R² (coefficient of determination)
  const predictions = xValues.map(x => slope * x + intercept);
  const ssTotal = yValues.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
  const ssResidual = yValues.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
  const r2 = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);
  
  return {
    slope,
    intercept,
    r2,
    prediction: (x: number) => slope * x + intercept,
  };
}

/**
 * WHAT: Comprehensive trend analysis
 * WHY: Combine multiple indicators for reliable trend detection
 * HOW: Linear regression + moving averages + volatility analysis
 */
export function analyzeTrend(
  dataPoints: DataPoint[],
  window: number = 3
): TrendAnalysis {
  if (dataPoints.length < 3) {
    return {
      direction: 'insufficient_data',
      slope: 0,
      confidence: 0,
      volatility: 0,
      r2: 0,
      prediction: { nextValue: 0, margin: 0 },
      growth: { absolute: 0, percent: 0, average: 0 },
      message: 'Insufficient data points for trend analysis (need 3+)',
    };
  }
  
  const values = dataPoints.map(dp => dp.value);
  
  // WHAT: Linear regression for overall trend
  const regression = calculateLinearRegression(dataPoints);
  
  // WHAT: Calculate volatility (coefficient of variation)
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const volatility = mean === 0 ? 0 : stdDev / mean;
  
  // WHAT: Determine trend direction
  let direction: TrendDirection = 'stable';
  
  if (volatility > 0.3) {
    // High volatility makes trend unreliable
    direction = 'volatile';
  } else if (regression.slope > mean * 0.05) {
    // Increasing if slope > 5% of mean per period
    direction = 'increasing';
  } else if (regression.slope < -mean * 0.05) {
    // Decreasing if slope < -5% of mean per period
    direction = 'declining';
  } else {
    direction = 'stable';
  }
  
  // WHAT: Calculate confidence based on R² and data points
  const dataSizeBonus = Math.min(dataPoints.length / 12, 1); // More data = more confidence
  const confidence = regression.r2 * 0.7 + dataSizeBonus * 0.3;
  
  // WHAT: Predict next value with confidence margin
  const nextValue = regression.prediction(dataPoints.length);
  const margin = stdDev * 1.96; // 95% confidence interval
  
  // WHAT: Calculate growth metrics
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const absoluteGrowth = lastValue - firstValue;
  const percentGrowth = firstValue === 0 ? 0 : (absoluteGrowth / firstValue) * 100;
  const averageGrowth = absoluteGrowth / (dataPoints.length - 1);
  
  // WHAT: Generate natural language message
  const directionText: Record<TrendDirection, string> = {
    increasing: 'upward trend',
    declining: 'downward trend',
    stable: 'stable trend',
    volatile: 'volatile pattern',
    insufficient_data: 'insufficient data',
  };
  
  const confidenceText = confidence > 0.7 ? 'strong' : confidence > 0.4 ? 'moderate' : 'weak';
  
  const message = direction === 'volatile'
    ? `Highly volatile (${(volatility * 100).toFixed(0)}% variation) — trend unreliable`
    : `${directionText[direction]} (${confidenceText} confidence: ${(confidence * 100).toFixed(0)}%) — ${percentGrowth >= 0 ? '+' : ''}${percentGrowth.toFixed(1)}% change`;
  
  return {
    direction,
    slope: regression.slope,
    confidence,
    volatility,
    r2: regression.r2,
    prediction: {
      nextValue,
      margin,
    },
    growth: {
      absolute: absoluteGrowth,
      percent: percentGrowth,
      average: averageGrowth,
    },
    message,
  };
}

/**
 * WHAT: Calculate growth rate between periods
 * WHY: Understand MoM, QoQ, YoY changes for performance tracking
 */
export function calculateGrowthRate(
  current: number,
  previous: number,
  window: TimeWindow = 'month'
): {
  absolute: number;
  percent: number;
  annualized: number;
  message: string;
} {
  const absolute = current - previous;
  const percent = previous === 0 ? 0 : (absolute / previous) * 100;
  
  // WHAT: Annualize growth rate based on time window
  const periodsPerYear = { month: 12, quarter: 4, year: 1 };
  const periods = periodsPerYear[window];
  const annualized = Math.pow(1 + percent / 100, periods) - 1;
  
  const windowText = { month: 'MoM', quarter: 'QoQ', year: 'YoY' };
  const direction = percent >= 0 ? 'growth' : 'decline';
  
  return {
    absolute,
    percent,
    annualized: annualized * 100,
    message: `${windowText[window]}: ${percent >= 0 ? '+' : ''}${percent.toFixed(1)}% ${direction} (${absolute >= 0 ? '+' : ''}${absolute.toFixed(0)})`,
  };
}

/**
 * WHAT: Detect seasonality patterns
 * WHY: Identify recurring patterns (e.g., higher attendance in summer)
 * HOW: Autocorrelation analysis to find repeating cycles
 */
export function detectSeasonality(
  dataPoints: DataPoint[],
  maxPeriod: number = 12
): SeasonalityPattern {
  if (dataPoints.length < maxPeriod * 2) {
    return {
      detected: false,
      period: 0,
      strength: 0,
      peaks: [],
      troughs: [],
    };
  }
  
  const values = dataPoints.map(dp => dp.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  // WHAT: Calculate autocorrelation for different lags
  let bestPeriod = 0;
  let bestCorrelation = 0;
  
  for (let lag = 2; lag <= Math.min(maxPeriod, Math.floor(values.length / 2)); lag++) {
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < values.length - lag; i++) {
      const val1 = values[i] - mean;
      const val2 = values[i + lag] - mean;
      numerator += val1 * val2;
      denominator1 += val1 * val1;
      denominator2 += val2 * val2;
    }
    
    const correlation = denominator1 === 0 || denominator2 === 0
      ? 0
      : numerator / Math.sqrt(denominator1 * denominator2);
    
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = lag;
    }
  }
  
  const detected = bestCorrelation > 0.5; // Correlation threshold for seasonality
  
  // WHAT: Identify peaks and troughs if seasonality detected
  const peaks: number[] = [];
  const troughs: number[] = [];
  
  if (detected) {
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        peaks.push(i);
      } else if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
        troughs.push(i);
      }
    }
  }
  
  return {
    detected,
    period: bestPeriod,
    strength: bestCorrelation,
    peaks,
    troughs,
  };
}

/**
 * WHAT: Calculate consecutive trend (e.g., 3 months of growth)
 * WHY: Detect consistent patterns (good for alerts like "declining 3 events in a row")
 */
export function detectConsecutiveTrend(
  values: number[],
  minConsecutive: number = 3
): {
  type: 'increasing' | 'decreasing' | 'none';
  count: number;
  message: string;
} {
  if (values.length < minConsecutive) {
    return { type: 'none', count: 0, message: 'Insufficient data for consecutive trend' };
  }
  
  let increasingCount = 0;
  let decreasingCount = 0;
  
  // WHAT: Count consecutive increases/decreases from end of array
  for (let i = values.length - 1; i > 0; i--) {
    if (values[i] > values[i - 1]) {
      if (decreasingCount > 0) break; // Streak broken
      increasingCount++;
    } else if (values[i] < values[i - 1]) {
      if (increasingCount > 0) break; // Streak broken
      decreasingCount++;
    } else {
      break; // Equal values break the streak
    }
  }
  
  if (increasingCount >= minConsecutive) {
    return {
      type: 'increasing',
      count: increasingCount,
      message: `${increasingCount} consecutive increases detected`,
    };
  } else if (decreasingCount >= minConsecutive) {
    return {
      type: 'decreasing',
      count: decreasingCount,
      message: `${decreasingCount} consecutive decreases detected — requires attention`,
    };
  }
  
  return {
    type: 'none',
    count: Math.max(increasingCount, decreasingCount),
    message: 'No significant consecutive trend',
  };
}
