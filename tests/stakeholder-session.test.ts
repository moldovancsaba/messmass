// tests/stakeholder-session.test.ts
// WHAT: The stakeholder-session cookie must only be trusted when signed with
//     this server's own JWT_SECRET -- same bar as the admin edge-session token
//     (tests/edge-session-token.test.ts), because this cookie is also a bearer
//     credential that decides which external sponsor/agency/media report a
//     request can read.
// WHY: messmass#231. This is a new session kind (see lib/auth/stakeholderSession.ts
//     for why it isn't folded into the existing UserRole/admin-session type),
//     so it needs its own pin rather than inheriting edge-session-token's.

import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { getStakeholderSession } from '@/lib/auth/stakeholderSession';

const SECRET = 'test-secret-at-least-32-characters-long-xx';

beforeEach(() => {
  process.env.JWT_SECRET = SECRET;
});

function requestWithCookie(value: string): NextRequest {
  return new NextRequest('http://localhost/api/whatever', {
    headers: { cookie: `stakeholder-session=${value}` },
  });
}

const PAYLOAD = { grantId: 'g1', email: 'sponsor@example.com', role: 'sponsor', scopeType: 'partner', scopeId: 'p1' };
const mint = (payload: object, opts: jwt.SignOptions = {}) =>
  jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '30d', ...opts });

describe('getStakeholderSession', () => {
  it('accepts a token this server signed', () => {
    expect(getStakeholderSession(requestWithCookie(mint(PAYLOAD)))).toMatchObject(PAYLOAD);
  });

  it('returns null with no cookie at all', () => {
    expect(getStakeholderSession(new NextRequest('http://localhost/api/whatever'))).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign(PAYLOAD, 'some-other-secret-value-here', { algorithm: 'HS256', expiresIn: '30d' });
    expect(getStakeholderSession(requestWithCookie(forged))).toBeNull();
  });

  it('rejects a tampered payload under a valid signature', () => {
    const [h, , s] = mint(PAYLOAD).split('.');
    const swapped = Buffer.from(JSON.stringify({ ...PAYLOAD, role: 'operator' })).toString('base64url');
    expect(getStakeholderSession(requestWithCookie(`${h}.${swapped}.${s}`))).toBeNull();
  });

  it('rejects alg:none, the classic JWT downgrade', () => {
    const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const p = Buffer.from(JSON.stringify(PAYLOAD)).toString('base64url');
    expect(getStakeholderSession(requestWithCookie(`${h}.${p}.`))).toBeNull();
  });

  it('rejects an expired token', () => {
    expect(getStakeholderSession(requestWithCookie(mint(PAYLOAD, { expiresIn: '-1h' })))).toBeNull();
  });
});
