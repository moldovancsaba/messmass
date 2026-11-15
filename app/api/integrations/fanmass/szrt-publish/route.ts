// Publish or withdraw the SZRT report's audience, brand and club sections. Only the Fanmass integration token
// reaches this route, the figures routes never change the switch, and every change records who approved it.
import { NextRequest } from 'next/server';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { setSzrtPublication, type PublicationDb } from '@/lib/szrtPublication';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const result = await setSzrtPublication((await getDb()) as unknown as PublicationDb, await request.json().catch(() => null));
    return jsonSuccess(result);
  } catch (err) {
    return handleRouteError(err);
  }
}
