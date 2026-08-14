// tests/ai-analysis-summary.test.ts
// WHAT: Validation rules of the AI analysis summary store.
// WHY: This is a machine-to-machine boundary; the guards are the contract. A wrong
//     major version stored silently, or an unbounded document accepted, would hand
//     the report undefined behaviour with no error anywhere.

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }),
}));

import { MAX_SUMMARY_BYTES, SUMMARY_CONTRACT_PREFIX, storeAnalysisSummary } from '@/lib/aiAnalysisSummary';

// Valid ObjectId string for the id-format checks; the DB lookup is mocked away,
// so cases that would pass validation and hit the store are exercised at the
// integration level instead.
const EVENT_ID = '6a7204bb1c4b8a4dc0e7fb0f';

async function expectRejection(eventId: string, body: Record<string, unknown>, code: string) {
  await expect(storeAnalysisSummary(eventId, body)).rejects.toMatchObject({ code });
}

describe('storeAnalysisSummary validation', () => {
  it('rejects a malformed event id before touching anything', async () => {
    await expectRejection('not-an-object-id', { contractVersion: SUMMARY_CONTRACT_PREFIX }, 'INVALID_EVENT_ID');
  });

  it('rejects a body with no contract version', async () => {
    await expectRejection(EVENT_ID, { brandMentions: [] }, 'INVALID_SUMMARY');
  });

  it('rejects a different contract major version rather than storing it', async () => {
    await expectRejection(
      EVENT_ID,
      { contractVersion: 'fanmass.messmass.analytics-summary.v2', brandMentions: [] },
      'CONTRACT_MISMATCH'
    );
  });

  it('rejects an envelope with no analysis fields', async () => {
    await expectRejection(
      EVENT_ID,
      { contractVersion: SUMMARY_CONTRACT_PREFIX, messmassEventId: EVENT_ID, batchId: 'b', generatedAt: 'x' },
      'INVALID_SUMMARY'
    );
  });

  it('rejects a document over the size guard', async () => {
    const huge = { contractVersion: SUMMARY_CONTRACT_PREFIX, blob: 'x'.repeat(MAX_SUMMARY_BYTES) };
    await expectRejection(EVENT_ID, huge, 'SUMMARY_TOO_LARGE');
  });
});
