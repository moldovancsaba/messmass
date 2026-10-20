import { NextRequest, NextResponse } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json({ success: false, error: { code: 'EVENT_RESCAN_RETIRED' } }, { status: 410 });
}
