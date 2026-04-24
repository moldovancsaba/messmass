import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { createReportResolver } from '@/lib/report-resolver';

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
  slug: string;
  status?: 'active' | 'inactive';
  metadata?: {
    emoji?: string;
    logoUrl?: string;
    reportId?: string;
    styleId?: string;
    stats?: Record<string, number | string>;
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
};

type PartnerRecord = {
  _id: ObjectId;
  name: string;
  emoji?: string;
  logoUrl?: string;
  organizationId?: ObjectId;
  stats?: Record<string, number | string>;
};

export const dynamic = 'force-dynamic';

function aggregateNumericStats(
  baseStats: Record<string, number | string>,
  nextStats: Record<string, unknown> | undefined
) {
  if (!nextStats) return;

  Object.entries(nextStats).forEach(([key, value]) => {
    if (typeof value !== 'number') {
      return;
    }

    const currentValue = baseStats[key];
    if (typeof currentValue === 'number') {
      baseStats[key] = currentValue + value;
      return;
    }

    if (currentValue === undefined) {
      baseStats[key] = value;
    }
  });
}

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
    const organizations = db.collection<OrganizationRecord>('organizations');
    const partnersCollection = db.collection<PartnerRecord>('partners');
    const projectsCollection = db.collection('projects');
    const organization = await organizations.findOne({ _id: new ObjectId(id) });

    if (!organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const assignedPartners = await partnersCollection
      .find({ organizationId: organization._id })
      .sort({ name: 1 })
      .toArray();

    const partnerIds = assignedPartners.map((partner) => partner._id);
    const projects = partnerIds.length
      ? await projectsCollection
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
            viewSlug: 1,
            createdAt: 1,
            updatedAt: 1,
            stats: 1,
          })
          .toArray()
      : [];

    const resolver = createReportResolver(db);
    const metadata = organization.metadata || {};
    const explicitReport = metadata.reportId ? await resolver.getReportById(metadata.reportId) : null;
    const resolved = explicitReport
      ? { report: explicitReport, resolvedFrom: 'organization', source: organization.name }
      : await resolver.getDefaultReport('partner');

    if (metadata.styleId) {
      resolved.report.styleId = metadata.styleId;
    }

    const aggregatedStats: Record<string, number | string> = {
      ...(metadata.stats || {}),
    };

    assignedPartners.forEach((partner) => {
      aggregateNumericStats(aggregatedStats, partner.stats);
    });

    projects.forEach((project) => {
      aggregateNumericStats(aggregatedStats, (project.stats || {}) as Record<string, unknown>);
    });

    return NextResponse.json({
      success: true,
      organization: {
        _id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        status: organization.status || 'active',
        metadata,
        createdAt: organization.createdAt || new Date().toISOString(),
        updatedAt: organization.updatedAt || new Date().toISOString(),
      },
      entities: assignedPartners.map((partner) => ({
        _id: partner._id.toString(),
        name: partner.name,
        type: 'partner',
        status: 'active',
        metadata: {
          emoji: partner.emoji || '🤝',
          logoUrl: partner.logoUrl,
        },
      })),
      report: resolved.report,
      resolvedFrom: resolved.resolvedFrom,
      source: resolved.source,
      aggregatedStats,
      totalEntities: assignedPartners.length,
      totalEvents: projects.length,
    });
  } catch (error) {
    console.error('Failed to fetch organization report:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization report',
    }, { status: 500 });
  }
}
