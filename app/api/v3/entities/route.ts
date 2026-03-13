import { NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Entity from '@/lib/models/v3/Entity';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';

/**
 * GET /api/v3/entities
 * 
 * Returns a list of entities filtered by organization, type, or parent.
 * Scoped by 'x-v3-org-id' via withOrgContext middleware.
 */
async function getEntities(req: Request) {
  try {
    await connectV3();
    const { searchParams } = new URL(req.url);
    const orgId = req.headers.get('x-v3-org-id');
    
    // Base filter always includes the organization ID for safety
    const filter: any = { organizationId: orgId };

    // Selective filters
    const type = searchParams.get('type');
    const parentEntityId = searchParams.get('parentEntityId');

    if (type) filter.type = type;
    if (parentEntityId) filter.parentEntityId = parentEntityId === 'null' ? null : parentEntityId;

    const entities = await V3Entity.find(filter)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      count: entities.length,
      entities,
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ GET /api/v3/entities failed:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

// Wrap with Organization Context Middleware
export const GET = (req: Request) => withOrgContext(req, getEntities);
