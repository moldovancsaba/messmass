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
    // WHY: Remove hard-coded service base and allow environment-based overrides.
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
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

// DELETE /api/admin/projects/[id] - Delete project (admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params in Next.js 15
    const params = await context.params;
    
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

    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    console.log(`🔐 Admin ${user.name} deleting project: ${params.id}`);

    const client = await clientPromise;
    const db = client.db(config.dbName);
    const collection = db.collection('projects');

    // Get project details before deletion for logging
    const project = await collection.findOne({ _id: new ObjectId(params.id) });
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete the project
    const result = await collection.deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Admin deleted project: ${project.eventName} (${params.id})`);

    // Log the deletion for audit purposes
    const auditCollection = db.collection('audit_logs');
    await auditCollection.insertOne({
      action: 'project_deleted',
      projectId: params.id,
      projectName: project.eventName,
      deletedBy: user.id,
      deletedByEmail: user.email,
      timestamp: new Date().toISOString(),
      projectData: project // Store copy of deleted project
    });

    return NextResponse.json({
      success: true,
      message: `Project "${project.eventName}" deleted successfully`,
      deletedProject: {
        id: params.id,
        name: project.eventName,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Failed to delete admin project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete project' 
      },
      { status: 500 }
    );
  }
}