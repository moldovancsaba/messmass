/* WHAT: API endpoint to assign page style to projects
 * WHY: Allow specific projects to use custom styles
 * HOW: Update both project.styleId and style.projectIds
 * AUTH: Requires admin authentication */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { ObjectId } from 'mongodb';

/* WHAT: POST - Assign style to project
 * WHY: Link custom theme to specific project
 * BODY: { styleId: string, projectId: string }
 * RETURNS: Success confirmation */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { styleId, projectId } = body;
    
    if (!styleId || !projectId) {
      return NextResponse.json(
        { success: false, error: 'styleId and projectId are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // Validate style exists
    const style = await db
      .collection('page_styles_enhanced')
      .findOne({ _id: new ObjectId(styleId) });
    
    if (!style) {
      return NextResponse.json(
        { success: false, error: 'Style not found' },
        { status: 404 }
      );
    }
    
    // Validate project exists
    const project = await db
      .collection('projects')
      .findOne({ _id: new ObjectId(projectId) });
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Remove project from previous style's projectIds (if any)
    if (project.styleIdEnhanced) {
      await db
        .collection('page_styles_enhanced')
        .updateOne(
          { _id: new ObjectId(project.styleIdEnhanced) },
          { 
            $pull: { projectIds: projectId },
            $set: { updatedAt: new Date() }
          }
        );
    }
    
    // Update project with new styleId
    await db
      .collection('projects')
      .updateOne(
        { _id: new ObjectId(projectId) },
        { 
          $set: { 
            styleIdEnhanced: styleId,
            updatedAt: new Date().toISOString()
          }
        }
      );
    
    // Add project to new style's projectIds
    await db
      .collection('page_styles_enhanced')
      .updateOne(
        { _id: new ObjectId(styleId) },
        { 
          $addToSet: { projectIds: projectId },
          $set: { updatedAt: new Date() }
        }
      );
    
    return NextResponse.json({
      success: true,
      message: `Project "${project.eventName}" now uses style "${style.name}"`
    });
  } catch (error) {
    console.error('Failed to assign style to project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign style' },
      { status: 500 }
    );
  }
}

/* WHAT: DELETE - Remove style assignment from project
 * WHY: Revert project to using global default
 * BODY: { projectId: string }
 * RETURNS: Success confirmation */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // Get project to find current styleId
    const project = await db
      .collection('projects')
      .findOne({ _id: new ObjectId(projectId) });
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Remove from style's projectIds
    if (project.styleIdEnhanced) {
      await db
        .collection('page_styles_enhanced')
        .updateOne(
          { _id: new ObjectId(project.styleIdEnhanced) },
          { 
            $pull: { projectIds: projectId },
            $set: { updatedAt: new Date() }
          }
        );
    }
    
    // Remove styleId from project
    await db
      .collection('projects')
      .updateOne(
        { _id: new ObjectId(projectId) },
        { 
          $unset: { styleIdEnhanced: '' },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    
    return NextResponse.json({
      success: true,
      message: `Project "${project.eventName}" now uses the global default style`
    });
  } catch (error) {
    console.error('Failed to remove style assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove assignment' },
      { status: 500 }
    );
  }
}
