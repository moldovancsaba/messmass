/* WHAT: CRUD API routes for Available Fonts
 * WHY: Centralized font management stored in MongoDB
 * HOW: MongoDB operations with validation */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { AvailableFont, DEFAULT_FONTS, isValidFontName, isValidFontFamily } from '@/lib/fontTypes';
import { error as logError } from '@/lib/logger';

const DB_NAME = process.env.MONGODB_DB || 'messmass';
const COLLECTION = 'available_fonts';

/**
 * GET /api/available-fonts
 * Fetch all available fonts (active only by default)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Build query
    const query: any = {};
    if (!includeInactive) {
      query.isActive = true;
    }
    
    const fonts = await db
      .collection<AvailableFont>(COLLECTION)
      .find(query)
      .sort({ displayOrder: 1, name: 1 })
      .toArray();
    
    // WHAT: If no fonts in database, return default fonts
    // WHY: Ensure system always has fonts available
    if (fonts.length === 0) {
      return NextResponse.json({
        success: true,
        fonts: DEFAULT_FONTS.map((f, idx) => ({
          ...f,
          _id: `default-${idx}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        isDefault: true
      });
    }
    
    return NextResponse.json({
      success: true,
      fonts: fonts.map(f => ({ ...f, _id: f._id?.toString() })),
      isDefault: false
    });
  } catch (error) {
    logError('Failed to fetch available fonts', { context: 'available-fonts' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fonts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/available-fonts
 * Create new font
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!isValidFontName(body.name)) {
      return NextResponse.json(
        { success: false, error: 'Invalid font name' },
        { status: 400 }
      );
    }
    
    if (!isValidFontFamily(body.fontFamily)) {
      return NextResponse.json(
        { success: false, error: 'Invalid font-family value' },
        { status: 400 }
      );
    }
    
    if (!['google', 'custom', 'system'].includes(body.category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category. Must be: google, custom, or system' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Check if font with same name already exists
    const existing = await db.collection(COLLECTION).findOne({ name: body.name.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Font with this name already exists' },
        { status: 400 }
      );
    }
    
    // Get max displayOrder for new font
    const maxOrder = await db.collection(COLLECTION)
      .findOne({}, { sort: { displayOrder: -1 } });
    const displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 1;
    
    const newFont: Omit<AvailableFont, '_id'> = {
      name: body.name.trim(),
      fontFamily: body.fontFamily.trim(),
      category: body.category,
      isActive: body.isActive !== false, // Default to true
      displayOrder: body.displayOrder ?? displayOrder,
      description: body.description?.trim() || '',
      fontFile: body.fontFile?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result = await db.collection(COLLECTION).insertOne(newFont);
    
    return NextResponse.json({
      success: true,
      fontId: result.insertedId.toString(),
      font: { ...newFont, _id: result.insertedId.toString() }
    });
  } catch (error) {
    logError('Failed to create font', { context: 'available-fonts' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to create font' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/available-fonts?id=...
 * Update existing font
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid font ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate fields if provided
    if (body.name !== undefined && !isValidFontName(body.name)) {
      return NextResponse.json(
        { success: false, error: 'Invalid font name' },
        { status: 400 }
      );
    }
    
    if (body.fontFamily !== undefined && !isValidFontFamily(body.fontFamily)) {
      return NextResponse.json(
        { success: false, error: 'Invalid font-family value' },
        { status: 400 }
      );
    }
    
    if (body.category !== undefined && !['google', 'custom', 'system'].includes(body.category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category. Must be: google, custom, or system' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Check if name change conflicts with existing font
    if (body.name) {
      const existing = await db.collection(COLLECTION).findOne({ 
        name: body.name.trim(),
        _id: { $ne: new ObjectId(id) }
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Font with this name already exists' },
          { status: 400 }
        );
      }
    }
    
    const updateData: Partial<AvailableFont> = {
      updatedAt: new Date().toISOString()
    };
    
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.fontFamily !== undefined) updateData.fontFamily = body.fontFamily.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;
    if (body.description !== undefined) updateData.description = body.description?.trim() || '';
    if (body.fontFile !== undefined) updateData.fontFile = body.fontFile?.trim() || undefined;
    
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Font not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      font: { ...updateData, _id: id }
    });
  } catch (error) {
    logError('Failed to update font', { context: 'available-fonts' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to update font' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/available-fonts?id=...
 * Delete font (soft delete by setting isActive: false, or hard delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hardDelete = searchParams.get('hardDelete') === 'true';
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid font ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    if (hardDelete) {
      // Hard delete
      const result = await db.collection(COLLECTION).deleteOne({
        _id: new ObjectId(id)
      });
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Font not found' },
          { status: 404 }
        );
      }
    } else {
      // Soft delete (set isActive: false)
      const result = await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: false, updatedAt: new Date().toISOString() } }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Font not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: hardDelete ? 'Font deleted successfully' : 'Font deactivated successfully'
    });
  } catch (error) {
    logError('Failed to delete font', { context: 'available-fonts' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to delete font' },
      { status: 500 }
    );
  }
}

