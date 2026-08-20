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
  it('is empty — the editor derivations are data-driven, so every variable is renamable', () => {
    // The 4 derived totals moved to derived_variable_config (rewritten by the
    // merge), so no variable name is hardcoded in the editor anymore.
    expect(PROTECTED_CLICKER_VARIABLES.size).toBe(0);
    for (const v of ['male', 'female', 'indoor', 'ventFacebook', 'Caps']) {
      expect(PROTECTED_CLICKER_VARIABLES.has(v)).toBe(false);
    }
  });
});

import { evaluateFormula } from '@/lib/formulaEngine';

describe('data-driven derived totals', () => {
  // Guards the contract in EditorDashboard: derived totals are now computed via
  // evaluateFormula from derived_variable_config, and MUST match the old hardcoded
  // arithmetic exactly, or every editor total would silently change.
  const stats = { female: 3, male: 7, genAlpha: 1, genYZ: 2, genX: 4, boomer: 5, indoor: 6, outdoor: 8 } as never;
  it('sums two variables like the old female+male total', () => {
    expect(evaluateFormula('[female]+[male]', stats)).toBe(10);
  });
  it('sums the four age buckets like the old totalAge', () => {
    expect(evaluateFormula('[genAlpha]+[genYZ]+[genX]+[boomer]', stats)).toBe(12);
  });
  it('computes the remoteFans fallback like indoor+outdoor', () => {
    expect(evaluateFormula('[indoor]+[outdoor]', stats)).toBe(14);
  });
});
