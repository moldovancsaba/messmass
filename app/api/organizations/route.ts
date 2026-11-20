// app/api/organizations/route.ts
// WHAT: List organizations for dropdown selection
// WHY: Event editors and admin pages need to list organizations to CRUD relationships
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { requireSession } from '@/lib/apiGuards';

export async function GET() {
  const __denied = await requireSession();
  if (__denied) return __denied;

  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const orgs = await db
      .collection('organizations')
      .find({}, { projection: { name: 1, slug: 1, logoUrl: 1, status: 1 } })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      organizations: orgs.map((o) => ({
        _id: o._id.toString(),
        name: o.name,
        slug: o.slug,
        logoUrl: o.logoUrl || null,
        status: o.status || 'active',
      })),
    });
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
