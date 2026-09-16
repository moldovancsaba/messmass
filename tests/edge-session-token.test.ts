// tests/edge-session-token.test.ts
// WHAT: The middleware's /admin/** gate must reject a cookie it did not sign.
// WHY: F-003 / #392. The gate tested `cookies.get('admin-session')?.value` for
//     being non-empty, so `admin-session=x` walked through it, while the
//     comment above claimed it checked for a valid session. The fix is only
//     worth anything if a forged cookie actually fails, so that is what this
//     asserts -- against tokens minted by the real signer, not a stand-in.

import jwt from 'jsonwebtoken';
import { verifyEdgeSessionToken } from '@/lib/edgeSessionToken';

const SECRET = 'test-secret-at-least-32-characters-long-xx';

beforeEach(() => {
  process.env.JWT_SECRET = SECRET;
});

const mint = (payload: object, opts: jwt.SignOptions = {}) =>
  jwt.sign(payload, SECRET, { algorithm: 'HS256', expiresIn: '7d', ...opts });

describe('verifyEdgeSessionToken', () => {
  it('accepts a token this server signed', async () => {
    const claims = await verifyEdgeSessionToken(mint({ userId: 'abc123', role: 'admin' }));
    expect(claims).toMatchObject({ userId: 'abc123', role: 'admin' });
  });

  it('rejects the exact bypass the finding describes', async () => {
    // `admin-session=x` -- non-empty, and that was the whole of the old check.
    expect(await verifyEdgeSessionToken('x')).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = jwt.sign({ userId: 'abc123', role: 'superadmin' }, 'some-other-secret-value-here', {
      algorithm: 'HS256',
      expiresIn: '7d',
    });
    expect(await verifyEdgeSessionToken(forged)).toBeNull();
  });

  it('rejects a tampered payload under a valid signature', async () => {
    const [h, , s] = mint({ userId: 'abc123', role: 'user' }).split('.');
    const swapped = Buffer.from(JSON.stringify({ userId: 'abc123', role: 'superadmin' }))
      .toString('base64url');
    expect(await verifyEdgeSessionToken(`${h}.${swapped}.${s}`)).toBeNull();
  });

  it('rejects alg:none, the classic JWT downgrade', async () => {
    const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const p = Buffer.from(JSON.stringify({ userId: 'abc123', role: 'superadmin' })).toString('base64url');
    expect(await verifyEdgeSessionToken(`${h}.${p}.`)).toBeNull();
  });

  it('rejects an expired token', async () => {
    expect(await verifyEdgeSessionToken(mint({ userId: 'abc123', role: 'admin' }, { expiresIn: '-1h' }))).toBeNull();
  });

  it('rejects a token carrying no userId', async () => {
    expect(await verifyEdgeSessionToken(mint({ role: 'admin' }))).toBeNull();
  });

  it('fails closed in production when JWT_SECRET is unset', async () => {
    // A misconfigured deployment must not turn the gate into a pass-through.
    const good = mint({ userId: 'abc123', role: 'admin' });
    delete process.env.JWT_SECRET;
    const env = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    try {
      expect(await verifyEdgeSessionToken(good)).toBeNull();
    } finally {
      Object.defineProperty(process.env, 'NODE_ENV', { value: env, configurable: true });
    }
  });

  it('uses the same dev fallback as the route-level validator', async () => {
    // The two validators must agree about the same cookie. If this gate were
    // stricter, a developer with no JWT_SECRET would be bounced by the
    // middleware while getAdminUser accepted them.
    delete process.env.JWT_SECRET;
    const devToken = jwt.sign({ userId: 'abc123', role: 'admin' }, 'dev-secret-change-in-production', {
      algorithm: 'HS256',
      expiresIn: '10m',
    });
    expect(await verifyEdgeSessionToken(devToken)).toMatchObject({ userId: 'abc123' });
  });

  it('never throws on malformed input', async () => {
    for (const bad of ['', '..', 'a.b', 'a.b.c.d', 'not-base64!.@@@.###']) {
      expect(await verifyEdgeSessionToken(bad)).toBeNull();
    }
  });
});
