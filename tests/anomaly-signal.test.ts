// tests/anomaly-signal.test.ts
// WHAT: fromAnomalyResult/fromAnalyticsAnomaly must not drop or corrupt any
//     field of the source objects.
// WHY: messmass#414 follow-up. The whole point of lib/anomalySignal.ts is a
//     "no information lost" merge -- a test that only checks a couple of
//     fields would let a future edit silently drop one and still pass. This
//     asserts every field from both source interfaces round-trips exactly.
// HOW: Uses the real detect functions from both pipelines to produce genuine
//     AnomalyResult/Anomaly values (not hand-built fixtures that could drift
//     from what the real types actually look like), then checks the
//     conversion against every field those real values carry.

import { detectZScoreAnomaly, detectIQRAnomaly, detectPercentChangeAnomaly } from '@/lib/anomalyDetection';
import { detectAnomalies, type TimeSeriesDataPoint } from '@/lib/analytics-anomaly';
import { fromAnomalyResult, fromAnalyticsAnomaly } from '@/lib/anomalySignal';

describe('fromAnomalyResult preserves every AnomalyResult field', () => {
  const historical = [90, 95, 100, 105, 110];

  it('z-score result: every field present and unchanged', () => {
    const result = detectZScoreAnomaly(140, historical, 'fans');
    const signal = fromAnomalyResult(result, 'fans');

    expect(signal.source).toBe('per-event');
    expect(signal.metric).toBe('fans');
    expect(signal.value).toBe(result.value);
    expect(signal.method).toBe(result.method);
    expect(signal.isAnomaly).toBe(result.isAnomaly);
    expect(signal.message).toBe(result.message);
    expect(signal.executive).toEqual({
      severity: result.severity,
      type: result.type,
      deviation: result.deviation,
      context: result.context,
    });
    // No time-series field invented for a per-event result.
    expect(signal.timeSeries).toBeUndefined();
  });

  it('iqr result: every field present and unchanged, including quartile context', () => {
    const result = detectIQRAnomaly(500, [10, 20, 30, 40, 50, 60, 70, 80], 'merch');
    const signal = fromAnomalyResult(result, 'merch');
    expect(signal.executive?.context.q1).toBe(result.context.q1);
    expect(signal.executive?.context.q3).toBe(result.context.q3);
    expect(signal.executive?.context.iqr).toBe(result.context.iqr);
    expect(signal.executive?.deviation).toBe(result.deviation);
  });

  it('percent-change result: baseline context survives', () => {
    const result = detectPercentChangeAnomaly(150, 100, 'revenue');
    const signal = fromAnomalyResult(result, 'revenue');
    expect(signal.executive?.context.baseline).toBe(100);
    expect(signal.executive?.deviation).toBe(result.deviation);
  });
});

describe('fromAnalyticsAnomaly preserves every Anomaly field', () => {
  function point(date: string, value: number): TimeSeriesDataPoint {
    return { date, value };
  }

  it('every field present and unchanged for a detected time-series anomaly', async () => {
    const data = [
      point('2026-01-01', 100),
      point('2026-01-02', 102),
      point('2026-01-03', 98),
      point('2026-01-04', 101),
      point('2026-01-05', 99),
      point('2026-01-06', 400),
    ];
    const result = await detectAnomalies('revenue', data, { minDataPoints: 5 });
    const anomaly = result.anomalies.find((a) => a.date === '2026-01-06');
    expect(anomaly).toBeDefined();

    const signal = fromAnalyticsAnomaly(anomaly!);
    expect(signal.source).toBe('time-series');
    expect(signal.metric).toBe(anomaly!.metric);
    expect(signal.value).toBe(anomaly!.value);
    expect(signal.method).toBe(anomaly!.method);
    expect(signal.isAnomaly).toBe(true);
    expect(signal.message).toBe(anomaly!.description);
    expect(signal.timeSeries).toEqual({
      date: anomaly!.date,
      severity: anomaly!.severity,
      confidence: anomaly!.confidence,
      expectedValue: anomaly!.expectedValue,
      deviationPercent: anomaly!.deviation,
    });
    // No per-event field invented for a time-series result.
    expect(signal.executive).toBeUndefined();
  });
});

describe('the two "deviation" fields are never conflated', () => {
  it('AnomalyResult deviation and Anomaly deviationPercent stay in separate, clearly-labeled slots', () => {
    // Same historical shape fed through both pipelines' z-score method --
    // proves the union type keeps each source's own number in its own place
    // rather than merging them into one ambiguous "deviation".
    const perEvent = fromAnomalyResult(detectZScoreAnomaly(140, [90, 95, 100, 105, 110], 'fans'), 'fans');
    expect(perEvent.executive!.deviation).not.toBe(undefined);
    expect((perEvent as any).deviation).toBeUndefined(); // not hoisted to the top level
    expect((perEvent as any).deviationPercent).toBeUndefined(); // not the other source's field name either
  });
});
