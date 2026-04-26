// app/api/admin/organizations/[id]/route.ts
// WHAT: Admin Organization details, editing, and delete
// WHY: Organization editor and admin page must preserve existing organization and partner membership data

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { hasMinimumRole } from '@/lib/permissions';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import V3Entity from '@/lib/models/v3/Entity';

export const runtime = 'nodejs';

const MASTER_ORG_ID = '69b322e0cb8e841f95de9aa1';

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
  slug: string;
  status?: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

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

function mergeMetadata(
  currentMetadata: Record<string, unknown> | undefined,
  nextMetadata: unknown
) {
  if (!nextMetadata || typeof nextMetadata !== 'object' || Array.isArray(nextMetadata)) {
    return currentMetadata || {};
  }

  return {
    ...(currentMetadata || {}),
    ...(nextMetadata as Record<string, unknown>),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }
    if (!hasMinimumRole(admin.role, 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const db = await getDb();
    const organization = await db.collection<OrganizationRecord>('organizations').findOne({ _id: new ObjectId(id) });
    if (!organization) {
      await connectV3();
      const v3Organization = await V3Organization.findById(id).lean();
      if (!v3Organization) {
        return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        organization: {
          ...v3Organization,
          _id: v3Organization._id.toString(),
          createdAt: v3Organization.createdAt instanceof Date ? v3Organization.createdAt.toISOString() : v3Organization.createdAt,
          updatedAt: v3Organization.updatedAt instanceof Date ? v3Organization.updatedAt.toISOString() : v3Organization.updatedAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      organization: normalizeOrganization(organization),
    });
  } catch (error) {
    console.error('Failed to fetch organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch organization' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }
    if (!hasMinimumRole(admin.role, 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      slug?: unknown;
      status?: unknown;
      metadata?: unknown;
    } | null;

    const db = await getDb();
    const collection = db.collection<OrganizationRecord>('organizations');
    const organization = await collection.findOne({ _id: new ObjectId(id) });

    if (organization) {
      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (typeof body?.name === 'string' && body.name.trim()) {
        updates.name = body.name.trim();
      }
      if (typeof body?.slug === 'string' && body.slug.trim()) {
        updates.slug = body.slug.trim();
      }
      if (body?.status === 'active' || body?.status === 'inactive') {
        updates.status = body.status;
      }
      if (body?.metadata !== undefined) {
        updates.metadata = mergeMetadata(organization.metadata, body.metadata);
      }

      await collection.updateOne({ _id: organization._id }, { $set: updates });
      const updatedOrganization = await collection.findOne({ _id: organization._id });

      if (!updatedOrganization) {
        throw new Error('Updated organization could not be loaded');
      }

      return NextResponse.json({
        success: true,
        organization: normalizeOrganization(updatedOrganization),
      });
    }

    await connectV3();
    const v3Organization = await V3Organization.findById(id).lean();
    if (!v3Organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body?.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body?.slug === 'string' && body.slug.trim()) {
      updates.slug = body.slug.trim();
    }
    if (body?.status === 'active' || body?.status === 'inactive') {
      updates.status = body.status;
    }
    if (body?.metadata !== undefined) {
      updates.metadata = mergeMetadata(v3Organization.metadata || {}, body.metadata);
    }

    const updatedOrganization = await V3Organization.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      organization: {
        ...updatedOrganization,
        _id: updatedOrganization!._id.toString(),
        createdAt: updatedOrganization!.createdAt instanceof Date ? updatedOrganization!.createdAt.toISOString() : updatedOrganization!.createdAt,
        updatedAt: updatedOrganization!.updatedAt instanceof Date ? updatedOrganization!.updatedAt.toISOString() : updatedOrganization!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to update organization' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }
    if (!hasMinimumRole(admin.role, 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection<OrganizationRecord>('organizations');
    const organization = await collection.findOne({ _id: new ObjectId(id) });

    if (organization) {
      const memberCount = await db.collection('partners').countDocuments({ organizationId: organization._id });
      if (memberCount > 0) {
        return NextResponse.json({
          success: false,
          error: 'Reassign or remove all members from this organization before deleting it',
        }, { status: 400 });
      }

      await collection.deleteOne({ _id: organization._id });
      return NextResponse.json({ success: true });
    }

    await connectV3();

    if (id === MASTER_ORG_ID) {
      return NextResponse.json({ success: false, error: 'The master organization cannot be deleted' }, { status: 400 });
    }

    const memberCount = await V3Entity.countDocuments({ organizationId: new ObjectId(id) });
    if (memberCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Reassign or remove all members from this organization before deleting it',
      }, { status: 400 });
    }

    const deleted = await V3Organization.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete organization' }, { status: 500 });
  }
}
