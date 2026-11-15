import { resolveReportVariant } from '@/lib/reportVariants';
import { ObjectId } from 'mongodb';

describe('Organization Report Slug and ObjectId Resolution', () => {
  it('resolves organization variant by ObjectId and slug equally', async () => {
    const orgId = new ObjectId();
    const fakeOrg = {
      _id: orgId,
      name: 'EuroLeague Women',
      slug: 'euroleague-women',
      metadata: {
        reportTemplateId: new ObjectId().toString(),
        emoji: '🏀',
      },
    };

    const mockDb = {
      collection: (name: string) => {
        if (name === 'organizations') {
          return {
            findOne: jest.fn(async (query: any) => {
              if (query._id && query._id.toString() === orgId.toString()) return fakeOrg;
              if (query.slug === 'euroleague-women') return fakeOrg;
              return null;
            }),
          };
        }
        if (name === 'report_variants') {
          return {
            find: () => ({
              sort: () => ({
                toArray: async () => [],
              }),
            }),
          };
        }
        if (name === 'report_templates' || name === 'reports') {
          return {
            findOne: jest.fn(async () => ({
              _id: new ObjectId(),
              name: 'Mock Template',
              type: 'partner',
              layout: { blocks: [] },
            })),
          };
        }
        return {
          findOne: jest.fn(async () => null),
          find: () => ({ sort: () => ({ toArray: async () => [] }) }),
        };
      },
    };

    const byId = await resolveReportVariant(mockDb as any, 'organization', orgId.toString());
    expect(byId.variant.isDefault).toBe(true);
    expect(byId.runtimeReport.report).toBeDefined();

    const bySlug = await resolveReportVariant(mockDb as any, 'organization', 'euroleague-women');
    expect(bySlug.variant.isDefault).toBe(true);
    expect(bySlug.runtimeReport.report).toBeDefined();
  });
});
