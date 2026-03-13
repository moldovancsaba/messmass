import { NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3ActivityParticipant from '@/lib/models/v3/ActivityParticipant';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';

/**
 * DELETE /api/v3/activities/[id]/participants/[entityId]
 * Remove a participant from an activity.
 */
async function removeParticipant(req: Request, { params }: { params: { id: string; entityId: string } }) {
  try {
    const { id: activityId, entityId } = params;
    await connectV3();
    const orgId = req.headers.get('x-v3-org-id');

    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required' }, { status: 400 });
    }

    const result = await V3ActivityParticipant.findOneAndDelete({
      activityId,
      entityId,
      organizationId: orgId
    });

    if (!result) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Participant removed successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

export const DELETE = (req: Request, context: any) => withOrgContext(req, (r) => removeParticipant(r, context));
