import { NextRequest, NextResponse } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';

// Retired event-level write route. Camera photo analytics must use the
// authenticated per-photo result endpoint so Messmass can validate the full ID tuple.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json(
    { success: false, error: { code: 'EVENT_LEVEL_EXPORT_RETIRED', message: 'Event-level Fanmass stats are retired. Submit one photo analysis to the photo result endpoint.' } },
    { status: 410 },
  );
}
