// app/api/bitly/partners/associate/route.ts
// WHAT: API endpoints for managing Bitly link-partner associations
// WHY: Enables bidirectional relationship management from Bitly admin page
// ENDPOINTS:
//   POST - Associate a Bitly link with a partner
//   DELETE - Remove Bitly link from partner association

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

/**
 * POST /api/bitly/partners/associate
 * WHAT: Associate a Bitly link with a partner
 * WHY: Enables bidirectional relationship management from Bitly page
 * 
 * AUTH: Admin only
 * BODY: { bitlyLinkId: string, partnerId: string }
 * 
 * BIDIRECTIONAL SYNC: Adds bitlyLinkId to partners.bitlyLinkIds array
 */
export async function POST(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Only admins can manage partner-link associations
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Parse and validate request body
    const body = await request.json();
    const { bitlyLinkId, partnerId } = body;

    if (!bitlyLinkId || !partnerId) {
      return NextResponse.json(
        { success: false, error: 'bitlyLinkId and partnerId are required' },
        { status: 400 }
      );
    }

    // WHAT: Validate ObjectIds
    // WHY: Ensure both IDs are valid MongoDB ObjectIds
    if (!ObjectId.isValid(bitlyLinkId) || !ObjectId.isValid(partnerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bitlyLinkId or partnerId format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    // WHAT: Verify both records exist
    // WHY: Prevent creating orphaned associations
    const link = await db.collection('bitly_links').findOne({ _id: new ObjectId(bitlyLinkId) });
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Bitly link not found' },
        { status: 404 }
      );
    }

    const partner = await db.collection('partners').findOne({ _id: new ObjectId(partnerId) });
    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // WHAT: Add bitlyLinkId to partner's bitlyLinkIds array using $addToSet
    // WHY: $addToSet prevents duplicate entries automatically
    const result = await db.collection('partners').updateOne(
      { _id: new ObjectId(partnerId) },
      {
        $addToSet: { bitlyLinkIds: new ObjectId(bitlyLinkId) },
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update partner' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bitly link associated with partner successfully',
    });

  } catch (error) {
    console.error('[POST /api/bitly/partners/associate] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bitly/partners/associate
 * WHAT: Remove Bitly link from partner association
 * WHY: Allows removing relationships from Bitly page
 * 
 * AUTH: Admin only
 * QUERY: ?bitlyLinkId=xxx&partnerId=yyy
 * 
 * BIDIRECTIONAL SYNC: Removes bitlyLinkId from partners.bitlyLinkIds array
 */
export async function DELETE(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Extract query parameters
    const { searchParams } = new URL(request.url);
    const bitlyLinkId = searchParams.get('bitlyLinkId');
    const partnerId = searchParams.get('partnerId');

    if (!bitlyLinkId || !partnerId) {
      return NextResponse.json(
        { success: false, error: 'bitlyLinkId and partnerId are required' },
        { status: 400 }
      );
    }

    // WHAT: Validate ObjectIds
    if (!ObjectId.isValid(bitlyLinkId) || !ObjectId.isValid(partnerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bitlyLinkId or partnerId format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    // WHAT: Remove bitlyLinkId from partner's bitlyLinkIds array using $pull
    // WHY: $pull safely removes matching elements from array
    const result = await db.collection('partners').updateOne(
      { _id: new ObjectId(partnerId) },
      {
        $pull: { bitlyLinkIds: new ObjectId(bitlyLinkId) } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Partner association removed successfully',
    });

  } catch (error) {
    console.error('[DELETE /api/bitly/partners/associate] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
