import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';

/**
 * withOrgContext Middleware
 * 
 * Injects the Organization context into the request headers based on the 
 * authenticated admin user's affiliation.
 * 
 * For the MVP phase, it defaults to a 'DEFAULT_ORG_ID' unless the user 
 * has a specific organizationId in their metadata (to be implemented).
 */
export async function withOrgContext(req: Request, handler: (req: Request) => Promise<NextResponse>) {
  try {
    const user = await getAdminUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    // Resolve Organization ID
    // 1. Check user metadata for organizationId (future)
    // 2. Default to a global 'MASTER_ORG_ID' for superadmins or 'DEFAULT_ORG_ID'
    // Both branches are the same org, so this selects nothing -- every caller
    // gets Master. That is the open F-004 finding (#395), left as-is here.
    // The condition itself was tested against `permissions`, which has never
    // contained 'superadmin' ('superadmin' is a role, not a permission), so it
    // was always false; now that permissions are actually narrowed per role
    // (F-005), a condition that reads as a privilege check but cannot be true
    // is worse than one that says what it means.
    const v3OrgId = user.role === 'superadmin'
      ? '69b322e0cb8e841f95de9aa1' // Real Master Organization ID
      : '69b322e0cb8e841f95de9aa1'; // Defaulting to Master for MVP phase

    /**
     * In Next.js App Router, headers can be passed by creating a new Request object.
     */
    const headers = new Headers(req.headers);
    headers.set('x-v3-org-id', v3OrgId);
    
    // Create a modified request with the new header
    const modifiedReq = new Request(req.url, {
      method: req.method,
      headers: headers,
      body: req.body,
      // @ts-ignore - Duplex is required for streaming bodies in some environments
      duplex: 'half',
    });

    return await handler(modifiedReq);
  } catch (error: any) {
    console.error('❌ V3 Org Context Middleware Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      message: error.message 
    }, { status: 500 });
  }
}
