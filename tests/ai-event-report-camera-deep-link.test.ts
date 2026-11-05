// tests/ai-event-report-camera-deep-link.test.ts
// WHAT: Verify getAnalysisSummary attaches Camera workspace deep link metadata
//     from projects.externalRefs.camera and verifies route protection and response
//     payload on GET /api/analytics/ai/events/[eventId]/summary.
// WHY: Issue 502: Camera owns per-photo inspection and boxes; Messmass retains
//     event-level rollups and deep-links to Camera's Fanmass analysis workspace.

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

const testEventId = new ObjectId().toHexString();
const testMongoId = new ObjectId().toHexString();

let currentUser: { id: string; email: string; role: string } | null = {
  id: 'admin-1',
  email: 'admin@messmass.com',
  role: 'admin',
};

const fakeSummaries: Record<string, any> = {};
const fakeProjects: Record<string, any> = {};

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  getAdminUser: jest.fn(async () => currentUser),
}));

jest.mock('@/lib/config', () => {
  const actual = jest.requireActual('@/lib/config');
  return {
    __esModule: true,
    default: {
      ...actual.default,
      cameraBaseUrl: 'https://camera.messmass.com',
    },
  };
});

jest.mock('@/lib/fanmassIntegration', () => ({
  __esModule: true,
  getDb: async () => ({
    collection: (name: string) => ({
      findOne: async (query: Record<string, any>) => {
        if (name === 'ai_analysis_summaries') {
          return fakeSummaries[query.eventId] || null;
        }
        if (name === 'projects') {
          const id = query._id instanceof ObjectId ? query._id.toHexString() : String(query._id);
          return fakeProjects[id] || null;
        }
        return null;
      },
    }),
  }),
}));

import { getAnalysisSummary } from '@/lib/aiAnalysisSummary';
import { GET } from '@/app/api/analytics/ai/events/[eventId]/summary/route';

describe('AI event report camera deep link resolution (Issue 502)', () => {
  beforeEach(() => {
    currentUser = { id: 'admin-1', email: 'admin@messmass.com', role: 'admin' };
    for (const key of Object.keys(fakeSummaries)) delete fakeSummaries[key];
    for (const key of Object.keys(fakeProjects)) delete fakeProjects[key];
  });

  describe('getAnalysisSummary', () => {
    it('returns null if no summary document is recorded', async () => {
      const summary = await getAnalysisSummary(testEventId);
      expect(summary).toBeNull();
    });

    it('returns summary with null camera deep link when project has no camera ref', async () => {
      fakeSummaries[testEventId] = {
        eventId: testEventId,
        sourceType: 'camera_photo_pipeline',
        contractVersion: 'messmass.camera-photo-results.v1',
        receivedAt: '2026-11-05T09:00:00Z',
        summary: { photoResultsReceived: 42, peopleCounts: { measured: 150 } },
      };
      fakeProjects[testEventId] = {
        _id: new ObjectId(testEventId),
        title: 'Independent Event',
      };

      const result = await getAnalysisSummary(testEventId);
      expect(result).not.toBeNull();
      expect(result?.eventId).toBe(testEventId);
      expect(result?.summary.photoResultsReceived).toBe(42);
      expect(result?.cameraEvent).toEqual({
        eventId: null,
        mongoId: null,
        analysisUrl: null,
      });
    });

    it('resolves camera deep link using camera.mongoId when present', async () => {
      fakeSummaries[testEventId] = {
        eventId: testEventId,
        sourceType: 'camera_photo_pipeline',
        contractVersion: 'messmass.camera-photo-results.v1',
        receivedAt: '2026-11-05T09:00:00Z',
        summary: { photoResultsReceived: 10, peopleCounts: { measured: 25 } },
      };
      fakeProjects[testEventId] = {
        _id: new ObjectId(testEventId),
        externalRefs: {
          camera: {
            eventId: 'camera-uuid-123',
            mongoId: testMongoId,
          },
        },
      };

      const result = await getAnalysisSummary(testEventId);
      expect(result?.cameraEvent).toEqual({
        eventId: 'camera-uuid-123',
        mongoId: testMongoId,
        analysisUrl: `https://camera.messmass.com/admin/events/${testMongoId}/analysis`,
      });
    });

    it('falls back to camera.eventId when mongoId is absent', async () => {
      fakeSummaries[testEventId] = {
        eventId: testEventId,
        sourceType: 'camera_photo_pipeline',
        contractVersion: 'messmass.camera-photo-results.v1',
        receivedAt: '2026-11-05T09:00:00Z',
        summary: { photoResultsReceived: 5 },
      };
      fakeProjects[testEventId] = {
        _id: new ObjectId(testEventId),
        externalRefs: {
          camera: {
            eventId: 'camera-uuid-999',
          },
        },
      };

      const result = await getAnalysisSummary(testEventId);
      expect(result?.cameraEvent).toEqual({
        eventId: 'camera-uuid-999',
        mongoId: null,
        analysisUrl: 'https://camera.messmass.com/admin/events/camera-uuid-999/analysis',
      });
    });

    it('rejects non-ObjectId eventId with 422 error', async () => {
      await expect(getAnalysisSummary('not-an-object-id')).rejects.toMatchObject({
        status: 422,
        code: 'INVALID_EVENT_ID',
      });
    });
  });

  describe('GET /api/analytics/ai/events/[eventId]/summary route', () => {
    it('rejects unauthenticated requests with 401', async () => {
      currentUser = null;
      const response = await GET(
        new NextRequest(`http://localhost/api/analytics/ai/events/${testEventId}/summary`),
        { params: Promise.resolve({ eventId: testEventId }) },
      );
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error?.code).toBe('UNAUTHENTICATED');
    });

    it('rejects non-admin roles with 403', async () => {
      currentUser = { id: 'partner-1', email: 'p@messmass.com', role: 'partner' };
      const response = await GET(
        new NextRequest(`http://localhost/api/analytics/ai/events/${testEventId}/summary`),
        { params: Promise.resolve({ eventId: testEventId }) },
      );
      expect(response.status).toBe(403);
    });

    it('returns 404 when summary is not found', async () => {
      const response = await GET(
        new NextRequest(`http://localhost/api/analytics/ai/events/${testEventId}/summary`),
        { params: Promise.resolve({ eventId: testEventId }) },
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error?.code).toBe('SUMMARY_NOT_FOUND');
    });

    it('returns 200 with summary doc and cameraEvent on success', async () => {
      fakeSummaries[testEventId] = {
        eventId: testEventId,
        sourceType: 'camera_photo_pipeline',
        contractVersion: 'messmass.camera-photo-results.v1',
        receivedAt: '2026-11-05T09:00:00Z',
        summary: {
          photoResultsReceived: 88,
          peopleCounts: { measured: 230 },
          personBoxes: 245,
          faceBoxes: 210,
        },
      };
      fakeProjects[testEventId] = {
        _id: new ObjectId(testEventId),
        externalRefs: {
          camera: {
            eventId: 'camera-uuid-123',
            mongoId: testMongoId,
          },
        },
      };

      const response = await GET(
        new NextRequest(`http://localhost/api/analytics/ai/events/${testEventId}/summary`),
        { params: Promise.resolve({ eventId: testEventId }) },
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.summary.photoResultsReceived).toBe(88);
      expect(body.data.cameraEvent.analysisUrl).toBe(`https://camera.messmass.com/admin/events/${testMongoId}/analysis`);
    });
  });
});
