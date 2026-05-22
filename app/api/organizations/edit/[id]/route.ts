import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import { resolveReportVariant, listReportVariants, updateReportVariant } from '@/lib/reportVariants';

export const dynamic = 'force-dynamic';

type OrganizationMetadata = {
  emoji?: string;
  showEmoji?: boolean;
  logoUrl?: string;
  stats?: Record<string, string | undefined>;
  reportId?: string;
  reportTemplateId?: string;
  styleId?: string;
  clickerSetId?: string;
  showMembersList?: boolean;
  showMembersListTitle?: boolean;
  showMembersListDetails?: boolean;
  showEventsList?: boolean;
  showEventsListTitle?: boolean;
  showEventsListDetails?: boolean;
  [key: string]: unknown;
};

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
  slug: string;
  status?: 'active' | 'inactive';
  metadata?: OrganizationMetadata;
  createdAt?: string;
  updatedAt?: string;
};

function normalizeOrganization(organization: OrganizationRecord) {
  const metadata = organization.metadata || {};

  return {
    _id: organization._id.toString(),
    name: organization.name,
    slug: organization.slug,
    status: organization.status || 'active',
    metadata: {
      ...metadata,
      showEmoji: metadata.showEmoji !== false,
      showMembersList: metadata.showMembersList !== false,
      showMembersListTitle: metadata.showMembersListTitle !== false,
      showMembersListDetails: metadata.showMembersListDetails !== false,
      showEventsList: metadata.showEventsList !== false,
      showEventsListTitle: metadata.showEventsListTitle !== false,
      showEventsListDetails: metadata.showEventsListDetails !== false,
      stats: metadata.stats || {},
    },
    createdAt: organization.createdAt || new Date().toISOString(),
    updatedAt: organization.updatedAt || new Date().toISOString(),
  };
}

function normalizeV3Organization(organization: any) {
  const metadata = organization.metadata || {};

  return {
    _id: organization._id.toString(),
    name: organization.name,
    slug: organization.slug,
    status: organization.status || 'active',
    metadata: {
      ...metadata,
      showEmoji: metadata.showEmoji !== false,
      showMembersList: metadata.showMembersList !== false,
      showMembersListTitle: metadata.showMembersListTitle !== false,
      showMembersListDetails: metadata.showMembersListDetails !== false,
      showEventsList: metadata.showEventsList !== false,
      showEventsListTitle: metadata.showEventsListTitle !== false,
      showEventsListDetails: metadata.showEventsListDetails !== false,
      stats: metadata.stats || {},
    },
    createdAt: organization.createdAt instanceof Date ? organization.createdAt.toISOString() : organization.createdAt || new Date().toISOString(),
    updatedAt: organization.updatedAt instanceof Date ? organization.updatedAt.toISOString() : organization.updatedAt || new Date().toISOString(),
  };
}

function mergeMetadata(
  currentMetadata: OrganizationMetadata | undefined,
  nextMetadata: unknown
): OrganizationMetadata {
  if (!nextMetadata || typeof nextMetadata !== 'object' || Array.isArray(nextMetadata)) {
    return currentMetadata || {};
  }

  return {
    ...(currentMetadata || {}),
    ...(nextMetadata as OrganizationMetadata),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variantSlug = new URL(request.url).searchParams.get('variant');

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const db = await getDb();
    const organization = await db.collection<OrganizationRecord>('organizations').findOne({ _id: new ObjectId(id) });

    if (organization) {
      if (variantSlug && variantSlug !== 'default') {
        const resolvedVariant = await resolveReportVariant(db, 'organization', id, variantSlug);
        const normalized = normalizeOrganization(organization);
        return NextResponse.json({
          success: true,
          organization: {
            ...normalized,
            metadata: {
              ...normalized.metadata,
              stats: resolvedVariant.variant.statsOverrides || {},
              emoji: resolvedVariant.variant.emoji ?? normalized.metadata.emoji,
              logoUrl: resolvedVariant.variant.logoUrl ?? normalized.metadata.logoUrl,
              styleId: resolvedVariant.variant.styleId ?? normalized.metadata.styleId,
              reportTemplateId:
                resolvedVariant.variant.reportTemplateId ??
                normalized.metadata.reportTemplateId ??
                normalized.metadata.reportId,
              reportId:
                resolvedVariant.variant.reportTemplateId ??
                normalized.metadata.reportTemplateId ??
                normalized.metadata.reportId,
              showEmoji: resolvedVariant.variant.showEmoji ?? normalized.metadata.showEmoji,
              showMembersList: resolvedVariant.variant.showMembersList ?? normalized.metadata.showMembersList,
              showMembersListTitle:
                resolvedVariant.variant.showMembersListTitle ?? normalized.metadata.showMembersListTitle,
              showMembersListDetails:
                resolvedVariant.variant.showMembersListDetails ?? normalized.metadata.showMembersListDetails,
              showEventsList: resolvedVariant.variant.showEventsList ?? normalized.metadata.showEventsList,
              showEventsListTitle:
                resolvedVariant.variant.showEventsListTitle ?? normalized.metadata.showEventsListTitle,
              showEventsListDetails:
                resolvedVariant.variant.showEventsListDetails ?? normalized.metadata.showEventsListDetails,
            },
            reportVariant: resolvedVariant.variant,
          },
        });
      }

      return NextResponse.json({
        success: true,
        organization: normalizeOrganization(organization),
      });
    }

    await connectV3();
    const v3Organization = await V3Organization.findById(id).lean();
    if (!v3Organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      organization: normalizeV3Organization(v3Organization),
    });
  } catch (error) {
    console.error('Failed to fetch organization for editing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch organization for editing',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const variantSlug = new URL(request.url).searchParams.get('variant');

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as {
      metadata?: unknown;
    } | null;

    if (!body?.metadata) {
      return NextResponse.json({ success: false, error: 'metadata is required' }, { status: 400 });
    }

    const db = await getDb();
    const collection = db.collection<OrganizationRecord>('organizations');
    const organization = await collection.findOne({ _id: new ObjectId(id) });

    if (organization) {
      if (variantSlug && variantSlug !== 'default') {
        const { variants } = await listReportVariants(db, 'organization', id);
        const targetVariant = variants.find((variant) => variant.slug === variantSlug || variant._id === variantSlug);
        if (!targetVariant || targetVariant._id.startsWith('virtual-default:')) {
          return NextResponse.json({ success: false, error: 'Report variant not found' }, { status: 404 });
        }

        const metadata = mergeMetadata({}, body.metadata);
        const variant = await updateReportVariant(db, targetVariant._id, {
          statsOverrides: (metadata.stats as Record<string, unknown>) || {},
          emoji: metadata.emoji ? String(metadata.emoji) : undefined,
          logoUrl: metadata.logoUrl ? String(metadata.logoUrl) : undefined,
          styleId: metadata.styleId ? String(metadata.styleId) : undefined,
          reportTemplateId: metadata.reportTemplateId
            ? String(metadata.reportTemplateId)
            : metadata.reportId
              ? String(metadata.reportId)
              : undefined,
          showEmoji: metadata.showEmoji as boolean | undefined,
          showMembersList: metadata.showMembersList as boolean | undefined,
          showMembersListTitle: metadata.showMembersListTitle as boolean | undefined,
          showMembersListDetails: metadata.showMembersListDetails as boolean | undefined,
          showEventsList: metadata.showEventsList as boolean | undefined,
          showEventsListTitle: metadata.showEventsListTitle as boolean | undefined,
          showEventsListDetails: metadata.showEventsListDetails as boolean | undefined,
        });

        const normalized = normalizeOrganization(organization);
        return NextResponse.json({
          success: true,
          organization: {
            ...normalized,
            metadata: {
              ...normalized.metadata,
              ...metadata,
            },
            reportVariant: variant,
          },
        });
      }

      const metadata = mergeMetadata(organization.metadata, body.metadata);
      if (Object.prototype.hasOwnProperty.call(metadata, 'reportTemplateId')) {
        metadata.reportId = metadata.reportTemplateId || undefined;
      }

      await collection.updateOne(
        { _id: organization._id },
        {
          $set: {
            metadata,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      const updatedOrganization = await collection.findOne({ _id: organization._id });
      if (!updatedOrganization) {
        throw new Error('Updated organization could not be loaded');
      }

      return NextResponse.json({
        success: true,
        organization: normalizeOrganization(updatedOrganization),
      });
    }

    await connectV3();
    const v3Organization = await V3Organization.findById(id).lean();
    if (!v3Organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const metadata = mergeMetadata(v3Organization.metadata, body.metadata);
    if (Object.prototype.hasOwnProperty.call(metadata, 'reportTemplateId')) {
      metadata.reportId = metadata.reportTemplateId || undefined;
    }

    const updatedOrganization = await V3Organization.findByIdAndUpdate(
      id,
      {
        $set: {
          metadata,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).lean();
    if (!updatedOrganization) {
      throw new Error('Updated organization could not be loaded');
    }

    return NextResponse.json({
      success: true,
      organization: normalizeV3Organization(updatedOrganization),
    });
  } catch (error) {
    console.error('Failed to save organization for editing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save organization for editing',
      },
      { status: 500 }
    );
  }
}
