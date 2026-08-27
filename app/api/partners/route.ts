// WHAT: API endpoint for partners - GET (list partners) and PUT (update partner data)
// WHY: Handle both listing partners for admin and saving partner-level content changes

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import config from '@/lib/config';
import { error as logError, info as logInfo } from '@/lib/logger';
import { generateUniquePartnerViewSlug } from '@/lib/partnerIdentifier';
import { syncPartnerToV3Entity } from '@/lib/v3/syncEngine';
import { requirePartnerWrite, requireSession } from '@/lib/apiGuards';

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

    // WHAT: Resolve each partner's bitlyLinkIds to displayable link objects.
    // WHY: bitlyLinkIds (maintained by /api/bitly/partners/associate and now
    // by PUT below) is the real association; the stored `bitlyLinks` field is
    // a vestigial [] written once at creation and never since, so the edit
    // form always showed zero links regardless of actual associations.
    const allLinkIds = partners.flatMap(partner =>
      Array.isArray(partner.bitlyLinkIds) ? partner.bitlyLinkIds : []
    );
    const linkDocs = allLinkIds.length
      ? await db.collection('bitly_links')
          .find({ _id: { $in: allLinkIds } })
          .project({ bitlink: 1, title: 1, long_url: 1 })
          .toArray()
      : [];
    const linksById = new Map(linkDocs.map(link => [link._id.toString(), link]));

    // Transform partners for response
    const transformedPartners = partners.map(partner => ({
      _id: partner._id.toString(),
      name: partner.name,
      emoji: partner.emoji,
      showEmoji: partner.showEmoji ?? true,
      logoUrl: partner.logoUrl,
      hashtags: partner.hashtags || [],
      categorizedHashtags: partner.categorizedHashtags || {},
      bitlyLinks: (Array.isArray(partner.bitlyLinkIds) ? partner.bitlyLinkIds : [])
        .map((id: ObjectId) => {
          const link = linksById.get(id.toString());
          return link
            ? { _id: link._id.toString(), bitlink: link.bitlink || '', title: link.title || 'Untitled', long_url: link.long_url || '' }
            : null;
        })
        .filter(Boolean),
      sportsDb: partner.sportsDb,
      styleId: partner.styleId?.toString(),
      reportTemplateId: partner.reportTemplateId?.toString(),
      clickerSetId: partner.clickerSetId?.toString(),
      googleSheetsUrl: partner.googleSheetsUrl,
      viewSlug: partner.viewSlug,
      showEventsList: partner.showEventsList ?? true, // Default to true for backward compatibility
      showEventsListTitle: partner.showEventsListTitle ?? true, // Default to true for backward compatibility
      showEventsListDetails: partner.showEventsListDetails ?? true, // Default to true for backward compatibility
      showOnlyTeam1Events: partner.showOnlyTeam1Events ?? false,
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
    const { partnerId, name, emoji, showEmoji, logoUrl, hashtags, categorizedHashtags, stats, styleId, reportTemplateId, googleSheetsUrl, clickerSetId, sportsDb, bitlyLinkIds, showEventsList, showEventsListTitle, showEventsListDetails, showOnlyTeam1Events } = body;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);

    // F-009 straggler: this route shipped with CSRF as its only barrier, and
    // CSRF is not authentication. Admin session OR a partner-edit page
    // password grant for this specific partner — the partner editor saves
    // through here and authenticates by page password, not session.
    const denied = await requirePartnerWrite(db as any, String(partnerId));
    if (denied) return denied;

    // WHAT: Build update object with only provided fields
    // WHY: Allow partial updates without overwriting other partner data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (emoji !== undefined) updateData.emoji = emoji;
    if (showEmoji !== undefined) updateData.showEmoji = Boolean(showEmoji);
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    // sportsDb: an object links/updates the team, explicit null unlinks it.
    // The edit modal always sends this field, so absence means "no change".
    if (sportsDb !== undefined) updateData.sportsDb = sportsDb || null;
    // bitlyLinkIds: wholesale replacement of the association list from the
    // edit form's selector (the same field /api/bitly/partners/associate
    // maintains incrementally). Invalid ids are dropped, not rejected.
    if (bitlyLinkIds !== undefined) {
      updateData.bitlyLinkIds = (Array.isArray(bitlyLinkIds) ? bitlyLinkIds : [])
        .filter((id: unknown): id is string => typeof id === 'string' && ObjectId.isValid(id))
        .map((id: string) => new ObjectId(id));
    }
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (categorizedHashtags !== undefined) updateData.categorizedHashtags = categorizedHashtags;
    if (stats !== undefined) updateData.stats = stats;
    if (styleId !== undefined) updateData.styleId = styleId ? new ObjectId(styleId) : null;
    if (reportTemplateId !== undefined) updateData.reportTemplateId = reportTemplateId ? new ObjectId(reportTemplateId) : null;
    if (clickerSetId !== undefined) updateData.clickerSetId = clickerSetId ? new ObjectId(clickerSetId) : null;
    if (googleSheetsUrl !== undefined) updateData.googleSheetsUrl = googleSheetsUrl || null;
    if (showEventsList !== undefined) updateData.showEventsList = showEventsList;
    if (showEventsListTitle !== undefined) updateData.showEventsListTitle = showEventsListTitle;
    if (showEventsListDetails !== undefined) updateData.showEventsListDetails = showEventsListDetails;
    if (showOnlyTeam1Events !== undefined) updateData.showOnlyTeam1Events = showOnlyTeam1Events;

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

    // WHAT: Sync to V3
    // WHY: Ensure V3 Entity is updated when legacy Partner is edited
    try {
      const updatedPartner = await db.collection('partners').findOne({ _id: new ObjectId(partnerId) });
      if (updatedPartner) {
        await syncPartnerToV3Entity(updatedPartner);
      }
    } catch (err) {
      logError('V3 Sync failed after partner update', { context: 'partners', partnerId }, err as Error);
    }

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
  const denied = await requireSession();
  if (denied) return denied;

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

    const viewSlug = await generateUniquePartnerViewSlug(db as any);

    const partnerData: any = {
      name,
      emoji,
      hashtags: hashtags || [],
      categorizedHashtags: categorizedHashtags || {},
      bitlyLinkIds: (Array.isArray(bitlyLinkIds) ? bitlyLinkIds : [])
        .filter((id: unknown): id is string => typeof id === 'string' && ObjectId.isValid(id))
        .map((id: string) => new ObjectId(id)),
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

    // WHAT: Sync to V3
    // WHY: Ensure new partner is immediately available in V3
    syncPartnerToV3Entity({ ...partnerData, _id: result.insertedId }).catch(err => {
      logError('V3 Sync failed for new partner', { context: 'partners', partnerId: result.insertedId.toString() }, err);
    });

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
  const denied = await requireSession();
  if (denied) return denied;

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
