// tests/insight-id-stability.test.ts
// WHAT: An insight's id must be the same across two separate generations of
//     the same anomaly, for the same metric.
// WHY: messmass#233 audit. generateInsightId included Date.now(), so the
//     comment above it -- "Track and deduplicate insights" -- could never be
//     true: the same anomaly on the same metric got a different id every time
//     it was recomputed. Nothing currently reads the id for dedup (it is used
//     only as a React key today), so nothing visibly broke, but it would have
//     silently defeated the first dismiss/seen-tracking feature built on it.

import { generateEventInsights } from '@/lib/insightsEngine';
import type { AnalyticsAggregate } from '@/lib/analytics.types';

/** Only the fields generateEventInsights actually reads. */
function aggregate(totalFans: number, eventDate: string): AnalyticsAggregate {
  return {
    projectId: 'proj-1',
    eventDate,
    fanMetrics: { totalFans },
    merchMetrics: { totalMerched: 10 },
    adMetrics: { totalROI: 1 },
  } as unknown as AnalyticsAggregate;
}

describe('insight ids are stable, not timestamped', () => {
  const current = aggregate(500, '2026-09-05');
  const historical = [
    aggregate(90, '2026-08-01'),
    aggregate(95, '2026-08-08'),
    aggregate(100, '2026-08-15'),
    aggregate(105, '2026-08-22'),
  ];

  it('assigns the same id to the same insight computed twice', () => {
    const first = generateEventInsights(current, historical);
    const second = generateEventInsights(current, historical);

    expect(first.insights.length).toBeGreaterThan(0);
    expect(first.insights.map((i) => i.id).sort()).toEqual(second.insights.map((i) => i.id).sort());
  });

  it('never embeds a timestamp in the id', () => {
    const { insights } = generateEventInsights(current, historical);
    for (const insight of insights) {
      expect(insight.id).not.toMatch(/-\d{10,}$/);
    }
  });

  it('has no id collisions within a single report', () => {
    const { insights } = generateEventInsights(current, historical);
    const ids = insights.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
