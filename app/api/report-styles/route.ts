/* WHAT: CRUD API routes for Report Styles
 * WHY: Backend endpoints for style management
 * HOW: MongoDB operations with validation */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ReportStyle, validateStyle, normalizeHexColor, COLOR_FIELDS } from '@/lib/reportStyleTypes';

const DB_NAME = process.env.MONGODB_DB || 'messmass';
const COLLECTION = 'report_styles';

/**
 * GET /api/report-styles
 * Fetch all report styles
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const styles = await db
      .collection<ReportStyle>(COLLECTION)
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      styles: styles.map(s => ({ ...s, _id: s._id?.toString() }))
    });
  } catch (error) {
    console.error('Failed to fetch report styles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch styles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/report-styles
 * Create new report style
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate style
    const validation = validateStyle(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }
    
    // Normalize all hex colors
    const normalizedStyle: Omit<ReportStyle, '_id'> = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      fontFamily: body.fontFamily || 'Inter', // WHAT: Save selected font (v11.52.0)
      ...Object.fromEntries(
        COLOR_FIELDS.map(field => [field.key, normalizeHexColor(body[field.key])])
      ) as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const result = await db.collection(COLLECTION).insertOne(normalizedStyle);
    
    return NextResponse.json({
      success: true,
      styleId: result.insertedId.toString(),
      style: { ...normalizedStyle, _id: result.insertedId.toString() }
    });
  } catch (error) {
    console.error('Failed to create report style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create style' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/report-styles?id=...
 * Update existing report style
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid style ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate style
    const validation = validateStyle(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }
    
    // Normalize all hex colors
    const normalizedStyle: Partial<ReportStyle> = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      fontFamily: body.fontFamily || 'Inter', // WHAT: Save selected font (v11.52.0)
      ...Object.fromEntries(
        COLOR_FIELDS.map(field => [field.key, normalizeHexColor(body[field.key])])
      ) as any,
      updatedAt: new Date().toISOString()
    };
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: normalizedStyle }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Style not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      style: { ...normalizedStyle, _id: id }
    });
  } catch (error) {
    console.error('Failed to update report style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update style' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/report-styles?id=...
 * Delete report style
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid style ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Style not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Style deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete report style:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete style' },
      { status: 500 }
    );
  }
}
