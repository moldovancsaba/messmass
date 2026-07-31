// app/api/admin/register/route.ts
// WHAT: Self-service local-account registration has been removed -- SSO
//     (sso.doneisbetter.com) is now the only way to get access.
// WHY: SSO_EMAIL_UNIFICATION_PLAN.md Phase 4 follow-up.

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Self-registration has been removed. Sign in with DoneIsBetter to request access.', ssoLoginUrl: '/api/auth/sso/login' },
    { status: 410 }
  );
}
