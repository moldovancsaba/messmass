// lib/anomalySignal.ts
// WHAT: A single, lossless type that either anomaly pipeline's result can be
//     converted into, for a future consumer that needs to show both together.
// WHY: messmass#414 follow-up. The two pipelines' "deviation" fields are not
//     the same number under different names -- they are different formulas:
//     anomalyDetection.ts's deviation is the raw z-score (std devs) or an
//     IQR-units distance measured from Q1/Q3; analytics-anomaly.ts's
//     deviation is always a percentage, measured from mean/median/moving-avg
//     depending on method, and its own IQR-units distance is never exposed on
//     the Anomaly type at all (only used internally for confidence). Flattening
//     these into one shared "deviation" field would either be wrong (claiming
//     two different quantities are the same) or lossy (dropping one). Nesting
//     by source keeps every field, with its real meaning intact, instead.
// HOW: fromAnomalyResult/fromAnalyticsAnomaly are pure, total conversions --
//     every field either source type carries appears somewhere in the output.
//     No UI reads this yet; it exists for a future combined view across both
//     dashboards, built when one is actually needed.

import type { AnomalyResult, AnomalyMethod } from './anomalyDetection';
import type { Anomaly } from './analytics-anomaly';

export type AnomalySignalMethod = AnomalyMethod | 'moving-avg';

export interface AnomalySignal {
  /** Which pipeline produced this -- 'per-event' = anomalyDetection.ts, 'time-series' = analytics-anomaly.ts. */
  source: 'per-event' | 'time-series';
  metric: string;
  value: number;
  method: AnomalySignalMethod;
  isAnomaly: boolean;
  message: string;

  /** Present only when source === 'per-event'. Every field from AnomalyResult. */
  executive?: {
    severity: AnomalyResult['severity'];
    type: AnomalyResult['type'];
    /** Raw z-score (std devs) for method 'z-score'; IQR-units from Q1/Q3 for 'iqr'; percent for 'percent-change'. */
    deviation: number;
    context: AnomalyResult['context'];
  };

  /** Present only when source === 'time-series'. Every field from Anomaly. */
  timeSeries?: {
    date: string;
    severity: Anomaly['severity'];
    confidence: number;
    expectedValue: number;
    /** Always a percentage; reference point (mean/median/moving-avg) depends on `method`. */
    deviationPercent: number;
  };
}

/** Lossless conversion of anomalyDetection.ts's AnomalyResult. `metric` is passed separately -- AnomalyResult doesn't carry it (the caller already knows it). */
export function fromAnomalyResult(result: AnomalyResult, metric: string): AnomalySignal {
  return {
    source: 'per-event',
    metric,
    value: result.value,
    method: result.method,
    isAnomaly: result.isAnomaly,
    message: result.message,
    executive: {
      severity: result.severity,
      type: result.type,
      deviation: result.deviation,
      context: result.context,
    },
  };
}

/** Lossless conversion of analytics-anomaly.ts's Anomaly. */
export function fromAnalyticsAnomaly(anomaly: Anomaly): AnomalySignal {
  return {
    source: 'time-series',
    metric: anomaly.metric,
    value: anomaly.value,
    method: anomaly.method,
    isAnomaly: true, // Anomaly only exists in the anomalies[] array for flagged points -- there is no "not anomalous" Anomaly.
    message: anomaly.description ?? '',
    timeSeries: {
      date: anomaly.date,
      severity: anomaly.severity,
      confidence: anomaly.confidence,
      expectedValue: anomaly.expectedValue,
      deviationPercent: anomaly.deviation,
    },
  };
}
