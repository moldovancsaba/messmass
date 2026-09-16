// app/api/stakeholder/invite/route.ts
// WHAT: Admin-only endpoint to invite an external stakeholder (sponsor/agency/
//     media/operator) to a report by email. Creates the grant messmass's own
//     stakeholder-callback route checks after SSO verifies the person's identity.
// WHY: messmass#231. No token is minted or emailed here -- SSO's own public
//     login (magic link, social, or password, whichever the person already
//     uses) is what actually authenticates them; this endpoint only records
//     that this email is allowed in, with which role, for which report.
// HOW: The admin shares the login link with the stakeholder out of band (or a
//     follow-up phase wires an email send through camera/Resend, per SEYU's
//     "one Resend" convention) -- this route's job ends at recording the grant.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiGuards';
import { getAdminUser } from '@/lib/auth';
import { createGrant, STAKEHOLDER_ROLES, type StakeholderRole } from '@/lib/stakeholderGrants';
import type { ReportVariantOwnerType } from '@/lib/reportVariants';

const SCOPE_TYPES: ReportVariantOwnerType[] = ['organization', 'partner', 'hashtag', 'filter'];

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const role = body?.role as StakeholderRole;
    const scopeType = body?.scopeType as ReportVariantOwnerType;
    const scopeId = typeof body?.scopeId === 'string' ? body.scopeId.trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });
    }
    if (!STAKEHOLDER_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `role must be one of: ${STAKEHOLDER_ROLES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!SCOPE_TYPES.includes(scopeType)) {
      return NextResponse.json(
        { success: false, error: `scopeType must be one of: ${SCOPE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!scopeId) {
      return NextResponse.json({ success: false, error: 'A valid scopeId is required.' }, { status: 400 });
    }

    const admin = await getAdminUser();
    const grant = await createGrant({ email, role, scopeType, scopeId, invitedBy: admin!.email });

    return NextResponse.json({
      success: true,
      grant: { ...grant, _id: grant._id.toString() },
      loginUrl: '/api/auth/sso/stakeholder-login',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create stakeholder invite.' }, { status: 500 });
  }
}
