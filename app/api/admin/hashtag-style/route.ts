// WHAT: API endpoint for managing hashtag report styles
// WHY: Allow admins to assign custom styles to hashtag reports  
// HOW: Store styleId in hashtag_slugs collection

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

/**
 * GET /api/admin/hashtag-style?hashtag=xxx
 * 
 * WHAT: Fetch the styleId for a specific hashtag
 * WHY: Load persisted style when viewing/editing hashtag
 * HOW: Query hashtag_slugs collection by hashtag name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtag = searchParams.get('hashtag');
    
    if (!hashtag) {
      return NextResponse.json({
        success: false,
        error: 'Hashtag parameter is required'
      }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const hashtagSlugsCollection = db.collection('hashtag_slugs');
    
    const record = await hashtagSlugsCollection.findOne({ hashtag });
    
    return NextResponse.json({
      success: true,
      styleId: record?.styleId || null,
      slug: record?.slug || null
    });
  } catch (error) {
    console.error('[admin/hashtag-style GET] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch hashtag style'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/hashtag-style
 * 
 * WHAT: Save/update styleId for a hashtag
 * WHY: Persist style assignment for hashtag reports
 * HOW: Upsert hashtag_slugs record with styleId
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hashtag, styleId } = body;
    
    if (!hashtag) {
      return NextResponse.json({
        success: false,
        error: 'Hashtag is required'
      }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const hashtagSlugsCollection = db.collection('hashtag_slugs');
    
    // WHAT: Upsert - create if doesn't exist, update if exists
    // WHY: Handles both new and existing hashtag slug records
    const result = await hashtagSlugsCollection.updateOne(
      { hashtag },
      {
        $set: {
          styleId: styleId || null,
          updatedAt: new Date()
        },
        $setOnInsert: {
          slug: hashtag, // Use hashtag as slug if creating new record
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Saved styleId for hashtag "${hashtag}":`, styleId || 'null');
    
    return NextResponse.json({
      success: true,
      modified: result.modifiedCount,
      upserted: result.upsertedCount
    });
  } catch (error) {
    console.error('[admin/hashtag-style POST] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save hashtag style'
    }, { status: 500 });
  }
}
