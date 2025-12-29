import { NextRequest, NextResponse } from 'next/server';
import { generateShareableLink, getOrCreatePagePassword, validateAnyPassword } from '@/lib/pagePassword';
import { PageType } from '@/lib/pagePassword';
import { getAdminUser } from '@/lib/auth';
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
  try {
    const body = await request.json();
    const { pageId, pageType, regenerate = false } = body;

    if (!pageId || !pageType) {
      return NextResponse.json(
        { success: false, error: 'pageId and pageType are required' },
        { status: 400 }
      );
    }

    if (!['event-report', 'partner-report', 'edit', 'filter'].includes(pageType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pageType. Must be event-report, partner-report, edit, or filter' },
        { status: 400 }
      );
    }

    logInfo('Generating password for page', { context: 'page-passwords', pageType, pageIdPrefix: pageId.substring(0, 8) });

    // Generate or retrieve password
    const pagePassword = await getOrCreatePagePassword(pageId, pageType as PageType, regenerate);

    // Get base URL from request headers
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;

    // Generate shareable link
    const shareableLink = await generateShareableLink(pageId, pageType as PageType, baseUrl);

    logInfo('Generated password for page successfully', { context: 'page-passwords', pageType, pageIdPrefix: pageId.substring(0, 8) });

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
    logError('Failed to generate page password', { context: 'page-passwords', pageType: pageType || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
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

    if (!['event-report', 'partner-report', 'edit', 'filter'].includes(pageType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pageType. Must be event-report, partner-report, edit, or filter' },
        { status: 400 }
      );
    }

    // Admin bypass: if request has a valid admin session, accept immediately
    const admin = await getAdminUser()
    if (admin) {
      return NextResponse.json({
        success: true,
        isValid: true,
        isAdmin: true,
        message: 'Admin session accepted'
      })
    }

    logInfo('Validating password for page', { context: 'page-passwords', pageType, pageIdPrefix: pageId.substring(0, 8) });

    // Validate password (admin or page-specific)
    const validation = await validateAnyPassword(pageId, pageType as PageType, password);

    if (validation.isValid) {
      logInfo('Password validation successful', { context: 'page-passwords', pageType, isAdmin: validation.isAdmin, pageIdPrefix: pageId.substring(0, 8) });
      
      return NextResponse.json({
        success: true,
        isValid: true,
        isAdmin: validation.isAdmin,
        message: validation.isAdmin ? 'Admin password accepted' : 'Page password accepted'
      });
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
