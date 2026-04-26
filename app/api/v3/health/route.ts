// app/api/v3/health/route.ts
// WHAT: V3 Health & Context Verification Endpoint
// WHY: Infrastructure validation for organization context injection
// HOW: Uses withOrgContext wrapper and returns the injected header

import { NextResponse } from 'next/server';
import { withOrgContext } from '@/lib/v3/middleware';

async function handler(req: Request) {
  const v3OrgId = req.headers.get('x-v3-org-id');
  
  return NextResponse.json({
    status: 'ok',
    v3: true,
    context: {
      organizationId: v3OrgId
    },
    timestamp: new Date().toISOString()
  });
}

// Export wrapped GET handler
export const GET = (req: Request) => withOrgContext(req, handler);
export const POST = (req: Request) => withOrgContext(req, handler);
