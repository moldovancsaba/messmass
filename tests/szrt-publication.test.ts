// tests/szrt-publication.test.ts
// WHAT: The switch that shows or hides the SZRT report's audience, brand and club sections.
// WHY: The owner decides when the report is published. The switch must say who decided, must refuse to go on before
//     the deep rerun's figures were delivered (so the retired worker's numbers can never become visible by
//     accident), and must drop the cached report so the change shows at once.

const getDbMock = jest.fn();
jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }) }));
jest.mock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'test', fanmassIntegrationToken: 'secret-token' } }));
jest.mock('@/lib/fanmassIntegration', () => ({
  ...jest.requireActual('@/lib/fanmassIntegration'),
  getDb: () => getDbMock(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/integrations/fanmass/szrt-publish/route';
import { SZRT_REPORT_SCOPES, setSzrtPublication } from '@/lib/szrtPublication';

function fakeDb(doc: Record<string, unknown> | null) {
  const updateOne = jest.fn().mockResolvedValue({});
  const findOne = jest.fn().mockResolvedValue(doc);
  return { db: { collection: () => ({ findOne, updateOne }) }, updateOne };
}
const delivered = { _id: 'szrt_progress', pipeline: 'fanmass_full_text_evidence_v1', receivedAt: '2026-11-12T12:00:00Z', processedCount: 321 };
const now = () => '2026-11-12T12:30:00Z';

describe('setSzrtPublication', () => {
  it('publishes delivered figures, records who decided and drops every cached SZRT report', async () => {
    const { db, updateOne } = fakeDb(delivered);
    const invalidate = jest.fn().mockResolvedValue(undefined);
    const result = await setSzrtPublication(db, { approved: true, approvedBy: 'owner', note: 'go live' }, { invalidate, now });
    expect(updateOne).toHaveBeenCalledWith({ _id: 'szrt_progress' }, { $set: { publishApproved: true, publishApprovedAt: now(), publishApprovedBy: 'owner', publishApprovalNote: 'go live' } });
    expect(invalidate).toHaveBeenCalledTimes(SZRT_REPORT_SCOPES.length);
    expect(invalidate).toHaveBeenCalledWith({ scopeType: 'hashtag', scopeIdentifier: 'tippmixreport2026' });
    expect(result).toMatchObject({ publishApproved: true, publishApprovedBy: 'owner', processedCount: 321, invalidatedScopes: SZRT_REPORT_SCOPES.length });
  });

  it('refuses to publish before the deep rerun delivered anything, and stores nothing', async () => {
    for (const doc of [null, { _id: 'szrt_progress', aggregates: { topBrands: [{ brand: 'Nike' }] }, publishApproved: false }]) {
      const { db, updateOne } = fakeDb(doc);
      await expect(setSzrtPublication(db, { approved: true, approvedBy: 'owner' }, { invalidate: jest.fn() })).rejects.toMatchObject({ status: 409, code: 'NO_FIGURES_DELIVERED' });
      expect(updateOne).not.toHaveBeenCalled();
    }
  });

  it('can always withdraw the report, even with nothing delivered', async () => {
    const { db, updateOne } = fakeDb(null);
    await setSzrtPublication(db, { approved: false, approvedBy: 'owner' }, { invalidate: jest.fn().mockResolvedValue(undefined), now });
    expect(updateOne.mock.calls[0][1].$set).toMatchObject({ publishApproved: false });
  });

  it('needs a boolean and a name, and a cache that cannot be dropped does not undo the switch', async () => {
    const { db, updateOne } = fakeDb(delivered);
    await expect(setSzrtPublication(db, { approved: 'yes', approvedBy: 'owner' })).rejects.toMatchObject({ status: 400 });
    await expect(setSzrtPublication(db, { approved: true, approvedBy: '  ' })).rejects.toMatchObject({ status: 400 });
    await expect(setSzrtPublication(db, null)).rejects.toMatchObject({ status: 400 });
    expect(updateOne).not.toHaveBeenCalled();
    const result = await setSzrtPublication(db, { approved: true, approvedBy: 'owner' }, { invalidate: jest.fn().mockRejectedValue(new Error('cache down')), now });
    expect(result).toMatchObject({ publishApproved: true, invalidatedScopes: 0 });
    expect(updateOne).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/integrations/fanmass/szrt-publish', () => {
  const post = (payload: unknown, headers: Record<string, string> = { authorization: 'Bearer secret-token' }) =>
    POST(new NextRequest('http://localhost/api/integrations/fanmass/szrt-publish', { method: 'POST', body: JSON.stringify(payload), headers }));

  it('refuses a caller without the integration token', async () => {
    expect((await post({ approved: true, approvedBy: 'owner' }, {})).status).toBe(401);
  });

  it('answers 409 when nothing was delivered yet', async () => {
    getDbMock.mockResolvedValue(fakeDb(null).db);
    const response = await post({ approved: true, approvedBy: 'owner' });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe('NO_FIGURES_DELIVERED');
  });
});
