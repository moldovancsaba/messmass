// Covers the overall-score derivation that replaced the hardcoded `70` in
// lib/insightsEngine.ts (health-audit rank 11).

// lib/insightsEngine imports lib/mongodb transitively; mock it so the eager
// MongoClient.connect() at import time does not open a real connection.
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }),
}));

import { computeOverallScore, scoreToRating, type Insight } from '@/lib/insightsEngine';

const insight = (over: Partial<Insight>): Insight => ({
  id: 'x',
  category: 'performance',
  priority: 'medium',
  title: 't',
  message: 'm',
  metrics: [],
  confidence: 1,
  impact: 'neutral',
  context: {},
  ...over,
});

describe('computeOverallScore', () => {
  it('returns 100 with no insights', () => {
    expect(computeOverallScore([])).toBe(100);
  });

  it('deducts more for higher-priority negatives', () => {
    expect(computeOverallScore([insight({ impact: 'negative', priority: 'critical' })])).toBe(85);
    expect(computeOverallScore([insight({ impact: 'negative', priority: 'low' })])).toBe(98);
  });

  it('adds for positives and ignores neutral', () => {
    expect(computeOverallScore([insight({ impact: 'positive', priority: 'critical' })])).toBe(100); // capped at 100
    expect(computeOverallScore([insight({ impact: 'neutral', priority: 'critical' })])).toBe(100);
  });

  it('clamps to the 0..100 range', () => {
    const manyCritical = Array.from({ length: 20 }, () =>
      insight({ impact: 'negative', priority: 'critical' })
    );
    expect(computeOverallScore(manyCritical)).toBe(0);
  });
});

describe('scoreToRating', () => {
  it('maps score bands to the shared PerformanceRating scale', () => {
    expect(scoreToRating(90)).toBe('excellent');
    expect(scoreToRating(75)).toBe('good');
    expect(scoreToRating(60)).toBe('average');
    expect(scoreToRating(40)).toBe('below_average');
    expect(scoreToRating(10)).toBe('poor');
  });
});
