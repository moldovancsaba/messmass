import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }

    const db = await getDb();
    const organization = await db.collection<OrganizationRecord>('organizations').findOne({ _id: new ObjectId(id) });

    if (organization) {
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
