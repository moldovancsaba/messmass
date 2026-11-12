// tests/szrt-evidence-routes.test.ts
// WHAT: The two SZRT proof-sample routes: Fanmass writes them, the report reads them.
// WHY: The write route is machine-to-machine and must refuse an unauthenticated caller and a missing media
//     store; the read route must stay inside the SZRT tenant and show nothing before a person approved the
//     vision analysis for publication.

const findOne = jest.fn();
const collection = jest.fn((name: string) => (name === 'szrt_vision_progress' ? { findOne } : {}));
const listBrandEvidence = jest.fn();

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({ db: () => ({ collection }) }),
}));
jest.mock('@/lib/config', () => ({
  __esModule: true,
  default: { dbName: 'test', fanmassIntegrationToken: 'secret-token' },
}));
jest.mock('@/lib/mediaStorage', () => ({ isMediaStorageConfigured: jest.fn(() => true), storeMedia: jest.fn() }));
jest.mock('@/lib/szrtBrandEvidence', () => ({
  ...jest.requireActual('@/lib/szrtBrandEvidence'),
  listBrandEvidence: (...args: unknown[]) => listBrandEvidence(...args),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/interactive-report/brand-evidence/route';
import { POST } from '@/app/api/integrations/fanmass/szrt-evidence/route';
import { isMediaStorageConfigured } from '@/lib/mediaStorage';

const get = (query: string) => GET(new NextRequest(`http://localhost/api/interactive-report/brand-evidence?${query}`));
const post = (body: unknown, headers: Record<string, string> = { authorization: 'Bearer secret-token' }) =>
  POST(new NextRequest('http://localhost/api/integrations/fanmass/szrt-evidence', { method: 'POST', body: JSON.stringify(body), headers }));

beforeEach(() => {
  jest.clearAllMocks();
  (isMediaStorageConfigured as jest.Mock).mockReturnValue(true);
});

describe('GET /api/interactive-report/brand-evidence', () => {
  it('needs a kind and a name', async () => {
    expect((await get('name=Veolia')).status).toBe(400);
    expect((await get('kind=thing&name=Veolia')).status).toBe(400);
    expect((await get('kind=brand')).status).toBe(400);
  });

  it('stays inside the SZRT tenant', async () => {
    expect((await get('kind=brand&name=Veolia&organizationId=org_other')).status).toBe(403);
    expect(listBrandEvidence).not.toHaveBeenCalled();
  });

  it('shows nothing until the vision analysis is approved for publication', async () => {
    findOne.mockResolvedValue({ _id: 'szrt_progress', publishApproved: false });
    const response = await get('kind=brand&name=Veolia');
    expect(await response.json()).toMatchObject({ success: true, published: false, samples: [], provenPhotos: 0 });
    expect(listBrandEvidence).not.toHaveBeenCalled();
  });

  it('returns the listing once it is approved', async () => {
    findOne.mockResolvedValue({ _id: 'szrt_progress', publishApproved: true });
    listBrandEvidence.mockResolvedValue({ kind: 'club', name: 'DVTK', provenPhotos: 3, modelIdentifiedPhotos: 1, samples: [{ id: 'a' }] });
    const body = await (await get('kind=club&name=DVTK&organizationId=org_szrt')).json();
    expect(body).toMatchObject({ success: true, published: true, name: 'DVTK', provenPhotos: 3, samples: [{ id: 'a' }] });
    expect(listBrandEvidence).toHaveBeenCalledWith(expect.anything(), { kind: 'club', name: 'DVTK' });
  });
});

describe('POST /api/integrations/fanmass/szrt-evidence', () => {
  it('refuses a caller without the integration token', async () => {
    expect((await post({ samples: [] }, {})).status).toBe(401);
    expect((await post({ samples: [] }, { authorization: 'Bearer wrong' })).status).toBe(401);
  });

  it('says so when the media store is not configured instead of dropping the images', async () => {
    (isMediaStorageConfigured as jest.Mock).mockReturnValue(false);
    const response = await post({ pipeline: 'p', samples: [{}] });
    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe('MEDIA_STORAGE_NOT_CONFIGURED');
  });

  it('refuses an empty batch', async () => {
    const response = await post({ pipeline: 'p', samples: [] });
    expect(response.status).toBe(400);
  });

  it('reports every skipped sample with its reason and stores none of them', async () => {
    const response = await post({ pipeline: 'p', samples: [{ fileKey: 'bad' }] });
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ received: 1, stored: 0, skipped: [{ index: 0, reason: 'missing_region' }] });
  });
});
