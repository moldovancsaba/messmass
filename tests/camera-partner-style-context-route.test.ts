import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

const partnerId = new ObjectId();
const styleId = new ObjectId();
const paletteColor = (value: string) => `${String.fromCharCode(35)}${value}`;
const partner = { _id: partnerId, name: 'MTK Budapest', styleId };
const style = { _id: styleId, name: 'MTK Budapest', heroBackground: paletteColor('00b5e4'), headingColor: paletteColor('004c87') };

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual('@/lib/config');
  return { __esModule: true, default: { ...actual.default, cameraProvisionToken: 'test-secret' } };
});
jest.mock('@/lib/db', () => ({
  __esModule: true,
  getDb: async () => ({
    collection: (name: string) => ({
      findOne: async (filter: Record<string, unknown>) => {
        const rows = name === 'partners' ? [partner] : name === 'report_styles' ? [style] : [];
        return rows.find((row) => String(row._id) === String(filter._id)) ?? null;
      },
      find: () => ({ toArray: async () => [] }),
    }),
  }),
  default: async () => ({}),
}));

import { GET } from '@/app/api/integrations/camera/partners/[messmassPartnerId]/style-context/route';

const call = (id: string, headers: Record<string, string> = {}) =>
  GET(new NextRequest(`http://localhost/api/integrations/camera/partners/${id}/style-context`, { headers }), {
    params: Promise.resolve({ messmassPartnerId: id }),
  });

test('partner style context requires the shared Camera secret', async () => {
  expect((await call(String(partnerId))).status).toBe(401);
});

test('partner style context validates ids and returns the current partner style', async () => {
  expect((await call('invalid', { 'x-camera-secret': 'test-secret' })).status).toBe(400);
  expect((await call(String(new ObjectId()), { 'x-camera-secret': 'test-secret' })).status).toBe(404);

  const response = await call(String(partnerId), { authorization: 'Bearer test-secret' });
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(body.success).toBe(true);
  expect(body.partner).toMatchObject({ id: String(partnerId), name: 'MTK Budapest' });
  expect(body.style).toMatchObject({ name: 'MTK Budapest', resolvedFrom: 'partner', heroBackground: paletteColor('00b5e4') });
});
