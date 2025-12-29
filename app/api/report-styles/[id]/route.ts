/* WHAT: Fetch single report style by ID
 * WHY: Editor needs individual style data
 * HOW: MongoDB query with ObjectId validation */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ReportStyle } from '@/lib/reportStyleTypes';
import { error as logError } from '@/lib/logger';

const DB_NAME = process.env.MONGODB_DB || 'messmass';
const COLLECTION = 'report_styles';

/**
 * GET /api/report-styles/[id]
 * Fetch single report style by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;
  try {
    const paramsResolved = await params;
    id = paramsResolved.id;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid style ID' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const style = await db
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(id) });
    
    if (!style) {
      return NextResponse.json(
        { success: false, error: 'Style not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      style: { ...style, _id: style._id?.toString() }
    });
  } catch (error) {
    logError('Failed to fetch report style', { context: 'report-styles', styleId: id || 'unknown' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to fetch style' },
      { status: 500 }
    );
  }
}
