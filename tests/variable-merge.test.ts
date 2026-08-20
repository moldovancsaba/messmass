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

import { PROTECTED_CLICKER_VARIABLES } from '@/lib/variableMerge';

describe('protected clicker variables', () => {
  it('includes the core hardcoded-in-editor base variables', () => {
    for (const v of ['male', 'female', 'indoor', 'outdoor', 'remoteFans', 'baseballCap', 'boomer', 'genX']) {
      expect(PROTECTED_CLICKER_VARIABLES.has(v)).toBe(true);
    }
  });
  it('does not protect merge-safe variables (they can be renamed away)', () => {
    for (const v of ['ventFacebook', 'totalBitlyClicks', 'Caps', 'visitTiktok']) {
      expect(PROTECTED_CLICKER_VARIABLES.has(v)).toBe(false);
    }
  });
});
