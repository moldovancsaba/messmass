// lib/auth/stakeholderSession.ts
// WHAT: Mint/read the `stakeholder-session` cookie -- messmass's own signed
//     session for an externally-verified stakeholder (sponsor/agency/media/
//     operator), issued only after SSO has already authenticated the person.
// WHY: messmass#231. StakeholderRole doesn't fit lib/roles.ts's UserRole (that
//     type is the fleet-wide admin role set consumed by hasPermission() and
//     SSO's own per-app permission store -- adding stakeholder roles there
//     would leak a messmass-only concept into that shared meaning). This is a
//     fourth, narrow session kind alongside admin-session/page-password/
//     machine-token, exactly as messmass's existing three-auth-system split
//     already does for grants that don't fit an existing shape.
// HOW: Same library, same secret, same algorithm as every other signed session
//     in this codebase (see lib/sessionTokens.ts) -- no new cryptography, just
//     a payload shaped for this grant instead of a UserRole.

import jwt from 'jsonwebtoken';
import type { NextRequest, NextResponse } from 'next/server';
import type { StakeholderRole, StakeholderScopeType } from '@/lib/stakeholderGrants';

const COOKIE_NAME = 'stakeholder-session';
const SESSION_LIFETIME = '30d';

export interface StakeholderSessionData {
  grantId: string;
  email: string;
  role: StakeholderRole;
  scopeType: StakeholderScopeType;
  scopeId: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'dev-secret-change-in-production';
  }
  return secret;
}

export function mintStakeholderSession(response: NextResponse, data: StakeholderSessionData): void {
  const token = jwt.sign(data, getSecret(), { expiresIn: SESSION_LIFETIME, algorithm: 'HS256' });
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
}

export function getStakeholderSession(request: NextRequest): StakeholderSessionData | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, getSecret(), { algorithms: ['HS256'] }) as StakeholderSessionData;
  } catch {
    return null;
  }
}

export function clearStakeholderSession(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 0, path: '/' });
}
