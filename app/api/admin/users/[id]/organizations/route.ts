// app/api/admin/users/[id]/organizations/route.ts
// WHAT: Assign a user to one or more v3 organizations.
// WHY: messmass#395 (F-004). The 10 organizations in this system are real
//     tenants that need an assignment story before per-org v3 scoping means
//     anything (decided 2026-09-17) -- this is that story. Mirrors the
//     existing role-change route's shape (superadmin-only, audit-logged).
// HOW: Every id in organizationIds is checked against the real organizations
//     collection before being saved -- a typo'd or fabricated id must not
//     silently become an unresolvable scope for that user.
//
// NOTE: assigning a user here does not by itself make v3 data appear for
//     their organization. All 459 existing v3_activities are tagged with the
//     hardcoded Master org id (confirmed against production 2026-09-17), not
//     with any of the 10 real organizations -- backfilling that is a
//     separate, real data decision, not something this endpoint does.

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import { findUserById, getUsersCollection } from '@/lib/users';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { error as logError, info as logInfo } from '@/lib/logger';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let id: string | undefined;
  try {
    const currentUser = await getAdminUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (currentUser.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Superadmin access required' }, { status: 403 });
    }

    ({ id } = await params);
    const body = await request.json();
    const organizationIds = body?.organizationIds;
    if (!Array.isArray(organizationIds) || organizationIds.some((v) => typeof v !== 'string')) {
      return NextResponse.json({ success: false, error: 'organizationIds must be an array of strings.' }, { status: 400 });
    }

    const targetUser = await findUserById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const invalidFormat = organizationIds.filter((orgId) => !ObjectId.isValid(orgId));
    if (invalidFormat.length > 0) {
      return NextResponse.json({ success: false, error: `Not a valid organization id: ${invalidFormat.join(', ')}` }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const existing = await db
      .collection('organizations')
      .find({ _id: { $in: organizationIds.map((orgId) => new ObjectId(orgId)) } }, { projection: { _id: 1 } })
      .toArray();
    const existingIds = new Set(existing.map((o) => o._id.toString()));
    const unknown = organizationIds.filter((orgId) => !existingIds.has(orgId));
    if (unknown.length > 0) {
      return NextResponse.json({ success: false, error: `Organization not found: ${unknown.join(', ')}` }, { status: 400 });
    }

    const now = new Date().toISOString();
    const usersCollection = await getUsersCollection();
    await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { organizationIds, updatedAt: now } });

    logInfo('User organization assignment changed', {
      context: 'admin-users-organizations',
      targetUserId: id,
      targetUserEmail: targetUser.email,
      previousOrganizationIds: targetUser.organizationIds || [],
      newOrganizationIds: organizationIds,
      changedBy: currentUser.email,
    });

    const updatedUser = await findUserById(id);
    return NextResponse.json({
      success: true,
      user: { id: updatedUser!._id!.toString(), email: updatedUser!.email, organizationIds: updatedUser!.organizationIds || [] },
    });
  } catch (error) {
    logError('Organization assignment error', { context: 'admin-users-organizations', userId: id || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Failed to update organization assignment.' }, { status: 500 });
  }
}
