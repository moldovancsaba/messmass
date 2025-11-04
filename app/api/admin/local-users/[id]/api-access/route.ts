// app/api/admin/local-users/[id]/api-access/route.ts
// WHAT: Admin endpoint to enable/disable API access for users
// WHY: Control which users can authenticate via Bearer tokens to public API

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import { toggleAPIAccess, findUserById } from '@/lib/users';
import { info, warn } from '@/lib/logger';

// WHAT: Force Node.js runtime
// WHY: Uses MongoDB operations that require Node.js APIs
export const runtime = 'nodejs';

/**
 * PUT /api/admin/local-users/[id]/api-access
 * WHAT: Enable or disable API access for a specific user
 * WHY: Admins need granular control over who can use Bearer token authentication
 * 
 * AUTH: Admin session required (getAdminUser)
 * BODY: { enabled: boolean }
 * 
 * SECURITY:
 *   - Cannot disable if user has active API usage within last 5 minutes
 *   - Suggests password regeneration when enabling (security best practice)
 *   - Logs all enable/disable actions with actor and target
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // WHAT: Await params Promise (Next.js 15 requirement)
    const { id } = await params;
    
    // WHAT: Verify admin authentication
    // WHY: Only admins can modify API access settings
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    // WHAT: Parse request body
    const body = await request.json();
    const { enabled } = body;
    
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled field must be boolean' },
        { status: 400 }
      );
    }
    
    // WHAT: Fetch target user
    // WHY: Need to check current state before modification
    const targetUser = await findUserById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // WHAT: Check if disabling user with recent API activity
    // WHY: Prevent disrupting active integrations without warning
    if (!enabled && targetUser.lastAPICallAt) {
      const lastCall = new Date(targetUser.lastAPICallAt);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (lastCall > fiveMinutesAgo) {
        warn('API access disable blocked: recent activity', {
          adminId: admin.id,
          targetUserId: id,
          lastAPICallAt: targetUser.lastAPICallAt
        });
        
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot disable API access: user made API calls within last 5 minutes',
            lastAPICallAt: targetUser.lastAPICallAt,
            suggestion: 'Wait 5 minutes or contact the user before disabling'
          },
          { status: 409 }
        );
      }
    }
    
    // WHAT: Toggle API access in database
    const updatedUser = await toggleAPIAccess(id, enabled);
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    // WHAT: Log the action for audit trail
    // WHY: Track who enabled/disabled API access for whom
    const action = enabled ? 'enabled' : 'disabled';
    info(`API access ${action}`, {
      adminId: admin.id,
      adminEmail: admin.email,
      targetUserId: id,
      targetEmail: updatedUser.email,
      action,
      tags: ['api-access', 'security', 'audit']
    });
    
    // WHAT: Build response with recommendations
    let message = `API access ${action} successfully`;
    let recommendation: string | undefined;
    
    if (enabled) {
      recommendation = 'Security tip: Regenerate password to create a long random API key';
    }
    
    return NextResponse.json({
      success: true,
      message,
      recommendation,
      user: {
        id: updatedUser._id?.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        apiKeyEnabled: updatedUser.apiKeyEnabled,
        apiUsageCount: updatedUser.apiUsageCount || 0,
        lastAPICallAt: updatedUser.lastAPICallAt,
        updatedAt: updatedUser.updatedAt
      }
    });
    
  } catch (error) {
    console.error('API access toggle error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle API access'
      },
      { status: 500 }
    );
  }
}
