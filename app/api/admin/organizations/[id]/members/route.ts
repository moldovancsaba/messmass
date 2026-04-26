// app/api/admin/organizations/[id]/members/route.ts
// WHAT: Read + update partner membership for an organization
// WHY: Organization Management must use the same organization and partner records shown in admin

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { hasMinimumRole } from '@/lib/permissions';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import V3Entity from '@/lib/models/v3/Entity';

export const runtime = 'nodejs';

const MASTER_ORG_ID = '69b322e0cb8e841f95de9aa1';

type OrganizationRecord = {
  _id: ObjectId;
  name: string;
  slug: string;
};

type PartnerRecord = {
  _id: ObjectId;
  name: string;
  organizationId?: ObjectId | string | null;
};

function normalizeId(value: ObjectId | string | null | undefined) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.toString();
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }
    if (!hasMinimumRole(admin.role, 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }
    const orgId = new ObjectId(id);

    const db = await getDb();
    const org = await db.collection<OrganizationRecord>('organizations').findOne({ _id: orgId });

    if (org) {
      const orgs = await db.collection<OrganizationRecord>('organizations').find({}).toArray();
      const orgNameById = new Map(orgs.map((organization) => [organization._id.toString(), organization.name]));

      const partners = await db
        .collection<PartnerRecord>('partners')
        .find({}, { projection: { name: 1, organizationId: 1 } })
        .sort({ name: 1 })
        .toArray();

      return NextResponse.json({
        success: true,
        organization: { _id: org._id.toString(), name: org.name, slug: org.slug },
        partners: partners.map((partner) => {
          const currentOrgId = normalizeId(partner.organizationId);
          return {
            _id: partner._id.toString(),
            name: partner.name,
            currentOrganizationId: currentOrgId,
            currentOrganizationName: currentOrgId ? orgNameById.get(currentOrgId) || '—' : '—',
            isMember: currentOrgId === org._id.toString(),
          };
        }),
      });
    }

    await connectV3();
    const v3Organization = await V3Organization.findById(orgId).lean();
    if (!v3Organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const v3Organizations = await V3Organization.find({}).lean();
    const orgNameById = new Map(v3Organizations.map((organization) => [organization._id.toString(), organization.name]));

    const partners = await V3Entity.find({ parentEntityId: null })
      .select('name organizationId type')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      organization: { _id: v3Organization._id.toString(), name: v3Organization.name, slug: v3Organization.slug },
      partners: partners.map((partner) => {
        const currentOrgId = normalizeId(partner.organizationId);
        return {
          _id: partner._id.toString(),
          name: partner.name,
          type: partner.type,
          currentOrganizationId: currentOrgId,
          currentOrganizationName: currentOrgId ? orgNameById.get(currentOrgId) || '—' : '—',
          isMember: currentOrgId === v3Organization._id.toString(),
        };
      }),
    });
  } catch (error) {
    console.error('Failed to fetch organization members:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch organization members' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }
    if (!hasMinimumRole(admin.role, 'superadmin')) {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }
    const orgId = new ObjectId(id);

    const body = (await request.json().catch(() => null)) as { memberPartnerIds?: unknown } | null;
    const memberPartnerIdsRaw = Array.isArray(body?.memberPartnerIds) ? body?.memberPartnerIds : null;
    if (!memberPartnerIdsRaw) {
      return NextResponse.json({ success: false, error: 'memberPartnerIds must be an array' }, { status: 400 });
    }

    const memberPartnerIds = memberPartnerIdsRaw
      .filter((x): x is string => typeof x === 'string' && ObjectId.isValid(x))
      .map((x) => new ObjectId(x));

    const db = await getDb();
    const org = await db.collection<OrganizationRecord>('organizations').findOne({ _id: orgId });

    if (org) {
      await db.collection('partners').updateMany(
        { organizationId: orgId, _id: { $nin: memberPartnerIds } },
        { $unset: { organizationId: '' } }
      );

      if (memberPartnerIds.length > 0) {
        await db.collection('partners').updateMany(
          { _id: { $in: memberPartnerIds } },
          { $set: { organizationId: orgId } }
        );
      }

      return NextResponse.json({ success: true });
    }

    await connectV3();
    const v3Organization = await V3Organization.findById(orgId).select('name slug').lean();
    if (!v3Organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Move deselected members back to the master organization.
    await V3Entity.updateMany(
      { organizationId: orgId, _id: { $nin: memberPartnerIds } },
      { $set: { organizationId: new ObjectId(MASTER_ORG_ID) } }
    );

    if (memberPartnerIds.length > 0) {
      await V3Entity.updateMany(
        { _id: { $in: memberPartnerIds } },
        { $set: { organizationId: orgId } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update organization members:', error);
    return NextResponse.json({ success: false, error: 'Failed to update organization members' }, { status: 500 });
  }
}
