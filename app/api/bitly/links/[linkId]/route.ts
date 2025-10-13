// app/api/bitly/links/[linkId]/route.ts
// WHAT: API endpoints for updating and deleting individual Bitly links
// WHY: Enables admins to reassign links, update metadata, and archive links
// ENDPOINTS:
//   PUT - Update link (reassign project, update title/tags, archive)
//   DELETE - Soft-delete/archive link

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import type { UpdateLinkInput } from '@/lib/bitly-db.types';

/**
 * PUT /api/bitly/links/[linkId]
 * WHAT: Update Bitly link metadata or reassign to different project
 * WHY: Supports use cases like reassigning links between events or updating titles
 * 
 * AUTH: Admin only
 * BODY: { projectId?: string | null, title?: string, tags?: string[], archived?: boolean }
 * 
 * KEY SCENARIOS:
 * - Reassign link to different project (projectId: "new_project_id")
 * - Unassign link from project (projectId: null)
 * - Update custom title or tags
 * - Archive/unarchive link
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ linkId: string }> }
) {
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

    // WHAT: Validate linkId parameter
    const { linkId } = await context.params;
    if (!ObjectId.isValid(linkId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid linkId format' },
        { status: 400 }
      );
    }

    // WHAT: Parse and validate request body
    const body = await request.json() as UpdateLinkInput;
    const { projectId, title, tags, archived } = body;

    // WHAT: Build update object dynamically
    // WHY: Only update fields that are explicitly provided
    const update: any = {
      updatedAt: new Date().toISOString(),
    };

    // WHAT: Handle projectId update (reassignment or unassignment)
    if ('projectId' in body) {
      if (projectId === null) {
        // WHAT: Unassign link from project
        // WHY: Makes link available for reassignment
        update.projectId = null;
      } else if (projectId) {
        // WHAT: Validate new projectId
        if (!ObjectId.isValid(projectId)) {
          return NextResponse.json(
            { success: false, error: 'Invalid projectId format' },
            { status: 400 }
          );
        }

        // WHAT: Verify new project exists
        const client = await clientPromise;
        const db = client.db(config.dbName);
        const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });
        
        if (!project) {
          return NextResponse.json(
            { success: false, error: 'Target project not found' },
            { status: 404 }
          );
        }

        update.projectId = new ObjectId(projectId);
      }
    }

    // WHAT: Update optional fields if provided
    if (title !== undefined) update.title = title;
    if (tags !== undefined) update.tags = tags;
    if (archived !== undefined) update.archived = archived;

    // WHAT: Apply update to database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const result = await db.collection('bitly_links').findOneAndUpdate(
      { _id: new ObjectId(linkId) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      link: result,
      message: 'Link updated successfully',
    });

  } catch (error) {
    console.error('[PUT /api/bitly/links/[linkId]] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bitly/links/[linkId]
 * WHAT: Soft-delete (archive) a Bitly link
 * WHY: Removes link from active tracking without losing historical data
 * 
 * AUTH: Admin only
 * STRATEGY: Soft delete by setting archived=true (preserves analytics history)
 * 
 * NOTE: Hard delete can be implemented if needed, but soft delete is recommended
 * to maintain historical analytics integrity
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ linkId: string }> }
) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Only admins can delete links
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Validate linkId parameter
    const { linkId } = await context.params;
    if (!ObjectId.isValid(linkId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid linkId format' },
        { status: 400 }
      );
    }

    // WHAT: Check if query param requests hard delete
    // WHY: Provides option for permanent deletion if needed (use with caution)
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const client = await clientPromise;
    const db = client.db(config.dbName);

    if (hardDelete) {
      // WHAT: Permanent deletion (use with extreme caution)
      // WHY: Only for cleaning up erroneous entries or test data
      console.warn(`[DELETE] Hard deleting link ${linkId}`);
      
      const result = await db.collection('bitly_links').deleteOne({ _id: new ObjectId(linkId) });
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Link not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Link permanently deleted',
      });
    } else {
      // WHAT: Soft delete by setting archived flag
      // WHY: Preserves historical analytics data while removing from active tracking
      const result = await db.collection('bitly_links').findOneAndUpdate(
        { _id: new ObjectId(linkId) },
        { 
          $set: { 
            archived: true, 
            updatedAt: new Date().toISOString() 
          } 
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Link not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        link: result,
        message: 'Link archived successfully',
      });
    }

  } catch (error) {
    console.error('[DELETE /api/bitly/links/[linkId]] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
