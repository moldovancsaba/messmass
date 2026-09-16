// lib/edgeSessionToken.ts
// WHAT: HS256 verification of the admin-session cookie, using Web Crypto only.
// WHY: middleware.ts gated /admin/** on `cookies.get('admin-session')?.value`
//     being non-empty. Any non-empty string passed -- `admin-session=x` walked
//     through the gate -- while the comment above it claimed "Step 1 - Check
//     authentication (user has valid session)". Real protection rested entirely
//     on each route handler independently calling getAdminUser (F-003).
//     It could not simply call the existing validator: lib/sessionTokens.ts
//     uses `jsonwebtoken`, which needs Node's crypto, and imports lib/users,
//     which pulls in mongodb and bcrypt. None of that loads in the Edge runtime
//     middleware runs in. Web Crypto's HMAC-SHA256 does, and HS256 is all these
//     tokens use, so the verification is ~40 lines with no dependency rather
//     than a second copy of a JWT library.
// HOW: Signature and expiry only. It deliberately does NOT confirm the user
//     still exists, is not deleted, and holds the role a page needs -- that
//     needs the database, which middleware cannot reach. The boundary this
//     draws is "a session this server signed, still within its lifetime";
//     authorisation stays with getAdminUser / requireAdmin in the route.

const enc = new TextEncoder();

export interface EdgeSessionClaims {
  userId: string;
  role: string;
  exp?: number;
}

/**
 * The signing secret, resolved exactly as lib/sessionTokens.ts resolves it.
 *
 * The dev fallback is copied deliberately, not overlooked. If this gate were
 * stricter than the route-level validator, a developer with no JWT_SECRET would
 * be bounced from every /admin page by the middleware while getAdminUser was
 * perfectly happy with their cookie -- two validators disagreeing about the
 * same credential, which is how a security check gets switched off in
 * frustration. Production has no fallback in either place.
 */
function sessionSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') return null;
  return 'dev-secret-change-in-production';
}

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Verify an HS256 session token.
 *
 * Returns the claims when the signature checks out against JWT_SECRET and the
 * token has not expired, otherwise null. Never throws: a malformed cookie is
 * an invalid session, not a 500.
 */
export async function verifyEdgeSessionToken(
  token: string
): Promise<EdgeSessionClaims | null> {
  const secret = sessionSecret();
  // Fail closed. In production a missing secret means nothing can be verified,
  // and a gate that opens when the deployment is misconfigured is worse than no
  // gate, because it looks like one.
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  try {
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(headerB64)));
    if (header?.alg !== 'HS256') return null;

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(sigB64),
      enc.encode(`${headerB64}.${payloadB64}`)
    );
    if (!ok) return null;

    const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
    if (typeof claims?.exp === 'number' && claims.exp * 1000 <= Date.now()) return null;
    if (!claims?.userId) return null;

    return { userId: String(claims.userId), role: String(claims.role || 'guest'), exp: claims.exp };
  } catch {
    return null;
  }
}
