/* WHAT: API endpoint to set global default page style
 * WHY: Only one style can be global default at a time
 * HOW: Unset previous default, set new one
 * AUTH: Requires admin authentication */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { ObjectId } from 'mongodb';

/* WHAT: POST - Set a style as global default
 * WHY: Ensure only one global default exists
 * BODY: { styleId: string }
 * RETURNS: Success confirmation */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { styleId } = body;
    
    if (!styleId) {
      return NextResponse.json(
        { success: false, error: 'styleId is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    // Check if style exists
    const style = await db
      .collection('page_styles_enhanced')
      .findOne({ _id: new ObjectId(styleId) });
    
    if (!style) {
      return NextResponse.json(
        { success: false, error: 'Style not found' },
        { status: 404 }
      );
    }
    
    // Unset all previous global defaults
    await db
      .collection('page_styles_enhanced')
      .updateMany(
        { isGlobalDefault: true },
        { $set: { isGlobalDefault: false, updatedAt: new Date() } }
      );
    
    // Set new global default
    await db
      .collection('page_styles_enhanced')
      .updateOne(
        { _id: new ObjectId(styleId) },
        { $set: { isGlobalDefault: true, updatedAt: new Date() } }
      );
    
    return NextResponse.json({
      success: true,
      message: `"${style.name}" is now the global default style`
    });
  } catch (error) {
    console.error('Failed to set global default:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set global default' },
      { status: 500 }
    );
  }
}
