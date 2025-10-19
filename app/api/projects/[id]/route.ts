// app/api/projects/[id]/route.ts - Fixed for Next.js 15
import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import config from '@/lib/config'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  const client = await clientPromise
  
  try {
    const { id } = await context.params
    
    const db = client.db(config.dbName)
    const collection = db.collection('projects')
    
    const project = await collection.findOne({ _id: new ObjectId(id) })
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      project
    })
  } catch (error) {
    console.error('❌ Error fetching project:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    // Shared client managed by lib/mongodb; no manual close.
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  const client = await clientPromise
  
  try {
    const { id } = await context.params
    const updateData = await request.json()
    console.log('📝 Updating project:', id, 'with data:', updateData)
    
    const db = client.db(config.dbName)
    const collection = db.collection('projects')
    
    // Ensure stats object exists and merge with new data
    const existingProject = await collection.findOne({ _id: new ObjectId(id) })
    if (!existingProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    const updatedStats = {
      ...existingProject.stats,
      ...updateData.stats
    }
    
    // Ensure derived metrics are present and up-to-date
    const { addDerivedMetrics } = await import('@/lib/projectStatsUtils');
    const statsWithDerived = addDerivedMetrics(updatedStats);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData,
          stats: statsWithDerived,
          updatedAt: new Date()
        }
      }
    )
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Fetch updated project
    const updatedProject = await collection.findOne({ _id: new ObjectId(id) })
    console.log('✅ Project updated successfully')
    
    // WHAT: Log notification for stats update
    // WHY: Notify all users when project statistics are modified
    try {
      const { getCurrentUser, createNotification } = await import('@/lib/notificationUtils');
      const user = await getCurrentUser();
      
      await createNotification(db, {
        activityType: 'edit-stats',
        user,
        projectId: id,
        projectName: existingProject.eventName || 'Unknown Project',
        projectSlug: existingProject.viewSlug || null
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json({
      success: true,
      project: updatedProject
    })
  } catch (error) {
    console.error('❌ Error updating project:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    // Shared client managed by lib/mongodb; no manual close.
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  const client = await clientPromise
  
  try {
    const { id } = await context.params
    console.log('🗑️ Deleting project:', id)
    
    const db = client.db(config.dbName)
    const collection = db.collection('projects')
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Project deleted successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting project:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    // Shared client managed by lib/mongodb; no manual close.
  }
}