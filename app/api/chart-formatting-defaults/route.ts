/**
 * Chart Formatting Defaults API
 * 
 * WHAT: Manage default formatting configurations and available options
 * WHY: No hardcoded defaults - all formatting configs stored in database
 * HOW: Single document in chart_formatting_defaults collection
 * 
 * SCHEMA:
 * {
 *   _id: ObjectId,
 *   defaults: {
 *     rounded: boolean,
 *     prefix: string,
 *     suffix: string,
 *     visible: boolean
 *   },
 *   availablePrefixes: string[],  // e.g., ['€', '$', '£', '¥', 'CHF']
 *   availableSuffixes: string[],  // e.g., ['%', ' pts', ' fans', ' units']
 *   updatedAt: string (ISO 8601)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

export const dynamic = 'force-dynamic';

// GET - Fetch formatting defaults
export async function GET() {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('chart_formatting_defaults');

    const defaults = await collection.findOne({});

    if (!defaults) {
      // Return built-in fallback if no database config exists
      return NextResponse.json({
        success: true,
        defaults: {
          rounded: true,
          prefix: '€',
          suffix: '',
          visible: true
        },
        availablePrefixes: ['€', '$', '£', '¥', 'CHF', 'R$', '₹', '₽', 'kr', '¢'],
        availableSuffixes: ['%', ' pts', ' fans', ' units', ' goals', ' km', ' m', ' items', ' count', 'x']
      });
    }

    return NextResponse.json({
      success: true,
      defaults: defaults.defaults,
      availablePrefixes: defaults.availablePrefixes || [],
      availableSuffixes: defaults.availableSuffixes || []
    });
  } catch (error) {
    console.error('Error fetching formatting defaults:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch formatting defaults' },
      { status: 500 }
    );
  }
}

// PUT - Update formatting defaults
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { defaults } = body;

    if (!defaults || typeof defaults !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid defaults object' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('chart_formatting_defaults');

    await collection.updateOne(
      {},
      {
        $set: {
          defaults,
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating formatting defaults:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update formatting defaults' },
      { status: 500 }
    );
  }
}
