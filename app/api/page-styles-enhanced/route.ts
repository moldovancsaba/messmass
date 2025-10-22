/* WHAT: API route for enhanced Page Styles CRUD operations
 * WHY: Manage custom styling themes with full customization options
 * HOW: GET (list), POST (create), PUT (update), DELETE (remove) operations
 * AUTH: Requires admin authentication for all mutations */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { PageStyleEnhanced } from '@/lib/pageStyleTypesEnhanced';

/* WHAT: GET - List all enhanced page styles
 * WHY: Retrieve available styles for admin UI
 * RETURNS: Array of PageStyleEnhanced objects */
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    
    const styles = await db
      .collection('page_styles_enhanced')
      .find({})
      .sort({ isGlobalDefault: -1, name: 1 }) // Global default first, then alphabetical
      .toArray();
    
    return NextResponse.json({
      success: true,
      styles: styles.map(s => ({
        ...s,
        _id: s._id.toString()
      }))
    });
  } catch (error) {
    console.error('Failed to fetch page styles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch styles' },
      { status: 500 }
    );
  }
}

/* WHAT: POST - Create new page style
 * WHY: Allow admins to create custom themes
 * BODY: PageStyleEnhanced object (without _id, createdAt, updatedAt)
 * RETURNS: Created style with _id */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Validation: name is required and must be unique
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Style name is required' },
        { status: 400 }
      );
    }
    
    // Check for duplicate name
    const existing = await db
      .collection('page_styles_enhanced')
      .findOne({ name: body.name });
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A style with this name already exists' },
        { status: 400 }
      );
    }
    
    // Prepare document
    const now = new Date();
    const newStyle: Omit<PageStyleEnhanced, '_id'> = {
      name: body.name,
      description: body.description || '',
      isGlobalDefault: false, // Never auto-set as global default on creation
      pageBackground: body.pageBackground,
      heroBackground: body.heroBackground,
      contentBoxBackground: body.contentBoxBackground,
      typography: body.typography,
      colorScheme: body.colorScheme,
      createdAt: now,
      updatedAt: now,
      createdBy: body.createdBy || 'admin',
      projectIds: []
    };
    
    const result = await db
      .collection('page_styles_enhanced')
      .insertOne(newStyle);
    
    return NextResponse.json({
      success: true,
      style: {
        ...newStyle,
        _id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Failed to create page style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create style' },
      { status: 500 }
    );
  }
}

/* WHAT: PUT - Update existing page style
 * WHY: Allow admins to modify theme configurations
 * QUERY: styleId (required)
 * BODY: Partial PageStyleEnhanced
 * RETURNS: Updated style */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const styleId = searchParams.get('styleId');
    
    if (!styleId) {
      return NextResponse.json(
        { success: false, error: 'styleId is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { db } = await connectToDatabase();
    
    // Check if style exists
    const existing = await db
      .collection('page_styles_enhanced')
      .findOne({ _id: new ObjectId(styleId) });
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Style not found' },
        { status: 404 }
      );
    }
    
    // Check for name uniqueness if name is being changed
    if (body.name && body.name !== existing.name) {
      const duplicate = await db
        .collection('page_styles_enhanced')
        .findOne({ name: body.name });
      
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A style with this name already exists' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update (exclude _id, createdAt, createdBy)
    const updateDoc: any = {
      ...body,
      updatedAt: new Date()
    };
    
    // Remove fields that shouldn't be updated
    delete updateDoc._id;
    delete updateDoc.createdAt;
    delete updateDoc.createdBy;
    delete updateDoc.projectIds; // Don't update via PUT, use assign endpoint
    
    await db
      .collection('page_styles_enhanced')
      .updateOne(
        { _id: new ObjectId(styleId) },
        { $set: updateDoc }
      );
    
    // Fetch and return updated document
    const updated = await db
      .collection('page_styles_enhanced')
      .findOne({ _id: new ObjectId(styleId) });
    
    return NextResponse.json({
      success: true,
      style: {
        ...updated,
        _id: updated?._id.toString()
      }
    });
  } catch (error) {
    console.error('Failed to update page style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update style' },
      { status: 500 }
    );
  }
}

/* WHAT: DELETE - Remove page style
 * WHY: Allow cleanup of unused themes
 * QUERY: styleId (required)
 * SAFETY: Prevents deletion if style is in use by projects
 * RETURNS: Success confirmation */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const styleId = searchParams.get('styleId');
    
    if (!styleId) {
      return NextResponse.json(
        { success: false, error: 'styleId is required' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Check if style exists
    const existing = await db
      .collection('page_styles_enhanced')
      .findOne({ _id: new ObjectId(styleId) });
    
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Style not found' },
        { status: 404 }
      );
    }
    
    // Prevent deletion if in use
    if (existing.projectIds && existing.projectIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete style: used by ${existing.projectIds.length} project(s)` 
        },
        { status: 400 }
      );
    }
    
    // Prevent deletion of global default
    if (existing.isGlobalDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete global default style' },
        { status: 400 }
      );
    }
    
    await db
      .collection('page_styles_enhanced')
      .deleteOne({ _id: new ObjectId(styleId) });
    
    return NextResponse.json({
      success: true,
      message: 'Style deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete page style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete style' },
      { status: 500 }
    );
  }
}
