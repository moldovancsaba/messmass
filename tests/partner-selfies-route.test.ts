// tests/partner-selfies-route.test.ts
// WHAT: GET /api/interactive-report/partner-selfies serves no analysed selfie.
// WHY: The route used to read `szrt_vision_analysis`, the retired vision worker's per-image documents (brand and club
//     lists the model recalled from its own prompt, free-text scene descriptions), to anyone, with no publication
//     check. The owner asked repeatedly for that data to be gone from the report; the test pins that no per-image
//     data can come back through this route.

const collections: string[] = [];
const partnerFind = jest.fn();
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: (name: string) => {
        collections.push(name);
        return {
          findOne: partnerFind,
          find: () => { throw new Error('the route must not list documents'); },
          countDocuments: () => { throw new Error('the route must not count documents'); },
        };
      },
    }),
  }),
}));
jest.mock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'test' } }));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/interactive-report/partner-selfies/route';

const get = (query: string) => GET(new NextRequest(`http://localhost/api/interactive-report/partner-selfies?${query}`));

beforeEach(() => {
  collections.length = 0;
  partnerFind.mockReset().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', name: 'DVTK', viewSlug: 'dvtk', sportsDb: { strStadium: 'Diósgyőri Stadion', intStadiumCapacity: 12000 } });
});

describe('GET /api/interactive-report/partner-selfies', () => {
  it('returns the partner record and no analysed selfie, whatever the filters ask for', async () => {
    const body = await (await get('club=DVTK&fanGroup=ultras&limit=100')).json();
    expect(body).toMatchObject({
      success: true, club: 'DVTK', partner: { name: 'DVTK', venue: 'Diósgyőri Stadion', venueCapacity: 12000 },
      totalSelfies: 0, totalPeople: 0, topEmotions: [], topBrands: [], fanGroups: [], selfies: [],
    });
    expect(body.demographics).toMatchObject({ malePct: null, femalePct: null, maleCount: 0, femaleCount: 0 });
  });

  it('never touches the retired per-image collections', async () => {
    await get('club=DVTK');
    expect(collections).toEqual(['partners']);
    expect(collections).not.toContain('szrt_vision_analysis');
  });

  it('keeps its parameter and tenant checks', async () => {
    expect((await get('')).status).toBe(400);
    expect((await get('club=DVTK&organizationId=org_other')).status).toBe(403);
  });
});
