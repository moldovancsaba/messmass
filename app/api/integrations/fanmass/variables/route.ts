import { NextRequest } from 'next/server';
import { requireFanmassIntegrationAuth, retiredFanmassEndpoint } from '@/lib/fanmassIntegration';

export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return retiredFanmassEndpoint('REPORT_VARIABLE_LOOKUP_RETIRED', 'Fanmass returns normalized photo findings; Messmass owns its report variables and aggregations.');
}

// Messmass owns the report-variable catalogue; Fanmass returns normalized
// photo data under the versioned photo-result contract.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return retiredFanmassEndpoint('MESSMASS_OWNS_REPORT_SCHEMA', 'Fanmass returns normalized photo findings; Messmass owns report variables and aggregates.');
}
