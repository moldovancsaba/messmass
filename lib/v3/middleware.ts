// lib/v3/middleware.ts
// WHAT: V3 Organization Context Middleware
// WHY: Foundations for RBAC and multi-tenancy. Centralizes organization scoping logic.
// HOW: wraps API handlers, injects 'x-v3-org-id' via shared auth logic.

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { warn } from '@/lib/logger';

/**
 * withOrgContext
 * WHAT: Middleware wrapper for API route handlers (v12.1.2+)
 * WHY: Structural foundation for Cross-Organization Reporting Permissions
 * HOW:
 *  1. Checks getAdminUser() for a valid session
 *  2. Derives v3OrgId:
 *     - superadmin -> 'MASTER_ORG_ID'
 *     - organizationIds[0] -> first assigned ID
 *     - default -> 'DEFAULT_ORG_ID'
 *  3. Injects 'x-v3-org-id' into request headers
 */
export async function withOrgContext(
  req: Request, 
  handler: (req: Request, context: any) => Promise<Response>
) {
  try {
    const user = await getAdminUser();

    if (!user) {
      warn('V3 API Unauthorized access attempt', { url: req.url });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Logical mapping as per #403 spec
    let v3OrgId = 'DEFAULT_ORG_ID';
    
    if (user.role === 'superadmin') {
      v3OrgId = 'MASTER_ORG_ID';
    } else if (user.organizationIds && user.organizationIds.length > 0) {
      v3OrgId = user.organizationIds[0];
    }

    // Inject header
    const headers = new Headers(req.headers);
    headers.set('x-v3-org-id', v3OrgId);

    // Continue to handler with cloned request but new headers
    return handler(new Request(req, { headers }), {});

  } catch (error) {
    console.error('withOrgContext error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
