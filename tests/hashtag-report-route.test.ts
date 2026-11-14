// tests/hashtag-report-route.test.ts
// WHAT: The hashtag report route answers for any hashtag and is gated like the other hashtag reports.

const requirePageAccess = jest.fn();
const buildHashtagReport = jest.fn();

jest.mock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => ({}) }) }));
jest.mock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'test' } }));
jest.mock('@/lib/pageAccess', () => ({ requirePageAccess: (...a: unknown[]) => requirePageAccess(...a) }));
jest.mock('@/lib/hashtagReport', () => ({ buildHashtagReport: (...a: unknown[]) => buildHashtagReport(...a) }));

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/hashtag-report/[hashtag]/route';

const call = (hashtag: string) => GET(new NextRequest(`http://localhost/api/hashtag-report/${hashtag}`), { params: Promise.resolve({ hashtag }) });

beforeEach(() => {
  jest.clearAllMocks();
  requirePageAccess.mockResolvedValue(null);
  buildHashtagReport.mockResolvedValue({ success: true, scope: { type: 'hashtag', id: 'x' } });
});

describe('GET /api/hashtag-report/[hashtag]', () => {
  it('builds the report for the hashtag without its #, whatever the hashtag is', async () => {
    const res = await call('%23Derby2027');
    expect(res.status).toBe(200);
    expect(requirePageAccess).toHaveBeenCalledWith('hashtag', 'Derby2027');
    expect(buildHashtagReport).toHaveBeenCalledWith(expect.anything(), 'Derby2027');
  });

  it('stops at the page password gate and builds nothing', async () => {
    requirePageAccess.mockResolvedValue(NextResponse.json({ success: false, code: 'PAGE_PASSWORD_REQUIRED' }, { status: 401 }));
    const res = await call('tippmixreport2026');
    expect(res.status).toBe(401);
    expect(buildHashtagReport).not.toHaveBeenCalled();
  });

  it('answers 500 without leaking the error', async () => {
    buildHashtagReport.mockRejectedValue(new Error('mongo down at 10.0.0.1'));
    const res = await call('x');
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('10.0.0.1');
  });
});
