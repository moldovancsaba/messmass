import { NextRequest, NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Activity from '@/lib/models/v3/Activity';
import V3ActivityParticipant from '@/lib/models/v3/ActivityParticipant';
import { getAdminUser } from '@/lib/auth';
import { validateOrganizationAccess } from '@/lib/auth/orgGuard';
import mongoose from 'mongoose';

/**
 * Organization Report Activities API
 * WHAT: GET aggregated activities for an organization
 * WHY: Show all events where this org's entities are involved
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    
    // WHAT: RBAC / Multi-tenant scoping
    // WHY: Ensure non-superadmins are restricted to assigned organizations
    const authorizedUser = await validateOrganizationAccess(orgId);
    if (!authorizedUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Access to this organization is restricted' }, { status: 403 });
    }

    await connectV3();

    // 1. Find activities owned by this organization
    const ownedActivities = await V3Activity.find({ organizationId: orgId }).lean();
    const ownedIds = ownedActivities.map(a => a._id.toString());

    // 2. Find activities where this organization's entities are participants
    const participantRecords = await V3ActivityParticipant.find({ 
      organizationId: orgId,
      activityId: { $nin: ownedIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).select('activityId').lean();
    
    const participantActivityIds = Array.from(new Set(participantRecords.map(p => p.activityId.toString())));
    
    // 3. Fetch participant activities
    const participantActivities = await V3Activity.find({ 
      _id: { $in: participantActivityIds.map(id => new mongoose.Types.ObjectId(id)) } 
    }).lean();

    // 4. Combine and sort
    const allActivities = [...ownedActivities, ...participantActivities].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA; // Descending
    });

    return NextResponse.json({ 
      success: true, 
      activities: allActivities.map((a: any) => ({ ...a, _id: a._id.toString() }))
    });
  } catch (error: any) {
    console.error(`[API/Organizations/${(await params).id}/activities] GET error:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
