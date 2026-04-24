// app/api/admin/organizations/[id]/members/route.ts
// WHAT: Read + update entity membership for an organization
// WHY: Organization Management must reflect the canonical org/entity model

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { hasMinimumRole } from '@/lib/permissions';
import connectV3 from '@/lib/mongoose-v3';
import V3Organization from '@/lib/models/v3/Organization';
import V3Entity from '@/lib/models/v3/Entity';

export const runtime = 'nodejs';

const MASTER_ORG_ID = '69b322e0cb8e841f95de9aa1';

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

    await connectV3();

    const org = await V3Organization.findById(orgId).lean();
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const orgs = await V3Organization.find({}).lean();
    const orgNameById = new Map(orgs.map((o) => [o._id.toString(), o.name]));

    const partners = await V3Entity.find({ parentEntityId: null })
      .select('name organizationId type')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      organization: { _id: org._id.toString(), name: org.name, slug: org.slug },
      partners: partners.map((p) => {
        const currentOrgId = p.organizationId ? p.organizationId.toString() : null;
        return {
          _id: p._id.toString(),
          name: p.name,
          type: p.type,
          currentOrganizationId: currentOrgId,
          currentOrganizationName: currentOrgId ? orgNameById.get(currentOrgId) || '—' : '—',
          isMember: currentOrgId === org._id.toString(),
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

    await connectV3();
    const org = await V3Organization.findById(orgId).select('name slug').lean();
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Move deselected members back to the master organization.
    await V3Entity.updateMany(
      { organizationId: orgId, _id: { $nin: memberPartnerIds } },
      { $set: { organizationId: new ObjectId(MASTER_ORG_ID) } }
    );

    // Assign selected members to this org.
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
