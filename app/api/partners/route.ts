// app/api/partners/route.ts
// WHAT: API endpoints for partner management (CRUD operations)
// WHY: Manage organizations that own/operate events (clubs, federations, venues, brands)
// ENDPOINTS:
//   POST - Create new partner
//   GET - List partners with pagination, search, and sorting
//   PUT - Update existing partner
//   DELETE - Remove partner

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import type { CreatePartnerInput, UpdatePartnerInput, PartnerResponse } from '@/lib/partner.types';

/**
 * POST /api/partners
 * WHAT: Create a new partner
 * WHY: Add organizations to the system
 * 
 * AUTH: Admin only
 * BODY: CreatePartnerInput
 */
export async function POST(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Only admins can create partners
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Parse and validate request body
    const body = await request.json() as CreatePartnerInput;
    const { name, emoji, hashtags, categorizedHashtags, bitlyLinkIds, sportsDb, logoUrl } = body;

    if (!name || !emoji) {
      return NextResponse.json(
        { success: false, error: 'Name and emoji are required' },
        { status: 400 }
      );
    }

    // WHAT: Convert bitlyLinkIds to ObjectIds
    // WHY: MongoDB stores ObjectId references
    const bitlyObjectIds = bitlyLinkIds?.map(id => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid bitlyLinkId: ${id}`);
      }
      return new ObjectId(id);
    });

    // WHAT: Create partner document
    const now = new Date().toISOString();
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    const partnerDoc = {
      name: name.trim(),
      emoji: emoji.trim(),
      hashtags: hashtags || [],
      categorizedHashtags: categorizedHashtags || {},
      bitlyLinkIds: bitlyObjectIds || [],
      logoUrl: logoUrl || undefined, // Include ImgBB logo URL if provided
      sportsDb: sportsDb || undefined, // Include TheSportsDB enrichment data if provided
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('partners').insertOne(partnerDoc);

    // WHAT: Fetch inserted document with populated Bitly links
    // WHY: Return full partner data to client
    const insertedPartner = await db.collection('partners').findOne({ _id: result.insertedId });
    
    if (!insertedPartner) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve created partner' },
        { status: 500 }
      );
    }

    // WHAT: Populate Bitly links
    const populatedPartner = await populateBitlyLinks(db, insertedPartner);

    return NextResponse.json({
      success: true,
      partner: populatedPartner,
      message: 'Partner created successfully',
    });

  } catch (error) {
    console.error('[POST /api/partners] Error:', error);
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
 * GET /api/partners
 * WHAT: List partners with optional filtering and sorting
 * WHY: Display partners in admin UI with search and pagination
 * 
 * AUTH: Admin only
 * QUERY PARAMS:
 *   - search: Search term (filters by name, hashtags)
 *   - limit: Pagination limit (default: 50)
 *   - offset: Pagination offset (default: 0)
 *   - sortField: Field to sort by (name | createdAt | updatedAt)
 *   - sortOrder: Sort direction (asc | desc)
 */
export async function GET(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Partner data is sensitive
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Parse query parameters
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortField = searchParams.get('sortField') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // WHAT: Build query filter
    const filter: any = {};

    // WHAT: Add search filter if provided
    // WHY: Allow searching through partner names and hashtags
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = { $regex: searchQuery.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { hashtags: searchRegex },
      ];
    }

    // WHAT: Build sort options
    let sortOptions: any = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'name':
        sortOptions = { name: order };
        break;
      case 'createdAt':
        sortOptions = { createdAt: order };
        break;
      case 'updatedAt':
        sortOptions = { updatedAt: order };
        break;
      default:
        sortOptions = { name: 1 }; // Default to name ascending
        break;
    }

    // WHAT: Query database with pagination and sorting
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    const partners = await db
      .collection('partners')
      .find(filter)
      .sort(sortOptions)
      .skip(offset)
      .limit(limit)
      .toArray();

    // WHAT: Count total matching documents
    const total = await db.collection('partners').countDocuments(filter);

    // WHAT: Populate Bitly links for each partner
    // WHY: Client needs full link details for display
    const populatedPartners = await Promise.all(
      partners.map(partner => populateBitlyLinks(db, partner))
    );

    return NextResponse.json({
      success: true,
      partners: populatedPartners,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('[GET /api/partners] Error:', error);
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
 * PUT /api/partners
 * WHAT: Update an existing partner
 * WHY: Allow editing partner details
 * 
 * AUTH: Admin only
 * BODY: UpdatePartnerInput
 */
export async function PUT(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Parse and validate request body
    const body = await request.json() as UpdatePartnerInput;
    const { partnerId, name, emoji, hashtags, categorizedHashtags, bitlyLinkIds, sportsDb, logoUrl } = body;

    if (!partnerId || !ObjectId.isValid(partnerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partnerId' },
        { status: 400 }
      );
    }

    // WHAT: Build update document
    const updateDoc: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateDoc.name = name.trim();
    if (emoji !== undefined) updateDoc.emoji = emoji.trim();
    if (hashtags !== undefined) updateDoc.hashtags = hashtags;
    if (categorizedHashtags !== undefined) updateDoc.categorizedHashtags = categorizedHashtags;
    
    // WHAT: Update TheSportsDB enrichment data if provided
    // WHY: Allow linking/unlinking partners to sports teams
    if (sportsDb !== undefined) updateDoc.sportsDb = sportsDb;
    
    // WHAT: Update logo URL if provided (from ImgBB upload)
    // WHY: Display partner logo in UI
    if (logoUrl !== undefined) updateDoc.logoUrl = logoUrl;
    
    // WHAT: Convert bitlyLinkIds to ObjectIds if provided
    if (bitlyLinkIds !== undefined) {
      updateDoc.bitlyLinkIds = bitlyLinkIds.map(id => {
        if (!ObjectId.isValid(id)) {
          throw new Error(`Invalid bitlyLinkId: ${id}`);
        }
        return new ObjectId(id);
      });
    }

    // WHAT: Update partner in database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    const result = await db.collection('partners').updateOne(
      { _id: new ObjectId(partnerId) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    // WHAT: Fetch updated partner with populated links
    const updatedPartner = await db.collection('partners').findOne({ _id: new ObjectId(partnerId) });
    
    if (!updatedPartner) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve updated partner' },
        { status: 500 }
      );
    }

    const populatedPartner = await populateBitlyLinks(db, updatedPartner);

    return NextResponse.json({
      success: true,
      partner: populatedPartner,
      message: 'Partner updated successfully',
    });

  } catch (error) {
    console.error('[PUT /api/partners] Error:', error);
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
 * DELETE /api/partners
 * WHAT: Delete a partner
 * WHY: Remove organizations from the system
 * 
 * AUTH: Admin only
 * QUERY: partnerId=<id>
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

    // WHAT: Parse partnerId from query
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId || !ObjectId.isValid(partnerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partnerId' },
        { status: 400 }
      );
    }

    // WHAT: Delete partner from database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    const result = await db.collection('partners').deleteOne({ _id: new ObjectId(partnerId) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Partner deleted successfully',
    });

  } catch (error) {
    console.error('[DELETE /api/partners] Error:', error);
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
 * WHAT: Helper function to populate Bitly links in partner document
 * WHY: Transform database document to API response format with full link details
 */
async function populateBitlyLinks(db: any, partner: any): Promise<PartnerResponse> {
  // WHAT: Fetch Bitly links if partner has any
  let bitlyLinks = [];
  if (partner.bitlyLinkIds && partner.bitlyLinkIds.length > 0) {
    const links = await db
      .collection('bitly_links')
      .find({ _id: { $in: partner.bitlyLinkIds } })
      .project({ _id: 1, bitlink: 1, title: 1, long_url: 1 })
      .toArray();
    
    bitlyLinks = links.map((link: any) => ({
      _id: link._id.toString(),
      bitlink: link.bitlink,
      title: link.title,
      long_url: link.long_url,
    }));
  }

  // WHAT: Transform to client response format
  return {
    _id: partner._id.toString(),
    name: partner.name,
    emoji: partner.emoji,
    hashtags: partner.hashtags || [],
    categorizedHashtags: partner.categorizedHashtags || {},
    bitlyLinks,
    logoUrl: partner.logoUrl, // WHAT: Include ImgBB-hosted logo URL
    sportsDb: partner.sportsDb, // WHAT: Include TheSportsDB enrichment data
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt,
  };
}
