import { NextRequest, NextResponse } from 'next/server';
import { findProjectByEditSlug } from '@/lib/slugUtils';

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

    console.log('🔍 Finding project by edit slug:', slug.substring(0, 8) + '...');
    
    const project = await findProjectByEditSlug(slug);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found project for editing:', project.eventName);

    // Format project data for editor access (includes all information for editing)
    const editableProject = {
      _id: project._id,
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [], // Include hashtags to prevent data loss
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
    console.error('❌ Failed to fetch project by edit slug:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch project' 
      },
      { status: 500 }
    );
  }
}
