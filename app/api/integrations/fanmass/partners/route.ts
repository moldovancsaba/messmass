import { NextRequest } from 'next/server';
import { requireFanmassIntegrationAuth, retiredFanmassEndpoint } from '@/lib/fanmassIntegration';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return retiredFanmassEndpoint('PARTNER_LOOKUP_RETIRED', 'Camera provides the partner ID on each eligible photo task.');
}

// Messmass owns partner creation; Fanmass only consumes photo task IDs/context.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return retiredFanmassEndpoint('MESSMASS_OWNS_PARTNERS', 'Partners are created and maintained in Messmass.');
}
