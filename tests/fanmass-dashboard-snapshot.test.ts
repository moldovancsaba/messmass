// tests/fanmass-dashboard-snapshot.test.ts
// WHAT: Validation rules of the dashboard-snapshot store.
// WHY: This is a machine-to-machine boundary; the guards are the contract. A
//     wrong contract version stored silently, or a snapshot with no
//     recognized section, would hand the new admin tabs undefined behaviour.

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection: () => ({}) }) }),
}));

import { DASHBOARD_SNAPSHOT_CONTRACT, storeDashboardSnapshot } from '@/lib/fanmassDashboardSnapshot';

async function expectRejection(body: Record<string, unknown>, code: string) {
  await expect(storeDashboardSnapshot(body)).rejects.toMatchObject({ code });
}

describe('storeDashboardSnapshot validation', () => {
  it('rejects a body with no contract version', async () => {
    await expectRejection({ messmassEventId: 'e1', batchId: 'b1', executive: {} }, 'INVALID_SNAPSHOT');
  });

  it('rejects a mismatched contract version rather than storing it', async () => {
    await expectRejection(
      { contractVersion: 'fanmass.messmass.dashboard-snapshot.v2', messmassEventId: 'e1', batchId: 'b1', executive: {} },
      'CONTRACT_MISMATCH'
    );
  });

  it('rejects a missing messmassEventId', async () => {
    await expectRejection(
      { contractVersion: DASHBOARD_SNAPSHOT_CONTRACT, batchId: 'b1', executive: {} },
      'INVALID_SNAPSHOT'
    );
  });

  it('rejects a missing batchId', async () => {
    await expectRejection(
      { contractVersion: DASHBOARD_SNAPSHOT_CONTRACT, messmassEventId: 'e1', executive: {} },
      'INVALID_SNAPSHOT'
    );
  });

  it('rejects a snapshot with no recognized section', async () => {
    await expectRejection(
      { contractVersion: DASHBOARD_SNAPSHOT_CONTRACT, messmassEventId: 'e1', batchId: 'b1', unknownField: 1 },
      'INVALID_SNAPSHOT'
    );
  });
});
