// app/api/bitly/pull/route.ts
// WHAT: API endpoint to pull links from Bitly organization and import them into MessMass
// WHY: Enables bulk discovery and import of existing Bitly links for association with projects
// ENDPOINT: POST /api/bitly/pull

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getGroupBitlinks, getLink, getFullAnalytics } from '@/lib/bitly';
import { 
  mapBitlyLinkToDoc, 
  mapClicksSummary, 
  mapSeriesToDaily, 
  mapCountries, 
  mapReferrers 
} from '@/lib/bitly-mappers';

/**
 * POST /api/bitly/pull
 * WHAT: Fetch links from Bitly organization and import them into MessMass database
 * WHY: Allows bulk import of existing Bitly links for management and analytics tracking
 * 
 * AUTH: Admin only
 * BODY: { limit?: number } - Optional limit on number of links to pull (default: 50)
 * 
 * STRATEGY:
 * - Fetch links from Bitly organization using getGroupBitlinks()
 * - For each link, check if it already exists in database
 * - Import new links as unassigned (projectId: null)
 * - Skip links that already exist to avoid duplicates
 * - Return summary of imported and skipped links
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
    const limit = body.limit || 5; // Default to 5 links to avoid rate limits

    console.log(`[Bitly Pull] Starting import of up to ${limit} links from organization`);

    // WHAT: Fetch links from Bitly organization
    // WHY: Discovery of all links available in the account
    const bitlyResponse = await getGroupBitlinks(undefined, { size: limit });

    if (!bitlyResponse.links || bitlyResponse.links.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No links found in Bitly organization',
        summary: {
          total: 0,
          imported: 0,
          skipped: 0,
          errors: 0,
        },
      });
    }

    console.log(`[Bitly Pull] Found ${bitlyResponse.links.length} links in Bitly organization`);

    // WHAT: Connect to database
    const client = await clientPromise;
    const db = client.db(config.dbName);
    const linksCollection = db.collection('bitly_links');

    // WHAT: Process each link and track results
    const results = {
      total: bitlyResponse.links.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] as Array<{ bitlink: string; error: string }>,
    };

    for (const linkSummary of bitlyResponse.links) {
      try {
        const bitlink = linkSummary.id; // Bitlink ID in format "bit.ly/abc123"

        // WHAT: Check if link already exists in database
        // WHY: Avoid importing duplicates
        const existingLink = await linksCollection.findOne({ bitlink });

        if (existingLink) {
          console.log(`[Bitly Pull] Skipping ${bitlink} - already exists`);
          results.skipped++;
          continue;
        }

        // WHAT: Fetch full link metadata and analytics from Bitly API
        // WHY: Need complete details including long_url, title, tags, AND analytics data
        console.log(`[Bitly Pull] Fetching metadata and analytics for ${bitlink}`);
        const linkMetadata = await getLink(bitlink);
        
        // WHAT: Fetch complete analytics data for the link
        // WHY: Import all analytics so events can calculate metrics immediately
        const analytics = await getFullAnalytics(bitlink);

        // WHAT: Map Bitly metadata to MongoDB document structure
        // WHY: Transforms API response to our database schema
        const linkDoc = mapBitlyLinkToDoc(
          null, // projectId: null (unassigned by default)
          linkMetadata,
          undefined // Use Bitly's title
        );

        // WHAT: Map analytics data to MongoDB structures
        // WHY: Store click counts, geographic data, referrers, and timeseries for event calculations
        const clickSummary = mapClicksSummary(analytics.summary);
        const timeseries = mapSeriesToDaily(analytics.series);
        const countries = mapCountries(analytics.countries);
        const referrersData = mapReferrers(analytics.referrers);

        // WHAT: Calculate last synced date from timeseries
        // WHY: Track sync boundaries for incremental updates
        const lastClicksSyncedUntil = timeseries.length > 0
          ? timeseries[timeseries.length - 1].date
          : undefined;

        // WHAT: Insert link document with full analytics into database
        // WHY: Persist the link AND its analytics for immediate event calculations
        const now = new Date().toISOString();
        await linksCollection.insertOne({
          ...linkDoc,
          click_summary: clickSummary,
          clicks_timeseries: timeseries,
          geo: {
            countries,
            cities: [], // Cities data not available in bulk pull
          },
          referrers: referrersData,
          lastSyncAt: now,
          lastClicksSyncedUntil,
          createdAt: now,
          updatedAt: now,
        });

        console.log(`[Bitly Pull] ✓ Imported ${bitlink} with ${clickSummary.total} total clicks`);
        results.imported++;

        // WHAT: Longer delay to avoid rate limiting with analytics calls
        // WHY: Each link now makes 5 API calls (metadata + 4 analytics endpoints)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[Bitly Pull] Error processing ${linkSummary.id}:`, error);
        results.errors++;
        results.errorDetails.push({
          bitlink: linkSummary.id,
          error: error instanceof Error ? error.message : 'Unknown error',
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
