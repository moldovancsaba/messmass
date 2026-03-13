import { NextRequest, NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import { getAdminUser } from '@/lib/auth';

/**
 * Single Organization Management API
 * WHAT: PATCH (update) and DELETE organizations
 * WHY: Enable superadmins to modify/remove V3 organizations
 * SECURITY: restricted to 'superadmin' role
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getAdminUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { name, slug, status, metadata } = await request.json();

    await connectV3();
    const organization = await V3Organization.findByIdAndUpdate(
      id,
      { $set: { name, slug, status, metadata } },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      organization
    });
  } catch (error: any) {
    console.error(`[API/Organizations] PATCH code error for ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getAdminUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectV3();
    const organization = await V3Organization.findByIdAndDelete(id);

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error: any) {
    console.error(`[API/Organizations] DELETE error for ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
