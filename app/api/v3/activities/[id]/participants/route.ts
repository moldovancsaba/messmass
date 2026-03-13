import { NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3ActivityParticipant from '@/lib/models/v3/ActivityParticipant';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';

/**
 * GET /api/v3/activities/[id]/participants
 * List all participants for a specific activity.
 */
async function getParticipants(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: activityId } = params;
    await connectV3();
    const orgId = req.headers.get('x-v3-org-id');

    const participants = await V3ActivityParticipant.find({ 
      activityId, 
      organizationId: orgId 
    })
    .populate('entityId', 'name type')
    .lean();

    return NextResponse.json({ count: participants.length, participants }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v3/activities/[id]/participants
 * Add a new participant to an activity.
 */
async function addParticipant(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: activityId } = params;
    const { entityId, role, metadata } = await req.json();
    await connectV3();
    const orgId = req.headers.get('x-v3-org-id');

    if (!entityId || !role) {
      return NextResponse.json({ error: 'entityId and role are required' }, { status: 400 });
    }

    const participant = await V3ActivityParticipant.findOneAndUpdate(
      { activityId, entityId, organizationId: orgId },
      { $set: { role, metadata: metadata || {} } },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ message: 'Participant added/updated', participant }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

export const GET = (req: Request, context: any) => withOrgContext(req, (r) => getParticipants(r, context));
export const POST = (req: Request, context: any) => withOrgContext(req, (r) => addParticipant(r, context));
