import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

/** Constant-time, fail-closed comparison for the dedicated SSO erasure secret. */
export function isValidMessmassErasureSecret(provided: string | null, configured: string | undefined): boolean {
  if (!provided || !configured) return false;
  const left = createHash('sha256').update(provided, 'utf8').digest();
  const right = createHash('sha256').update(configured, 'utf8').digest();
  return timingSafeEqual(left, right);
}

export function requireMessmassPrivacyErasureSecret(
  request: NextRequest,
  configured: string | undefined,
): NextResponse | null {
  if (isValidMessmassErasureSecret(request.headers.get('x-sso-privacy-secret'), configured)) return null;
  return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
}
