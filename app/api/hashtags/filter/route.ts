import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { 
  parseHashtagQuery, 
  matchHashtagInProject, 
  mergeHashtagSystems 
} from '@/lib/hashtagCategoryUtils';
import { CategorizedHashtagMap } from '@/lib/hashtagCategoryTypes';
import config from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tagsParam = searchParams.get('tags');
    
    if (!tagsParam) {
      return NextResponse.json({
        success: false,
        error: 'Tags parameter is required'
      }, { status: 400 });
    }

    // Parse comma-separated hashtags and clean them
    const hashtags = tagsParam.split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);

    if (hashtags.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one hashtag is required'
      }, { status: 400 });
    }

    console.log('🔍 Fetching aggregated stats for hashtags:', hashtags);
    
    const client = await clientPromise;
const db = client.db(config.dbName);
    const projectsCollection = db.collection('projects');
    
    // Enhanced filtering to support both traditional and categorized hashtags
    // Build MongoDB query that supports category-prefixed hashtags
    const mongoQueries: any[] = [];
    
    hashtags.forEach(hashtagQuery => {
      const { category, hashtag } = parseHashtagQuery(hashtagQuery);
      
      if (category === null) {
        // Plain hashtag - search in traditional hashtags or any category list
        mongoQueries.push({
          $or: [
            { hashtags: hashtag },
            {
              $expr: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                        cond: { $in: [hashtag, "$$this.v"] }
                      }
                    }
                  },
                  0
                ]
              }
            }
          ]
        });
      } else {
        // Category-prefixed hashtag - search only in specified category
        mongoQueries.push({
          [`categorizedHashtags.${category}`]: hashtag
        });
      }
    });
    
    // Get all projects first, then filter with our custom logic
    // This approach is more reliable than complex MongoDB queries for this use case
    const allProjects = await projectsCollection.find({}).toArray();
    
    // Filter projects using our custom matching logic
    const projects = allProjects.filter(project => {
      // Check if project contains ALL specified hashtags (AND logic)
      return hashtags.every(hashtagQuery => 
        matchHashtagInProject(hashtagQuery, {
          hashtags: project.hashtags,
          categorizedHashtags: project.categorizedHashtags
        })
      );
    });
    
    // Create project list for display
    const projectList = projects.map(project => ({
      _id: project._id,
      eventName: project.eventName,
      eventDate: project.eventDate,
      viewSlug: project.viewSlug,
      hashtags: project.hashtags,
      categorizedHashtags: project.categorizedHashtags,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    })).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    if (projects.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No projects found with all hashtags: ${hashtags.join(', ')}`
      }, { status: 404 });
    }

    console.log(`✅ Found ${projects.length} projects with all hashtags: ${hashtags.join(', ')}`);

    // Calculate aggregated statistics - reuse logic from single hashtag endpoint
    const aggregatedStats = {
      remoteImages: 0,
      hostessImages: 0,
      selfies: 0,
      indoor: 0,
      outdoor: 0,
      stadium: 0,
      female: 0,
      male: 0,
      genAlpha: 0,
      genYZ: 0,
      genX: 0,
      boomer: 0,
      merched: 0,
      jersey: 0,
      scarf: 0,
      flags: 0,
      baseballCap: 0,
      other: 0,
      approvedImages: 0,
      rejectedImages: 0,
      visitQrCode: 0,
      visitShortUrl: 0,
      visitWeb: 0,
      visitFacebook: 0,
      visitInstagram: 0,
      visitYoutube: 0,
      visitTiktok: 0,
      visitX: 0,
      visitTrustpilot: 0,
      eventAttendees: 0,
      eventTicketPurchases: 0,
      eventResultHome: 0,
      eventResultVisitor: 0,
      eventValuePropositionVisited: 0,
      eventValuePropositionPurchases: 0
    };

    // Find date range - initialize with first project date
    let oldestDate = new Date(projects[0].eventDate);
    let newestDate = new Date(projects[0].eventDate);

    // Aggregate all stats from matching projects
    projects.forEach(project => {
      const projectDate = new Date(project.eventDate);
      if (projectDate < oldestDate) {
        oldestDate = projectDate;
      }
      if (projectDate > newestDate) {
        newestDate = projectDate;
      }

      // Aggregate all stats - sum values for each field
      Object.keys(aggregatedStats).forEach(key => {
        if (project.stats[key] !== undefined) {
          aggregatedStats[key as keyof typeof aggregatedStats] += project.stats[key] || 0;
        }
      });
    });

    // Format the aggregated project data
    const aggregatedProject = {
      eventName: `Filter: ${hashtags.map(tag => `#${tag}`).join(' + ')}`,
      eventDate: oldestDate.toISOString(),
      dateRange: {
        oldest: oldestDate.toISOString(),
        newest: newestDate.toISOString(),
        formatted: oldestDate.getTime() !== newestDate.getTime() 
          ? `${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`
          : oldestDate.toLocaleDateString()
      },
      hashtags: hashtags,
      stats: aggregatedStats,
      projectCount: projects.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      project: aggregatedProject,
      projects: projectList,
      filter: {
        hashtags: hashtags,
        logic: 'AND', // Explicitly indicate this is AND logic
        matchCount: projects.length
      },
      debug: {
        projectsFound: projects.length,
        hashtags: hashtags,
        dateRange: aggregatedProject.dateRange,
        filterLogic: 'AND - projects must contain ALL hashtags'
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch filtered hashtag statistics:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch filtered hashtag statistics'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hashtags } = body;

    if (!hashtags || !Array.isArray(hashtags)) {
      return NextResponse.json({
        success: false,
        error: 'Hashtags array is required in request body'
      }, { status: 400 });
    }

    // Clean and validate hashtags
    const cleanedHashtags = hashtags
      .map(tag => typeof tag === 'string' ? tag.trim().toLowerCase() : '')
      .filter(tag => tag.length > 0);

    if (cleanedHashtags.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one valid hashtag is required'
      }, { status: 400 });
    }

    // Redirect to GET endpoint with query parameters
    const tagsParam = cleanedHashtags.join(',');
    const url = new URL(request.url);
    url.searchParams.set('tags', tagsParam);
    
    // Create a new request with the hashtags as query parameters
    const getRequest = new NextRequest(url.toString(), {
      method: 'GET',
      headers: request.headers
    });

    return GET(getRequest);

  } catch (error) {
    console.error('❌ Failed to process POST request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}
