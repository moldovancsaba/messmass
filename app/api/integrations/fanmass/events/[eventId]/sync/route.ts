import { NextRequest, NextResponse } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';

export async function GET(
  request: NextRequest,
  _context: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json({ success: false, error: { code: 'EVENT_LEVEL_SYNC_RETIRED' } }, { status: 410 });
}

export async function POST(
  request: NextRequest,
  _context: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json(
    { success: false, error: { code: 'EVENT_LEVEL_SYNC_RETIRED', message: 'Messmass accepts only individual photo result records from Fanmass.' } },
    { status: 410 },
  );
}
