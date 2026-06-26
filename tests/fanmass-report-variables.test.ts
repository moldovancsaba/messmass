import { evaluateFormula, extractVariablesFromFormula } from '@/lib/formulaEngine';
import { mapFanmassStatsToFlatStats } from '@/lib/fanmassIntegration';

const baseStats = {
  remoteImages: 0,
  hostessImages: 0,
  selfies: 0,
  indoor: 0,
  outdoor: 0,
  stadium: 0,
  female: 0,
  male: 0,
  genAlpha: 0,
  genYZ: 0,
  genX: 0,
  boomer: 0,
  merched: 0,
  jersey: 0,
  scarf: 0,
  flags: 0,
  baseballCap: 0,
  other: 0,
};

describe('Fanmass report variables', () => {
  it('extracts dotted Fanmass tokens from report formulas', () => {
    expect(extractVariablesFromFormula('[fanmass.peopleCount] + [fanmass.projectedReach]')).toEqual([
      'fanmass.peopleCount',
      'fanmass.projectedReach',
    ]);
  });

  it('evaluates nested Fanmass numeric variables', () => {
    const result = evaluateFormula('[fanmass.peopleCount] + [fanmass.projectedReach]', {
      ...baseStats,
      fanmass: {
        peopleCount: 42,
        projectedReach: 1200,
      },
    });

    expect(result).toBe(1242);
  });

  it('evaluates single nested Fanmass array variables as counts', () => {
    const result = evaluateFormula('[fanmass.brands]', {
      ...baseStats,
      fanmass: {
        brands: [{ brand: 'Acme' }, { brand: 'Beta' }],
      },
    });

    expect(result).toBe(2);
  });

  it('maps Fanmass sync payloads to flat report variables', () => {
    const flatStats = mapFanmassStatsToFlatStats({
      batchId: 'batch-123',
      status: 'ready',
      imageCount: 9,
      analyzedImageCount: 8,
      peopleCount: 42,
      projectedReach: 1200,
      confidence: 0.91,
      brands: [{ brand: 'Acme', count: 7 }],
      clubs: [{ clubName: 'CHL', mentions: 3 }],
      merchandise: {},
      gender: {},
      age: {},
      warnings: [],
      sourceRunIds: ['run-1'],
      lastSyncedAt: '2026-06-26T00:00:00.000Z',
      contractVersion: 'fanmass.messmass.analytics-summary.v1',
    });

    expect(flatStats).toMatchObject({
      fanmassBatchId: 'batch-123',
      fanmassPeopleCount: 42,
      fanmassProjectedReach: 1200,
      fanmassTopBrandName: 'Acme',
      fanmassTopBrandCount: 7,
      fanmassTopClubName: 'CHL',
      fanmassTopClubCount: 3,
      fanmassSourceRunCount: 1,
    });
  });
});
