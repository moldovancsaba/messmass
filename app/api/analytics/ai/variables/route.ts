/** Retired: cross-event variable fill rates mixed old batch aggregates with
 * photo results and are not valid without Camera's eligible-photo denominator. */

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
      { success: false, error: { code: 'AI_VARIABLE_FILL_RATES_RETIRED', message: 'Event-wide AI variable fill rates are misleading without the eligible-photo denominator. Report variables remain available from per-photo results.' } },
      { status: 410 },
    );
  } catch (error) {
    console.error('AI analytics variables failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AI_VARIABLES_FAILED', message: 'Could not load AI analytics variables.' } },
      { status: 500 }
    );
  }
}
