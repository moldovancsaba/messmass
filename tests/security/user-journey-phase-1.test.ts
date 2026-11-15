import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { GET as getPartnerAnalytics } from '@/app/api/analytics/partner/[partnerId]/route';
import * as auth from '@/lib/auth';

const foreignOrgId = new ObjectId().toString();
const userOrgId = new ObjectId().toString();
const testPartnerId = new ObjectId().toString();

jest.mock('@/lib/auth', () => ({
  getAdminUser: jest.fn(),
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware: jest.fn().mockResolvedValue(null),
  RATE_LIMITS: { READ: {} },
}));

jest.mock('@/lib/mongodb', () => {
  const { ObjectId } = require('mongodb');
  return {
    __esModule: true,
    default: Promise.resolve({
      db: () => ({
        collection: (name: string) => {
          if (name === 'partners') {
            return {
              findOne: jest.fn().mockImplementation(async (query: any) => {
                if (String(query._id) === testPartnerId) {
                  return {
                    _id: new ObjectId(testPartnerId),
                    name: 'Tenant Secured Partner',
                    organizationId: new ObjectId(foreignOrgId),
                  };
                }
                return null;
              }),
            };
          }
          if (name === 'analytics_aggregates') {
            return {
              find: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                toArray: jest.fn().mockResolvedValue([]),
              }),
            };
          }
          return {
            findOne: jest.fn().mockResolvedValue(null),
          };
        },
      }),
    }),
  };
});

describe('Phase 1 User Journey Security: Partner Analytics Tenant Isolation (INV-001)', () => {
  it('rejects unauthenticated requests with 401', async () => {
    (auth.getAdminUser as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest(`http://localhost:3000/api/analytics/partner/${testPartnerId}`);
    const res = await getPartnerAnalytics(req, { params: Promise.resolve({ partnerId: testPartnerId }) });
    expect(res.status).toBe(401);
  });

  it('enforces INV-001 by rejecting cross-tenant user requests with 403', async () => {
    (auth.getAdminUser as jest.Mock).mockResolvedValueOnce({
      id: 'scoped-user',
      name: 'Scoped User',
      email: 'scoped@example.com',
      role: 'admin',
      organizationIds: [userOrgId], // does not match foreignOrgId!
    });
    const req = new NextRequest(`http://localhost:3000/api/analytics/partner/${testPartnerId}`);
    const res = await getPartnerAnalytics(req, { params: Promise.resolve({ partnerId: testPartnerId }) });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  it('permits superadmin requests across any partner', async () => {
    (auth.getAdminUser as jest.Mock).mockResolvedValueOnce({
      id: 'superadmin-user',
      name: 'Super Admin',
      email: 'admin@example.com',
      role: 'superadmin',
      organizationIds: [],
    });
    const req = new NextRequest(`http://localhost:3000/api/analytics/partner/${testPartnerId}`);
    const res = await getPartnerAnalytics(req, { params: Promise.resolve({ partnerId: testPartnerId }) });
    expect(res.status).toBe(200);
  });
});
