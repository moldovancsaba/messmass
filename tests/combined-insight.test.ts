// tests/combined-insight.test.ts
// WHAT: fromExecutiveInsight/fromAnalyticsInsight must not drop or corrupt
//     any field of the two DISPLAY-level Insight types.
// WHY: messmass#414 follow-up. Same discipline as tests/anomaly-signal.test.ts,
//     one layer up: this is the type the new combined-insights page actually
//     renders, so a silently-dropped field here is a silently-broken page.
// HOW: Executive-side fixtures come from the real generateEventInsights (same
//     approach as tests/insight-id-stability.test.ts) rather than hand-built
//     objects. analytics-insights.ts's generateInsights(eventId) needs a live
//     DB and isn't unit-testable that way, so that side uses a hand-built
//     object matching the real Insight interface field-for-field -- still
//     checked against every field the interface declares, not a couple of
//     spot checks.

import { generateEventInsights } from '@/lib/insightsEngine';
import type { AnalyticsAggregate } from '@/lib/analytics.types';
import type { Insight as AnalyticsInsight } from '@/lib/analytics-insights';
import { fromExecutiveInsight, fromAnalyticsInsight, combinedInsightRank } from '@/lib/combinedInsight';

function aggregate(totalFans: number, eventDate: string): AnalyticsAggregate {
  return {
    projectId: 'proj-1',
    eventDate,
    fanMetrics: { totalFans },
    merchMetrics: { totalMerched: 10 },
    adMetrics: { totalROI: 1 },
  } as unknown as AnalyticsAggregate;
}

describe('fromExecutiveInsight preserves every insightsEngine.ts Insight field', () => {
  const current = aggregate(500, '2026-09-05');
  const historical = [aggregate(90, '2026-08-01'), aggregate(95, '2026-08-08'), aggregate(100, '2026-08-15'), aggregate(105, '2026-08-22')];

  it('every field survives the conversion, nested under `executive`', () => {
    const { insights } = generateEventInsights(current, historical);
    expect(insights.length).toBeGreaterThan(0);
    const source = insights[0];
    const signal = fromExecutiveInsight(source, current.eventDate);

    expect(signal.id).toBe(source.id);
    expect(signal.source).toBe('executive');
    expect(signal.title).toBe(source.title);
    expect(signal.message).toBe(source.message);
    expect(signal.confidence).toBe(Math.round(source.confidence * 100));
    expect(signal.createdAt).toBe(current.eventDate);
    expect(signal.executive).toEqual({
      category: source.category,
      priority: source.priority,
      metrics: source.metrics,
      confidence: source.confidence,
      impact: source.impact,
      recommendation: source.recommendation,
      context: source.context,
    });
    expect(signal.analytics).toBeUndefined();
  });
});

describe('fromAnalyticsInsight preserves every analytics-insights.ts Insight field', () => {
  // generateInsights(eventId) needs a live DB; this fixture matches the real
  // Insight interface (lib/analytics-insights.ts) field-for-field instead.
  const source: AnalyticsInsight = {
    id: 'insight-1',
    type: 'anomaly',
    severity: 'critical',
    metric: 'attendance',
    title: 'Attendance 23% below average',
    description: 'This event drew significantly fewer attendees than the recent baseline.',
    value: 320,
    change: -23,
    confidence: 87,
    actionable: true,
    recommendation: 'Review promotion timing for this event type.',
    relatedEvents: ['event-42', 'event-43'],
    createdAt: '2026-09-05T00:00:00.000Z',
    metadata: { baselineWindow: 10 },
  };

  it('every field survives the conversion, nested under `analytics`', () => {
    const signal = fromAnalyticsInsight(source);

    expect(signal.id).toBe(source.id);
    expect(signal.source).toBe('analytics');
    expect(signal.title).toBe(source.title);
    expect(signal.message).toBe(source.description);
    expect(signal.confidence).toBe(source.confidence);
    expect(signal.createdAt).toBe(source.createdAt);
    expect(signal.analytics).toEqual({
      type: source.type,
      severity: source.severity,
      metric: source.metric,
      value: source.value,
      change: source.change,
      confidence: source.confidence,
      actionable: source.actionable,
      recommendation: source.recommendation,
      relatedEvents: source.relatedEvents,
      metadata: source.metadata,
    });
    expect(signal.executive).toBeUndefined();
  });
});

describe('combinedInsightRank orders by each source\'s own vocabulary', () => {
  it('executive priority: critical > high > medium > low', () => {
    const mk = (priority: 'critical' | 'high' | 'medium' | 'low') =>
      fromExecutiveInsight(
        { id: 'x', category: 'anomaly', priority, title: '', message: '', metrics: [], confidence: 0.5, impact: 'neutral', context: {} },
        '2026-01-01'
      );
    expect(combinedInsightRank(mk('critical'))).toBeGreaterThan(combinedInsightRank(mk('high')));
    expect(combinedInsightRank(mk('high'))).toBeGreaterThan(combinedInsightRank(mk('medium')));
    expect(combinedInsightRank(mk('medium'))).toBeGreaterThan(combinedInsightRank(mk('low')));
  });

  it('analytics severity: critical > warning > info', () => {
    const mk = (severity: 'critical' | 'warning' | 'info') =>
      fromAnalyticsInsight({ ...({} as AnalyticsInsight), id: 'x', type: 'anomaly', severity, metric: 'm', title: '', description: '', confidence: 50, actionable: false, createdAt: '2026-01-01' });
    expect(combinedInsightRank(mk('critical'))).toBeGreaterThan(combinedInsightRank(mk('warning')));
    expect(combinedInsightRank(mk('warning'))).toBeGreaterThan(combinedInsightRank(mk('info')));
  });

  it('the two vocabularies are never conflated into one field', () => {
    const exec = fromExecutiveInsight(
      { id: 'x', category: 'anomaly', priority: 'high', title: '', message: '', metrics: [], confidence: 0.5, impact: 'neutral', context: {} },
      '2026-01-01'
    );
    expect((exec as any).priority).toBeUndefined(); // lives under `executive`, not hoisted
    expect((exec as any).severity).toBeUndefined(); // not the other source's field name either
  });
});
