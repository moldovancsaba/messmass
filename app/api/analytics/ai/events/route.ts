/**
 * AI Analytics — per-event status
 *
 * WHAT: Every event with its AI analysis status, progress, sources and freshness.
 * WHY: Answers "which events have AI analytics and how far along are they" in one
 *      list, instead of opening events one at a time.
 *
 * AUTH: Authenticated session, ANY role — see the coverage route for why this
 *      deliberately differs from the admin-only analytics endpoints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { getAiEvents, type AiEventStatus } from '@/lib/aiAnalytics';

const VALID_STATUSES: AiEventStatus[] = ['not_connected', 'analyzing', 'complete', 'error'];

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view AI analytics.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    if (statusParam && !VALID_STATUSES.includes(statusParam as AiEventStatus)) {
      // An unknown filter returns an error rather than a silently empty list,
      // which would read as "no events match" and hide the typo.
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_STATUS', message: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        },
        { status: 400 }
      );
    }

    // Clamp rather than reject: a bad limit should not fail the page.
    const rawLimit = Number(searchParams.get('limit'));
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.trunc(rawLimit), 500) : 200;

    const data = await getAiEvents({
      status: (statusParam as AiEventStatus) || undefined,
      limit,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('AI analytics events failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AI_EVENTS_FAILED', message: 'Could not load AI analytics events.' } },
      { status: 500 }
    );
  }
}
