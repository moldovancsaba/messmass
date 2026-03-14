import { NextRequest, NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import { getAdminUser } from '@/lib/auth';

/**
 * Organization Management API (ID-specific)
 * WHAT: GET, PUT (update), and DELETE organizations
 * WHY: Enable management of specific organization instances
 * SECURITY: restricted to 'superadmin' role
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await connectV3();
    const organization = await V3Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      organization: {
        ...organization,
        _id: organization._id.toString()
      }
    });
  } catch (error: any) {
    console.error(`[API/Organizations/${(await params).id}] GET error:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { name, slug, status, metadata } = await request.json();

    await connectV3();
    
    // Build update object
    const update: any = {};
    if (name) update.name = name;
    if (slug) update.slug = slug;
    if (status) update.status = status;
    if (metadata) update.metadata = metadata;

    const organization = await V3Organization.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      organization: {
        ...organization,
        _id: organization._id.toString()
      }
    });
  } catch (error: any) {
    console.error(`[API/Organizations/${(await params).id}] PUT error:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await connectV3();
    const organization = await V3Organization.findByIdAndDelete(id);

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Organization deleted' });
  } catch (error: any) {
    console.error(`[API/Organizations/${(await params).id}] DELETE error:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
