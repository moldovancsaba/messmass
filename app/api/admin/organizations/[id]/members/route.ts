// app/api/admin/organizations/[id]/members/route.ts
// WHAT: Read + update partner membership for an organization
// WHY: Organization Management → Manage Members modal needs add/remove partner assignment

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type OrgRecord = { _id: ObjectId; name: string; slug: string };
type PartnerRecord = { _id: ObjectId; name: string; organizationId?: ObjectId | null };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin authentication required' }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid organization id' }, { status: 400 });
    }
    const orgId = new ObjectId(id);

    const db = await getDb();
    const org = await db.collection<OrgRecord>('organizations').findOne({ _id: orgId });
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const orgs = await db.collection<OrgRecord>('organizations').find({}).toArray();
    const orgNameById = new Map(orgs.map((o) => [o._id.toString(), o.name]));

    const partners = await db
      .collection<PartnerRecord>('partners')
      .find({}, { projection: { name: 1, organizationId: 1 } })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      organization: { _id: org._id.toString(), name: org.name, slug: org.slug },
      partners: partners.map((p) => {
        const currentOrgId = p.organizationId ? p.organizationId.toString() : null;
        return {
          _id: p._id.toString(),
          name: p.name,
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
    const org = await db.collection<OrgRecord>('organizations').findOne({ _id: orgId }, { projection: { name: 1, slug: 1 } });
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Remove members that are currently in this org but not in the new list.
    await db.collection('partners').updateMany(
      { organizationId: orgId, _id: { $nin: memberPartnerIds } },
      { $unset: { organizationId: '' } }
    );

    // Assign selected members to this org (one-org rule: overwrites any previous org).
    if (memberPartnerIds.length > 0) {
      await db.collection('partners').updateMany(
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

