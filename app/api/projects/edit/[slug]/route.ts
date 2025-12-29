import { NextRequest, NextResponse } from 'next/server';
import { findProjectByEditSlug } from '@/lib/slugUtils';
import { error as logError, info as logInfo, debug as logDebug } from '@/lib/logger';

// GET /api/projects/edit/[slug] - Fetch project by edit slug (editor access)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  try {
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    logDebug('Finding project by edit slug', { context: 'projects/edit/[slug]', slugPrefix: slug.substring(0, 8) });
    
    const project = await findProjectByEditSlug(slug);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    logInfo('Found project for editing', { context: 'projects/edit/[slug]', eventName: project.eventName });

    // Format project data for editor access (includes all information for editing)
    const editableProject = {
      _id: project._id,
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [], // Include hashtags to prevent data loss
      categorizedHashtags: project.categorizedHashtags || {}, // Include categorized hashtags for editing
      stats: project.stats,
      viewSlug: project.viewSlug,
      editSlug: project.editSlug,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    return NextResponse.json({
      success: true,
      project: editableProject
    });

  } catch (error) {
    logError('Failed to fetch project by edit slug', { context: 'projects/edit/[slug]', slug }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch project' 
      },
      { status: 500 }
    );
  }
}
