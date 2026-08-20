import { tokens } from '@/lib/variableMerge';

describe('variable-merge token signature (word-order dedup detection)', () => {
  it('collapses word-order duplicates to the same signature', () => {
    expect(tokens('totalBitlyClicks')).toBe(tokens('bitlyTotalClicks'));
    expect(tokens('uniqueBitlyClicks')).toBe(tokens('bitlyUniqueClicks'));
  });

  it('folds casing/underscore variants', () => {
    expect(tokens('baseballCap')).toBe(tokens('baseball_cap'));
    expect(tokens('Caps')).toBe(tokens('caps'));
  });

  it('does NOT collapse genuinely different variables', () => {
    expect(tokens('female')).not.toBe(tokens('male'));
    expect(tokens('remoteFans')).not.toBe(tokens('remoteImages'));
    expect(tokens('visitFacebook')).not.toBe(tokens('visitInstagram'));
  });
});
