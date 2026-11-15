const mockPartners = [
  {
    _id: '694a96990ad78323bea10660',
    name: 'Szerencsejáték Zrt.',
    viewSlug: 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd',
    organizationId: 'org_szrt',
    emoji: '🎯',
  },
  {
    _id: 'partner-debrecen',
    name: 'Debreceni VSC',
    viewSlug: 'debreceni-vsc',
    slug: 'dvsc',
    organizationId: 'org_dvsc',
    emoji: '🔴',
  },
];

const mockProjects = [
  {
    _id: 'proj-1',
    eventName: 'NOVEMBER Statisztika',
    eventDate: '2025.11.30',
    hashtags: ['tippmixreport2026'],
    organizationId: 'org_szrt',
  },
  {
    _id: 'proj-2',
    eventName: '⚽ DVSC vs Ferencváros',
    eventDate: '2026.01.15',
    partner1Id: 'partner-debrecen',
    hashtags: ['tippmixreport2026', 'dvsc'],
    organizationId: 'org_dvsc',
  },
  {
    _id: 'proj-3',
    slug: 'derbi-2026',
    eventName: 'Budapest Derbi 2026',
    eventDate: '2026.02.10',
    organizationId: 'org_fradi',
  },
];

const mockCollection = (name: string) => ({
  findOne: jest.fn(async (q: any) => {
    if (name === 'partners') {
      if (q.organizationId && q.organizationId !== 'org_szrt' && q.organizationId !== 'org_dvsc') {
        return null;
      }
      if (q.$or) {
        for (const cond of q.$or) {
          if (cond.viewSlug === 'ec9bb989-cb0f-4d5a-b22b-c3a1829cd3fd' || cond.viewSlug === 'szrt') {
            return mockPartners[0];
          }
          if (cond.viewSlug === 'debreceni-vsc' || cond.slug === 'dvsc' || (cond.name && cond.name.test && cond.name.test('Debreceni VSC'))) {
            return mockPartners[1];
          }
        }
      }
      return null;
    }
    if (name === 'projects') {
      if (q.slug === 'derbi-2026') {
        if (q.organizationId && q.organizationId !== 'org_fradi') return null;
        return mockProjects[2];
      }
      return null;
    }
    return null;
  }),
  find: jest.fn((q: any) => ({
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn(async () => {
      if (name === 'partners') {
        if (q.name && q.name.test && q.name.test('tippmix')) {
          return [mockPartners[0]];
        }
        return mockPartners;
      }
      if (name === 'projects') {
        let results = [...mockProjects];
        if (q.organizationId) {
          results = results.filter((p) => p.organizationId === q.organizationId);
        }
        if (q.hashtags) {
          results = results.filter((p) => p.hashtags && p.hashtags.includes(q.hashtags));
        }
        return results;
      }
      return [];
    }),
  })),
});

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => mockCollection(name),
    }),
  }),
}));

import { resolveScopeProjectIds } from '@/lib/interactiveReportAggregator';

describe('Universal Scope Resolver (RFC-003 / Issue #11)', () => {
  it('resolves hashtag scope for tippmixreport2026', async () => {
    const res = await resolveScopeProjectIds('hashtag', 'tippmixreport2026');

    expect(res).toBeDefined();
    expect(res.scopeType).toBe('hashtag');
    expect(res.identifier).toBe('tippmixreport2026');
    expect(res.resolvedEventIds.length).toBeGreaterThan(0);
    expect(res.scopeMetadata.title).toContain('Szerencsejáték');
  });

  it('enforces compound organizationId tenant boundary isolation (INV-001)', async () => {
    // When an unauthorized organization requests tippmixreport2026
    const res = await resolveScopeProjectIds('hashtag', 'tippmixreport2026', 'unauthorized_tenant_xyz');

    expect(res).toBeDefined();
    expect(res.resolvedEventIds).toEqual([]);
    expect(res.campaignProjects).toEqual([]);
    expect(res.scopeMetadata.totalEvents).toBe(0);
  });

  it('resolves partner scope with canonical club consolidation', async () => {
    const res = await resolveScopeProjectIds('partner', 'debreceni-vsc', 'org_dvsc');

    expect(res).toBeDefined();
    expect(res.scopeType).toBe('partner');
    expect(res.partner).not.toBeNull();
    expect(res.partner.name).toBe('Debreceni VSC');
    expect(res.scopeHeader.name).toBe('Debreceni VSC');
  });

  it('resolves event scope with strict organizationId isolation', async () => {
    // Authorized tenant
    const resAuth = await resolveScopeProjectIds('event', 'derbi-2026', 'org_fradi');
    expect(resAuth.resolvedEventIds.length).toBe(1);
    expect(resAuth.scopeHeader.name).toBe('Budapest Derbi 2026');

    // Unauthorized tenant
    const resUnauthorized = await resolveScopeProjectIds('event', 'derbi-2026', 'wrong_org');
    expect(resUnauthorized.resolvedEventIds.length).toBe(0);
  });
});
