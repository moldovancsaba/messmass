import { NextRequest, NextResponse } from 'next/server';
import { generateShareableLink, getOrCreatePagePassword, validateAnyPassword } from '@/lib/pagePassword';
import { PageType } from '@/lib/pagePassword';
import { getAdminUser } from '@/lib/auth';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

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

    if (!['stats', 'edit', 'filter'].includes(pageType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pageType. Must be stats, edit, or filter' },
        { status: 400 }
      );
    }

    console.log(`🔐 Generating password for ${pageType} page:`, pageId.substring(0, 8) + '...');

    // Generate or retrieve password
    const pagePassword = await getOrCreatePagePassword(pageId, pageType as PageType, regenerate);

    // Get base URL from request headers
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Generate shareable link
    const shareableLink = await generateShareableLink(pageId, pageType as PageType, baseUrl);

    console.log(`✅ Generated password for ${pageType} page successfully`);

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
    console.error('❌ Failed to generate page password:', error);
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
  try {
    const body = await request.json();
    const { pageId, pageType, password } = body;

    if (!pageId || !pageType || !password) {
      return NextResponse.json(
        { success: false, error: 'pageId, pageType, and password are required' },
        { status: 400 }
      );
    }

    if (!['stats', 'edit', 'filter'].includes(pageType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pageType. Must be stats, edit, or filter' },
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

    console.log(`🔍 Validating password for ${pageType} page:`, pageId.substring(0, 8) + '...');

    // Validate password (admin or page-specific)
    const validation = await validateAnyPassword(pageId, pageType as PageType, password);

    if (validation.isValid) {
      console.log(`✅ Password validation successful for ${pageType} page (${validation.isAdmin ? 'admin' : 'page-specific'})`);
      
      return NextResponse.json({
        success: true,
        isValid: true,
        isAdmin: validation.isAdmin,
        message: validation.isAdmin ? 'Admin password accepted' : 'Page password accepted'
      });
    } else {
      console.log(`❌ Password validation failed for ${pageType} page`);
      
      return NextResponse.json({
        success: false,
        isValid: false,
        isAdmin: false,
        error: 'Invalid password'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('❌ Failed to validate page password:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate password' 
      },
      { status: 500 }
    );
  }
}
