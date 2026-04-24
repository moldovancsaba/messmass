import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';

type OrganizationRecord = {
  _id: ObjectId;
};

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const db = await getDb();
    const organizationId = new ObjectId(id);
    const organization = await db.collection<OrganizationRecord>('organizations').findOne({ _id: organizationId });

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

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

    return NextResponse.json({
      success: true,
      activities: projects.map((project) => ({
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
  } catch (error) {
    console.error('Failed to fetch organization activities:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization activities',
    }, { status: 500 });
  }
}
