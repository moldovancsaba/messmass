// The path the SZRT delivery used before the evidence library became global. Same handler: a sender that names no
// origin is SZRT. New senders use /api/integrations/fanmass/evidence and name their origin.
import { NextRequest } from 'next/server';
import { requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { POST as deliver } from '../evidence/route';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  return deliver(request);
}
