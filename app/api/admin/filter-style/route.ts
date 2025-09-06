import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

// GET /api/admin/filter-style?hashtags=a,b,c
// Returns persisted styleId for a saved hashtag combination (if any)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hashtagsParam = searchParams.get('hashtags');
    if (!hashtagsParam) {
      return NextResponse.json({ success: false, error: 'hashtags param is required' }, { status: 400 });
    }

    // Normalize — we must ensure the exact same normalization is used everywhere
    // so lookups work regardless of input order/case/spacing.
    const hashtags = hashtagsParam
      .split(',')
      .map(h => h.toLowerCase().trim())
      .filter(Boolean)
      .sort();

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);

    // Using filter_slugs to keep a single source of truth for combo -> style mapping.
    const collection = db.collection('filter_slugs');

    const doc = await collection.findOne({ hashtags: { $eq: hashtags } });
    return NextResponse.json({ success: true, styleId: doc?.styleId || null });
  } catch (error) {
    console.error('❌ Failed to fetch filter style assignment:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch filter style' }, { status: 500 });
  }
}

// POST /api/admin/filter-style
// body: { hashtags: string[], styleId: string | null }
// Purpose: Persist the selected style for a specific hashtag combination WITHOUT
// forcing the creation of a share slug manually. We still use the same
// collection (filter_slugs) to avoid divergent sources of truth.
export async function POST(request: NextRequest) {
  try {
    const { hashtags, styleId } = await request.json();

    if (!Array.isArray(hashtags) || hashtags.length === 0) {
      return NextResponse.json({ success: false, error: 'hashtags array is required' }, { status: 400 });
    }

    // Normalize input consistently (lowercase, trim, sort)
    const normalized = hashtags
      .map((h: string) => h.toLowerCase().trim())
      .filter(Boolean)
      .sort();

    const client = await clientPromise;
    const db = client.db(MONGODB_DB);
    const col = db.collection('filter_slugs');

    // Validate styleId only if provided (allow null to clear)
    let styleObjectId: ObjectId | null = null;
    if (styleId) {
      try {
        styleObjectId = new ObjectId(styleId);
        // Ensure style exists
        const exists = await db.collection('pageStyles').findOne({ _id: styleObjectId });
        if (!exists) {
          return NextResponse.json({ success: false, error: 'Style not found' }, { status: 404 });
        }
      } catch {
        return NextResponse.json({ success: false, error: 'Invalid styleId' }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    // Try update first. If not found, insert new with a generated slug
    const existing = await col.findOne({ hashtags: { $eq: normalized } });

    if (existing) {
      // Update styleId and timestamp on the existing combo
      await col.updateOne(
        { _id: (existing as any)._id },
        { $set: { styleId: styleId ?? null, lastAccessed: now } }
      );
      return NextResponse.json({ success: true, slug: existing.slug, styleId: styleId ?? null });
    }

    // If no doc exists, create one with a UUID slug
    // We reuse slug generation logic from lib/slugUtils via route /api/filter-slug,
    // but here we inline a minimal creation path to avoid an extra request.
    const { v4: uuidv4 } = await import('uuid');
    const slug = uuidv4();

    await col.insertOne({
      slug,
      hashtags: normalized,
      styleId: styleId ?? null,
      createdAt: now,
      lastAccessed: now
    });

    return NextResponse.json({ success: true, slug, styleId: styleId ?? null });
  } catch (error) {
    console.error('❌ Failed to set filter style assignment:', error);
    return NextResponse.json({ success: false, error: 'Failed to save filter style' }, { status: 500 });
  }
}

