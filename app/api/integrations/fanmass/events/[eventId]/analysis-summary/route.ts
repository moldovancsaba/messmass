// Retired event-level write route. Messmass now rebuilds event reports from
// validated, stored per-photo results.

import { NextRequest, NextResponse } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json(
    { success: false, error: { code: 'EVENT_LEVEL_EXPORT_RETIRED', message: 'Fanmass delivers one photo result at a time. Messmass derives event reports from those photo results.' } },
    { status: 410 },
  );
}
