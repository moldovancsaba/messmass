import { NextRequest } from 'next/server';

function mockAdminSession(mockAggregates: any[] = []) {
  jest.doMock('@/lib/auth', () => ({
    __esModule: true,
    getAdminUser: jest.fn(async () => ({ id: 'admin1', username: 'admin', role: 'admin' })),
  }));
  const mockCollection = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockAggregates),
        }),
        toArray: jest.fn().mockResolvedValue(mockAggregates),
      }),
      limit: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockAggregates),
      }),
      toArray: jest.fn().mockResolvedValue(mockAggregates),
    }),
  };
  jest.doMock('@/lib/mongodb', () => ({
    __esModule: true,
    default: Promise.resolve({
      db: () => ({
        collection: () => mockCollection,
      }),
    }),
  }));
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('Executive Dashboard Hardening & Regression Suite', () => {
  it('GET /api/analytics/executive/metrics returns valid 0s on empty aggregates without NaN or error', async () => {
    mockAdminSession([]);
    const { GET: getMetrics } = await import('@/app/api/analytics/executive/metrics/route');
    const res = await getMetrics(new NextRequest('http://localhost/api/analytics/executive/metrics?period=30d'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.totalFans).toBe(0);
    expect(json.data.totalRevenue).toBe(0);
    expect(json.data.growth).toBe(0);
    expect(json.data.previousPeriod.totalFans).toBe(0);
  });

  it('GET /api/analytics/executive/top-events survives documents with null projectId or missing fields', async () => {
    const malformedAggregates = [
      {
        _id: 'agg1',
        projectId: null, // Test null projectId
        eventDate: '2026-08-11',
        fanMetrics: null, // Test null fanMetrics
        adMetrics: undefined,
        partnerContext: null,
      },
      {
        _id: 'agg2',
        projectId: '6a7204bb1c4b8a4dc0e7fb0f',
        eventDate: '2026-08-07',
        fanMetrics: { totalFans: 100, engagementRate: 15.5 },
        adMetrics: { totalROI: 2500 },
        partnerContext: { partnerName: 'Test Event' },
      },
    ];
    mockAdminSession(malformedAggregates);
    const { GET: getTopEvents } = await import('@/app/api/analytics/executive/top-events/route');
    const res = await getTopEvents(new NextRequest('http://localhost/api/analytics/executive/top-events?period=30d&limit=5'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(2);
    expect(json.data[0].name).toBeDefined();
    expect(typeof json.data[0].fans).toBe('number');
    expect(typeof json.data[0].revenue).toBe('number');
  });

  it('GET /api/analytics/trends handles empty period without crashing', async () => {
    mockAdminSession([]);
    const { GET: getTrends } = await import('@/app/api/analytics/trends/route');
    const res = await getTrends(new NextRequest('http://localhost/api/analytics/trends?startDate=2026-10-01&endDate=2026-11-01&groupBy=day'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.dataPoints).toEqual([]);
  });
});
