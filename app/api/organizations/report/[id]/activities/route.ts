import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import connectV3 from '@/lib/mongoose-v3';
import V3Activity from '@/lib/models/v3/Activity';
import V3ActivityParticipant from '@/lib/models/v3/ActivityParticipant';
import V3Organization from '@/lib/models/v3/Organization';
import mongoose from 'mongoose';
import { resolveReportVariant } from '@/lib/reportVariants';
import { isEventDateInPeriod } from '@/lib/reportPeriods';

type OrganizationRecord = {
  _id: ObjectId;
};

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const variantSlug = searchParams.get('variant');
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const db = await getDb();
    const organizationId = new ObjectId(id);
    const organization = await db.collection<OrganizationRecord>('organizations').findOne({ _id: organizationId });

    if (organization) {
      const partners = await db
        .collection('partners')
        .find({ organizationId }, { projection: { _id: 1 } })
        .toArray();

      const partnerIds = partners.map((partner) => partner._id);
      if (partnerIds.length === 0) {
        return NextResponse.json({ success: true, activities: [] });
      }

      const projects = await db
        .collection('projects')
        .find({
          $or: [
            { partner1: { $in: partnerIds } },
            { partner2: { $in: partnerIds } },
            { partner1Id: { $in: partnerIds } },
            { partner2Id: { $in: partnerIds } },
          ],
        })
        .sort({ eventDate: -1 })
        .project({
          _id: 1,
          eventName: 1,
          eventDate: 1,
          createdAt: 1,
          updatedAt: 1,
          viewSlug: 1,
        })
        .toArray();

      const resolvedVariant = await resolveReportVariant(db, 'organization', id, variantSlug);
      const filteredProjects = projects.filter((project) =>
        isEventDateInPeriod(project.eventDate, resolvedVariant.period)
      );

      return NextResponse.json({
        success: true,
        activities: filteredProjects.map((project) => ({
          _id: project._id.toString(),
          name: project.eventName,
          type: 'event',
          startDate: project.eventDate,
          metadata: {
            viewSlug: project.viewSlug,
          },
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
      })),
      });
    }

    await connectV3();
    const v3Organization = await V3Organization.findById(id).lean();
    if (!v3Organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const ownedActivities = await V3Activity.find({ organizationId: id }).lean();
    const ownedIds = ownedActivities.map((activity) => activity._id.toString());

    const participantRecords = await V3ActivityParticipant.find({
      organizationId: id,
      activityId: { $nin: ownedIds.map((activityId) => new mongoose.Types.ObjectId(activityId)) },
    }).select('activityId').lean();

    const participantActivityIds = Array.from(new Set(participantRecords.map((record) => record.activityId.toString())));
    const participantActivities = participantActivityIds.length
      ? await V3Activity.find({
          _id: { $in: participantActivityIds.map((activityId) => new mongoose.Types.ObjectId(activityId)) },
        }).lean()
      : [];

    const allActivities = [...ownedActivities, ...participantActivities].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      activities: allActivities.map((activity: any) => ({
        _id: activity._id.toString(),
        name: activity.name,
        type: activity.type || 'event',
        startDate: activity.startDate,
        metadata: {
          ...(activity.metadata || {}),
          viewSlug: activity.metadata?.viewSlug,
        },
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch organization activities:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization activities',
    }, { status: 500 });
  }
}
