// tests/format-chart-value.test.ts
// WHAT: Pins how a chart value is rendered, for every surface that renders one.
// WHY: The admin builder and the published report each had their own formatter.
//     They agreed on decimals and disagreed on thousands separators, so an author
//     approved "€1,500,000" and the partner opening the link saw "€1500000".
//     Values under 1,000 matched, which is why it survived review for so long.
//     A shared implementation fixes today's divergence; this test is what stops
//     tomorrow's.

import { formatChartValue, decimalsFor } from '@/lib/formatChartValue';

describe('formatChartValue', () => {
  it('groups thousands — the case the two implementations disagreed on', () => {
    expect(formatChartValue(1234567, { rounded: true })).toBe('1,234,567');
    expect(formatChartValue(1500000, { rounded: true, prefix: '€' })).toBe('€1,500,000');
  });

  it('keeps two decimals when rounded is false', () => {
    expect(formatChartValue(1234567.891, { rounded: false })).toBe('1,234,567.89');
    expect(formatChartValue(87.5, { rounded: false, suffix: '%' })).toBe('87.50%');
  });

  it('rounds to whole numbers when rounded is true', () => {
    expect(formatChartValue(87.6, { rounded: true })).toBe('88');
  });

  it('treats missing formatting as whole numbers', () => {
    expect(formatChartValue(1234.9)).toBe('1,235');
  });

  it('passes NA through, since it is not a number to localise', () => {
    // The formula engine returns 'NA' for anything it cannot evaluate.
    expect(formatChartValue('NA', { rounded: true })).toBe('NA');
    expect(formatChartValue(undefined)).toBe('NA');
    expect(formatChartValue(null)).toBe('NA');
  });

  it('passes plain strings through untouched', () => {
    // Text elements resolve to strings, not numbers.
    expect(formatChartValue('Sold out', { rounded: true })).toBe('Sold out');
  });

  it('returns NA rather than "Infinity" or "NaN" for non-finite values', () => {
    // A division by zero that escapes the engine must not reach a partner's report
    // as the word "Infinity".
    expect(formatChartValue(Infinity, { rounded: true })).toBe('NA');
    expect(formatChartValue(NaN, { rounded: true })).toBe('NA');
  });

  it('applies prefix and suffix in that order around the number', () => {
    expect(formatChartValue(50, { rounded: true, prefix: '~', suffix: ' fans' })).toBe('~50 fans');
  });

  it('formats negative numbers with the sign outside the grouping', () => {
    expect(formatChartValue(-1234567, { rounded: true })).toBe('-1,234,567');
  });

  describe('decimalsFor', () => {
    it('derives decimals from the rounded flag only', () => {
      expect(decimalsFor({ rounded: true })).toBe(0);
      expect(decimalsFor({ rounded: false })).toBe(2);
      expect(decimalsFor(undefined)).toBe(0);
      expect(decimalsFor({})).toBe(0);
    });
  });
});
