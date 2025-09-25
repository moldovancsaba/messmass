import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { env } from '@/lib/config';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

// Use centralized Mongo client and config

// Verify SSO token with the external service
async function verifySSO(token: string) {
  try {
    // WHAT: Use SSO base URL from centralized configuration.
    // WHY: Remove hard-coded service base and allow environment-specific overrides.
    const ssoBase = env.require('SSO_BASE_URL');
    const response = await fetch(`${ssoBase}/api/validate`, {
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
    console.error('SSO verification failed:', error);
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
  return user !== null && (user.role === 'admin' || user.role === 'super_admin');
}

// GET /api/admin/permissions - Get all project permissions (admin only)
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

    console.log(`🔐 Admin ${user.name} accessing permissions`);

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('project_permissions');

    // Get all permissions
    const permissions = await collection
      .find({})
      .sort({ grantedAt: -1 })
      .toArray();

    console.log(`✅ Retrieved ${permissions.length} permissions for admin`);

    const formattedPermissions = permissions.map(permission => ({
      _id: permission._id.toString(),
      projectId: permission.projectId,
      userId: permission.userId,
      role: permission.role,
      grantedAt: permission.grantedAt,
      grantedBy: permission.grantedBy
    }));

    return NextResponse.json({
      success: true,
      permissions: formattedPermissions,
      meta: {
        total: permissions.length,
        requestedBy: user.email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch admin permissions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch permissions' 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/permissions - Grant or update project permission (admin only)
export async function POST(request: NextRequest) {
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
    const { projectId, userId, role } = body;

    if (!projectId || !userId || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['owner', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    console.log(`🔐 Admin ${user.name} setting permission: ${userId} -> ${role} on ${projectId}`);

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('project_permissions');

    // Check if permission already exists
    const existingPermission = await collection.findOne({
      projectId,
      userId
    });

    const now = new Date().toISOString();

    if (existingPermission) {
      // Update existing permission
      const result = await collection.updateOne(
        { projectId, userId },
        {
          $set: {
            role,
            updatedAt: now,
            updatedBy: user.id
          }
        }
      );

      console.log(`✅ Permission updated for user ${userId} on project ${projectId}`);

      return NextResponse.json({
        success: true,
        message: 'Permission updated successfully',
        permission: {
          projectId,
          userId,
          role,
          updatedAt: now
        }
      });
    } else {
      // Create new permission
      const permission = {
        projectId,
        userId,
        role,
        grantedAt: now,
        grantedBy: user.id
      };

      const result = await collection.insertOne(permission);

      console.log(`✅ Permission granted: ${userId} -> ${role} on project ${projectId}`);

      return NextResponse.json({
        success: true,
        message: 'Permission granted successfully',
        permissionId: result.insertedId.toString(),
        permission: {
          _id: result.insertedId.toString(),
          ...permission
        }
      });
    }

  } catch (error) {
    console.error('❌ Failed to grant permission:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to grant permission' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/permissions - Revoke project permission (admin only)
export async function DELETE(request: NextRequest) {
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

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing projectId or userId' },
        { status: 400 }
      );
    }

    console.log(`🔐 Admin ${user.name} revoking permission: ${userId} from ${projectId}`);

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('project_permissions');

    // Delete the permission
    const result = await collection.deleteOne({
      projectId,
      userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Permission revoked: ${userId} from project ${projectId}`);

    // Log the revocation for audit purposes
    const auditCollection = db.collection('audit_logs');
    await auditCollection.insertOne({
      action: 'permission_revoked',
      projectId,
      userId,
      revokedBy: user.id,
      revokedByEmail: user.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Permission revoked successfully',
      revokedPermission: {
        projectId,
        userId,
        revokedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to revoke permission:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to revoke permission' 
      },
      { status: 500 }
    );
  }
}