import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { createPartner, listPartners } from '@/lib/fanmassMapping';

// GET /api/integrations/fanmass/partners?search=&limit=&offset=  — list messmass partners
export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const sp = request.nextUrl.searchParams;
    const result = await listPartners({
      search: sp.get('search') || undefined,
      limit: sp.get('limit') ? parseInt(sp.get('limit')!, 10) : undefined,
      offset: sp.get('offset') ? parseInt(sp.get('offset')!, 10) : undefined,
    });
    return jsonSuccess(result);
  } catch (err) {
    return handleRouteError(err);
  }
}

// POST /api/integrations/fanmass/partners  { name, emoji?, logoUrl?, hashtags? }  — create messmass partner
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    const partner = await createPartner({
      name: body.name,
      emoji: body.emoji,
      logoUrl: body.logoUrl,
      hashtags: body.hashtags,
    });
    return jsonSuccess({ partner }, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
