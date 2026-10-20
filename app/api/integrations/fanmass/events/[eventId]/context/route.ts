import { NextRequest } from 'next/server';
import { requireFanmassIntegrationAuth, retiredFanmassEndpoint } from '@/lib/fanmassIntegration';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;

  return retiredFanmassEndpoint(
    'EVENT_CONTEXT_RETIRED',
    'Fanmass receives Camera photo IDs and the linked Messmass event ID with each photo task; it does not fetch event or partner context from Messmass.',
  );
}
