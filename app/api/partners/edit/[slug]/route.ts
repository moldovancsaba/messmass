// WHAT: API endpoint to fetch partner data for editing (partner-level content only)
// WHY: Enable partner-level editing of text and image content while keeping math data from events

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // WHAT: Await params Promise (Next.js 15 requirement)
    // WHY: Next.js 15 changed params to async to support edge runtime
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    // WHAT: Validate UUID format (MongoDB ObjectId)
    // WHY: Prevent slug-based URL guessing attacks
    // HOW: Reject any non-ObjectId format slugs
    if (!ObjectId.isValid(slug)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID format - UUID required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);

    // WHAT: Find partner by _id (UUID only, no viewSlug)
    // WHY: Enforce UUID-only URLs for security (prevent URL guessing)
    const partner = await db.collection('partners').findOne({ _id: new ObjectId(slug) });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // WHAT: Return partner data with stats structure for content editing
    // WHY: Partner editor needs same structure as event editor but only for content fields
    // HOW: Initialize empty stats object if none exists, preserve existing content
    const partnerData = {
      _id: partner._id.toString(),
      name: partner.name,
      emoji: partner.emoji,
      logoUrl: partner.logoUrl,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      styleId: partner.styleId ? partner.styleId.toString() : undefined,
      reportTemplateId: partner.reportTemplateId ? partner.reportTemplateId.toString() : undefined,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      // WHAT: Partner stats for content editing (reportText*, reportImage*)
      // WHY: Store partner-level customizations separate from event aggregation
      // HOW: Initialize empty object if no stats exist, preserve existing content
      stats: partner.stats || {}
    };

    return NextResponse.json({
      success: true,
      partner: partnerData
    });
  } catch (error) {
    console.error('Failed to fetch partner for editing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch partner for editing' 
      },
      { status: 500 }
    );
  }
}