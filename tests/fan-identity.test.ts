// tests/fan-identity.test.ts
// WHAT: The two structural guarantees lib/fanIdentity.ts's design rests on --
//     no identity without consent, no merge without an explicit human action
//     on two genuinely distinct identities.
// WHY: messmass#227. These are the load-bearing checks: get either wrong and
//     the feature either creates unconsented personal-data records or merges
//     a fan's data into the wrong profile. Both checks run before any
//     database call (see lib/fanIdentity.ts), so they're testable without a
//     live Mongo connection -- this only exercises those early-return paths.

import { createFanIdentity, flagMergeCandidate, MissingConsentError } from '@/lib/fanIdentity';

describe('createFanIdentity refuses to create a record without real consent', () => {
  it('rejects a missing consent object', async () => {
    await expect(createFanIdentity(undefined as any)).rejects.toThrow(MissingConsentError);
  });

  it('rejects an empty source', async () => {
    await expect(createFanIdentity({ source: '', consentedAt: '2026-09-17T00:00:00.000Z', scope: ['engagement-tracking'] })).rejects.toThrow(MissingConsentError);
  });

  it('rejects a missing consentedAt', async () => {
    await expect(createFanIdentity({ source: 'ticketing-signup', consentedAt: '', scope: ['engagement-tracking'] })).rejects.toThrow(MissingConsentError);
  });

  it('rejects an empty scope array', async () => {
    await expect(createFanIdentity({ source: 'ticketing-signup', consentedAt: '2026-09-17T00:00:00.000Z', scope: [] })).rejects.toThrow(MissingConsentError);
  });

  it('rejects a non-array scope', async () => {
    await expect(createFanIdentity({ source: 'x', consentedAt: '2026-09-17T00:00:00.000Z', scope: 'engagement-tracking' as any })).rejects.toThrow(MissingConsentError);
  });
});

describe('flagMergeCandidate refuses obviously-invalid merge proposals', () => {
  it('refuses identical ids -- an identity cannot be a merge candidate of itself', async () => {
    const sameId = '507f1f77bcf86cd799439011';
    expect(await flagMergeCandidate(sameId, sameId, 'test', 'admin@example.com')).toBeNull();
  });

  it('refuses an invalid ObjectId', async () => {
    expect(await flagMergeCandidate('not-an-id', '507f1f77bcf86cd799439011', 'test', 'admin@example.com')).toBeNull();
  });
});
