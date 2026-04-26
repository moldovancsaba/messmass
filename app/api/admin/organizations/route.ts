// app/api/admin/organizations/route.ts
// WHAT: Admin CRUD for organization records
// WHY: Organization Management must operate on the same collection used for partner membership

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { hasMinimumRole } from '@/lib/permissions';

export const runtime = 'nodejs';

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
  slug: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

function slugifyOrgName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function normalizeOrganization(organization: OrganizationRecord) {
  return {
    _id: organization._id.toString(),
    name: organization.name,
    slug: organization.slug,
    status: organization.status || 'active',
    metadata: organization.metadata || {},
    createdAt: organization.createdAt || new Date().toISOString(),
    updatedAt: organization.updatedAt || new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }
    if (!hasMinimumRole(admin.role, 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    const db = await getDb();
    const organizations = await db
      .collection<OrganizationRecord>('organizations')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      organizations: organizations.map(normalizeOrganization),
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
    if (!hasMinimumRole(admin.role, 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      slug?: unknown;
      status?: unknown;
      metadata?: unknown;
    } | null;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ success: false, error: 'Organization name is required' }, { status: 400 });
    }

    const slugInput = typeof body?.slug === 'string' ? body.slug.trim() : '';
    const slugBase = slugifyOrgName(slugInput || name) || 'org';
    const status = body?.status === 'inactive' ? 'inactive' : 'active';
    const metadata =
      body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    const db = await getDb();
    const collection = db.collection<OrganizationRecord>('organizations');

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

    const now = new Date().toISOString();
    const organization: Omit<OrganizationRecord, '_id'> = {
      name,
      slug,
      status,
      metadata: metadata as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await collection.insertOne(organization as OrganizationRecord);
    const createdOrganization = await collection.findOne({ _id: insertResult.insertedId });
    if (!createdOrganization) {
      throw new Error('Failed to load created organization');
    }

    return NextResponse.json({
      success: true,
      organization: normalizeOrganization(createdOrganization),
    });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to create organization' }, { status: 500 });
  }
}
