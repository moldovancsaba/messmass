import { NextRequest } from 'next/server';
import { handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { createVariable, listVariables } from '@/lib/fanmassMapping';

// GET /api/integrations/fanmass/variables — list messmass variables (mapping targets)
export async function GET(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const variables = await listVariables();
    return jsonSuccess({ variables, count: variables.length });
  } catch (err) {
    return handleRouteError(err);
  }
}

// POST /api/integrations/fanmass/variables  { name, label?, type?, category?, unit?, description? }
// Upserts a variable definition (variables_metadata). name is the stats key.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    const { variable, created } = await createVariable({
      name: body.name,
      label: body.label,
      type: body.type,
      category: body.category,
      unit: body.unit,
      description: body.description,
    });
    return jsonSuccess({ variable, created }, created ? 201 : 200);
  } catch (err) {
    return handleRouteError(err);
  }
}
