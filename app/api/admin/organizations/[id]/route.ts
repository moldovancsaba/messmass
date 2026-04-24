// app/api/admin/organizations/[id]/route.ts
// WHAT: Admin Organization details + delete
// WHY: Allow removing organizations (memberships are cleared automatically)

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }
    const orgId = new ObjectId(id);

    const db = await getDb();

    // Clear partner membership first (best-effort; still delete org even if no partners match)
    await db.collection('partners').updateMany(
      { organizationId: orgId },
      { $unset: { organizationId: '' } }
    );

    const deleteResult = await db.collection('organizations').deleteOne({ _id: orgId });
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete organization' }, { status: 500 });
  }
}

