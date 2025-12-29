import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { error as logError, info as logInfo } from '@/lib/logger';

// POST /api/admin/filter-style - Save style selection for filter combination
// WHAT: Update styleId for an existing filter hashtag combination
// WHY: Allow users to persist style choices without regenerating filter slugs
// HOW: Find filter by normalized hashtags, update styleId field
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hashtags, styleId } = body;

    // Validation
    if (!hashtags || !Array.isArray(hashtags)) {
      return NextResponse.json(
        { success: false, error: 'Hashtags array is required' },
        { status: 400 }
      );
    }

    if (hashtags.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one hashtag is required' },
        { status: 400 }
      );
    }

    // Normalize hashtags (lowercase, sorted) - same as generateFilterSlug
    const normalizedHashtags = hashtags
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0)
      .sort();

    if (normalizedHashtags.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid hashtags provided' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('filter_slugs');

    // Find existing filter combination
    const existingFilter = await collection.findOne({
      hashtags: { $eq: normalizedHashtags }
    });

    if (!existingFilter) {
      // If filter doesn't exist yet, create it with a temporary slug
      // This can happen if user selects style before clicking "Share Filter"
      const now = new Date().toISOString();
      await collection.insertOne({
        slug: '', // Will be populated when "Share Filter" is clicked
        hashtags: normalizedHashtags,
        styleId: styleId && styleId !== 'null' ? styleId : null,
        createdAt: now,
        lastAccessed: now
      });

      logInfo('Created new filter entry with style', { context: 'admin-filter-style', hashtags: normalizedHashtags, styleId });
      return NextResponse.json({ success: true, created: true });
    }

    // Update existing filter's styleId
    const updates: any = { 
      lastAccessed: new Date().toISOString(),
      styleId: styleId && styleId !== 'null' ? styleId : null
    };

    await collection.updateOne(
      { _id: existingFilter._id },
      { $set: updates }
    );

    logInfo('Updated filter style', { context: 'admin-filter-style', hashtags: normalizedHashtags, styleId });

    return NextResponse.json({ 
      success: true, 
      updated: true,
      styleId: updates.styleId 
    });

  } catch (error) {
    logError('Failed to save filter style', { context: 'admin-filter-style' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save filter style'
    }, { status: 500 });
  }
}

// GET /api/admin/filter-style?hashtags=tag1,tag2 - Retrieve style for filter
// WHAT: Fetch persisted styleId for a hashtag combination
// WHY: Allow filter page to remember user's style choice
// HOW: Query filter_slugs collection by normalized hashtags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtagsParam = searchParams.get('hashtags');

    if (!hashtagsParam) {
      return NextResponse.json(
        { success: false, error: 'Hashtags parameter is required' },
        { status: 400 }
      );
    }

    // Parse and normalize hashtags
    const hashtags = hashtagsParam.split(',')
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0)
      .sort();

    if (hashtags.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid hashtags provided' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('filter_slugs');

    // Find filter by normalized hashtags
    const filter = await collection.findOne({
      hashtags: { $eq: hashtags }
    });

    if (!filter) {
      return NextResponse.json({
        success: true,
        styleId: null, // No persisted style found
        hashtags
      });
    }

    return NextResponse.json({
      success: true,
      styleId: filter.styleId || null,
      hashtags
    });

  } catch (error) {
    logError('Failed to fetch filter style', { context: 'admin-filter-style' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch filter style'
    }, { status: 500 });
  }
}
