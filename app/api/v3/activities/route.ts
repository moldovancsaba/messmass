import { NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Activity from '@/lib/models/v3/Activity';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';

/**
 * GET /api/v3/activities
 * 
 * Returns a list of activities filtered by owner entity or status.
 * Scoped by 'x-v3-org-id' via withOrgContext middleware.
 */
async function getActivities(req: Request) {
  try {
    await connectV3();
    const { searchParams } = new URL(req.url);
    const orgId = req.headers.get('x-v3-org-id');
    
    // Base filter always includes the organization ID for safety
    const filter: any = { organizationId: orgId };

    // Selective filters
    const ownerEntityId = searchParams.get('ownerEntityId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    if (ownerEntityId) filter.ownerEntityId = ownerEntityId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const activities = await V3Activity.find(filter)
      .sort({ startDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      count: activities.length,
      activities,
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ GET /api/v3/activities failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

// Wrap with Organization Context Middleware
export const GET = (req: Request) => withOrgContext(req, getActivities);
