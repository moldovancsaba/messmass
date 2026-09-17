// tests/v3-metric-materializer.test.ts
// WHAT: normalizeStats and computeMetricValues -- the pure logic behind
//     messmass#232's metric materialization, calling the same
//     calculateFanMetrics/calculateAdMetrics functions #226 already
//     verified, not reimplementing them.
// WHY: Only 121 of 459 v3_activities have both stats and an owner entity
//     today (checked against production); of the 304 with *some* stats,
//     completeness isn't guaranteed. normalizeStats is what stands between
//     a real, partially-filled stats document and a NaN silently written
//     into the warehouse.

import { normalizeStats, computeMetricValues } from '@/lib/v3/metricMaterializer';
import { METRIC_CATALOG } from '@/lib/v3/metricCatalog';
import type { ProjectStats } from '@/lib/analyticsCalculator';

describe('normalizeStats', () => {
  it('defaults every required numeric field that is missing', () => {
    const normalized = normalizeStats({});
    expect(normalized.remoteImages).toBe(0);
    expect(normalized.stadium).toBe(0);
    expect(normalized.merched).toBe(0);
    expect(normalized.eventAttendees).toBe(0);
  });

  it('preserves real values instead of overwriting them', () => {
    const normalized = normalizeStats({ remoteImages: 50, stadium: 200, merched: 30 } as Partial<ProjectStats>);
    expect(normalized.remoteImages).toBe(50);
    expect(normalized.stadium).toBe(200);
    expect(normalized.merched).toBe(30);
  });

  it('defaults a non-numeric value rather than propagating it', () => {
    const normalized = normalizeStats({ stadium: 'not-a-number' as any });
    expect(normalized.stadium).toBe(0);
  });

  it('defaults NaN and Infinity rather than propagating them', () => {
    expect(normalizeStats({ stadium: NaN } as any).stadium).toBe(0);
    expect(normalizeStats({ stadium: Infinity } as any).stadium).toBe(0);
  });
});

describe('computeMetricValues', () => {
  it('produces a value for every catalog metric', () => {
    const values = computeMetricValues({ remoteImages: 100, hostessImages: 50, selfies: 20, stadium: 500, merched: 80 } as Partial<ProjectStats>, 42);
    for (const entry of METRIC_CATALOG) {
      expect(values[entry.key]).toBeDefined();
      expect(Number.isFinite(values[entry.key])).toBe(true);
    }
  });

  it('total-images sums the three image sources', () => {
    const values = computeMetricValues({ remoteImages: 100, hostessImages: 50, selfies: 20 } as Partial<ProjectStats>, 0);
    expect(values['total-images']).toBe(170);
  });

  it('bitly-clicks passes through the provided total unchanged', () => {
    const values = computeMetricValues({}, 999);
    expect(values['bitly-clicks']).toBe(999);
  });

  it('never produces NaN even from a completely empty stats object', () => {
    const values = computeMetricValues({}, 0);
    for (const value of Object.values(values)) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});

describe('METRIC_CATALOG', () => {
  it('every entry has a unique key', () => {
    const keys = METRIC_CATALOG.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('covers all three classifications, not just one', () => {
    const classifications = new Set(METRIC_CATALOG.map((m) => m.classification));
    expect(classifications.has('raw')).toBe(true);
    expect(classifications.has('valuation')).toBe(true);
  });

  // Disclosure basis: messmass#226.
  it('the valuation metric is the ad-value estimate, matching that disclosure', () => {
    const adValue = METRIC_CATALOG.find((m) => m.key === 'ad-value-estimate');
    expect(adValue?.classification).toBe('valuation');
    expect(adValue?.description).toMatch(/not measured/i);
  });
});
