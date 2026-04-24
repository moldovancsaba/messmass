// app/api/admin/organizations/route.ts
// WHAT: Admin CRUD for real V3 organizations
// WHY: Organization Management must operate on the same data model as reports/editors

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';

export const runtime = 'nodejs';

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

    await connectV3();

    const organizations = await V3Organization.find({})
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      organizations: organizations.map((o) => ({
        _id: o._id.toString(),
        name: o.name,
        slug: o.slug,
        status: o.status,
        metadata: o.metadata || {},
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
        updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
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
    await connectV3();

    let slug = slugBase;
    for (let i = 0; i < 20; i += 1) {
      const candidate = i === 0 ? slugBase : `${slugBase}-${i + 1}`;
      // eslint-disable-next-line no-await-in-loop
      const existing = await V3Organization.findOne({ slug: candidate }).lean();
      if (!existing) {
        slug = candidate;
        break;
      }
    }

    const organization = await V3Organization.create({
      name,
      slug,
      status: 'active',
      metadata: {},
    });

    return NextResponse.json({
      success: true,
      organization: {
        _id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        status: organization.status,
        metadata: organization.metadata || {},
        createdAt: organization.createdAt instanceof Date ? organization.createdAt.toISOString() : organization.createdAt,
        updatedAt: organization.updatedAt instanceof Date ? organization.updatedAt.toISOString() : organization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to create organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to create organization' }, { status: 500 });
  }
}
