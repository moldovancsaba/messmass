import { NextRequest, NextResponse } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json(
    { success: false, error: { code: 'EVENT_LEVEL_CALLBACK_RETIRED', message: 'Photo results are delivered independently, one photo at a time.' } },
    { status: 410 },
  );
}
