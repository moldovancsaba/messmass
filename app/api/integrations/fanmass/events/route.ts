import { NextRequest, NextResponse } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';

// Messmass owns event creation. Fanmass receives source event identifiers with
// each photo task and returns photo-scoped results only.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json(
    { success: false, error: { code: 'MESSMASS_OWNS_EVENTS', message: 'Events are created in Messmass and linked one-to-one with Camera. Fanmass accepts photo-analysis tasks and returns photo results.' } },
    { status: 410 },
  );
}
