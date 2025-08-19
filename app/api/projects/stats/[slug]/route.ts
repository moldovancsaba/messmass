import { NextRequest, NextResponse } from 'next/server';
import { findProjectByViewSlug } from '@/lib/slugUtils';

// GET /api/projects/stats/[slug] - Fetch project by view slug (read-only access)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Finding project by view slug:', slug.substring(0, 8) + '...');
    
    const project = await findProjectByViewSlug(slug);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found project:', project.eventName);

    // Format project data for read-only access (no sensitive information)
    const readOnlyProject = {
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags, // Include hashtags for display
      stats: project.stats,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    return NextResponse.json({
      success: true,
      project: readOnlyProject
    });

  } catch (error) {
    console.error('❌ Failed to fetch project by view slug:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch project' 
      },
      { status: 500 }
    );
  }
}
