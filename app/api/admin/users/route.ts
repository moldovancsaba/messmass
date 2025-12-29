import { NextRequest, NextResponse } from 'next/server';

import config from '@/lib/config';
import { error as logError, info as logInfo } from '@/lib/logger';

// Verify SSO token with the external service
async function verifySSO(token: string) {
  try {
    // WHAT: Use centralized SSO base URL from config to avoid hard-coded strings.
    // WHY: Centralization eases environment changes and prevents drift across routes.
    const response = await fetch(`${config.ssoBaseUrl}/api/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const userData = await response.json();
    return userData.user;
  } catch (error) {
    logError('SSO verification failed', { context: 'admin/users' }, error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

// User interface for SSO validation
interface SSOUser {
  name: string;
  email: string;
  role: string;
  id?: string;
}

// Check if user has admin privileges
function isAdmin(user: SSOUser | null): boolean {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

// Fetch users from SSO service
async function fetchUsers(token: string) {
  try {
    const response = await fetch(`${config.ssoBaseUrl}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    logError('Failed to fetch users from SSO', { context: 'admin/users' }, error instanceof Error ? error : new Error(String(error)));
    return [];
  }
}

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifySSO(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    logInfo('Admin accessing users list', { context: 'admin/users', adminName: user.name, adminEmail: user.email });

    // Fetch users from SSO service
    const users = await fetchUsers(token);

    logInfo('Retrieved users for admin', { context: 'admin/users', userCount: users.length, adminEmail: user.email });

    return NextResponse.json({
      success: true,
      users: users,
      meta: {
        total: users.length,
        requestedBy: user.email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logError('Failed to fetch admin users', { context: 'admin/users' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch users' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update user role (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifySSO(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logInfo('Admin updating user', { context: 'admin/users', adminName: user.name, adminEmail: user.email, userId, action });

    // Update user via SSO service
    const response = await fetch(`${config.ssoBaseUrl}/api/admin/users`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        role,
        action,
        updatedBy: user.id
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.status}`);
    }

    const result = await response.json();

    logInfo('Admin updated user successfully', { context: 'admin/users', userId, action, adminEmail: user.email });

    return NextResponse.json({
      success: true,
      message: `User ${action} successfully`,
      updatedUser: result.user
    });

  } catch (error) {
    logError('Failed to update user', { context: 'admin/users' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update user' 
      },
      { status: 500 }
    );
  }
}