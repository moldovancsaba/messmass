import { NextRequest, NextResponse } from 'next/server';
import { findHashtagsByFilterSlug } from '@/lib/slugUtils';
import { getAllHashtagRepresentations } from '@/lib/hashtagCategoryUtils';
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

    // Connect to database first
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // First, check if this is a UUID slug in filter_slugs collection
    const filterData = await findHashtagsByFilterSlug(slug);
    let hashtags = filterData?.hashtags || [];
    const styleId = filterData?.styleId || null;
    
    // If no filter slug found, treat the slug as a direct hashtag name
    if (!hashtags || hashtags.length === 0) {
      console.log('🏷️ No filter slug found, treating as direct hashtag:', slug);
      
      // Decode URL-encoded hashtag (in case it has special characters)
      const decodedHashtag = decodeURIComponent(slug);
      
      // Check if projects exist with this hashtag to validate it's a real hashtag
      const allProjects = await collection.find({}).toArray();
      const testProjects = allProjects.filter(project => {
        const allHashtagRepresentations = getAllHashtagRepresentations({
          hashtags: project.hashtags || [],
          categorizedHashtags: project.categorizedHashtags || {}
        });
        
        return allHashtagRepresentations.some(projectHashtag => 
          projectHashtag.toLowerCase() === decodedHashtag.toLowerCase()
        );
      });
      
      if (testProjects.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No projects found with this hashtag' },
          { status: 404 }
        );
      }
      
      // Use the single hashtag
      hashtags = [decodedHashtag];
    }

    console.log('✅ Found hashtags for filter:', hashtags);

    // Find projects that contain ALL specified hashtags
    // Need to handle both traditional hashtags and category-prefixed hashtags
    const allProjects = await collection.find({}).toArray();
    
    // Filter projects that match ALL specified hashtags
    const projects = allProjects.filter(project => {
      // Get all hashtag representations for this project
      const allHashtagRepresentations = getAllHashtagRepresentations({
        hashtags: project.hashtags || [],
        categorizedHashtags: project.categorizedHashtags || {}
      });
      
      // Check if ALL filter hashtags are present in this project
      return hashtags.every(filterHashtag => 
        allHashtagRepresentations.some(projectHashtag => 
          projectHashtag.toLowerCase() === filterHashtag.toLowerCase()
        )
      );
    });

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
    const publicProjects = projects.map(project => {
      // Get all hashtag representations for display
      const allHashtagRepresentations = getAllHashtagRepresentations({
        hashtags: project.hashtags || [],
        categorizedHashtags: project.categorizedHashtags || {}
      });
      
      return {
        _id: project._id.toString(),
        eventName: project.eventName,
        eventDate: project.eventDate,
        hashtags: allHashtagRepresentations,
        viewSlug: project.viewSlug,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
    }).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    console.log(`📊 Returning aggregated stats for ${hashtags.length} hashtags and ${projects.length} projects`);

    return NextResponse.json({
      success: true,
      project: aggregatedProject,
      projects: publicProjects,
      hashtags: hashtags,
      styleId
    });

  } catch (error) {
    console.error('❌ Failed to fetch filter data by slug:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load filter statistics'
    }, { status: 500 });
  }
}
