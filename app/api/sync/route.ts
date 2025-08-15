import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lastSync = searchParams.get('lastSync');
    const currentProjectId = searchParams.get('currentProjectId');
    
    const client = await clientPromise;
    const db = client.db('messmass');
    
    // Get all projects updated after lastSync
    const query = lastSync ? { updatedAt: { $gt: new Date(lastSync) } } : {};
    const updatedProjects = await db.collection('projects').find(query).sort({ updatedAt: -1 }).toArray();
    
    // If user is viewing a specific project, get its latest version
    let currentProject = null;
    if (currentProjectId) {
      currentProject = await db.collection('projects').findOne({ _id: new ObjectId(currentProjectId) });
    }
    
    return NextResponse.json({ 
      updatedProjects,
      currentProject,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, projectId, data } = await request.json();
    
    const client = await clientPromise;
    const db = client.db('messmass');
    
    if (action === 'heartbeat') {
      // Record user activity for this project
      await db.collection('activity').updateOne(
        { projectId, sessionId: data.sessionId },
        { 
          $set: { 
            lastActive: new Date(),
            projectId,
            sessionId: data.sessionId,
            userName: data.userName || 'Anonymous'
          }
        },
        { upsert: true }
      );
      
      // Get other active users for this project
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeUsers = await db.collection('activity').find({
        projectId,
        lastActive: { $gt: fiveMinutesAgo },
        sessionId: { $ne: data.sessionId }
      }).toArray();
      
      return NextResponse.json({ activeUsers });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat failed:', error);
    return NextResponse.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}