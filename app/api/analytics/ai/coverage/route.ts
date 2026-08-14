/**
 * AI Analytics — coverage summary
 *
 * WHAT: How much of the estate has AI analytics, and how much of that is stale.
 * WHY: The entry number for the AI Analytics workspace — the interesting figure is
 *      `notConnected`, because that is the gap nobody could see before.
 *
 * AUTH: Authenticated session, ANY role. This is deliberate and differs from the
 *      other analytics endpoints, which are admin-only: report authors of any role
 *      need this to decide which AI variables are safe to build into a report.
 *      Do not add a role check here without changing the product decision behind it.
 */

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { getAiCoverage } from '@/lib/aiAnalytics';

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) {
      // Distinguishable from an empty result so the UI can prompt a sign-in
      // rather than claiming there is no data.
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view AI analytics.' } },
        { status: 401 }
      );
    }

    const data = await getAiCoverage();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('AI analytics coverage failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AI_COVERAGE_FAILED', message: 'Could not load AI analytics coverage.' } },
      { status: 500 }
    );
  }
}
