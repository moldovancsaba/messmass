import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('messmass');
    const projects = await db.collection('projects').find({}).sort({ updatedAt: -1 }).toArray();
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { eventName, eventDate, stats } = await request.json();
    
    if (!eventName || !eventDate) {
      return NextResponse.json({ error: 'Event name and date are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('messmass');
    
    const project = {
      eventName,
      eventDate,
      stats,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('projects').insertOne(project);
    
    return NextResponse.json({ 
      success: true, 
      projectId: result.insertedId,
      project: { ...project, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Failed to save project:', error);
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { projectId, eventName, eventDate, stats } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('messmass');
    
    const updateData = {
      eventName,
      eventDate,
      stats,
      updatedAt: new Date()
    };

    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('messmass');
    
    const result = await db.collection('projects').deleteOne({ _id: new ObjectId(projectId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}