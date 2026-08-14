// lib/pageAccess.ts
// WHAT: Server-side proof that a visitor passed a page-password check.
// WHY: Page passwords protected only the browser. On success the client wrote a
//     flag into sessionStorage and gated its own fetch on it, while the APIs
//     behind those pages had no authentication at all — audit finding F-001, which
//     was demonstrated by fetching 186 projects and 108 aggregated stat keys from a
//     password-protected filter with no credentials of any kind. Client-side state
//     cannot protect server-side data; only a credential the server issues and
//     verifies can.
// HOW: On a successful password check the server issues a signed, HttpOnly grant
//     cookie naming exactly the pages that were unlocked. Routes serving or
//     mutating a protected page's data require a matching grant. Signed with the
//     same JWT_SECRET as sessions, so there is one signing key to rotate, not two.

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { PageType } from './pagePassword';
import { getAdminUser } from './auth';

export const PAGE_ACCESS_COOKIE = 'page-access';

// WHAT: Grant lifetime.
// WHY: The behaviour being replaced was sessionStorage, which dies with the tab.
//     12 hours is longer than that, because an operator running an event should
//     not be re-prompted mid-shift, and shorter than a session cookie, because a
//     page password is a shared secret handed to guests.
const GRANT_TTL_SECONDS = 12 * 60 * 60;

// WHAT: Cap on grants carried in one cookie.
// WHY: The cookie grows as a visitor unlocks more pages, and an oversized Cookie
//     header is rejected by proxies — which would present as an unexplained
//     logout. Oldest grants are dropped first.
const MAX_GRANTS = 40;

interface GrantPayload {
  grants: string[];
}

function grantKey(pageType: PageType | string, pageId: string): string {
  return `${pageType}:${pageId}`;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required to issue page access grants');
    }
    return 'dev-secret-change-in-production';
  }
  return s;
}

function readGrants(token: string | undefined): string[] {
  if (!token) return [];
  try {
    const decoded = jwt.verify(token, secret(), { algorithms: ['HS256'] }) as GrantPayload;
    return Array.isArray(decoded.grants) ? decoded.grants.filter((g) => typeof g === 'string') : [];
  } catch {
    // Expired or tampered: treat as no grants rather than throwing, so a stale
    // cookie re-prompts for the password instead of erroring the page.
    return [];
  }
}

// WHAT: Add one unlocked page to a visitor's grant set and re-sign it.
// WHY: A visitor legitimately unlocks several pages in a session; re-issuing a
//     single cookie keeps that in one credential instead of one cookie per page.
export function mintPageAccessToken(existing: string | undefined, pageType: PageType | string, pageId: string): string {
  const key = grantKey(pageType, pageId);
  const grants = readGrants(existing).filter((g) => g !== key);
  grants.push(key);
  return jwt.sign({ grants: grants.slice(-MAX_GRANTS) }, secret(), {
    algorithm: 'HS256',
    expiresIn: GRANT_TTL_SECONDS,
  });
}

export function pageAccessCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: GRANT_TTL_SECONDS,
    path: '/' as const,
  };
}

// WHAT: Does this request carry a grant for the given page?
// WHY: The single question every protected route asks.
export async function hasPageAccess(pageType: PageType | string, pageId: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(PAGE_ACCESS_COOKIE)?.value;
  return readGrants(token).includes(grantKey(pageType, pageId));
}

// WHAT: Is this page protected at all?
// WHY: Most pages have no password configured, and those must stay reachable.
//     Requiring a grant for an unprotected page would break every public report.
//     Checked against the same collection the password check writes to, so the
//     guard turns on the moment a password is set and off when it is removed.
export async function isPageProtected(pageType: PageType | string, pageId: string): Promise<boolean> {
  const { getDb } = await import('./fanmassIntegration');
  const db = await getDb();
  const found = await db.collection('page_passwords').findOne(
    { pageId, pageType },
    { projection: { _id: 1 } }
  );
  return found !== null;
}

export interface PageAccessDenial {
  response: NextResponse;
}

// WHAT: Guard for routes that serve or mutate a page's data.
// WHY: Returns null when the caller may proceed, or a 401 to return as-is. Three
//     ways to pass, in cost order: the page has no password; the caller holds an
//     admin session; the caller holds a grant for this page.
// NOTE: Returns 401 rather than 403 so the client can prompt for the password —
//     403 would read as "you may never see this", which is wrong for a page whose
//     whole model is "enter the password and you may".
export async function requirePageAccess(
  pageType: PageType | string,
  pageId: string
): Promise<NextResponse | null> {
  if (!(await isPageProtected(pageType, pageId))) return null;
  if (await hasPageAccess(pageType, pageId)) return null;

  const admin = await getAdminUser();
  if (admin) return null;

  return NextResponse.json(
    {
      success: false,
      error: 'This page is password protected.',
      code: 'PAGE_PASSWORD_REQUIRED',
    },
    { status: 401 }
  );
}
