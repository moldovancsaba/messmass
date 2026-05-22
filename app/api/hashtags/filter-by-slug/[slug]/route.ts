import { NextRequest, NextResponse } from 'next/server';
import { findHashtagsByFilterSlug } from '@/lib/slugUtils';
import { getAllHashtagRepresentations } from '@/lib/hashtagCategoryUtils';
import clientPromise from '@/lib/mongodb';
import { resolveReportVariant } from '@/lib/reportVariants';
import { isEventDateInPeriod } from '@/lib/reportPeriods';

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

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
    const variantSlug = new URL(request.url).searchParams.get('variant');

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

    // Helper: project "has" filter hashtag if representation matches exactly or as category:value
    const projectHasFilterHashtag = (representations: string[], filterHashtag: string): boolean => {
      const fl = filterHashtag.toLowerCase();
      return representations.some(rep => {
        const pl = rep.toLowerCase();
        if (pl === fl) return true;
        if (pl.includes(':')) {
          const value = pl.split(':').pop() || '';
          if (value === fl) return true;
        }
        return false;
      });
    };

    // First, check if this is a UUID slug in filter_slugs collection
    const filterData = await findHashtagsByFilterSlug(slug);
    let hashtags = filterData?.hashtags || [];
    const styleId = filterData?.styleId || null;
    
    // If no filter slug found, treat the slug as a direct hashtag name
    if (!hashtags || hashtags.length === 0) {
      console.log('🏷️ No filter slug found, treating as direct hashtag:', slug);
      const decodedHashtag = decodeURIComponent(slug);
      const allProjectsForDirect = await collection.find({}).toArray();
      const testProjects = allProjectsForDirect.filter(project => {
        const reps = getAllHashtagRepresentations({
          hashtags: project.hashtags || [],
          categorizedHashtags: project.categorizedHashtags || {}
        });
        return projectHasFilterHashtag(reps, decodedHashtag);
      });

      if (testProjects.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No projects found with this hashtag' },
          { status: 404 }
        );
      }
      hashtags = [decodedHashtag];
    }

    console.log('✅ Found hashtags for filter:', hashtags);

    // Find projects that contain ALL specified hashtags
    const allProjects = await collection.find({}).toArray();

    // Filter projects that match ALL specified hashtags
    const matchingProjects = allProjects.filter(project => {
      const allHashtagRepresentations = getAllHashtagRepresentations({
        hashtags: project.hashtags || [],
        categorizedHashtags: project.categorizedHashtags || {}
      });
      return hashtags.every(filterHashtag =>
        projectHasFilterHashtag(allHashtagRepresentations, filterHashtag)
      );
    });

    const resolvedVariant = await resolveReportVariant(db as any, 'filter', slug, variantSlug);
    const projects = matchingProjects.filter((project) =>
      isEventDateInPeriod(project.eventDate, resolvedVariant.period)
    );

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
          const currentValue = typeof acc[key] === 'number' ? acc[key] : 0;
          acc[key] = currentValue + stats[key];
        }
      });
      
      return acc;
    }, { ...((resolvedVariant.variant.statsOverrides || {}) as Record<string, number | string>) } as Record<string, number | string>);

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
      styleId: resolvedVariant.variant.styleId || styleId,
      report: resolvedVariant.runtimeReport.report,
      reportVariant: {
        ...resolvedVariant.variant,
        period: resolvedVariant.period,
      },
    });

  } catch (error) {
    console.error('❌ Failed to fetch filter data by slug:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load filter statistics'
    }, { status: 500 });
  }
}
