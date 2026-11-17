import assert from 'node:assert/strict';
import test from 'node:test';
import { ObjectId } from 'mongodb';
import { getReportSlug } from '../components/theme/interactive-report/reportSlug';
import { resolveScopeProjectIds } from '../lib/interactiveReportAggregator';

test('getReportSlug prefixes organization scopes with organization-', () => {
  const slug = getReportSlug({
    scope: { type: 'organization', id: 'org123', name: 'EuroLeague Women', viewSlug: 'euroleague-women' },
    partner: { name: 'EuroLeague Women', viewSlug: 'euroleague-women' },
  } as any);
  assert.equal(slug, 'organization-euroleague-women');
});

test('resolveScopeProjectIds resolves organization projects via organizationId and org partners', async () => {
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
  assert.equal(res.scopeType, 'organization');
  assert.equal(res.scopeHeader.type, 'organization');
  assert.equal(res.scopeHeader.name, 'EuroLeague Women');
  assert.equal(res.resolvedEventIds.length, 2);
  assert.equal(res.organizationId, undefined);
});
