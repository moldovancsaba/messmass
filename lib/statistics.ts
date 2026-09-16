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
