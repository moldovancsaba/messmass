import { NextRequest, NextResponse } from 'next/server';
import { ObjectId, Db } from 'mongodb';
import { generateProjectSlugs } from '@/lib/slugUtils';
import clientPromise from '@/lib/mongodb';
import { createNotification, getCurrentUser } from '@/lib/notificationUtils';

// Import hashtag category types for categorized hashtags support
import { CategorizedHashtagMap } from '@/lib/hashtagCategoryTypes';
import { 
  mergeHashtagSystems, 
  expandHashtagsWithCategories,
  getAllHashtagRepresentations 
} from '@/lib/hashtagCategoryUtils';
import { addDerivedMetrics } from '@/lib/projectStatsUtils';
import { validateProjectStats, prepareStatsForAnalytics, type ValidationResult } from '@/lib/dataValidator';

// Import Bitly recalculation services for many-to-many link management
import { recalculateProjectLinks, handleProjectDeletion, createLinkAssociation } from '@/lib/bitly-recalculator';

// Define project interface for type safety
// Enhanced to support both traditional and categorized hashtags
interface ProjectDocument {
  _id?: ObjectId;
  hashtags?: string[];                    // Traditional hashtags (maintained for backward compatibility)
  categorizedHashtags?: CategorizedHashtagMap; // New field for category-hashtag mapping
  [key: string]: unknown;
}

// Hashtag cleanup utility function
async function cleanupUnusedHashtags(db: Db) {
  try {
    console.log('🧹 Starting hashtag cleanup...');
    
    const projectsCollection = db.collection('projects');
    const hashtagsCollection = db.collection('hashtags');
    
    // Get all hashtags currently used in projects
    // Enhanced to include both traditional and categorized hashtags
    const projects = await projectsCollection.find({}).toArray();
    const usedHashtags = new Set<string>();
    
    projects.forEach((project: ProjectDocument) => {
      // Add traditional hashtags (for backward compatibility)
      if (project.hashtags && Array.isArray(project.hashtags)) {
        project.hashtags.forEach((hashtag: string) => {
          usedHashtags.add(hashtag.toLowerCase());
        });
      }
      
      // Add categorized hashtags (new feature)
      if (project.categorizedHashtags) {
        Object.values(project.categorizedHashtags).forEach((categoryHashtags) => {
          if (Array.isArray(categoryHashtags)) {
            categoryHashtags.forEach((hashtag: string) => {
              usedHashtags.add(hashtag.toLowerCase());
            });
          }
        });
      }
    });
    
    // Delete hashtags that are no longer used
    const deleteResult = await hashtagsCollection.deleteMany({
      hashtag: { $not: { $in: Array.from(usedHashtags) } }
    });
    
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} unused hashtags`);
    return deleteResult.deletedCount;
  } catch (error) {
    console.error('❌ Failed to cleanup hashtags:', error);
    return 0;
  }
}

import config from '@/lib/config';
const MONGODB_DB = config.dbName;

async function connectToDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    const client = await clientPromise;
    
    // Test the connection
    await client.db(MONGODB_DB).admin().ping();
    console.log('✅ MongoDB Atlas connected successfully');
    
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    throw error;
  }
}

// GET /api/projects - Fetch projects with optional pagination and search
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const cursorParam = url.searchParams.get('cursor');
    const q = url.searchParams.get('q');
    const offsetParam = url.searchParams.get('offset');

    // New: server-side sorting across the entire dataset
    // WHAT: Allow sorting by Event Name, Date, Images, Total Fans, Attendees
    // WHY: Clicking a table header in the admin UI must reorder ALL projects, not just the visible page
    const sortFieldParam = url.searchParams.get('sortField'); // 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees'
    const sortOrderParam = url.searchParams.get('sortOrder'); // 'asc' | 'desc'

    // Defaults and caps
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(Number(limitParam) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');

    // Normalize and validate sorting inputs
    const ALLOWED_FIELDS = new Set(['eventName', 'eventDate', 'images', 'fans', 'attendees']);
    const sortField = sortFieldParam && ALLOWED_FIELDS.has(sortFieldParam) ? sortFieldParam as 'eventName' | 'eventDate' | 'images' | 'fans' | 'attendees' : null;
    const sortOrder = sortOrderParam === 'asc' || sortOrderParam === 'desc' ? sortOrderParam : null;

    // Decide pagination mode:
    // - If search (q) or explicit sort present -> use OFFSET pagination for global ordering
    // - Else -> keep existing CURSOR pagination by updatedAt desc (infinite scroll default)
    const isSearch = !!(q && q.trim() !== '');
    const isSorted = !!(sortField && sortOrder);

    if (isSearch || isSorted) {
      // OFFSET mode with aggregation to ensure full-dataset ordering
      const offset = Math.max(Number(offsetParam) || 0, 0);

      // Build $match (server-side search reuses existing criteria)
      const pipeline: any[] = [];
      if (isSearch) {
        const query = q!.trim();
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
        
        // WHAT: Expanded search to include both traditional and categorized hashtags
        // WHY: Users need to find events by hashtag values across both storage formats
        // HOW: Added $expr with $anyElementTrue to search nested categorizedHashtags object values
        pipeline.push({
          $match: {
            $or: [
              { eventName: { $regex: regex } },
              { viewSlug: { $regex: regex } },
              { editSlug: { $regex: regex } },
              // Traditional hashtags array search (regex already has 'i' flag)
              { hashtags: { $elemMatch: { $regex: regex } } },
              // Categorized hashtags nested object search
              // Uses $expr to evaluate if any category array contains matching hashtag
              {
                $expr: {
                  $anyElementTrue: {
                    $map: {
                      input: { $objectToArray: { $ifNull: ['$categorizedHashtags', {}] } },
                      as: 'category',
                      in: {
                        $anyElementTrue: {
                          $map: {
                            input: '$$category.v',
                            as: 'hashtag',
                            in: { $regexMatch: { input: '$$hashtag', regex: query, options: 'i' } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        });
      }

      // Compute sort keys for numeric aggregations; use $convert for dates
      pipeline.push({
        $addFields: {
          _sortEventDate: { $convert: { input: "$eventDate", to: "date", onError: null, onNull: null } },
          _images: {
            $add: [
              { $ifNull: ["$stats.remoteImages", 0] },
              { $ifNull: ["$stats.hostessImages", 0] },
              { $ifNull: ["$stats.selfies", 0] }
            ]
          },
          _fans: {
            $add: [
              { $ifNull: ["$stats.indoor", 0] },
              { $ifNull: ["$stats.outdoor", 0] },
              { $ifNull: ["$stats.stadium", 0] }
            ]
          },
          _attendees: { $ifNull: ["$stats.eventAttendees", 0] }
        }
      });

      // Map sort field to computed keys, with deterministic tie-breaker
      const dir = sortOrder === 'asc' ? 1 : -1;
      const sortSpec: Record<string, 1 | -1> = {};
      if (sortField === 'eventName') {
        // Use natural field with case-insensitive collation applied at aggregate call
        sortSpec['eventName'] = dir;
      } else if (sortField === 'eventDate') {
        sortSpec['_sortEventDate'] = dir;
      } else if (sortField === 'images') {
        sortSpec['_images'] = dir;
      } else if (sortField === 'fans') {
        sortSpec['_fans'] = dir;
      } else if (sortField === 'attendees') {
        sortSpec['_attendees'] = dir;
      } else {
        // No explicit sort provided: fallback to updatedAt desc for search-only mode
        sortSpec['updatedAt'] = -1;
        sortSpec['_id'] = -1;
      }
      // Deterministic tie-breaker for stable pagination order
      if (!sortSpec['_id']) sortSpec['_id'] = 1;
      pipeline.push({ $sort: sortSpec });

      // Use $facet to paginate and count in a single round-trip
      pipeline.push({
        $facet: {
          results: [
            { $skip: offset },
            { $limit: limit },
            {
              $project: {
                _sortEventDate: 0,
                _images: 0,
                _fans: 0,
                _attendees: 0
              }
            }
          ],
          totalCount: [ { $count: 'count' } ]
        }
      });

      const aggOptions = sortField === 'eventName' ? { collation: { locale: 'en', strength: 2 } } : undefined;
      const agg = await collection.aggregate(pipeline, aggOptions as any).toArray();
      const first = agg[0] || { results: [], totalCount: [] };
      const results = first.results || [];
      const totalMatched = (first.totalCount?.[0]?.count as number) || 0;

      // WHAT: Populate partner data for Sports Match projects (sort/search mode)
      // WHY: Frontend needs partner logos and emojis for display
      const partnersCollection = db.collection('partners');
      const partnerIds = results
        .map((p: any) => [p.partner1Id, p.partner2Id])
        .flat()
        .filter((id: any) => id && ObjectId.isValid(id))
        .map((id: any) => new ObjectId(id));
      
      const partnersData = partnerIds.length > 0
        ? await partnersCollection.find({ _id: { $in: partnerIds } }).toArray()
        : [];
      
      const partnersMap = new Map(
        partnersData.map(p => [p._id.toString(), p])
      );

      const formatted = results.map((project: any) => {
        const result: any = {
          _id: project._id.toString(),
          eventName: project.eventName,
          eventDate: project.eventDate,
          hashtags: project.hashtags || [],
          categorizedHashtags: project.categorizedHashtags || {},
          stats: project.stats,
          viewSlug: project.viewSlug,
          editSlug: project.editSlug,
          styleIdEnhanced: project.styleIdEnhanced ? project.styleIdEnhanced.toString() : null,
          reportTemplateId: project.reportTemplateId ? project.reportTemplateId.toString() : null,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        };
        
        // Add partner data if available
        if (project.partner1Id) {
          const partner1 = partnersMap.get(project.partner1Id.toString());
          if (partner1) {
            result.partner1 = {
              _id: partner1._id.toString(),
              name: partner1.name,
              emoji: partner1.emoji,
              logoUrl: partner1.logoUrl
            };
          }
        }
        
        if (project.partner2Id) {
          const partner2 = partnersMap.get(project.partner2Id.toString());
          if (partner2) {
            result.partner2 = {
              _id: partner2._id.toString(),
              name: partner2.name,
              emoji: partner2.emoji,
              logoUrl: partner2.logoUrl
            };
          }
        }
        
        return result;
      });

      const nextOffset = offset + formatted.length;
      const hasMore = nextOffset < totalMatched;

      return NextResponse.json({
        success: true,
        projects: formatted,
        pagination: {
          mode: isSearch ? 'search' : 'sort',
          limit,
          offset,
          nextOffset: hasMore ? nextOffset : null,
          totalMatched
        }
      });
    }

    // Default list mode with cursor-based pagination (no search, no explicit sort)
    // Cursor is a base64-encoded JSON: { u: updatedAt (ISO string), id: _id string }
    let filter: any = {};
    let sort = { updatedAt: -1 as const, _id: -1 as const };
    if (cursorParam) {
      try {
        const decoded = JSON.parse(Buffer.from(cursorParam, 'base64').toString('utf-8')) as { u: string; id: string };
        const u = decoded.u;
        const id = decoded.id;
        filter = {
          $or: [
            { updatedAt: { $lt: u } },
            { updatedAt: u, _id: { $lt: new ObjectId(id) } }
          ]
        };
      } catch {
        // Invalid cursor -> ignore and start from top
        filter = {};
      }
    }

    const projects = await collection
      .find(filter)
      .sort(sort)
      .limit(limit)
      .toArray();

    // WHAT: Populate partner data for Sports Match projects
    // WHY: Frontend needs partner logos and emojis for display
    const partnersCollection = db.collection('partners');
    const partnerIds = projects
      .map(p => [p.partner1Id, p.partner2Id])
      .flat()
      .filter(id => id && ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    
    const partnersData = partnerIds.length > 0
      ? await partnersCollection.find({ _id: { $in: partnerIds } }).toArray()
      : [];
    
    const partnersMap = new Map(
      partnersData.map(p => [p._id.toString(), p])
    );
    
    const formatted = projects.map(project => {
      // WHAT: Validate project data quality
      // WHY: Inform frontend about incomplete data for UI indicators
      const validation = validateProjectStats(project.stats || {});
      
      const result: any = {
        _id: project._id.toString(),
        eventName: project.eventName,
        eventDate: project.eventDate,
        hashtags: project.hashtags || [],               // Traditional hashtags (backward compatibility)
        categorizedHashtags: project.categorizedHashtags || {}, // New categorized hashtags
        stats: project.stats,
        viewSlug: project.viewSlug,
        editSlug: project.editSlug,
        styleIdEnhanced: project.styleIdEnhanced ? project.styleIdEnhanced.toString() : null, // Project-specific style reference
        reportTemplateId: project.reportTemplateId ? project.reportTemplateId.toString() : null, // Project-specific report template
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        // WHAT: Add data quality metadata for frontend consumption
        // WHY: Enable UI to show quality badges and warnings
        dataQuality: {
          completeness: validation.completeness,
          quality: validation.dataQuality,
          hasMinimumData: validation.hasMinimumData,
          missingRequired: validation.missingRequired
        }
      };
      
      // Add partner data if available
      if (project.partner1Id) {
        const partner1 = partnersMap.get(project.partner1Id.toString());
        if (partner1) {
          result.partner1 = {
            _id: partner1._id.toString(),
            name: partner1.name,
            emoji: partner1.emoji,
            logoUrl: partner1.logoUrl
          };
        }
      }
      
      if (project.partner2Id) {
        const partner2 = partnersMap.get(project.partner2Id.toString());
        if (partner2) {
          result.partner2 = {
            _id: partner2._id.toString(),
            name: partner2.name,
            emoji: partner2.emoji,
            logoUrl: partner2.logoUrl
          };
        }
      }
      
      return result;
    });

    let nextCursor: string | null = null;
    if (projects.length === limit) {
      const last = projects[projects.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ u: last.updatedAt, id: last._id.toString() }), 'utf-8').toString('base64');
    }

    return NextResponse.json({
      success: true,
      projects: formatted,
      pagination: {
        mode: 'cursor',
        limit,
        nextCursor
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch projects:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    }, { status: 500 });
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Enhanced to support both traditional and categorized hashtags + styleId + partner references + reportTemplateId
    const { eventName, eventDate, hashtags = [], categorizedHashtags = {}, stats, styleId, partner1Id, partner2Id, reportTemplateId } = body;

    if (!eventName || !eventDate || !stats) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: eventName, eventDate, stats' },
        { status: 400 }
      );
    }

    // WHAT: Validate and enrich stats before saving
    // WHY: Ensure data quality and add derived metrics
    const { stats: enrichedStats, validation } = prepareStatsForAnalytics(stats);
    
    // WHAT: Warn if data quality is poor (but don't reject)
    // WHY: Allow creation with incomplete data but flag for admin attention
    if (!validation.hasMinimumData) {
      console.warn(`⚠️ Creating project with insufficient data quality: ${validation.dataQuality} (${validation.completeness}%)`);
      console.warn(`Missing required metrics: ${validation.missingRequired.join(', ')}`);
    }

    console.log('💾 Creating new project:', eventName);

    // Generate unique slugs for the project
    console.log('🔑 Generating unique slugs...');
    const { viewSlug, editSlug } = await generateProjectSlugs();
    console.log('✅ Generated slugs:', { viewSlug: viewSlug.substring(0, 8) + '...', editSlug: editSlug.substring(0, 8) + '...' });

    // WHAT: Validate styleId against page_styles_enhanced collection
    // WHY: Migrated from old pageStyles system to new enhanced system
    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    
    if (styleId && styleId !== null && styleId !== 'null') {
      if (!ObjectId.isValid(styleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid styleId format' },
          { status: 400 }
        );
      }
      
      // Validate that the style exists in page_styles_enhanced collection
      const pageStylesCollection = db.collection('page_styles_enhanced');
      const styleExists = await pageStylesCollection.findOne({ _id: new ObjectId(styleId) });
      
      if (!styleExists) {
        return NextResponse.json(
          { success: false, error: 'Referenced style does not exist' },
          { status: 404 }
        );
      }
    }
    
    const collection = db.collection('projects');

    const now = new Date().toISOString();
    
    // Enhanced project structure to support categorized hashtags, styleId, and partner references
    const project: any = {
      eventName,
      eventDate,
      hashtags: hashtags || [],                        // Traditional hashtags (backward compatibility)
      categorizedHashtags: categorizedHashtags || {},  // New categorized hashtags field
      stats: enrichedStats, // Already enriched with derived metrics
      viewSlug,
      editSlug,
      createdAt: now,
      updatedAt: now
    };
    
    // WHAT: Add styleIdEnhanced field for page_styles_enhanced system integration
    // WHY: Migrated from old styleId to new styleIdEnhanced field name
    if (styleId && styleId !== null && styleId !== 'null') {
      project.styleIdEnhanced = styleId;
      console.log('🎨 [POST /api/projects] Setting styleIdEnhanced:', styleId);
    } else {
      console.log('🎨 [POST /api/projects] No styleId provided:', { styleId });
    }
    
    // WHAT: Add partner references for Sports Match projects
    // WHY: Enable display of team logos in projects list
    if (partner1Id && ObjectId.isValid(partner1Id)) {
      project.partner1Id = new ObjectId(partner1Id);
    }
    if (partner2Id && ObjectId.isValid(partner2Id)) {
      project.partner2Id = new ObjectId(partner2Id);
    }
    
    // WHAT: Add reportTemplateId if provided
    // WHY: Allow events to have custom report templates
    if (reportTemplateId && reportTemplateId !== '' && reportTemplateId !== 'null' && ObjectId.isValid(reportTemplateId)) {
      project.reportTemplateId = new ObjectId(reportTemplateId);
      console.log('📊 [POST /api/projects] Setting reportTemplateId:', reportTemplateId);
    } else {
      console.log('📊 [POST /api/projects] No reportTemplateId provided:', { reportTemplateId });
    }

    // Enhanced hashtag processing to handle both traditional and categorized hashtags
    // Store both plain hashtags and category-prefixed versions for comprehensive filtering
    const allHashtagRepresentations = getAllHashtagRepresentations({
      hashtags,
      categorizedHashtags
    });
    
    if (allHashtagRepresentations.length > 0) {
      const hashtagsCollection = db.collection('hashtags');
      
      // Process each hashtag representation individually to avoid conflicts
      for (const hashtagRepresentation of allHashtagRepresentations) {
        const normalizedHashtag = hashtagRepresentation.toLowerCase();
        
        // First try to increment existing hashtag
        const updateResult = await hashtagsCollection.updateOne(
          { hashtag: normalizedHashtag },
          { $inc: { count: 1 } }
        );
        
        // If no document was updated, create new hashtag
        if (updateResult.matchedCount === 0) {
          await hashtagsCollection.updateOne(
            { hashtag: normalizedHashtag },
            { 
              $setOnInsert: { 
                hashtag: normalizedHashtag, 
                count: 1,
                createdAt: now 
              }
            },
            { upsert: true }
          );
        }
      }
      
      console.log(`✅ Updated hashtag counts for ${allHashtagRepresentations.length} hashtag representations (${hashtags.length} traditional, ${Object.keys(categorizedHashtags).length} categories)`);
    }

    const result = await collection.insertOne(project);
    console.log('✅ Project created with ID:', result.insertedId);

    // WHAT: Auto-associate Partner 1's Bitly links with new project (many-to-many)
    // WHY: Quick Add shows partner Bitly links in preview, must connect them automatically
    // NOTE: Only Partner 1 (home team) links are associated, NOT Partner 2
    if (partner1Id && ObjectId.isValid(partner1Id)) {
      try {
        const partnersCollection = db.collection('partners');
        const partner = await partnersCollection.findOne({ _id: new ObjectId(partner1Id) });
        
        if (partner && partner.bitlyLinkIds && Array.isArray(partner.bitlyLinkIds)) {
          console.log(`🔗 Auto-associating ${partner.bitlyLinkIds.length} Bitly links from Partner 1 (${partner.name})`);
          
          // Create junction table entries for each Bitly link
          // This will automatically calculate date ranges and populate cached metrics
          let associatedCount = 0;
          for (const bitlyLinkId of partner.bitlyLinkIds) {
            try {
              await createLinkAssociation({
                bitlyLinkId: new ObjectId(bitlyLinkId),
                projectId: result.insertedId,
                autoCalculated: true
              });
              associatedCount++;
            } catch (linkError) {
              console.error(`❌ Failed to associate Bitly link ${bitlyLinkId}:`, linkError);
              // Continue with other links even if one fails
            }
          }
          
          console.log(`✅ Successfully associated ${associatedCount}/${partner.bitlyLinkIds.length} Bitly links`);
        } else {
          console.log('ℹ️ Partner 1 has no Bitly links to associate');
        }
      } catch (bitlyError) {
        console.error('❌ Failed to auto-associate Bitly links:', bitlyError);
        // Don't fail the project creation if Bitly association fails
      }
    }

    // WHAT: Log notification for project creation
    // WHY: Notify all users of new project activity
    try {
      const user = await getCurrentUser();
      await createNotification(db, {
        activityType: 'create',
        user,
        projectId: result.insertedId.toString(),
        projectName: eventName,
        projectSlug: viewSlug
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      projectId: result.insertedId.toString(),
      project: {
        _id: result.insertedId.toString(),
        ...project
      },
      // WHAT: Include data quality validation in response
      // WHY: Frontend can show warnings immediately after creation
      dataQuality: {
        completeness: validation.completeness,
        quality: validation.dataQuality,
        hasMinimumData: validation.hasMinimumData,
        warnings: validation.warnings,
        missingRequired: validation.missingRequired,
        missingOptional: validation.missingOptional
      }
    });

  } catch (error) {
    console.error('❌ Failed to create project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create project' 
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects - Update existing project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // Enhanced to support both traditional and categorized hashtags + styleId + reportTemplateId
    const { projectId, eventName, eventDate, hashtags = [], categorizedHashtags = {}, stats, styleId, reportTemplateId } = body;

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating project:', projectId, { styleId });

    // WHAT: Validate styleId against page_styles_enhanced collection
    // WHY: Migrated from old pageStyles system to new enhanced system
    if (styleId && styleId !== null && styleId !== 'null') {
      if (!ObjectId.isValid(styleId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid styleId format' },
          { status: 400 }
        );
      }
    }

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    // If styleId is provided, validate it exists in page_styles_enhanced collection
    if (styleId && styleId !== null && styleId !== 'null') {
      const pageStylesCollection = db.collection('page_styles_enhanced');
      const styleExists = await pageStylesCollection.findOne({ _id: new ObjectId(styleId) });
      
      if (!styleExists) {
        return NextResponse.json(
          { success: false, error: 'Referenced style does not exist' },
          { status: 404 }
        );
      }
    }
    
    // Get the current project to compare hashtags
    const currentProject = await collection.findOne({ _id: new ObjectId(projectId) });
    if (!currentProject) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // WHAT: Validate and enrich stats before updating
    // WHY: Ensure data quality and add derived metrics
    const { stats: enrichedStats, validation } = prepareStatsForAnalytics(stats);
    
    // WHAT: Warn if data quality is poor (but don't reject)
    // WHY: Allow updates with incomplete data but flag for admin attention
    if (!validation.hasMinimumData) {
      console.warn(`⚠️ Updating project with insufficient data quality: ${validation.dataQuality} (${validation.completeness}%)`);
      console.warn(`Missing required metrics: ${validation.missingRequired.join(', ')}`);
    }
    
    // Enhanced update data to include categorized hashtags
    const setData: any = {
      eventName,
      eventDate,
      hashtags: hashtags || [],                        // Traditional hashtags (backward compatibility)
      categorizedHashtags: categorizedHashtags || {},  // New categorized hashtags field
      stats: enrichedStats, // Already enriched with derived metrics
      updatedAt: new Date().toISOString()
    };
    
    // WHAT: Handle styleIdEnhanced assignment/removal strategically
    // WHY: Migrated from old styleId to new styleIdEnhanced field name
    let unsetData: any = {};
    
    if (styleId === null || styleId === 'null') {
      // Remove styleIdEnhanced to use global/default style
      unsetData.styleIdEnhanced = '';
      console.log('🎨 [PUT /api/projects] Removing styleIdEnhanced');
    } else if (styleId && styleId !== undefined) {
      // Set specific styleIdEnhanced
      setData.styleIdEnhanced = styleId;
      console.log('🎨 [PUT /api/projects] Setting styleIdEnhanced:', styleId);
    } else {
      console.log('🎨 [PUT /api/projects] No styleId in request');
    }
    // If styleId is not provided in the request, don't modify existing styleIdEnhanced
    
    // WHAT: Handle reportTemplateId assignment/removal
    // WHY: Allow events to override partner or default report templates
    if (reportTemplateId === null || reportTemplateId === '' || reportTemplateId === 'null') {
      // Remove reportTemplateId (use partner or default template)
      unsetData.reportTemplateId = '';
      console.log('📊 [PUT /api/projects] Removing reportTemplateId');
    } else if (reportTemplateId && reportTemplateId !== undefined && ObjectId.isValid(reportTemplateId)) {
      // Set specific reportTemplateId
      setData.reportTemplateId = new ObjectId(reportTemplateId);
      console.log('📊 [PUT /api/projects] Setting reportTemplateId:', reportTemplateId);
    } else if (reportTemplateId !== undefined) {
      console.log('📊 [PUT /api/projects] Invalid reportTemplateId:', { reportTemplateId });
    }
    // If reportTemplateId is not provided in the request, don't modify existing reportTemplateId
    
    // Build the update operation object
    const updateOperation: any = { $set: setData };
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }
    
    // Enhanced hashtag change handling for both traditional and categorized hashtags
    // Use all hashtag representations (including category-prefixed versions)
    const currentAllHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: currentProject.hashtags || [],
      categorizedHashtags: currentProject.categorizedHashtags || {}
    }).map((h: string) => h.toLowerCase());
    
    const newAllHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: hashtags || [],
      categorizedHashtags: categorizedHashtags || {}
    }).map((h: string) => h.toLowerCase());
    
    const hashtagsCollection = db.collection('hashtags');
    const now = new Date().toISOString();
    
    // Hashtags to add (in new but not in current)
    const hashtagsToAdd = newAllHashtagRepresentations.filter((h: string) => !currentAllHashtagRepresentations.includes(h));
    // Hashtags to remove (in current but not in new)
    const hashtagsToRemove = currentAllHashtagRepresentations.filter((h: string) => !newAllHashtagRepresentations.includes(h));
    
    // Update hashtag counts
    if (hashtagsToAdd.length > 0) {
      // Process each hashtag individually to avoid conflicts
      for (const hashtag of hashtagsToAdd) {
        // First try to increment existing hashtag
        const updateResult = await hashtagsCollection.updateOne(
          { hashtag },
          { $inc: { count: 1 } }
        );
        
        // If no document was updated, create new hashtag
        if (updateResult.matchedCount === 0) {
          await hashtagsCollection.updateOne(
            { hashtag },
            { 
              $setOnInsert: { 
                hashtag, 
                count: 1,
                createdAt: now 
              }
            },
            { upsert: true }
          );
        }
      }
      console.log(`✅ Added ${hashtagsToAdd.length} new hashtags`);
    }
    
    if (hashtagsToRemove.length > 0) {
      // Decrement count for removed hashtags
      for (const hashtag of hashtagsToRemove) {
        await hashtagsCollection.updateOne(
          { hashtag },
          { $inc: { count: -1 } }
        );
      }
      console.log(`✅ Decremented count for ${hashtagsToRemove.length} hashtags`);
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(projectId) },
      updateOperation
    );

    console.log('✅ Project updated successfully');
    
    // WHAT: Trigger Bitly recalculation if eventDate changed
    // WHY: Date changes affect temporal boundaries for Bitly analytics attribution
    if (currentProject.eventDate !== eventDate) {
      console.log('📅 Event date changed, triggering Bitly recalculation...');
      try {
        const bitlinksAffected = await recalculateProjectLinks(new ObjectId(projectId));
        console.log(`✅ Recalculated ${bitlinksAffected} Bitly links due to date change`);
      } catch (bitlyError) {
        console.error('⚠️ Failed to recalculate Bitly links:', bitlyError);
        // Don't fail the request if Bitly recalculation fails
      }
    }
    
    // WHAT: Log notification for project edit
    // WHY: Notify all users of project changes
    try {
      const user = await getCurrentUser();
      await createNotification(db, {
        activityType: 'edit',
        user,
        projectId: projectId,
        projectName: eventName,
        projectSlug: currentProject.viewSlug || null
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the request if notification fails
    }
    
    // Clean up unused hashtags
    await cleanupUnusedHashtags(db);

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount > 0
    });

  } catch (error) {
    console.error('❌ Failed to update project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update project' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects - Delete project
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting project:', projectId);

    const client = await connectToDatabase();
    const db = client.db(MONGODB_DB);
    const collection = db.collection('projects');
    
    // Get the project's hashtags before deletion
    const project = await collection.findOne({ _id: new ObjectId(projectId) });
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Delete the project
    const result = await collection.deleteOne({ _id: new ObjectId(projectId) });

    console.log('✅ Project deleted successfully');
    
    // WHAT: Trigger Bitly recalculation for affected links
    // WHY: Deleted event's date ranges must be redistributed to remaining events
    console.log('🔗 Handling Bitly link redistribution after project deletion...');
    try {
      const bitlinksAffected = await handleProjectDeletion(new ObjectId(projectId));
      console.log(`✅ Redistributed date ranges for ${bitlinksAffected} Bitly links`);
    } catch (bitlyError) {
      console.error('⚠️ Failed to handle Bitly redistribution:', bitlyError);
      // Don't fail the request if Bitly handling fails
    }
    
    // Enhanced hashtag cleanup for both traditional and categorized hashtags
    // Remove all hashtag representations (including category-prefixed versions)
    const allDeletedHashtagRepresentations = getAllHashtagRepresentations({
      hashtags: project.hashtags || [],
      categorizedHashtags: project.categorizedHashtags || {}
    });
    
    if (allDeletedHashtagRepresentations.length > 0) {
      const hashtagsCollection = db.collection('hashtags');
      
      // Decrement count for each hashtag representation
      for (const hashtagRepresentation of allDeletedHashtagRepresentations) {
        await hashtagsCollection.updateOne(
          { hashtag: hashtagRepresentation.toLowerCase() },
          { $inc: { count: -1 } }
        );
      }
      
      console.log(`✅ Decremented count for ${allDeletedHashtagRepresentations.length} hashtag representations (including categorized)`);
      
      // Clean up unused hashtags
      await cleanupUnusedHashtags(db);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Failed to delete project:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete project' 
      },
      { status: 500 }
    );
  }
}