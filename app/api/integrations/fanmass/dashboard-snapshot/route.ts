// Retired Fanmass dashboard export. Messmass owns event analytics and derives
// them from stored per-photo result records.

import { NextRequest, NextResponse } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return NextResponse.json(
    { success: false, error: { code: 'FANMASS_DASHBOARD_EXPORT_RETIRED', message: 'Fanmass returns per-photo analysis facts; Messmass builds the event dashboard and report.' } },
    { status: 410 },
  );
}
