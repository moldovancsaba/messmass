import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import V3Entity from '@/lib/models/v3/Entity';
import { V3ReportResolver } from '@/lib/v3/reporting/reportResolver';
import { resolveReportVariant, resolveOrganizationReportScope } from '@/lib/reportVariants';
import { isEventDateInPeriod } from '@/lib/reportPeriods';

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
  slug: string;
  status?: 'active' | 'inactive';
  metadata?: {
    emoji?: string;
    logoUrl?: string;
    reportId?: string;
    reportTemplateId?: string;
    styleId?: string;
    stats?: Record<string, number | string>;
    [key: string]: unknown;
  };
  createdAt?: string;
  updatedAt?: string;
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const variantSlug = searchParams.get('variant');

    const db = await getDb();
    const organizations = db.collection<OrganizationRecord>('organizations');
    const organization = ObjectId.isValid(id)
      ? (await organizations.findOne({ _id: new ObjectId(id) })) ||
        (await organizations.findOne({ slug: id }))
      : await organizations.findOne({ slug: id });

    if (organization) {
      const orgId = organization._id;
      const orgIdStr = orgId.toString();

      const resolvedVariant = await resolveReportVariant(db, 'organization', orgIdStr, variantSlug);
      if (!resolvedVariant.runtimeReport.report) {
        throw new Error('Failed to resolve organization report');
      }

      const { partners: assignedPartners, projects: scopedProjects } =
        await resolveOrganizationReportScope(db, organization, resolvedVariant.variant);

      const projects = scopedProjects.filter((project) =>
        isEventDateInPeriod(project.eventDate, resolvedVariant.period)
      );

      const baseMetadata = organization.metadata || {};
      const variant = resolvedVariant.variant;
      const mergedMetadata = {
        ...baseMetadata,
        stats: variant.statsOverrides || {},
        emoji: variant.emoji ?? baseMetadata.emoji,
        logoUrl: variant.logoUrl ?? baseMetadata.logoUrl,
        styleId: variant.styleId ?? baseMetadata.styleId,
        reportTemplateId: variant.reportTemplateId ?? baseMetadata.reportTemplateId ?? baseMetadata.reportId,
        reportId: variant.reportTemplateId ?? baseMetadata.reportTemplateId ?? baseMetadata.reportId,
        showEmoji: variant.showEmoji ?? baseMetadata.showEmoji,
        showMembersList: variant.showMembersList ?? baseMetadata.showMembersList,
        showMembersListTitle: variant.showMembersListTitle ?? baseMetadata.showMembersListTitle,
        showMembersListDetails: variant.showMembersListDetails ?? baseMetadata.showMembersListDetails,
        showEventsList: variant.showEventsList ?? baseMetadata.showEventsList,
        showEventsListTitle: variant.showEventsListTitle ?? baseMetadata.showEventsListTitle,
        showEventsListDetails: variant.showEventsListDetails ?? baseMetadata.showEventsListDetails,
      };

      const aggregatedStats: Record<string, number | string> = {
        ...((baseMetadata.stats || {}) as Record<string, number | string>),
        ...((variant.statsOverrides || {}) as Record<string, number | string>),
      };

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
          metadata: mergedMetadata,
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
            viewSlug: partner.viewSlug,
          },
        })),
        report: resolvedVariant.runtimeReport.report,
        resolvedFrom: resolvedVariant.runtimeReport.resolvedFrom,
        source: resolvedVariant.runtimeReport.source,
        reportVariant: {
          ...variant,
          period: resolvedVariant.period,
        },
        availableVariants: (resolvedVariant.availableVariants || []).map((v) => ({
          _id: v._id,
          name: v.name,
          slug: v.slug,
          isDefault: v.isDefault,
          eventScope: v.eventScope,
        })),
        aggregatedStats,
        totalEntities: assignedPartners.length,
        totalEvents: projects.length,
      });
    }

    await connectV3();
    const v3Organization = ObjectId.isValid(id)
      ? (await V3Organization.findById(id).lean()) ||
        (await V3Organization.findOne({ slug: id }).lean())
      : await V3Organization.findOne({ slug: id }).lean();
    if (!v3Organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const v3OrgId = v3Organization._id.toString();
    const resolution = await V3ReportResolver.resolveForOrganization(v3OrgId);
    if (!resolution?.report) {
      throw new Error('Failed to resolve organization report');
    }

    const entities = await V3Entity.find({ organizationId: v3OrgId, parentEntityId: null })
      .select('name type metadata')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      organization: {
        ...v3Organization,
        _id: v3Organization._id.toString(),
        createdAt: v3Organization.createdAt instanceof Date ? v3Organization.createdAt.toISOString() : v3Organization.createdAt,
        updatedAt: v3Organization.updatedAt instanceof Date ? v3Organization.updatedAt.toISOString() : v3Organization.updatedAt,
      },
      entities: entities.map((entity) => ({
        _id: entity._id.toString(),
        name: entity.name,
        type: entity.type,
        status: 'active',
        metadata: entity.metadata || {},
      })),
      report: resolution.report,
      resolvedFrom: resolution.resolvedFrom,
      source: resolution.source,
      aggregatedStats: { ...((v3Organization.metadata?.stats as Record<string, number | string>) || {}) },
      totalEntities: entities.length,
    });
  } catch (error) {
    // Honour a status the thrown error carries (resolveReportVariant marks a
    // missing or archived variant 404); only an unlabelled error is a 500.
    const status = (error as { status?: number })?.status ?? 500;
    if (status >= 500) {
      console.error('Failed to fetch organization report:', error);
    }
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization report',
      code: (error as { code?: string })?.code,
    }, { status });
  }
}
