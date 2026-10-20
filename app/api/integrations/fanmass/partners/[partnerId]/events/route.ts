import { NextRequest } from 'next/server';
import { requireFanmassIntegrationAuth, retiredFanmassEndpoint } from '@/lib/fanmassIntegration';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return retiredFanmassEndpoint('PARTNER_EVENT_LOOKUP_RETIRED', 'Camera provides the Camera and Messmass event IDs on each eligible photo task.');
}
