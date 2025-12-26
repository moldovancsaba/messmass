/**
 * Google Sheets Disconnect API Endpoint
 * 
 * WHAT: Disconnects a Google Sheet from a partner and cleans up sync configuration
 * WHY: Allow partners to disable Google Sheets integration
 * 
 * DELETE /api/partners/[id]/google-sheet/disconnect
 * 
 * Returns:
 * - success: boolean
 * - message: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate partner ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid partner ID' },
        { status: 400 }
      );
    }

    // Get database connection
    const db = await getDb();
    const partnersCollection = db.collection('partners');

    // Check if partner exists and has Google Sheets configured
    const partner = await partnersCollection.findOne({
      _id: new ObjectId(params.id)
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: 'Partner not found' },
        { status: 404 }
      );
    }

    if (!partner.googleSheetConfig?.enabled) {
      return NextResponse.json(
        { success: false, error: 'No Google Sheet is connected to this partner' },
        { status: 400 }
      );
    }

    // Store sheet info for confirmation message
    const sheetName = partner.googleSheetConfig.sheetName || 'Events';
    const sheetId = partner.googleSheetConfig.sheetId;

    // Remove Google Sheets configuration and stats
    const result = await partnersCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $unset: {
          googleSheetConfig: '',
          googleSheetStats: ''
        },
        $set: {
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update partner' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected from Google Sheet "${sheetName}" (${sheetId})`,
      disconnectedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error disconnecting Google Sheet:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}