// app/api/admin/organizations/[id]/route.ts
// WHAT: Admin Organization details, editing, and delete
// WHY: Organization editor and admin page both need to operate on the canonical organization model

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import V3Entity from '@/lib/models/v3/Entity';

export const runtime = 'nodejs';

const MASTER_ORG_ID = '69b322e0cb8e841f95de9aa1';

export async function GET(
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

    await connectV3();
    const organization = await V3Organization.findById(id).lean();
    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      organization: {
        ...organization,
        _id: organization._id.toString(),
        createdAt: organization.createdAt instanceof Date ? organization.createdAt.toISOString() : organization.createdAt,
        updatedAt: organization.updatedAt instanceof Date ? organization.updatedAt.toISOString() : organization.updatedAt,
      },
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

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      status?: unknown;
      metadata?: unknown;
    } | null;

    const updates: Record<string, unknown> = {};
    if (typeof body?.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (body?.status === 'active' || body?.status === 'inactive') {
      updates.status = body.status;
    }
    if (body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
      updates.metadata = body.metadata;
    }

    await connectV3();
    const organization = await V3Organization.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      organization: {
        ...organization,
        _id: organization._id.toString(),
        createdAt: organization.createdAt instanceof Date ? organization.createdAt.toISOString() : organization.createdAt,
        updatedAt: organization.updatedAt instanceof Date ? organization.updatedAt.toISOString() : organization.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update organization:', error);
    return NextResponse.json({ success: false, error: 'Failed to update organization' }, { status: 500 });
  }
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

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    if (id === MASTER_ORG_ID) {
      return NextResponse.json({ success: false, error: 'The master organization cannot be deleted' }, { status: 400 });
    }

    await connectV3();

    const memberCount = await V3Entity.countDocuments({ organizationId: id });
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
