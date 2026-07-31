// app/api/admin/email-selftest/route.ts
// WHAT: Sends a fixed diagnostic email to SUPERADMIN_EMAIL to confirm the
//      camera email service (SSO_EMAIL_UNIFICATION_PLAN.md) is actually
//      delivering, end to end, in this environment.
// WHY: lib/emailNotifications.ts's real behavior depends on two secrets
//      (CAMERA_MESSMASS_INTERNAL_SECRET, camera's RESEND_API_KEY) that are
//      never readable outside their own Vercel projects -- this is the
//      only way to prove delivery actually works without exposing either.
// SAFETY: recipient is NEVER caller-supplied -- always the app's own
//      configured SUPERADMIN_EMAIL, so this can't be used to spam a third
//      party. Strictly rate-limited. Kept as a permanent, small health check
//      (matches "/api/health"-style diagnostics), not throwaway test code.

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { env } from '@/lib/config';
import { testEmailConfig } from '@/lib/emailNotifications';

export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const identifier = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const rl = checkRateLimit(`email-selftest:${identifier}`, RATE_LIMITS.AUTH);
  if (!rl.allowed) {
    return NextResponse.json({ error: RATE_LIMITS.AUTH.message }, { status: 429 });
  }

  const recipient = env.get('SUPERADMIN_EMAIL');
  if (!recipient) {
    return NextResponse.json(
      { sent: false, error: 'SUPERADMIN_EMAIL is not configured' },
      { status: 200 }
    );
  }

  const sent = await testEmailConfig(recipient);
  return NextResponse.json({ sent, recipient });
}
