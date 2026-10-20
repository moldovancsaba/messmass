/** Retired: Messmass does not own Camera's eligible-photo denominator, so it
 * cannot report event processing coverage or completion percentages. */

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view AI analytics.' } },
        { status: 401 }
      );
    }

    // Keep the retired response behind the same administrator access rule as
    // the active AI photo-results endpoints.
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Administrator access required.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'EVENT_COVERAGE_UNAVAILABLE', message: 'Messmass has no Camera eligible-photo denominator. Use stored per-photo results; event completion and coverage are not inferred.' } },
      { status: 410 },
    );
  } catch (error) {
    console.error('AI analytics coverage failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AI_COVERAGE_FAILED', message: 'Could not load AI analytics coverage.' } },
      { status: 500 }
    );
  }
}
