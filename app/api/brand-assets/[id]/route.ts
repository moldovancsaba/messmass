// app/api/brand-assets/[id]/route.ts
// WHAT: Delete or update a single brand asset.

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(config.dbName);

    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { canonicalSlug: id };

    await db.collection('brand_assets').deleteOne(query);
    try {
      await client.db('messmass').collection('brand_assets').deleteOne(query);
    } catch {
      // Best effort
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Failed to delete brand asset:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
