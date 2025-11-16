// WHAT: Daily incremental partner enrichment from API-Football
// WHY: Stay under free tier limits (100 req/day) while enriching all partners
// HOW: Process oldest unenriched partners first, store multi-source data

import { MongoClient, ObjectId } from 'mongodb';
import { createApiFootballClient, Sport } from '@/lib/api-football';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// WHAT: Configuration for daily enrichment
// WHY: Stay well under 100 req/day limit (10 req/min) AND respect time constraints
// HOW: Process fewer partners but search smarter (stop after first match)
const DAILY_CONFIG = {
  maxPartnersPerDay: 5, // Conservative: 5 partners × 3 search attempts × 5 sports = ~75 API calls max
  sports: ['soccer', 'basketball', 'handball', 'hockey', 'volleyball'] as Sport[],
  stopAfterFirstMatch: true, // Stop searching other sports after first match
};

// WHAT: Enhanced partner data structure with multi-source support
// WHY: Store both TheSportsDB and API-Football data side-by-side
interface EnrichedPartnerData {
  // Existing TheSportsDB data (if present)
  theSportsDB?: {
    teamId: string;
    name: string;
    badge: string;
    stadium: string;
    capacity: number;
    description: string;
    country: string;
    enrichedAt: string;
  };
  // New API-Football data
  apiFootball?: {
    teamId: number;
    sport: Sport;
    name: string; // Official API name
    code: string; // Team code (e.g., ROM, BAR)
    country: string;
    founded: number;
    logo: string; // Official logo URL
    venueName: string;
    venueAddress: string;
    venueCity: string;
    venueCapacity: number;
    venueSurface: string;
    venueImage: string;
    enrichedAt: string;
    lastSyncAt: string;
  };
}

/**
 * WHAT: Remove accents from string
 * WHY: API-Football only accepts alphanumeric characters
 * HOW: Normalize Unicode and strip combining marks
 */
function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * WHAT: Search for a partner in API-Football with fuzzy matching
 * WHY: Partner names may not exactly match API team names
 * HOW: Try multiple search strategies with progressively simpler names
 */
async function searchPartnerInApiFootball(
  partnerName: string,
  sport: Sport
): Promise<any | null> {
  const client = createApiFootballClient(sport);

  try {
    // Strategy 1: Clean name (remove accents and special characters)
    const cleanName = removeAccents(partnerName)
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanName) {
      const teams = await client.searchTeam(cleanName);
      // Wait 6 seconds between API calls (rate limit: 10 req/min = 1 every 6 seconds)
      await new Promise((resolve) => setTimeout(resolve, 6500));
      if (teams.length > 0) {
        return teams[0];
      }
    }

    // Strategy 2: Try first word only (e.g., "Ujpest" from "Ujpest FC")
    const firstName = cleanName.split(' ')[0];
    if (firstName && firstName.length > 3) {
      const teams = await client.searchTeam(firstName);
      await new Promise((resolve) => setTimeout(resolve, 6500));
      if (teams.length > 0) {
        return teams[0];
      }
    }

    // Strategy 3: Try without common prefixes/suffixes
    const withoutAffixes = cleanName
      .replace(/^(FC|CF|AC|AS|US|SC)\s/i, '')
      .replace(/\s(FC|CF|AC|AS|US|SC)$/i, '')
      .trim();

    if (withoutAffixes && withoutAffixes !== cleanName) {
      const teams = await client.searchTeam(withoutAffixes);
      await new Promise((resolve) => setTimeout(resolve, 6500));
      if (teams.length > 0) {
        return teams[0];
      }
    }

    return null;
  } catch (error) {
    // Handle rate limit errors
    if (error instanceof Error && error.message.includes('rate limit')) {
      console.error(`   ⏳ Rate limit hit for ${sport}, waiting 60 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return null;
    }
    // Only log unexpected errors (not "no match" errors)
    if (error instanceof Error && !error.message.includes('Search field')) {
      console.error(`   ❌ API error for ${sport}:`, error.message);
    }
    return null;
  }
}

/**
 * WHAT: Enrich a single partner with API-Football data
 * WHY: Add official team data without overwriting existing enrichments
 * HOW: Try all configured sports, store first match
 */
async function enrichPartner(db: any, partner: any): Promise<boolean> {
  console.log(`\n📊 Processing: ${partner.name}`);
  console.log(`   Partner ID: ${partner._id}`);
  console.log(`   Created: ${new Date(partner.createdAt).toLocaleDateString()}`);

  // Check existing enrichment status
  if (partner.enrichedData?.apiFootball) {
    console.log(`   ⏭️  Already enriched (${partner.enrichedData.apiFootball.sport})`);
    return false;
  }

  // Try each sport until we find a match
  for (const sport of DAILY_CONFIG.sports) {
    console.log(`   🔍 Searching in ${sport}...`);

    const teamData = await searchPartnerInApiFootball(partner.name, sport);

    if (teamData && teamData.team) {
      const { team, venue } = teamData;
      console.log(`   ✅ Found: ${team.name} (ID: ${team.id})`);

      // Build enriched data object
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

      // Update partner with new enrichment data
      await db.collection('partners').updateOne(
        { _id: partner._id },
        {
          $set: {
            'enrichedData.apiFootball': apiFootballData,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      console.log(`   💾 Saved API-Football data`);
      
      if (DAILY_CONFIG.stopAfterFirstMatch) {
        console.log(`   ⏩ Stopping search (match found)`);
      }
      return true;
    }
  }

  console.log(`   ⚠️  No match found in any sport`);
  return false;
}

/**
 * WHAT: Main enrichment process
 * WHY: Daily batch job to incrementally enrich partners
 * HOW: Process oldest unenriched partners first
 */
async function main() {
  const client = new MongoClient(uri!);

  try {
    await client.connect();
    const db = client.db('messmass');

    console.log('\n🚀 Partner Daily Enrichment - API-Football\n');
    console.log('='.repeat(70) + '\n');
    console.log(`📅 Date: ${new Date().toISOString()}`);
    console.log(`🎯 Target: ${DAILY_CONFIG.maxPartnersPerDay} partners`);
    console.log(`🏅 Sports: ${DAILY_CONFIG.sports.join(', ')}\n`);

    // WHAT: Get partners needing enrichment (oldest first)
    // WHY: Ensures we process partners in creation order
    const partnersToEnrich = await db
      .collection('partners')
      .find({
        'enrichedData.apiFootball': { $exists: false },
      })
      .sort({ createdAt: 1 }) // Oldest first
      .limit(DAILY_CONFIG.maxPartnersPerDay)
      .toArray();

    if (partnersToEnrich.length === 0) {
      console.log('✅ All partners already enriched!\n');
      return;
    }

    console.log(`📋 Found ${partnersToEnrich.length} partners to process\n`);
    console.log('─'.repeat(70));

    let enriched = 0;
    let skipped = 0;
    let failed = 0;

    for (const partner of partnersToEnrich) {
      try {
        const success = await enrichPartner(db, partner);
        if (success) {
          enriched++;
        } else {
          skipped++;
        }

        // No additional delay needed (already in search function)
      } catch (error) {
        console.error(`   ❌ Error processing ${partner.name}:`, error);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 SUMMARY\n');
    console.log(`   ✅ Enriched: ${enriched}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📦 Total processed: ${partnersToEnrich.length}`);

    // Check remaining partners
    const remaining = await db.collection('partners').countDocuments({
      'enrichedData.apiFootball': { $exists: false },
    });

    console.log(`\n   📌 Remaining unenriched: ${remaining}`);
    if (remaining > 0) {
      const daysNeeded = Math.ceil(remaining / DAILY_CONFIG.maxPartnersPerDay);
      console.log(`   ⏱️  Estimated days to complete: ${daysNeeded}\n`);
    } else {
      console.log(`   🎉 All partners enriched!\n`);
    }

    console.log('💡 Next steps:');
    console.log('   1. Review enriched partners in admin UI');
    console.log('   2. Choose which data source to use (TheSportsDB vs API-Football)');
    console.log('   3. Run this script again tomorrow for next batch\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
