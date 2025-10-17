// scripts/enrich-partners-sportsdb.js
// WHAT: Bulk enrichment script to link existing partners with TheSportsDB data
// WHY: Automate the process of enriching partner database with sports club metadata
// USAGE: node scripts/enrich-partners-sportsdb.js [--dry-run] [--force] [--filter=name]
//
// URL-BASED ENRICHMENT:
// Partners with a `sportsDbUrl` field will be enriched using direct team ID lookup.
// This is more reliable than name search when the exact TheSportsDB URL is known.
// Example URL: https://www.thesportsdb.com/team/141401-eisbären-berlin
//
// To add sportsDbUrl to partners, update MongoDB manually:
//   db.partners.updateOne(
//     { name: "Eisbären Berlin" },
//     { $set: { sportsDbUrl: "https://www.thesportsdb.com/team/141401-eisbären-berlin" } }
//   )

// WHAT: Load environment variables from .env.local
// WHY: Allow script to run without manual env var setup
require('dotenv').config({ path: '.env.local' });

const { MongoClient, ObjectId } = require('mongodb');

// WHAT: Script configuration from environment
// WHY: Secure database access and API configuration
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'messmass';
const SPORTSDB_API_KEY = process.env.SPORTSDB_API_KEY || '3'; // Free tier key

// WHAT: Parse command-line arguments
// WHY: Support dry-run mode, force re-enrichment, and filtering
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const filterArg = args.find(arg => arg.startsWith('--filter='));
const filterName = filterArg ? filterArg.split('=')[1] : null;

// WHAT: API rate limiting configuration
// WHY: Respect TheSportsDB rate limits (avoid throttling)
const RATE_LIMIT_DELAY = 1000; // 1 second between API calls
const MAX_RETRIES = 3;

// WHAT: Confidence thresholds for auto-linking
// WHY: Ensure high-quality matches without manual review
const HIGH_CONFIDENCE_THRESHOLD = 0.9; // Auto-link if match score > 90%
const MEDIUM_CONFIDENCE_THRESHOLD = 0.7; // Log for manual review

/**
 * WHAT: Sleep utility for rate limiting
 * WHY: Prevent API throttling by spacing requests
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * WHAT: Calculate string similarity score (0-1)
 * WHY: Determine match confidence between partner name and team name
 * ALGORITHM: Levenshtein distance normalized to 0-1 scale
 */
function stringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  // WHAT: Handle common abbreviations and variations
  // WHY: "FC Barcelona" should match "Barcelona"
  const cleanStr = (str) => str
    .replace(/\b(fc|club|cf|cd|sc|united|utd)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const c1 = cleanStr(s1);
  const c2 = cleanStr(s2);
  
  if (c1 === c2) return 0.95;
  
  // WHAT: Levenshtein distance calculation
  // WHY: Measure edit distance between strings
  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  const distance = matrix[s2.length][s1.length];
  return 1 - (distance / maxLength);
}

/**
 * WHAT: Search TheSportsDB for teams by name
 * WHY: Find matching sports clubs for partner enrichment
 */
async function searchSportsDbTeams(query) {
  const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(query)}`;
  
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      return data.teams || [];
    } catch (error) {
      retries++;
      console.error(`  ⚠️  API error (attempt ${retries}/${MAX_RETRIES}):`, error.message);
      if (retries < MAX_RETRIES) {
        await sleep(RATE_LIMIT_DELAY * retries); // Exponential backoff
      }
    }
  }
  return [];
}

/**
 * WHAT: Lookup full team details by ID
 * WHY: Fetch complete metadata for enrichment
 */
async function lookupTeamById(teamId) {
  const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/lookupteam.php?id=${teamId}`;
  
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      return data.teams?.[0] || null;
    } catch (error) {
      retries++;
      console.error(`  ⚠️  Lookup error (attempt ${retries}/${MAX_RETRIES}):`, error.message);
      if (retries < MAX_RETRIES) {
        await sleep(RATE_LIMIT_DELAY * retries);
      }
    }
  }
  return null;
}

/**
 * WHAT: Build SportsDB enrichment object from team data
 * WHY: Standardize format for MongoDB storage
 */
function buildSportsDbData(team) {
  return {
    teamId: team.idTeam,
    leagueId: team.idLeague,
    venueId: team.idVenue,
    venueCapacity: team.intStadiumCapacity ? parseInt(team.intStadiumCapacity, 10) : undefined,
    venueName: team.strStadium,
    leagueName: team.strLeague,
    founded: team.intFormedYear,
    country: team.strCountry,
    website: team.strWebsite,
    badge: team.strBadge,
    lastSynced: new Date().toISOString(),
  };
}

/**
 * WHAT: Extract team ID from TheSportsDB URL
 * WHY: Support direct URL-based enrichment when search fails
 * RETURNS: Team ID string or null if URL is invalid
 */
function extractTeamIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  const urlMatch = url.match(/thesportsdb\.com\/team\/(\d+)/i);
  return urlMatch ? urlMatch[1] : null;
}

/**
 * WHAT: Enrich partner using direct TheSportsDB URL
 * WHY: Fallback when name-based search fails or returns wrong results
 * PARAMS: partner - partner document, partnersCollection - MongoDB collection
 * RETURNS: Object with success status and enrichment data
 */
async function enrichPartnerByUrl(partner, partnersCollection, isDryRun) {
  const result = {
    success: false,
    action: null, // 'enriched', 'validation_error', 'extraction_error', 'api_error'
    data: null,
  };
  
  // WHAT: Check if partner has sportsDbUrl field
  if (!partner.sportsDbUrl) {
    return result;
  }
  
  console.log(`  🔗 Found TheSportsDB URL: ${partner.sportsDbUrl}`);
  
  // WHAT: Extract team ID from URL
  const teamId = extractTeamIdFromUrl(partner.sportsDbUrl);
  
  if (!teamId) {
    console.log(`  ❌ Failed to extract team ID from URL`);
    result.action = 'extraction_error';
    return result;
  }
  
  console.log(`  🔍 Extracted team ID: ${teamId}`);
  
  // WHAT: Fetch team details by ID
  await sleep(RATE_LIMIT_DELAY);
  const team = await lookupTeamById(teamId);
  
  if (!team) {
    console.log(`  ❌ Failed to fetch team details from API`);
    result.action = 'api_error';
    return result;
  }
  
  // WHAT: Validate API response matches extracted team ID
  // WHY: TheSportsDB API sometimes returns wrong team
  if (team.idTeam !== teamId) {
    console.log(`  ❌ Validation failed: expected team ID ${teamId}, got ${team.idTeam}`);
    result.action = 'validation_error';
    return result;
  }
  
  console.log(`  ✅ Team data validated: ${team.strTeam}`);
  
  // WHAT: Build enrichment data
  const sportsDbData = buildSportsDbData(team);
  
  // WHAT: Display enrichment data
  console.log(`  📊 League: ${sportsDbData.leagueName || 'N/A'}`);
  console.log(`  🏟️  Venue: ${sportsDbData.venueName || 'N/A'} (${sportsDbData.venueCapacity?.toLocaleString() || 'N/A'} capacity)`);
  
  // WHAT: Update partner in database (unless dry-run)
  if (!isDryRun) {
    await partnersCollection.updateOne(
      { _id: partner._id },
      { 
        $set: { 
          sportsDb: sportsDbData,
          updatedAt: new Date().toISOString(),
        } 
      }
    );
    console.log(`  💾 Saved to database`);
  } else {
    console.log(`  🧪 DRY RUN - would save to database`);
  }
  
  result.success = true;
  result.action = 'enriched';
  result.data = sportsDbData;
  return result;
}

/**
 * WHAT: Main enrichment logic
 * WHY: Process all partners and link them to TheSportsDB
 */
async function enrichPartners() {
  // WHAT: Validate environment configuration
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }
  
  console.log('🚀 MessMass Partner Enrichment Script');
  console.log('=====================================\n');
  console.log(`Mode: ${isDryRun ? '🧪 DRY RUN (no changes)' : '💾 LIVE (will update database)'}`);
  console.log(`Force re-enrichment: ${isForce ? 'YES' : 'NO'}`);
  if (filterName) {
    console.log(`Filter: Only partners matching "${filterName}"`);
  }
  console.log('');
  
  // WHAT: Connect to MongoDB
  // WHY: Access partners collection for bulk operations
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(MONGODB_DB);
    const partnersCollection = db.collection('partners');
    
    // WHAT: Build query filter
    // WHY: Support filtering and force modes
    const query = {};
    if (!isForce) {
      // WHAT: Skip partners that already have SportsDB data
      // WHY: Avoid unnecessary API calls unless --force flag is used
      query.sportsDb = { $exists: false };
    }
    if (filterName) {
      query.name = { $regex: filterName, $options: 'i' };
    }
    
    const partners = await partnersCollection.find(query).toArray();
    
    console.log(`📋 Found ${partners.length} partners to process\n`);
    
    if (partners.length === 0) {
      console.log('✅ No partners need enrichment');
      return;
    }
    
    // WHAT: Statistics tracking
    // WHY: Provide summary of enrichment results
    const stats = {
      total: partners.length,
      enriched: 0,
      urlEnriched: 0,
      searchEnriched: 0,
      skipped: 0,
      noMatch: 0,
      manualReview: 0,
      errors: 0,
      urlValidationErrors: 0,
      urlExtractionErrors: 0,
    };
    
    const manualReviewList = [];
    
    // WHAT: Process each partner sequentially
    // WHY: Respect API rate limits and provide progress feedback
    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i];
      console.log(`[${i + 1}/${partners.length}] Processing: ${partner.emoji} ${partner.name}`);
      
      // WHAT: Check if already enriched (force mode)
      if (partner.sportsDb && !isForce) {
        console.log(`  ⏭️  Already has SportsDB data (use --force to re-enrich)`);
        stats.skipped++;
        continue;
      }
      
      // WHAT: Try URL-based enrichment first if sportsDbUrl field exists
      // WHY: Direct URL lookup is more reliable than name search
      if (partner.sportsDbUrl) {
        const urlResult = await enrichPartnerByUrl(partner, partnersCollection, isDryRun);
        
        if (urlResult.success) {
          stats.enriched++;
          stats.urlEnriched++;
          console.log('');
          continue;
        } else if (urlResult.action === 'validation_error') {
          stats.urlValidationErrors++;
        } else if (urlResult.action === 'extraction_error') {
          stats.urlExtractionErrors++;
        } else if (urlResult.action === 'api_error') {
          stats.errors++;
        }
        
        console.log(`  ⚠️  URL-based enrichment failed, falling back to name search...`);
      }
      
      // WHAT: Search TheSportsDB by partner name
      // WHY: Find potential matching teams
      await sleep(RATE_LIMIT_DELAY); // Rate limiting
      const searchResults = await searchSportsDbTeams(partner.name);
      
      if (searchResults.length === 0) {
        console.log(`  ❌ No matches found on TheSportsDB`);
        stats.noMatch++;
        continue;
      }
      
      console.log(`  🔍 Found ${searchResults.length} potential matches`);
      
      // WHAT: Calculate similarity scores for all results
      // WHY: Determine best match with confidence score
      const matches = searchResults.map(team => ({
        team,
        score: stringSimilarity(partner.name, team.strTeam),
      }));
      
      // WHAT: Sort by confidence score (highest first)
      matches.sort((a, b) => b.score - a.score);
      
      const bestMatch = matches[0];
      console.log(`  🎯 Best match: ${bestMatch.team.strTeam} (${(bestMatch.score * 100).toFixed(1)}% confidence)`);
      
      // WHAT: Auto-link high-confidence matches
      // WHY: Reduce manual review workload for obvious matches
      if (bestMatch.score >= HIGH_CONFIDENCE_THRESHOLD) {
        console.log(`  ✅ High confidence - auto-linking`);
        
        // WHAT: Fetch full team details
        await sleep(RATE_LIMIT_DELAY);
        const teamDetails = await lookupTeamById(bestMatch.team.idTeam);
        
        if (!teamDetails) {
          console.log(`  ⚠️  Failed to fetch team details`);
          stats.errors++;
          continue;
        }
        
        const sportsDbData = buildSportsDbData(teamDetails);
        
        // WHAT: Display enrichment data
        console.log(`  📊 League: ${sportsDbData.leagueName || 'N/A'}`);
        console.log(`  🏟️  Venue: ${sportsDbData.venueName || 'N/A'} (${sportsDbData.venueCapacity?.toLocaleString() || 'N/A'} capacity)`);
        
        // WHAT: Update partner in database (unless dry-run)
        if (!isDryRun) {
          await partnersCollection.updateOne(
            { _id: partner._id },
            { 
              $set: { 
                sportsDb: sportsDbData,
                updatedAt: new Date().toISOString(),
              } 
            }
          );
          console.log(`  💾 Saved to database`);
        } else {
          console.log(`  🧪 DRY RUN - would save to database`);
        }
        
        stats.enriched++;
        stats.searchEnriched++;
      } else if (bestMatch.score >= MEDIUM_CONFIDENCE_THRESHOLD) {
        // WHAT: Log medium-confidence matches for manual review
        // WHY: Prevent false positives while flagging likely matches
        console.log(`  ⚠️  Medium confidence - requires manual review`);
        manualReviewList.push({
          partner: partner.name,
          suggestions: matches.slice(0, 3).map(m => ({
            name: m.team.strTeam,
            league: m.team.strLeague,
            confidence: (m.score * 100).toFixed(1),
          })),
        });
        stats.manualReview++;
      } else {
        // WHAT: Skip low-confidence matches
        // WHY: Avoid incorrect linking
        console.log(`  ❌ Low confidence - skipping`);
        stats.noMatch++;
      }
      
      console.log('');
    }
    
    // WHAT: Print summary statistics
    // WHY: Provide clear overview of enrichment results
    console.log('\n📊 Enrichment Summary');
    console.log('====================');
    console.log(`Total partners processed: ${stats.total}`);
    console.log(`✅ Successfully enriched: ${stats.enriched}`);
    console.log(`   🔗 URL-based: ${stats.urlEnriched}`);
    console.log(`   🔍 Search-based: ${stats.searchEnriched}`);
    console.log(`⏭️  Skipped (already enriched): ${stats.skipped}`);
    console.log(`❌ No matches found: ${stats.noMatch}`);
    console.log(`⚠️  Requires manual review: ${stats.manualReview}`);
    console.log(`🔴 Errors: ${stats.errors}`);
    if (stats.urlValidationErrors > 0) {
      console.log(`   ⚠️  URL validation errors: ${stats.urlValidationErrors}`);
    }
    if (stats.urlExtractionErrors > 0) {
      console.log(`   ⚠️  URL extraction errors: ${stats.urlExtractionErrors}`);
    }
    
    // WHAT: Print manual review list
    // WHY: Help admin complete remaining enrichments
    if (manualReviewList.length > 0) {
      console.log('\n\n⚠️  Partners Requiring Manual Review');
      console.log('===================================');
      manualReviewList.forEach(item => {
        console.log(`\n🤝 ${item.partner}`);
        console.log('   Suggested matches:');
        item.suggestions.forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.name} (${s.league}) - ${s.confidence}% match`);
        });
      });
      console.log('\n💡 Use the Admin UI to manually link these partners.');
    }
    
    console.log('\n✅ Enrichment complete!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// WHAT: Script entry point
// WHY: Run enrichment when script is executed
enrichPartners();
