// tests/camera-photo-erasure-synthetic-e2e.test.ts
// Comprehensive isolated synthetic cross-product integration test for Issue #505:
// 1. Synthetic cross-product erasure flow (SSO DELETE -> Messmass event resolve -> tombstone -> scrub -> aggregate rebuild)
// 2. Delayed-write rejection against tombstone (prevents resurrection)
// 3. Cache invalidation (revalidatePath verification)
// 4. SSO receipt verification & edge-case contract enforcement (400, 403, 404, 409, idempotent 200)

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

const MOCK_ERASURE_SECRET = 'sso-privacy-test-secret-value-1234';

let currentDbMock: any = null;

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual('@/lib/config');
  return {
    __esModule: true,
    default: {
      ...actual.default,
      privacyErasureSecret: MOCK_ERASURE_SECRET,
    },
  };
});

jest.mock('@/lib/fanmassIntegration', () => {
  const actual = jest.requireActual('@/lib/fanmassIntegration');
  return {
    __esModule: true,
    ...actual,
    getDb: jest.fn(async () => currentDbMock),
  };
});

jest.mock('@/lib/db', () => ({
  __esModule: true,
  getDb: jest.fn(async () => currentDbMock),
  default: jest.fn(async () => currentDbMock),
}));

const revalidatedPaths: string[] = [];
jest.mock('next/cache', () => ({
  __esModule: true,
  revalidatePath: jest.fn((path: string) => {
    revalidatedPaths.push(path);
  }),
}));

describe('Privacy: Messmass photo erasure synthetic cross-product E2E', () => {
  const messmassEventId = new ObjectId().toHexString();
  const partnerId = new ObjectId();
  const cameraEventId = 'camera-evt-synth-9988';
  const cameraPartnerId = 'camera-part-synth-7766';
  const cameraPhotoId = '507f1f77bcf86cd799439099';
  const requestId = 'f51e6124-13a3-46ec-b3f8-c9bac50f6bd5';

  let projectDoc: Record<string, any>;
  let partnerDoc: Record<string, any>;
  let photoStore: Map<string, Record<string, any>>;
  let summaryStore: Map<string, Record<string, any>>;

  let dbMock: any;

  beforeEach(() => {
    revalidatedPaths.length = 0;
    projectDoc = {
      _id: new ObjectId(messmassEventId),
      slug: 'synthetic-matchday-2026',
      name: 'Synthetic Matchday 2026',
      externalRefs: { camera: { eventId: cameraEventId } },
      partnerId,
      partner1Id: partnerId,
      stats: {},
    };

    partnerDoc = {
      _id: partnerId,
      name: 'Synthetic FC Partner',
      cameraPartnerId,
    };

    photoStore = new Map();
    summaryStore = new Map();

    const collection = (name: string) => {
      if (name === 'projects') {
        return {
          findOne: jest.fn(async (filter: any) => {
            if (filter._id && String(filter._id) === messmassEventId) return projectDoc;
            if (filter['externalRefs.camera.eventId'] === cameraEventId) return projectDoc;
            return null;
          }),
          find: jest.fn((filter: any) => ({
            limit: jest.fn(() => ({
              toArray: async () => {
                if (filter['externalRefs.camera.eventId'] === cameraEventId) return [projectDoc];
                return [];
              },
            })),
          })),
          updateOne: jest.fn(async (filter: any, update: any) => {
            if (filter._id && String(filter._id) === messmassEventId) {
              if (update.$set) {
                for (const [k, v] of Object.entries(update.$set)) {
                  if (k.startsWith('stats.')) {
                    projectDoc.stats[k.slice(6)] = v;
                  } else {
                    projectDoc[k] = v;
                  }
                }
              }
              if (update.$unset) {
                for (const k of Object.keys(update.$unset)) {
                  if (k.startsWith('stats.')) {
                    delete projectDoc.stats[k.slice(6)];
                  } else {
                    delete projectDoc[k];
                  }
                }
              }
              return { matchedCount: 1, modifiedCount: 1 };
            }
            return { matchedCount: 0, modifiedCount: 0 };
          }),
        };
      }
      if (name === 'partners') {
        return {
          findOne: jest.fn(async (filter: any) => {
            if (filter.cameraPartnerId === cameraPartnerId) return partnerDoc;
            return null;
          }),
          countDocuments: jest.fn(async (filter: any) => {
            if (filter.cameraPartnerId === cameraPartnerId) return 1;
            return 0;
          }),
        };
      }
      if (name === 'fanmass_camera_photo_analyses') {
        return {
          createIndex: jest.fn(async () => 'index'),
          findOne: jest.fn(async (filter: any) => {
            return photoStore.get(filter._id) || null;
          }),
          find: jest.fn((filter: any) => ({
            toArray: async () => {
              const rows: any[] = [];
              for (const doc of photoStore.values()) {
                if (filter.eventId && doc.eventId !== filter.eventId) continue;
                if (filter.tombstone && filter.tombstone.$ne === true && doc.tombstone === true) continue;
                if (filter.status && doc.status !== filter.status) continue;
                rows.push(doc);
              }
              return rows;
            },
          })),
          updateOne: jest.fn(async (filter: any, update: any, options?: any) => {
            const id = filter._id;
            let existing = photoStore.get(id);

            // Check if filter matches
            if (existing) {
              if (filter.tombstone && filter.tombstone.$ne === true && existing.tombstone === true) {
                if (options?.upsert) {
                  // Duplicate key collision
                  const err: any = new Error('E11000 duplicate key error');
                  err.code = 11000;
                  throw err;
                }
                return { matchedCount: 0, modifiedCount: 0 };
              }
              if (filter.$or) {
                const matches = filter.$or.some((clause: any) => {
                  if (clause.analysisGeneration?.$lt !== undefined) {
                    return existing.analysisGeneration < clause.analysisGeneration.$lt;
                  }
                  if (clause.analysisGeneration !== undefined) {
                    return existing.analysisGeneration === clause.analysisGeneration && existing.sourceRevision === clause.sourceRevision;
                  }
                  return false;
                });
                if (!matches) return { matchedCount: 0, modifiedCount: 0 };
              }
            } else if (!options?.upsert) {
              return { matchedCount: 0, modifiedCount: 0 };
            }

            const doc = existing || { _id: id };
            if (update.$set) Object.assign(doc, update.$set);
            if (update.$unset) {
              for (const k of Object.keys(update.$unset)) delete doc[k];
            }
            photoStore.set(id, doc);
            return { matchedCount: existing ? 1 : 0, upsertedCount: existing ? 0 : 1 };
          }),
        };
      }
      if (name === 'ai_analysis_summaries') {
        return {
          updateOne: jest.fn(async (filter: any, update: any) => {
            const id = filter.eventId;
            const doc = summaryStore.get(id) || { eventId: id };
            if (update.$set) Object.assign(doc, update.$set);
            summaryStore.set(id, doc);
            return { matchedCount: 1, modifiedCount: 1 };
          }),
          findOne: jest.fn(async (filter: any) => summaryStore.get(filter.eventId) || null),
        };
      }
      if (name === 'variables_metadata') {
        return {
          find: jest.fn(() => ({ toArray: async () => [] })),
          bulkWrite: jest.fn(async () => ({ upsertedCount: 0 })),
        };
      }
      throw new Error(`Unexpected collection name: ${name}`);
    };

    dbMock = { collection };
    currentDbMock = dbMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('executes full synthetic cross-product lifecycle: ingest -> verify aggregates -> erase -> tombstone scrub -> rebuild -> reject delayed write', async () => {
    const { storeFanmassPhotoAnalysis } = await import('@/lib/fanmassPhotoAnalyses');
    const { DELETE } = await import('@/app/api/integrations/privacy/erase-camera-photo/route');

    // 1. Initial State: ingest active photo analysis via Fanmass route logic
    const activePhotoPayload = {
      contractVersion: 'fanmass.messmass.photo-analysis.v2',
      messmassEventId,
      cameraPartnerId,
      cameraEventId,
      cameraPhotoId,
      sourceRevision: 'a'.repeat(64),
      analysisGeneration: 1,
      analysisStage: 'deep',
      analysisModules: ['scan', 'faces', 'people', 'poster', 'moderation', 'sports_merchandise', 'fashion_brands', 'brand_scan'],
      analysisModuleStatuses: {
        scan: 'completed',
        faces: 'completed',
        people: 'completed',
        poster: 'completed',
        moderation: 'completed',
        sports_merchandise: 'completed',
        fashion_brands: 'completed',
        brand_scan: 'completed',
      },
      status: 'completed',
      optIn: { received: true, basis: 'camera_consent_audit', recordedAt: '2026-11-01T10:00:00.000Z', kinds: ['privacy', 'terms'] },
      summary: {
        peopleCounts: { measured: 2 },
        genderProjection: { male: 1, female: 1 },
        emotionProjection: { happy: 2 },
        smilingCount: 2,
        brandMentions: [{ name: 'Nike', count: 1 }],
      },
      boxes: {
        people: [{ x: 0, y: 0, width: 100, height: 200 }, { x: 100, y: 0, width: 100, height: 200 }],
        faces: [{ x: 10, y: 10, width: 40, height: 40 }, { x: 110, y: 10, width: 40, height: 40 }],
        brandRegions: [{ x: 5, y: 5, width: 20, height: 20, brand: 'Nike' }],
      },
      analysis: {
        details: { verified: true },
      },
    };

    const storeResult = await storeFanmassPhotoAnalysis(messmassEventId, cameraPhotoId, activePhotoPayload);
    expect(storeResult.status).toBe('stored');

    // Verify stored photo in DB
    const storedPhoto = Array.from(photoStore.values())[0];
    expect(storedPhoto).toBeDefined();
    expect(storedPhoto.status).toBe('completed');
    expect(storedPhoto.tombstone).toBe(false);
    expect(storedPhoto.summary).toBeDefined();
    expect(storedPhoto.boxes.people).toHaveLength(2);

    // Verify aggregate summary and project stats were populated
    const preSummary = summaryStore.get(messmassEventId);
    expect(preSummary?.summary.photoResultsReceived).toBe(1);
    expect(preSummary?.summary.peopleCounts.measured).toBe(2);
    expect(projectDoc.stats.fanmassPhotoResultsReceived).toBe(1);
    expect(projectDoc.stats.fanmassOptInPhotos).toBe(1);

    // 2. SSO Privacy Erasure: call DELETE /api/integrations/privacy/erase-camera-photo
    const erasureRequest = new NextRequest('http://localhost/api/integrations/privacy/erase-camera-photo', {
      method: 'DELETE',
      headers: {
        'x-sso-privacy-secret': MOCK_ERASURE_SECRET,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        request_id: requestId,
        camera_partner_id: cameraPartnerId,
        camera_event_id: cameraEventId,
        camera_photo_id: cameraPhotoId,
      }),
    });

    const response = await DELETE(erasureRequest);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    const receipt = await response.json();
    expect(receipt).toEqual({
      status: 'deleted',
      received_at: expect.any(String),
    });

    // 3. Verify Tombstone and Scrub in DB
    const tombstonedPhoto = Array.from(photoStore.values())[0];
    expect(tombstonedPhoto.tombstone).toBe(true);
    expect(tombstonedPhoto.status).toBe('deleted');
    expect(tombstonedPhoto.cameraPhotoId).toBe(cameraPhotoId);
    expect(tombstonedPhoto.privacyErasure).toEqual({
      requestId,
      receivedAt: receipt.received_at,
    });

    // Verify all canonical findings and boxes are scrubbed ($unset)
    expect(tombstonedPhoto.summary).toBeUndefined();
    expect(tombstonedPhoto.boxes).toBeUndefined();
    expect(tombstonedPhoto.analysis).toBeUndefined();
    expect(tombstonedPhoto.humanReview).toBeUndefined();
    expect(tombstonedPhoto.sourceRevision).toBeUndefined();
    expect(tombstonedPhoto.analysisGeneration).toBeUndefined();
    expect(tombstonedPhoto.analyzedAt).toBeUndefined();

    // 4. Verify Aggregate Rebuild
    const postSummary = summaryStore.get(messmassEventId);
    expect(postSummary?.summary.photoResultsReceived).toBe(0);
    expect(postSummary?.summary.peopleCounts.measured).toBe(0);
    expect(projectDoc.stats.fanmassPhotoResultsReceived).toBe(0);

    // 5. Verify Cache Invalidation triggered
    expect(revalidatedPaths).toContain('/report');
    expect(revalidatedPaths).toContain('/partner-report');
    expect(revalidatedPaths).toContain(`/report/${projectDoc.slug}`);

    // 6. Delayed-Write Rejection: Fanmass retries/pushes an upsert after photo was tombstoned
    const delayedPayload = {
      ...activePhotoPayload,
      analysisGeneration: 10,
      sourceRevision: 'b'.repeat(64),
    };

    const delayedResult = await storeFanmassPhotoAnalysis(messmassEventId, cameraPhotoId, delayedPayload);
    expect(delayedResult.status).toBe('ignored_stale');

    // Verify tombstone was NOT overwritten and findings were NOT resurrected
    const postDelayedPhoto = Array.from(photoStore.values())[0];
    expect(postDelayedPhoto.tombstone).toBe(true);
    expect(postDelayedPhoto.status).toBe('deleted');
    expect(postDelayedPhoto.summary).toBeUndefined();
    expect(postDelayedPhoto.boxes).toBeUndefined();
    expect(postDelayedPhoto.analysis).toBeUndefined();

    // Verify aggregates remain zero
    expect(summaryStore.get(messmassEventId)?.summary.photoResultsReceived).toBe(0);
    expect(projectDoc.stats.fanmassPhotoResultsReceived).toBe(0);

    // 7. Idempotency: repeating the exact same SSO erasure returns 200 and preserves tombstone
    const repeatRequest = new NextRequest('http://localhost/api/integrations/privacy/erase-camera-photo', {
      method: 'DELETE',
      headers: {
        'x-sso-privacy-secret': MOCK_ERASURE_SECRET,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        request_id: requestId,
        camera_partner_id: cameraPartnerId,
        camera_event_id: cameraEventId,
        camera_photo_id: cameraPhotoId,
      }),
    });

    const repeatResponse = await DELETE(repeatRequest);
    expect(repeatResponse.status).toBe(200);
    const repeatReceipt = await repeatResponse.json();
    expect(repeatReceipt.status).toBe('deleted');
    expect(postDelayedPhoto.tombstone).toBe(true);
  });

  it('rejects unauthorized SSO erasure callers with 403', async () => {
    const { DELETE } = await import('@/app/api/integrations/privacy/erase-camera-photo/route');
    const req = new NextRequest('http://localhost/api/integrations/privacy/erase-camera-photo', {
      method: 'DELETE',
      headers: { 'x-sso-privacy-secret': 'wrong-secret' },
      body: JSON.stringify({
        request_id: requestId,
        camera_partner_id: cameraPartnerId,
        camera_event_id: cameraEventId,
        camera_photo_id: cameraPhotoId,
      }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: 'forbidden' });
  });

  it('rejects malformed payloads with 400 invalid_request', async () => {
    const { DELETE } = await import('@/app/api/integrations/privacy/erase-camera-photo/route');
    const req = new NextRequest('http://localhost/api/integrations/privacy/erase-camera-photo', {
      method: 'DELETE',
      headers: { 'x-sso-privacy-secret': MOCK_ERASURE_SECRET },
      body: JSON.stringify({
        request_id: requestId,
        camera_partner_id: cameraPartnerId,
        // missing camera_event_id and camera_photo_id
      }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid_request' });
  });

  it('fails closed when Camera event link is not found (404)', async () => {
    const { DELETE } = await import('@/app/api/integrations/privacy/erase-camera-photo/route');
    const req = new NextRequest('http://localhost/api/integrations/privacy/erase-camera-photo', {
      method: 'DELETE',
      headers: { 'x-sso-privacy-secret': MOCK_ERASURE_SECRET },
      body: JSON.stringify({
        request_id: requestId,
        camera_partner_id: cameraPartnerId,
        camera_event_id: 'unknown-camera-event-999',
        camera_photo_id: cameraPhotoId,
      }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'CAMERA_EVENT_LINK_NOT_FOUND' });
  });

  it('fails closed when Camera partner ID mismatches the event (409)', async () => {
    const { DELETE } = await import('@/app/api/integrations/privacy/erase-camera-photo/route');
    const req = new NextRequest('http://localhost/api/integrations/privacy/erase-camera-photo', {
      method: 'DELETE',
      headers: { 'x-sso-privacy-secret': MOCK_ERASURE_SECRET },
      body: JSON.stringify({
        request_id: requestId,
        camera_partner_id: 'mismatched-camera-partner',
        camera_event_id: cameraEventId,
        camera_photo_id: cameraPhotoId,
      }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({ error: 'CAMERA_PARTNER_ID_MISMATCH' });
  });
});
