// app/api/bitly/pull/route.ts
// WHAT: API endpoint to pull links from Bitly organization and import them into MessMass
// WHY: Enables bulk discovery and import of existing Bitly links for association with projects
// ENDPOINT: POST /api/bitly/pull

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { getGroupBitlinks, getLink } from '@/lib/bitly';
import { mapBitlyLinkToDoc } from '@/lib/bitly-mappers';

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

        // WHAT: Fetch ONLY link metadata (no analytics to avoid Forbidden errors)
        // WHY: Analytics cause 403 errors; just import link structure first
        console.log(`[Bitly Pull] Fetching metadata for ${bitlink}`);
        const linkMetadata = await getLink(bitlink);

        // WHAT: Map Bitly metadata to MongoDB document structure
        // WHY: Transforms API response to our database schema
        const linkDoc = mapBitlyLinkToDoc(
          null, // projectId: null (unassigned by default)
          linkMetadata,
          undefined // Use Bitly's title
        );

        // WHAT: Insert link document WITHOUT analytics (will be synced later)
        // WHY: Just import the link structure; analytics will be filled by daily sync
        const now = new Date().toISOString();
        await linksCollection.insertOne({
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
        });

        console.log(`[Bitly Pull] ✓ Imported ${bitlink} (analytics will sync automatically)`);
        results.imported++;

        // WHAT: Short delay between links
        // WHY: Only 1 API call per link now (just metadata)
        await new Promise(resolve => setTimeout(resolve, 200));

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
