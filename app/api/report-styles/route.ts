/* WHAT: CRUD API routes for Report Styles
 * WHY: Backend endpoints for style management
 * HOW: MongoDB operations with validation */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ReportStyle, validateStyle, normalizeHexColor, COLOR_FIELDS, DIMENSION_FIELDS, DEFAULT_STYLE } from '@/lib/reportStyleTypes';
import { error as logError } from '@/lib/logger';

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
    logError('Failed to fetch report styles', { context: 'report-styles' }, error instanceof Error ? error : new Error(String(error)));
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
    
    // Dimension fields (default from DEFAULT_STYLE when creating)
    const dimensionEntries = DIMENSION_FIELDS.map(f => [
      f.key,
      String((body[f.key] ?? DEFAULT_STYLE[f.key] ?? '')).trim()
    ]) as [string, string][];
    const normalizedStyle = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      fontFamily: body.fontFamily || 'Inter',
      ...Object.fromEntries(
        COLOR_FIELDS.map(field => [field.key, normalizeHexColor(body[field.key])])
      ),
      ...Object.fromEntries(dimensionEntries),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Omit<ReportStyle, '_id'>;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const result = await db.collection(COLLECTION).insertOne(normalizedStyle);
    
    return NextResponse.json({
      success: true,
      styleId: result.insertedId.toString(),
      style: { ...normalizedStyle, _id: result.insertedId.toString() }
    });
  } catch (error) {
    logError('Failed to create report style', { context: 'report-styles' }, error instanceof Error ? error : new Error(String(error)));
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
    
    // Dimension fields (from body; empty = use theme default)
    const dimensionEntries = DIMENSION_FIELDS.map(f => [
      f.key,
      String((body[f.key] ?? '')).trim()
    ]) as [string, string][];
    const normalizedStyle = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      fontFamily: body.fontFamily || 'Inter',
      ...Object.fromEntries(
        COLOR_FIELDS.map(field => [field.key, normalizeHexColor(body[field.key])])
      ),
      ...Object.fromEntries(dimensionEntries),
      updatedAt: new Date().toISOString()
    } as Partial<ReportStyle>;
    
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
    logError('Failed to update report style', { context: 'report-styles' }, error instanceof Error ? error : new Error(String(error)));
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
    logError('Failed to delete report style', { context: 'report-styles' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to delete style' },
      { status: 500 }
    );
  }
}
