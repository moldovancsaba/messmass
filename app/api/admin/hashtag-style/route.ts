import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

/**
 * Hashtag Style Assignment API
 *
 * Collection: 'hashtagStyles'
 * Document: { _id: string (normalized hashtag), styleId: string, updatedAt: string }
 */

interface HashtagStyleDoc {
  _id: string; // normalized hashtag
  styleId: string;
  updatedAt: string;
}

// GET /api/admin/hashtag-style
// - Without params: returns all assignments
// - With ?hashtag=tag: returns assignment for that hashtag
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('hashtag');

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const col = db.collection<HashtagStyleDoc>('hashtagStyles');

    if (tag) {
      const _id = tag.toLowerCase();
      const doc = await col.findOne({ _id });
      return NextResponse.json({ success: true, assignment: doc || null });
    }

    const all = await col.find({}).sort({ updatedAt: -1 }).toArray();
    return NextResponse.json({ success: true, assignments: all });
  } catch (error) {
    console.error('❌ Failed to load hashtag style assignments:', error);
    return NextResponse.json({ success: false, error: 'Failed to load hashtag style assignments' }, { status: 500 });
  }
}

// POST /api/admin/hashtag-style
// body: { hashtag: string, styleId: string|null }
export async function POST(request: NextRequest) {
  try {
    const { hashtag, styleId } = await request.json();
    if (!hashtag || typeof hashtag !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid hashtag' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const col = db.collection<HashtagStyleDoc>('hashtagStyles');
    const pageStyles = db.collection('pageStyles');

    // Validate styleId if provided
    if (styleId && styleId !== 'null') {
      if (!ObjectId.isValid(styleId)) {
        return NextResponse.json({ success: false, error: 'Invalid styleId' }, { status: 400 });
      }
      const exists = await pageStyles.findOne({ _id: new ObjectId(styleId) });
      if (!exists) {
        return NextResponse.json({ success: false, error: 'Style not found' }, { status: 404 });
      }
    }

    const now = new Date().toISOString();
    const _id = hashtag.toLowerCase();

    if (!styleId || styleId === 'null') {
      // Clear assignment
      await col.deleteOne({ _id });
      return NextResponse.json({ success: true, assignment: null, cleared: true });
    }

    await col.updateOne(
      { _id },
      { 
        $set: { styleId, updatedAt: now },
        $setOnInsert: { _id }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, assignment: { _id, styleId, updatedAt: now } });
  } catch (error) {
    console.error('❌ Failed to set hashtag style:', error);
    return NextResponse.json({ success: false, error: 'Failed to set hashtag style' }, { status: 500 });
  }
}

