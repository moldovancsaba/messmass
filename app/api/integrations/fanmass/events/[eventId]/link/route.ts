import { NextRequest, NextResponse } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';

export async function GET(
  request: NextRequest,
  _context: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json({ success: false, error: { code: 'EVENT_BATCH_LINKS_RETIRED', message: 'Photo results use the exact Messmass, Camera partner, event, and photo identifiers.' } }, { status: 410 });
}

export async function POST(
  request: NextRequest,
  _context: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json({ success: false, error: { code: 'EVENT_BATCH_LINKS_RETIRED', message: 'Messmass events link one-to-one with Camera; Fanmass receives the exact IDs on each photo task.' } }, { status: 410 });
}
