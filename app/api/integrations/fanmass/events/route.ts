import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { createEvent } from '@/lib/fanmassMapping';

// POST /api/integrations/fanmass/events  { eventName, eventDate?, partner1Id?, stats? }
// Creates a messmass event (project) linked to the given partner.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    const event = await createEvent({
      eventName: body.eventName,
      eventDate: body.eventDate,
      partner1Id: body.partner1Id || body.partnerId,
      stats: body.stats,
    });
    return jsonSuccess({ event }, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
