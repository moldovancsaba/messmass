// lib/statistics.ts
// WHAT: The pure statistical primitives (mean, population standard deviation)
//     shared by messmass's two anomaly-detection pipelines.
// WHY: messmass#414. lib/anomalyDetection.ts and lib/analytics-anomaly.ts each
//     carried their own calculateMean/calculateStdDev -- byte-identical
//     formulas, duplicated. That part is safe to merge with zero behavior
//     change. Their actual detection methods, severity scales, and quartile
//     calculations are NOT merged here: anomalyDetection.ts tests one new
//     value against a historical array (per-event use); analytics-anomaly.ts
//     scans a whole dated time series and flags which dates are anomalous,
//     with a moving-average method the other has no equivalent for, a
//     different severity scale (low/medium/high + confidence, vs
//     critical/warning/info), and quartiles computed by a different method
//     (Tukey's hinges vs linear-interpolation percentiles) -- forcing those
//     together would silently change what either live dashboard reports as
//     anomalous. See the #414 comment for the full comparison.

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/** Population standard deviation (divides by N, not N-1) -- matches both prior copies. */
export function calculateStdDev(values: number[], mean?: number): number {
  if (values.length === 0) return 0;
  const avg = mean ?? calculateMean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

// WHAT: Linear-interpolation percentile (R's "type 7" / numpy's default) --
//     `sortedValues` must already be sorted ascending.
// WHY: messmass#414. anomalyDetection.ts computed Q1/Q3 via Tukey's hinges
//     (split the set in half, median of each half); analytics-anomaly.ts used
//     this linear-interpolation method. They do not agree numerically in
//     general, so this is the one piece of #414 that IS a real behavior
//     choice, not a mechanical merge -- checked empirically against messmass's
//     own production data (fan counts, merch counts, jersey counts: n=138-276)
//     before picking it, rather than assumed safe: both methods flagged the
//     exact same set of outliers on every metric checked, zero disagreements.
//     Picked this method as canonical because it already generalizes to any
//     percentile (used here for Q1/Q3 and, at p=50, as the median), where
//     Tukey's hinges is Q1/Q3-only.
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

export function calculateQuartiles(sortedValues: number[]): { q1: number; q3: number; iqr: number } {
  const q1 = calculatePercentile(sortedValues, 25);
  const q3 = calculatePercentile(sortedValues, 75);
  return { q1, q3, iqr: q3 - q1 };
}
