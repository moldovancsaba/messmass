import { ObjectId } from 'mongodb';
import { classifyInvalidCustomPeriodRecord } from '@/lib/reportVariantPeriodAudit';

describe('report variant period audit', () => {
  it('returns null for valid custom period records', () => {
    const row = classifyInvalidCustomPeriodRecord({
      _id: new ObjectId('665000000000000000000001'),
      ownerType: 'organization',
      ownerId: 'org-1',
      name: 'Valid',
      periodPreset: 'custom',
      customDateRange: { startDate: '2026-01-01', endDate: '2026-06-24' },
    });

    expect(row).toBeNull();
  });

  it('classifies invalid custom records without dumping full documents', () => {
    const row = classifyInvalidCustomPeriodRecord({
      _id: new ObjectId('665000000000000000000002'),
      ownerType: 'partner',
      ownerId: 'partner-1',
      name: 'Broken Custom',
      periodPreset: 'custom',
      customDateRange: { startDate: '', endDate: '2026-06-24' },
    });

    expect(row).toMatchObject({
      variantId: '665000000000000000000002',
      ownerType: 'partner',
      ownerId: 'partner-1',
      name: 'Broken Custom',
      reason: 'CUSTOM_PERIOD_DATES_REQUIRED',
      proposedRepair: {
        periodPreset: 'all_time',
        customDateRange: null,
      },
    });
  });

  it('ignores non-custom records', () => {
    expect(
      classifyInvalidCustomPeriodRecord({
        _id: 'variant-1',
        periodPreset: 'all_time',
        customDateRange: null,
      })
    ).toBeNull();
  });
});
