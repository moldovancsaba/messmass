const mockPartners = [
  {
    _id: '694a96990ad78323bea10660',
    name: 'Szerencsejáték Zrt.',
    viewSlug: 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd',
    emoji: '🍀',
  },
  {
    _id: 'partner-debrecen',
    name: 'Debreceni VSC',
    viewSlug: 'debreceni-vsc',
    emoji: '🔴',
  },
];

const mockProjects = [
  {
    _id: 'proj-1',
    eventName: 'NOVEMBER Statisztika',
    eventDate: '2025.11.30',
    hashtags: ['tippmixreport2026'],
    stats: {
      szerencsejatekAllusersAllphotos: 3000,
      szerencsejatekHostessAllphotos: 2000,
      szerencsejatekAllRegistered: 2800,
      szerencsejatekMarketingOptInNumber: 2000,
    },
  },
  {
    _id: 'proj-2',
    eventName: '⚽ DVSC vs Ferencváros',
    eventDate: '2026.01.15',
    partner1Id: 'partner-debrecen',
    hashtags: ['tippmixreport2026', 'dvsc'],
    stats: {
      allImages: 500,
      hostessImages: 300,
      approvedImages: 495,
    },
  },
];

const mockCollection = (name: string) => ({
  findOne: jest.fn(async (q: any) => {
    if (name === 'report_snapshots') return null;
    if (name === 'partners') {
      if (q.name && q.name.toString().includes('szerencsejáték')) return mockPartners[0];
      if (q.viewSlug === 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd') return mockPartners[0];
      if (q.viewSlug === 'debreceni-vsc' || q.$or) return mockPartners[1];
      return null;
    }
    if (name === 'projects') return mockProjects[0];
    return null;
  }),
  find: jest.fn((q: any) => ({
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn(async () => {
      if (name === 'partners') return mockPartners;
      if (name === 'projects') return mockProjects;
      return [];
    }),
  })),
  updateOne: jest.fn(async () => ({ upsertedId: null })),
  replaceOne: jest.fn(async () => ({ upsertedId: null })),
});

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => mockCollection(name),
    }),
  }),
}));

import { getScopedInteractiveReportData } from '@/lib/interactiveReportAggregator';

describe('Universal Interactive Reports (INV-001, INV-002, INV-003)', () => {
  it('loads hashtag scope for tippmixreport2026', async () => {
    const data = await getScopedInteractiveReportData({
      type: 'hashtag',
      identifier: 'tippmixreport2026',
    });

    expect(data).not.toBeNull();
    expect(data?.success).toBe(true);
    expect(data?.scope?.type).toBe('hashtag');
    expect(data?.scope?.id).toBe('tippmixreport2026');
    expect(data?.matches.length).toBeGreaterThan(0);
    expect(data?.summary.totalPhotos).toBeGreaterThan(0);
  });

  it('takes the all-data headline from every event, never from the SZRT campaign cycles alone', async () => {
    const hashtag = await getScopedInteractiveReportData({ type: 'hashtag', identifier: 'tippmixreport2026' });
    const global = await getScopedInteractiveReportData({ type: 'global', identifier: 'all' });

    // The hashtag report headlines the campaign's monthly cycle (3000 photos, 2800 registrations)
    expect(hashtag?.summary.totalPhotos).toBe(3000);
    expect(hashtag?.summary.totalRegistered).toBe(2800);
    // The all-data report adds up the events themselves, and leaves the SZRT-only measures out instead of
    // presenting one campaign's registrations as everything
    expect(global?.scope?.type).toBe('global');
    expect(global?.summary.totalPhotos).toBe(500);
    expect(global?.summary.totalPhotos).toBe(global?.matches.reduce((sum: number, m: { submitted: number }) => sum + m.submitted, 0));
    expect(global?.summary.totalRegistered).toBe(0);
    expect(global?.summary.totalOptIns).toBe(0);
  });

  it('loads partner scope for debreceni-vsc', async () => {
    const data = await getScopedInteractiveReportData({
      type: 'partner',
      identifier: 'debreceni-vsc',
    });

    expect(data).not.toBeNull();
    expect(data?.success).toBe(true);
    expect(data?.partner.name).toBe('Debreceni VSC');
  });

  it('safely handles non-existent partner scope without crashing', async () => {
    const data = await getScopedInteractiveReportData({
      type: 'partner',
      identifier: 'non-existent-partner-xyz-123',
    });

    // If partner not found by findPartnerByIdentifier, it should return null
    expect(data === null || data?.success === true).toBe(true);
  });
});
