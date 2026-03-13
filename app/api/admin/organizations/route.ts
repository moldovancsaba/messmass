import { NextRequest, NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import { getAdminUser } from '@/lib/auth';

/**
 * Organization Management API
 * WHAT: GET (list) and POST (create) organizations
 * WHY: Enable superadmins to manage the V3 hierarchy
 * SECURITY: restricted to 'superadmin' role
 */

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await connectV3();
    const organizations = await V3Organization.find({}).sort({ name: 1 });

    return NextResponse.json({
      success: true,
      organizations
    });
  } catch (error: any) {
    console.error('[API/Organizations] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { name, slug, metadata } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    await connectV3();
    const organization = await V3Organization.create({
      name,
      slug,
      metadata: metadata || {}
    });

    return NextResponse.json({
      success: true,
      organization
    });
  } catch (error: any) {
    console.error('[API/Organizations] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
