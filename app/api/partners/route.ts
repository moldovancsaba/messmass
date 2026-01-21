// WHAT: API endpoint for partners - GET (list partners) and PUT (update partner data)
// WHY: Handle both listing partners for admin and saving partner-level content changes

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { error as logError, info as logInfo } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortField = searchParams.get('sortField') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const search = searchParams.get('search') || '';

    const client = await clientPromise;
const db = client.db(config.dbName);

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { hashtags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    const sort: any = {};
    if (sortField && sortOrder) {
      sort[sortField] = sortOrder === 'asc' ? 1 : -1;
    }

    // Get total count
    const total = await db.collection('partners').countDocuments(query);

    // Get partners with pagination
    const partners = await db.collection('partners')
      .find(query)
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .toArray();

    // Transform partners for response
    const transformedPartners = partners.map(partner => ({
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
      clickerSetId: partner.clickerSetId?.toString(),
      googleSheetsUrl: partner.googleSheetsUrl,
      viewSlug: partner.viewSlug,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt
    }));

    return NextResponse.json({
      success: true,
      partners: transformedPartners,
      pagination: {
        total,
        offset,
        limit,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    logError('Failed to fetch partners', { context: 'partners' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch partners' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, name, emoji, logoUrl, hashtags, categorizedHashtags, stats, styleId, reportTemplateId, googleSheetsUrl, clickerSetId } = body;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);

    // WHAT: Build update object with only provided fields
    // WHY: Allow partial updates without overwriting other partner data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (categorizedHashtags !== undefined) updateData.categorizedHashtags = categorizedHashtags;
    if (stats !== undefined) updateData.stats = stats;
    if (styleId !== undefined) updateData.styleId = styleId ? new ObjectId(styleId) : null;
    if (reportTemplateId !== undefined) updateData.reportTemplateId = reportTemplateId ? new ObjectId(reportTemplateId) : null;
    if (clickerSetId !== undefined) updateData.clickerSetId = clickerSetId ? new ObjectId(clickerSetId) : null;
    if (googleSheetsUrl !== undefined) updateData.googleSheetsUrl = googleSheetsUrl || null;

    // WHAT: Update partner document
    // WHY: Persist partner-level content changes
    const result = await db.collection('partners').updateOne(
      { _id: new ObjectId(partnerId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    logInfo('Partner updated successfully', { context: 'partners', partnerId });

    return NextResponse.json({
      success: true,
      message: 'Partner updated successfully'
    });
  } catch (error) {
    logError('Failed to update partner', { context: 'partners' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update partner' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, emoji, hashtags, categorizedHashtags, bitlyLinkIds, styleId, reportTemplateId, sportsDb, logoUrl, googleSheetsUrl, clickerSetId } = body;

    if (!name || !emoji) {
      return NextResponse.json(
        { success: false, error: 'Name and emoji are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);

    // Generate viewSlug from name
    const viewSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const partnerData: any = {
      name,
      emoji,
      hashtags: hashtags || [],
      categorizedHashtags: categorizedHashtags || {},
      bitlyLinks: [],
      sportsDb: sportsDb || undefined,
      logoUrl: logoUrl || undefined,
      googleSheetsUrl: googleSheetsUrl || undefined,
      viewSlug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (styleId) partnerData.styleId = new ObjectId(styleId);
    if (reportTemplateId) partnerData.reportTemplateId = new ObjectId(reportTemplateId);
    if (clickerSetId) partnerData.clickerSetId = new ObjectId(clickerSetId);

    const result = await db.collection('partners').insertOne(partnerData);

    logInfo('Partner created successfully', { context: 'partners', partnerId: result.insertedId.toString(), partnerName: name });

    return NextResponse.json({
      success: true,
      partner: {
        _id: result.insertedId.toString(),
        ...partnerData
      }
    });
  } catch (error) {
    logError('Failed to create partner', { context: 'partners' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create partner' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);

    const result = await db.collection('partners').deleteOne({
      _id: new ObjectId(partnerId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    logInfo('Partner deleted successfully', { context: 'partners', partnerId });

    return NextResponse.json({
      success: true,
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    logError('Failed to delete partner', { context: 'partners' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete partner' 
      },
      { status: 500 }
    );
  }
}
