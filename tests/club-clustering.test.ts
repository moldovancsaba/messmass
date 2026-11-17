import {
  mergeClubVariants,
  normalizeClubClusterKey,
  suggestClubClusters,
} from '../lib/brandEntityClustering';

describe('club clustering and deduplication', () => {
  it('strips accents and common club suffixes', () => {
    expect(normalizeClubClusterKey('Ferencvárosi TC')).toBe('ferencvarosi');
    expect(normalizeClubClusterKey('Soproni KC')).toBe('soproni');
    expect(normalizeClubClusterKey('MTK Budapest FC')).toBe('mtk budapest');
  });

  it('folds known franchise and DB alias variants', () => {
    const merged = mergeClubVariants(
      [
        { name: 'Sopron KC', count: 10, emvEur: 5.5 },
        { name: 'Soproni KC', count: 6, emvEur: 3.3 },
        { name: 'Custom Team A', count: 4 },
        { name: 'Custom Team Alias', count: 2 },
      ],
      { 'custom team alias': 'Custom Team A' },
    );

    expect(merged).toHaveLength(2);
    expect(merged[0].name).toBe('Sopron KC');
    expect(merged[0].count).toBe(16);
    expect(merged[0].emvEur).toBe(8.8);
    expect(merged[1].name).toBe('Custom Team A');
    expect(merged[1].count).toBe(6);
  });

  it('groups multi-variant clubs for one-click merge', () => {
    const suggestions = suggestClubClusters([
      { name: 'Sopron KC', count: 10 },
      { name: 'Soproni KC', count: 6 },
      { name: 'Unique Solo Club', count: 5 },
    ]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggestedTarget).toBe('Sopron KC');
    expect(suggestions[0].totalCount).toBe(16);
    expect(suggestions[0].variants).toHaveLength(2);
  });
});
