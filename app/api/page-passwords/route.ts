import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/apiGuards';
import { generateShareableLink, getOrCreatePagePassword, validateAnyPassword } from '@/lib/pagePassword';
import { PageType } from '@/lib/pagePassword';
import { getAdminUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { PAGE_ACCESS_COOKIE, mintPageAccessToken, pageAccessCookieOptions } from '@/lib/pageAccess';
import { error as logError, info as logInfo, warn as logWarn } from '@/lib/logger';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

// WHAT: Force Node.js runtime for this route.
// WHY: This handler relies on server-side password generation using Node's crypto (randomBytes)
// through lib/pagePassword.ts. The Edge runtime does not provide Node's crypto module;
// explicitly opting into the Node.js runtime ensures compatibility.
export const runtime = 'nodejs';

// POST /api/page-passwords - Generate or retrieve page password and create shareable link
export async function POST(request: NextRequest) {
  // WHAT: Minting or revealing a page password requires an admin session.
  // WHY: This handler returned a working 32-character password to any anonymous
  //     caller who knew the pageId — and the pageId is in the page's own URL. The
  //     page-password feature was therefore handing out its own key: every one of
  //     the 699 configured passwords was obtainable by anyone. This guard is the
  //     fix for that; the hashing in lib/pagePassword.ts limits the blast radius
  //     if it is ever bypassed again.
  const denied = await requireSession();
  if (denied) return denied;

  let pageType: string = 'unknown';
  try {
    const body = await request.json();
    const { pageId, pageType: bodyPageType, regenerate = false } = body;
    pageType = (bodyPageType || 'unknown').toString();

    if (!pageId || !pageType) {
      return NextResponse.json(
        { success: false, error: 'pageId and pageType are required' },
        { status: 400 }
      );
    }

    // WHAT: Allow all page types supported by lib/pagePassword (partner-edit, hashtag added per audit #368)
    const allowedPageTypes = ['event-report', 'partner-report', 'organization-report', 'edit', 'partner-edit', 'organization-edit', 'filter', 'hashtag'];
    if (!allowedPageTypes.includes(pageType)) {
      return NextResponse.json(
        { success: false, error: `Invalid pageType. Must be one of: ${allowedPageTypes.join(', ')}` },
        { status: 400 }
      );
    }

    logInfo('Generating password for page', { context: 'page-passwords', pageType: pageType, pageIdPrefix: pageId.substring(0, 8) });

    // Generate or retrieve password
    const pagePassword = await getOrCreatePagePassword(pageId, bodyPageType as PageType, regenerate);

    // Get base URL from request headers
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;

    // Generate shareable link
    const shareableLink = await generateShareableLink(pageId, bodyPageType as PageType, baseUrl);

    logInfo('Generated password for page successfully', { context: 'page-passwords', pageType: pageType, pageIdPrefix: pageId.substring(0, 8) });

    return NextResponse.json({
      success: true,
      shareableLink,
      pagePassword: {
        pageId: pagePassword.pageId,
        pageType: pagePassword.pageType,
        password: pagePassword.password,
        createdAt: pagePassword.createdAt,
        usageCount: pagePassword.usageCount
      }
    });

  } catch (error) {
    logError('Failed to generate page password', { context: 'page-passwords', pageType: (pageType || 'unknown') }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate page password' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/page-passwords - Validate page password
export async function PUT(request: NextRequest) {
  let pageType: string = 'unknown';
  try {
    const body = await request.json();
    const { pageId, pageType: bodyPageType, password } = body;
    pageType = (bodyPageType || 'unknown').toString();

    if (!pageId || !pageType || !password) {
      return NextResponse.json(
        { success: false, error: 'pageId, pageType, and password are required' },
        { status: 400 }
      );
    }

    // WHAT: Allow all page types supported by lib/pagePassword (partner-edit, hashtag added per audit #368)
    const allowedPageTypes = ['event-report', 'partner-report', 'organization-report', 'edit', 'partner-edit', 'organization-edit', 'filter', 'hashtag'];
    if (!allowedPageTypes.includes(pageType)) {
      return NextResponse.json(
        { success: false, error: `Invalid pageType. Must be one of: ${allowedPageTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Admin bypass: if request has a valid admin session, accept immediately
    const admin = await getAdminUser()
    if (admin) {
      // The guard accepts an admin session directly, so this grant is not what
      // authorises them — it keeps the client's stored state consistent with the
      // password path so both routes behave identically downstream.
      const adminCookies = await cookies();
      const adminResponse = NextResponse.json({
        success: true,
        isValid: true,
        isAdmin: true,
        message: 'Admin session accepted'
      })
      adminResponse.cookies.set(
        PAGE_ACCESS_COOKIE,
        mintPageAccessToken(adminCookies.get(PAGE_ACCESS_COOKIE)?.value, pageType, pageId),
        pageAccessCookieOptions()
      );
      return adminResponse;
    }

    logInfo('Validating password for page', { context: 'page-passwords', pageType, pageIdPrefix: pageId.substring(0, 8) });

    // Validate password (admin or page-specific)
    const validation = await validateAnyPassword(pageId, pageType as PageType, password);

    if (validation.isValid) {
      logInfo('Password validation successful', { context: 'page-passwords', pageType, isAdmin: validation.isAdmin, pageIdPrefix: pageId.substring(0, 8) });

      // WHAT: Issue a signed, HttpOnly grant for this page.
      // WHY: Until now a correct password produced only a JSON `isValid: true`,
      //     which the browser recorded in sessionStorage. The server kept no proof,
      //     so the APIs behind the page could not tell an authorised visitor from
      //     anyone else — and did not try (F-001). This cookie is that proof.
      const cookieStore = await cookies();
      const existing = cookieStore.get(PAGE_ACCESS_COOKIE)?.value;
      const grantToken = mintPageAccessToken(existing, pageType, pageId);

      const okResponse = NextResponse.json({
        success: true,
        isValid: true,
        isAdmin: validation.isAdmin,
        message: validation.isAdmin ? 'Admin password accepted' : 'Page password accepted'
      });
      okResponse.cookies.set(PAGE_ACCESS_COOKIE, grantToken, pageAccessCookieOptions());
      return okResponse;
    } else {
      logWarn('Password validation failed', { context: 'page-passwords', pageType, pageIdPrefix: pageId.substring(0, 8) });
      
      return NextResponse.json({
        success: false,
        isValid: false,
        isAdmin: false,
        error: 'Invalid password'
      }, { status: 401 });
    }

  } catch (error) {
    logError('Failed to validate page password', { context: 'page-passwords', pageType: pageType || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate password' 
      },
      { status: 500 }
    );
  }
}
