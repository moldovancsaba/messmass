// app/api/partners/upload-logo/route.ts
// WHAT: API endpoint for uploading partner logos to ImgBB
// WHY: Handle badge upload from TheSportsDB to permanent ImgBB hosting

import { NextRequest, NextResponse } from 'next/server';
import { uploadPartnerBadge, isImgBBConfigured } from '@/lib/imgbbApi';

/**
 * WHAT: Upload partner logo to ImgBB
 * WHY: Store partner badges on ImgBB CDN for permanent, reliable access
 * 
 * POST /api/partners/upload-logo
 * Body: { badgeUrl: string, partnerName: string }
 * Returns: { success: boolean, logoUrl?: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // WHAT: Parse request body
    const body = await request.json();
    const { badgeUrl, partnerName } = body;

    // WHAT: Validate required fields
    if (!badgeUrl || typeof badgeUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'badgeUrl is required and must be a string'
        },
        { status: 400 }
      );
    }

    if (!partnerName || typeof partnerName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'partnerName is required and must be a string'
        },
        { status: 400 }
      );
    }

    // WHAT: Check ImgBB API key configuration
    if (!isImgBBConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'ImgBB API key not configured'
        },
        { status: 500 }
      );
    }

    console.log(`🖼️  Uploading logo for partner: ${partnerName}`);
    console.log(`📥 Source URL: ${badgeUrl}`);

    // WHAT: Upload badge to ImgBB
    // WHY: Convert TheSportsDB badge to permanent ImgBB-hosted URL
    const logoUrl = await uploadPartnerBadge(badgeUrl, partnerName);

    if (!logoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload logo to ImgBB'
        },
        { status: 500 }
      );
    }

    console.log(`✅ Logo uploaded successfully: ${logoUrl}`);

    return NextResponse.json({
      success: true,
      logoUrl: logoUrl
    });

  } catch (error) {
    console.error('❌ Logo upload API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
