// lib/createEvent.ts
// WHAT: Create one Messmass event (project) with everything creation does: hashtag shape check, stats enrichment,
//     slugs, style check, hashtag counts, Partner 1's Bitly links.
// WHY: The admin route (POST /api/projects) and the Fanmass match-event route
//     (POST /api/integrations/fanmass/match-events) create events the same way, so the rules live once. Each caller
//     keeps its own guard, the Camera mirror (provisionCameraEventForProject) and its response.

import { Db, ObjectId } from 'mongodb';
import { generateProjectSlugs } from '@/lib/slugUtils';
import { error as logError, info as logInfo, warn as logWarn, debug as logDebug } from '@/lib/logger';
import { getAllHashtagRepresentations } from '@/lib/hashtagCategoryUtils';
import { prepareStatsForAnalytics, type ProjectStats, type ValidationResult } from '@/lib/dataValidator';
import { createLinkAssociation } from '@/lib/bitly-recalculator';
import { eventHashtagsProblem, eventCategorizedHashtagsProblem } from '@/lib/eventSaveRules';

export class EventCreateError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface NewEventInput {
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: Record<string, string[]>;
  stats: Partial<ProjectStats>;
  styleId?: string | null;
  partner1Id?: string;
  partner2Id?: string;
  reportTemplateId?: string | null;
}

export async function insertEvent(
  db: Db,
  input: NewEventInput,
): Promise<{ insertedId: ObjectId; project: Record<string, any>; validation: ValidationResult }> {
  const { eventName, eventDate, hashtags = [], categorizedHashtags = {}, stats, styleId, partner1Id, partner2Id, reportTemplateId } = input;
  if (!eventName || !eventDate || !stats) throw new EventCreateError(400, 'Missing required fields: eventName, eventDate, stats');

  // Same hashtag shape rule as PUT (lib/eventSaveRules.ts): a malformed list
  // stored on one event breaks every page that reads all events' hashtags.
  const hashtagProblem = eventHashtagsProblem(hashtags) ?? eventCategorizedHashtagsProblem(categorizedHashtags);
  if (hashtagProblem) {
    throw new EventCreateError(400, hashtagProblem);
  }

  // WHAT: Validate and enrich stats before saving
  // WHY: Ensure data quality and add derived metrics
  const { stats: enrichedStats, validation } = prepareStatsForAnalytics(stats);
  
  // WHAT: Warn if data quality is poor (but don't reject)
  // WHY: Allow creation with incomplete data but flag for admin attention
  if (!validation.hasMinimumData) {
    logWarn('Creating project with insufficient data quality', { context: 'projects', dataQuality: validation.dataQuality, completeness: validation.completeness, missingRequired: validation.missingRequired });
  }

  logInfo('Creating new project', { context: 'projects', eventName });

  // Generate unique slugs for the project
  logDebug('Generating unique slugs', { context: 'projects' });
  const { viewSlug, editSlug } = await generateProjectSlugs();
  logDebug('Generated slugs', { context: 'projects', viewSlugPrefix: viewSlug.substring(0, 8), editSlugPrefix: editSlug.substring(0, 8) });

  // WHAT: Validate styleId against page_styles_enhanced collection
  // WHY: Migrated from old pageStyles system to new enhanced system
  
  if (styleId && styleId !== null && styleId !== 'null') {
    if (!ObjectId.isValid(styleId)) {
      throw new EventCreateError(400, 'Invalid styleId format');
    }
    
    // Validate that the style exists in report_styles collection (26-color system)
    const reportStylesCollection = db.collection('report_styles');
    const styleExists = await reportStylesCollection.findOne({ _id: new ObjectId(styleId) });
    
    if (!styleExists) {
      throw new EventCreateError(404, 'Referenced report style does not exist');
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
    logDebug('Setting styleIdEnhanced', { context: 'projects', styleId, method: 'POST' });
  } else {
    logDebug('No styleId provided', { context: 'projects', styleId, method: 'POST' });
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
    logDebug('Setting reportTemplateId', { context: 'projects', reportTemplateId, method: 'POST' });
  } else {
    logDebug('No reportTemplateId provided', { context: 'projects', reportTemplateId, method: 'POST' });
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
    
    logInfo('Updated hashtag counts', { context: 'projects', totalRepresentations: allHashtagRepresentations.length, traditionalCount: hashtags.length, categoryCount: Object.keys(categorizedHashtags).length });
  }

  const result = await collection.insertOne(project);
  logInfo('Project created successfully', { context: 'projects', projectId: result.insertedId.toString(), eventName });

  // WHAT: Auto-associate Partner 1's Bitly links with new project (many-to-many)
  // WHY: Quick Add shows partner Bitly links in preview, must connect them automatically
  // NOTE: Only Partner 1 (home team) links are associated, NOT Partner 2
  if (partner1Id && ObjectId.isValid(partner1Id)) {
    try {
      const partnersCollection = db.collection('partners');
      const partner = await partnersCollection.findOne({ _id: new ObjectId(partner1Id) });
      
      if (partner && partner.bitlyLinkIds && Array.isArray(partner.bitlyLinkIds)) {
        logInfo('Auto-associating Bitly links from Partner 1', { context: 'projects', linkCount: partner.bitlyLinkIds.length, partnerName: partner.name, projectId: result.insertedId.toString() });
        
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
            logError('Failed to associate Bitly link', { context: 'projects', bitlyLinkId: bitlyLinkId.toString(), projectId: result.insertedId.toString() }, linkError instanceof Error ? linkError : new Error(String(linkError)));
            // Continue with other links even if one fails
          }
        }
        
        logInfo('Successfully associated Bitly links', { context: 'projects', associatedCount, totalLinks: partner.bitlyLinkIds.length, projectId: result.insertedId.toString() });
      } else {
        logDebug('Partner 1 has no Bitly links to associate', { context: 'projects', projectId: result.insertedId.toString() });
      }
    } catch (bitlyError) {
      logError('Failed to auto-associate Bitly links', { context: 'projects', projectId: result.insertedId.toString() }, bitlyError instanceof Error ? bitlyError : new Error(String(bitlyError)));
      // Don't fail the project creation if Bitly association fails
    }
  }


  return { insertedId: result.insertedId, project, validation };
}
