// app/api/analytics/ai/events/[eventId]/summary/route.ts
// WHAT: Read the stored AI analysis summary for one event.
// WHY: The AI event report renders this — brands, clubs/federations, merchandise,
//     demographics — instead of only the scalar variables.
// AUTH: Authenticated session, ANY role. Same deliberate posture as the other AI
//     analytics endpoints: report authors of any role are the audience. Do not add
//     a role check without changing the product decision behind it.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { getAnalysisSummary } from '@/lib/aiAnalysisSummary';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to view AI analytics.' } },
        { status: 401 }
      );
    }
    const { eventId } = await params;
    const doc = await getAnalysisSummary(eventId);
    if (!doc) {
      // Distinct from an invalid event: the event may exist and simply predate
      // the summary channel, or its analysis has not completed a push yet.
      return NextResponse.json(
        { success: false, error: { code: 'SUMMARY_NOT_FOUND', message: 'No analysis summary has been received for this event yet.' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const code = (err as { code?: string }).code ?? 'AI_SUMMARY_FAILED';
    return NextResponse.json(
      { success: false, error: { code, message: (err as Error).message || 'Could not load the analysis summary.' } },
      { status }
    );
  }
}
