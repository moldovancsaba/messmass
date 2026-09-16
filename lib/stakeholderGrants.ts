// lib/stakeholderGrants.ts
// WHAT: CRUD for `stakeholder_grants` -- messmass's own record of which external
//     email addresses may sign in as a sponsor/agency/media/operator stakeholder,
//     and what they're scoped to.
// WHY: messmass#231. SSO's public-user OAuth flow (see lib/auth/ssoOAuth.ts,
//     reused as-is here) proves WHO someone is; it has no concept of "sponsor"
//     vs "agency" vs "media" -- that taxonomy is messmass-specific and has to
//     live here. An admin invites a stakeholder by email *before* they ever log
//     in; the callback route looks up the verified email against this collection
//     to decide whether to let them in and with which role/scope.
// HOW: Deliberately no token/secret handling in this file -- SSO already issued
//     and verified the identity by the time anything here runs (see
//     app/api/auth/sso/stakeholder-callback/route.ts). This is authorization
//     bookkeeping only.

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import type { ReportVariantOwnerType } from '@/lib/reportVariants';

export const STAKEHOLDER_ROLES = ['sponsor', 'agency', 'media', 'operator'] as const;
export type StakeholderRole = (typeof STAKEHOLDER_ROLES)[number];

// Reuses the same owner-type taxonomy Report Variants (#244) already
// established for "which report is this" -- see lib/reportVariants.ts --
// rather than inventing a second, parallel scoping model.
export type StakeholderScopeType = ReportVariantOwnerType;

export interface StakeholderGrant {
  _id: ObjectId;
  email: string; // lowercased, the lookup key
  role: StakeholderRole;
  scopeType: StakeholderScopeType;
  scopeId: string;
  status: 'invited' | 'active' | 'revoked';
  invitedBy: string;
  invitedAt: string;
  activatedAt?: string;
  ssoUserId?: string;
}

async function getGrantsCollection() {
  const client = await clientPromise;
  return client.db(config.dbName).collection<StakeholderGrant>('stakeholder_grants');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createGrant(input: {
  email: string;
  role: StakeholderRole;
  scopeType: StakeholderScopeType;
  scopeId: string;
  invitedBy: string;
}): Promise<StakeholderGrant> {
  const collection = await getGrantsCollection();
  const email = normalizeEmail(input.email);
  const now = new Date().toISOString();

  const grant: Omit<StakeholderGrant, '_id'> = {
    email,
    role: input.role,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    status: 'invited',
    invitedBy: input.invitedBy,
    invitedAt: now,
  };

  // Re-inviting the same email+scope replaces the pending/revoked grant rather
  // than accumulating duplicates -- there is exactly one grant per (email, scope).
  const result = await collection.findOneAndUpdate(
    { email, scopeType: input.scopeType, scopeId: input.scopeId },
    { $set: grant },
    { upsert: true, returnDocument: 'after' }
  );
  return result!;
}

export async function findGrantByEmail(email: string): Promise<StakeholderGrant | null> {
  const collection = await getGrantsCollection();
  return collection.findOne({ email: normalizeEmail(email), status: { $ne: 'revoked' } });
}

export async function activateGrant(grantId: ObjectId, ssoUserId: string): Promise<void> {
  const collection = await getGrantsCollection();
  await collection.updateOne(
    { _id: grantId },
    { $set: { status: 'active', activatedAt: new Date().toISOString(), ssoUserId } }
  );
}
