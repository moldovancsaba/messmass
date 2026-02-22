import { NextRequest, NextResponse } from 'next/server';
import { error as logError, info as logInfo } from '@/lib/logger';
import { MongoClient, ObjectId } from 'mongodb';
import config from '@/lib/config';
import { validateSSOSession, type SSOUser } from '@/lib/ssoClient';

const MONGODB_URI = config.mongodbUri;
const MONGODB_DB = config.dbName;

let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client;
  } catch (error) {
    logError('Failed to connect to MongoDB', { context: 'admin/projects' }, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

// Check if user has admin privileges
function isAdmin(user: SSOUser | null): boolean {
  return user !== null && (user.role === 'admin' || user.role === 'superadmin');
}

// GET /api/admin/projects - Get all projects (admin only)
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
    const user = await validateSSOSession(token);

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

    logInfo('Admin accessing projects', { context: 'admin/projects', adminName: user.name, adminEmail: user.email });

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // Get all projects with additional metadata
    const projects = await collection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    logInfo('Retrieved projects for admin', { context: 'admin/projects', projectCount: projects.length, adminEmail: user.email });

    const formattedProjects = projects.map(project => ({
      _id: project._id.toString(),
      eventName: project.eventName,
      eventDate: project.eventDate,
      viewSlug: (project as any).viewSlug ?? null,
      stats: project.stats,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdBy: project.createdBy || 'unknown',
      collaborators: project.collaborators || []
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
      meta: {
        total: projects.length,
        requestedBy: user.email,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logError('Failed to fetch admin projects', { context: 'admin/projects' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch projects' 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/projects - Create project as admin
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
    const user = await validateSSOSession(token);

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
    const { eventName, eventDate, stats, assignedTo } = body;

    if (!eventName || !eventDate || !stats) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logInfo('Admin creating project', { context: 'admin/projects', adminName: user.name, adminEmail: user.email, eventName });

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    const now = new Date().toISOString();
    const project = {
      eventName,
      eventDate,
      stats,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      collaborators: assignedTo ? [assignedTo] : [],
      isAdminCreated: true
    };

    const result = await collection.insertOne(project);
    logInfo('Admin project created successfully', { context: 'admin/projects', projectId: result.insertedId.toString(), eventName, adminEmail: user.email });

    return NextResponse.json({
      success: true,
      projectId: result.insertedId.toString(),
      project: {
        _id: result.insertedId.toString(),
        ...project
      }
    });

  } catch (error) {
    logError('Failed to create admin project', { context: 'admin/projects' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create project' 
      },
      { status: 500 }
    );
  }
}