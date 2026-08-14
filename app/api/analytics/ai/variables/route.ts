/**
 * AI Analytics — variable catalogue
 *
 * WHAT: Every AI-owned variable with how completely it is populated across
 *      connected events, plus the token to paste into a chart formula.
 * WHY: This is the endpoint that makes AI analytics usable in reports. Fill rate
 *      is the number that decides whether a variable belongs in a template: on the
 *      current estate the merch variables sit at 1.3% (2 of 155 events), so a
 *      report built on one renders empty almost everywhere.
 *
 * AUTH: Authenticated session, ANY role — see the coverage route for why this
 *      deliberately differs from the admin-only analytics endpoints.
 */

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { getAiVariables } from '@/lib/aiAnalytics';

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view AI analytics.' } },
        { status: 401 }
      );
    }

    const variables = await getAiVariables();
    return NextResponse.json({ success: true, data: { variables } });
  } catch (error) {
    console.error('AI analytics variables failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AI_VARIABLES_FAILED', message: 'Could not load AI analytics variables.' } },
      { status: 500 }
    );
  }
}
