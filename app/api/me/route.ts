// app/api/me/route.ts
// WHAT: User session/profile endpoint
// WHY: Provide current user information for client-side components
// HOW: Return user session data if authenticated

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

/**
 * GET /api/me
 * WHAT: Get current user session information
 * WHY: Client needs to know if user is authenticated and their details
 * 
 * RESPONSE:
 *   - success: boolean
 *   - user: User object if authenticated
 *   - authenticated: boolean
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Check for admin session
    const adminSession = cookieStore.get('admin_session');
    
    if (adminSession) {
      // User is authenticated as admin
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          type: 'admin',
          session: true
        }
      });
    }
    
    // Check for page password authentication
    const pageAuth = cookieStore.get('page_auth');
    
    if (pageAuth) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          type: 'page_user',
          session: true
        }
      });
    }
    
    // Not authenticated
    return NextResponse.json({
      success: true,
      authenticated: false,
      user: null
    });
    
  } catch (error) {
    console.error('[GET /api/me] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get user session',
        authenticated: false
      },
      { status: 500 }
    );
  }
}
