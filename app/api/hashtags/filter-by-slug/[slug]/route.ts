import { NextRequest, NextResponse } from 'next/server';
import { findHashtagsByFilterSlug } from '@/lib/slugUtils';
import clientPromise from '@/lib/mongodb';

const MONGODB_DB = process.env.MONGODB_DB || 'messmass';

async function connectToDatabase() {
  try {
    const client = await clientPromise;
    await client.db(MONGODB_DB).admin().ping();
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

// GET /api/hashtags/filter-by-slug/[slug] - Get filter data by slug
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Filter slug is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching filter data for slug:', slug);

    // Get hashtags for this filter slug
    const hashtags = await findHashtagsByFilterSlug(slug);

    if (!hashtags || hashtags.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Filter not found or no hashtags associated' },
        { status: 404 }
      );
    }

    console.log('✅ Found hashtags for filter:', hashtags);

    // Now use the existing filter logic to get the data
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // Find projects that contain ALL specified hashtags
    const projects = await collection
      .find({
        hashtags: { 
          $all: hashtags.map(tag => new RegExp(`^${tag}$`, 'i'))
        }
      })
      .toArray();

    if (projects.length === 0) {
      return NextResponse.json({
        success: true,
        project: null,
        projects: [],
        hashtags: hashtags,
        message: `No projects found with hashtags: ${hashtags.map(h => `#${h}`).join(', ')}`
      });
    }

    console.log(`✅ Found ${projects.length} projects matching filter`);

    // Aggregate statistics from all matching projects (reuse existing logic)
    const aggregatedStats = projects.reduce((acc, project) => {
      const stats = project.stats || {};
      
      // Sum up all numeric stats
      Object.keys(stats).forEach(key => {
        if (typeof stats[key] === 'number') {
          acc[key] = (acc[key] || 0) + stats[key];
        }
      });
      
      return acc;
    }, {} as Record<string, number>);

    // Get date range
    const dates = projects
      .map(p => new Date(p.eventDate))
      .filter(date => !isNaN(date.getTime()));
    
    const oldestDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const newestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

    // Format the aggregated project data
    const aggregatedProject = {
      eventName: `Filter: ${hashtags.map(h => `#${h}`).join(' + ')}`,
      eventDate: newestDate.toISOString(),
      dateRange: {
        oldest: oldestDate.toISOString(),
        newest: newestDate.toISOString(),
        formatted: dates.length > 1 
          ? `${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`
          : oldestDate.toLocaleDateString()
      },
      hashtags: hashtags,
      stats: aggregatedStats,
      projectCount: projects.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Format projects list for public consumption (same as hashtag filter)
    const publicProjects = projects.map(project => ({
      _id: project._id.toString(),
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [],
      viewSlug: project.viewSlug,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    })).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    console.log(`📊 Returning aggregated stats for ${hashtags.length} hashtags and ${projects.length} projects`);

    return NextResponse.json({
      success: true,
      project: aggregatedProject,
      projects: publicProjects,
      hashtags: hashtags
    });

  } catch (error) {
    console.error('❌ Failed to fetch filter data by slug:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load filter statistics'
    }, { status: 500 });
  }
}
