// tests/loyalty-hub.test.ts
// WHAT: canCompleteMission -- the one rule this feature cannot get wrong.
// WHY: messmass#229. A repeatable mission (scan in at every home game) must
//     always be completable again; a non-repeatable one (a season-pass-
//     holder bonus) must never be claimable twice. Getting this backwards in
//     either direction breaks "loyalty actions must be measurable" (the
//     issue's own constraint) -- either points inflate from a bug, or a
//     legitimate repeat action silently stops counting.

import { canCompleteMission } from '@/lib/loyaltyHub';

describe('canCompleteMission', () => {
  it('a repeatable mission can always be completed again', () => {
    expect(canCompleteMission({ repeatable: true }, false)).toBe(true);
    expect(canCompleteMission({ repeatable: true }, true)).toBe(true);
  });

  it('a non-repeatable mission can be completed once', () => {
    expect(canCompleteMission({ repeatable: false }, false)).toBe(true);
  });

  it('a non-repeatable mission cannot be completed twice', () => {
    expect(canCompleteMission({ repeatable: false }, true)).toBe(false);
  });
});
