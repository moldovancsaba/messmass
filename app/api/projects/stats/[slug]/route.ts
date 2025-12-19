import { NextRequest, NextResponse } from 'next/server';
import { findProjectByViewSlug } from '@/lib/slugUtils';
import { getAllHashtagRepresentations } from '@/lib/hashtagCategoryUtils';

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

    // Get all hashtag representations (traditional + category-prefixed)
    const allHashtags = getAllHashtagRepresentations({
      hashtags: project.hashtags,
      categorizedHashtags: project.categorizedHashtags
    });

    // Format project data for read-only access (no sensitive information)
    const readOnlyProject = {
      _id: project._id, // WHAT: Include _id for report resolution
      // WHY: useReportData needs _id to resolve report configuration via /api/reports/resolve
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [], // Keep original hashtags
      categorizedHashtags: project.categorizedHashtags || {}, // Include categorized structure
      allHashtagRepresentations: allHashtags, // Include all representations for search
      stats: project.stats,
      partner1: project.partner1 || null, // Include partner 1 data (home team)
      partner2: project.partner2 || null, // Include partner 2 data (away team)
      styleIdEnhanced: (project as any).styleIdEnhanced ? (project as any).styleIdEnhanced.toString() : null, // Page style for report
      reportTemplateId: (project as any).reportTemplateId ? (project as any).reportTemplateId.toString() : null, // Report template
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
