// app/api/bitly/pull/route.ts
// WHAT: API endpoint to pull links from Bitly organization and import them into MessMass
// WHY: Enables bulk discovery and import of existing Bitly links for association with projects
// ENDPOINT: POST /api/bitly/pull

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getGroupBitlinks } from '@/lib/bitly';
import { mapBitlyLinkToDoc } from '@/lib/bitly-mappers';
import { info as logInfo } from '@/lib/logger';

/**
 * POST /api/bitly/pull
 * WHAT: Fetch ALL links from Bitly group and import new ones into MessMass database
 * WHY: Enables discovering all Bitly links without manually adding each one
 * 
 * AUTH: Admin only
 * BODY: { limit?: number } - Optional limit (default: 100, max: 1000)
 * 
 * STRATEGY:
 * - Fetch large batch of links from Bitly (only basic metadata, fast)
 * - Filter out links already in our database
 * - Import only NEW links (avoiding duplicate checks on each one)
 * - No individual API calls per link (fast bulk import)
 * - Analytics will be synced later via daily sync job
 */
export async function POST(request: NextRequest) {
  try {
    // WHAT: Verify admin authentication
    // WHY: Only admins can pull and import links
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // WHAT: Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 100; // Default to 100 links (fast batch import)

    logInfo('Starting Bitly pull import', { context: 'bitly-pull', limit });

    // WHAT: Fetch links from Bitly group using configured BITLY_GROUP_GUID
    // WHY: This endpoint returns basic link info (id, long_url, title) without analytics
    // PERFORMANCE: Single API call fetches up to 100 links (no per-link calls needed)
    const bitlyResponse = await getGroupBitlinks(config.bitlyGroupGuid, { size: limit });

    if (!bitlyResponse.links || bitlyResponse.links.length === 0) {
      return NextResponse.json({
        success: true,
      message: 'No links found in Bitly group',
        summary: {
          total: 0,
          imported: 0,
          skipped: 0,
          errors: 0,
        },
      });
    }

    console.log(`[Bitly Pull] Found ${bitlyResponse.links.length} links in Bitly group`);

    // WHAT: Connect to database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const linksCollection = db.collection('bitly_links');

    // WHAT: Get all existing bitlinks from database in single query
    // WHY: Bulk check is faster than individual lookups per link
    const allBitlinks = bitlyResponse.links.map(link => link.id);
    const existingLinks = await linksCollection.find(
      { bitlink: { $in: allBitlinks } },
      { projection: { bitlink: 1 } }
    ).toArray();
    const existingBitlinksSet = new Set(existingLinks.map(doc => doc.bitlink));
    
    console.log(`[Bitly Pull] Found ${existingBitlinksSet.size} existing links in database`);

    // WHAT: Filter to only NEW links not in database
    // WHY: Avoid duplicate imports and unnecessary processing
    const newLinks = bitlyResponse.links.filter(link => !existingBitlinksSet.has(link.id));
    
    console.log(`[Bitly Pull] Importing ${newLinks.length} new links`);

    // WHAT: Track import results
    const results = {
      total: bitlyResponse.links.length,
      imported: 0,
      skipped: existingBitlinksSet.size,
      errors: 0,
      errorDetails: [] as Array<{ bitlink: string; error: string }>,
    };

    // WHAT: Bulk insert all new links at once
    // WHY: Much faster than individual inserts; reduces database round-trips
    if (newLinks.length > 0) {
      try {
        const now = new Date().toISOString();
        const documentsToInsert = newLinks.map(linkSummary => {
          // WHAT: Use data directly from group links response (already has id, long_url, title)
          // WHY: No need for individual API calls; response includes all basic metadata
          const linkDoc = mapBitlyLinkToDoc(
            null, // projectId: null (unassigned)
            linkSummary, // Use summary data directly
            undefined // Use Bitly's title
          );

          return {
            ...linkDoc,
            click_summary: {
              total: 0,
              unique: 0,
              updatedAt: now
            },
            clicks_timeseries: [],
            geo: {
              countries: [],
              cities: [],
            },
            referrers: [],
            lastSyncAt: now,
            createdAt: now,
            updatedAt: now,
          };
        });

        // WHAT: Insert all new links in single database operation
        // WHY: Bulk insert is 10-100x faster than individual inserts
        const insertResult = await linksCollection.insertMany(documentsToInsert, { ordered: false });
        results.imported = insertResult.insertedCount;
        
        console.log(`[Bitly Pull] ✓ Bulk imported ${results.imported} new links`);
      } catch (error) {
        console.error(`[Bitly Pull] Bulk insert error:`, error);
        results.errors++;
        results.errorDetails.push({
          bitlink: 'bulk_insert',
          error: error instanceof Error ? error.message : 'Bulk insert failed',
        });
      }
    }

    // WHAT: Return summary of import operation
    const message = `Import complete! ${results.imported} new links imported, ${results.skipped} already existed, ${results.errors} errors`;

    return NextResponse.json({
      success: true,
      message,
      summary: {
        total: results.total,
        imported: results.imported,
        skipped: results.skipped,
        errors: results.errors,
      },
      errorDetails: results.errorDetails.length > 0 ? results.errorDetails : undefined,
    });

  } catch (error) {
    console.error('[POST /api/bitly/pull] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
