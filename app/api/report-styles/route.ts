/* WHAT: CRUD API routes for Report Styles
 * WHY: Backend endpoints for style management with V3 Org scoping
 * HOW: MongoDB operations with validation and Org scoping */

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { validateStyle, normalizeHexColor, COLOR_FIELDS, DIMENSION_FIELDS, DEFAULT_STYLE, ReportStyle } from '@/lib/reportStyleTypes';
import { error as logError } from '@/lib/logger';
import { withOrgContext } from '@/lib/middleware/v3/orgContext';

const DB_NAME = process.env.MONGODB_DB || 'messmass';
const COLLECTION = 'report_styles';

/**
 * GET Handler
 */
async function getStyles(request: Request) {
  try {
    const orgId = request.headers.get('x-v3-org-id');
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const styles = await db
      .collection<ReportStyle>(COLLECTION)
      .find({ organizationId: new ObjectId(orgId as string) })
      .sort({ updatedAt: -1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      styles: styles.map(s => ({ ...s, _id: s._id?.toString() }))
    });
  } catch (error) {
    logError('Failed to fetch report styles', { context: 'report-styles' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Failed to fetch styles' }, { status: 500 });
  }
}

/**
 * POST Handler
 */
async function createStyle(request: Request) {
  try {
    const orgId = request.headers.get('x-v3-org-id');
    const body = await request.json();
    
    const validation = validateStyle(body);
    if (!validation.valid) return NextResponse.json({ success: false, error: validation.errors.join(', ') }, { status: 400 });
    
    const dimensionEntries = DIMENSION_FIELDS.map(f => [
      f.key,
      String((body[f.key] ?? DEFAULT_STYLE[f.key] ?? '')).trim()
    ]) as [string, string][];

    const normalizedStyle: any = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      fontFamily: body.fontFamily || 'Inter',
      ...Object.fromEntries(COLOR_FIELDS.map(field => [field.key, normalizeHexColor(body[field.key])])),
      ...Object.fromEntries(dimensionEntries),
      organizationId: new ObjectId(orgId as string),
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
    logError('Failed to create report style', { context: 'report-styles' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Failed to create style' }, { status: 500 });
  }
}

/**
 * PUT Handler
 */
async function updateStyle(request: Request) {
  try {
    const orgId = request.headers.get('x-v3-org-id');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid style ID' }, { status: 400 });
    
    const body = await request.json();
    const validation = validateStyle(body);
    if (!validation.valid) return NextResponse.json({ success: false, error: validation.errors.join(', ') }, { status: 400 });
    
    const dimensionEntries = DIMENSION_FIELDS.map(f => [f.key, String((body[f.key] ?? '')).trim()]) as [string, string][];
    const updates: any = {
      name: body.name.trim(),
      description: body.description?.trim() || '',
      fontFamily: body.fontFamily || 'Inter',
      ...Object.fromEntries(COLOR_FIELDS.map(field => [field.key, normalizeHexColor(body[field.key])])),
      ...Object.fromEntries(dimensionEntries),
      updatedAt: new Date().toISOString()
    };
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id), organizationId: new ObjectId(orgId as string) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) return NextResponse.json({ success: false, error: 'Style not found' }, { status: 404 });
    return NextResponse.json({ success: true, style: { ...updates, _id: id } });
  } catch (error) {
    logError('Failed to update report style', { context: 'report-styles' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Failed to update style' }, { status: 500 });
  }
}

/**
 * DELETE Handler
 */
async function deleteStyle(request: Request) {
  try {
    const orgId = request.headers.get('x-v3-org-id');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !ObjectId.isValid(id)) return NextResponse.json({ success: false, error: 'Invalid style ID' }, { status: 400 });
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION).deleteOne({
      _id: new ObjectId(id),
      organizationId: new ObjectId(orgId as string)
    });
    
    if (result.deletedCount === 0) return NextResponse.json({ success: false, error: 'Style not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Style deleted successfully' });
  } catch (error) {
    logError('Failed to delete report style', { context: 'report-styles' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'Failed to delete style' }, { status: 500 });
  }
}

export const GET = (req: Request) => withOrgContext(req, getStyles);
export const POST = (req: Request) => withOrgContext(req, createStyle);
export const PUT = (req: Request) => withOrgContext(req, updateStyle);
export const DELETE = (req: Request) => withOrgContext(req, deleteStyle);
