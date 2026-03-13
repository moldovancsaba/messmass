import { NextResponse } from 'next/server';
import connectV3 from '@/lib/mongoose-v3';
import V3Entity from '@/lib/models/v3/Entity';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';

/**
 * GET /api/v3/entities/[id]
 * 
 * Returns full metadata for a specific entity and lists its direct children.
 * Scoped by 'x-v3-org-id' via withOrgContext middleware.
 */
async function getEntityDetail(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await connectV3();
    const orgId = req.headers.get('x-v3-org-id');

    // Fetch the main entity
    const entity = await V3Entity.findOne({ 
      _id: id, 
      organizationId: orgId 
    }).lean();

    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    // Fetch 1-level children
    const children = await V3Entity.find({ 
      parentEntityId: id,
      organizationId: orgId 
    })
    .select('name type status')
    .sort({ name: 1 })
    .lean();

    return NextResponse.json({
      ...entity,
      children,
    }, { status: 200 });
  } catch (error: any) {
    console.error(`❌ GET /api/v3/entities/${params?.id} failed:`, error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}

// Wrap with Organization Context Middleware
// Note: withOrgContext expects a handler that takes (req: Request). 
// For route segments with params, we need to adapt it.
export const GET = (req: Request, context: any) => 
  withOrgContext(req, (r) => getEntityDetail(r, context));
