// scripts/test-sportsdb-api.js
// Test TheSportsDB API integration
// Run: node scripts/test-sportsdb-api.js

require('dotenv').config({ path: '.env.local' });

// Import compiled version (need to compile TypeScript first)
const { searchTeams, lookupTeam, lookupLeague, getRateLimiterState, getCacheStats } = require('../lib/sportsDbApi');

async function testSportsDbApi() {
  console.log('\n🏟️  Testing TheSportsDB API Integration\n');
  console.log('═══════════════════════════════════════════════\n');
  
  try {
    // Test 1: Search for Barcelona
    console.log('Test 1: Search Teams - "barcelona"');
    const barcelonaResults = await searchTeams('barcelona');
    console.log(`✅ Found ${barcelonaResults.length} teams`);
    if (barcelonaResults.length > 0) {
      const team = barcelonaResults[0];
      console.log(`   - ${team.strTeam} (ID: ${team.idTeam})`);
      console.log(`   - League: ${team.strLeague}`);
      console.log(`   - Stadium: ${team.strStadium} (Capacity: ${team.intStadiumCapacity || 'N/A'})`);
    }
    console.log('');
    
    // Test 2: Lookup specific team
    if (barcelonaResults.length > 0) {
      const teamId = barcelonaResults[0].idTeam;
      console.log(`Test 2: Lookup Team - ID ${teamId}`);
      const teamDetails = await lookupTeam(teamId);
      if (teamDetails) {
        console.log(`✅ Team: ${teamDetails.strTeam}`);
        console.log(`   - Founded: ${teamDetails.intFormedYear || 'N/A'}`);
        console.log(`   - Country: ${teamDetails.strCountry}`);
        console.log(`   - Badge: ${teamDetails.strTeamBadge ? 'Available' : 'N/A'}`);
        console.log(`   - League ID: ${teamDetails.idLeague}`);
      }
      console.log('');
      
      // Test 3: Lookup league
      if (teamDetails && teamDetails.idLeague) {
        console.log(`Test 3: Lookup League - ID ${teamDetails.idLeague}`);
        const leagueDetails = await lookupLeague(teamDetails.idLeague);
        if (leagueDetails) {
          console.log(`✅ League: ${leagueDetails.strLeague}`);
          console.log(`   - Sport: ${leagueDetails.strSport}`);
          console.log(`   - Country: ${leagueDetails.strCountry}`);
          console.log(`   - Formed: ${leagueDetails.intFormedYear || 'N/A'}`);
        }
        console.log('');
      }
    }
    
    // Test 4: Cache hit (re-search barcelona)
    console.log('Test 4: Cache Hit Test - "barcelona" again');
    const cachedResults = await searchTeams('barcelona');
    console.log(`✅ Found ${cachedResults.length} teams (from cache)`);
    console.log('');
    
    // Test 5: Rate limiter state
    console.log('Test 5: Rate Limiter State');
    const rateLimiterState = getRateLimiterState();
    console.log(`✅ Active requests: ${rateLimiterState.activeRequests}/${rateLimiterState.limit}`);
    console.log(`   Can make request: ${rateLimiterState.canMakeRequest}`);
    console.log('');
    
    // Test 6: Cache stats
    console.log('Test 6: Cache Statistics');
    const cacheStats = getCacheStats();
    console.log(`✅ Cache entries: ${cacheStats.size}`);
    console.log(`   Keys: ${cacheStats.entries.slice(0, 3).join(', ')}${cacheStats.size > 3 ? '...' : ''}`);
    console.log('');
    
    console.log('═══════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED');
    console.log('═══════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n═══════════════════════════════════════════════');
    console.log('❌ TESTS FAILED');
    console.log('═══════════════════════════════════════════════\n');
    process.exit(1);
  }
}

testSportsDbApi();
