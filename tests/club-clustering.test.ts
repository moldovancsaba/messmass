import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeClubVariants,
  normalizeClubClusterKey,
  suggestClubClusters,
} from '../lib/brandEntityClustering';

test('normalizeClubClusterKey strips accents and common club suffixes', () => {
  assert.equal(normalizeClubClusterKey('Ferencvárosi TC'), 'ferencvarosi');
  assert.equal(normalizeClubClusterKey('Soproni KC'), 'soproni');
  assert.equal(normalizeClubClusterKey('MTK Budapest FC'), 'mtk budapest');
});

test('mergeClubVariants folds known franchise and DB alias variants', () => {
  const merged = mergeClubVariants(
    [
      { name: 'Sopron KC', count: 10, emvEur: 5.5 },
      { name: 'Soproni KC', count: 6, emvEur: 3.3 },
      { name: 'Custom Team A', count: 4 },
      { name: 'Custom Team Alias', count: 2 },
    ],
    { 'custom team alias': 'Custom Team A' },
  );

  assert.equal(merged.length, 2);
  assert.equal(merged[0].name, 'Sopron KC');
  assert.equal(merged[0].count, 16);
  assert.equal(merged[0].emvEur, 8.8);
  assert.equal(merged[1].name, 'Custom Team A');
  assert.equal(merged[1].count, 6);
});

test('suggestClubClusters groups multi-variant clubs for one-click merge', () => {
  const suggestions = suggestClubClusters([
    { name: 'Sopron KC', count: 10 },
    { name: 'Soproni KC', count: 6 },
    { name: 'Unique Solo Club', count: 5 },
  ]);

  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].suggestedTarget, 'Sopron KC');
  assert.equal(suggestions[0].totalCount, 16);
  assert.equal(suggestions[0].variants.length, 2);
});
