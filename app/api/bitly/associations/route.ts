// app/api/bitly/associations/route.ts
// WHAT: API endpoint for managing Bitly link-to-project associations (junction table)
// WHY: Enables adding and removing many-to-many relationships between links and projects

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { error as logError, info as logInfo } from '@/lib/logger';

/**
 * DELETE /api/bitly/associations
 * WHAT: Remove a specific link-to-project association
 * WHY: Allow admins to correct mistakes or remove outdated associations
 * 
 * AUTH: Admin only
 * QUERY PARAMS:
 *   - bitlyLinkId: ObjectId of the Bitly link
 *   - projectId: ObjectId of the project
 */
export async function DELETE(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Only admins can modify link associations
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Parse query parameters
    const { searchParams } = new URL(request.url);
    const bitlyLinkId = searchParams.get('bitlyLinkId');
    const projectId = searchParams.get('projectId');

    if (!bitlyLinkId || !projectId) {
      return NextResponse.json(
        { success: false, error: 'bitlyLinkId and projectId are required' },
        { status: 400 }
      );
    }

    // WHAT: Validate ObjectId formats
    if (!ObjectId.isValid(bitlyLinkId) || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ObjectId format' },
        { status: 400 }
      );
    }

    // WHAT: Delete the association from junction table
    const client = await clientPromise;
    const db = client.db(config.dbName);
    
    const result = await db.collection('bitly_project_links').deleteOne({
      bitlyLinkId: new ObjectId(bitlyLinkId),
      projectId: new ObjectId(projectId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Association not found' },
        { status: 404 }
      );
    }

    logInfo('Removed association', { context: 'bitly-associations', bitlyLinkId, projectId });

    return NextResponse.json({
      success: true,
      message: 'Association removed successfully'
    });

  } catch (error) {
    logError('DELETE /api/bitly/associations error', { context: 'bitly-associations' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
