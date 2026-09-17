// tests/partnership-lifecycle.test.ts
// WHAT: computeLifecycleStage -- the actual stage rules behind messmass#235,
//     exactly as decided 2026-09-17, not a generic default.
// WHY: An override must always win (it's the only signal for the two states
//     with no data), and the renewal threshold must trigger at exactly the
//     boundary the org picked (6 months), not approximately.

import { computeLifecycleStage, RENEWAL_THRESHOLD_MONTHS } from '@/lib/partnershipLifecycle';

const NOW = new Date('2026-09-17T00:00:00.000Z');

function monthsAgo(months: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - Math.round(months * 30.44));
  return d.toISOString();
}

describe('computeLifecycleStage', () => {
  it('zero events with no override is Proposal', () => {
    const result = computeLifecycleStage(null, 0, null, NOW);
    expect(result.stage).toBe('proposal');
    expect(result.isOverridden).toBe(false);
  });

  it('a recent event (well under the threshold) is Activation', () => {
    const result = computeLifecycleStage(null, 3, monthsAgo(1), NOW);
    expect(result.stage).toBe('activation');
  });

  it('an event older than the renewal threshold is Renewal', () => {
    const result = computeLifecycleStage(null, 3, monthsAgo(RENEWAL_THRESHOLD_MONTHS + 1), NOW);
    expect(result.stage).toBe('renewal');
  });

  it('an event just under the threshold is still Activation, not Renewal', () => {
    const result = computeLifecycleStage(null, 3, monthsAgo(RENEWAL_THRESHOLD_MONTHS - 0.5), NOW);
    expect(result.stage).toBe('activation');
  });

  it('a postmortem override always wins, regardless of real event data', () => {
    const result = computeLifecycleStage('postmortem', 10, monthsAgo(0.1), NOW);
    expect(result.stage).toBe('postmortem');
    expect(result.isOverridden).toBe(true);
  });

  it('a proposal override always wins, even with real events', () => {
    const result = computeLifecycleStage('proposal', 5, monthsAgo(1), NOW);
    expect(result.stage).toBe('proposal');
    expect(result.isOverridden).toBe(true);
  });

  it('monthsSinceLastEvent is null for proposal and postmortem, never a stray number', () => {
    expect(computeLifecycleStage(null, 0, null, NOW).monthsSinceLastEvent).toBeNull();
    expect(computeLifecycleStage('postmortem', 5, monthsAgo(1), NOW).monthsSinceLastEvent).toBeNull();
  });
});
