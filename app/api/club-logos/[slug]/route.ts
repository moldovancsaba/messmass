// app/api/club-logos/[slug]/route.ts
// WHAT: Delete a centralized club logo entry after snapshotting to `club_assets_backup`.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireSession } from '@/lib/apiGuards';
import { slugifyClub } from '@/lib/clubLogoResolver';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const { slug } = await context.params;
    const canonicalSlug = slugifyClub(decodeURIComponent(slug || ''));
    if (!canonicalSlug) {
      return NextResponse.json({ success: false, error: 'Invalid club slug' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const existing = await db.collection('club_assets').findOne({ canonicalSlug });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Club logo record not found' }, { status: 404 });
    }

    await db.collection('club_assets_backup').insertOne({
      ...existing,
      _id: new ObjectId(),
      originalId: existing._id,
      reason: 'delete',
      backedUpAt: new Date().toISOString(),
    });

    await db.collection('club_assets').deleteOne({ _id: existing._id });
    await db.collection('report_snapshots').deleteMany({}).catch(() => null);

    return NextResponse.json({ success: true, deletedSlug: canonicalSlug });
  } catch (err: any) {
    console.error('Failed to delete club logo:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
