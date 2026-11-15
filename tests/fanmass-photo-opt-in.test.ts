// tests/fanmass-photo-opt-in.test.ts
// WHAT: A Fanmass photo result is stored only with a recorded opt-in (no consent text, no identity).
// WHY: Photos are analysed and shown only with an opt-in, so every stored result must say so; a result without one is
//     refused instead of being stored as "opt-in unknown".

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }) }));
jest.mock('@/lib/fanmassIntegration', () => ({ __esModule: true, getDb: jest.fn(), nowIso: () => '2026-11-13T00:00:00.000Z' }));
jest.mock('@/lib/fanmassMapping', () => ({ __esModule: true, pushEventStats: jest.fn() }));
jest.mock('@/lib/fanmassAnalyticsVariables', () => ({ __esModule: true, ensureFanmassAnalyticsVariables: jest.fn() }));

import { parsePhotoOptIn } from '@/lib/fanmassPhotoAnalyses';

const valid = { received: true, basis: 'camera_consent_audit', recordedAt: '2026-11-01T10:00:00.000Z', kinds: ['terms', 'privacy', 'terms'] };

describe('parsePhotoOptIn', () => {
  it('keeps a valid record, de-duplicated and sorted, and nothing else', () => {
    expect(parsePhotoOptIn({ ...valid, checkboxText: 'I agree to everything' })).toEqual({
      received: true,
      basis: 'camera_consent_audit',
      recordedAt: '2026-11-01T10:00:00.000Z',
      kinds: ['privacy', 'terms'],
    });
  });

  it('accepts a record without kinds', () => {
    const { kinds, ...withoutKinds } = valid;
    expect(parsePhotoOptIn(withoutKinds).kinds).toEqual([]);
  });

  it.each([
    ['nothing', undefined, 'MISSING_OPT_IN'],
    ['received false', { ...valid, received: false }, 'MISSING_OPT_IN'],
    ['another basis', { ...valid, basis: 'local_drive_policy' }, 'INVALID_OPT_IN'],
    ['no time', { ...valid, recordedAt: '' }, 'INVALID_OPT_IN'],
    ['a time that is no date', { ...valid, recordedAt: 'yesterday' }, 'INVALID_OPT_IN'],
    ['kinds that are not names', { ...valid, kinds: ['I agree to the terms'] }, 'INVALID_OPT_IN'],
  ])('refuses %s with a 400', (_label, input, code) => {
    expect(() => parsePhotoOptIn(input)).toThrow(expect.objectContaining({ status: 400, code }));
  });
});
