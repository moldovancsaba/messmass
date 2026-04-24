// app/api/admin/organizations/route.ts
// WHAT: Admin CRUD for Organizations (non-V3)
// WHY: Provide Organization Management UI + partner membership assignment

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

function slugifyOrgName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }

    const db = await getDb();
    const organizations = await db
      .collection<OrganizationRecord>('organizations')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      organizations: organizations.map((o) => ({
        _id: o._id.toString(),
        name: o.name,
        slug: o.slug,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to list organizations:', error);
    return NextResponse.json({ success: false, error: 'Failed to list organizations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ success: false, error: 'Organization name is required' }, { status: 400 });
    }

    const slugBase = slugifyOrgName(name) || 'org';
    const db = await getDb();
    const collection = db.collection<OrganizationRecord>('organizations');

    const now = new Date().toISOString();
    let slug = slugBase;
    for (let i = 0; i < 20; i += 1) {
      const candidate = i === 0 ? slugBase : `${slugBase}-${i + 1}`;
      // eslint-disable-next-line no-await-in-loop
      const existing = await collection.findOne({ slug: candidate });
      if (!existing) {
        slug = candidate;
        break;
      }
    }

    const insertResult = await collection.insertOne({
      // _id is created by Mongo
      name,
      slug,
      createdAt: now,
      updatedAt: now,
    } as unknown as OrganizationRecord);

    return NextResponse.json({
      success: true,
      organization: { _id: insertResult.insertedId.toString(), name, slug, createdAt: now, updatedAt: now },
    });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to create organization' }, { status: 500 });
  }
}

