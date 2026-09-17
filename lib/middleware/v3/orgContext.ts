import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

// WHAT: v3 organization scoping -- messmass#395 (F-004).
// WHY: Both branches of the resolution used to return the same hardcoded id,
//     so "scoping" selected nothing; every caller got the same data
//     regardless of role or assignment. Fixed per the policy this needed
//     from the org (recorded 2026-09-17, not invented here):
//       1. A user with no organizationIds falls back to Master, not denied --
//          today that's everyone (0 of 10 users have organizationIds set),
//          and all 459 existing v3_activities are tagged with this exact
//          Master id, so denying by default would show every current user
//          nothing.
//       2. Superadmin is cross-org by definition, not locked to Master --
//          expressed as an explicit ?orgId= override (validated against the
//          organizations collection before being honored), defaulting to
//          Master when not given, so today's behavior is unchanged unless a
//          superadmin actually asks to view a different org.
//       3. The 10 organizations are real tenants needing an assignment story
//          -- see app/api/admin/users/[id]/organizations/route.ts. Actually
//          assigning a user does not yet make v3 data appear for their org,
//          because no v3_activities are tagged with any of those 10 real
//          ids today (confirmed against production) -- that backfill is a
//          separate, real data-migration decision, not something to do
//          silently as part of this fix.
// HOW: Only a superadmin's override is ever honored -- a non-superadmin
//     passing ?orgId= is silently ignored, not an escalation path.

export const MASTER_ORG_ID = '69b322e0cb8e841f95de9aa1';

export interface V3ScopingUser {
  role: string;
  organizationIds?: string[];
}

/**
 * WHAT: The actual scoping decision, pure and unit-tested directly.
 * WHY: Extracted so the policy (who sees what) is testable without a
 *     database or a real Request object.
 */
export function resolveV3OrgId(user: V3ScopingUser, requestedOrgId: string | null): string {
  if (user.role === 'superadmin') {
    return requestedOrgId?.trim() || MASTER_ORG_ID;
  }
  return user.organizationIds?.[0] || MASTER_ORG_ID;
}

/** A superadmin's ?orgId= override is only honored when it names a real organization -- otherwise it's ignored, not passed through as an unchecked filter value. */
async function organizationExists(orgId: string): Promise<boolean> {
  if (!ObjectId.isValid(orgId)) return false;
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const org = await db.collection('organizations').findOne({ _id: new ObjectId(orgId) }, { projection: { _id: 1 } });
  return Boolean(org);
}

export async function withOrgContext(req: Request, handler: (req: Request) => Promise<NextResponse>) {
  try {
    const user = await getAdminUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const requestedOrgId = new URL(req.url).searchParams.get('orgId');
    const verifiedRequestedOrgId = user.role === 'superadmin' && requestedOrgId && (await organizationExists(requestedOrgId))
      ? requestedOrgId
      : null;
    const v3OrgId = resolveV3OrgId(user, verifiedRequestedOrgId);

    const headers = new Headers(req.headers);
    headers.set('x-v3-org-id', v3OrgId);

    const modifiedReq = new Request(req.url, {
      method: req.method,
      headers: headers,
      body: req.body,
      // @ts-ignore - Duplex is required for streaming bodies in some environments
      duplex: 'half',
    });

    return await handler(modifiedReq);
  } catch (error: any) {
    console.error('❌ V3 Org Context Middleware Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message
    }, { status: 500 });
  }
}
