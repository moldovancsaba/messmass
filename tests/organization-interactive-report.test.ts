import { ObjectId } from 'mongodb';
import { getReportSlug } from '../components/theme/interactive-report/reportSlug';
import { resolveScopeProjectIds } from '../lib/interactiveReportAggregator';

describe('organization interactive report scope', () => {
  it('prefixes organization scopes with organization-', () => {
    const slug = getReportSlug({
      scope: { type: 'organization', id: 'org123', name: 'EuroLeague Women', viewSlug: 'euroleague-women' },
      partner: { name: 'EuroLeague Women', viewSlug: 'euroleague-women' },
    } as any);
    expect(slug).toBe('organization-euroleague-women');
  });

  it('resolves organization projects via organizationId and org partners', async () => {
    const orgId = new ObjectId();
    const partnerId = new ObjectId();
    const projectA = { _id: new ObjectId(), eventName: 'Schio vs Galatasaray', organizationId: orgId, stats: {} };
    const projectB = { _id: new ObjectId(), eventName: 'Fenerbahce vs Sopron', partner1Id: partnerId, stats: {} };

    const fakeDb = {
      collection: (name: string) => ({
        findOne: async () => (name === 'organizations' ? { _id: orgId, name: 'EuroLeague Women', slug: 'euroleague-women' } : null),
        find: () => ({
          sort: () => ({
            toArray: async () => (name === 'projects' ? [projectA, projectB] : []),
          }),
          toArray: async () => (name === 'partners' ? [{ _id: partnerId }] : []),
        }),
      }),
    };

    const res = await resolveScopeProjectIds('organization', 'euroleague-women', undefined, fakeDb);
    expect(res.scopeType).toBe('organization');
    expect(res.scopeHeader.type).toBe('organization');
    expect(res.scopeHeader.name).toBe('EuroLeague Women');
    expect(res.resolvedEventIds).toHaveLength(2);
    expect(res.organizationId).toBeUndefined();
  });
});
