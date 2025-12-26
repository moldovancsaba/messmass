// WHAT: API endpoint for individual partner retrieval
// WHY: Support partner detail page and Google Sheets integration setup
// Route: /api/partners/[id]

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    // WHAT: Fetch individual partner by ID
    // WHY: Support detail page loading and Google Sheets section initialization
    const partner = await db.collection('partners').findOne({
      _id: new ObjectId(id)
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // WHAT: Transform partner document for client
    // WHY: Ensure consistent field naming (camelCase per WARP.md) and ObjectId serialization
    const transformedPartner = {
      _id: partner._id.toString(),
      name: partner.name,
      emoji: partner.emoji,
      logoUrl: partner.logoUrl,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      bitlyLinks: partner.bitlyLinks || [],
      sportsDb: partner.sportsDb,
      styleId: partner.styleId?.toString(),
      reportTemplateId: partner.reportTemplateId?.toString(),
      viewSlug: partner.viewSlug,
      googleSheetConfig: partner.googleSheetConfig,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt
    };

    return NextResponse.json({
      success: true,
      partner: transformedPartner
    });
  } catch (error) {
    console.error('Failed to fetch partner:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch partner' 
      },
      { status: 500 }
    );
  }
}
