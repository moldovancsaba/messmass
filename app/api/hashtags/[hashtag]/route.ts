import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { resolveReportVariant } from '@/lib/reportVariants';
import { isEventDateInPeriod } from '@/lib/reportPeriods';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hashtag: string }> }
) {
  try {
    const resolvedParams = await params;
    const hashtagOrSlug = decodeURIComponent(resolvedParams.hashtag);
    const variantSlug = new URL(request.url).searchParams.get('variant');
    
    console.log('📊 Fetching aggregated stats for hashtag/slug:', hashtagOrSlug);
    
    const client = await clientPromise;
const db = client.db(config.dbName);
    const projectsCollection = db.collection('projects');
    const hashtagSlugsCollection = db.collection('hashtag_slugs');
    
    let actualHashtag = hashtagOrSlug;
    
    // Check if this is a UUID slug - UUIDs are 36 characters with hyphens
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(hashtagOrSlug)) {
      console.log('🔍 Parameter appears to be a UUID slug, looking up hashtag name...');
      const slugDoc = await hashtagSlugsCollection.findOne({ slug: hashtagOrSlug });
      if (!slugDoc) {
        return NextResponse.json({
          success: false,
          error: 'Hashtag not found for this slug'
        }, { status: 404 });
      }
      actualHashtag = slugDoc.hashtag;
      console.log('✅ Found hashtag for slug:', actualHashtag);
    } else {
      console.log('📝 Parameter appears to be a hashtag name, using directly');
    }

    // Find all projects with this hashtag (case insensitive)
    // Handle both array format and comma-separated string format
    const matchingProjects = await projectsCollection.find({
      $or: [
        // Array format
        { hashtags: { $regex: new RegExp(`^${actualHashtag}$`, 'i') } },
        // Comma-separated string format
        { hashtags: { $regex: new RegExp(`(^|,)\\s*${actualHashtag}\\s*(,|$)`, 'i') } }
      ]
    }).toArray();

    const resolvedVariant = await resolveReportVariant(db as any, 'hashtag', actualHashtag, variantSlug);
    const projects = matchingProjects.filter((project) =>
      isEventDateInPeriod(project.eventDate, resolvedVariant.period)
    );
    
    // Create project list for display
    const projectList = projects.map(project => ({
      _id: project._id,
      eventName: project.eventName,
      eventDate: project.eventDate,
      viewSlug: project.viewSlug,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    })).sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    if (projects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No projects found with this hashtag'
      }, { status: 404 });
    }

    console.log(`✅ Found ${projects.length} projects with hashtag: ${actualHashtag}`);

    // Calculate aggregated statistics
    const aggregatedStats: Record<string, number | string> = {
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

    Object.entries((resolvedVariant.variant.statsOverrides || {}) as Record<string, unknown>).forEach(([key, value]) => {
      aggregatedStats[key] = value as number | string;
    });

    // Find date range - initialize with first project date
    let oldestDate = new Date(projects[0].eventDate);
    let newestDate = new Date(projects[0].eventDate);

    projects.forEach(project => {
      const projectDate = new Date(project.eventDate);
      if (projectDate < oldestDate) {
        oldestDate = projectDate;
      }
      if (projectDate > newestDate) {
        newestDate = projectDate;
      }

      // Aggregate all stats
      Object.keys(aggregatedStats).forEach(key => {
        if (project.stats[key] !== undefined) {
          (aggregatedStats as any)[key] += project.stats[key] || 0;
        }
      });
    });

    // Format the aggregated project data
    const aggregatedProject = {
      eventName: `#${actualHashtag}`,
      eventDate: oldestDate.toISOString(),
      dateRange: {
        oldest: oldestDate.toISOString(),
        newest: newestDate.toISOString(),
        formatted: oldestDate.getTime() !== newestDate.getTime() 
          ? `${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`
          : oldestDate.toLocaleDateString()
      },
      hashtags: [actualHashtag],
      stats: aggregatedStats,
      projectCount: projects.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      project: aggregatedProject,
      projects: projectList,
      report: resolvedVariant.runtimeReport.report,
      styleId: resolvedVariant.variant.styleId || null,
      reportVariant: {
        ...resolvedVariant.variant,
        period: resolvedVariant.period,
      },
      debug: {
        projectsFound: projects.length,
        hashtag: actualHashtag,
        dateRange: aggregatedProject.dateRange,
        inputWasSlug: uuidRegex.test(hashtagOrSlug)
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch hashtag statistics:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch hashtag statistics'
    }, { status: 500 });
  }
}
