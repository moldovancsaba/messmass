// WHAT: API endpoint to trigger partner enrichment from API-Football
// WHY: Allow admin to manually trigger daily enrichment via UI button
// HOW: Run enrichment script, track last run time, enforce 9 AM cooldown

import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getAdminUser } from '@/lib/auth';
import config from '@/lib/config';
import { createApiFootballClient, Sport } from '@/lib/api-football';

// WHAT: Remove accents from string
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// WHAT: Search for a partner with fuzzy matching
async function searchPartnerInApiFootball(
  partnerName: string,
  sport: Sport
): Promise<any | null> {
  const client = createApiFootballClient(sport);

  try {
    const cleanName = removeAccents(partnerName)
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanName) {
      const teams = await client.searchTeam(cleanName);
      await new Promise((resolve) => setTimeout(resolve, 6500)); // Rate limit
      if (teams.length > 0) {
        return teams[0];
      }
    }

    const firstName = cleanName.split(' ')[0];
    if (firstName && firstName.length > 3) {
      const teams = await client.searchTeam(firstName);
      await new Promise((resolve) => setTimeout(resolve, 6500));
      if (teams.length > 0) {
        return teams[0];
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.message.includes('rate limit')) {
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
    return null;
  }
}

/**
 * POST /api/api-football/enrich-partners
 * WHAT: Trigger enrichment of next 5 partners
 * WHY: Allow admin to manually trigger daily batch
 * AUTH: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = new MongoClient(config.mongodbUri);
    await client.connect();
    const db = client.db(config.dbName);

    // Check last enrichment time
    const lastRun = await db.collection('api_football_enrichment_log').findOne({}, { sort: { timestamp: -1 } });

    if (lastRun) {
      const lastRunTime = new Date(lastRun.timestamp);
      const now = new Date();
      const hoursSinceLastRun = (now.getTime() - lastRunTime.getTime()) / (1000 * 60 * 60);

      // Only allow once per day (24 hours)
      if (hoursSinceLastRun < 24) {
        const nextAvailable = new Date(lastRunTime.getTime() + 24 * 60 * 60 * 1000);
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Enrichment already run today',
          nextAvailable: nextAvailable.toISOString(),
          hoursRemaining: Math.ceil(24 - hoursSinceLastRun),
        });
      }
    }

    // Get next 5 unenriched partners
    const partnersToEnrich = await db
      .collection('partners')
      .find({ 'enrichedData.apiFootball': { $exists: false } })
      .sort({ createdAt: 1 })
      .limit(5)
      .toArray();

    if (partnersToEnrich.length === 0) {
      await client.close();
      return NextResponse.json({
        success: true,
        message: 'All partners already enriched!',
        enriched: 0,
        remaining: 0,
      });
    }

    const sports: Sport[] = ['soccer', 'basketball', 'handball', 'hockey', 'volleyball'];
    let enriched = 0;

    for (const partner of partnersToEnrich) {
      for (const sport of sports) {
        const teamData = await searchPartnerInApiFootball(partner.name, sport);

        if (teamData && teamData.team) {
          const { team, venue } = teamData;

          const apiFootballData = {
            teamId: team.id,
            sport,
            name: team.name || '',
            code: team.code || '',
            country: team.country || '',
            founded: team.founded || 0,
            logo: team.logo || '',
            venueName: venue?.name || '',
            venueAddress: venue?.address || '',
            venueCity: venue?.city || '',
            venueCapacity: venue?.capacity || 0,
            venueSurface: venue?.surface || '',
            venueImage: venue?.image || '',
            enrichedAt: new Date().toISOString(),
            lastSyncAt: new Date().toISOString(),
          };

          await db.collection('partners').updateOne(
            { _id: partner._id },
            {
              $set: {
                'enrichedData.apiFootball': apiFootballData,
                updatedAt: new Date().toISOString(),
              },
            }
          );

          enriched++;
          break; // Stop after first match
        }
      }
    }

    // Log this enrichment run
    await db.collection('api_football_enrichment_log').insertOne({
      timestamp: new Date().toISOString(),
      enriched,
      processed: partnersToEnrich.length,
      triggeredBy: user.email || 'admin',
    });

    // Get remaining count
    const remaining = await db.collection('partners').countDocuments({
      'enrichedData.apiFootball': { $exists: false },
    });

    await client.close();

    return NextResponse.json({
      success: true,
      enriched,
      processed: partnersToEnrich.length,
      remaining,
      nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('[POST /api/api-football/enrich-partners] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/api-football/enrich-partners
 * WHAT: Check enrichment status
 * WHY: UI needs to know if button should be enabled
 * AUTH: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = new MongoClient(config.mongodbUri);
    await client.connect();
    const db = client.db(config.dbName);

    const lastRun = await db.collection('api_football_enrichment_log').findOne({}, { sort: { timestamp: -1 } });

    const remaining = await db.collection('partners').countDocuments({
      'enrichedData.apiFootball': { $exists: false },
    });

    await client.close();

    let canRun = true;
    let nextAvailable = null;
    let hoursRemaining = 0;

    if (lastRun) {
      const lastRunTime = new Date(lastRun.timestamp);
      const now = new Date();
      const hoursSinceLastRun = (now.getTime() - lastRunTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastRun < 24) {
        canRun = false;
        nextAvailable = new Date(lastRunTime.getTime() + 24 * 60 * 60 * 1000).toISOString();
        hoursRemaining = Math.ceil(24 - hoursSinceLastRun);
      }
    }

    return NextResponse.json({
      success: true,
      canRun,
      remaining,
      lastRun: lastRun ? lastRun.timestamp : null,
      nextAvailable,
      hoursRemaining,
    });
  } catch (error) {
    console.error('[GET /api/api-football/enrich-partners] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
