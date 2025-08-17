// app/api/projects/[id]/route.ts - Fixed for Next.js 15
import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    const { id } = await context.params
    
    await client.connect()
    const db = client.db('messmass')
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
    await client.close()
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    const { id } = await context.params
    const updateData = await request.json()
    console.log('📝 Updating project:', id, 'with data:', updateData)
    
    await client.connect()
    const db = client.db('messmass')
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
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData,
          stats: updatedStats,
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
    await client.close()
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  const client = new MongoClient(MONGODB_URI)
  
  try {
    const { id } = await context.params
    console.log('🗑️ Deleting project:', id)
    
    await client.connect()
    const db = client.db('messmass')
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
    await client.close()
  }
}