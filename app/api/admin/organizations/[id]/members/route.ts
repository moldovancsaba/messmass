import { NextRequest, NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Entity from '@/lib/models/v3/Entity';
import { getAdminUser } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * Organization Members API
 * WHAT: GET (list members) and POST (bulk assign members)
 * WHY: Enable hierarchy management between Organizations and Partners
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
    
    // Find all entities belonging to this organization
    const members = await V3Entity.find({ organizationId: id }).sort({ name: 1 }).lean();

    return NextResponse.json({ 
      success: true, 
      members: members.map((m: any) => ({ ...m, _id: m._id.toString() }))
    });
  } catch (error: any) {
    console.error(`[API/Organizations/${(await params).id}/members] GET error:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user || user.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id: organizationId } = await params;
    const { entityIds } = await request.json();

    if (!Array.isArray(entityIds)) {
      return NextResponse.json({ success: false, error: 'entityIds must be an array' }, { status: 400 });
    }

    await connectV3();

    // Convert to ObjectIds
    const oids = entityIds.map(id => new mongoose.Types.ObjectId(id));

    // Bulk update entities to belong to this organization
    const result = await V3Entity.updateMany(
      { _id: { $in: oids } },
      { $set: { organizationId: new mongoose.Types.ObjectId(organizationId) } }
    );

    return NextResponse.json({ 
      success: true, 
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    console.error(`[API/Organizations/${(await params).id}/members] POST error:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
